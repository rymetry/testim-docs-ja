---
title: ステップのプロパティ編集
description: ステップ作成後にプロパティを編集する方法を学びます。一般プロパティと専門プロパティの設定方法を詳しく解説します。
category: テスト編集
order: 4005
updated: '2025-09-23'
sourceUrl: 'https://docs.tricentis.com/testim/content/editing-tests/editing-your-tests/editing-a-steps-properties.htm'
keywords:
  - ステッププロパティ
  - プロパティ編集
  - 設定
  - タイムアウト
  - 条件分岐
---

ステップを作成した後、そのステップのプロパティを編集できます。設定可能なプロパティオプションは、編集するステップのタイプによって異なります。

ステップのプロパティを編集するには：

1. 目的のステップの上にマウスを移動し、**Show Properties** アイコンをクリックします。

   ![プロパティアイコン](/images/steps-editing-tests/editing-a-steps-properties/3bd689a-properties.png)

   プロパティパネルが右側に開きます。

2. 目的の変更を行います。

   ![プロパティパネル](/images/steps-editing-tests/editing-a-steps-properties/2958483-2023-10-10_16-17-44.png)

   変更はテストに自動的に適用されます。

:::warning
エディター画面を閉じる前に、ヘッダーバーの **Save** ボタンをクリックして、すべての変更を保存してください。
:::

## プロパティの設定

プロパティパネルに表示されるプロパティのリストは、選択されたステップのタイプによって異なります。ほとんどのタイプのステップに関連するプロパティがいくつかあり、特定の専門的なタイプのステップにのみ関連するプロパティもあります。
以下の表は、さまざまなプロパティの設定方法と、関連機能のより詳細なドキュメントへのリンクを示しています。

<table class="md-table md-table-4cols">
 <thead>
  <tr>
   <th>
    プロパティ
   </th>
   <th>
    適用対象
   </th>
   <th>
    説明
   </th>
   <th>
    関連ドキュメント
   </th>
  </tr>
 </thead>
 <tbody>
  <tr>
   <td>
    <strong>
     一般プロパティ
    </strong>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Description
    </strong>
   </td>
   <td>
    すべて
   </td>
   <td>
    これはステップの編集可能な名前です。テストをより理解しやすくするために、ステップに情報的な名前を付けるようにしてください。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Disable Auto-scroll
    </strong>
   </td>
   <td>
    記録されたステップと検証
   </td>
   <td>
    ターゲット要素を見つけるにはスクロールが必要な場合がありますが、テストが最初に記録されたときには必要ありませんでした。デフォルトでは、Testim はビューポート外の要素に自動的にスクロールします。このチェックボックスを選択すると、このステップのこの機能が無効になります。Testim はビューポート内のみを検索し、ビューポート外にはスクロールしません。
   </td>
   <td>
    <a href="/docs/auto-scroll">Auto scroll</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Element must be visible
    </strong>
   </td>
   <td>
    記録されたステップと検証
   </td>
   <td>
    ターゲット要素がページ上に存在するが、ユーザーには表示されない場合があります。例えば、要素が現在ビューポートにない場合や、可視性が「display: none」に設定されている場合です。このボックスがチェックされている場合（デフォルト）、ターゲット要素が表示されている場合にのみステップが実行されます。
   </td>
   <td>
    <a href="/docs/why-did-my-test-fail#1-element-not-visible">Element not visible</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Error Suffix
    </strong>
   </td>
   <td>
    すべて
   </td>
   <td>
    ステップが失敗したときに表示されるエラーメッセージにサフィックスとしてカスタムメッセージを追加します。単純な文字列（例：'my custom error'）を入力するか、パラメーターを含む文字列（例：'my custom error' + `Param1`）を入力できます。
   </td>
   <td>
    <a href="/docs/error-suffix-customization">Error Suffix Customization</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Override timeout
    </strong>
   </td>
   <td>
    Sleep と Generate Date 以外のすべて
   </td>
   <td>
    「ステップタイムアウト」は、Testim がテストステップの失敗を登録する時間経過（ミリ秒）です。各ステップのデフォルトの時間経過は、最初に Setup ステップ構成で設定されます。このチェックボックスを選択すると、このステップのデフォルト設定を上書きし、異なる時間経過値（ミリ秒）を指定できます。注：ステップタイムアウトがステップの実行時間を超えることを確認してください。失敗したステップは、正常に実行するための時間が不足するまで再試行されます。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Target Element
    </strong>
   </td>
   <td>
    記録されたステップと検証
   </td>
   <td>
    これは、AUT（テスト対象アプリケーション）ブラウザで選択された要素（プロパティパネルの要素のサムネイル画像で表される）で、このテストステップの実行時にクリックされます。ターゲット要素は編集可能です。サムネイルの上にマウスを移動すると、Highlight、Reassign、Improve、View locators のオプションが表示されます。
   </td>
   <td>
    <a href="/docs/editing-target-element-properties">Editing Target Element Properties</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     When this step fails
    </strong>
   </td>
   <td>
    すべて
   </td>
   <td>
    ステップが失敗した場合、デフォルトの動作は、ステップにエラーをマークしてテストを停止することです。このデフォルトの動作を上書きできます。このプロパティのオプションは次のとおりです：

* **Mark error & stop**（デフォルト）- このオプションを選択すると、失敗したステップは赤色でマークされ、エラーを示します。テストは停止して失敗します。
* **Mark error & continue** - このオプションを選択すると、失敗したステップは赤色でマークされ、エラーを示します。テストは停止しませんが、失敗します。
* **Mark warning & continue** - このオプションを選択すると、失敗したステップはオレンジ色でマークされ、警告を示します。テストは停止せず、失敗もしません。
   </td>
   <td>
    <a href="/docs/why-did-my-test-fail">Why did my test fail?</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     When to run step
    </strong>
   </td>
   <td>
    すべて
   </td>
   <td>
    「when to run step」機能を使用すると、テストのステップをいつ実行するか、または実行しないかを制御できます。以下のオプションを適用できます：

* **Always Run** - テストを実行するたびにステップが実行されます。
* **Element** - 指定された要素がページに存在する（または存在しない）場合にステップが実行されます。
* **Element text** - 特定の要素内に指定されたテキストが存在する場合にステップが実行されます。
* **Custom** - 要素が特定の値を持つ場合にステップが実行されます。
* **Never (skip)** - ステップは実行されません。
   </td>
   <td>
    <a href="/docs/conditions">Conditions</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     専門プロパティ
    </strong>
   </td>
   <td>
   </td>
   <td>
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Add Prefix
    </strong>
   </td>
   <td>
    Generate random value
   </td>
   <td>
    値にプレフィックス文字列を追加します。例えば、「User」を追加すると、すべての値が User で始まります：User47、User65、User32。
   </td>
   <td>
    <a href="/docs/generating-a-random-value#自分で試してみましょう">Generate Random Value Step</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Add Suffix
    </strong>
   </td>
   <td>
    Generate random value
   </td>
   <td>
    値にサフィックス文字列を追加します。
   </td>
   <td>
    <a href="/docs/generating-a-random-value#自分で試してみましょう">Generate Random Value Step</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Allow API request retry
    </strong>
   </td>
   <td>
    Add API action, Validate API
   </td>
   <td>
    失敗した場合に API リクエストを再試行します。
   </td>
   <td>
    <a href="/docs/api-testing#実行後の結果の確認">API Validation</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Attribute name
    </strong>
   </td>
   <td>
    Validate HTML attribute
   </td>
   <td>
    これは、ステップが最初に作成されたときにユーザーが入力した属性名です。名前を変更するには、フィールド内をクリックして内容を編集します。
   </td>
   <td>
    <a href="/docs/html-attribute-validation">HTML Attribute Validation</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Cookie name
    </strong>
   </td>
   <td>
    Get Cookie
   </td>
   <td>
    Get Cookie ステップを使用すると、UI から直接テストのコンテキストで Cookie を取得できます。ステップを作成した後、ステップを編集して、取得したい Cookie の名前を指定する必要があります。名前を入力または変更するには、フィールド内をクリックして内容を編集します。
   </td>
   <td>
    <a href="/docs/cookies">Cookies</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Date format
    </strong>
   </td>
   <td>
    Generate date
   </td>
   <td>
    Testim が Generate date ステップに使用するデフォルトの形式は「YYYY-MM-DD」です。この形式を変更するには、フィールド内をクリックして内容を編集します。形式は任意の JS 日付形式にできます。
   </td>
   <td>
    <a href="https://day.js.org/docs/en/parse/string-format">JS Date Formats</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Expected status
    </strong>
   </td>
   <td>
    Validate checkbox, Validate radio button
   </td>
   <td>
    このプロパティは、チェックボックスまたはラジオボタンのチェック済みまたは未チェック状態を検証する場合に適用されます。デフォルト設定は Checked です。設定を変更するには、Unchecked ラジオボタンをクリックします。注：チェックボックスとラジオボタンの検証は、ネイティブのチェックボックスまたはラジオ入力要素でのみ使用できます。基礎となる入力を使用しないカスタムチェックボックスの実装はサポートされていません。
   </td>
   <td>
    <a href="/docs/checkbox-and-radio-button-validation#validate-checkboxradio-button-ステップの追加">How to Add Checkbox and Radio Button Validation</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Expected value
    </strong>
   </td>
   <td>
    Validate element text, Validate CSS property, Validate HTML attribute, Wait for element text
   </td>
   <td>
    これは、このステップの実行時に Testim が探している値です。この値は、ステップが作成されたときに最初に設定されました。値を変更するには、フィールド内をクリックして内容を編集します。注：Expected value フィールドでは、パラメーター、正規表現、JavaScript 式を使用できます。
   </td>
   <td>
    <a href="/docs/validate-element-text#パラメーターを使った検証">Advanced text validation</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Extract Mode
    </strong>
   </td>
   <td>
    Add extract value step
   </td>
   <td>
    抽出するデータタイプを指定します。デフォルトでは、モードは文字列全体を抽出することです。モードを変更して、数値、日付を抽出するか、正規表現を使用してテキストの一部のみを抽出できます。Number/Date/Regular Exp を抽出する場合でも、抽出された値は文字列になることに注意してください。
   </td>
   <td>
    <a href="/docs/extract-text">Extract Text</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Length
    </strong>
   </td>
   <td>
    Generate random value
   </td>
   <td>
    生成される値の長さを指定します。
   </td>
   <td>
    <a href="/docs/generating-a-random-value#自分で試してみましょう">Generate Random Value Step</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Native events
    </strong>
   </td>
   <td>
    Click
   </td>
   <td>
    Click ステップは（プロジェクトレベルで）ネイティブまたは非ネイティブイベントに変換するように構成されています。ネイティブイベントは通常、マウスボタンのクリックやタッチデバイスでのタップなど、ユーザーの操作によってトリガーされます。ネイティブクリックが発生すると、ブラウザは組み込みのイベント処理パイプラインに従って、イベントをネイティブに処理します。非ネイティブイベント（合成またはプログラマティッククリックとも呼ばれる）は、JavaScript またはその他のプログラマティック手段を使用して人工的に作成およびディスパッチされるクリックイベントです。非ネイティブクリックは通常、ユーザーの操作をシミュレートするためにスクリプトまたは自動化ツールによって生成されます。「click ステップ」が成功したにもかかわらず、クリックが実際には実行されなかったためにテストが失敗することがあります。考えられる解決策として、Native events チェックボックスを選択または選択解除してください。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Pre-step delay (ms)
    </strong>
   </td>
   <td>
    Validate element not visible, Wait for element not visible
   </td>
   <td>
    要素が表示されていないことを確認する前に遅延時間を設定したい場合があります。例えば、要素がページに突然表示されないことを確認したい場合です。デフォルトでは、遅延は設定されていません。遅延を設定するには、Pre-step delay チェックボックスを選択し、遅延時間をミリ秒で設定します。
   </td>
   <td>
    <a href="/docs/validate-element-not-visible">Validate element not visible</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Property name
    </strong>
   </td>
   <td>
    Validate CSS property
   </td>
   <td>
    これは、ステップが最初に作成されたときにユーザーが入力した CSS プロパティ名です。名前を変更するには、フィールド内をクリックして内容を編集します。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Replace with a clone
    </strong>
   </td>
   <td>
    Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for
   </td>
   <td>
    共有ステップを編集している場合、1 か所で変更すると、プロジェクトのすべてのインスタンスで変更されます。特定のテストのみのステップを変更するには、Replace with a clone をクリックします。
   </td>
   <td>
    <a href="/docs/groups#共有グループの特定のインスタンスのみをクローンで置き換える">How to change only one instance of a group</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     See old revisions
    </strong>
   </td>
   <td>
    Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for
   </td>
   <td>
    共有ステップへの変更を含む変更を含むテストを保存するたびに、変更前のテストのバージョンが自動的に保存されます。これらのテストの各バージョンはリビジョンと呼ばれます。リビジョンリストには、変更メッセージ、変更を行ったユーザーの名前、変更が行われた日付が含まれます。リビジョンを使用すると、常に変更を振り返り、古いリビジョンに戻す力が得られます。See old revisions リンクをクリックして、リビジョンリストを表示します。
   </td>
   <td>
    <a href="/docs/revisions">Revisions</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Send via web page
    </strong>
   </td>
   <td>
    Add API action, Validate API
   </td>
   <td>
    このプロパティは、HTTP リクエストを送信する場合、または API 呼び出しから返される値を検証する場合に適用されます。API が Cookie などのブラウザ情報も送信する必要がある場合は、このオプションをチェックしたままにします（自動的に送信されます）。ブラウザのコンテキスト外で API 呼び出しを送信して、ブラウザの制限が適用されないようにする場合にのみ、このオプションをオフにします（例えば、API が CORS をサポートしていない場合）。
   </td>
   <td>
    <a href="/docs/api-testing">API Testing</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     (Shared) step name
    </strong>
   </td>
   <td>
    Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for
   </td>
   <td>
    これは、ステップが最初に作成されたときにユーザーが入力した名前です。名前を変更するには、フィールド内をクリックして内容を編集します（ステップが共有ステップの場合、プロパティは Shared step name というラベルが付けられます。ステップが共有ステップでない場合、プロパティは Step name というラベルが付けられます）。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Sleep duration
    </strong>
   </td>
   <td>
    Sleep
   </td>
   <td>
    このプロパティは、次のステップに進む前にテストが待機する時間を設定します。デフォルトは 1 秒（1,000 ms）です。この値を変更するには、フィールド内をクリックして、新しいスリープ値（ms）を編集します。
   </td>
   <td>
    <a href="/docs/wait-for#要素の表示を待つ（モバイル）">Wait for</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     String type
    </strong>
   </td>
   <td>
    Generate random value
   </td>
   <td>
    生成される文字列のタイプ。文字のみ、数字のみ、またはその両方の混合が含まれます。
   </td>
   <td>
    <a href="/docs/generating-a-random-value#自分で試してみましょう">Generating a Random Value Step</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Time difference
    </strong>
   </td>
   <td>
    Generate date
   </td>
   <td>
    生成された日付/時刻は、ブラウザ時刻または UTC（UTC が選択されている場合）の前または後に設定できます。
   </td>
   <td>
    <a href="/docs/generating-a-date">Generating a Date</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     URL to assign
    </strong>
   </td>
   <td>
    Add navigation action
   </td>
   <td>
    テスト中に別のページに移動するための URL を指定します。
   </td>
   <td>
    <a href="/docs/navigation">How to Add a Parameter</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Use UTC
    </strong>
   </td>
   <td>
    Generate date
   </td>
   <td>
    ブラウザのタイムゾーンの代わりに UTC を使用する場合に選択します。
   </td>
   <td>
    <a href="/docs/generating-a-date">Generating a Date</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Variable name
    </strong>
   </td>
   <td>
    Add extract value step, Get cookie, Generate random value, Generate date
   </td>
   <td>
    これは、これらの各ステップでデータを保持する変数に Testim が使用するデフォルト名です。名前を変更するには、フィールド内をクリックして内容を編集します。注：変数名は JavaScript の名前制限の対象となります。例えば、スペースや特殊文字は使用できません。
   </td>
   <td>
    <a href="https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Variables">JavaScript variables</a>
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Variable scope
    </strong>
   </td>
   <td>
    Add extract value step, Get cookie, Generate random value, Generate date
   </td>
   <td>
    これらのタイプのステップで Testim が使用する変数のスコープを選択できます。デフォルトでは、変数スコープは Test に設定されています。変更したい場合は、Variable scope ドロップダウンをクリックして、次の 3 つのオプションのいずれかを選択します：

* **Local**: 同じグループ内（グループ内で宣言されている場合）またはテスト内（テストレベルから宣言されている場合）のステップ間でパラメーターを渡すことができます。
* **Test**: 同じテスト内のステップとグループ間でパラメーターを渡すことができます。
* **Suite**: 同じテストスイート内のテスト間でパラメーターを渡すことができます。
   </td>
   <td>
   </td>
  </tr>
  <tr>
   <td>

* PARAMS
   </td>
   <td>
    Add custom action, Add API action, Add custom validation, Validate API, Add network validation, and Add custom wait for
   </td>
   <td>
    パラメーターは、事前に情報がわからなくても、さまざまなシナリオをテストするためにステップで使用できます。PARAMS の横にある+をクリックすると、Testim でステップで使用する HTML パラメーターと JS パラメーターを定義できます。
   </td>
   <td>
    <a href="/docs/parameters">Parameters</a>
   </td>
  </tr>
 </tbody>
</table>
