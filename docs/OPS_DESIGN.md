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

## 一括変更時の検証フロー

複数ファイルを一括で変換・修正する場合、変換スクリプトと検証スクリプトを**同時に**作成し、初回コミット前に検証を通す。

**必須検証項目:**

1. `/docs/{slug}` リンクの参照先ファイルが全件存在するか（HTML `<a href>` 含む）
2. callout 変換後に構文が壊れていないか（引用符の整合、タイトル長、タイプとタイトルの一致）
3. 残存パターンがないか（`:fa-` マーカー、`> 📘` blockquote、外部 `help.testim.io` リンク）
4. `updated` フィールドが英語原文の日付のまま維持されているか
5. `git diff main...branch` の追加行のみを対象にした差分検証で、既存問題と新規導入を区別する

**検証コマンド例:**

```bash
# 全ファイルの不正スラグ検出
python3 -c "
import glob, os, re
base = 'src/content/docs'
files = glob.glob(f'{base}/**/*.md', recursive=True)
slugs = {os.path.splitext(os.path.basename(f))[0] for f in files}
for f in files:
    with open(f) as fh:
        for i, line in enumerate(fh, 1):
            for m in re.finditer(r'\(/docs/([a-z0-9-]+?)(?:#[^)]+)?\)', line):
                if m.group(1) not in slugs:
                    print(f'{os.path.relpath(f, base)}:{i} /docs/{m.group(1)}')
"
```

## 原文スラグ変更の検知

英語原文側でページのスラグが変更されることがある（例: `execute-driver-script-step` → `custom-action-step-mobile`）。変更されると旧スラグへのリンクが壊れ、新規翻訳が重複ファイルになるリスクがある。

**検知方法:**

- `npm run docs:sync-sidebar` で最新の英語サイドバーを取得
- JA ファイルの sourceUrl スラグと英語サイドバーのスラグを突き合わせ
- JA にあるが英語サイドバーにないスラグ → 原文側でリネームまたは削除された可能性
- 新規ファイル作成前に、同一 sourceUrl を持つ既存ファイルがないか確認

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
