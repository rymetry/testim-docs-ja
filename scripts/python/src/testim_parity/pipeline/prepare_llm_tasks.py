"""``scripts/pipeline/prepare_llm_tasks.mjs`` の Python port。

各 markdown doc の本文を含んだ翻訳プロンプトを ``llm/tasks/<slug>.md`` に
書き出す。LLM に投げる前の pre-processing step。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from ..project import ROOT_DIR, build_slug_index, resolve_slug, split_frontmatter
from ..sidebar import get_section_slug_set

__all__ = ["main"]


_TASKS_DIR: Path = ROOT_DIR / "llm" / "tasks"


_PROMPT_TEMPLATE = """\
# 翻訳タスク ({slug})

下記のMarkdown本文を日本語に翻訳してください。

## Source-First 構造マッピング

翻訳時は以下の構造契約に従ってください:

### 見出し
- 原文の最初の H1(ページタイトル) → frontmatter title: に入れる(本文に H1 は出さない)
- 原文の 2 番目以降の H1 → H2 に降格
- H2 / H3 / H4 → そのまま維持

### リスト
- マーカー: 原文の `*` → `-` に統一(markdownlint 互換)
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
- リンクのURLは変更しない(アンカーテキストのみ訳す)
- Testim の製品名・機能名・画面名は英語のまま維持

--- 原文本文ここから ---

{body}"""


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit code: 0 成功 / 1 不明 slug)。"""
    parser = argparse.ArgumentParser(description="Prepare LLM translation task files")
    parser.add_argument("--slug", default=None, help="1 slug だけ出力")
    parser.add_argument("--section", default=None, help="sidebar section で絞り込み")
    args = parser.parse_args(argv)

    only_slug: str | None = None
    if args.slug:
        only_slug = resolve_slug(args.slug)
        if not only_slug:
            print(
                f'❌ Unknown slug: "{args.slug}". No matching document found.',
                file=sys.stderr,
            )
            return 1

    section_slugs = get_section_slug_set(args.section) if args.section else None
    index = build_slug_index()
    _TASKS_DIR.mkdir(parents=True, exist_ok=True)

    count = 0
    for slug, info in index.items():
        if only_slug and slug != only_slug:
            continue
        if section_slugs is not None and slug not in section_slugs:
            continue
        file_path = Path(info["filePath"])
        md = file_path.read_text(encoding="utf-8")
        split = split_frontmatter(md)
        body = split.get("body", md)
        prompt = _PROMPT_TEMPLATE.format(slug=slug, body=body)
        out_path = _TASKS_DIR / f"{slug}.md"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(prompt, encoding="utf-8")
        count += 1

    try:
        rel = _TASKS_DIR.relative_to(ROOT_DIR)
    except ValueError:
        rel = _TASKS_DIR
    print(f"Prepared {count} LLM task file(s) in {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
