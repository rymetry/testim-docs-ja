import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const DOCS_DIR = path.join(ROOT_DIR, 'src', 'content', 'docs');
export const SIDEBAR_PATH = path.join(ROOT_DIR, 'docs', 'SIDEBAR_URLS.md');

function normalizeMatchValue(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function findMdFiles(dir = DOCS_DIR) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMdFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

export function toRelativeDocPath(filePath) {
  return path.relative(ROOT_DIR, filePath);
}

export function getDocSection(relativePath) {
  const parts = relativePath.split(path.sep);
  return parts[3] ?? '';
}

export function matchesSectionFilter(relativePath, data, sectionFilter) {
  if (!sectionFilter) return true;

  const target = normalizeMatchValue(sectionFilter);
  if (!target) return true;

  const candidates = [
    relativePath,
    getDocSection(relativePath),
    data?.category,
    path.basename(relativePath, '.md'),
  ]
    .filter(Boolean)
    .map(normalizeMatchValue);

  return candidates.some((candidate) => candidate.includes(target));
}

export function readDocFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(content);
  return {
    content,
    body: parsed.content,
    data: parsed.data,
    relativePath: toRelativeDocPath(filePath),
    section: getDocSection(toRelativeDocPath(filePath)),
  };
}

