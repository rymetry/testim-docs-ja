/** Barrel re-export. Logic split into types, extract, checks, summary, page coverage, and segment-level alignment submodules. */
export * from './source_parity_types.mjs';
export * from './source_parity_extract.mjs';
export * from './source_parity_checks.mjs';
export * from './source_parity_issue_state.mjs';
export * from './source_parity_summary.mjs';
export * from './source_parity_advisory_queue.mjs';
export * from './source_parity_page_coverage.mjs';
export * from './source_parity_acknowledgements.mjs';
export * from './source_parity_baseline.mjs';
export { alignSegments, parityDiffsToIssues } from './source_parity_align.mjs';
export { extractSegmentsFromHtml } from './source_parity_segments_en.mjs';
export { extractSegmentsFromMarkdown } from './source_parity_segments_ja.mjs';
