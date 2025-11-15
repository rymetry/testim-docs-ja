import type { APIRoute } from 'astro';

const toBool = (value: string | undefined) => value?.toLowerCase() === 'true';

export const GET: APIRoute = () => {
  // Basic認証が有効な場合はnoindex
  const authEnabled = toBool(process.env.BASIC_AUTH_ENABLED);
  const body = authEnabled
    ? ['User-agent: *', 'Disallow: /'].join('\n')
    : ['User-agent: *', 'Allow: /'].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
