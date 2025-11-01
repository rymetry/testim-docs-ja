# Testim Help Docs 日本語版

[Testim](https://www.testim.io/) の公式ヘルプドキュメント（[help.testim.io](https://help.testim.io/docs/testim-overview)）を日本語で提供するプロジェクトです。最新の機能や使い方を日本語で理解しやすくまとめています。

## 🚀 プロジェクト構成

```text
/
├── public/              # 静的ファイル（favicon など）
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
├── astro.config.mjs     # Astro 設定
└── package.json
```

## 🛠️ 技術スタック

- **フレームワーク**: [Astro](https://astro.build/) - 高速な静的サイト生成
- **スタイリング**: [Tailwind CSS v4](https://tailwindcss.com/) - ユーティリティファーストCSS
- **コンテンツ管理**: Markdown (.md) - シンプルで書きやすい
- **検索機能**: [MiniSearch](https://github.com/lucaong/minisearch) - クライアントサイド全文検索
- **UIコンポーネント**: React - インタラクティブな検索UI
- **Markdownプラグイン**:
  - `remark-gfm` - GitHub Flavored Markdown（テーブル、タスクリスト、脚注など）
  - `remark-directive` + `@microflash/remark-callout-directives` - 情報パネル（:::tip, :::warning など）
  - `rehype-autolink-headings` - 見出しへの自動リンク
- **型安全性**: TypeScript

## 📦 セットアップ

### 前提条件

- Node.js 18.x 以上
- npm または pnpm

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

- 英語版（[help.testim.io](https://help.testim.io/)）のレイアウトと配色を踏襲
- 日本語フォントは Noto Sans JP を使用
- コードブロックは Dracula テーマでシンタックスハイライト
- レスポンシブデザイン対応（モバイル・タブレット・デスクトップ）

## 📚 執筆機能

Markdown (.md) ファイルで以下の拡張機能が利用できます：

- **情報パネル（Callout）**: `:::tip`, `:::warning`, `:::success`, `:::danger`, `:::note`, `:::info`
- **コードブロックタイトル**: ` ```javascript title="example.js" `
- **GitHub Flavored Markdown**: テーブル、タスクリスト、脚注、取り消し線
- **見出しへの自動リンク**: すべての見出しにアンカーリンクが自動付与

### 📖 執筆者向けガイド

**新しく記事を書く方・編集する方へ:**

- 📝 **[WRITING_GUIDE.md](./WRITING_GUIDE.md)** - Markdown の書き方から拡張機能まで、すべて解説
  - Markdown vs MDX の選び方
  - 情報パネル、コードブロックの使い方
  - ベストプラクティスとFAQ
  - 執筆フロー

- 🎨 **[執筆機能リファレンス](/docs/guides/writing-features)** - 実装例が豊富なリファレンス
  - すべての機能の詳しい使用例
  - ブラウザでの表示イメージを確認

- 🌐 **[TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md)** - 公式ドキュメントからの翻訳手順

詳細は [WRITING_GUIDE.md](./WRITING_GUIDE.md) を参照してください。

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

## 🏆 ライセンス

このプロジェクトは Testim 公式ドキュメントの非公式日本語訳です。  
オリジナルコンテンツの著作権は [Tricentis](https://www.tricentis.com/) に帰属します。

## 🤝 コントリビューション

誤訳の修正や追加ドキュメントの提案は Issue または Pull Request でお願いします。

## 🔗 関連リンク

- [Testim 公式サイト](https://www.testim.io/)
- [英語版ドキュメント](https://help.testim.io/)
- [Testim Changelog](https://help.testim.io/changelog)
- [料金プラン](https://www.testim.io/pricing/)

---

**Note**: このプロジェクトは Testim 公式の日本語化プロジェクトではなく、コミュニティによる非公式翻訳です。
