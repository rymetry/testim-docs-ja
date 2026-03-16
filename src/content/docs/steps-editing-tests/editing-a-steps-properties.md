---
title: ステップのプロパティ編集
description: ステップ作成後にプロパティを編集する方法を学びます。一般プロパティと専門プロパティの設定方法を詳しく解説します。
category: テスト編集
order: 4005
updated: '2026-03-17'
sourceUrl: 'https://help.testim.io/docs/editing-a-steps-properties'
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

:::danger
エディター画面を閉じる前に、ヘッダーバーの **Save** ボタンをクリックして、すべての変更を保存してください。
:::

## プロパティの設定

プロパティパネルに表示されるプロパティのリストは、選択されたステップのタイプによって異なります。ほとんどのタイプのステップに関連するプロパティがいくつかあり、特定の専門的なタイプのステップにのみ関連するプロパティもあります。

以下の表は、さまざまなプロパティの設定方法と、関連機能のより詳細なドキュメントへのリンクを示しています。

### 一般プロパティ

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
    -
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
    ターゲット要素を見つけるにはスクロールが必要な場合がありますが、テストが最初に記録されたときには必要ありませんでした。デフォルトでは、Testimはビューポート外の要素に自動的にスクロールします。このチェックボックスを選択すると、このステップのこの機能が無効になります。Testimはビューポート内のみを検索し、ビューポート外にはスクロールしません。
   </td>
   <td>
    Auto scroll
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
    ターゲット要素がページ上に存在するが、ユーザーには表示されない場合があります。たとえば、要素が現在ビューポートにない場合や、可視性が「display: none」に設定されている場合です。このボックスがチェックされている場合（デフォルト）、ターゲット要素が表示されている場合にのみステップが実行されます。
   </td>
   <td>
    Element not visible
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
    ステップが失敗したときに表示されるエラーメッセージにサフィックスとしてカスタムメッセージを追加します。単純な文字列（例：'my custom error'）を入力するか、パラメータを含む文字列（例：'my custom error' + Param1）を入力できます。
   </td>
   <td>
    Error Suffix Customization
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     Override timeout
    </strong>
   </td>
   <td>
    SleepとGenerate Date以外のすべて
   </td>
   <td>
    「ステップタイムアウト」は、Testimがテストステップの失敗を登録する時間経過（ミリ秒）です。各ステップのデフォルトの時間経過は、最初にSetupステップ構成で設定されます。このチェックボックスを選択すると、このステップのデフォルト設定を上書きし、異なる時間経過値（ミリ秒）を指定できます。注：ステップタイムアウトがステップの実行時間を超えることを確認してください。失敗したステップは、正常に実行するための時間が不足するまで再試行されます。
   </td>
   <td>
    -
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
    これは、AUT（テスト対象アプリケーション）ブラウザで選択された要素（プロパティパネルの要素のサムネイル画像で表される）で、このテストステップの実行時にクリックされます。ターゲット要素は編集可能です。サムネイルの上にマウスを移動すると、Highlight、Reassign、Improve、View locatorsのオプションが表示されます。
   </td>
   <td>
    Editing Target Element Properties
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
    <br/>
    •
    <strong>
     Mark error &amp; stop
    </strong>
    （デフォルト）- このオプションを選択すると、失敗したステップは赤色でマークされ、エラーを示します。テストは停止して失敗します。
    <br/>
    •
    <strong>
     Mark error &amp; continue
    </strong>
    - このオプションを選択すると、失敗したステップは赤色でマークされ、エラーを示します。テストは停止しませんが、失敗します。
    <br/>
    •
    <strong>
     Mark warning &amp; continue
    </strong>
    - このオプションを選択すると、失敗したステップはオレンジ色でマークされ、警告を示します。テストは停止せず、失敗もしません。
   </td>
   <td>
    Why did my test fail?
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
    <br/>
    •
    <strong>
     Always Run
    </strong>
    - テストを実行するたびにステップが実行されます。
    <br/>
    •
    <strong>
     Element
    </strong>
    - 指定された要素がページに存在する（または存在しない）場合にステップが実行されます。
    <br/>
    •
    <strong>
     Element text
    </strong>
    - 特定の要素内に指定されたテキストが存在する場合にステップが実行されます。
    <br/>
    •
    <strong>
     Custom
    </strong>
    - 要素が特定の値を持つ場合にステップが実行されます。
    <br/>
    •
    <strong>
     Never (skip)
    </strong>
    - ステップは実行されません。
   </td>
   <td>
    Conditions
   </td>
  </tr>
 </tbody>
</table>

### 専門プロパティ

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
     Add Prefix
    </strong>
   </td>
   <td>
    Generate random value
   </td>
   <td>
    値にプレフィックス文字列を追加します。たとえば、「User」を追加すると、すべての値がUserで始まります：User47、User65、User32。
   </td>
   <td>
    Generate Random Value Step
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
    Generate Random Value Step
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
    失敗した場合にAPIリクエストを再試行します。
   </td>
   <td>
    API Validation
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
    HTML Attribute Validation
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
    Get Cookieステップを使用すると、UIから直接テストのコンテキストでCookieを取得できます。ステップを作成した後、ステップを編集して、取得したいCookieの名前を指定する必要があります。名前を入力または変更するには、フィールド内をクリックして内容を編集します。
   </td>
   <td>
    Cookies
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
    Testimが Generate dateステップに使用するデフォルトの形式は「YYYY-MM-DD」です。この形式を変更するには、フィールド内をクリックして内容を編集します。形式は任意のJS日付形式にできます。
   </td>
   <td>
    JS Date Formats
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
    このプロパティは、チェックボックスまたはラジオボタンのチェック済みまたは未チェック状態を検証する場合に適用されます。デフォルト設定はCheckedです。設定を変更するには、Uncheckedラジオボタンをクリックします。注：チェックボックスとラジオボタンの検証は、ネイティブのチェックボックスまたはラジオ入力要素でのみ使用できます。基礎となる入力を使用しないカスタムチェックボックスの実装はサポートされていません。
   </td>
   <td>
    How to Add Checkbox and Radio Button Validation
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
    これは、このステップの実行時にTestimが探している値です。この値は、ステップが作成されたときに最初に設定されました。値を変更するには、フィールド内をクリックして内容を編集します。注：Expected valueフィールドでは、パラメータ、正規表現、JavaScript式を使用できます。
   </td>
   <td>
    Advanced text validation
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
    抽出するデータタイプを指定します。デフォルトでは、モードは文字列全体を抽出することです。モードを変更して、数値、日付を抽出するか、正規表現を使用してテキストの一部のみを抽出できます。Number/Date/Regular Expを抽出する場合でも、抽出された値は文字列になることに注意してください。
   </td>
   <td>
    Extract Text
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
    Generate Random Value Step
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
    Clickステップは（プロジェクトレベルで）ネイティブまたは非ネイティブイベントに変換するように構成されています。ネイティブイベントは通常、マウスボタンのクリックやタッチデバイスでのタップなど、ユーザーの操作によってトリガーされます。ネイティブクリックが発生すると、ブラウザは組み込みのイベント処理パイプラインに従って、イベントをネイティブに処理します。非ネイティブイベント（合成またはプログラマティッククリックとも呼ばれる）は、JavaScriptまたはその他のプログラマティック手段を使用して人工的に作成およびディスパッチされるクリックイベントです。非ネイティブクリックは通常、ユーザーの操作をシミュレートするためにスクリプトまたは自動化ツールによって生成されます。「clickステップ」が成功したにもかかわらず、クリックが実際には実行されなかったためにテストが失敗することがあります。考えられる解決策として、Native eventsチェックボックスを選択または選択解除してください。
   </td>
   <td>
    -
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
    要素が表示されていないことを確認する前に遅延時間を設定したい場合があります。たとえば、要素がページに突然表示されないことを確認したい場合です。デフォルトでは、遅延は設定されていません。遅延を設定するには、Pre-step delayチェックボックスを選択し、遅延時間をミリ秒で設定します。
   </td>
   <td>
    Validate element not visible
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
    これは、ステップが最初に作成されたときにユーザーが入力したCSSプロパティ名です。名前を変更するには、フィールド内をクリックして内容を編集します。
   </td>
   <td>
    -
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
    共有ステップを編集している場合、1か所で変更すると、プロジェクトのすべてのインスタンスで変更されます。特定のテストのみのステップを変更するには、Replace with a cloneをクリックします。
   </td>
   <td>
    How to change only one instance of a group
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
    共有ステップへの変更を含む変更を含むテストを保存するたびに、変更前のテストのバージョンが自動的に保存されます。これらのテストの各バージョンはリビジョンと呼ばれます。リビジョンリストには、変更メッセージ、変更を行ったユーザーの名前、変更が行われた日付が含まれます。リビジョンを使用すると、常に変更を振り返り、古いリビジョンに戻す力が得られます。See old revisionsリンクをクリックして、リビジョンリストを表示します。
   </td>
   <td>
    Revisions
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
    このプロパティは、HTTPリクエストを送信する場合、またはAPI呼び出しから返される値を検証する場合に適用されます。APIがCookieなどのブラウザ情報も送信する必要がある場合は、このオプションをチェックしたままにします（自動的に送信されます）。ブラウザのコンテキスト外でAPI呼び出しを送信して、ブラウザの制限が適用されないようにする場合にのみ、このオプションをオフにします（たとえば、APIがCORSをサポートしていない場合）。
   </td>
   <td>
    API Testing
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
    これは、ステップが最初に作成されたときにユーザーが入力した名前です。名前を変更するには、フィールド内をクリックして内容を編集します（ステップが共有ステップの場合、プロパティはShared step nameというラベルが付けられます。ステップが共有ステップでない場合、プロパティはStep nameというラベルが付けられます）。
   </td>
   <td>
    -
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
    このプロパティは、次のステップに進む前にテストが待機する時間を設定します。デフォルトは1秒（1,000 ms）です。この値を変更するには、フィールド内をクリックして、新しいスリープ値（ms）を編集します。
   </td>
   <td>
    Wait for
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
    Generating a Random Value Step
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
    生成された日付/時刻は、ブラウザ時刻またはUTC（UTCが選択されている場合）の前または後に設定できます。
   </td>
   <td>
    Generating a Date
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
    テスト中に別のページに移動するためのURLを指定します。
   </td>
   <td>
    How to Add a Parameter
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
    ブラウザのタイムゾーンの代わりにUTCを使用する場合に選択します。
   </td>
   <td>
    Generating a Date
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
    これは、これらの各ステップでデータを保持する変数にTestimが使用するデフォルト名です。名前を変更するには、フィールド内をクリックして内容を編集します。注：変数名はJavaScriptの名前制限の対象となります。たとえば、スペースや特殊文字は使用できません。
   </td>
   <td>
    JavaScript variables
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
    これらのタイプのステップでTestimが使用する変数のスコープを選択できます。デフォルトでは、変数スコープはTestに設定されています。変更したい場合は、Variable scopeドロップダウンをクリックして、次の3つのオプションのいずれかを選択します：
    <br/>
    •
    <strong>
     Local
    </strong>
    : 同じグループ内（グループ内で宣言されている場合）またはテスト内（テストレベルから宣言されている場合）のステップ間でパラメータを渡すことができます。
    <br/>
    •
    <strong>
     Test
    </strong>
    : 同じテスト内のステップとグループ間でパラメータを渡すことができます。
    <br/>
    •
    <strong>
     Suite
    </strong>
    : 同じテストスイート内のテスト間でパラメータを渡すことができます。
   </td>
   <td>
    -
   </td>
  </tr>
  <tr>
   <td>
    <strong>
     PARAMS
    </strong>
   </td>
   <td>
    Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for
   </td>
   <td>
    パラメータは、事前に情報がわからなくても、さまざまなシナリオをテストするためにステップで使用できます。PARAMSの横にある+をクリックすると、Testimでステップで使用するHTMLパラメータとJSパラメータを定義できます。
   </td>
   <td>
    Parameters
   </td>
  </tr>
 </tbody>
</table>
