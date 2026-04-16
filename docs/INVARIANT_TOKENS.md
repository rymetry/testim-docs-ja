# Invariant Token Patterns

<!-- markdownlint-disable MD038 MD052 MD056 MD060 -->

本ファイルは **JA 内に英語のまま残るべき invariant token のパターン定義** です。`scripts/lib/parity_glossary_mask.mjs` が読み、マッチした token は `segment-untranslated` 検知から除外されます。

各 pattern には:
- `id`: 識別子（debug.maskCoverage で出力される）
- `regex`: マッチ正規表現（JavaScript）
- `flags`: 正規表現フラグ（省略時は `g` のみ。大文字小文字無視が必要なら `gi`）
- `example`: 正しくマッチする例
- `note`: 例外や注意点

登録基準:
- 英語のまま残すべき token で、決定論的に識別できるパターン
- Glossary に個別登録するには数が多すぎる、または動的なもの（バージョン番号・タイムスタンプ等）

---

## keyboard-shortcut

| 項目 | 値 |
| --- | --- |
| id | `keyboard-shortcut` |
| regex | `\b(Ctrl|Cmd|Shift|Alt|Option|Meta|Enter|Esc|Escape|Tab|Space|Backspace|Delete)(\+\w+)+\b` |
| flags | `gi` |
| example | `Ctrl+S`, `Shift+Cmd+K`, `Alt+Tab`, `ctrl+shift+i` |
| note | 修飾キー (`Ctrl|Cmd|...`) から始まり`+` で連結されるもののみ。textNorm は小文字化するため `gi` flag で大文字小文字両対応 |

## cli-flag

| 項目 | 値 |
| --- | --- |
| id | `cli-flag` |
| regex | `(?:^|[\s\u3001\u3002])--?[a-zA-Z][\w-]*(?=[\s\u3001\u3002:,;]|$)` |
| example | `--project-id`, `-h`, `--token`, `、--label` |
| note | 既存 `extractInvariantTokens()` と重複するが、glossary mask でも同等にマスクする。CJK 句読点（`、` `。`）の前後でもマッチする |

## version-number

| 項目 | 値 |
| --- | --- |
| id | `version-number` |
| regex | `\bv?\d+\.\d+(?:\.\d+)?\b` |
| example | `v1.2.3`, `4.0`, `2.3.1` |

## file-path-or-extension

| 項目 | 値 |
| --- | --- |
| id | `file-path-or-extension` |
| regex | `\b[\w.-]+\.(json|yml|yaml|js|ts|mjs|md|css|html|htm|sh|env)\b` |
| example | `package.json`, `.testimrc`, `config.yml` |

## numeric-unit

| 項目 | 値 |
| --- | --- |
| id | `numeric-unit` |
| regex | `\b\d+(?:\.\d+)?\s*(?:ms|sec|s|min|hr|px|em|rem|%|MB|GB|KB)\b` |
| example | `30000ms`, `5 sec`, `1024px` |

## env-var

| 項目 | 値 |
| --- | --- |
| id | `env-var` |
| regex | `\b[A-Z][A-Z0-9_]{2,}\b` |
| example | `BASIC_AUTH_ENABLED`, `NODE_ENV` |
| note | 全大文字 + アンダースコア の識別子。3 文字以上で誤検知を避ける |

## testim-step-name-with-parens

Testim のステップ名・プロパティ名のうち、括弧や記号を含むもの（GLOSSARY のワード境界マッチが効かない）。

| 項目 | 値 |
| --- | --- |
| id | `testim-step-name-with-parens` |
| regex | `(?:\b(?:[Ss]croll\s*\(to\s+element\/on\s+page\)|[Ff]ile\s+upload\s*\/\s*[Ff]ile\s+drop|[Pp]ress\s*\([Kk]ey\s+press\))|\([Ss]hared\)\s+step\s+name)` |
| example | `Scroll (to element/on page)`, `File upload / File drop`, `Press (Key press)`, `(Shared) step name` |
| note | 括弧・スラッシュを含む Testim ステップ名・プロパティ名。textNorm は小文字になるためパターンに大文字小文字両方を含む |

## js-exports-expression

JS コードスニペット内の `exports.xxx` 式。カスタム JS ステップの解説で頻出する。

| 項目 | 値 |
| --- | --- |
| id | `js-exports-expression` |
| regex | `\bexports\.\w+\b` |
| example | `exports.myvar`, `exports.besttestingtool` |
| note | `exports.` に続く識別子をマスクする。JS コード例が JA テキスト中に残るケース |

## snake-case-identifier

コード識別子の snake_case パターン（JSON フィールド名、Testim パラメーター名等）。

| 項目 | 値 |
| --- | --- |
| id | `snake-case-identifier` |
| regex | `\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b` |
| flags | `g` |
| example | `tst_creds`, `project_id`, `execution_url`, `scheduler_name` |
| note | アンダースコアを含む小文字識別子をマスクする。textNorm は小文字化されているため大文字パターンは不要 |

## sso-ui-prompt

SSO プロバイダー UI の固定プロンプトテキスト。`\b` word boundary では末尾の `?` や `)` が非ワード文字のためマッチしないものを、固定文字列パターンとして登録する。

| 項目 | 値 |
| --- | --- |
| id | `sso-ui-prompt` |
| regex | `(?:what's the name of your app\?|integrate any other application you don't find in the gallery \(non-gallery\)|choose integrate any other application you don't find in the gallery \(non-gallery\))` |
| flags | `gi` |
| example | `What's the name of your app?`, `integrate any other application you don't find in the gallery (non-gallery)` |
| note | Azure AD セットアップ手順の固定 UI プロンプト。GLOSSARY の `\b` マッチが末尾の非ワード文字 (`?`, `)`) で失敗するため INVARIANT で登録 |

## cli-placeholder

CLI コマンド例の angle-bracket プレースホルダー（`<token id>`, `<project id>` 等）。

| 項目 | 値 |
| --- | --- |
| id | `cli-placeholder` |
| regex | `<[^<>]+>` |
| example | `<token id>`, `<project id>`, `<key id>` |
| note | CLI コマンド例に頻出するプレースホルダーをマスクする |

## double-quoted-literal

CLI コマンド例やコードスニペット内のダブルクォート文字列。

| 項目 | 値 |
| --- | --- |
| id | `double-quoted-literal` |
| regex | `"[^"]*"` |
| example | `"token"`, `"testim-grid"`, `"label #2"` |
| note | CLI 引数値やコード例中のダブルクォート文字列をマスクする。JA テキスト中の「」括弧とは異なるため false-negative リスクは低い |

## inline-js-throw-return

JA テキスト中に出現する JavaScript コードパターン（throw/return/const/if 構文）。カスタムアクションやフック解説文で頻出する。

| 項目 | 値 |
| --- | --- |
| id | `inline-js-throw-return` |
| regex | `\b(?:throw\s+new\s+\w+\(|return\s*\{|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=)` |
| flags | `g` |
| example | `throw new Error(`, `return {`, `const statusCode =`, `let cookieArray =` |
| note | JS 構文開始部をマスクする。完全なステートメントではなく開始パターンのみ |

## table-header-pattern

テーブルヘッダーに残る英語列名パターン（Name/Type/Value/Description の組み合わせ）。

| 項目 | 値 |
| --- | --- |
| id | `table-header-pattern` |
| regex | `\b(?:Name|Type|Value|Description|Package|Field)\b` |
| flags | `g` |
| example | `Name`, `Type`, `Value`, `Package` |
| note | テーブルヘッダーとして残る一般的な英語列名。テーブル文脈でのみ使用される |

## common-it-loanword

JA 技術文書で英語のまま使用される一般的な IT 用語。カタカナに変換されることもあるが、本プロジェクトでは英語のまま許容する。

| 項目 | 値 |
| --- | --- |
| id | `common-it-loanword` |
| regex | `\b(?:simulator|emulator|device|compile|mobile|web|app|parallel|integration|plugin|certificate|profile|payload|webhook|token|dashboard|server|proxy|tunnel|execution|email|inbox|download|upload|screenshot|annotation|breakpoint|debugger|localhost|timeout|override)\b` |
| flags | `gi` |
| example | `simulator`, `emulator`, `device`, `compile`, `mobile`, `web` |
| note | 技術文脈で英語のまま使用が許容される一般 IT 用語。残留が 15 文字/3 語を下回るよう閾値寄与を減らす |

---

## 登録手順

1. 本ファイルに `##` で新規 pattern の節を追加
2. `id`, `regex`, `example`, `note` を埋める（大文字小文字無視が必要な場合は `flags` に `gi` を指定）
3. `scripts/__tests__/parity_glossary_mask.test.mjs` に該当 pattern の TDD ケースを追加
4. 実装を追加し、`npm run test` で通るか確認
