---
title: '要素のビジュアル検証'
description: 'ピクセルレベルで要素のビジュアル差異を検証する方法。Applitoolsとの連携により、ベースラインと現在のテスト実行を比較します。'
category: 'ビジュアル検証'
order: 1
updated: '2025-09-15'
sourceUrl: 'https://help.testim.io/docs/validate-element-visualization'
keywords:
  - ビジュアル検証
  - applitools
  - 要素検証
  - ピクセル検証
  - visual validation
  - ベースライン比較
  - ビジュアルテスト
  - UI検証
  - 画面検証
  - Applitools Eyes
---

ピクセルレベルでビジュアルの詳細を検証

**要素のビジュアル検証**ステップを使用すると、ベースラインと現在のテスト実行の間で、特定の要素のビジュアル差異を比較できます。この機能は [Applitools](https://applitools.com) のサービスとして提供されており、Applitools Eyesアプリとの連携が必要です。詳細については、[ビジュアル検証（要素、ビューポート、フルページ）](/docs/pixel-validation-and-pixel-wait-for) をご覧ください。

:::info{title="PRO機能"}
この機能はプロフェッショナルプランでのみ利用できます。プロフェッショナルプランの詳細については、[こちら](https://www.testim.io/pricing/) をご覧ください。
:::

## 要素のビジュアル検証ステップの追加

**要素のビジュアル検証ステップを追加するには:**

1. 検証を追加したい位置の矢印記号にマウスを合わせます。

   ![矢印記号](/images/visual-validations/validate-element-visualization/250d552-Testim_266b.png)

   **アクションオプション**が表示されます。

   ![アクションオプション](/images/visual-validations/validate-element-visualization/4835d90-Testim_267a_r.png)

2. **ブレークポイント切替**ボタンをクリックします。

   ![ブレークポイント切替](/images/visual-validations/validate-element-visualization/a315470-Testim_268_r.png)

3. **テストを実行**ボタンをクリックして、ブレークポイントまでテストを実行します。

   ![テストを実行](/images/visual-validations/validate-element-visualization/bf77731-Testim_269b.png)

4. 再度矢印記号にマウスを合わせ、「**M**」（Testim定義済みステップ）をクリックします。

   **定義済みステップ**メニューが開きます。

   ![定義済みステップメニュー](/images/visual-validations/validate-element-visualization/8b2baf7-Testim_270_r.png)

5. **検証**をクリックします。

   **検証**メニューが展開されます。

   ![検証メニュー](/images/visual-validations/validate-element-visualization/57ab006-Testim_271_r.png)

6. メニューをスクロールして、**要素のビジュアル検証**を選択します。

:::info
メニュー上部の検索ボックスから**要素のビジュアル検証**を検索することもできます。
:::

7. **AUT**ウィンドウで、ビジュアル検証を行いたい要素を特定し、クリックして選択します。

   「要素のビジュアル検証」ステップが**エディター**に追加され、選択した要素のサムネイルがステップに表示されます。

   ![要素のビジュアル検証ステップ](/images/visual-validations/validate-element-visualization/9db6ffb-Testim_272a.png)

8. 検証ステップの後にある**ブレークポイント切替**ボタンをクリックして、ブレークポイントを削除します。

テストを実行すると、ベースラインのビジュアライゼーションがテスト実行時のものと比較されます。ビジュアル検証の失敗によりステップが失敗した場合は、失敗したビジュアル検証ステップをダブルクリックして、Applitools Eyesで詳細を開いてください。

:::tip
**要素のビジュアル検証**ステップの追加には、キーボードショートカットも使用できます。詳細は [キーボードショートカット](/docs/keyboard-shortcuts) をご覧ください。
:::

:::note{title="ベースラインの作成"}
Testimは最初のステップ実行時に自動的にベースラインを作成します。Applitools UIでこのベースラインを確認、カスタマイズし、期待どおりであることを確認することを推奨します。
:::
