import fs from 'fs';
import path from 'path';
import { getSectionSlugSet } from './lib/sidebar.mjs';
import { ROOT_DIR, buildSlugIndex, splitFrontmatter } from './lib/project.mjs';

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
  const files = fs.readdirSync(TRANS_DIR).filter((f) => f.endsWith('.md'));
  let applied = 0;
  for (const f of files) {
    const slug = f.replace(/\.md$/, '');
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
