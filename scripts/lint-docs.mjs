/**
 * lint-docs.mjs — WRITING_GUIDE compliance checker for src/content/docs/**\/*.md
 *
 * Usage:
 *   node scripts/lint-docs.mjs             # lint all docs
 *   node scripts/lint-docs.mjs --path=...  # lint specific file/glob
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { getSectionSlugSet } from './lib/sidebar.mjs';


const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');
const PUBLIC_ROOT = path.join(ROOT, 'public');

/** @typedef {{ file: string, line: number | null, rule: string, message: string, level: 'error' | 'warning' }} LintError */

const VALID_CALLOUT_TYPES = new Set(['note', 'warning', 'tip', 'danger', 'success', 'info']);
const VALID_SOURCE_URL_RE = /^https:\/\/docs\.tricentis\.com\/testim\/content\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*(?:\/index)?\.htm$/;

function parseFrontmatter(content) {
  const parsed = matter(content);
  const fmBlock = content.startsWith('---\n') ? content.slice(0, content.indexOf('\n---', 4) + 4) : '';
  const bodyStart = fmBlock ? fmBlock.split('\n').length + 2 : 1;
  return { fm: parsed.data ?? {}, body: parsed.content ?? content, bodyStart };
}

function stripCode(body) {
  let result = body.replace(/```[\s\S]*?```/g, '');
  result = result.replace(/`[^`]*`/g, '');
  return result;
}

const FEATURE_NAME_RULES = [
  { pattern: /Testim拡張機能/g, expected: 'Testim Extension' },
  { pattern: /Tricentis Testim拡張機能/g, expected: 'Tricentis Testim Extension' },
  { pattern: /Testimビジュアルエディタ(?:ー)?/g, expected: 'Testim Visual Editor' },
  { pattern: /Testim ビジュアルエディタ(?:ー)?/g, expected: 'Testim Visual Editor' },
  { pattern: /(?<!Testim )ビジュアルエディタ(?:ー)?/g, expected: 'Visual Editor' },
  { pattern: /エージェント型テスト自動化/g, expected: 'Agentic Test Automation' },
];

function toAbsoluteLine(bodyLineNumber, bodyStartLine) {
  return bodyStartLine + bodyLineNumber - 1;
}

/**
 * Convert heading text to a kebab-case slug (matching Astro / GitHub behaviour).
 * Strips inline code, bold/italic markers, and link syntax before slugifying.
 */
export function toKebab(text) {
  return text
    .replace(/`[^`]*`/g, (m) => m.slice(1, -1))  // inline code → content only
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')      // bold / italic
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')       // [text](url) → text
    .toLowerCase()
    .replace(/[^\w\s\-\u3000-\u9fff\uff00-\uffef]/g, '') // keep word chars, CJK, spaces, hyphens
    .replace(/[\s\u3000]+/g, '-')                        // spaces → hyphens
    .replace(/-+/g, '-')                                 // collapse multiple hyphens
    .replace(/^-|-$/g, '');                              // trim leading/trailing hyphens
}

/**
 * Lint a single markdown document.
 * @param {string} content - full file content
 * @param {string} filePath - path for error reporting
 * @param {{ allSlugs?: Set<string>, headingsBySlug?: Map<string, Set<string>> }} [opts]
 * @returns {LintError[]}
 */
export function lintContent(content, filePath, { allSlugs, headingsBySlug } = {}) {
  /** @type {LintError[]} */
  const errors = [];

  const err = (rule, message, line = null) =>
    errors.push({ file: filePath, line, rule, message, level: 'error' });
  const warn = (rule, message, line = null) =>
    errors.push({ file: filePath, line, rule, message, level: 'warning' });

  const { fm, body, bodyStart } = parseFrontmatter(content);

  if (!fm.sourceUrl || fm.sourceUrl === 'undefined') {
    err('sourceUrl-required', 'frontmatter: sourceUrl is required');
  } else if (!VALID_SOURCE_URL_RE.test(fm.sourceUrl)) {
    err('sourceUrl-format', `frontmatter: sourceUrl must match https://docs.tricentis.com/testim/content/.../{slug}.htm (got: ${fm.sourceUrl})`);
  }

  if (fm.description !== undefined) {
    const desc = fm.description;
    if (/^原文:/u.test(desc) || /^todo/iu.test(desc)) {
      err('description-placeholder', `frontmatter: description must not be a placeholder (got: "${desc}")`);
    }
  }

  for (const field of ['title', 'category', 'updated']) {
    if (!fm[field] || fm[field] === 'undefined') {
      err(`${field}-required`, `frontmatter: ${field} is required`);
    }
  }

  const bodyLines = body.split('\n');
  const bodyStrippedForFormat = stripCode(body).split('\n');
  bodyStrippedForFormat.forEach((line, i) => {
    // Markdown: [text](/docs/{folder}/{slug})
    const mdFormatRe = /\]\(\/docs\/([a-z0-9_-]+)\/([a-z0-9_-]+)(#[^)]+)?\)/g;
    let m;
    while ((m = mdFormatRe.exec(line)) !== null) {
      warn(
        'internal-link-format',
        `Prefer /docs/{slug} over /docs/{folder}/{slug} (found: /docs/${m[1]}/${m[2]})`,
        toAbsoluteLine(i + 1, bodyStart)
      );
    }
    // HTML: <a href="/docs/{folder}/{slug}">
    const htmlFormatRe = /<a\b[^>]*href=["']\/docs\/([a-z0-9_-]+)\/([a-z0-9_-]+)(#[^\s"']*)?\s*["'][^>]*>/gi;
    let hm;
    while ((hm = htmlFormatRe.exec(line)) !== null) {
      warn(
        'internal-link-format',
        `Prefer /docs/{slug} over /docs/{folder}/{slug} (found: /docs/${hm[1]}/${hm[2]})`,
        toAbsoluteLine(i + 1, bodyStart)
      );
    }
  });

  // --- Link target existence checks (markdown + HTML) ---
  if (allSlugs) {
    const bodyStripped = stripCode(body);
    const strippedLines = bodyStripped.split('\n');

    strippedLines.forEach((line, i) => {
      // Check A: Markdown links — [text](/docs/{slug}) or [text](/docs/{folder}/{slug})
      const mdLinkRe = /\]\(\/docs\/(?:([a-z0-9_-]+)\/)?([a-z0-9_-]+)(#[^)]+)?\)/g;
      let mdMatch;
      while ((mdMatch = mdLinkRe.exec(line)) !== null) {
        const folder = mdMatch[1]; // present only for /docs/{folder}/{slug}
        const slug = mdMatch[2];
        const fragment = mdMatch[3];
        const displayPath = folder ? `/docs/${folder}/${slug}` : `/docs/${slug}`;
        if (!allSlugs.has(slug)) {
          err(
            'link-target-missing',
            `Internal link target does not exist: ${displayPath}`,
            toAbsoluteLine(i + 1, bodyStart)
          );
        } else if (fragment && headingsBySlug) {
          const fragId = fragment.slice(1);
          const headings = headingsBySlug.get(slug);
          if (headings && !headings.has(fragId)) {
            warn(
              'link-fragment-missing',
              `Fragment "${fragment}" not found in ${displayPath}`,
              toAbsoluteLine(i + 1, bodyStart)
            );
          }
        }
      }

      // Check B: HTML <a href="/docs/..."> links
      const htmlLinkRe = /<a\b[^>]*href=["']\/docs\/(?:([a-z0-9_-]+)\/)?([a-z0-9_-]+)(#[^\s"']*)?\s*["'][^>]*>/gi;
      let htmlMatch;
      while ((htmlMatch = htmlLinkRe.exec(line)) !== null) {
        const folder = htmlMatch[1];
        const slug = htmlMatch[2];
        const fragment = htmlMatch[3];
        const displayPath = folder ? `/docs/${folder}/${slug}` : `/docs/${slug}`;
        if (!allSlugs.has(slug)) {
          err(
            'link-target-missing',
            `Internal link target does not exist: ${displayPath}`,
            toAbsoluteLine(i + 1, bodyStart)
          );
        } else if (fragment && headingsBySlug) {
          const fragId = fragment.slice(1);
          const headings = headingsBySlug.get(slug);
          if (headings && !headings.has(fragId)) {
            warn(
              'link-fragment-missing',
              `Fragment "${fragment}" not found in ${displayPath}`,
              toAbsoluteLine(i + 1, bodyStart)
            );
          }
        }
      }
    });
  }

  const bodyWithoutCode = stripCode(body);
  const bodyWithoutCodeLines = bodyWithoutCode.split('\n');
  for (const rule of FEATURE_NAME_RULES) {
    bodyWithoutCodeLines.forEach((line, i) => {
      if (rule.pattern.test(line)) {
        err(
          'feature-name-japanese',
          `Testim feature name must remain in English (use: ${rule.expected})`,
          toAbsoluteLine(i + 1, bodyStart)
        );
      }
      rule.pattern.lastIndex = 0;
    });
  }

  // :fa-*: residue check — ReadMe.io FontAwesome syntax (code blocks already stripped)
  bodyWithoutCodeLines.forEach((line, i) => {
    if (/:fa-[a-z][a-z-]*:/.test(line)) {
      err(
        'legacy-fa-icon',
        '":fa-*:" は ReadMe.io 固有構文です。テキストまたは絵文字に置換してください',
        toAbsoluteLine(i + 1, bodyStart)
      );
    }
  });

  let inCodeBlock = false;
  bodyLines.forEach((line, i) => {
    if (/^```/.test(line)) {
      if (!inCodeBlock) {
        const lang = line.slice(3).trim();
        if (!lang) {
          warn('code-block-no-language', 'Code block missing language specifier', toAbsoluteLine(i + 1, bodyStart));
        }
        inCodeBlock = true;
      } else {
        inCodeBlock = false;
      }
    }
  });

  const calloutRe = /^:{3,}\s*([a-zA-Z][a-zA-Z-]*)(?:\{[^}]*\})?\s*$/gm;
  let calloutMatch;
  while ((calloutMatch = calloutRe.exec(body)) !== null) {
    const type = calloutMatch[1].toLowerCase();
    if (!VALID_CALLOUT_TYPES.has(type)) {
      const lineNum = body.slice(0, calloutMatch.index).split('\n').length;
      err(
        'callout-unknown-type',
        `Unknown callout type "${calloutMatch[1]}". Valid types: ${[...VALID_CALLOUT_TYPES].join(', ')}`,
        toAbsoluteLine(lineNum, bodyStart)
      );
    }
  }

  let imageCodeBlock = false;
  bodyLines.forEach((line, index) => {
    if (/^```/.test(line.trim())) {
      imageCodeBlock = !imageCodeBlock;
      return;
    }
    if (imageCodeBlock) return;

    const imageRe = /!\[[^\]]*]\((\/images\/[^)]+)\)|<img[^>]+src=["'](\/images\/[^"']+)["']/g;
    let imageMatch;
    while ((imageMatch = imageRe.exec(line)) !== null) {
      const imagePath = imageMatch[1] ?? imageMatch[2];
      if (!fs.existsSync(path.join(PUBLIC_ROOT, imagePath.replace(/^\//, '')))) {
        err('image-missing', `Referenced image does not exist: ${imagePath}`, toAbsoluteLine(index + 1, bodyStart));
      }
    }
  });

  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const pathArg = args.find((a) => a.startsWith('--path='))?.split('=').slice(1).join('=');
  const section = args.find((a) => a.startsWith('--section='))?.split('=').slice(1).join('=');

  let files = [];

  if (pathArg) {
    files = [path.resolve(pathArg)];
  } else {
    for (const entry of fs.readdirSync(DOCS_ROOT, { recursive: true })) {
      if (entry.endsWith('.md')) {
        files.push(path.join(DOCS_ROOT, entry));
      }
    }
  }
  if (section) {
    const slugSet = getSectionSlugSet(section);
    files = files.filter((file) => slugSet.has(path.basename(file, '.md')));
  }

  // Build slug index and heading map from ALL docs (not just filtered files)
  const allFiles = [];
  for (const entry of fs.readdirSync(DOCS_ROOT, { recursive: true })) {
    if (entry.endsWith('.md')) {
      allFiles.push(path.join(DOCS_ROOT, entry));
    }
  }
  const allSlugs = new Set();
  const headingsBySlug = new Map();
  for (const f of allFiles) {
    const slug = path.basename(f, '.md');
    allSlugs.add(slug);
    const raw = fs.readFileSync(f, 'utf8');
    const { body: rawBody } = parseFrontmatter(raw);
    const headings = new Set();
    for (const ln of rawBody.split('\n')) {
      const hm = ln.match(/^#{2,4}\s+(.+)/);
      if (hm) {
        const headingText = hm[1].trim();
        // Prefer explicit heading ID {#custom-id} over auto-generated kebab
        const explicitId = headingText.match(/\{#([^}]+)\}\s*$/);
        if (explicitId) {
          headings.add(explicitId[1]);
          // Also index the auto-generated kebab (without the {#...} suffix)
          headings.add(toKebab(headingText.replace(/\s*\{#[^}]+\}\s*$/, '')));
        } else {
          headings.add(toKebab(headingText));
        }
      }
    }
    headingsBySlug.set(slug, headings);
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const errors = lintContent(content, file, { allSlugs, headingsBySlug });
    for (const e of errors) {
      const loc = e.line ? `:${e.line}` : '';
      const rel = path.relative(ROOT, e.file);
      console.log(`${e.level === 'error' ? '❌' : '⚠️ '} ${rel}${loc} [${e.rule}] ${e.message}`);
      if (e.level === 'error') totalErrors++;
      else totalWarnings++;
    }
  }

  console.log(`\nLint complete: ${totalErrors} error(s), ${totalWarnings} warning(s) in ${files.length} file(s)`);

  if (totalErrors > 0) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
