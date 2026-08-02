---
name: fix-doc-localization-issues
description: |
  GitHub Issue に記載された日本語ドキュメントの品質問題を処理するスキル。
  英語原文を取得し、日本語ドキュメントを修正（callout、リンク、画像、日本語品質）、
  不足ページは新規作成し、PR を作成する。
  トリガー: "/fix-doc-localization-issues", "Issue対応", "Issue処理"
  引数: スペース区切りの Issue 番号（例: /fix-doc-localization-issues 40 42 43）
---

# fix-doc-localization-issues スキル

GitHub Issue に記載された日本語ドキュメントの品質問題を修正し、PR を作成する。
既存ページの修正と新規ページの作成の両方を扱う。

## 引数

スペース区切りで Issue 番号を指定する。

```
/fix-doc-localization-issues 40 42 43
```

引数なしの場合はユーザーに Issue 番号を確認する。

## 事前読み込み

作業開始前に以下のルールを読み、遵守する:

- **`docs/WRITING_GUIDE.md`** — frontmatter、内部リンク、callout、ソース忠実性、用語
- **`docs/TRANSLATION_GUIDE.md`** — 自然な日本語、NG/OK パターン、用語テーブル
- **`docs/OPS_DESIGN.md`** — レビューポリシー、フィードバックループ

## Issue ごとのワークフロー

Issue は1件ずつ完了まで処理する。**複数 Issue のブランチや PR を交互に進めない。**

### ステップ 1: Issue を読む

```bash
gh issue view {ISSUE_NUMBER}
```

- 対象ファイル、受け入れ基準、親 Issue（あれば）を特定
- 各対象ファイルの frontmatter から `sourceUrl` を確認

### ステップ 2: ブランチ作成

```bash
git switch main && git pull
git switch -c claude/{topic-name}
```

ブランチ名は Issue 内容から導出（例: `claude/fix-recording-tests`）。

### ステップ 3: 修正 or 新規作成の判定

対象ファイルが `src/content/docs/` に存在するか確認:

- **存在する** → ステップ 4A（既存ページ修正）へ
- **存在しない** → [ステップ 4B: 新規ページ作成](#ステップ-4b-新規ページ作成)へ

### ステップ 4A: 英語原文との比較（既存ページ）

各対象ファイルの `sourceUrl` を WebFetch で取得し、以下を検証:

- 見出し構造と段落数が一致しているか
- 番号付きステップの欠落がないか
- 全 callout が反映されているか
- 全コンテンツ画像が本文中の正しい位置に埋め込まれているか（ダウンロード済みだけでは不十分 — 配置位置を原文と照合）

### ステップ 4A（続）: 問題の修正

検出した問題を修正する。よくあるパターン:

| 問題 | 修正 |
|------|------|
| レガシー callout (`> 📘`) | `:::info{title="..."}` に変換 |
| `(doc:slug)` リンク | `/docs/slug` に変換 |
| 外部リンクだが対応する JA ファイルが存在 | `/docs/slug` 内部リンクに変換 |
| `:fa-arrow-right:` マーカー | 削除または太字に置換 |
| 画像未埋め込み | 原文に合わせた正しい位置に埋め込む |
| 不自然な日本語 | TRANSLATION_GUIDE の NG/OK パターン参照 |
| Testim 用語の誤訳 | 英語に戻す（TRANSLATION_GUIDE 5.2 参照） |

### ステップ 4B: 新規ページ作成

Issue が指定するページがリポジトリに存在しない場合:

1. **EN 原文取得**: `sourceUrl` を WebFetch で取得
2. **EN スナップショット取得**: `npm run check:snapshots:fetch -- --slug={slug}` で HTML スナップショットを保存
3. **画像ダウンロード**: `npm run docs:fetch -- --slug={slug}` または EN HTML に参照される画像を `public/images/{category-folder}/{slug}/` にダウンロード
4. **SIDEBAR_URLS.md に追加**: `snapshots/en/sidebar.json` に基づき正しい位置に URL を挿入。sidebar.json に未掲載の場合は EN サイトの実際のナビゲーション順序を WebFetch で確認して決定する
5. **order 値を設定**: 隣接ファイルの `order` 値を確認。挿入箇所にギャップがなければ後続ファイルの `order` を +1 シフト
6. **Markdown ファイル作成** (`src/content/docs/{category-folder}/{slug}.md`):
   - frontmatter: title, description, category, order, updated, sourceUrl, keywords
   - WRITING_GUIDE の見出しマッピング規則に従う（H1→title、2個目以降の H1→H2、**H2/H3/H4 はそのまま維持**）
   - 全画像を EN 原文と同じ位置に埋め込む
   - `<div class="note">` → `:::note`、リンク → `/docs/{slug}` に変換
   - TRANSLATION_GUIDE に従い自然な日本語で記述
7. **バリデーション**: `npm run lint:docs -- --path={file}` と `npm run check:parity -- --slug={slug}` を実行

### ステップ 5: Codex CLI レビュー（3 ファイル以上変更時に推奨）

`.claude/skills/codex-review/SKILL.md` に従い読み取り専用レビューを実行:

```bash
codex -s read-only exec -C . \
  "Review the Japanese documentation files changed on this branch against their English sourceUrl originals. Check: (1) all paragraphs/steps/callouts/images preserved, (2) images embedded at correct positions, (3) internal links use /docs/{slug} format, (4) Testim product names kept in English, (5) callouts use ::: directive syntax. No confirmation or questions needed. Provide concrete issues proactively."
```

Codex からのフィードバックを修正に反映する。

### ステップ 6: バリデーション

```bash
npm run lint && npm run test && npm run build
npm run check:parity -- --slug={slug}   # slug 形式: category/basename（例: editing-tests/search-within-a-test）
```

**全チェックがパスするまでステップ 4 に戻る。**

### ステップ 7: コミットと PR 作成

```bash
git add {対象ファイル}
git commit -m "docs: {変更サマリ}

Closes #{ISSUE_NUMBER}"
git push -u origin claude/{topic-name}
```

PR 作成:

```bash
gh pr create --title "docs: {サマリ}" --body "$(cat <<'EOF'
## Summary
- {変更内容}

## Checklist
- [ ] sourceUrl 原文と比較済み
- [ ] callout は ::: ディレクティブ構文を使用
- [ ] 内部リンクは /docs/{slug} 形式
- [ ] Testim 用語は英語のまま
- [ ] lint / test / build / parity 全パス

Closes #{ISSUE_NUMBER}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### ステップ 8: 親 Issue の更新（該当する場合）

親 Issue にチェックボックスがあれば更新:

```bash
gh issue view {PARENT_ISSUE_NUMBER}
```

## 新しいパターンの発見時

TRANSLATION_GUIDE や WRITING_GUIDE に追加すべきパターンを発見した場合:

1. **Issue 修正 PR にガイド変更を含めない**（スコープを分離）
2. PR description に「発見した新パターン: ...」として記録
3. ガイド更新は別コミットで行う（`docs/OPS_DESIGN.md` のフィードバックループ参照）

## エラーハンドリング

| 状況 | 対処 |
|------|------|
| sourceUrl の WebFetch 失敗 | ブラウザで URL を確認。無効なら Issue にコメント |
| lint エラー | エラー出力を読み、WRITING_GUIDE に従い対象ファイルを修正 |
| ビルドエラー | frontmatter YAML 構文を確認。`astro check` で詳細確認 |
| 対象ファイルが存在しない | ステップ 4B に従い新規作成 |
| parity チェック失敗 | diff 出力を確認し、構造の差異を修正 |
