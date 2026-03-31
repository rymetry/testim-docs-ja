import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractSlug } from './madcap_toc.mjs';

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
export const SIDEBAR_URLS_PATH = path.join(ROOT, 'docs', 'SIDEBAR_URLS.md');

function normalizeSectionKey(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[()]/g, '（')
    .replace(/[）]/g, '）')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function splitSectionTitle(rawTitle) {
  const match = rawTitle.match(/^(.+?)(?:[（(]([^）)]+)[）)])?$/);
  const english = (match?.[1] ?? rawTitle).trim();
  const japanese = (match?.[2] ?? '').trim();
  return { english, japanese };
}

export function parseSidebarSections(sidebarText) {
  const lines = sidebarText.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      const rawTitle = headingMatch[1].trim();
      if (['翻訳ステータス', '検証ステータス', 'URL抽出方法'].includes(rawTitle)) {
        current = null;
        continue;
      }

      const { english, japanese } = splitSectionTitle(rawTitle);
      current = {
        rawTitle,
        english,
        japanese,
        items: [],
      };
      sections.push(current);
      continue;
    }

    const itemMatch = line.match(
      /^\-\s*(✅🔍|✅|⏳)\s+(https:\/\/docs\.tricentis\.com\/testim\/content\/[^\s]+\.htm)\s*$/
    );
    if (itemMatch && current) {
      const url = itemMatch[2];
      current.items.push({
        status: itemMatch[1],
        url,
        slug: extractSlug(url),
      });
    }
  }

  return sections;
}

export function loadSidebarSections(sidebarPath = SIDEBAR_URLS_PATH) {
  return parseSidebarSections(fs.readFileSync(sidebarPath, 'utf8'));
}

// Backward-compatible aliases for renamed section labels.
// Maps old Japanese label → current Japanese label.
const SECTION_ALIASES = new Map([
  ['テスト結果', '結果'],
  ['管理者機能', '管理'],
]);

export function findSidebarSection(sections, sectionName) {
  if (!sectionName) return null;
  const normalizedTarget = normalizeSectionKey(sectionName);

  const match = sections.find((section) =>
    [section.rawTitle, section.english, section.japanese]
      .filter(Boolean)
      .some((candidate) => normalizeSectionKey(candidate) === normalizedTarget)
  );
  if (match) return match;

  const alias = SECTION_ALIASES.get(sectionName.trim());
  if (alias) return findSidebarSection(sections, alias);

  return null;
}

export function getSectionSlugSet(sectionName, sections = loadSidebarSections()) {
  const section = findSidebarSection(sections, sectionName);
  if (!section) {
    const known = sections.map((entry) => entry.rawTitle).join(', ');
    throw new Error(`Unknown section "${sectionName}". Known sections: ${known}`);
  }
  return new Set(section.items.map((item) => item.slug));
}

export function extractJapaneseLabel(sectionTitle) {
  const m = sectionTitle.match(/[（(]([^）)]+)[）)]/);
  return (m ? m[1] : sectionTitle).trim();
}

export function filterItemsBySection(items, sectionName, sections = loadSidebarSections()) {
  if (!sectionName) return items;
  const slugSet = getSectionSlugSet(sectionName, sections);
  return items.filter((item) => slugSet.has(item.slug));
}
