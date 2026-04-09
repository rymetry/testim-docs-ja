import type { APIRoute } from 'astro';
import { toBool } from '../lib/env';

export const GET: APIRoute = (context) => {
  // Basic 認証が有効な場合は noindex 相当の robots を返す
  const authEnabled = toBool(process.env.BASIC_AUTH_ENABLED);
  const body = authEnabled
    ? ['User-agent: *', 'Disallow: /'].join('\n')
    : [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${new URL('sitemap-index.xml', context.site)}`,
      ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
