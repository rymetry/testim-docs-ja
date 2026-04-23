"""Phase 6 atomic cutover self-enforcing gate (reviewer P1 対応)。

Phase 5 で mjs → pytest 移植中に、Python 版 extractor / align の挙動が mjs と
微妙に異なる slug (~16 件) が発覚した。Phase 5 時点では意図的に xfail として
隔離したが (``_PY_XFAIL_SLUGS`` / ``_PY_EXTRACTOR_DRIFT_SLUGS`` frozenset)、
Phase 6 atomic cutover を走らせる前に **全件解消する** ことが docs/
PYTHON_MIGRATION_PLAN.md Phase 6 の gate 条件に明記されている。

本 module は marker ``cutover`` つきの単一 test で全 exclusion frozenset を
enumerate し、empty でない限り fail する。Phase 5 coexistence 期間は default
skip (``pyproject.toml`` の ``addopts = "-m 'not slow and not cutover'"``)、
Phase 6 cutover PR で ``uv run pytest -m cutover`` を明示的に走らせて緑を確認
する運用。

**追加方法**: 新たに temporary exclusion frozenset を導入する PR では本 module
の ``_EXCLUSION_REGISTRY`` に entry を足すこと。これが Phase 6 gate の
single source of truth。
"""

from __future__ import annotations

from dataclasses import dataclass

import pytest


@dataclass(frozen=True)
class ExclusionEntry:
    """Phase 6 cutover で empty 化する temporary drift registry。

    Attributes:
        module: 所属 pytest module (dotted path、import 用)
        attribute: module 内で公開されている frozenset 属性名
        reason: なぜ Phase 5 で空にできなかったか (plan doc 相互参照の手がかり)
    """

    module: str
    attribute: str
    reason: str


# Phase 6 cutover で empty 化が required な temporary exclusion 一覧。
# docs/PYTHON_MIGRATION_PLAN.md の Phase 6 「Self-enforcing cutover gate」表と
# 1:1 で同期する (片方だけ変わると gate が緩む)。
_EXCLUSION_REGISTRY: tuple[ExclusionEntry, ...] = (
    ExclusionEntry(
        module="tests.test_clean_page_fixtures",
        attribute="_PY_XFAIL_SLUGS",
        reason="Python extractor / align の ~16 slug drift (alignment 細部 / token-drop recall)",
    ),
    ExclusionEntry(
        module="tests.test_structure_fixtures",
        attribute="_PY_XFAIL_SLUGS",
        reason="structure fixtures に現れる Python extractor drift (clean_page_fixtures と同根)",
    ),
    ExclusionEntry(
        module="tests.test_recall",
        attribute="_PY_EXTRACTOR_DRIFT_SLUGS",
        reason=(
            "advanced-editing/loops の JA unordered-list-item 欠落 / "
            "running-tests/running-tests-overview の token-drop 未検出"
        ),
    ),
    ExclusionEntry(
        module="tests.test_baseline_recall",
        attribute="_PY_EXTRACTOR_DRIFT_SLUGS",
        reason="recall drift (test_recall と同じ slug)",
    ),
    ExclusionEntry(
        module="tests.test_segments_boundary",
        attribute="_PY_EXTRACTOR_DRIFT_SLUGS",
        reason="advanced-editing/loops boundary stability drift",
    ),
)


def _collect_nonempty_exclusions() -> list[tuple[ExclusionEntry, frozenset[str]]]:
    """全 entry を import して、空でない frozenset を集める。

    import 失敗 (entry が削除された場合) も gate fail 対象 — drift を隠すための
    silent-delete を防ぐ。
    """
    nonempty: list[tuple[ExclusionEntry, frozenset[str]]] = []
    for entry in _EXCLUSION_REGISTRY:
        imported = __import__(entry.module, fromlist=[entry.attribute])
        exclusions = getattr(imported, entry.attribute)
        assert isinstance(exclusions, frozenset), (
            f"{entry.module}.{entry.attribute} must be frozenset, got {type(exclusions).__name__}"
        )
        if exclusions:
            nonempty.append((entry, exclusions))
    return nonempty


@pytest.mark.cutover
def test_all_drift_exclusions_are_empty() -> None:
    """Phase 6 gate: Python extractor / align drift が全て解消されたことを assert。

    `_PY_XFAIL_SLUGS` / `_PY_EXTRACTOR_DRIFT_SLUGS` 等の temporary frozenset が
    空でない限り fail する。Phase 6 cutover PR は本 test が緑で pass することを
    merge 条件とする (docs/PYTHON_MIGRATION_PLAN.md Phase 6 gate 8)。
    """
    nonempty = _collect_nonempty_exclusions()
    if not nonempty:
        return

    lines: list[str] = [
        "Phase 6 cutover blocked: temporary drift exclusions must all be empty.",
        "",
    ]
    for entry, slugs in nonempty:
        lines.append(f"  {entry.module}.{entry.attribute} ({len(slugs)} slug):")
        for slug in sorted(slugs):
            lines.append(f"    - {slug}")
        lines.append(f"    reason: {entry.reason}")
        lines.append("")
    lines.append(
        "Resolve Python extractor / align drift in a PR prior to Phase 6 cutover, "
        "then retire each frozenset by replacing it with ``frozenset()``."
    )
    pytest.fail("\n".join(lines))


@pytest.mark.cutover
def test_exclusion_registry_matches_plan_doc() -> None:
    """registry entry 数は plan doc の Phase 6 self-enforcing gate 表と一致する。

    plan doc 側の表と本 registry が drift すると gate の信頼性が崩れる。行数が
    変わったら plan doc + registry の両方を同 PR で update する契約。
    """
    # plan doc の Phase 6 「Self-enforcing cutover gate」表は 5 行 (test_*)。
    assert len(_EXCLUSION_REGISTRY) == 5, (
        "Registry drift: update both docs/PYTHON_MIGRATION_PLAN.md Phase 6 "
        "`Self-enforcing cutover gate` table and this registry in the same PR."
    )
