# 執筆機能リファレンス

> このファイルは開発者向けの内部ドキュメントです。Markdownファイルで使える拡張機能の完全リファレンスです。

## このページについて

このページは、**Markdownファイルで使える拡張機能の完全リファレンス**です。すべての機能の実装例と使い方を詳しく解説しています。

:::tip{title="初めての方へ"}
- **執筆ガイドが欲しい方**: プロジェクトルートの [WRITING_GUIDE.md](./WRITING_GUIDE.md) で、MarkdownとMDXの選び方や執筆フローをご紹介しています
- **機能の詳しい使い方を知りたい方**: 下記のセクションをご参照ください
:::

---

このページでは、**Markdown (.md)** ファイルで利用できる拡張機能を紹介します。すべて標準的なMarkdown記法で書けるため、執筆が簡単です。

---

## テキスト装飾

Markdownの基本的なテキスト装飾機能です。

### 強調と太字

通常のテキスト、_イタリック（斜体）_、**太字（ボールド）**、**_太字イタリック_** を使い分けられます。

### 打ち消し線

~~取り消し線~~ を使って、削除された内容や無効な情報を示すことができます。

### インラインコード

文中で `変数名` や `関数名()` を強調表示できます。キーボードショートカット `Cmd+C` なども表現可能です。

### 下線とハイライト

HTMLタグを使えば、<u>下線付きテキスト</u> や <mark>ハイライト表示</mark> も可能です。

---

## 見出しレベル

見出しは6段階まで使用できます。

# 見出し1（H1）

## 見出し2（H2）

### 見出し3（H3）

#### 見出し4（H4）

##### 見出し5（H5）

###### 見出し6（H6）

:::info
ページタイトルにH1が使われるため、本文ではH2以降を使用することを推奨します。
:::

---

## 水平線（区切り線）

セクションの区切りとして水平線を挿入できます。

---

上記のように `---`（ハイフン3つ）で作成できます。

---

## 情報パネル（Callout）

`:::` ディレクティブを使って、さまざまな種類の情報パネルを作成できます。

:::tip
これは便利な情報やヒントを表示するtipパネルです。読者の理解を助ける補足情報に最適です。
:::

:::warning
これは注意を促すwarningパネルです。重要な注意事項や制限事項を記載する際に使用します。
:::

:::success
これはベストプラクティスを示すsuccessパネルです。推奨される方法や正しいアプローチを強調できます。
:::

:::danger
これはエラーや問題を示すdangerパネルです。よくある失敗例や避けるべき実装を警告します。
:::

:::note
これは一般的なメモを表示するnoteパネルです。追加の説明や背景情報に使用します。
:::

:::info
これは参考情報を表示するinfoパネルです。関連リンクや詳細情報への誘導に便利です。
:::

### カスタムタイトルの使用

`{title="..."}` 属性で、デフォルトのタイトルを上書きできます。

:::tip{title="重要なポイント"}
カスタムタイトルを使用すると、より具体的な情報を伝えられます。
:::

:::warning{title="バージョン2.0での変更点"}
APIの仕様が大きく変更されました。既存のコードを更新してください。
:::

:::note{title="開発者向けの補足情報"}
この機能は実験的なものであり、将来のバージョンで変更される可能性があります。
:::

### Markdownでの記述方法

```markdown
:::tip
ここに内容を書きます
:::

:::warning
複数行の内容も
サポートされています
:::

:::tip{title="カスタムタイトル"}
タイトルを自由に設定できます
:::
```

---

## コードブロックの拡張

### 基本的なコードブロック

通常のコードブロックはシンタックスハイライト付きで表示されます。

```javascript
const greeting = 'Hello, Testim!';
console.log(greeting);

function runTest(name) {
  return `Running test: ${name}`;
}
```

### タイトル付きコードブロック

ファイル名を表示することで、コードの文脈を明確にできます。

```typescript title="user.ts"
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

function createUser(name: string, email: string): User {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
  };
}
```

### 複数言語のコード例

```bash title="terminal"
# プロジェクトのセットアップ
npm create astro@latest

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

```yaml title=".github/workflows/deploy.yml"
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
```

---

## リスト機能

### チェックリスト

GitHub Flavored Markdownのタスクリストも使えます。

- [x] プロジェクトのセットアップ
- [x] 基本ページの作成
- [x] スタイリングの適用
- [ ] テストの追加
- [ ] デプロイ設定

### ネスト化されたリスト

複雑な構造も表現できます。

1. **アカウント作成**
   - メールアドレスの登録
   - パスワードの設定
   - メール認証
2. **プロジェクトのセットアップ**
   - プロジェクト名の入力
   - テスト対象の選択
     - Web アプリケーション
     - モバイルアプリ
     - Salesforce
3. **最初のテスト作成**
   - テストレコーダーの起動
   - 操作の記録
   - 検証の追加

---

## テーブル

機能の比較や情報の整理に便利です。

<table class="md-table md-table-4cols">
 <thead>
  <tr>
   <th>
    機能
   </th>
   <th>
    Markdown
   </th>
   <th>
    MDX
   </th>
   <th>
    推奨
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    学習コスト
   </td>
   <td>
    ⭐⭐⭐⭐⭐
   </td>
   <td>
    ⭐⭐⭐☆☆
   </td>
   <td>
    MD
   </td>
  </tr>
  <tr>
   <td>
    執筆速度
   </td>
   <td>
    ⭐⭐⭐⭐⭐
   </td>
   <td>
    ⭐⭐⭐☆☆
   </td>
   <td>
    MD
   </td>
  </tr>
  <tr>
   <td>
    拡張性
   </td>
   <td>
    ⭐⭐☆☆☆
   </td>
   <td>
    ⭐⭐⭐⭐⭐
   </td>
   <td>
    MDX
   </td>
  </tr>
  <tr>
   <td>
    プレビュー
   </td>
   <td>
    ⭐⭐⭐⭐⭐
   </td>
   <td>
    ⭐⭐⭐☆☆
   </td>
   <td>
    MD
   </td>
  </tr>
 </tbody>
</table>

### 複雑なテーブル

<table class="md-table md-table-5cols">
 <thead>
  <tr>
   <th>
    プラン
   </th>
   <th>
    月額料金
   </th>
   <th>
    テスト実行数
   </th>
   <th>
    サポート
   </th>
   <th>
    推奨用途
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Free
   </td>
   <td>
    $0
   </td>
   <td>
    100回/月
   </td>
   <td>
    コミュニティ
   </td>
   <td>
    個人学習
   </td>
  </tr>
  <tr>
   <td>
    Starter
   </td>
   <td>
    $49
   </td>
   <td>
    1,000回/月
   </td>
   <td>
    メール
   </td>
   <td>
    小規模チーム
   </td>
  </tr>
  <tr>
   <td>
    Professional
   </td>
   <td>
    $199
   </td>
   <td>
    10,000回/月
   </td>
   <td>
    優先サポート
   </td>
   <td>
    本番環境
   </td>
  </tr>
  <tr>
   <td>
    Enterprise
   </td>
   <td>
    要相談
   </td>
   <td>
    無制限
   </td>
   <td>
    専任担当
   </td>
   <td>
    大規模組織
   </td>
  </tr>
 </tbody>
</table>

---

## 引用

外部の文章や重要な声明を引用する際に使用します。

> Testimは、コードとノーコードを柔軟に組み合わせながら、堅牢なエンドツーエンドテストを最短で実現するテスト自動化プラットフォームです。
>
> — Testim公式ドキュメントより

### ネストされた引用

引用の中にさらに引用を含めることもできます。

> これは外側の引用です。
>
> > これはネストされた引用です。
> >
> > 複数レベルの引用が可能です。
>
> 外側の引用に戻ります。

---

## 定義リスト

用語とその定義を明確に示すことができます。

用語1
: 用語1の定義です。詳細な説明を記述できます。

用語2
: 用語2の最初の定義です。
: 用語2の2番目の定義です。複数の定義を持つこともできます。

API
: Application Programming Interfaceの略。ソフトウェア間のインターフェース仕様。

---

## 数式（KaTeX）

数式を美しく表示できます。

### インライン数式

文中に $E = mc^2$ のような数式を埋め込めます。円の面積は $A = \pi r^2$ で計算できます。

### ブロック数式

複雑な数式はブロックで表示します。

$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

---

## リンク

### 外部リンク

[Testim公式サイト](https://www.testim.io/) へのリンク

### 内部リンク

他のドキュメントページへのリンク。

- [Testim概要](/docs/testim-overview)
- [はじめに](/docs/setting-up-your-account)
- [Webテストの作成](/docs/creating-your-first-codeless-test)

### アンカーリンク

同じページ内の見出しへジャンプできます。

- [情報パネルセクションへ](#情報パネルcallout)
- [コードブロックセクションへ](#コードブロックの拡張)
- [ページトップへ](#top)

### 参照スタイルリンク

後でまとめてURLを定義する方式も使えます。

[Testim公式サイト][testim] や [GitHubリポジトリ][github] へのリンク

[testim]: https://www.testim.io/
[github]: https://github.com/

---

## エスケープ文字

Markdownの特殊文字をそのまま表示したい場合は、バックスラッシュでエスケープします。

\*これはイタリックになりません\*

\# これは見出しになりません

\[これはリンクになりません\](https://example.com)

---

## HTML埋め込み

必要に応じてHTMLタグを直接使用できます。

<details>
<summary>クリックして詳細を表示</summary>

この部分は折りたたまれています。クリックすると表示されます。

**Markdown記法も使用可能** です。

- リスト項目1
- リスト項目2

</details>

<kbd>Ctrl</kbd> + <kbd>C</kbd> のようなキーボード表示も可能です。

---

## コメント

HTMLコメントを使うと、レンダリング結果に表示されないメモを残せます。

<!-- これは表示されないコメントです -->

<!-- TODO: この部分は後で更新する -->

---

## 絵文字

GitHub風の絵文字記法が使えます。

:smile: :heart: :rocket: :tada: :warning: :information_source:

:white_check_mark: :x: :bulb: :memo: :link: :book:

---

## 画像

### 基本的な画像

```markdown
![代替テキスト](/images/screenshot.png)
```

:::note
**メモ**: 画像ファイルは `public/images/` に配置してください。
:::

### 画像にリンクを追加

画像をクリック可能にすることもできます。

```markdown
[![Testimロゴ](/images/logo.png)](https://www.testim.io/)
```

### 画像のサイズ指定

HTMLタグを使えば、画像のサイズを指定できます。

```html
<img src="/images/screenshot.png" alt="スクリーンショット" width="400" />
```

---

## Markdown記述のベストプラクティス

### 読みやすさを重視

- 段落間には空行を入れる
- リストの前後にも空行を入れる
- 見出しレベルは順序を守る（H2→H3→H4）
- コードブロックには言語を指定する

### 一貫性を保つ

- リストのマーカーは統一する（`-` または `*`）
- 見出しは `#` 形式を使う（`===` や `---` は避ける）
- リンクはわかりやすいテキストで記述する

### アクセシビリティ

- 画像には必ず代替テキストを付ける
- リンクテキストは「こちら」ではなく具体的な内容にする
- 見出しの階層を正しく使う

---

## まとめ

これらの機能はすべて **純粋なMarkdown** で記述できます。特別な構文やReactコンポーネントの知識は不要です。

### 執筆の流れ

1. `.md` ファイルを作成
2. Frontmatterを記入（title、descriptionなど）
3. 上記の機能を使って本文を執筆
4. `npm run dev` でプレビュー確認
5. 完成！

---

最終更新日: 2025年11月2日

---

## 脚注の使用例

Markdownでは脚注[^1]も使えます。複数の脚注[^2]を追加して、詳細な説明を文末にまとめることができます。

[^1]: これは最初の脚注です。追加の説明や参照情報を記載できます。

[^2]: これは2番目の脚注です。URLや詳細な技術情報を含めることもできます。
