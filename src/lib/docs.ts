import type { NavItem } from '../types/navigation';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { FALLBACK_CATEGORY_ORDER, getSidebarOrdering } from './sidebar-ordering';

export type DocEntry = CollectionEntry<'docs'>;

const SIDEBAR_ORDERING = getSidebarOrdering();

function getCategoryOrder(groupKey: string, docOrder: number | undefined): number {
  const preferredIndex = SIDEBAR_ORDERING.categoryIndexByLabel.get(groupKey);
  if (preferredIndex !== undefined) return preferredIndex;

  const fallbackIndex = FALLBACK_CATEGORY_ORDER.indexOf(groupKey);
  if (fallbackIndex >= 0) return fallbackIndex;

  return (docOrder ?? 0) + FALLBACK_CATEGORY_ORDER.length;
}

export function extractSlug(doc: DocEntry): string {
  return doc.id;
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
    const urlSlug = extractSlug(doc);

    const groupKey = doc.data.category;
    const sidebarItemIndex = SIDEBAR_ORDERING.itemIndexBySlug.get(urlSlug);

    const item = {
      title: doc.data.title,
      slug: urlSlug,
      description: doc.data.description,
      order: sidebarItemIndex ?? doc.data.order ?? 0,
    };

    const categoryOrder = getCategoryOrder(groupKey, doc.data.order);

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
