---
title: 'プロジェクト設定'
description: 'プロジェクトの一般設定とプルリクエスト設定の変更方法について説明します。プロジェクト名、ベースURL、デフォルト設定、ブランチ保護などを管理します。'
category: 'project-user-management'
order: 4
updated: '2025-09-18'
sourceUrl: 'https://help.testim.io/docs/project-settings'
keywords:
  - プロジェクト設定
  - ベースURL
  - プルリクエスト
  - ブランチ保護
  - オートコンプリート
---

プロジェクト設定(名前、デフォルトURL、パーソナルCLIなど)の変更場所を学ぶ

**Settings > Project** タブでは、プロジェクトの一般設定を変更し、プルリクエスト設定を変更することもできます。

## 一般設定

**General** タブでは、プロジェクト名、デフォルトのベースURL、プロジェクトの非表示パラメータのリストなど、プロジェクトに関連する一般設定を変更できます。また、オートコンプリート提案機能のオン/オフを切り替えることもできます。

### プロジェクト名

プロジェクト名は、プロジェクト全体に適用される名前です。プロジェクトオーナーまたは企業オーナーのみがプロジェクト名を編集できます。

:fa-arrow-right: **プロジェクト名を編集するには:**

1. **Settings > Project** ページで、**General** をクリックします。

![Project Name編集ダイアログへの遷移ボタン](/images/project-user-management/project-settings/186b1b8-Picture1.png)

2. **Project Name** セクションで、**Edit** ボタン(鉛筆)をクリックします。

![Project Nameセクションの編集アイコン](/images/project-user-management/project-settings/f225cca-Picture2.png)

**Project Name** ウィンドウが開きます。\
3\. **Enter a new name for this project** フィールドに、新しい名前を入力します。

![新しいプロジェクト名を入力するフィールド](/images/project-user-management/project-settings/ad8a31f-Picture3.png)

4. **OK** をクリックします。

![OKボタンをクリックしてプロジェクト名を保存する画面](/images/project-user-management/project-settings/e99b797-Picture4.png)

**Project Name** ウィンドウが閉じ、プロジェクト名が更新されます。

### デフォルトベースURL

ベースURLは、新しいテストを作成する際に使用されるデフォルトのURLです。

:fa-arrow-right: **デフォルトベースURLを編集するには:**

1. **Settings > Project** ページで、**General** をクリックします。

![Default Base URLセクションの編集ボタン](/images/project-user-management/project-settings/e75b51b-Picture5.png)

2. **Default Base URL** セクションで、**Edit** ボタン(鉛筆)をクリックします。

![Base URL編集用の入力ダイアログ](/images/project-user-management/project-settings/2c841e2-Picture6.png)

**Test Default URL** ウィンドウが開きます。\
3\. **Your app URL** フィールドに、テスト対象のアプリのURLを入力します。

![344](/images/project-user-management/project-settings/38fd0c6-Picture7.png)

4. **OK** をクリックします。

![344](/images/project-user-management/project-settings/27396a6-Picture8.png)

**Test Default URL** ウィンドウが閉じ、ベースURLが更新されます。

### デフォルトテスト設定

デフォルトテスト設定は、新しいテストを作成する際に使用される設定です。設定リストで利用可能なテスト設定の1つを選択できます。詳細については、[設定リスト](/docs/test-management/shared-configuration)を参照してください。

:fa-arrow-right: **デフォルトテスト設定を編集するには:**

1. **Settings > Project** ページで、**General** をクリックします。

![533](/images/project-user-management/project-settings/4da3d58-Picture9.png)

2. **Default Test Configuration** セクションで、**Edit** ボタン(鉛筆)をクリックします。

![477](/images/project-user-management/project-settings/3b78b90-Picture10.png)

3. 希望のデフォルト設定を選択し、**Select** をクリックします。

![284](/images/project-user-management/project-settings/a8bb9b9-Picture11.png)

デフォルトテスト設定が更新されます。このプロジェクトの新しいテストは、選択した設定を使用して実行されます。

### オートコンプリート提案の許可

Testimのオートコンプリート機能は、現在記録中のテストで以前に記録された共有グループステップを自動的に使用するオプションを提供し、テスト記録プロセスを迅速化します。オートコンプリートの詳細については、[オートコンプリート](/docs/groups/auto-complete)を参照してください。

> 📘 この機能は、プロフェッショナルプランのプロジェクトのみ利用可能です。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/)をクリックしてください。

:fa-arrow-right: **オートコンプリート提案機能をオフ/オンにするには:**

1. **Settings > Project** ページで、**General** をクリックします。

![491](/images/project-user-management/project-settings/afd5208-Picture12.png)

2. **Allow auto-complete suggestions** トグルをクリックします。(左 = オフ; 右 = オン)

![487](/images/project-user-management/project-settings/05d39e3-Picture13.png)

### 非表示パラメータ

この設定では、非表示パラメータのリストを変更できます。CLI経由でテストを実行する際、Testimに送信されるパラメータ値を非表示にして、その値がTestimのデータベースに保存されたり、UIテスト結果に表示されたりしないようにすることができます。非表示パラメータの詳細については、[非表示パラメータ](/docs/parameters/hidden-parameters)を参照してください。

:fa-arrow-right: **非表示パラメータリストを変更するには:**

1. **Settings > Project** ページで、**General** をクリックします。

![475](/images/project-user-management/project-settings/7be7e39-Picture14.png)

現在の非表示パラメータのリストが **Hidden Parameters** セクションに表示されます。リストに現在パラメータがない場合は、**Add hidden params** リンクが表示されます。\
2\. **Add hidden params** リンクをクリックします。

![487](/images/project-user-management/project-settings/f841a78-Picture15.png)

> 📘 または、リストにすでにパラメータがある場合は、パラメータリストをクリックします。

**Hidden Parameters** ウィンドウが表示されます。

![784](/images/project-user-management/project-settings/a25a3bb-Picture16.png)

3. **The params you want to hide** フィールドで:

- 追加したい非表示パラメータごとに、パラメータの名前を入力し、Enterを押します。(非表示パラメータ名は大文字と小文字が区別されます。)
- 削除したい非表示パラメータごとに、パラメータ名の右側にある「**x**」をクリックします。

![315](/images/project-user-management/project-settings/a0c01f0-Picture17.png)

4. **Update** をクリックします。

![313](/images/project-user-management/project-settings/1e32984-Picture18.png)

更新された非表示パラメータのリストが **Hidden Parameters** セクションに表示されます。

## プルリクエスト設定

プルリクエスト設定では、プロジェクトの特定のブランチを変更から保護し、レビュアーの承認が必要なブランチとプルリクエストをレビューできるユーザーを設定できます。プルリクエスト設定はプロジェクトごとに設定されます。プロジェクトオーナーまたは企業オーナーのみがこれらの設定を変更できます。プルリクエストの詳細については、[プルリクエスト](/docs/testops-version-control/pull-requests)を参照してください。

> 📘 これはプロフェッショナルプランのプロジェクトのみ利用可能なプロ機能です。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/)をクリックしてください。

![521](/images/project-user-management/project-settings/cda9cf7-Picture19.png)

### 変更からのブランチ保護

この設定は、Masterブランチおよび/または選択したブランチへの直接書き込みを防ぎます(読み取り専用)。Masterブランチを選択した場合でも、[Auto-improve](/docs/test-management/locators-auto-improve)変更を許可して、テストの安定性を高めるためにテストロケータを自動的に改善することができます。

:fa-arrow-right: **プロジェクトのmasterブランチをロック/アンロックするには:**

1. **Protect branches from changes** トグルをオンにします。
2. 保護したいブランチを選択します。検索ボックスを使用してブランチを検索できます。
3. Masterブランチを選択した場合は、**Allow Auto-improve on master** トグルをオンにして、Auto-improve機能がテストの安定性を高めるためにテストロケータを自動的に改善できるようにします。

### レビュアーからの承認を要求

この設定は、ターゲットブランチにマージする前に、プルリクエストをレビュアーが承認する必要があるブランチと、レビュアーが誰であるかを指定します。

:fa-arrow-right: **レビュアーからの承認ブランチを設定するには:**

1. **Require approving reviewer** トグルをオンにします。
2. **Branches** の下で、この設定を適用したいブランチを選択します。検索ボックスを使用してブランチを検索できます。**All branches** を選択すると、すべてのブランチに設定を適用できます。
3. **Reviewers** の下で、リストからプロジェクトのレビュアーとなるユーザーを選択します。検索ボックスを使用してユーザーを検索できます。**All users** を選択すると、リスト内のすべてのユーザーをレビュアーとして設定できます。

### 自己承認の許可

Require approving reviewer機能を有効にしている場合、オプションで自分のプルリクエストを承認できるユーザーを選択できます。

:fa-arrow-right: **自己承認を設定するには:**

1. **Allow self approval** トグルをオンにします。
2. この設定を適用したいユーザーを選択します。検索ボックスを使用してユーザーを検索できます。
