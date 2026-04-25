import { render } from 'astro:content';
import type { SearchDocument } from '../types/search';
import type { DocEntry } from './docs';
import { extractSlug } from './docs';

const EXPLICIT_HEADING_ID_RE = /\s*\$?\{#[^}]+\}\s*$/u;

function normalizeHeadingTitle(text: string): string {
  return text.replace(EXPLICIT_HEADING_ID_RE, '');
}

async function buildSearchDocumentsForDoc(doc: DocEntry): Promise<SearchDocument[]> {
  try {
    const { headings } = await render(doc);
    const slug = extractSlug(doc);
    const pageDocument: SearchDocument = {
      id: doc.id,
      type: 'page',
      title: doc.data.title,
      slug,
      description: doc.data.description,
      category: doc.data.category,
      keywords: doc.data.keywords,
      parentTitle: '',
      headingSlug: '',
    };

    const headingDocuments: SearchDocument[] = headings.map((heading) => ({
      id: `${doc.id}#${heading.slug}`,
      type: 'heading',
      title: normalizeHeadingTitle(heading.text),
      slug,
      description: '',
      category: doc.data.category,
      keywords: [],
      parentTitle: doc.data.title,
      headingSlug: heading.slug,
    }));

    return [pageDocument, ...headingDocuments];
  } catch (error) {
    throw new Error(`Failed to build search documents for "${doc.id}"`, { cause: error });
  }
}

export async function buildSearchDocuments(docs: DocEntry[]): Promise<SearchDocument[]> {
  const entries = await Promise.all(docs.map(buildSearchDocumentsForDoc));
  return entries.flat();
}
