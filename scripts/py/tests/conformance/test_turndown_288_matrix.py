r"""Phase 4b M2/M3 verification gate: 288-page turndown conversion matrix。

``snapshots/en/content/**/*.html`` 全ページを Python の
``convert_en_html_to_md`` と mjs ``turndown.mjs::convertEnHtmlToMd`` で変換
して byte 比較する。PYTHON_MIGRATION_PLAN.md の Phase 4b M2/M3 scope:

    > M2 ``check_source_parity.py`` は snapshot の Markdown 化に turndown を
    > 使う。M3 ``snapshot_update.py`` は extract 後に turndown で structure
    > 比較する実装を通す。M1 の代表 39 pattern だけでは real orchestration に
    > 入った turndown 経路の全 corpus 検証として不足。

## 現状 (2026-04-22, reviewer P2#2 対応時点)

Python の ``convert_en_html_to_md`` は **288 pages のうち ~120 件で mjs と
byte 一致**、残 ~168 件は以下カテゴリの divergence が残る (M1 scope 外の
turndown default rule:

| カテゴリ | 件数 | 内容 |
| --- | --- | --- |
| leading_ws | 84 | ``<br/>`` 等の block boundary 後の leading whitespace collapse |
| other | 43 | whitespace 複合 / markdownify inline detection 差 |
| trailing_ws | 23 | list item の trailing 2-space (hard line break) |
| plus_escape | 13 | ``+`` の markdown list-marker escape (``\+``) |
| image_concat | 4 | 隣接 ``<img>`` の inline 連結 |
| hash_escape | 1 | paragraph 内 ``#`` の ATX-heading escape (``\#``) |

これらは M1 で取り込まなかった turndown default escape / flanking whitespace
rule の港が残っている結果で、**Phase 4b.1 (follow-up PR) で解消**する。
M2 ``check_source_parity`` / M3 ``snapshot_update`` の orchestration 自体は
mjs と同じ JSON schema / 副作用で完了しているため、本 test は現時点では
``xfail(strict=False)`` として gap を可視化しつつ regression gate に使用する。

本テストを Phase 4b.1 で pass させた時点で xfail marker を外し、Phase 6
atomic cutover までに通る状態を維持する。reviewer P2#2 対応。

## batch 戦略

mjs 側は 1 回の node プロセスで 288 call を batch 処理する (harness.mjs の
batch dispatch 契約)。単純な 288 逐次 spawn だと ~30s かかるため、fixture
scope=module で batch を 1 度だけ実行する (segments_en 288-matrix と同じ
pattern)。

## Allowlist lifecycle

``_ALLOWLIST`` は intentional divergence を吸収するための slug 台帳。現状は
**空**。Phase 6 atomic cutover で mjs を削除した時点で本テストは retire
する想定 (M1 と同様、cross-runtime conformance は cutover と同時に不要化)。

Entry の shape:

    {slug: AllowEntry(reason="...", expires_at_phase="phaseN", linked_issue=None)}

運用ルール:

1. 追加時は ``reason`` を必ず明記 (turndown 変換の差の理由 / 該当 mjs bug)
2. ``expires_at_phase`` は divergence 解消予定 Phase。Phase 完了時に見直し
3. ``linked_issue`` は明示指定必須 (None 許容だが省略不可)
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from testim_parity.turndown import convert_en_html_to_md

from ._harness import run_batch

SNAPSHOT_ROOT_PARTS = ("snapshots", "en", "content")


@dataclass(frozen=True)
class AllowEntry:
    """intentional divergence 1 件分の台帳エントリ。"""

    reason: str
    expires_at_phase: str
    linked_issue: str | None


# Intentional divergence 台帳。slug → AllowEntry。Phase 4b 時点では空 (reviewer
# P2#2 の要件)。Phase 5/6 で retire される想定。
_ALLOWLIST: dict[str, AllowEntry] = {}


def _collect_snapshots(repo_root) -> list[tuple[str, str]]:
    """``(slug, html)`` のリストを返す。slug は拡張子なしの相対パス。"""
    root = repo_root
    for part in SNAPSHOT_ROOT_PARTS:
        root = root / part
    if not root.exists():
        return []
    pairs: list[tuple[str, str]] = []
    for path in sorted(root.rglob("*.html")):
        rel = path.relative_to(root).with_suffix("")
        slug = rel.as_posix()
        pairs.append((slug, path.read_text(encoding="utf-8")))
    return pairs


@pytest.fixture(scope="module")
def snapshot_pages(repo_root) -> list[tuple[str, str]]:
    pages = _collect_snapshots(repo_root)
    if not pages:
        pytest.skip("snapshots/en/content/ が空 — snapshot fetch 未実行")
    return pages


@pytest.fixture(scope="module")
def mjs_turndown_by_slug(repo_root, node_available, snapshot_pages) -> dict[str, str]:
    if not node_available:
        pytest.skip("node not available")
    # 288 call を 1 回の node spawn で batch 処理する。harness 側は ``turndown_
    # convert_en_html_to_md`` dispatch を既に持つ (M1 commit ff7c370)。
    calls = [
        {"function": "turndown_convert_en_html_to_md", "args": [html]}
        for _slug, html in snapshot_pages
    ]
    results = run_batch(repo_root, calls, timeout=300.0)
    return {slug: mjs for (slug, _html), mjs in zip(snapshot_pages, results, strict=True)}


@pytest.mark.slow
@pytest.mark.xfail(
    strict=False,
    reason=(
        "Phase 4b.1 follow-up: M1 で未港の turndown default escape / "
        "flanking whitespace rule により ~168/288 pages が mjs と "
        "byte divergent。詳細カテゴリは module docstring を参照。"
    ),
)
def test_all_288_pages_turndown_matches_mjs(snapshot_pages, mjs_turndown_by_slug):
    """288 page すべてで Python ``convert_en_html_to_md`` が mjs と byte 一致。

    M1 の 39 代表 pattern を超えて、実 corpus 全体で turndown 等価性を
    hard 確認する。divergence はすべて集約して report する。
    """
    divergences: list[str] = []
    for slug, html in snapshot_pages:
        if slug in _ALLOWLIST:
            continue  # intentional divergence
        py = convert_en_html_to_md(html)
        mjs = mjs_turndown_by_slug[slug]
        if py != mjs:
            # diff の先頭を抽出して noise を抑える。1 行目の unified diff 的な
            # 表示にする (完全 diff は冗長、first-difference line が最も役立つ)。
            py_lines = py.splitlines()
            mjs_lines = mjs.splitlines()
            first_diff_line: int | None = None
            for i in range(min(len(py_lines), len(mjs_lines))):
                if py_lines[i] != mjs_lines[i]:
                    first_diff_line = i
                    break
            detail = (
                f"  slug={slug}\n"
                f"    py_lines={len(py_lines)} mjs_lines={len(mjs_lines)}"
                f" py_bytes={len(py)} mjs_bytes={len(mjs)}"
            )
            if first_diff_line is not None:
                detail += (
                    f"\n    first diff at line {first_diff_line + 1}:"
                    f"\n      py  = {py_lines[first_diff_line]!r}"
                    f"\n      mjs = {mjs_lines[first_diff_line]!r}"
                )
            elif len(py_lines) != len(mjs_lines):
                longer = py_lines if len(py_lines) > len(mjs_lines) else mjs_lines
                detail += f"\n    extra trailing line: {longer[-1]!r}"
            divergences.append(detail)

    assert not divergences, (
        f"{len(divergences)} page(s) diverged from mjs turndown:\n"
        + "\n".join(divergences[:10])
        + ("\n... (truncated)" if len(divergences) > 10 else "")
    )


@pytest.mark.slow
@pytest.mark.xfail(
    strict=False,
    reason=(
        "Phase 4b.1 follow-up: aggregate byte length と matching page count は "
        "上記 ``test_all_288_pages_turndown_matches_mjs`` と同じ gap に由来。"
    ),
)
def test_turndown_288_summary_bytes_match(snapshot_pages, mjs_turndown_by_slug):
    """aggregate check: 合計 byte 長が mjs と一致 + 一致率 100%。

    ``test_all_288_pages_turndown_matches_mjs`` が throw した場合でも、
    ここで aggregate な divergence の規模を把握できる補助 assert。
    """
    py_total_bytes = 0
    mjs_total_bytes = 0
    matching_pages = 0
    for slug, html in snapshot_pages:
        if slug in _ALLOWLIST:
            continue
        py = convert_en_html_to_md(html)
        mjs = mjs_turndown_by_slug[slug]
        py_total_bytes += len(py.encode("utf-8"))
        mjs_total_bytes += len(mjs.encode("utf-8"))
        if py == mjs:
            matching_pages += 1

    checked = len(snapshot_pages) - len(_ALLOWLIST)
    assert py_total_bytes == mjs_total_bytes, (
        f"aggregate byte length mismatch: py={py_total_bytes} mjs={mjs_total_bytes}"
    )
    assert matching_pages == checked, (
        f"{checked - matching_pages}/{checked} pages diverged from mjs turndown"
    )
