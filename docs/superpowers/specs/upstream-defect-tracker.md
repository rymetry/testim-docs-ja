# Upstream Defect Tracker

- **Status**: Active (v1, 2026-04-17)
- **Owner**: Testim JA Docs parity subsystem
- **Related**: `scripts/lib/en_source_patches.mjs`, `docs/superpowers/plans/2026-04-17-en-source-patches-layer.md`

## Purpose

MadCap Flare で生成された EN HTML snapshot に含まれる **broken upstream defect** を集中管理する。各 defect は:

1. `en_source_patches` registry (`scripts/lib/en_source_patches.mjs`) の `id` と 1:1 で対応する anchor を持つ
2. Tricentis への上流報告 status を記録する
3. Upstream 修正確認時の patch removal 条件 (SOP) を持つ

JA 翻訳は原文構造準拠を崩さないため、JA markdown 側で workaround を埋め込むことは禁止 (plan §1.1 / absolute principle 4)。broken-EN は必ず EN HTML boundary (`preprocessEnHtml`) で slug-scope literal patch として処理する。

## Defect classes

`en_source_patches` の `defectClass` enum (4 種) に対応:

| Class | 意味 | 例 |
|---|---|---|
| `typo` | 単純な文字列タイポ / スペース欠落 | `-this` vs `- this` |
| `href-miswire` | リンクターゲットが別ページを指す | Log out → launchapp |
| `madcap-artifact` | MadCap authoring tool 由来の構造残骸 | escaped `&lt;details&gt;` fragment |
| `stale-reference` | 古いバージョンへの参照が残存 | 旧 UI label / 旧 URL slug |

## Registry (active defects)

### UD-001: `-this` typo in Salesforce Verify list item

- **Patch IDs**: `UD-001A-dash-this-typo-plain`, `UD-001B-dash-this-typo-strong`
- **Defect class**: `typo`
- **Added**: 2026-04-17
- **Review after**: 2026-10-17
- **Affected slugs** (5):
  - `salesforce-testing/salesforce-steps/sfdc-step-create` (variant A, plain-leading)
  - `salesforce-testing/salesforce-steps/sfdc-step-validate` (variant A)
  - `salesforce-testing/salesforce-steps/sfdc-step-edit` (variant B, strong-leading)
  - `salesforce-testing/salesforce-steps/sfdc-step-quickactions` (variant B)
  - `salesforce-testing/salesforce-steps/sfdc-step-relatedlistaction` (variant B)
- **Defect**: MadCap authoring typo in Verify list item intro:
  - Variant A (plain): `<p>Verify -this action verifies ...`
  - Variant B (strong): `<p><strong>Verify</strong> -this action verifies ...`
  - 本来は `Verify - this action verifies ...` と半角スペースが入るべき箇所
- **Fix applied**: preprocessEnHtml 内で `-this action verifies` → `- this action verifies` に置換
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**: Tricentis が該当 HTML を修正して MadCap rebuild、`docs.tricentis.com/testim` に反映されたら:
  1. `snapshots/en/content/salesforce-testing/salesforce-steps/sfdc-step-{create,edit,quickactions,relatedlistaction,validate}.html` を再取得
  2. `grep '-this action verifies'` が 0 hit になったことを確認
  3. `scripts/lib/en_source_patches.mjs` から UD-001A / UD-001B entry を削除
  4. `node scripts/generate_parity_baseline.mjs --regenerate --rationale="UD-001 upstream fix confirmed"` で baseline を再生成 (新規追加 0、既存 entry への影響無しを期待)

### UD-002: Salesforce Steps "Log out" href miswire

- **Patch ID**: `UD-002-logout-href-miswire`
- **Defect class**: `href-miswire`
- **Added**: 2026-04-17
- **Review after**: 2026-10-17
- **Affected slugs** (1):
  - `salesforce-testing/salesforce-steps`
- **Defect**: parent index page の共通操作リスト "Log out" エントリのリンクターゲットが誤って `sfdc-step-launchapp.htm` を指している。本来は `sfdc-step-logout.htm` (別の子ページが正しく存在する)。
- **Fix applied**: preprocessEnHtml 内で `<a href="sfdc-step-launchapp.htm">Log out</a>` → `<a href="sfdc-step-logout.htm">Log out</a>` に置換
- **JA side**: JA markdown は既に `sfdc-step-logout` への正しいリンクを保持 (UX 上正しい)。patch により EN/JA 両側で同じ `/docs/salesforce-testing/salesforce-steps/sfdc-step-logout` token が emit され、parity alignment 成立。
- **Tricentis upstream report status**: _pending_ (担当: JA Docs subsystem, 報告 ticket TBD)
- **Removal SOP**:
  1. `snapshots/en/content/salesforce-testing/salesforce-steps.html` を再取得
  2. `grep '<a href="sfdc-step-launchapp.htm">Log out</a>'` が 0 hit になったことを確認
  3. `scripts/lib/en_source_patches.mjs` から UD-002 entry を削除
  4. baseline 再生成

## Adding a new defect

新しい broken-EN defect を見つけた際のチェックリスト:

1. **Classification**: 4 enum (`typo` / `href-miswire` / `madcap-artifact` / `stale-reference`) のどれに当てはまるか判断。該当なしの場合は新規 class 追加を plan 改定として提案する (独自に追加しない)
2. **Reproducibility**: EN HTML snapshot を grep して literal match で `find` 文字列を確定する。preprocessEnHtml の他 normalize (`normalizeEscapedCallouts` / `normalizeEscapedFaqDetails` / `unescapeDetails`) を通った後の HTML 形で書く
3. **Idempotency check**: `replace` が `find` を部分文字列として含まない (test で自動検証)
4. **Slug scope**: 影響する slug を列挙し、`slugs: Object.freeze([...])` に登録
5. **Linked defect anchor**: 本ファイルに `## UD-NNN: <summary>` セクションを追加し、`linkedDefect: 'docs/superpowers/specs/upstream-defect-tracker.md#UD-NNN'` で refer
6. **Tests**: `scripts/__tests__/en_source_patches.test.mjs` に application test と mismatch test を追加
7. **Baseline regen**: `node scripts/generate_parity_baseline.mjs --regenerate --rationale="add UD-NNN patch"`、新規追加 0 を確認
8. **Upstream report**: Tricentis への報告 ticket 起票、本ファイルの "Tricentis upstream report status" を更新

## Review cadence

- 各 entry は `reviewAfter` 日付を持つ (通常 addedAt + 6 ヶ月)
- `reviewAfter` 超過した場合:
  1. Tricentis への報告 status 再確認
  2. Upstream fix 未完了なら reviewAfter を 3-6 ヶ月延長し本ファイルに rationale 追記
  3. Upstream fix 完了なら Removal SOP を実行
- CI warning 化は follow-up (`parity-check-status.json.debug.patchCoverage` に `reviewAfter` を乗せて gate へ引き込む案あり)

## Related docs

- `docs/superpowers/plans/2026-04-17-en-source-patches-layer.md` — 設計計画 (v4 Codex APPROVED)
- `docs/PARITY_GUIDE.md` — parity 一般ガイド、本 tracker への参照を追加
- `scripts/README.md` — scripts/ commands と entry_points
