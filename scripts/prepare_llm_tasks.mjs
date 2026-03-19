import fs from 'fs';
import path from 'path';
import { getSectionSlugSet } from './lib/sidebar.mjs';
import { ROOT_DIR, buildSlugIndex, splitFrontmatter } from './lib/project.mjs';

const ROOT = ROOT_DIR;
const TASKS_DIR = path.join(ROOT, 'llm', 'tasks');

async function main() {
  const args = process.argv.slice(2);
  const onlySlug = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const section = args.find((a) => a.startsWith('--section='))?.split('=').slice(1).join('=');
  const sectionSlugs = section ? getSectionSlugSet(section) : null;
  const index = buildSlugIndex();
  await fs.promises.mkdir(TASKS_DIR, { recursive: true });
  let count = 0;
  for (const [slug, info] of Object.entries(index)) {
    if (onlySlug && slug !== onlySlug) continue;
    if (sectionSlugs && !sectionSlugs.has(slug)) continue;
    const md = fs.readFileSync(info.filePath, 'utf8');
    const { body } = splitFrontmatter(md);
    const prompt = `# 翻訳タスク (${slug})\n\n下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。\n- 画像の相対パス (/images/...) は変更しない\n- ":fa-...:" のようなアイコン記法はそのまま残す\n- 表や表ヘッダー、HTMLタグは壊さない\n- リンクのURLは変更しない（アンカーテキストのみ訳す）\n\n--- 原文本文ここから ---\n\n${body}`;
    const outPath = path.join(TASKS_DIR, `${slug}.md`);
    fs.writeFileSync(outPath, prompt, 'utf8');
    count++;
  }
  console.log(`Prepared ${count} LLM task file(s) in ${path.relative(ROOT, TASKS_DIR)}`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
