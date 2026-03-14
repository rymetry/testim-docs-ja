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


const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');

/** @typedef {{ file: string, line: number | null, rule: string, message: string, level: 'error' | 'warning' }} LintError */

const VALID_CALLOUT_TYPES = new Set(['note', 'warning', 'tip', 'danger']);
const VALID_SOURCE_URL_RE = /^https:\/\/help\.testim\.io\/docs\/[a-z0-9-]+$/;

const FEATURE_NAME_NG = [
  'Testim拡張機能',
  'ビジュアルエディタ',
  'テスト自動化', // context: Testim Automate
];

function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { fm: {}, bodyStart: 0 };
  }
  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return { fm: {}, bodyStart: 0 };
  }
  const fmText = content.slice(3, end).trim();
  const bodyStart = end + 4; // skip closing ---\n
  const fm = {};
  for (const line of fmText.split('\n')) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.+)$/);
    if (m) {
      fm[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return { fm, bodyStart };
}

function stripCode(body) {
  let result = body.replace(/```[\s\S]*?```/g, '');
  result = result.replace(/`[^`]*`/g, '');
  return result;
}

/**
 * Lint a single markdown document.
 * @param {string} content - full file content
 * @param {string} filePath - path for error reporting
 * @returns {LintError[]}
 */
export function lintContent(content, filePath) {
  /** @type {LintError[]} */
  const errors = [];

  const err = (rule, message, line = null) =>
    errors.push({ file: filePath, line, rule, message, level: 'error' });
  const warn = (rule, message, line = null) =>
    errors.push({ file: filePath, line, rule, message, level: 'warning' });

  const { fm, bodyStart } = parseFrontmatter(content);
  const body = content.slice(bodyStart);

  if (!fm.sourceUrl || fm.sourceUrl === 'undefined') {
    err('sourceUrl-required', 'frontmatter: sourceUrl is required');
  } else if (!VALID_SOURCE_URL_RE.test(fm.sourceUrl)) {
    err('sourceUrl-format', `frontmatter: sourceUrl must match https://help.testim.io/docs/{slug} (got: ${fm.sourceUrl})`);
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
  bodyLines.forEach((line, i) => {
    const internalLinkRe = /\]\(\/docs\/([a-z0-9-]+)\/([a-z0-9-]+)/g;
    let m;
    while ((m = internalLinkRe.exec(line)) !== null) {
      err('internal-link-format', `Internal link must use /docs/{slug} not /docs/{folder}/{slug} (found: /docs/${m[1]}/${m[2]})`, i + 1);
    }
  });

  const bodyWithoutCode = stripCode(body);
  const bodyWithoutCodeLines = bodyWithoutCode.split('\n');
  for (const ngWord of FEATURE_NAME_NG) {
    bodyWithoutCodeLines.forEach((line, i) => {
      if (line.includes(ngWord)) {
        err('feature-name-japanese', `Testim feature name "${ngWord}" must remain in English`, i + 1);
      }
    });
  }

  let inCodeBlock = false;
  bodyLines.forEach((line, i) => {
    if (/^```/.test(line)) {
      if (!inCodeBlock) {
        const lang = line.slice(3).trim();
        if (!lang) {
          warn('code-block-no-language', 'Code block missing language specifier', i + 1);
        }
        inCodeBlock = true;
      } else {
        inCodeBlock = false;
      }
    }
  });

  const calloutRe = /^:::\s+(\S+)/gm;
  let calloutMatch;
  while ((calloutMatch = calloutRe.exec(body)) !== null) {
    const type = calloutMatch[1].toLowerCase();
    if (!VALID_CALLOUT_TYPES.has(type)) {
      const lineNum = body.slice(0, calloutMatch.index).split('\n').length;
      err('callout-unknown-type', `Unknown callout type "${calloutMatch[1]}". Valid types: ${[...VALID_CALLOUT_TYPES].join(', ')}`, lineNum);
    }
  }

  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const pathArg = args.find((a) => a.startsWith('--path='))?.split('=').slice(1).join('=');

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

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const errors = lintContent(content, file);
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
