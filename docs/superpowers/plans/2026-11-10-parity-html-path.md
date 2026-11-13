# Parity HTML Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compare JA and EN through one HTML extractor, retire the JA line scanner and turndown-based structure checks, and remove the 15 `en_source_patches` entries that exist only because the two paths disagree.

**Architecture:** JA stays Markdown on disk. At comparison time it is rendered to HTML with `markdown-it-py` and passed to the existing `extract_segments_from_html`. Structure counts move from Markdown regexes to a DOM walk applied identically to both sides. EN snapshots are read-only.

**Tech Stack:** Python 3.14, uv, `markdown-it-py[plugins]~=4.0`, BeautifulSoup/lxml, pytest. All already installed; no new dependency.

**Spec:** No separate spec. Requirements are in Global Constraints and Measured Baseline. Background: `docs/UPSTREAM_REVIEW_2026-10-23.md`, Issue #454.

## Approvals required before execution

`CLAUDE.md` requires user approval for these. Accepting this plan grants them; any item rejected removes the tasks that depend on it.

| ID | Change | Used by |
| --- | --- | --- |
| A1 | Step, bullet, paragraph, heading, table and callout checks move to a DOM comparison. Issue types and severities are unchanged | Task 5 |
| A2 | `PARITY_GUIDE.md` recovery rule gains a second path: a patch may be removed without an upstream fix when an extractor change or JA change is shown to absorb it, with the patch disabled, 5 counters at 0, and recall tests passing | Tasks 1, 2, 6 |
| A3 | `SYSTEM_SPEC.md` / `PARITY_GUIDE.md` text describing the JA Markdown path, including the source-first exception registry, is rewritten | Task 8 |
| A4 | `reviewAfter` may be renewed for a patch whose upstream defect was re-verified, replacing the current ban in `PARITY_GUIDE.md`, `OPS_DESIGN.md` and `UPSTREAM_DEFECTS.md`. Limited to `reviewAfter <= lastVerifiedAt + 184 days` and enforced by `validate_en_source_patches` | Task 2A |

| A5 | `mutation_corpus.drop_invariant_token` stops generating image-URL mutations on table lines; `image_parity_issues` owns that case (measured: it detects it today). `STRICT_RECALL_TYPES` and the 100% threshold are unchanged | Task 6 |

## Delivery Flow

`ci.yml` runs only for pull requests targeting `main`, so PRs into an integration branch need a temporary trigger.

0. Local `main` is behind `origin/main`: `git pull --ff-only` first. This plan file is committed on the integration branch, must pass `npm run lint:md:repo`, reaches `main` with the summary PR, and is deleted in Task 9 Step 7 after the production deploy.
1. Create `claude/parity-html-integration` from `main`. First commit adds it to `on.pull_request.branches` in `.github/workflows/ci.yml`.
2. PR A, PR B and PR C each target `claude/parity-html-integration`. Each gets the 4-reviewer gate and explicit user approval before merging into the integration branch.
3. After all three are merged, Task 9 reverts the `ci.yml` commit and opens the summary PR from the integration branch to `main` for Vercel Preview review.
4. Nothing merges to `main` until the user has checked the Preview and approved.

## Global Constraints

- 5 counters stay 0 at the end of every PR: `parity-baseline.json entries.length`, `reportableActiveFiles`, `baselinedIssues`, `advisoryQueueIssues`, `auditSignalIssues`.
- No third suppression mechanism. No new `parity-baseline.json` entries or acknowledgements to reach 0.
- `reviewAfter` changes only through Task 2A's verified renewal. Do not change the condition that opens the `source-sync-health` issue.
- Source-first: JA follows the EN structure. The only exceptions are upstream defects registered as patches and the existing source-first exception registry. A JA edit made to satisfy a checker must also match EN.
- Do not modify `snapshots/en/content/*.html`.
- Do not change the behavior of `turndown.html_to_md`; the translation pipeline depends on it.
- Existing issue `type` values and severities are preserved verbatim so `detection_reports`, gates and `parity-check-status.json` schema do not change. The one addition is `code-block-count-mismatch` (Task 5).
- New global (non-slug-scoped) rules need a negative test proving existing pages are unaffected.
- Every PR: branch `claude/{topic}`, English commit messages with a `feat:`/`fix:`/`docs:`/`refactor:` prefix, 4 separate reviewer agents (architect, QA, testing, security), and explicit user approval before merge.
- Every PR must pass: `npm run lint && npm run test && npm run build && npm run check:parity`.

## Measured Baseline

Measured 2026-11-09 on `f7737d63` with a throwaway prototype, all 288 pages.

| Condition | Segment alignment | DOM structure counts |
| --- | --- | --- |
| Current path | 0 pages | n/a |
| HTML path, no JA changes | 95 pages (91 caused by lazy list continuation) | not measured |
| HTML path + lazy continuation normalized | 5 pages | 8 pages |
| Above + 15 patches off + 3 JA edits | 11 pages (the 5 + 6 expected) | 8 pages (unchanged) |

- Pages needing individual JA review (the union of both columns): `editing-tests/generating-a-date`, `integrations/test-management-integrations/testrail-integration`, `overview/testim-overview/help-ai-assistant`, `running-tests/running-tests-overview`, `test-management/locators-auto-improve`, `overview/changelog`, `results/test-results/network-logs`, `advanced-editing/data-driven-testing/configuring-data-driven-tests-using-the-config-file`.
- Table and callout checks on the HTML path: 47 of 47 tables paired; differences on `running-tests/running-tests-overview` and `editing-tests/groups` only; 0 callout depth differences. `editing-tests/groups` joins the individual review list (9 pages total).
- Bare `index.htm` rewrite (Task 2), measured 2026-11-13 on the current path with the 5 patches and the `/docs/index` artifact-registry entry removed: 284 of 288 pages clean. Four pages report `segment-token-gap` because EN links to the parent category and JA has no link: `testops/insights/dashboard`, `testops/insights/reports`, `recording-tests/recording-a-mobile-test/recording-a-local-mobile-test`, `salesforce-testing/create-a-salesforce-test/use-agentic-test-automation-for-salesforce`. The last one also has the malformed upstream link `href="index.htm/#/"`.
- Mutation detection with both checks: 13 of 13 patterns on a zero baseline.
- Existing recall, boundary and real_repo suites on the HTML path: 119 of 123 passed. Three failures are the residual pages. One is a real miss: `token-drop` at 83.3%, on an image URL in a table cell of `running-tests/running-tests-overview`. EN there is the broken literal `!<a href="...">`, an unregistered upstream defect (9 cells). Task 6 resolves it.
- MadCap uses `<h1>` for section headings. Only the first `<h1>` before any content is the page title; later ones count as `h2`.

## Review Focus

1. A `:::` line inside a fenced code block stays code and never opens a callout. Pinned in Task 4.
2. `<details>` with Markdown bodies produces the same `details-summary` and body segments as today. Pinned in Task 4.
3. CommonMark ordered-list interruption: a paragraph line followed directly by `5. text` does not start a list. Lazy-continuation pages must keep working after Task 3. Pinned in Task 3.
4. Page with a bare `index.htm` link where the page has no parent folder leaves the link untouched. Pinned in Task 2.
5. `markdown-it-py` output diverges from the real Astro build. Pinned by the build comparison in Task 8.

---

## PR A: absorb artifacts in shared code (`claude/parity-absorb-artifacts`)

Removes 7 patches. Survives the cutover unchanged.

### Task 1: Ignore empty paragraphs (UD-015, UD-022)

**Files:**
- Modify: `scripts/python/src/testim_parity/segments_en.py`
- Modify: `scripts/python/src/testim_parity/_en_source_patches_data.json`, `docs/UPSTREAM_DEFECTS.md`
- Create: `scripts/python/tests/test_parity_absorbed_patches.py`

**Interfaces:**
- Produces: `extract_segments_from_html` emits no `paragraph` segment for `<p>` whose text is only whitespace, U+200B or U+00A0.

- [ ] **Step 1: Write the failing test**

```python
@pytest.mark.parametrize("p", ["<p>​</p>", "<p>​ ​</p>", "<p> </p>"])
def test_empty_paragraph_emits_no_segment(p):
    segments = extract_segments_from_html(f"<p>Before</p>{p}<p>After</p>", slug="x", callout_allow_slugs=None)
    assert [s["textNorm"] for s in segments] == ["before", "after"]

def test_image_only_paragraph_is_unchanged():
    html = '<p>Before</p><p><img src="a.png"/></p>'
    assert [s["segmentKind"] for s in extract_segments_from_html(html, slug="x", callout_allow_slugs=None)] == ["paragraph"]
```

- [ ] **Step 2: Run it and confirm the first test fails**

Run: `cd scripts/python && uv run pytest tests/test_parity_absorbed_patches.py -v`
Expected: FAIL, an empty `paragraph` segment is present.

- [ ] **Step 3: Skip emit in the paragraph branch of the block walker when the normalized text is empty**
- [ ] **Step 4: Delete `UD-015-*` and `UD-022-*` from the JSON; mark them archived in `UPSTREAM_DEFECTS.md` with reason "absorbed by extractor"; update pinned patch counts in tests**
- [ ] **Step 5: Regenerate goldens**

Run: `npm run test:py:corpus:regen`
Expected: diff limited to segments of pages containing empty paragraphs.

- [ ] **Step 6: Verify and commit**

Run: `npm run test:py:quick && npm run check:parity`
Expected: PASS; 5 counters 0.

```bash
git commit -m "fix: ignore empty paragraphs in segment extraction"
```

### Task 2: Resolve bare `index.htm` links (UD-005E, UD-005F, UD-008, UD-013, UD-014)

**Files:**
- Modify: `scripts/python/src/testim_parity/preprocess_en.py`, `artifact_registry.py` (remove the `/docs/index` entry and its tests)
- Modify: the 4 JA pages listed in Measured Baseline (add the parent-category links EN has)
- Modify: patch JSON, `docs/UPSTREAM_DEFECTS.md`, `docs/PARITY_GUIDE.md` (A2)
- Test: `scripts/python/tests/test_parity_absorbed_patches.py`

**Interfaces:**
- Produces: `_rewrite_bare_index_links(html: str, slug: str) -> str`, called in `preprocess_en_html` **after** `apply_en_source_patches` and only when `slug` is set, so UD-009 and UD-012 `find` strings still match.
- Assumption: a page with a bare `index.htm` link is not itself a category index. Pinned by `test_no_category_index_snapshot_has_bare_index_link` (`real_repo` marker): no snapshot whose slug is also a snapshot directory contains `href="index.htm`.

- [ ] **Step 1: Write the failing tests**

```python
def test_bare_index_link_points_to_parent_folder():
    html = '<a href="index.htm">x</a>'
    assert _rewrite_bare_index_links(html, "a/parameters/hidden") == '<a href="../parameters/index.htm">x</a>'

def test_bare_index_link_keeps_fragment():
    assert 'href="../b/index.htm#s"' in _rewrite_bare_index_links('<a href="index.htm#s">x</a>', "a/b/c")

def test_top_level_page_is_untouched():
    html = '<a href="index.htm">x</a>'
    assert _rewrite_bare_index_links(html, "top") == html

def test_non_bare_links_are_untouched():
    html = '<a href="../x/index.htm">x</a><a href="other.htm">y</a>'
    assert _rewrite_bare_index_links(html, "a/b/c") == html

@pytest.mark.parametrize("patch_prefix, slug", [
    ("UD-009", "integrations/grid-management/custom-grid"),
    ("UD-012", "advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor"),
])
def test_patches_still_apply_before_link_rewrite(patch_prefix, slug):
    # load_patch reads the JSON registry; read_snapshot reads raw bytes as UTF-8 to keep CRLF
    assert load_patch(patch_prefix)["replace"] in preprocess_en_html(read_snapshot(slug), slug=slug)
```

- [ ] **Step 2: Run and confirm failure** (`ImportError`)
- [ ] **Step 3: Implement for `slug` with at least two segments; otherwise return `html` unchanged**
- [ ] **Step 4: Delete the 5 patches and the `/docs/index` artifact-registry entry; update `UPSTREAM_DEFECTS.md`; add the A2 rule to `PARITY_GUIDE.md`; update pinned patch counts**
- [ ] **Step 5: Add the missing parent-category links to the 4 JA pages, following each EN anchor. Register `UD-024` (class `href-miswire`) for `href="index.htm/#/"` → `href="index.htm"` on `use-agentic-test-automation-for-salesforce`**
- [ ] **Step 6: Verify**

Run: `npm run test:py:corpus:regen && npm run test:py:quick && npm run check:parity`
Expected: 5 counters 0 across all 17 snapshots containing `href="index.htm`. If another page reports a difference, its JA link is genuinely wrong: fix the JA link.

- [ ] **Step 7: Commit**

```bash
git commit -m "fix: resolve bare index links against the page folder"
```

### Task 2A: Renew verified upstream defects (A4)

Renews only patches whose defect is real and confirmed still present: UD-001A/B, UD-002, UD-003, UD-005A/B/C/D, UD-006, UD-007, UD-009, UD-010A/B/C/D, UD-012, UD-021 (17 entries).

**Files:**
- Modify: patch JSON, `tools/validate_en_source_patches.py`, `docs/PARITY_GUIDE.md`, `docs/OPS_DESIGN.md`, `docs/UPSTREAM_DEFECTS.md`
- Test: `scripts/python/tests/test_en_source_patches.py`

**Interfaces:**
- Produces: optional patch field `lastVerifiedAt: "YYYY-MM-DD"`. When present, the validator requires `reviewAfter <= lastVerifiedAt + 184 days`.

- [ ] **Step 1: Write the failing tests**

```python
def test_renewal_within_window_is_valid():
    assert validate(entry(lastVerifiedAt="2026-11-10", reviewAfter="2027-05-13")) == []

def test_renewal_beyond_window_is_rejected():
    assert validate(entry(lastVerifiedAt="2026-11-10", reviewAfter="2027-05-14"))

def test_entry_without_last_verified_keeps_existing_rules():
    assert validate(entry(addedAt="2026-04-17", reviewAfter="2026-10-17")) == []
```

- [ ] **Step 2: Run and confirm failure, then implement the validator rule**
- [ ] **Step 3: Re-fetch the affected pages and confirm each `find` still matches**

Run: `npm run check:snapshots:fetch` then `npm run check:upstream-recovery`
Expected: all 17 `statusA: active`. An entry reported `stale` is not renewed; it goes through the removal procedure.

- [ ] **Step 4: Set `lastVerifiedAt` and `reviewAfter` to at most verification date + 184 days on the 17 entries. Record date, evidence and "upstream not fixed" in `UPSTREAM_DEFECTS.md`**
- [ ] **Step 5: Update the three guides: renewal requires fresh verification and is capped at one 184-day window per renewal**
- [ ] **Step 6: Verify and commit**

Run: `npm run test:py:quick && npm run check:upstream-recovery`
Expected: `overdue=8`.

```bash
git commit -m "feat: allow verified renewal of upstream defect patches"
```

---

## PR B: normalize JA list continuation (`claude/ja-lazy-continuation`)

### Task 3: Separate list items from following paragraphs

JA lines such as `4. text\` followed by an unindented line render inside the list item. Where EN has a separate paragraph, this is structurally different from EN and undetected. Where EN has `<br />` inside the same block, the hard break is correct and must stay (`TRANSLATION_GUIDE.md`).

**Files:**
- Create: `scripts/python/src/testim_parity/ja_render.py`, `scripts/python/tests/test_ja_render.py`
- Modify: about 91 files under `src/content/docs/`
- Modify: `docs/WRITING_GUIDE.md` (new rule), `docs/TRANSLATION_GUIDE.md` (reference)

**Interfaces:**
- Produces: `render_ja_markdown(body: str) -> str` in `ja_render.py`, with the rendering rules and the callout, fence, details and heading-anchor tests listed in Task 4. Not wired into the checker in this PR; the verification script and Task 4 consume it.

The conversion and verification scripts are throwaway: keep them outside the repo and paste their usage into the PR body.

- [ ] **Step 0: Implement `render_ja_markdown` test-first** (tests from Task 4 that concern rendering only)
- [ ] **Step 1: Write both scripts together, before converting anything**

Convert: for a list-item line followed by an unindented text line, and only when the EN snapshot has a separate block at that position (the rendered page aligns with EN after the change and did not before), drop a trailing `\`, insert a blank line after the item, and insert a blank line before a following list marker.
Unchanged: fenced code, callouts, tables, frontmatter, any `\` break outside a list, and any list item where EN has `<br />` inside the same block.

Verify, on `git diff main...HEAD` added lines only:
- Every converted page has fewer or equal alignment issues against EN when `extract_segments_from_html(render_ja_markdown(body))` is aligned with the EN segments; list any page where the count rises.
- Text content with whitespace and trailing `\` removed is identical per file.
- No fence, `:::`, or frontmatter line changed.
- `updated` frontmatter unchanged.

- [ ] **Step 2: Test the conversion on the Review Focus 3 fixture**

Input `4. a\` / `b` / `5. c`. Expected `4. a` / blank / `b` / blank / `5. c`, rendered as `ol`, `p`, `ol start=5`.

- [ ] **Step 3: Run conversion, then verification, before the first commit**
- [ ] **Step 4: Add to `WRITING_GUIDE.md`: a paragraph that EN places between list items is separated by blank lines, never a trailing `\`**
- [ ] **Step 5: Verify on the current path**

Run: `npm run lint && npm run check:parity && npm run build`
Expected: 5 counters 0. A page that fails only on the old scanner moves to Task 6 and is listed in the PR body.

- [ ] **Step 6: Commit**

```bash
git commit -m "docs: separate list items from following paragraphs"
```

---

## PR C: HTML path cutover (`claude/parity-html-path`)

Atomic: new path, removed patches, deleted code, regenerated goldens and docs in one PR, one commit per task. The branch is expected to have failing parity until Task 6.

### Task 4: Render JA Markdown and reuse the EN extractor

**Files:**
- Rewrite: `scripts/python/src/testim_parity/segments_ja.py` (597 lines to under 100)
- Delete: `scripts/python/src/testim_parity/segments_ja_html.py`
- Rewrite: `scripts/python/tests/test_segments_ja.py`

**Interfaces:**
- Consumes: `render_ja_markdown(body: str) -> str` from `ja_render.py` (Task 3)
- Produces: `extract_segments_from_markdown(body: object) -> list[dict[str, Any]]`. Name and shape unchanged, so the 4 production importers (`check_source_parity`, `lint_docs`, `snapshot_update`, `emit_corpus_oracle`) need no edit. `line` becomes `None`. `image` kind is no longer emitted for `<p><img></p>`.

Rendering: `MarkdownIt("commonmark", {"html": True}).enable("table").enable("strikethrough")`. Before rendering: strip frontmatter and the title H1, strip heading `{#id}`, and replace `:::kind{...}` / `:::` outside fences with `<div class="callout-kind" data-line="N">` / `</div>` surrounded by blank lines, where `N` is the 1-based body line of the opening `:::`.

- [ ] **Step 1: Write the failing tests**

```python
def test_callout_body_segment():
    assert kinds(":::note\nbody\n:::\n") == ["callout-body"]

def test_callout_marker_inside_fence_stays_code():          # Review Focus 1
    assert kinds("```\n:::note\n```\n") == ["code-block"]

def test_details_with_markdown_body():                      # Review Focus 2
    assert kinds("<details>\n<summary>S</summary>\n\nbody\n\n</details>\n") == ["details-summary", "paragraph"]

def test_heading_anchor_stripped():
    assert texts("## 見出し {#id}\n") == ["見出し"]

def test_image_only_list_item_matches_en():
    md = extract_segments_from_markdown("1. a\n2. ![x](y.png)\n3. b\n")
    en = extract_segments_from_html("<ol><li>a</li><li><img src='y.png'/></li><li>b</li></ol>", slug="x", callout_allow_slugs=None)
    assert [s["textNorm"] for s in md] == [s["textNorm"] for s in en]

def test_code_block_inside_list_does_not_break_headings():
    assert kinds("- ```\n  x\n  ```\n\n## h\n")[-1] == "heading"

def test_unclosed_callout_does_not_swallow_following_heading():
    assert "heading" in kinds(":::note\nbody\n\n## h\n")

def test_unclosed_fence_is_reported_as_code_to_end():
    assert kinds("para\n\n```\nx\n\n## h\n") == ["paragraph", "code-block"]
```

- [ ] **Step 2: Run and confirm failure**

Run: `cd scripts/python && uv run pytest tests/test_segments_ja.py -v`

- [ ] **Step 3: Implement; delete `segments_ja_html.py`**
- [ ] **Step 4: Fix expectation changes (`line`, `image` kind only) in `test_align.py`, `test_callout_contract.py`, `test_clean_page_fixtures.py`, `test_structure_fixtures.py`, `test_source_usability_fixtures.py`, `test_segments_boundary.py`, `test_recall.py`, `test_baseline_recall.py`. Any other assertion change is a behavior regression: stop and report it**
- [ ] **Step 5: Run `uv run pytest tests/test_segments_ja.py -v`. Expected: PASS**
- [ ] **Step 6: Commit** `refactor: extract JA segments through the HTML extractor`

### Task 5: DOM structure comparison

**Files:**
- Create: `scripts/python/src/testim_parity/html_structure.py`
- Create: `scripts/python/tests/test_html_structure.py`
- Modify: `scripts/python/src/testim_parity/detection/check_source_parity.py`, `checks.py`, `types.py`

**Interfaces:**
- Consumes: `render_ja_markdown` from `ja_render.py` (Task 3); `segments_en._clean_soup`, `_is_callout_div`.
- Produces: `compare_html_structure(en_html: str, ja_html: str, *, slug: str) -> list[dict[str, Any]]`, replacing all four `compare_snapshot_structure` call sites. `check_source_parity` no longer calls `convert_en_html_to_md`.

Emits exactly: `callout-nesting-mismatch`, `table-shape-mismatch`, `table-cell-*`, `section-count-mismatch`, `heading-mismatch`, `step-count-mismatch`, `bullet-count-mismatch`, `paragraph-count-mismatch`, plus one new signal-severity type `code-block-count-mismatch` (registered in `types.py` `COARSE_SIGNAL_TYPES` and `ISSUE_SEVERITY`; the only type addition, covered by A1). `artifacts` field semantics are preserved (`<details>` present; more than 50% of text inside `<pre>`). `callout-nesting-mismatch` keeps its `line` field, read from the JA callout's `data-line`; it is the only structure issue that carries a line today.

Counting rules, per section (a section starts at each heading; the first `<h1>` before any content is the title; later `<h1>` count as `h2`): `ol > li` and `ul > li` including image-only items; `<p>` outside `li`, `table`, `blockquote`, `details` and callouts, excluding empty and image-only; `pre` outside tables. Tables reuse `extract_html_tables` on both HTML inputs and keep the existing cell logic (`table-cell-empty-mismatch`, `table-cell-token-mismatch`, `table-cell-english-residual`). In table cells, `span.FileOrFilePath` is tokenized like `<code>`, and `<br>` or a block boundary inserts a space so adjacent text does not fuse into a false token.

- [ ] **Step 1: Write failing tests**, one per issue type, plus the three mutation patterns the alignment check cannot see:

```python
def test_image_only_step_moved_out_of_list_is_detected():
    en = "<ol><li>a</li><li><img src='y.png'/></li></ol>"
    ja = "<ol><li>a</li></ol><p><img src='y.png'/></p>"
    assert types(en, ja) == ["step-count-mismatch"]

def test_code_block_replaced_by_inline_code_is_detected():
    en = "<ul><li><pre><code>x</code></pre></li></ul>"
    ja = "<ul><li><code>x</code></li></ul>"
    assert types(en, ja) == ["code-block-count-mismatch"]

def test_br_br_is_one_paragraph():
    assert types("<p>a<br/><br/>b</p>", "<p>ab</p>") == []

def test_later_h1_counts_as_section():
    assert types("<h1>T</h1><h1>A</h1><p>x</p>", "<h2>A</h2><p>x</p>") == []

def test_file_path_span_matches_code_in_table_cell():
    en = '<table><tr><td><span class="FileOrFilePath">h=1.2.3.4</span></td></tr></table>'
    ja = "<table><tr><td><code>h=1.2.3.4</code></td></tr></table>"
    assert types(en, ja) == []

def test_callout_nesting_issue_keeps_ja_line():
    en = '<div class="note"><p>x</p></div>'
    ja = '<ol><li>a<div class="callout-note" data-line="12"><p>x</p></div></li></ol>'
    assert [i["line"] for i in compare_html_structure(en, ja, slug="x") if i["type"] == "callout-nesting-mismatch"] == [12]

def test_block_boundary_in_cell_does_not_fuse_tokens():
    en = "<table><tr><td>run step.<br /><p>To learn</p></td></tr></table>"
    ja = "<table><tr><td>ステップ</td></tr></table>"
    assert "table-cell-token-mismatch" not in types(en, ja)
```

- [ ] **Step 2: Run and confirm failure** (`ImportError`)
- [ ] **Step 3: Implement; port the matching cases from `test_checks.py` into `test_html_structure.py`; replace the call sites**
- [ ] **Step 3a: Register `code-block-count-mismatch` everywhere `paragraph-count-mismatch` is enumerated.** Run `git grep -l "paragraph-count-mismatch"` and mirror each site: `types.py`, `.github/workflows/deep-audit.yml`, `docs/OPS_DESIGN.md`, `docs/WRITING_GUIDE.md`, `scripts/README.md`, and the tests `test_types`, `test_summary`, `test_issue_state`, `test_detection_reports`, `test_acknowledgements`, `test_baseline`, `test_generate_parity_baseline`
- [ ] **Step 4: Run** `uv run pytest tests/test_html_structure.py tests/test_checks.py -v`. Expected: PASS
- [ ] **Step 5: Commit** `feat: compare document structure on the rendered DOM`

### Task 6: Reach zero and remove the remaining 8 patches

**Files:**
- Modify: the 8 pages in Measured Baseline plus any moved from Task 3
- Modify: `src/content/docs/integrations/sealights-integration.md` (UD-018), `salesforce-testing/create-a-salesforce-test.md` (UD-019), `salesforce-testing/troubleshoot.md` (UD-020)
- Modify: patch JSON, `docs/UPSTREAM_DEFECTS.md`

- [ ] **Step 1: Delete UD-016A/B, UD-017, UD-018A/B/C, UD-019, UD-020**
- [ ] **Step 2: Apply JA source-form edits**: UD-017 keeps EN's line break with a trailing `\` hard break before `設定手順:` (the form 143 corpus files use); UD-018 inline flag to a fenced block inside the list item (3 places); UD-019 image becomes `5.` and later steps renumber to 6, 7; UD-020 image becomes a list item.
- [ ] **Step 3: Register UD-023** in the patch JSON and `UPSTREAM_DEFECTS.md`: 9 entries converting `!<a href="U">A</a>` to `<img src="U" alt="A" />` in `running-tests/running-tests-overview`, class `madcap-artifact`.
- [ ] **Step 4: Move image URLs in table cells to the check that owns them.** In `mutation_corpus.drop_invariant_token`, skip tokens inside `![...](...)` on table lines, matching the existing skip for image lines. Add `test_table_image_url_change_is_detected_by_image_parity` asserting `image_parity_issues` reports a changed table-cell image URL. Keep `STRICT_RECALL_TYPES` unchanged.
- [ ] **Step 5: Fix each residual page against its EN snapshot.** A real divergence is a JA content fix. If a page needs an extractor change, stop and report; do not add an acknowledgement.
- [ ] **Step 6: Verify**

Run: `npm run check:parity && npm run lint:docs`
Expected: 5 counters 0; 0 `structure-signature-mismatch`.

- [ ] **Step 7: Differential gate, before Task 7.** Task 4 already replaced the old scanner, so the old side runs from a separate checkout: `git worktree add ../parity-old <integration-branch commit before PR C>`. A throwaway script outside the repo runs all 288 pages with `mutation_corpus.generate_corpus(md, count=3)` through both checkouts' `check_source_parity` logic on the same mutated JA and the same EN snapshot. Old = `extract_segments_from_markdown` + `compare_snapshot_structure` + `image_parity_issues`; new = the HTML path + `compare_html_structure` + `image_parity_issues`. Remove the worktree afterwards.
Expected: every mutation detected by old is detected by new. List each exception in the PR body with the check that now owns it; an exception without an owner blocks Task 7.

Run: `npm run test:py:quality`
Expected: PASS with `STRICT_RECALL_TYPES` at 100%.

- [ ] **Step 8: Add the 13 mutation patterns as parametrized pytest cases in `tests/test_parity_absorbed_patches.py`.** Each starts from the clean page, applies one change in memory, and asserts at least one new issue from alignment or `compare_html_structure`:
  - JA `api-testing`: split the Assertion paragraph.
  - JA `sealights-integration`: delete the code bullet; misspell the flag; replace with a plain code block; replace with inline code.
  - JA `create-a-salesforce-test`: delete step 6; delete step 7; move the image step out of the list.
  - JA `troubleshoot`: delete a text bullet; move the image bullet out of the list.
  - EN: add a step to `create-a-salesforce-test`; add a bullet to `troubleshoot`; add a code bullet to `sealights-integration`.
- [ ] **Step 9: Commit** `fix: align JA structure and remove absorbed patches`

### Task 7: Remove dead code

Delete only after `git grep -w <symbol>` shows no reference outside the code being deleted.

| Target | Action | Reason |
| --- | --- | --- |
| `extract_lines.py` | Delete file | All counters replaced |
| `extract.py`: `extract_callout_positions`, `extract_heading_sequence`, `extract_markdown_tables`, `extract_table_structure`, `extract_image_sequence`, `normalize_en_artifacts`, `strip_title_h1`, `detect_en_artifacts`, `normalize_numeric_period_spacing` | Delete; prune `__all__` and re-exports | Markdown-only structure helpers |
| `extract.py`: `extract_html_tables`, `extract_invariant_tokens`, `strip_markdown`, `is_untranslated_cell` | Keep | Used by `html_structure`, `segments_shared`, `markdown_utils` |
| `checks.py`: `compare_snapshot_structure`, `_compare_section_counts`, `_compare_table_structure`, `_count_section_headings`, `_callout_nesting_issues`, `_heading_level_mismatches`, `_apply_artifacts` | Delete | Moved to `html_structure.py` |
| `turndown.convert_en_html_to_md` | Delete | Only the corpus oracle remains after Task 5 |
| `turndown.html_to_md` | Keep, behavior unchanged | Translation pipeline |
| `tools/emit_corpus_oracle.py` `turndown` suite | Delete suite | Function removed |
| `tools/verify_golden_against_mjs.py` | Delete | mjs sources already removed; no CI, npm or docs reference |
| `pyproject.toml` corpus marker text | Update | Mentions the turndown suite |
| `scripts/__tests__/fixtures/source-parity-goldens/` | Delete if `git grep` shows the Python tests reference only `scripts/python/tests/fixtures/` | Suspected leftover |

Test changes:

| Test | Action |
| --- | --- |
| `test_extract_lines_branches.py` | Delete |
| `conformance/test_turndown_288_matrix.py` | Delete; prune `conformance/conftest.py` |
| `test_extract_structure.py`, `test_extract.py` | Remove cases for deleted functions |
| `test_turndown.py` | Remove `convert_en_html_to_md` cases; keep `html_to_md` |
| `test_checks.py` | Remove moved cases |
| `test_pipeline_cli_smoke.py` | Remove `verify_golden_against_mjs` cases |
| `test_emit_corpus_oracle.py` | Expect suites `segments_en`, `align` only |
| `test_docs_current_contracts.py` | Update the file list if it names a removed path |

- [ ] **Step 1: Delete production code and tests per the tables**
- [ ] **Step 2: Sweep**

Run: `npm run lint:py && npm run typecheck:py && git grep -nwE "extract_step_counts|extract_bullet_counts|extract_paragraph_counts|compare_snapshot_structure|convert_en_html_to_md|segments_ja_html"`
Expected: lint and mypy pass; grep returns only docs that Task 8 rewrites.

- [ ] **Step 3: Commit** `refactor: remove the Markdown structure path`

### Task 8: Goldens, docs, and final gates

**Files:** `tests/conformance/__oracle__/*`, recall/boundary fixtures, `docs/SYSTEM_SPEC.md` (A3), `docs/PARITY_GUIDE.md` (A3), `docs/WRITING_GUIDE.md` (list and parser contract), `scripts/README.md`, `docs/UPSTREAM_DEFECTS.md`

- [ ] **Step 1: Regenerate goldens** with `npm run test:py:corpus:regen`; inspect that `align` and `segments_en` diffs correspond to Tasks 1–6 only
- [ ] **Step 2: Update docs**: pipeline description, the removed JA parser contract, count rules, and the 17 remaining patches
- [ ] **Step 3: Compare against the real build** (Review Focus 5)

Run `npm run build`, then for all 288 pages run a throwaway script that applies the Task 5 counting rules to the built article body and to `render_ja_markdown` output.
Expected: identical counts. Any difference is reported in the PR body and resolved before merge.
The site adds its own markup (callout containers, table wrappers, heading anchor links): identify the callout container selector from one built page first, and compare steps, bullets, code blocks, tables and paragraphs outside callouts.

- [ ] **Step 4: Full gates**

Run: `npm run lint && npm run test && npm run test:py:corpus && npm run test:py:quality && npm run build && npm run check:parity && npm run check:upstream-recovery`
Expected: all pass; 5 counters 0; recovery reports 27 entries (17 renewed + 9 UD-023 + 1 UD-024), `overdue=0`, `stale=0`.

- [ ] **Step 5: Commit** `docs: describe the HTML comparison path`

---

## Summary PR

### Task 9: Vercel Preview review and merge to `main`

**Files:** `.github/workflows/ci.yml` (revert the temporary trigger)

- [ ] **Step 1: Confirm PR A, B and C are merged into `claude/parity-html-integration`, then merge `origin/main` into it.** If snapshots or JA pages changed on `main` meanwhile, rerun `npm run check:parity` and fix before continuing
- [ ] **Step 2: Revert the `ci.yml` commit and open the PR into `main`.** PR body lists each change, the patch counts, the differential gate result and the checklist below.
- [ ] **Step 3: Confirm required CI passes, then run the full gates from Task 8 Step 4 on the integration branch.** Scheduled workflows do not run there.
- [ ] **Step 4: User checks the Vercel Preview**
  - `salesforce-testing/create-a-salesforce-test`: step 5 is the image; steps number 1 to 7.
  - `salesforce-testing/troubleshoot`: the image is a list item.
  - `integrations/sealights-integration`: code block inside the list, copy button works.
  - `advanced-editing/api-testing`: line break before `設定手順:`.
  - `running-tests/running-tests-overview`: table images display.
  - A sample of pages from Task 3: paragraphs between steps, numbering continues (`ol start`).
  - Search opens, returns results and heading links jump correctly.
- [ ] **Step 5: 4-reviewer gate on the whole branch; merge only after explicit user approval**
- [ ] **Step 6: After merge, confirm the production deploy, that the next nightly passes, and that the next scheduled run closes Issue #454**
- [ ] **Step 7: Delete this plan file.** Only after Step 6 is fully confirmed: open a PR from `claude/remove-parity-html-plan` that removes `docs/superpowers/`, and merge it after user approval

---

## End State and Out of Scope

- 15 patches removed, 10 added (9 UD-023, 1 UD-024), 17 renewed: 32 entries become 27, all real upstream defects. `overdue` goes from 32 to 0, and Issue #454 closes on the next scheduled run. It reopens when a renewal window expires without re-verification.
- Out of scope: reporting the upstream defects to Tricentis (needs separate user approval), changing the issue-open condition, converting JA files to HTML, any change to search (it indexes frontmatter and headings only).
