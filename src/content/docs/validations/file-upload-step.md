---
title: ファイルアップロードの検証
description: ファイルアップロード機能をテストするステップ。ローカルファイルを選択してアップロードする操作を自動化し、ファイル入力フォームの動作を検証します。
category: 高度な編集
order: 5016
updated: '2025-09-19'
sourceUrl: 'https://help.testim.io/docs/file-upload-step'
keywords:
  - ファイルアップロード
  - アップロード
  - ファイル選択
  - フォーム
  - インプット
  - ファイル入力
  - Testim
  - アップロード検証
  - ファイル処理
  - UI 操作
---

OS のファイルブラウザやドラッグ＆ドロップでファイルアップロード操作を記録する

ファイルアップロードステップ（“File Drop” または “Browse For File”）は、テスト実行場所に依らずアップロード対象のファイルが常に利用可能であることを保証します。テストを「記録」するとファイルは Testim サーバーにアップロードされ、「実行」時はサーバーからローカルにダウンロードされて AUT にアップロードされます。どのファイルがアップロードされたかはステップのプロパティで確認できます。

:::note
アップロード操作はネイティブの input 要素でのみ機能します。
:::

## 主なユースケース

- フロー検証のためにファイルをアップロードする
- 特定の拡張子のみアップロード可能であることを検証する
- 複数ではなく 1 ファイルのみアップロード可能であることを検証する

## 前提条件

- Chrome DevTools を閉じてください。開いているとアップロードステップは実行できません。
- Chrome の「ダウンロード前に各ファイルの保存場所を確認する」を無効にしてください（有効だと記録できません。手順は下記）。
- 推奨ファイルサイズは 2MB 以下です。より大きなファイルでの検証が必要な場合は担当者にご連絡ください。

:::info
アップロード要素が画面上で不可視のため "Element not visible" で失敗する場合があります。ステップのプロパティで「Element must be visible」のチェックを外して再実行してください（下記参照）。
:::

**Chrome で「ダウンロード前に各ファイルの保存場所を確認する」を無効にするには:**

1. Chrome ブラウザで、**Chrome メニュー**（右上の三点リーダー）をクリックします。

![CLI](/images/validations/file-upload-step/66c3a04-Testim_249a.png)

**Chrome menu** のオプションが表示されます。

2. **Settings** をクリックします。

![設定アイコン](/images/validations/file-upload-step/a1dc980-Testim_250a_r.png)

**Chrome Settings** ページが開きます。

3. **Advanced** をクリックします。

![CLI](/images/validations/file-upload-step/fd3f76e-Testim_251a.png)

**Advanced** メニューが展開されます。

4. **Downloads** をクリックします。

![ダウンロード](/images/validations/file-upload-step/bfff7bc-Testim_252a_r.png)

**Downloads** 設定ページが表示されます。

5. **Ask where to save each file before downloading** トグルが無効（左側）になっていることを確認します。クリックすると有効（右側）と無効（左側）を切り替えられます。

![ステップ追加矢印](/images/validations/file-upload-step/6631d57-Testim_253a.png)

**「Element must be visible」のチェックを外すには:**

1. 対象のアップロードステップにカーソルを合わせ、**Show Properties** アイコンをクリックします。

![アップロード](/images/validations/file-upload-step/40da018-Testim_254a.png)

右側に **Properties** パネルが表示されます。

![表示検証](/images/validations/file-upload-step/bf62347-Testim_255_r.png)

2. **Element must be visible** チェックボックスをクリックして選択を解除します。

## ファイルアップロードステップの追加

ファイルアップロードは、AUT へのアップロード操作を記録することで自動的に追加されるステップです（プリセットではありません）。記録時に AUT へアップロードしたファイルはグリッドにもアップロードされ、テスト実行時に利用されます。

**"File Drop" / "Browse For File" ステップを作成するには:**

1. テストの記録中、アプリ内のファイルアップロード場所に移動します。アプリ内のドラッグ＆ドロップボックス、またはローカルファイルブラウザを開くリンクの場合があります。
2. ファイルをドラッグ＆ドロップするか、ローカルファイルブラウザの指示に従ってファイルを選択します。\
   ファイルは Testim サーバーにアップロードされ、**File Drop** ステップまたは **Browse For File** ステップが作成されます。

![ファイル](/images/validations/file-upload-step/b79925e-Testim_256a.png)

テスト実行時、ファイルはサーバーからローカルにダウンロードされ、AUT にアップロードされます。

**"File Drop" / "Browse For File" ステップでファイル一覧を確認するには:**

1. ファイル一覧を確認したいアップロードステップにカーソルを合わせ、**Show Properties** アイコンをクリックします。

![ファイル](/images/validations/file-upload-step/a68316e-Testim_254a.png)

右側の **Properties** パネルにアップロード済みファイルが表示されます。

![Testim インターフェース](/images/validations/file-upload-step/dd52cc2-Testim_257a_r.png)
