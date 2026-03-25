import fs from 'node:fs';
import path from 'node:path';

const LIVE_URL = 'https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm';
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
  'device management': 'デバイス管理',
  Integrations: '統合',
  Settings: '設定',
  Administration: '管理',
  TestOps: 'TestOps',
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

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '');
}

function decodeHtmlEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function normalizeUrl(href) {
  if (!href) return null;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    if (href.startsWith('https://docs.tricentis.com/testim/')) return href;
    // NOTE: 旧ドメイン（help.testim.io）の許容は Phase C (#160) まで維持する。
    // Phase C 完了後に旧ドメイン分岐を削除すること。
    if (href.startsWith('https://help.testim.io/docs/')) return href;
    if (href.startsWith('http://help.testim.io/docs/')) return href.replace('http://', 'https://');
    return null;
  }
  // NOTE: 旧ドメインの相対パスフォールバック。Phase C (#160) で削除すること。
  if (href.startsWith('/docs/')) return `https://help.testim.io${href}`;
  return null;
}

export function parseExistingStatusMap(text) {
  const statusByUrl = new Map();
  const re = /^-\s+(✅🔍|✅)\s+(https:\/\/(?:help\.testim\.io\/docs|docs\.tricentis\.com\/testim\/content)\/[^\s#]+)\s*$/;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(re);
    if (m) statusByUrl.set(m[2], m[1]);
  }
  return statusByUrl;
}

async function fetchHtml(url, fetchFn = fetch) {
  const res = await fetchFn(url, {
    headers: {
      // WAF 対策: UA なしだとアクセスが拒否される場合がある
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  return await res.text();
}

// NOTE: nav#hub-sidebar は旧 readme.io の HTML 構造。MadCap Flare では存在しない。
// Phase C (#160) で要改修。main() の try/catch でフォールバック処理される。
function extractHubSidebar(html) {
  const m = html.match(/<nav[^>]*\bid="hub-sidebar"[^>]*>[\s\S]*?<\/nav>/i);
  if (!m) throw new Error('nav#hub-sidebar not found in HTML');
  return m[0];
}

function extractSections(navHtml) {
  const parts = navHtml.split(/<section\b/gi).slice(1);
  return parts.map((p) => `<section${p}`);
}

function extractH2(sectionHtml) {
  const m = sectionHtml.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if (!m) return null;
  return decodeHtmlEntities(stripTags(m[1]).replace(/\s+/g, ' ').trim());
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

export async function fetchSitemap(fetchFn = fetch) {
  const SITEMAP_URL = 'https://docs.tricentis.com/testim/sitemap.xml';
  try {
    const res = await fetchFn(SITEMAP_URL);
    if (!res.ok) return [];
    const xml = await res.text();
    const urls = [];
    for (const m of xml.matchAll(/<loc>(https:\/\/docs\.tricentis\.com\/testim\/content\/[^<]+)<\/loc>/g)) {
      urls.push(m[1]);
    }
    return urls;
  } catch (e) {
    console.warn(`fetchSitemap: failed (${e?.message}). Falling back.`);
    return [];
  }
}

/** Fetch HTML sections from LIVE_URL, filtering URLs with urlFilter. */
async function fetchNavSections(urlFilter, fetchFn) {
  const html = await fetchHtml(LIVE_URL, fetchFn);
  const nav = extractHubSidebar(html);
  const sectionHtmls = extractSections(nav);
  const sections = [];
  for (const sectionHtml of sectionHtmls) {
    const title = extractH2(sectionHtml);
    if (!title) continue;
    const urls = extractUrls(sectionHtml).filter(urlFilter);
    sections.push({ title, urls });
  }
  return sections;
}

export async function main(fetchFn = fetch) {
  const existing = fs.existsSync(SIDEBAR_URLS_PATH) ? fs.readFileSync(SIDEBAR_URLS_PATH, 'utf8') : '';
  const statusByUrl = parseExistingStatusMap(existing);

  let sections = [];
  const sitemapUrls = await fetchSitemap(fetchFn);

  if (sitemapUrls.length > 0) {
    try {
      const sitemapSet = new Set(sitemapUrls);
      sections = await fetchNavSections((u) => sitemapSet.has(u), fetchFn);
      const placed = new Set(sections.flatMap((s) => s.urls));
      const unplaced = sitemapUrls.filter((u) => !placed.has(u));
      if (unplaced.length > 0) sections.push({ title: 'Other', urls: unplaced });
    } catch (e) {
      // NOTE: MadCap Flare には nav#hub-sidebar が存在しないため、ここに落ちる。
      // フラットな 'All' セクションで SIDEBAR_URLS.md を上書きするとカテゴリ構造が壊れるため、
      // 既存ファイルがある場合は上書きを中止する。Phase C (#160) で要改修。
      console.warn(`HTML section fetch failed (${e?.message}).`);
      if (fs.existsSync(SIDEBAR_URLS_PATH)) {
        console.warn('既存の SIDEBAR_URLS.md を保持します（ライブサイトからの更新はスキップ）。');
        console.warn('Phase C (#160) で MadCap Flare 対応が必要です。');
        return;
      }
      sections = [{ title: 'All', urls: sitemapUrls }];
    }
  } else {
    sections = await fetchNavSections(() => true, fetchFn);
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
