---
name: fix-doc-localization-issues
description: |
  Process GitHub Issues for Testim docs Japanese localization.
  Fetches English originals, fixes Japanese docs (callouts, links, images, Japanese quality),
  then creates PRs.
  Triggers: "/fix-doc-localization-issues", "Issue対応", "Issue処理"
  Arguments: Space-separated Issue numbers (e.g., /fix-doc-localization-issues 40 42 43)
---

# fix-doc-localization-issues Skill

Fix quality issues in Japanese documentation as described in GitHub Issues, then create PRs.

## Arguments

Accepts space-separated Issue numbers.

```
/fix-doc-localization-issues 40 42 43
```

If no arguments are provided, ask the user for Issue numbers.

## Required Reading

Before starting, read and follow all rules in:

- **`docs/WRITING_GUIDE.md`** — Frontmatter, internal links, callouts, source fidelity, terminology
- **`docs/TRANSLATION_GUIDE.md`** — Natural Japanese, NG/OK patterns, terminology table
- **`docs/OPS_DESIGN.md`** — Review policy, feedback loop

## Workflow per Issue

Process Issues one at a time to completion. **Do not interleave branches or PRs across Issues.**

### Step 1: Read the Issue

```bash
gh issue view {ISSUE_NUMBER}
```

- Identify target files, acceptance criteria, and parent Issue (if any)
- Note the `sourceUrl` from each target file's frontmatter

### Step 2: Create Branch

```bash
git checkout main && git pull
git checkout -b claude/{topic-name}
```

Derive the branch name from the Issue content (e.g., `claude/fix-recording-tests`).

### Step 3: Compare with English Original

WebFetch each target file's `sourceUrl` and verify:

- Heading structure and paragraph count match
- Numbered steps are not missing
- All callouts are reflected
- All content images are embedded in the body (not just downloaded — check placement matches the original)

### Step 4: Fix Issues

Apply fixes based on findings. Common patterns:

| Problem | Fix |
|---------|-----|
| Legacy callout (`> 📘`) | Convert to `:::info{title="..."}` |
| `(doc:slug)` links | Convert to `/docs/slug` |
| External link with existing JA file | Convert to `/docs/slug` internal link |
| `:fa-arrow-right:` markers | Remove or replace with bold text |
| Image not embedded | Embed at the correct position per the original |
| Unnatural Japanese | Refer to TRANSLATION_GUIDE NG/OK patterns |
| Mistranslated Testim terms | Revert to English (see TRANSLATION_GUIDE 5.2) |

### Step 5: Codex CLI Review (optional)

Run a read-only review per `.claude/skills/codex-review/SKILL.md`:

```bash
codex -s read-only exec -C . \
  "Review the Japanese documentation files changed on this branch against their English sourceUrl originals. Check: (1) all paragraphs/steps/callouts/images preserved, (2) images embedded at correct positions, (3) internal links use /docs/{slug} format, (4) Testim product names kept in English, (5) callouts use ::: directive syntax. No confirmation or questions needed. Provide concrete issues proactively."
```

Incorporate any feedback from Codex into fixes.

### Step 6: Validate

```bash
npm run lint && npm run test && npm run build
```

**Loop back to Step 4 until all checks pass.**

### Step 7: Commit and Create PR

```bash
git add {target files}
git commit -m "docs: {summary of changes}

Closes #{ISSUE_NUMBER}"
git push -u origin claude/{topic-name}
```

Create PR:

```bash
gh pr create --title "docs: {summary}" --body "$(cat <<'EOF'
## Summary
- {changes}

## Checklist
- [ ] Compared against sourceUrl original
- [ ] Callouts use ::: directive syntax
- [ ] Internal links use /docs/{slug} format
- [ ] Testim terminology kept in English
- [ ] lint / test / build all pass

Closes #{ISSUE_NUMBER}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### Step 8: Update Parent Issue (if applicable)

If a parent Issue has checkboxes for this work, update them:

```bash
gh issue view {PARENT_ISSUE_NUMBER}
```

## When New Patterns Are Discovered

If you find patterns that should be added to TRANSLATION_GUIDE or WRITING_GUIDE:

1. **Do not include guide changes in the Issue fix PR** (keep scope separate)
2. Note the pattern in the PR description under "New patterns discovered: ..."
3. Create a separate commit for guide updates (see `docs/OPS_DESIGN.md` feedback loop)

## Error Handling

| Situation | Action |
|-----------|--------|
| WebFetch fails for sourceUrl | Verify URL in browser. If invalid, comment on the Issue |
| Lint errors | Read error output, fix target files per WRITING_GUIDE |
| Build errors | Check frontmatter YAML syntax. Run `astro check` for details |
| Target file does not exist | Comment on the Issue. Do not create new files without asking |
