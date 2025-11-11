import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');
const TRANS_DIR = path.join(ROOT, 'llm', 'translations');

function buildSlugIndex() {
  /** @type {Record<string, {categoryFolder:string, filePath:string}>} */
  const index = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.md')) {
        const slug = ent.name.replace(/\.md$/, '');
        const categoryFolder = path.basename(path.dirname(full));
        index[slug] = { categoryFolder, filePath: full };
      }
    }
  };
  walk(DOCS_ROOT);
  return index;
}

function splitFrontmatter(md) {
  if (!md.startsWith('---\n')) return { fm: '', body: md };
  const end = md.indexOf('\n---', 4);
  if (end === -1) return { fm: '', body: md };
  const fm = md.slice(0, end + 4);
  const body = md.slice(end + 4).replace(/^\n+/, '');
  return { fm, body };
}

async function main() {
  if (!fs.existsSync(TRANS_DIR)) {
    console.error(`Missing dir: ${TRANS_DIR}`);
    process.exit(1);
  }
  const index = buildSlugIndex();
  const files = fs.readdirSync(TRANS_DIR).filter((f) => f.endsWith('.md'));
  let applied = 0;
  for (const f of files) {
    const slug = f.replace(/\.md$/, '');
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

main().catch((e) => { console.error(e); process.exit(1); });

