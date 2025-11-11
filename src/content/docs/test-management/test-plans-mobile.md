---
title: 'テストプラン - モバイル'
description: 'すべてのテスト、セットアップ・クリーンアップテスト、および実行設定を含むモバイルアプリのテストプランの作成方法について説明します。'
category: 'テスト管理'
order: 13
updated: '2025-11-11'
keywords:
  - testim
  - test-plans-mobile
  - test-management
  - モバイルテストプラン
  - テスト実行
---

テストプランは、特定のテストラベルやテストスイートを含むテストのコンテナであり、連続して実行されるように整理できます。テストプランには、テスト/テストスイートのリストの前後に実行されるテスト/テストスイートを含めることができます。テストプランには、テストのデフォルト設定を上書きする設定を含めることができます。

テストプランは、次の操作を行う必要がある場合に最適です:

* テスト実行前に環境をセットアップする。
* テスト実行後に環境をクリーンアップする。
* 複数のデバイスとオペレーティングシステムでテストを実行する。

## 新しいモバイルテストプランの作成

:fa-arrow-right: **新しいテストプランを作成するには:**

1. メインメニューで**Test List**に移動します。
2. 上部ナビゲーションから**Plans**を選択します。
3. **New Plan**ボタンをクリックします。

![](/images/test-management/test-plans-mobile/fd4471d-new-test.png)

4. 新しいテストプランの**Name**と**Description**を入力します。

![](/images/test-management/test-plans-mobile/37d604b-newmobiletestplan.png)

5. テストプランのメインテストリストの前に一連のテストを実行したい場合は、**Add Before All**チェックボックスを選択します。1つ以上の[テストスイート](https://help.testim.io/docs/test-suites)または[テストラベル](https://help.testim.io/docs/labels)の名前を入力します。通常、これにはログインなどのセットアップステップが含まれます。

![](/images/test-management/test-plans-mobile/1aeb540-newmobiletestplan.png)

6. **Test List**ボックスに1つ以上の[テストスイート](https://help.testim.io/docs/test-suites)または[テストラベル](https://help.testim.io/docs/labels)の名前を入力します。

![](/images/test-management/test-plans-mobile/d77b93b-newmobiletestplan.png)

7. テストリストの実行後に「クリーンアップ」テストを追加したい場合は、**Add After All**チェックボックスを選択します。1つ以上の[テストスイート](https://help.testim.io/docs/test-suites)または[テストラベル](https://help.testim.io/docs/labels)の名前を入力します。テストプランに「クリーンアップ」テストを含めることはベストプラクティスです。これらは、テストの完了後にキャッシュのクリア、データのクリーンアップ、ユーザーのログアウトなどを行うために設計されたテストです。

![](/images/test-management/test-plans-mobile/7cf9f5b-newmobiletestplan.png)

> 📘 注意:
>
> * 「Before all」と「After all」のテストは、常に並列レベル`1`で実行されます。CLIで設定されている場合、「Test List」のみがより高い並列化レベルで実行できます。
> * 「before all」テストの1つが失敗した場合、Test listのテストは実行されません。
> * 「Add After All」のテストは、Test listのテストが失敗しても常に実行されます。

8. **Where to Run**フィールドで、テストを実行する**Mobile Grid**を選択します。詳細については、[Grid Management](https://help.testim.io/docs/grid-management)を参照してください。

![](/images/test-management/test-plans-mobile/103e4f6-newmobiletestplan.png)

> 📘
>
> **Override default configurations**を選択すると、選択したグリッドに関連付けられた設定のみが表示されます。

9. **What to run on**セクションで、**Override default configurations**チェックボックスを選択して、選択した設定でテストのデフォルト設定を上書きします。選択したグリッドでサポートされている設定のみが表示されます。設定のリストから選択するか、新しい設定を作成します。詳細については、[Configurations Library](https://help.testim.io/docs/configuration-library-mobile)を参照してください。複数の設定を選択すると、それぞれ複数の実行が行われます。各設定は、グリッドから自動的に選択された単一のデバイスで実行される実行をトリガーします。

![](/images/test-management/test-plans-mobile/5093526-newmobiletestplan.png)

10. **What to run on**セクションで、**Override Application**チェックボックスを選択して、テストで設定されたデフォルトのモバイルアプリを、テストプランの別のアプリケーションで上書きします。

![](/images/test-management/test-plans-mobile/072107c-newmobiletestplan.png)

11. **Create**ボタンをクリックして、テストプランを作成します。

## テストプランの実行

テストプランを実行するには、次のようにCLIコマンドでプラン名を指定する必要があります:

`--test-plan "Test Plan Demo"`

> 📘
>
> CLIに別のグリッド名を追加すると、プランで定義されたグリッドが上書きされます。

> 📘 CLIステップ
>
> テストにCLIステップがある場合は、実行前にCLIが実行されていることを確認してください。

## テスト間でのパラメーターの共有

プランを使用すると、テスト間でパラメーターを共有できます。たとえば、セットアップでアカウントを作成し、すべてのテストでその資格情報を使用できます。詳細については、[Parameters](https://help.testim.io/docs/parameters)を参照してください。
