# MongoDB validation

Learn how to validate MongoDB using the CLI action step.

You can use the [CLI action](https://help.testim.io/docs/cli-actions) step to perform queries and run validations on MongoDB database.

> 📘 Permissions Notice
>
> As databases are usually protected, you might need to add the machine where this CLI validation step is executed on to the white list (to allow access), otherwise the step may fail when trying to reach the DB.\
> For further information / if you are running it via our Scheduler, please contact support.

#### **Example code:**

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

#### **Parameters - Packages and JavaScript used in this example:**

1. name: mongodb, type: Package, value: [mongodb@3.1.10](https://www.npmjs.com/package/mongodb/v/3.1.10)
2. name: Promise, type: Package, value: [bluebird@3.5.3](https://www.npmjs.com/package/bluebird/v/3.5.3)
3. name: query, type: JavaScript, value: '\{"name":"test"}'
4. name: collName, type: JavaScript, value: 'users'
5. name: dbName, type: JavaScript, value: 'myproject'

**see screenshot:**

![](https://files.readme.io/c5c8e33-see_screenshot.png "see screenshot.png")