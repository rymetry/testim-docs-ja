import fs from 'node:fs';
import path from 'node:path';
import { getSectionSlugSet } from './lib/sidebar.mjs';
import { ROOT_DIR, buildSlugIndex, splitFrontmatter } from './lib/project.mjs';
import { isDirectRun } from './lib/cli.mjs';

const ROOT = ROOT_DIR;
const TRANS_DIR = path.join(ROOT, 'llm', 'translations');

/**
 * 翻訳ファイルの相対パスを path-based slug に解決する。
 * - nested path (`/` を含む) は完全一致のみ
 * - flat file は basename fallback を許容する
 * @param {string} relPath - path relative to TRANS_DIR (e.g. "overview/page.md")
 * @param {Record<string, {filePath:string}>} index - slug index from buildSlugIndex
 * @returns {string|null}
 */
export function resolveTranslationSlug(relPath, index) {
  const pathCandidate = relPath.replace(/\.md$/, '');
  const isNested = pathCandidate.includes('/');

  if (index[pathCandidate]) return pathCandidate;

  // nested path は完全一致のみ許可する。
  if (isNested) return null;

  // flat file は index 内で basename lookup する。
  const bn = path.basename(relPath, '.md');
  const matches = Object.keys(index).filter((s) => s.split('/').pop() === bn);
  if (matches.length === 1) {
    console.warn(`⚠️  Deprecated: basename "${bn}" resolved to "${matches[0]}". Use path-based layout in llm/translations/.`);
    return matches[0];
  }
  if (matches.length > 1) {
    console.warn(`⚠️  Ambiguous basename "${bn}" matches: ${matches.join(', ')}. Use path-based layout.`);
  }
  return null;
}

/**
 * 翻訳結果を書き込む前に内容を検証する。
 * 正常なら null、問題があれば skip 理由を返す。
 * @param {string} fm - frontmatter block from the current doc
 * @param {string} translated - raw translated content from LLM output
 * @returns {string|null}
 */
export function validateTranslation(fm, translated) {
  if (!fm) return 'missing frontmatter in source doc';
  const body = translated.trim();
  if (!body) return 'empty translation file';
  if (body.startsWith('# 翻訳タスク')) return 'untranslated prompt file (contains task header)';
  // thematic break ではなく、実際の YAML frontmatter block だけを弾く。
  if (body.startsWith('---\n') && body.indexOf('\n---', 4) !== -1) {
    return 'translated body contains frontmatter block (double frontmatter risk)';
  }
  return null;
}

/**
 * tmp 書き込み後に rename して atomic に保存する。
 * @param {string} filePath - target file path
 * @param {string} content - file content to write
 */
export function writeFileAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${Date.now()}.tmp`);
  let renamed = false;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, filePath);
    renamed = true;
  } finally {
    if (!renamed) {
      try { fs.unlinkSync(tmpPath); } catch { /* 書き込み失敗時は tmp が無い場合がある */ }
    }
  }
}

/**
 * 翻訳ファイル 1 件を検証し、対象 doc に反映する。
 * @param {object} params
 * @param {string} params.slug - resolved path-based slug
 * @param {string} params.transPath - absolute path to translation file
 * @param {{filePath:string}} params.hit - slug index entry for the target doc
 * @returns {'applied'|'skipped'|'unchanged'|'error'} result status
 */
export function processOneTranslation({ slug, transPath, hit }) {
  const translated = fs.readFileSync(transPath, 'utf8');
  const cur = fs.readFileSync(hit.filePath, 'utf8');
  const { fm } = splitFrontmatter(cur);

  const skipReason = validateTranslation(fm, translated);
  if (skipReason) {
    console.warn(`⚠️  Skipped ${slug}: ${skipReason}`);
    return 'skipped';
  }

  const final = `${fm}\n${translated.trim()}\n`;

  // 内容が同一なら何もしない。
  if (final === cur) return 'unchanged';

  writeFileAtomic(hit.filePath, final);
  console.log(`✓ Applied translation: ${path.relative(ROOT, hit.filePath)}`);
  return 'applied';
}

/**
 * エントリポイント。test しやすいよう集計結果を返す。
 * @param {string[]} argv - process.argv.slice(2) equivalent
 * @returns {Promise<{applied:number, skipped:number, unchanged:number, errors:number}>}
 */
export async function main(argv = []) {
  if (!fs.existsSync(TRANS_DIR)) {
    console.error(`Missing dir: ${TRANS_DIR}`);
    return { applied: 0, skipped: 0, unchanged: 0, errors: 1 };
  }

  const section = argv.find((a) => a.startsWith('--section='))?.split('=').slice(1).join('=');
  let sectionSlugs = null;
  if (section) {
    try {
      sectionSlugs = getSectionSlugSet(section);
    } catch (e) {
      console.error(`❌ Unknown section "${section}": ${e.message}`);
      return { applied: 0, skipped: 0, unchanged: 0, errors: 1 };
    }
  }
  const index = buildSlugIndex();

  // 翻訳ファイルを集める。
  const files = [];
  const walkTransDir = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { walkTransDir(full); continue; }
      if (ent.isFile() && ent.name.endsWith('.md')) {
        files.push(path.relative(TRANS_DIR, full));
      }
    }
  };
  walkTransDir(TRANS_DIR);
  // 同じ slug に nested と flat が共存するときは nested を優先する。
  files.sort((a, b) => {
    const aDepth = a.includes('/') ? 0 : 1;
    const bDepth = b.includes('/') ? 0 : 1;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.localeCompare(b);
  });

  const counts = { applied: 0, skipped: 0, unchanged: 0, errors: 0 };
  const processedSlugs = new Set();

  for (const f of files) {
    const slug = resolveTranslationSlug(f, index);
    if (!slug) {
      // section filter 中に解決できない file は対象外の可能性があるので黙って飛ばす。
      if (!sectionSlugs) {
        console.warn(`⚠️  Cannot resolve slug for translation file: ${f}`);
        counts.skipped++;
      }
      continue;
    }
    if (sectionSlugs && !sectionSlugs.has(slug)) continue;

    // 同じ slug を指す重複翻訳は先着を採用する。
    if (processedSlugs.has(slug)) {
      console.warn(`⚠️  Duplicate translation for slug "${slug}" (file: ${f}) — skipping, earlier file already applied`);
      continue;
    }
    processedSlugs.add(slug);

    const hit = index[slug];
    if (!hit) {
      console.warn(`⚠️  No doc found for slug: ${slug}`);
      counts.skipped++;
      continue;
    }

    try {
      const result = processOneTranslation({ slug, transPath: path.join(TRANS_DIR, f), hit });
      counts[result]++;
    } catch (e) {
      console.error(`❌ Error processing ${slug}: ${e.message}`);
      counts.errors++;
    }
  }

  console.log(`Done. Applied ${counts.applied}, skipped ${counts.skipped}, unchanged ${counts.unchanged}, errors ${counts.errors}.`);
  return counts;
}

if (isDirectRun(import.meta.url)) {
  main(process.argv.slice(2)).then((counts) => {
    if (counts.errors > 0 || counts.skipped > 0) process.exitCode = 1;
  }).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
