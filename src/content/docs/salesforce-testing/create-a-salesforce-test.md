---
title: 'Salesforceテストの作成'
description: '原文: https://help.testim.io/docs/create-a-salesforce-test'
category: 'Salesforceテスト'
order: 7
updated: '2025-11-02'
keywords:
  - testim
  - create-a-salesforce-test
  - salesforce-testing
---
Salesforceテストは、接続されたSalesforce環境に接続し、テストしたいユーザージャーニーを実行します。テストには一連のステップが含まれ、それぞれがSalesforceアプリケーションとの別のインタラクションを表します。

#### ステップの種類

テストにステップを追加するには2つの方法があります:

- **ステップを手動で追加** - ステップを手動で追加できます。ステップは次のカテゴリに整理されています:
  - **Salesforceステップ** - Salesforceアプリケーションの使用に固有のステップ。Salesforceステップは、Salesforceアプリケーションに深く統合されており、単一のステップ内で複数のアクションを実行したり、Testim for Salesforceアプリケーション内でフォームなどのSalesforceオブジェクトを表示および設定したりできます。詳細については、[Salesforceステップ](https://help.testim.io/docs/salesforce-steps)を参照してください
  - **事前定義ステップ** - Webアプリケーションのテストに関連する一般的なステップ。詳細については、[手動ステップ](https://help.testim.io/docs/steps#manual-steps)を参照してください
  - **共有ステップ** - 特定のプロジェクト内の複数のテスト間で共有されるステップ。詳細については、[共有ステップ](/docs/groups/shareable-steps)を参照してください。
- **[ステップの記録](doc:create-a-salesforce-test#recording-steps)** - Recordボタンをクリックすると、Salesforceアプリケーション（ベースURL）を表示するブラウザが開きます。入力、クリックなどのすべてのインタラクションは、自動的にテストのステップに変換されます。ステップの記録は、Salesforce環境で広範なカスタマイズが行われたためにSalesforceステップを使用できない場合にも役立ちます。

**2つの方法を組み合わせることが可能です** - 一部のステップを手動で追加してから追加のステップを記録したり、その逆も可能です。

#### セットアップステップ

テストの最初のステップはセットアップステップです。このステップは、テストのベースURLを定義します。デフォルトでは、このURLは、最初に接続した環境に応じて、Salesforceホームページの一般的なURL（`https://login.salesforce.com`または`https://test.salesforce.com`）のいずれかになります。[Log in](/docs/salesforce-steps/sfdc-step-login)ステップが、現在のブランチ用に設定した環境に直接移動するため、これを変更する必要はありません。

#### ペルソナの選択

ペルソナ画面（下の例を参照）では、各ペルソナ（行）に対して、各環境（列）の異なるログイン認証情報を設定できます。Salesforceテストを作成する際、**Salesforce Loginステップ**で自分が定義した任意のペルソナを選択できます。このペルソナには、テストが最初に作成された環境用に設定されたログイン認証情報があります。ただし、後でこのテストの環境を変更する場合（[ブランチのSalesforce環境の変更](doc:tta-for-salesforce-branch-management#changing-the-salesforce-environment-of-a-branch)を参照）、ペルソナ画面の設定に基づいて、システムが新しく選択された環境の関連認証情報を自動的に割り当てるため、Loginステップで異なるログイン認証情報を選択する必要はありません。したがって、別の環境を使用する場合にテストを書き直す必要はありません。

![](/images/salesforce-testing/create-a-salesforce-test/89ceae3-personastable.png)

# 前提条件

- Testim Extensionをダウンロードしてインストールする - [なぜTestim拡張機能が必要ですか？](/docs/recording-tests/why-do-you-need-testim-extension)
- [Salesforceテスト環境をTestim/TTA for Salesforceに接続する](/docs/salesforce-testing/create-and-manage-test-environments)。
- [ペルソナを作成する](/docs/salesforce-testing/create-a-persona-and-add-users)。

# Salesforceテストの作成

:fa-arrow-right:**新しいテストを作成するには:**

1. Testim for Salesforceアカウントで、**Settings > Salesforce**に移動し、画面右上の**New test**をクリックします。
   ![](/images/salesforce-testing/create-a-salesforce-test/e6d6f6e-newtest.png)
   デフォルトの**Setup Step**で新しいテストが表示されます。
2. **Show Properties**アイコンをクリックし、**Properties Panel**で目的の設定を編集することで、ステップのプロパティを変更できます。
   ![](/images/salesforce-testing/create-a-salesforce-test/1ca3180-properties.png)

**Setup Step**には次のプロパティが含まれます:

| パラメータ            | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |    |
| :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :- |
| Base URL             | デフォルトでは、このURLは、最初に接続した環境に応じて、Salesforceホームページの一般的なURL（`https://login.salesforce.com`または`https://test.salesforce.com`）のいずれかになります。Log inステップが、現在のブランチ用に設定した環境に直接移動するため、これを変更する必要はありません。                                                                                                                                                             |    |
| Test name            | テストの名前を入力します。デフォルトでは、テストは'untitled test'として保存されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                  |    |
| Test description     | テストのオプションの説明を入力します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |    |
| Test owner           | デフォルトでは、テスト所有者はテストを作成したユーザーです。オプションでリストから別のユーザーを選択するにはクリックします。                                                                                                                                                                                                                                                                                                                                                                                                       |    |
| Mock network         | Testimは、テストの一部としてテスト対象アプリケーション（AUT）のネットワークトラフィックをモックする機能を提供します。テスト実行中、実際の呼び出しを実行する代わりに、システムは呼び出しをインターセプトし、モックされたレスポンスを返します。詳細については、[ネットワークレスポンスのモック](/docs/mock-network-responses/mock-network-responses)を参照してください。                                                                                                                                                                                                                         |    |
| Salesforce options   | Salesforceログにステップのスクリーンショットを含めたい場合は、**Log screenshots**オプションを有効にします。これは、単一のステップで複数のアクションを実行するSalesforceステップでのみ利用可能です。Salesforceステップのスクリーンショットには、ステップのすべてのアクションが含まれます。**Salesforce Log**を表示するには、テストを実行した後、ステップの**View Screenshot**ボタンをクリックしてから、**Salesforce Log**タブをクリックします。パフォーマンス上の理由から、必要な場合を除き、この機能を有効にすることは推奨されません。 |    |
| Configuration        | テストの設定は、テストを実行するために使用されるシステム仕様を決定します。テスト設定を変更する場合は、**Choose Other**をクリックして既存のテスト設定を選択するか、**Edit**ボタンをクリックして新しい設定を作成します。詳細については、[テスト設定](https://help.testim.io/docs/shared-configuration#creating-and-modifying-test-configurations-in-the-test-editor)を参照してください                                                                                                            |    |
| Test in TTM for Jira | Tricentis Test Management（TTM）for Jiraは、QAと開発を連携させるJira内のエンドツーエンドのテスト管理で、アイデアから本番まで、ソフトウェアに品質を組み込んで共同作業することができます。詳細については、[TTM for Jira統合](/docs/test-management-integrations/ttm-for-jira-integration)を参照してください                                                                                                                                                                                                                 |    |
| Test Data            | テストデータはデータ駆動テストに使用されます。詳細については、[ビジュアルエディターからのデータ駆動テストの設定](/docs/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor)を参照してください。                                                                                                                                                                                                                                  |    |

# 手動ステップの追加

手動ステップは、Salesforceステップ、事前定義ステップ、または共有ステップのいずれかです。

:fa-arrow-right:   **ステップを手動で追加するには:**

1. **Setup step**の後、マウスを+ボタンの上に移動します。
2. **Add Steps**ボタンをクリックします。
3. 目的のタブ - [Salesforceステップ](/docs/salesforce-steps/salesforce-steps)、事前定義ステップ、または共有ステップをクリックします。
4. ステップを検索するには、検索ボックスにその名前を入力し始めてリストを絞り込みます。
5. リストから目的のステップをクリックします。
   [Salesforceステップ](/docs/salesforce-steps/salesforce-steps)の場合、**Properties**ペインが右側に表示されます。ペインには2つのタブが含まれます:
   **Object** - ステップのSalesforceオブジェクトプロパティを表示します。これらのプロパティには、設定が必要な必須プロパティが含まれる場合があります。
   **Properties** - ステップの動作に関連する追加のオプションプロパティを表示します。

![](/images/salesforce-testing/create-a-salesforce-test/2752956-manualstep.gif)

> 📘 ベストプラクティス - 変数命名規則
>
> テストケースまたはスイートの実行中に作成されたレコードの削除を自動化するには、テストで変数を作成する際に、[ベストプラクティス - 簡単なクリーンアップのための変数命名規則](/docs/salesforce-utilities/best-practice-variable-naming-convention-for-easy-cleanup)の手順に従ってください。

# ステップの記録

レコーダーを使用すると、AUT（テスト対象アプリケーション）とやり取りしながら、ステップを自動的に追加できます。この方法は、Salesforceステップに含まれていない特定のステップを追加する場合や、環境が高度にカスタマイズされているためにSalesforceステップがサポートされていない場合に特に役立ちます。レコーダーには2つの動作モードがあります:

- **Salesforceモード** - このモードは、レコーダーのクラウドアイコン（下記参照）で示され、レコーダーはSalesforceステップを実行し、単一のステップ内で複数のアクションの実行を可能にします。このモードは、Salesforce環境が広範囲にカスタマイズされている場合は機能しない可能性があります。このような場合、Webモードにフォールバックして、すべての個別のアクション/ステップを記録することが可能です。このモードを使用して作成されたステップは、クラウドアイコン（下記参照）でマークされます。Webモードに戻すには、レコーダーのクラウドアイコンをクリックします。

 ![](/images/salesforce-testing/create-a-salesforce-test/9381461-salesforce_mode.png)

![](/images/salesforce-testing/create-a-salesforce-test/de463f1-salesforcestep.png)

- **Webモード** - これはレコーダーの通常モードで、レコーダー上の打ち消し線付きのクラウドアイコン（下記参照）で示されます。このモードでは、すべてのインタラクション（クリック、スクロール、テキスト追加など）が個別のステップで表されます。Salesforceモードに戻すには、レコーダーのクラウドアイコンをクリックします。

![](/images/salesforce-testing/create-a-salesforce-test/6dfd53b-nosalesforcemode.png)

> 📘 Salesforceモードをオフにする必要がある場合
>
> 記録されたステップがエディターに表示されない場合は、クラウドアイコンをクリックしてSalesforceモードをオフにする必要があります。

:fa-arrow-right: **レコーダーを使用してステップを記録するには:**

1. 始める前に、Salesforce環境が接続されていることを確認してください。詳細については、[Salesforce環境の接続](/docs/salesforce-testing/create-and-manage-test-environments)を参照してください。
2. テストに[Log in](/docs/salesforce-steps/sfdc-step-login)ステップを追加します。
3. テストを実行して環境にログインし、追加のステップを記録できるようにします。
4. テストで、目的のステップの隣にある**+**ボタンの上にマウスを移動し、**Record**ボタンをクリックします。レコーダーは、青いクラウドアイコンで示される**Salesforceモード**で自動的に有効になります。これは、アプリケーションとのインタラクションが、関連する場合にSalesforceステップを生成することを意味します。
5. ![](/images/salesforce-testing/create-a-salesforce-test/1a9ac07-afterlogin.png)
6. Salesforceアプリケーションとやり取りしてステップを生成します。Salesforceステップはクラウドアイコンで示されます。

![](/images/salesforce-testing/create-a-salesforce-test/90023bd-salesforcesteps.png)
7. テストの作成が完了したら、**Save**をクリックします。
