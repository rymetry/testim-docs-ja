"""``segments_ja`` のクロスランタイム conformance。

Phase 2 goal は **Issue #368 (nested list flattening)** を Python で正しく解く
こと。mjs line-based 実装は nested list を各行 1 segment として emit するが、
Python port は markdown-it-py AST に委譲して top-level ``<li>`` だけ emit する。
したがって両 runtime の出力は **nested list を含むケースで意図的に divergent**。

本 conformance test は **nested list を含まない sample だけ** を byte 一致で
照合する。nest-free 領域の挙動は 1:1 保存しないと段階的な alignment / structure
gate に影響するため、ここで drift を早期検出する。Issue #368 本体の fix
挙動 (ネスト時の flattening) は ``tests/test_segments_ja.py`` の
``TestIssue368NestedListFlattening`` が規定する。

### 288-page regression guard (Phase 1 pattern)

``test_nest_free_pages_match_mjs`` は ``src/content/docs`` 配下の JA markdown
全ページをスキャンし、nested list を含まない (= mjs と byte 一致する) 全ページ
で Python 出力が byte 一致することを guard する。一度 mapping が安定したら
(nest-free vs nested の corpus 分布)、回帰は即検出される。
"""

from __future__ import annotations

import pytest

from testim_parity.segments_ja import extract_segments_from_markdown

from ._harness import run_batch

# -------------------- nest-free conformance samples --------------------
# 明示的に nested list を含まない sample 群。byte 一致を hard に要求する。
# (nested list は Python 側で意図的に divergent なので harness batch 時は除外する)

NEST_FREE_SAMPLES: list[str] = [
    # 空 / 無 body
    "",
    "   \n   \n",
    # Frontmatter だけ
    "---\ntitle: T\n---\n\nBody.\n",
    # Heading hierarchy
    "## A\n\n### A1\n\npara1\n\n#### A1-1\n\npara2\n",
    # H1 skip + heading stack truncation
    "# Title\n\n## A\n\n### A1\n\npara\n\n## B\n\npara2\n",
    # Heading anchor suffix
    "## Section Title {#anchor-id}\n\nBody.\n",
    # Flat unordered list (no nest)
    "- alpha\n- beta\n- gamma\n",
    # Flat ordered list (no nest)
    "1. first\n2. second\n3. third\n",
    # Code fence backtick
    "## X\n\n```js\nvar x = 1;\nconst y = 2;\n```\n\nAfter code.\n",
    # Code fence tilde
    "## X\n\n~~~py\nprint(1)\n~~~\n",
    # Callout types
    ":::note\nBody here.\n:::\n",
    ':::note{title="重要"}\nBody with title.\n:::\n',
    ":::warning\nLine A.\nLine B.\n:::\n",
    # Markdown table (no nest)
    "| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |\n",
    # Table with escaped pipe
    "| h1 | h2 |\n| - | - |\n| pipe\\|here | plain |\n",
    # HTML table with thead/tbody
    (
        "<table>"
        "<thead><tr><th>H1</th><th>H2</th></tr></thead>"
        "<tbody><tr><td>D1</td><td>D2</td></tr></tbody>"
        "</table>\n"
    ),
    # Details / summary (single line)
    "<details><summary>Q</summary><p>body</p></details>\n",
    # Details with multi-paragraph body (still no nested list)
    (
        "<details><summary>FAQ</summary>\n\n"
        "Answer paragraph 1.\n\n"
        "Answer paragraph 2.\n\n"
        "</details>\n"
    ),
    # Multi-line summary
    "<details>\n<summary>\nMulti-line\nQuestion?\n</summary>\nAnswer.\n</details>\n",
    # Standalone image (markdown)
    "## X\n\n![alt](/img.png)\n",
    # Standalone image (HTML)
    '## X\n\n<img src="/img.png" alt="A" />\n',
    # Horizontal rule
    "## X\n\nBefore.\n\n---\n\nAfter.\n",
    # Paragraph with inline markdown
    "## X\n\nThis is **bold** and *italic* and `code` text.\n",
    # Link in paragraph
    "## X\n\nSee [the docs](/docs/foo) for details.\n",
    # Callout containing flat list
    ":::note\nIntro paragraph.\n\n- item one\n- item two\n:::\n",
    # Details containing flat list
    "<details><summary>Items</summary>\n\n- a\n- b\n\n</details>\n",
    # Paragraph + image sequence
    "## X\n\nLead paragraph.\n\n![alt](/x.png)\n\nTrail paragraph.\n",
    # Consecutive callouts
    ":::note\nFirst.\n:::\n\n:::warning\nSecond.\n:::\n",
    # Mixed content flow
    (
        "## Overview\n\n"
        "Intro text.\n\n"
        ":::note\nCallout body.\n:::\n\n"
        "### Details\n\n"
        "More details here.\n\n"
        "```bash\ncurl example.com\n```\n\n"
        "Closing paragraph.\n"
    ),
]


@pytest.fixture(scope="module")
def mjs_nest_free_results(repo_root, node_available) -> list[list[dict]]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "segments_ja_extract", "args": [body]} for body in NEST_FREE_SAMPLES]
    return run_batch(repo_root, calls)


def test_nest_free_samples_match_mjs(mjs_nest_free_results):
    """nest-free sample で Python output が mjs と byte 一致する。"""
    for body, mjs in zip(NEST_FREE_SAMPLES, mjs_nest_free_results, strict=True):
        py = extract_segments_from_markdown(body)
        assert len(py) == len(mjs), (
            f"segment count differs for body={body!r}:\n"
            f"  py={len(py)} mjs={len(mjs)}\n"
            f"  py={py!r}\n"
            f"  mjs={mjs!r}"
        )
        for i, (py_seg, mjs_seg) in enumerate(zip(py, mjs, strict=True)):
            assert py_seg == mjs_seg, (
                f"segment[{i}] differs for body={body[:50]!r}:\n"
                f"  py  = {py_seg!r}\n"
                f"  mjs = {mjs_seg!r}"
            )


# -------------------- 288-page corpus regression guard --------------------
# nested list を含まない JA ページ全て (現状 142 file) で byte 一致を確認。
# ``_NEST_ALLOWLIST`` には「nested list を含むため意図的 divergent」なページを
# 自動で振り分ける — 実行時に Python 出力と mjs 出力の差分を見て、segment 数
# delta が負 (Python flatten による減少) なら allowlist 扱い、それ以外は fail。


SNAPSHOT_ROOT_PARTS = ("src", "content", "docs")


def _collect_ja_pages(repo_root) -> list[tuple[str, str]]:
    """``(slug, body)`` のリストを返す。slug は拡張子なしの相対パス。"""
    root = repo_root
    for part in SNAPSHOT_ROOT_PARTS:
        root = root / part
    if not root.exists():
        return []
    pairs: list[tuple[str, str]] = []
    for path in sorted(root.rglob("*.md")):
        rel = path.relative_to(root).with_suffix("")
        slug = rel.as_posix()
        pairs.append((slug, path.read_text(encoding="utf-8")))
    return pairs


@pytest.fixture(scope="module")
def ja_pages(repo_root) -> list[tuple[str, str]]:
    pages = _collect_ja_pages(repo_root)
    if not pages:
        pytest.skip("src/content/docs/ が空 — JA corpus 未同期")
    return pages


@pytest.fixture(scope="module")
def mjs_ja_segments_by_slug(repo_root, node_available, ja_pages) -> dict[str, list]:
    if not node_available:
        pytest.skip("node not available")
    # 288 page を 1 回の node spawn で batch 処理
    calls = [{"function": "segments_ja_extract", "args": [body]} for _, body in ja_pages]
    results = run_batch(repo_root, calls, timeout=300.0)
    return {slug: mjs for (slug, _), mjs in zip(ja_pages, results, strict=True)}


def test_ja_corpus_zero_regressions(ja_pages, mjs_ja_segments_by_slug):
    """288 page で **regression (py_count > mjs_count) が 0 件**。

    Issue #368 の fix は Python 側で segment を **減らす** 方向にしか働かない
    (nested list flattening)。Python が mjs より **多く** emit するのは必ず
    regression。全 divergence が flatten 方向であることを hard 確認する。
    """
    regressions: list[tuple[str, int, int]] = []
    for slug, body in ja_pages:
        py = extract_segments_from_markdown(body)
        mjs = mjs_ja_segments_by_slug[slug]
        if len(py) > len(mjs):
            regressions.append((slug, len(py), len(mjs)))

    assert not regressions, (
        f"{len(regressions)} page(s) emit more segments than mjs (regression):\n"
        + "\n".join(f"  {slug}: py={pc} mjs={mc}" for slug, pc, mc in regressions[:10])
    )


# 現行 288-page corpus で nested-list flatten が発動しないページ数 (Phase 2 計測)。
# この数字が変動する = corpus 側で nested list パターンが追加/削除された、または
# Python extractor の挙動が変わった、のいずれか。どちらも Phase 2 review では
# 意図した変更なので、本定数を更新して diff を PR に明示する運用。静的な pin
# があることで、"drop-one-add-one" で count が偶然保存されるような silent バグ
# を corpus-shape 側からも tripwire できる (architect review H3)。
#
# 141 = 288 - 147 divergent。codex review P2 #1 対応で indented fence / image
# の flatten 挙動を EN walker と揃えた結果、1 ページが byte-identical subset から
# flatten subset へ移動した (以前は 142)。
_NEST_FREE_CORPUS_SIZE = 141


def test_ja_corpus_nest_free_count_pinned(ja_pages, mjs_ja_segments_by_slug):
    """nest-free ページ数が Phase 2 計測値 (``_NEST_FREE_CORPUS_SIZE``) と一致。

    architect review H3: ``test_ja_corpus_nest_free_pages_byte_identical`` が
    auto-derive で nest-free subset を拾うため、corpus side の shift (新規
    nested list 追加 / 既存 flatten page の content 変更) を silent に取り込む
    リスクがある。本 test で subset 数を static に pin することで、corpus
    shape 変化を PR で明示的に認識させる (subset 数が変わったら本定数を更新
    する PR が必要)。
    """
    equal_count_pages = sum(
        1
        for slug, body in ja_pages
        if len(extract_segments_from_markdown(body)) == len(mjs_ja_segments_by_slug[slug])
    )
    assert equal_count_pages == _NEST_FREE_CORPUS_SIZE, (
        f"nest-free page count shifted: actual={equal_count_pages} "
        f"pinned={_NEST_FREE_CORPUS_SIZE}. "
        "If corpus change is intentional, update _NEST_FREE_CORPUS_SIZE."
    )


def test_ja_corpus_nest_free_pages_byte_identical(ja_pages, mjs_ja_segments_by_slug):
    """segment 数が mjs と一致する全ページで byte-identical。

    segment 数が一致する = nested list flattening が発動していない = mjs
    line-based 挙動と揃っている。このサブセットで byte 一致していれば、
    headings / callout / details / code fence / table / paragraph / image の
    挙動が mjs と drift していないことを示せる。

    ペアになる ``test_ja_corpus_nest_free_count_pinned`` が subset 数を static
    に pin するため、"drop-one-add-one" 系の silent バグ (count 保存 but 内容
    shift) も両 test の組合せで tripwire される (architect review H3)。
    """
    byte_divergences: list[str] = []
    equal_count_pages = 0
    for slug, body in ja_pages:
        py = extract_segments_from_markdown(body)
        mjs = mjs_ja_segments_by_slug[slug]
        if len(py) != len(mjs):
            continue  # nested list flatten 発動ページ、本 test の対象外
        equal_count_pages += 1
        if py != mjs:
            # 最初の違いだけ出す
            first_diff_idx: int | None = None
            for i, (p, m) in enumerate(zip(py, mjs, strict=True)):
                if p != m:
                    first_diff_idx = i
                    break
            detail = f"  slug={slug}"
            if first_diff_idx is not None:
                detail += (
                    f"\n    first diff at index {first_diff_idx}:"
                    f"\n      py  = {py[first_diff_idx]!r}"
                    f"\n      mjs = {mjs[first_diff_idx]!r}"
                )
            byte_divergences.append(detail)

    # 必ず 1 ページ以上 equal_count があるはず (空 corpus なら fixture skip する)
    assert equal_count_pages > 0, "no nest-free pages found"
    assert not byte_divergences, (
        f"{len(byte_divergences)} nest-free page(s) diverge byte-wise from mjs:\n"
        + "\n".join(byte_divergences[:10])
    )
