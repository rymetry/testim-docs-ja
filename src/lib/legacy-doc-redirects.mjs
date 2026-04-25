import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DOCS_DIR = path.resolve(LIB_DIR, '..', '..', 'src', 'content', 'docs');

/**
 * @param {string} filePath
 * @param {string} docsDir
 */
function filePathToSlug(filePath, docsDir) {
  return path.relative(docsDir, filePath).replace(/\.md$/, '');
}

/**
 * @param {unknown} error
 */
function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 旧 basename URL からパス付き docs URL への Astro redirects を構築する。
 *
 * @param {string} [docsDir]
 * @param {{ warnOnAmbiguous?: boolean; warnOnMissing?: boolean }} [options]
 * @returns {Record<string, string>}
 */
export function buildLegacyDocRedirects(docsDir = DEFAULT_DOCS_DIR, options = {}) {
  const { warnOnAmbiguous = false, warnOnMissing = false } = options;
  if (!fs.existsSync(docsDir)) {
    if (docsDir === DEFAULT_DOCS_DIR) {
      console.error(
        `[redirects] Default docs directory not found: ${docsDir}. Legacy redirects will be missing.`
      );
    } else if (warnOnMissing) {
      console.warn(`[redirects] Docs directory not found: ${docsDir}. Legacy redirects skipped.`);
    }
    return {};
  }

  try {
    if (!fs.statSync(docsDir).isDirectory()) {
      if (warnOnMissing) {
        console.warn(
          `[redirects] Docs path is not a directory: ${docsDir}. Legacy redirects skipped.`
        );
      }
      return {};
    }
  } catch (error) {
    if (warnOnMissing) {
      console.warn(
        `[redirects] Unable to inspect docs directory: ${docsDir}. ${formatError(error)}`
      );
    }
    return {};
  }

  /** @type {Map<string, string[]>} */
  const byBasename = new Map();

  /** @param {string} dir */
  const walk = (dir) => {
    /** @type {import('node:fs').Dirent[]} */
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
      if (warnOnMissing) {
        console.warn(`[redirects] Unable to read docs directory: ${dir}. ${formatError(error)}`);
      }
      return;
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      const slug = filePathToSlug(fullPath, docsDir);
      if (!slug.includes('/')) continue;

      const basename = entry.name.replace(/\.md$/, '');
      byBasename.set(basename, [...(byBasename.get(basename) ?? []), slug]);
    }
  };
  walk(docsDir);

  /** @type {Record<string, string>} */
  const redirects = {};
  for (const [basename, slugs] of byBasename) {
    if (slugs.length === 1) {
      redirects[`/docs/${basename}`] = `/docs/${slugs[0]}`;
      continue;
    }
    if (warnOnAmbiguous && slugs.length > 1) {
      console.warn(
        `[redirects] Skipping ambiguous basename "${basename}" - found in: ${slugs.join(
          ', '
        )}. Add explicit redirect if needed.`
      );
    }
  }

  return redirects;
}
