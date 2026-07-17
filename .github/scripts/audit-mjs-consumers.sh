#!/usr/bin/env bash
# Phase 6b cutover audit: detect unexpected mjs / cjs consumer references.
#
# Allow-list (2 assets):
#   - .github/scripts/sync-detection-issues.cjs  (Phase 6.1 scope)
#   - scripts/__tests__/sync_detection_issues.test.mjs
# Temporary Issue #414 evaluation consumers (the evaluation PR is never merged):
#   - package.json test:astro-defaults command
#   - scripts/compare-astro-defaults-visual.mjs usage text
#
# The search file-type allow-list is intentionally narrow to keep noise low.
# docs/*.md is excluded (historical notes reference removed mjs paths as
# narrative). This audit runs in CI (python-fast job) and should return exit 0
# when only the allow-listed references remain.

set -euo pipefail

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$ROOT"

# Scan package.json + .github + scripts for disallowed mjs / cjs consumer paths.
# Exclude this audit script itself (it contains the regex by nature) and the
# CI workflow file that invokes it.
MATCHES=$(grep -rEn \
  '(scripts/(lib|detection|pipeline|tools)/[^ ]*\.mjs|node scripts/)' \
  --include='*.json' --include='*.yml' --include='*.yaml' \
  --include='*.mjs' --include='*.cjs' --include='*.ts' --include='*.tsx' \
  package.json .github scripts \
  2>/dev/null \
  | grep -vE \
    'sync-detection-issues\.cjs|scripts/__tests__/sync_detection_issues\.test\.mjs|test:astro-defaults|scripts/compare-astro-defaults-visual\.mjs|\.github/scripts/audit-mjs-consumers\.sh|\.github/workflows/ci\.yml' \
  || true)

if [ -n "$MATCHES" ]; then
  echo "::error::Unexpected mjs consumer residue (Phase 6b disallows mjs outside the 4-asset allow-list):"
  echo "$MATCHES"
  exit 1
fi
echo "mjs consumer audit clean"
