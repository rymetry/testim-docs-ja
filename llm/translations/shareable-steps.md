共有ステップ（Shared Steps）は、特定のプロジェクト内で複数のテスト間にまたがって共有されるステップです。いくつかのステップタイプはデフォルトで共有ステップであり（明示的な設定は不要）、他のユーザーが作成するテストでも利用できます。\
以下の表は、他のステップとグループ化せずに単独で共有できる事前定義ステップを示します。

### Validations（検証）

| Validations            | Documentation                                                                                                  |
| :--------------------- | :------------------------------------------------------------------------------------------------------------- |
| Add custom validation  | [Add custom validations and actions](/docs/validations/custom-code)                                                          |
| Add CLI validation     | [Adding a CLI step](/docs/validations/validate-download#adding-a-cli-step)                                                   |
| Validate download      | [Adding a Validate download validation step](/docs/validations/validate-download#adding-a-validate-download-validation-step) |
| Validate email         | [Validate email](/docs/validations/email-validation)                                                                         |
| Validate API           | [API Validation](/docs/advanced-features/api-testing#api-validation)                                                               |
| Add network validation | [Add network validation](/docs/validations/add-network-validation)                                                           |

### Wait for（待機）

| Wait For            | Documentation                                                |
| :------------------ | :----------------------------------------------------------- |
| Add custom wait for | [Custom Wait for](/docs/advanced-features/wait-for#custom-wait-for)              |
| Add CLI wait for    | [Adding a CLI step](/docs/validations/validate-download#adding-a-cli-step) |
| Wait for download   | [Wait for Download](/docs/advanced-features/wait-for#wait-for-download-web)      |

### Actions（アクション）

| Actions           | Documentation                                                |
| :---------------- | :----------------------------------------------------------- |
| Add custom action | [Add custom validations and actions](/docs/validations/custom-code)        |
| Add CLI action    | [Adding a CLI step](/docs/validations/validate-download#adding-a-cli-step) |
| Add API action    | [API Action](/docs/advanced-features/api-testing#api-action)                     |

## 新しい共有ステップの作成

上記の共有可能なステップについては、テストに追加する際に共有ステップとして指定できます。\
**:fa-arrow-right:共有ステップを追加するには:**

1. ステップを追加したい位置の（矢印）にカーソルを合わせます。
2. "M"（Testim の事前定義ステップ）をクリックします。
3. Predefined steps の一覧から該当ステップを選択します。
4. **Add Step** ダイアログで **Shared step** チェックボックスをオンにします。

   ![](/images/groups/shareable-steps/3a14d05-image.png)
5. 共有ステップを **Root** フォルダー以外に配置したい場合は、**Select shared step folder** でフィールドをクリックし、既存フォルダーを選ぶか **Add Folder** をクリックして新しいフォルダー名を指定します。**Select** をクリックして確定します。

   ![](/images/groups/shareable-steps/a69521b-addfolder.png)

## 既存ステップを共有ステップに変更

共有可能な通常ステップは、後から共有ステップに変換できます。  

**:fa-arrow-right:既存ステップを共有ステップにするには:**

1. 共有可能な通常ステップで **Show Properties** をクリックします。

   ![](/images/groups/shareable-steps/d887de9-showproperties.png)
2. Properties ペインで **Shared Step** リンクをクリックします。

   ![](/images/groups/shareable-steps/54d39fb-shaedsteplink.png)

## 共有ステップの再利用

テスト作成時に、これまでに作成された共有ステップの一覧にアクセスできます。\
**:fa-arrow-right:共有ステップを再利用するには:**

1. ステップを追加したい位置の（矢印）にカーソルを合わせます。\
   アクションのオプションが表示されます。
2. "M"（Testim の事前定義ステップ）をクリックします。\
   Predefined steps メニューが開きます。
3. **Shared Steps** タブをクリックします。\
   ステップの一覧が表示されます。
4. 目的の共有ステップをクリックしてテストに追加します。
