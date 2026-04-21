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

---

# Round 2 (reviewer follow-up)

> **Scope**: responses to the second review pass that asked for (a) stronger
> evidence behind the "each CLI produces the same JSON artifacts" claim,
> (b) the `generate_parity_baseline` merge-gate smoke tests, (c) a
> MEDIUM-NEW-1 `ValueError` propagation fix on the refspec guard, and
> (d) LOW-NEW-1 `datetime.now()` parity clarifications.

## Round 2 — Addressed

### R2-1. `generate_parity_baseline.py` 3-mode smoke tests (merge gate)

Reviewer criticality 10/10 — the baseline writer touches the 5-counter=0
invariant directly. Added 5 smoke tests covering every CLI branch:

| Test | Mode / path |
| --- | --- |
| `test_generate_parity_baseline_regenerate_mode` | `--regenerate` happy path — pre-regen gate passes, baseline written with the single emitted entry |
| `test_generate_parity_baseline_slug_mode_merges_with_existing` | `--slug=<csv>` — stale entries for the target slug are replaced while other-slug entries are preserved |
| `test_generate_parity_baseline_types_mode_merges_by_type` | `--types=<csv>` — only entries matching the requested issueType are replaced; other issue types are preserved |
| `test_generate_parity_baseline_rejects_mutually_exclusive_modes` | `--regenerate --slug=…` combo → exit 1 with usage on stderr |
| `test_generate_parity_baseline_regenerate_gate_failure` | `freshnessState="stale"` → gate fail → exit 1, baseline is **not** written |

Source fix required: `main()` previously called `load_snapshot_diff_status()`
and `build_fingerprint_map()` using their default arguments, which bound to
the module constants **at import time** and therefore could not be redirected
via `monkeypatch.setattr`. Switched both calls to pass the module constants
explicitly so tests can redirect them to `tmp_path`.

File: `scripts/py/src/testim_parity/detection/generate_parity_baseline.py:544-557`

### R2-2. Broaden Phase 4 gate-1 — artifact CLI smoke coverage

Reviewer rightly flagged that the earlier gate-1 evidence only covered
`generate_detection_reports`. Added smoke tests for the other two highest
criticality artifact-producing CLIs:

- **`snapshot_diff.py`** (9/10): `classify_changes` 5-category bucketing,
  `MARKER_404_RE` 404-snapshot detection, `build_sidebar_url_map` slug
  extraction, `fallback_source_url` lookup semantics.
- **`check_upstream_recovery.py`** (9/10): `run_check_upstream_recovery` end-
  to-end with empty inputs (verifies artifact schema + `generatedAt` format
  + stdout summary), plus `days_since` / `days_until` / `is_review_overdue`
  boundary cases.

These complement the existing conformance dispatches for baseline / summary /
mutation_corpus / detection_reports (collectively 31 dispatches already cover
the library-level byte parity).

### R2-3. MEDIUM-NEW-1 — `ValueError` propagation in `snapshot_diff._get_head_content`

The `assert_safe_refspec_path` guard raises `ValueError`, but both call sites
of `_get_head_content` (`main` loop line ~340 and `_diff_sidebar` line ~250)
only catch `RuntimeError`. If a malformed input ever reached the guard it
would escape as an uncaught `ValueError` with a stacktrace.

Fix: wrap the `ValueError` into `RuntimeError` **inside** `_get_head_content`
(`snapshot_diff.py:167-173`) so all callers see a single error type
consistently. Added `test_get_head_content_wraps_valueerror_as_runtimeerror`
covering both absolute-path and `..` inputs.

### R2-4. LOW-NEW-1 — pipeline `datetime.now()` parity rationale

Reviewer asked about `generate_untranslated_placeholders.py:44` and
`update_sidebar_urls_from_live.py:66` not using `js_iso_timestamp`. Investigation:
these mjs counterparts use `new Date().getFullYear()/getMonth()/getDate()`,
which read **local time** (not UTC). Switching Python to a UTC-fixed helper
would break byte parity with the mjs output on non-UTC runners (JST dates
would be ±1 day).

Resolution: both sites keep `datetime.now()` but gain explicit inline
comments explaining the mjs-parity rationale and a `# noqa: DTZ005` so ruff
doesn't re-raise the flag. No runtime change.

### R2-5. Plan update — Phase 4 gate evidence reconciled

Reviewer pushed back on the plan's "Phase 4 gate 全通過" line being stronger
than the test evidence supported. The plan section now lists:

1. **Library-level byte parity** — 31 conformance dispatches (baseline 9,
   summary 2, mutation_corpus 8, detection_reports 12) confirm function
   output matches mjs byte-for-byte.
2. **Orchestration byte parity** — `test_generate_detection_reports_e2e.py`
   binds the Python CLI's 3-output chain to the mjs harness output.
3. **Per-CLI smoke coverage** — `generate_parity_baseline` (5 tests),
   `snapshot_diff` (4 tests), `check_upstream_recovery` (2 tests),
   `generate_detection_reports` (3 tests), `render_upstream_recovery_comment`
   (4 tests) covering each CLI's public contract.

Plan now states that **library byte parity + orchestration byte parity +
per-CLI smoke** together satisfy gate-1 for the scripts exercised, and
calls out that remaining wrapper scripts' full port (Phase 4b) will gain
their own gate-1 evidence when turndown equivalence lands.

## Round 2 — Deferred (unchanged from round 1)

- Coverage 25-30% → Phase 5 (with round 2 the smoke additions raise the CLI
  coverage floor; library modules remain on conformance-based coverage)
- sys.exit / assert / broad exception cleanup → Phase 5
- turndown-dependent wrappers → Phase 4b

## Round 2 — Verification run

```
uv run ruff check src tests        # clean
uv run mypy src                    # clean (59 files)
uv run pytest -q --ignore=tests/conformance   # 559 passed (11 new)
uv run pytest tests/test_phase4_cli_scripts.py                     # 30 passed
uv run pytest tests/conformance/test_generate_detection_reports_e2e.py   # 1 passed
```

---

# Round 3 (reviewer follow-up)

> **Scope**: Round 3 returned APPROVE with MEDIUM + LOW improvement suggestions,
> plus two substantive findings (P2 + P3) about incomplete coverage of the
> round-2 fixes. All addressed here (no deferral).

## Round 3 — Addressed

### R3-P2. `generate_parity_baseline.main()` wraps top-level errors

Reviewer noted that `--slug` and `--types` branches call
`load_baseline_file(_BASELINE_PATH)` without any local handling, so a
malformed on-disk `parity-baseline.json` would bubble a raw `ValueError` /
`json.JSONDecodeError` traceback, whereas the mjs entrypoint wraps `main()`
in a top-level `.catch` returning exit 1.

Fix:

- `scripts/py/src/testim_parity/detection/generate_parity_baseline.py`
  refactored so `main()` parses argv / usage / obsolete flags synchronously
  and delegates the file-I/O heavy body to a new `_run_main(args)`. The
  `main()` function wraps the call in `except (ValueError, OSError,
  json.JSONDecodeError)` and emits the mjs-equivalent prefix:
  `❌ generate_parity_baseline error: <err>`.
- Added 3 regression tests:
  - `test_generate_parity_baseline_slug_mode_rejects_malformed_existing_baseline`
    — existing baseline with `schemaVersion=999` → exit 1
  - `test_generate_parity_baseline_types_mode_rejects_malformed_existing_baseline`
    — existing baseline with invalid JSON → exit 1
  - `test_generate_parity_baseline_slug_mode_rejects_non_full_run` — partial
    run parity status (`checkedFiles != totalFiles`) → exit 1 on the common
    `assert_full_parity_status` gate (closes R3-M3 below too)

### R3-P3. `_diff_sidebar` now catches `RuntimeError` from `_get_head_content`

Reviewer flagged that the MEDIUM-NEW-1 fix from round 2 wrapped
`_get_head_content` callers inside the `main` loop but missed the second
call site in `_diff_sidebar` (where `git` unavailability or refspec guard
failures still aborted with uncaught exceptions).

Fix:

- `_diff_sidebar` now wraps the `_get_head_content(sidebar_rel)` call in
  `try/except RuntimeError`, prints a `diff_sidebar: git lookup failed …`
  notice, and returns `{"changed": True, "addedPages": [], "removedPages":
  [], "parseError": True}` — the same graceful-degradation shape the JSON
  decode branch already produces.
- `test_snapshot_diff_sidebar_guards_runtimeerror` monkeypatches
  `_get_head_content` to raise and verifies the fallback payload shape.

### R3-P3 (plan). Phase 4 gate text rewritten to match evidence

Reviewer rightly noted the plan's "各 CLI … 3 layer verification" line was
stronger than the in-tree evidence. The plan section now carries a table
showing **per-CLI** evidence layers:

- `generate_detection_reports` has all 3 layers (library + orchestration +
  smoke).
- `generate_parity_baseline`, `snapshot_diff`, `check_upstream_recovery`,
  `render_upstream_recovery_comment` have library (where applicable) +
  per-CLI smoke; orchestration byte parity is explicitly marked as
  "Phase 4b scope".

This removes the overstated claim while keeping gate-1 truthfully
partially-satisfied for the parts we actually cover today.

### R3-M1. `baseline-regen-gate: pass` stdout marker is now asserted

New test `test_generate_parity_baseline_regenerate_emits_gate_pass_marker`
verifies the regen happy-path emits `baseline-regen-gate: pass` on stdout —
CI dashboards that grep this signal now have a regression guard.

### R3-M2. `_patch_baseline_paths` documents why `ROOT_DIR` is not patched

The fixture's docstring explains that `ROOT_DIR` usage inside the module is
cosmetic-only (the `_BASELINE_PATH.relative_to(ROOT_DIR)` fallback to
absolute path at line ~582). Tests assert on `paths["baseline"]` and
captured output, so the absolute-path print is harmless.

### R3-M3. Slug/types mode gate-failure paths covered

`test_generate_parity_baseline_slug_mode_rejects_non_full_run` exercises
the shared `assert_full_parity_status` gate through the `--slug` entry (the
`checkedFiles != totalFiles` branch that was previously only tested via
`--regenerate`).

### R3-M4. Double-prefix on refspec error removed

`_get_head_content` previously produced
`RuntimeError("unsafe refspec rejected: refuse to pass absolute path …")`,
which duplicated context. The wrap now preserves the guard's original
message verbatim (`RuntimeError(str(err)) from err`), producing
`refuse to pass absolute path to git refspec: '/etc/passwd'` as a single
coherent line. The existing test's assertion regex was updated accordingly.

### R3-L2. Unified `datetime.now()` rationale comments

`generate_untranslated_placeholders.py` and `update_sidebar_urls_from_live.py`
now carry identical 3-line comments explaining the mjs-parity rationale for
`datetime.now()` + `# noqa: DTZ005`. Previously each file had a slightly
different wording.

### R3-L3. `days_until` test comment rewritten

Replaced the misleading "UTC 丸め" wording with an explicit floor-division
calculation note (`(future_ms − now_ms) // MS_PER_DAY → 6.58 → 6`) that
correctly describes why 10:00Z vs 00:00Z yields 6 not 7.

### R3-L1 (no code change, documented)

Reviewer noted `runScope` in the `_snapshot_diff_clean` helper is unused by
`assert_pre_regen_gate`. Kept for schema fidelity (the on-disk JSON artifact
always carries `runScope`) — acknowledged in comments. No code change.

## Round 3 — Verification run

```
uv run ruff check src tests        # clean
uv run mypy src                    # clean (59 files)
uv run pytest -q --ignore=tests/conformance   # 564 passed (5 new)
uv run pytest tests/test_phase4_cli_scripts.py                     # 35 passed
uv run pytest tests/conformance/test_generate_detection_reports_e2e.py   # 1 passed
```

## Round 3 — Cumulative test count

- Round 1 (P2 × 4 + refspec): +10 tests
- Round 2 (baseline smoke + gate broadening): +12 tests
- Round 3 (P2 + P3 + polish): +5 tests
- **Total new tests introduced by PR #374 review cycles: 27**

All failures caught by the review cycles had a test landed alongside the
fix; no regression from round to round.
