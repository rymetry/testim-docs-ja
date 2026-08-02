# Tricentis Testim ユーザー制作日本語翻訳ドキュメント 運用設計

## 目的

[Tricentis Testim 公式英語ドキュメント](https://docs.tricentis.com/testim/content/home.htm)の
更新に継続追従するため、同期から QA までをリポジトリ内のスクリプトと CI で
再現可能にします。本プロジェクトは Tricentis または Testim が運営する公式日本語版ではありません。

## 運用フロー

1. `sync`
   `npm run docs:sync-sidebar` で `docs/SIDEBAR_URLS.md` を更新する。URL 収集が 0 件なら即停止する。
2. `diff detect`
   `npm run check:snapshots` で英語原文の HTML スナップショットと sidebar JSON を取得・比較し、変更ページを検出する。コミット済みスナップショット = 翻訳済みベースライン、working tree = 最新英語版として git diff で差分を検知する。
3. `translate`
   `npm run docs:pipeline` を使う場合は、`url_collect` → `placeholders`（full モードのみ）→ `fetch` → `prepare_llm` → `apply_llm` の順で実行する。個別実行では `docs:fetch` の後に `docs:prepare-llm` と `docs:apply-llm` を使う。
4. `format`
   必要に応じて `npm run docs:normalize` で frontmatter、内部リンク、固有名詞、description を正規化する。
5. `source parity qa`
   `npm run check:parity` で EN HTML と JA Markdown の構造・invariant token・ページ coverage を比較し、未翻訳、構造差分、欠落ページ、orphan ページなどを検出する。
6. `qa`
   `npm run lint && npm test && npm run build` を通す。ページ単位の事前確認では、必要に応じて `npm run lint:docs -- --section="..."` で対象を絞る。
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

**セクション絞り込み**: `npm run check:parity -- --section="概要"`

**単一ページ**: `npm run check:parity -- --slug=overview/testim-overview`

**出力**: `parity-check-status.json` に詳細結果を保存する。

**tokenless-near-tie review queue**: `npm run check:parity -- --include-advisory`
で `tokenless-near-tie` の LLM/manual review queue を表示する。これは既存
`segment-inconclusive` から導出した補助表示であり、gate exit code には影響しない。
`parity-check-status.json` では `advisoryQueue` を workflow 入力として使えるが、
partial run を避けるため `advisoryQueueScope.isComplete === true` を確認してから
queue 全体を消費する。

### EN スナップショット正規化

比較前に `testim_parity.extract.normalize_en_artifacts()` で EN 側の既知アーティファクトを正規化する:

| アーティファクト | 処理 |
| --- | --- |
| wrapping code fence (` ```mdx ... ``` `) | fence を strip して中身を比較対象にする |
| inline ZWS (U+200B 等) | 文字単位で除去 |
| 番号リストスペース欠落 (`5.Click`) | `5. Click` に修正（`1.1.` サブステップは除外） |
| ZWS のみの行 | 行ごと除去 |
| trailing backslash (`\`) | `\` を strip |
| 末尾改行なし | 改行を補完 |

### EN アーティファクト注釈

`testim_parity.extract.detect_en_artifacts()` が EN body の構造的アーティファクトを検出し、issue の `artifacts` フィールド（`detail` とは別）に付与する。`detail` は acknowledgements の `detailIncludes`/`detailRegex` マッチに使われるため不変。CLI 表示時のみ suffix として表示する。

**`source-unusable` / `snapshot-incomplete` の ack 形式**: `testim_parity.source_usability` の emitter は `detail` 末尾に `[reason=<token>]` を埋め込む。ack 作成時はこの token を `detailIncludes` に指定する:

- `detailIncludes: "[reason=escaped-details-residue]"` — `<details>` widget tree 破壊
- `detailIncludes: "[reason=shallow-snapshot]"` — EN snapshot が本文欠損
- `detailIncludes: "[reason=extractor-empty]"` — extractor が body=0 を返した

`reason` token は `usabilitySignals.reason` と 1:1 対応で、baseline 側 (`build_baseline_key`) は同じ token を構造化 identity key に使う。`scripts/python/tests/test_usability_ack_integration.py` が detector→matcher round-trip を固定している。

`detect_en_artifacts()` の `artifacts` フィールド種別:

- `EN uses <details> blocks` — EN が `<details>` を使用
- `EN body largely wrapped in code fence` — EN 本文の 50% 以上がコードフェンス内

### Structure comparator (canonical block sequence)

`align_segments()` が weighted LCS を走らせる前に、heading path が一致する section ごとに `compare_section_structure()` を呼び、**原文 block 列の並びと多重集合** を比較する。この比較器は、`paragraph-count-mismatch` などの count heuristic を補助シグナルへ降格した後の **構造保持の主判定** を担う。

**比較対象の block 語彙 (凍結)**: `paragraph` / `ordered-list` / `unordered-list` / `callout-body` / `table` / `details-summary`。segment 単位の `ordered-list-item` / `unordered-list-item` / `table-cell` は比較前に list / table block に畳み込まれる (block 内部の件数差は別 comparator の責務)。

**3 段階の fall-through**:

| Stage | 条件 | emit type | structureCategory |
| --- | --- | --- | --- |
| A | EN/JA で block kind の **多重集合** が違う (cross-kind merge/split/collapse) | `section-structure-mismatch` | `kind-multiset` |
| B | multiset は一致するが **並び順** が違う (mixed-kind reorder) | `segment-order-mismatch` | `kind-sequence` |
| C | kind 列は完全一致しているが **content bijection が monotonic でない** (same-kind の swap / rotation) | `segment-order-mismatch` | `content-order` |

どの stage も発火しなければ比較器は空配列を返し、`align_segments()` は weighted LCS にフォールスルーする。section あたり最大 1 件までしか emit しない — 先に発火した stage が勝ち、後続 stage は short-circuit でスキップされる (gate 契約を予測可能にするため)。

**gate 分類**: `section-structure-mismatch` と `segment-order-mismatch` は **reportable** (gate 対象)。`parity-baseline.json` に entry が無ければ `--fail-on=any` と `--fail-on=actionable` の両方で exit code 1。

**baseline identity**: structure 系 entry の machine identity は **`sectionIndex` + `structureCategory` + `structureFingerprint`** の 3 つ組で構成する (`build_baseline_key` / `build_baseline_key_from_entry`)。`structureFingerprint` は `structureCategory` + `enKinds` + `jaKinds` (+ content-order の場合は `contentPermutation` の `enIndex→jaIndex` pair) を sha256 に畳み込んだもの。`sectionPath` は **reviewer 可読性のために entry に保存するが identity key には含めない**。同一ページ内で同じ heading text が複数現れる場合に、`sectionPath` だけでは一意にならないため。

### Source unusable 判定

比較前に `detect_source_usability()` が EN snapshot の **比較可能性** を判定する。比較不能と判定されたページはその 1 件だけを emit し、後続の `align_segments()` / structure comparator は呼ばれない (translation drift と snapshot/source debt を混ぜないため)。

**3 つの reason (凍結)**:

| reason | 発火条件 | emit type |
| --- | --- | --- |
| `shallow-snapshot` | raw EN ≤ 800 bytes かつ EN body ≤ 2 かつ JA body ≥ 5 かつ ratio ≥ 4 | `snapshot-incomplete` |
| `extractor-empty` | clean HTML なのに EN body が 0 で JA body ≥ 3 | `snapshot-incomplete` |
| `escaped-details-residue` | (通常経路) `&lt;/details&gt;` 残存 **または** open/close 不均衡 (= broken details tree) **かつ** `enHeadingSegmentCount === 0` で JA heading ≥ 2 (= section anchor failure) を **両方** 満たす。(extractError 経路) open/close 不均衡 (`open !== close`) のみで判定 | `source-unusable` |

`escaped-details-residue` の判定が **狭く** なっているのは、`advanced-editing/coding-assistant` のように `<details>` の使用例を本文に含むため preprocessEnHtml 後も balanced な escaped marker が残るが extractor / comparator は正常に動く合法ケースを誤発火させないため。「escaped marker が残るだけ」では unusable と判定しない。

**gate 分類**: `snapshot-incomplete` と `source-unusable` は **advisory のみ** — `summary.snapshotUnusableIssues` / `summary.snapshotUnusableFiles` に集計されるが `summary.reportableActiveFiles` には入らない。そのため active な source unusable が何件あっても exit code は 0。これは「翻訳者責任外の snapshot / source sync 側の debt」を翻訳者 gate で失敗させないため。`parity-baseline.json` には `usabilityReason` を key として entry を置けるので、人手管理の枠としては活用できる。

## チェックの保証範囲

| 保証する | 保証しない |
| --- | --- |
| 構造パリティ（見出し・リスト・段落・テーブル） | UI 表示崩れ |
| リンク実在（slug + fragment） | 自然な日本語 |
| 画像ファイル実在 | 文体品質 |
| frontmatter 整合 | 厳密な Astro レンダリング |
| 原文構造差分 | セマンティックな翻訳精度 |
| block 列レベルの構造保持 (paragraph / list / callout / table / details の並びと多重集合) | |

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

### Weekly: Upstream recovery triage

`scheduled-actionable` 実行後、`sourceSyncHealth` managed issue に出現する `enPatchRecovery` / `sourceSyncRecovery` section を次の手順で triage する:

1. `docs-actionable-report.json.sourceSyncHealth.enPatchRecovery.stale[]` と同 `sourceSyncRecovery.stale[]` を確認
2. 各 stale entry について:
   a. 該当 slug の EN snapshot を手動で fetch し直す (`npm run check:snapshots:fetch -- --slug=<slug>`)
   b. 現在の EN HTML を目視し、欠陥が実際に消えているかを確認する (stale signal だけで削除しない)
   c. 消えていれば:
      - `en_source_patches` 系: `_en_source_patches_data.json` から entry を削除
      - `source_sync_exclusions` 系: `testim_parity.sync_exclusions` から entry を削除 + Python registry tests を調整
      - どちらも `docs/UPSTREAM_DEFECTS.md` の対応 entry を archive 状態に更新
      - `npm run check:parity` が 0 issues を維持していることを確認
   d. まだ消えていなければ managed issue にコメントで状況記録 (次週 run で再評価)
3. overdue entry (`statusB: 'overdue'`) は `reviewAfter` 延長でなく **paydown PR** で対応する (`priority='high'` を付与して順位付け)
4. 全 stale / overdue 解消後、当該 section が空になり `sourceSyncHealth` が他 signal も無ければ workflow が自動で issue を close

sticky PR comment (`.github/workflows/ci.yml` の "Sticky PR comment — upstream recovery") も同じ `upstream-recovery-status.json` を読むため、PR 作業中にも stale / overdue entry が可視化される。weekly triage で解消した項目は次の PR run で comment から自動削除される。

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

- セルフチェック後、必要に応じて `.claude/skills/codex-review/SKILL.md` の手順で read-only レビューを実施する
- レビューで見つかった問題を修正してから lint/test/build を実行する

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
| Claude Code の動作ガイダンス                 | `CLAUDE.md`                                               |

3. ガイドとプロジェクト固有 skill の更新を同じ変更としてコミットする（`.claude/skills/` も git 管理対象）

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

### Workflow split の契約 (DO NOT BREAK)

検知パイプラインは workflow 間の責務を明示的に固定している。新しい workflow を
追加する、または既存の workflow に check:parity 系の step を追加する際は
次のルールを守ること。

| 役割 | 担当 workflow | scope | sync-detection-issues.cjs を呼ぶか |
| ---- | ------------- | ----- | ---------------------------------- |
| 4 family の managed issue 更新 | `scheduled-actionable.yml` | **full repo のみ**（`--slug` / `--section` 禁止） | はい（`schedule` 実行時のみ） |
| 単一 section / slug の手動デバッグ | `deep-audit.yml` | partial（`--section` 任意、`--slug` 任意） | **絶対に呼ばない** |

**構造的な防壁:**

1. `parity-check-status.json.summary.runScope` に `{ type, isComplete, filters }` を出力する
2. `npm run check:summary` (`testim_parity.detection.generate_detection_reports`) が runScope を `docs-actionable-report.json` の top-level に複写する
3. `.github/scripts/sync-detection-issues.cjs` が `report.runScope?.isComplete !== true` を検出した場合、**listManagedIssues を呼ぶ前に early return + warning** する
4. legacy report (`runScope === null` / 欠如) は後方互換のため従来どおり sync する。将来的に fail-closed へ切り替えることを検討する

**やってはいけないこと**:

- `scheduled-actionable.yml` に `--slug` や `--section` を追加すること（partial run になり、sync guard が managed issue 更新を止める）
- `deep-audit.yml` に `sync-detection-issues.cjs` の呼び出しを追加すること（partial run の上書きを runtime guard 1 個に頼ることになる）
- `parity-check-status.json` の `summary.runScope` を partial run でも `isComplete: true` にすること（guard が空回りする）
- 新しい coarse signal type を `parity-regression` family に流すこと（`COARSE_SIGNAL_TYPES` allowlist で audit-only として扱うか、新規 issue type として gate に乗せるかを review で必ず判断する）

**Audit-only signals を CI で確認する手順:**

```bash
# scheduled-actionable.yml の artifact から確認
jq '.summary | { reportableActiveFiles, reportableActiveActionableFiles, auditSignalIssues, auditSignalFiles, auditSignalsByType, runScope }' parity-check-status.json

# deep-audit.yml の artifact から section 単位で確認
jq '.summary.auditSignalsByType' parity-check-status.json
```

---

### Detection pipeline 契約

検知パイプラインの 3 つの artifact (`source-sync-status.json`,
`snapshot-diff-status.json`, `parity-check-status.json`) は **schemaVersion
を必ず持ち**、scheduled-actionable workflow は `npm run check:summary -- --strict`
を経由してロード時に validation する。validation が失敗した場合は
`docs-actionable-report.json` を使った managed issue sync は走らない
(`steps.summary.outcome == 'success'` の AND 条件)。

**freshnessState** (`source-sync-status.json` 由来):

| state    | 意味                                                                                          |
| -------- | --------------------------------------------------------------------------------------------- |
| `fresh`  | すべての対象ページ取得成功 + sidebar 取得成功                                                 |
| `partial`| 一部ページ取得失敗、集計継続可能                                                              |
| `broken` | sidebar 取得失敗、page 0 件、または全 page 失敗                                               |

**linkageState** (`validateRunLinkage()` 由来、parity 側で計算):

- **`linked`** — source-sync の `sourceInventoryFingerprint` と
  snapshot-diff の同フィールドが一致、かつ runScope が同一
- **`missing`** — snapshot-diff か source-sync が無い (PR CI / legacy)。
  `pass` をブロックしない
- **`stale`** — fingerprint 不一致 (inventory drift)。
  `pass` を `inconclusive` に降格
- **`scope-mismatch`** — full vs partial の混在。同上

**parity-check-status.json.summary.result**:

- **`pass`** — reportable issue 0、error file 0、
  freshness が fresh または unknown、linkage が linked / missing
- **`fail`** — reportable issue ≥ 1 または error file ≥ 1
  (freshness / linkage の状態に関係なく fail を維持)
- **`inconclusive`** — freshness が partial / broken / stale、
  または linkage が stale / scope-mismatch (clean 時のみ)

`inconclusive` を `pass` と等価に扱ってはならない。scheduled live check
では `sourceSyncHealth` family が linkage failure / freshness 問題を
issue 化する。

---

## Parity gate 障害時の rollback playbook

`segment-*` exact diff を primary gate とする現行構成で、false negative の疑いや
baseline 機構の障害が発生した場合の対応手順。

### 判断フロー

```text
gate に異常が出たら
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
- baseline-recall テストが過去に false negative を見逃していた疑い

**手順**:

1. main に取り込まれた対象を特定する。通常の merge commit は `git revert -m 1 <merge commit SHA>`、単一 commit は `git revert <commit SHA>` で revert PR を起こす
2. revert PR で `npm run check:parity -- --fail-on=actionable` が exit 0 を確認
3. fast-track で merge（reviewer 1 名 + CI green）
4. main 復旧確認後、separate issue で root cause investigation を起票
5. 検出された failure pattern を baseline-recall / determinism / 新規 test として regression guard に追加する
6. 修正 PR で全 gate を再実行し、同じ不具合が再発しないことを確認する

revert 後も baseline 機構（schema、generation script、alignment）は維持されるため、
調査時は `npm run check:parity` と `npm run generate:parity-baseline` を利用できる。

### Path 2 — Translate-first, rebaseline as last resort

**Trigger**:

- main の CI が baseline invalidation に起因して red
- root cause が特定の slug 群への snapshot 変更（snapshot update PR が起点）
- false negative の疑いがない（純粋な page-level invalidation の動作）

**手順**:

1. **どの slug が invalidate されたかを確認**: `parity-check-status.json` の `baselineInvalidatedSlugs` から抽出
2. **第一選択肢: 翻訳追従**
   - JA 翻訳を新しい EN snapshot に追従させる通常の翻訳 PR を出す
   - baseline には触らない
   - 翻訳完了後は新しい snapshot fingerprint で gate が自然に green に戻る
3. **第二選択肢（justification 必須）: rebaseline**
   - 翻訳追従が現実的でない場合のみ
   - `npm run generate:parity-baseline -- --slug=<slug>[,<slug>...]` で部分再生成
   - 再生成 diff を含む PR を起こし、PR description に必ず justification を記載:
     - なぜ翻訳追従でなく rebaseline を選んだか
     - 想定される paydown のタイミング
     - `priority` を `high`/`medium`/`low` のどれに設定したか（`medium` 以外なら理由）

**重要**: rebaseline を「snapshot 変更時の自動的な逃げ道」にしてはならない。原則は常に **翻訳追従が第一**。rebaseline は justification がある例外的ケースに限る。

### Baseline 運用ルール

- `parity-baseline.json` は schema v2。`reviewAfter` による期限管理は行わず、`priority` (`high`/`medium`/`low`) と `note` で paydown 優先度を表現する
- `entries.length === 0` を維持する。新規発生の segment-* / structure issue は baseline に載せず、翻訳追従 / artifact registry / normalizer / extractor / alignment / source lock のいずれかで解消する
- `is_frozen_by_baseline(issue) ≡ issue.baselined is True` — baseline entry が存在する場合は明示的に削除するまで gate を抑止する。paydown は **必ず明示的な PR** として行う
- `segment-extra` と `segment-shifted` は acknowledgeable、それ以外の segment-* は `NON_ACKNOWLEDGEABLE_TYPES` に残したまま frozen baseline で運用する
- `tokenless-near-tie` は baseline 対象外 (schema v2 で `segment-inconclusive` は `BASELINE_ELIGIBLE_TYPES` から除外)。`--include-advisory` review queue として triage する

### Baseline の継続運用

baseline は bug backlog として運用する:

- 新規 issue は原則として baseline に追加しない。修正するか、glossary / normalize / artifact registry / page-level exclusion のいずれかで説明可能に除外する
- schema v2 では entry に `priority` (`high`/`medium`/`low`) と任意 `note` を付与する。paydown の優先順位決定はこれらで行う
- Quarterly review は「方針再検討」ではなく「残 backlog の burn-down 進捗確認」として実施
- 再生成手順: `npm run check:parity` と `npm run generate:parity-baseline`

### Orphan baseline entry

detector / extractor / preprocessor の仕様変更で、runtime が emit しなくなった
issueType の baseline entry は **orphan** として残留する。`testim_parity.detection.check_source_parity`
は完走時に orphan を以下の経路で可視化する:

- `parity-check-status.json.summary.orphanBaselineEntries` (総数) および
  `.orphanBaselineByType` (type 別内訳) に集計される
- CLI サマリーで 0 件以外なら `🧹 orphan baseline entries: N 件 (...)` の 1 行を出す
- `detection_reports.parityFollowup` に `## 🧹 Orphan baseline entries` セクションを出す

掃除手順:

1. `npm run check:parity` の CLI 出力で orphan 件数と byType を確認
2. 該当 slug に対して `npm run generate:parity-baseline -- --slug=<slug>` で再生成
3. 再度 `npm run check:parity` を走らせて `orphanBaselineEntries === 0` を確認

`scripts/python/tests/test_orphan_integration.py` が
「既存 clean slug に stale entry を注入 → orphan として集計される」E2E を
pin する。repo-global な baseline/status file を奪い合わないよう、
一時ディレクトリ上の baseline/status copy だけを操作する。

### representative / source-side debt の現行運用

- representative fixture は clean page 群だけを対象にし、source-side debt ページは別テストで扱う
- `SOURCE_SYNC_EXCLUSIONS` の active entry は現在 0 件。新しい上流欠陥を確認した場合のみ slug 単位で登録する
- 代表ページ、clean sentinel、source unusable fixture、source-side debt fixture はそれぞれ専用テストで契約を固定する
- 詳細な経緯や過去のレビュー履歴は git 履歴を参照

### source-side debt 運用手順

#### 新規 slug の除外登録

1. ブラウザと `npm run check:snapshots:fetch -- --slug=<slug> --dry-run` で live source が broken であることを確認する
2. 必要なら一時 snapshot で `npm run check:parity -- --slug=<slug>` を実行し、detector の `issueType` と `reason` を確認する
3. `testim_parity.sync_exclusions` の `SOURCE_SYNC_EXCLUSIONS` に entry を追加する
4. 必要なら `snapshots/en/content/<slug>.html` に hand-authored snapshot を置く
5. 関連テストを更新し、`npm run lint && npm run test && npm run build` を通す

#### 除外解除

1. `docs-update-summary.md` か managed issue で `excluded-recovered` を確認する
2. ブラウザと `npm run check:snapshots:fetch -- --slug=<slug> --dry-run` で live source の復旧を確認する
3. `SOURCE_SYNC_EXCLUSIONS` から entry を削除する
4. `npm run check:snapshots:fetch -- --slug=<slug>` で snapshot を更新する
5. `npm run check:parity -- --slug=<slug>` で差分を確認し、必要なら JA を修正する
6. テスト更新後に `npm run lint && npm run test && npm run build` を通す

### local gate の期待値

`npm run check:parity` を local で走らせた場合の完了条件は以下:

- `reportableActiveFiles === 0`
- `orphanBaselineEntries === 0`
- `structureMismatchIssues === 0`
- `snapshotUnusableIssues === 0`

ただし `result` フィールドは `freshnessState !== 'fresh'` のとき実装契約上
`inconclusive` に degrade する (`testim_parity.detection.check_source_parity.compute_parity_result`)。
local で snapshot fetch をしていない限り `freshnessState: broken` なので、
`result` は `inconclusive` のままで正常。CI 環境のみ `result: pass` が期待される。

## 付録 A: レビューチェックリスト

以下の手順で英語記事と日本語翻訳ファイルを実行手順を厳守して比較検証してください。

### 対象

- 英語記事: SIDEBAR_URLS.md の {SECTION_NAME} セクション配下の全記事
- 日本語ファイル: `src/content/docs/{FOLDER_NAME}` 配下の md ファイル

### 実行手順

1. SIDEBAR_URLS.mdファイルから{SECTION_NAME}セクションの全記事URLリストを取得
2. 各URLのパス名に対応するmdファイルを特定（パスベースで解決）
   - 例: `https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm` → `src/content/docs/overview/testim-overview.md`
3. 英語記事と日本語mdファイルのペアごとに以下の検証項目を確認
4. 記事本文内のリンクを確認し、content/docs内に対応する日本語mdファイルがあれば内部リンクに変更
5. プロジェクトディレクトリで`npm run lint`を実行してlintエラーを確認

### 検証項目

#### Frontmatter

frontmatter の必須フィールドとルールは `docs/WRITING_GUIDE.md` の「frontmatter 必須ルール」セクションを参照。レビュー時は特に以下を確認:

- [ ] `title`: 原文から適切に日本語翻訳されているか
- [ ] `description`: 記事の要約が日本語で適切に記載されているか（プレースホルダ禁止）
- [ ] `updated`: 英語原文の日付に追従しているか（JA 編集日に変更しないこと。詳細は `DOCS_DATE_TRACKING.md` 参照）
- [ ] `sourceUrl`: `https://docs.tricentis.com/testim/content/.../{slug}.htm` 形式で設定されているか
- [ ] `keywords`: 記事内容に基づいた日本語検索キーワードが設定されているか（上限 10 件）

#### 本文

- [ ] 英語記事の全内容が日本語に翻訳されているか(見出し、段落、リスト、コードブロックのコメント等すべて)
- [ ] 原文の本文が要約に置き換わっていないか（原文の手順や説明が削られていないか）
- [ ] 原文にある callout が日本語版にも反映されているか
- [ ] 原文にあるコンテンツ画像がすべてローカル記事に埋め込まれているか
- [ ] 画像ファイルの存在確認だけでなく、本文中の配置順も原文と一致しているか
- [ ] 本文末尾に更新日(updated, 最終更新日等)の記載がないか
- [ ] 記事内のリンクが適切に処理されているか
  - 外部リンク(`https://docs.tricentis.com/testim/content/...`)で、対応する日本語 md ファイルが `src/content/docs/` 配下に存在する場合、内部リンクに変更されているか
  - 例: `https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm` → `/docs/overview/testim-overview` (該当mdファイルが存在する場合)
  - 対応する日本語ファイルが存在しない場合は、元の外部リンクのまま維持

#### ファイル全体

- [ ] プロジェクト全体で`npm run lint`を実行した際にエラーが出ないか

### sourceUrl と画像の扱い

- `sourceUrl` は frontmatter の記録項目ではなく、本文 QA の比較元
- `public/images/...` に画像が存在しても、Markdown から参照されていなければ未完了
- 原文の画像が 3 枚なら、日本語ページでも原則 3 枚を本文に配置していること
- 装飾画像やロゴを除外した場合は、その理由をレビュー時に説明できること

### ルーティングとリンク規則

ルーティングはパスベースで、フォルダ構造が URL に反映される（例: `src/content/docs/administration/groups.md` → `/docs/administration/groups`）。

内部リンクの形式・変換ルールの詳細は `docs/WRITING_GUIDE.md` の「内部リンク規則」セクションを参照。

要点:
- 正しい形式: `/docs/{folder}/{slug}`（パスベース）
- `https://docs.tricentis.com/testim/content/.../{slug}.htm` は対応する JA ファイルが存在する場合 `/docs/{folder}/{slug}` に変換する
- 対応する JA ファイルが存在しない場合は元の外部リンクを維持する

### 出力形式

検証結果を以下の形式で報告してください:

#### 検証サマリー

- 検証対象ファイル数: X件
- 問題なし: Y件
- 問題あり: Z件
- keywords未設定: Z件
- リンク変更が必要: Z件

#### 問題なしのファイル

- ファイル名のリスト

#### 問題があるファイル

各ファイルについて:

- **ファイル名**: `xxx.md`
- **URL**: (対応する英語記事URL)
- **問題点**:
  - 具体的な問題の説明
  - 期待値と実際の値の比較(該当する場合)

#### keywords未設定または要改善のファイル

各ファイルについて:

- **ファイル名**: `xxx.md`
- **現状**: (現在のkeywords、未設定の場合は「未設定」)
- **提案**: 記事内容に基づいた推奨キーワード(最大10件)

#### リンク変更が必要なファイル

各ファイルについて:

- **ファイル名**: `xxx.md`
- **変更すべきリンク**:
  - 現在: `https://docs.tricentis.com/testim/content/{category}/example.htm`
  - 変更後: `/docs/{category}/example`

#### Lintエラー

(あれば記載、なければ「エラーなし」)

<!-- 使い方はコンテキストに本ファイルを指定し、以下を指定してプロンプトに入力して実行 -->
<!--
## Input
- SECTION_NAME: xxxx
- FOLDER_NAME: yyyy
-->
