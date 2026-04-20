#!/usr/bin/env node
// scripts/render_upstream_recovery_comment.mjs
/**
 * Render the sticky PR comment body for upstream recovery signals.
 *
 * Reads `upstream-recovery-status.json`, delegates to
 * `renderUpstreamRecoveryStickyComment` (single source of truth for the
 * markdown), and either:
 *   - writes `upstream-recovery-comment.md` + prints `has_signals=true` →
 *     CI workflow upserts the sticky comment with that body
 *   - writes nothing and prints `has_signals=false` →
 *     CI workflow deletes any pre-existing sticky comment
 *
 * Exit 0 unconditionally (mirrors check_upstream_recovery.mjs non-blocking
 * contract). Any error surfaces through stderr; the CI workflow has
 * `continue-on-error: true` so nothing downstream gates on this step.
 *
 * @module render_upstream_recovery_comment
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT_DIR } from '../lib/project.mjs';
import { renderUpstreamRecoveryStickyComment } from '../lib/detection_reports.mjs';

const STATUS_PATH = path.join(ROOT_DIR, 'upstream-recovery-status.json');
const COMMENT_PATH = path.join(ROOT_DIR, 'upstream-recovery-comment.md');

/**
 * CI signal: a single line written to stdout for GitHub Actions to capture.
 * Format: `has_signals=true|false` → consumed by workflow `env` / step output.
 */
function emitSignal(flag) {
  process.stdout.write(`has_signals=${flag}\n`);
}

function main() {
  if (!existsSync(STATUS_PATH)) {
    // No artifact → nothing to render. Treat as "no signals" for cleanup.
    if (existsSync(COMMENT_PATH)) unlinkSync(COMMENT_PATH);
    emitSignal('false');
    return 0;
  }
  let payload;
  try {
    payload = JSON.parse(readFileSync(STATUS_PATH, 'utf8'));
  } catch (err) {
    console.error(
      `[render-upstream-recovery] failed to parse upstream-recovery-status.json: ${err.message}. ` +
        'Treating as no-signals.',
    );
    if (existsSync(COMMENT_PATH)) unlinkSync(COMMENT_PATH);
    emitSignal('false');
    return 0;
  }
  const body = renderUpstreamRecoveryStickyComment(payload);
  if (body === null) {
    if (existsSync(COMMENT_PATH)) unlinkSync(COMMENT_PATH);
    emitSignal('false');
    return 0;
  }
  writeFileSync(COMMENT_PATH, body.endsWith('\n') ? body : body + '\n');
  emitSignal('true');
  return 0;
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(`[render-upstream-recovery] unexpected failure: ${err.message}`);
    // Non-blocking exit.
    process.exit(0);
  }
}
