// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// Remark/Rehype プラグイン
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkCalloutDirectives from '@microflash/remark-callout-directives';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import { pluginFramesTexts } from '@expressive-code/plugin-frames';
import { buildRedirectMap } from './scripts/lib/redirects.mjs';
import rehypeWrapTable from './src/lib/rehype-wrap-table.ts';

// Phase 7: Expressive Code の default locale (en) は "Copy to clipboard" /
// "Copied!" を英語で出すため、`ja` を追加し日本語 label に切り替える。
// `addLocale` は full set を要求する (3 key: copyButtonTooltip /
// copyButtonCopied / terminalWindowFallbackTitle) ので 3 件ともに提供。
pluginFramesTexts.addLocale('ja', {
  copyButtonTooltip: 'クリップボードにコピー',
  copyButtonCopied: 'コピーしました',
  terminalWindowFallbackTitle: 'ターミナル',
});

// .envファイルを手動で読み込む
import { config } from 'dotenv';
config();

// Basic認証が有効な場合はSSR、無効な場合はStatic
const isAuthEnabled = process.env.BASIC_AUTH_ENABLED === 'true';

if (process.env.NODE_ENV !== 'production') {
  console.log(`[astro] output mode: ${isAuthEnabled ? 'server (SSR)' : 'static'}`);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://testim-docs-ja.vercel.app',
  output: isAuthEnabled ? 'server' : 'static',
  // Vercel adapterは常に必要（staticでも.vercel/output生成に必須）
  adapter: vercel({}),

  redirects: {
    ...buildRedirectMap(),
    '/docs/applitools-integration': '/docs/integrations/visual-validation',
    '/docs/changelog': '/docs/overview/changelog',
  },
  vite: {
    plugins: [tailwindcss()],
  },

  // #178: コーデック別画像最適化デフォルト（Astro 6.1）
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
    // #177: 日本語では curly quotes / ellipses 変換が不要なため無効化
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
    // Phase 7: astro-expressive-code がすべての fenced code block を
    // handling するため、旧 shikiConfig の ``code-title`` transformer は不要
    // (Expressive Code の frame plugin が ``title="..."`` meta を native に
    // 読み取って figure > figcaption に展開する)。shikiConfig 自体は EC が
    // 内部で shiki を呼ぶ際の default として残しておく (wrap だけ維持)。
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },

  fonts: [
    {
      name: 'Noto Sans JP',
      cssVariable: '--font-noto-sans-jp',
      provider: fontProviders.fontsource(),
      weights: [400, 500, 600, 700],
      styles: ['normal'],
    },
  ],

  integrations: [
    // Phase 7: Expressive Code は react() / sitemap() より **前** に並べる。
    // EC は Astro の markdown pipeline に rehype processor を注入するため、
    // 他の integration より先に読み込ませて安定 initialization を保つ (docs の
    // "Install Expressive Code with Astro" 節に準拠)。
    expressiveCode({
      // 既存サイトの code block は github-dark-dimmed で慣熟しているため
      // 継続する。EC は Shiki を下位で呼ぶので theme 名は Shiki と同じ。
      themes: ['github-dark-dimmed'],
      // 既存の .docs-prose pre 角丸に揃える (CSS 側と整合、rounded-2xl = 1rem)。
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
        // ``title="..."`` meta がある場合のみ frame を出したい。EC の default
        // はファイル名推測 on だが、本サイトは title 明示が主流なので off。
        extractFileNameFromCode: false,
      },
      // JA ローカライズ。上で pluginFramesTexts.addLocale('ja', ...) を登録
      // 済みなので、default locale を `ja` (two-letter code, EC 推奨) に
      // 切り替えて copy button / tooltip / terminal fallback title を日本語化。
      defaultLocale: 'ja',
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
