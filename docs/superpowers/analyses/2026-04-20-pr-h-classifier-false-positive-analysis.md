# PR #342 (M2 PR H) — classifier false-positive analysis archive

- **Date**: 2026-04-20
- **Status**: Archived (PR #342 closed per proposal D, Codex Round-3 approved)
- **Scope**: 3 slugs / 6 baseline entries of type `segment-untranslated`
- **Outcome**: All 6 classified as **classifier / detector debt** (not content-translatable); mechanism-fix follow-up PR tracked as D(a2)
- **Baseline impact**: 87 → 87 (no change — analysis was content-empty by design)

## Purpose of this archive

PR #342 was opened as a content PR with empty diff, carrying the analysis solely in its description. Codex Round 2/3 identified this as a category-confusion (analysis is not a merge candidate; silent baseline allowlist would violate principle 5 "許容機構 = broken EN 退避 ONE purpose ONLY"). Proposal D (Codex Round-3 APPROVED) prescribes:

- **(a1) archive** the analysis in the repo as a non-code artifact (this file)
- **(a2) create a follow-up mechanism-fix PR** that eliminates the false-positives at classifier runtime so the 6 entries disappear naturally from baseline at next regen — **no silent allowlist, no `classifier-known-false-positive` metadata**

This archive preserves the analysis so the follow-up mechanism PR has full context, without polluting `parity-baseline.json` with false-positive metadata.

## Analysis by slug

### 1. `editing-tests/steps` (1 entry)

- **Entry**: table-cell, sec 5, idx 13 — keyboard-key label list
- **Content excerpt**: "キーボードキー押下時（Enter、Tab、ESC、Page Up、Page Down など）"
- **Why classifier flags it**: `RESIDUE_MIN_WORDS = 3` triggers on the 5-key ASCII list regardless of wrap (backticks / bold / `<kbd>` / fullwidth-separator)
- **Why content cannot change**: `GLOSSARY.md` §[禁止] explicitly excludes `Enter` / `Tab` / `Page Up` / `Page Down` from glossary registration (silent false-negative risk on general prose). The JA content already follows source-first mirror; the list itself is semantically mandatory for UX (users press those keys).
- **Evidence of non-translatability** (tested via `classifySegment(normalizeSegmentText(...))`):
  - Backtick wrap: `` `Enter`, `Tab`... `` → normalize strips backticks → residue 5 words
  - Bold wrap: `**Enter**, **Tab**...` → residue 5 words
  - `<kbd>Enter</kbd>` HTML → residue 5 words
  - Fullwidth full-stop separators → `CJK_RE` strips them → 5 words remain
  - `/docs/...` link wrap → label preserved → residue 5 words
  - Image placeholder → strips but destroys semantics

### 2. `running-tests/the-command-line-cli` (3 entries)

- **Entries**: para idx 5, callout idx 0, operand para idx 0 — example letter labels (A/B/C/D/P) + Boolean operator literals (AND/OR)
- **Why classifier flags it**: same `RESIDUE_MIN_WORDS = 3` trigger on the short uppercase tokens
- **Why content cannot change**:
  - PR #337 rework commit `44541cc` explicitly reverted an earlier 甲乙丙丁 (kanji labels) attempt as `TRANSLATION_GUIDE.md §5` violation
  - Test `scripts/__tests__/source_parity_representative_summary.test.mjs` pins this slug in `RESIDUAL_PAGES` with a required `segment-untranslated` baseline count ≥ 1
  - QA HIGH on commit `233099b`: users must see literal `OR` for copy-paste
  - Fullwidth Ａ/Ｂ/Ｃ/Ｄ would replicate the same §5 violation
- **Prior art**: principled revert already landed in main; any content attempt here would re-trigger the violation

### 3. `security/sso-integration/azure-ad-sso-integration` (2 entries)

- **Entries**: ordered-list idx 2, idx 3 — Azure vendor UI labels
- **Content excerpts**:
  - `**What's the name of your app?**`
  - `**Choose Integrate any other application you don't find in the gallery (Non-gallery)**`
- **Why classifier flags it**: the labels contain common English words (what/the/of/your/don't/in/other/gallery) that are not registered in glossary
- **Why content cannot change**: Paraphrasing loses the UI-label-reference users need to locate the field in Azure Portal. Per `WRITING_GUIDE.md` Testim/vendor UI preservation policy, these must remain English verbatim.

## 3 distinct mechanism-gap categories identified (D(a2) design input)

### Category 1 — Keyboard-key list in prose (1 slug / 1 entry)

Need a narrow `INVARIANT_TOKEN` pattern like:

```
/\bEnter\b|\bTab\b|\bESC\b|\bPage\s+(?:Up|Down)\b/
```

scoped to parenthetical contexts (e.g. `（...）` / `(...)`) to avoid silent false-negatives on general prose. Key requirement: must not mask occurrences in sentences describing key behavior in narrative form.

### Category 2 — Example-letter labels in technical prose (1 slug / 3 entries)

Single-letter labels (A, B, C, D, P) used as placeholders. Classifier `RESIDUE_MIN_WORDS = 3` is too coarse. Candidate mechanisms:

- Require residue to contain at least one multi-character English word (single-letter residue auto-masks as non-prose)
- Context-aware pattern: `(ラベル|label)\s*[A-Z]` match + mask

### Category 3 — Vendor UI labels containing common English words (1 slug / 2 entries)

Azure dialog prompts quoted verbatim. Candidate mechanisms:

- Register high-frequency vendor UI compound labels as multi-word Tier B glossary entries
- Add a structural pattern for `**{N+ word English compound}**` as vendor UI surface (bold-wrapped English sentences)

## Non-goals (explicit)

Per principle 5 ("許容機構 = broken EN 退避 ONE purpose ONLY"), the following are **not** valid resolutions:

- ❌ Silent baseline allowlist / `classifier-known-false-positive` metadata
- ❌ Adding a new registry lane in `parity_artifact_registry.mjs` for these entries (not an EN-side artifact)
- ❌ `ja_omission_policy_registry` entry (not a JA-omission policy)
- ❌ Adding narrow ack rule in `source_parity_acknowledgements.mjs`

The only valid path is a classifier mechanism fix in `scripts/lib/parity_glossary_mask.mjs` (or adjacent detector code) that surfaces zero false-positives for these patterns at runtime. Upon landing D(a2), full regen should show the 6 entries naturally absent.

## Links

- PR #342 (closed): `claude/m2-pr-h-untranslated-cleanup` branch — preserved in git history via `git log origin/claude/m2-pr-h-untranslated-cleanup` for reference
- Follow-up mechanism PR: D(a2) — TBD
- Codex Round 2/3 disposition: APPROVE on D
- Parent plan: `docs/superpowers/plans/2026-04-16-m2-parity-burndown.md` §P2-5
- Source contract for false-positive handling: `docs/superpowers/specs/2026-04-14-parity-phase4-final-goal.md` §4.0 (suppression-lane contract, A'.1)
