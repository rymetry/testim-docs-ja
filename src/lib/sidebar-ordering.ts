import fs from 'node:fs';
import path from 'node:path';

export type SidebarOrdering = {
  categoryIndexByLabel: Map<string, number>;
  itemIndexBySlug: Map<string, number>;
};

export const FALLBACK_CATEGORY_ORDER: string[] = [
  'Changelog',
  '概要',
  'はじめに',
  'テストの記録',
  'テスト編集',
  '高度な編集',
  'テスト実行',
  'テスト結果',
  'デバッグ',
  'テスト管理',
  'モバイルアプリ',
  'デバイス管理',
  '統合',
  '設定',
  '管理者機能',
  'TestOps',
  'Salesforceテスト',
  'Testim拡張機能',
  'セキュリティ',
  'ガイド',
  'Testim Labs',
];

function extractJapaneseLabel(sectionTitle: string): string {
  const match = sectionTitle.match(/[（(]([^）)]+)[）)]/);
  return (match ? match[1] : sectionTitle).trim();
}

function extractSlugFromTricentisUrl(url: string): string | null {
  const match = url.match(/\/content\/(.+?)(?:\/index)?\.htm$/i);
  return match ? match[1].toLowerCase() : null;
}

function fallbackOrdering(): SidebarOrdering {
  return {
    categoryIndexByLabel: new Map(FALLBACK_CATEGORY_ORDER.map((label, index) => [label, index])),
    itemIndexBySlug: new Map(),
  };
}

function resolveSidebarPath(): string | URL | undefined {
  const candidatePaths = [
    path.join(process.cwd(), 'docs', 'SIDEBAR_URLS.md'),
    new URL('../../docs/SIDEBAR_URLS.md', import.meta.url),
  ];
  return candidatePaths.find((candidate) => fs.existsSync(candidate));
}

export function getSidebarOrdering(): SidebarOrdering {
  try {
    const sidebarPath = resolveSidebarPath();
    if (!sidebarPath) return fallbackOrdering();

    const sectionRe = /^##\s+(.+?)\s*$/;
    const urlLineRe =
      /^-\s+(?:✅🔍|✅|⏳)\s+(https:\/\/docs\.tricentis\.com\/testim\/content\/[^\s]+\.htm)\s*$/;

    const categoryIndexByLabel = new Map<string, number>();
    const itemIndexBySlug = new Map<string, number>();
    let currentCategory: string | null = null;
    let globalItemIndex = 0;
    let failedSlugCount = 0;

    for (const line of fs.readFileSync(sidebarPath, 'utf8').split(/\r?\n/)) {
      const sectionMatch = line.match(sectionRe);
      if (sectionMatch) {
        const rawLabel = sectionMatch[1].trim();
        if (
          rawLabel === '翻訳ステータス' ||
          rawLabel === '検証ステータス' ||
          rawLabel === 'URL抽出方法'
        ) {
          currentCategory = null;
          continue;
        }

        const label = extractJapaneseLabel(rawLabel);
        currentCategory = label === 'Home' ? null : label;
        if (currentCategory && !categoryIndexByLabel.has(currentCategory)) {
          categoryIndexByLabel.set(currentCategory, categoryIndexByLabel.size);
        }
        continue;
      }

      const urlMatch = line.match(urlLineRe);
      if (!urlMatch || !currentCategory) continue;

      const slug = extractSlugFromTricentisUrl(urlMatch[1]);
      if (!slug) {
        failedSlugCount++;
        continue;
      }
      if (!itemIndexBySlug.has(slug)) {
        itemIndexBySlug.set(slug, globalItemIndex++);
      }
    }

    if (failedSlugCount > 0) {
      console.warn(
        `[docs] getSidebarOrdering: ${failedSlugCount} URL(s) in SIDEBAR_URLS.md failed slug extraction`
      );
    }

    if (categoryIndexByLabel.size > 0 && itemIndexBySlug.size > 0) {
      return { categoryIndexByLabel, itemIndexBySlug };
    }
  } catch (error) {
    console.warn(
      '[docs] getSidebarOrdering: failed to parse SIDEBAR_URLS.md, using fallback order.',
      error instanceof Error ? error.message : error
    );
  }

  return fallbackOrdering();
}
