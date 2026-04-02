import fs from 'node:fs';
import path from 'node:path';
import { isDirectRun } from './lib/cli.mjs';
import { getSectionSlugSet } from './lib/sidebar.mjs';
import { ROOT_DIR, buildSlugIndex, splitFrontmatter, resolveSlug } from './lib/project.mjs';

const ROOT = ROOT_DIR;
const TASKS_DIR = path.join(ROOT, 'llm', 'tasks');

async function main() {
  const args = process.argv.slice(2);
  const rawSlug = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const onlySlug = rawSlug ? resolveSlug(rawSlug) : null;
  if (rawSlug && !onlySlug) {
    console.error(`❌ Unknown slug: "${rawSlug}". No matching document found.`);
    process.exit(1);
  }
  const section = args
    .find((a) => a.startsWith('--section='))
    ?.split('=')
    .slice(1)
    .join('=');
  const sectionSlugs = section ? getSectionSlugSet(section) : null;
  const index = buildSlugIndex();
  await fs.promises.mkdir(TASKS_DIR, { recursive: true });
  let count = 0;
  for (const [slug, info] of Object.entries(index)) {
    if (onlySlug && slug !== onlySlug) continue;
    if (sectionSlugs && !sectionSlugs.has(slug)) continue;
    const md = fs.readFileSync(info.filePath, 'utf8');
    const { body } = splitFrontmatter(md);
    const prompt = `# 翻訳タスク (${slug})

下記のMarkdown本文を日本語に翻訳してください。

## Source-First 構造マッピング

翻訳時は以下の構造契約に従ってください:

### 見出し
- 原文の最初の H1（ページタイトル）→ frontmatter title: に入れる（本文に H1 は出さない）
- 原文の 2 番目以降の H1 → H2 に降格
- H2 / H3 / H4 → そのまま維持

### リスト
- マーカー: 原文の \`*\` → \`-\` に統一（markdownlint 互換）
- ネストレベルは原文を維持

### テーブル
- HTML テーブル → Markdown テーブルへの変換は許容
- 行数・列数は原文に合わせる

### その他
- 画像・callout・コードブロックの出現順序と配置を原文に合わせる
- 段落構造を原文に合わせる

## 一般ルール
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）
- Testim の製品名・機能名・画面名は英語のまま維持

--- 原文本文ここから ---

${body}`;
    const outPath = path.join(TASKS_DIR, slug + '.md');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, prompt, 'utf8');
    count++;
  }
  console.log(`Prepared ${count} LLM task file(s) in ${path.relative(ROOT, TASKS_DIR)}`);
}

if (isDirectRun(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
