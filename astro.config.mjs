// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// Remark/Rehype プラグイン
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkCalloutDirectives from '@microflash/remark-callout-directives';
import { visit, SKIP } from 'unist-util-visit';

import react from '@astrojs/react';

// .envファイルを手動で読み込む
import { config } from 'dotenv';
config();

// テーブルをレスポンシブ対応のdivでラップするrehypeプラグイン
function rehypeWrapTable() {
  return (tree) => {
    visit(tree, { type: 'element', tagName: 'table' }, (node, index, parent) => {
      // 安全性チェック強化
      if (!parent || typeof index !== 'number' || parent.type !== 'element') {
        return;
      }

      // 二重ラップ防止（より厳密なチェック）
      const parentClasses = parent.properties?.className;
      if (
        parent.tagName === 'div' && 
        Array.isArray(parentClasses) && 
        parentClasses.includes('overflow-x-auto')
      ) {
        return;
      }

      // テーブルをラップ
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['overflow-x-auto', 'my-8'] },
        children: [node],
      };
      
      return SKIP;
    });
  };
}

// Basic認証が有効な場合はSSR、無効な場合はStatic
const isAuthEnabled = process.env.BASIC_AUTH_ENABLED === 'true';

console.log('🔐 BASIC_AUTH_ENABLED:', process.env.BASIC_AUTH_ENABLED);
console.log('⚙️  Output mode:', isAuthEnabled ? 'server (SSR)' : 'static');

// https://astro.build/config
export default defineConfig({
  output: isAuthEnabled ? 'server' : 'static',
  // Vercel adapterは常に必要（staticでも.vercel/output生成に必須）
  adapter: vercel({}),
  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    remarkPlugins: [
      remarkGfm,  // GitHub Flavored Markdown (テーブル、タスクリスト、脚注など)
      remarkDirective,        // カスタムディレクティブ
      [remarkCalloutDirectives, {
        // カスタムcalloutタイプを定義
        callouts: {
          tip: { title: 'ヒント', hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>' },
          warning: { title: '注意', hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' },
          success: { title: '推奨', hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' },
          danger: { title: 'エラー', hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>' },
          note: { title: 'メモ', hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8h.01M12 12v4"></path><circle cx="12" cy="12" r="10"></circle></svg>' },
          info: { title: '情報', hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>' },
        },
      }],
    ],
    rehypePlugins: [
      [rehypeAutolinkHeadings, {
        behavior: 'wrap',
        properties: {
          className: 'heading-link',
        },
      }],
      rehypeWrapTable,
    ],
    shikiConfig: {
      theme: 'dracula',
      wrap: true,
      transformers: [{
        name: 'code-title',
        pre(node) {
          // meta文字列からtitleを抽出
          const meta = this.options.meta?.__raw || '';
          const titleMatch = meta.match(/title="([^"]+)"/);

          if (titleMatch) {
            const title = titleMatch[1];
            node.properties['data-title'] = title;
            node.properties['data-has-title'] = 'true';
          }
        },
      }],
    },
  },

  integrations: [react()],
});
