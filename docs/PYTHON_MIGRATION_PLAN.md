# Plan: Issue #368 — scripts/ 全面 Python 化 + JA parser list-nesting 解決 + COPY ボタン

## Context

Issue #368 の根本原因は JA parser が line-based regex であること。EN parser の `collectInlineText` (HTML tree walker) はネスト `<li>` を 1 segment にフラット化するが、JA parser は各行を独立 segment として emit する。結果 128 files / 823 issues が発生。

この機会に scripts/ 全 68 mjs (~41K LOC) を Python に統一し、テストも pytest で全書き直しする。JA サイトに COPY ボタン機能も追加する。

**判断**: 品質優先 (急がない)、atomic cutover 原則準拠、5-counter = 0 維持。

---

## ライブラリ選定

### Python libraries

| ライブラリ | GitHub Stars | 用途 | 選定理由 |
| --- | --- | --- | --- |
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
| --- | --- | --- |
| [astro-expressive-code](https://github.com/expressive-code/expressive-code) | 882 | 10,092 |

### パーサ戦略

```text
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
- `astro.config.mjs` の build graph から `scripts/lib/project.mjs` 以下の依存 chain が切り離される

**重要な注意**: この decoupling は **Astro build graph だけ** を切る。`project.mjs` には依然として 17+ の mjs consumer が残る (`check_source_parity.mjs`, `snapshot_update/diff.mjs`, `pipeline/*`, `tools/*`, `detection_reports.mjs`, `source_parity_extract.mjs` 等)。したがって `project.mjs` / `sidebar.mjs` / `madcap_toc.mjs` / `gray-matter` の削除は **Phase 4 の consumer 全 port 完了まで不可**。Phase 0 だけで「mjs 削除可能」となるわけではない。

**保持ファイル (Phase 6 cutover まで)**: `scripts/lib/redirects.mjs` (Astro build 用) + その他全 mjs (coexistence)
**最終削除ファイル (Phase 6 cutover 時)**: `scripts/lib/redirects.mjs` 以外すべて

---

## Python 環境セットアップ

```text
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

**Goal**: Python package skeleton, 基盤 utilities の port, cross-runtime conformance harness, redirects.mjs 自己完結化, CI Python job。

### 0.1: redirects.mjs decoupling ✅ 完了

`scripts/lib/redirects.mjs` に `filePathToSlug` + `DOCS_DIR` をインライン化:

```javascript
const DOCS_DIR = path.resolve(__dirname, '..', '..', 'src', 'content', 'docs');
function filePathToSlug(filePath) {
  return path.relative(DOCS_DIR, filePath).replace(/\.md$/, '');
}
```

`import { filePathToSlug } from './project.mjs';` を削除。Astro build graph から `project.mjs` 依存を切断済。**ただし**「Node.js 保持境界」節に記載の通り、`project.mjs` には 17+ の mjs consumer が残っているため、この decoupling だけで mjs 削除可能とはならない (Phase 4 以降)。

### 0.2: Python package skeleton + 基盤 utilities ✅ 完了

- `scripts/py/` skeleton: `pyproject.toml` (uv + pydantic + bs4 + lxml + markdown-it-py 等), `.python-version` = 3.12, `uv.lock`, ruff / mypy / pytest 設定
- `tests/conftest.py`: 共有 `make_segment` fixture, `repo_root` / `node_available` session fixtures
- 11 leaf module 全て ported:
  - `source_parity_types.mjs` → `types.py` (severity map, coarse signal / structure / source-unusable sets, UNTRANSLATED_PATTERNS 他)
  - `parity_normalize.mjs` → `normalize.py` (URL canonicalization)
  - `source_parity_align_scoring.mjs` → `align_scoring.py` (weighted-LCS ペアスコア)
  - `madcap_toc.mjs` → `madcap_toc.py` (AMD module パーサ + TOC tree 走査 + sidebar snapshot)
  - `sidebar.mjs` → `sidebar.py` (SIDEBAR_URLS.md パーサ + section lookup)
  - `project.mjs` → `project.py` (slug index / basename map / frontmatter-aware indexing / section filter)
  - `source_parity_extract.mjs` (token portion) → `extract.py` (invariant token 抽出 + URL 正規化)
  - `source_parity_segments_shared.mjs` → `models.py` (Pydantic Segment) + `segments_shared.py` (factory + 正規化 + fingerprint)
  - `parity_glossary_mask.mjs` → `glossary_mask.py` (GLOSSARY.md / INVARIANT_TOKENS.md loader + mask + classify)
  - `parity_artifact_registry.mjs` → `artifact_registry.py` (EN 側 artifact suppress registry + coverage)
  - `en_source_patches.mjs` → `en_source_patches.py` (patch registry は `_en_source_patches_data.json` として mjs から JSON 生成し共有)
- `__init__.py` で public API 再 export
- 構造契約 dep (beautifulsoup4 / lxml / markdown-it-py) に `~=` upper bound

### 0.3: Cross-runtime conformance harness ✅ 完了

`scripts/py/conformance/harness.mjs` が mjs 関数群を JSON I/O で露出し、Python conformance test (`tests/conformance/test_*_parity.py`) が 1 回の node プロセスで batch 評価して Python 出力と byte 比較する。
**これは Phase 0 reviewer gate で発覚した CRITICAL (Math.round vs Python round 銀行家丸め) の根本原因に対する systemic 対策**。port 対象 mjs を新しく追加するときは必ず `harness.mjs` の `DISPATCH` テーブルと該当 `test_*_parity.py` samples を同じ PR で拡張する。

`node_available` fixture 経由で node 不在環境では skip するため、Python-only CI でも壊れない。

### 0.4: CI Python job ✅ 完了

`.github/workflows/ci.yml` に `python-test` job 追加:

```yaml
python-test:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: scripts/py
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4  # conformance harness 用
      with: { node-version: '22' }
    - uses: actions/setup-python@v5
      with: { python-version-file: scripts/py/.python-version }
    - run: pip install --upgrade uv
    - run: uv sync --all-extras
    - run: uv run ruff check src tests
    - run: uv run ruff format --check src tests
    - run: uv run mypy src
    - run: uv run pytest --cov=testim_parity --cov-report=term-missing
```

### Phase 0 verification gate ✅ 全通過

- `uv run pytest` pass — **290 tests, 95.60% coverage** (unit + conformance)。conformance は mjs 出力と byte 一致を保証。`en_source_patches` は dual-source-of-truth drift 検出のため全 34 patch について registry full dump + replay を両 runtime で byte 比較
- `uv run ruff check src tests` pass
- `uv run ruff format --check src tests` pass
- `uv run mypy src` pass (strict=false, warn_return_any=true, disallow_untyped_defs=true)。strict 化は Phase 1 以降の follow-up
- `node scripts/py/tools/regen_en_source_patches.mjs --check` pass (mjs ↔ JSON drift なし)
- `npm run build` pass (Astro 290 pages)
- `npm run test` pass (mjs 2040/2041、1 skip、0 fail)
- `npm run lint` pass (0 errors)
- CI `python-test` job が PR で緑 (node + setup-python + uv + patch drift check + ruff + format + mypy + pytest)

11 leaf 全て conformance test で byte-level 一致確認済。

### en_source_patches の dual-source-of-truth 運用

`scripts/lib/en_source_patches.mjs` が patch の **唯一の定義ソース**。Python 側は
`scripts/py/src/testim_parity/_en_source_patches_data.json` 経由で同じデータを
読むため、mjs を編集した PR では必ず JSON を再生成する:

```bash
npm run regen:py-patches    # JSON を再生成して git に commit
npm run check:py-patches    # drift 検出のみ (CI が自動実行)
```

CI の `python-test` job の一番最初で `check:py-patches` が走るため、再生成を忘れて
push すると CI が失敗する。さらに `test_registry_full_dump_matches_mjs` conformance
テストが mjs の literal と Python が読んだ JSON を byte 比較し、
`test_every_patch_replays_identically` が 34 patch 全てについて
`find → replace` を両 runtime で照合することで、silent drift を 3 重に防ぐ。

### Phase 0 キャリーフォワードノート

PR #370 review サイクルで意図的に残した設計メモ (後続 Phase で再検討する項目)。

- **glossary term ごとの `re.compile()` コスト許容** — `scripts/py/src/testim_parity/glossary_mask.py:175` は term ごとに `re.compile()` を毎回生成する。mjs 側 (`parity_glossary_mask.mjs:126`) も `new RegExp()` を毎回組むため、**behavioral conformance 上は正しい**。最適化 (一括 alternation `\b(term1|term2|...)\b` / pre-compile キャッシュ) は mjs 側の仕様変更とセットで行う。単独 Python 最適化は禁止 — byte-level parity を崩す
- **GitHub Actions SHA pin の定期検証** — `.github/workflows/ci.yml` の `actions/checkout@<SHA>` 等は `# v4` コメント付きで pinned。SHA と tag の対応は以下で確認 (少なくとも年次 + security advisory 追従時)

  ```bash
  gh api repos/actions/checkout/git/refs/tags/v4 --jq '.object.sha'
  ```

  SHA を bump する PR では CI を一度緑確認してから merge。Dependabot の `github-actions` ecosystem を有効化すると自動 PR が出る (未設定)
- **`__init__.py` flat re-export 不採用** — `scripts/py/src/testim_parity/__init__.py` は re-export を行わず、各モジュールの `__all__` が surface を宣言する契約。Phase 1-4 で leaf が 50+ 追加されても dual maintenance が発生しない。conformance harness (`harness.mjs:115` 付近) の DISPATCH と module-level `__all__` を 1:1 で維持する

---

## Phase 1: EN Segment Extractor (BS4 化)

**Goal**: カスタム HTML tokenizer → `BeautifulSoup(html, 'lxml')`

### 1.0: Runtime 間 IPC / artifact contract の決定 ✅ 完了

Phase 1 以降は Python 側に新機能を置く一方で pipeline は当分 mjs に残るため、runtime 間でどう segments を受け渡すか事前に決める必要がある (Phase 0 reviewer gate 指摘)。

**選択肢**:

1. **Library-only**: Phase 1–3 の Python modules は standalone library として提供し、pipeline wiring は Phase 4 まで遅延。mjs 側は当分 mjs `segments_en` を使い続ける。Python 側は conformance test で byte 一致を保証するだけ。
2. **JSON bridge**: `segments.v1.json` schema (Pydantic → JSON Schema 生成) を定義し、両 runtime がそれを read/write。mjs 側は既存の in-memory object からこの JSON へ serialize する wrapper を追加。

**決定: Library-only を採用 (2026-04-21)**。Phase 1 開始時に以下の理由で確定:

- 変更面積最小 — mjs 側に変更ゼロで Python 実装を並行できる
- conformance harness (Phase 0 で導入済み) が byte 一致を直接保証するため、JSON schema を挟まなくても drift 検出可能
- `scripts/detection/check_source_parity.mjs` は mjs `source_parity_segments_en.mjs` を呼び続ける。Python 側 `segments_en.py` は standalone library として存在し、pipeline からは呼ばれない
- Phase 4 で detection CLI を Python に切り替える時に pipeline wiring を行う。その時点で必要なら JSON bridge を追加する (cutover の一部として)

**Phase 1 着手時の先行チェック ✅ 実施済**:

- `types-beautifulsoup4` (4.12.0.20250516) / `types-html5lib` (1.1.11.20260408) / `lxml-stubs` (0.5.1) を PyPI で確認し、全て存在。`scripts/py/pyproject.toml` の `dev` extras へ追加済
- `[[tool.mypy.overrides]]` から `html5lib` を除外 (スタブ導入により strict 維持可能)。first-party typo 検出力を落とさない
- scaffolding commit で `scripts/py/src/testim_parity/preprocess_en.py` + `segments_en.py` に最小 `from bs4 import BeautifulSoup` を配置し、`mypy src` が 0 error を出すことを確認 (15 source files clean)

**Phase 1.0 verification gate ✅ 全通過**:

- `uv run pytest` pass — **294 tests, 95.67% coverage** (scaffold に 4 unit tests 追加)
- `uv run ruff check src tests` / `format --check` / `uv run mypy src` — 全 clean
- `npm run build` — 290 pages OK
- `preprocess_en.py` は `BeautifulSoup(html, "lxml")` を返すだけの scaffold、`segments_en.py` は空 list を返す scaffold として Phase 1.1 / 1.2 の実装を待つ

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

### Phase 1 verification gate ✅ 全通過

- 全 288 snapshot ページで segments_en 出力を mjs と **byte-identical** 比較
  (segmentKind / sectionPath / segmentIndex / textNorm / tokensInvariant /
  sourceFingerprint すべて一致)
- mjs 側は harness batch dispatch で 1 回の node プロセスにまとめる
  (per-page spawn だと CI コストが 288 倍になるため強制)
- 一致しないページを ``_ALLOWLIST`` で管理。entry は ``AllowEntry(reason,
  expires_at_phase, linked_issue)`` shape で追加し、対応 Phase 完了時に
  retire する (architect review H3)。**現状 allowlist は空**

### Phase 1 post-review 対応 (2026-04-21)

4 specialist reviewer gate (python-reviewer / typescript-reviewer / architect /
codex) の指摘事項を反映した主要変更:

- **html5lib fallback 実装** (architect H1) — lxml が segment 0 件を返した
  HTML が ``_HTML5LIB_FALLBACK_MIN_LEN`` 以上の場合、html5lib で再パース。
  現行 288-page corpus では発動しない defensive net だが、将来 malformed
  EN snapshot が来たときの safety net として事前配線
- **``callout_allow_slugs`` default を mjs と揃える** (architect H4) —
  Python 側も ``None`` = no normalization。production caller は
  ``CALLOUT_NORMALIZATION_SLUGS`` を明示的に渡す契約
- **``<table><tr>`` (tbody なし) conformance sample** (architect H2) — lxml
  の暗黙 ``<tbody>`` 挿入と mjs custom tokenizer の挙動差を guard
- **allowlist lifecycle 明文化** (architect H3) — ``AllowEntry`` dataclass で
  reason / expires_at_phase / linked_issue を必須化。288-matrix 自体は Phase 5
  aggregate gate 移行時に retire する契約
- **BS4 entity double-decode 修正** (Phase 1.3 で発覚) — lxml auto-decode と
  mjs 1-pass decode の等価性を docstring に明記
- **``_has_class`` pattern cache** (python-reviewer MEDIUM) — module-level
  dict で ``re.compile`` を amortize
- **``Comment`` import を module top へ** (python-reviewer MEDIUM)
- **``root: Tag | BeautifulSoup`` 型 union** (python-reviewer MEDIUM)

### 既知の follow-up (Phase 2 着手前に検討)

- type-stub version drift の CI 監視 (monthly ``gh api`` + ``uv lock --upgrade``
  時の 288-matrix re-run) — 現状手動運用で pin `~=`
- ``_WHITESPACE_RUN_RE`` / ``_iter_element_children`` 等の shared helper を
  Phase 2 JA extractor と合流させる時に抽出
- ``_is_warning_like_blockquote`` の 3 条件判定を BS4 DOM 版に置き換えるか
  継続 regex で回すかの最終判断 (現状 mjs と byte 一致のため regex 維持)

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
| --- | --- |
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

### Phase 2 verification gate ✅ 全通過

- `uv run pytest` pass — **368 tests, 94.96% coverage** (unit 26 + conformance 3 を追加)
- `uv run ruff check src tests` / `format --check` / `uv run mypy src` — 全 clean
- `npm run test` pass (mjs 2040/2041、1 skip、0 fail — Phase 1 と同じ)
- `npm run build` — 290 pages OK
- JA 288 ページ corpus 実測:
  - **byte-identical with mjs: 142 pages** (49%、nest-free 領域)
  - **Python が nested list を flatten する divergent: 146 pages**
  - total segments: py=11810 vs mjs=12671 → **861 segment が flatten で除去** (Issue #368 対象)
  - **regression (py > mjs) pages: 0** — conformance test の ``test_ja_corpus_zero_regressions`` で hard guard
- Callout 境界テスト: `:::note{title="X"} ... :::` を ``callout-body`` として emit する unit test 済 (`TestCallout::test_callout_with_title_attr`)
- Boundary stability >= 0.95 の measurement は Phase 3 alignment port 後に実施 (Phase 2 単独では alignment scoring 未接続のため)

### Phase 2 実装メモ (2026-04-21)

- **HYBRID の粒度**: mjs line-based state machine を Python に verbatim port
  し、**list region のみ** markdown-it-py に委譲する構成を採用。plan 当初案の
  「全面 AST 駆動」よりも byte-identical 領域を最大化 (142/288)、regression
  リスクを最小化した
- **list region 収集**: ``_collect_list_region`` が連続する list 行 / 先頭
  whitespace 行 / blank + continuation を 1 region に纏め、``_flatten_list_region``
  が ``MarkdownIt("commonmark").parse(region)`` で AST を取得、top-level
  ``list_item_open``/``list_item_close`` 間だけ emit する (nested は parent
  の textNorm に ``inline.content`` を space 区切りで混ぜ込む)
- **loose list 対応**: ``1. item\n\n   continuation paragraph\n\n2. next`` のような
  blank 行 + indent 3 の continuation も CommonMark 意味論で single item に
  merge される。mjs line-based 実装は continuation を別 segment として emit
  するため、意図的 divergent の主要パターンの一つ
- **code fence inside list**: list region terminator に ``_FENCE_RE`` が含まれ
  るため、list の途中に ``\`\`\`js`` が来ると region を閉じる。これにより top-
  level の code fence handler が発火して code-block segment を emit する
  (意図的 — CommonMark の tight-list 挙動と一致)
- **loose ``<summary>`` delegation**: ``<details>`` 外の ``<summary>`` は EN walker
  (``extract_segments_from_html``) に内部 HTML を渡して element children を
  proper kind に分類してから JA emitter で再 emit する。Phase 1 で port 済の
  ``segments_en`` を library として利用する最初の cross-module 契約

### 146 divergent page の pattern 分布 (architect review L2)

Python が mjs より少ない segment を emit する 146 ページは、以下 3 パターンの
いずれか (または複数) が該当する。Phase 3 reviewer が「想定内 flatten」と
「新規 regression」を一目で区別できるよう具体例を載せる:

| Pattern | 対象ページ例 | 説明 |
| --- | --- | --- |
| **nested unordered list** | `administration/project-user-management.md`, `settings/cli-settings.md` | `- outer\n  - inner` 形式。nested items の text が親 item に merge |
| **loose list (indented continuation)** | `administration/encrypted-credentials.md` | `1. step\n\n   continuation paragraph\n\n2. next` 形式。blank 行 + indent の continuation が親 item に吸収 |
| **indented markdown table inside list** | 一部 API docs | list item 直下の `| a | b |` 行は CommonMark が list content として吸収し、mjs の per-row ``table-cell`` emit は発動しない |

Python extractor は 3 パターンとも CommonMark semantics に沿って正しく処理する。
mjs line-based 挙動は歴史的な line-regex 起因の bug であり、これらの flatten が
Issue #368 の core fix。

### 既知の follow-up (Phase 3 着手前に検討)

- **Boundary stability >= 0.95 の実測**: alignment scoring を Phase 3 で port
  した後、288-page corpus で stability を測定。Phase 2 成果が alignment 層で
  想定通り parity issue を減らすかの final verification
- **EN walker との flatten 文字列 separator 統一** (architect H2): Python JA の
  nested flatten は ``' '.join(inline.content)`` で space separator、EN walker
  は BS4 text traversal の結果そのままで separator を自動挿入しないケースあり。
  alignment scoring は weighted-LCS で space 差を吸収するため現状 blocking では
  ないが、Phase 3 で issue 数を見て separator を揃えるか判断する。Phase 3 着手
  時に diagnostic を 1 pass 流して 146 divergent page の textNorm delta を計測し、
  5% を超えるなら ``segments_shared.create_segment`` の whitespace collapse で
  両 runtime を揃える
- **multi-line summary ``lines[i]`` 再処理 pattern の refactor** (python-reviewer
  MED #1): 現行 ``lines[i] = remainder`` の in-place mutation は immutability
  convention 違反。``pending: str | None`` slot で explicit に書き直す。挙動
  変更なしの cleanup なので Phase 4 cutover 前までに対応

---

## Phase 3: Alignment, Structure, Baseline, Supporting Modules

**Goal**: parity system コア + 全 supporting modules を port

### Port 対象 (16 modules, ~5,500 LOC)

| mjs source | Python target | LOC |
| --- | --- | --- |
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

### Phase 3 verification gate

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

### Phase 4 verification gate

- 各 CLI が同一の JSON artifacts を生成
- 5-counter = 0

---

## Phase 5: Tests (pytest 全書き直し)

**Goal**: 57 test files → pytest

### 3-tier テスト戦略 (レビュー指摘を反映)

**Golden-master の矛盾を解消**: Python は Issue #368 の 128 ページで意図的に異なる (正しい) 出力を生成する。per-page segment 比較ではなく aggregate gate で検証。

| Tier | 目的 | 手法 |
| --- | --- | --- |
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
| --- | --- |
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
| **JS/Python 数値 semantics 差異** | **Phase 0 で発生した `Math.round` (half away from zero) vs Python `round` (banker's rounding) の非対称が LCS tie-break を反転させた事例あり**。対策: (1) `_js_round` helper を置き Python 側で明示的に half-away-from-zero を再現、(2) conformance harness (`scripts/py/conformance/harness.mjs`) で mjs 出力と byte 一致を強制、(3) 新しい数値演算を port する時は必ず境界値 (`.5` / `0.5` / `2.5`) を含む sample を `test_*_parity.py` に追加する |
| Runtime 間 contract 欠落 | Phase 1 冒頭で Library-only vs JSON bridge の方針を決定 (Phase 1.0 節)。その合意なしに Python 側 pipeline wiring を進めない |
| 構造契約 dep の silent breakage | `beautifulsoup4` / `lxml` / `markdown-it-py` は `pyproject.toml` で `~=` compatible-release 上限を指定。`uv lock --upgrade` を踏む PR では 288-page conformance matrix の re-run を必須化 |
| Phase 0 完了条件の曖昧さ | Phase 0 gate を「全 11 leaves ported + conformance harness green + CI Python job passing」に固定。partial (current 3 leaves) は **Phase 0a** と明記し、残 8 leaves 完了を Phase 0b として tracking |

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
| --- | --- | --- |
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
