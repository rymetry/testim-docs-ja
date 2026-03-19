import type { APIRoute } from 'astro';
import { getDocs, extractSlug } from '../../lib/docs';

export const GET: APIRoute = async () => {
  try {
    const docs = await getDocs();

    const searchDocs = (
      await Promise.all(
        docs.map(async (doc) => {
          const { headings } = await doc.render();
          const urlSlug = extractSlug(doc);

          return [
            // ページdocument
            {
              id: doc.id,
              type: 'page',
              title: doc.data.title,
              slug: urlSlug,
              description: doc.data.description,
              category: doc.data.category,
              keywords: doc.data.keywords,
              parentTitle: '',
              headingSlug: '',
            },
            // 見出しdocument（見出しごとに独立）
            // h.text に含まれる手動アンカー構文 {#slug} / ${#slug} を除去
            ...headings.map((h) => ({
              id: `${doc.id}#${h.slug}`,
              type: 'heading',
              title: h.text.replace(/\s*\$?\{#[^}]+\}\s*$/u, ''),
              slug: urlSlug,
              description: '',
              category: doc.data.category,
              keywords: [] as string[],
              parentTitle: doc.data.title,
              headingSlug: h.slug,
            })),
          ];
        })
      )
    ).flat();

    return new Response(JSON.stringify(searchDocs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=300',
      },
    });
  } catch (error) {
    console.error('Failed to build search index:', error);
    return new Response(JSON.stringify({ error: 'Failed to build search index' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
