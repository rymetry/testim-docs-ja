import { timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'astro';
import { toBool } from './lib/env';

const UNAUTHORIZED_HEADERS = {
  'WWW-Authenticate': 'Basic realm="Protected", charset="UTF-8"',
  'X-Robots-Tag': 'noindex, nofollow',
};

// Edge Runtime対応: atob (Web標準API) を使用
const decodeCredentials = (header: string | null) => {
  if (!header?.startsWith('Basic ')) {
    return null;
  }

  try {
    // Base64デコード (Edge Runtime互換)
    const decoded = atob(header.slice(6));
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
};

const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
};

const unauthorizedResponse = () =>
  new Response('Unauthorized', {
    status: 401,
    headers: UNAUTHORIZED_HEADERS,
  });

export const onRequest: MiddlewareHandler = async ({ request }, next) => {
  const authEnabled = toBool(process.env.BASIC_AUTH_ENABLED);

  // Basic認証が無効な場合はミドルウェアをスキップ
  if (!authEnabled) {
    return next();
  }

  // Basic認証が有効な場合は認証チェック + noindex
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return unauthorizedResponse();
  }

  const credentials = decodeCredentials(request.headers.get('authorization'));

  if (
    !credentials ||
    !safeEqual(credentials.username, expectedUser) ||
    !safeEqual(credentials.password, expectedPass)
  ) {
    return unauthorizedResponse();
  }

  // 認証成功時もnoindexヘッダーを付与
  const response = await next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
};
