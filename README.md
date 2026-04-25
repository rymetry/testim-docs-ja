# Testim Help Docs 日本語版

[Tricentis Testim](https://www.testim.io/) の公式ヘルプドキュメント（[help.testim.io](https://help.testim.io/docs/testim-overview)）を日本語で提供するプロジェクトです。最新の機能や使い方を日本語でまとめています。

## 🚀 プロジェクト構成

```text
/
├── public/              # 静的ファイル（favicon など）
├── docs/                # 運用・翻訳・パリティ維持のドキュメント
├── scripts/
│   └── py/              # 同期・検出・保守用 Python tooling
├── src/
│   ├── components/      # 再利用可能なコンポーネント
│   │   ├── navigation/  # ナビゲーション関連
│   │   └── search/      # 検索機能
│   ├── content/
│   │   └── docs/        # Markdown ドキュメント本体
│   ├── layouts/         # ページレイアウト
│   ├── lib/             # ユーティリティ関数
│   ├── pages/           # ルーティング
│   ├── styles/          # グローバル CSS
│   └── types/           # TypeScript 型定義
├── src/content.config.ts # Content Collections 定義
├── astro.config.mjs     # Astro 設定
└── package.json
```

## 🛠️ 技術スタック

- **フレームワーク**: [Astro 6](https://astro.build/) - 高速な静的サイト生成（Content Layer API、Built-in Fonts API）
- **スタイリング**: [Tailwind CSS v4](https://tailwindcss.com/) - ユーティリティファーストCSS
- **コンテンツ管理**: Markdown (.md) - シンプルで書きやすい
- **検索機能**: [MiniSearch](https://github.com/lucaong/minisearch) - クライアントサイド全文検索
- **UIコンポーネント**: React - インタラクティブな検索UI
- **Markdownプラグイン**:
  - `remark-gfm` - GitHub Flavored Markdown（テーブル、タスクリスト、脚注など）
  - `remark-directive` + `@microflash/remark-callout-directives` - 情報パネル（:::tip, :::warning など）
  - `rehype-autolink-headings` - 見出しへの自動リンク
- **型安全性**: TypeScript
- **運用ツール**: Python 3.12 + uv - 原文同期、パリティ確認、正規化、レポート生成

## 📦 セットアップ

### 前提条件

- Node.js 22 系推奨（`package.json` の `engines` は `>=18 <25`）
- npm
- Python 3.12 と uv（`scripts/py` の運用コマンドを使う場合）

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（http://localhost:4321）
npm run dev

# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# Python tooling の依存関係
cd scripts/py
uv sync --all-extras
```

## 📝 ドキュメントの追加方法

1. `src/content/docs/` に新しい `.md` ファイルを作成
1. frontmatter に必要な情報を記入：

```yaml
---
title: 'ページタイトル'
description: 'ページの説明文'
category: 'カテゴリ名'
order: 10
updated: '2025-10-29'
keywords:
  - keyword1
  - keyword2
---
```

1. Markdown でコンテンツを執筆
1. 開発サーバーで確認後、コミット

## 🎨 デザイン方針

- Tricentis Testim Docs 公式（[help.testim.io](https://help.testim.io/)）のレイアウトを踏襲
- 日本語フォントは Noto Sans JP を使用（Astro Fonts API で自動管理）
- コードブロックは GitHub Dark Dimmed テーマでシンタックスハイライト
- レスポンシブデザイン対応（モバイル・タブレット・デスクトップ）

## 📚 執筆機能

Markdown (.md) ファイルで以下の拡張機能が利用できます：

- **情報パネル（Callout）**: `:::tip`, `:::warning`, `:::success`, `:::danger`, `:::note`, `:::info`
- **コードブロックタイトル**: ` ```javascript title="example.js" `
- **GitHub Flavored Markdown**: テーブル、タスクリスト、脚注、取り消し線
- **見出しへの自動リンク**: すべての見出しにアンカーリンクが自動付与

### 📖 執筆者向けガイド

**新しく記事を書く方・編集する方へ:**

- 📝 **[WRITING_GUIDE.md](./docs/WRITING_GUIDE.md)** - Markdown の書き方から拡張機能まで、すべて解説
  - Markdown vs MDX の選び方
  - 情報パネル、コードブロックの使い方
  - ベストプラクティスとFAQ
  - 執筆フロー

- 🎨 **[執筆機能リファレンス](./docs/WRITING_FEATURES.md)** - 実装例が豊富なリファレンス
  - すべての機能の詳しい使用例
  - callout・コードブロック・テーブルなど全機能の記述例

- 🌐 **[TRANSLATION_GUIDE.md](./docs/TRANSLATION_GUIDE.md)** - 公式ドキュメントからの翻訳手順

詳細は [WRITING_GUIDE.md](./docs/WRITING_GUIDE.md) を参照してください。

## 🔍 検索機能

- **MiniSearch** による日本語対応の全文検索
- タイトル、説明文、キーワード、見出しテキストを検索対象に含む
- **部分一致検索**とファジー検索に対応
- **⌘K**（Mac）または **Ctrl+K**（Windows/Linux）でクイック起動
- キーボードナビゲーション（↑↓で移動、Enterで選択）

検索機能の特徴：

- リアルタイム検索（入力と同時に結果を表示）
- カテゴリ表示で情報整理
- レスポンシブなモーダルUI
- アクセシブルなキーボード操作

### 関連ドキュメント

- [scripts/README.md](./scripts/README.md) - スクリプトの詳しい使い方
- [PYTHON_MIGRATION_PLAN.md](./docs/PYTHON_MIGRATION_PLAN.md) - Python tooling の現行 gate と環境契約
- [DOCS_DATE_TRACKING.md](./docs/DOCS_DATE_TRACKING.md) - スナップショット変更検知の仕様
- [OPS_DESIGN.md](./docs/OPS_DESIGN.md) - 運用設計・レビュー手順

## 🏆 ライセンス

このプロジェクトのソースコードは [MIT License](./LICENSE) の下で公開されています。

## 🤝 コントリビューション

誤訳の修正や追加ドキュメントの提案は Issue または Pull Request でお願いします。

## 🔗 関連リンク

- [Tricentis Testim 公式サイト](https://www.testim.io/)
- [Tricentis Testim Docs 公式ドキュメント](https://help.testim.io/)
- [Tricentis Testim Docs 公式 Changelog](https://help.testim.io/changelog)

---

**Note**: このプロジェクトは Testim 公式の日本語化プロジェクトではなく、個人による非公式翻訳です。
