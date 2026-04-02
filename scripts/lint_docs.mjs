/**
 * lint_docs.mjs — WRITING_GUIDE compliance checker for src/content/docs/**\/*.md
 *
 * Usage:
 *   node scripts/lint_docs.mjs             # lint all docs
 *   node scripts/lint_docs.mjs --path=...  # lint specific file/glob
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { isDirectRun } from './lib/cli.mjs';
import { PROJECT_ROOT, filePathToSlug } from './lib/project.mjs';
import { getSectionSlugSet } from './lib/sidebar.mjs';

const ROOT = PROJECT_ROOT;
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');
const PUBLIC_ROOT = path.join(ROOT, 'public');

/** @typedef {{ file: string, line: number | null, rule: string, message: string, level: 'error' | 'warning' }} LintError */
/** @typedef {{ allSlugs?: Set<string>, headingsBySlug?: Map<string, Set<string>> }} LintContext */

const VALID_CALLOUT_TYPES = new Set(['note', 'warning', 'tip', 'danger', 'success', 'info']);
const VALID_SOURCE_URL_RE =
  /^https:\/\/docs\.tricentis\.com\/testim\/content\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*(?:\/index)?\.htm$/;

const FEATURE_NAME_RULES = [
  { pattern: /Testim拡張機能/g, expected: 'Testim Extension' },
  { pattern: /Tricentis Testim拡張機能/g, expected: 'Tricentis Testim Extension' },
  { pattern: /Testimビジュアルエディタ(?:ー)?/g, expected: 'Testim Visual Editor' },
  { pattern: /Testim ビジュアルエディタ(?:ー)?/g, expected: 'Testim Visual Editor' },
  { pattern: /(?<!Testim )ビジュアルエディタ(?:ー)?/g, expected: 'Visual Editor' },
  { pattern: /エージェント型テスト自動化/g, expected: 'Agentic Test Automation' },
];

function parseFrontmatter(content) {
  const parsed = matter(content);
  const fmBlock = content.startsWith('---\n')
    ? content.slice(0, content.indexOf('\n---', 4) + 4)
    : '';
  const bodyStart = fmBlock ? fmBlock.split('\n').length + 2 : 1;
  return { fm: parsed.data ?? {}, body: parsed.content ?? content, bodyStart };
}

function stripCode(body) {
  return body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

function toAbsoluteLine(bodyLineNumber, bodyStartLine) {
  return bodyStartLine + bodyLineNumber - 1;
}

function createIssueCollector(filePath) {
  /** @type {LintError[]} */
  const issues = [];
  return {
    issues,
    err(rule, message, line = null) {
      issues.push({ file: filePath, line, rule, message, level: 'error' });
    },
    warn(rule, message, line = null) {
      issues.push({ file: filePath, line, rule, message, level: 'warning' });
    },
  };
}

/**
 * Convert heading text to a kebab-case slug (matching Astro / GitHub behaviour).
 * Strips inline code, bold/italic markers, and link syntax before slugifying.
 */
export function toKebab(text) {
  return text
    .replace(/`[^`]*`/g, (m) => m.slice(1, -1))
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .toLowerCase()
    .replace(/[^\w\s\-\u3000-\u9fff\uff00-\uffef]/g, '')
    .replace(/[\s\u3000]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function checkFrontmatter(fm, reporter) {
  if (!fm.sourceUrl || fm.sourceUrl === 'undefined') {
    reporter.err('sourceUrl-required', 'frontmatter: sourceUrl is required');
  } else if (!VALID_SOURCE_URL_RE.test(fm.sourceUrl)) {
    reporter.err(
      'sourceUrl-format',
      `frontmatter: sourceUrl must match https://docs.tricentis.com/testim/content/.../{slug}.htm (got: ${fm.sourceUrl})`
    );
  }

  if (fm.description !== undefined) {
    const description = fm.description;
    if (/^原文:/u.test(description) || /^todo/iu.test(description)) {
      reporter.err(
        'description-placeholder',
        `frontmatter: description must not be a placeholder (got: "${description}")`
      );
    }
  }

  for (const field of ['title', 'category', 'updated']) {
    if (!fm[field] || fm[field] === 'undefined') {
      reporter.err(`${field}-required`, `frontmatter: ${field} is required`);
    }
  }
}

export function checkLinks(body, bodyStart, reporter, { allSlugs, headingsBySlug } = {}) {
  if (!allSlugs) return;

  const bodyStripped = stripCode(body);
  const strippedLines = bodyStripped.split('\n');

  const validateLink = (slugPath, fragment, line) => {
    const displayPath = `/docs/${slugPath}`;
    if (!allSlugs.has(slugPath)) {
      reporter.err(
        'link-target-missing',
        `Internal link target does not exist: ${displayPath}`,
        line
      );
      return;
    }
    if (!fragment || !headingsBySlug) return;

    const fragmentId = fragment.slice(1);
    const headings = headingsBySlug.get(slugPath);
    if (headings && !headings.has(fragmentId)) {
      reporter.warn(
        'link-fragment-missing',
        `Fragment "${fragment}" not found in ${displayPath}`,
        line
      );
    }
  };

  strippedLines.forEach((line, index) => {
    const lineNumber = toAbsoluteLine(index + 1, bodyStart);

    const markdownLinkRe = /\]\(\/docs\/([a-z0-9_-]+(?:\/[a-z0-9_-]+)*)(#[^)]+)?\)/g;
    let markdownMatch;
    while ((markdownMatch = markdownLinkRe.exec(line)) !== null) {
      validateLink(markdownMatch[1], markdownMatch[2], lineNumber);
    }

    const htmlLinkRe =
      /<a\b[^>]*href=["']\/docs\/([a-z0-9_-]+(?:\/[a-z0-9_-]+)*)(#[^\s"']*)?\s*["'][^>]*>/gi;
    let htmlMatch;
    while ((htmlMatch = htmlLinkRe.exec(line)) !== null) {
      validateLink(htmlMatch[1], htmlMatch[2], lineNumber);
    }
  });
}

export function checkFeatureNames(body, bodyStart, reporter) {
  const bodyWithoutCode = stripCode(body);
  const lines = bodyWithoutCode.split('\n');

  for (const rule of FEATURE_NAME_RULES) {
    lines.forEach((line, index) => {
      if (rule.pattern.test(line)) {
        reporter.err(
          'feature-name-japanese',
          `Testim feature name must remain in English (use: ${rule.expected})`,
          toAbsoluteLine(index + 1, bodyStart)
        );
      }
      rule.pattern.lastIndex = 0;
    });
  }

  lines.forEach((line, index) => {
    if (/:fa-[a-z][a-z-]*:/.test(line)) {
      reporter.err(
        'legacy-fa-icon',
        '":fa-*:" は ReadMe.io 固有構文です。テキストまたは絵文字に置換してください',
        toAbsoluteLine(index + 1, bodyStart)
      );
    }
  });
}

export function checkCodeBlocks(body, bodyStart, reporter) {
  let inCodeBlock = false;
  body.split('\n').forEach((line, index) => {
    if (!/^```/.test(line)) return;
    if (!inCodeBlock) {
      const language = line.slice(3).trim();
      if (!language) {
        reporter.warn(
          'code-block-no-language',
          'Code block missing language specifier',
          toAbsoluteLine(index + 1, bodyStart)
        );
      }
      inCodeBlock = true;
      return;
    }

    inCodeBlock = false;
  });
}

export function checkCallouts(body, bodyStart, reporter) {
  const calloutRe = /^:{3,}\s*([a-zA-Z][a-zA-Z-]*)(?:\{[^}]*\})?\s*$/gm;
  let match;
  while ((match = calloutRe.exec(body)) !== null) {
    const type = match[1].toLowerCase();
    if (VALID_CALLOUT_TYPES.has(type)) continue;

    const line = body.slice(0, match.index).split('\n').length;
    reporter.err(
      'callout-unknown-type',
      `Unknown callout type "${match[1]}". Valid types: ${[...VALID_CALLOUT_TYPES].join(', ')}`,
      toAbsoluteLine(line, bodyStart)
    );
  }
}

export function checkImages(body, bodyStart, reporter) {
  let inCodeBlock = false;
  body.split('\n').forEach((line, index) => {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    const imageRe = /!\[[^\]]*]\((\/images\/[^)]+)\)|<img[^>]+src=["'](\/images\/[^"']+)["']/g;
    let match;
    while ((match = imageRe.exec(line)) !== null) {
      const imagePath = match[1] ?? match[2];
      const absolutePath = path.join(PUBLIC_ROOT, imagePath.replace(/^\//, ''));
      if (fs.existsSync(absolutePath)) continue;

      reporter.err(
        'image-missing',
        `Referenced image does not exist: ${imagePath}`,
        toAbsoluteLine(index + 1, bodyStart)
      );
    }
  });
}

/**
 * Lint a single markdown document.
 * @param {string} content
 * @param {string} filePath
 * @param {LintContext} [context]
 * @returns {LintError[]}
 */
export function lintContent(content, filePath, context = {}) {
  const reporter = createIssueCollector(filePath);
  const { fm, body, bodyStart } = parseFrontmatter(content);

  checkFrontmatter(fm, reporter);
  checkLinks(body, bodyStart, reporter, context);
  checkFeatureNames(body, bodyStart, reporter);
  checkCodeBlocks(body, bodyStart, reporter);
  checkCallouts(body, bodyStart, reporter);
  checkImages(body, bodyStart, reporter);

  return reporter.issues;
}

function collectDocFiles() {
  const files = [];
  for (const entry of fs.readdirSync(DOCS_ROOT, { recursive: true })) {
    if (entry.endsWith('.md')) {
      files.push(path.join(DOCS_ROOT, entry));
    }
  }
  return files;
}

function buildHeadingIndex(files) {
  const allSlugs = new Set();
  const headingsBySlug = new Map();

  for (const filePath of files) {
    const slug = filePathToSlug(filePath, DOCS_ROOT);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { body } = parseFrontmatter(raw);
    const headings = new Set();

    body.split('\n').forEach((line) => {
      const match = line.match(/^#{2,4}\s+(.+)/);
      if (!match) return;

      const headingText = match[1].trim();
      const explicitId = headingText.match(/\{#([^}]+)\}\s*$/);
      if (explicitId) {
        headings.add(explicitId[1]);
        headings.add(toKebab(headingText.replace(/\s*\{#[^}]+\}\s*$/, '')));
        return;
      }
      headings.add(toKebab(headingText));
    });

    allSlugs.add(slug);
    headingsBySlug.set(slug, headings);
  }

  return { allSlugs, headingsBySlug };
}

async function main() {
  const args = process.argv.slice(2);
  const pathArg = args
    .find((arg) => arg.startsWith('--path='))
    ?.split('=')
    .slice(1)
    .join('=');
  const section = args
    .find((arg) => arg.startsWith('--section='))
    ?.split('=')
    .slice(1)
    .join('=');

  const allFiles = collectDocFiles();
  let files = pathArg ? [path.resolve(pathArg)] : [...allFiles];

  if (section) {
    const slugSet = getSectionSlugSet(section);
    files = files.filter((filePath) => slugSet.has(filePathToSlug(filePath, DOCS_ROOT)));
  }

  const { allSlugs, headingsBySlug } = buildHeadingIndex(allFiles);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = lintContent(content, filePath, { allSlugs, headingsBySlug });
    for (const issue of issues) {
      const location = issue.line ? `:${issue.line}` : '';
      const relativePath = path.relative(ROOT, issue.file);
      console.log(
        `${issue.level === 'error' ? '❌' : '⚠️ '} ${relativePath}${location} [${issue.rule}] ${issue.message}`
      );
      if (issue.level === 'error') totalErrors += 1;
      else totalWarnings += 1;
    }
  }

  console.log(
    `\nLint complete: ${totalErrors} error(s), ${totalWarnings} warning(s) in ${files.length} file(s)`
  );

  if (totalErrors > 0) process.exit(1);
}

if (isDirectRun(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
