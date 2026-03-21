---
title: メール検証
description: Testim の組み込みメールサービスを使用してメール受信を検証するステップ。サインアップやログインフローのメール確認テストに利用できる PRO機能です。
category: 高度な編集
order: 5010
updated: '2025-09-23'
sourceUrl: 'https://help.testim.io/docs/email-validation'
keywords:
  - メール検証
  - E メール
  - サインアップ
  - ログイン
  - メールボックス
  - 受信確認
  - テスト用メール
  - 認証フロー
  - ユーザー登録
  - Testim 受信箱
---

サインアップとログインフローを検証する

Testim は、恒久的および一時的なメールアドレスを提供する組み込みメールサービスを備えています。_Validate email_ ステップを使用すると、これらのメールアドレスにメールが送信されたことを検証できます。このステップは通常、アプリのサインアップまたはログインフローをテストするために使用されます。

:::note{title="これはPRO機能です"}
これは Professional plan のプロジェクトでのみ利用可能な PRO機能です。
:::

_Validate email_ ステップは、指定された Testim メールアドレスの Testim 受信箱の内容を、そのメールボックス内のすべてのメッセージの配列として受け取る事前定義された検証ステップです。メッセージは _messages_ という名前のパラメーターに含まれ、次のフィールドを持ちます：

<table class="md-table md-table-2cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    Field name
   </th>
   <th style="text-align: left;">
    Return type
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    attachments
   </td>
   <td style="text-align: left;">
    <a href="http://ews-javascript-api.github.io/api/classes/complexproperties_attachmentcollection.attachmentcollection.html">
     AttachmentCollection
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    from
   </td>
   <td style="text-align: left;">
    <a href="http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddress.emailaddress.html">
     EmailAddress
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    to
   </td>
   <td style="text-align: left;">
    <a href="http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddresscollection.emailaddresscollection.html">
     EmailAddressCollection
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    subject
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    date (time sent)
   </td>
   <td style="text-align: left;">
    Date
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    received_date
   </td>
   <td style="text-align: left;">
    Date
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    message_id
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    headers
   </td>
   <td style="text-align: left;">
    <a href="http://ews-javascript-api.github.io/api/classes/complexproperties_internetmessageheadercollection.internetmessageheadercollection.html">
     InternetMessageHeaderCollection
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    html
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    text
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    mail_from
   </td>
   <td style="text-align: left;">
    <a href="http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddress.emailaddress.html">
     EmailAddress
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    rcpt_to
   </td>
   <td style="text-align: left;">
    <a href="http://ews-javascript-api.github.io/api/classes/complexproperties_emailaddresscollection.emailaddresscollection.html">
     EmailAddressCollection
    </a>
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    size
   </td>
   <td style="text-align: left;">
    number
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    projectId
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    email
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    expire_at
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    created_at
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    updated_at
   </td>
   <td style="text-align: left;">
    string
   </td>
  </tr>
 </tbody>
</table>

メール検証では、次の 2 種類のメールアドレスのいずれかを使用して、検証対象のメールを受信できます：

- **恒久的メール** - Testim は、ログインフローやパスワードリセットフローのテストなど、さまざまな目的で使用できる恒久的なメールアドレスを提供します。テストの一環として、このメールアドレスを **Validate Email** ステップに追加することで、メールアドレスにメールが送信されたことを検証できます。このステップは、恒久的メールアドレスでメールが受信されたことを検証します。例えば、メールからリンクを取得してエクスポートします。
- **一時的メール** - テストを実行するたびに新しいランダムなメールアドレスを生成する必要がある場合があります。例えば、サインアップフローを毎回新しいユーザーでテストする場合などです。**Generate email address** ステップを使用すると、実行のたびに新しいメールアドレスが生成されます。**Generate email address** ステップを設定して、一時的メールアドレスをパラメーターとして保存します。その後、このパラメーターを **Validate Email** ステップに追加することで、一時的メールアドレスにメールが送信されたことを検証できます。**Validate Email** ステップは、一時的メールアドレスでメールが受信されたことを検証します。例えば、メールからリンクを取得してエクスポートします。

メールを検証する準備段階として、**恒久的メール**を作成するか、**Generate email address ステップ**を使用して一時的メールアドレスを次のように生成します。

:::note
Testim は独自のメールサービスを通じて専用にメールアドレスを生成しており、サードパーティのメールサービスを利用して恒久的または一時的メールアドレスを作成する機能はありません。
:::

## オプション A - 恒久的メールアドレスの作成

このプロセスは、**Validate email** ステップを含む既存または新規のテストがあることを前提としています。

**恒久的メールを作成するには：**

1. 左メニューで **Settings** アイコンをクリックします。

![設定アイコン](/images/validations/email-validation/87c09ff-settings.png)

2. **Email Service** タブをクリックします。

![メールサービスタブ](/images/validations/email-validation/a11da76-emailservice.png)

3. **Generate Email Address** ボタンをクリックします。

![メールアドレス生成ボタン](/images/validations/email-validation/16ade5a-213f19a-Testim_293a.png)

4. ランダムなメールアドレスが生成され、ページに表示されます。メールアドレスにマウスを合わせ、**Copy** をクリックしてメールアドレスをコピーするか、**Inbox** をクリックしてメールの受信箱を表示します。

![コピーボタン](/images/validations/email-validation/b1096f1-caa2097-Testim_295_r.png)

## テストの関連ステップで恒久的メールを使用する

このメールアドレスはテストの入力として使用できます。例えば、サインアッププロセスを検証するテストでは、ユーザーがメールアドレスとパスワードを入力し、その後メールを確認/検証するためにクリックする必要があるリンクを含むメールを受信します。この例では、ユーザーがメールアドレスを入力するサインアップステップで恒久的メールアドレスが使用されます。

以下の例では、ユーザーがメールフィールドにメールアドレスを入力する **Set text** ステップの **Text to assign** フィールドに恒久的メールアドレスが入力されています。

![サインアップフロー](/images/validations/email-validation/ee9773d-signupflow.png)

## オプション B - 一時的メールアドレスの生成

このプロセスは、**Generate email address** と **Validate email** ステップを含む既存または新規のテストがあることを前提としています。

## Generate Email Address ステップの追加

このステップでは、一時的メールアドレスを生成し、そのアドレスを他のステップで使用するための変数として保存するステップを追加します。

**一時的メールアドレスを生成するには：**

1. ステップを追加したい位置の **（矢印記号）** にカーソルを合わせます。

![ステップ追加](/images/validations/email-validation/856a8f8-Testim_298a.png)

アクションのオプションが表示されます。

![アクションオプション](/images/validations/email-validation/fd77ed2-Testim_283a_r.png)

2. “**M**”（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![ステップ選択](/images/validations/email-validation/0ab4994-Testim_270_r2.png)

3. **Actions** をクリックします。  
   **Actions** メニューが展開されます。

![メールアドレス生成設定](/images/validations/email-validation/4502efd-Testim_299_r.png)

4. メニューをスクロールして **Generate email address** を選択します。

:::note
メニュー上部の検索ボックスで検索することもできます。
:::

**Editor** に "Generate email address" ステップが追加されます。

5. 新しく作成されたステップにカーソルを合わせ、**Show Properties** アイコンをクリックします。

![ステップ追加位置](/images/validations/email-validation/fb10c5b-Testim_300a.png)

右側に **Properties** パネルが表示されます。

![変数名設定](/images/validations/email-validation/4952255-Testim_301_r.png)

6. **Variable name** フィールドに、一時的メールアドレスを保持する変数の名前を入力します。例えば、`emailAddress` という値を使用します。
7. **Variable scope** フィールドで、変数を渡せるスコープを指定します：
   1. **Local**: 同じスコープ内のステップ間で _emailAddress_ パラメーターを渡すことができます。_これがデフォルトです_。
   2. **Test**: 同じテスト内のステップとグループ間で _emailAddress_ パラメーターを渡すことができます。
   3. **Suite**: 同じテストスイート内のテスト間で _emailAddress_ パラメーターを渡すことができます。
8. 必要に応じて、ステップとパラメーターの追加設定を行います。
9. **variable name** フィールドのパラメーター名をコピーします（例：`emailAddress` という名前）。このパラメーターは **Email Validation** ステップで使用されます。

## 事前に適切な Testim 受信箱にメールを送信する

この時点では、恒久的または一時的な受信箱にメールはありません。新しい受信箱でメールが受信されていることをテストするために、メールサービスが新しく作成した受信箱にメールを送信するよう設定することができます。

## 受信箱のメールアドレスを見つける

### 恒久的メールアドレスオプション

**恒久的メールアドレスを見つけるには：**

1. **Settings > Email Service** に移動します。  
   恒久的メールアドレスが表示されます。  
   ![設定アイコン](/images/validations/email-validation/3b33312-emailaddresses.png)

2. 関連するメールにカーソルを合わせ、**Copy** をクリックします。  
   ![コピーボタン](/images/validations/email-validation/bb1c588-emailaddresses2.png)

### 一時的メールアドレスオプション

一時的メールアドレスオプションの場合、**Generate email address** ステップを使用することで、実行のたびに新しいメールアドレスが生成されます。**Generate email address** ステップを設定して、一時的メールアドレスをパラメーターとして保存します。例えば、次の **Generate email address** ステップでは、一時的メールアドレスを保持するパラメーターは `tempEmail` と呼ばれています。この一時的メールアドレスを保持するパラメーターは、例えば Testim の API ステップを使用して、メールサービスにメールアドレスを送信するために使用できます。

![メールアドレス生成ボタン](/images/validations/email-validation/a0c8558-tempEmail.png)

Email Service 画面から一時的メールアドレスを表示およびコピーすることも可能です。

**一時的メールアドレスを見つけるには：**

1. **Settings > Email Service** に移動します。  
   一時的メールアドレスはタイトルに "Temporary" とマークされています。  
   ![設定アイコン](/images/validations/email-validation/f061421-image_1.png)

2. 関連するメールにカーソルを合わせ、**Copy** をクリックします。  
   ![コピーボタン](/images/validations/email-validation/18ef3a0-image_2.png)

## Run API Action ステップの使用

Run API Action ステップを使用して、一時的/恒久的メールアドレス情報をメールサービスに送信し、サービスを呼び出してこのメールアドレスにメールを送信することができます。

次のテスト例には **Generate email address** ステップが含まれており、一時的メールアドレスを生成し、このメールアドレスを `emailAddress` というパラメーターとして保存します。

![メールアドレス生成ボタン](/images/validations/email-validation/a86cebf-image.png)

![画像](/images/validations/email-validation/5973c2a-image_1.png)

**Generate email address** ステップの後に、**Run API Action** ステップがあります。このステップはメールサービスに POST API 呼び出しを送信し、**Generate email address** ステップで定義された `emailAddress` パラメーターを入力として使用し、コード内の `toAddress` パラメーターで定義されている宛先メールアドレスを設定します。

![メールアドレス生成ボタン](/images/validations/email-validation/e2ae339-image_2.png)

## 任意のメールサービスを通じたメール送信

メールサービスを通じて、恒久的/一時的メールアドレスに直接メールを送信することもできます。

## Validate Email ステップの作成

このテストの一環として、**Validate email ステップ**を追加することで、メール（例：サインアップ確認）が恒久的または一時的メールに送信されたことを確認します。

Validate email ステップを設定する方法は 2 つあります：

- **Coded** - JavaScript コードを使用して、例えばメール受信箱に関連するメールが含まれているかを確認し、またコードでこのメールからリンクをエクスポートすることができます。
- **Codeless** - UI から設定を構成し、さまざまな可能な条件に基づいて関連するメールを特定し、メールからリンクまたはテキストをエクスポートできるようにステップを設定します。

## Coded オプションを使用した Validation Email ステップの作成

**validate email ステップを作成するには：**

1. ステップを追加したい位置の **（矢印記号）** にカーソルを合わせます。

![検証ステップ追加](/images/validations/email-validation/e4b6b3d-Testim_302a.png)

アクションのオプションが表示されます。

![アクションオプション](/images/validations/email-validation/cbc623c-Testim_283a_r.png)

2. “**M**”（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![ステップ選択](/images/validations/email-validation/408099e-Testim_270_r2.png)

3. **Validations** をクリックします。\
   **Validations** メニューが展開されます。

![メール検証設定](/images/validations/email-validation/056be62-Testim_303_r.png)

4. メニューをスクロールして **Validate email** を選択します。

:::note
メニュー上部の検索ボックスで検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![パラメーター設定](/images/validations/email-validation/667ffe5-Testim_215_r.png)

5. **Name the new step** フィールドに、このステップの（意味のある）名前を入力します。

6. これがこのテストまたは他のテストで再利用できるようにする共有ステップである場合は、**Shared step** の隣のボックスを選択したまま（デフォルト）にし、**Select shared step folder** リストからこのステップを保存するフォルダーを選択します。そうでない場合は、チェックボックスの選択を解除します。  
   共有ステップの詳細については、[Groups](/docs/groups)を参照してください。

7. **Create Step** をクリックします。

8. **Coded** タブをクリックします。  
   ![コード化タブ](/images/validations/email-validation/fa0a6bb-coded.png)

   **function** エディターが開き、右側に **Properties** パネルが開きます。

9. 次のいずれかを実行します：  
   **恒久的メールオプションの場合** - 恒久的メールアドレスをコピーし、**Email address** フィールドに貼り付けます。このメールアドレスはシングルクォートまたはダブルクォートで囲む必要があります。

![コピーボタン](/images/validations/email-validation/9489320-emailaddressfield.png)

**一時的メールオプションの場合** -

**Generate email address** ステップで定義した **Variable name** パラメーターの名前を **Email address** フィールドに入力します。  
![メールアドレス生成ボタン](/images/validations/email-validation/3bfe619-image.png)

:::warning
**Email address** フィールドは必須です。
:::

10. 必要に応じて、ステップとパラメーターの追加設定を行います。
11. **function** テキストボックスに、希望する JavaScript コードを入力します。パラメーターを定義している場合は、JavaScript コード内でそれらのパラメーターを参照できます。メールを検証するさまざまな方法については、以下の [Email validation examples](/docs/email-validation#email-validation-examples) セクションを参照してください。コードは通常、Email address フィールドに入力された値をコード内のパラメーターとして使用します。

:::note
HTML パラメーター以外の DOM セレクタ（例：jQuery）を使用している場合、空の配列は truthy であるため、`$(<query>)` の代わりに `$(<query>).length` を使用する必要があります。
:::

12. 左上の戻る矢印でエディターに戻ります。

![戻るボタン](/images/validations/email-validation/b4b8e1e-back.png)

:::note
AUT を開いて HTML 要素をパラメーターとして定義した場合は、**Toggle Breakpoint** ボタンをクリックしてブレークポイントを削除します。
:::

ステップが作成されます。

### Coded メール検証の例

#### サインアップ件名の検証

_Validate email_ ステップを使用して、アプリが生成して Testim 生成メールアドレスに送信したメールの件名の内容を検証できます。

![メール検証コード例](/images/validations/email-validation/120320e-Testim_306.png)

**Example Code:**

```javascript
// Check if messages variable is falsy or if messages[0] is falsy
if (messages && messages[0]) {
  // If either condition is true, throw an error
  return messages[0].subject === 'Thank you for signing up';
}
return false;
```

#### 本文内のリンクを検証する

_Validate email_ ステップを使用して、メールの本文内のハイパーリンクを検索し、見つかった各リンクのテキストコンポーネントとリンクコンポーネントを返すことができます。

![メール検証結果](/images/validations/email-validation/df541fc-Testim_307.png)

**Example Code:**

```javascript
if (!messages && !messages[0]) {
  throw new Error('Failed to find message in inbox ');
}
// Define a function named getLinks which takes an HTML string as input
function getLinks(html) {
  // Create a DOMParser object to parse HTML strings
  var parser = new DOMParser();
  // Parse the HTML string into a DOM document
  var doc = parser.parseFromString(html, 'text/html');
  // Find all anchor elements in the document
  var linksElements = Array.from(doc.querySelectorAll('a'));
  // Map over the array of anchor elements and extract their text and href attributes
  return linksElements.map((linkElement) => ({
    // Return an object with text and link properties
    text: linkElement.innerText,
    link: linkElement.getAttribute('href'),
  }));
}
// Call the getLinks function with the HTML content of the first message
var emailLinks = getLinks(messages[0].html);
//Exports the first link in the array to the next test steps
exportsTest.emailLink = emailLinks[0];
```

## Codeless オプションを使用した Validate Email ステップの作成

**validate email ステップを作成するには：**

1. ステップを追加したい位置の **（矢印記号）** にカーソルを合わせます。

![検証ステップ追加](/images/validations/email-validation/e4b6b3d-Testim_302a.png)

アクションのオプションが表示されます。

![アクションオプション](/images/validations/email-validation/cbc623c-Testim_283a_r.png)

2. “**M**”（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![ステップ選択](/images/validations/email-validation/408099e-Testim_270_r2.png)

3. **Validations** をクリックします。\
   **Validations** メニューが展開されます。

![メール検証設定](/images/validations/email-validation/056be62-Testim_303_r.png)

4. メニューをスクロールして **Validate email** を選択します。

:::note
メニュー上部の検索ボックスで検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![パラメーター設定](/images/validations/email-validation/667ffe5-Testim_215_r.png)

5. **Name the new step** フィールドに、このステップの（意味のある）名前を入力します。

6. これがこのテストまたは他のテストで再利用できるようにする共有ステップである場合は、**Shared step** の隣のボックスを選択したまま（デフォルト）にし、**Select shared step folder** リストからこのステップを保存するフォルダーを選択します。そうでない場合は、チェックボックスの選択を解除します。  
   共有ステップの詳細については、[Groups](/docs/groups)を参照してください。

7. **Create Step** をクリックします。  
   ![コードレス画面](/images/validations/email-validation/873ab96-codeless_screen.png)

8. **Email Filters** の下で、有効にしたい条件タイプのチェックボックスを選択して、受信箱内のメールを特定する条件を指定します。これらの条件すべてに一致するメール（つまり AND 条件）が検証されてステップが成功します。受信箱内のメールがこれらの条件のいずれにも一致しない場合、ステップは失敗します。すべての条件はオプションですが、少なくとも 1 つの条件を有効にする必要があります：
   1. **Time range** - 受信箱で受信したメールの時間範囲を分単位で指定します。例えば、30 と入力すると過去 30 分間に受信したメールをスキャンします。
   2. **Expected subject** - メールの件名に含まれるべきテキストまたはテキストの一部を入力します。これは部分一致でも構いません。テキストフィールドには、例えば `{{param1}}` のようにスコープ内のパラメーターを含めることができます。
   3. **Expected body** - メールの本文に含まれるべきテキストまたはテキストの一部を入力します。これは部分一致でも構いません。テキストフィールドには、例えば `{{param1}}` のようにスコープ内のパラメーターを含めることができます。

9. **Email text extraction** の下で、メールフィルタによって一致したメールの本文からオプションで抽出するものを指定します。これはメールからのテキストまたはリンクのいずれかです。例えば、メールに SMS コードのようなコードが含まれている場合、この機能を使用してこのコードを抽出できます。抽出されたテキストとリンクは、実行後にステップ結果に表示されます。すべてのリンクは、抽出設定に関係なく自動的に抽出されます：
   1. チェックボックスを選択して有効にします。
   2. 次のいずれかを選択します：
      1. **Location** - 抽出されるテキストの位置に基づいて抽出条件を設定する場合は、このオプションを選択します。
      2. **Regex** - メールから抽出するテキストを定義する条件として正規表現を入力する場合は、このオプションを選択します。

         :::note
         このセクションのエントリは大文字と小文字を区別します。
         :::

   3. **Location** オプションを選択した場合は、次のいずれかを選択します：
      1. **Extraction between** - 最初のフィールドのテキストと 2 番目のフィールドのテキストの間にあるテキスト/リンクを抽出する場合に選択します。最初と 2 番目のフィールドに文字列を入力して、開始位置（その後からテキストが抽出される）と終了位置（その前までテキストが抽出される）を定義します。
      2. **Extraction from** - フィールドのテキストからメールの終わりまでのテキスト/リンクを抽出する場合に選択します。フィールドに文字列を入力して開始位置（その後からテキストが抽出される）を定義します。
      3. **Extraction until** - メールの開始からフィールドのテキストまでのテキスト/リンクを抽出する場合に選択します。最初のフィールドに文字列を入力して終了位置（その前までテキストが抽出される）を定義します。

         テキストフィールドには、例えば `{{param1}}` のようにスコープ内のパラメーターを含めることができます。

   4. **Regex** オプションを選択した場合は、フィールドにテキスト抽出用の regex 条件を入力します。regex 条件の使用例を確認するには、[こちらをクリック](https://www.sitepoint.com/demystifying-regex-with-practical-examples/)してください。

10. メールフィルタと抽出を検証する場合：
    1. **Verification email inbox address** セクションの下で、フィールドをクリックし、恒久的メールアドレスのいずれかを選択します。
    2. **Verify Email Filters** をクリックします。  
       テスト実行を見るとき、ステップをドリルダウンした後、次のペインが右側に表示されます。このペインには、指定された受信箱でキャプチャされたメールに関する情報（送信者、抽出されたテキスト、キャプチャされたリンクなど）が表示されます。  
       ![受信箱ボタン](/images/validations/email-validation/74073d1-verify.png)

11. 次のいずれかを実行します：  
    **恒久的メールオプションの場合** - 恒久的メールアドレスをコピーし、**Email address** フィールドに貼り付けます。このメールアドレスはシングルクォートまたはダブルクォートで囲む必要があります。  
    ![コピーボタン](/images/validations/email-validation/55551bf-image_3.png)

    **一時的メールオプションの場合** -  
    **Generate email address** ステップで定義した **Variable name** パラメーターの名前を **Email address** フィールドに入力します。  
    ![メールアドレス生成ボタン](/images/validations/email-validation/d50b959-image_4.png)

12. 必要に応じて、ステップとパラメーターの追加設定を行います。

13. ペインを閉じ、戻るをクリックしてテストを表示し、**Save** をクリックして変更を保存します。

14. 必要に応じて、ステップとパラメーターの追加設定を行います。

ステップが作成されます。

### エクスポートパラメーター

ステップが作成されると、メール検証ステップの後に配置された他のステップで使用できる 3 つのエクスポートパラメーターが提供されます：

- `emailData` - フィルタされたメール内のすべてのパラメーターを含みます
- `emailExtractedText` - オプションで抽出されたテキストを含みます
- `emailExtractedLinks` - オプションで抽出されたリンクの配列を含みます。  
  `emailExtractedLinks` は配列です。配列内のエントリにアクセスするには、`emailExtractedLinks[n]` を使用します。`0` は最初のエントリを表します。
