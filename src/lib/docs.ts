import type { NavItem } from '../types/navigation';
import type { CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import { getCollection } from 'astro:content';
import fs from 'node:fs';

export type DocEntry = CollectionEntry<'docs'>;

type SidebarOrdering = {
  categoryIndexByLabel: Map<string, number>;
  itemIndexBySlug: Map<string, number>;
};

// フロントエンドのナビゲーション表示順のフォールバック。
// （通常は docs/SIDEBAR_URLS.md から抽出した順を優先）
const FALLBACK_CATEGORY_ORDER: string[] = [
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
  // "Overview（概要）" -> "概要"
  // "Validations(検証)" -> "検証"
  const m = sectionTitle.match(/[（(]([^）)]+)[）)]/);
  return (m ? m[1] : sectionTitle).trim();
}

/** Tricentis URL の末尾からベースネーム slug を抽出する */
function extractSlugFromUrl(url: string): string | null {
  const m =
    url.match(/\/([a-z0-9_-]+)\/index\.htm$/i) ||
    url.match(/\/([a-z0-9_-]+)\.htm$/i);
  return m ? m[1].toLowerCase() : null;
}

function getSidebarOrdering(): SidebarOrdering {
  try {
    const sidebarUrl = new URL('../../docs/SIDEBAR_URLS.md', import.meta.url);
    const text = fs.readFileSync(sidebarUrl, 'utf8');
    const lines = text.split(/\r?\n/);

    const sectionRe = /^##\s+(.+?)\s*$/;
    const urlLineRe =
      /^-\s+(?:✅🔍|✅|⏳)\s+(https:\/\/docs\.tricentis\.com\/testim\/content\/[^\s]+\.htm)\s*$/;

    const categoryIndexByLabel = new Map<string, number>();
    const itemIndexBySlug = new Map<string, number>();

    let currentCategory: string | null = null;
    let globalItemIndex = 0;

    for (const line of lines) {
      const sm = line.match(sectionRe);
      if (sm) {
        const raw = sm[1].trim();
        // メタ見出しはスキップ
        if (raw === '翻訳ステータス' || raw === '検証ステータス' || raw === 'URL抽出方法') {
          currentCategory = null;
          continue;
        }
        currentCategory = extractJapaneseLabel(raw);
        if (!categoryIndexByLabel.has(currentCategory)) {
          categoryIndexByLabel.set(currentCategory, categoryIndexByLabel.size);
        }
        continue;
      }

      const um = line.match(urlLineRe);
      if (um && currentCategory) {
        const slug = extractSlugFromUrl(um[1]);
        // グローバルの並び（SIDEBAR内の出現順）を採用
        if (slug && !itemIndexBySlug.has(slug)) {
          itemIndexBySlug.set(slug, globalItemIndex++);
        }
      }
    }

    if (categoryIndexByLabel.size > 0 && itemIndexBySlug.size > 0) {
      return { categoryIndexByLabel, itemIndexBySlug };
    }
  } catch {
    // fall through
  }

  // 失敗時は固定順のみ
  return {
    categoryIndexByLabel: new Map(FALLBACK_CATEGORY_ORDER.map((c, i) => [c, i])),
    itemIndexBySlug: new Map(),
  };
}

const SIDEBAR_ORDERING = getSidebarOrdering();

/** doc.id からURLに使うslug（最後のファイル名部分のみ）を抽出する */
export function extractSlug(doc: DocEntry): string {
  return doc.id.split('/').pop() || doc.id;
}

export async function getDocs(): Promise<DocEntry[]> {
  const docs = await getCollection('docs');
  return docs.sort((a, b) => a.data.order - b.data.order);
}

export function buildNavigation(docs: DocEntry[]): NavItem[] {
  const groups = new Map<
    string,
    {
      label: string;
      order: number;
      items: {
        title: string;
        slug: string;
        description: string;
        order: number;
      }[];
    }
  >();

  docs.forEach((doc) => {
    // doc.id は "overview/testim-overview" のような形式（Content Layer API）
    // URLに使うslugは最後のファイル名部分のみ（例: "testim-overview"）
    const urlSlug = extractSlug(doc);

    const groupKey = doc.data.category;
    const sidebarItemIndex = SIDEBAR_ORDERING.itemIndexBySlug.get(urlSlug);

    const item = {
      title: doc.data.title,
      slug: urlSlug,
      description: doc.data.description,
      order: sidebarItemIndex ?? doc.data.order ?? 0,
    };

    const preferredIndex = SIDEBAR_ORDERING.categoryIndexByLabel.get(groupKey);
    const fallbackIndex = FALLBACK_CATEGORY_ORDER.indexOf(groupKey);
    const categoryOrder =
      preferredIndex !== undefined
        ? preferredIndex
        : fallbackIndex >= 0
          ? fallbackIndex
          : (doc.data.order ?? 0) + FALLBACK_CATEGORY_ORDER.length;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        label: groupKey,
        order: categoryOrder,
        items: [item],
      });
    } else {
      groups.get(groupKey)!.items.push(item);
    }
  });

  return Array.from(groups.values())
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      label: section.label,
      items: section.items.sort((a, b) => a.order - b.order),
    }));
}

export type SearchDocument = {
  id: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  headings: Pick<MarkdownHeading, 'slug' | 'text' | 'depth'>[];
  headingText: string;
};

export function buildSearchDocuments(
  docs: DocEntry[],
  headingsBySlug: Record<string, MarkdownHeading[]>
): SearchDocument[] {
  return docs.map((doc) => {
    // URLに使うslugは最後のファイル名部分のみ
    const urlSlug = extractSlug(doc);

    return {
      id: doc.id,
      title: doc.data.title,
      slug: urlSlug,
      description: doc.data.description,
      keywords: doc.data.keywords,
      headings: (headingsBySlug[doc.id] || []).map((heading) => ({
        slug: heading.slug,
        text: heading.text,
        depth: heading.depth,
      })),
      headingText: (headingsBySlug[doc.id] || []).map((heading) => heading.text).join(' '),
    };
  });
}
