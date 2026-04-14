#!/usr/bin/env node
/**
 * Phase 1.2: section-internal 手順導入文分離候補を baseline から抽出するスクリプト。
 *
 * 対象: segment-extra where sectionPath is non-empty, segmentKind === 'paragraph'.
 * 判定: JA file 内で単独段落 (独立した \n\n で区切られた段落) として
 *       **〜するには:** 形式のみが存在し、前の段落が平叙文で終わる場合を CANDIDATE とする。
 *
 * CANDIDATE 条件:
 *   1. 単独段落が /^\*\*[^*]+(するには|するとき|の手順|する方法)[:：]\*\*\s*$/ にマッチ
 *   2. 前段落が heading・callout・code block でない（平叙文）
 *   3. 後段落が ordered/unordered list or image or combined prose+list
 *
 * NON-CANDIDATE: パターンが異なる or 既に結合済みの場合 → REVIEW として出力
 *
 * Usage:
 *   node scripts/phase1/enumerate_step_intro_split.mjs
 *   node scripts/phase1/enumerate_step_intro_split.mjs > /tmp/phase1-2-targets.txt
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

// section-internal (sectionPath non-empty) の segment-extra paragraph を抽出
const candidates = baseline.entries.filter(
  (e) =>
    e.issueType === 'segment-extra' &&
    e.segmentKind === 'paragraph' &&
    e.sectionPath &&
    e.sectionPath !== '',
);

// slug ごとに集約
const bySlug = new Map();
for (const c of candidates) {
  if (!bySlug.has(c.slug)) bySlug.set(c.slug, []);
  bySlug.get(c.slug).push(c);
}

/**
 * frontmatter 後の本文から段落リストを返す。
 * 空行区切り (\n\n+) で分割し、空要素を除去。
 */
function extractBodyParagraphs(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  return body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** 段落が heading かどうか */
function isHeading(p) {
  return /^#{1,6}\s/.test(p);
}

/** 段落が callout block かどうか */
function isCallout(p) {
  return /^:::/.test(p);
}

/** 段落が code block かどうか */
function isCodeBlock(p) {
  return /^```/.test(p);
}

/** 段落が ordered/unordered list かどうか */
function isList(p) {
  return /^(\d+\.\s|[-*]\s)/.test(p);
}

/** 段落が image のみかどうか */
function isImageOnly(p) {
  return /^!\[/.test(p.trim());
}

/** 段落が HTML block かどうか */
function isHtmlBlock(p) {
  return /^</.test(p.trim());
}

/**
 * 手順導入文パターン: **〜するには:** のみで構成される段落
 * 段落が "\n" を含む場合は standalone ではない (prose+intro combined)
 */
const STEP_INTRO_PATTERN = /^\*\*[^*]+(するには|するとき|の手順|する方法)[:：]\*\*\s*$/;

let candidateCount = 0;
let nonCandidateCount = 0;
let missCount = 0;

for (const [slug, entries] of bySlug) {
  const filePath = join(REPO_ROOT, 'src/content/docs', slug + '.md');
  if (!existsSync(filePath)) {
    console.log(`[MISS] ${slug}: ファイルが見つかりません`);
    missCount++;
    continue;
  }

  const md = readFileSync(filePath, 'utf8');
  const paragraphs = extractBodyParagraphs(md);

  // CANDIDATE 検出: standalone step-intro paragraph を探す
  const foundCandidates = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    // para に改行が含まれている場合は standalone ではない (既に結合済み)
    if (p.includes('\n')) continue;
    if (!STEP_INTRO_PATTERN.test(p)) continue;

    // 前段落の確認
    if (i === 0) continue;
    const prev = paragraphs[i - 1];
    if (isHeading(prev) || isCallout(prev) || isCodeBlock(prev) || isList(prev) || isImageOnly(prev) || isHtmlBlock(prev)) continue;

    // 後段落の確認 (list, image, HTML block, or prose を許容)
    const next = i + 1 < paragraphs.length ? paragraphs[i + 1] : null;
    // 後段落がない場合も CANDIDATE として扱う (稀だが許容)

    foundCandidates.push({
      idx: i,
      intro: p,
      prevPara: prev.slice(0, 100),
      nextPara: next ? next.slice(0, 80) : '(なし)',
    });
  }

  const entryCount = entries.length;
  const sectionPaths = [...new Set(entries.map((e) => e.sectionPath))].join(' | ');

  if (foundCandidates.length > 0) {
    candidateCount++;
    console.log(`[CANDIDATE] ${slug} (${entryCount} baseline entries)`);
    console.log(`  sectionPath(s): ${sectionPaths}`);
    foundCandidates.forEach((c) => {
      console.log(`  [${c.idx}] intro: ${c.intro}`);
      console.log(`       prev: ${c.prevPara.replace(/\n/g, '↵')}`);
      console.log(`       next: ${c.nextPara.replace(/\n/g, '↵')}`);
    });
  } else {
    nonCandidateCount++;
    console.log(`[NON-CANDIDATE] ${slug} (${entryCount} baseline entries)`);
    console.log(`  sectionPath(s): ${sectionPaths}`);
    // Show context around the section to help manual review
    const sectionPath = entries[0]?.sectionPath ?? '';
    const lastHeading = sectionPath.includes(' > ')
      ? sectionPath.split(' > ').pop()
      : sectionPath;
    // Find the section heading in paragraphs
    const headingIdx = paragraphs.findIndex((p) =>
      isHeading(p) && p.includes(lastHeading ?? ''),
    );
    if (headingIdx >= 0 && headingIdx < paragraphs.length - 1) {
      const nextFew = paragraphs.slice(headingIdx, headingIdx + 5);
      nextFew.forEach((p, i) =>
        console.log(`  para[${headingIdx + i}]: ${p.slice(0, 100).replace(/\n/g, '↵')}`),
      );
    } else {
      console.log(`  (セクション見出しが見つかりません: "${lastHeading}")`);
    }
  }
}

console.log('');
console.log(`合計: ${bySlug.size} slug, ${candidates.length} entries`);
console.log(`CANDIDATE (自動結合候補): ${candidateCount}`);
console.log(`NON-CANDIDATE (REVIEW が必要): ${nonCandidateCount}`);
console.log(`MISS (ファイルが見つからない): ${missCount}`);
