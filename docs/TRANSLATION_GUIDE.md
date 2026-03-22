# Testim ドキュメント日本語版 - 翻訳ガイド

このガイドでは、Testim 公式ドキュメント（https://help.testim.io/docs/）から新しいページを日本語翻訳して追加する手順を説明します。

翻訳作業では、公式サイトの表示に加えて `docs/SIDEBAR_URLS.md` をこのリポジトリ内の正本として扱ってください。カテゴリ順、ページ順、翻訳対象の有無は、まずこのファイルを基準に確認します。

**重要**: `sourceUrl` の英語記事は「参照用」ではなく、日本語ページの正本です。要約ページへ作り替えず、原文の本文、手順、callout、コンテンツ画像を欠落なく反映してください。

## 1. 準備：公式サイトの構造を確認

### 1.1 サイドバーの確認

翻訳前に、公式サイトの左サイドバーと `docs/SIDEBAR_URLS.md` で以下を確認してください：

1. **カテゴリ名**（h2見出し）: 例「Testim Overview」「Getting Started」「Salesforce Testing」など
2. **各ページのタイトルと順序**: カテゴリ内での表示順
3. **URL slug**: `https://help.testim.io/docs/[この部分]`

### 1.2 翻訳対象の選定

- `docs/SIDEBAR_URLS.md` から翻訳したいページを選択
- URL slugをメモ
- カテゴリ名と表示順をメモ

## 2. ファイル作成

### 2.1 配置場所

既存のトピックフォルダにページを配置します。**フォルダ構造は整理用であり、カテゴリ名や公開URLとは1対1で対応しません。**

たとえば `テスト編集` カテゴリのページでも、内容に応じて `steps-editing-tests/`、`groups/`、`conditions/`、`test-utilities/` など複数のフォルダに分かれて配置されます。

配置例：

```text
src/content/docs/
├── overview/        # 概要カテゴリ
│   ├── testim-overview.md
│   ├── getting-started.md
│   └── testim-automate.md
├── recording-tests/          # テストの記録カテゴリの代表フォルダ
│   ├── how-to-record-a-test.md
│   └── recording-a-mobile-test.md
├── steps-editing-tests/     # テスト編集カテゴリの代表フォルダ
│   ├── steps.md
│   └── editing-your-tests.md
├── validations/             # 高度な編集カテゴリの代表フォルダ
│   └── validate-element-visible.md
└── testim-labs/             # Testim Labsカテゴリ
    └── testim-labs.md
```

**フォルダ選択ルール**:

- まず既存の近い記事と同じフォルダに置く
- フォルダ名は記事のトピック単位で判断し、カテゴリ名だけで決めない
- 公開URLはフォルダではなくファイル名で決まるため、配置先よりファイル名の整合性を優先する

### 2.2 ファイル命名規則

**重要**: ファイル名は元のURL slugと完全に一致させること。

| URL                                                | カテゴリフォルダ      | ファイル名                |
| -------------------------------------------------- | --------------------- | ------------------------- |
| `https://help.testim.io/docs/testim-overview`      | `overview/`           | `testim-overview.md`      |
| `https://help.testim.io/docs/how-to-record-a-test` | `recording-tests/`    | `how-to-record-a-test.md` |
| `https://help.testim.io/docs/salesforce-overview`  | `salesforce-testing/` | `salesforce-overview.md`  |

この命名規則により、元のページとの対応関係が明確になり、更新時の追跡が容易になります。

### 2.3 ルーティングの重要事項

**このプロジェクトの公開URLは、フォルダ構造を無視してファイル名のみで決まります。**

```text
src/content/docs/overview/testim-overview.md
→ /docs/testim-overview

src/content/docs/getting-started/setting-up-your-account.md
→ /docs/setting-up-your-account
```

そのため、本文中の内部リンクも必ず `/docs/{slug}` 形式にしてください。

- 正しい例: `/docs/testim-overview`
- 誤った例: `/docs/overview/testim-overview`

## 3. Frontmatter 設定

各ファイルの先頭に以下の形式でメタデータを設定：

```yaml
---
title: '日本語タイトル'
description: '日本語説明文（SEO用、100-160文字推奨。原文URLの貼り付けは不可）'
category: '既存カテゴリ名に合わせた日本語ラベル'
order: 1001
updated: 'YYYY-MM-DD'
sourceUrl: 'https://help.testim.io/docs/testim-overview'
keywords:
  - キーワード1
  - キーワード2
  - キーワード3
---
```

補足:

- `description` には原文URLや「原文: ...」のようなプレースホルダを入れず、日本語の要約を記載します
- `sourceUrl` は原文追跡のため運用上必須です
- `keywords` は最大10件までを目安に、日本語の検索語を設定します

### 3.1 カテゴリ名の日本語化

公式サイトの英語カテゴリ名を日本語に翻訳します。**カテゴリ名は既存のラベルに厳密に合わせてください。** フォルダ名とは一致しない場合があります。

| 英語カテゴリ名     | 日本語カテゴリ名 | 代表フォルダ例                         |
| ------------------ | ---------------- | -------------------------------------- |
| Overview           | 概要             | `overview/`                            |
| Getting Started    | はじめに         | `getting-started/`                     |
| Recording Tests    | テストの記録     | `recording-tests/`                     |
| Editing Tests      | テスト編集       | `steps-editing-tests/`, `groups/`      |
| Advanced Editing   | 高度な編集       | `validations/`, `parameters/`          |
| Running Tests      | テスト実行       | `running-tests/`, `test-execution/`    |
| Results            | 結果             | `results/`                             |
| Debugging Tests    | デバッグ         | `debugging/`                           |
| Test Management    | テスト管理       | `test-management/`                     |
| Integrations       | 統合             | `integrations/`, `other-integrations/` |
| Salesforce Testing | Salesforceテスト | `salesforce-testing/`                  |
| Testim Extension   | Testim拡張機能   | `testim-extension/`                    |
| Security           | セキュリティ     | `security-sso/`                        |

**重要**: 新しいカテゴリを追加する場合は、既存の翻訳パターンに従って一貫性を保ってください。

### 3.2 表示順（order）の設定

**`docs/SIDEBAR_URLS.md` と同じ順序で設定してください。**

このプロジェクトでは、`order` は単純な 1, 2, 3 ではなく、セクションごとの数値帯で管理されています。既存ファイルの近い値に合わせて設定してください。

```yaml
# 例: 既存の実ファイル
# overview/testim-overview.md                → order: 1001
# getting-started/setting-up-your-account.md → order: 2001
# recording-tests/how-to-record-a-test.md    → order: 3001
# running-tests/scheduler.md                 → order: 6005
```

設定ルール:

- サイドバー順は `docs/SIDEBAR_URLS.md` に合わせる
- 既存記事を編集するときは、現在の `order` の数値帯を維持する
- 新規記事を追加するときは、同じセクション内の近い記事を見て未使用の値を割り当てる
- `order` は補助的な並び順でもあるため、重複や極端な飛び値は避ける

## 4. メディアファイルの処理

### 4.1 画像・動画URLの抽出

公式ページから画像と動画のURLを自動抽出するコマンド：

```bash
# 画像と動画の両方を抽出（完全版 - 漏れを防ぐ）
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|mp4|webm|mov)' | \
  sort -u
```

**重要**: `src=` や引用符を含めずに直接URLを抽出することで、imgタグ以外の場所（JavaScript内など）に埋め込まれた画像URLも漏れなく取得できます。

**実行例**:

```bash
# help-ai-assistantページのメディアを抽出
curl -s "https://help.testim.io/docs/help-ai-assistant" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|mp4|webm|mov)' | \
  sort -u

# 実行結果例（抽出されるURL数を確認）
# https://files.readme.io/1160e83-notice.png
# https://files.readme.io/166ab74-answer.png
# https://files.readme.io/fc6e714-image.png
# ...（全13個など）
```

**抽出後の確認**:

```bash
# 抽出した画像数を確認
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|mp4|webm|mov)' | \
  sort -u | wc -l
```

件数確認後は、**ダウンロード済み件数** と **Markdown 内で実際に参照している件数** も照合してください。ファイルが存在しても本文に埋め込まれていなければ未完了です。

**フィルタリング（必要に応じて）**:

抽出後、以下のような不要なファイルを除外してください：

- サイトロゴ: `ProductLogoMark`, `favicon`
- UIアイコン: `bullet.png`, `info2x.png`
- その他装飾画像

```bash
# コンテンツ画像のみを抽出（ロゴ・アイコン除外）
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|mp4|webm|mov)' | \
  grep -v -E '(ProductLogoMark|favicon|bullet|info2x)' | \
  sort -u
```

### 4.2 フォルダ作成とダウンロード

**重要**: 画像や動画が存在するページのみフォルダを作成してください。

```bash
# 1. フォルダ作成（メディアファイルがあるページのみ）
mkdir -p public/images/[category-folder]/[page-slug]

# 2. フォルダに移動
cd public/images/[category-folder]/[page-slug]

# 3. メディアファイルを一括ダウンロード（自動短縮版 - 推奨）
# 抽出したURLリストをファイルに保存
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|mp4|webm|mov)' | \
  grep -v -E '(ProductLogoMark|favicon|bullet|info2x)' | \
  sort -u > urls.txt

# URLリストから一括ダウンロード＆ファイル名短縮（7文字に）
while read url; do
  filename=$(basename "$url")

  # ダウンロード
  if ! curl -sO "$url"; then
    echo "⚠️  ダウンロード失敗: $url"
    continue
  fi

  # ハッシュが長い場合のみ短縮（64文字 → 7文字）
  # 例: 0b34acc112f11d6d7c724a0f...2024-09-09.png → 0b34acc-2024-09-09.png
  # 既に短い場合（e45eaec-Testim030.png）はそのまま
  if [[ "$filename" =~ ^([a-fA-F0-9]{7})[a-fA-F0-9]{50,}(-.*) ]]; then
    short_name="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
    if [ "$filename" != "$short_name" ]; then
      mv "$filename" "$short_name"
      echo "✓ 短縮: $short_name"
    fi
  else
    echo "✓ 保持: $filename"
  fi
done < urls.txt

# 一時ファイル削除
rm urls.txt

# ダウンロード結果確認
ls -lh
```

**手動ダウンロードの場合（非推奨）**:

```bash
# 画像を個別ダウンロード
curl -sO "https://files.readme.io/[long-hash]-[filename].png"

# ダウンロード後、ファイル名を短縮
mv [long-hash]-[filename].png [short-hash]-[filename].png
```

**ファイル名短縮ルール**:

ReadMe.ioの画像URL形式: `[64文字のハッシュ]-[実際のファイル名]`

短縮形式: `[最初の7文字]-[実際のファイル名]`

例:

- `0b34acc112f11d6d7c724a0f247fd2dee76fcd0587e874e40c9303545dccbbe5-2024-09-09_15-40-38.png`
- → `0b34acc-2024-09-09_15-40-38.png`

この7文字短縮により、Markdownでの記述が簡潔になり、管理しやすくなります。

**注意事項**:

- スクリプトは大文字小文字両方のハッシュ（`a-fA-F0-9`）に対応
- ハッシュが50文字以上の場合のみ短縮（既に短いファイルはそのまま）
- ダウンロード失敗時はスキップして次へ進む
- 短縮前後のファイル名が同じ場合は何もしない

**実例**:

```bash
# 概要カテゴリのhelp-ai-assistantページの画像をダウンロード
mkdir -p public/images/overview/help-ai-assistant
cd public/images/overview/help-ai-assistant

# URLを抽出してファイルに保存
curl -s "https://help.testim.io/docs/help-ai-assistant" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|mp4|webm|mov)' | \
  grep -v -E '(ProductLogoMark|favicon|bullet|info2x)' | \
  sort -u > urls.txt

# 一括ダウンロード＆短縮
while read url; do
  filename=$(basename "$url")
  if ! curl -sO "$url"; then
    echo "⚠️  ダウンロード失敗: $url"
    continue
  fi
  if [[ "$filename" =~ ^([a-fA-F0-9]{7})[a-fA-F0-9]{50,}(-.*) ]]; then
    short_name="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
    [ "$filename" != "$short_name" ] && mv "$filename" "$short_name"
  fi
done < urls.txt

# 一時ファイル削除
rm urls.txt

# 結果確認
ls -lh
# 1160e83-notice.png
# 166ab74-answer.png
# fc6e714-image.png
# ...
```

**推奨フォルダ構造**:

```text
public/images/
├── overview/                   # 概要カテゴリ
│   ├── testim-overview/       # ページごとのフォルダ
│   │   ├── image1.png
│   │   └── image2.jpg
│   ├── help-ai-assistant/
│   │   ├── notice.png
│   │   └── answer.png
│   └── enhanced-mode-mobile/
│       └── mobile-test-setup.png
├── recording-tests/            # テストの記録カテゴリ
│   ├── how-to-record-a-test/
│   │   └── demo-video.mp4
│   └── recording-a-mobile-test/
│       └── screenshot.png
└── testim-labs/                  # Testim Labsカテゴリ
    └── testim-labs/
        └── example.png
```

**命名規則**:

- カテゴリフォルダ: mdファイルのカテゴリフォルダと同じ名前（例: `overview/`, `recording-tests/`）
- ページフォルダ: URL slugと同じ名前（例: `testim-overview/`, `help-ai-assistant/`）

### 4.3 画像の配置位置を特定する

ダウンロードした画像を**どこに配置すべきか**を公式ページから確認します。

#### 方法1: ブラウザの開発者ツールを使用（推奨）

```bash
# 1. 公式ページをブラウザで開く
# 2. 開発者ツール（F12）を開く
# 3. Elements タブで画像を検索
# 4. 前後のテキストを確認して配置位置を特定
```

#### 方法2: HTMLソースから画像とその前後のテキストを抽出

```bash
# 画像URLとその前後50文字のテキストを表示
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -B 2 -A 2 "files.readme.io.*\.png" | \
  grep -v "^--$"

# より詳細な情報が必要な場合（前後200文字）
curl -s "https://help.testim.io/docs/[page-slug]" | \
  sed 's/<img/\n<img/g' | \
  grep -A 1 -B 1 "files.readme.io.*\.png"
```

**画像配置の一般的なパターン**:

1. **手順の直後**: "ステップ3を完了すると..." → [画像]
2. **説明の前**: [画像] → "上図のように..."
3. **セクションの冒頭**: "## 機能概要" → [画像]
4. **箇条書きの直後**: "- 項目を選択します" → [画像]

**実例**:

```markdown
# 悪い例（位置が不明確）

![画像](/images/overview/page/image.png)

# 良い例（文脈と一致）

3. アイコンをクリックし、**ログイン**をクリックして開始します。

![Testim拡張機能アイコン](/images/getting-started/setting-up-your-account/e45eaec-Testim030.png)

## サインアップ
```

### 4.4 メディアファイルの埋め込み

#### 画像の埋め込み

Markdownで以下の形式で参照：

```markdown
![画像の説明（alt text）](/images/[category-folder]/[page-slug]/[filename].png)
```

**実例**:

```markdown
![Testim のダッシュボード](/images/overview/testim-overview/dashboard.png)

![テスト結果画面](/images/overview/testim-overview/result-summary.jpg)

![テスト記録画面](/images/recording-tests/how-to-record-a-test/recorder.png)
```

#### 動画の埋め込み

HTMLの`<video>`タグを使用：

```markdown
<video controls width="100%">
  <source src="/images/[category-folder]/[page-slug]/[filename].mp4" type="video/mp4">
  <source src="/images/[category-folder]/[page-slug]/[filename].webm" type="video/webm">
  お使いのブラウザは動画タグに対応していません。
</video>

_動画: テストの実行デモ_
```

**自動再生やループの例**:

```markdown
<video autoplay loop muted playsinline width="100%">
  <source src="/images/recording-tests/demo/interaction.mp4" type="video/mp4">
</video>
```

## 5. 翻訳ガイドライン

### 5.0 Source-First 構造ルール

翻訳時は以下の構造マッピングに従ってください。`check:parity` で自動検証されます。

| EN snapshot | JA 翻訳 |
|---|---|
| `# Title`（最初の H1） | frontmatter `title:` に入れる（body に H1 は出さない） |
| `# Section`（2 番目以降の H1） | `## Section`（H2 に降格） |
| `## / ### / ####` | そのまま維持 |
| リスト `*` マーカー | `-` に統一（markdownlint 互換） |
| ネストレベル | 原文を維持 |
| HTML テーブル | Markdown テーブルへの変換は許容（行数・列数を保持） |
| 画像・callout・コードブロック | 出現順序と配置を原文に合わせる |
| 段落 | 原文の段落構造を維持 |

### 5.1 基本方針

1. **構造の維持**:
   - 原文の見出し階層と段落構造、並び順を厳守
2. **技術用語**:
   - 技術用語は正確に翻訳し、必要に応じて英語を併記
   - 既存の日本語UIで使用されている用語に統一
3. **Testim の機能名は英語維持**: Testim の機能名、製品名、画面名、固有ラベルは原則として英語のまま残します。機能名自体は翻訳せず、必要なら前後の説明文で日本語補足を加えます。
4. **リンク**: 内部リンクは日本語版ページへ、外部リンクは原文URLを維持
5. **自然な日本語**:
   - 直訳ではなく、日本人が理解しやすい表現にすること
   - 文体は「です・ます調」で統一
   - 原文の意図を正確に伝えることを最優先してください
   - 手順や指示は明確で分かりやすい日本語にしてください
   - よくある不自然な直訳パターンを避けること:
     - NG: 「〜にのみ開かれています」→ OK: 「〜でのみ利用できます」
     - NG: 「プロフェッショナルプラン」→ OK: 「Professional plan」（英語維持）
     - NG: 「無料ティア」→ OK: 「無料プラン」
     - NG: リンクに「クリックしてください」→ OK: 「ご確認ください」を優先
     - NG: 「3番目のパーティグリッド」→ OK: 「サードパーティグリッド」
     - NG: 「Pro プラン」→ OK: 「Professional plan」（英語維持、短縮形も正式名に統一）
     - NG: 「注：」で `:::note` → OK: 制限事項・注意喚起は「注意」で `:::warning`（タイトルの意味で callout タイプを決める）

### 5.2 用語統一表

翻訳時は以下の用語を統一してください。

**新しいパターンを発見した場合の更新手順:**

1. 5.1 の NG/OK 例に不自然な直訳パターンを追加する
2. 下記の用語統一表に新しい用語を追加する
3. 変更を main にコミットする（`docs: TRANSLATION_GUIDE 用語追加`）

これにより、次回以降の翻訳で同じ問題が再発することを防ぎます。

| 英語                    | 日本語                      | 備考                                  |
| ----------------------- | --------------------------- | ------------------------------------- |
| Smart Locators          | Smart Locators              | 固有技術名は英語のまま                |
| Testim Copilot          | Testim Copilot              | 製品名                                |
| Testim Automate         | Testim Automate             | 製品名                                |
| Auto Grouping           | Auto Grouping               | 機能名は英語のまま                    |
| Scheduler               | Scheduler                   | 機能名は英語のまま                    |
| Shared Steps            | Shared Steps                | 機能名は英語のまま                    |
| TestOps                 | TestOps                     | 製品機能名                            |
| Enhanced mode           | Enhanced mode               | 技術用語として英語のまま              |
| VMG                     | VMG（仮想モバイルグリッド） | 初出時のみ補足                        |
| codeless                | コードレス                  | カタカナ化                            |
| test automation         | テスト自動化                | 一般的な訳語                          |
| debugging               | デバッグ                    | カタカナ化                            |
| test suite              | テストスイート              | カタカナ化                            |
| test case               | テストケース                | カタカナ化                            |
| test step               | テストステップ              | カタカナ化                            |
| CI/CD                   | CI/CD                       | 略語はそのまま                        |
| dashboard               | ダッシュボード              | カタカナ化                            |
| locator                 | ロケーター                  | カタカナ化                            |
| Professional plan       | Professional plan           | プラン名は英語のまま                  |
| free tier               | 無料プラン                  | 「無料ティア」は不自然                |
| Pro feature             | Pro機能                     | 「Pro」は英語のまま                   |
| Pro plan                | Professional plan           | 短縮形も正式名で英語維持              |
| third party / 3rd party | サードパーティ              | カタカナ化。「3番目のパーティ」は不可 |

### 5.3 特殊記法

Callout（`:::` ディレクティブ）、コードブロック、リスト、テーブルの記法は **`docs/WRITING_GUIDE.md`** を参照してください。

**重要**: 旧記法（`> 📘` 等の blockquote 形式）は使用禁止。必ず `:::` ディレクティブを使用すること。

## 6. ナビゲーション構造の確認

### 6.1 公式サイトとの一致を確認

翻訳後、左サイドバーが公式サイトと同じ構造・順序になっているか確認してください：

1. **カテゴリの順序**: 公式サイトと同じ順番でカテゴリが表示される
2. **ページの順序**: 各カテゴリ内で公式サイトと同じ順番でページが表示される
3. **カテゴリ名**: 日本語化されているが、意味が正しく伝わる

**確認方法**:

```bash
npm run dev
```

ブラウザで http://localhost:4321 を開き、左サイドバーを公式サイト（https://help.testim.io/docs/）と見比べてください。

## 7. 実装確認コマンド

### 7.1 ビルド確認

```bash
npm run build
```

エラーが無いことを確認してください。

### 7.2 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:4321` にアクセスして表示を確認。

### 7.3 メディアファイル確認

```bash
# メディアファイル数を確認
find public/images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.mp4" \) | wc -l

# メディアファイル一覧を確認
find public/images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.mp4" \) | sort

# フォルダ構造を確認
find public/images -type d | sort
```

### 7.4 Markdown ファイル確認

```bash
# カテゴリごとのファイル確認
ls -la src/content/docs/[category-folder]/

# 全ファイル一覧
find src/content/docs -name "*.md" | sort
```

## 8. 完成物のチェックリスト

翻訳完了前に以下を確認してください：

- [ ] ファイル名が元のURL slugと一致している
- [ ] ファイルが適切なカテゴリフォルダに配置されている
- [ ] frontmatterに必要な項目（title, description, category, order, updated, sourceUrl, keywords）がすべて記載されている
- [ ] description が日本語の要約になっており、`原文: URL` のようなプレースホルダになっていない
- [ ] カテゴリ名が日本語化されており、他のページと統一されている
- [ ] orderが `docs/SIDEBAR_URLS.md` と既存の数値帯に整合している
- [ ] **公式ページから画像URLを全て抽出した（コマンド実行結果を確認）**
- [ ] **抽出した画像URLの数を確認した（`wc -l`コマンドで件数チェック）**
- [ ] **コンテンツ画像とロゴ・アイコンを区別してダウンロードした**
- [ ] **画像の配置位置を公式ページと照合して確認した（開発者ツールまたはHTMLソース）**
- [ ] **各画像が適切な文脈（手順、説明文など）に配置されている**
- [ ] メディアファイル（画像・動画）が適切に配置されている
- [ ] **ダウンロードした画像ファイル名が短縮形式（7文字ハッシュ）になっている**
- [ ] メディアファイルが正しく表示される（相対パスが正確）
- [ ] 日本語として自然な表現になっている
- [ ] 原文の構造（見出し階層、段落）が維持されている
- [ ] 内部リンクが日本語版ページを指している（可能な場合）
- [ ] 内部リンクが `/docs/{slug}` 形式で、フォルダ名を含んでいない
- [ ] 外部リンクが正しく機能する
- [ ] 新規追加・大規模改稿した Callout が `:::` 記法で書かれている
- [ ] コードブロックにtitle属性が付与されている（必要な場合）
- [ ] ビルドエラーが発生しない
- [ ] メディアファイルの無いページにフォルダを作成していない

## 9. トラブルシューティング

### 9.0 画像のダウンロード漏れ

**原因**: 画像URLの抽出コマンドが不完全、または手動選択でミス

**解決策**:

```bash
# 1. 公式ページから全画像URLを抽出（漏れなし版）
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp)' | \
  sort -u

# 2. 抽出した画像数を確認
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp)' | \
  sort -u | wc -l
# 例: 13個の画像が見つかった

# 3. ダウンロードした画像数を確認
ls -1 public/images/[category]/[page-slug]/*.png | wc -l
# 例: 5個だけダウンロードされている → 8個が漏れている！

# 4. 不足分を特定
# 抽出したURLリストとダウンロード済みファイルを比較
curl -s "https://help.testim.io/docs/[page-slug]" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp)' | \
  grep -v -E '(ProductLogoMark|favicon|bullet|info2x)' | \
  sort -u > expected.txt

ls -1 public/images/[category]/[page-slug]/*.png | \
  xargs -n1 basename | \
  sed -E 's/^([a-f0-9]{7})-/\1[a-f0-9]*-/' > downloaded.txt

# 不足しているファイルを確認し、個別にダウンロード
```

**予防策**:

- URLの抽出時に `src=` や引用符を含めない（HTMLタグ以外の場所にある画像も検出）
- 抽出結果の件数を必ず確認
- ダウンロード後、件数を再度確認

### 9.1 メディアファイルが表示されない

**原因**: ファイルパスが間違っている

**解決策**:

```markdown
# ✅ 正しい形式（先頭に / あり、カテゴリフォルダを含む）

![説明](/images/overview/page-slug/filename.png)
<video src="/images/recording-tests/page-slug/video.mp4"></video>

# ❌ 間違った形式（先頭に / が無い、またはカテゴリフォルダが無い）

![説明](images/page-slug/filename.png)
![説明](/images/page-slug/filename.png)
<video src="images/page-slug/video.mp4"></video>
```

### 9.2 ビルドエラー

**原因**: frontmatterのYAML形式が不正

**解決策**: YAML構文チェッカーで確認

- インデントは半角スペース2つ
- 文字列は `'` で囲む（特に日本語やコロン含む場合）
- 配列は `-` で記述

```yaml
# ✅ 正しい例
category: '概要'
keywords:
  - テスト自動化
  - Testim

# ❌ 間違った例（日本語が囲まれていない）
category: 概要
```

### 9.3 サイドバーに表示されない

**原因**: categoryまたはorderが未設定、またはフォルダ構造が間違っている

**解決策**:

1. frontmatterに以下を必ず含める：

```yaml
category: 'カテゴリ名'
order: 1001
sourceUrl: 'https://help.testim.io/docs/example-slug'
```

2. ファイルが適切なフォルダに配置されているか確認：

```bash
# ファイルの場所を確認
find src/content/docs -name "[filename].md"
```

### 9.4 サイドバーの順序が公式サイトと異なる

**原因**: `docs/SIDEBAR_URLS.md` の並び、または既存ファイルの数値帯と整合していない

**解決策**:

1. `docs/SIDEBAR_URLS.md` で対象カテゴリ内の掲載順を確認する
2. 同じカテゴリの既存ファイルを見て、使われている `order` の数値帯を確認する
3. 対象ページの `order` を近い値へ調整する

### 9.5 動画が再生されない

**原因**: ファイル形式がブラウザでサポートされていない

**解決策**: 複数フォーマットを提供する

```markdown
<video controls width="100%">
  <source src="/images/demo/video.mp4" type="video/mp4">
  <source src="/images/demo/video.webm" type="video/webm">
  お使いのブラウザは動画タグに対応していません。
</video>
```

## 10. 一括処理時の注意事項

複数のページを一度に翻訳する場合、以下の点に注意してください。

### 10.1 処理順序

```bash
# 推奨順序
1. 全ページのURL slugリストを作成
2. カテゴリごとにグループ化
3. 各ページごとに以下を実行：
   a. 画像URL抽出 → 件数確認
   b. フォルダ作成
   c. 画像ダウンロード＆短縮
   d. 画像配置位置の確認（開発者ツール）
   e. Markdownファイル作成
   f. 画像埋め込み
   g. ビルド確認
```

### 10.2 一括スクリプトの例

```bash
#!/bin/bash
# 複数ページを一括処理するスクリプト例

# ページリスト（page-slug:category-folder形式）
pages=(
  "testim-overview:overview"
  "testim-automate:overview"
  "setting-up-your-account:getting-started"
)

for page_info in "${pages[@]}"; do
  slug="${page_info%%:*}"
  category="${page_info##*:}"

  echo "========================================="
  echo "処理中: $slug (カテゴリ: $category)"
  echo "========================================="

  # 1. 画像URL抽出
  urls=$(curl -s "https://help.testim.io/docs/$slug" | \
    grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp)' | \
    grep -v -E '(ProductLogoMark|favicon|bullet|info2x)' | \
    sort -u)

  count=$(echo "$urls" | grep -c "^")
  echo "画像数: $count"

  if [ "$count" -eq 0 ]; then
    echo "⚠️  画像なし - スキップ"
    continue
  fi

  # 2. フォルダ作成
  img_dir="public/images/$category/$slug"
  mkdir -p "$img_dir"
  cd "$img_dir"

  # 3. ダウンロード＆短縮
  echo "$urls" | while read url; do
    [ -z "$url" ] && continue
    filename=$(basename "$url")

    if ! curl -sO "$url"; then
      echo "⚠️  ダウンロード失敗: $url"
      continue
    fi

    if [[ "$filename" =~ ^([a-fA-F0-9]{7})[a-fA-F0-9]{50,}(-.*) ]]; then
      short_name="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
      [ "$filename" != "$short_name" ] && mv "$filename" "$short_name"
      echo "✓ $short_name"
    else
      echo "✓ $filename"
    fi
  done

  cd - > /dev/null
  echo ""

  # 4. 次のページへ
  echo "⏳ 次は開発者ツールで画像配置位置を確認してください"
  echo ""
done

echo "✅ 全ての画像ダウンロードが完了しました"
```

### 10.3 一括処理時のチェックポイント

各ページ処理後、必ず以下を確認してください：

```bash
# 1. 画像数の確認
echo "抽出: $(curl -s "https://help.testim.io/docs/$slug" | \
  grep -oE 'https://files\.readme\.io/[a-zA-Z0-9_-]+\.png' | \
  grep -v -E '(ProductLogoMark|favicon|bullet|info2x)' | wc -l)"

echo "ダウンロード: $(ls -1 public/images/$category/$slug/*.png 2>/dev/null | wc -l)"

# 2. ファイル名の確認（全て7文字ハッシュになっているか）
ls -1 public/images/$category/$slug/*.png | \
  grep -v -E '^[a-fA-F0-9]{7}-' && echo "⚠️  長いハッシュあり"

# 3. 重複チェック
find public/images -name "*.png" | sort | uniq -d
```

### 10.4 中断・再開のベストプラクティス

```bash
# 処理済みページをログに記録
processed_pages="processed.log"

# 処理完了時にログへ追加
echo "$slug:$category:$(date +%Y-%m-%d)" >> "$processed_pages"

# 再開時に未処理のページのみ実行
if grep -q "^$slug:" "$processed_pages" 2>/dev/null; then
  echo "スキップ: $slug (処理済み)"
  continue
fi
```

## 11. 今後の拡張と運用

### 11.1 新しいページを追加する場合

1. 公式サイトから翻訳対象のURLとカテゴリを確認
2. `docs/SIDEBAR_URLS.md` に対象URLがあり、掲載位置が正しいことを確認
3. 近いトピックのフォルダを選び、必要なら新しいフォルダを作成
4. このガイドに従ってファイルを作成
5. orderを該当セクションの既存レンジに合わせて設定
6. メディアファイルがあれば抽出・ダウンロード
7. ビルドして動作確認

**新しいカテゴリを追加する場合**:

```bash
# 1. カテゴリフォルダを作成
mkdir -p src/content/docs/[new-category-folder]

# 2. 最初のページを作成
touch src/content/docs/[new-category-folder]/[page-slug].md

# 3. frontmatterで新しいカテゴリ名と sourceUrl を設定
# category: '新しいカテゴリ名'
# order: 1001
# sourceUrl: 'https://help.testim.io/docs/[page-slug]'
```

### 10.2 既存ページを更新する場合

1. 公式サイトで更新内容を確認
2. 該当するmdファイルを編集
3. `updated` フィールドを現在の日付に更新
4. 新しいメディアファイルがあれば追加ダウンロード
5. 削除されたメディアファイルがあれば削除

```bash
# 更新日の変更例
updated: '2025-11-15'  # 更新日を今日の日付に
```

### 10.3 カテゴリ順序の調整

公式サイトでカテゴリの順序が変更された場合、まず `docs/SIDEBAR_URLS.md` を更新し、その後で必要な `order` を見直してください。

**ヒント**: カテゴリ全体のorderを一括確認

```bash
# 特定カテゴリのorder一覧を確認
grep -h "^order:" src/content/docs/[category-folder]/*.md | sort
```

### 10.4 翻訳の一貫性を保つ

- 新しい技術用語が出た場合は、セクション5.2の用語統一表に追加
- 既存の翻訳と表現を統一（特にUI要素や固有名詞）
- 不明な用語は既存ファイルを検索して確認

```bash
# 既存ファイルから用語を検索
grep -r "Smart Locators" src/content/docs/
```

## 11. 参考情報

### 11.1 関連ファイル

- `src/content.config.ts` - コンテンツのスキーマ定義（frontmatter検証）
- `src/lib/docs.ts` - ドキュメント取得とナビゲーション構築ロジック
- `docs/SIDEBAR_URLS.md` - 翻訳対象URL、カテゴリ順、ページ順の正本
- `src/components/navigation/NavSidebar.astro` - サイドバーコンポーネント
- `.github/copilot-instructions.md` - プロジェクト全体の指針
- `WRITING_GUIDE.md` - Markdown記法と拡張機能のガイド

### 11.2 公式リソース

- **Testim 公式ドキュメント**: https://help.testim.io/docs/
- **Testim 公式サイト**: https://www.testim.io/
- **メディアCDN**: https://files.readme.io/

### 11.3 開発リソース

- **Astro ドキュメント**: https://docs.astro.build/
- **Markdown ガイド**: https://www.markdownguide.org/
- **Remark プラグイン**: https://github.com/remarkjs/remark

---

このガイドに従うことで、一貫性のある高品質な日本語ドキュメントページを追加・運用できます。

**質問や問題が発生した場合**:

1. このガイドのトラブルシューティングセクションを確認
2. `WRITING_GUIDE.md`で記法を確認
3. 既存の翻訳済みファイルを参考にする
4. プロジェクトのIssueを作成して相談
