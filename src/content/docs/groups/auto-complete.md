---
title: 'オートコンプリート'
description: '共有グループを活用してテスト記録を効率化するオートコンプリート機能について説明します。事前記録されたステップの候補から選択して自動実行できます。'
category: 'グループ'
order: 3
updated: '2025-09-13'
sourceUrl: 'https://help.testim.io/docs/auto-complete'
keywords:
  - オートコンプリート
  - Auto complete
  - 共有グループ
  - テスト記録
  - 自動実行
  - ステップ候補
  - 効率化
  - PRO機能
---
Auto Complete 機能は、共有グループとして保存された事前記録のステップを活用して、テストの記録を効率化します。テストを記録中、既存の共有グループに基づいて次に行うステップの候補が提案されます。希望する候補をクリックすると、Testim がそのステップ列を自動で実行し、テストに保存します。自動実行が終わったら、手動での記録を再開できます。  

> 📘 これは PRO 機能です
>
> 本機能は Professional プランのプロジェクトで利用可能です。Professional プランの詳細は [こちら](https://www.testim.io/pricing/) をご覧ください。

## Auto Complete の使用

:fa-arrow-right: **Auto Complete を使うには:**

1. **Record** をクリックして記録を開始します。記録中、次のステップとして利用可能な共有グループがある場合、ステップカウンター上に **Auto record your steps** と候補リストを含むポップアップが表示されます。これらの候補は、プロジェクトで既に実装済みの共有グループです。最も関連性の高い候補が先頭に表示されます。
2. 候補名にカーソルを合わせると、含まれるステップ数を確認できます。

![2033](/images/groups/auto-complete/1f8c6ad-Untitled.png "Untitled.png")

3. 希望の候補をクリックして有効化します。グループにパラメーターが含まれる場合は、実行前にそれらの名前と値の入力を求められます。**Cancel** をクリックして手動記録を続けるか、別の候補を選択することもできます。

![2037](/images/groups/auto-complete/479add8-Screen_Shot_2020-12-31_at_11.15.02.png "Screen Shot 2020-12-31 at 11.15.02.png")

共有グループのステップが AUT 上で再生され、記録の進行率を示すプログレスバーが表示されます。記録された各ステップはプログレスバーの下に示されます。完了後、グループがテストに追加されます。

![640](/images/groups/auto-complete/91cda42-Dec-31-2020_12-04-09.gif "Dec-31-2020 12-04-09.gif")

4. 候補の再生が完了したら、**Record**（ステップカウンター付き）をクリックして、手動での記録を再開できます。

> 📘 注意
>
> 候補（共有グループ）を再生中は、AUT 上でクリックや更新を行わないでください。再生中の操作は記録されません。

## Auto Complete の設定

提案を完全に無効化するには、Settings → Project → General に移動し、"Allow auto-complete suggestion" をオフにします。

![487](/images/groups/auto-complete/7775a80-Picture13.png "Picture13.png")
