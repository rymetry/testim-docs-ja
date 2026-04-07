# Testim Docs JA 運用設計

## 目的

英語版ドキュメント更新に継続追従するため、同期から QA までを repo 内のスクリプトと CI で再現可能にします。

## 運用フロー

1. `sync`
   `npm run docs:sync-sidebar` で `docs/SIDEBAR_URLS.md` を更新する。URL 収集が 0 件なら即停止する。
2. `diff detect`
   `npm run check:snapshots` で英語原文の Markdown スナップショットと sidebar HTML を取得・比較し、変更ページを検出する。コミット済みスナップショット = 翻訳済みベースライン、working tree = 最新英語版として git diff で差分を検知する。
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

`npm run check:parity` で日本語ドキュメントの翻訳品質をローカルチェックする。

チェック項目の詳細（actionable / signal の一覧、`--fail-on` フラグ、acknowledgements、出力形式）は `scripts/README.md` を参照。

**セクション絞り込み**: `node scripts/check_source_parity.mjs --section="概要"`

**単一ページ**: `npm run check:parity -- --slug=overview/testim-overview`

**出力**: `parity-check-status.json` に詳細結果を保存する。

**Phase 6B review queue**: `npm run check:parity -- --include-advisory`
で `tokenless-near-tie` の LLM/manual review queue を表示する。これは既存
`segment-inconclusive` から導出した補助表示であり、gate exit code には影響しない。
`parity-check-status.json` では `advisoryQueue` を workflow 入力として使えるが、
partial run を避けるため `advisoryQueueScope.isComplete === true` を確認してから
queue 全体を消費する。

### EN スナップショット正規化

比較前に `normalizeEnArtifacts()` で EN 側の既知アーティファクトを正規化する:

| アーティファクト | 処理 |
| --- | --- |
| wrapping code fence (` ```mdx ... ``` `) | fence を strip して中身を比較対象にする |
| inline ZWS (U+200B 等) | 文字単位で除去 |
| 番号リストスペース欠落 (`5.Click`) | `5. Click` に修正（`1.1.` サブステップは除外） |
| ZWS のみの行 | 行ごと除去 |
| trailing backslash (`\`) | `\` を strip |
| 末尾改行なし | 改行を補完 |

### EN アーティファクト注釈

`detectEnArtifacts()` が EN body の構造的アーティファクトを検出し、issue の `artifacts` フィールド（`detail` とは別）に付与する。`detail` は acknowledgements の `detailIncludes`/`detailRegex` マッチに使われるため不変。CLI 表示時のみ suffix として表示する。

- `EN uses <details> blocks` — EN が `<details>` を使用
- `EN body largely wrapped in code fence` — EN 本文の 50% 以上がコードフェンス内

## チェックの保証範囲

| 保証する | 保証しない |
| --- | --- |
| 構造パリティ（見出し・リスト・段落・テーブル） | UI 表示崩れ |
| リンク実在（slug + fragment） | 自然な日本語 |
| 画像ファイル実在 | 文体品質 |
| frontmatter 整合 | 厳密な Astro レンダリング |
| 原文構造差分 | セマンティックな翻訳精度 |

### 日常運用（ページ単位）

```bash
npm run check:parity -- --slug=overview/testim-overview
npm run check:snapshots:diff -- --slug=overview/testim-overview
npm run lint:docs -- --path=src/content/docs/overview/testim-overview.md
```

### 定期運用（全文）

```bash
npm run lint:docs          # リンク実在 + frontmatter + 構文
npm run check:parity       # 構造パリティ全件
npm run test && npm run build
```

## 定期運用（3日ごと）

- 3日ごとに `scheduled-actionable` を実行する:
  1. `npm run docs:sync-sidebar` で SIDEBAR_URLS を最新化する
  2. `npm run check:snapshots` でスナップショットを取得・比較し変更を検出する
  3. `npm run check:parity` でローカル品質チェックを実行する
  4. `npm run check:summary` で summary / audit manifest を生成する
  5. `docs-actionable-report.json` の 4 family
     (`source-sync-health` / `snapshot-diff` / `parity-regression` /
     `parity-followup`) ごとに GitHub Issue を create / update / close する
- `deep-audit` は `workflow_dispatch` と `section` 指定で実行し、スナップショット diff とレポート生成を走らせる
- 検出された Issue は次回セッションでメイン作業フローに従い対応する
- **重複防止**: issue body に `<!-- detection-family: ... -->` の marker を埋め込み、
  `sync-detection-issues.cjs` はこれを primary key として既存 Issue を照合する。
  title は legacy fallback のみで使い、同一 family の open duplicate は次回 sync で close する
- scheduled workflow の issue sync は `schedule` 実行時のみ有効。
  `workflow_dispatch` は artifact / summary 生成に留める
- 本文には件数、代表例、artifact への導線を載せ、machine-readable な follow-up payload は
  `docs-actionable-report.json` に保持する

## 一括変更時の検証フロー

複数ファイルを一括変換する場合、**検証スクリプトを変換スクリプトと同時に作成**し、初回コミット前に通す。

必須検証項目:

1. `/docs/{folder}/{slug}` リンクの参照先ファイルが全件存在するか（HTML `<a href>` 含む）。`#fragment` アンカーがある場合は、対象ファイル内に該当する見出しが存在するかも確認する
2. callout 変換後に構文が壊れていないか（引用符の整合、タイトル長、タイプとタイトルの一致）
3. 残存パターンがないか（`:fa-` マーカー、`> 📘` blockquote、外部 `docs.tricentis.com` リンク）
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

- [`scheduled-actionable.yml`](../.github/workflows/scheduled-actionable.yml) では `docs:sync-sidebar`、`check:snapshots`、`check:parity`、`check:summary` を実行し、
  `schedule` 実行時のみ 4 family (`source-sync-health` / `snapshot-diff` /
  `parity-regression` / `parity-followup`) の issue を sync する
- [`deep-audit.yml`](../.github/workflows/deep-audit.yml) では section 単位または全件のスナップショット diff を実行する
- `snapshot-diff-status.json`、`parity-check-status.json`、`docs-actionable-report.json`、`docs-update-summary.md`、`docs-audit-manifest.json` を artifact として保存する

### Phase 8 — Workflow split の契約 (DO NOT BREAK)

Phase 8 PR2 で workflow 間の責務を明示的に固定した。新しい workflow を
追加する、または既存の workflow に check:parity 系の step を追加する際は
次のルールを守ること。

| 役割 | 担当 workflow | scope | sync-detection-issues.cjs を呼ぶか |
| ---- | ------------- | ----- | ---------------------------------- |
| 4 family の managed issue 更新 | `scheduled-actionable.yml` | **full repo のみ**（`--slug` / `--section` 禁止） | はい（`schedule` 実行時のみ） |
| 単一 section / slug の手動デバッグ | `deep-audit.yml` | partial（`--section` 任意、`--slug` 任意） | **絶対に呼ばない** |

**構造的な防壁** (PR2 で導入):

1. `parity-check-status.json.summary.runScope` に `{ type, isComplete, filters }` を出力する
2. `generate_detection_reports.mjs` が runScope を `docs-actionable-report.json` の top-level に複写する
3. `.github/scripts/sync-detection-issues.cjs` が `report.runScope?.isComplete !== true` を検出した場合、**listManagedIssues を呼ぶ前に early return + warning** する
4. legacy report (`runScope === null` / 欠如) は後方互換のため従来どおり sync する。Phase 8 ロールアウトが完全に終わったあと、別 PR で fail-closed に切り替える検討をする

**やってはいけないこと**:

- `scheduled-actionable.yml` に `--slug` や `--section` を追加すること（partial run になり、sync guard が managed issue 更新を止める）
- `deep-audit.yml` に `sync-detection-issues.cjs` の呼び出しを追加すること（partial run の上書きを runtime guard 1 個に頼ることになる）
- `parity-check-status.json` の `summary.runScope` を partial run でも `isComplete: true` にすること（guard が空回りする）
- 新しい coarse signal type を `parity-regression` family に流すこと（Phase 8 PR1 の `COARSE_SIGNAL_TYPES` allowlist で audit-only として扱うか、新規 issue type として gate に乗せるかを review で必ず判断する）

**Phase 8 audit-only signals を CI で確認する手順**:

```bash
# scheduled-actionable.yml の artifact から確認
jq '.summary | { reportableActiveFiles, reportableActiveActionableFiles, auditSignalIssues, auditSignalFiles, auditSignalsByType, runScope }' parity-check-status.json

# deep-audit.yml の artifact から section 単位で確認
jq '.summary.auditSignalsByType' parity-check-status.json
```

**関連 spec**: `docs/superpowers/specs/2026-04-07-issue-225-phase-8-design.md`

---

## Phase 6A Rollback Playbook

Phase 6A cutover (2026-04-06) 後に問題が発生した場合の対応手順。Issue #225 Phase 6A spec の §7 を runbook 化したもの。

### 判断フロー

```text
PR2 merge 後に問題発生
    │
    ├── false negative の疑いがある?
    │      └── Yes → Path 1 (revert) 即時実行
    │
    ├── root cause 即特定可能?
    │      ├── No → Path 1 (revert)
    │      └── Yes
    │            ├── snapshot 変更が起点?
    │            │      ├── Yes → Path 2 (translate-first)
    │            │      └── No
    │            │            ├── 1 commit で fix forward 可能?
    │            │            │      ├── Yes → forward-fix PR
    │            │            │      └── No → Path 1 (revert)
```

**重要**: false negative 疑いは**最優先で revert する**。false positive は forward-fix で時間をかけて直せるが、false negative は gate の信頼性そのものを破壊するため、疑いがある段階で止める方が安全。

### Path 1 — Full revert

**Trigger**:

- false negative の疑い（baseline match logic が新しい bug を吸収している懸念）
- root cause が same-day で特定できない
- 明らかな baseline 機構のバグ
- C4 (baseline-recall) テストが過去に false negative を見逃していた疑い

**手順**:

1. main に取り込まれた PR2 の commit SHA を特定し、通常の squash merge なら `git revert <PR2 commit SHA on main>` で revert PR を起こす（merge commit を使っている場合のみ `git revert -m 1 <merge commit SHA>`）
2. revert PR で `npm run check:parity -- --fail-on=actionable` が exit 0 を確認
3. fast-track で merge（reviewer 1 名 + CI green）
4. main 復旧確認後、separate issue で root cause investigation を起票
5. 修正 + 再 cutover は PR2′ として再実施
6. **再 cutover の前提**: 検出された failure pattern を C4 / C5 / 新規 test として regression guard を仕込んでから再実施。テスト追加なしの再 cutover は禁止

revert すると segment-* issues は cutover 前の状態（shadow accounting 相当）に戻る。PR1 の infra（baseline schema, generation script, alignment 改修）は PR1 そのものの revert でない限り残るため、`generate_parity_baseline.mjs` 等のツールは引き続き使える。

### Path 2 — Translate-first, rebaseline as last resort

**Trigger**:

- main の CI が baseline invalidation に起因して red
- root cause が特定の slug 群への snapshot 変更（PR2 後の snapshot update PR が起点）
- false negative の疑いがない（純粋な page-level invalidation の動作）

**手順**:

1. **どの slug が invalidate されたかを確認**: `parity-check-status.json` の `baselineInvalidatedSlugs` から抽出
2. **第一選択肢: 翻訳追従**
   - JA 翻訳を新しい EN snapshot に追従させる通常の翻訳 PR を出す
   - baseline には触らない
   - 翻訳完了後は新しい snapshot fingerprint で gate が自然に green に戻る
3. **第二選択肢（justification 必須）: rebaseline**
   - 翻訳追従が現実的でない場合のみ
   - `node scripts/generate_parity_baseline.mjs --slug=<slug>[,<slug>...]` で部分再生成
   - 再生成 diff を含む PR を起こし、PR description に必ず justification を記載:
     - なぜ翻訳追従でなく rebaseline を選んだか
     - 想定される paydown のタイミング
     - `reviewAfter` を継承するか延長するか（延長する場合は理由）

**重要**: rebaseline を「snapshot 変更時の自動的な逃げ道」にしてはならない。原則は常に **翻訳追従が第一**。rebaseline は justification がある例外的ケースに限る。

### Baseline 運用ルール

- `parity-baseline.json` は Phase 6A cutover 時点の既知 drift を凍結したもの
- 新規発生の segment-* issue は baseline に載らず即 gate fail
- baseline entries は `reviewAfter` を持つが、期限超過で自動 hard fail させない（無関係 PR が突然 red になる事故を防ぐため）
- baseline paydown は明示的な PR で実施する（段階的縮小）
- `segment-extra` と `segment-shifted` は acknowledgeable、それ以外の segment-* は `NON_ACKNOWLEDGEABLE_TYPES` に残したまま frozen baseline で運用する
- Phase 6B では `tokenless-near-tie` baseline エントリを review queue として triage する（Issue #225 Phase 6B spec 参照）
