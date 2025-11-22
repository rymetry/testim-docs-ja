import type { NavItem } from '../types/navigation';
import type { CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import { getCollection } from 'astro:content';

export type DocEntry = CollectionEntry<'docs'>;

// ナビゲーションのカテゴリ表示順を固定する。未登録のカテゴリは末尾に回る。
const CATEGORY_ORDER = [
  '概要',
  'はじめに',
  'テスト作成',
  'ステップとテスト編集',
  '高度な機能',
  'テスト実行',
  '結果',
  'デバッグ',
  'テスト管理',
  'モバイルアプリ',
  'デバイス管理',
  'インテグレーション',
  'セッティング',
  '管理者設定',
  'TESTOPS',
  'Salesforceテスト',
  'Testim拡張機能',
  'セキュリティ',
  'ガイド',
  'Tesim Labs',
];

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
    // doc.id は "overview/testim-overview.md" のような形式
    // doc.slug は "overview/testim-overview" のような形式
    // URLに使うslugは最後のファイル名部分のみ（例: "testim-overview"）
    const urlSlug = doc.id.replace(/\.md$/, '').split('/').pop() || doc.slug;
    
    const item = {
      title: doc.data.title,
      slug: urlSlug,
      description: doc.data.description,
      order: doc.data.order ?? 0,
    };
    const groupKey = doc.data.category;
    const preferredIndex = CATEGORY_ORDER.indexOf(groupKey);
    const categoryOrder = preferredIndex >= 0 ? preferredIndex : (doc.data.order ?? 0) + CATEGORY_ORDER.length;

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
    const urlSlug = doc.id.replace(/\.md$/, '').split('/').pop() || doc.slug;
    
    return {
      id: doc.id,
      title: doc.data.title,
      slug: urlSlug,
      description: doc.data.description,
      keywords: doc.data.keywords,
      headings: (headingsBySlug[doc.slug] || []).map((heading) => ({
        slug: heading.slug,
        text: heading.text,
        depth: heading.depth,
      })),
      headingText: (headingsBySlug[doc.slug] || []).map((heading) => heading.text).join(' '),
    };
  });
}
