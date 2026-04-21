"""288-page corpus での ``align_segments`` の mjs byte 一致 conformance。

architect H2 指摘対応: Phase 3 M4 完了時点で 288-page の実 body を使って
mjs vs Python の ``align_segments`` 出力を byte 比較する。shape drift が
M5 baseline identity key 凍結前に検出されることを保証する。

Implementation
---------------

本 test は以下のステップで動く:

1. ``src/content/docs/`` 配下の JA markdown 全ページを収集
2. 対応する EN snapshot (``snapshots/en/content/<slug>.html``) があるページだけ
   対象にする (snapshot 欠落は ``missing-snapshot`` 経路なので align 対象外)
3. EN HTML → segments (``segments_en.extract_segments_from_html``)
4. JA markdown → segments (``segments_ja.extract_segments_from_markdown``)
5. ``align_segments(en, ja, slug=...)`` を Python / mjs 両方で走らせ結果を byte 比較

Phase 2 conformance (``test_segments_ja_parity.py``) と同じく、意図的に
divergent な slug (``_DIVERGENT_ALLOWLIST``) は allowlist に計上する。現状は
Phase 2 nested list flatten 由来の 147 slug が divergent。segment 数が mjs と
一致する slug のみ align を走らせ byte 比較する。

Note: node spawn コストを抑えるため 288 page 全体を 1 batch で処理する。
mjs 側で align_segments まで流すため batch timeout を 600s に拡張する。
"""

from __future__ import annotations

from pathlib import Path

import pytest

from testim_parity.align import align_segments
from testim_parity.segments_en import extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown

from ._harness import run_batch

SNAPSHOT_ROOT_PARTS = ("src", "content", "docs")
EN_SNAPSHOT_ROOT_PARTS = ("snapshots", "en", "content")


def _collect_aligned_pages(repo_root: Path) -> list[tuple[str, str, str]]:
    """``(slug, en_html, ja_body)`` のリストを返す。

    JA markdown と EN HTML snapshot の両方が存在する slug のみ対象。Phase 2
    の nested list flatten で segment 数が divergent なページは、align での
    heading-count-mismatch 経路が両 runtime で同じなので batch は通す。
    """
    ja_root = repo_root
    for part in SNAPSHOT_ROOT_PARTS:
        ja_root = ja_root / part
    en_root = repo_root
    for part in EN_SNAPSHOT_ROOT_PARTS:
        en_root = en_root / part

    if not ja_root.exists() or not en_root.exists():
        return []

    pairs: list[tuple[str, str, str]] = []
    for ja_path in sorted(ja_root.rglob("*.md")):
        rel = ja_path.relative_to(ja_root).with_suffix("")
        slug = rel.as_posix()
        en_path = en_root / rel.with_suffix(".html")
        if not en_path.exists():
            continue
        try:
            en_html = en_path.read_text(encoding="utf-8")
            ja_body = ja_path.read_text(encoding="utf-8")
        except OSError:
            continue
        pairs.append((slug, en_html, ja_body))
    return pairs


@pytest.fixture(scope="module")
def aligned_pages(repo_root: Path) -> list[tuple[str, str, str]]:
    pages = _collect_aligned_pages(repo_root)
    if not pages:
        pytest.skip("JA / EN snapshot corpus が空 — 同期されていない")
    return pages


def test_align_288_matrix_regressions_zero(
    aligned_pages: list[tuple[str, str, str]], repo_root: Path, node_available: bool
) -> None:
    """288 page (対応 snapshot 有) で Python align 出力が mjs と byte-identical。

    EN HTML → segments / JA md → segments を Python 側で生成し、その segment 列を
    mjs harness と Python 両方に渡して align_segments の diffs / inconclusive
    shape を byte 比較する (extractor 側の conformance は Phase 1/2 で担保済)。

    Phase 2 nested list flatten で segment count が divergent な slug は、align の
    ``heading-count-mismatch`` 経路が両 runtime で同値なので同じ ``inconclusive``
    結果になる。divergent 経路自体も conformance 対象。
    """
    if not node_available:
        pytest.skip("node not available")

    # Python 側の segment 列を先に作り、mjs には segments を直接渡す
    # (mjs 側でも extractor を走らせて同じ結果になることは Phase 1/2 で保証済み)
    calls: list[dict] = []
    py_results: list[dict] = []

    for slug, en_html, ja_body in aligned_pages:
        # segments_en / segments_ja は既に dict を返す (Phase 1/2 契約)
        en_segments = extract_segments_from_html(en_html, slug=slug, callout_allow_slugs=None)
        ja_segments = extract_segments_from_markdown(ja_body)

        calls.append(
            {
                "function": "align_segments",
                "args": [list(en_segments), list(ja_segments), {"slug": slug}],
            }
        )
        py_result = align_segments(en_segments, ja_segments, slug=slug)
        py_results.append({"ok": True, "result": py_result})

    mjs_results = run_batch(repo_root, calls, timeout=600.0)

    regressions: list[str] = []
    for (slug, _, _), py_env, mjs_env in zip(aligned_pages, py_results, mjs_results, strict=True):
        if py_env != mjs_env:
            regressions.append(slug)

    assert not regressions, (
        f"{len(regressions)} page(s) diverge align output:\n"
        + "\n".join(f"  {slug}" for slug in regressions[:20])
        + (f"\n  ... ({len(regressions) - 20} more)" if len(regressions) > 20 else "")
    )
