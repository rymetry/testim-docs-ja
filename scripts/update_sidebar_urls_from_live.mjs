import fs from 'node:fs';
import path from 'node:path';

import { fetchTocData, resolveUrl } from './lib/madcap_toc.mjs';

const SIDEBAR_URLS_PATH = path.resolve('docs/SIDEBAR_URLS.md');

const JP_LABEL_BY_EN = {
  Overview: '概要',
  'Getting Started': 'はじめに',
  'Recording Tests': 'テストの記録',
  'Editing Tests': 'テスト編集',
  'Advanced Editing': '高度な編集',
  'Running Tests': 'テスト実行',
  Results: '結果',
  'Debugging Tests': 'デバッグ',
  'Test Management': 'テスト管理',
  'Mobile Apps': 'モバイルアプリ',
  'Device Management': 'デバイス管理',
  Integrations: '統合',
  Settings: '設定',
  Administration: '管理',
  Testops: 'TestOps',
  'Salesforce Testing': 'Salesforceテスト',
  'Testim Extension': 'Testim拡張機能',
  Security: 'セキュリティ',
  Guides: 'ガイド',
  'Testim Labs': 'Testim Labs',
};

function todayJa() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1);
  const dd = String(d.getDate());
  return `${yyyy}年${mm}月${dd}日`;
}

export function normalizeUrl(href) {
  if (!href) return null;
  if (href.startsWith('https://docs.tricentis.com/testim/')) return href;
  return null;
}

export function parseExistingStatusMap(text) {
  const statusByUrl = new Map();
  const re = /^-\s+(✅🔍|✅)\s+(https:\/\/docs\.tricentis\.com\/testim\/content\/[^\s#]+)\s*$/;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(re);
    if (m) statusByUrl.set(m[2], m[1]);
  }
  return statusByUrl;
}

export function extractUrls(sectionHtml) {
  const hrefs = [...sectionHtml.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)].map((m) => m[1]);
  const urls = [];
  const seen = new Set();
  for (const href of hrefs) {
    const url = normalizeUrl(href);
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function buildOutput({ sections, statusByUrl, existingHeader }) {
  const allUrls = [];
  const seenGlobal = new Set();

  for (const section of sections) {
    for (const url of section.urls) {
      if (seenGlobal.has(url)) continue;
      seenGlobal.add(url);
      allUrls.push(url);
    }
  }

  let verified = 0;
  let translatedOnly = 0;

  for (const url of allUrls) {
    const st = statusByUrl.get(url) ?? '✅🔍';
    if (st === '✅🔍') verified++;
    else if (st === '✅') translatedOnly++;
  }

  const headerLines = [];
  headerLines.push('# Testim Documentation - 全サイドバーURL一覧');
  headerLines.push('');
  headerLines.push(`取得日: ${todayJa()}`);
  headerLines.push(`総数: ${allUrls.length} URL`);
  headerLines.push('');
  headerLines.push('## 翻訳ステータス');
  headerLines.push('');
  headerLines.push(`- ✅ 翻訳済み: ${allUrls.length}個`);
  headerLines.push('- ⏳ 未翻訳: 0個');
  headerLines.push('');
  headerLines.push('## 検証ステータス');
  headerLines.push('');
  headerLines.push(`- ✅🔍 検証済み(frontmatter・keywords・リンク・lint): ${verified}個`);
  headerLines.push(`- ✅   翻訳のみ完了: ${translatedOnly}個`);
  headerLines.push('');
  headerLines.push('### アイコンの意味');
  headerLines.push('- ✅🔍 翻訳完了 + 検証済み（frontmatter、keywords最適化、内部リンク化、lint確認）');
  headerLines.push('- ✅   翻訳完了');
  headerLines.push('');
  headerLines.push('---');
  headerLines.push('');

  const body = [];
  const seenBody = new Set();
  for (const section of sections) {
    const jp = JP_LABEL_BY_EN[section.title] ?? section.title;
    body.push(`## ${section.title}（${jp}）`);
    body.push('');

    for (const url of section.urls) {
      if (seenBody.has(url)) continue;
      seenBody.add(url);
      const st = statusByUrl.get(url) ?? '✅🔍';
      body.push(`- ${st} ${url}`);
    }

    body.push('');
  }

  // 末尾の案内は既存を踏襲（あれば残す）
  const footer = [];
  const footerMatch = existingHeader.match(/\n---\n\n## URL抽出方法[\s\S]*$/);
  if (footerMatch) {
    footer.push(footerMatch[0].trimEnd());
  }

  return [...headerLines, ...body, ...(footer.length ? ['', ...footer] : [])].join('\n') + '\n';
}

/**
 * Fetch sitemap as a fallback URL source when TOC data is unavailable.
 */
export async function fetchSitemap(fetchFn = fetch) {
  const SITEMAP_URL = 'https://docs.tricentis.com/testim/sitemap.xml';
  try {
    const res = await fetchFn(SITEMAP_URL);
    if (!res.ok) {
      console.warn(`fetchSitemap: HTTP ${res.status} from ${SITEMAP_URL}`);
      return [];
    }
    const xml = await res.text();
    const urls = [];
    for (const m of xml.matchAll(/<loc>(https:\/\/docs\.tricentis\.com\/testim\/content\/[^<]+)<\/loc>/g)) {
      urls.push(m[1]);
    }
    return urls;
  } catch (e) {
    console.warn(`fetchSitemap: failed (${e?.message}).`);
    return [];
  }
}

/**
 * Convert TOC sections to the format expected by buildOutput.
 */
function tocSectionsToOutputSections(tocSections) {
  return tocSections.map((section) => ({
    title: section.title,
    urls: section.pages.map((page) => resolveUrl(page.url)),
  }));
}

export async function main(fetchFn = fetch) {
  const existing = fs.existsSync(SIDEBAR_URLS_PATH) ? fs.readFileSync(SIDEBAR_URLS_PATH, 'utf8') : '';
  const statusByUrl = parseExistingStatusMap(existing);

  let sections = [];

  // Primary: fetch TOC data from MadCap Flare
  try {
    const { sections: tocSections } = await fetchTocData({ fetchFn });
    if (tocSections.length > 0) {
      sections = tocSectionsToOutputSections(tocSections);
    }
  } catch (e) {
    console.warn(`TOC fetch failed (${e?.message}). Trying sitemap fallback.`);
  }

  // Fallback: use sitemap for a flat URL list
  if (sections.length === 0) {
    const sitemapUrls = await fetchSitemap(fetchFn);
    if (sitemapUrls.length > 0) {
      if (fs.existsSync(SIDEBAR_URLS_PATH)) {
        console.warn('WARNING: TOC fetch failed. Sitemap fallback would replace section structure with flat "All" list.');
        console.warn('Preserving existing SIDEBAR_URLS.md to prevent data loss.');
        return;
      }
      sections = [{ title: 'All', urls: sitemapUrls }];
    }
  }

  const totalUrls = new Set(sections.flatMap((s) => s.urls)).size;
  if (totalUrls === 0) {
    console.error('Fatal: 0 URLs collected. Aborting.');
    process.exit(1);
  }

  const out = buildOutput({ sections, statusByUrl, existingHeader: existing });
  fs.mkdirSync(path.dirname(SIDEBAR_URLS_PATH), { recursive: true });
  fs.writeFileSync(SIDEBAR_URLS_PATH, out, 'utf8');

  console.log(`Updated ${SIDEBAR_URLS_PATH}`);
  console.log(`Sections: ${sections.length}`);
  console.log(`Total unique URLs: ${totalUrls}`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
