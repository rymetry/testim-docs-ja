---
title: 日付の生成
description: 日付や時刻を扱うテスト向けに、指定したフォーマットやタイムゾーンで日付を生成するステップの作成方法を学びます。
category: テスト編集
order: 4013
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/generating-a-date.htm'
keywords:
  - 日付生成
  - Generate date
  - タイムゾーン
  - 日付フォーマット
  - 時差補正
  - UTC
  - ブラウザローカル時計
  - 変数スコープ
  - テストユーティリティ
  - 日時入力
---

日付や時刻を扱うテスト、または日付に依存した挙動を持つテストは、入力形式をフィールドのフォーマットに合わせる必要があったり、マシンのローカル日時とサーバーの日時が異なる場合があるなど、扱いが難しいことがあります。Testim では、あらかじめ定義されたプロパティに従って日付を生成するステップを簡単に作成できます。生成した日付はフィールドへの入力に使用できます。プロパティでは、日付フォーマット、どの時計／タイムゾーンを使用するか（例：ブラウザのローカル時計、UTC）、さらには時差の補正まで指定できます。このステップは既存のテストの任意の位置（最後のステップ、中間など）に追加できます。

## 生成日付ステップを追加する

**生成日付（Generate date）ステップを追加するには:**

![894](/images/test-utilities/generating-a-date/a09d76d-Jan-31-2021_06-26-26.gif)

1. 2 つのステップの間にある **>（矢印）** か、最後のステップの後ろにある **+（プラス）** にカーソルを合わせます。

![3665](/images/test-utilities/generating-a-date/46fca20-Testim_082b.png)

アクションのオプションが表示されます。

![アクションオプションメニュー](/images/test-utilities/generating-a-date/f22a0db-Testim_083a.png)

2. **"M"**（Testim の事前定義ステップ）をクリックします。\
事前定義ステップのメニューが開きます。

![事前定義ステップメニュー](/images/test-utilities/generating-a-date/bb5ad0a-Testim_034.png)

3. **Actions** をクリックします。\
Actions セクションが展開されます。

![Actions メニュー](/images/test-utilities/generating-a-date/981810c-Testim_079.png)

4. メニューをスクロールして **Generate date** を選択します。

:::info
代替手順: メニュー上部の検索ボックスで **Generate date** を検索しても構いません。
:::

「Generate date」ステップがエディターに追加されます。\
5. 作成したステップで **Show Properties**をクリックし、以下の説明に従ってプロパティを設定します。\
6. **Properties** ペインの **Step Parameters** ドロップダウンをクリックすると、現在の設定で生成された日付を確認できます。

## Generate Date のプロパティ

<table class="md-table md-table-3cols">
 <thead>
  <tr>
   <th>
    プロパティ
   </th>
   <th>
    説明
   </th>
   <th>
    コメント
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    Description
   </td>
   <td>
    ステップの名称。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    Variable Name
   </td>
   <td>
    変数名。
   </td>
   <td>
    既定値 - "dateValue"
   </td>
  </tr>
  <tr>
   <td>
    Date Format
   </td>
   <td>
    任意の JS 日付フォーマットを指定できます。各フォーマットについては<a href="https://day.js.org/docs/en/display/format">こちら</a>を参照してください。
   </td>
   <td>
    既定値 - 'YYYY-MM-DD'
   </td>
  </tr>
  <tr>
   <td>
    Time difference
   </td>
   <td>
    生成する日時をブラウザ時刻や UTC（UTC を選択した場合）から前後にずらせます。右側の単位フィールドをクリックして（seconds、minutes などの）単位を選択します。値フィールドで上下キーを使って値を設定します。正の値はブラウザ／UTC 時刻より後、負の値は前を意味します。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    Variable Scope
   </td>
   <td>
    変数を受け渡しできるスコープ: **Local:** 同一スコープ内のステップ間でパラメーターを受け渡しできます（例: グループ内でエクスポートしたパラメーターを同一グループ内で共有）。**Test:** 同一テスト内のステップやグループ間で受け渡しできます。test.Suite: 同一テストスイート内のテスト間で受け渡しできます。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    When this step fails
   </td>
   <td>
    ステップが失敗した場合の動作を指定します。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    When to run step
   </td>
   <td>
    ステップの実行条件を指定します。詳細は <a href="/docs/editing-tests/conditions">Conditions</a> を参照してください。
   </td>
   <td>
   </td>
  </tr>
 </tbody>
</table>

このステップの使用例は[こちら](https://app.testim.io/#/project/GYXR2qZC/branch/master/test/IrAg1rfldG)を参照してください。
