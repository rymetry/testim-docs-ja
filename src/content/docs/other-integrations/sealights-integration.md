---
title: Sealights統合
description: SealightsとTestimを統合してテスト最適化を実現する方法について説明します。CLI、スケジューラー、APIでの実行方法を提供します。
category: 統合
order: 12021
updated: '2025-02-10'
sourceUrl: 'https://help.testim.io/docs/sealights-integration'
keywords:
  - Testim
  - Sealights
  - Sealights統合
  - テスト最適化
  - テスト選択
  - コードカバレッジ
  - 品質インテリジェンス
---

Sealightsは、個々のテストのコードカバレッジを評価・定量化する品質インテリジェンスプラットフォームです。SealightsとTestimを統合することで、Testimでテストを作成・実行しながら、Sealightsを使用してテスト最適化を実行できます。テスト実行中、Testimは実行されるテストのリストをSealightsに送信し、Sealightsはアプリケーションビルドでスキップすべきテストに対するテスト最適化の推奨事項を返します。これらのテストは、Testimでの実行から自動的に除外されます。

:::info
ネイティブモバイルアプリとSalesforce環境は現在サポートされていません。ただし、Webフレームワークを使用するサービスのモバイルアプリはサポートされています。
:::

## 前提条件

SealightsとTestimの統合でテストを実行する前に、まず以下を行う必要があります:

- Sealightsアカウントを作成する

- AUT(Application Under Test)のフレームワークに基づいてSealights Agentsをセットアップおよび構成する - [Agents: Setup and configuration](https://documentation.tricentis.com/sealights/en/content/sealights/agents_setup_configuration.htm)を参照してください。

## Sealights統合の設定

SealightsとTestimの統合を使用する前に、Sealights Agent Tokenを介してTestimをSealightsに接続する必要があります。このプロセスは1回のみ必要です。

:::info
Sealights統合は無料プランのお客様にはご利用いただけません。
:::

**TestimをSealightsに接続するには:**

1. **Sealights**で、**Settings > Agent Tokens**に移動し、**Create new token**をクリックします。

   ![SealightsのAgent Tokens画面で新しいトークンを作成する画面](/images/other-integrations/sealights-integration/d94ca5f-sealights2.png)
2. 空のフィールドにトークンの名前を入力し、**Create**をクリックします。
3. **Actions**の下の**Copy**ボタンをクリックして、新しく作成されたトークンをコピーします。

   ![SealightsのIntegration設定画面でTestim統合が表示されている画面](/images/other-integrations/sealights-integration/9eb0aac-sealights4.png)
4. Testimで、**Settings > Integration > Test Optimization**タブに移動します。
5. **login**をクリックします。

   ![SealightsのIntegration設定でTestim統合にログインする画面](/images/other-integrations/sealights-integration/9f2f531-sealightsintegrationslogin.png)
6. **Sealights Agent Token**に、取得した**Sealights Agent Token**を貼り付けます。\
   **Sealights URL**フィールドは、**Sealights Agent Token**に基づいて自動的に入力されます。
7. **Connect**をクリックします。

## Sealights統合でテストを実行する

Sealights統合でのテストは、以下の方法で実行できます:

- **CLI** - Sealightsの`buildSessionId`またはSealightsの`labId`を含むCLIオプションを追加します。
- **Scheduler** - **Advanced**セクションの**Lab ID**フィールドにSealightsの`labId`を入力します。
- **API** (近日公開予定)

### CLIを使用してSealights統合でテストを実行する

CLIを使用してSealights統合でテストを実行する場合、Testim CLI実行コマンドのオプションとして、Sealightsから次のIDのいずれかを追加する必要があります:

- **Sealights buildSessionId** - このIDは、実行された特定のビルドに関連します。通常、これはアプリケーションの特定のコンポーネントに関連します。つまり、特定のコンポーネントをテストする場合は、このオプションをお勧めします。
- **Sealights labId** - 通常、同じ環境でホストされている複数のコンポーネントは、同じLabIdを共有する場合があります。したがって、複数のコンポーネントをテストする場合は、buildSessionIdの代わりにLabIdを使用することをお勧めします。
- **Sealights test-stage** - 通常、Sealightsのテストステージ名はTestim Automationです。別のテストステージ名を使用する場合は、このオプションをお勧めします。

CLIを使用してテストが実行されると、Sealightsはこのコマンドでスキップすべきテストのリストを返し、これらは自動的にスキップされます。

:::info
`labId` CLIオプションが使用されていない場合、Testimは`labId`と`buildSessionId`の両方のオプションに`buildSessionId`値を使用します。
:::

#### buildSessionIdオプション

##### SealightsからbuildSessionIdを取得する

テストされているすべてのコンポーネントビルドについて、使用しているフレームワークに関連する手順に従って、SealightsからSession IDを取得する必要があります:

- [Using Node.js Agent - Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_node_js_agent___generating_a_session_id.htm)
- [Using Java Agents - Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_java_agents___generating_a_session_id.htm)
- [Using Python Agent - Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_python_agent___generating_a_session_id.htm)
- [Using Go Agent - Initializing agent and Generating a session ID](https://documentation.tricentis.com/sealights/en/content/sealights/using_go_agent___initializing_agent_and_generating_a_session_id.htm)
- [SeaLights .NET Core agent - Scanning the build binaries](https://documentation.tricentis.com/sealights/en/content/sealights/sealights__net_core_agent___scanning_the_build_binaries.htm)

##### Sealights buildSessionIdを使用してTestimでテストを実行する

Testimで、[コマンドラインインターフェイス(CLI)](/docs/the-command-line-cli)を使用してテストを実行し、実行に次のオプションを追加します:

- ```shell
  --sealights-build-session-id [sealights-suid-session-id]
  ```

#### labIdオプション

Sealightsでは、`labId`は同じ環境でホストされているコンポーネントなど、同じ特性を共有するさまざまなコンポーネントに割り当てることができる識別子です。Sealightsエージェントを使用してコンポーネントを実行するときに、コンポーネントに`labId`を割り当てることができます。

たとえば、Node.jsテストリスナーエージェントを使用する次のSealightsコマンドでは、コマンドの一部として`labId`を割り当てることができます:

```shell
npx slnodejs run --tokenfile ./path/to/sltoken.txt --buildsessionidfile buildSessionId [--labid <Lab ID>] --workspacepath "." --useinitialcolor true -- /your/backend/server/command
```

Testimでは、この`labId`をCLIを使用してSealights統合でテストを実行するときのCLIオプションとして使用できます。

##### SealightsからlabIdを取得する

Sealightsで、`labId`が割り当てられたら、次の画面で見つけることができます:  

- Sealightsで、**Cockpit > Live Agents Monitor**に移動します - この画面には、Sealightsでインストルメント化されているすべての実行中のプロセスが表示されます。以下に示すように、これらのプロセスの一部には割り当てられたlabIdが含まれます:

  ![Sealights統合用のTestim設定画面でCLIオプションが表示されている画面](/images/other-integrations/sealights-integration/319a904-sealights6.png)

##### Sealights labIdを使用してTestimでテストを実行する

Testimで、[コマンドラインインターフェイス(CLI)](/docs/the-command-line-cli)を使用してテストを実行し、実行に次のオプションを追加します:

- ```shell
  --sealights-lab-id [sealights-lab-id]
  ```

#### test-stageオプション

通常、Sealights統合ではテストステージ名Testim Automationを使用します。ただし、これをオーバーライドしてカスタム名を使用できます。

CLI実行中は常に、タグセクションで`Testim`を送信することをお勧めします。このベストプラクティスにより、テストの起源が識別されます。

カスタムテストステージ名を使用する場合は、[コマンドラインインターフェイス(CLI)](/docs/the-command-line-cli)を使用し、実行に次のオプションを追加できます:

- ```shell
  --sealights-test-stage [sealights-test-stage-name]
  ```

### スケジューラーを使用してSealights統合でテストを実行する

**Advanced**セクションの**Lab ID**フィールドにSealightsの`labId`を入力することで、Sealightsでテストを実行できます。スケジューラーによってテストが実行されると、Sealightsはこのバッチでスキップすべきテストのリストを返し、これらは自動的にスキップされます。

**スケジューラーとSealights統合でテストを実行するには:**

1. Sealightsで、[labIdオプション](#labidオプション)セクションの手順に従って、Lab IDを取得します。
2. Testimで、[Scheduler - Web](/docs/scheduler)セクションの手順に従って、スケジューラーを構成します。
3. スケジューラー構成画面で、**Advanced**をクリックします。
4. **Test Optimization Configuration**の下の**Lab ID**フィールドに、Sealightsから取得したLab IDを貼り付けます。
5. オプションで、カスタムテストステージ名を使用する場合は、**Test stage name field**に入力します

   ![Sealights統合を有効化したTestimスケジューラー設定画面](/images/other-integrations/sealights-integration/bc18e30-image_12.png)
6. 必要に応じて追加の設定を構成します。

<br />

## 実行されたテストリストとスキップされたテストの表示

### CLIで実行されたテストリストの表示

CLIを使用してテストを実行した後、テストの実行ステータスとテストが除外/スキップされたかどうかの表示を含むテストリストを表示できます。

以下の例では、Function 1テストのみが実行され、他のテストは"excluded by Sealights"となっています。画面下部の実行サマリーには、23件のテストがスキップされたことも示されています。

![Sealightsにより一部テストがskipped扱いになっているTestimの実行結果一覧](/images/other-integrations/sealights-integration/3a2008c-testlistwith_skipped.png)

### Testim UIで実行されたリストの表示

[Execution Runs Screen](/docs/execution-runs-screen)で、実行されたテストのリストを表示できます。Statusカラムの下に、テストがTest Optimizationによって除外されたことを示すインジケーターが表示されます。

![Sealights Test Optimizationの対象外となったテストがUI上で示されている画面](/images/other-integrations/sealights-integration/86c6509-testlistui.png)

**i**アイコンにカーソルを合わせると、テストがSealightsによって除外されたことを示す通知が表示されます。

![Test OptimizationによりExcluded by Sealightsと表示されているテストの詳細画面](/images/other-integrations/sealights-integration/d4a8e26-excludedbysealights.png)
