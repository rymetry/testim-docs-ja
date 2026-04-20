---
name: codex-review
description: |
  OpenAI Codex CLI を使ったコードレビュー・技術分析スキル。
  Claude の分析に異なるモデルの視点を加え、レビュー網羅性を向上させる。
  用途: (1) コードレビュー・品質分析, (2) バグ調査・根本原因分析,
  (3) アーキテクチャ・設計相談, (4) リファクタリング提案, (5) UI/UX 評価,
  (6) コピー・メッセージングレビュー, (7) 技術的問題の調査。
  トリガー: "codex", "codex に聞いて", "セカンドオピニオン", "別の視点",
  "コードレビュー", "レビューして", "設計相談", "バグ調査"
---

# Codex CLI スキル

OpenAI Codex CLI を非対話モードで実行し、コードレビューや技術分析を行う。
Claude 自身の分析と異なるモデルの視点を組み合わせることで、レビューの網羅性を高める。

## 前提条件チェック

実行前に必ず確認:

```bash
# 1. Codex CLI がインストールされているか
which codex || echo "NOT_INSTALLED"

# 2. 認証が設定されているか
# CODEX_API_KEY 環境変数 または事前の `codex login` が必要
```

**未インストールの場合**:
「Codex CLI がインストールされていません。`npm i -g @openai/codex` でインストールできます。」と案内する。強制実行しない。

**認証エラーの場合**:
`CODEX_API_KEY` 環境変数の設定を案内する。

## コマンド構文

グローバルフラグ（sandbox、承認ポリシー、モデル）は `exec` サブコマンドの**前**に置く。順序を間違えるとサイレントに失敗する。

### 基本形（読み取り専用分析）

```bash
codex -s read-only exec -C <プロジェクトディレクトリ> "<プロンプト>"
```

### フラグリファレンス

| フラグ | 位置 | 用途 |
|--------|------|------|
| `-s read-only` | グローバル（`exec` の前） | sandbox を読み取り専用に設定。分析・レビュー用 |
| `-C <dir>` | `exec` フラグ | 作業ルートディレクトリを指定 |
| `--json` | `exec` フラグ | JSONL イベントストリームで出力。プログラム的なパース用 |
| `-o <file>` | `exec` フラグ | 最終出力をファイルに書き出す。長い分析結果向け |
| `--model <model>` | グローバル | モデル指定。デフォルトは gpt-5.4 |
| `--skip-git-repo-check` | `exec` フラグ | Git リポジトリ外での実行を許可 |

### コード修正が必要な場合

```bash
codex --full-auto exec -C <プロジェクトディレクトリ> "<プロンプト>"
```

`--full-auto` はワークスペース書き込み可能な sandbox を有効化する。ファイル変更が必要な場合のみ使用。純粋な分析には `-s read-only` を使う。

## プロンプト構築

### テンプレート

```
[役割指定（必要なら）]
[依頼内容]
[スコープまたは評価基準（該当する場合）]

No confirmation or questions needed. Provide concrete suggestions, fixes, and code examples proactively.
```

末尾の指示は**必ず付与する**。これがないと Codex は確認質問で止まったり、具体的な出力を返さない。

### 効果的なプロンプトの原則

- **スコープを限定する**: 「auth モジュールのエラーハンドリングをレビュー」は「全部レビュー」より精度が高い
- **評価基準を明示する**: セキュリティ、パフォーマンス、保守性 — 何を重視するか伝える
- **コンテキストを与える**: 「Astro + TypeScript のドキュメントサイト」のような背景情報が精度を上げる
- **役割指定の判断**: 専門分野が明確なタスク（セキュリティ、アクセシビリティ等）では "You are a security expert." のように追加する。汎用レビューやコピーレビューでは省略してよい
- **`-o` オプションの使い分け**: プロジェクト全体を対象とする包括的分析（技術的負債の棚卸し等）では `-o /tmp/codex-review.md` でファイル保存する。単一モジュールや特定観点の分析は標準出力で十分

## ユースケース別コマンド例

### コードレビュー
```bash
codex -s read-only exec -C /path/to/project \
  "Review this project's code. Focus on security risks, performance bottlenecks, and maintainability issues. No confirmation or questions needed. Provide concrete fixes with code examples proactively."
```

### バグ調査
```bash
codex -s read-only exec -C /path/to/project \
  "Investigate the 500 error that occurs after session timeout in the authentication flow. Identify the relevant files and analyze the root cause. No confirmation or questions needed. Provide the root cause and concrete fixes proactively."
```

### アーキテクチャ分析
```bash
codex -s read-only exec -C /path/to/project \
  "Analyze this project's architecture. Evaluate dependency structure, separation of concerns, and scalability. No confirmation or questions needed. Provide improvement proposals proactively."
```

### UI/UX デザインレビュー
```bash
codex -s read-only exec -C /path/to/project \
  "Evaluate this project's UI from a designer's perspective. Analyze visual hierarchy, spacing rhythm, color contrast and accessibility, interaction consistency, and cognitive load. No confirmation or questions needed. Provide concrete improvements with code examples proactively."
```

### コピー・メッセージングレビュー
```bash
codex -s read-only exec -C /path/to/project \
  "Review the user-facing text in this project (error messages, button labels, onboarding copy, notification text). Evaluate clarity, tone consistency, and accessibility. No confirmation or questions needed. Provide concrete rewrites proactively."
```

### リファクタリング提案
```bash
codex -s read-only exec -C /path/to/project \
  "Analyze this module for refactoring opportunities. Focus on code duplication, overly complex functions, and tight coupling. No confirmation or questions needed. Provide concrete refactoring steps with before/after code proactively."
```

### 出力をファイルに保存（長い分析向け）
```bash
codex -s read-only exec -C /path/to/project \
  -o /tmp/codex-review.md \
  "Comprehensively analyze the technical debt in this project. No confirmation or questions needed. Provide a prioritized refactoring plan proactively."
```

### セッション再開（追加質問・深掘り）
```bash
codex exec resume --last \
  "Regarding the auth module issue from the previous analysis, provide a more detailed fix. No confirmation or questions needed."
```

## 実行ステップ

1. **前提条件チェック**: `which codex` でインストール確認。なければ案内して停止。
2. **対象ディレクトリ特定**: ユーザー指定のパスを確認、またはアップロードファイルを検出。
3. **プロンプト構築**: ユーザーの依頼 + 評価基準 + 末尾の非対話指示を組み合わせる。
4. **コマンド実行**: 分析のみなら `-s read-only`、修正が必要なら `--full-auto`。
5. **結果を統合して報告**: Codex の出力をそのまま伝えるのではなく、Claude の視点と統合する。

ステップ 5 が最重要: Codex の出力をそのまま中継しない。2 つの視点を統合する — 例えば「Codex は X を指摘しており、私も同意します。理由は...。加えて Y も検討すべきです」。この視点の統合がスキルの核心的価値。

## トラブルシューティング

| 症状 | 原因と対処 |
|------|-----------|
| `codex: command not found` | 未インストール。`npm i -g @openai/codex` を案内 |
| 認証エラー | `CODEX_API_KEY` 未設定。環境変数の設定を案内 |
| タイムアウト | プロジェクトが大きすぎる。プロンプトのスコープを特定モジュール・ファイルに絞る |
| Git リポジトリエラー | `--skip-git-repo-check` を追加、または対象ディレクトリで `git init` |
