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
| regex | `(?:^|\s)--?[a-zA-Z][\w-]*(?=\s|$|[,;])` |
| example | `--project-id`, `-h`, `--token` |
| note | 既存 `extractInvariantTokens()` と重複するが、glossary mask でも同等にマスクする |

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

---

## 登録手順

1. 本ファイルに `##` で新規 pattern の節を追加
2. `id`, `regex`, `example`, `note` を埋める（大文字小文字無視が必要な場合は `flags` に `gi` を指定）
3. `scripts/__tests__/parity_glossary_mask.test.mjs` に該当 pattern の TDD ケースを追加
4. 実装を追加し、`npm run test` で通るか確認
