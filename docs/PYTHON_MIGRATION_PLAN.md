# Plan: Issue #368 — scripts/ 全面 Python 化 + JA parser list-nesting 解決 + COPY ボタン

## Context

Issue #368 の根本原因は JA parser が line-based regex であること。EN parser の `collectInlineText` (HTML tree walker) はネスト `<li>` を 1 segment にフラット化するが、JA parser は各行を独立 segment として emit する。結果 128 files / 823 issues が発生。

この機会に scripts/ 全 68 mjs (~41K LOC) を Python に統一し、テストも pytest で全書き直しする。JA サイトに COPY ボタン機能も追加する。

**判断**: 品質優先 (急がない)、atomic cutover 原則準拠、5-counter = 0 維持。

---

## ライブラリ選定

### Python libraries

| ライブラリ | GitHub Stars | 用途 | 選定理由 |
|---|---|---|---|
| [beautifulsoup4](https://www.crummy.com/software/BeautifulSoup/) | PyPI 最多 DL | EN HTML パース | lxml/html5lib 切替可能。壊れた HTML に最堅牢 |
| [lxml](https://github.com/lxml/lxml) | 2.9K | BS4 高速バックエンド | C 拡張。`recover=True` で自動修復 |
| [html5lib](https://github.com/html5lib/html5lib-python) | 1.1K | BS4 寛容バックエンド (fallback) | WHATWG 準拠。lxml 失敗時の逃げ道 |
| [markdown-it-py](https://github.com/executablebooks/markdown-it-py) | 1.3K | JA Markdown AST (list/heading/code/table) | CommonMark 100%。nested list を構造的に解決 |
| [httpx](https://github.com/encode/httpx) | 15.2K | HTTP client | async + retry + requests 互換 |
| [pydantic](https://github.com/pydantic/pydantic) | 27.5K | データモデル | 型安全、validation、JSON serialization |
| [click](https://github.com/pallets/click) | 16K | CLI | composable commands |
| [python-frontmatter](https://github.com/eyeseast/python-frontmatter) | 800+ | YAML frontmatter | gray-matter 等価 |
| [pytest](https://github.com/pytest-dev/pytest) | 12K+ | テスト | parametrize, fixture, coverage |
| [ruff](https://github.com/astral-sh/ruff) | 38K+ | Linter + Formatter | Rust 製超高速 |
| [uv](https://github.com/astral-sh/uv) | 45K+ | Package/env manager | venv + lockfile 一体 |

### Astro (COPY ボタン)

| ライブラリ | GitHub Stars | npm weekly DL |
|---|---|---|
| [astro-expressive-code](https://github.com/expressive-code/expressive-code) | 882 | 10,092 |

### パーサ戦略

```
EN HTML: BeautifulSoup(html, 'lxml') → fallback: html5lib
JA Markdown: HYBRID
  - markdown-it-py: headings, lists, code fences, tables, images, paragraphs
  - Custom state machine: :::callout directives, <details>/<summary> HTML blocks
```

**markdown-it-py で :::callout を扱わない理由**: `mdit_py_plugins.container` は `:::note{title="..."}` metadata syntax 未対応。既存 regex state machine は正しく動作しており、Python `re` モジュールにそのまま移植可能。

---

## Node.js 保持境界 (CRITICAL)

`astro.config.mjs` が `scripts/lib/redirects.mjs` を import している。この依存を解消する:

### 解決策: `redirects.mjs` を自己完結化

`filePathToSlug` は 1 行の pure path utility:
```javascript
export function filePathToSlug(filePath, docsDir = DOCS_DIR) {
  return path.relative(docsDir, filePath).replace(/\.md$/, '');
}
```

**Action**: `redirects.mjs` に `filePathToSlug` と `DOCS_DIR` をインライン化し、`project.mjs` への import を除去。結果:
- `redirects.mjs` → `node:fs`, `node:path`, `node:url` のみに依存 (自己完結)
- `project.mjs` / `sidebar.mjs` / `madcap_toc.mjs` / `gray-matter` は全て削除可能

**保持ファイル**: `scripts/lib/redirects.mjs` のみ (Astro build 用)
**削除ファイル**: その他全ての mjs

---

## Python 環境セットアップ

```
scripts/
  py/
    pyproject.toml           # package definition + dependencies
    .python-version          # "3.12"
    uv.lock                  # lockfile (uv sync で生成)
    src/testim_parity/       # importable package
    tests/                   # pytest tests
```

### pyproject.toml

```toml
[project]
name = "testim-parity"
version = "0.0.1"
requires-python = ">=3.12"
dependencies = [
  "beautifulsoup4>=4.12",
  "lxml>=5.0",
  "html5lib>=1.1",
  "markdown-it-py[plugins]>=3.0",
  "httpx>=0.27",
  "pydantic>=2.0",
  "click>=8.0",
  "python-frontmatter>=1.1",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-cov>=5.0", "ruff>=0.4"]

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
  "boundary: boundary stability (score >= 0.95)",
  "recall: mutation recall (9/9 = 100%)",
  "integration: full pipeline",
]

[tool.coverage.report]
fail_under = 90
```

### Local setup

```bash
cd scripts/py
uv sync         # creates .venv + installs deps from uv.lock
uv run pytest   # runs tests in venv
```

### CI additions (`.github/workflows/ci.yml`)

```yaml
- uses: actions/setup-python@v5
  with:
    python-version-file: 'scripts/py/.python-version'
- run: pip install uv && cd scripts/py && uv sync
- run: cd scripts/py && uv run pytest --cov
```

**Vercel build**: Python 不要。`npm run build` は `astro build` のみ実行し、Python scripts を invoke しない。

---

## Phase 0: Foundation (基盤構築)

**Goal**: Pydantic モデル、共有 utilities、redirects.mjs 自己完結化

### 0.1: redirects.mjs decoupling

`scripts/lib/redirects.mjs` に `filePathToSlug` + `DOCS_DIR` をインライン化:
```javascript
const DOCS_DIR = path.resolve(__dirname, '..', '..', 'src', 'content', 'docs');
function filePathToSlug(filePath) {
  return path.relative(DOCS_DIR, filePath).replace(/\.md$/, '');
}
```
`import { filePathToSlug } from './project.mjs';` を削除。

### 0.2: Python package skeleton

Port 対象 (leaf nodes):
- `source_parity_segments_shared.mjs` → `models.py` + `segments_shared.py`
- `source_parity_types.mjs` → `types.py`
- `parity_normalize.mjs` → `normalize.py`
- `source_parity_align_scoring.mjs` → `align_scoring.py`
- `source_parity_extract.mjs` (token portion) → `extract.py`
- `parity_glossary_mask.mjs` → `glossary_mask.py`
- `parity_artifact_registry.mjs` → `artifact_registry.py`
- `en_source_patches.mjs` → `en_source_patches.py`
- `project.mjs` → `project.py`
- `sidebar.mjs` → `sidebar.py`
- `madcap_toc.mjs` → `madcap_toc.py`

### Verification gate

- `uv run pytest tests/test_segments_shared.py` pass
- `npm run build` pass (redirects.mjs decoupling 確認)

---

## Phase 1: EN Segment Extractor (BS4 化)

**Goal**: カスタム HTML tokenizer → `BeautifulSoup(html, 'lxml')`

### Module: `source_parity_segments_en.mjs` (709 LOC) → `segments_en.py`

### preprocessEnHtml の扱い

`turndown.mjs` の `preprocessEnHtml()` は extraction hot path にある (`segments_en.mjs` line 21 で import)。
- `preprocessEnHtml()` (entity decode, escaped details normalization, callout normalization) → Python に port
- TurndownService 自体 (HTML→MD 変換) → pipeline only, Phase 4 で対応

### BS4 ベース preprocess

```python
from bs4 import BeautifulSoup, Comment

def preprocess_html(html: str, slug: str | None = None) -> BeautifulSoup:
    soup = BeautifulSoup(html, 'lxml')
    for btn in soup.select('a.codeSnippetCopyButton'):
        btn.decompose()
    for tag in soup.select('thead, script, style, col'):
        tag.decompose()
    for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
        comment.extract()
    # slug-scoped callout normalization
    if slug in CALLOUT_NORMALIZATION_SLUGS:
        normalize_blockquote_callouts(soup)
    return soup
```

### MadCap edge case 検証

BS4 + lxml は `<ol>` + non-`<li>` siblings を auto-reparent する可能性あり。
**Action**: EN snapshot の 433 件の non-li 兄弟パターンで conformance test を作成し、BS4 が同じ tree 構造を返すか検証。失敗するケースがあれば preprocess で明示的に構造化。

### Fallback 戦略

```python
def extract_segments_from_html(html: str, slug: str | None = None) -> list[Segment]:
    soup = preprocess_html(html, slug)
    segments = walk_block_container(soup.body or soup, state)
    if not segments and len(html) > 800:
        # lxml failed → retry with html5lib
        soup = BeautifulSoup(html, 'html5lib')
        soup = preprocess_html_on_soup(soup, slug)
        segments = walk_block_container(soup.body or soup, state)
    return segments
```

### Verification gate

- 全 288+ snapshot ページで segments_en 出力を mjs と比較
- **比較対象**: `segmentKind`, `sectionPath`, segment 数が一致 (textNorm の微差は entity decoding の差で許容)
- 一致しないページを explicit allowlist で管理し原因文書化

---

## Phase 2: JA Segment Extractor (HYBRID アプローチ)

**Goal**: nested list を markdown-it-py AST で解決 + callout/details は custom state machine 維持

### アーキテクチャ: HYBRID parser

```python
from markdown_it import MarkdownIt

def extract_segments_from_markdown(content: str) -> list[Segment]:
    frontmatter, body = split_frontmatter(content)
    md = MarkdownIt().enable('table')
    tokens = md.parse(body)

    state = WalkState()
    i = 0
    while i < len(tokens):
        token = tokens[i]

        # --- Custom state machine for non-standard syntax ---
        if token.type == 'html_block':
            i = handle_html_block(tokens, i, state)  # <details>, <table>
            continue
        if token.type == 'paragraph_open':
            # Check if content is :::callout directive
            inline = tokens[i + 1] if i + 1 < len(tokens) else None
            if inline and is_callout_open(inline.content):
                i = handle_callout(tokens, i, state)
                continue

        # --- markdown-it-py AST for standard syntax ---
        if token.type == 'heading_open':
            i = handle_heading(tokens, i, state)
        elif token.type in ('bullet_list_open', 'ordered_list_open'):
            i = handle_list(tokens, i, state)  # NESTED LIST FLATTENING
        elif token.type == 'fence':
            i = handle_code_fence(tokens, i, state)
        elif token.type == 'paragraph_open':
            i = handle_paragraph(tokens, i, state)
        # ...
        else:
            i += 1
    return state.segments
```

### Issue #368 解決: nested list flattening

```python
def handle_list(tokens: list, start: int, state: WalkState) -> int:
    """Walk list, emitting ONE segment per top-level <li> (flattening nested content)."""
    list_token = tokens[start]
    kind = 'ordered-list-item' if list_token.type == 'ordered_list_open' else 'unordered-list-item'
    close_type = list_token.type.replace('_open', '_close')
    i = start + 1
    while i < len(tokens) and tokens[i].type != close_type:
        if tokens[i].type == 'list_item_open':
            text = collect_list_item_text(tokens, i)
            if text.strip():
                state.emit(kind, text)
            i = skip_to_close(tokens, i, 'list_item_close')
        i += 1
    return i + 1  # skip list_close

def collect_list_item_text(tokens: list, item_open_idx: int) -> str:
    """Recursively flatten ALL content in a list_item (including nested lists)."""
    parts = []
    i = item_open_idx + 1
    depth = 1
    while i < len(tokens) and depth > 0:
        if tokens[i].type == 'list_item_close':
            depth -= 1
        elif tokens[i].type == 'list_item_open':
            depth += 1
        elif tokens[i].type == 'inline' and tokens[i].content:
            parts.append(render_inline(tokens[i].content))
        i += 1
    return ' '.join(parts)
```

### :::callout handling (custom state machine, regex port)

```python
CALLOUT_OPEN_RE = re.compile(r'^:::(note|warning|info|tip|caution|danger)(?:\{[^}]*\})?\s*$')
CALLOUT_CLOSE_RE = re.compile(r'^:::\s*$')

def is_callout_open(text: str) -> bool:
    return bool(CALLOUT_OPEN_RE.match(text.strip()))

def handle_callout(tokens: list, para_open_idx: int, state: WalkState) -> int:
    """Scan forward through tokens, collecting callout body paragraphs."""
    # ... custom state machine identical to current mjs logic
```

### Callout inside list items: 意図的に未対応

| 状態 | 説明 |
|---|---|
| 現行 JA parser | :::callout inside list item は未対応 (line regex が list context を追跡しない) |
| 新 HYBRID parser | 同様に未対応。markdown-it-py は list item 内の `:::` テキストを paragraph inline として emit するため、custom state machine の `is_callout_open` チェックに到達しない |
| EN parser | `<li>` 内の callout div は `collectInlineText` でフラット化 (callout kind を失う) |
| 実際の corpus | `src/content/docs/` に list-item-nested callout は **0 件** |
| 対応方針 | WRITING_GUIDE に「list item 内に :::callout を書かない」制約を明記。`lint:docs` で検出ルール追加。将来必要になれば separate Issue で拡張 |

これは regression ではなく**既存動作の維持 + 明文化**。

### Block image detection

markdown-it-py では image は常に inline token。Block image の判定:
```python
def handle_paragraph(tokens: list, start: int, state: WalkState) -> int:
    inline_token = tokens[start + 1]
    # Single-image paragraph = block image (not emitted as segment, same as EN)
    if is_single_image_paragraph(inline_token):
        state.emit('image', extract_image_alt(inline_token))
        return start + 3  # para_open + inline + para_close
    # Normal paragraph
    state.emit('paragraph', render_inline(inline_token.content))
    return start + 3
```

### 128 ページ flat 化が不要

`collect_list_item_text` が nested markdown を自動フラット化するため、**JA content 変更ゼロで parity 成立**。

### Verification gate

- 既存 clean pages (181 files): issue 数が増えない
- Issue #368 対象 128 files: `segment-missing` / `segment-extra` が 0 に減少
- Callout 境界テスト: `:::note{title="X"} ... :::` が正しく `callout-body` segment を emit
- Boundary stability >= 0.95

---

## Phase 3: Alignment, Structure, Baseline, Supporting Modules

**Goal**: parity system コア + 全 supporting modules を port

### Port 対象 (16 modules, ~5,500 LOC)

| mjs source | Python target | LOC |
|---|---|---|
| `source_parity_align.mjs` | `align.py` | 898 |
| `source_parity_structure.mjs` | `structure.py` | 441 |
| `source_parity_baseline.mjs` | `baseline.py` | 551 |
| `source_parity_source_usability.mjs` | `source_usability.py` | 267 |
| `source_parity_acknowledgements.mjs` | `acknowledgements.py` | 242 |
| `source_parity_issue_state.mjs` | `issue_state.py` | 115 |
| `source_parity_summary.mjs` | `summary.py` | 209 |
| `source_parity_summary_format.mjs` | `summary_format.py` | 33 |
| `source_parity_advisory_queue.mjs` | `advisory_queue.py` | 200 |
| `source_parity_page_coverage.mjs` | `page_coverage.py` | 137 |
| `source_parity_checks.mjs` | `checks.py` | 411 |
| `turndown.mjs` (preprocessEnHtml only) | `preprocess_en.py` | ~200 |
| `mutation_corpus.mjs` | `mutation_corpus.py` | 763 |
| `source_sync_exclusions.mjs` | `sync_exclusions.py` | 116 |
| `source_sync_health.mjs` | `sync_health.py` | 276 |
| `detection_reports.mjs` | `detection_reports.py` | 1575 |

### 重要制約

- `buildBaselineKey()` → byte-identical key string (baseline schema v2)
- `weightedLcs()` → pure Python array (numpy 不使用)、同一結果保証
- `preprocessEnHtml()` → BS4 ベースに port (`normalizeEscapedCallouts`, `normalizeEscapedFaqDetails` 含む)

### Verification gate

- **5-counter aggregate gate**: Python parity check が 5 counter 全て 0 を出力
- Mutation recall: 9/9 = 100%

---

## Phase 4: Detection + Pipeline + Tools (CLI scripts)

**Goal**: 全 CLI entry point を port。`click` で引数パース。

### Detection (9 scripts) → `detection/`
### Pipeline (6 scripts) → `pipeline/`
### Tools (6 scripts) → `tools/` (既存 fix_notation.py, verify_notation.py を移動)

### CI workflow 更新

`.github/workflows/ci.yml` line 111:
```yaml
# Before: node scripts/detection/render_upstream_recovery_comment.mjs
# After:  cd scripts/py && uv run python -m testim_parity.detection.render_upstream_recovery_comment
```

### HTML→MD 変換 (pipeline 用)

`turndown` npm package の代替。Pipeline の `fetch_translate_images.mjs` で使用:
- `markdownify` (Python) + custom converters for MadCap patterns
- **extraction hot path には使わない** (segments_en は raw HTML を直接 walk)

### Verification gate

- 各 CLI が同一の JSON artifacts を生成
- 5-counter = 0

---

## Phase 5: Tests (pytest 全書き直し)

**Goal**: 57 test files → pytest

### 3-tier テスト戦略 (レビュー指摘を反映)

**Golden-master の矛盾を解消**: Python は Issue #368 の 128 ページで意図的に異なる (正しい) 出力を生成する。per-page segment 比較ではなく aggregate gate で検証。

| Tier | 目的 | 手法 |
|---|---|---|
| **Unit tests** | 個別関数の正しさ | pytest parametrize。mjs テストを Python に移植。CORRECT behavior をテスト |
| **Structural conformance** | 意図しない regression 検出 | 全ページで `{sectionPath, kind, count}` を比較。intentional diff は allowlist |
| **Aggregate counter gate** | 5-counter = 0 不変量 | Full parity run → `parity-check-status.json` の 5 counter が全て 0 |

### Coexistence period (cutover 前)

```json
{
  "scripts": {
    "test": "node --test scripts/__tests__/*.mjs",
    "test:py": "cd scripts/py && uv run pytest",
    "test:all": "npm run test && npm run test:py"
  }
}
```

CI は `npm run test:all` を実行。mjs テストファイルが 1 つ移植される度に対応する mjs test を削除。

### Coverage target: 90%+

---

## Phase 6: Cutover (atomic 切替)

**Goal**: npm scripts を Python に接続、mjs 削除

### Cutover gate criteria (全て true)

1. `uv run pytest` — 全 pass、coverage >= 90%
2. `npm run check:parity` via Python — 5-counter = 0
3. Mutation recall: 9/9 = 100%
4. Boundary stability >= 0.95
5. `npm run build` pass (Astro site 無影響)
6. `npm run lint` pass
7. `scripts/__tests__/*.mjs` が全て空 (全移植完了)

### package.json 変更

```json
{
  "scripts": {
    "test": "cd scripts/py && uv run pytest",
    "check:parity": "cd scripts/py && uv run python -m testim_parity.detection.check_source_parity",
    "check:snapshots:fetch": "cd scripts/py && uv run python -m testim_parity.detection.snapshot_update",
    "check:snapshots:diff": "cd scripts/py && uv run python -m testim_parity.detection.snapshot_diff",
    "lint:docs": "cd scripts/py && uv run python -m testim_parity.tools.lint_docs"
  }
}
```

### 削除対象

- `scripts/__tests__/` (57 mjs test files)
- `scripts/lib/` (33 mjs files) **except `redirects.mjs`**
- `scripts/detection/` (9 mjs files)
- `scripts/pipeline/` (6 mjs files)
- `scripts/tools/` (6 mjs tool files → py/ に移動済)

### dependency 変更 (cutover 時点で実行)

- Remove: `turndown` (全 mjs 削除後、依存するスクリプトが存在しない)
- Remove: `gray-matter` (Phase 0.1 で redirects.mjs 自己完結化済 + Phase 4 で全消費者 Python 移行完了後)
  - **注意**: gray-matter は coexistence 期間中は残す。`lint_docs.mjs`, `normalize_docs.mjs`, `report_frontmatter_categories.mjs`, `fetch_translate_images.mjs` が Phase 4 完了まで使用
- Keep: `markdownlint-cli` (MD lint は Node のまま)

### Rollback

Single PR。失敗時 `git revert`。Python は `scripts/py/` に残存し mjs と干渉しない。

---

## Phase 7: COPY ボタン (独立、Phase 0-6 と並行可能)

**Goal**: JA サイトの全コードスニペットに COPY ボタンを追加

### 実装: astro-expressive-code

```bash
npm install astro-expressive-code
```

### astro.config.mjs 変更

```javascript
import expressiveCode from 'astro-expressive-code';

export default defineConfig({
  integrations: [
    expressiveCode({
      themes: ['github-dark'],
      styleOverrides: {
        borderRadius: '1rem',
        borderColor: 'rgb(15 23 42 / 0.1)',
      },
    }),
    // ... existing integrations
  ],
});
```

### 既存 CSS との統合

`src/styles/global.css` の `.docs-prose pre` スタイルは Expressive Code が制御するため:
- 競合するルールを `.docs-prose :not(.expressive-code) pre` にスコープ限定
- `data-has-title` はExpressive Code の frame 機能で代替

### parity system との関係

- EN parser: `codeSnippetCopyButton` は引き続き `preprocess_html()` で除去 (UI chrome)
- JA site: Expressive Code が全 ` ``` ` フェンスに COPY button を inject
- Parity 比較: `code-block` は non-gate (影響なし)

### Verification

- `npm run dev` → コードスニペット含むページで COPY ボタン表示確認
- クリックでクリップボードにコピーされることを確認
- `npm run build` pass

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| BS4/lxml の `<ol>` + non-`<li>` 兄弟 reparent | 433 件パターンで conformance test 作成 |
| lxml パース失敗 | html5lib fallback (segment 0 件時に自動再試行) |
| :::callout の metadata `{title}` | markdown-it-py に頼らず custom regex state machine を port |
| Golden-master 矛盾 | per-page exact match ではなく aggregate 5-counter gate で検証 |
| `astro.config.mjs` build 破綻 | redirects.mjs 自己完結化 (Phase 0.1) で dependency chain 切断 |
| Block/inline image 区別 | `is_single_image_paragraph()` helper で paragraph 内 image を判定 |
| CI workflow mjs 呼び出し | `.github/workflows/ci.yml` line 111 を Python 呼び出しに更新 |
| Coexistence period regression | `npm run test:all` で両方実行 |
| Python 環境 local/CI | uv + .python-version + CI setup-python action |
| Expressive Code vs 既存 CSS | styleOverrides + CSS scope 限定 |
| 128 pages intentional diff | structural conformance test の explicit allowlist で管理 |

---

## Key Benefits

1. **128 ページの content 書き換え不要** — AST が nested list を自動 flatten
2. **HTML パーサ堅牢性** — lxml + html5lib 2パーサ切替
3. **言語統一** — 68 mjs + 2 py → Python only (redirects.mjs のみ例外)
4. **COPY ボタン UX** — content 変更なしで全コードブロックに適用
5. **テスト簡潔化** — pytest parametrize/fixture

---

## Verification (end-to-end)

```bash
# 1. Python setup
cd scripts/py && uv sync

# 2. Tests
uv run pytest --cov --cov-report=term-missing

# 3. Parity check (5-counter = 0)
npm run check:parity

# 4. Snapshots
npm run check:snapshots

# 5. Lint
npm run lint

# 6. Build
npm run build

# 7. COPY button
npm run dev  # → browser で確認
```

---

## Critical Files

| File | Role | Action |
|---|---|---|
| `scripts/lib/source_parity_segments_en.mjs` (709 LOC) | EN extractor | BS4 化 |
| `scripts/lib/source_parity_segments_ja.mjs` (715 LOC) | JA extractor | HYBRID (markdown-it-py + custom) |
| `scripts/lib/source_parity_align.mjs` (898 LOC) | Alignment | weighted LCS port |
| `scripts/detection/check_source_parity.mjs` (915 LOC) | Main entry | orchestration port |
| `scripts/lib/source_parity_segments_shared.mjs` (189 LOC) | Shared model | Pydantic model 化 |
| `scripts/lib/turndown.mjs` (451 LOC) | EN preprocess | preprocessEnHtml のみ port |
| `scripts/lib/redirects.mjs` (64 LOC) | Astro redirects | **自己完結化して保持** |
| `astro.config.mjs` | Site config | Expressive Code 追加 |
| `.github/workflows/ci.yml` | CI | Python step 追加, mjs→Python 切替 |

## Reuse

- 既存 `fix_notation.py` + `verify_notation.py` → `tools/` に移動のみ
- `en_source_patches.mjs` patch registry → Python dict にそのまま移植
- `CALLOUT_NORMALIZATION_SLUGS` → Python `frozenset`
- `CALLOUT_OPEN_RE` 等の regex → Python `re.compile()` にそのまま移植
