# Integrations セクション Source Parity + 定期運用プラン

## Context

Issue #18（Integrations セクション進捗管理）に基づき、Integrations 残りサブセクションの source parity を完了させる。
Grid Management（PR #17）と bug-tracker-settings（PR #11, #12）は完了済み。
残り5サブセクション（ci-integrations, test-management-integrations, other-integrations, applitools-integration, integrations-overview）に品質問題が残存。

**ユーザー確定事項:**
- Grid Management は完了済み → 残りサブセクションに集中
- PR はサブセクション単位で分割（5PR）
- レビューは `.claude/skills/codex-review/SKILL.md` の Codex CLI を使用

---

## Part 1: メイン作業（サブセクション単位で5PR）

### Step 0: ブランチ作成ルール

各サブセクションごとに `main` から新ブランチを作成:
- `claude/integrations-test-management`
- `claude/integrations-other`
- `claude/integrations-applitools`
- `claude/integrations-ci`
- `claude/integrations-overview`

各 PR は独立して作業。前の PR のマージを待たず並行作業可能（ファイルが重複しないため）。

---

### PR-A: test-management-integrations（最優先）

**ブランチ**: `claude/integrations-test-management` (Issue #22)

| ファイル | 問題 | 作業 |
|---------|------|------|
| `qtest-integration.md` | 🔴 内容捏造、画像9枚未埋込 | WebFetch で原文取得 → 全文書き直し + 画像9枚埋込 |
| `testrail-integration.md` | 🔴 内容捏造、画像6枚未埋込 | WebFetch で原文取得 → 全文書き直し + 画像6枚埋込 |
| `test-management-integrations.md` | 🟡 旧callout、相対リンク | callout → `:::` 変換、`(qtest-integration)` → `/docs/qtest-integration` |
| `ttm-for-jira-integration.md` | 🟡 旧callout 5箇所 | callout → `:::` 変換、原文突合 |
| `xray-integration.md` | 🟡 旧callout 4箇所、末尾結合callout | callout → `:::` 変換、末尾修正、原文突合 |

**画像ディレクトリ:**
- `public/images/test-management-integrations/qtest-integration/` (9枚)
- `public/images/test-management-integrations/testrail-integration/` (6枚)
- `public/images/test-management-integrations/ttm-for-jira-integration/` (確認要)
- `public/images/test-management-integrations/xray-integration/` (確認要)

**エージェント構成:**
1. **Agent A1**: qtest-integration 全文翻訳（worktree isolation）
   - WebFetch で原文取得 → 構造把握 → 画像マッピング → 全文翻訳
2. **Agent A2**: testrail-integration 全文翻訳（worktree isolation、A1と並列）
   - 同上
3. **Agent A3**: 残り3ファイル品質修正（A1/A2完了後、または並列）
   - callout変換、リンク修正、原文突合

**検証 → Codex レビュー → 修正 → lint/test/build → コミット → PR**

---

### PR-B: other-integrations（Issue #21）

**ブランチ**: `claude/integrations-other`

| ファイル | 問題 | 作業 |
|---------|------|------|
| `sealights-integration.md` | 🟡 旧callout、`:fa-arrow-right:`、`(doc:...)` リンク | callout変換、マーカー削除、リンク修正 |
| `github-integration.md` | 🟢 検証 | 原文突合・画像確認 |

**エージェント構成:**
1. **Agent B1**: sealights 修正 + github 検証（1エージェントで対応可能）
   - sealights: `> 📘` → `:::info`、`:fa-arrow-right:` → 削除/太字、`(doc:sealights-integration-copy#labid-option)` → `/docs/sealights-integration` + アンカー
   - github: 原文突合

---

### PR-C: applitools-integration（Issue #20）

**ブランチ**: `claude/integrations-applitools`

| ファイル | 問題 | 作業 |
|---------|------|------|
| `applitools-integration.md` | 🟢 旧callout 2箇所 | callout変換、原文突合 |
| `override-applitools-test-name.md` | 🟢 検証 | 原文突合・完全性確認 |
| `override-applitools-app-name.md` | 🟢 検証 | 原文突合・完全性確認 |

**エージェント構成:**
1. **Agent C1**: 3ファイルを1エージェントで対応

---

### PR-D: ci-integrations（Issue #23）

**ブランチ**: `caude/integrations-ci`

| ファイル | 問題 | 作業 |
|---------|------|------|
| `autorabit-integration.md` | 🟢 旧callout | callout変換 |
| `gitlab-integration.md` | 🟢 旧callout | callout変換 |
| `copado-integration.md` | 🟢 `:fa-arrow-right:` | マーカー削除/置換 |
| `gearset-integration.md` | 🟢 `:fa-arrow-right:` | マーカー削除/置換 |
| `dedicated-run-tunnel.md` | 🟢 callout英日混在 | テキスト整理 |

**注意**: PR #16 で CI integrations は既に一度整備済み。上記5ファイルのみ残存品質問題。残り10ファイルは変更不要。

**エージェント構成:**
1. **Agent D1**: 5ファイルを1エージェントで対応（軽微な修正のみ）

---

### PR-E: integrations-overview（Issue #19）

**ブランチ**: `claude/integrations-overview`

| ファイル | 問題 | 作業 |
|---------|------|------|
| `integrations-overview.md` | 🟢 検証 | 全リンク先存在確認、原文突合 |

**エージェント構成:**
1. **Agent E1**: 1ファイル検証（リンク先42ページの存在確認含む）

---

### 各PRの共通フロー

```
1. main から新ブランチ作成
2. WebFetch で sourceUrl 原文取得・突合
3. 修正/書き直し実行
4. セルフチェック（Agent: source parity レビュー）
5. Codex CLI レビュー:
   codex -s read-only exec -C . \
     "Review the Japanese documentation files changed in this branch against their English sourceUrl originals. Check: (1) all paragraphs/steps/callouts/images preserved, (2) images embedded at correct positions, (3) internal links use /docs/{slug} format, (4) Testim product names kept in English, (5) callouts use ::: directive syntax. No confirmation or questions needed. Provide concrete issues proactively."
6. Codex フィードバック修正
7. npm run lint:docs && npm run lint && npm run test && npm run build
8. コミット（docs: ...） → push → PR作成
9. Issue #18 の該当チェックボックス更新
```

### 実行順序（推奨）

PR-A（test-management）を最優先で着手（最も重い全文書き直し2件含む）。
PR-B〜E は並列実行可能（ファイル重複なし）。

```
PR-A: test-management ━━━━━━━━━━━━━━━━━━━━━> PR作成
PR-B: other           ━━━━━━━━━> PR作成         （PR-Aと並列可）
PR-C: applitools      ━━━━━━━> PR作成           （PR-Aと並列可）
PR-D: ci              ━━━━━━━> PR作成           （PR-Aと並列可）
PR-E: overview        ━━━> PR作成               （PR-Aと並列可）
```

---

## Part 2: 定期運用（3日ごと）

### CronCreate 設定

```
スケジュール: 毎3日 9:00 JST
```

**処理内容:**
1. `npm run docs:sync-sidebar` で SIDEBAR_URLS を最新化
2. 最新の SIDEBAR_URLS のページ数と既存 docs ファイル数を比較
3. 新規ページ追加を検出 → **重複チェック後** GitHub Issue 作成
4. `npm run check:updates` で更新のあったドキュメントを検出
5. 更新があった場合 → **重複チェック後** まとめて1つの GitHub Issue 作成
6. 結果を報告

### 重複 Issue 防止ロジック

Issue 作成前に必ず既存 Issue を検索し、重複を防止する:

```bash
# 新規ドキュメント検出の重複チェック
existing=$(gh issue list --state open --search "新規ドキュメント検出" --json number --jq '.[0].number')
if [ -n "$existing" ]; then
  # 既存 Issue にコメント追加（新規作成しない）
  gh issue comment "$existing" --body "..."
else
  gh issue create --title "新規ドキュメント検出 (YYYY-MM-DD)" --body "..."
fi

# 英語原文更新検出の重複チェック
existing=$(gh issue list --state open --label "documentation,update-needed" --json number --jq '.[0].number')
if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "..."
else
  gh issue create --title "英語原文更新検出 (YYYY-MM-DD)" --label "documentation,update-needed" --body "..."
fi
```

**GitHub Actions workflow（check-docs-updates.yml）には既に同等のロジックが組込済み:**
- `documentation,update-needed` ラベルのオープン Issue を検索
- 既存あり → コメント追加 / 既存なし → 新規作成

**CronCreate でも同じパターンを適用し、二重体制で重複を防止する。**

### GitHub Actions スケジュール有効化

`.github/workflows/check-docs-updates.yml` の cron 行を有効化:
```yaml
schedule:
  - cron: '0 0 */3 * *'  # 3日ごと UTC 0:00
```

CronCreate はセッション期限（3日）で失効するため、GitHub Actions が恒久的なバックアップとして機能する。

### 検出された Issue の処理フロー

1. Issue が作成される（または既存 Issue にコメント追加）
2. 次回の Claude Code セッションで Issue を確認
3. メイン作業と同じフロー（ブランチ作成 → 原文突合 → 翻訳/修正 → Codex レビュー → lint/test/build → PR）で対応
4. 対応完了後に Issue をクローズ

---

## 対象ファイル一覧（全パス）

### 全文書き直し
- `src/content/docs/test-management-integrations/qtest-integration.md`
- `src/content/docs/test-management-integrations/testrail-integration.md`

### 品質修正
- `src/content/docs/test-management-integrations/test-management-integrations.md`
- `src/content/docs/test-management-integrations/ttm-for-jira-integration.md`
- `src/content/docs/test-management-integrations/xray-integration.md`
- `src/content/docs/other-integrations/sealights-integration.md`
- `src/content/docs/applitools-integration/applitools-integration.md`
- `src/content/docs/ci-integrations/autorabit-integration.md`
- `src/content/docs/ci-integrations/gitlab-integration.md`
- `src/content/docs/ci-integrations/copado-integration.md`
- `src/content/docs/ci-integrations/gearset-integration.md`
- `src/content/docs/ci-integrations/dedicated-run-tunnel.md`

### 検証のみ
- `src/content/docs/applitools-integration/override-applitools-test-name.md`
- `src/content/docs/applitools-integration/override-applitools-app-name.md`
- `src/content/docs/other-integrations/github-integration.md`
- `src/content/docs/integrations/integrations-overview.md`

### CI設定
- `.github/workflows/check-docs-updates.yml`

---

## 検証手順（各PR共通）

1. `npm run lint:docs` — カスタム doc lint 全パス
2. `npm run lint` — markdownlint 全パス
3. `npm run test` — テストスイート全パス
4. `npm run build` — Astro ビルド成功
5. sourceUrl 原文と突合: 見出し・段落・callout・画像数が一致
6. 内部リンクが `/docs/{slug}` 形式で統一
7. Testim 製品名が英語のまま維持
8. `:::` callout 構文のみ使用（旧 blockquote なし）
9. `:fa-arrow-right:` マーカーが残存していない
10. `(doc:...)` リンク形式が残存していない
