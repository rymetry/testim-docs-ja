import type { APIRoute } from 'astro';
import { getDocs } from '../../lib/docs';

export const GET: APIRoute = async () => {
  const docs = await getDocs();

  // 検索用のドキュメントを生成
  const searchDocs = await Promise.all(
    docs.map(async (doc) => {
      const { headings } = await doc.render();
      // ルーティングに使用するslugはファイル名のみを抽出する
      const urlSlug = doc.id.replace(/\.md$/, '').split('/').pop() || doc.slug;

      return {
        id: doc.id,
        title: doc.data.title,
        slug: urlSlug,
        description: doc.data.description,
        category: doc.data.category,
        keywords: doc.data.keywords,
        headings: headings.map((h) => ({
          text: h.text,
          slug: h.slug,
          depth: h.depth,
        })),
      };
    })
  );

  return new Response(JSON.stringify(searchDocs), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
