import type { APIRoute } from 'astro';
import { getDocs } from '../../lib/docs';
import { buildSearchDocuments } from '../../lib/search-index';

export const GET: APIRoute = async () => {
  try {
    const docs = await getDocs();
    const searchDocs = await buildSearchDocuments(docs);

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
