import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { filePathToSlug } from './project.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DOCS_DIR = path.resolve(__dirname, '..', '..', 'src', 'content', 'docs');

/**
 * Build a redirect map from legacy basename URLs to path-based URLs.
 *
 * Scans `src/content/docs/` and generates:
 *   { '/docs/{basename}': '/docs/{folder}/{basename}' }
 *
 * Basenames that appear in multiple folders are skipped (ambiguous).
 * Only non-trailing-slash variant is generated; trailing slash handling
 * is delegated to the hosting platform (Vercel normalizes automatically).
 *
 * @param {string} [docsDir]
 * @returns {Record<string, string>}
 */
export function buildRedirectMap(docsDir = DEFAULT_DOCS_DIR) {
  /** @type {Map<string, string[]>} basename → [pathSlug, ...] */
  const byBasename = new Map();

  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
        continue;
      }
      if (!ent.isFile() || !ent.name.endsWith('.md')) continue;
      const basename = ent.name.replace(/\.md$/, '');
      const pathSlug = filePathToSlug(full, docsDir);
      // Skip top-level files (no folder prefix — no redirect needed)
      if (!pathSlug.includes('/')) continue;
      const existing = byBasename.get(basename) ?? [];
      existing.push(pathSlug);
      byBasename.set(basename, existing);
    }
  };
  walk(docsDir);

  /** @type {Record<string, string>} */
  const redirects = {};
  for (const [basename, pathSlugs] of byBasename) {
    // Skip ambiguous basenames (multiple paths)
    if (pathSlugs.length !== 1) {
      if (pathSlugs.length > 1) {
        console.warn(
          `[redirects] Skipping ambiguous basename "${basename}" — found in: ${pathSlugs.join(', ')}. Add explicit redirect if needed.`
        );
      }
      continue;
    }
    const target = `/docs/${pathSlugs[0]}`;
    redirects[`/docs/${basename}`] = target;
  }

  return redirects;
}
