---
title: Cookie（クッキー）
description: 専用ステップやカスタムコード、設定ファイルを使ってテスト内でブラウザクッキーを設定・取得する方法を説明します。
category: 高度な編集
order: 5051
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/cookies'
keywords:
  - クッキー
  - Cookie ステップ
  - Set Cookie
  - Get Cookie
  - テストデータ
  - カスタムアクション
  - 設定ファイル
  - セッション管理
  - 認証
  - テスト自動化
---

ブラウザクッキーの取得と設定

:::note{title="Cookie とは"}
Web サイトから送信されブラウザに保存される小さなデータです。用途は多岐に渡りますが、テスト自動化ではログインフロー全体を踏まずに Cookie を直接設定して認証を高速化する、といった使い方が可能です。
:::

Testim では複数の方法で Cookie の設定（set）と取得（get）が可能です。 Cookie を「設定」すると、属性値がブラウザに書き込まれます。「取得」すると、ブラウザ内の Cookie 値を取り出して変数に代入できます。\
Cookie を扱う代表的な方法:

* Cookie ステップ — Cookie 用の専用ステップを利用します。
  * Set Cookie — テストで使用する Cookie を定義する新規ステップ。*HttpOnly* や *Secure* Cookie の作成はこのステップ推奨。
  * Get Cookie — AUT のブラウザから Cookie を取得してパラメーターに保存。以降のステップ（Set Cookie を含む）で参照可能。
* Setup ステップの「 Test Data 」— 特定のテストでページ読込前に Cookie を読み込ませたい場合に使用。 Cookie のドメイン追加はこの Test Data で行うのが推奨。
* カスタム JS ステップ — テスト開始時でなくても良い場合に、任意の箇所で set/get を行う。
* 設定ファイル＆実行フック — CLI 実行時に設定ファイル経由で Cookie を設定。スイート全体で必要な場合に有効。注: CLI から Cookie を「取得」することはできません。

## Cookie を設定する

Cookie の値は、手入力または Get Cookie で取得したパラメーターから設定できます。

### Set Cookie ステップで設定

**Set Cookie** ステップは、テストの UI から直接 Cookie を設定します。属性を手入力するか、**Get Cookie** で取得したパラメーターを利用します。

**属性を直接入力して Cookie を設定するには:**

1. 追加したい位置の （矢印）にカーソルを合わせます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/9a4e48a-Testim_201a.png)

アクションオプションが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/d3b6f5e-Testim_202a_r.png)

2. “**M**”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/42edd22-Testim_203_r.png)

3. **Actions** をクリックします。\
   **Actions** メニューが展開されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/bab0fb0-Testim_204_r.png)

4. 下にスクロールして **Set Cookie** を選択します。

:::note
上部の検索ボックスで **Set Cookie** を検索して選択することもできます。
:::

**Set Cookie** 画面が表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/fd880f8-Testim_205_r.png)

5. **Create new Cookie** ラジオボタンが選択されていることを確認します（既定値）。
6. 最初の 4 つの **Cookie Info** フィールドに値を入力します。

* **Cookie name** – Cookie 名（必須）。
* **Cookie value** – 設定したい値（必須）。
* **Domain** – Cookie を送信するホスト。空欄（既定）の場合はテストが実行されている Base URL が使用されます（任意）。
* **Path** – リクエスト URL に含まれている必要があるパス。空欄（既定）はルートディレクトリを意味します（任意）。

:::note
文字列はシングルクォートまたはダブルクォートで囲む必要があります。
:::

7. **Expires (Max-Age)** フィールドで有効期限を選択します（既定値は session）。
8. Cookie を HttpOnly にしたい場合は **HttpOnly** チェックボックスをオンにします。
9. HTTPS 通信時のみ送信したい場合は **Secure** チェックボックスをオンにします。
10. **back arrow** をクリックしてメインの **Editor** 画面に戻ります。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/55825e1-Testim_206a_r.png)

テストを実行すると、指定した属性で Cookie が設定されます。

**パラメーターから Cookie を設定するには:**

1. Cookie を追加したい位置の （矢印）にカーソルを合わせます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/81c33b1-Testim_201a.png)

アクションオプションが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/8a64224-Testim_202a_r.png)

2. “**M**”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/9634744-Testim_203_r.png)

3. **Actions** をクリックします。\
   **Actions** メニューが展開されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/0e28a9c-Testim_204_r.png)

4. 下にスクロールして **Set Cookie** を選択します。

:::note
上部の検索ボックスで **Set Cookie** を検索して選択することもできます。
:::

**Set Cookie** 画面が表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/fc68884-Testim_205_r.png)

5. **Use cookie parameter** ラジオボタンを選択します。\
   **Parameter Name** フィールドが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/3d4b48c-Testim_218.png)

6. **Parameter Name** に、事前に作成した Cookie パラメーター／変数の名前を入力します。詳細は [Getting Cookies using the Get Cookie step](/docs/cookies#getting-cookies-using-the-get-cookie-step) を参照してください。
7. **back arrow** をクリックしてメインの **Editor** 画面に戻ります。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/98be8c7-Testim_219a.png)

テスト実行時、その時点のパラメーター値を使って Cookie が設定されます。

### Setting Cookies using the Setup step – “Test Data” property

特定テストでのみ Cookie を読み込ませたい、あるいはページ読み込み前に Cookie を設定したい場合は、 Setup ステップの **Test Data** プロパティを使います。

**Test Data プロパティで Cookie を設定するには:**

1. テストの最初のステップである **Setup** ステップにカーソルを合わせ、**Show Properties**アイコンをクリックします。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/9335a8c-Testim_210a.png)

右側に **Test Configuration Properties** パネルが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/3866fe4-Testim_211_r2.png)

:::note
**Setup** ステップをダブルクリックするか、画面右上の **Show step properties** アイコンをクリックしても同じパネルを開けます。
:::

2. オプションをスクロールして **Test Data** をクリックします。\
   JavaScript エディターが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/f222a38-Testim_212.png)

3. エディターに Cookie を設定するコードを記述します。

```javascript
return {
 "cookies":[{
    "name": "username",
    "value": "tomsmith",
    "domain": "http://google.com"
  },{
    "name": "password",
    "value": "SuperSecretPassword!"
  }]
};
```

:::note
**name** = Cookie 名\
**value** = Cookie の値\
**domain** = Cookie のドメイン（任意）
:::

**back arrow** をクリックしてメインの **Editor** ウィンドウに戻ります。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/2dea826-Testim_213a.png)

テストを実行すると、ページ読み込み前に Cookie がロードされた状態でテストが開始されます。

### Setting Cookies using a custom JS (JavaScript) step

特定のタイミングで Cookie を設定したいが、テスト開始直後である必要はない場合は、**Custom JavaScript** ステップ（custom action）を使って任意の位置で Cookie を設定できます。

**カスタムアクションステップで JavaScript を使って Cookie を設定するには:**

1. Cookie を追加したい位置の （矢印）にカーソルを合わせます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/57fdc2c-Testim_201a.png)

アクションオプションが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/abbdb56-Testim_202a_r.png)

2. “**M**”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/2042807-Testim_203_r.png)

3. **Actions** をクリックします。\
   **Actions** メニューが展開されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/bf34029-Testim_204_r.png)

4. 下にスクロールして **Add custom action** を選択します。\
   **Add Step** ウィンドウが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/f0ba274-Testim_215_r.png)

:::note
上部の検索ボックスで **Add custom action** を検索して選択することもできます。
:::

5. **Name the new step** フィールドに、このステップの分かりやすい名前を入力します。
6. 他のテストでも再利用できる共有ステップとして保存したい場合は、**Shared step** のチェックを維持し、保存先フォルダーを選択します（既定値）。このステップを共有したくない場合はチェックを外します。
7. **Create Step** をクリックします。\
   **JS Editor** と右側の **Custom Action Properties** パネルが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/17ff9b7-Testim_216.png)

8. エディターに Cookie を設定するコードを記述します。下記は一例です。

```javascript
document.cookie = "password=SuperSecretPassword!";
document.cookie = "username=tomsmith";
```

9. 必要に応じて **Custom Action Properties** パネルのプロパティを設定します。

* **Step name** – ステップ名（既定値は手順 5 で入力した名前）。
* **Description** – ステップの説明（既定値 = *Run action*）。
* **Share step** – ステップを共有ステップとして保存するかどうか。
* **+ Params** – JavaScript / HTML パラメーターの追加。詳細は [Parameters in custom JavaScript steps](/docs/parameters-in-custom-javascript-steps) を参照してください。
* **When this step fails** – ステップ失敗時の挙動。
* **When to run step** – ステップ実行条件。詳細は [Conditions](/docs/conditions) を参照してください。
* **Override timeout** – 既定のタイムアウト時間（ステップ失敗までの時間）をミリ秒単位で上書きします。

テストを実行すると、 Custom Action ステップの位置で Cookie 設定処理が実行されます。

### 設定ファイルを使って Cookie を設定する

CLI からテストスイートを実行する場合、設定ファイル（Configuration file）を使ってスイート全体に共通の Cookie を設定することもできます。設定ファイルはテスト／スイート実行に必要なパラメーターや実行フック（run hooks）を定義する JavaScript ファイルで、バックエンドの初期化などにも利用されます。

**設定ファイルを使って Cookie を設定するには:**

1. JavaScript の設定ファイルを作成します。詳細は [Configuration file & run hooks](/docs/configuration-file-run-hooks) を参照してください。
2. `beforeSuite` セクションに Cookie を設定するコードを追加します。以下は例です。

```javascript
beforeSuite: function (suite) {   
  return {
    "cookies":[
        {
      "name": "username",
      "value": "tomsmith",
    },
        {
      "name": "password",
      "value": "SuperSecretPassword!"
    }]
  };
}
```

## Cookie を取得する

Testim では、 Cookie の値を変数に代入することで Cookie を「取得」し、テスト内で属性を再利用することができます。

### Get Cookie ステップを使って Cookie を取得する {#getting-cookies-using-the-get-cookie-step}

**Get Cookie** ステップを使うと、テスト中の UI から直接 Cookie を読み取り、その値を変数に保存できます。

**Get Cookie ステップで Cookie を取得するには:**

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/c7b7428-Jan-31-2021_06-34-55.gif)

1. Cookie を取得したい位置の （矢印）にカーソルを合わせます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/182e01a-Testim_207a.png)

アクションオプションが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/42c6ecf-Testim_202a_r.png)

2. “**M**”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/f95fa58-Testim_203_r.png)

3. **Actions** をクリックします。\
   **Actions** メニューが展開されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/ab4f1d0-Testim_204_r.png)

4. 下にスクロールして **Get Cookie** を選択します。

:::note
上部の検索ボックスで **Get Cookie** を検索して選択することもできます。
:::

**Editor** 内に “Get Cookie” ステップが追加されます。\
5\. 追加されたステップにカーソルを合わせ、**Show Properties**アイコンをクリックします。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/06fb384-Testim_208a.png)

右側に **Properties** パネルが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/e8f327d-Testim_209_r.png)

6. 次のプロパティを設定します。

* **Description** – ステップの説明（既定値 = *Get Cookie*）。
* **Cookie name** – 取得したい Cookie 名。文字列はシングル／ダブルクォートで囲む必要があります。
* **Variable name** – Cookie 情報を保存する変数名（既定値 = *myCookie*）。
* **Variable scope** – 変数をどの範囲で参照できるか:
  * **Local**: 同一スコープ内のステップ間で共有
  * **Test**: 同一テスト内のステップ／グループ間で共有
  * **Suite**: 同じテストスイート内のテスト間で共有
* **When this step fails** – ステップ失敗時の挙動。
* **When to run step** – ステップ実行条件。詳細は [Conditions](/docs/conditions) を参照してください。
* **Override timeout** – 既定のタイムアウト時間を上書き（ミリ秒）。

テスト実行時、指定した Cookie の情報が変数に保存されます。

### Getting Cookies using a custom JS (JavaScript) step

Get Cookie ステップを使わなくても、 custom action ステップ内の JavaScript で Cookie の値を取得することもできます。

**カスタムアクションステップで Cookie を取得するには:**

1. Cookie を取得したい位置の （矢印）にカーソルを合わせます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/9e6579b-Testim_220a.png)

アクションオプションが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/4daa9d3-Testim_202a_r.png)

2. “**M**”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/ab3aebb-Testim_203_r.png)

3. **Actions** をクリックします。\
   **Actions** メニューが展開されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/9030d32-Testim_204_r.png)

4. 下にスクロールして **Add custom action** を選択します。\
   **Add Step** ウィンドウが表示されます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/295c84e-Testim_215_r.png)

:::note
上部の検索ボックスで **Add custom action** を検索して選択することもできます。
:::

5. **Name the new step** フィールドに、このステップの分かりやすい名前を入力します。
6. 他のテストでも再利用できる共有ステップとして保存したい場合は、**Shared step** のチェックを維持し、保存先フォルダーを選択します（既定値）。共有不要ならチェックを外します。
7. **Create Step** をクリックします。\
   **JS Editor** と **Custom Action Properties** パネルが開きます。

![Cookie 機能のスクリーンショット](/images/advanced-features/cookies/895c71a-Testim_221.png)

8. エディターに Cookie を取得するコードを記述します。以下は、`username` と `password` という Cookie の値を取得してログ出力する例です。

```javascript
//create an array of the site cookies
let cookieArray = document.cookie.split("; ");
var name = "username=";
for(var i = 0; i <cookieArray.length; i++) {
    var c = cookieArray[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      console.log("username = " + c.substring(name.length, c.length));
    }
}

var name = "password=";
for(var i = 0; i <cookieArray.length; i++) {
    var c = cookieArray[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      console.log("password = " + c.substring(name.length, c.length));
    }
}
```

9. 必要に応じて **Custom Action Properties** パネルのプロパティを設定します。

* **Step name** – ステップ名（既定値は手順 5 で入力した名前）。
* **Description** – ステップの説明（既定値 = *Run action*）。
* **Share step** – ステップを共有ステップとして保存するかどうか。
* **+ Params** – JavaScript / HTML パラメーターの追加。詳細は [Parameters in custom JavaScript steps](/docs/parameters-in-custom-javascript-steps) を参照してください。
* **When this step fails** – ステップ失敗時の挙動。
* **When to run step** – ステップ実行条件。詳細は [Conditions](/docs/conditions) を参照してください。
* **Override timeout** – 既定のタイムアウト時間を上書き（ミリ秒）。

テストを実行すると、 Custom Action ステップ内で定義した Cookie 取得処理が実行されます。
