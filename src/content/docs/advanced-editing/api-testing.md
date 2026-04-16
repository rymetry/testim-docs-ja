---
title: API テスト
description: >-
  UI テストから HTTP API を呼び出し、レスポンスの検証やテスト内でのデータ利用を行う API テストステップ（Validate API / Add
  API action）の使い方を説明します。
category: 高度な編集
order: 5050
updated: '2025-09-23'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/api-testing.htm'
keywords:
  - API テスト
  - HTTP リクエスト
  - Validate API
  - Add API action
  - レスポンス検証
  - ステータスコード
  - ヘッダー検証
  - ボディ検証
  - パラメーター
  - バックエンド検証
---

API テストは、テスト内で API 呼び出し（HTTP リクエスト）を行います。これにより、他ステップで使うデータの取得や、バックエンドとフロントエンドの値の整合を確認する検証が可能です。API リクエストはヘッダー（認証情報を含む）とボディを持つ完全な HTTP リクエストです。\
API ステップには **Add API action** と **Validate API** の 2 種類があります。

- Add API action — API 応答からデータを取得したい場合に使用（返ってくることの確認にも利用可）
- Validate API — API 応答の検証に使用（主にバックエンドのデータ検証）

:::note{title="PRO機能"}
Professional plan で利用可能です。
:::

## Validate API ステップの追加

API 検証ステップで応答を検証します。ヘッダー／ボディ／ステータスコードで検証可能です。検証全般は[こちら](/docs/advanced-editing/validations)を参照。\
**“Add API validation” を追加するには:**

![API テストのスクリーンショット](/images/advanced-features/api-testing/eb15a7d-validatestep.gif)

1. **Add API validation** ステップを追加したい位置の （矢印）アイコン、または最後のステップの後ろにある **+** アイコンにカーソルを合わせます。
2. **“M”**（Testim predefined steps）ボタンをクリックします。\
   **Predefined steps** メニューが開きます。
3. **Validations** をクリックします。\
   **Validations** メニューが展開されます。
4. メニューをスクロールし、**Validate API** を選択します。

:::note
メニュー上部の検索ボックスに _Validate API_ と入力して検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/d92c26a-Picture1.png)

5. **Name the new step** フィールドに、このステップの名前を入力します。
6. このステップを他のテストでも再利用できる共有ステップとして保存したい場合は、**Shared step** チェックボックス（デフォルトでオン）をそのままにし、**Select shared step** フォルダーリストから保存先フォルダーを選択します。共有ステップにしない場合はチェックを外します。\
   共有ステップの詳細は [グループ](/docs/editing-tests/groups) を参照してください。
7. **Create Step** をクリックします。\
   **Run Shared API Validation** ウィンドウが開きます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/0442a1d-run_sharred_api_validation.png)

8. **URL** フィールドで使用する HTTP リクエストメソッドを選択し、ルートエンドポイントとパスを入力します。必要に応じて URL にパラメーターを追加します。詳細は後述の [Using Parameters](/docs/advanced-editing/api-testing#using-parameters-in-the-sent-http-request) を参照してください。
9. **Header** セクションで、API に送信するヘッダーのキーと値を入力します。ヘッダーを個別のキー／値フィールドで入力したい場合は **Key-Value**（デフォルト）を選択し、ブラウザの DevTools Network パネルからコピーした文字列などをそのまま貼り付けたい場合は **Raw** を選択します。\
   複数のヘッダーを定義している場合、左側のチェックボックスをオンにしたヘッダーを使ったリクエストが順に実行されます。ヘッダーを削除したい場合は右端の **X** をクリックします。

![API テストのスクリーンショット](/images/advanced-features/api-testing/0277227-header.png)

10. 認証ヘッダーを設定するには **Authorization** タブをクリックし、次のいずれかの方式を選択します。
    - **None** – 認証情報を送信しない場合、または Basic / Bearer 以外の方式を使いたい場合に選びます。この場合、認証ヘッダーは **Header** タブで手動設定する必要があります。
    - **Basic** – エンドポイントが Basic 認証を使用する場合に選択します。ユーザー名とパスワードを入力します。
    - **Bearer** – エンドポイントが Bearer トークン認証を使用する場合に選択します。トークンを入力します。

:::note
**Authorization** タブで **None** 以外を指定した場合、その設定が **Header** タブで手動入力した認証値を上書きします。
:::

![API テストのスクリーンショット](/images/advanced-features/api-testing/e0ec5a9-authorization.png)

11. **Body** セクションのドロップダウンで送信するデータ形式を選び、下の入力欄にリクエストボディを入力します。キーと値のペアなど任意のテキストを送る場合は Text 形式を選んでください。ボディにはパラメーターも埋め込めます。詳細は後述の [Using Parameters](/docs/advanced-editing/api-testing#using-parameters-in-the-sent-http-request) を参照してください。

**選択できるデータ形式（ドロップダウン）:**

- Text（プレーンテキスト）
- JSON（構造化データ）
- JavaScript（実行可能コード）
- XML（構造化データ）
- HTML（マークアップ）

![API テストのスクリーンショット](/images/advanced-features/api-testing/ba2e285-body.png)

**Assertion** セクションでは、コードを書かずにレスポンスのヘッダー／ボディ／ステータスコードを検証できます。アサーションは後述の「Run additional code on request results」で記述するコードより先に実行され、真なら成功、偽なら失敗になります。アサーションが失敗した場合、ステップとテスト全体が失敗扱いとなり、「Run additional code on request results」に書いたコードは実行されません。

設定手順:

- 1 つ目のドロップダウンから検証対象を指定します。対象例は「Status code」「Header」、JSON 形式のボディ、テキスト形式のボディなどです。<br/>
- 2 つ目のドロップダウンで比較演算子を選択します。<br/>
- 3 つ目の入力欄に比較する値を入力します。値には波括弧なしでパラメーターを指定することもできます。<br/>
- 追加の Assertion を設定したい場合は同じ手順で行を追加し、左のチェックボックスで有効／無効を切り替えます。<br/>

![API テストのスクリーンショット](/images/advanced-features/api-testing/9c95b25-assertions.png)

12. Assertion では表現しきれない複雑な検証や追加処理（失敗時にカスタムエラーメッセージを投げるなど）を行いたい場合は、**Run additional code on request results** をオンにします。ここではレスポンス結果を受け取って任意の JavaScript コードを実行できます。パラメーターも利用可能で、詳しくは後述の Using Parameters を参照してください。

![API テストのスクリーンショット](/images/advanced-features/api-testing/a99b5db-run_additional_code.png)

13. **Show step properties** をクリックして、ステップのプロパティパネルを開きます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/bc9b3fc-showstepproperties.png)

14. **Properties** パネルの **Send via web page** チェックボックスでは API 呼び出しの実行コンテキストを制御できます。
    - チェックを外す – ブラウザコンテキストの外側から API を送信します。ブラウザの制限（CORS など）を避けたい場合に有効です。
    - チェックを付ける – ブラウザ情報（Cookie など）も含めて送信したい場合に使用します（Cookie は自動的に送信されます）。

![API テストのスクリーンショット](/images/advanced-features/api-testing/3cf1b19-properties.png)

15. **Allow API request retry** では、リクエストが失敗した場合に再送を行うかどうかを制御します。
16. チェックを付ける – リクエスト自体が失敗したとき（エラーステータスコードのとき）のみ再送を行います。
17. チェックを外す – ステータスコードがエラーであっても再送は行わず、検証と追加コードの実行に進みます。例えば「エラーコードであること」を Assertion で期待している場合などに有用です。
18. **Params** フィールドでは、後述の [Using Parameters](/docs/advanced-editing/api-testing#using-parameters-in-the-sent-http-request) で利用するパラメーターを定義します。

:::note
テストをブラウザ経由で実行していて、直前のステップでページの読み込みが完了していない場合、このステップは失敗することがあります。前のステップでページロードが発生する場合は、API ステップの前に [wait for](/docs/advanced-editing/wait-for) ステップを追加し、ページの読み込み完了を確認してください。
:::

## AUT コンテキスト外でリクエストを試す

テストを実行せずに AUT（対象アプリ）のコンテキスト外で素早くリクエストだけを試したい場合は、**URL** フィールドの **Send** ボタンを使います。このとき **Run additional code on request results** に記述したコードやアサーションは実行されません。\
送信されるのは **Properties** パネルで定義したローカルパラメーターのうち、静的な値のみです。動的な値は空文字として扱われます。\
使用可能なステップパラメーターは URL フィールドの下に一覧表示され、**Edit** をクリックすると **Properties** パネルで編集できます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/b763cb7-image_13.png)

:::note
このリクエストはアカウントの使用量（クォータ）にはカウントされません。\
また、このレスポンスは一時的なもので、ステップを閉じると内容はクリアされます。
:::

## Adding an API Action Step

API アクションステップ（Add API action）は、レスポンスを利用した追加処理を行う用途で使用します。返却されたデータを計算に用いたり、後続ステップで再利用するためにエクスポートパラメーターとして保存したりできます。ヘッダー／ボディ／ステータスコードのいずれの情報も活用可能です。\
**Add API action ステップを追加するには:**

![API テストのスクリーンショット](/images/advanced-features/api-testing/437b054-apiaciton.gif)

1. 追加したい位置の （矢印）または最後のステップ後ろの **+** にカーソルを合わせます。
2. “M”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。
3. **Actions** をクリックします。\
   **Actions** メニューが展開されます。
4. 一覧から **Add API action** を選択します。

:::note
上部の検索ボックスで **Add API action** を検索して選択することもできます。
:::

**Add Step** ウィンドウが表示されます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/01b1c12-Picture1.png)

5. 上記「Validate API ステップの追加」の **手順 5〜13** に従って、URL ・ヘッダー・ボディ・ Assertion などを設定します（ただし目的は「検証」ではなく「応答データの利用」になります）。
6. レスポンスデータを使った追加処理（パラメーター抽出、DB 接続のクローズなど）を行う場合は、**Run additional code on request results** をオンにします。ここではレスポンスのステータスコード、レスポンスヘッダー、レスポンスボディなどを参照して任意の JavaScript コードを実行できます。レスポンスボディが XML/JSON の場合はオブジェクト、それ以外は文字列として渡されます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/5d3302a-image_2.png)

7. 残りのプロパティ（送信コンテキストやリトライ設定、Params など）は、「Validate API ステップの追加」の **手順 14〜16** を参照して設定します。

:::note
ブラウザ経由で実行しており、直前のステップでページの読み込みが終わっていない場合、このステップは失敗することがあります。前のステップでページロードが必要な場合は、API ステップの前に wait for ステップを挿入し、ページの読み込み完了を確認してください。
:::

## Including a File and/or Text field with an API Call Using Form Data

Validate API / Add API action ステップでは、フォームデータを使ってファイルやテキストフィールドを API に含めることができます。\
**API 呼び出しにファイルを含めるには:**

1. 対象テストで Validate API または API Action ステップを追加します（前述手順参照）。
2. ステップの **Body** セクションで **Form Data** エントリタイプを選択します。

![API テストのスクリーンショット](/images/advanced-features/api-testing/f021f36-api-testing-1.jpg)

3. エントリタイプとして **File** を選択します。

![API テストのスクリーンショット](/images/advanced-features/api-testing/aa68d56-api-testing-2.jpg)

Testim はヘッダーの **Content-Type** を自動的に `multipart/form-data` に更新します。

![API テストのスクリーンショット](/images/advanced-features/api-testing/c433a90-api-testing-3.jpg)

:::warning{title="注意"}
ファイルを送信できるのは **Post** HTTP メソッドのみです。
:::

4. ファイル名を受け取る **Key** 名を入力します。

![API テストのスクリーンショット](/images/advanced-features/api-testing/b5a918f-api-testing-4.jpg)

5. **Upload File** ボタンをクリックし、ローカルマシンからファイルを選択してアップロードします。

![API テストのスクリーンショット](/images/advanced-features/api-testing/09a8669-api-testing-5.jpg)

:::warning{title="注意"}
Key 名またはファイルのどちらかが指定されていない場合、そのエントリはテスト実行時の API 呼び出しから自動的に除外されます。
:::

アップロードされたファイルはテストサーバーに保存され、テスト実行時にそのファイルが API 呼び出しの一部として送信されます。

:::warning{title="注意"}
アップロードできるファイルサイズは最大 25MB です。これを超えるファイルをアップロードしようとすると、Testim がバリデーションエラーを表示し添付をブロックします。
:::

**API 呼び出しにテキストフィールドを含めるには:**

1. 対象テストで Validate API または API Action ステップを追加します。
2. ステップの **Body** セクションで **Form Data** エントリタイプを選択します。
3. エントリタイプとして **Text** を選択します。
4. テキストフィールドの **Key** 名を入力します。
5. テキストフィールドの **Value** を入力します。

![API テストのスクリーンショット](/images/advanced-features/api-testing/428ba6a-Picture1.png)

設定した key:value のペアは保存され、テスト実行時に API リクエストと一緒に送信されます。

## Cancel a File Upload in Progress

アップロード中のファイルを途中でキャンセルすることもできます。\
**アップロード中のファイルをキャンセルするには:**

1. アップロード中のエントリの右側にある **“X”** をクリックします。

![API テストのスクリーンショット](/images/advanced-features/api-testing/e72c0ab-api-testing-6.jpg)

Testim がファイルのアップロードをキャンセルし、別のファイルを再度アップロードできる状態になります。

![API テストのスクリーンショット](/images/advanced-features/api-testing/e25b412-api-testing-7.jpg)

## Replace a File Attachment

既存エントリに添付済みのファイルを別のファイルに差し替えることもできます。\
**ファイル添付を別のファイルに置き換えるには:**

1. 既存のファイルが添付されているエントリの **“X”** をクリックします。

![API テストのスクリーンショット](/images/advanced-features/api-testing/0428c1c-api-testing-8.jpg)

2. **Upload File** ボタンをクリックし、新しいファイルを選択してアップロードします。

![API テストのスクリーンショット](/images/advanced-features/api-testing/0c81dc9-api-testing-5.jpg)

## Exclude or Delete an Entry from the Body Section

Body セクションに定義したエントリは、一時的に無効化したり完全に削除したりできます。
**API 呼び出しからエントリだけ除外するには:**

1. テストから除外したいエントリの左側にあるチェックボックスをオフにします。

![API テストのスクリーンショット](/images/advanced-features/api-testing/de72f68-api-testing-10.jpg)

テスト実行時、そのエントリはリクエストから除外されますが、定義自体は残るため、あとから再度有効化できます。\
**Body セクションからエントリを完全に削除するには:**

1. 削除したい Body エントリ右側の **“X”** をクリックします。

![API テストのスクリーンショット](/images/advanced-features/api-testing/e7fea88-api-testing-9.jpg)

エントリは完全に削除されます。

## パラメーターの使用 {#using-parameters}

API ステップでは他のコードステップと同様にパラメーターを利用できます。送信する HTTP リクエストの URL・ヘッダー・ボディへパラメーターを埋め込んだり、レスポンスから値を取り出して保存したり、アサーションの比較値として使用したりできます。パラメーターは入力値（依存性注入）として受け取れるほか、`exports` や `exportsGlobal` を使って出力値としてエクスポートすることもできます。テストスコープ内の他の変数も参照可能です。\
パラメーター全体の詳細は [Parameters](/docs/advanced-editing/parameters) を参照してください。

:::note
配列パラメーターは `array.0.name` のような形式で参照できます。
:::

:::note
API ステップ内の各入力セクションでは、複雑な式はサポートされていません。
:::

## 送信する HTTP リクエストでのパラメーター利用 {#using-parameters-in-the-sent-http-request}

パラメーターは、送信する HTTP リクエストのヘッダー／ボディ／URL に埋め込めます。これらのセクションは純粋な JS で書くと煩雑になるため、Testim ではパラメーターを「二重／三重の波括弧」で簡単に埋め込めるようになっています。

### Body へのパラメーター追加

パラメーターの値をエンコードせずそのまま埋め込みたい場合は、三重波括弧を使います（例: `{{{param}}}`）。

![API テストのスクリーンショット](/images/advanced-features/api-testing/59f09c0-Picture2.png)

### URL へのパラメーター追加

テストの Base URL と同じホストにある API に対して呼び出しを行いたい場合は、URL 全体を記述する代わりに `{{{BASE_URL}}}` パラメーターを使えます。URL フィールドで `{{{BASE_URL}}}` の後ろにパスを続けて入力してください。ここでもパラメーターをエンコードしたくない場合は三重波括弧を使用します（例: `{{{param}}}`）。

![API テストのスクリーンショット](/images/advanced-features/api-testing/753553d-image_5.png)

### Header へのパラメーター追加

ヘッダーにパラメーターを入れる場合も同様で、値をエンコードしたくない場合は `{{{param}}}` のように三重波括弧を使用します。

![API テストのスクリーンショット](/images/advanced-features/api-testing/82b5c47-image_3.png)

## HTTP レスポンスでのパラメーター利用

Properties パネルで追加したパラメーターは、API ステップ内のコードの関数シグネチャに自動的に追加されます。これにより、レスポンスを処理するコード内でパラメーターを直接利用できます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/eb87221-image_9.png)

## Assertion でのパラメーター利用

Assertion セクションでも、比較値としてパラメーターをそのまま使用できます。この場合、値には波括弧を付ける必要はありません。

![API テストのスクリーンショット](/images/advanced-features/api-testing/bb8290c-image_8.png)

![API テストのスクリーンショット](/images/advanced-features/api-testing/7004c0f-Screen_Shot_2022-03-09_at_15.08.34.png)

## 実行後の結果の確認

ステップ実行後は、**Response** タブで API レスポンスを確認できます。ここでは、レスポンスボディだけでなく、ステータスコードやリクエスト時間、バイナリファイルのサイズなどの追加情報も表示されます。また、送信されたリクエスト内容を確認したり、レスポンス情報をダウンロードしたりすることもできます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/a311eec-image_10.png)

**Response** タブでは次の機能が利用できます。

- **View Sent Request** – クリックすると送信されたリクエストの完全な内容を表示するウィンドウが開きます。パラメーターは実際の値に展開された状態で表示されます。この画面からレスポンス情報を JSON として **ダウンロード** したり、内容をクリップボードに **コピー** したりできます。

![API テストのスクリーンショット](/images/advanced-features/api-testing/e6c16b6-image_11.png)

- **Download the response info** – **View Sent Request** の右側にあるダウンロードボタンをクリックすると、レスポンス全体を含んだ JSON ファイルをローカルにダウンロードできます。
- **Assertion response** – Assertion を設定している場合、それぞれの Assertion の横に次のいずれかの結果が表示されます。
  - **Passed** – 条件が TRUE になり、Assertion が成功したことを示します。
  - **Failed** – 条件が FALSE となり、Assertion が失敗したことを示します。この場合ステップは失敗し、テスト全体も失敗となります。

![API テストのスクリーンショット](/images/advanced-features/api-testing/639898e-image_12.png)

**Usage examples** - 具体的な使用例は [こちら](https://app.testim.io/#/project/GYXR2qZC/branch/master/automate/tests/97auidmCzzUtZuoQ) を参照してください。

**Troubleshooting** - よくあるエラーと対処方法は [こちら](/docs/results/test-results/why-did-my-test-fail#13-api-step-failed) を参照してください。
