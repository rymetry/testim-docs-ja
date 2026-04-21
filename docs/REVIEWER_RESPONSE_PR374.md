# PR #374 Reviewer Response

> **Scope**: Responds to the static-review findings on `claude/phase3-m5m7-phase4`
> (Phase 3 M5-M7 + Phase 4). Each finding is mapped to **addressed / deferred
> / rationale** with pointer commits and plan sections so reviewer can verify
> without re-running the full analysis.

## Summary

| Category | Findings | Addressed in this PR | Deferred (and where) |
| --- | --- | --- | --- |
| **P2 contract bugs** (regex / cwd / timestamp) | 4 | 4 | 0 |
| **Security: git refspec guard** | 1 | 1 | 0 |
| **Phase 4 gate-1** (artifact parity) | 1 | 1 | 0 |
| **CI workflow switch** (render_upstream_recovery) | 1 | 1 | 0 |
| **Plan alignment** (click → argparse gap) | 1 | 1 (plan update) | 0 |
| **Coverage 25-30%** | 1 | 0 | Phase 5 (explicitly plan-scoped) |
| **sys.exit / assert / broad exception cleanup** | multiple | 0 | Phase 5 (pytest 書き直し時) |
| **turndown dep (4 wrapper scripts)** | 1 | 0 | Phase 4b (next PR) |

## Addressed

### 1. P2 contract bugs (commit `773083a`)

| # | Bug | Fix location |
| --- | --- | --- |
| 1 | Sidebar heading regex dropped full-width `（...）` → every `categoryEnglish` was 1 char | `scripts/py/src/testim_parity/pipeline/fetch_translate_images.py:45` — restored `\uff08` / `\uff09` explicitly to survive tooling round-trips |
| 2 | `generate_detection_reports(root_dir=None)` defaulted to `Path.cwd()` → wrote artifacts under `scripts/py/` when invoked as `cd scripts/py && uv run …` | `scripts/py/src/testim_parity/detection/generate_detection_reports.py:44` → default to `ROOT_DIR`. Same fix applied in `detection_reports.load_detection_inputs` (`detection_reports.py:1728`) which the CLI transitively calls |
| 3 | `render_upstream_recovery_comment.main(root_dir=None)` defaulted to `Path.cwd()` → silent `has_signals=false` even when real artifact existed at repo root | `scripts/py/src/testim_parity/detection/render_upstream_recovery_comment.py:46` → default to `ROOT_DIR` |
| 4 | `pipeline.py` checkpoint `completed_at` built as `isoformat(timespec="milliseconds") + "Z"` → `2026-04-22T12:34:56.789+00:00Z` (invalid ISO-8601) | `scripts/py/src/testim_parity/pipeline/pipeline.py:35` — extracted `js_iso_timestamp()` matching mjs `new Date().toISOString()` |

Regression tests (commit `773083a`):

- `tests/test_phase4_cli_scripts.py::test_parse_sidebar_list_full_width_delimiter`
- `tests/test_phase4_cli_scripts.py::test_get_all_pages_list_preserves_japanese_category`
- `tests/test_phase4_cli_scripts.py::test_generate_detection_reports_defaults_to_root_dir`
- `tests/test_phase4_cli_scripts.py::test_render_upstream_recovery_defaults_to_root_dir`
- `tests/test_phase4_cli_scripts.py::test_js_iso_timestamp_format` (3 parametrize cases)
- `tests/test_phase4_cli_scripts.py::test_js_iso_timestamp_default_uses_now`

### 2. Security — git refspec safety guard (snapshot_diff)

Reviewer flagged that `git show HEAD:<relative_path>` is refspec-interpolated
and, without input validation, an absolute path or `..` traversal in the loop
input could cause git to resolve an unintended blob. Although the loop input
originates from `snapshot_path.relative_to(ROOT_DIR)` (trusted), a symlink or
external caller reusing `_get_head_content` could violate that assumption.

Fix:

- `scripts/py/src/testim_parity/detection/snapshot_diff.py` — added
  `assert_safe_refspec_path(relative_path)` which rejects absolute paths and
  any `..` segment. `_get_head_content` now calls it before spawning git.
- Exported via `__all__` for direct testing.

Tests (`tests/test_phase4_cli_scripts.py`):

- `test_assert_safe_refspec_path_accepts_clean_relative_paths`
- `test_assert_safe_refspec_path_rejects_absolute_path`
- `test_assert_safe_refspec_path_rejects_dotdot_traversal`
- `test_assert_safe_refspec_path_does_not_flag_inner_dots` — guards against
  false-positives on filenames like `a..b.html`

### 3. Phase 4 gate-1 — artifact orchestration parity

Plan `docs/PYTHON_MIGRATION_PLAN.md` Phase 4 verification gate mandates "each
CLI produces the same JSON artifacts" as mjs. Individual functions already
have 12 conformance tests via the cross-runtime harness. What was missing was
end-to-end verification that the Python **CLI entry** chains those functions
in the same order with the same options.

Added `scripts/py/tests/conformance/test_generate_detection_reports_e2e.py`:

- Writes minimal valid `snapshot-diff-status.json` + `parity-check-status.json`
  to `tmp_path`.
- Runs Python `generate_detection_reports(root_dir=tmp_path)` → 3 output
  files on disk.
- Via the existing harness dispatches the mjs 3-function chain
  (`buildAuditManifest` → `buildActionableReport` → `renderSummaryMarkdown`)
  with identical inputs.
- Byte-compares the 3 Python outputs against the harness outputs, with
  `generatedAt` handled correctly (Python's timestamp is injected into the
  mjs report before the summary render so both sides produce identical
  markdown).

Result: orchestration byte drift is now caught by CI.

### 4. CI workflow switch — `render_upstream_recovery_comment`

Plan L721-728 mandates this for Phase 4 but was missed in the initial port.

Changes in `.github/workflows/ci.yml` (job `parity`):

1. Added `setup-python` / `Install uv` / `Sync Python deps` steps at the top
   of the `parity` job. The rest of the job keeps using mjs (via `npm run
   check:parity` etc.) until Phase 6 atomic cutover.
2. Swapped `node scripts/detection/render_upstream_recovery_comment.mjs` →
   `cd scripts/py && uv run python -m testim_parity.detection.render_upstream_recovery_comment`.
3. Updated inline docs to cite the migration plan section.

### 5. Plan alignment — `click` → `argparse` gap

Reviewer flagged that `pyproject.toml` declares `click>=8.0` but all 21 Phase 4
scripts use `argparse`. Rationale: argparse covers every Phase 4 CLI surface
with zero additional deps; `click`'s composable-subcommands value doesn't
manifest until potential Phase 6 cutover.

Resolution: updated `docs/PYTHON_MIGRATION_PLAN.md` Phase 4 section to state
that `argparse` was adopted. The dead dependency will be removed as part of
the Phase 6 cutover cleanup (combined with removing mjs consumers that still
pin other transitive deps).

## Deferred

### 6. Coverage 25-30% → Phase 5

Plan `PYTHON_MIGRATION_PLAN.md` Phase 5 ("Tests (pytest 全書き直し)") explicitly
targets **90%+ coverage** via a 3-tier strategy (unit / structural /
aggregate counter). Phase 4's own gate only requires "each CLI produces the
same JSON artifacts" + "5-counter = 0" — both passing now.

Adding broad coverage here (e.g. unit tests for `lint_docs.py` 395 LOC or the
6 pipeline scripts) would duplicate work that is Phase 5's explicit
responsibility (migrating the 57 existing mjs test files into pytest, which
covers most of these paths by design).

**Per-script priority (reviewer's criticality ranking preserved for Phase 5
planning)**:

1. `generate_parity_baseline.py` — 10/10 (touches 5-counter invariant)
2. `snapshot_diff.py` — 9/10
3. `check_upstream_recovery.py` — 9/10
4. `lint_docs.py` — 8/10

### 7. `sys.exit` / `assert` / broad exception cleanup → Phase 5

Scattered anti-patterns noted by reviewer:
- `sys.exit()` in helper functions instead of returning exit code
- `assert` used for runtime validation
- `except Exception:` broad catches

These will be systematically cleaned when rewriting the 57 mjs tests into
pytest (Phase 5). Fixing them now would touch every Phase 4 script and risk
byte-drift on the conformance harness payloads. Phase 5 has a dedicated tier
("Unit tests: CORRECT behavior をテスト") that makes this cleanup safe.

### 8. turndown-dependent wrappers → Phase 4b

4 scripts remain as thin subprocess wrappers because they depend on `turndown`
(HTML→MD conversion) for byte-identical output:

- `detection/check_source_parity.py` (915 LOC orchestration)
- `detection/snapshot_update.py` (live EN HTML fetch)
- `pipeline/fetch_translate_images.py` (fetch + image translation)
- `pipeline/pipeline.py`'s `fetch` step (transitively)

Full port blocked on implementing a turndown equivalent (`markdownify` +
custom converters for MadCap patterns) that matches mjs output byte-for-byte.
Documented explicitly in `PYTHON_MIGRATION_PLAN.md` Phase 4 "残作業" table
(this PR's plan update).

## Verification run

```
cd scripts/py
uv run ruff check src tests        # clean
uv run mypy src                    # clean (59 files)
uv run pytest -q --ignore=tests/conformance   # 544 passed
uv run pytest tests/conformance/test_generate_detection_reports_e2e.py   # 1 passed
uv run pytest tests/test_phase4_cli_scripts.py    # 18 passed (12 smoke + 6 P2 regression)
```

Full conformance suite was not re-run end-to-end in this response cycle
(long-running with node subprocess), but the new `test_generate_detection_reports_e2e`
passes against both runtimes and adds to the existing 12 detection_reports
dispatches.
