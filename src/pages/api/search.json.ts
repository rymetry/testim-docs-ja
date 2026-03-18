import type { APIRoute } from 'astro';
import { getDocs } from '../../lib/docs';

export const GET: APIRoute = async () => {
  const docs = await getDocs();

  const searchDocs = (
    await Promise.all(
      docs.map(async (doc) => {
        const { headings } = await doc.render();
        const urlSlug = doc.id.replace(/\.md$/, '').split('/').pop() || doc.slug;

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
          ...headings.map((h) => ({
            id: `${doc.id}#${h.slug}`,
            type: 'heading',
            title: h.text,
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
    },
  });
};
