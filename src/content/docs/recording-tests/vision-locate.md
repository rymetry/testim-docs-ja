---
title: Vision Locate
description: Vision Locate モードの使用方法と、視覚分析アルゴリズムを使用して画面上の要素を特定する方法について説明します。
category: テストの記録
order: 3012
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/recording-tests/recording-a-mobile-test/vision-locate.htm'
keywords:
  - Vision Locate
  - 視覚分析
  - 要素検出
  - WebView
  - モバイルテスト
---

Vision Locate モードは、ビジュアル分析アルゴリズムを使用して画面をスキャンして要素を見つけます。基本的に、画像に基づいて DOM のような構造を作成し、テストの記録と再生中に要素の識別を可能にします。また、要素の位置のわずかな変化にもかかわらず、テストの安定性を維持します。

:::info
記録中に DOM モードと Vision Locate モードを切り替えることができます。
:::

## Vision Locate をいつ使用すべきか?

- 要素が DOM に表示されない場合 - つまり、DOM Locate モードでマウスを要素の上に置いても強調表示されない場合。
- 画面が WebView の場合。
- ビジョンを使用する方がより良い結果が得られる可能性がある複雑なシナリオ。

## Vision Locate を使用して識別された要素に適用できるアクションは?

要素をタップすることは可能ですが、現在、要素内のテキストに対してアクション（要素テキストの検証、要素テキストの待機など）を適用することはできません。

## Vision Locate の使用

**Vision Locate を使用するには:**

1. モバイルテストの記録を開始します。

2. 画面上の特定の要素を選択したいのに強調表示されない場合は、Mirroring Toolbar の **Vision Locate** ボタンをクリックします。

画面は Vision Locate 機能によってスキャンされます。画面上のすべての要素がビジョンアルゴリズムを使用して識別され、要素の上にマウスを置くとマーク/強調表示されます。

![Testim での Vision Locate](/images/recording-tests/vision-locate/45d466b-vision_locate_testim.png)

3. マウスを要素の上に置いて要素を選択します。強調表示されるはずです。

Vision Locate モードは、ツールバーの DOM Locate ボタンをクリックするまで維持されます。

:::info
可能な限り DOM Locate モードに戻すことをお勧めします。
:::

### テストの再生

任意のテストステップのターゲット要素を見つけるために Vision Locate が使用された場合、テストステップの Properties パネルに Vision アイコンを示すインジケータがあります。

![再生時の Vision Locate](/images/recording-tests/vision-locate/3520bf7-vision_locate_playback.png)
