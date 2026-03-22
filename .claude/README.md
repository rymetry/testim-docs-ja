# .claude/ ディレクトリ

Claude Code の設定・スキル・プロジェクト固有の指示を管理するディレクトリ。

## ファイル構成

```
.claude/
├── CLAUDE.md              # Claude Code への指示（自動読み込み）
├── README.md              # このファイル（人間向けガイド）
├── settings.local.json    # ローカル設定
└── skills/
    ├── codex-review/      # Codex CLI によるレビュー
    │   └── SKILL.md
    └── fix-doc-localization-issues/  # GitHub Issue 対応ワークフロー
        └── SKILL.md
```

## Skills 一覧

### `/fix-doc-localization-issues` — Issue 対応ワークフロー

GitHub Issue に記載された日本語ドキュメントの品質問題を修正し、PR を作成する。

**使い方:**

```
/fix-doc-localization-issues 40 42 43
```

Issue 番号をスペース区切りで渡す。各 Issue について以下を自動で実行:

1. `gh issue view` で対象確認
2. `claude/` ブランチ作成
3. `sourceUrl` から英語原文を取得して突合
4. 修正（callout変換、リンク修正、画像埋込、日本語品質）
5. Codex CLI レビュー（任意）
6. `npm run lint && npm run test && npm run build` 検証
7. コミット → push → PR 作成（`Closes #Issue番号`）
8. 親 Issue のチェックボックス更新

**補足指示を加える場合:**

```
/fix-doc-localization-issues 40 42 43
Codex レビューはスキップして
```

Skill 読み込み後に自然言語で追加指示を付け足せる。

### `/codex-review` — Codex CLI レビュー

OpenAI の Codex CLI でコードレビュー・設計相談・バグ調査などを実行する。

**使い方:**

```
codex でこのブランチの変更をレビューして
```

または直接:

```
/codex-review
```

詳細は `skills/codex-review/SKILL.md` を参照。

## CLAUDE.md の役割

`CLAUDE.md` は Claude Code が**毎回自動で読み込む**指示ファイル。内容は最小限に保ち、詳細ルールは Authority Sources（`docs/` 配下のガイド）に委譲している。

| 何を知りたいか | 参照先 |
|---|---|
| コンテンツルール全般 | `docs/WRITING_GUIDE.md` |
| 翻訳ワークフロー・用語 | `docs/TRANSLATION_GUIDE.md` |
| 運用フロー・CI・レビュー | `docs/OPS_DESIGN.md` |
| ページ一覧・構造 | `docs/SIDEBAR_URLS.md` |

## 新しい Skill を追加するとき

1. `skills/{skill-name}/SKILL.md` を作成
2. YAML frontmatter に `name` と `description` を記載
3. この README に使い方を追記
