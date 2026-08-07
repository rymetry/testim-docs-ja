// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';

import tailwindcss from '@tailwindcss/vite';

// Remark/Rehype プラグイン
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkCalloutDirectives from '@microflash/remark-callout-directives';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import rehypeWrapTable from './src/lib/rehype-wrap-table.ts';
import { buildLegacyDocRedirects } from './src/lib/legacy-doc-redirects.mjs';

// .envファイルを手動で読み込む
import { config } from 'dotenv';
config();

// Basic認証が有効な場合はSSR、無効な場合はStatic
const isAuthEnabled = process.env.BASIC_AUTH_ENABLED === 'true';
const shouldLogConfigWarnings = process.env.NODE_ENV !== 'production';

if (process.env.NODE_ENV !== 'production') {
  console.log(`[astro] output mode: ${isAuthEnabled ? 'server (SSR)' : 'static'}`);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://testim-docs-ja.vercel.app',
  // Astro 6 の HTML-aware な空白処理を維持する。
  compressHTML: true,
  output: isAuthEnabled ? 'server' : 'static',
  // Vercel adapterは常に必要（staticでも.vercel/output生成に必須）
  adapter: vercel({}),

  redirects: {
    ...buildLegacyDocRedirects(undefined, {
      warnOnAmbiguous: shouldLogConfigWarnings,
      warnOnMissing: shouldLogConfigWarnings,
    }),
    '/docs/applitools-integration': '/docs/integrations/visual-validation',
    '/docs/changelog': '/docs/overview/changelog',
    '/docs/integrations/grid-management/browserstack-integration-1':
      '/docs/integrations/grid-management/browserstack-integration',
    '/docs/integrations/grid-management/browserstack-integration-copy':
      '/docs/integrations/grid-management/lambdatest-integration',
  },
  vite: {
    plugins: [tailwindcss()],
  },

  // 日本語コンテンツ向け画像最適化
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        webp: { effort: 6, quality: 80 },
        png: { compressionLevel: 9 },
      },
    },
  },

  markdown: {
    processor: unified({
      // remarkGfm を明示しているため組み込み GFM は無効にする。
      gfm: false,
      // 日本語では curly quotes / ellipses 変換が不要。
      smartypants: false,
      remarkPlugins: [
        remarkGfm, // GitHub Flavored Markdown (テーブル、タスクリスト、脚注など)
        remarkDirective, // カスタムディレクティブ
        [
          remarkCalloutDirectives,
          {
            // カスタムcalloutタイプを定義
            callouts: {
              tip: {
                title: 'ヒント',
                hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>',
              },
              warning: {
                title: '注意',
                hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
              },
              caution: {
                title: '警告',
                hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
              },
              danger: {
                title: 'エラー',
                hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
              },
              note: {
                title: 'メモ',
                hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8h.01M12 12v4"></path><circle cx="12" cy="12" r="10"></circle></svg>',
              },
              info: {
                title: '情報',
                hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
              },
            },
          },
        ],
      ],
      rehypePlugins: [
        // Astro 7 の unified pipeline では組み込みの見出し ID 付与が
        // ユーザープラグインの後に走るため、autolink より前に明示する。
        rehypeHeadingIds,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'wrap',
            properties: {
              className: 'heading-link',
            },
          },
        ],
        rehypeWrapTable,
      ],
      // shikiConfig は astro-expressive-code が上書きするため不要（削除済み）。
    }),
  },

  fonts: [
    {
      name: 'Noto Sans JP',
      cssVariable: '--font-noto-sans-jp',
      // google provider は unicode-range 分割 (121 slice の variable font) で日本語 glyph を
      // 配信できる。fontsource の japanese subset は 1 weight = 1 ファイル (約 1MB) の
      // 一枚岩配信になるため使わない (Issue #417)。
      provider: fontProviders.google(),
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'japanese'],
    },
  ],

  integrations: [
    // Expressive Code は markdown pipeline に入るため、他 integration より先に初期化する。
    expressiveCode({
      themes: ['github-dark-dimmed'],
      // 長い CLI 例を既存 UI と同じ折り返し表示にする。
      defaultProps: {
        wrap: true,
      },
      styleOverrides: {
        borderRadius: '1rem',
        borderColor: 'rgb(15 23 42 / 0.1)',
        codeFontSize: '0.8125rem', // tailwind text-[13px] 相当
        codeLineHeight: '1.5rem', // tailwind leading-6 相当
        frames: {
          // frame (title / tabs / terminal) の shadow はサイト既存の shadow-lg
          // (0 10px 15px -3px rgb(0 0 0 / 0.1)) に近付ける。
          shadowColor: 'rgb(0 0 0 / 0.15)',
        },
      },
      frames: {
        // 本サイトは title meta 明示時だけ frame を出す。
        extractFileNameFromCode: false,
      },
      // EN 原文由来の非標準 lang は content を触らず renderer 側で吸収する。
      shiki: {
        langAlias: {
          curl: 'bash',
          Text: 'text',
        },
      },
      useThemedScrollbars: false, // 既存 overflow-x-auto の scroll UX に干渉しないよう off
    }),
    react(),
    ...(!isAuthEnabled
      ? [
          sitemap({
            filter: (page) => !page.includes('/404') && !page.includes('/api/'),
          }),
        ]
      : []),
  ],
});
