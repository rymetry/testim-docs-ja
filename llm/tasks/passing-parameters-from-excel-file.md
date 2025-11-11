# 翻訳タスク (passing-parameters-from-excel-file)

下記のMarkdown本文を日本語に翻訳してください。Markdownの構造、リンク、画像パス、コードブロックは維持してください。
- 画像の相対パス (/images/...) は変更しない
- ":fa-...:" のようなアイコン記法はそのまま残す
- 表や表ヘッダー、HTMLタグは壊さない
- リンクのURLは変更しない（アンカーテキストのみ訳す）

--- 原文本文ここから ---

Excel/CSV のデータをテストにパラメータとして渡す方法

［データ駆動テスト］(/docs/data-driven-testing/data-driven-testing)の一環として、Excel ファイルからパラメータを渡す方法は2つあります。

- Testim Visual Editor から Excel/CSV をアップロードする — 複数データセットが含まれていても、エディタからの実行では最初の1件のみ実行されます。複数回実行されるのは CLI／スケジューラ／ローカルスイート実行時です。また、この方法ではファイル変更時に自動更新されず、都度アップロードが必要です。手順は「[CSV/Excelのアップロードでテストデータを追加](doc:data-driven-testing#section-adding-test-data-by-uploading-a-csv-excel-file)」を参照してください。

- 設定ファイル経由でパラメータを渡す — Excelのデータを設定ファイル経由で1つまたは複数テストへ受け渡し、CLI 実行時に設定ファイルを使用するフラグを付与します。複数データセットがある場合、順番に複数回実行されます。ファイルは毎回自動でパースされるため、Excel を更新すれば次回実行で反映されます。手順は「[外部ソースのデータを使ったデータ駆動テスト](doc:data-driven-testing#section-data-driven-tests-using-data-from-an-external-source)」。
