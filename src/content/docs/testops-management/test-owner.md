---
title: 'テストオーナー'
description: '原文: https://help.testim.io/docs/test-owner'
category: 'TestOps管理'
order: 3
updated: '2025-11-02'
keywords:
  - testim
  - test-owner
  - testops-management
---
テストにオーナーを割り当てて、作業負荷をスケーリングしながら冗長性を最小化します

テストオーナー機能により、各テストの「オーナー」を指定できます。これは、テストの責任者を識別したり、テストオーナーでテストライブラリやスイート実行結果をフィルタリングしたりするのに役立ちます。デフォルトでは、最初のテストオーナーはテストの作成者です。テストを新しいオーナーに再割り当てできます。

> 📘 これは PRO 機能です
>
> この機能は、プロフェッショナルプランのプロジェクトのみに公開されています。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/)をクリックしてください。

> 📘 テストオーナーを再割り当てすると、テストリビジョンが自動的に作成されます。詳細については、[リビジョン](/docs/test-management/revisions)をご覧ください。

> 📘 テストは異なるブランチで異なるオーナーを持つことができます。例: Sample\_Test はマスターブランチでオーナー A を持ち、別のブランチでオーナー B を持つことができます。ブランチをマージする場合、新しくマージされたテストに割り当てるオーナーを決定する必要があります。詳細については、[バージョン管理（ブランチ）](/docs/testops-version-control/version-control-branches)をご覧ください。

## テストオーナーの変更

エディタで開いているテストを新しいテストオーナーに再割り当てでき、テストライブラリでは個別のテストまたは複数のテストを新しいオーナーに再割り当てできます。

### エディタでテストオーナーを変更

:fa-arrow-right: **エディタでテストオーナーを再割り当てするには:**

1. エディタでテストを開きます。詳細については、[テストを開く](doc:test-list#opening-a-test)をご覧ください。
2. **ステッププロパティを表示**アイコンをクリックして、**テスト構成プロパティ**パネルを開きます。

![3851](/images/testops-management/test-owner/7b99d23-Testim_196a.png)

> 📘 または、テストの最初のステップにカーソルを合わせて、**プロパティを表示（:fa-cog:）**アイコンをクリックします。

3. **Test owner** フィールドをクリックします。

![200](/images/testops-management/test-owner/c7347ec-Testim_197a_r.png)

**Replace Test Owner** ウィンドウが表示されます。

![300](/images/testops-management/test-owner/a0e5978-Testim_194_r.png)

4. 新しいオーナーを選択し、**Confirm** をクリックします。\
   ウィンドウが閉じ、新しいオーナーがリストに表示されます。
5. **ステッププロパティを表示**アイコンをクリックして、**テスト構成プロパティ**パネルを閉じます。

### テストライブラリでテストオーナーを変更

:fa-arrow-right: **テストライブラリでテストオーナーを再割り当てするには:**

1. **テストライブラリ**（**Test List** > **Tests**）に移動します。

![3851](/images/testops-management/test-owner/41cae47-Testim_192.png)

2. オーナーを変更したいテスト（または複数のテスト）を選択します。\
   追加のオプションが**トップメニュー**に表示されます。

![3851](/images/testops-management/test-owner/9237d3f-Testim_193a.png)

3. **Replace owner** アイコンをクリックします（またはテストを右クリックして、表示されるリストから **Replace owner** を選択します）。

![3851](/images/testops-management/test-owner/b3ad2fa-Testim_193b.png)

**Replace Test Owner** ウィンドウが表示されます。

![300](/images/testops-management/test-owner/3419b72-Testim_194_r.png)

4. 新しいオーナーを選択し、**Confirm** をクリックします。\
   ウィンドウが閉じ、新しいオーナーがリストに表示されます。

![960](/images/testops-management/test-owner/617e420-Feb-08-2021_08-56-14.gif)

## テストオーナーでテストライブラリとスイート実行をフィルタリング

テストライブラリのテストリストを1つ以上のテストオーナーでフィルタリングでき、スイート実行のテストリストを単一のテストオーナーでフィルタリングできます。

### テストライブラリのフィルタリング

:fa-arrow-right: **テストオーナーでテストライブラリをフィルタリングするには:**

1. **テストライブラリ**（**Test List** > **Tests**）に移動します。
2. **Advanced filters** アイコンをクリックします。

![3851](/images/testops-management/test-owner/2ccd6df-Testim_192a.png)

**Filter Test** ペインが右側に開きます。

![200](/images/testops-management/test-owner/ebac246-Testim_195_r.png)

3. **Filter Test** ペインの **Test Owner** セクションで、フィルタリングしたいオーナー（複数可）を選択します。

> 📘 **Filter Test** ペインの **Test Owner** セクション内で、**検索**（虫眼鏡）アイコンをクリックし、開く検索ボックスに検索条件を入力することで、オーナーを検索することもできます。

4. **Apply** をクリックします。\
   フィルターが適用され、オーナー条件を満たすテストのみが表示されます。

> 📘 **Filter Test** ペインの下部にある **Reset filters** をクリックしてから **Apply** をクリックすることで、フィルターを削除できます。

5. **Filter Test** ペインの右上にある「**X**」をクリックして閉じます。

> 📘 フィルターをリセットせずに **Filter Test** ペインを閉じてもフィルターはリセットされず、フィルター条件を満たすテストのみが表示されます。すべてのテストとフォルダを再度表示するには、**Filter Test** ペインを再度開いて **Reset filters** をクリックしてから **Apply** をクリックする必要があります。

### スイート実行のフィルタリング

:fa-arrow-right: **テストオーナーでスイート実行のテストリストをフィルタリングするには:**

1. **Suite Runs** リスト（**Runs** > **Suite Runs**）に移動します。

![3832](/images/testops-management/test-owner/911a46f-Testim_198.png)

2. フィルタリングしたい **Test Suite** をクリックします。\
   そのスイートのテストリストを含む新しい画面が表示されます。
3. **Advanced filters** アイコンをクリックします。

![3851](/images/testops-management/test-owner/a1519d8-Testim_199a.png)

高度なフィルターオプションが表示されます。\
**All owners** の横にあるドロップダウン矢印をクリックし、フィルタリングしたいテストオーナーを選択します。

![3851](/images/testops-management/test-owner/257c1eb-Testim_200a.png)

フィルタリングされたリストが表示されます。

![1210](/images/testops-management/test-owner/09fd471-Feb-09-2021_05-50-07.gif)
