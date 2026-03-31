import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import matter from 'gray-matter';
import { filterItemsBySection } from './lib/sidebar.mjs';
import { ROOT_DIR, buildSlugIndex, toKebab } from './lib/project.mjs';
import { extractSlug } from './lib/madcap_toc.mjs';
import { generateDescription } from './lib/markdown-utils.mjs';
import turndown from './lib/turndown.mjs';

const execFileAsync = promisify(execFile);

const ROOT = ROOT_DIR;
const SIDEBAR_FILE = path.join(ROOT, 'docs', 'SIDEBAR_URLS.md');
const PUBLIC_IMAGES = path.join(ROOT, 'public', 'images');
const DEFAULT_STATE_PATH = path.join(ROOT, 'scripts', '.cache', 'docs-state.json');
const SNAPSHOTS_CONTENT_DIR = path.join(ROOT, 'snapshots', 'en', 'content');

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}-${mm}-${dd}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseSidebarList(sidebarText, filterFn) {
  const lines = sidebarText.split(/\r?\n/);
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
    const m = line.match(/^\-\s*(✅🔍|✅|⏳)\s+(https?:\/\/docs\.tricentis\.com\/testim\/content\/[^\s]+\.htm)\s*$/);
    if (m && current) {
      order += 1;
      if (!filterFn(m[1])) continue;
      const url = m[2];
      const slug = extractSlug(url);
      if (!slug) continue;
      out.push({ categoryEnglish: current.english, categoryJapanese: current.japanese, url, slug, order });
    }
  }
  return out;
}

export function getUntranslatedList(sidebarText) {
  return parseSidebarList(sidebarText, (status) => status === '⏳');
}

export function getAllPagesList(sidebarText) {
  return parseSidebarList(sidebarText, () => true);
}

export async function getDiffPagesList(sidebarText, hashesPath) {
  const allPages = getAllPagesList(sidebarText);
  const storedHashes = fs.existsSync(hashesPath)
    ? JSON.parse(fs.readFileSync(hashesPath, 'utf8'))
    : {};

  const newHashes = { ...storedHashes };
  const changed = [];

  for (const page of allPages) {
    const snapshotPath = path.join(SNAPSHOTS_CONTENT_DIR, `${page.slug}.html`);
    let content = '';
    try {
      content = fs.readFileSync(snapshotPath, 'utf8');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    if (!content) {
      console.warn(`getDiffPagesList: no snapshot for ${page.slug}; treating as changed. Run check:snapshots:fetch first.`);
      changed.push(page);
      continue;
    }

    const hash = computeHash(content);
    const previousHash =
      typeof storedHashes[page.slug] === 'string' ? storedHashes[page.slug] : storedHashes[page.slug]?.hash;
    if (previousHash !== hash) {
      changed.push(page);
    }
    newHashes[page.slug] = {
      sourceUrl: page.url,
      hash,
      checkedAt: new Date().toISOString(),
    };
  }

  fs.mkdirSync(path.dirname(hashesPath), { recursive: true });
  fs.writeFileSync(hashesPath, JSON.stringify(newHashes, null, 2), 'utf8');
  return changed;
}

export function parseMode(argv) {
  const flag = argv.find((a) => a.startsWith('--mode='));
  if (!flag) return null;
  return flag.split('=')[1];
}

function parseSection(argv) {
  return argv.find((a) => a.startsWith('--section='))?.split('=').slice(1).join('=');
}

function computeHash(content) {
  return createHash('sha256').update(content).digest('hex');
}

async function downloadAsset(url, destDir) {
  const filename = path.basename(new URL(url).pathname);
  let targetName = filename;
  const m = filename.match(/^([a-fA-F0-9]{7})[a-fA-F0-9]{50,}(-.*)/);
  if (m) targetName = `${m[1]}${m[2]}`;
  const destPath = path.join(destDir, targetName);
  await fs.promises.mkdir(destDir, { recursive: true });
  if (fs.existsSync(destPath)) return { name: targetName, path: destPath };

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

async function rewriteAndDownloadMedia(markdown, categoryFolder, slug, sourceUrl) {
  const mediaDir = path.join(PUBLIC_IMAGES, categoryFolder, slug);
  const localPrefix = `/images/${categoryFolder}/${slug}`;

  // Collect absolute URLs (legacy readme.io) and MadCap relative image paths
  const absoluteUrlRegex = /https:\/\/files\.readme\.io\/[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|gif|webp|mp4|webm|mov)/gi;
  const relativeImgRegex = /images\/[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|gif|webp|mp4|webm|mov)/gi;

  const absoluteUrls = Array.from(new Set(markdown.match(absoluteUrlRegex) || []));

  // Resolve MadCap relative paths to absolute URLs using sourceUrl as base.
  // The replace strips the last path segment (filename) to get the parent directory,
  // matching HTML relative path semantics:
  //   .../slug-dir/index.htm  → .../slug-dir/  (images/foo.png → .../slug-dir/images/foo.png)
  //   .../slug-name.htm       → .../           (images/foo.png → .../images/foo.png)
  const relativePaths = Array.from(new Set(markdown.match(relativeImgRegex) || []));
  const madcapBase = sourceUrl ? sourceUrl.replace(/\/[^/]*$/, '/') : '';
  const resolvedRelatives = relativePaths
    .filter(() => madcapBase)
    .map((relPath) => ({ original: relPath, url: madcapBase + relPath }));

  const allDownloads = [
    ...absoluteUrls.map((url) => ({ original: url, url })),
    ...resolvedRelatives,
  ];

  const pairs = [];
  for (const { original, url } of allDownloads) {
    try {
      const { name } = await downloadAsset(url, mediaDir);
      pairs.push({ original, local: `${localPrefix}/${name}` });
    } catch (e) {
      console.warn(`⚠️  Failed to download ${url}: ${e.message}`);
    }
  }

  let updated = markdown;
  for (const p of pairs) {
    const re = new RegExp(p.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    updated = updated.replace(re, p.local);
  }
  updated = updated.replace(/<Image\b[^>]*src=\"([^\"]+)\"[^>]*\/>/g, (_match, src) => `![](${src})`);
  return updated;
}

export function rewriteDocLinks(markdown) {
  // Legacy readme.io doc: links
  let result = markdown.replace(/\]\(doc:([a-z0-9_-]+)(#[^)]+)?\)/g, (_match, slug, frag = '') => {
    return `](/docs/${slug}${frag || ''})`;
  });
  // MadCap Flare relative .htm links (e.g. ../path/slug.htm, slug/index.htm)
  result = result.replace(/\]\(([^)#]*\.htm)(#[^)]*)?\)/g, (_match, rawPath, fragment) => {
    // extractSlug expects absolute-style paths; prepend / for relative paths
    const path = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
    const slug = extractSlug(path);
    if (!slug) return _match;
    return `](/docs/${slug}${fragment || ''})`;
  });
  return result;
}

function extractTitle(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function buildFrontmatter(item, existingFilePath, fallbackTitle) {
  const raw = fs.readFileSync(existingFilePath, 'utf8');
  const parsed = matter(raw);
  const data = parsed.data ?? {};
  const body = parsed.content ?? '';
  const keywords =
    Array.isArray(data.keywords) && data.keywords.length > 0
      ? data.keywords
      : ['testim', item.slug, toKebab(item.categoryEnglish)];

  const description =
    typeof data.description === 'string' && data.description.trim() && !/^原文:\s*/u.test(data.description)
      ? data.description.trim()
      : generateDescription(data.title || fallbackTitle, body);

  const frontmatter = {
    ...data,
    title: data.title || fallbackTitle,
    description,
    category: data.category || item.categoryJapanese,
    order: typeof data.order === 'number' ? data.order : item.order,
    updated: data.updated || todayStr,
    sourceUrl: item.url,
    keywords,
  };

  return matter.stringify('', frontmatter).trimEnd() + '\n\n';
}

async function processOne(item, slugIndex) {
  const hit = slugIndex[item.slug];
  if (!hit) {
    console.warn(`⚠️  No local path for slug: ${item.slug}`);
    return false;
  }
  const { categoryFolder, filePath } = hit;

  let md = '';

  // Read from HTML snapshot and convert to Markdown
  const snapshotPath = path.join(SNAPSHOTS_CONTENT_DIR, `${item.slug}.html`);
  if (fs.existsSync(snapshotPath)) {
    const content = fs.readFileSync(snapshotPath, 'utf8');
    if (/^<!-- 404:/.test(content)) {
      console.warn(`⚠️  Skip ${item.slug}: snapshot contains 404 marker`);
      return false;
    }
    try {
      md = turndown.turndown(content);
    } catch (e) {
      console.warn(`⚠️  Skip ${item.slug}: turndown conversion failed: ${e.message}`);
      return false;
    }
  }

  if (!md) {
    console.warn(`⚠️  Skip ${item.slug}: no HTML snapshot. Run check:snapshots:fetch first.`);
    return false;
  }

  md = await rewriteAndDownloadMedia(md, categoryFolder, item.slug, item.url);
  md = rewriteDocLinks(md);

  const title = extractTitle(md) || item.slug.replace(/-/g, ' ');
  md = md.replace(/^#\s+.+\n+/, '');

  const fm = buildFrontmatter(item, filePath, title);
  const final = fm + md.trim() + '\n';
  await fs.promises.writeFile(filePath, final, 'utf8');
  console.log(`✓ Wrote ${path.relative(ROOT, filePath)}`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const onlySlug = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const limit = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');
  const mode = parseMode(args);
  const section = parseSection(args);
  const sidebarText = fs.readFileSync(SIDEBAR_FILE, 'utf8');
  const slugIndex = buildSlugIndex();

  let list;
  if (mode === 'full') {
    list = getAllPagesList(sidebarText);
  } else if (mode === 'diff') {
    const hashesPath = DEFAULT_STATE_PATH;
    list = await getDiffPagesList(sidebarText, hashesPath);
  } else {
    list = getUntranslatedList(sidebarText);
  }
  list = filterItemsBySection(list, section);

  let done = 0;
  for (const item of list) {
    if (onlySlug && item.slug !== onlySlug) continue;
    const ok = await processOne(item, slugIndex);
    if (ok) done++;
    if (limit && done >= limit) break;
    await sleep(60);
  }
  console.log(`Done. Processed ${done} file(s).`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
