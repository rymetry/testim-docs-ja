#!/usr/bin/env node
/**
 * Phase 1.3: callout 内番号リスト / 箇条書き展開候補を baseline から抽出するスクリプト。
 *
 * 対象: segment-extra where segmentKind === 'unordered-list-item' | 'ordered-list-item' | 'callout-body'
 *
 * CANDIDATE 検出ロジック:
 *   1. 対象 slug の JA md ファイルを読み、callout (:::type) ブロック内に
 *      - item or 1. item の連続リストがある callout を抽出
 *   2. EN snapshot の該当 callout を確認:
 *      - EN の callout に <ol>/<ul> 構造 → LIST_MATCH (JA のリスト構造は正しい)
 *      - EN の callout に <p> inline で列挙 → INLINE_MATCH (JA を inline 化すべき)
 *      - 判定不可 → REVIEW
 *
 * Usage:
 *   node scripts/phase1/enumerate_callout_list_expansion.mjs
 *   node scripts/phase1/enumerate_callout_list_expansion.mjs > /tmp/phase1-3-targets.txt
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

const baseline = JSON.parse(
  readFileSync(join(REPO_ROOT, 'parity-baseline.json'), 'utf8'),
);

// segment-extra で list 関連の kind を抽出 (callout-body も含む)
const candidates = baseline.entries.filter(
  (e) =>
    e.issueType === 'segment-extra' &&
    (e.segmentKind === 'unordered-list-item' ||
      e.segmentKind === 'ordered-list-item' ||
      e.segmentKind === 'callout-body'),
);

// slug ごとに集約
const bySlug = new Map();
for (const c of candidates) {
  if (!bySlug.has(c.slug)) bySlug.set(c.slug, []);
  bySlug.get(c.slug).push(c);
}

const CALLOUT_OPEN_RE = /^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$/;
const CALLOUT_CLOSE_RE = /^:::\s*$/;
const ORDERED_RE = /^(\s*)\d+\.\s+(.+)$/;
const UNORDERED_RE = /^(\s*)[-*+]\s+(.+)$/;
const FENCE_RE = /^(`{3,}|~{3,})/;

/**
 * frontmatter 後の本文から行リストを返す。
 */
function getBodyLines(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  return body.split('\n');
}

/**
 * JA md から callout ブロック内にリストがある callout を検出する。
 * 戻り値: Array<{ type, lines: string[], listLines: string[], startLine, endLine }>
 */
function findCalloutsWithLists(md) {
  const lines = getBodyLines(md);
  const results = [];
  let inCallout = false;
  let calloutType = '';
  let calloutLines = [];
  let calloutStart = -1;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code fence tracking (skip content inside fences)
    if (FENCE_RE.test(trimmed)) {
      inFence = !inFence;
      if (inCallout) calloutLines.push(line);
      continue;
    }

    if (inFence) {
      if (inCallout) calloutLines.push(line);
      continue;
    }

    if (!inCallout) {
      const openMatch = trimmed.match(CALLOUT_OPEN_RE);
      if (openMatch) {
        inCallout = true;
        calloutType = openMatch[1];
        calloutLines = [];
        calloutStart = i;
      }
      continue;
    }

    // Inside callout
    if (CALLOUT_CLOSE_RE.test(trimmed)) {
      // Check if callout has list items
      const listLines = calloutLines.filter(
        (l) => ORDERED_RE.test(l.trim()) || UNORDERED_RE.test(l.trim()),
      );
      if (listLines.length > 0) {
        results.push({
          type: calloutType,
          lines: calloutLines.slice(),
          listLines,
          startLine: calloutStart,
          endLine: i,
        });
      }
      inCallout = false;
      calloutType = '';
      calloutLines = [];
      calloutStart = -1;
      continue;
    }

    calloutLines.push(line);
  }

  return results;
}

/**
 * EN snapshot HTML から slug に対応する HTML を読み込む。
 * slug → snapshots/en/content/{folder}/{basename}.html
 */
function loadEnSnapshot(slug) {
  const parts = slug.split('/');
  const htmlPath = join(
    REPO_ROOT,
    'snapshots',
    'en',
    'content',
    ...parts.slice(0, -1),
    parts[parts.length - 1] + '.html',
  );
  if (!existsSync(htmlPath)) return null;
  return readFileSync(htmlPath, 'utf8');
}

/**
 * EN snapshot の callout div を抽出する。
 * MadCap Flare は <div class="note">, <div class="warning">, etc. を使用。
 * 戻り値: Array<{ divClass: string, innerHtml: string, hasOlUl: boolean }>
 */
function extractEnCallouts(html) {
  const calloutDivRe =
    /<div\s+class="(note|warning|caution|tip|info|danger|important)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const results = [];
  let match;
  while ((match = calloutDivRe.exec(html)) !== null) {
    const divClass = match[1].toLowerCase();
    const innerHtml = match[2];
    const hasOlUl = /<ol\b|<ul\b/i.test(innerHtml);
    results.push({ divClass, innerHtml, hasOlUl });
  }
  return results;
}

// JA callout type → EN div class candidates
const TYPE_MAP = {
  note: ['note'],
  warning: ['warning'],
  caution: ['caution', 'warning'],
  tip: ['tip'],
  info: ['info', 'note'],
  danger: ['danger', 'important'],
};

/**
 * JA callout のリストが EN で <ol>/<ul> か <p> inline かを判定する。
 */
function classifyCalloutListVsEn(jaCallout, enHtml, calloutIndexAmongSameType) {
  if (!enHtml) return 'REVIEW';

  const enCallouts = extractEnCallouts(enHtml);
  const acceptedClasses = TYPE_MAP[jaCallout.type] ?? [jaCallout.type];
  const matchingEnCallouts = enCallouts.filter((e) =>
    acceptedClasses.includes(e.divClass),
  );

  const enCallout =
    matchingEnCallouts[calloutIndexAmongSameType] ?? matchingEnCallouts[0];
  if (!enCallout) return 'REVIEW';

  if (enCallout.hasOlUl) return 'LIST_MATCH';

  // EN has no ol/ul → check if there's any <p> (items likely inlined)
  const hasParagraph = /<p\b/i.test(enCallout.innerHtml);
  if (hasParagraph) return 'INLINE_MATCH';

  return 'REVIEW';
}

/**
 * EN callout の inner HTML からテキストを抽出 (タグ除去)。
 */
function stripHtmlTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let inlineMatchCount = 0;
let listMatchCount = 0;
let reviewCount = 0;
let missCount = 0;
let noCalloutListCount = 0;

for (const [slug, entries] of bySlug) {
  const filePath = join(REPO_ROOT, 'src/content/docs', slug + '.md');
  if (!existsSync(filePath)) {
    console.log(`[MISS] ${slug}: ファイルが見つかりません`);
    missCount++;
    continue;
  }

  const md = readFileSync(filePath, 'utf8');
  const calloutsWithLists = findCalloutsWithLists(md);

  if (calloutsWithLists.length === 0) {
    // List items are outside callouts — issue has a different cause
    noCalloutListCount++;
    const kinds = [...new Set(entries.map((e) => e.segmentKind))].join(', ');
    const sectionPaths = [
      ...new Set(entries.map((e) => e.sectionPath || '(preface)')),
    ].join(' | ');
    console.log(
      `[NO-CALLOUT-LIST] ${slug} (${entries.length} entries: ${kinds})`,
    );
    console.log(`  sectionPath(s): ${sectionPaths}`);
    continue;
  }

  const enHtml = loadEnSnapshot(slug);
  if (!enHtml) {
    console.log(`[MISS-SNAPSHOT] ${slug}: EN snapshot が見つかりません`);
    missCount++;
    continue;
  }

  const sectionPaths = [
    ...new Set(entries.map((e) => e.sectionPath || '(preface)')),
  ].join(' | ');

  // Track per-type index for EN callout matching
  const typeIndexTracker = {};

  for (let ci = 0; ci < calloutsWithLists.length; ci++) {
    const jaCallout = calloutsWithLists[ci];
    const typeKey = jaCallout.type;
    typeIndexTracker[typeKey] = (typeIndexTracker[typeKey] ?? 0);
    const typeIndex = typeIndexTracker[typeKey];
    typeIndexTracker[typeKey] += 1;

    const verdict = classifyCalloutListVsEn(jaCallout, enHtml, typeIndex);

    if (verdict === 'INLINE_MATCH') {
      inlineMatchCount++;
      console.log(
        `[CANDIDATE:INLINE_MATCH] ${slug} (callout #${ci}: :::${jaCallout.type})`,
      );
      console.log(`  entries: ${entries.length}, sectionPath(s): ${sectionPaths}`);
      console.log(`  JA list lines (${jaCallout.listLines.length}):`);
      for (const l of jaCallout.listLines) {
        console.log(`    ${l.trim()}`);
      }
      // Show corresponding EN callout for verification
      const enCallouts = extractEnCallouts(enHtml);
      const acceptedClasses = TYPE_MAP[jaCallout.type] ?? [jaCallout.type];
      const matchingEn = enCallouts.filter((e) =>
        acceptedClasses.includes(e.divClass),
      );
      const enCallout = matchingEn[typeIndex] ?? matchingEn[0];
      if (enCallout) {
        const stripped = stripHtmlTags(enCallout.innerHtml).slice(0, 300);
        console.log(`  EN callout content: ${stripped}`);
      }
    } else if (verdict === 'LIST_MATCH') {
      listMatchCount++;
      console.log(
        `[LIST_MATCH] ${slug} (callout #${ci}: :::${jaCallout.type})`,
      );
      console.log(`  entries: ${entries.length}, sectionPath(s): ${sectionPaths}`);
      console.log(
        `  JA list lines: ${jaCallout.listLines.length} (EN も <ol>/<ul> — 変更不要)`,
      );
    } else {
      reviewCount++;
      console.log(`[REVIEW] ${slug} (callout #${ci}: :::${jaCallout.type})`);
      console.log(`  entries: ${entries.length}, sectionPath(s): ${sectionPaths}`);
      console.log(`  EN callout 対応なし、または判定不可`);
    }
  }
}

console.log('');
console.log(`合計: ${bySlug.size} slug, ${candidates.length} entries`);
console.log(
  `CANDIDATE:INLINE_MATCH (inline 化すべき callout): ${inlineMatchCount}`,
);
console.log(`LIST_MATCH (EN も list 構造、変更不要): ${listMatchCount}`);
console.log(`REVIEW (判定不可): ${reviewCount}`);
console.log(
  `NO-CALLOUT-LIST (callout 外のリスト、Phase 1.3 対象外): ${noCalloutListCount}`,
);
console.log(`MISS (ファイル/snapshot なし): ${missCount}`);
