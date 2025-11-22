---
title: 'ステッププロパティパネルのパラメータ'
description: '原文: https://help.testim.io/docs/parameters-in-custom-javascript-steps'
category: 'パラメータ'
order: 2
updated: '2025-09-22'
sourceUrl: 'https://help.testim.io/docs/parameters-in-custom-javascript-steps'
keywords:
  - Testim
  - パラメータ
  - カスタムステップ
  - JavaScript
  - HTMLパラメータ
  - プロパティパネル
  - カスタムアクション
  - ステップ再利用
---
ステップのプロパティパネル（JavaScript/HTML）でパラメータを定義する

多くのステップでは、**プロパティ**パネル内の **PARAMS** 欄でパラメータを定義できます。

パラメータの種類は2つあります。

* HTML: AUTのHTML要素を参照します
* JS (JavaScript): 任意のJS式を定義します

### パラメータのスコープ

定義したパラメータのスコープは、そのステップ内に限定されます。例えば **カスタムアクションを追加** ステップで定義した場合、そのステップのJS関数内で参照できます。

## プロパティパネルでHTMLパラメータを定義する

以下はカスタムアクションを例にしていますが、PARAMS 欄があるステップすべてに適用できます。

> 🚧 共有パラメータ
>
> 共有ステップ／共有グループでは、JS/HTML の「パラメータ定義」自体は共有されますが、値は共有されません。共有ステップからパラメータを削除すると、すべての使用箇所に影響し、元に戻せません。

:fa-arrow-right: **HTMLパラメータを定義するには:**

1. 新規または既存のテストで、パラメータを定義したいステップを追加します（例: **カスタムアクションを追加**）。
2. **ステップを追加** ダイアログでステップ名を入力します（例: Click）。
3. **ステップを作成** をクリックします。左に**関数エディタ**、右に**プロパティ**が表示されます。

![関数エディタとプロパティパネル](/images/parameters/parameters-in-custom-javascript-steps/f73cb06-function.jpg)

4. **PARAMS** の横の「+」をクリックし、HTML を選択します。

![HTMLパラメータの選択](/images/parameters/parameters-in-custom-javascript-steps/45bd5ce-selecthtml.jpg)

5. AUT上で、パラメータを割り当てたい要素を選択します（例: フッターのTwitterアイコン）。

![Twitterアイコンの選択](/images/parameters/parameters-in-custom-javascript-steps/6e230ca-twittericon.jpg)

選択した要素のスニペットが PARAMS セクションに表示されます。

![パラメータスニペット](/images/parameters/parameters-in-custom-javascript-steps/fe4964c-snippet.jpg)

6. HTML見出し横の名前をダブルクリックして、任意の名前に変更します。

![パラメータ名の変更](/images/parameters/parameters-in-custom-javascript-steps/c719269-name.jpg)

これでHTMLパラメータの定義は完了です。

## ステップ内でパラメータを使う

定義したパラメータは、そのステップ内で使用できます。例えば、次のように関数内で参照します。

```javascript
twitter.click()
```

テストを実行し、要素がクリックされることを確認します。

> 📘
>
> カスタム検証やアクションで jQuery を使用するには、AUT に jQuery が読み込まれている必要があります。

## ステップを再利用して別の要素に割り当てる

パラメータのスコープはそのステップ内ですが、ステップ自体を再利用して複製し、新しい要素に再割り当てできます（例: Twitter アイコンから LinkedIn アイコンへ）。

:fa-arrow-right: **再利用ステップに別パラメータを割り当てるには:**

1. 同じテストで、**共有ステップ** メニューから作成済みの共有ステップを追加します（例: + ⇒ 共有ステップ ⇒ Click）。

![共有ステップの追加](/images/parameters/parameters-in-custom-javascript-steps/0f78633-sharedsteps.jpg)

共有ステップが複製されます。

![複製されたステップ](/images/parameters/parameters-in-custom-javascript-steps/ed59427-duplicated.jpg)

2. 新しいステップをダブルクリックして編集します。
3. 既存のパラメータは残っていますが、**Assign HTML** をクリックして別の要素に割り当て直します。

![HTMLの再割り当て](/images/parameters/parameters-in-custom-javascript-steps/94de6da-assignhtml.jpg)

4. 別の要素を選択します（例: フッターの LinkedIn アイコン）。

![LinkedInアイコンの選択](/images/parameters/parameters-in-custom-javascript-steps/8b65e10-linkedin.jpg)

テストを実行すると、両方のボタンがクリックされます。

## プロパティパネルでJSパラメータを追加する

JSパラメータは、定数や変数としてよく使います。グループや再利用ステップへ値を渡す用途が中心です。使用例は[グループのパラメータ](/docs/parameters-for-groups)を参照してください。

:fa-arrow-right:**JSパラメータを追加するには:**

1. **プロパティパネル**で **Params** 横の **+** をクリックし、**JS** を選択します。

   ![JSパラメータの追加](/images/parameters/parameters-in-custom-javascript-steps/d5ea619-plus.png)
2. **編集**アイコンから名前を変更します（既定の "param" を置き換え）。

   ![パラメータ名の編集](/images/parameters/parameters-in-custom-javascript-steps/96cc4ee-edit.png)
3. 名前の下の欄に値を入力します。文字列はクォートで囲みます（例: 'guest'）。この値はこのテスト内だけで有効です（他テストとは共有されません）。

![パラメータ値の設定](/images/parameters/parameters-in-custom-javascript-steps/898f70a-guest.png)

4. 追加のパラメータも同様に設定します。
5. **保存** → **OK** をクリックします。
