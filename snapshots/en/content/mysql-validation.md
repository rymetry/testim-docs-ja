# MySQL validation

Learn how to validate MySQL using the CLI action step and SQL queries.

You can use the [CLI action step](https://help.testim.io/docs/cli-actions) to perform queries and run validations on MySQL database.

> 📘 Permissions Notice
>
> As databases are usually protected, you might need to add the machine where this CLI validation step is executed on to the white list (to allow access), otherwise the step may fail when trying to reach the DB.\
> For further information / if you are running it via our Scheduler, please contact support.

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

#### **Parameters - Packages and JavaScript used in this example:**

1.name: Sequelize, type: Package, value: [sequelize@latest](https://www.npmjs.com/package/sequelize)\
2.name: mysql2, type: Package, value: [mysql2@latest](https://www.npmjs.com/package/mysql2)\
3.name: expectedValue, type: JavaScript, value: "fdssdf dfdf"

**see screenshot:**

![](https://files.readme.io/0164122-see_screenshot2.png "see screenshot2.png")