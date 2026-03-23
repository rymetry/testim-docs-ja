import type { APIRoute } from 'astro';
import { toBool } from '../lib/env';

export const GET: APIRoute = () => {
  // Basic認証が有効な場合はnoindex
  const authEnabled = toBool(process.env.BASIC_AUTH_ENABLED);
  const body = authEnabled
    ? ['User-agent: *', 'Disallow: /'].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        'Sitemap: https://testim-docs-ja.vercel.app/sitemap-index.xml',
      ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
