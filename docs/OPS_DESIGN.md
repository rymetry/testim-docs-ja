# Testim Docs JA 運用設計

## 目的

英語版ドキュメント更新に継続追従するため、同期から QA までを repo 内のスクリプトと CI で再現可能にします。

## 運用フロー

1. `sync`
   `npm run docs:sync-sidebar` で `docs/SIDEBAR_URLS.md` を更新する。URL 収集が 0 件なら即停止する。
2. `diff detect`
   `npm run docs:pipeline` または `npm run check:updates` で変更ページを検出する。既定モードは `diff`。
3. `translate`
   `docs:prepare-llm` でタスクを切り出し、`docs:apply-llm` で翻訳結果を反映する。
4. `format`
   `docs:fetch` と `docs:normalize` で本文、画像、内部リンク、固有名詞、description を正規化する。
5. `source parity qa`
   `sourceUrl` の原文とローカル Markdown を比較し、本文、手順、callout、画像件数、画像配置を照合する。画像を取得済みでも本文に埋め込まれていなければ差し戻す。
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
  - `source-parity reviewer`: `sourceUrl` とローカル記事を比較し、本文欠落、画像未埋め込み、相対リンク残りを検出する

## 定期運用（3日ごと）

- 3日ごとに以下を実行する:
  1. `npm run docs:sync-sidebar` で SIDEBAR_URLS を最新化
  2. 新規ページ追加を検出 → 重複チェック後 GitHub Issue 作成
  3. `npm run check:updates` で更新のあったドキュメントを検出
  4. 更新があった場合 → 重複チェック後まとめて1つの GitHub Issue 作成
- CronCreate（セッション内）と GitHub Actions（恒久的）の二重体制で運用する
- 検出された Issue は次回セッションでメイン作業フローに従い対応する
- **重複防止**: Issue 作成前に `gh issue list --state open --search/--label` で既存 Issue を検索し、既存あればコメント追加、なければ新規作成
- GitHub Actions workflow にも同等の重複防止ロジックが組込済み（label: `documentation,update-needed`）

## レビュー方針

- セルフチェック後に Codex CLI（`.claude/skills/codex-review/SKILL.md`）で read-only レビューを実施
- Codex のフィードバックを修正に反映してから lint/test/build を実行する

## CI の役割

- `check-docs-updates.yml` で3日ごとのスケジュール（`0 0 */3 * *`）と PR 時の `lint:docs`, `test`, `build` を実行する
- `docs:sync-sidebar` と `check:updates` を workflow に接続し、更新差分を artifact と issue/comment で可視化する
