@docs/ を読み込んでから、以下のエージェントチームを作成してください。

対象: PR
PR_NUMBER = #{85, 86, 87, 88, 89, 90, 91}

【リードの行動ルール（厳守）】
あなたはチームリードとして以下の役割のみを行うこと:

- gh pr view {PR_NUMBER} でPRの概要と変更ファイル一覧を取得
- gh pr diff {PR_NUMBER} で差分を取得し、各チームメイトに担当観点を割り当て
- チームメイトの発見事項を統合し、最終レビューコメントを作成
- gh pr review {PR_NUMBER} でレビュー結果を投稿
- モデル: Claude Ops 4.6

以下の行為は禁止:

- 自分でファイルを読んでレビューする
- Bash, Edit, Write ツールの直接使用
- チームメイトの担当観点に口を出す

すべてのレビュー作業はチームメイトに委譲すること。

【チームメイト：3名】

Teammate 1 - 翻訳品質レビュアー:
役割: 日本語の自然さと原文との整合性チェック
モデル: Claude sonnet 4.6
手順:

1. PRの変更ファイル一覧を取得
2. 各変更ファイルの sourceUrl から WebFetch で英語原文を取得
3. 原文と日本語版を突合し以下をチェック:
   - 欠落セクション・段落はないか
   - 誤訳・意味のずれはないか
   - 不自然な日本語表現（「開かれています」→「利用できます」等）
   - Testim製品名・プラン名が英語のまま維持されているか
4. @docs/TRANSLATION_GUIDE.md の既知パターンに該当する問題がないか
5. 発見事項を重大度（error / warning / suggestion）付きでリードに報告
   報告形式: ファイル名、行番号、問題内容、修正案

Teammate 2 - フォーマットレビュアー:
役割: マークダウン構造とサイト固有フォーマットのチェック（Source-First 構造契約前提）
モデル: Claude sonnet 4.6
手順:

1. PRの変更ファイルを読み込み
2. @docs/WRITING_GUIDE.md のフォーマットルールに基づき以下をチェック:
   - Source-First 構造契約に準拠しているか:
     - 見出し: 1st H1 → frontmatter title:、2nd+ H1 → H2 降格、H2/H3/H4 維持
     - リスト: マーカーは `-`、ネストレベルは原文準拠
     - テーブル: 行数・列数が原文と一致
   - callout記法が :::形式に正しく変換されているか
   - 内部リンクが /docs/{slug} 形式になっているか
   - 画像が正しく埋め込まれているか（パス、alt text）
   - frontmatter（title, description, sidebar等）が正しいか
   - 見出しレベルの構造が適切か
3. 発見事項を重大度付きでリードに報告
   報告形式: ファイル名、行番号、問題内容、修正案

Teammate 3 - ビルド検証担当:
役割: ビルド・リント・テストの実行と結果報告
モデル: Claude sonnet 4.6
手順:

1. PRのブランチをチェックアウト: gh pr checkout {PR_NUMBER}
2. npm install（必要な場合）
3. 以下を順番に実行し結果を記録:
   a. npm run lint
   b. npm run test
   c. npm run build
4. エラーがあれば該当箇所を特定し、原因を分析
5. 結果をリードに報告（pass/fail + エラー詳細）
   報告形式: コマンド、結果（pass/fail）、エラー内容（あれば）

【リードの最終作業】
3名の報告を統合し、以下の形式でPRにレビューコメントを投稿:

## レビュー結果サマリー

- 翻訳品質: {問題数} 件（error: X, warning: Y, suggestion: Z）
- フォーマット: {問題数} 件
- ビルド検証: pass / fail

## 詳細

### 翻訳品質

（Teammate 1 の報告内容）

### フォーマット

（Teammate 2 の報告内容）

### ビルド検証

（Teammate 3 の報告内容）

## 判定

- 問題なし → Approve
- warning のみ → Approve + コメント
- error あり → Request Changes
