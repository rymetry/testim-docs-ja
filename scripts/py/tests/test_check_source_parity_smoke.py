"""Python ``check_source_parity`` full-repo smoke test.

PR A (``MaskCoverage`` blocker 修正) の acceptance gate として、実 ``ROOT_DIR``
に対して Python CLI を走らせ、以下を pin する:

- **CLI が例外なく完走**し、``parity-check-status.json`` を書き出す
- **payload schema が valid** (``summary`` / ``debug`` 等の必須 key 存在)
- **``debug.maskCoverage`` が正しい shape** (PR A の ``MaskCoverage.to_json()``
  output が ``parity-check-status.json`` 契約を壊していない)

5-counter DoD (``reportableActiveFiles == 0`` 等) は **Phase 5 coexistence 中**
は Python extractor drift (``tests/test_cutover_gate.py`` の
``_PY_XFAIL_SLUGS`` / ``_PY_EXTRACTOR_DRIFT_SLUGS``) により満たせない。
そのため 5-counter 0 assertion は独立 test として ``@pytest.mark.cutover``
で Phase 6b gate に括り出し (既存 ``test_cutover_gate.py`` と対称)、default
CI では skip する (``pyproject.toml`` の ``addopts`` が ``not cutover`` を付与)。

Phase 5 では Node ``scripts/detection/check_source_parity.mjs`` が production
gate、Python 版はこの smoke test でのみ production 経路を通す (Phase 6b
atomic cutover で入れ替わる)。
"""

from __future__ import annotations

import io
import json

import pytest

from testim_parity.detection.check_source_parity import check_source_parity
from testim_parity.project import ROOT_DIR

_EXPECTED_SUMMARY_KEYS = {
    "reportableActiveFiles",
    "baselinedIssues",
    "advisoryQueueIssues",
    "auditSignalIssues",
    "activeFiles",
    "totalFiles",
    "checkedFiles",
    "filesWithIssues",
    "result",
}
"""``parity-check-status.json`` ``summary`` の必須 key (5-counter + 代表 field)。

mjs 版と Python 版で共通の schema contract。PR A で shape 破壊が無いことを
schema-level で pin する (値までは assert しない ― Phase 5 の drift 分は
5-counter 専用 test に分離)。"""


@pytest.fixture(scope="module")
def full_repo_parity_payload(tmp_path_factory: pytest.TempPathFactory) -> dict:
    """Python ``check_source_parity`` を real ``ROOT_DIR`` に対して **module
    単位で 1 回だけ** 走らせ、payload dict を module 内 test で共有する。

    CLI 単発で ~10 分かかる (288 page 走査) ため、各 test が個別に CLI を
    叩くと smoke 全体で 20 分超になる。module-scope fixture で amortize する。

    Phase 5 coexistence 中は Python extractor drift の関係で 5-counter が 0
    に満たない可能性があるが、fixture 自体は payload の **生成** を pin する
    だけで、値の assertion は各 test 側で行う契約。
    """
    tmp_path = tmp_path_factory.mktemp("parity_smoke")
    output_path = tmp_path / "parity-check-status.json"
    source_sync_path = tmp_path / "source-sync-status.json"
    snapshot_diff_path = tmp_path / "snapshot-diff-status.json"
    run_id = "cutover-smoke-linked-run"
    inventory_fingerprint = "sha256:" + ("0" * 64)
    run_scope = {
        "type": "full",
        "isComplete": True,
        "filters": {"slug": None, "section": None},
    }
    source_sync_path.write_text(
        json.dumps(
            {
                "schemaVersion": 2,
                "runId": run_id,
                "checkedAt": "2026-04-25T00:00:00.000Z",
                "freshnessState": "fresh",
                "sourceInventoryFingerprint": inventory_fingerprint,
                "sidebarFingerprint": "sha256:" + ("1" * 64),
                "runScope": run_scope,
                "summary": {
                    "sidebarVerified": True,
                    "excludedPages": 0,
                    "excludedBrokenPages": 0,
                    "excludedRecoveredPages": 0,
                },
                "pages": [],
                "errors": [],
            }
        ),
        encoding="utf-8",
    )
    snapshot_diff_path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "runId": "cutover-smoke-snapshot-diff",
                "sourceSyncRunId": run_id,
                "checkedAt": "2026-04-25T00:00:00.000Z",
                "sourceInventoryFingerprint": inventory_fingerprint,
                "runScope": run_scope,
                "summary": {},
                "changes": [],
            }
        ),
        encoding="utf-8",
    )
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()

    exit_code = check_source_parity(
        root_dir=ROOT_DIR,
        output_path=output_path,
        source_sync_status_path=source_sync_path,
        snapshot_diff_status_path=snapshot_diff_path,
        stdout=stdout_buf,
        stderr=stderr_buf,
        json_out=True,
    )
    assert output_path.exists(), (
        f"parity-check-status.json が書き出されていない "
        f"(exit={exit_code}, stderr: {stderr_buf.getvalue()[:500]})"
    )
    return json.loads(output_path.read_text(encoding="utf-8"))


@pytest.mark.parity_smoke
def test_python_cli_produces_schema_valid_payload(full_repo_parity_payload: dict) -> None:
    """Python ``check_source_parity`` が real repo に対して例外なく完走し、
    ``parity-check-status.json`` の schema contract (summary 必須 key +
    top-level 構造) を維持していることを pin する。

    PR A (``MaskCoverage`` object 化) の **regression guard**: CLI 経路 /
    payload shape / maskCoverage の serialize output が壊れていないことを
    end-to-end で確認する。5-counter の **値** は Phase 5 drift があり得るため
    ここでは assert しない (別 test で ``@pytest.mark.cutover`` gate)。
    """
    payload = full_repo_parity_payload

    # Top-level schema
    assert "schemaVersion" in payload, "payload must include schemaVersion"
    assert "summary" in payload, "payload must include summary"
    assert "files" in payload, "payload must include files"
    assert "debug" in payload, "payload must include debug"

    # summary 必須 key (mjs との schema 契約)
    summary = payload["summary"]
    missing = _EXPECTED_SUMMARY_KEYS - set(summary.keys())
    assert not missing, (
        f"summary missing keys (schema drift from mjs contract): {sorted(missing)}. "
        f"Present keys: {sorted(summary.keys())}"
    )


@pytest.mark.parity_smoke
def test_python_cli_produces_mask_coverage_valid_shape(full_repo_parity_payload: dict) -> None:
    """``debug.maskCoverage`` が ``MaskCoverage.to_json()`` の契約 shape
    (``maskedSegments`` list + ``summary`` dict with 3 key) に従っていることを
    pin する。

    PR A の **本質的 regression guard**: dict→class refactor が JSON serialize
    output を byte-level で破壊していないことを real-repo 経由で確認する。
    """
    mask_coverage = full_repo_parity_payload["debug"]["maskCoverage"]

    assert isinstance(mask_coverage, dict), (
        f"debug.maskCoverage must be a dict (MaskCoverage.to_json() output). "
        f"Got {type(mask_coverage).__name__}"
    )
    assert isinstance(mask_coverage.get("maskedSegments"), list), (
        "maskCoverage.maskedSegments must be a list"
    )
    assert isinstance(mask_coverage.get("summary"), dict), "maskCoverage.summary must be a dict"

    mask_summary = mask_coverage["summary"]
    for key in ("segmentsMasked", "byGlossaryEntry", "byInvariantPattern"):
        assert key in mask_summary, (
            f"maskCoverage.summary must include {key!r} (MaskCoverage.to_json() 契約)"
        )
    assert isinstance(mask_summary["segmentsMasked"], int)
    assert isinstance(mask_summary["byGlossaryEntry"], dict)
    assert isinstance(mask_summary["byInvariantPattern"], dict)

    # 個別 masked segment entry の shape
    for entry in mask_coverage["maskedSegments"]:
        for key in ("slug", "segmentKind", "sectionPath", "masks"):
            assert key in entry, f"maskedSegments entry must include {key!r}"
        assert isinstance(entry["masks"], list)


@pytest.mark.cutover
@pytest.mark.parity_smoke
def test_python_cli_five_counter_dod_passes_full_repo(full_repo_parity_payload: dict) -> None:
    """Phase 6b cutover gate: Python CLI が real repo に対して
    **5-counter = 0 DoD** (CLAUDE.md §コア不変量) を満たすことを pin する。

    Phase 5 coexistence 中は Python extractor drift (``_PY_XFAIL_SLUGS`` /
    ``_PY_EXTRACTOR_DRIFT_SLUGS``) により reportableActiveFiles > 0 になる
    ため default run では **``cutover`` marker 経由で skip** する (pyproject
    ``addopts`` が ``not cutover`` を付与)。

    Phase 6b atomic cutover PR 内で ``uv run pytest -m cutover`` を 1 回限り
    強制 run して緑確認する ― 既存 ``test_cutover_gate.py::test_all_drift_exclusions_are_empty``
    と同じ self-enforcing gate パターン。

    5-counter = 0 DoD:

    1. ``parity-baseline.json`` ``entries.length`` === 0
    2. ``summary.reportableActiveFiles`` === 0
    3. ``summary.baselinedIssues`` === 0
    4. ``summary.advisoryQueueIssues`` === 0
    5. ``summary.auditSignalIssues`` === 0
    """
    baseline_path = ROOT_DIR / "parity-baseline.json"
    assert baseline_path.exists(), f"parity-baseline.json not found at {baseline_path}"
    baseline_data = json.loads(baseline_path.read_text(encoding="utf-8"))
    assert len(baseline_data.get("entries", [])) == 0, (
        "Counter 1: parity-baseline.json entries.length must be 0 "
        f"(got {len(baseline_data.get('entries', []))})"
    )

    summary = full_repo_parity_payload["summary"]
    for idx, counter_name in enumerate(
        (
            "reportableActiveFiles",
            "baselinedIssues",
            "advisoryQueueIssues",
            "auditSignalIssues",
        ),
        start=2,
    ):
        actual = summary.get(counter_name)
        assert actual == 0, (
            f"Counter {idx}: summary.{counter_name} must be 0 (5-counter DoD). Got {actual!r}."
        )

    assert summary.get("result") == "pass", (
        f"summary.result must be 'pass' when all 5 counters are 0. Got {summary.get('result')!r}."
    )
