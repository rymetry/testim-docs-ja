"""``generate_parity_baseline`` CLI の end-to-end byte parity test.

Phase 4b M5: Python CLI (``testim_parity.detection.generate_parity_baseline``)
と mjs CLI (``scripts/detection/generate_parity_baseline.mjs``) が同じ
``parity-check-status.json`` / ``snapshot-diff-status.json`` / snapshots 入力に
対して byte-identical の:

- ``parity-baseline.json`` (schemaVersion, generatedAt, generatedFromRunId,
  rationale, entries の deterministic serialization)
- pre-regen gate の pass/fail (``--regenerate`` 時のみ)

を生成することを検証する。mjs CLI 自体は ``ROOT_DIR`` が script location 固定
なので、exported ``assertFullParityStatus`` / ``loadSnapshotDiffStatus`` /
``assertPreRegenGate`` / ``buildFingerprintMap`` / ``buildGenerationMeta`` /
``buildBaselineFromStatus`` / ``mergePartialBaseline`` /
``mergePartialBaselineByType`` / ``validateBaseline`` / ``serializeBaseline``
を使って driver ``.mjs`` で CLI orchestration をそのまま再現し、同じ
tmp_path 入力を食わせる。

**volatile 正規化**: 生成される baseline は deterministic (``generatedAt`` は
入力 ``summary.checkedAt`` で固定、``generatedFromRunId`` も同じ) なので
volatile field は無し。byte-identical 比較をそのまま行う。
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

import pytest

import testim_parity.detection.generate_parity_baseline as gpb_mod

_DRIVER_SCRIPT = """\
import {{ readFileSync, writeFileSync, existsSync }} from 'node:fs';
import {{
  assertFullParityStatus,
  loadSnapshotDiffStatus,
  assertPreRegenGate,
  buildFingerprintMap,
  buildGenerationMeta,
  buildBaselineFromStatus,
  mergePartialBaseline,
  mergePartialBaselineByType,
  serializeBaseline,
}} from '{gpb_mjs}';
import {{
  loadBaselineFile,
  validateBaseline,
}} from '{baseline_lib_mjs}';

const ROOT = {root_json};
const ARGS = {args_json};

const STATUS_PATH = `${{ROOT}}/parity-check-status.json`;
const BASELINE_PATH = `${{ROOT}}/parity-baseline.json`;
const SNAPSHOT_DIFF_PATH = `${{ROOT}}/snapshot-diff-status.json`;
const SNAPSHOTS_DIR = `${{ROOT}}/snapshots/en/content`;

async function main() {{
  if (!existsSync(STATUS_PATH)) {{
    console.error(`❌ ${{STATUS_PATH}} not found`);
    return 1;
  }}
  const status = JSON.parse(readFileSync(STATUS_PATH, 'utf8'));
  assertFullParityStatus(status);

  if (ARGS.regenerate) {{
    const snapshotDiff = loadSnapshotDiffStatus(SNAPSHOT_DIFF_PATH);
    assertPreRegenGate(status, snapshotDiff);
  }}

  const fingerprintMap = buildFingerprintMap(SNAPSHOTS_DIR);
  const meta = buildGenerationMeta(status, ARGS);

  let output;
  if (ARGS.regenerate) {{
    output = buildBaselineFromStatus(status, fingerprintMap, meta);
  }} else if (ARGS.types) {{
    const newBaseline = buildBaselineFromStatus(status, fingerprintMap, meta);
    let existing = {{
      schemaVersion: 2,
      generatedAt: meta.generatedAt,
      generatedFromRunId: '',
      rationale: '',
      entries: [],
    }};
    if (existsSync(BASELINE_PATH)) {{
      existing = loadBaselineFile(BASELINE_PATH);
    }}
    output = mergePartialBaselineByType(existing, ARGS.types, newBaseline.entries, {{
      generatedAt: meta.generatedAt,
      generatedFromRunId: meta.runId,
      rationale: meta.rationale,
    }});
  }} else {{
    const slugSet = new Set(ARGS.slugs);
    const fileEntryToSlug = (p) => p.replace(/^src\\/content\\/docs\\//, '').replace(/\\.md$/, '');
    const filtered = {{
      ...status,
      files: (status.files ?? []).filter((f) => slugSet.has(fileEntryToSlug(f.file))),
    }};
    const newBaseline = buildBaselineFromStatus(filtered, fingerprintMap, meta);
    let existing = {{
      schemaVersion: 2,
      generatedAt: meta.generatedAt,
      generatedFromRunId: '',
      rationale: '',
      entries: [],
    }};
    if (existsSync(BASELINE_PATH)) {{
      existing = loadBaselineFile(BASELINE_PATH);
    }}
    output = mergePartialBaseline(existing, ARGS.slugs, newBaseline.entries, {{
      generatedAt: meta.generatedAt,
      generatedFromRunId: meta.runId,
      rationale: meta.rationale,
    }});
  }}

  validateBaseline(output);
  const serialized = serializeBaseline(output);
  writeFileSync(BASELINE_PATH, serialized);
  process.stdout.write(`entries=${{output.entries.length}}\\n`);
  return 0;
}}

try {{
  const code = await main();
  process.exit(code);
}} catch (err) {{
  console.error(`❌ generate_parity_baseline error: ${{err.message}}`);
  process.exit(1);
}}
"""


def _write_driver(
    tmp_path: Path,
    repo_root: Path,
    *,
    args: dict[str, Any],
) -> Path:
    gpb_mjs = repo_root / "scripts" / "detection" / "generate_parity_baseline.mjs"
    baseline_lib_mjs = repo_root / "scripts" / "lib" / "source_parity_baseline.mjs"
    driver_src = _DRIVER_SCRIPT.format(
        gpb_mjs=gpb_mjs.as_posix(),
        baseline_lib_mjs=baseline_lib_mjs.as_posix(),
        root_json=json.dumps(str(tmp_path)),
        args_json=json.dumps(args),
    )
    driver_path = tmp_path / "_driver.mjs"
    driver_path.write_text(driver_src, encoding="utf-8")
    return driver_path


def _run_mjs(driver: Path, repo_root: Path) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["node", str(driver)],
        capture_output=True,
        text=True,
        check=False,
        cwd=str(repo_root),
        timeout=60,
    )
    return proc.returncode, proc.stdout, proc.stderr


def _write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _full_parity_status_pass(
    *,
    checked_at: str = "2026-04-22T10:00:00Z",
    with_issue: bool = False,
    slug: str = "overview/intro",
) -> dict[str, Any]:
    """pre-regen gate を pass する minimal full-run parity status。"""
    status: dict[str, Any] = {
        "schemaVersion": 1,
        "summary": {
            "checkedAt": checked_at,
            "result": "pass",
            "runScope": {"isComplete": True},
            "freshnessState": "fresh",
            "linkageState": "linked",
            "orphanBaselineEntries": 0,
            "checkedFiles": 1 if with_issue else 0,
            "totalFiles": 1 if with_issue else 0,
        },
        "debug": {"patchCoverage": {"mismatches": []}},
        "files": [],
        "advisoryQueue": [],
        "advisoryQueueScope": {"isComplete": True, "type": "all", "filters": {}},
    }
    if with_issue:
        status["files"] = [
            {
                "file": f"src/content/docs/{slug}.md",
                "issues": [
                    {
                        "type": "section-structure-mismatch",
                        "sectionPath": "intro",
                        "sectionIndex": 0,
                        "structureCategory": "kind-multiset",
                        "enKinds": ["heading", "paragraph"],
                        "jaKinds": ["heading"],
                        "contentPermutation": None,
                    }
                ],
            }
        ]
    return status


def _snapshot_diff_clean(checked_at: str = "2026-04-22T10:00:00Z") -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "checkedAt": checked_at,
        "runId": "snap-run-1",
        "sourceSyncRunId": None,
        "summary": {
            "changed": 0,
            "added": 0,
            "removed": 0,
            "unchanged": 0,
            "totalSnapshots": 0,
        },
        "changes": [],
        "runScope": {"isComplete": True},
    }


def _write_snapshot(tmp_path: Path, slug: str, content: str = "<p>fixture</p>") -> None:
    target = tmp_path / "snapshots" / "en" / "content" / f"{slug}.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def _setup_tmp(tmp_path: Path, *, with_issue: bool = True, slug: str = "overview/intro") -> None:
    _write_json(
        tmp_path / "parity-check-status.json",
        _full_parity_status_pass(with_issue=with_issue, slug=slug),
    )
    _write_json(tmp_path / "snapshot-diff-status.json", _snapshot_diff_clean())
    if with_issue:
        _write_snapshot(tmp_path, slug)


def _run_py(monkeypatch: pytest.MonkeyPatch, tmp_path: Path, argv: list[str]) -> int:
    monkeypatch.setattr(gpb_mod, "_STATUS_PATH", tmp_path / "parity-check-status.json")
    monkeypatch.setattr(gpb_mod, "_BASELINE_PATH", tmp_path / "parity-baseline.json")
    monkeypatch.setattr(gpb_mod, "_SNAPSHOT_DIFF_PATH", tmp_path / "snapshot-diff-status.json")
    monkeypatch.setattr(gpb_mod, "_SNAPSHOTS_DIR", tmp_path / "snapshots" / "en" / "content")
    return gpb_mod.main(argv)


@pytest.mark.integration
def test_generate_parity_baseline_regenerate_parity(
    tmp_path: Path,
    repo_root: Path,
    node_available: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """``--regenerate`` モード: pre-regen gate pass + 1 entry 生成を両 CLI で
    byte-identical に比較する。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    _setup_tmp(py_tmp, with_issue=True)
    _setup_tmp(mjs_tmp, with_issue=True)

    py_code = _run_py(monkeypatch, py_tmp, ["--regenerate"])
    assert py_code == 0

    driver = _write_driver(
        mjs_tmp,
        repo_root,
        args={"regenerate": True, "slugs": None, "types": None, "rationale": None},
    )
    mjs_code, _mjs_out, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"

    py_bytes = (py_tmp / "parity-baseline.json").read_bytes()
    mjs_bytes = (mjs_tmp / "parity-baseline.json").read_bytes()
    assert py_bytes == mjs_bytes, "parity-baseline.json byte drift (--regenerate)"


@pytest.mark.integration
def test_generate_parity_baseline_slug_mode_parity(
    tmp_path: Path,
    repo_root: Path,
    node_available: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """``--slug=<csv>`` モード: 既存 baseline の non-target slug は保持され
    target slug のみ差し替わる挙動を両 CLI で byte-identical に比較する。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    slug = "overview/intro"
    _setup_tmp(py_tmp, with_issue=True, slug=slug)
    _setup_tmp(mjs_tmp, with_issue=True, slug=slug)

    # 既存 baseline: other slug 1 + target slug 1 (stale)。
    fp_keep = "sha256:" + ("a" * 64)
    fp_stale = "sha256:" + ("b" * 64)
    sfp_keep = "sha256:" + ("c" * 64)
    sfp_stale = "sha256:" + ("d" * 64)
    existing_baseline = {
        "schemaVersion": 2,
        "generatedAt": "2026-04-20T00:00:00Z",
        "generatedFromRunId": "previous-run",
        "rationale": "prior",
        "entries": [
            {
                "slug": "overview/other",
                "issueType": "section-structure-mismatch",
                "snapshotFingerprint": fp_keep,
                "priority": "medium",
                "sectionPath": "intro",
                "segmentKind": None,
                "enSegmentIndex": None,
                "jaSegmentIndex": None,
                "enSourceFingerprint": None,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": 0,
                "structureCategory": "kind-sequence",
                "structureFingerprint": sfp_keep,
            },
            {
                "slug": slug,
                "issueType": "section-structure-mismatch",
                "snapshotFingerprint": fp_stale,
                "priority": "medium",
                "sectionPath": "old",
                "segmentKind": None,
                "enSegmentIndex": None,
                "jaSegmentIndex": None,
                "enSourceFingerprint": None,
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": 9,
                "structureCategory": "kind-sequence",
                "structureFingerprint": sfp_stale,
            },
        ],
    }
    (py_tmp / "parity-baseline.json").write_text(
        json.dumps(existing_baseline, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (mjs_tmp / "parity-baseline.json").write_text(
        json.dumps(existing_baseline, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    py_code = _run_py(monkeypatch, py_tmp, [f"--slug={slug}"])
    assert py_code == 0

    driver = _write_driver(
        mjs_tmp,
        repo_root,
        args={"regenerate": False, "slugs": [slug], "types": None, "rationale": None},
    )
    mjs_code, _mjs_out, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"

    py_bytes = (py_tmp / "parity-baseline.json").read_bytes()
    mjs_bytes = (mjs_tmp / "parity-baseline.json").read_bytes()
    assert py_bytes == mjs_bytes, "parity-baseline.json byte drift (--slug)"


@pytest.mark.integration
def test_generate_parity_baseline_types_mode_parity(
    tmp_path: Path,
    repo_root: Path,
    node_available: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """``--types=<csv>`` モード: 指定 issueType のみ再生成、他 issueType は bit-identical
    で残ることを両 CLI で byte-identical に比較する。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    slug = "overview/intro"
    _setup_tmp(py_tmp, with_issue=True, slug=slug)
    _setup_tmp(mjs_tmp, with_issue=True, slug=slug)

    # 既存 baseline: 別 issueType (segment-missing) の entry を残しつつ、
    # 新しい section-structure-mismatch entry が追加される挙動を検証。
    fp_keep = "sha256:" + ("a" * 64)
    existing_baseline = {
        "schemaVersion": 2,
        "generatedAt": "2026-04-20T00:00:00Z",
        "generatedFromRunId": "previous-run",
        "rationale": "prior",
        "entries": [
            {
                "slug": "overview/other",
                "issueType": "segment-missing",
                "snapshotFingerprint": fp_keep,
                "priority": "medium",
                "sectionPath": "body",
                "segmentKind": "paragraph",
                "enSegmentIndex": 0,
                "jaSegmentIndex": None,
                "enSourceFingerprint": "sha256:" + ("e" * 64),
                "jaSourceFingerprint": None,
                "missingTokens": None,
                "sectionIndex": None,
                "structureCategory": None,
                "structureFingerprint": None,
            },
        ],
    }
    (py_tmp / "parity-baseline.json").write_text(
        json.dumps(existing_baseline, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (mjs_tmp / "parity-baseline.json").write_text(
        json.dumps(existing_baseline, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    py_code = _run_py(monkeypatch, py_tmp, ["--types=section-structure-mismatch"])
    assert py_code == 0

    driver = _write_driver(
        mjs_tmp,
        repo_root,
        args={
            "regenerate": False,
            "slugs": None,
            "types": ["section-structure-mismatch"],
            "rationale": None,
        },
    )
    mjs_code, _mjs_out, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"

    py_bytes = (py_tmp / "parity-baseline.json").read_bytes()
    mjs_bytes = (mjs_tmp / "parity-baseline.json").read_bytes()
    assert py_bytes == mjs_bytes, "parity-baseline.json byte drift (--types)"


@pytest.mark.integration
def test_generate_parity_baseline_rationale_override_parity(
    tmp_path: Path,
    repo_root: Path,
    node_available: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """``--rationale`` override が両 CLI で同じ rationale 文字列を出力する。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    py_tmp = tmp_path / "py"
    mjs_tmp = tmp_path / "mjs"
    py_tmp.mkdir()
    mjs_tmp.mkdir()

    _setup_tmp(py_tmp, with_issue=False)
    _setup_tmp(mjs_tmp, with_issue=False)

    rationale = "custom rationale for E2E test"
    py_code = _run_py(monkeypatch, py_tmp, ["--regenerate", f"--rationale={rationale}"])
    assert py_code == 0

    driver = _write_driver(
        mjs_tmp,
        repo_root,
        args={"regenerate": True, "slugs": None, "types": None, "rationale": rationale},
    )
    mjs_code, _mjs_out, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_code == 0, f"mjs stderr: {mjs_stderr}"

    py_bytes = (py_tmp / "parity-baseline.json").read_bytes()
    mjs_bytes = (mjs_tmp / "parity-baseline.json").read_bytes()
    assert py_bytes == mjs_bytes, "parity-baseline.json byte drift (--rationale)"
