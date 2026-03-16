---
title: Salesforce APEX アクションステップ
description: >-
  Salesforce の APEX コードをテストステップとして実行し、UI を越えた E2E 検証やバックエンドデータ操作を行う Salesforce
  APEX アクションステップの使い方を説明します。
category: 高度な編集
order: 5059
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/salesforce-apex-action-step'
keywords:
  - Salesforce APEX
  - APEX アクション
  - Salesforce テスト
  - 特殊ステップ
  - バックエンド検証
  - データ操作
  - CLI エージェント
  - Testim
  - 接続情報
  - パラメータ
---

APEX コードをテスト内のステップとして実行し、UI を越えた E2E 検証を可能にします。APEX コードブロックに任意のパラメータを渡せます。APEX 側の入力パラメータは文字列型で受け取り、必要に応じて APEX 内で型変換してください。実行後、Salesforce から返ったデータなどはステップログで確認できます。

:::warning
Salesforce 環境で 2FA が有効な場合、テスト実行マシンの IP を管理者にホワイトリスト登録してもらってください。
:::

ローカルで本ステップを含むテストを実行するには、事前に次を実行します: **npm i -g @testim/testim-cli && testim connect**

以下に *Salesforce APEX action* ステップの追加手順と、代表的なコード例を示します。

## Salesforce APEX アクションステップを追加する

**追加手順:**

1. 追加したい位置の **（矢印）** にカーソルを合わせます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/7be8ce7-Testim_512a.png)

アクションオプションが表示されます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/afcfd40-Testim_566.png)

2. “**M**”（Testim predefined steps）をクリックします。\
   **Predefined steps** メニューが開きます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/eb0f440-Testim_544_r.png)

3. **Salesforce** をクリックします。\
   **Salesforce** メニューが展開されます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/67feeca-Testim_545_r.png)

4. メニューをスクロールし、**Salesforce APEX action** を選択します。

:::note
メニュー上部の検索ボックスに **Salesforce APEX action** と入力して検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/2d49d61-Testim_567_r.png)

5. **Name the new step** フィールドに、このステップのわかりやすい名前を入力します。
6. このステップを他のテストでも再利用できる共有ステップとして保存したい場合は、**Shared step** チェックボックス（デフォルトでオン）をそのままにし、**Select shared step folder** リストから保存先フォルダを選択します。共有ステップにしない場合はチェックを外します。\
   共有ステップの詳細は [グループ](/docs/groups) を参照してください。
7. **Create Step** をクリックします。\
   **function** エディタが開き、右側に Properties パネルが表示されます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/db6f5b8-Testim_537.png)

8. **Properties** パネルの **Description** フィールドで、このステップの説明を必要に応じて編集します（既定値は “Run Salesforce Apex action”）。
9. APEX コードを実行したい Salesforce 環境への接続情報を入力します。\
   文字列（シングルまたはダブルクォートで囲む）またはパラメータ（クォートなし）を指定できます。パラメータの使い方の詳細は後述の [Using Parameters](/docs/salesforce-apex-action-step#using-parameters) を参照してください。

* **URL** フィールドに、対象 Salesforce 環境の URL を入力します。
* **Username** フィールドに、Salesforce のユーザー名を入力します。
* **Password** フィールドに、Salesforce のパスワードを入力します。
* **Security Token** フィールドに、Salesforce で発行されたセキュリティトークンを入力します。\
  セキュリティトークンは Salesforce の **My Personal Information** セクションから再発行できます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/433db97-Testim_535.png)

10. APEX 側の入力パラメータは文字列型で受け取ります。必要なパラメータを次のように定義します。\
    a. **Properties** パネルの **APEX Params** セクションで **+ APEX PARAMS** ボタンをクリックします。\
    b. パラメータの **Value** を入力します。この値は自動的に *string* 型に変換されます（Step 12 で説明するコード内で別の型に変換可能です）。\
    c. パラメータ名はデフォルトで “param” になります。わかりやすい名前に変更したい場合は **edit** アイコンをクリックして任意の名前を入力します。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/7007b2f-Testim_538a_r.png)

11. 任意設定のプロパティ:

* **When this step fails** – ステップが失敗した場合の挙動。
* **When to run step** – ステップ実行条件。詳細は [Conditions](/docs/conditions) を参照してください。
* **Override timeout** – 既定のタイムアウト時間（この時間を超えるとステップ失敗とみなされる）を上書きし、別の時間（ミリ秒）を設定します。

12. **function** 欄に APEX コードを記述します。定義したパラメータをこのコード内で参照できます。
13. 戻る矢印をクリックしてメインのエディタに戻ります。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/d91f582-Testim_540a_r.png)

設定が完了すると、テスト実行時に APEX コードが呼び出されます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/eb1a459-Testim_541a.png)

14. 実行前に **npm i -g @testim/testim-cli && testim connect** を実行して CLI エージェントを起動してください。\
    起動していない場合は、テスト実行時に接続を促すプロンプトが表示されます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/5f98f17-Testim_536_r.png)

テストを実行すると、コードエディタ内の Step Log で Salesforce からの結果を確認できます。

### パラメータの使用

テスト／スイート／設定ファイル／他ステップで定義したパラメータを用いて、接続情報を渡せます。

**接続情報にパラメータを使う:**

1. 次のいずれかの方法でパラメータを定義します。

* **テストデータにパラメータを追加** – テストの最初のステップである **Setup** ステップに **Test Data** を追加してパラメータを定義します。詳細な手順は [Configuring a data driven test from the visual editor](/docs/data-driven-testing#section-configuring-a-data-driven-test-from-the-visual-editor) を参照してください。
* **設定ファイルにパラメータを追加** – [Configuration file](/docs/configuration-file-run-hooks) にパラメータを追加します。詳細は [Configuring Data Driven Tests using the Config file](/docs/data-driven-testing#section-configuring-data-driven-tests-using-the-config-file) を参照してください。
* **カスタムステップにパラメータを追加** – カスタムステップを作成してパラメータを追加します。詳細は [Parameters in custom JavaScript steps](/docs/parameters-in-custom-javascript-steps) を参照してください。\
  その後、エクスポート機能を使ってパラメータを *Salesforce APEX action* ステップ、またはテストレベルに渡します。詳細は [Exports Parameters](/docs/exports-parameters) を参照してください。

2. *Salesforce APEX action* ステップの **URL**、**Username**、**Password** フィールドに、上記で定義したパラメータを設定します。

## 例: APEX アクション

*Salesforce APEX action* ステップを使うと、Salesforce オブジェクトを直接操作できます。同じテスト内に検証用ステップを追加すれば、オブジェクトへの変更がアプリケーション上に正しく反映されたかどうかも確認できます。1 回のステップで複数のオブジェクトをまとめて操作することも可能です。

### 新規アカウントの検証

この例では *Salesforce APEX action* ステップを使って新しいアカウントを作成します。Salesforce 側には、アカウントオブジェクト内のカスタムテキストフィールド `mySpecialField` にアカウント名をコピーするルールが設定されているとします。追加の検証ステップで、accountName フィールドと mySpecialField フィールドの値が同一であることを確認し、ルールが正しく適用されたかを検証します。

![2061](/images/special-steps/salesforce-apex-action-step/ec7a3f9-Testim_542.png)

#### コード例

```text
List<Account> account1= [SELECT Id,Name FROM Account];

Account newAcct = new Account(name = accountName);
try {
  insert newAcct;
} catch (DmlException e) {
// Process exception here
}
```

## 実行結果ログの確認

*Salesforce APEX action* ステップを含むテストを実行すると、コードエディタの Step Log から Salesforce から返却された結果を確認できます。

**確認手順:**

1. 結果を確認したい *Salesforce APEX action* ステップをダブルクリックします。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/324def4-Testim_564a.png)

コードエディタが開き、画面下部に **Step Log** が表示されます。

Salesforce からログが返っている場合、その詳細が Step Log セクションに表示されます。

![Salesforce APEX アクションステップのスクリーンショット](/images/special-steps/salesforce-apex-action-step/4d25a94-Testim_539a.png)
