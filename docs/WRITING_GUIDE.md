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

## 🎯 最優先ルール

1. `docs/WRITING_GUIDE.md` を公開ドキュメント整備の最優先ルールとする
2. 公開ページは原則 `.md` で管理し、特別な UI が必要な場合だけ `.mdx` を使う
3. `npm run lint:docs` で検出される違反は必ず修正してからマージする
4. Testim の機能名、製品名、画面名、固有ラベルは原則として英語のまま維持する
5. `docs/SIDEBAR_URLS.md` を seed URL とセクション分割の正本として扱う
6. `sourceUrl` の原文にあるユーザー向け本文、手順、callout、画像は欠落なく日本語ページへ反映する

---

## 📋 frontmatter 必須ルール

すべての記事ファイルには以下の frontmatter が必須です。`src/content.config.ts` と `scripts/lint-docs.mjs` の両方で検証されます。

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

| フィールド | 必須 | デフォルト | 規則 |
| --- | --- | --- | --- |
| `title` | ✅ | — | 日本語タイトル |
| `description` | ✅ | — | 具体的な説明文。「説明文」「TODO」「原文: ...」などのプレースホルダ禁止 |
| `category` | ✅ | — | `docs/SIDEBAR_URLS.md` のセクション日本語ラベルに一致させる |
| `updated` | ✅ | — | 更新日（`YYYY-MM-DD` 形式） |
| `sourceUrl` | ✅ | — | 英語原文 URL（`https://docs.tricentis.com/testim/content/.../{slug}.htm`）必須 |
| `order` | — | `0` | サイドバー内の表示順序（`docs/SIDEBAR_URLS.md` 基準） |
| `keywords` | — | `[]` | 検索用キーワード（日本語、最大10件目安） |
| `hero` | — | — | ヒーローセクション（トップページ用、通常の記事では不要） |

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
- `success`
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

EN 原文の blockquote callout を JA の `:::` callout に変換する際は、以下のマッピングに従ってください：

| EN 原文パターン | JA callout タイプ | 備考 |
| --- | --- | --- |
| `> 📘 Note` / `> 📘` (タイトルなし) | `:::note` | デフォルトの情報補足 |
| `> 📘 Tip` / `> 👍` | `:::tip` | ヒント・推奨事項 |
| `> 🚧` / `> ⚠️` | `:::warning` | 注意・警告 |
| `> ❗` / `> ❗️` | `:::danger` | 重大な警告・破壊的操作 |
| `<Callout theme="info">` | `:::note` | JSX形式の情報callout |
| `<Callout theme="warning">` | `:::warning` | JSX形式の警告callout |

注意: JA タイトルが「注意」の場合は、EN 原文の絵文字に関わらず `:::warning{title="注意"}` を使用する。「注意」という日本語表現は警告の意味合いが強いため、`:::warning` が適切。

### レガシー callout 変換時の注意事項

原文の blockquote callout を `:::` に変換する際は、以下にも注意する:

- **タイトルと本文を区別する**: 短い見出し的テキスト（目安40文字以下）はタイトル、長い文章は本文にする
  - NG: `:::note{title="長い説明文がここに入る..."}\n:::`
  - OK: `:::note\n長い説明文がここに入る...\n:::`
- **連続する異なる絵文字は別々の callout に分割する**
  - `> 📘 text\n> 🚧 text` → `:::note\ntext\n:::\n\n:::warning\ntext\n:::`

---

## 🪞 原文準拠ルール（Source-First 構造契約）

`sourceUrl` を持つページは、原文の要約ではなく公開用の日本語版として整備してください。

- 原文の本文段落、番号手順、箇条書き、callout は省略しない
- 原文にコンテンツ画像がある場合、ローカルに保存するだけでなく本文中の対応位置へ埋め込む
- 画像数だけでなく、画像の配置順も原文に合わせる
- 原文にしかない重要な UI ラベル、確認メッセージ、遷移先画面は本文に明記する
- 補足説明を追加する場合でも、原文の内容が先に満たされていることを前提にする

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

### テーブル

- EN HTML テーブル → JA マークダウンテーブルへの変換は許容
- 構造パリティ: 行数・列数を比較
- セル内容パリティ: markdown-stripped テキスト比較で未翻訳・欠落を検出

### HTML 要素の取り扱い

- `<details><summary>`: EN で折りたたみブロックとして使われている場合、JA でもそのまま維持する（H2/H3 見出しに変換しない）
- `<table>`: マークダウンテーブルへの変換は許容（上記テーブルルール参照）

### JA のみのセクション

- EN に存在しないセクション（「次のステップ」「関連リンク」等の JA 独自追加）は source parity のために削除する
- 「原文から意図的に除外するコンテンツ」（下記）は例外

### その他

- 画像・callout・コードブロック: 出現順序と配置を原文に合わせる
- 段落: 原文の段落構造を維持（diff >= 1 で検出）

### 原文から意図的に除外するコンテンツ

以下のコンテンツは Tricentis より削除依頼を受けており、原文に存在しても日本語版には**含めないこと**。source parity チェックで差分として検出されても再追加しない。対象ファイルには HTML コメントで除外理由を記載済み。

| ページ            | 除外対象                                                                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `testim-overview` | 「At Testim, we are developers and testers too...」段落（企業紹介文）                                                                                                                                                       |
| `testim-overview` | Pricing callout（料金プラン・サブスクリプション案内）                                                                                                                                                                       |
| 全ページ共通      | `https://www.testim.io/pricing/` への誘導リンク（「詳細については、[こちら](https://www.testim.io/pricing/)をご覧ください」等）。「Professional plan でのみ利用できます」の制限案内文は残し、pricing リンク部分のみ削除する |

### ルール追加・更新の手順

レビューや作業中に新しい記法ルールや品質基準が判明した場合は、本ガイドに追記してください。

1. 該当セクション（callout、リンク、原文準拠等）にルールを追加する
2. `npm run lint:docs` で機械検証可能なら `scripts/lint-docs.mjs` にもチェックを追加する
3. 変更を main にコミットする（`docs: WRITING_GUIDE ルール追加`）

---

## 🏷️ Testim 機能名・製品名・画面名の英語維持

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

大量の表記揺れを修正する場合は `scripts/fix-notation.py` と `scripts/verify-notation.py` を使用する。

```bash
# 修正実行
python3 scripts/fix-notation.py

# 修正結果を検証
python3 scripts/verify-notation.py
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

:::success
✅ ベストプラクティスを表示
:::

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
- `success` - ✅ 推奨（emerald）
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

| タイプ    | 用途               | 例                                   |
| --------- | ------------------ | ------------------------------------ |
| `tip`     | 便利な情報、ヒント | 「時間を節約するには...」            |
| `warning` | 注意事項、制限     | 「この機能は Enterprise プランのみ」 |
| `success` | ベストプラクティス | 「推奨される設定方法」               |
| `danger`  | エラー、失敗例     | 「この方法は避けてください」         |
| `note`    | 補足情報           | 「関連する機能について」             |
| `info`    | 参考情報、リンク   | 「公式ドキュメントも参照」           |

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
- **情報パネルは適切なタイプを選ぶ** - tip / warning / success / danger など
- **執筆中は `npm run dev` でリアルタイムプレビュー** - 見た目を確認しながら書く
- **困ったら [執筆機能リファレンス](./WRITING_FEATURES.md) を参照** - 実装例が豊富

---

最終更新日: 2025 年 11 月 2 日
