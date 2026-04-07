/** Shared severity mappings and pattern constants for the source parity checking system. */

export const ISSUE_SEVERITY = Object.freeze({
  untranslated: 'actionable',
  'legacy-callout': 'actionable',
  'jsx-callout': 'actionable',
  'h1-in-body': 'actionable',
  'image-mismatch': 'actionable',
  'codeblock-mismatch': 'actionable',
  'image-order-mismatch': 'actionable',
  'callout-nesting-mismatch': 'actionable',
  'step-count-mismatch': 'signal',
  'bullet-count-mismatch': 'signal',
  'paragraph-count-mismatch': 'signal',
  'heading-mismatch': 'signal',
  'section-count-mismatch': 'signal',
  'table-shape-mismatch': 'signal',
  'table-cell-english-residual': 'signal',
  'table-cell-empty-mismatch': 'signal',
  'table-cell-token-mismatch': 'signal',
  'source-page-missing-local': 'actionable',
  'local-page-orphan': 'actionable',
  'missing-fresh-snapshot': 'actionable',
  'missing-snapshot': 'signal',
  'source-fetch-error': 'error',
  // Phase 5 exact diff gate types — emitted by source_parity_align.mjs.
  // All five are gate-eligible (actionable). Three are also listed in
  // NON_ACKNOWLEDGEABLE_TYPES (segment-missing, segment-untranslated,
  // segment-token-gap); segment-extra and segment-shifted remain
  // acknowledgeable per the Issue #225 spec because surplus content and
  // structural shifts can be legitimate translation choices that need
  // human review, not auto-suppression.
  'segment-missing': 'actionable',
  'segment-extra': 'actionable',
  'segment-shifted': 'actionable',
  'segment-untranslated': 'actionable',
  'segment-token-gap': 'actionable',
  'segment-inconclusive': 'actionable',
});

/**
 * Phase 8: explicit allowlist of "coarse counting / shape" signals that are
 * demoted to audit-only output. These types still flow into
 * `parity-check-status.json` and are visible in the deep-audit workflow, but
 * they no longer feed into `parityRegression.shouldOpenIssue`, the gate
 * exit code, or the active-file accounting that drives them.
 *
 * IMPORTANT — this is an explicit allowlist, NOT a severity-based filter.
 * Severity-based ("any signal") filtering would incorrectly demote
 * `missing-snapshot`, which is the gate signal for missing-fetch pages
 * (alongside the actionable `missing-fresh-snapshot`) and must remain
 * reportable.
 *
 * See: docs/superpowers/specs/2026-04-07-issue-225-phase-8-design.md §3.1
 */
export const COARSE_SIGNAL_TYPES = Object.freeze(
  new Set([
    'paragraph-count-mismatch',
    'bullet-count-mismatch',
    'step-count-mismatch',
    'section-count-mismatch',
    'heading-mismatch',
    'table-shape-mismatch',
    'table-cell-english-residual',
    'table-cell-empty-mismatch',
    'table-cell-token-mismatch',
  ]),
);

export const UNTRANSLATED_PATTERNS = Object.freeze([
  /^(?:\d+\.\s*)?Hover over the\b/i,
  /^(?:\d+\.\s*)?Click on the\b/i,
  /^(?:\d+\.\s*)?Click on \*\*/i,
  /^(?:\d+\.\s*)?Scroll down through the menu/i,
  /^(?:\d+\.\s*)?Select the\b/i,
  /^(?:\d+\.\s*)?If you would like to\b/i,
  /^(?:\d+\.\s*)?The file is uploaded/i,
  /^(?:\d+\.\s*)?In the\b.*\bpanel\b/i,
  /^(?:\d+\.\s*)?From the\b.*\bdrop-?down\b/i,
]);

export const LEGACY_CALLOUT_RE = /^>\s*(?:📘|❗️?|🚧|👍|⚠️|📝|✅|❌|💡|ℹ️|⛔|🔥|💥|🎯|📌|🏷️)\s/;
export const JSX_CALLOUT_RE = /^<Callout\b/i;
export const H1_IN_BODY_RE = /^#\s+\S/;
export const FENCE_LINE_RE = /^\s*(?:(?:[-*+]\s+|\d+\.\s+))?```/;
