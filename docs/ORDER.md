---

# default ピース実行用タスク指示書

## タスク名
Testim Docs JA の継続メンテ基盤再設計 + 初回全ページ整備（セクション分割実行）

## 目的
英語版ドキュメント更新に追従できる運用を実装する。
今回のみ全ページを `WRITING_GUIDE` 準拠で整備し、以後は差分ページのみ更新する運用に切り替える。

---

## ユーザー確定要件（厳守）
1. `WRITING_GUIDE` を Markdown 表現ルールの最優先にする。
2. `WRITING_GUIDE` 自体も改善対象にし、lint/自動チェック追加まで実装する。
3. seed URL の管理場所は `docs/SIDEBAR_URLS.md`（実体ファイル）で、更新対象にも含める。
4. URL 収集結果が 0 件なら fail-fast で即時停止する。
5. 初回は全ページ一括整備を行う。
6. 実行は複数 PR に分割し、セクション単位で進める。
7. 継続メンテナンス時は差分ページのみを対象にする。
8. Testim の機能名、製品名、画面名、固有ラベルは原則として英語のまま維持する。

---

## 参照資料（優先順）
1. `docs/WRITING_GUIDE.md`
2. `docs/TRANSLATION_GUIDE.md`
3. `docs/SIDEBAR_URLS.md`（実体確認必須）
4. `docs/DOCS_REVIEW.md`
5. `.github/copilot-instructions.md`
6. `scripts/README.md`
7. `src/lib/docs.ts`
8. `.github/workflows/check-docs-updates.yml`
9. `package.json`

---

## 実行フェーズ（PR分割）

| フェーズ | 内容 | 依存 |
|---------|------|------|
| **PR-0a** | URL収集フロー + SIDEBAR_URLS更新自動化 + ミラー・差分判定 | なし |
| **PR-0b** | WRITING_GUIDE改善 + lint/自動チェック実装 + CI整備 | PR-0a マージ後 |
| **PR-1..N** | セクション単位の初回全ページ整備（1PR=1セクション） | PR-0b マージ後 |
| **PR-final** | 継続運用の既定を diff モードに切替、full は明示実行時のみ | PR-1..N 完了後 |

---

## チェックポイント・再開方針

- 各 PR 完了時に `scripts/.checkpoint` ファイルを作成し、完了フェーズと完了日時を記録する。
- ファイル形式:

  ```json
  {
    "completed_phase": "PR-0a",
    "completed_at": "2026-03-13T10:00:00Z",
    "next_phase": "PR-0b"
  }
  ```

- **再開時**: `scripts/.checkpoint` を参照して未完了フェーズから再開する。
- **PR単位を基本**とするが、各フェーズが plan → write_tests → implement の途中で切れた場合はステップ単位で再開する。
  - ステップ完了ごとに `.checkpoint` の `step` フィールドも更新する（例: `"step": "write_tests_done"`）。

---

## 対象ファイル/モジュール別の作業（優先度付き）

### PR-0a スコープ

| 優先度 | 対象 | 作業内容 |
|--------|------|---------|
| 高 | `scripts/update_sidebar_urls_from_live.mjs` | URL収集フローを実装/修正（sitemap優先 → フォールバック）。収集0件で `process.exit(1)` 停止。`docs/SIDEBAR_URLS.md` への自動書き戻しを実装。 |
| 高 | `docs/SIDEBAR_URLS.md` | seed URL の最新化。セクション構造を明示し、PR分割単位（セクション名）を確定する。 |
| 高 | `scripts/fetch_translate_images.mjs` + 関連処理 | 英語本文・画像を URL と同じパス構造で保存。差分検知用メタデータ（hash/updated）を保持。 |
| 高 | 翻訳/整形パイプライン（既存 scripts 群 + 必要な新規モジュール） | `--mode=full`（初回全ページ）と `--mode=diff`（差分のみ）フラグを実装。モード判定ロジックを単一エントリポイントにまとめる。 |

### PR-0b スコープ

| 優先度 | 対象 | 作業内容 |
|--------|------|---------|
| 高 | `docs/WRITING_GUIDE.md` | 曖昧・重複・不足ルールを改善し、機械検証可能な規約に整理。内部リンク `/docs/{slug}` 形式・Callout 記法・英語維持すべき機能名の扱いを明文化する。 |
| 高 | `scripts/lint-docs.mjs`（新規） | WRITING_GUIDE準拠・frontmatter（`sourceUrl` 必須、`description` プレースホルダ禁止）・内部リンク `/docs/{slug}` 形式・Testim機能名の英語維持・Markdown構文・画像参照の自動検証を実装。 |
| 高 | `.github/workflows/check-docs-updates.yml` | lint/自動チェック/build/test を CI で実行。PR-0a の URL収集フローとも接続する。 |
| 高 | `package.json` | `npm run lint:docs` スクリプトを追加し、CI から呼び出し可能にする。 |

### PR-1..N スコープ（セクション単位）

| 優先度 | 対象 | 作業内容 |
|--------|------|---------|
| 中 | `src/content/docs/**/*`（実体パス準拠） | `docs/SIDEBAR_URLS.md` のセクション順に1PRずつ整備。各PRは対象セクションのファイルのみ変更する。WRITING_GUIDE準拠・frontmatter・内部リンク・Testim機能名英語維持を適用。 |

### PR-final スコープ

| 優先度 | 対象 | 作業内容 |
|--------|------|---------|
| 中 | 翻訳/整形パイプライン エントリポイント | デフォルト動作を `--mode=diff` に変更。`--mode=full` は明示指定時のみ実行されるようにする。 |
| 中 | `scripts/README.md` | 初回 full・継続 diff・失敗時の再開手順（`.checkpoint` 参照含む）を明記。 |
| 低 | `docs/OPS_DESIGN.md`（新規可） | 継続メンテ用の sub-agent/skill 分担（sync → translate → format → qa → release）を文書化。 |

---

## エージェント別指示

### plan
1. 参照資料を全て実読し、現行実装との差分を確定する。
2. **PR-0a → PR-0b → PR-1..N → PR-final** の変更範囲をそれぞれ分離して計画する。
3. セクション一覧は `docs/SIDEBAR_URLS.md` から直接抽出して確定する（推測不可）。
4. Coder向けに、変更ファイル・配線箇所・影響範囲・注意点をファイル単位で明示する。
5. `scripts/.checkpoint` の初期作成と更新ロジックの配線箇所を計画に含める。

### write_tests
1. プロダクションコード変更前にテストを作成する。
2. 最低限のテスト対象:
   - URL収集フォールバック（sitemap → フォールバック）
   - URL 0件 fail-fast（`process.exit(1)` / 非ゼロ終了）
   - SIDEBAR_URLS 更新整合（収集結果がファイルに反映されること）
   - `--mode=full` / `--mode=diff` の分岐
   - WRITING_GUIDE 規約違反検出（lint スクリプト）
   - `sourceUrl` 必須チェック
   - `description` プレースホルダ禁止チェック
   - 内部リンク `/docs/{slug}` 形式チェック
   - Testim の機能名・製品名・画面名が不適切に日本語化されていないこと
   - `.checkpoint` ファイルの作成・読み込み・ステップ更新
3. セクション PR では対象セクションに閉じた検証を用意する。

### implement
1. plan と write_tests に従って実装する。
2. 実装順序: PR-0a → PR-0b → PR-1..N（セクション順）→ PR-final。
3. 各 PR の完了時に `scripts/.checkpoint` を更新する。途中でステップが完了した場合も `step` フィールドを更新する。
4. 各 PR で `npm run build && npm run test && npm run lint:docs` を実行し、結果を報告する。
5. PR-final で diff 運用を既定化し、`scripts/README.md` に運用手順を文書化する。

---

## 再現手順・確認方法

1. URL収集処理を実行し、`docs/SIDEBAR_URLS.md` の更新と URL 件数を確認する。
2. URL 0件ケースをテストで再現し、非ゼロ終了で停止することを確認する。
3. `--mode=full` 実行で初回整備キュー（全ページ）が生成されることを確認する。
4. `--mode=diff` 実行で変更ページのみが対象になることを確認する。
5. セクション PR で対象外セクションの本文変更がないことを `git diff` で確認する。
6. 翻訳結果で Testim の機能名が英語のまま維持されていることを確認する。
7. 内部リンクが `/docs/{slug}` 形式で統一されていることを確認する。
8. CI で lint/自動チェック/build/test が全通過することを確認する。
9. 実行途中で中断した場合、`scripts/.checkpoint` を参照して未完了フェーズ/ステップから再開できることを確認する。

---

## 受け入れ条件

1. URL 0件時に処理が停止する。
2. `docs/SIDEBAR_URLS.md` が seed 兼更新対象として機能する。
3. 初回全ページ整備をセクション分割で完了できる。
4. 継続メンテナンスが差分ページのみで運用できる。
5. WRITING_GUIDE 準拠チェックが自動化され CI で実行される。
6. Testim の機能名、製品名、画面名、固有ラベルが英語のまま維持される。
7. ビルド・テスト・lint が成功する。
8. `scripts/.checkpoint` によって、PR単位またはステップ単位で途中から再開できる。
