---
title: CLI 検証とアクションの追加
description: >-
  CLIステップを使用してNode.jsスクリプトを実行し、カスタム検証やアクションを追加する方法。ファイル操作やデータベース接続など高度な機能を実現できるPro機能です。
category: 高度な編集
order: 5008
updated: '2026-03-17'
sourceUrl: 'https://help.testim.io/docs/add-cli-validations-and-actions'
keywords:
  - CLI
  - コマンドライン
  - カスタム検証
  - Node.js
  - スクリプト実行
  - ターミナル
  - テスト拡張
  - Pro機能
  - CLIステップ
  - コマンド実行
---

テスト内から Node.js スクリプトを実行する

ブラウザーの実行環境で動作する [カスタム検証/アクション](/docs/custom-code) に加えて、CLI 環境（Node.js）で実行されるカスタムスクリプトも作成できます。

これらのスクリプトは通常のカスタムアクションと同様にテスト内から開始しますが、CLI アクション/検証では、データベースの検証・操作、画像や PDF の検証など、より高度な処理が可能です。CLI ステップの強力な点は、npm から任意のパッケージを追加して、そのステップの実行中だけスコープして使えることです。依存パッケージの定義は一般的な方法（パッケージパラメーター）に対応しています。

専用の CLI ステップとして *Validate download* もあります。各種ファイルのダウンロード内容が期待どおりかを検証できます。詳細は [Validate download](/docs/validate-download) を参照してください。

:::note
CLI アクションステップ中に出力されたログは、実行で起動したターミナルと、ステップ下部の「Step Log」に保存されます。
:::

:::note
これは Professional プランの機能です。詳しくは [pricing](https://www.testim.io/pricing/) を参照してください。
:::

## 前提条件

* CLI 検証/アクションを含むテストをローカルで実行するには、次のコマンドを実行します: `npm i -g @testim/testim-cli && testim connect`

**CLI 検証/アクションを含むテストをローカルで実行するには:**

1. OS の **Command Prompt**（端末）を開きます。
2. 次のコマンドを実行します: `npm i -g @testim/testim-cli && testim connect`

![CLI](/images/validations/add-cli-validations-and-actions/2ab6f86-Testim_164.png)

3. プロセスの完了を待ちます。

![CLI](/images/validations/add-cli-validations-and-actions/84cc9af-Testim_186.png)

## CLI ステップの追加

*Add CLI action* / *Add CLI validation* のどちらも手順は同じです。

**CLI ステップを追加するには:**

1. 追加したい位置の **（矢印）**（または最後のステップの **+**）にカーソルを合わせます。

![ステップ追加アイコン](/images/validations/add-cli-validations-and-actions/f982ee3-Testim_329a.png)

2. **"M"**（Testim の事前定義ステップ）をクリックします。\
   **Predefined steps** メニューが開きます。

![検証](/images/validations/add-cli-validations-and-actions/2d8835c-Testim_270_r2.png)

3. **Validations**（または **Actions**）をクリックします。\
   **Validations**（または **Actions**）メニューが展開されます。

![検証](/images/validations/add-cli-validations-and-actions/6485d77-Testim_271_r2.png)

4. **Add CLI validation**（または **Add CLI action**）を選択します。

:::info
メニュー上部の検索ボックスから **Add CLI validation** / **Add CLI action** を検索することもできます。
:::

**Add Step** ウィンドウが表示されます。

![ステップ追加](/images/validations/add-cli-validations-and-actions/62c3379-Testim_215_r.png)

5. **Name the new step** にステップ名を入力します。
6. このステップを共有ステップとして再利用可能にする場合は **Shared step** をオンにし、**Select shared step** で保存先フォルダーを選びます（デフォルトはオン）。共有しない場合はオフにします。\
   共有ステップの詳細は [Groups](/docs/groups) を参照してください。
7. **Create Step** をクリックします。\
   **function** エディターと右側の **Properties** パネルが開きます。

![検証](/images/validations/add-cli-validations-and-actions/3c8168d-Testim_330.png)

8. **Properties** パネルの **Description** に必要なら説明を入力します（既定値: “Run CLI validation” / “Run CLI action”）。
9. パラメーターを定義します。
   a. **+ PARAMS** をクリック\
   b. **JS parameter** — ドロップダウンを **JS** にして JavaScript パラメーターを入力\
   c. **Package parameter** — ドロップダウンを **Package** にして NPM パッケージ変数を入力

:::warning
コード内で npm パッケージを使う場合、`require` は行わず、ステップのパラメーターで PACKAGE として渡してください。
:::

![CLI](/images/validations/add-cli-validations-and-actions/4d4751d-CLI_action_param.gif)

  d. 追加した変数は “param” / “packageVariable” といった既定名になります。編集アイコンから分かりやすい名前に変更してください。

![Testimインターフェース](/images/validations/add-cli-validations-and-actions/d9532c0-Testim_331a_r.png)

10. **function** エディターにコードを記述します。定義したパラメーターはコードから参照できます。

:::info
CLI ステップで非同期コードを実行する場合は、解決させたい Promise を return してください。return しない場合は同期的に扱われ、最終行の実行時点でステップが解決されます。
:::

![CLI](/images/validations/add-cli-validations-and-actions/1418058-Testim_332.png)

11. ステップ失敗時の動作を指定するには、**When this step fails** を開き、*Mark error & stop* / *Mark error & continue* / *Mark warning & continue* を選択します。
12. ステップの実行条件を制御するには、**When to run step** を開いて設定します（[Conditions](/docs/conditions) 参照）。
13. 既定のタイムアウト（30000ms）を上書きする場合は、**Override timeout** をクリックして任意の値を入力します。
14. 左上の **back** 矢印でエディターに戻ります。

![戻る](/images/validations/add-cli-validations-and-actions/31b0037-Testim_332a.png)

ステップが作成されます。

![CLI](/images/validations/add-cli-validations-and-actions/a1d4d65-Testim_333.png)

### CLI ステップの例

* [MongoDB validation](/docs/mongodb-validation)
* [MySQL validation](/docs/mysql-validation)
* [Extract SMS message](/docs/extract-sms-message)
