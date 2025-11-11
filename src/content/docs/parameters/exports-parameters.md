---
title: 'パラメータのエクスポート'
description: '原文: https://help.testim.io/docs/exports-parameters'
category: 'パラメータ'
order: 8
updated: '2025-11-02'
keywords:
  - testim
  - exports-parameters
  - parameters
---
テスト内のステップ間、あるいは別テスト間でパラメータを受け渡す

エクスポートには3種類あります。

* ローカル（Local）: 同一スコープ内のステップ間で受け渡し（例: グループ内のステップ間）
* テスト（Test）: 同一テスト内のステップ／グループ間で受け渡し
* グローバル（Global）: 同一実行内でテスト間に受け渡し（テストプラン／ラベル／テストスイート）

> 🚧 グローバルエクスポート
>
> グローバルにエクスポートした値はリモート実行でのみ利用可能です。

## エクスポートの例

> 📘
>
> ステップ間の受け渡しはJSONシリアライズされます。JSONにシリアライズ可能な値のみ使用してください。

ここではローカルのエクスポートをカスタムアクションで設定し、同じテスト内のカスタム検証で利用します。

* 新規テストを作成します。
* カスタムアクションを追加し、エディタに次を入力します。

```javascript
//For Local export:     
exports.bestTestingTool = "Testim";
//For Test  export:      
exportsTest.bestTestingTool = "Testim";
//For Global export:     
exportsGlobal.bestTestingTool = "Testim";
```

![](/images/parameters/exports-parameters/1b18e5a-export_param1.gif "export_param1.gif")

3. カスタム検証を追加し、次を入力します。

```javascript
if (bestTestingTool !== "Testim") {
     throw new Error("choose Testim!");
}
```

![](/images/parameters/exports-parameters/cb9a4de-add_custom_validation.png "add_custom_validation.png")

4. テストを実行し、成功を確認します。

> 📘
>
> テスト内のグループ間でも使う場合は exportsGlobal も活用します。

エクスポートした値は、そのステップ以降で利用できます。同一ステップ内で使いたい場合は次のようにローカル変数を使います。

```javascript
var local = "Testim";
console.log(local);
exports.bestTestingTool = local;
```

> 📘
>
> 実行後、入力パラメータとステップでエクスポートされた値は、ステップのプロパティパネルに表示されます。

エクスポートした値は JS パラメータ内でも参照できます。

1. 最後のステップで '**js Param**' を追加します。

![](/images/parameters/exports-parameters/cc6cb99-image_19.png "image (19).png")

2. パラメータ名を "WhoIsAwesome" に変更します。
3. 値を `bestTestingTool + " is awesome!"` に設定します。

![](/images/parameters/exports-parameters/cbcab47-exports_params_2.gif "exports_params_2.gif")

4. エディタのコードを次のように変更します。

```javascript
if (WhoIsAwesome !== "Testim is awesome!") {
  throw new Error("choose Testim!");
}
```

5. テストを実行し、成功を確認します。

注意:

* エクスポートで扱える型
  1. プリミティブ（数値、文字列、真偽値など）
  2. 配列
  3. JSON オブジェクト

* 1ステップあたりのグローバルエクスポートは 2MB まで
