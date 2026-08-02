# コントリビューションガイド

Tricentis Testim ユーザー制作日本語翻訳ドキュメントへのコントリビューションありがとうございます！このドキュメントでは、プロジェクトへの貢献方法を説明します。

## 📋 目次

- [行動規範](#行動規範)
- [貢献方法](#貢献方法)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [ブランチ戦略](#ブランチ戦略)
- [コミットメッセージ](#コミットメッセージ)
- [プルリクエスト](#プルリクエスト)
- [レビュープロセス](#レビュープロセス)

## 行動規範

このプロジェクトに参加するすべての人は、以下を守ってください：

- 敬意を持って接する
- 建設的なフィードバックを提供する
- 他者の意見を尊重する
- プロジェクトの目的に沿った貢献をする

## 貢献方法

以下のような貢献を歓迎します：

### 1. 誤訳の修正

英語原文と異なる訳や不自然な日本語表現を見つけた場合：

1. 該当ファイルを編集
2. 修正内容を説明するPull Requestを作成
3. 可能であれば英語原文のURLを記載

### 2. 新しいページの翻訳

[docs/TRANSLATION_GUIDE.md](./docs/TRANSLATION_GUIDE.md) を参照して、未翻訳のページを追加してください。

### 3. ドキュメントの更新

英語原文が更新された場合：

```bash
# スナップショットで変更を検知
npm run check:snapshots

# 変更内容を確認して日本語を更新し、スナップショットと一緒にコミット
```

### 4. バグ修正・機能改善

- サイトの表示崩れ
- 検索機能の不具合
- ナビゲーションの問題
- パフォーマンス改善

### 5. ドキュメント整備

- README.mdの改善
- ガイドラインの追加・更新
- サンプルコードの追加

## 開発環境のセットアップ

### 前提条件

- Node.js 22.12 以上、25 未満（`package.json` の `engines` に準拠）
- npm
- Python 3.14.4
- [uv](https://docs.astral.sh/uv/)
- Git

### セットアップ手順

```bash
# 1. リポジトリをフォーク
# GitHubのUIからフォークボタンをクリック

# 2. クローン
git clone https://github.com/YOUR_USERNAME/testim-docs-ja.git
cd testim-docs-ja

# 3. 依存関係をインストール
npm ci
cd scripts/python
uv sync --locked --all-extras
cd ../..

# 4. 開発サーバーを起動
npm run dev
# → http://localhost:4321 でアクセス

# 5. ブランチを作成
git switch -c fix/translation-error-in-overview
```

### 開発時のコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド確認
npm run build

# 品質チェック（Markdown・ドキュメント・Python静的検査）
npm run lint

# Astro・TypeScript・Markdownのフォーマット
npm run format

# Pythonのフォーマット
npm run format:py

# ドキュメント変更検知
npm run check:snapshots
```

## ブランチ戦略

### ブランチ命名規則

以下の形式でブランチを作成してください：

```text
<type>/<short-description>
```

**Type:**

- `fix/` - バグ修正や誤訳修正
- `feat/` - 新機能追加
- `docs/` - ドキュメント更新
- `refactor/` - リファクタリング
- `chore/` - その他のメンテナンス作業

**例:**

```bash
git switch -c fix/typo-in-getting-started
git switch -c feat/add-salesforce-guide
git switch -c docs/update-translation-guide
```

## コミットメッセージ

明確で分かりやすいコミットメッセージを心がけてください。

### 推奨フォーマット

```text
<type>: <subject>

<body>
```

**Type:**

- `fix` - バグ修正
- `feat` - 新機能
- `docs` - ドキュメント
- `style` - フォーマット
- `refactor` - リファクタリング
- `test` - テスト
- `chore` - その他

**例:**

```bash
# 誤訳修正
git commit -m "fix: testim-overviewの誤訳を修正"

# 新しいページ追加
git commit -m "feat: Salesforce Testing章を追加

- salesforce-overviewを翻訳
- 画像を追加
- 内部リンクを設定"

# ドキュメント更新
git commit -m "docs: TRANSLATION_GUIDEに画像取得手順を追加"
```

## プルリクエスト

### PR作成前のチェックリスト

- [ ] `npm run lint` が通る
- [ ] `npm run test` が成功する
- [ ] `npm run build` が成功する
- [ ] ローカルで表示を確認済み
- [ ] コミットメッセージが明確
- [ ] 関連するIssueがあれば番号を記載

### PRテンプレート

```markdown
## 変更内容

<!-- 何を変更したか簡潔に説明 -->

## 変更理由

<!-- なぜこの変更が必要か -->

## 確認事項

- [ ] Lintエラーなし
- [ ] テスト成功
- [ ] ビルド成功
- [ ] ローカルで動作確認済み

## スクリーンショット（該当する場合）

<!-- 表示変更がある場合は画像を添付 -->

## 関連チケット

<!-- 必要なら Issue / PR / 外部チケットへのリンクを記載 -->
```

### PR作成手順

```bash
# 1. 変更をコミット
git add .
git commit -m "fix: 誤訳を修正"

# 2. プッシュ
git push origin fix/translation-error

# 3. GitHubでPRを作成
# - base: main
# - compare: fix/translation-error
```

## レビュープロセス

### レビュー基準

Pull Requestは以下の観点でレビューされます：

1. **翻訳品質**
   - 英語原文の意味が正確に伝わるか
   - 日本語として自然か
   - 技術用語が適切か

2. **コード品質**
   - Lintエラーがないか
   - フォーマットが統一されているか
   - ビルドが成功するか

3. **ドキュメント構造**
   - Frontmatterが正しく設定されているか
   - 内部リンクが適切か
   - 画像パスが正しいか

4. **一貫性**
   - 既存の翻訳スタイルに沿っているか
   - カテゴリ分類が適切か
   - ファイル命名規則に従っているか

### フィードバックへの対応

- レビューコメントには迅速に対応してください
- 不明点があれば質問してください
- 修正後は再レビューを依頼してください

## 翻訳ガイドライン

詳細は [docs/TRANSLATION_GUIDE.md](./docs/TRANSLATION_GUIDE.md) を参照してください。

### 重要なポイント

1. **ファイル命名**: 英語原文のURL slugと一致させる
2. **Frontmatter**: `title`, `description`, `category`, `updated`, `sourceUrl` を必ず設定（`order`, `keywords` は任意）
3. **画像**: `public/images/` 配下に配置
4. **内部リンク**: 日本語版のファイルが存在する場合は内部リンクに変更

## 質問・サポート

- **Issue**: バグ報告や機能要望は [GitHub Issues](https://github.com/rymetry/testim-docs-ja/issues) で
- **Discussion**: 一般的な質問や相談は [GitHub Discussions](https://github.com/rymetry/testim-docs-ja/discussions) で
- **レビュー**: Pull Requestでフィードバックを受けられます

## 謝辞

このプロジェクトへの貢献に感謝します！あなたの貢献により、日本語話者がTestimをより理解しやすくなります。

---

参考ドキュメント：

- [WRITING_GUIDE.md](./docs/WRITING_GUIDE.md) - 執筆ガイド
- [OPS_DESIGN.md](./docs/OPS_DESIGN.md) - 運用設計・レビュー手順
- [README.md](./README.md) - プロジェクト概要
