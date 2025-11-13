import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const SIDEBAR_FILE = path.join(ROOT, 'docs', 'SIDEBAR_URLS.md');
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'images');

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toKebab = (str) => String(str).toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// Index local docs by slug => {categoryFolder,filePath}
function buildSlugIndex() {
  /** @type {Record<string, {categoryFolder:string, filePath:string}>} */
  const index = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.md')) {
        const slug = ent.name.replace(/\.md$/, '');
        const categoryFolder = path.basename(path.dirname(full));
        index[slug] = { categoryFolder, filePath: full };
      }
    }
  };
  walk(DOCS_ROOT);
  return index;
}

// Parse sidebar to get untranslated list with order
function getUntranslatedList() {
  const raw = fs.readFileSync(SIDEBAR_FILE, 'utf8');
  const lines = raw.split(/\r?\n/);
  /** @type {Array<{categoryEnglish:string, categoryJapanese:string, url:string, slug:string, order:number}>} */
  const out = [];
  let current = null;
  let order = 0;
  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)(?:（(.+?)）)?\s*$/);
    if (h) {
      current = { english: h[1].trim(), japanese: (h[2] || h[1]).trim() };
      order = 0;
      continue;
    }
    const m = line.match(/^\-\s*([✅⏳])\s+(https?:\/\/help\.testim\.io\/docs\/([a-z0-9\-]+))\s*$/);
    if (m && current) {
      order += 1;
      const status = m[1];
      if (status !== '⏳') continue;
      const url = m[2];
      const slug = m[3];
      out.push({ categoryEnglish: current.english, categoryJapanese: current.japanese, url, slug, order });
    }
  }
  return out;
}

async function downloadAsset(url, destDir) {
  const filename = path.basename(new URL(url).pathname);
  // shorten long readme hashes: keep first 7
  let targetName = filename;
  const m = filename.match(/^([a-fA-F0-9]{7})[a-fA-F0-9]{50,}(-.*)/);
  if (m) targetName = `${m[1]}${m[2]}`;
  const destPath = path.join(destDir, targetName);
  await fs.promises.mkdir(destDir, { recursive: true });
  if (fs.existsSync(destPath)) return { name: targetName, path: destPath };

  // Try fetch then curl fallback
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Automation)', Accept: '*/*' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.promises.writeFile(destPath, buf);
  } catch (e) {
    await execFileAsync('curl', ['-sL', '--compressed', '-A', 'Mozilla/5.0 (Automation)', '-o', destPath, url]);
  }
  await sleep(20);
  return { name: targetName, path: destPath };
}

async function rewriteAndDownloadMedia(markdown, categoryFolder, slug) {
  const mediaDir = path.join(PUBLIC_IMAGES, categoryFolder, slug);
  const localPrefix = `/images/${categoryFolder}/${slug}`;
  const urlRegex = new RegExp('https://files\\.readme\\.io/[a-zA-Z0-9_.-]+\\.(?:png|jpg|jpeg|gif|webp|mp4|webm|mov)', 'gi');
  const urls = Array.from(new Set(markdown.match(urlRegex) || []));

  const pairs = [];
  for (const url of urls) {
    try {
      const { name } = await downloadAsset(url, mediaDir);
      pairs.push({ original: url, local: `${localPrefix}/${name}` });
    } catch (e) {
      console.warn(`⚠️  Failed to download ${url}: ${e.message}`);
    }
  }

  let updated = markdown;
  for (const p of pairs) {
    const re = new RegExp(p.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    updated = updated.replace(re, p.local);
  }
  // Convert <Image ... src="..." /> to markdown image
  updated = updated.replace(/<Image\b[^>]*src=\"([^\"]+)\"[^>]*\/>/g, (m, src) => `![](${src})`);
  return updated;
}

function rewriteDocLinks(markdown, slugIndex) {
  // Handles: (doc:slug) and (doc:slug#fragment)
  return markdown.replace(/\]\(doc:([a-z0-9\-]+)(#[^)]+)?\)/g, (m, slug, frag = '') => {
    const hit = slugIndex[slug];
    const tail = frag || '';
    if (!hit) return `](/docs/${slug}${tail})`;
    return `](/docs/${hit.categoryFolder}/${slug}${tail})`;
  });
}

function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function buildFrontmatter(item, title, categoryFolder, extra = {}) {
  const keywords = ['testim', item.slug, toKebab(item.categoryEnglish)];
  const lines = [
    '---',
    `title: '${title.replace(/'/g, "''")}'`,
    `description: '原文: ${item.url}'`,
    `category: '${item.categoryJapanese}'`,
    `order: ${item.order}`,
    `updated: '${todayStr}'`,
    'keywords:',
    ...keywords.map((k) => `  - ${k}`),
    '---',
    '',
  ];
  return lines.join('\n');
}

async function processOne(item, slugIndex, options) {
  const hit = slugIndex[item.slug];
  if (!hit) {
    console.warn(`⚠️  No local path for slug: ${item.slug}`);
    return false;
  }
  const { categoryFolder, filePath } = hit;

  // Fetch markdown source
  const srcUrl = `${item.url}.md`;
  const res = await fetch(srcUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Automation)', Accept: 'text/markdown' } });
  if (!res.ok) {
    console.warn(`⚠️  Skip ${item.slug}: ${res.status}`);
    return false;
  }
  let md = await res.text();

  // Rewrite images and links
  md = await rewriteAndDownloadMedia(md, categoryFolder, item.slug);
  md = rewriteDocLinks(md, slugIndex);

  // Title from H1 (we remove H1 from body)
  const title = extractTitle(md) || item.slug.replace(/-/g, ' ');
  md = md.replace(/^#\s+.+\n+/, '');

  const fm = buildFrontmatter(item, title, categoryFolder);
  const final = fm + md.trim() + '\n';
  await fs.promises.writeFile(filePath, final, 'utf8');
  console.log(`✓ Wrote ${path.relative(ROOT, filePath)}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const onlySlug = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
  const prepareLLM = args.includes('--prepare-llm');

  const slugIndex = buildSlugIndex();
  const list = getUntranslatedList();
  let done = 0;
  for (const item of list) {
    if (onlySlug && item.slug !== onlySlug) continue;
    const ok = await processOne(item, slugIndex, {});
    if (ok) done++;
    if (limit && done >= limit) break;
    await sleep(60);
  }
  console.log(`Done. Processed ${done} file(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
