---
title: 暗号化された認証情報
description: >-
  テストで使用する機密認証情報を暗号化して安全に管理する方法について説明します。テストデータ、設定ファイル、パラメーターファイルでの利用方法を提供します。
category: 管理者機能
order: 14005
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/administration/encrypted-credentials.htm'
keywords:
  - Encrypted Credentials
  - 暗号化
  - 認証情報
  - TST_CREDS
  - パスワード
  - ユーザー名
  - アクセスキー
---

本番環境の管理者認証情報など、機密性の高い認証情報がテストで使用されることがあります。このような場合、テストの作成時、実行時、または結果表示時に認証情報が公開されないようにする必要があります。Testim の **Encrypted Credentials** 機能を使用すると、機密性の高いログイン情報を一元的に管理し、**Credentials** 画面で暗号化して安全に保護できます。暗号化された認証情報を含むテストは、権限のあるユーザーのみが実行および結果の表示を行えます。

:::note
一般的なベストプラクティスとして、機密データを含む本番環境でのテストは避けることをお勧めします。代わりに、機密情報のない専用のテスト環境を使用してください。ただし、必要な場合は Encrypted Credentials 機能の使用をお勧めします。
:::

## テスト内での認証情報の定義場所

暗号化された認証情報を作成した後、以下の場所で使用できます:

- [**Test Data**](#test-data-への暗号化された認証情報の追加) — テストデータ内の入力パラメーターとして定義
- [**Config File**](#config-file-への暗号化された認証情報の追加) — 設定ファイルに含める
- [**Params File**](#param-file-への暗号化された認証情報の追加) — パラメーターファイルに含める

## テスト実行での使用方法

暗号化された認証情報は、以下の方法でテストを実行する際に使用できます:

- [CLI](#cli-での実行)
- [Scheduler](#scheduler-での実行)
- [API](#api-での実行)
- ユーザーが手動でテストを実行する場合

[Editor](/docs/running-tests-overview) — ローカルおよびリモート（"run on grid"）実行。Libraries — [Test Library](/docs/running-tests-overview)、[Suite Library](/docs/running-tests-overview)、[Test Plans Library](/docs/running-tests-overview)。テスト実行中にシステムが暗号化された認証情報を含むことを検出すると、フラグが表示されます。

## Encrypted Credentials の設定

暗号化された認証情報を使用する前に、認証情報を定義し、必要に応じてユーザーに使用権限を付与する必要があります。

## 認証情報の作成

暗号化された認証情報を作成できるのは、**Project Owner** または **Company Owner** のみです。認証情報の作成後、Project/Company Owner は暗号化された認証情報を含むテストを実行し、テスト結果で認証情報を表示できるユーザーを指定できます（下記の[権限の付与](#暗号化された認証情報の使用権限の付与)を参照）。Project/Company Owner は、暗号化された認証情報の権限を持たないユーザー向けに、フォールバックとして使用するデフォルトの認証情報を定義することもできます。デフォルト値が設定されておらず、ユーザーに権限がない場合、テスト実行時には空文字列が使用されます。**新しい暗号化された認証情報を作成するには:**

1. **Resources > Credentials** に移動します。
2. **New Credentials** をクリックします。

   **New Credentials** 画面が表示されます。

   ![New Credentials 画面](/images/project-user-management/encrypted-credentials/e251eb4-image.png)

3. **Name** フィールドに、暗号化された認証情報の名前を入力します。この名前は、CLI でテストを実行する場合などに `<keyName>` として参照されます。
4. **Description** フィールドに、必要に応じて説明を入力します。
5. **Username** フィールドに、暗号化された認証情報のユーザー名を入力します。
6. **Password** フィールドに、暗号化された認証情報のパスワードを入力します。
7. **Add default values** フィールドに、必要に応じて **Username** と **Password** を追加します。これは、暗号化された認証情報を実行・表示する権限を持たないユーザー向けのフォールバックオプションとして使用されます（[権限の付与](#暗号化された認証情報の使用権限の付与)を参照）。デフォルト値が設定されておらず、ユーザーに権限がない場合、空文字列が使用されます。
8. **Create** をクリックします。

## 暗号化された認証情報の使用権限の付与

Project/Company Owner は、暗号化された認証情報を使用し、テスト結果で暗号化された認証情報を表示できるユーザーを指定できます。

:::note
デフォルトでは、プロジェクト内のすべてのユーザーは権限を持っていません。オーナーが明示的に権限を付与する必要があります。
:::

**暗号化された認証情報の権限を付与するには:**

1. **Settings > Project > Resources** に移動します。
2. ユーザー一覧から、暗号化された認証情報を使用したテストの実行とテスト結果の表示の権限を付与するユーザーを選択します。特定のユーザーを選択するか、**All Users** オプションを選択してすべてのユーザーに権限を付与します。検索ボックスを使用してユーザーを検索できます。

![暗号化された認証情報の権限設定画面](/images/project-user-management/encrypted-credentials/ebf43fe-project2.png)

## テストでの Encrypted Credentials の使用

暗号化された認証情報は **Test Data** に含めることができます。Test Data は特定のテストの一部であり、他のテストからは使用できません。ただし、**Config File** や **Param File**（CLI 経由で実行可能）に暗号化された認証情報を追加すると、これらのファイルのデータがテスト実行時に適用されるため、複数のテストで利用できるようになります。

## Test Data への暗号化された認証情報の追加

テストデータは **Setup** ステップの **Test Data** プロパティから追加できます。データ駆動テストの詳細については、[Configuring a Data-driven Test From The Visual Editor](/docs/configuring-a-data-driven-test-from-the-visual-editor) を参照してください。Test Data には暗号化された認証情報を含めることができます。

### Test Data での認証情報の構文

暗号化された認証情報は以下の構文で指定します:

```javascript
TST_CREDS.<keyName>.<'username'|'password'>
```

- `<keyName>` — **Name** フィールドで設定した認証情報の名前に置き換えます。
- `<'username'|'password'>` — `username` を指定すると暗号化されたユーザー名を使用し、`password` を指定すると暗号化されたパスワードを使用します。

例:

```javascript
TST_CREDS.myEncryptedCredentials.username
TST_CREDS.myEncryptedCredentials.password
```

![Test Data での暗号化された認証情報の構文例](/images/project-user-management/encrypted-credentials/ed6ddf0-testdata.png)

## Config File への暗号化された認証情報の追加

[設定ファイル](/docs/configuration-file-run-hooks)は、テストやテストスイートの実行に必要なすべてのパラメーターを含む共通の JavaScript ファイルです。単一テストまたは全テストの前後にアプリケーションバックエンドのセットアップやパラメーター定義に使用できる run hooks が含まれています。設定ファイルは `config` という名前の JSON ですべてのプロパティをエクスポートする必要があります。Config File での認証情報の定義は、他のパラメーターと同じオーバーライドルールに従います。

### Config File での認証情報の構文

暗号化された認証情報は以下の構文で指定します:

```javascript
TST_CREDS.<keyName>.<'username'|'password'>
```

- `<keyName>` — **Name** フィールドで設定した認証情報の名前に置き換えます。
- `<'username'|'password'>` — `username` を指定すると暗号化されたユーザー名を使用し、`password` を指定すると暗号化されたパスワードを使用します。

例:

![Config File での暗号化された認証情報の例](/images/project-user-management/encrypted-credentials/8af9ab8-image.png)

## Param File への暗号化された認証情報の追加

[JSON パラメーターファイル](/docs/json-parameters-file-parameters)を使用すると、テスト実行にパラメーターを渡すことができます。この方法を使用すると、テスト環境によって異なる動的な値をテスト内で定義できます。例えば、ローカルテスト時と CI でのテスト時に異なるログイン認証情報（ユーザー名とパスワード）を設定できます。パラメーターを定義する JSON パラメーターファイルを作成し、テスト実行時に JSON パラメーターファイルを呼び出す引数をコマンドに追加します。CLI コマンドは、実行に含まれるテストにパラメーターを渡します。

### Param File での認証情報の構文

暗号化された認証情報は以下の構文で指定します:

```javascript
TST_CREDS.<keyName>.<'username'|'password'>
```

- `<keyName>` — **Name** フィールドで設定した認証情報の名前に置き換えます。
- `<'username'|'password'>` — `username` を指定すると暗号化されたユーザー名を使用し、`password` を指定すると暗号化されたパスワードを使用します。

### パラメーターファイルを暗号化された認証情報に対応させる

パラメーターファイルは JSON 形式で定義されますが、この種の静的ファイルは暗号化された認証情報の使用をサポートしていません。**パラメーターファイルを暗号化された認証情報に対応させるには:**

1. ファイル名の拡張子を `.json` から `.js` に変更します。例: `<file name>.js`
2. 最初の行として `module.exports =` を追加します:

```javascript
module.exports = {
  username: TST_CREDS.<keyName>.<'username'>,
  password: TST_CREDS.<keyName>.<'password'>,
}
```

例:

![Param File での暗号化された認証情報の例](/images/project-user-management/encrypted-credentials/8b4db12-image.png)

## Encrypted Credentials を含むテストの実行

## CLI での実行

暗号化された認証情報を含むテストを実行するには、CLI コマンドに特別な `--user-access-key` フラグを追加する必要があります。このフラグには、各ユーザー固有の特別なキーが含まれており、以下の手順で User Profile 画面から取得できます。

:::note
User Access Key フラグは、暗号化された認証情報を使用したテストの実行権限を持つユーザーのみ機能します。[権限の付与](#暗号化された認証情報の使用権限の付与)を参照してください。
:::

**User Access Key を取得するには:**

1. 画面右上のプロフィール（イニシャルアイコン）をクリックします。
2. **View Profile** をクリックします。
3. **User Access Key** タブをクリックします。

   固有の User Access Key が保護のため部分的に隠された状態で表示されます。

   ![User Access Key の表示画面](/images/project-user-management/encrypted-credentials/b030eeb-useraccesskey2.png)

4. **Copy** ボタンをクリックしてキーをコピーします。

## Scheduler での実行

[Scheduler](/docs/scheduler) を使用して、暗号化された認証情報を含むテストを実行できます。ただし、暗号化された認証情報を使用したテストは権限のあるユーザーのみが実行できるため、Scheduler の Advanced Settings でテストの実行に使用するユーザーを指定する必要があります。

:::note
この設定は、暗号化された認証情報の使用が許可されているユーザーのみが行えます。[権限の付与](#暗号化された認証情報の使用権限の付与)を参照してください。
:::

:::note
デフォルトでは、既存のすべてのスケジューラーおよび新規作成されるスケジューラーの **Credentials** フィールドは、ユーザー未設定の状態です。
:::

**Scheduler で暗号化された認証情報を含むテストを実行するには:**

1. [Scheduler](/docs/scheduler) のドキュメントの手順に従います。
2. **Advanced** をクリックします。
3. **Credentials** の下で、暗号化された認証情報の使用が許可されているユーザーをドロップダウンメニューから選択します。自分自身のユーザーまたはリスト内の別のユーザーを選択できます。

   ![Scheduler の Credentials 設定](/images/project-user-management/encrypted-credentials/6483bb8-scheduler2.png)

4. **Create** をクリックします。

## API での実行

[Testim REST API](/docs/api-access) を使用して、暗号化された認証情報を含むテストを実行できます。暗号化された認証情報を含むテストを実行し、テスト実行の完全なデータを取得するには、API コールに `--user-access-key` の値を追加する必要があります。このアクセスキーは各ユーザー固有の特別なキーで、以下の手順で User Profile 画面から取得できます。アクセスキーの値は API コールの `X-User-Access-Key` フィールドに含める必要があります。Testim REST API は、暗号化された認証情報データを含むテスト結果（暗号化された認証情報を含むスクリーンショットなど）の表示にも使用できます。

:::note
User Access Key フラグは、暗号化された認証情報を使用したテストの実行権限を持つユーザーのみ機能します。[権限の付与](#暗号化された認証情報の使用権限の付与)を参照してください。
:::

**User Access Key を取得するには:**

1. 画面右上のプロフィール（イニシャルアイコン）をクリックします。
2. **View Profile** をクリックします。
3. **User Access Key** タブをクリックします。

   固有の User Access Key が保護のため部分的に隠された状態で表示されます。

   ![User Access Key の表示画面](/images/project-user-management/encrypted-credentials/e2d356f-useraccesskey2.png)

4. **Copy** ボタンをクリックしてキーをコピーします。

## Encrypted Credentials を含むテスト実行のまとめ

テストデータ、Config File、Params File に保存された暗号化された認証情報を含むテストを実行するさまざまなオプションのまとめです。

## Test Data の暗号化された認証情報を含むテストの実行

権限のあるユーザーは、Editor、CLI、REST API を通じて Test Data の暗号化された認証情報を含むテストを実行できます。

- **[Editor](/docs/running-tests-overview)** — ローカルおよびリモート（"run on grid"）実行。**Run test** ボタンをクリックするか、ドロップダウンからリモートテストを実行します。
- **Libraries** — [Test Library](/docs/running-tests-overview)、[Suite Library](/docs/running-tests-overview)、[Test Plans Library](/docs/running-tests-overview)。**Play** ボタンをクリックします。
- **CLI** — 上記で説明した特別な `--user-access-key` フラグを追加して、通常のコマンドを使用します。

```bash
npm i -g @testim/testim-cli && testim --token <token Id> --project <project Id> --grid "Testim-Grid" --label "label #2" --user-access-key <key Id>
```

- **API** — [Testim REST API](/docs/api-access) コール（例: `POST /tests/run/{testId}`）を作成し、`user-access-key` の値を `X-User-Access-Key` フィールドに追加します。

![Test Data の暗号化された認証情報を含むテスト実行のまとめ](/images/project-user-management/encrypted-credentials/66a46aa-image_1.png)

## Config File の暗号化された認証情報を含むテストの実行

権限のあるユーザーは、CLI を通じて Config File の暗号化された認証情報を含むテストを実行できます。

- **CLI** — 上記で説明した特別な `--user-access-key` フラグを追加して、通常のコマンドを使用します。

```bash
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --user-access-key <key Id> --config-file testimConfig.js
```

## Params File の暗号化された認証情報を含むテストの実行

権限のあるユーザーは、CLI を通じて Params File の暗号化された認証情報を含むテストを実行できます。

- **CLI** — 上記で説明した特別な `--user-access-key` フラグを追加して、通常のコマンドを使用します。

```bash
testim --label "<YOUR LABEL>" --token "<YOUR ACCESS TOKEN>" --project "<YOUR PROJECT ID>" --grid "<Your grid name>" --user-access-key <key Id> --params-file testimParams.js
```

## Encrypted Credentials を含むテスト実行結果の表示

暗号化された認証情報を使用したテストのテスト結果は、権限のあるユーザーのみが表示できます。暗号化された認証情報を使用したテスト実行には、Encrypted Credentials アイコンが表示されます。

![暗号化された認証情報を含むテスト実行一覧](/images/project-user-management/encrypted-credentials/7ea630b-testruns2.png)

情報ツールチップの「Test Data」セクションには、暗号化された認証情報を含む可能性のあるテストデータが表示されます。テスト実行に暗号化された認証情報が含まれる場合、テストデータセクション（ツールチップからアクセス可能）はすべてのユーザーに表示され、認証情報への参照が `TST_CREDS.<key name>.username | password` の形式で表示されます。テストデータは一般的に、カウントされた実行でのみアクセス可能であり、ローカルのエディター実行ではアクセスできません。

![テスト実行結果のツールチップに表示される暗号化された認証情報](/images/project-user-management/encrypted-credentials/51dbedf-testdata2.png)
