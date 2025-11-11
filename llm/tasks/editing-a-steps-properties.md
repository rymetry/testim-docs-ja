# 翻訳タスク (editing-a-steps-properties)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

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

| プロパティ | 適用対象 | 説明 | 関連ドキュメント |
|---------|---------|------|--------------|
| **Description** | すべて | これはステップの編集可能な名前です。テストをより理解しやすくするために、ステップに情報的な名前を付けるようにしてください。 | - |
| **Disable Auto-scroll** | 記録されたステップと検証 | ターゲット要素を見つけるにはスクロールが必要な場合がありますが、テストが最初に記録されたときには必要ありませんでした。デフォルトでは、Testimはビューポート外の要素に自動的にスクロールします。このチェックボックスを選択すると、このステップのこの機能が無効になります。Testimはビューポート内のみを検索し、ビューポート外にはスクロールしません。 | Auto scroll |
| **Element must be visible** | 記録されたステップと検証 | ターゲット要素がページ上に存在するが、ユーザーには表示されない場合があります。たとえば、要素が現在ビューポートにない場合や、可視性が「display: none」に設定されている場合です。このボックスがチェックされている場合（デフォルト）、ターゲット要素が表示されている場合にのみステップが実行されます。 | Element not visible |
| **Error Suffix** | すべて | ステップが失敗したときに表示されるエラーメッセージにサフィックスとしてカスタムメッセージを追加します。単純な文字列（例：'my custom error'）を入力するか、パラメータを含む文字列（例：'my custom error' + Param1）を入力できます。 | Error Suffix Customization |
| **Override timeout** | SleepとGenerate Date以外のすべて | 「ステップタイムアウト」は、Testimがテストステップの失敗を登録する時間経過（ミリ秒）です。各ステップのデフォルトの時間経過は、最初にSetupステップ構成で設定されます。このチェックボックスを選択すると、このステップのデフォルト設定を上書きし、異なる時間経過値（ミリ秒）を指定できます。注：ステップタイムアウトがステップの実行時間を超えることを確認してください。失敗したステップは、正常に実行するための時間が不足するまで再試行されます。 | - |
| **Target Element** | 記録されたステップと検証 | これは、AUT（テスト対象アプリケーション）ブラウザで選択された要素（プロパティパネルの要素のサムネイル画像で表される）で、このテストステップの実行時にクリックされます。ターゲット要素は編集可能です。サムネイルの上にマウスを移動すると、Highlight、Reassign、Improve、View locatorsのオプションが表示されます。 | Editing Target Element Properties |
| **When this step fails** | すべて | ステップが失敗した場合、デフォルトの動作は、ステップにエラーをマークしてテストを停止することです。このデフォルトの動作を上書きできます。このプロパティのオプションは次のとおりです：<br/>• **Mark error & stop**（デフォルト）- このオプションを選択すると、失敗したステップは赤色でマークされ、エラーを示します。テストは停止して失敗します。<br/>• **Mark error & continue** - このオプションを選択すると、失敗したステップは赤色でマークされ、エラーを示します。テストは停止しませんが、失敗します。<br/>• **Mark warning & continue** - このオプションを選択すると、失敗したステップはオレンジ色でマークされ、警告を示します。テストは停止せず、失敗もしません。 | Why did my test fail? |
| **When to run step** | すべて | 「when to run step」機能を使用すると、テストのステップをいつ実行するか、または実行しないかを制御できます。以下のオプションを適用できます：<br/>• **Always Run** - テストを実行するたびにステップが実行されます。<br/>• **Element** - 指定された要素がページに存在する（または存在しない）場合にステップが実行されます。<br/>• **Element text** - 特定の要素内に指定されたテキストが存在する場合にステップが実行されます。<br/>• **Custom** - 要素が特定の値を持つ場合にステップが実行されます。<br/>• **Never (skip)** - ステップは実行されません。 | Conditions |

### 専門プロパティ

| プロパティ | 適用対象 | 説明 | 関連ドキュメント |
|---------|---------|------|--------------|
| **Add Prefix** | Generate random value | 値にプレフィックス文字列を追加します。たとえば、「User」を追加すると、すべての値がUserで始まります：User47、User65、User32。 | Generate Random Value Step |
| **Add Suffix** | Generate random value | 値にサフィックス文字列を追加します。 | Generate Random Value Step |
| **Allow API request retry** | Add API action, Validate API | 失敗した場合にAPIリクエストを再試行します。 | API Validation |
| **Attribute name** | Validate HTML attribute | これは、ステップが最初に作成されたときにユーザーが入力した属性名です。名前を変更するには、フィールド内をクリックして内容を編集します。 | HTML Attribute Validation |
| **Cookie name** | Get Cookie | Get Cookieステップを使用すると、UIから直接テストのコンテキストでCookieを取得できます。ステップを作成した後、ステップを編集して、取得したいCookieの名前を指定する必要があります。名前を入力または変更するには、フィールド内をクリックして内容を編集します。 | Cookies |
| **Date format** | Generate date | Testimが Generate dateステップに使用するデフォルトの形式は「YYYY-MM-DD」です。この形式を変更するには、フィールド内をクリックして内容を編集します。形式は任意のJS日付形式にできます。 | JS Date Formats |
| **Expected status** | Validate checkbox, Validate radio button | このプロパティは、チェックボックスまたはラジオボタンのチェック済みまたは未チェック状態を検証する場合に適用されます。デフォルト設定はCheckedです。設定を変更するには、Uncheckedラジオボタンをクリックします。注：チェックボックスとラジオボタンの検証は、ネイティブのチェックボックスまたはラジオ入力要素でのみ使用できます。基礎となる入力を使用しないカスタムチェックボックスの実装はサポートされていません。 | How to Add Checkbox and Radio Button Validation |
| **Expected value** | Validate element text, Validate CSS property, Validate HTML attribute, Wait for element text | これは、このステップの実行時にTestimが探している値です。この値は、ステップが作成されたときに最初に設定されました。値を変更するには、フィールド内をクリックして内容を編集します。注：Expected valueフィールドでは、パラメータ、正規表現、JavaScript式を使用できます。 | Advanced text validation |
| **Extract Mode** | Add extract value step | 抽出するデータタイプを指定します。デフォルトでは、モードは文字列全体を抽出することです。モードを変更して、数値、日付を抽出するか、正規表現を使用してテキストの一部のみを抽出できます。Number/Date/Regular Expを抽出する場合でも、抽出された値は文字列になることに注意してください。 | Extract Text |
| **Length** | Generate random value | 生成される値の長さを指定します。 | Generate Random Value Step |
| **Native events** | Click | Clickステップは（プロジェクトレベルで）ネイティブまたは非ネイティブイベントに変換するように構成されています。ネイティブイベントは通常、マウスボタンのクリックやタッチデバイスでのタップなど、ユーザーの操作によってトリガーされます。ネイティブクリックが発生すると、ブラウザは組み込みのイベント処理パイプラインに従って、イベントをネイティブに処理します。非ネイティブイベント（合成またはプログラマティッククリックとも呼ばれる）は、JavaScriptまたはその他のプログラマティック手段を使用して人工的に作成およびディスパッチされるクリックイベントです。非ネイティブクリックは通常、ユーザーの操作をシミュレートするためにスクリプトまたは自動化ツールによって生成されます。「clickステップ」が成功したにもかかわらず、クリックが実際には実行されなかったためにテストが失敗することがあります。考えられる解決策として、Native eventsチェックボックスを選択または選択解除してください。 | - |
| **Pre-step delay (ms)** | Validate element not visible, Wait for element not visible | 要素が表示されていないことを確認する前に遅延時間を設定したい場合があります。たとえば、要素がページに突然表示されないことを確認したい場合です。デフォルトでは、遅延は設定されていません。遅延を設定するには、Pre-step delayチェックボックスを選択し、遅延時間をミリ秒で設定します。 | Validate element not visible |
| **Property name** | Validate CSS property | これは、ステップが最初に作成されたときにユーザーが入力したCSSプロパティ名です。名前を変更するには、フィールド内をクリックして内容を編集します。 | - |
| **Replace with a clone** | Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for | 共有ステップを編集している場合、1か所で変更すると、プロジェクトのすべてのインスタンスで変更されます。特定のテストのみのステップを変更するには、Replace with a cloneをクリックします。 | How to change only one instance of a group |
| **See old revisions** | Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for | 共有ステップへの変更を含む変更を含むテストを保存するたびに、変更前のテストのバージョンが自動的に保存されます。これらのテストの各バージョンはリビジョンと呼ばれます。リビジョンリストには、変更メッセージ、変更を行ったユーザーの名前、変更が行われた日付が含まれます。リビジョンを使用すると、常に変更を振り返り、古いリビジョンに戻す力が得られます。See old revisionsリンクをクリックして、リビジョンリストを表示します。 | Revisions |
| **Send via web page** | Add API action, Validate API | このプロパティは、HTTPリクエストを送信する場合、またはAPI呼び出しから返される値を検証する場合に適用されます。APIがCookieなどのブラウザ情報も送信する必要がある場合は、このオプションをチェックしたままにします（自動的に送信されます）。ブラウザのコンテキスト外でAPI呼び出しを送信して、ブラウザの制限が適用されないようにする場合にのみ、このオプションをオフにします（たとえば、APIがCORSをサポートしていない場合）。 | API Testing |
| **(Shared) step name** | Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for | これは、ステップが最初に作成されたときにユーザーが入力した名前です。名前を変更するには、フィールド内をクリックして内容を編集します（ステップが共有ステップの場合、プロパティはShared step nameというラベルが付けられます。ステップが共有ステップでない場合、プロパティはStep nameというラベルが付けられます）。 | - |
| **Sleep duration** | Sleep | このプロパティは、次のステップに進む前にテストが待機する時間を設定します。デフォルトは1秒（1,000 ms）です。この値を変更するには、フィールド内をクリックして、新しいスリープ値（ms）を編集します。 | Wait for |
| **String type** | Generate random value | 生成される文字列のタイプ。文字のみ、数字のみ、またはその両方の混合が含まれます。 | Generating a Random Value Step |
| **Time difference** | Generate date | 生成された日付/時刻は、ブラウザ時刻またはUTC（UTCが選択されている場合）の前または後に設定できます。 | Generating a Date |
| **URL to assign** | Add navigation action | テスト中に別のページに移動するためのURLを指定します。 | How to Add a Parameter |
| **Use UTC** | Generate date | ブラウザのタイムゾーンの代わりにUTCを使用する場合に選択します。 | Generating a Date |
| **Variable name** | Add extract value step, Get cookie, Generate random value, Generate date | これは、これらの各ステップでデータを保持する変数にTestimが使用するデフォルト名です。名前を変更するには、フィールド内をクリックして内容を編集します。注：変数名はJavaScriptの名前制限の対象となります。たとえば、スペースや特殊文字は使用できません。 | JavaScript variables |
| **Variable scope** | Add extract value step, Get cookie, Generate random value, Generate date | これらのタイプのステップでTestimが使用する変数のスコープを選択できます。デフォルトでは、変数スコープはTestに設定されています。変更したい場合は、Variable scopeドロップダウンをクリックして、次の3つのオプションのいずれかを選択します：<br/>• **Local**: 同じグループ内（グループ内で宣言されている場合）またはテスト内（テストレベルから宣言されている場合）のステップ間でパラメータを渡すことができます。<br/>• **Test**: 同じテスト内のステップとグループ間でパラメータを渡すことができます。<br/>• **Suite**: 同じテストスイート内のテスト間でパラメータを渡すことができます。 | - |
| **PARAMS** | Add custom action, Add API action, Add custom validation, Validate API, Add network validation, Add custom wait for | パラメータは、事前に情報がわからなくても、さまざまなシナリオをテストするためにステップで使用できます。PARAMSの横にある+をクリックすると、Testimでステップで使用するHTMLパラメータとJSパラメータを定義できます。 | Parameters |

---

**最終更新**: 約1か月前
