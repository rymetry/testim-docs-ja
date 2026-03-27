---
title: Salesforce テストの作成
description: Salesforce 環境に接続し、ペルソナやモックネットワーク、テスト設定などを利用して Salesforce テストを作成・実行する手順を説明します。
category: Salesforceテスト
order: 16007
updated: '2025-12-02'
sourceUrl: 'https://docs.tricentis.com/testim/content/salesforce-testing/create-a-salesforce-test/index.htm'
keywords:
  - Salesforce テスト
  - テスト作成
  - ペルソナ
  - モックネットワーク
  - HAR ファイル
  - テスト設定
  - 共有構成
  - 手動ステップ
  - Salesforce ステップ
---

Salesforce テストは、接続された Salesforce 環境に接続し、テストしたいユーザージャーニーを実行します。テストには一連のステップが含まれ、それぞれが Salesforce アプリケーションとの別のインタラクションを表します。

#### ステップの種類

テストにステップを追加するには 2 つの方法があります:

- **ステップを手動で追加** - ステップを手動で追加できます。ステップは次のカテゴリに整理されています:
  - **Salesforce ステップ** - Salesforce アプリケーションの使用に固有のステップ。Salesforce ステップは、Salesforce アプリケーションに深く統合されており、単一のステップ内で複数のアクションを実行したり、Testim for Salesforce アプリケーション内でフォームなどの Salesforce オブジェクトを表示および設定したりできます。詳細については、[Salesforce ステップ](/docs/salesforce-steps)を参照してください
  - **事前定義ステップ** - Web アプリケーションのテストに関連する一般的なステップ。詳細については、[手動ステップ](/docs/steps#手動ステップ)を参照してください
  - **共有ステップ** - 特定のプロジェクト内の複数のテスト間で共有されるステップ。詳細については、[共有ステップ](/docs/shareable-steps)を参照してください。
- **[ステップの記録](/docs/create-a-salesforce-test#ステップの記録)** - Record ボタンをクリックすると、Salesforce アプリケーション（ベース URL）を表示するブラウザが開きます。入力、クリックなどのすべてのインタラクションは、自動的にテストのステップに変換されます。ステップの記録は、Salesforce 環境で広範なカスタマイズが行われたために Salesforce ステップを使用できない場合にも役立ちます。

**2 つの方法を組み合わせることが可能です** - 一部のステップを手動で追加してから追加のステップを記録したり、その逆も可能です。

#### セットアップステップ

テストの最初のステップはセットアップステップです。このステップは、テストのベース URL を定義します。デフォルトでは、この URL は、最初に接続した環境に応じて、Salesforce ホームページの一般的な URL（`https://login.salesforce.com`または`https://test.salesforce.com`）のいずれかになります。[Log in](/docs/sfdc-step-login)ステップが、現在のブランチ用に設定した環境に直接移動するため、これを変更する必要はありません。

#### ペルソナの選択

ペルソナ画面（下の例を参照）では、各ペルソナ（行）に対して、各環境（列）の異なるログイン認証情報を設定できます。Salesforce テストを作成する際、**Salesforce Login ステップ**で自分が定義した任意のペルソナを選択できます。このペルソナには、テストが最初に作成された環境用に設定されたログイン認証情報があります。ただし、後でこのテストの環境を変更する場合（[ブランチの Salesforce 環境の変更](doc:tta-for-salesforce-branch-management#changing-the-salesforce-environment-of-a-branch)を参照）、ペルソナ画面の設定に基づいて、システムが新しく選択された環境の関連認証情報を自動的に割り当てるため、Login ステップで異なるログイン認証情報を選択する必要はありません。したがって、別の環境を使用する場合にテストを書き直す必要はありません。

![Salesforce ペルソナ設定の表](/images/salesforce-testing/create-a-salesforce-test/89ceae3-personastable.png)

## 前提条件

- Testim Extension をダウンロードしてインストールする - [なぜ Testim Extension が必要ですか？](/docs/why-do-you-need-testim-extension)
- [Salesforce テスト環境を Testim/TTA for Salesforce に接続する](/docs/create-and-manage-test-environments)。
- [ペルソナを作成する](/docs/create-a-persona-and-add-users)。

## Salesforce テストの作成

**新しいテストを作成するには:**

1. Testim for Salesforce アカウントで、**Settings > Salesforce**に移動し、画面右上の**New test**をクリックします。  
   ![新しい Salesforce テスト作成ボタン](/images/salesforce-testing/create-a-salesforce-test/e6d6f6e-newtest.png)

   デフォルトの**Setup Step**で新しいテストが表示されます。

2. **Show Properties**アイコンをクリックし、**Properties Panel**で目的の設定を編集することで、ステップのプロパティを変更できます。  
   ![Salesforce テストのプロパティペイン](/images/salesforce-testing/create-a-salesforce-test/1ca3180-properties.png)

**Setup Step**には次のプロパティが含まれます:

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th style="text-align: left;">
    パラメーター
   </th>
   <th style="text-align: left;">
    説明
   </th>
   <th style="text-align: left;">
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td style="text-align: left;">
    Base URL
   </td>
   <td style="text-align: left;">
    デフォルトでは、この URL は、最初に接続した環境に応じて、Salesforce ホームページの一般的な URL（
    <code>
     https://login.salesforce.com
    </code>
    または
    <code>
     https://test.salesforce.com
    </code>
    ）のいずれかになります。Log in ステップが、現在のブランチ用に設定した環境に直接移動するため、これを変更する必要はありません。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Test name
   </td>
   <td style="text-align: left;">
    テストの名前を入力します。デフォルトでは、テストは'untitled test'として保存されます。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Test description
   </td>
   <td style="text-align: left;">
    テストのオプションの説明を入力します。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Test owner
   </td>
   <td style="text-align: left;">
    デフォルトでは、テスト所有者はテストを作成したユーザーです。オプションでリストから別のユーザーを選択するにはクリックします。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Mock network
   </td>
   <td style="text-align: left;">
    Testim は、テストの一部としてテスト対象アプリケーション（AUT）のネットワークトラフィックをモックする機能を提供します。テスト実行中、実際の呼び出しを実行する代わりに、システムは呼び出しをインターセプトし、モックされたレスポンスを返します。詳細については、
    <a href="/docs/mock-network-responses">
     ネットワークレスポンスのモック
    </a>
    を参照してください。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Salesforce options
   </td>
   <td style="text-align: left;">
    Salesforce ログにステップのスクリーンショットを含めたい場合は、
    <strong>
     Log screenshots
    </strong>
    オプションを有効にします。これは、単一のステップで複数のアクションを実行する Salesforce ステップでのみ利用可能です。Salesforce ステップのスクリーンショットには、ステップのすべてのアクションが含まれます。
    <strong>
     Salesforce Log
    </strong>
    を表示するには、テストを実行した後、ステップの
    <strong>
     View Screenshot
    </strong>
    ボタンをクリックしてから、
    <strong>
     Salesforce Log
    </strong>
    タブをクリックします。パフォーマンス上の理由から、必要な場合を除き、この機能を有効にすることは推奨されません。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Configuration
   </td>
   <td style="text-align: left;">
    テストの設定は、テストを実行するために使用されるシステム仕様を決定します。テスト設定を変更する場合は、
    <strong>
     Choose Other
    </strong>
    をクリックして既存のテスト設定を選択するか、
    <strong>
     Edit
    </strong>
    ボタンをクリックして新しい設定を作成します。詳細については、
    <a href="/docs/shared-configuration#既存の構成を表示する">
     テスト設定
    </a>
    を参照してください
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Test in TTM for Jira
   </td>
   <td style="text-align: left;">
    Tricentis Test Management（TTM）for Jira は、QA と開発を連携させる Jira 内のエンドツーエンドのテスト管理で、アイデアから本番まで、ソフトウェアに品質を組み込んで共同作業することができます。詳細については、
   <a href="/docs/ttm-for-jira-integration">
     TTM for Jira 統合
    </a>
    を参照してください
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
  <tr>
   <td style="text-align: left;">
    Test Data
   </td>
   <td style="text-align: left;">
    テストデータはデータ駆動テストに使用されます。詳細については、
   <a href="/docs/configuring-a-data-driven-test-from-the-visual-editor">
     Visual Editor からのデータ駆動テストの設定
    </a>
    を参照してください。
   </td>
   <td style="text-align: left;">
   </td>
  </tr>
</tbody>
</table>

## 手動ステップの追加

手動ステップは、Salesforce ステップ、事前定義ステップ、または共有ステップのいずれかです。→ **ステップを手動で追加するには:**

1. **Setup step**の後、マウスを+ボタンの上に移動します。
2. **Add Steps**ボタンをクリックします。
3. 目的のタブ - [Salesforce ステップ](/docs/salesforce-steps)、事前定義ステップ、または共有ステップをクリックします。
4. ステップを検索するには、検索ボックスにその名前を入力し始めてリストを絞り込みます。
5. リストから目的のステップをクリックします。

[Salesforce ステップ](/docs/salesforce-steps)の場合、**Properties**ペインが右側に表示されます。ペインには 2 つのタブが含まれます:

**Object** - ステップの Salesforce オブジェクトプロパティを表示します。これらのプロパティには、設定が必要な必須プロパティが含まれる場合があります。

**Properties** - ステップの動作に関連する追加のオプションプロパティを表示します。

![Salesforce 手動ステップを追加する操作](/images/salesforce-testing/create-a-salesforce-test/2752956-manualstep.gif)

:::info{title="ベストプラクティス - 変数命名規則"}
テストケースまたはスイートの実行中に作成されたレコードの削除を自動化するには、テストで変数を作成する際に、[ベストプラクティス - 簡単なクリーンアップのための変数命名規則](/docs/best-practice-variable-naming-convention-for-easy-cleanup)の手順に従ってください。
:::

## ステップの記録

レコーダーを使用すると、AUT（テスト対象アプリケーション）とやり取りしながら、ステップを自動的に追加できます。この方法は、Salesforce ステップに含まれていない特定のステップを追加する場合や、環境が高度にカスタマイズされているために Salesforce ステップがサポートされていない場合に特に役立ちます。レコーダーには 2 つの動作モードがあります:

- **Salesforce モード** - このモードは、レコーダーのクラウドアイコン（下記参照）で示され、レコーダーは Salesforce ステップを実行し、単一のステップ内で複数のアクションの実行を可能にします。このモードは、Salesforce 環境が広範囲にカスタマイズされている場合は機能しない可能性があります。このような場合、Web モードにフォールバックして、すべての個別のアクション/ステップを記録することが可能です。このモードを使用して作成されたステップは、クラウドアイコン（下記参照）でマークされます。Web モードに戻すには、レコーダーのクラウドアイコンをクリックします。

![Salesforce モードのレコーダーアイコン](/images/salesforce-testing/create-a-salesforce-test/9381461-salesforce_mode.png)

![Salesforce モードで記録されたステップ](/images/salesforce-testing/create-a-salesforce-test/de463f1-salesforcestep.png)

- **Web モード** - これはレコーダーの通常モードで、レコーダー上の打ち消し線付きのクラウドアイコン（下記参照）で示されます。このモードでは、すべてのインタラクション（クリック、スクロール、テキスト追加など）が個別のステップで表されます。Salesforce モードに戻すには、レコーダーのクラウドアイコンをクリックします。

![Web モードのレコーダーアイコン](/images/salesforce-testing/create-a-salesforce-test/6dfd53b-nosalesforcemode.png)

:::info{title="Salesforce モードをオフにする必要がある場合"}
記録されたステップがエディターに表示されない場合は、クラウドアイコンをクリックして Salesforce モードをオフにする必要があります。
:::

**レコーダーを使用してステップを記録するには:**

1. 始める前に、Salesforce 環境が接続されていることを確認してください。詳細については、[Salesforce 環境の接続](/docs/create-and-manage-test-environments)を参照してください。
2. テストに[Log in](/docs/sfdc-step-login)ステップを追加します。
3. テストを実行して環境にログインし、追加のステップを記録できるようにします。
4. テストで、目的のステップの隣にある**+**ボタンの上にマウスを移動し、**Record**ボタンをクリックします。レコーダーは、青いクラウドアイコンで示される**Salesforce モード**で自動的に有効になります。これは、アプリケーションとのインタラクションが、関連する場合に Salesforce ステップを生成することを意味します。
5. ![ログイン完了後の Salesforce 画面](/images/salesforce-testing/create-a-salesforce-test/1a9ac07-afterlogin.png)

6. Salesforce アプリケーションとやり取りしてステップを生成します。Salesforce ステップはクラウドアイコンで示されます。

![Salesforce ステップが並んだテストフロー](/images/salesforce-testing/create-a-salesforce-test/90023bd-salesforcesteps.png)

7. テストの作成が完了したら、**Save**をクリックします。
