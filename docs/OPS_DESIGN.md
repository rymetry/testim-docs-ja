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

## Source Parity チェック

`npm run check:parity` で以下のローカルチェックを即時実行する:

| チェック項目 | 検出内容 |
|-------------|---------|
| `untranslated` | 未翻訳の英語テキスト行（UI 操作指示文のパターンマッチ） |
| `legacy-callout` | レガシー callout 形式（`> 📘`, `> ❗️` 等） |
| `jsx-callout` | JSX/MDX `<Callout>` コンポーネント残留 |
| `h1-in-body` | 本文中の H1 見出し（`#` で始まる行） |
| `orphan-page` | `docs/SIDEBAR_URLS.md` に未掲載のページ |

リモートモード（`npm run check:parity:remote`）では上記に加えて英語原文をフェッチし、見出し数・画像数・コードブロック数を比較する。

**セクション絞り込み**: `node scripts/check_source_parity.mjs --section="概要"`

**出力**: `parity-check-status.json` に詳細結果を保存。CI では artifact として Upload される。

### 全文比較（深い調査）

全ファイルを英語原文と内容レベルで比較する場合は、以下の手順で並行エージェントを活用する:

1. ファイルをカテゴリフォルダごとに 6〜8 グループに分割する
2. 各グループに対して Agent を起動し、`sourceUrl` から英語原文を WebFetch で取得
3. 見出し構造、画像数、コードブロック、callout、未翻訳テキストを比較
4. 結果を既存 Issue と突き合わせ、カバーされていない乖離に対して新規 Issue を作成
5. 既存オープン Issue にはコメントで具体的な乖離情報を追加

この手法で 285 ファイル全件を約 3 分（8 並行エージェント）で比較できる。

## 定期運用（3日ごと）

- 3日ごとに以下を実行する:
  1. `npm run docs:sync-sidebar` で SIDEBAR_URLS を最新化
  2. 新規ページ追加を検出 → 重複チェック後 GitHub Issue 作成
  3. `npm run check:updates` で更新のあったドキュメントを検出
  4. `npm run check:parity` でローカル品質チェック（未翻訳テキスト、レガシー callout 等）
  5. 更新・問題があった場合 → 重複チェック後まとめて1つの GitHub Issue 作成
- CronCreate（セッション内）と GitHub Actions（恒久的）の二重体制で運用する
- 検出された Issue は次回セッションでメイン作業フローに従い対応する
- **重複防止**: Issue 作成前に `gh issue list --state open --search/--label` で既存 Issue を検索し、既存あればコメント追加、なければ新規作成
- GitHub Actions workflow にも同等の重複防止ロジックが組込済み（label: `documentation,update-needed`）

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

| 発見内容 | 更新先 |
|---------|-------|
| 不自然な日本語パターン（直訳、カタカナ表記） | `docs/TRANSLATION_GUIDE.md` 5.1 基本方針 + 5.2 用語統一表 |
| Markdown記法・callout・リンク形式のルール | `docs/WRITING_GUIDE.md` |
| ツールの使い方（Codex CLI フラグ等） | `.claude/skills/` 配下の該当 SKILL.md |
| 運用フロー・CI設定の変更 | `docs/OPS_DESIGN.md` |
| Claude Code の動作ガイダンス | `.claude/CLAUDE.md` |

3. ガイド更新を main にコミットする（`.claude/` 配下は git 管理外のためコミット不要）

**例:**
- 「開かれています」が不自然 → TRANSLATION_GUIDE.md の NG/OK 例に追加 + 用語統一表に追加
- Codex CLI の `--path` が動かない → SKILL.md を `-C` に修正
- GitHub Actions のスケジュール変更 → OPS_DESIGN.md と DOCS_DATE_TRACKING.md を更新

## CI の役割

- `check-docs-updates.yml` で3日ごとのスケジュール（`0 0 */3 * *`）と PR 時の `lint:docs`, `test`, `build` を実行する
- `docs:sync-sidebar` と `check:updates` を workflow に接続し、更新差分を artifact と issue/comment で可視化する
- `check:parity` を workflow に接続し、未翻訳テキスト・レガシー callout 等の品質問題を定期検出する
- 検出結果は `docs-update-status.json` と `parity-check-status.json` として artifact に保存される
