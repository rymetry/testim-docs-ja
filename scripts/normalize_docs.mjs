import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getSectionSlugSet } from './lib/sidebar.mjs';

const ROOT = process.cwd();
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');

const REPLACEMENTS = [
  [/Tricentis Testim拡張機能/g, 'Tricentis Testim Extension'],
  [/Testim拡張機能/g, 'Testim Extension'],
  [/Testimビジュアルエディタ(?:ー)?/g, 'Testim Visual Editor'],
  [/Testim ビジュアルエディタ(?:ー)?/g, 'Testim Visual Editor'],
  [/ビジュアルエディタ(?:ー)?/g, 'Visual Editor'],
  [/エージェント型テスト自動化/g, 'Agentic Test Automation'],
  [/\/docs\/([a-z0-9-]+)\/([a-z0-9-]+)(#[^)'" \t\n]+)?/g, '/docs/$2$3'],
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

function buildDocFileList(dir) {
  const files = [];
  const walk = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(fullPath);
    }
  };
  walk(dir);
  return files;
}

function stripMarkdown(text) {
  return String(text ?? '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateDescription(title, content) {
  const lines = content.split('\n');
  let paragraph = [];

  const flush = () => stripMarkdown(paragraph.join(' '));

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      const candidate = flush();
      if (candidate) return candidate.slice(0, 120);
      paragraph = [];
      continue;
    }
    if (
      /^#/.test(line) ||
      /^:{3,}/.test(line) ||
      /^```/.test(line) ||
      /^!\[/.test(line) ||
      /^<[^>]+>/.test(line) ||
      /^[-*+]\s/.test(line) ||
      /^\d+\.\s/.test(line)
    ) {
      continue;
    }
    paragraph.push(line);
  }

  const fallback = flush();
  if (fallback) return fallback.slice(0, 120);
  return `${title} に関する日本語ドキュメントです。`;
}

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

function normalizeFile(filePath) {
  const slug = path.basename(filePath, '.md');
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const data = { ...(parsed.data ?? {}) };
  let content = parsed.content ?? '';

  data.sourceUrl = data.sourceUrl || `https://help.testim.io/docs/${slug}`;

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
  const files = buildDocFileList(DOCS_ROOT).filter((filePath) => !slugSet || slugSet.has(path.basename(filePath, '.md')));

  let changed = 0;
  for (const filePath of files) {
    if (normalizeFile(filePath)) {
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
