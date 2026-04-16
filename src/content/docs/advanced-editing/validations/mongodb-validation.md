---
title: MongoDB の検証
description: MongoDB データベースに接続してデータを検証する CLI ステップ。ドキュメントの内容確認やクエリ実行により、データベースの状態を検証できる PRO機能です。
category: 高度な編集
order: 5017
updated: '2025-09-19'
sourceUrl: 'https://docs.tricentis.com/testim/content/advanced-editing/validations/mongodb-validation.htm'
keywords:
  - MongoDB
  - データベース検証
  - NoSQL
  - DB 検証
  - データ検証
  - クエリ
  - コレクション
  - ドキュメント
  - Testim
  - データベース接続
---

[CLI action](/docs/advanced-editing/validations/add-cli-validations-and-actions) ステップで MongoDB に対してクエリや検証を実行できます。

:::note{title="権限について"}
多くの DB は保護されているため、CLI 検証ステップを実行するマシンの IP をホワイトリストに追加する必要がある場合があります。未設定だと DB に到達できずステップが失敗します。スケジューラー経由で実行する場合などはサポートまでお問い合わせください。
:::

#### Example code

```text
const MongoClient = mongodb.MongoClient;
// Connection URL
const url = "XXXXXX";
query = JSON.parse(query);

const client = new MongoClient(url, { useNewUrlParser: true });

const connect = () => {
  return new Promise((resolve, reject) => {
    client.connect(function(err) {
      if (err) {
        return reject(err);
      }
      console.log("Connected successfully to server");
      const db = client.db(dbName);
      resolve(db);
    });
  });
};

const findOne = (db, collName) => {
  return new Promise((resolve, reject) => {
    const coll = db.collection(collName);
    coll.findOne(query, (err, result) => {
      if (err) {
        return reject(err);
      }
      console.log("Got collection result");
      resolve(result);
    });
  });
};

return connect()
  .then(db => findOne(db, collName, query))
  .then(result => {
    if (!result) {
      return Promise.reject(new Error("Failed to find object"));
    }
  })
  .finally(() => client.close());
```

#### Parameters - この例で使用するパッケージと JS

1. 名前: `mongodb`、種類: Package、値: [mongodb@3.1.10](https://www.npmjs.com/package/mongodb/v/3.1.10)
2. 名前: `Promise`、種類: Package、値: [bluebird@3.5.3](https://www.npmjs.com/package/bluebird/v/3.5.3)
3. 名前: `query`、種類: JavaScript、値: `'\{"name":"test"}'`
4. 名前: `collName`、種類: JavaScript、値: `'users'`
5. 名前: `dbName`、種類: JavaScript、値: `'myproject'`

**see screenshot:**

![スクリーンショット](/images/validations/mongodb-validation/c5c8e33-see_screenshot.png)
