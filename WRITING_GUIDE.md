# 執筆ガイド: Markdown で書いて拡張機能を使う

> このガイドは、Testim ドキュメント日本語版の**執筆者・編集者向け**です。
> 翻訳作業については [TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md) をご参照ください。

このプロジェクトでは、**Markdown (.md)** で記事を書きながら、豊富な拡張機能を利用できます。

## 📚 目次

- [基本方針](#-基本方針)
- [Markdown vs MDX の選び方](#-markdown-vs-mdx-の選び方)
- [Markdown で使える機能](#-markdown-で使える機能)
- [MDX でのみ使える機能](#-mdx-でのみ使える機能)
- [執筆フロー](#️-執筆フロー)
- [実装済みの拡張機能](#-実装済みの拡張機能)
- [ベストプラクティス](#-ベストプラクティス)
- [よくある質問](#-よくある質問)
- [関連リソース](#-関連リソース)

---

## 🎯 基本方針

1. **通常の記事は .md で書く**（執筆しやすさ優先）
2. **特別な機能が必要な場合のみ .mdx を使う**（拡張性優先）
3. **迷ったら Markdown (.md) を選択**（98%のケースはこれで十分）

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

| やりたいこと | ファイル形式 |
|------------|------------|
| 見出し、段落、リスト | `.md` |
| 画像の挿入 | `.md` |
| テーブル（表）の作成 | `.md` |
| コードブロック（シンタックスハイライト） | `.md` |
| 情報パネル（:::tip など） | `.md` |
| タスクリスト、脚注 | `.md` |
| **タブで切り替えるコード例** | `.mdx` |
| **アコーディオン（折りたたみ）** | `.mdx` |
| **カスタム React コンポーネント** | `.mdx` |

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

### テーブル

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
[執筆機能リファレンス](/docs/guides/writing-features) をご覧ください。
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
- `remark-callouts`: 情報パネル自動変換（カスタム）
- `remark-code-meta`: コードブロックメタ情報（カスタム）

### Rehype プラグイン

- `rehype-autolink-headings`: 見出し自動リンク

### カスタムコンポーネント

- `Tabs.tsx`: タブ切り替え
- `Accordion.tsx`: 折りたたみセクション

---

## 📚 参考記事

- [執筆機能デモ (MD版)](/docs/writing-features)
- [高度な執筆機能デモ (MDX版)](/docs/advanced-features)

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
  - ✅ 詳細は[テスト作成ガイド](/docs/creating-tests)をご覧ください

- **見出しの階層を正しく使う**
  - H1 は自動生成されるため、本文では H2 から使用

### 🎨 情報パネルの使い分け

| タイプ | 用途 | 例 |
|--------|------|-----|
| `tip` | 便利な情報、ヒント | 「時間を節約するには...」 |
| `warning` | 注意事項、制限 | 「この機能は Enterprise プランのみ」 |
| `success` | ベストプラクティス | 「推奨される設定方法」 |
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
   | 項目 | 値 |
   |------|-----|
   | 機能A | 説明A |
   | 機能B | 説明B |
   ```

2. **情報を分割する**
   - 複数の小さなテーブルに分ける
   - リスト形式に変更する

3. **横スクロールを許容する**
   - モバイルでは自動的に横スクロール対応

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

**A:** `/docs/` 以降のフォルダ構造とファイル名（拡張子なし）を使用します。

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
updated: '2025-11-02'  # ← 更新日を変更
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

- 📖 [**執筆機能リファレンス**](/docs/guides/writing-features) - 全機能の詳細な実装例
- 🌐 [**翻訳ガイド**](./TRANSLATION_GUIDE.md) - 公式ドキュメントからの翻訳手順
- 📘 [**README**](./README.md) - プロジェクト概要とセットアップ

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
- **困ったら [執筆機能リファレンス](/docs/guides/writing-features) を参照** - 実装例が豊富

---

最終更新日: 2025 年 11 月 2 日
