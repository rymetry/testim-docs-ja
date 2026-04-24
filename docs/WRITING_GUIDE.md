# 執筆ガイド: Testim Docs JA

> このガイドは、Testim ドキュメント日本語版の**執筆者・編集者向け**です。
> 翻訳作業については [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md) をご参照ください。

このプロジェクトでは、公開ドキュメントを **Markdown (`.md`)** で管理し、`npm run lint:docs` と CI で機械検証します。

## 📚 目次

- [最優先ルール](#最優先ルール)
- [frontmatter 必須ルール](#frontmatter-必須ルール)
- [内部リンク規則](#内部リンク規則)
- [Callout 規則](#callout-規則)
- [Testim 機能名・製品名・画面名の英語維持](#testim-機能名・製品名・画面名の英語維持)
- [表記統一ルール](#表記統一ルール)
- [Markdown vs MDX の選び方](#markdown-vs-mdx-の選び方)
- [Markdown で使える機能](#markdown-md-で使える機能)
- [MDX でのみ使える機能](#mdx-mdx-でのみ使える機能)
- [執筆フロー](#執筆フロー)
- [実装済みの拡張機能](#実装済みの拡張機能)
- [ベストプラクティス](#ベストプラクティス)
- [よくある質問](#よくある質問)
- [関連リソース](#関連リソース)

---

## 🎯 最優先ルール（2026-04-16 改訂: source-first を最上位に elevate）

**本プロジェクトの最上位契約**: JA ドキュメントは **EN 原文の構造をそのまま写した日本語版** として整備する。JA 独自の構造は作成しない。

1. **Source-First 絶対遵守 — JA独自の構造は作成しない**: `sourceUrl` の原文にある見出し・段落・番号手順・箇条書き・callout・画像は欠落なく、**構造そのまま** 日本語化する。JA 独自の section / 段落 / callout / リスト項目 / 見出しは **絶対に追加しない**（詳細は [§🪞 原文準拠ルール](#-原文準拠ルールsource-first-構造契約)）。callout `:::note` / `:::warning` 等は EN `<div class="note">` / `<div class="warning">` 等に 1:1 mirror し、JA 側での種別変更・callout 分割・段落分割は禁止
2. **Callout は EN 原文準拠**: EN の callout タイプ (`note` / `warning` / `caution` / `danger` / `tip` / `info`) にそのまま追従する。JA 独自 callout 種別の発明禁止（[Callout 規則](#-callout-規則)の変換マップ参照）
3. **Testim UI 用語は英語維持**: 機能名、製品名、画面名、UI ラベル、CLI flag、設定キーは原則として英語のまま維持する（正本: [GLOSSARY.md](./GLOSSARY.md) の 3-tier 分類 / 詳細は [§Testim 機能名・製品名・画面名の英語維持](#️-testim-機能名製品名画面名の英語維持)）
4. **検知基盤との整合**: 上記 1–3 に違反すると `npm run check:parity` が gate で報告する。baseline 対象にする前に、まず **JA 側を EN 構造に追従させる** ことを優先する
5. `npm run lint:docs` で検出される違反は必ず修正してからマージする
6. 公開ページは原則 `.md` で管理し、特別な UI が必要な場合だけ `.mdx` を使う
7. `docs/SIDEBAR_URLS.md` を seed URL とセクション分割の正本として扱う

> **最終ゴール**: `parity-baseline.json` の entries = 0 / `npm run check:parity` の全 counter = 0 / `snapshot-diff-status.json.summary.{changed, added, removed} = 0`。schema v2 (2026-04-20 cutover) 以降、baseline は期限概念なしの **明示的 paydown が必須な一時的凍結** として運用する (`priority` enum + 明示 PR による解消のみ、`reviewAfter` 期限超過による自動 refire は廃止)。
> このゴールを達成するため、本ガイドは baseline を増やす方向の変更（JA 独自構造追加 / callout 改変 / Testim 用語翻訳）を全面禁止する。
> EN 原文が壊れている場合の退避は `testim_parity.sync_exclusions` (page-level、旧 `scripts/lib/source_sync_exclusions.mjs`) と `testim_parity.en_source_patches` + `scripts/py/_en_source_patches_data.json` (segment-level、旧 `scripts/lib/en_source_patches.mjs`) の **2 機構のみ** に限定する (`docs/PARITY_GUIDE.md §許容機構` 参照)。第 3 の許容機構を追加する提案は reviewer gate で reject される。
>
> **Source-first 例外の canonical registry**:
>
> - **Mechanical exceptions (parser-level)**: kind-multiset fingerprint 上で検知器が許容する既知 pattern (flat-list split / arrow-fusion 段落融合 等) は [PARITY_GUIDE.md §Source-first 例外の canonical registry](./PARITY_GUIDE.md#source-first-例外の-canonical-registry) に登録。個別 PR の自由裁量で追加禁止 (reviewer 承認 + registry 明示登録の security L2 gate)
> - **Mechanism-pending carve-outs**: content 修正で 0 到達不能な mechanism-level 残存 (FileOrFilePath paragraph vs code-fence kind-mismatch / EN self-link artifact 等) は同 registry に登録。未登録の mechanism-pending を agent が自主宣言するのは禁止。新 pattern は `[PENDING REVIEWER APPROVAL]` マーカー経由で提案する ([PARITY_GUIDE.md §並列エージェント委任チェックリスト](./PARITY_GUIDE.md#並列エージェント委任チェックリスト) 参照)
> - **Wave 2 実績 pattern**: P2-2 で確立した 8 pattern の catalog は [PARITY_GUIDE.md §Wave 2 実績 pattern catalog](./PARITY_GUIDE.md#wave-2-実績-pattern-catalog) に一覧化、翻訳観点は [TRANSLATION_GUIDE.md §5.5 Source-first 翻訳パターン](./TRANSLATION_GUIDE.md#55-source-first-翻訳パターンwave-2-確立) 参照

---

## 📋 frontmatter 必須ルール

すべての記事ファイルには以下の frontmatter が必須です。`src/content.config.ts` と `testim_parity.tools.lint_docs` (Python、旧 `scripts/tools/lint_docs.mjs`) の両方で検証されます。

```yaml
---
title: 'ページタイトル（日本語）'
description: 'ページの説明（100文字以内、プレースホルダ禁止）'
category: '概要'
order: 1001
updated: '2026-01-15'
sourceUrl: 'https://docs.tricentis.com/testim/content/{category}/{slug}.htm'
keywords:
  - キーワード1
  - キーワード2
---
```

| フィールド    | 必須 | デフォルト | 規則                                                                           |
| ------------- | ---- | ---------- | ------------------------------------------------------------------------------ |
| `title`       | ✅   | —          | 日本語タイトル                                                                 |
| `description` | ✅   | —          | 具体的な説明文。「説明文」「TODO」「原文: ...」などのプレースホルダ禁止        |
| `category`    | ✅   | —          | `docs/SIDEBAR_URLS.md` のセクション日本語ラベルに一致させる                    |
| `updated`     | ✅   | —          | 更新日（`YYYY-MM-DD` 形式）                                                    |
| `sourceUrl`   | ✅   | —          | 英語原文 URL（`https://docs.tricentis.com/testim/content/.../{slug}.htm`）必須 |
| `order`       | —    | `0`        | サイドバー内の表示順序（`docs/SIDEBAR_URLS.md` 基準）                          |
| `keywords`    | —    | `[]`       | 検索用キーワード（日本語、最大10件目安）                                       |
| `hideToc`     | —    | `false`    | `true` で TOC を非表示。時系列リストなど TOC が不適切なページ用                |
| `hero`        | —    | —          | ヒーローセクション（トップページ用、通常の記事では不要）                       |

追加ルール:

- `sourceUrl` は `https://docs.tricentis.com/testim/content/.../{slug}.htm` 形式のみ許可
- `updated` は英語原文に追従させる（JA ファイルの編集日に変更しないこと）
- `description` は本文から読める内容を 1-2 文で要約する
- frontmatter の欠落は build 前に修正する
- `sourceUrl` は追跡用メタデータではなく、本文整備の正本として扱う
- スキーマ定義: `src/content.config.ts`（Zod バリデーション）

---

## 🔗 内部リンク規則

内部リンクはパスベース `/docs/{folder}/{slug}` 形式のみを使用してください。ベースネーム形式 `/docs/{slug}` は lint エラーになります。

```markdown
✅ 正しい（パスベース）
[Testim 概要](/docs/overview/testim-overview)

❌ 禁止（ベースネーム — lint エラー。リダイレクトは外部ユーザー向けのみ）
[Testim 概要](/docs/testim-overview)

❌ 禁止（`doc:` 形式はソース原稿のみ。公開ページには使わない）
[Testim 概要](doc:testim-overview)
```

補足:

- アンカー付きリンクは `/docs/{folder}/{slug}#section-name` 形式を使用する
- 本文中の `https://docs.tricentis.com/testim/content/.../{slug}.htm` は、対応する JA ファイルが存在する場合 `/docs/{folder}/{slug}` に変換する（HTML `<a href>` 含む）
- スラグが実在するファイルを指しているか必ず検証する。英語原文側でスラグがリネームされている場合があるため、ファイル名との突き合わせが必要

---

## 📣 Callout 規則

情報パネルは `:::` 以上のコロンで始める callout を使用してください。

```markdown
:::tip
基本の tip
:::

::::info{title="参考情報"}
カスタムタイトル付きの info
::::
```

許可されるタイプは次の 6 種類だけです。

- `tip`
- `warning`
- `caution`
- `danger`
- `note`
- `info`

追加ルール:

- `:::unknown` のような未定義タイプは禁止
- `{title="..."}` によるカスタムタイトルは使用可
- 画像パスは `/images/...` を使い、実ファイルが `public/images/...` に存在しなければならない
- 画像（`![alt](path)`）の前後には必ず空行を入れる（空行がないと前後の要素と結合してレイアウトが崩れる）
- 原文に callout がある場合は、意味と種類を保ったまま `:::` 記法へ変換する

### 原文 blockquote → JA callout 変換マッピング

EN 原文の callout (blockquote または `<div class="...">`) を JA の `:::` callout に変換する際は、以下のマッピングに従ってください：

| EN 原文パターン | JA callout タイプ | 備考 |
| --- | --- | --- |
| `📘` / `<div class="note">` | `:::note` | 情報提供 |
| `🚧` / `<div class="warning">` | `:::warning` | 注意喚起 |
| `<div class="caution">` + 警告 | `:::caution` | MadCap Flare の caution。当面は `:::warning` と同じ見た目（CSS alias、Phase 0） |
| `💡` / `<div class="tip">` | `:::tip` | 便利情報 |
| `❗` / `⚠️` / `<div class="danger">` | `:::danger` | 重大な警告 |
| `ℹ️` / `<div class="info">` | `:::info` | 補足 |

注意: JA タイトルが「注意」の場合は、EN 原文の絵文字に関わらず `:::warning{title="注意"}` を使用する。「注意」という日本語表現は警告の意味合いが強いため、`:::warning` が適切。

> **Scope 制限 (Security loophole P3 対応)**: 上記 "「注意」→ `:::warning`" override は **JA タイトル文字列が "注意" と一致する callout にのみ適用** する。EN callout タイプを JA で別タイプに変更する一般許可ではない。EN が `note` / `tip` / `caution` / `danger` / `info` の場合は、JA タイトルが "注意" 以外なら EN のタイプをそのまま維持する（TRANSLATION_GUIDE.md §⚖️ 翻訳の構造契約 MUST NOT §4 と整合）。

### レガシー callout 変換時の注意事項

原文の blockquote callout を `:::` に変換する際は、以下にも注意する:

- **タイトルと本文を区別する**: 短い見出し的テキスト（目安40文字以下）はタイトル、長い文章は本文にする
  - NG: `:::note{title="長い説明文がここに入る..."}\n:::`
  - OK: `:::note\n長い説明文がここに入る...\n:::`
- **連続する異なる絵文字は別々の callout に分割する**
  - `> 📘 text\n> 🚧 text` → `:::note\ntext\n:::\n\n:::warning\ntext\n:::`

---

## 🪞 原文準拠ルール（Source-First 構造契約）

> **このセクションは最上位規約です**。最優先ルール §1 の実装詳細であり、他のすべてのルール（表記統一 / ベストプラクティス / ファイル形式選択）に対して **優先** します。

`sourceUrl` を持つページは、原文の要約ではなく原文の**構造を鏡写しにした**日本語版として整備してください。

### 絶対遵守 (MUST)

- 原文の本文段落、番号手順、箇条書き、callout は省略しない
- 原文にコンテンツ画像がある場合、ローカルに保存するだけでなく本文中の対応位置へ埋め込む
- 画像数だけでなく、画像の配置順も原文に合わせる
- 原文にしかない重要な UI ラベル、確認メッセージ、遷移先画面は本文に明記する
- **原文にない段落・callout・リスト項目・見出し・補足説明は一切追加しない**（JA 独自構造の禁止）
- 段落境界・リスト境界・見出し境界は原文に完全に一致させる（1 段落→2 段落分割、1 callout→2 callout 分割等は禁止）
- **`<!-- parity: ... -->` のような parity 対策用 HTML コメントを JA markdown に埋め込むことは禁止**。broken upstream EN defect は `testim_parity.en_source_patches` + `scripts/py/_en_source_patches_data.json` の slug-scope patch layer (literal find→replace at `preprocess_en_html` 境界) で処理する。運用は [`docs/PARITY_GUIDE.md` の EN source patches layer セクション](./PARITY_GUIDE.md#en-source-patches-layer) と [`docs/UPSTREAM_DEFECTS.md`](./UPSTREAM_DEFECTS.md) を参照

### 唯一の許容差分（HEREだけ）

1. Testim 用語の英語維持（[GLOSSARY.md](./GLOSSARY.md) の entry に従う、3-tier 分類参照）
2. URL のローカライズ書き換え（`help.testim.io/docs/X` ↔ `/docs/X`、`docs.tricentis.com/testim/content/...` → canonical、[PARITY_GUIDE.md](./PARITY_GUIDE.md) 参照）

上記 2 つに該当しない英語 prose が JA に残っていれば **検知系 (`check:parity`) がバグとして報告する**。その場合は翻訳する。

### Good / Bad 具体例

#### 1. JA 独自段落の追加は NG

```text
EN 原文:
Click Run to execute the test.

❌ NG (JA 独自補足):
Run をクリックしてテストを実行します。

補足: Run ボタンは画面右上にあります。   ← EN 原文にない独自段落

✅ OK:
Run をクリックしてテストを実行します。
```

#### 2. EN の 1 callout を JA で 2 callout に分割するのは NG

```text
EN 原文:
> 📘 Note: Only works on Chrome. Firefox support is planned for Q3.

❌ NG (JA で分割):
:::note
Chrome でのみ動作します。
:::

:::info
Firefox サポートは Q3 予定です。
:::

✅ OK:
:::note
Chrome でのみ動作します。Firefox サポートは Q3 予定です。
:::
```

#### 3. EN の段落を JA で箇条書きに変換するのは NG

```text
EN 原文:
The Test Editor supports recording, editing, and debugging tests.

❌ NG (JA で箇条書き展開):
Test Editor は以下をサポートします:
- テストの記録
- テストの編集
- テストのデバッグ

✅ OK:
Test Editor はテストの記録・編集・デバッグをサポートします。
```

#### 4. EN の callout タイプを JA で改変するのは NG

```text
EN 原文:
> ⚠️ Warning: This action deletes data permanently.

❌ NG (JA で note に格下げ):
:::note
この操作はデータを永久に削除します。
:::

✅ OK:
:::warning
この操作はデータを永久に削除します。
:::
```

#### 5. EN にない JA 読者向け補足追加は NG

```text
EN 原文:
Click Save.

❌ NG (JA 読者向け親切補足):
Save をクリックします。

:::tip{title="日本語ユーザー向け"}
キーボードショートカットは Ctrl+S です（日本語版 IME でも動作）。
:::

✅ OK:
Save をクリックします。
```

### この契約を守ることで得られること

- `parity-baseline.json` の新規 entry 発生率が 0 になる
- `npm run check:parity` が 100% clean になる
- translation pipeline の LLM 入力が簡潔になり、翻訳品質が安定する
- 英語原文 update 時の自動追従が成立する（構造に差分がないため翻訳部分だけの LLM 再生成で済む）

### 見出しマッピング

```text
EN snapshot           →  JA 翻訳
──────────────────────────────────
# Title (1st H1)      →  frontmatter title:（body に H1 は出さない）
# Section (2nd+ H1)   →  ## Section（H2 に降格）
## / ### / ####        →  そのまま維持（レベル変更しない）
:fa-arrow-right: bold  →  **太字テキスト**（見出しにしない）
```

**重要: H1 のみ降格、H2 以下は絶対に変更しない。** 2nd+ H1 の配下にある H2 / H3 / H4 も元のレベルのまま維持する。H1→H2 に降格するからといって、その子の H2→H3 へ連鎖降格してはならない。結果として H2 の親（元 H1）と子が同じ H2 レベルになるが、これは仕様通り。

```text
例: EN に # A > ## B > ### C がある場合
  JA: ## A（H1→H2 降格）> ## B（維持）> ### C（維持）
  NG: ## A > ### B > #### C（連鎖降格は禁止）
```

- `h1-in-body` チェック: actionable 維持
- TOC: H2-H3 表示のまま（変更不要）
- EN の `:fa-arrow-right:` 付き太字テキストは見出しではなく手順導入文。JA では `**...するには:**` 形式の太字段落にする（H2/H3 にしない）

### リスト

- マーカー: EN `*` → JA `-`（markdownlint 互換）
- ネストレベルは原文を維持
- 番号付きステップ数は原文に合わせる（merge/split で調整）
- 原文で step 配下に nested list がある場合、本文へ圧縮せず nested list のまま維持する
- 箇条書きの内容を 1 paragraph や 1 list item に統合して bullet 数を減らさない
- **list item 内に `:::callout` directive を書かない**（lint `callout-in-list-item` で強制）。Python の JA parser は line-based state machine で list context を追跡しないため、indented callout は ambiguous に flatten される。callout を使いたい場合は list の外（top-level）に出す。該当ページの EN 原文で `<div class="note">` 等が list item 内にある場合は、list を一旦閉じて callout、その後別 list として再開する構造にする

#### list item の indent 設計 (EN parser 対称化、Issue #368)

JA parser は EN `collectInlineText` と対称化するため、**list item の「真の nested」** を
検出するために **indent 深さに従う flatten ルール** を持つ。これは書き分け可能な author-facing
contract で、EN の HTML 構造に合わせて JA の indent を選ぶ:

- **tight sibling (indent == body_indent)** — line-based emit で **独立した segment になる**
  - 例: `1. outer\n   - nested` (ordered の body_indent=3、`-` の indent=3)
  - 想定対応 EN 構造: `<ol><li>outer</li><ul><li>nested</li></ul></ol>` (MadCap fragment の `<ul>` が `<li>` 直下ではなく sibling として配置される)
  - 現行 288 corpus はこの pattern を 47 file / 263 line 使用。視覚的にはインデントされて見えるが、parity 上は EN sibling `<ul>` と 1:1 対応する
- **true nested (indent > body_indent、+1 列以上深い)** — active list item に **flatten される**
  - 例: `1. outer\n    - nested` (ordered の body_indent=3、`-` の indent=4)
  - 想定対応 EN 構造: `<ol><li>outer<ul><li>nested</li></ul></li></ol>` (`<li>` 直下に nested `<ul>` が入り、EN `collectInlineText` が "outer nested" の 1 segment に flatten)
  - 288 corpus には現状 0 件。pull-requests unfreeze 等で EN が nested `<ul>` を持つようになった場合、JA を **+1 indent** で書くことで EN `collectInlineText` の 1-segment flatten と対称な出力になる

Issue #368 spec は trigger を `markerIndent >= bodyIndent` としていたが、上記の tight sibling pattern
(47 file / 263 line) の parity を保つため、実装は **strict `>`** (`markerIndent > bodyIndent`) に narrow 化した
意図的 deviation。詳細は `scripts/py/src/testim_parity/segments_ja.py` docstring 参照。

**continuation paragraph** / **indented image** / **indented code fence** も同じく
`leadingWs > bodyIndent` のとき active list item に flatten される:

- `- item\n\n    continuation` → 1 segment "item continuation"
- `- item\n    ![alt](img)` → 1 segment "item" (image は space 1 個に縮退)
- ``- step\n\n    ```js\n    var x;\n    ``` `` → 1 segment "step var x;" (fence inner を text flatten)

### テーブル

- EN HTML テーブル → JA マークダウンテーブルへの変換は許容
- 構造パリティ: 行数・列数を比較
- セル内容パリティ: markdown-stripped テキスト比較で未翻訳・欠落を検出

### HTML 要素の取り扱い

- `<details><summary>`: EN で折りたたみブロックとして使われている場合、JA でもそのまま維持する（H2/H3 見出しに変換しない）
- `<table>`: マークダウンテーブルへの変換は許容（上記テーブルルール参照）
- テーブルセル内の複雑な HTML（`<ul><li><p>` 等）: Markdown では表現できないため HTML のまま維持する。ただしセル外の本文で `<p>` / `<br />` / `<span>` を使う場合は、Markdown の段落・行継続（`\`）・コードスパン（`` ` ``）で代替すること
- `<Image>` / `</Image>`: EN ソースに存在しない JA 独自の JSX タグは削除する。標準の Markdown 画像記法（`![alt](path)`）を使うこと

### JA のみのセクション / 独自 callout（絶対禁止）

- EN に存在しない **セクション / 段落 / callout / リスト項目 / 見出し** は source parity のために削除する
- 「読者に親切な補足」「JA 読者向けの注記」等の追加は禁止。翻訳ニュアンスは構造を変えずに文内で表現する
- 例外は `testim_parity.sync_exclusions` の `SOURCE_SYNC_EXCLUSIONS` に登録された broken-EN snapshot 退避のみ

### その他

- 画像・callout・コードブロック: 出現順序と配置を原文に合わせる
- 段落: 原文の段落構造を維持（diff >= 1 で検出）
- `paragraph-count-mismatch` / `bullet-count-mismatch` は audit-only signal だが、原文構造を崩してよい意味ではない。主判定は canonical structure comparator、count 系は補助シグナルとして扱う

### 原文準拠の source-first 例外（operationalized / Security P2 対応）

> **M2 agent 向け警告**: source-first 例外は自由裁量の escape hatch ではない。以下の **厳格な machine-checkable 条件** のみ該当する。

#### 例外の判定トリガー（以下のいずれかが真の場合のみ）

1. **`testim_parity.sync_exclusions` の `SOURCE_SYNC_EXCLUSIONS` に該当 slug が entry 登録済み**: これが canonical な shallow / broken snapshot registry。登録済みなら source-first の主判定を suspend し、`snapshots/en/content/<slug>.html` ではなく該当 entry が指す `hand-authored snapshot` または `update-lock 対象` として扱う
2. **`check:parity` の issue detail に `[reason=shallow-snapshot]` / `[reason=escaped-details-residue]` / `[reason=extractor-empty]` が emit されている**: `testim_parity.detection.source_parity_source_usability.describe_reason` が runtime で付与する reason token。これが無ければ snapshot は authoritative

上記いずれも真でなければ、**snapshot は authoritative** として扱い、JA を snapshot に追従させる。**agent の主観判断による「EN が曖昧だから shallow snapshot」等の rationalization は禁止**。

#### 運用手順

```text
baseline 候補発見
  ↓
source_sync_exclusions に slug 登録？
  ├─ Yes → page-level で隔離、source-first 例外として JA を調整
  └─ No  ↓
check:parity で [reason=...] token 付与？
  ├─ Yes → 該当 reason token 対応の OPS_DESIGN §Ack 運用に従う
  └─ No  → snapshot は authoritative、JA を snapshot に追従（burn-down）
```

この operationalization により、例外判定は **登録 registry + runtime token** の 2 つの決定論的 signal のみに基づく。「EN が broken に見える」という主観判断で JA を断念するパスを閉じる。

### ルール追加・更新の手順

レビューや作業中に新しい記法ルールや品質基準が判明した場合は、本ガイドに追記してください。

1. 該当セクション（callout、リンク、原文準拠等）にルールを追加する
2. `npm run lint:docs` で機械検証可能なら `testim_parity.tools.lint_docs` にもチェックを追加する
3. 変更を main にコミットする（`docs: WRITING_GUIDE ルール追加`）

---

## 🏷️ Testim 機能名・製品名・画面名の英語維持

> **正本は [GLOSSARY.md](./GLOSSARY.md) です**。本節は執筆者向けの要約で、detector (`testim_parity.glossary_mask`) は GLOSSARY.md のみを参照します。用語追加・更新は GLOSSARY.md に対して行ってください。

Testim の固有名詞は英語のまま維持してください。日本語に翻訳しないこと。

| カテゴリ   | 例                                          |
| ---------- | ------------------------------------------- |
| 製品名     | Testim、Testim Automate、Testim Grid        |
| 画面名     | Test Editor、Project Settings、Test Suite   |
| 機能名     | Visual AI、Smart Locators、Branching、Hooks |
| API/設定名 | `test.id`、`step.label`、`params.timeout`   |

特に次の表現は日本語化しません。

- `Testim Extension`
- `Tricentis Testim Extension`
- `Testim Visual Editor`
- `Visual Editor`
- `Agentic Test Automation`

### 日本エンジニアリング慣用英語の判定基準 (2026-04-17 §5.3.7 rework v2)

Testim 固有名詞に加えて、**日本のエンジニアリング現場で慣用的に英語のまま使われる技術用語**は JA 文中にそのまま残します。直訳すると可読性が下がり、UI / dev tools との cross-reference 性が損なわれるためです (例: `warning ログ` は自然、`警告ログ` は stiff)。

**以下 3 条件全てを満たす場合のみ英語維持 (GLOSSARY 登録可)**:

1. **Dev tools 標準用語**: Chrome DevTools / git / HTTP / 主要言語・フレームワーク の実装 / UI に同一表記で存在する
2. **JA エンジニア慣用**: 実際の JA 技術記事 / Slack / 社内 Wiki 等で英語のまま使用される慣習が確立している
3. **翻訳で情報損失 or 曖昧化**: 直訳すると技術的精度が下がる、または複数の訳が成立してしまう (固有名詞性の喪失を含む)

**明確に許容される例**:

| カテゴリ                 | 例                                                            |
| ------------------------ | ------------------------------------------------------------- |
| Log levels               | `debug` / `info` / `warning` / `error` / `verbose`            |
| HTTP method / status     | `GET` / `POST` / `PUT` / `DELETE` / `401` / `500`             |
| File formats             | `csv` / `json` / `yaml` / `xml` / `pdf` / `jpg`               |
| Test lifecycle labels    | `sanity` / `nightly` / `monitor` / `smoke` / `e2e`            |
| DevTools / network       | `XHR` / `JS` / `CSS` / `WS` / `Manifest`                      |
| HTML 仕様 keyword / 属性 | `href` / `src` / `alt` / `disabled` / `title`                 |
| Third-party vendor enum  | axe-core 影響度 / Applitools match level / Salesforce Edition |
| Browser release channels | `Beta` / `Canary` / `Dev` / `Stable`                          |
| Brand / service 固有名詞 | `YouTube` / `Twitter` / `LinkedIn` / `Facebook` 等            |

**許容されない例 (普通に JA 訳)**:

| 例                    | 理由                                                |
| --------------------- | --------------------------------------------------- |
| `button` → ボタン     | 一般英語、曖昧化なし、JA 自然                       |
| `page` → ページ       | 同上                                                |
| `menu` → メニュー     | 同上                                                |
| `click` → クリック    | カタカナ定着                                        |
| `save` → 保存         | 自然な JA、UI label でない限り翻訳                  |

### JA 文中での埋め込み方 (recommended pattern)

classifier を silent にしつつ自然な JA を実現する書き方:

```markdown
# ❌ 避ける: 英語のみ列挙 (classifier が untranslated と誤検知)
オプション: Critical、Serious、Moderate、Minor。デフォルト = Minor。

# ✅ 推奨: JA 文脈で英語 term を囲む
Critical / Serious / Moderate / Minor の 4 段階から最小失敗レベルを選択します
（それぞれ重大、深刻、中程度、軽微 に相当）。デフォルト値は Minor です。
```

### 「許容機構」原則との関係

GLOSSARY 登録は `maskSegmentText` の正規チャネルであり、`§5.3.7 絶対原則` で禁止される「allowlist / registry / exclusion」とは **別経路**:

- **GLOSSARY** (許容): WRITING_GUIDE で「英語維持」が policy 化された term のみ、text replacement で mask
- **TECH_TOKEN_ALLOWLIST** (禁止): 設計原則違反、§5.3.7 で完全撤廃済
- **broken EN snapshot evacuation** (SOURCE_SYNC_EXCLUSIONS / ARTIFACT_REGISTRY): EN 上流 broken 限定、`§5.3.7 絶対原則` で唯一正当化される許容機構

新規 GLOSSARY 追加は **上記 3 条件 + reviewer 承認** を要する。安易な追加は classifier 検知精度 dilution のため避ける。

---

## 📏 表記統一ルール

プロジェクト全体で以下の表記を統一してください。

### カタカナ長音

| 統一表記     | NG 表記    | 備考                     |
| ------------ | ---------- | ------------------------ |
| パラメーター | パラメータ | 末尾長音あり             |
| ブラウザ     | ブラウザー | 末尾長音なし             |
| エディター   | エディタ   | 末尾長音あり             |
| フォルダー   | フォルダ   | 末尾長音あり             |
| サーバー     | サーバ     | 末尾長音あり（統一済み） |
| ユーザー     | ユーザ     | 末尾長音あり（統一済み） |

### 漢字・ひらがな表記

以下は**ひらがな**で統一:

- できる（✕ 出来る）
- すべて（✕ 全て）
- ください（✕ 下さい）
- いただく（✕ 頂く）
- いたします（✕ 致します）
- こと（✕ 事）
- もの（✕ 物）
- とき（✕ 時）
- ため（✕ 為）

以下は**漢字**で統一:

- 例えば（✕ たとえば）

### スペース規則

- 英単語・製品名と日本語の間には**半角スペースを挿入**する
  - ✅ `Testim の設定`、`CLI を使って`、`URL の指定`
  - ❌ `Testimの設定`、`CLIを使って`、`URLの指定`
- 数字と日本語の間にも半角スペースを挿入する
  - ✅ `10 個のテスト`、`3 つの方法`
  - ❌ `10個のテスト`、`3つの方法`
- `PRO機能` は例外としてスペースを入れない（固有の複合語として扱う）
- **太字（`**...**`）の前後にも半角スペースを挿入**する — Astro（remark）のパーサーは、閉じ `**` の直後にスペースなしで日本語や特殊文字（括弧・引用符等）が続くとボールドとして認識しない
  - ✅ `**Any iOS Device (arm64)** を選択します`
  - ❌ `**Any iOS Device (arm64)**を選択します`（`**` が生テキストで表示される）
  - ✅ `から **Product > Build** をクリック`
  - ❌ `から**Product > Build**をクリック`

### UI ラベルの書式

- 画面上のボタン名・メニュー名・機能名は**太字（`**...**`）**で表記する
  - ✅ `**Add custom validation** を選択します`
  - ❌ `*Add custom validation* を選択します`（斜体は使わない）
- 見出し内でも同様に太字を使う
  - ✅ `## **Validate download** ステップの追加`
  - ❌ `## *Validate download* ステップの追加`

### 括弧

- 日本語テキスト中の補足説明には**全角括弧「（）」**を使用する
  - ✅ `テスト（自動）を実行`
  - ❌ `テスト(自動)を実行`
- コードリテラル・コードブロック内は半角 `()` のまま
- Markdown リンク構文 `[text](url)` の括弧は半角のまま

### PRO 機能ラベル

callout タイトルでの PRO 機能表記は `PRO機能` に統一:

- ✅ `:::note{title="PRO機能"}`
- ❌ `Pro機能`、`プロ機能`、`PRO 機能`、`これは PRO 機能です`

### 文体

- **ですます調**で統一（である調は使わない）
- 句読点は「、」「。」で統一

### 表記揺れの検出と修正

大量の表記揺れを修正する場合は `scripts/tools/fix_notation.py` と `scripts/tools/verify_notation.py` を使用する。

```bash
# 修正実行
python3 scripts/tools/fix_notation.py

# 修正結果を検証
python3 scripts/tools/verify_notation.py
```

注意点:

- **frontmatter の全フィールド**（title, description, keywords）が処理対象。sourceUrl, updated, order, category はスキップされる
- description の YAML 折り返し継続行（`>-` 記法）も処理対象
- コードブロック・インラインコード・URL・HTML タグ内は**全変換で**自動スキップされる（トークン化ベース除外）
- `PRO機能` は英日スペースルールの例外として、スペースなしで維持される
- スクリプトは冪等性があり、再実行しても二重変換されない
- スペース挿入はひらがな・カタカナ・漢字のみが対象。日本語句読点（「」、。）の周囲にはスペースは入らない

---

## 💡 Markdown vs MDX の選び方

### 判断フローチャート

```text
あなたが作りたいページは...?

├─ 📝 普通の記事（テキスト、画像、表、コードブロック）
│   └─ → ✅ Markdown (.md) を選択
│
├─ 📊 複雑なインタラクション（タブ切り替え、折りたたみ）
│   └─ → ⚠️ MDX (.mdx) を選択
│
├─ ⚙️ React コンポーネントを埋め込む
│   └─ → ⚠️ MDX (.mdx) を選択
│
└─ 🤔 迷った
    └─ → ✅ Markdown (.md) を選択
```

### 具体例

| やりたいこと                             | ファイル形式 |
| ---------------------------------------- | ------------ |
| 見出し、段落、リスト                     | `.md`        |
| 画像の挿入                               | `.md`        |
| テーブル（表）の作成                     | `.md`        |
| コードブロック（シンタックスハイライト） | `.md`        |
| 情報パネル（:::tip など）                | `.md`        |
| タスクリスト、脚注                       | `.md`        |
| **タブで切り替えるコード例**             | `.mdx`       |
| **アコーディオン（折りたたみ）**         | `.mdx`       |
| **カスタム React コンポーネント**        | `.mdx`       |

---

---

## 📝 Markdown (.md) で使える機能

Markdown ファイルでは、基本的な記法に加えて、多くの拡張機能が使えます。

### 基本のテキスト装飾

```markdown
通常のテキスト、_イタリック_、**太字**、**_太字イタリック_**

~~取り消し線~~

`インラインコード`

<u>下線付きテキスト</u>（HTML）

<mark>ハイライト表示</mark>（HTML）
```

### 情報パネル（Callout）

`:::` ディレクティブで自動的にスタイル付きパネルに変換されます：

```markdown
:::tip
💡 便利な情報やヒントを表示
:::

:::warning
⚠️ 注意事項や警告を表示
:::

<!-- :::success was removed in Phase 0 (2026-04-14) — dead callout type, no usage in content -->

:::danger
🚨 エラーや問題を表示
:::

:::note
📝 一般的なメモを表示
:::

:::info
ℹ️ 参考情報を表示
:::
```

#### カスタムタイトルの使用

デフォルトのタイトルを変更できます：

```markdown
:::tip{title="重要なポイント"}
カスタムタイトルを使用すると、より具体的な情報を伝えられます。
:::

:::warning{title="バージョン2.0での変更点"}
API の仕様が大きく変更されました。
:::
```

**利用可能なタイプ:**

- `tip` - 💡 ヒント（indigo）
- `warning` - ⚠️ 注意（amber）
- `caution` - 警告（amber、`warning` と CSS alias）
- `danger` - 🚨 エラー（rose）
- `note` - 📝 メモ（slate）
- `info` - ℹ️ 情報（sky）

### コードブロック

#### 基本的なコードブロック

````markdown
```javascript
const greeting = 'Hello, Testim!';
console.log(greeting);
```
````

#### タイトル付きコードブロック

ファイル名を表示できます：

````markdown
```typescript title="user.ts"
interface User {
  id: string;
  name: string;
  email: string;
}
```
````

#### 複数言語の例

````markdown
```bash title="terminal"
npm install
npm run dev
```

```yaml title=".github/workflows/deploy.yml"
name: Deploy to Production
on:
  push:
    branches: [main]
```
````

### リスト機能

#### 通常のリスト

```markdown
- 項目1
- 項目2
  - サブ項目2-1
  - サブ項目2-2
- 項目3

1. 番号付き項目1
2. 番号付き項目2
3. 番号付き項目3
```

#### チェックリスト

```markdown
- [x] 完了したタスク
- [x] 完了したタスク
- [ ] 未完了のタスク
- [ ] 未完了のタスク
```

### テーブル記法

```markdown
| 機能       | Markdown   | MDX        |
| ---------- | ---------- | ---------- |
| 学習コスト | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆   |
| 執筆速度   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐☆☆   |
| 拡張性     | ⭐⭐☆☆☆    | ⭐⭐⭐⭐⭐ |
```

### 引用

```markdown
> Testim は、コードとノーコードを柔軟に組み合わせながら、
> 堅牢なエンドツーエンドテストを最短で実現するプラットフォームです。
>
> — Testim 公式ドキュメントより
```

### リンク

```markdown
# 外部リンク

[Testim 公式サイト](https://www.testim.io/)

# 内部リンク（他のドキュメントページ）

[Testim 概要](/docs/overview/testim-overview)

# アンカーリンク（同じページ内）

[情報パネルセクションへ](#情報パネルcallout)
```

### 画像

```markdown
# 基本的な画像

![代替テキスト](/images/screenshot.png)

# サイズ指定（HTML）

<img src="/images/screenshot.png" alt="スクリーンショット" width="400" />
```

:::note
画像ファイルは `public/images/` に配置してください。
:::

### その他の便利な機能

```markdown
# 水平線

---

# HTML埋め込み

<details>
<summary>クリックして詳細を表示</summary>
折りたたまれた内容
</details>

# キーボード表示

<kbd>Ctrl</kbd> + <kbd>C</kbd>

# 脚注

文中に脚注[^1]を追加できます。

[^1]: これは脚注の内容です。
```

### 数式（KaTeX）

```markdown
# インライン数式

文中に $E = mc^2$ のような数式を埋め込めます。

# ブロック数式

$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### 見出しへの自動リンク

すべての見出しに自動的にリンクが追加されます。設定不要です。

:::tip{title="詳細な実装例が見たい方へ"}
すべての機能の詳しい使用例は、
[執筆機能リファレンス](./WRITING_FEATURES.md) をご覧ください。
:::

---

## 🎨 MDX (.mdx) でのみ使える機能

### 1. タブコンポーネント

```mdx
import Tabs from '../../components/Tabs.tsx';

<Tabs
  client:load
  tabs={[
    {
      label: 'JavaScript',
      content: `const x = 1;`,
    },
    {
      label: 'TypeScript',
      content: `const x: number = 1;`,
    },
  ]}
/>
```

### 2. アコーディオン（折りたたみ）

```mdx
import Accordion from '../../components/Accordion.tsx';

<Accordion client:load title="詳細情報">
  {`ここに折りたたむ内容を記載`}
</Accordion>
```

---

## 📂 ファイル構成

```text
src/content/docs/
├── simple-guide.md          # ← 通常の記事
├── tutorial.md              # ← 通常の記事
├── interactive-demo.mdx     # ← タブやアコーディオンが必要
└── advanced-example.mdx     # ← React コンポーネントが必要
```

---

## ✍️ 執筆フロー

### Markdown の場合

1. ファイル作成: `my-article.md`
2. Frontmatter 記入
3. Markdown で本文執筆
4. `npm run dev` で確認
5. 完成！

### MDX の場合

1. ファイル作成: `my-article.mdx`
2. Frontmatter 記入
3. 必要なコンポーネントを import
4. Markdown + JSX で本文執筆
5. `npm run dev` で確認
6. 構文エラーがあれば修正
7. 完成！

---

## 🚀 実装済みの拡張機能

### Remark プラグイン

- `remark-gfm`: GitHub Flavored Markdown
- `remark-directive`: カスタムディレクティブ
- `@microflash/remark-callout-directives`: 情報パネル自動変換（`:::note` 等）
- `remark-code-meta`: コードブロックメタ情報（カスタム）

### Rehype プラグイン

- `rehype-autolink-headings`: 見出し自動リンク

### カスタムコンポーネント

- `Tabs.tsx`: タブ切り替え
- `Accordion.tsx`: 折りたたみセクション

---

## 📚 参考記事

- [執筆機能デモ (MD版)](./WRITING_FEATURES.md)
- 高度な執筆機能デモ (MDX版) — 該当ページがある場合はパスベースリンクを使用

---

## 💡 ベストプラクティス

### 📖 読みやすさを重視

- **段落間には空行を入れる**
  - 悪い例: 改行なしで詰まった文章
  - 良い例: 段落ごとに1行の空白

- **リストの前後にも空行を入れる**

  ```markdown
  本文が続きます。

  - リスト項目1
  - リスト項目2

  次の本文が始まります。
  ```

- **見出しレベルは順序を守る**（H2→H3→H4）
  - ❌ H2 の次にいきなり H4
  - ✅ H2 → H3 → H4 の順序
  - **TOC（目次）に表示されるのは H2 と H3 のみ**。本文内の H1（`# 見出し`）と H4 以下（`####`）は目次に出ない

- **コードブロックには言語を指定する**

  ````markdown
  ❌ 言語指定なし

  ```
  const x = 1;
  ```

  ✅ 言語指定あり

  ```javascript
  const x = 1;
  ```
  ````

### 🎯 一貫性を保つ

- **リストのマーカーは統一する**
  - `-` または `*` のどちらかに統一（このプロジェクトでは `-` を推奨）

- **見出しは `#` 形式を使う**
  - `===` や `---` によるアンダーライン形式は避ける

- **リンクテキストは具体的に**
  - ❌ [こちら](https://example.com)
  - ✅ [Testim 公式ドキュメント](https://example.com)

### ♿ アクセシビリティ

- **画像には必ず代替テキストを付ける**

  ```markdown
  ![テスト実行画面のスクリーンショット](/images/test-run.png)
  ```

- **リンクテキストは意味のある言葉にする**
  - ❌ 詳細はこちらをご覧ください
  - ✅ 詳細は[テスト作成ガイド](/docs/getting-started/creating-your-first-codeless-test)をご覧ください

- **見出しの階層を正しく使う**
  - H1 は自動生成されるため、本文では H2 から使用（本文内の `# 見出し` は TOC に表示されない）
  - TOC（目次）は H2・H3 のみ表示。H4 以下は TOC に出ない点に注意

### 🎨 情報パネルの使い分け

| タイプ | 用途 | 例 |
| --- | --- | --- |
| `tip` | 便利な情報、ヒント | 「時間を節約するには...」 |
| `warning` | 注意事項、制限 | 「この機能は Enterprise プランのみ」 |
| `caution` | MadCap Flare 由来の警告 | EN 原文の `<div class="caution">` を変換する場合に使用 |
| `danger` | エラー、失敗例 | 「この方法は避けてください」 |
| `note` | 補足情報 | 「関連する機能について」 |
| `info` | 参考情報、リンク | 「公式ドキュメントも参照」 |

---

## ❓ よくある質問

### Q1: 画像を挿入したいのですが、どこに配置すればいいですか？

**A:** `public/images/` 配下に配置してください。カテゴリごとにフォルダを作成することを推奨します。

```text
public/images/
├── getting-started/
│   └── first-test.png
├── overview/
│   └── dashboard.png
└── guides/
    └── example.png
```

Markdown での記述：

```markdown
![最初のテスト作成画面](/images/getting-started/first-test.png)
```

### Q2: 表（テーブル）の列が多くて見づらいです

**A:** 以下の方法を検討してください：

1. **縦方向のレイアウトに変更**

   ```markdown
   | 項目  | 値    |
   | ----- | ----- |
   | 機能A | 説明A |
   | 機能B | 説明B |
   ```

2. **情報を分割する**
   - 複数の小さなテーブルに分ける
   - リスト形式に変更する

3. **横スクロールを許容する**
   - モバイルでは自動的に横スクロール対応

### Q2b: テーブルの列幅バランスを調整したい

**A:** HTML テーブルタグに `md-table-Xcols` クラスを付与してください。

テーブルは `table-layout: auto`（ブラウザがコンテンツ量で列幅を自動調整）が基本ですが、列幅のバランスが崩れる場合はクラスでヒントを与えられます。

| クラス           | 用途                    | 列幅の比率                    |
| ---------------- | ----------------------- | ----------------------------- |
| `md-table-2cols` | 2列（名前＋説明）       | 30% / 70%                     |
| `md-table-3cols` | 3列（名前／説明／備考） | 25% / 50% / 25%               |
| `md-table-4cols` | 4列以上                 | min-width: 100px のみ（auto） |

```html
<table class="md-table md-table-3cols">
  <thead>
    …
  </thead>
  <tbody>
    …
  </tbody>
</table>
```

> **注意**: Markdown の `|` 記法テーブルにはクラスを付与できないため、列幅調整が必要な場合は HTML 記法で書く。

### Q3: コードをタブで切り替えたいです

**A:** MDX を使用してください。

```mdx
import Tabs from '../../components/Tabs.tsx';

<Tabs
  client:load
  tabs={[
    {
      label: 'JavaScript',
      content: `const x = 1;`,
    },
    {
      label: 'TypeScript',
      content: `const x: number = 1;`,
    },
  ]}
/>
```

### Q4: 内部リンクのパスがわかりません

**A:** `/docs/` 以降はファイルの**パスベースの slug**を使用します。フォルダ構造が URL に反映されます。

```text
src/content/docs/overview/testim-overview.md
→ /docs/overview/testim-overview

src/content/docs/getting-started/creating-your-first-test.md
→ /docs/getting-started/creating-your-first-test
```

### Q5: 既存ページを更新する際の注意点は？

**A:** Frontmatter の `updated` 日付を必ず更新してください。

```yaml
---
title: 'ページタイトル'
updated: '2025-11-02' # ← 更新日を変更
---
```

### Q6: Markdown と MDX、どちらを選ぶべきか迷います

**A:** **迷ったら Markdown を選んでください。** 98%のケースで十分です。

MDX が必要なのは：

- タブ切り替えが必要
- アコーディオン（折りたたみ）が必要
- カスタム React コンポーネントを埋め込む

これらが不要なら Markdown で大丈夫です。

---

## 📚 関連リソース

### プロジェクト内ドキュメント

- 📖 [**執筆機能リファレンス**](./WRITING_FEATURES.md) - 全機能の詳細な実装例
- 🌐 [**翻訳ガイド**](./TRANSLATION_GUIDE.md) - 公式ドキュメントからの翻訳手順
- 📘 [**README**](../README.md) - プロジェクト概要とセットアップ

### 外部リソース

- 🚀 [Astro - Content Collections](https://docs.astro.build/en/guides/content-collections/)
- 📝 [GitHub Flavored Markdown 仕様](https://github.github.com/gfm/)
- 🎨 [Tailwind CSS ドキュメント](https://tailwindcss.com/)
- 🔧 [remark-gfm プラグイン](https://github.com/remarkjs/remark-gfm)

---

## 💡 執筆のヒント

- **迷ったら Markdown (.md) を選択** - シンプルで高速、プレビューも簡単
- **インタラクティブな要素が本当に必要な時だけ MDX (.mdx) を使用**
- **コードブロックには必ず言語指定とタイトルを付ける** - 読者の理解を助ける
- **情報パネルは適切なタイプを選ぶ** - tip / warning / caution / danger / note / info から選択
- **執筆中は `npm run dev` でリアルタイムプレビュー** - 見た目を確認しながら書く
- **困ったら [執筆機能リファレンス](./WRITING_FEATURES.md) を参照** - 実装例が豊富

---

最終更新日: 2025 年 11 月 2 日
