"""``scripts/pipeline/fetch_translate_images.mjs`` の Python full port (Phase 4b M4)。

``SIDEBAR_URLS.md`` を参照して各ページの HTML snapshot を Markdown へ変換し、
image / asset を ``public/images/<folder>/<slug>/`` に download した上で
既存 doc file に frontmatter + body を書き戻す。

**Byte-parity contract** (mjs ``fetch_translate_images.mjs`` と同じ JSON /
stdout 出力を維持するための要点):

- ``turndown`` 変換は ``testim_parity.turndown.html_to_md`` に delegate
  (mjs ``turndown.turndown(content)`` 等価)。``preprocess_en_html`` は通さ
  ない — mjs と同じく snapshot に対して直接 turndown を当てる。
- image download の filename は ``^[a-fA-F0-9]{7}[a-fA-F0-9]{50,}(-.*)``
  パターンにマッチしたら先頭 7 文字 + suffix に truncate する
  (readme.io の CDN URL の長大 hash を安定 prefix へ正規化)。
- ``<Image src="..."/>`` は ``![](src)`` に置換する (mjs と同じ last-stage
  transform)。
- MadCap 相対 path ``images/foo.png`` は ``sourceUrl`` の親ディレクトリを
  base として absolute URL に resolve してから fetch する。
- frontmatter は既存 file の値を優先し、欠けているものだけ fallback で
  埋める (``description`` は ``原文:`` prefix を認めず再生成、``updated``
  は **既存値があればそれを維持** する — feedback_updated_field のとおり、
  編集日に更新しない)。
- HTTP fetch は ``httpx`` (default) + redirect follow + User-Agent
  ``"Mozilla/5.0 (Automation)"``。失敗時は ``curl`` fallback する。

Usage::

    python -m testim_parity.pipeline.fetch_translate_images
    python -m testim_parity.pipeline.fetch_translate_images --mode=full
    python -m testim_parity.pipeline.fetch_translate_images --slug=overview/testim-overview
    python -m testim_parity.pipeline.fetch_translate_images --limit=3 --section=Overview
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import subprocess  # noqa: S404 — curl fallback で利用
import sys
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any, TypedDict
from urllib.parse import urlparse

import frontmatter
import httpx

from ..madcap_toc import extract_slug
from ..markdown_utils import generate_description
from ..project import (
    ROOT_DIR,
    build_basename_to_path_map,
    build_slug_index,
    resolve_slug,
    to_kebab,
)
from ..sidebar import filter_items_by_section
from ..turndown import html_to_md

__all__ = [
    "DEFAULT_STATE_PATH",
    "FETCH_TIMEOUT_S",
    "PUBLIC_IMAGES",
    "SIDEBAR_FILE",
    "SNAPSHOTS_CONTENT_DIR",
    "compute_hash",
    "download_asset",
    "extract_title",
    "get_all_pages_list",
    "get_diff_pages_list",
    "get_untranslated_list",
    "main",
    "parse_mode",
    "parse_sidebar_list",
    "process_one",
    "resolve_htm_path",
    "resolve_to_path_slug",
    "rewrite_and_download_media",
    "rewrite_doc_links",
]

# ---------------------------------------------------------------------------
# Paths / constants (mjs と同じ絶対 path を参照)
# ---------------------------------------------------------------------------

SIDEBAR_FILE: Path = ROOT_DIR / "docs" / "SIDEBAR_URLS.md"
PUBLIC_IMAGES: Path = ROOT_DIR / "public" / "images"
DEFAULT_STATE_PATH: Path = ROOT_DIR / "scripts" / ".cache" / "docs-state.json"
SNAPSHOTS_CONTENT_DIR: Path = ROOT_DIR / "snapshots" / "en" / "content"

FETCH_TIMEOUT_S: float = 30.0
DEFAULT_USER_AGENT: str = "Mozilla/5.0 (Automation)"
THROTTLE_MS: int = 60
ASSET_THROTTLE_MS: int = 20


# ---------------------------------------------------------------------------
# Sidebar parsing (mjs ``parseSidebarList`` / ``getUntranslatedList`` 等価)
# ---------------------------------------------------------------------------

# mjs: /^##\s+(.+?)(?:（(.+?)）)?\s*$/
# 全角 `（...）` 区切りで English / Japanese の category name を分離する。
# この regex を落とすと section heading が 1 文字ずつに崩れる
# (regression test: test_parse_sidebar_list_full_width_delimiter)。
_SECTION_HEADING_RE: re.Pattern[str] = re.compile("^##\\s+(.+?)(?:\uff08(.+?)\uff09)?\\s*$")
_STATUS_LINE_RE: re.Pattern[str] = re.compile(
    r"^-\s*(✅🔍|✅|⏳)\s+(https?://docs\.tricentis\.com/testim/content/[^\s]+\.htm)\s*$"
)


class SidebarItem(TypedDict):
    """``parse_sidebar_list`` の出力 shape (mjs と同じ key 名)。"""

    categoryEnglish: str
    categoryJapanese: str
    url: str
    slug: str
    order: int


def parse_sidebar_list(sidebar_text: str, filter_fn: Callable[[str], bool]) -> list[SidebarItem]:
    """SIDEBAR_URLS.md を構造化 list に変換する (mjs 等価)。"""
    lines = re.split(r"\r?\n", sidebar_text)
    out: list[SidebarItem] = []
    current: dict[str, str] | None = None
    order = 0
    for line in lines:
        heading_match = _SECTION_HEADING_RE.match(line)
        if heading_match:
            english = heading_match.group(1).strip()
            japanese = (heading_match.group(2) or english).strip()
            current = {"english": english, "japanese": japanese}
            order = 0
            continue
        status_match = _STATUS_LINE_RE.match(line)
        if status_match and current:
            order += 1
            if not filter_fn(status_match.group(1)):
                continue
            url = status_match.group(2)
            slug = extract_slug(url)
            if not slug:
                continue
            out.append(
                SidebarItem(
                    categoryEnglish=current["english"],
                    categoryJapanese=current["japanese"],
                    url=url,
                    slug=slug,
                    order=order,
                )
            )
    return out


def get_untranslated_list(sidebar_text: str) -> list[SidebarItem]:
    """status=='⏳' のページだけに絞り込む (mjs ``getUntranslatedList`` 等価)。"""
    return parse_sidebar_list(sidebar_text, lambda status: status == "⏳")


def get_all_pages_list(sidebar_text: str) -> list[SidebarItem]:
    """全ページを返す (mjs ``getAllPagesList`` 等価)。"""
    return parse_sidebar_list(sidebar_text, lambda _status: True)


# ---------------------------------------------------------------------------
# Hash + diff detection (mjs ``computeHash`` / ``getDiffPagesList`` 等価)
# ---------------------------------------------------------------------------


def compute_hash(content: str) -> str:
    """mjs ``createHash('sha256').update(content).digest('hex')`` 等価。"""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def get_diff_pages_list(
    sidebar_text: str,
    hashes_path: Path,
    *,
    snapshots_content_dir: Path | None = None,
    logger: Callable[[str], None] | None = None,
    now: datetime.datetime | None = None,
) -> list[SidebarItem]:
    """snapshot hash の変化を検出し、更新対象 page list を返す (mjs 等価)。

    ``hashes_path`` の JSON を読んで、現 snapshot の SHA-256 と比較する。
    hash 一致しない page (snapshot 不在含む) を返す。副作用として
    ``hashes_path`` に最新 hash map を書き出す。
    """
    content_dir = (
        snapshots_content_dir if snapshots_content_dir is not None else SNAPSHOTS_CONTENT_DIR
    )
    log_warn: Callable[[str], None] = logger if logger is not None else _default_logger
    current_now = now if now is not None else datetime.datetime.now(tz=datetime.UTC)

    all_pages = get_all_pages_list(sidebar_text)

    stored_hashes: dict[str, Any] = {}
    if hashes_path.exists():
        try:
            stored_hashes = json.loads(hashes_path.read_text(encoding="utf-8"))
        except OSError, json.JSONDecodeError:
            stored_hashes = {}

    new_hashes: dict[str, Any] = dict(stored_hashes)
    changed: list[SidebarItem] = []

    for page in all_pages:
        snapshot_path = content_dir / f"{page['slug']}.html"
        content = ""
        try:
            content = snapshot_path.read_text(encoding="utf-8")
        except FileNotFoundError:
            pass
        except OSError:
            raise

        if not content:
            log_warn(
                f"getDiffPagesList: no snapshot for {page['slug']}; "
                "treating as changed. Run check:snapshots:fetch first."
            )
            changed.append(page)
            continue

        hash_value = compute_hash(content)
        prev = stored_hashes.get(page["slug"])
        prev_hash: str | None
        if isinstance(prev, str):
            prev_hash = prev
        elif isinstance(prev, dict):
            prev_hash = prev.get("hash") if isinstance(prev.get("hash"), str) else None
        else:
            prev_hash = None

        if prev_hash != hash_value:
            changed.append(page)

        new_hashes[page["slug"]] = {
            "sourceUrl": page["url"],
            "hash": hash_value,
            "checkedAt": current_now.strftime("%Y-%m-%dT%H:%M:%S.")
            + f"{current_now.microsecond // 1000:03d}Z",
        }

    hashes_path.parent.mkdir(parents=True, exist_ok=True)
    hashes_path.write_text(
        json.dumps(new_hashes, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return changed


# ---------------------------------------------------------------------------
# CLI helpers (mjs ``parseMode`` / ``parseSection`` 等価)
# ---------------------------------------------------------------------------


def parse_mode(argv: list[str]) -> str | None:
    """``--mode=<value>`` を argv から取り出す (mjs ``parseMode`` 等価)。"""
    for arg in argv:
        if arg.startswith("--mode="):
            return arg.split("=", 1)[1]
    return None


def _parse_section(argv: list[str]) -> str | None:
    """``--section=<value>`` を argv から取り出す (``=`` が複数でも原 semantics を維持)。"""
    for arg in argv:
        if arg.startswith("--section="):
            return arg.split("=", 1)[1]
    return None


# ---------------------------------------------------------------------------
# Asset download (mjs ``downloadAsset`` 等価)
# ---------------------------------------------------------------------------


# readme.io / MadCap CDN の長大 hash prefix を 7 文字に truncate する pattern。
_HASH_PREFIX_RE: re.Pattern[str] = re.compile(r"^([a-fA-F0-9]{7})[a-fA-F0-9]{50,}(-.*)")


def _default_logger(message: str) -> None:
    """default logger (mjs ``console.warn`` 等価、stderr にそのまま流す)。"""
    print(message, file=sys.stderr)


class DownloadResult(TypedDict):
    """``download_asset`` の戻り値 shape。"""

    name: str
    path: str


AssetFetcher = Callable[[str], bytes]
"""``url -> bytes`` の fetch 関数契約 (test 用 DI)。"""


def _default_fetch_bytes(url: str) -> bytes:
    """httpx ベースの default asset fetcher。redirect を follow する。"""
    response = httpx.get(
        url,
        headers={
            "User-Agent": DEFAULT_USER_AGENT,
            "Accept": "*/*",
        },
        timeout=FETCH_TIMEOUT_S,
        follow_redirects=True,
    )
    response.raise_for_status()
    return response.content


def _curl_fallback(url: str, dest_path: Path) -> None:
    """httpx 失敗時の curl fallback (mjs と同じ引数を渡す)。

    mjs:
        execFile('curl', ['-sL', '--fail', '--compressed',
                          '-A', 'Mozilla/5.0 (Automation)',
                          '-o', destPath, url])
    """
    subprocess.run(  # noqa: S603 — 引数は全て known / URL は argv[-1] で渡す
        [
            "curl",
            "-sL",
            "--fail",
            "--compressed",
            "-A",
            DEFAULT_USER_AGENT,
            "-o",
            str(dest_path),
            url,
        ],
        check=True,
    )


def download_asset(
    url: str,
    dest_dir: Path,
    *,
    fetch_fn: AssetFetcher | None = None,
    sleep_fn: Callable[[float], None] | None = None,
    curl_fn: Callable[[str, Path], None] | None = None,
    logger: Callable[[str], None] | None = None,
) -> DownloadResult:
    """1 asset を download し、``{name, path}`` を返す (mjs 等価)。

    既に存在する場合は再 download せずそのまま返す (冪等性)。
    fetch 失敗時は curl fallback に切り替える (mjs と同じ)。
    """
    fetcher: AssetFetcher = fetch_fn if fetch_fn is not None else _default_fetch_bytes
    sleeper: Callable[[float], None] = sleep_fn if sleep_fn is not None else time.sleep
    curl: Callable[[str, Path], None] = curl_fn if curl_fn is not None else _curl_fallback
    log_warn: Callable[[str], None] = logger if logger is not None else _default_logger

    parsed = urlparse(url)
    raw_name = Path(parsed.path).name
    target_name = raw_name
    hash_match = _HASH_PREFIX_RE.match(raw_name)
    if hash_match:
        target_name = f"{hash_match.group(1)}{hash_match.group(2)}"

    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / target_name

    if dest_path.exists():
        return DownloadResult(name=target_name, path=str(dest_path))

    try:
        payload = fetcher(url)
        dest_path.write_bytes(payload)
    except Exception as exc:  # noqa: BLE001 — mjs と同じく包括で curl fallback
        log_warn(f"fetch failed for {url}: {exc} — falling back to curl")
        curl(url, dest_path)

    sleeper(ASSET_THROTTLE_MS / 1000.0)
    return DownloadResult(name=target_name, path=str(dest_path))


# ---------------------------------------------------------------------------
# Media rewriting (mjs ``rewriteAndDownloadMedia`` 等価)
# ---------------------------------------------------------------------------


# readme.io の absolute URL (png/jpg/gif/webp/mp4/webm/mov)
_ABSOLUTE_URL_RE: re.Pattern[str] = re.compile(
    r"https://files\.readme\.io/[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|gif|webp|mp4|webm|mov)",
    re.IGNORECASE,
)
# MadCap 相対 image path ``images/foo.png``
_RELATIVE_IMG_RE: re.Pattern[str] = re.compile(
    r"images/[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|gif|webp|mp4|webm|mov)",
    re.IGNORECASE,
)
# ``<Image src="..."/>`` → ``![](src)``
_ASTRO_IMAGE_RE: re.Pattern[str] = re.compile(
    r'<Image\b[^>]*src="([^"]+)"[^>]*/>',
)


def _unique_preserving_order(items: list[str]) -> list[str]:
    """``new Set(match || [])`` + ``Array.from`` 等価。順序を維持して dedupe する。"""
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


def rewrite_and_download_media(
    markdown: str,
    category_folder: str,
    slug: str,
    source_url: str,
    *,
    public_images_dir: Path | None = None,
    download_fn: Callable[[str, Path], DownloadResult] | None = None,
    logger: Callable[[str], None] | None = None,
) -> str:
    """markdown 中の asset URL を local path に書き換え、同時に download する。

    - ``https://files.readme.io/...`` (legacy) → ``/images/<cat>/<slug>/<name>``
    - MadCap 相対 ``images/foo.png`` → ``sourceUrl`` 親ディレクトリ基準で
      absolute 化してから download、同じく local path へ rewrite する。
    - ``<Image src=...>`` → ``![](src)`` に (last-stage) 置換する。
    """
    images_dir = public_images_dir if public_images_dir is not None else PUBLIC_IMAGES
    downloader = download_fn if download_fn is not None else download_asset
    log_warn: Callable[[str], None] = logger if logger is not None else _default_logger

    media_dir = images_dir / category_folder / slug
    local_prefix = f"/images/{category_folder}/{slug}"

    absolute_urls = _unique_preserving_order(_ABSOLUTE_URL_RE.findall(markdown))
    relative_paths = _unique_preserving_order(_RELATIVE_IMG_RE.findall(markdown))

    # mjs: ``sourceUrl.replace(/\/[^/]*$/, '/')`` — 最後の path segment (filename)
    # を落として親ディレクトリ URL を作る。``https://host/a/b/page.htm`` →
    # ``https://host/a/b/``。
    madcap_base = re.sub(r"/[^/]*$", "/", source_url) if source_url else ""

    resolved_relatives: list[tuple[str, str]] = (
        [(path, madcap_base + path) for path in relative_paths] if madcap_base else []
    )

    all_downloads: list[tuple[str, str]] = [
        (url, url) for url in absolute_urls
    ] + resolved_relatives

    pairs: list[tuple[str, str]] = []
    for original, resolved_url in all_downloads:
        try:
            result = downloader(resolved_url, media_dir)
            pairs.append((original, f"{local_prefix}/{result['name']}"))
        except Exception as exc:  # noqa: BLE001 — mjs と同じく失敗しても続行
            log_warn(f"⚠️  Failed to download {resolved_url}: {exc}")

    updated = markdown
    for original, local in pairs:
        updated = re.sub(re.escape(original), local, updated)
    updated = _ASTRO_IMAGE_RE.sub(lambda m: f"![]({m.group(1)})", updated)
    return updated


# ---------------------------------------------------------------------------
# Doc link rewriting (mjs ``rewriteDocLinks`` 等価 — 4 stage)
# ---------------------------------------------------------------------------

# Stage 1: ``](doc:slug#frag)`` — legacy readme.io markdown link
_MD_DOC_RE: re.Pattern[str] = re.compile(r"\]\(doc:([a-z0-9_-]+)(#[^)]+)?\)")
# Stage 2: ``](path.htm#frag)`` — MadCap Flare relative .htm link (scheme 無し)
_MD_HTM_RE: re.Pattern[str] = re.compile(
    r"\]\((?![a-z][a-z0-9+.-]*:|\/\/)([^)#]*\.htm)(?:\/#\/)?(#[^)]*)?\)"
)
# Stage 3: ``<a href="doc:slug">`` — HTML link form
_HTML_DOC_RE: re.Pattern[str] = re.compile(
    r'<a(\s[^>]*)href="doc:([a-z0-9_-]+)(#[^"]*)?"([^>]*>)',
    re.IGNORECASE,
)
# Stage 4: ``<a href="path.htm">`` — HTML relative .htm link
_HTML_HTM_RE: re.Pattern[str] = re.compile(
    r'<a(\s[^>]*)href="(?![a-z][a-z0-9+.-]*:|\/\/)([^"#]*\.htm)(?:\/#\/)?(#[^"]*)?"([^>]*>)',
    re.IGNORECASE,
)

# ``../`` / ``./`` prefix を stripping する pattern (mjs と同じ)
_RELATIVE_PREFIX_RE: re.Pattern[str] = re.compile(r"^(?:\.\./)+|^(?:\./)+")


def resolve_to_path_slug(slug: str) -> str:
    """basename slug を path-based slug に解決。既に path 形式ならそのまま返す。

    mjs ``resolveToPathSlug`` 等価。ambiguous basename (複数 folder に同名)
    は ``None`` になるが、 ``or`` fallback で原 slug を返す (mjs semantic)。
    """
    if "/" in slug:
        return slug
    basename_map = build_basename_to_path_map()
    if slug not in basename_map:
        return slug
    resolved = basename_map.get(slug)
    return resolved if resolved is not None else slug


def resolve_htm_path(raw_path: str) -> str | None:
    """相対 ``.htm`` path を path-based slug に正規化する (mjs 等価)。

    ``bare 'index.htm'`` は context がないため resolve 不能 → ``None``。
    ``/content/`` prefix 付きに正規化して :func:`extract_slug` に委ねる。
    """
    normalized = _RELATIVE_PREFIX_RE.sub("", raw_path)
    if normalized == "index.htm":
        return None
    content_path = normalized if normalized.startswith("/content/") else "/content/" + normalized
    slug = extract_slug(content_path)
    if not slug:
        return None
    return resolve_to_path_slug(slug)


def rewrite_doc_links(markdown: str) -> str:
    """4 stage の doc link rewriting (mjs ``rewriteDocLinks`` 等価)。"""

    def _replace_md_doc(match: re.Match[str]) -> str:
        slug = match.group(1)
        frag = match.group(2) or ""
        return f"](/docs/{resolve_to_path_slug(slug)}{frag})"

    result = _MD_DOC_RE.sub(_replace_md_doc, markdown)

    def _replace_md_htm(match: re.Match[str]) -> str:
        raw_path = match.group(1)
        fragment = match.group(2) or ""
        resolved = resolve_htm_path(raw_path)
        if not resolved:
            return match.group(0)
        return f"](/docs/{resolved}{fragment})"

    result = _MD_HTM_RE.sub(_replace_md_htm, result)

    def _replace_html_doc(match: re.Match[str]) -> str:
        pre = match.group(1)
        slug = match.group(2)
        frag = match.group(3) or ""
        post = match.group(4)
        return f'<a{pre}href="/docs/{resolve_to_path_slug(slug)}{frag}"{post}'

    result = _HTML_DOC_RE.sub(_replace_html_doc, result)

    def _replace_html_htm(match: re.Match[str]) -> str:
        pre = match.group(1)
        raw_path = match.group(2)
        fragment = match.group(3) or ""
        post = match.group(4)
        resolved = resolve_htm_path(raw_path)
        if not resolved:
            return match.group(0)
        return f'<a{pre}href="/docs/{resolved}{fragment}"{post}'

    result = _HTML_HTM_RE.sub(_replace_html_htm, result)
    return result


# ---------------------------------------------------------------------------
# Title + frontmatter (mjs ``extractTitle`` / ``buildFrontmatter`` 等価)
# ---------------------------------------------------------------------------


_TITLE_RE: re.Pattern[str] = re.compile(r"^#\s+(.+)$", re.MULTILINE)


def extract_title(md: str) -> str:
    """markdown 本文先頭付近の ``# Title`` を抽出する (mjs 等価)。"""
    match = _TITLE_RE.search(md)
    return match.group(1).strip() if match else ""


def _today_str(now: datetime.datetime | None = None) -> str:
    """mjs ``Date().getFullYear/Month/Date`` の local-time 等価。"""
    current = now if now is not None else datetime.datetime.now()  # noqa: DTZ005 — JST local date 必須
    return current.strftime("%Y-%m-%d")


_DESCRIPTION_PREFIX_RE: re.Pattern[str] = re.compile(r"^原文:\s*", re.UNICODE)


def _build_frontmatter(
    item: SidebarItem,
    existing_file_path: Path,
    fallback_title: str,
    *,
    now: datetime.datetime | None = None,
) -> str:
    """既存 frontmatter を読み込み、足りない field を埋めて再 emit する (mjs 等価)。"""
    raw = existing_file_path.read_text(encoding="utf-8")
    parsed = frontmatter.loads(raw)
    data: dict[str, Any] = dict(parsed.metadata) if parsed.metadata else {}
    body = parsed.content or ""

    basename_piece = item["slug"].split("/")[-1]
    keywords_value = data.get("keywords")
    if isinstance(keywords_value, list) and len(keywords_value) > 0:
        keywords = keywords_value
    else:
        keywords = ["testim", basename_piece, to_kebab(item["categoryEnglish"])]

    description_value = data.get("description")
    if (
        isinstance(description_value, str)
        and description_value.strip()
        and not _DESCRIPTION_PREFIX_RE.match(description_value)
    ):
        description = description_value.strip()
    else:
        description = generate_description(data.get("title") or fallback_title, body)

    out_data: dict[str, Any] = dict(data)
    out_data.update(
        {
            "title": data.get("title") or fallback_title,
            "description": description,
            "category": data.get("category") or item["categoryJapanese"],
            "order": data.get("order") if isinstance(data.get("order"), int) else item["order"],
            "updated": data.get("updated") or _today_str(now),
            "sourceUrl": item["url"],
            "keywords": keywords,
        }
    )

    post = frontmatter.Post("")
    post.metadata = out_data
    # gray-matter の stringify は末尾に ``\n`` + body を付けるが、mjs 側は
    # ``trimEnd() + '\n\n'`` で整形する。Python 側もそれに揃える。
    serialized = frontmatter.dumps(post, sort_keys=False)
    return str(serialized).rstrip() + "\n\n"


# ---------------------------------------------------------------------------
# Single-page processing (mjs ``processOne`` 等価)
# ---------------------------------------------------------------------------


_MARKER_404_RE: re.Pattern[str] = re.compile(r"^<!-- 404:")
_LEADING_H1_RE: re.Pattern[str] = re.compile(r"^#\s+.+\n+")


def process_one(
    item: SidebarItem,
    slug_index: dict[str, dict[str, Any]],
    *,
    snapshots_content_dir: Path | None = None,
    public_images_dir: Path | None = None,
    convert_fn: Callable[[str], str] | None = None,
    download_fn: Callable[[str, Path], DownloadResult] | None = None,
    logger: Callable[[str], None] | None = None,
    stdout: Any | None = None,
    now: datetime.datetime | None = None,
) -> bool:
    """1 page の snapshot → MD 変換 + 書き出しを行う (mjs ``processOne`` 等価)。

    Returns:
        ``True`` if the doc was written, ``False`` if skipped / error.
    """
    content_dir = (
        snapshots_content_dir if snapshots_content_dir is not None else SNAPSHOTS_CONTENT_DIR
    )
    images_dir = public_images_dir if public_images_dir is not None else PUBLIC_IMAGES
    converter: Callable[[str], str] = convert_fn if convert_fn is not None else html_to_md
    log_warn: Callable[[str], None] = logger if logger is not None else _default_logger
    out = stdout if stdout is not None else sys.stdout

    hit = slug_index.get(item["slug"])
    if not hit:
        log_warn(f"⚠️  No local path for slug: {item['slug']}")
        return False

    category_folder = str(hit["categoryFolder"])
    file_path = Path(str(hit["filePath"]))

    # image 用 basename: path-based slug なら末尾 segment を使う
    slug = item["slug"]
    basename_slug = slug.split("/")[-1] if "/" in slug else slug

    snapshot_path = content_dir / f"{item['slug']}.html"
    md = ""
    if snapshot_path.exists():
        content = snapshot_path.read_text(encoding="utf-8")
        if _MARKER_404_RE.match(content):
            log_warn(f"⚠️  Skip {item['slug']}: snapshot contains 404 marker")
            return False
        try:
            md = converter(content)
        except Exception as exc:  # noqa: BLE001 — mjs と同じく converter 例外を skip 扱い
            log_warn(f"⚠️  Skip {item['slug']}: turndown conversion failed: {exc}")
            return False

    if not md:
        log_warn(f"⚠️  Skip {item['slug']}: no HTML snapshot. Run check:snapshots:fetch first.")
        return False

    md = rewrite_and_download_media(
        md,
        category_folder,
        basename_slug,
        item["url"],
        public_images_dir=images_dir,
        download_fn=download_fn,
        logger=log_warn,
    )
    md = rewrite_doc_links(md)

    title = extract_title(md) or basename_slug.replace("-", " ")
    md = _LEADING_H1_RE.sub("", md, count=1)

    fm = _build_frontmatter(item, file_path, title, now=now)
    final = fm + md.strip() + "\n"
    file_path.write_text(final, encoding="utf-8")

    try:
        rel = file_path.resolve().relative_to(ROOT_DIR)
        print(f"✓ Wrote {rel}", file=out)
    except ValueError:
        print(f"✓ Wrote {file_path}", file=out)
    return True


# ---------------------------------------------------------------------------
# Main (mjs ``main`` 等価)
# ---------------------------------------------------------------------------


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch EN HTML snapshot → Markdown + asset download + frontmatter write"
    )
    parser.add_argument("--slug", default=None, help="1 ページだけ処理する (path-based slug)")
    parser.add_argument("--limit", type=int, default=0, help="処理する page 数の上限")
    parser.add_argument(
        "--mode",
        choices=("full", "diff"),
        default=None,
        help="full=全ページ / diff=snapshot hash 差分のみ / 未指定=未翻訳のみ",
    )
    parser.add_argument("--section", default=None, help="sidebar section で絞り込み")
    return parser.parse_args(argv)


def main(
    argv: list[str] | None = None,
    *,
    sidebar_file: Path | None = None,
    hashes_path: Path | None = None,
    snapshots_content_dir: Path | None = None,
    public_images_dir: Path | None = None,
    convert_fn: Callable[[str], str] | None = None,
    download_fn: Callable[[str, Path], DownloadResult] | None = None,
    sleep_fn: Callable[[float], None] | None = None,
    slug_index: dict[str, dict[str, Any]] | None = None,
    stdout: Any | None = None,
    logger: Callable[[str], None] | None = None,
    now: datetime.datetime | None = None,
) -> int:
    """CLI エントリポイント (mjs ``main`` 等価)。

    exit code: 0 成功 / 1 unknown slug / missing sidebar。
    """
    if argv is None:
        argv = sys.argv[1:]
    args = _parse_args(argv)

    out = stdout if stdout is not None else sys.stdout
    log_warn: Callable[[str], None] = logger if logger is not None else _default_logger
    sleeper: Callable[[float], None] = sleep_fn if sleep_fn is not None else time.sleep
    sidebar_path = sidebar_file if sidebar_file is not None else SIDEBAR_FILE
    content_dir = (
        snapshots_content_dir if snapshots_content_dir is not None else SNAPSHOTS_CONTENT_DIR
    )
    images_dir = public_images_dir if public_images_dir is not None else PUBLIC_IMAGES
    state_path = hashes_path if hashes_path is not None else DEFAULT_STATE_PATH

    raw_slug = args.slug
    only_slug = resolve_slug(raw_slug) if raw_slug else None
    if raw_slug and not only_slug:
        print(
            f'❌ Unknown slug: "{raw_slug}". No matching document found.',
            file=sys.stderr,
        )
        return 1

    if not sidebar_path.exists():
        print(f"Missing file: {sidebar_path}", file=sys.stderr)
        return 1

    sidebar_text = sidebar_path.read_text(encoding="utf-8")
    index = slug_index if slug_index is not None else build_slug_index()

    if args.mode == "full":
        items: list[SidebarItem] = get_all_pages_list(sidebar_text)
    elif args.mode == "diff":
        items = get_diff_pages_list(
            sidebar_text,
            state_path,
            snapshots_content_dir=content_dir,
            logger=log_warn,
            now=now,
        )
    else:
        items = get_untranslated_list(sidebar_text)

    # section filter を適用。``filter_items_by_section`` は ``slug`` key で絞り込む。
    # SidebarItem は ``slug`` を持つため、そのまま渡せる (mjs と同じ流れ)。
    filtered = filter_items_by_section([dict(item) for item in items], args.section)

    done = 0
    limit = int(args.limit) if args.limit else 0

    for entry in filtered:
        # entry は ``dict[str, object]``。TypedDict ではないが SidebarItem と同 shape。
        item = SidebarItem(
            categoryEnglish=str(entry["categoryEnglish"]),
            categoryJapanese=str(entry["categoryJapanese"]),
            url=str(entry["url"]),
            slug=str(entry["slug"]),
            order=int(entry["order"]) if isinstance(entry["order"], int) else 0,
        )
        if only_slug and item["slug"] != only_slug:
            continue
        ok = process_one(
            item,
            index,
            snapshots_content_dir=content_dir,
            public_images_dir=images_dir,
            convert_fn=convert_fn,
            download_fn=download_fn,
            logger=log_warn,
            stdout=out,
            now=now,
        )
        if ok:
            done += 1
        if limit and done >= limit:
            break
        sleeper(THROTTLE_MS / 1000.0)

    print(f"Done. Processed {done} file(s).", file=out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
