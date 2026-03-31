import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { getSectionSlugSet } from './lib/sidebar.mjs';
import { ROOT_DIR, DOCS_DIR, findMdFiles } from './lib/project.mjs';
import { generateDescription } from './lib/markdown-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = ROOT_DIR;
const DOCS_ROOT = DOCS_DIR;

const REPLACEMENTS = [
  [/Tricentis Testim拡張機能/g, 'Tricentis Testim Extension'],
  [/Testim拡張機能/g, 'Testim Extension'],
  [/Testimビジュアルエディタ(?:ー)?/g, 'Testim Visual Editor'],
  [/Testim ビジュアルエディタ(?:ー)?/g, 'Testim Visual Editor'],
  [/ビジュアルエディタ(?:ー)?/g, 'Visual Editor'],
  [/エージェント型テスト自動化/g, 'Agentic Test Automation'],
  [/\/docs\/([a-z0-9_-]+)\/([a-z0-9_-]+)(#[^)'" \t\n]+)?/g, '/docs/$2$3'],
];

const FRONTMATTER_ORDER = [
  'title',
  'description',
  'category',
  'order',
  'updated',
  'sourceUrl',
  'keywords',
  'hero',
];

function normalizeValue(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, normalizeValue(entryValue)]));
  }
  if (typeof value !== 'string') return value;

  return REPLACEMENTS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
}

function orderFrontmatter(data) {
  const ordered = {};
  for (const key of FRONTMATTER_ORDER) {
    if (data[key] !== undefined) ordered[key] = data[key];
  }
  for (const [key, value] of Object.entries(data)) {
    if (!(key in ordered)) ordered[key] = value;
  }
  return ordered;
}

function normalizeFile(filePath, urlMappings) {
  const slug = path.basename(filePath, '.md');
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = { ...(parsed.data ?? {}) };
  let content = parsed.content ?? '';

  // sourceUrl must come from url_mapping.json; no longer generate a default from slug alone
  if (!data.sourceUrl && urlMappings[slug]) {
    data.sourceUrl = urlMappings[slug].new_url;
  }

  data.title = normalizeValue(data.title || slug.replace(/-/g, ' '));
  data.description =
    typeof data.description === 'string' && data.description.trim() && !/^原文:\s*/u.test(data.description)
      ? normalizeValue(data.description.trim())
      : generateDescription(data.title, content);
  data.category = normalizeValue(data.category);
  data.keywords = Array.isArray(data.keywords) ? normalizeValue(data.keywords) : [];
  content = normalizeValue(content);

  const next = matter.stringify(content.trimEnd() + '\n', orderFrontmatter(data));
  if (next !== raw) {
    fs.writeFileSync(filePath, next, 'utf8');
    return true;
  }
  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const section = args.find((arg) => arg.startsWith('--section='))?.split('=').slice(1).join('=');
  const slugSet = section ? getSectionSlugSet(section) : null;
  const files = findMdFiles(DOCS_ROOT).filter((filePath) => !slugSet || slugSet.has(path.basename(filePath, '.md')));

  // Load url_mapping.json once for all files (avoid re-reading per file)
  let urlMappings = {};
  try {
    const mappingPath = path.join(__dirname, 'url_mapping.json');
    ({ mappings: urlMappings } = JSON.parse(fs.readFileSync(mappingPath, 'utf8')));
  } catch { /* mapping file unavailable — leave empty for lint to catch */ }

  let changed = 0;
  for (const filePath of files) {
    if (normalizeFile(filePath, urlMappings)) {
      changed += 1;
      console.log(`✓ Normalized ${path.relative(ROOT, filePath)}`);
    }
  }

  console.log(`Normalized ${changed} file(s).`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
