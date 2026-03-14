# ドキュメント運用スクリプト

`docs/SIDEBAR_URLS.md` を seed 兼 正本として扱い、初回整備は `full`、継続運用は `diff` を既定とします。再開位置は `scripts/.checkpoint` で管理します。

## 基本コマンド

### URL と seed の同期

```bash
npm run docs:sync-sidebar
```

- `help.testim.io` の sitemap を優先し、必要ならフォールバックで URL を収集します
- 収集件数が 0 件なら fail-fast で停止します
- `docs/SIDEBAR_URLS.md` を更新します

### パイプライン実行

```bash
npm run docs:pipeline
npm run docs:pipeline:full
npm run docs:pipeline:diff
```

- `docs:pipeline` の既定は `--mode=diff`
- `docs:pipeline:full` は初回全件整備用です
- `scripts/.checkpoint` を読み、同じ `mode` / `section` の続きから再開します
- 最初からやり直す場合は `--no-resume` を付けます

追加オプション:

```bash
npm run docs:pipeline -- --section="Overview"
npm run docs:pipeline:full -- --section="Getting Started"
npm run docs:pipeline -- --section="Test Management" --no-resume
```

### 個別ステップ

```bash
npm run docs:placeholders
npm run docs:fetch
npm run docs:prepare-llm
npm run docs:apply-llm
npm run docs:normalize
```

- `docs:placeholders` は `full` 整備時の未翻訳ページの足場を生成します
- `docs:fetch` は英語本文・画像を取得し、`scripts/.cache/docs-state.json` に差分用メタデータを保存します
- `docs:prepare-llm` は `llm/tasks/` を生成します
- `docs:apply-llm` は `llm/translations/` を既存 frontmatter を保ったまま反映します
- `docs:normalize` は内部リンク、固有名詞、description を一括正規化します

`--section="..."` は `docs:placeholders` / `docs:fetch` / `docs:prepare-llm` / `docs:apply-llm` / `docs:normalize` / `lint:docs` で使用できます。セクション名は `docs/SIDEBAR_URLS.md` の見出しに一致させてください。

### 品質チェック

```bash
npm run lint:docs
npm test
npm run build
```

- `lint:docs` は `docs/WRITING_GUIDE.md` 準拠、frontmatter、内部リンク、画像参照、英語維持ルールを検証します
- `build` は Astro schema で `sourceUrl` / `updated` 必須を再検証します

## 初回 full 整備

セクションごとに 1 PR で進めます。

```bash
npm run docs:sync-sidebar
npm run docs:pipeline:full -- --section="Overview"
npm run lint:docs -- --section="Overview"
npm test
npm run build
```

同じ流れを `docs/SIDEBAR_URLS.md` の順序で各セクションに繰り返します。

## 継続メンテナンス

```bash
npm run docs:sync-sidebar
npm run docs:pipeline
npm run lint:docs
npm test
npm run build
```

- `docs:pipeline` は既定で `diff` モードです
- 変更がないページは `scripts/.cache/docs-state.json` の `hash` / `updated` を使ってスキップします

## Checkpoint の扱い

`scripts/.checkpoint` には次の情報を保存します。

```json
{
  "completed_phase": "PR-final",
  "completed_at": "2026-03-14T00:00:00.000Z",
  "next_phase": null,
  "step": "apply_llm_done",
  "mode": "diff",
  "section": null
}
```

- `step` は `url_collect`, `placeholders`, `fetch`, `prepare_llm`, `apply_llm` の完了位置を表します
- `mode` または `section` が変わった場合は、その条件で最初から実行します
- 強制的に最初から実行したい場合は `--no-resume` を使用します

## 関連スクリプト

- `update_sidebar_urls_from_live.mjs`
- `generate_untranslated_placeholders.mjs`
- `fetch_translate_images.mjs`
- `prepare_llm_tasks.mjs`
- `apply_llm_translations.mjs`
- `normalize_docs.mjs`
- `lint-docs.mjs`
- `check_outdated_docs.mjs`
- `sync_frontmatter_from_sidebar.mjs`

- URL 収集の fail-fast と sitemap フォールバック実装
- WRITING_GUIDE 準拠の機械チェック追加
- full / diff モードを 1 つの入口コマンドへ統合
- 日付取得ロジックの共通化
