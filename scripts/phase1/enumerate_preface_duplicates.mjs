#!/usr/bin/env node
/**
 * Phase 1.1: preface 重複候補を baseline から抽出するスクリプト。
 *
 * 対象: segment-extra in preface (sectionPath is empty).
 * 判定: JA file の frontmatter description と最初の段落本文を比較。
 *       正規化した文字列が一致 or 90%+ 重複なら HIT として出力。
 *       判断が難しい場合は REVIEW として出力。
 *
 * HIT 判定条件:
 *   1. 先頭 paragraph が description と完全一致（正規化後）
 *   2. 先頭 paragraph が description の先頭部分と一致（前半 80% 以上）
 *   3. 先頭 paragraph が description の部分文字列として含まれる（正規化後）
 *
 * Usage:
 *   node scripts/phase1/enumerate_preface_duplicates.mjs
 *   node scripts/phase1/enumerate_preface_duplicates.mjs > /tmp/phase1-1-targets.txt
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

// preface (sectionPath=空) の segment-extra を slug 別に集約
const candidates = baseline.entries.filter(
  (e) => e.issueType === 'segment-extra' && (!e.sectionPath || e.sectionPath === ''),
);

const bySlug = new Map();
for (const c of candidates) {
  if (!bySlug.has(c.slug)) bySlug.set(c.slug, []);
  bySlug.get(c.slug).push(c);
}

/**
 * frontmatter から description を抽出する。
 * YAML block scalar (>-) にも対応: 複数行を 1 行に結合する。
 */
function extractFrontmatterDescription(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];

  // YAML block scalar: description: >-\n  line1\n  line2
  const blockMatch = fm.match(/^description:\s*>-\s*\n((?:\s{2}.+\n?)+)/m);
  if (blockMatch) {
    const lines = blockMatch[1]
      .split('\n')
      .map((l) => l.replace(/^\s{2}/, '').trim())
      .filter(Boolean);
    return lines.join(' ');
  }

  // シングルライン（引用符あり / なし）
  const dm = fm.match(/^description:\s*(.+)$/m);
  if (!dm) return null;
  return dm[1].trim().replace(/^['"]|['"]$/g, '');
}

/**
 * frontmatter 後の本文から段落リストを返す。
 * 空行区切りで分割し、空の要素・コメント行を除去。
 */
function extractBodyParagraphs(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  return body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('<!--'));
}

/**
 * 段落が heading かどうか判定する。
 */
function isHeading(p) {
  return /^#{1,6}\s/.test(p);
}

/**
 * 段落が callout block かどうか判定する。
 */
function isCallout(p) {
  return /^:::/.test(p);
}

/**
 * 段落が コードフェンス かどうか判定する。
 */
function isCodeBlock(p) {
  return /^```/.test(p);
}

/**
 * 比較用正規化: 空白・句読点・記号を除去して lowercase に変換。
 * URL・Markdown リンク構文も除去して比較する。
 */
function normalizeForCompare(s) {
  if (!s) return '';
  return s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Markdown リンク → テキストのみ
    .replace(/https?:\/\/[^\s)]+/g, '') // URL 除去
    .replace(/[\s、。「」『』【】（）()・\-_*#`|]/g, '') // 記号・空白除去
    .toLowerCase();
}

let hits = 0;
let reviews = 0;
let misses = 0;

for (const [slug, entries] of bySlug) {
  const filePath = join(REPO_ROOT, 'src/content/docs', slug + '.md');
  if (!existsSync(filePath)) {
    console.log(`[MISS] ${slug}: ファイルが見つかりません`);
    misses++;
    continue;
  }

  const md = readFileSync(filePath, 'utf8');
  const desc = extractFrontmatterDescription(md);
  const paragraphs = extractBodyParagraphs(md);

  // 最初の非 heading・非 callout・非 code 段落を取得
  const firstPara = paragraphs.find((p) => !isHeading(p) && !isCallout(p) && !isCodeBlock(p));

  const descN = normalizeForCompare(desc);
  const paraN = normalizeForCompare(firstPara);

  // HIT 判定
  let isHit = false;
  let hitReason = '';

  if (desc && firstPara) {
    if (descN === paraN) {
      isHit = true;
      hitReason = '完全一致';
    } else if (descN.length >= 20 && paraN.startsWith(descN)) {
      isHit = true;
      hitReason = 'description が先頭段落の先頭部分と一致';
    } else if (descN.length >= 20 && descN.startsWith(paraN) && paraN.length >= descN.length * 0.7) {
      isHit = true;
      hitReason = '先頭段落が description の前半部分と一致';
    } else if (
      descN.length >= 30 &&
      paraN.length >= 30 &&
      paraN.includes(descN) &&
      descN.length >= paraN.length * 0.6
    ) {
      isHit = true;
      hitReason = 'description が先頭段落に包含される';
    }
  }

  const entryCount = entries.length;
  const kinds = entries.map((e) => e.segmentKind).join(', ');

  if (isHit) {
    hits++;
    console.log(`[HIT] ${slug} (${entryCount} entries: ${kinds})`);
    console.log(`  理由: ${hitReason}`);
    console.log(`  desc (${descN.length}): ${(desc || '').slice(0, 100)}`);
    console.log(`  para (${paraN.length}): ${(firstPara || '').slice(0, 100)}`);
  } else {
    reviews++;
    console.log(`[REVIEW] ${slug} (${entryCount} entries: ${kinds})`);
    if (desc) {
      console.log(`  desc: ${desc.slice(0, 100)}`);
    } else {
      console.log(`  desc: (空)`);
    }
    if (firstPara) {
      console.log(`  para: ${firstPara.slice(0, 100)}`);
    } else {
      console.log(`  para: (段落なし)`);
    }
  }
}

console.log('');
console.log(`合計: ${bySlug.size} slug, ${candidates.length} entries`);
console.log(`HIT (自動削除可能): ${hits}`);
console.log(`REVIEW (手動確認が必要): ${reviews}`);
console.log(`MISS (ファイルが見つからない): ${misses}`);
