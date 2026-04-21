"""Phase 1 verification gate: 288-page segment extraction matrix。

``snapshots/en/content/**/*.html`` 全ページについて、mjs と Python の
``extract_segments_from_html`` 出力を byte 比較する。PYTHON_MIGRATION_PLAN.md
の Phase 1 verification gate:

    > 全 288+ snapshot ページで segments_en 出力を mjs と比較
    > 比較対象: segmentKind, sectionPath, segment 数が一致

本テストは **segment count + {segmentKind, sectionPath, textNorm,
tokensInvariant, segmentIndex} full equality** を hard 確認する。

mjs 側は 1 回の node プロセスで 288 call を batch 処理する (``harness.mjs``
の batch dispatch 契約)。288 個を逐次 spawn すると ~30s かかるため、
fixture scope=module で batch を 1 度だけ実行する。

## Allowlist lifecycle (architect review H3)

``_ALLOWLIST`` は intentional divergence を吸収するための slug 台帳。現状は
**空**。将来、Phase 2 (JA extractor) が EN 側と異なる segmentation を意図的
に emit する時などに entry を追加する。Entry の shape:

    {slug: AllowEntry(reason="...", expires_at_phase="phaseN", linked_issue="#123")}

運用ルール:

1. 追加時は ``reason`` を必ず明記する (parity 変更の理由 / 対応する上流欠陥)
2. ``expires_at_phase`` は「この divergence が解消されるべき Phase」。Phase N
   完了時に必ず見直して、不要なら削除する
3. 288-matrix 自体の役割は Phase 4 (pipeline wiring) まで。Phase 5 の
   aggregate-counter gate へ移行したタイミングで本 test は retire する想定
   (plan ``docs/PYTHON_MIGRATION_PLAN.md`` Phase 5 tier 戦略)
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from testim_parity.segments_en import CALLOUT_NORMALIZATION_SLUGS, extract_segments_from_html

from ._harness import run_batch

SNAPSHOT_ROOT_PARTS = ("snapshots", "en", "content")


@dataclass(frozen=True)
class AllowEntry:
    """intentional divergence 1 件分の台帳エントリ。

    ``reason`` / ``expires_at_phase`` / ``linked_issue`` を必須化することで、
    allow list がサイレントに肥大化するのを防ぐ (architect review H3)。
    """

    reason: str
    expires_at_phase: str
    linked_issue: str | None = None


# Intentional divergence 台帳。slug (SNAPSHOT_ROOT からの相対 path) → AllowEntry。
# 空でキープするのが理想。entry を追加する場合は必ず reason / expires_at_phase を
# 明記し、対応 Phase 完了時に retire する (docstring の lifecycle 節参照)。
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
def mjs_segments_by_slug(repo_root, node_available, snapshot_pages) -> dict[str, list]:
    if not node_available:
        pytest.skip("node not available")
    # 288 call を 1 回の node spawn で batch 処理する。harness は batch-per-
    # process 契約なので、これで startup コストが amortize される。
    calls = [
        {"function": "segments_en_extract", "args": [html, slug]} for slug, html in snapshot_pages
    ]
    results = run_batch(repo_root, calls, timeout=300.0)
    return {slug: mjs for (slug, _html), mjs in zip(snapshot_pages, results, strict=True)}


def test_all_288_pages_match(snapshot_pages, mjs_segments_by_slug):
    """288 page すべてで Python segment list が mjs と byte 一致。

    Divergence が出たページは集約して失敗 message に出す (1 件ずつ失敗させる
    と最初の 1 件で stop するため全体像が掴めない)。
    """
    divergences: list[str] = []
    for slug, html in snapshot_pages:
        if slug in _ALLOWLIST:
            continue  # intentional divergence
        # production caller と同じ shape で callout allow list を明示的に渡す
        # (review H4: Python default は None = no normalization で mjs と揃えた
        # ため、test 側が production API 契約をシミュレートする)。
        py = extract_segments_from_html(
            html, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
        )
        mjs = mjs_segments_by_slug[slug]
        if py != mjs:
            # diff 要点のみ抽出して noise を抑える
            py_count = len(py)
            mjs_count = len(mjs)
            first_diff_idx: int | None = None
            for i in range(min(py_count, mjs_count)):
                if py[i] != mjs[i]:
                    first_diff_idx = i
                    break
            detail = f"  slug={slug}\n    py_count={py_count} mjs_count={mjs_count}"
            if first_diff_idx is not None:
                detail += (
                    f"\n    first diff at index {first_diff_idx}:"
                    f"\n      py  = {py[first_diff_idx]!r}"
                    f"\n      mjs = {mjs[first_diff_idx]!r}"
                )
            elif py_count != mjs_count:
                # どちらか長いほうの末尾を参考に出す
                longer = py if py_count > mjs_count else mjs
                detail += f"\n    extra trailing segment: {longer[-1]!r}"
            divergences.append(detail)

    assert not divergences, f"{len(divergences)} page(s) diverged from mjs:\n" + "\n".join(
        divergences[:10]
    )


def test_segment_counts_and_kinds_summary(snapshot_pages, mjs_segments_by_slug):
    """summary-level check: 合計 segment 数と kind 分布が mjs と一致。

    ``test_all_288_pages_match`` が throw した場合でも、ここで aggregate な
    divergence 把握ができるよう補助 assert を置く。
    """
    py_total = 0
    mjs_total = 0
    py_kinds: dict[str, int] = {}
    mjs_kinds: dict[str, int] = {}
    for slug, html in snapshot_pages:
        # production caller と同じ shape で callout allow list を明示的に渡す
        # (review H4: Python default は None = no normalization で mjs と揃えた
        # ため、test 側が production API 契約をシミュレートする)。
        py = extract_segments_from_html(
            html, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
        )
        mjs = mjs_segments_by_slug[slug]
        py_total += len(py)
        mjs_total += len(mjs)
        for s in py:
            py_kinds[s["segmentKind"]] = py_kinds.get(s["segmentKind"], 0) + 1
        for s in mjs:
            mjs_kinds[s["segmentKind"]] = mjs_kinds.get(s["segmentKind"], 0) + 1
    assert py_total == mjs_total, f"total segment count mismatch: py={py_total} mjs={mjs_total}"
    assert py_kinds == mjs_kinds, f"kind distribution mismatch:\n  py={py_kinds}\n  mjs={mjs_kinds}"
