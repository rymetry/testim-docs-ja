import fs from 'fs';
import path from 'path';
import { getSectionSlugSet } from './lib/sidebar.mjs';
import { ROOT_DIR, buildSlugIndex, splitFrontmatter, resolveSlug } from './lib/project.mjs';

const ROOT = ROOT_DIR;
const TRANS_DIR = path.join(ROOT, 'llm', 'translations');

async function main() {
  if (!fs.existsSync(TRANS_DIR)) {
    console.error(`Missing dir: ${TRANS_DIR}`);
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const section = args.find((a) => a.startsWith('--section='))?.split('=').slice(1).join('=');
  const sectionSlugs = section ? getSectionSlugSet(section) : null;
  const index = buildSlugIndex();
  // Support both flat (basename.md) and nested (folder/basename.md) translation files
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
  let applied = 0;
  for (const f of files) {
    // Try path-based first (nested file), then fall back to basename resolution
    const pathCandidate = f.replace(/\.md$/, '');
    const slug = index[pathCandidate] ? pathCandidate : resolveSlug(pathCandidate.split('/').pop());
    if (!slug) {
      console.warn(`⚠️  Cannot resolve slug for translation file: ${f}`);
      continue;
    }
    if (sectionSlugs && !sectionSlugs.has(slug)) continue;
    const transPath = path.join(TRANS_DIR, f);
    const translated = fs.readFileSync(transPath, 'utf8');
    const hit = index[slug];
    if (!hit) {
      console.warn(`⚠️  No doc found for slug: ${slug}`);
      continue;
    }
    const cur = fs.readFileSync(hit.filePath, 'utf8');
    const { fm } = splitFrontmatter(cur);
    const final = `${fm}\n${translated.trim()}\n`;
    fs.writeFileSync(hit.filePath, final, 'utf8');
    console.log(`✓ Applied translation: ${path.relative(ROOT, hit.filePath)}`);
    applied++;
  }
  console.log(`Done. Applied ${applied} translation(s).`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
