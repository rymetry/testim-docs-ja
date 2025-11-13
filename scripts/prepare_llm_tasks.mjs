import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DOCS_ROOT = path.join(ROOT, 'src', 'content', 'docs');
const TASKS_DIR = path.join(ROOT, 'llm', 'tasks');

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
  const args = process.argv.slice(2);
  const onlySlug = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const index = buildSlugIndex();
  await fs.promises.mkdir(TASKS_DIR, { recursive: true });
  let count = 0;
  for (const [slug, info] of Object.entries(index)) {
    if (onlySlug && slug !== onlySlug) continue;
    const md = fs.readFileSync(info.filePath, 'utf8');
    const { fm, body } = splitFrontmatter(md);
    const prompt = `# 翻訳タスク (${slug})\n\n下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。\n- 画像の相対パス (/images/...) は変更しない\n- ":fa-...:" のようなアイコン記法はそのまま残す\n- 表や表ヘッダー、HTMLタグは壊さない\n- リンクのURLは変更しない（アンカーテキストのみ訳す）\n\n--- 原文本文ここから ---\n\n${body}`;
    const outPath = path.join(TASKS_DIR, `${slug}.md`);
    fs.writeFileSync(outPath, prompt, 'utf8');
    count++;
  }
  console.log(`Prepared ${count} LLM task file(s) in ${path.relative(ROOT, TASKS_DIR)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

