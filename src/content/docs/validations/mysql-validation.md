---
title: 'MySQL の検証'
description: 'MySQLデータベースに接続してデータを検証するCLIステップ。テーブルデータの確認やSQLクエリ実行により、データベースの状態を検証できるPro機能です。'
category: '高度な編集'
order: 5018
updated: '2025-09-14'
sourceUrl: 'https://help.testim.io/docs/mysql-validation'
keywords:
  - MySQL
  - データベース検証
  - SQL
  - DB検証
  - データ検証
  - クエリ
  - テーブル
  - レコード
  - Testim
  - データベース接続
---

CLI アクションと SQL で MySQL を検証する

[CLI action step](/docs/cli-actions) を使って MySQL に対してクエリや検証を実行できます。

:::note{title="Permissions Notice"}
多くの DB は保護されているため、CLI 検証ステップを実行するマシンの IP をホワイトリストに追加する必要がある場合があります。未設定だと DB に到達できずステップが失敗します。スケジューラー経由で実行する場合などはサポートまでお問い合わせください。
:::

#### **Example code:**

```text
const dbName = "XXXXX";
const userName = "XXXXX";
const password = "XXXXX";
const host = "XXXXX";
const port = XXXXX;

const sequelize = new Sequelize(dbName, userName, password, {
  dialect: "mysql",
  host,
  port
});

return sequelize
  .query("SELECT name FROM myTable where id = 1;", {
    plain: true,
    raw: true,
    type: Sequelize.QueryTypes.SELECT
  })
  .then(myTableRows => {
    const result = myTableRows && JSON.stringify(myTableRows);
    console.log("Query result", result);
    if (!myTableRows || myTableRows.name !== expectedValue) {
      return Promise.reject(new Error("Failed to find raw"));
    }
  });
```

#### **Parameters - この例で使用するパッケージと JS**

 1.name: Sequelize, type: Package, value: [sequelize@latest](https://www.npmjs.com/package/sequelize)\
 2.name: mysql2, type: Package, value: [mysql2@latest](https://www.npmjs.com/package/mysql2)\
 3.name: expectedValue, type: JavaScript, value: "fdssdf dfdf"

**see screenshot:**

![スクリーンショット](/images/validations/mysql-validation/0164122-see_screenshot2.png)
