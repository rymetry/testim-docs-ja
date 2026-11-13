/** remark plugin: 見出し末尾の `{#id}` を見出しの id にし、表示テキストから取り除く。 */
import { visit } from 'unist-util-visit';

const EXPLICIT_HEADING_ID_RE = /\s*\{#([^}\s]+)\}\s*$/u;

export default function remarkHeadingIds() {
  /** @param {import('mdast').Root} tree */
  return (tree) => {
    visit(tree, 'heading', (node) => {
      const last = node.children.at(-1);
      if (last?.type !== 'text') return;
      const match = EXPLICIT_HEADING_ID_RE.exec(last.value);
      if (!match) return;

      last.value = last.value.slice(0, match.index);
      // rehypeHeadingIds は既存の id を尊重するため、TOC・検索インデックスの slug もこの id になる。
      node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id: match[1] } };
    });
  };
}

/**
 * rehype plugin: 同一ページ内の見出し id 重複をビルドエラーにする。`rehypeHeadingIds` の後に置く。
 * 明示 id は slugger の重複回避を通らず、重複すると検索インデックスの文書 id も重複して
 * クライアントの検索全体が失敗するため、ここで止める。
 */
export function rehypeUniqueHeadingIds() {
  /**
   * @param {import('hast').Root} _tree
   * @param {import('vfile').VFile} file
   */
  return (_tree, file) => {
    const seen = new Set();
    for (const { slug } of file.data.astro?.headings ?? []) {
      if (seen.has(slug)) file.fail(`Duplicate heading id "${slug}"`);
      seen.add(slug);
    }
  };
}
