"""``testim_parity.pipeline.fetch_translate_images`` の unit tests (Phase 4b M4)。

conformance test (mjs output との byte 比較) は M5 で integration 層に追加する。
このモジュールでは pure-Python path を cover する:

- sidebar parsing: 全角 delimiter / status filter
- hash compute + diff: snapshot 変化検出 + state 書き戻し
- download_asset: filename hash truncation / skip-if-exists / DI fetch / curl fallback
- rewrite_and_download_media: absolute + MadCap relative + ``<Image src=>`` replace
- rewrite_doc_links: 4 stage link rewrite
- extract_title / build_frontmatter
- process_one end-to-end (tmp docs tree)
- main dispatch + unknown slug error
"""

from __future__ import annotations

import datetime
import io
import json
from pathlib import Path
from typing import Any

import pytest

from testim_parity.pipeline import fetch_translate_images as fti
from testim_parity.project import reset_project_caches_for_test

_SIDEBAR_TEXT = (
    "## Overview（概要）\n"
    "- ✅ https://docs.tricentis.com/testim/content/overview/intro.htm\n"
    "- ⏳ https://docs.tricentis.com/testim/content/overview/roadmap.htm\n"
    "\n"
    "## Guides\n"
    "- ✅🔍 https://docs.tricentis.com/testim/content/guides/setup.htm\n"
    "- ⏳ https://docs.tricentis.com/testim/content/guides/usage.htm\n"
)


# ---------------------------------------------------------------------------
# Sidebar parsing
# ---------------------------------------------------------------------------


def test_parse_sidebar_list_filters_and_preserves_full_width_delimiter() -> None:
    rows = fti.get_all_pages_list(_SIDEBAR_TEXT)
    assert len(rows) == 4
    overview = [r for r in rows if r["categoryEnglish"] == "Overview"]
    assert len(overview) == 2
    assert overview[0]["categoryJapanese"] == "概要"
    assert overview[0]["slug"] == "overview/intro"
    assert overview[0]["order"] == 1
    assert overview[1]["order"] == 2
    # 全角なし heading は english=japanese に fallback (mjs 等価)。
    guides = [r for r in rows if r["categoryEnglish"] == "Guides"]
    assert guides[0]["categoryJapanese"] == "Guides"


def test_get_untranslated_list_only_keeps_pending() -> None:
    rows = fti.get_untranslated_list(_SIDEBAR_TEXT)
    assert {r["slug"] for r in rows} == {"overview/roadmap", "guides/usage"}
    # order は section ごとにリセットされる (mjs の counter 増分 + filter_fn skip 後の
    # order を保持)。
    roadmap = next(r for r in rows if r["slug"] == "overview/roadmap")
    assert roadmap["order"] == 2


# ---------------------------------------------------------------------------
# Hash + diff detection
# ---------------------------------------------------------------------------


def test_compute_hash_is_sha256_hex() -> None:
    assert fti.compute_hash("abc") == (
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    )


def test_get_diff_pages_list_treats_missing_snapshot_as_changed(tmp_path: Path) -> None:
    hashes_path = tmp_path / "state.json"
    content_dir = tmp_path / "snapshots"
    content_dir.mkdir()
    # overview/intro だけ snapshot 用意、他は missing → changed 扱い
    (content_dir / "overview").mkdir()
    (content_dir / "overview" / "intro.html").write_text("hello", encoding="utf-8")

    warnings: list[str] = []
    changed = fti.get_diff_pages_list(
        _SIDEBAR_TEXT,
        hashes_path,
        snapshots_content_dir=content_dir,
        logger=warnings.append,
        now=datetime.datetime(2026, 4, 22, 12, 0, tzinfo=datetime.UTC),
    )
    # intro は snapshot あり + 前 hash なし → changed、他 3 つは snapshot 無しで changed
    assert len(changed) == 4
    assert any("no snapshot for" in msg for msg in warnings)

    # state file が書き出されている
    state = json.loads(hashes_path.read_text(encoding="utf-8"))
    assert "overview/intro" in state
    assert state["overview/intro"]["hash"] == fti.compute_hash("hello")
    assert state["overview/intro"]["checkedAt"].endswith("Z")


def test_get_diff_pages_list_no_change_when_hash_matches(tmp_path: Path) -> None:
    hashes_path = tmp_path / "state.json"
    content_dir = tmp_path / "snapshots"
    content_dir.mkdir()
    (content_dir / "overview").mkdir()
    (content_dir / "guides").mkdir()
    (content_dir / "overview" / "intro.html").write_text("a", encoding="utf-8")
    (content_dir / "overview" / "roadmap.html").write_text("b", encoding="utf-8")
    (content_dir / "guides" / "setup.html").write_text("c", encoding="utf-8")
    (content_dir / "guides" / "usage.html").write_text("d", encoding="utf-8")

    prev = {
        "overview/intro": {"hash": fti.compute_hash("a"), "sourceUrl": "x", "checkedAt": "old"},
        "overview/roadmap": {
            "hash": fti.compute_hash("b"),
            "sourceUrl": "x",
            "checkedAt": "old",
        },
        # guides/setup / guides/usage はまだ記録が無い → changed
    }
    hashes_path.write_text(json.dumps(prev), encoding="utf-8")

    changed = fti.get_diff_pages_list(
        _SIDEBAR_TEXT,
        hashes_path,
        snapshots_content_dir=content_dir,
        now=datetime.datetime(2026, 4, 22, 12, 0, tzinfo=datetime.UTC),
    )
    slugs = {c["slug"] for c in changed}
    assert slugs == {"guides/setup", "guides/usage"}


# ---------------------------------------------------------------------------
# parse_mode / CLI helpers
# ---------------------------------------------------------------------------


def test_parse_mode_returns_value_or_none() -> None:
    assert fti.parse_mode(["--mode=full", "--other"]) == "full"
    assert fti.parse_mode(["--mode=diff"]) == "diff"
    assert fti.parse_mode(["--unrelated"]) is None


# ---------------------------------------------------------------------------
# download_asset
# ---------------------------------------------------------------------------


def test_download_asset_writes_file_and_truncates_hash_prefix(tmp_path: Path) -> None:
    fetches: list[str] = []

    def fake_fetch(url: str) -> bytes:
        fetches.append(url)
        return b"PAYLOAD"

    long_name = (
        "abc1234" + "0" * 50 + "-diagram.png"
    )  # 7 hex + 50 hex → truncate → "abc1234-diagram.png"
    url = f"https://files.readme.io/{long_name}"
    result = fti.download_asset(
        url,
        tmp_path,
        fetch_fn=fake_fetch,
        sleep_fn=lambda _s: None,
    )
    assert result["name"] == "abc1234-diagram.png"
    assert Path(result["path"]).read_bytes() == b"PAYLOAD"
    assert fetches == [url]


def test_download_asset_skips_if_exists(tmp_path: Path) -> None:
    existing = tmp_path / "keep.png"
    existing.write_bytes(b"original")
    url = "https://files.readme.io/keep.png"

    def boom(_url: str) -> bytes:
        raise AssertionError("fetch_fn must not be called when dest exists")

    result = fti.download_asset(
        url,
        tmp_path,
        fetch_fn=boom,
        sleep_fn=lambda _s: None,
    )
    assert result["name"] == "keep.png"
    assert existing.read_bytes() == b"original"


def test_download_asset_falls_back_to_curl_on_fetch_error(tmp_path: Path) -> None:
    def bad_fetch(_url: str) -> bytes:
        raise RuntimeError("boom")

    curl_calls: list[tuple[str, Path]] = []

    def fake_curl(url: str, dest: Path) -> None:
        curl_calls.append((url, dest))
        dest.write_bytes(b"via-curl")

    warnings: list[str] = []
    url = "https://files.readme.io/foo.png"
    result = fti.download_asset(
        url,
        tmp_path,
        fetch_fn=bad_fetch,
        sleep_fn=lambda _s: None,
        curl_fn=fake_curl,
        logger=warnings.append,
    )
    assert curl_calls == [(url, tmp_path / "foo.png")]
    assert Path(result["path"]).read_bytes() == b"via-curl"
    assert any("falling back to curl" in msg for msg in warnings)


# ---------------------------------------------------------------------------
# rewrite_and_download_media
# ---------------------------------------------------------------------------


def test_rewrite_and_download_media_rewrites_absolute_and_relative(tmp_path: Path) -> None:
    md = (
        "intro\n\n"
        "![a](https://files.readme.io/alpha.png)\n"
        "![b](images/beta.gif)\n"
        '<Image src="images/gamma.png"/>\n'
    )
    downloaded: list[tuple[str, Path]] = []

    def fake_download(url: str, dest_dir: Path) -> fti.DownloadResult:
        name = Path(url).name
        dest_dir.mkdir(parents=True, exist_ok=True)
        (dest_dir / name).write_bytes(b"x")
        downloaded.append((url, dest_dir))
        return fti.DownloadResult(name=name, path=str(dest_dir / name))

    out = fti.rewrite_and_download_media(
        md,
        "guides",
        "setup",
        "https://docs.tricentis.com/testim/content/guides/setup.htm",
        public_images_dir=tmp_path,
        download_fn=fake_download,
    )
    # absolute URL (readme.io) → public local path
    assert "![a](/images/guides/setup/alpha.png)" in out
    # relative markdown image path was resolved via MadCap base + rewritten
    assert "![b](/images/guides/setup/beta.gif)" in out
    # ``<Image src="images/gamma.png"/>`` の src ``images/gamma.png`` は
    # ``relativeImgRegex`` にマッチするため、``<Image>`` タグが replace される
    # *前* に src 文字列が ``/images/guides/setup/gamma.png`` へ substitute
    # される。その後 ``<Image>`` 専用 regex が ``![](src)`` に置き換えるため、
    # 最終出力は必ず rewritten path を使った markdown image になる (mjs と同一)。
    assert "![](/images/guides/setup/gamma.png)" in out
    # 3 件 (readme.io absolute + MadCap-relative beta + MadCap-relative gamma)
    # が全て download される。gamma は ``<Image src="images/gamma.png"/>`` の src が
    # ``relativeImgRegex`` に先に hit するため download 対象に含まれる。
    assert len(downloaded) == 3
    downloaded_urls = {url for url, _ in downloaded}
    assert "https://files.readme.io/alpha.png" in downloaded_urls
    assert "https://docs.tricentis.com/testim/content/guides/images/beta.gif" in downloaded_urls
    assert "https://docs.tricentis.com/testim/content/guides/images/gamma.png" in downloaded_urls


def test_rewrite_and_download_media_logs_on_failure(tmp_path: Path) -> None:
    def failing(url: str, _dest: Path) -> fti.DownloadResult:
        raise RuntimeError(f"nope: {url}")

    warnings: list[str] = []
    md = "![x](https://files.readme.io/alpha.png)"
    out = fti.rewrite_and_download_media(
        md,
        "guides",
        "setup",
        "https://docs.tricentis.com/testim/content/guides/setup.htm",
        public_images_dir=tmp_path,
        download_fn=failing,
        logger=warnings.append,
    )
    # failure 時は original URL が残る (mjs と同じ)
    assert "https://files.readme.io/alpha.png" in out
    assert any("Failed to download" in msg for msg in warnings)


# ---------------------------------------------------------------------------
# rewrite_doc_links
# ---------------------------------------------------------------------------


def test_rewrite_doc_links_stage1_markdown_doc_link() -> None:
    reset_project_caches_for_test()
    md = "see [link](doc:my-slug#frag)"
    result = fti.rewrite_doc_links(md)
    # my-slug は repo 内に存在しないが resolve_to_path_slug が original を返す
    assert result == "see [link](/docs/my-slug#frag)"


def test_rewrite_doc_links_stage4_html_relative_htm_link() -> None:
    reset_project_caches_for_test()
    md = '<a class="x" href="../foo/bar.htm#anchor">go</a>'
    result = fti.rewrite_doc_links(md)
    assert 'href="/docs/foo/bar#anchor"' in result


def test_rewrite_doc_links_leaves_external_urls_alone() -> None:
    md = '<a href="https://example.com/page.htm">x</a>'
    result = fti.rewrite_doc_links(md)
    assert result == md


# ---------------------------------------------------------------------------
# extract_title
# ---------------------------------------------------------------------------


def test_extract_title_returns_first_h1() -> None:
    assert fti.extract_title("# Hello World\n\ntext") == "Hello World"
    # fallback (no H1) → empty string
    assert fti.extract_title("no heading here") == ""


# ---------------------------------------------------------------------------
# process_one
# ---------------------------------------------------------------------------


def test_process_one_writes_frontmatter_and_body(tmp_path: Path) -> None:
    # 既存 doc (placeholder) を tmp_path に配置
    docs_dir = tmp_path / "docs" / "overview"
    docs_dir.mkdir(parents=True)
    existing = docs_dir / "intro.md"
    existing.write_text(
        "---\n"
        "title: '既存タイトル'\n"
        "description: '既存説明'\n"
        "updated: '2025-01-01'\n"
        "---\n\n"
        "old body\n",
        encoding="utf-8",
    )

    snapshots = tmp_path / "snapshots" / "en" / "content"
    snapshots.mkdir(parents=True)
    (snapshots / "overview").mkdir()
    (snapshots / "overview" / "intro.html").write_text(
        "<h1>New Page</h1><p>body text</p>", encoding="utf-8"
    )

    slug_index = {"overview/intro": {"categoryFolder": "overview", "filePath": str(existing)}}
    item = fti.SidebarItem(
        categoryEnglish="Overview",
        categoryJapanese="概要",
        url="https://docs.tricentis.com/testim/content/overview/intro.htm",
        slug="overview/intro",
        order=1,
    )

    stdout = io.StringIO()
    ok = fti.process_one(
        item,
        slug_index,
        snapshots_content_dir=snapshots,
        public_images_dir=tmp_path / "images",
        # no images in HTML → download_fn won't fire
        stdout=stdout,
        now=datetime.datetime(2026, 4, 22, tzinfo=datetime.UTC),
    )
    assert ok is True

    written = existing.read_text(encoding="utf-8")
    assert written.startswith("---\n")
    # 既存の ``title`` / ``description`` / ``updated`` は保持
    assert "title: 既存タイトル" in written or "title: '既存タイトル'" in written
    assert "description: 既存説明" in written or "description: '既存説明'" in written
    assert "updated: '2025-01-01'" in written or "updated: 2025-01-01" in written
    # new body (H1 は body から除去されているはず)
    assert "# New Page" not in written
    assert "body text" in written
    assert "✓ Wrote" in stdout.getvalue()


def test_process_one_skips_on_404_marker(tmp_path: Path) -> None:
    docs_dir = tmp_path / "docs" / "overview"
    docs_dir.mkdir(parents=True)
    existing = docs_dir / "intro.md"
    existing.write_text("---\ntitle: 't'\n---\n\nold\n", encoding="utf-8")

    snapshots = tmp_path / "snapshots" / "en" / "content"
    snapshots.mkdir(parents=True)
    (snapshots / "overview").mkdir()
    (snapshots / "overview" / "intro.html").write_text(
        "<!-- 404: page not found -->\n", encoding="utf-8"
    )

    warnings: list[str] = []
    ok = fti.process_one(
        fti.SidebarItem(
            categoryEnglish="Overview",
            categoryJapanese="概要",
            url="https://x/y.htm",
            slug="overview/intro",
            order=1,
        ),
        {"overview/intro": {"categoryFolder": "overview", "filePath": str(existing)}},
        snapshots_content_dir=snapshots,
        public_images_dir=tmp_path / "images",
        logger=warnings.append,
        stdout=io.StringIO(),
    )
    assert ok is False
    assert any("404 marker" in msg for msg in warnings)
    # file は上書きされていない
    assert existing.read_text(encoding="utf-8") == "---\ntitle: 't'\n---\n\nold\n"


def test_process_one_skips_when_no_snapshot(tmp_path: Path) -> None:
    docs_dir = tmp_path / "docs" / "overview"
    docs_dir.mkdir(parents=True)
    existing = docs_dir / "intro.md"
    existing.write_text("---\ntitle: 't'\n---\n\nold\n", encoding="utf-8")

    snapshots = tmp_path / "snapshots" / "en" / "content"
    snapshots.mkdir(parents=True)  # no intro.html

    warnings: list[str] = []
    ok = fti.process_one(
        fti.SidebarItem(
            categoryEnglish="Overview",
            categoryJapanese="概要",
            url="https://x/y.htm",
            slug="overview/intro",
            order=1,
        ),
        {"overview/intro": {"categoryFolder": "overview", "filePath": str(existing)}},
        snapshots_content_dir=snapshots,
        public_images_dir=tmp_path / "images",
        logger=warnings.append,
        stdout=io.StringIO(),
    )
    assert ok is False
    assert any("no HTML snapshot" in msg for msg in warnings)


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def test_main_unknown_slug_returns_1(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    # sidebar path が存在しなくても --slug error が先に出る
    exit_code = fti.main(
        ["--slug=does-not-exist-xyz-zzz"],
        sidebar_file=tmp_path / "SIDEBAR_URLS.md",
    )
    assert exit_code == 1
    captured = capsys.readouterr()
    assert "Unknown slug" in captured.err


def test_main_missing_sidebar_returns_1(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    exit_code = fti.main(
        [],
        sidebar_file=tmp_path / "no-such-sidebar.md",
    )
    assert exit_code == 1
    captured = capsys.readouterr()
    assert "Missing file" in captured.err


def test_main_dispatch_full_mode_uses_all_pages(tmp_path: Path) -> None:
    sidebar = tmp_path / "SIDEBAR_URLS.md"
    sidebar.write_text(_SIDEBAR_TEXT, encoding="utf-8")

    # 空の snapshot dir → process_one は全て skip、done=0
    snapshots = tmp_path / "snapshots" / "en" / "content"
    snapshots.mkdir(parents=True)

    stdout = io.StringIO()
    # slug_index を空 dict にして「No local path for slug」path に流す。
    exit_code = fti.main(
        ["--mode=full"],
        sidebar_file=sidebar,
        snapshots_content_dir=snapshots,
        public_images_dir=tmp_path / "images",
        slug_index={},  # 全 slug 未知扱い
        sleep_fn=lambda _s: None,
        stdout=stdout,
        logger=lambda _msg: None,
    )
    assert exit_code == 0
    assert "Done. Processed 0 file(s)." in stdout.getvalue()


def test_main_dispatch_diff_mode_writes_hash_state(tmp_path: Path) -> None:
    sidebar = tmp_path / "SIDEBAR_URLS.md"
    sidebar.write_text(_SIDEBAR_TEXT, encoding="utf-8")
    snapshots = tmp_path / "snapshots" / "en" / "content"
    snapshots.mkdir(parents=True)
    (snapshots / "overview").mkdir()
    (snapshots / "overview" / "intro.html").write_text("hello", encoding="utf-8")

    state_path = tmp_path / ".cache" / "state.json"

    exit_code = fti.main(
        ["--mode=diff"],
        sidebar_file=sidebar,
        hashes_path=state_path,
        snapshots_content_dir=snapshots,
        public_images_dir=tmp_path / "images",
        slug_index={},
        sleep_fn=lambda _s: None,
        stdout=io.StringIO(),
        logger=lambda _msg: None,
        now=datetime.datetime(2026, 4, 22, tzinfo=datetime.UTC),
    )
    assert exit_code == 0
    # diff mode は state file を書き出す
    assert state_path.exists()
    state: dict[str, Any] = json.loads(state_path.read_text(encoding="utf-8"))
    assert "overview/intro" in state
