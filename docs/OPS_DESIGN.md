# Testim Docs JA 運用設計

## 目的

英語版ドキュメント更新に継続追従するため、同期から QA までを repo 内のスクリプトと CI で再現可能にします。

## 運用フロー

1. `sync`
   `npm run docs:sync-sidebar` で `docs/SIDEBAR_URLS.md` を更新する。URL 収集が 0 件なら即停止する。
2. `diff detect`
   `npm run check:snapshots` で英語原文の正規化 HTML スナップショットを取得・比較し、変更ページを検出する。コミット済みスナップショット = 翻訳済みベースライン、working tree = 最新英語版として git diff で差分を検知する。
3. `translate`
   `docs:prepare-llm` でタスクを切り出し、`docs:apply-llm` で翻訳結果を反映する。
4. `format`
   `docs:fetch` と `docs:normalize` で本文、画像、内部リンク、固有名詞、description を正規化する。
5. `source parity qa`
   `npm run check:parity` でローカル Markdown の品質チェックを行い、未翻訳行、レガシー callout、JSX callout、本文中 H1、orphan ページを検出する。
6. `qa`
   `npm run lint:docs && npm test && npm run build` を通す。必要なら `--section="..."` で対象を絞る。
7. `release`
   セクション単位で PR を作成し、通過したセクションだけ `docs/SIDEBAR_URLS.md` の検証状態を更新する。

## セクション単位の進め方

- 正本は `docs/SIDEBAR_URLS.md`
- 1 PR = 1 section
- 実行時は `--section="Overview"` のように見出し名をそのまま指定する
- 対象外セクションの本文差分を含めない

## Checkpoint と再開

- `scripts/.checkpoint` に `completed_phase`, `completed_at`, `next_phase`, `step`, `mode`, `section` を保存する
- `docs:pipeline` は同じ `mode` / `section` なら途中の `step` から再開する
- 最初からやり直す場合は `--no-resume` を使う

## Skill / サブエージェント方針

- 必須のサブエージェント構成は設けない
- 継続運用の正本は repo 内のスクリプト、lint、CI とする
- 補助として 1 つの maintainer skill を追加するのは有効だが、複数サブエージェントの常設化は不要
- 実運用で分離するなら、追加する役割は 1 つだけに絞る
  - `source-parity reviewer`: `sourceUrl` とローカル記事を比較し、本文欠落候補、画像件数差分、構造差分、相対リンク残りを検出する
  - deep-audit では `heading-mismatch` を含む低信頼シグナルも収集するが、定期運用の issue 化条件には使わない

## Source Parity チェック

`npm run check:parity` で以下のローカルチェックを即時実行する:

| チェック項目     | 検出内容                                                |
| ---------------- | ------------------------------------------------------- |
| `untranslated`   | 未翻訳の英語テキスト行（UI 操作指示文のパターンマッチ） |
| `legacy-callout` | レガシー callout 形式（`> 📘`, `> ❗️` 等）              |
| `jsx-callout`    | JSX/MDX `<Callout>` コンポーネント残留                  |
| `h1-in-body`     | 本文中の H1 見出し（`#` で始まる行）                    |
| `orphan-page`    | `docs/SIDEBAR_URLS.md` に未掲載のページ                 |

英語原文との構造差分（見出し・画像・コードブロック）はスナップショット diff で検知する。詳細は `docs/DOCS_DATE_TRACKING.md` を参照。

**セクション絞り込み**: `node scripts/check_source_parity.mjs --section="概要"`

**出力**: `parity-check-status.json` に詳細結果を保存する。

## 定期運用（3日ごと）

- 3日ごとに `scheduled-actionable` を実行する:
  1. `npm run docs:sync-sidebar` で SIDEBAR_URLS を最新化する
  2. `npm run check:snapshots` でスナップショットを取得・比較し変更を検出する
  3. `npm run check:parity` でローカル品質チェックを実行する
  4. `npm run check:summary` で summary / audit manifest を生成する
  5. 変更・問題があった場合は `snapshot-diff` と `parity-regression` に分けて GitHub Issue を作成または更新し、0 件なら close する
- `deep-audit` は `workflow_dispatch` と `section` 指定で実行し、スナップショット diff とレポート生成を走らせる
- 検出された Issue は次回セッションでメイン作業フローに従い対応する
- **重複防止**: Issue 作成前に `gh issue list --state open --search/label` で既存 Issue を検索し、既存あれば更新、なければ新規作成する
- GitHub Actions workflow にも同等の重複防止ロジックを持たせる。本文には件数、種別別件数、代表例、summary artifact への導線のみを載せる

## 一括変更時の検証フロー

複数ファイルを一括変換する場合、**検証スクリプトを変換スクリプトと同時に作成**し、初回コミット前に通す。

必須検証項目:

1. `/docs/{slug}` リンクの参照先ファイルが全件存在するか（HTML `<a href>` 含む）。`#fragment` アンカーがある場合は、対象ファイル内に該当する見出しが存在するかも確認する
2. callout 変換後に構文が壊れていないか（引用符の整合、タイトル長、タイプとタイトルの一致）
3. 残存パターンがないか（`:fa-` マーカー、`> 📘` blockquote、外部 `help.testim.io` リンク）
4. `updated` フィールドが英語原文の日付のまま維持されているか
5. main からの巻き戻りがないか（`git diff` の追加行に既存問題が混入していないか）
6. 変更対象ファイル内の既存問題（fa-icon、旧 callout 等）も一緒に修正する。リンクだけ直してファイル内の他の問題を放置しない

## 原文スラグ変更の検知

英語原文側でスラグがリネームされることがある（例: `execute-driver-script-step` → `custom-action-step-mobile`）。

検知方法:

- `npm run docs:sync-sidebar` で英語サイドバーを取得し、JA ファイルの sourceUrl と突き合わせる
- 新規ファイル作成前に同一 sourceUrl を持つ既存ファイルがないか確認する

## レビュー方針

- セルフチェック後に Codex CLI（`.claude/skills/codex-review/SKILL.md`）で read-only レビューを実施
- Codex のフィードバックを修正に反映してから lint/test/build を実行する

## フィードバックループ（学んだことの反映）

レビューや作業で新しいパターン・ルール・ツール知見が判明した場合、対象ファイルの修正だけでなく、ガイドドキュメントにも反映する。これにより同じ問題の再発を防ぐ。

**反映フロー:**

1. 問題を修正する（対象ファイル）
2. 以下の該当ドキュメントを更新する:

| 発見内容                                     | 更新先                                                    |
| -------------------------------------------- | --------------------------------------------------------- |
| 不自然な日本語パターン（直訳、カタカナ表記） | `docs/TRANSLATION_GUIDE.md` 5.1 基本方針 + 5.2 用語統一表 |
| Markdown記法・callout・リンク形式のルール    | `docs/WRITING_GUIDE.md`                                   |
| ツールの使い方（Codex CLI フラグ等）         | `.claude/skills/` 配下の該当 SKILL.md                     |
| 運用フロー・CI設定の変更                     | `docs/OPS_DESIGN.md`                                      |
| Claude Code の動作ガイダンス                 | `.claude/CLAUDE.md`                                       |

3. ガイド更新を main にコミットする（`.claude/` 配下は git 管理外のためコミット不要）

**例:**

- 「開かれています」が不自然 → TRANSLATION_GUIDE.md の NG/OK 例に追加 + 用語統一表に追加
- Codex CLI の `--path` が動かない → SKILL.md を `-C` に修正
- GitHub Actions のスケジュール変更 → OPS_DESIGN.md と DOCS_DATE_TRACKING.md を更新

## CI の役割

- [`scheduled-actionable.yml`](../.github/workflows/scheduled-actionable.yml) では `docs:sync-sidebar`、`check:snapshots`、`check:parity`、`check:summary`、issue 更新 / close を実行する
- [`deep-audit.yml`](../.github/workflows/deep-audit.yml) では section 単位または全件のスナップショット diff を実行する
- `snapshot-diff-status.json`、`parity-check-status.json`、`docs-actionable-report.json`、`docs-update-summary.md`、`docs-audit-manifest.json` を artifact として保存する
