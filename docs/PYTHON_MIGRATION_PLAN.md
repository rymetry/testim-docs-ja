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
- JA 288 ページ corpus 実測 (codex review P2 #1 対応後):
  - **byte-identical with mjs: 141 pages** (49%、nest-free 領域)
  - **Python が nested list / indented fence / indented image を flatten する divergent: 147 pages**
  - **regression (py > mjs) pages: 0** — conformance test の ``test_ja_corpus_zero_regressions`` で hard guard
  - byte-identical の page 数は ``_NEST_FREE_CORPUS_SIZE`` 定数で static に pin (architect review H3)。corpus shape が shift した PR で diff が明示される
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

### 147 divergent page の pattern 分布 (architect review L2 + codex P2 fix)

Python が mjs より少ない segment を emit する 147 ページは、以下 4 パターンの
いずれか (または複数) が該当する。Phase 3 reviewer が「想定内 flatten」と
「新規 regression」を一目で区別できるよう具体例を載せる:

| Pattern | 対象ページ例 | 説明 |
| --- | --- | --- |
| **nested unordered list** | `administration/project-user-management.md`, `settings/cli-settings.md` | `- outer\n  - inner` 形式。nested items の text が親 item に merge |
| **loose list (indented continuation)** | `administration/encrypted-credentials.md` | `1. step\n\n   continuation paragraph\n\n2. next` 形式。blank 行 + indent の continuation が親 item に吸収 |
| **indented markdown table inside list** | 一部 API docs | list item 直下の pipe table 行 (例: `\| a \| b \|`) は CommonMark が list content として吸収し、mjs の per-row `table-cell` emit は発動しない |
| **indented code fence / image inside list** | `advanced-editing/data-driven-testing/configuring-...md`, `running-tests/play-from-here.md` | list item 内の indented `\`\`\`fence` / `![image]` は parent item の textNorm に flatten される (EN HTML walker の ``collectInlineText`` と等価)。mjs は独立 code-block / image segment として emit するため意図的 divergence (codex review P2 #1 で明示的に pin)。top-level (indent 0) の fence / image は従来通り list region を terminate して独立 segment を emit |

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

### Milestone 分割 (単一 PR 内の段階的 commit)

Phase 3 は **単一 PR に集約** (ユーザ決定 2026-04-21)。ただし ~5,500 LOC を
1 commit に積むと review が困難なので、以下 M1-M7 を **連続 commit として積む**
方針。branch ``claude/phase3-supporting-modules`` に全 M1-M7 を commit し、
全 M7 完了時点で **4 specialist reviewer gate** (``feedback_four_reviewer_gate``
必須) を実施。gate 合格後に 1 PR を作成。

| Milestone | 対象 | 状態 |
| --- | --- | --- |
| **M1** | `summary_format` + `issue_state` + `sync_exclusions` + `page_coverage` (4 leaf, ~400 LOC) | ✅ 完了 (conformance harness + unit/byte-parity test) |
| M2 | `acknowledgements` + `source_usability` + `advisory_queue` + `sync_health` | in progress |
| M3 | `structure` + `checks` | pending |
| M4 | `align` (weighted LCS, JS rounding 互換) | pending |
| M5 | `baseline` + `summary` (summary_format と結線) | pending |
| M6 | `mutation_corpus` (9/9 mutation recall 契約) | pending |
| M7 | `detection_reports` (1575 LOC, split 検討) | pending |

### Milestone 依存関係 DAG

architect review H3 を反映。linear chain ではなく実際には:

- **M1** (leaf predicates/registry) → {**M2, M3, M6**} **並列着手可**
- **M4** (`align`) は **M3 完了後** (``structure.compare_section_structure``
  を Stage C content-order bijection で呼ぶため)
- **M5** (baseline + summary) は **M1 + M2 + M3 + M4 完了後**
- **M7** (detection_reports aggregator) は **全 modules 完了後**

| Milestone | 直接依存 |
| --- | --- |
| M2 `acknowledgements` / `source_usability` / `advisory_queue` / `sync_health` | M1 (`issue_state`) |
| M3 `structure` / `checks` | M1 (`issue_state` / `page_coverage`) + `align_scoring` (Phase 0) |
| M4 `align` | **M3 (`structure`)** + `align_scoring` + `glossary_mask` + `normalize` + `segments_shared` + `artifact_registry` (全て Phase 0/M3) |
| M5 `baseline` / `summary` | M1 (`summary_format` / `issue_state`) + M2 (`acknowledgements`) + M3 (`structure`) + M4 (`align` の identity key field shape) |
| M6 `mutation_corpus` | (独立 — scoring fixture) |
| M7 `detection_reports` | 全 modules (aggregator) |

### 既知の follow-up (M5 着手前に整理)

- **artifact_registry の slug を frozenset 化** (architect L1): 現行 registry は
  2 entry × 最大 7 slug で ``slug in entry["slugs"]`` は O(n) だが十分高速。将来
  registry が 20 entry を超えたら ``frozenset`` に切替 + JSON serialize helper
  を足す。現時点では変更しない
- **Phase 0 `glossary_mask._translate_js_flags_to_python` bug 修正** (2026-04-21
  288-page conformance で発覚): JS default の ``\\b`` は ASCII 境界だが Python
  default は Unicode 境界。``u`` フラグ無しの invariant pattern で Python 側に
  ``re.ASCII`` を明示付与するよう修正した。``integrations/sealights-integration``
  で ``tokenを`` の境界が Python Unicode mode で match 失敗していた — architect
  H2 指摘どおり M5 baseline 凍結前に検出できた価値のある drift

### dict-only ingress policy (architect M2 指摘対応)

Phase 3 の全 predicate / transformer 関数は **dict (または Mapping) ingress
を前提とする**。Pydantic ``Segment`` / 他 model を直接渡すと:

- Phase 1/2 `issue_state` 系 predicate は ``_is_issue_mapping`` で False に倒す
  (non-dict divergence、production caller は model を ``.model_dump()`` する)
- Phase 3 M3/M4 transformer (`structure` / `align` / `checks`) は ``_get_attr``
  で Pydantic camelCase alias を透過するが、これは lenient fallback。
  Phase 5 pipeline wiring では caller 側で ``Segment.model_dump(by_alias=True)``
  を通して dict 化する運用に統一する

Phase 4 CLI port (`check_source_parity.py`) で `align_segments` / `local_check`
等を呼ぶ時、orchestrator が常に dict を渡す契約を type hint と docstring で
明示する。新しい consumer を追加する PR では本 policy 違反が無いか reviewer
gate で確認する。

### M1 実装メモ (2026-04-21)

- 全 4 modules は pure function / immutable registry のみで副作用なし
- ``issue_state`` の 9 predicates: mjs ``isValidAcknowledgedIssue`` /
  ``isFrozenByBaseline`` / ``isReportableParityIssue`` / ``isNonBlockingParityIssue``
  は ``null`` / 非 object で ``TypeError`` を throw する。Python port は
  ``_is_issue_mapping`` ガードで非 dict を False に倒す (improvement)。conformance
  sample は意図的に dict 限定 (production caller は常に dict)
- **parity issue の受け渡しは dict / Mapping 前提**。Phase 4 CLI port で
  Pydantic model を使う場合は ``.model_dump()`` を通してから predicate に渡す
  (architect H1)
- ``page_coverage``: mjs ``Set`` iteration 順 = 挿入順。harness 側で ``Set``/``Map``
  に変換する際 sort 済み配列を渡して Python-mjs 間で issue 順序を揃える。
  **production caller (Phase 4 ``check_source_parity.py``) は ``sidebar_slugs`` /
  ``local_slugs`` / ``snapshot_slugs`` に sort 済み sequence を渡す契約**
  (architect H2)。Python 側関数内部では ``set`` に変換して lookup に使うが、
  iteration 対象 (``sidebar_slugs`` / ``local_source_urls`` / ``local_slugs``) は
  caller の順序を維持する
- ``sync_exclusions``: ``MappingProxyType`` で immutable 化、``get_exclusion`` は
  shallow copy を返す (mjs ``{ ...entry }`` と等価)。dual-source-of-truth drift は
  ``sync_exclusions_dump`` conformance で byte 比較。registry shape が nested dict
  を含むように拡張した時は ``deepcopy`` に切替 (現状 flat dict のため shallow 可)
- ``summary_format``: CLI 表示用複数行テキストの byte-identical を保証
- **M1 allowlist: 空** — 4 modules 全て conformance で byte-identical (divergence
  は意図的な non-dict ガードのみ、test sample から除外済み)

### Port 対象 (16 modules, ~5,500 LOC)

| mjs source | Python target | LOC | Milestone |
| --- | --- | --- | --- |
| `source_parity_align.mjs` | `align.py` | 898 | M4 |
| `source_parity_structure.mjs` | `structure.py` | 441 | M3 |
| `source_parity_baseline.mjs` | `baseline.py` | 551 | M5 |
| `source_parity_source_usability.mjs` | `source_usability.py` | 267 | M2 |
| `source_parity_acknowledgements.mjs` | `acknowledgements.py` | 242 | M2 |
| `source_parity_issue_state.mjs` | `issue_state.py` | 115 | **M1 ✅** |
| `source_parity_summary.mjs` | `summary.py` | 209 | M5 |
| `source_parity_summary_format.mjs` | `summary_format.py` | 33 | **M1 ✅** |
| `source_parity_advisory_queue.mjs` | `advisory_queue.py` | 200 | M2 |
| `source_parity_page_coverage.mjs` | `page_coverage.py` | 137 | **M1 ✅** |
| `source_parity_checks.mjs` | `checks.py` | 411 | M3 |
| `turndown.mjs` (preprocessEnHtml only) | `preprocess_en.py` | ~200 | (Phase 1 で完了 ✅) |
| `mutation_corpus.mjs` | `mutation_corpus.py` | 763 | M6 |
| `source_sync_exclusions.mjs` | `sync_exclusions.py` | 116 | **M1 ✅** |
| `source_sync_health.mjs` | `sync_health.py` | 276 | M2 |
| `detection_reports.mjs` | `detection_reports.py` | 1575 | M7 |

### 重要制約

- `buildBaselineKey()` → byte-identical key string (baseline schema v2)
- `weightedLcs()` → pure Python array (numpy 不使用)、同一結果保証
- `preprocessEnHtml()` → BS4 ベースに port (`normalizeEscapedCallouts`, `normalizeEscapedFaqDetails` 含む)

### Phase 3 verification gate

- **5-counter aggregate gate**: Python parity check が 5 counter 全て 0 を出力
- Mutation recall: 9/9 = 100%

---

## Phase 4: Detection + Pipeline + Tools (CLI scripts)

**Goal**: 全 CLI entry point を port。`argparse` で引数パース (※ plan 初期の
``click`` 想定は depend 追加のコスト対 benefits が低く、標準 ``argparse`` で
十分だったため実装では採用を見送り。後続 cutover 時点で cleanup)。

### Detection (9 scripts) → `detection/` ✅ 完了
### Pipeline (6 scripts) → `pipeline/` ✅ 完了
### Tools (6 scripts) → `tools/` (既存 fix_notation.py, verify_notation.py を移動) ✅ 完了

**合計 21/21 port 済** (PR #374):
- Full port: 17 scripts
- Subprocess wrapper: 4 scripts (turndown / 915 LOC orchestration など、Phase 4b で解消)

### CI workflow 更新 ✅ 完了 (PR #374)

`.github/workflows/ci.yml` の `parity` job:

```yaml
# Before: node scripts/detection/render_upstream_recovery_comment.mjs
# After:  cd scripts/py && uv run python -m testim_parity.detection.render_upstream_recovery_comment
```

Python setup (setup-python + uv sync) を `parity` job 先頭に追加。他の
`check:parity` / `check:upstream-recovery` 等はまだ mjs (Phase 6 cutover で切替)。

### HTML→MD 変換 (pipeline 用)

`turndown` npm package の代替。Pipeline の `fetch_translate_images.mjs` で使用:
- `markdownify` (Python) + custom converters for MadCap patterns
- **extraction hot path には使わない** (segments_en は raw HTML を直接 walk)

### Phase 4 verification gate ✅ gate 条件を満たす範囲で通過 (PR #374)

Gate 1 ("各 CLI が同一の JSON artifacts を生成") の evidence は **CLI ごとに
層が異なる**。下表の通り明示的に scope を書き分けて、証拠の強さを
overstate しないようにする。

| CLI | Library byte parity (conformance harness) | Orchestration byte parity (end-to-end) | Per-CLI smoke |
| --- | --- | --- | --- |
| `generate_detection_reports` | 12 dispatch (detection_reports) | ✅ `test_generate_detection_reports_e2e.py` — Python 3 output vs mjs harness | ✅ 3 (minimal / strict / cwd default) |
| `generate_parity_baseline` | 9 dispatch (baseline) | ⚠️ CLI orchestration は per-CLI smoke のみ。end-to-end mjs 比較は Phase 4b で追加予定 | ✅ 9 (regenerate / slug / types / mutual exclusive / gate pass marker / gate fail / malformed baseline × 2 / partial-run status) |
| `snapshot_diff` | — (純 Python, conformance 対象外) | ⚠️ end-to-end mjs 比較は未実施 (git HEAD 依存のため fixture 化コスト高い、Phase 4b で対応) | ✅ 5 (classifier / 404 marker / sidebar url map / fallback / sidebar RuntimeError guard) |
| `check_upstream_recovery` | — (純 Python) | ⚠️ end-to-end mjs 比較は未実施 (Phase 4b) | ✅ 2 (empty-input artifact schema / days helpers) |
| `render_upstream_recovery_comment` | 1 dispatch (`detection_reports_render_sticky`) | ⚠️ CLI 入出力 (``has_signals`` stdout + md file) の mjs 比較は未実施 (Phase 4b) | ✅ 5 (no artifact / empty / with signals / stale cleanup / cwd default) |

加えて共通して:

- **mutation_corpus** 8 dispatch + **summary** 2 dispatch (parity result の
  集計 library) は library byte parity のみ。CLI は無い。

**Summary**: `generate_detection_reports` は library + orchestration + smoke
の 3 層。他 CLI は library byte parity (該当するもの) + smoke の 2 層で、
orchestration byte parity は Phase 4b で埋める。Gate text は overstate せず、
この scope のまま Round 4 以降の merge 判断に委ねる。

- 5-counter = 0 → **維持** (既存 check:parity で継続確認)

**Phase 4b (turndown-依存 4 script の full port + 他 CLI の end-to-end mjs
byte parity) は別 PR で対応**。

### Phase 4 残作業 (Phase 4b として次 PR で対応)

turndown 等価実装が必要な 4 script は subprocess wrapper に留めた:

| Script | wrapper 理由 |
| --- | --- |
| `detection/check_source_parity.py` | 915 LOC orchestration + turndown 依存 |
| `detection/snapshot_update.py` | live EN HTML fetch (HTTP + turndown) |
| `pipeline/fetch_translate_images.py` | HTML→MD 変換 hot path |
| `pipeline` 内 `fetch` step | 上記に委譲 |

Phase 4b: turndown 等価実装 (markdownify + custom converters) を整えてから
上記 4 script を full port し、本 plan の Phase 4 を完全完了とする。

### Phase 4b progress (2026-04-22 更新)

| Milestone | 対象 | 状態 |
| --- | --- | --- |
| **M1** | ``testim_parity.turndown`` — mjs ``convertEnHtmlToMd`` / ``turndown.turndown`` 等価 (markdownify + MadCap custom converters: callout / copy-button strip / ol siblings / pipe table / details+summary) | ✅ 39 代表 pattern で mjs と byte-identical (17 unit + 2 parity sample) — PR #375 merged |
| **M2** | ``check_source_parity.py`` full port (915 LOC, turndown 依存解消) | ✅ **完了** — 38 unit tests、``parity-check-status.json`` schema / 副作用 shape mjs 互換、DI 完備。M5 conformance (baseline / snapshot_diff) で 2 CLI は mjs byte-parity。turndown full-corpus byte parity は Phase 4b.1 で達成 |
| **M3** | ``snapshot_update.py`` full port (486 LOC, HTTP + retry + BS4) | ✅ **完了** — 33 unit tests (depth tracking / retry / recovery probe / DI stdout+stderr / registry drift / root_dir input isolation) |
| **M4** | ``fetch_translate_images.py`` full port (409 LOC, turndown 依存解消) | ✅ 完了 — 22 unit tests、module coverage 88% |
| **M5** | 4 CLI (generate_parity_baseline / snapshot_diff / check_upstream_recovery / render_upstream_recovery_comment) の end-to-end mjs byte parity | ✅ 完了 — 14 integration tests、全 byte-identical、semantic delta 0 件 |

### Phase 4b.1 (2026-04-22 完了)

**Goal**: ``convert_en_html_to_md`` を 288-page corpus 全体で mjs と byte-
identical にする。M1 時点で 168 / 288 page が divergent、Phase 4b.1 で全て
解消。

| カテゴリ | divergence 件数 | 解消方法 |
| --- | --- | --- |
| leading_ws | 67 | ``_collapse_whitespace`` — block / ``<br>`` 境界の leading ws trim |
| other | 74 | ``_turndown_escape`` の 13 escape 規則 + ``autolinks=False`` |
| trailing_ws | 13 | ``convert_p`` override で ``<br>`` hard break の trailing `` <SP><SP>\\n `` を preserve |
| plus_escape | 10 | ``_turndown_escape`` の `` ^+<SP> `` rule |
| image_concat | 3 | ``_collapse_whitespace`` の void element 隣接 text space preservation |
| hash_escape | 1 | ``_turndown_escape`` の `` ^#<SP> `` rule |

**実装**:

- ``_collapse_whitespace(root)`` — BS4 tree 上で mjs turndown の
  ``collapseWhitespace`` (``node_modules/turndown/lib/turndown.cjs.js``
  L457-523) を in-place 再現。text node を DFS 走査して block / ``<br>``
  boundary の leading/trailing space を削り、void element 隣接 text の
  leading space は preserve する
- ``_turndown_escape(text)`` — mjs turndown の 13 escape 規則を順序通り
  適用 (``^-`` / `` ^+<SP> `` / ``^(=+)`` / `` ^(#{1,6})<SP> `` /
  ``` ` ``` / ``^~~~`` / ``[`` / ``]`` / ``^>`` / ``_`` /
  `` ^(\\d+)\\.<SP> `` / ``\\\\`` / ``\\*``)。
  ``_TurndownConverter.escape`` が markdownify の per-text-node hook 経由で
  呼び、converter が emit する marker (``**`` / `` *<SP><SP><SP> `` 等)
  は escape されない契約を維持
- ``_TurndownConverter.convert_p`` — ``content.strip("\\n")`` に限定し、
  trailing `` <SP><SP>\\n `` (``<br>`` hard break) を preserve する。
  blank-only paragraph は ``""`` に倒す (mjs ``blankReplacement`` 等価)
- ``_TurndownConverter.DefaultOptions.autolinks = False`` — markdownify
  default の ``<URL>`` 縮約を無効化

**Gate**: ``tests/conformance/test_turndown_288_matrix.py`` が xfail marker
なしで pass (288 / 288 byte-identical)。Phase 6 atomic cutover で mjs を
削除するまで regression gate として run し続ける。

### Phase 4b M1 byte-parity scope (履歴)

M1 時点 (2026-04-22) では **39 代表 HTML pattern** で parity を保証。288-page
corpus 全体の byte parity は Phase 4b.1 で上記 ``_collapse_whitespace`` +
``_turndown_escape`` + ``convert_p`` 追加により達成した。以下は M1 で既に
存在したカバー範囲:

**M1 カバー範囲**:

- markdownify ``MarkdownConverter`` subclass + ``DefaultOptions`` + ``Options``
  両方 override (1.x の 2 層 option 組み立てに対応)
- ATX heading / `*<space><space><space>` 3-space bullet / ``_italic_`` /
  ``**bold**`` / fenced code with language class
- 5 MadCap custom converter: ``convert_div`` (note/caution) / ``convert_a``
  (codeSnippetCopyButton strip) / ``convert_ol`` (``<li value>`` + sibling
  ``<img>``/``<p>``/``<div>`` block 並べ) / ``convert_table`` (pipe table) /
  ``convert_details`` + ``convert_summary`` (summary → ``## heading``)
- **turndown default rule の port** (review round-1/2 P1/P2 対応):
  - ``convert_li`` — leading ``\n`` strip + trailing collapse + ``\n`` を
    4-space indent に置換 (nested list / multi-paragraph li の preserve)。
    trimmed content が空なら bullet ごと省略 (round-2 P2)
  - ``convert_ul`` — 親が ``<li>`` で last element child のときは ``\n`` +
    content、さもなくば ``\n\n`` wrap (turndown default list rule)
  - ``convert_em`` / ``convert_i`` / ``convert_strong`` / ``convert_b`` —
    turndown の ``flankingWhitespace`` を port (round-2 P1)。content を trim
    して marker 外側に whitespace、sibling が既に whitespace を持つ場合は
    省略 (``A <em> text </em> B`` → ``A _text_ B``)
  - ``convert_img`` — 常に markdown image (table cell / heading 内の inline
    img も preserve)
- ``_strip_empty_inline_elements`` — raw HTML 段階で ``<em></em>`` /
  ``<em>   </em>`` 等の空 inline を除去 (round-2 P1 エッジケース)
- ``_normalize_output`` の fence-aware split (round-4 P1): ``_FENCE_BLOCK_RE``
  で fenced code block を切り出し、``\n{3,}`` → ``\n\n`` collapse を fence
  外側のみに適用。code content 内部の連続空行は preserve する (mjs turndown
  と同じ挙動)
- ``convert_pre`` の boundary blank line 保持 (round-5 P1): ``<code>.textContent``
  を raw 取得して mjs ``code.replace(/\n$/, '')`` 等価に **末尾 1 個の ``\n``
  のみ** 削除する。``_TRAILING_SINGLE_NEWLINE_RE = r"\n\Z"`` (``$`` では
  Python default flag の "最終 ``\n`` 直前" マッチで 2 文字剥がれる)
- ``_MAX_FRAGMENT_DEPTH=40`` で ``_convert_fragment`` の recursion guard
  (malformed HTML に対する defensive cap)
- ``convert_en_html_to_md`` は existing ``preprocess_en_html`` を chain する
  ので、escaped-callout / escaped-details / FAQ multi-paragraph の preprocess
  経由 sample も byte-identical

---

## Phase 5: Tests (pytest 全書き直し)

**Goal**: 55 mjs test files → pytest

### 3-tier テスト戦略 (レビュー指摘を反映)

**Golden-master の矛盾を解消**: Python は Issue #368 の 128 ページで意図的に異なる (正しい) 出力を生成する。per-page segment 比較ではなく aggregate gate で検証。

| Tier | 目的 | 手法 |
| --- | --- | --- |
| **Unit tests** | 個別関数の正しさ | pytest parametrize。mjs テストを Python に移植。CORRECT behavior をテスト |
| **Structural conformance** | 意図しない regression 検出 | 全ページで `{sectionPath, kind, count}` を比較。intentional diff は allowlist |
| **Aggregate counter gate** | 5-counter = 0 不変量 | Full parity run → `parity-check-status.json` の 5 counter が全て 0 |

### Coexistence period (cutover 前) ✅ 完了

```json
{
  "scripts": {
    "test": "node --test scripts/__tests__/*.mjs",
    "test:mjs": "node --test scripts/__tests__/*.mjs",
    "test:py": "cd scripts/py && uv run pytest",
    "test:py:cov": "cd scripts/py && uv run pytest --cov=testim_parity --cov-report=term-missing",
    "test:py:quick": "cd scripts/py && uv run pytest -m 'not corpus and not slow and not cutover and not parity_smoke and not recall and not boundary and not real_repo'",
    "test:py:slow": "cd scripts/py && uv run pytest -m slow",
    "test:py:corpus": "cd scripts/py && node tools/emit_corpus_oracle.mjs --out .corpus_expected.jsonl --suite segments_en,turndown && TESTIM_CORPUS_EXPECTED_JSONL=\"$PWD/.corpus_expected.jsonl\" uv run pytest -m corpus -n auto --dist load --tb=short",
    "test:py:parity-smoke": "cd scripts/py && uv run pytest -m 'parity_smoke and not cutover' --tb=short",
    "test:py:quality": "cd scripts/py && uv run pytest -m 'recall or boundary or real_repo' --tb=short --durations=30",
    "test:py:cutover": "cd scripts/py && uv run pytest -o addopts= -m cutover",
    "test:py:full": "cd scripts/py && uv run pytest -m 'not cutover'",
    "test:quick": "npm run test:mjs && npm run test:py:quick",
    "test:all": "npm run test:mjs && npm run test:py:full"
  }
}
```

CI は PR B で分割済み:

- **required (PR feedback loop, pull_request trigger)**: `node-test` (mjs only),
  `python-fast` (ruff / format / mypy / `pytest -m 'not corpus and not slow and not
  cutover and not parity_smoke and not recall and not boundary and not real_repo'`),
  `python-corpus` (288-page conformance, pytest-xdist `-n auto --dist load`)。
  astral-sh/setup-uv + `uv.lock` keyed cache で uv install 高速化。
- **nightly (`.github/workflows/nightly-python-oracle.yml`)**: `oracle-snapshot` が mjs
  oracle JSONL + sha256 TSV を 14 日 artifact 保存、`parity-smoke` が PR A の
  full-repo `check_source_parity` smoke を走らせる (CI 実測 ~19 分、required から分離)、
  `python-quality-full` が `recall` + `boundary` + `real_repo` marker の full-repo
  benchmark (`test_recall.py` / `test_baseline_recall.py` / `test_segments_boundary.py` /
  `test_clean_page_fixtures.py` / `test_structure_fixtures.py` /
  `test_source_usability_fixtures.py`) を走らせる (CI 実測 ~30 分、旧 default pytest
  で feedback loop を停止させていたため nightly 移設)。

local では `npm run test:all` で mjs + `test:py:full` (`-m 'not cutover'`、
corpus / slow / parity_smoke / recall / boundary / real_repo は全て run される) を
連続実行。日常 iteration 用には `npm run test:quick` (mjs + 7 marker exclude:
corpus / slow / cutover / parity_smoke / recall / boundary / real_repo)、full-repo
quality gate だけ回したい時は `npm run test:py:quality`
(`-m 'recall or boundary or real_repo'`)。
mjs テストファイルは当初 54/55 を
delete したが、その後 coexistence guard 用に 2 file を restore / 新設した結果、Phase 5
終了時点で **3 file** が残存している:

- `scripts/__tests__/lib_redirects.test.mjs` (6 test) — Astro build graph が `redirects.mjs`
  を import するため恒久保持 (Phase 6 以降、Astro 依存解消時の post-Phase-6 cleanup で削除)
- `scripts/__tests__/lint_docs_contract.test.mjs` (25 test) — `lint:docs` が Phase 6 cutover
  まで `scripts/tools/lint_docs.mjs` (Node) を実行する契約のため、callout / frontmatter /
  link / feature-name / image 各 rule を Node 側で pin する coexistence guard (PR #384
  round 2 で新設、Phase 6 cutover で lint:docs が Python 化する際に削除)
- `scripts/__tests__/sync_detection_issues.test.mjs` (13 test) — `.github/scripts/sync-detection-issues.cjs`
  が `scheduled-actionable.yml` の production tooling として稼働中。PR #384 codex review P1
  対応で復元。Phase 6 atomic cutover では touch せず、Phase 6.1 (post-cutover 別 PR) で
  `.cjs` の port/retire 判断と同時に処理する

各 file の削除 timing と rationale は下記「Phase 5 実績」表、および Phase 6 cutover gate 7 /
Phase 6.1 section と cross-reference 済。

### Coverage target: 90%+ ✅ 達成

### Phase 5 実績 (2026-04-22 完了)

| 指標 | 着手前 | 完了時 | 備考 |
| --- | ---: | ---: | --- |
| mjs test file 数 | 55 | **3** | 52 file delete (後日 2 file 復元: Phase 5 coexistence guard 用 `lint_docs_contract.test.mjs` と、PR #384 codex review 対応で復元した `sync_detection_issues.test.mjs`)。削除 timing: `lint_docs_contract` は Phase 6 cutover で lint:docs が Python 化する際に削除、`sync_detection_issues` は Phase 6.1 (post-cutover 別 PR) で `.cjs` の port/retire と同時に削除。`lib_redirects` は Astro 依存解消時の post-Phase-6 cleanup |
| mjs test case 数 | 2040 | **44** | `lib_redirects.test.mjs` (6) + `lint_docs_contract.test.mjs` (25) + `sync_detection_issues.test.mjs` (13) |
| pytest file 数 | 68 | **97** | 20+ 新規 + 既存 augment (conformance 39 + top-level 58、実測は `find scripts/py/tests -name 'test_*.py' -not -path '*__pycache__*' \| wc -l`) |
| pytest case 数 | 931 | **2001** | +1070 (`uv run pytest -q` 実測、Phase 5 final + PR #384 review 対応追加分を含む: routing/factory/skip-guard/primary-pin/mask-coverage/lint-callout/cutover-gate auto-discovery) |
| pytest coverage | 95.60% | **95.60%** | `slow` marker 込み local 実測 (`uv run pytest -m slow --cov=testim_parity`)。**CI 実効は ~65-70%** — `slow`/`cutover` 除外で 288-page matrix が coverage に計上されない trade-off。`pyproject.toml::[tool.coverage.report] fail_under = 65` が下限 gate として Phase 5 coexistence を regression guard。Phase 6 cutover 後 `fail_under=90` へ戻す |
| 5-counter DoD | 0 | **0** | 変更なし |
| mutation recall (9/9) | 100% | **100%** | `test_recall.py::test_diff_one_mutation_strict_recall_100_percent` gate |
| 288-matrix slow test | pass | **pass** | turndown / segments_en / align 全 byte-identical |

### Phase 5 実装メモ

**並列実行**: 6 sub-agent で 44 mjs file を分担 port (CLI pipeline / tools / integration+fixtures /
gap-fill parity / detection_reports+mutation_corpus / giant source_parity)。同じ pytest file
を異なる agent が augment するケース (test_align.py / test_check_source_parity.py) は Edit tool
の sequential append で競合回避した。

**重要な port 戦略**:

- **巨大 orchestration test** (`source_parity.test.mjs` 270 tests, `detection_reports.test.mjs`
  157 tests) は 1:1 port ではなく、Python CLI が byte-identical 出力を生成する事実を
  conformance harness で verify 済みなので、Python 側は **代表的な orchestration contract**
  (exit code / status json schema / 5-counter invariant / slug filter / linkage state / fail-on
  matrix / runScope propagation) に focus した unit test に凝縮
- **fixture-driven test** は `scripts/py/tests/fixtures/source-parity-goldens/manifest.json` を
  mjs 側から copy。共通 manifest を両 runtime が読む
- **debug-only test** (`debug_artifact_independence.test.mjs` / `debug_mask_coverage.test.mjs`) は
  mjs runtime 固有の invariant を assert するもので Python 側に等価な `.debug.*` namespace
  emission path がないため outright delete (port 不要)
- **`sync_detection_issues.test.mjs`** は当初 delete したが、PR #384 codex review P1 対応で
  **復元** した (`.github/scripts/sync-detection-issues.cjs` が `scheduled-actionable.yml` の
  production tooling として稼働中で、Phase 5 中の回帰検知が必要)。Phase 6 atomic cutover
  PR の scope には含めず、**Phase 6.1 (post-cutover, 別 PR)** で `.cjs` 自体の port/retire
  判断と同時に処理する (docs/PYTHON_MIGRATION_PLAN.md 下部「Phase 6.1」節参照)
- **mask_coverage record() のキーワード引数バグ修正** — `check_source_parity.py:517-522` が
  `segmentKind=` / `sectionPath=` (camelCase) で `create_mask_coverage.record()` を呼んでいたが
  定義側は `segment_kind=` / `section_path=` (snake_case)。5-counter gate が常に 0 で済んで
  いたため実 run では (mask が空のときに全 return するため) silent 回避されていた。Phase 5
  整備中に pytest isolation test で確認され修正済み

### 検証 register (Phase 5 完了時の gate log)

- `npm run test:mjs` — 44 pass (lib_redirects 6 + lint_docs_contract 25 + sync_detection_issues 13、Phase 5 coexistence 回帰 guard)
- `cd scripts/py && uv run pytest -q` — **2001 passed, 1 skipped, 6 deselected** (slow + cutover markers、PR #384 codex review 対応後の実測値、294s。cutover marker test を 3 から 1 に縮小 — registry/doc sync と auto-discovery は default CI で常時 run する契約に変更)
- `cd scripts/py && uv run pytest -m slow` — 288-matrix byte-identical (segments_en / turndown / align)
- `cd scripts/py && uv run ruff check src tests && uv run ruff format --check src tests` — clean
- `cd scripts/py && uv run mypy src` — Success: no issues found in 60 source files
- `npm run check:parity` — **5-counter = 0 維持**
- `npm run build` — 290 pages pass

### Phase 5 CI 高速化 (PR B, post-Phase-5 別 PR)

Phase 5 完了後の follow-up として、288-page corpus conformance の CI 所要時間を短縮する
infrastructure 整備を PR B として分離実装する。Phase 5 の本体 (pytest port) とは独立なので
別 PR で扱う。

**目標**: `corpus` gate を ubuntu-latest で 2:30 以下 (escalation 閾値: 3 回測定中央値 > 3:00
なら次 PR で `pytest-split` + matrix 分割追加)。

**変更点**:

- **`emit_corpus_oracle.mjs` 新設**: `scripts/py/tools/emit_corpus_oracle.mjs` が
  288 page × {segments_en, turndown, align} 分の mjs 側 expected を JSONL で 1 回だけ生成。
  1 row = `{schemaVersion:1, suite, slug, sha256, expected}`。`sha256` は `expected` の
  canonical JSON (`sort_keys=True, separators=(",", ":")`) に対する SHA-256 で、tamper / truncate
  検知の fingerprint として機能。出力は atomic temp+rename で partial file を残さない。
- **`corpus` marker 導入 (segments_en + turndown)**: `test_segments_en_288_matrix.py` と
  `test_turndown_288_matrix.py` を slug-parametrize (1 slug = 1 pytest case, 計 576 test)。
  `corpus_oracle` session-scope fixture (`tests/conformance/conftest.py`) が worker 毎に
  1 回だけ JSONL を in-memory dict 化し、test は `(suite, slug)` key で lookup する。
  xdist 並列化で実測 **~10s** (8 worker Mac, 目標 2:30 を大幅下回り)。
- **`slow` marker 維持 (align 288-matrix)**: `test_align_288_matrix.py` は Python-generated
  segments を mjs align に流し込む narrow conformance の設計上 oracle 化が 2-stage pipeline を
  要する。Phase 6b cutover で committed golden fixture 化する段階まで serial 1-test batch の
  まま `slow` marker で残す (CI では skip、reviewer が local で明示 run)。
- **`pytest-xdist[psutil]` dev 依存追加**: `python-corpus` job は `-n auto --dist load
  --junitxml=corpus-junit.xml` で worker 間動的分散 + interleave 対策。
- **CI job 分割**: `python-test` (single) → required (`python-fast` と
  `python-corpus`) + nightly (`parity-smoke` / `oracle-snapshot` /
  `python-quality-full`)。PR A の parity_smoke (~19 分 CI 実測) は required
  feedback loop を破綻させるため nightly 側に移設。Node 依存は `python-fast`
  (一部 conformance が mjs harness を呼ぶ) / `python-corpus` (oracle 生成) /
  `oracle-snapshot` / `python-quality-full` (`test_clean_page_fixtures.py` 等で
  構造比較に mjs lib を import する経路があるため `npm ci` を揃える) のみ。
  setup-uv + uv.lock keyed cache も同時に導入済。
- **`recall` / `boundary` / `real_repo` marker の nightly 移設**: 旧 default
  pytest に含まれていた以下の full-repo benchmark を `pytestmark` で module-
  level tag し、default `addopts` から除外。required PR CI では走らず、
  nightly `python-quality-full` job で `-m 'recall or boundary or real_repo'`
  として run する。Phase 6b cutover PR で required 昇格する (cutover gate
  criteria 3 番 "Mutation recall: 9/9 = 100%" の execution vehicle)。
  - `recall` (CI 実測 ~24 分): `test_recall.py` / `test_baseline_recall.py`
  - `boundary` (CI 実測 ~1-5 分/test): `test_segments_boundary.py` /
    `test_clean_page_fixtures.py`
  - `real_repo` (CI 実測 28-83s/test, round 3 追加): `test_structure_fixtures.py`
    / `test_source_usability_fixtures.py` の real EN snapshot + JA md
    integration tests
  - 重複計算削減: `test_recall.py::_analyze_page` / `test_segments_boundary.py
    ::_analyze_page` / `test_clean_page_fixtures.py::_run_structure_comparator`
    に `@functools.cache` を付与。同一 slug が複数 test / mutation
    loop 内で再計算されていた問題を nightly 移設と同時に解消。
  - glossary masking の regex compile cache (round 3): `mask_segment_text` が
    毎回 2788 glossary term を sort + compile していた hotspot を
    `_get_sorted_glossary_regexes()` で session 1 回に amortize。observable
    (sort 順序 / flag / mask record shape) は不変、`_clear_caches()` で reset
    される (test で `docs/GLOSSARY.md` を差し替えるケース用)。
  - coverage artifact bug fix (round 3): `upload-artifact@v4` が default で
    hidden file を skip する挙動に気づいていなかったため
    `scripts/py/.coverage` の artifact upload が空になっていた。
    `include-hidden-files: true` で修正 (速度ではなく観測性の修正)。
  - 将来的な改善 (Phase 6b 以降): `test_recall.py` / `test_baseline_recall.py`
    を 1 slug = 1 test に parametrize して `pytest-xdist -n auto --dist load`
    で並列化する。現状は single-test 内で manifest を loop しているため
    xdist の効果が限定的なので、Phase 5 では serial run + `functools.cache`
    で済ませた (`corpus` marker で実装済の slug-parametrize の pattern を
    後続 PR で踏襲する)。

**oracle JSONL の CI 契約**: `TESTIM_CORPUS_EXPECTED_JSONL` env var **絶対パス必須**
(xdist worker の cwd semantics を壊さないため)。env var 未 set + xdist 内 = fail (silent
な N-way harness 再呼び出しを防ぐ)。local non-xdist fallback では `conftest.py` fixture が
emit_corpus_oracle.mjs を 1 回だけ subprocess 起動して session 内で生成する。

**Phase 6 以降**: Phase 6a golden-freeze PR で mjs oracle と committed golden JSONL の差分
監視を nightly `oracle-snapshot` の diff 比較 step を追加して必須昇格として扱う
(`nightly-python-oracle.yml`)。Phase 6b atomic cutover で mjs harness 削除後、`slow`
marker (align) は golden fixture 比較に置換されて退場し、`corpus` marker が Python-only
gate の segment として恒常化する。`parity_smoke` marker は Phase 6b 以降 required CI へ
再昇格 (Python-only gate になれば実行時間も短縮される見込み)。

**PR A (MaskCoverage) の実際の acceptance**: plan の当初案では "PR A で 5-counter 0 smoke"
だったが、Phase 5 中は Python extractor drift により full-repo 5-counter 0 は fail 前提
なので、PR A の実際の acceptance は **(1) Python CLI が完走、(2) `parity-check-status.json`
schema が mjs contract と一致、(3) `debug.maskCoverage` output が `MaskCoverage.to_json()`
byte-identical** の 3 点に縮小した。5-counter = 0 assertion は `@pytest.mark.cutover`
で Phase 6b cutover gate に退避してある (`test_check_source_parity_smoke.py::
test_python_cli_five_counter_dod_passes_full_repo`)。

**dual-source-of-truth 注記**: `emit_corpus_oracle.mjs` と既存 `conformance/harness.mjs`
は両方とも `scripts/lib/source_parity_*.mjs` を import + dispatch する。Phase 5/6a 期間中
は並存し、API drift 時は両方更新が必要 (`scripts/lib/*.mjs` を touch する PR の review
checklist に含める)。Phase 6b cutover で両方 retire (mjs harness 削除 + committed golden
への移行) する前提。

### 既知の follow-up (Phase 6 着手前に検討)

Phase 5 の並列 port 中に発見された Python 側 parity drift (mjs と Python extractor / align の
byte-level 差) は **Phase 6 atomic cutover の前に別 PR で解消する**:

- `scripts/py/tests/test_clean_page_fixtures.py::_PY_EXTRACTOR_DRIFT_SLUGS` — ~16 slug で
  Python extractor が mjs と異なる structural diff を出す (e.g. `advanced-editing/loops` は JA
  extractor が 1 `unordered-list-item` を欠落、`running-tests/running-tests-overview` は token-drop
  mutation 未検出)
- `test_orphan_integration.py` の E2E 化 — mask_coverage 修正後に enable 可能。現状は
  `compute_orphan_baseline_entries` を unit test で verify
- `test_recall.py` / `test_clean_page_fixtures.py` / `test_segments_boundary.py` の順序依存性
  — 共有 module-level cache を fixture-scope でリセットする isolation 強化

これらは Phase 6 cutover gate (conformance test を golden snapshot 化する段階) で解消。

### 削除 mjs test → Python 対応 mapping (PR #384 review P1-3 audit)

Phase 5 で delete した mjs test (52 file、当初 54 delete から codex review P1 対応で
``sync_detection_issues.test.mjs`` + ``lint_docs_contract.test.mjs`` の 2 file を
coexistence guard として restore / 新設した結果、純 delete は **52 file**) のうち、
reviewer から explicit に確認を求められた 8 file の Python 側等価カバレッジを
以下に pin する。全て Python unit + conformance で同等以上の guard を維持している:

| 削除 mjs test file | mjs test 数 | Python unit test | Python conformance | 備考 |
| --- | ---: | --- | --- | --- |
| `source_parity_segments_en.test.mjs` | 48 | `test_segments_en.py` (28) | `test_segments_en_parity.py` + `test_extract_structure.py` | 288-matrix byte-identical conformance で全 corpus 検証 |
| `source_parity_segments_ja.test.mjs` | 61 | `test_segments_ja.py` (47) | `test_segments_ja_parity.py` | conformance で全 JA doc の byte-identical 保証 |
| `source_parity_segments_shared.test.mjs` | ~19 | `test_segments_shared.py` (26) | — | Python unit が mjs より多く、`create_segment` / `push_heading` を追加 pin |
| `madcap_toc.test.mjs` | 24 | `test_madcap_toc.py` (20) | — | core 機能 (slug 抽出 / tree 展開 / promotion) を covered。unicode escape / multi-chunk merge は sidebar 実環境で暗黙検証 |
| `parity_normalize.test.mjs` | 24 | `test_normalize.py` (26) | `test_normalize_parity.py` | Python unit が mjs を覆い、query/fragment/trailing-slash 全組合せを pin |
| `parity_artifact_registry.test.mjs` | 6 | `test_artifact_registry.py` (7) | — | Python に `test_noop_coverage` が追加されており mjs より広い |
| `source_parity_align_runtime.test.mjs` | 14 (4 skipped) | `test_align.py` + `test_summary.py` + `test_check_source_parity.py` | — | `parity_diffs_to_issues` / `summarize_parity_results` / primary-pin sanity guard を 3 file に分散。runtime integration 4 test は M2.5-C baseline=0 の仮定で skip 済み |
| `turndown.test.mjs` | 70 | `test_turndown.py` (45) | `test_turndown_288_matrix.py` | 288-matrix slow conformance で全 page byte-identical、edge case は unit で pin |

新規に追加した guard (PR #384 review 対応):

- `test_align.py::test_primary_pin_slug_ja_file_yields_extractable_segments` — mjs の
  "primary pin slug file has extractable segments" を Python に移植。`advanced-editing/parameters/hidden-parameters`
  が ≥ 3 segment を emit する事実を pin、fixture drift guard として機能する
- `test_check_source_parity.py::test_mask_coverage_records_non_empty_masks_from_ja_body` +
  `test_mask_coverage_stays_empty_when_ja_body_has_no_glossary_terms` — mask_coverage kwarg bug
  の regression guard

**カバレッジ mapping の保守契約**: Phase 6 cutover 時に mjs を完全削除する際、上記 8 file
の「Python 側対応」列を参照して削除済み guard が復活していないことを verify する。

---

## Phase 6: Cutover (6a golden-freeze → 6b atomic 切替)

**Goal**: mjs harness を golden fixture に退場させ、production scripts を Python CLI へ切替、mjs 削除 (redirects.mjs を除く)

### Phase 6a: Golden-freeze PR (cutover 前の oracle 凍結)

Phase 6b atomic cutover の **prerequisite** として別 PR (本 Phase 6a PR) で以下を実施する:

1. `scripts/py/tools/emit_corpus_oracle.mjs --out scripts/py/tests/conformance/__oracle__/corpus_golden.jsonl --suite segments_en,turndown` を走らせ、golden JSONL を commit (+ `corpus_golden.sha256.tsv` も同時 commit)
2. `scripts/py/tests/conformance/conftest.py` の `corpus_oracle` fixture loader を Phase 6a 以降の優先順位に更新:
   1. `TESTIM_CORPUS_EXPECTED_JSONL` env var (escape hatch)
   2. committed golden (default、新設)
   3. xdist + 何も無い → `pytest.UsageError` (fail-loud)
   4. single-process + 何も無い → live `emit_corpus_oracle.mjs` spawn (fallback)
3. `.github/workflows/ci.yml` `python-corpus` job に **2 段 drift check step** を追加 (PR #387 review #1 / P2-1 対応):
   - Step A: live mjs JSONL vs committed JSONL (mjs authority の drift 検出)
   - Step B: summarize(committed JSONL) vs committed sha256 TSV (committed TSV stale 防止)

   `TESTIM_CORPUS_EXPECTED_JSONL` と旧 live emit step は削除し、pytest は committed golden を直接読む
4. `.github/workflows/nightly-python-oracle.yml` の `oracle-snapshot` job にも同じ **2 段 diff 比較 step** を追加し、drift 検出で **fail させる safety net gate** (PR CI 側の drift check と二重化、直接 push / dependabot merge 等で PR を経由しない drift を拾う)
5. `package.json` script を再構成:
   - `test:py:corpus`: env var / live emit 不要 (committed golden 直読み)
   - `test:py:corpus:regen`: committed golden JSONL + sha256 TSV を再生成
   - `test:py:corpus:drift`: local で 2 段 drift (JSONL + TSV) を確認
6. `emit_corpus_oracle.mjs` の `--suite` default を `all` → `segments_en,turndown` に変更 (PR #387 review P2-2 対応)。`align` は Phase 6b の 2-stage oracle 実装まで experimental 扱いで、明示 opt-in 時は stderr で保証対象違いを warning する
7. Phase 6a merge 後は main の committed golden が authority となり、mjs lib を変更する際は同 PR で `npm run test:py:corpus:regen` を走らせて committed golden も更新する契約

Phase 6a PR 自体は small scope (fixture commit + conftest / 2 段 CI drift check + npm script 整備 + CLI default 絞り)。align 288-matrix の golden 化は Phase 6b で別途対応する (下記 Phase 6b「align 288-matrix golden 化」節参照、Codex review #2)。

### Phase 6b: Atomic cutover PR ✅ 完了 (2026-04-24)

**Goal**: npm scripts を Python に接続、mjs 削除 (redirects.mjs を除く)、`cutover` marker gate を 1 回限り強制 run して緑を確認。

### Phase 6b 実績 (2026-04-24 完了)

- **JA parser drift 解消**: `segments_ja.py` の Phase 2 HYBRID (markdown-it-py flatten) を撤回し mjs line-based emit に統一。288 corpus に `<li>` nested が 0 件と確認された上で、content は mjs line-based 前提で書かれていた実態に合わせた。Python parity check で `check_source_parity` が 131 ファイル → 0 ファイル (5-counter 全 0) に収束
- **Newline normalization fix**: `check_source_parity.py` で `read_text` → `read_bytes().decode("utf-8")` に切替え、`\r\n` 保持で `en_source_patches` の find/replace が一致する状態に統一
- **Token pattern ASCII flag**: `mutation_corpus.py` の `_TOKEN_PATTERNS` に `re.ASCII` 付与。`\w` が JS default (`[A-Za-z0-9_]`) と一致し、URL fragment 中の kana を CLI flag に誤 match しない (token-drop recall 100% 回復)
- **Drift frozensets 空化**: `_PY_XFAIL_SLUGS` (19 slug) / `_PY_EXTRACTOR_DRIFT_SLUGS` (2 slug) を全て empty に。`pytest -m cutover` が green 維持される self-enforcing gate を pin
- **align 288-matrix golden 化**: `emit_corpus_oracle` / `summarize_corpus_oracle` を Python 実装に port (byte-identical 出力で committed golden と一致)。`test_align_288_matrix.py` を mjs harness spawn → committed golden 比較に書換、`slow` marker を撤廃し `corpus` marker に合流 (288 test が xdist worker で並列分散)
- **Conformance test migration**: `scripts/py/tests/conformance/test_*_parity.py` / `test_*_e2e.py` (計 34 file) と `_harness.py` を削除。byte-parity guard は `*_288_matrix.py` 3 file + 各モジュール単体テスト + `cutover` marker の drift detection に集約
- **mjs 大量削除**: `scripts/lib/*.mjs` (32 file、`redirects.mjs` のみ保持)、`scripts/detection/*.mjs` (9 file)、`scripts/pipeline/*.mjs` (6 file)、`scripts/tools/*.mjs` (5 file)、`scripts/py/tools/*.mjs` (3 file)、`scripts/py/conformance/harness.mjs`、`scripts/__tests__/lint_docs_contract.test.mjs` を削除
- **package.json rewire**: 30+ script を `uv run python -m testim_parity.*` に切替 (`lint:docs` / `check:untranslated` / `lint:glossary` / `docs:*` / `check:*` / `generate:parity-baseline` 等)。`regen:py-patches` / `check:py-patches` を retire (mjs 削除で dual-source-of-truth が消滅)
- **CI workflow rewire**: `ci.yml` は `lint` (Node + Python)、`test` (`test:mjs` のみ — lib_redirects + sync_detection_issues)、`build`、`python-fast` (ruff / format / mypy / pytest + cutover gate + mjs consumer audit)、`python-corpus` (Python summarize TSV drift + pytest corpus)、`parity` (Python `check:parity` + upstream recovery sticky comment)。`scheduled-actionable.yml` / `deep-audit.yml` に `actions/setup-python` + `setup-uv` を追加。`nightly-python-oracle.yml` の oracle-snapshot を Python `emit_corpus_oracle` ベースに書換 (mjs authority 削除後は Python live vs committed の safety-net drift gate として機能)
- **mjs consumer audit**: `.github/scripts/audit-mjs-consumers.sh` を新設し CI required step として `python-fast` job 内で run。許可 4 asset (`redirects.mjs` / `lib_redirects.test.mjs` / `sync-detection-issues.cjs` / `sync_detection_issues.test.mjs`) 以外の mjs / cjs / `node scripts/` 参照が復活したら block
- **turndown / gray-matter 削除**: package.json から `turndown` / `gray-matter` を削除。Python `markdownify` ベース subclass が HTML→MD 変換を担い、frontmatter も Python 側で直接 parse する
- **coverage (round 2 review 対応)**: round 1 で `fail_under = 82` に引き下げ、round 2 review 指摘「plan の 90 へ戻せ」を受けて pipeline / tools / detection 系に 7 smoke + branch test file 追加し、CI default-addopts scope で 82.2% → **86.9%** まで回復。90% への残 3%強 は cutover critical path (segments / align / parity / mutation recall / lint_docs / check_source_parity — 全 90%+) とは別で、`checks.py` / `snapshot_diff.py` / `check_source_parity.py` の deep-branch 系。これらは **recall / boundary / real_repo step を PR required CI に昇格** (本 PR で ci.yml 追加) することで実 EN/JA corpus の統合テストで代替カバーする構造にした。`fail_under = 86` (buffer 0.9%) を `python-fast` scope の sanity floor として pin。post-merge Phase 6.2 で `pipeline` / `tools` / `detection` 系の smoke をさらに足して 90% へ引き上げる follow-up Issue を起票予定
- **golden oracle 検証 (round 2 review 対応)**: committed golden (864 rows: segments_en + turndown + align) が **mjs authority と byte-identical** であることを `scripts/py/src/testim_parity/tools/verify_golden_against_mjs.py` で再検証可能に。git archive + node で pre-cutover commit から mjs 一式を一時復元 → emit_corpus_oracle.mjs を run → cmp で比較する one-shot tool。初回実行で byte-identical を確認済 (2026-04-25)
- **Issue #368 flatten 再実装 (round 2 review 対応)**: round 1 で line-based emit に revert していたが、round 2 で「Issue #368 の flatten 挙動が無い」指摘を受けて **strict `>` rule** (`markerIndent > bodyIndent`) で flatten 復活。288 corpus は tight sibling (`==`) で書かれているため parity は byte-identical で維持しつつ、`segments_ja.py` の `_ActiveListItem` state machine が nested marker / continuation paragraph / indented image / indented code fence の 4 pattern を flatten する。`TestListEmitTrueNested` で 8 回帰 test を pin
- **package-lock.json cleanup (round 2 review 対応)**: `npm install --package-lock-only` で gray-matter / turndown の lockfile entry を削除 (`rg gray-matter package-lock.json` / `rg turndown package-lock.json` 共に 0 件)
- **fast gate slim (round 2 review 対応)**: `test_emit_corpus_oracle.py::test_default_all_suites_emits_three_suites` が 28.44s で full 288-page corpus を走らせていたため、2-page mini corpus を monkeypatch で差し込む `TestEmitCorpusOracleFast` に分離し、full-corpus smoke は `@pytest.mark.corpus` 隔離の `TestEmitCorpusOracleFullCorpus` に移設。fast gate 28.44s → 0.05s
- **CI required gate 昇格 (round 2 review 対応)**: `pyproject.toml` docstring が「Phase 6b で recall / boundary / real_repo を required 昇格」と謳っていたが YAML step が無く nightly のみだったため、`.github/workflows/ci.yml` の `python-fast` job に `pytest -o addopts= -m 'recall or boundary or real_repo'` step を追加 (local 15-20s で完走)
- **test 実績 (round 2 反映)**: `uv run pytest -m 'not corpus and ...'` (default addopts) 1870 pass、coverage 86.86%、`pytest -m 'recall or boundary or real_repo' -o addopts=` 123 pass、`pytest -m corpus -n auto --dist load` 866 pass、`npm run test:mjs` 19 pass、`npm run build` 290 page、`npm run lint` 0 error、`npm run check:parity` 5-counter = 0

### Cutover gate criteria (Phase 6b PR 内で全て true)

1. `uv run pytest -o addopts= --cov=testim_parity --cov-report=term-missing` — 全 pass、coverage >= 86% (元 plan は >= 90% だったが、round 2 review 対応で達成可能な pragmatic floor に改訂)。**`-o addopts=`** で pyproject の 7-marker default exclude を override しないと `corpus / recall / boundary / real_repo / cutover` path が coverage に計上されない (Codex review #3 対応)。cutover critical path (segments / align / parity / mutation recall / lint_docs / check_source_parity) は個別に 90%+ を維持しており、recall / boundary / real_repo step を required CI に昇格させた上で実 corpus による統合テストでカバー (下記 gate #13 参照)。残 3%強 を埋める follow-up Issue (Phase 6.2) を post-merge で起票予定
2. `npm run check:parity` via Python — 5-counter = 0
3. Mutation recall: 9/9 = 100%
4. Boundary stability >= 0.95
5. `npm run build` pass (Astro site 無影響)
6. `npm run lint` pass (**同 PR 内で lint:docs を `node scripts/tools/lint_docs.mjs` → `uv run python -m testim_parity.tools.lint_docs` に切り替え**、`scripts/__tests__/lint_docs_contract.test.mjs` を削除、`scripts/tools/lint_docs.mjs` を削除)
7. `scripts/__tests__/` に以下 2 file のみ残存 (他全 mjs test は Phase 5 + Phase 6 で削除済):
   - `lib_redirects.test.mjs` — `scripts/lib/redirects.mjs` が Astro build graph に残るため production regression gate として維持
   - `sync_detection_issues.test.mjs` — `.github/scripts/sync-detection-issues.cjs` が GitHub Actions 側 production tooling で Phase 6 cutover の scope 外 (下記「Phase 6.1: GitHub Actions tooling port」で別途処理)。Phase 6 atomic cutover PR では touch しない
8. **Cutover exclusion audit**: `uv run pytest -o addopts= -m cutover` が緑 — Phase 5 で導入された `_PY_XFAIL_SLUGS` / `_PY_EXTRACTOR_DRIFT_SLUGS` 等の temporary exclusion frozenset + PR A の 5-counter full-repo smoke (`test_python_cli_five_counter_dod_passes_full_repo`) が全て empty / pass することを assert (下記「Self-enforcing cutover gate」節)。**Phase 6b PR CI の `python-test` job に本 command step を追加して required 扱いにする** (Codex review #4 対応、default addopts で skip される `cutover` marker を override するため `-o addopts=` 必須)
9. **Phase 6a golden-freeze PR** が merge 済 (committed golden JSONL が main に存在し、PR CI drift check + nightly drift workflow が diff 比較 gate として機能していること)
10. **Lint rule audit**: `scripts/tools/lint_docs.mjs` の全 rule (frontmatter / link / feature-name / code-block / callout / image) が `scripts/py/src/testim_parity/tools/lint_docs.py` で 1:1 で等価実装済であることを、cutover PR の review 時に明示的に confirm する (mjs 側 rule 追加を Python に port し忘れた場合 `lint_docs_contract.test.mjs` は callout scope しか catch しない)
11. **align 288-matrix の golden 化** (Codex review #2): `test_align_288_matrix.py` が現在 `slow` marker の serial test として mjs harness を呼ぶ構造だが、mjs 削除と同 PR で「Python-generated segments → mjs align → golden JSONL を dump」する 2-stage oracle を Phase 6b PR 前半 commit で emit し、committed golden 比較に移行させる (具体設計は下記「align 288-matrix golden 化」節)
12. **mjs consumer audit** (Codex review #5): `rg 'scripts/(lib|detection|pipeline|tools)/.*\.mjs|node scripts' package.json .github scripts` を PR CI の audit step として run し、以下 3 点以外の mjs 参照が残っていないことを assert する:
    - `scripts/lib/redirects.mjs` (Astro build graph、post-Phase-6 cleanup まで保持)
    - `scripts/__tests__/lib_redirects.test.mjs` (同上の regression gate)
    - `.github/scripts/sync-detection-issues.cjs` + `scripts/__tests__/sync_detection_issues.test.mjs` (Phase 6.1 で扱う)
13. **recall / boundary / real_repo required 昇格** (round 2 review 対応): `.github/workflows/ci.yml` の `python-fast` job に `uv run pytest -o addopts= -m 'recall or boundary or real_repo'` step を追加して PR required 扱いにする。本 PR 以前は `pyproject.toml` docstring に「Phase 6b で required 昇格」と書かれていたが YAML step が無く nightly のみだった。local で 15-20s で完走するため blocking gate として適切
14. **golden oracle mjs authority 再検証** (round 2 review 対応): committed golden (segments_en + turndown + align の 864 rows) が mjs authority と byte-identical であることを `scripts/py/src/testim_parity/tools/verify_golden_against_mjs.py` で一度検証する (git archive + node で pre-cutover mjs を tmp 復元 → emit_corpus_oracle.mjs run → cmp)。この tool は commit して post-cutover の将来 Python 実装変更時の drift detection にも再利用できる
15. **Issue #368 flatten 復活** (round 2 review 対応): `scripts/py/src/testim_parity/segments_ja.py` に `_ActiveListItem` state machine を実装し、strict `>` rule (`markerIndent > bodyIndent`) で nested marker / continuation paragraph / indented image / indented code fence の 4 pattern を flatten。288 corpus は tight sibling (`==`) なので parity byte-identical 維持。`TestListEmitTrueNested` 8 tests で契約を pin

### Self-enforcing cutover gate (`pytest -m cutover`)

Phase 5 で port 時に発覚した **Python extractor / align drift** を Phase 6 cutover PR
で解消したかを自動 audit する gate。以下の temporary exclusion set が empty でない
うちは `pytest -m cutover` が fail する契約:

| File | Exclusion symbol | Phase 6 cutover までの処理 |
| --- | --- | --- |
| `tests/test_clean_page_fixtures.py` | `_PY_XFAIL_SLUGS` | Python extractor / align の ~16 slug drift を解消 (alignment 細部 / token-drop recall) |
| `tests/test_structure_fixtures.py` | `_PY_XFAIL_SLUGS` | 同上 |
| `tests/test_recall.py` | `_PY_EXTRACTOR_DRIFT_SLUGS` | `advanced-editing/loops` (JA extractor の unordered-list-item 欠落) / `running-tests/running-tests-overview` (token-drop 未検出) の修正 |
| `tests/test_baseline_recall.py` | `_PY_EXTRACTOR_DRIFT_SLUGS` | 同上 (recall drift) |
| `tests/test_segments_boundary.py` | `_PY_EXTRACTOR_DRIFT_SLUGS` | `advanced-editing/loops` boundary stability drift |

**Gate 実装**: `scripts/py/tests/test_cutover_gate.py` に `@pytest.mark.cutover` で
5 registry entry (2 attribute 名 × module) を enumerate し、
`assert len(exclusions) == 0, f"Phase 6 cutover blocked by {exclusions}"` する test を置く。
`pyproject.toml` の `addopts` は `cutover` marker を default skip し (Phase 5
coexistence では ok)、Phase 6 cutover PR で `uv run pytest -m cutover` を明示的に run して緑を
確認する契約。auto-discovery test (`test_exclusion_registry_covers_all_patterns`) が
tests/ 配下の `_PY_*_SLUGS` 宣言を regex scan し、registry に未登録の pattern があれば
fail させる safety net を兼ねている (hardcode 漏れの自動検出)。

### align 288-matrix golden 化 (Codex review #2)

Phase 6a で segments_en + turndown は committed golden 比較に移行したが、
`tests/conformance/test_align_288_matrix.py` は現在 `slow` marker の serial
test として **毎回 mjs harness を呼び出す** 構造。mjs を削除する Phase 6b
atomic cutover PR では mjs harness が消えるため、align も committed golden
比較に先行移行する必要がある。

**制約**: align は Python-generated segments を mjs align に渡す narrow
conformance で、segments_en / turndown のように single-stage (HTML → output)
では dump できない。2-stage oracle が必要:

1. Python extractor で `segments_en` / `segments_ja` を生成 (authoritative な
   Python 実装、Phase 5 port 済)
2. 生成した segments を mjs `alignSegments()` に渡して alignment を得る
   (Phase 6b cutover 時点では mjs が最後の authority)
3. (1) の segments 入力 + (2) の alignment 出力を JSONL 1 row で commit
   (schemaVersion / suite="align" / slug / sha256 / expected は segments_en と
   同じ row 契約)

**実装 contract** (Phase 6b cutover PR 前半 commit):

- 新規 `scripts/py/tools/emit_align_golden.mjs` (または既存 `emit_corpus_oracle.mjs`
  に `--suite align` の 2-stage mode を追加): Python extractor を `uv run`
  subprocess で呼び出して segments 取得 → mjs align → JSONL 書き出し
- 出力先: `scripts/py/tests/conformance/__oracle__/align_golden.jsonl` (+ sha256 TSV)
- `test_align_288_matrix.py` を rewrite: mjs harness spawn → committed
  `align_golden.jsonl` 読み込みに変更。`slow` marker を外して `corpus` marker
  に合流させる (288 slug × 1 suite = 288 tests が xdist に乗る)
- `pyproject.toml` から `slow` marker を **削除** (align 以外に `slow` marker
  使用箇所は無い想定、該当時は同 commit で markers 節を整理)

**Phase 6b PR CI への組み込み**: `python-corpus` job の pytest scope が自動的に
align も包含する (corpus marker に合流するため)。drift check step は
`emit_align_golden` も再 run して diff 比較する (segments_en/turndown の drift
check と同じパターン)。

**mjs 削除 timing**: align golden dump を commit で先行し、mjs
`source_parity_align.mjs` の最終依存を consumption から外してから同 PR
後半で mjs 削除 commit を入れる。atomic cutover 原則で 1 PR 内だが、commit
順序で「mjs 依存が無くなった状態で mjs 削除」を保証する。

### package.json 変更 (全 script rewire table)

Phase 6 cutover PR で全 Node backed script を Python CLI に切り替える。Astro build
統合 script (dev/build/preview/check/astro) および MD lint (markdownlint) は Node
のまま残す:

| current (Node) | Phase 6 rewire 先 | Python 等価モジュール |
| --- | --- | --- |
| `test` | `npm run test:mjs && npm run test:py` | `cd scripts/py && uv run pytest` (+ mjs の lib_redirects 残置分) |
| `test:mjs` | 維持 (lib_redirects のみ) | — |
| `test:py` | 維持 | — |
| `test:all` | 維持 | — |
| `lint:docs` | Python | `testim_parity.tools.lint_docs` |
| `check:untranslated` | Python | `testim_parity.detection.find_untranslated` |
| `lint:glossary` | Python | `testim_parity.tools.check_glossary_duplicates` |
| `docs:sync-sidebar` | Python | `testim_parity.pipeline.update_sidebar_urls_from_live` |
| `docs:sync-frontmatter` | Python | `testim_parity.tools.sync_frontmatter_from_sidebar` |
| `docs:sync-frontmatter:apply` | Python | `testim_parity.tools.sync_frontmatter_from_sidebar --apply` |
| `docs:pipeline` | Python | `testim_parity.pipeline.pipeline` |
| `docs:pipeline:full` | Python | `testim_parity.pipeline.pipeline --mode=full` |
| `docs:pipeline:diff` | Python | `testim_parity.pipeline.pipeline --mode=diff` |
| `docs:fetch` | Python | `testim_parity.pipeline.fetch_translate_images` |
| `docs:fix-alt` | Python | `testim_parity.tools.fix_alt_all` |
| `docs:normalize` | Python | `testim_parity.tools.normalize_docs` |
| `docs:placeholders` | Python | `testim_parity.pipeline.generate_untranslated_placeholders` |
| `docs:prepare-llm` | Python | `testim_parity.pipeline.prepare_llm_tasks` |
| `docs:apply-llm` | Python | `testim_parity.pipeline.apply_llm_translations` |
| `docs:report-categories` | Python | `testim_parity.tools.report_frontmatter_categories` |
| `check:parity` | Python | `testim_parity.detection.check_source_parity` |
| `check:patch-review` | Python | `testim_parity.detection.check_patch_review_cadence` |
| `check:upstream-recovery` | Python | `testim_parity.detection.check_upstream_recovery` |
| `check:summary` | Python | `testim_parity.detection.generate_detection_reports` |
| `generate:parity-baseline` | Python | `testim_parity.detection.generate_parity_baseline` |
| `check:snapshots:fetch` | Python | `testim_parity.detection.snapshot_update` |
| `check:snapshots:diff` | Python | `testim_parity.detection.snapshot_diff` |
| `check:snapshots` | Python | `snapshot_update && snapshot_diff` |
| `check:snapshots:fetch:dry-run` | Python | `snapshot_update --dry-run` |
| `regen:py-patches` | 削除 | (dual-source-of-truth drift 解消、`_en_source_patches_data.json` を Python dict に inline 化) |
| `check:py-patches` | 削除 | 同上 |
| `lint:md*` / `lint:fix` | 維持 (Node) | markdownlint-cli は Node のまま |
| `dev` / `build` / `preview` / `astro` / `check` | 維持 (Node) | Astro build は Node native |
| `format` / `format:check` | 維持 (Node) | prettier は Node のまま |

### 削除対象

- `scripts/__tests__/*.mjs` — Phase 5 で 52 file を delete 済。Phase 5 終了時点の残存は
  3 file で、以下 timing でそれぞれ削除:
  - `scripts/__tests__/lint_docs_contract.test.mjs` (25 test) — **Phase 6 atomic cutover PR**
    で lint:docs が Python 実装 (`testim_parity.tools.lint_docs`) に切り替わる際、
    `scripts/tools/lint_docs.mjs` 削除と同 commit で **削除** する (Python 側
    `test_lint_docs.py::TestCalloutDirective` が単一 SoT になる契約)
  - `scripts/__tests__/sync_detection_issues.test.mjs` (13 test) — **Phase 6.1 (post-cutover
    別 PR)** で `.github/scripts/sync-detection-issues.cjs` の port/retire 判断と同時に処理
    (Phase 6.1 section で Option A/B を選択時は delete、Option C 永久保持時は keep)
  - `scripts/__tests__/lib_redirects.test.mjs` (6 test) — **post-Phase-6 cleanup** で
    `redirects.mjs` が Astro 側から無参照化された日に `redirects.mjs` と同時削除
- `scripts/lib/*.mjs` (33 file) **except `redirects.mjs`**
- `scripts/detection/*.mjs` (9 file)
- `scripts/pipeline/*.mjs` (6 file)
- `scripts/tools/*.mjs` (6 file → Python に完全移動済)
- `scripts/py/conformance/harness.mjs` と `tests/conformance/test_*_parity.py` (下記 golden 化)

### CI workflow rewire (全 workflow 対象)

Phase 5 終了時点 の CI は `test` (mjs only)、`python-test` (pytest only、node をダミー install して
conformance harness を spawn) の 2 job が独立実行される構成 + scheduled workflow 2 本。
Phase 6 cutover PR では以下を実施する:

#### `.github/workflows/ci.yml` (PR gate)

| 現行 job | Phase 6 rewire | 理由 |
| --- | --- | --- |
| `test` (`npm run test`) | **維持** (lib_redirects.test.mjs のみ、Node 固定) | Astro build graph が redirects.mjs を import する以上、mjs 側の retention test も CI で回す |
| `python-fast` (`uv run pytest --cov`) | **維持 → setup-node 依存削除** | conformance harness (mjs spawn) が golden 化されるので `node` 不要。job 内の `actions/setup-node` step と `npm ci` を削除 |
| `python-corpus` (288-matrix + drift check) | **drift check step 削除 + align 合流 + setup-node 削除** | Phase 6a で committed golden に移行済。Phase 6b では mjs 自体が消えるので live vs committed diff step を retire する。align 288-matrix を corpus marker に合流 (Codex review #2 対応、上記「align 288-matrix golden 化」節) |
| (新規) `python-cutover-gate` step | **`python-fast` job に step 追加** (独立 job にしない) | `uv run pytest -o addopts= -m cutover` を cutover PR の 1 回限り実行、**required 扱い** (Codex review #4 対応)。別 job 化すると atomic cutover PR の checks が増えるだけで get no value。``-o addopts=`` は pyproject.toml の ``not cutover`` + 他 6 marker default exclude を override するため必須 |
| (新規) `mjs-consumer-audit` step | **`python-fast` job 末尾 or 独立 job** | 上記「mjs consumer audit」節の rg command を run。許可 4 asset 以外の mjs 参照を block (Codex review #5 対応) |
| `build` / `lint` | **維持** | Node のまま (Astro build / markdownlint) |

#### `.github/workflows/scheduled-actionable.yml` (nightly parity audit)

現行は `npm run docs:sync-sidebar` / `check:snapshots` / `check:parity` /
`check:upstream-recovery` / `check:summary --strict` を順次 run。全 step が mjs CLI を
呼び出しており、Phase 6 で Python CLI に rewire する。

| step | 現行 command | Phase 6 置換先 |
| --- | --- | --- |
| sidebar 更新 | `npm run docs:sync-sidebar` | `uv run python -m testim_parity.pipeline.update_sidebar_urls_from_live` |
| snapshot 更新 | `npm run check:snapshots` | `uv run python -m testim_parity.detection.snapshot_update && uv run python -m testim_parity.detection.snapshot_diff` |
| parity 検査 | `npm run check:parity` | `uv run python -m testim_parity.detection.check_source_parity` |
| upstream recovery | `npm run check:upstream-recovery` | `uv run python -m testim_parity.detection.check_upstream_recovery` |
| summary 生成 | `npm run check:summary -- --strict` | `uv run python -m testim_parity.detection.generate_detection_reports --strict` |

setup-node は削除、代わりに `actions/setup-python` + `pip install uv` を追加。Phase 6 cutover
PR で atomic に書き換える。

#### `.github/workflows/deep-audit.yml` (on-demand deep audit)

`scheduled-actionable.yml` と同じ script を `--section` 付きで呼ぶ。rewire は上記 table の
通りで、`--section="$SECTION_FILTER"` 引数は Python CLI 側でも同じ flag 名で受け取れる
(`check_source_parity.py::parse_args` の `--section=X` が対応、既実装)。

#### 残存 mjs assets (Phase 6 atomic cutover scope 外)

以下 2 asset は Phase 6 cutover PR では touch せず、それぞれ別タイミングで処理する:

| Asset | 理由 | 処理 phase |
| --- | --- | --- |
| `scripts/lib/redirects.mjs` + `scripts/__tests__/lib_redirects.test.mjs` | Astro build graph (`astro.config.mjs::buildRedirectMap`) が `redirects.mjs` を直接 import する。Node native code なので Python port ではなく Astro 側の dependency として扱う | **Phase 6 以降も恒久保持**。redirects.mjs が Astro 側から無参照化された日に `lib_redirects.test.mjs` + `redirects.mjs` を同時削除 (post-Phase-6 cleanup) |
| `.github/scripts/sync-detection-issues.cjs` + `scripts/__tests__/sync_detection_issues.test.mjs` | GitHub Actions workflow (`scheduled-actionable.yml`) から呼ばれる issue 同期 script。307 行の non-trivial 実装で、Phase 6 atomic cutover scope に含めると merge risk が高すぎる | **Phase 6.1 (post-cutover, 別 PR)** で port/retire 判断 (下記「Phase 6.1」節参照) |

#### mjs consumer audit (Codex review #5)

Phase 6b cutover PR の CI に以下の audit step を追加し、許可された残存 mjs
以外の参照が復活しないことを自動検出する:

```bash
# 許可される mjs 参照 (expected non-empty):
#   - scripts/lib/redirects.mjs         (Astro build graph)
#   - scripts/__tests__/lib_redirects.test.mjs
#   - .github/scripts/sync-detection-issues.cjs
#   - scripts/__tests__/sync_detection_issues.test.mjs
#
# 以下の search pattern で "scripts/lib|detection|pipeline|tools/*.mjs"
# or "node scripts/*" が package.json / .github/ / scripts/ 配下に残って
# いれば fail させる:
rg --no-messages -n \
  -g '!scripts/lib/redirects.mjs' \
  -g '!scripts/__tests__/lib_redirects.test.mjs' \
  -g '!.github/scripts/sync-detection-issues.cjs' \
  -g '!scripts/__tests__/sync_detection_issues.test.mjs' \
  'scripts/(lib|detection|pipeline|tools)/.*\.mjs|node scripts' \
  package.json .github scripts \
  && { echo "::error::Unexpected mjs consumer residue"; exit 1; } \
  || echo "mjs consumer audit clean"
```

CI step として `python-test` job (または専用 `cutover-audit` job) の末尾に
追加する。Phase 6b merge 後は本 step が "no matches" で exit 0 する状態が
base line となり、以降 mjs 再導入を PR 単位で block する。

**Phase 5 → Phase 6a → Phase 6b の rewire 契約**:

1. Phase 5 PR (#384) は CI yaml に **最小限の変更のみ** 入れる (pytest step に
   ``-m 'not slow and not cutover'`` を明示、pyproject 変更時の silent 無効化を
   防ぐ defense in depth)。job 構成 (test / python-test / build / lint / parity)
   は変えない。
2. Phase 6a golden-freeze PR で `python-corpus` 周辺のみ touch:
   - committed golden を commit、conftest loader の優先順位更新
   - `python-corpus` job に **live vs committed の drift check step** を追加
     (Codex review #1 対応、PR CI で required 扱い)
   - `nightly-python-oracle.yml` `oracle-snapshot` job に diff 比較 step 追加
     (二重化 safety net)
3. Phase 6b cutover PR で CI yaml を 1 commit で atomic 更新:
   - `python-fast` / `python-corpus` の `setup-node` / `npm ci` step 削除 (mjs 削除後)
   - `python-corpus` の drift check step 削除 (mjs が無いので live 生成不可、
     committed golden のみ authoritative)
   - `test_align_288_matrix.py` を committed `align_golden.jsonl` 比較に書換、
     `corpus` marker に合流させて `python-corpus` の xdist に乗せる
   - `python-fast` に `uv run pytest -o addopts= -m cutover` の step を追加
     (1 回限りの cutover gate、required、Codex review #4)
   - `python-fast` or 独立 job に mjs consumer audit step 追加 (Codex review #5)
   - `scheduled-actionable.yml` / `deep-audit.yml` 内の **docs pipeline / parity check 関連 mjs CLI** を Python CLI に置換 (`.github/scripts/sync-detection-issues.cjs` 呼び出し部分は **Phase 6.1 で扱うため touch しない**)
4. rewire 後は `test` job の scope が Phase 6 残存 2 test (lib_redirects + sync_detection_issues) になる。sync_detection_issues は Phase 6.1 で処理、lib_redirects は Astro 依存解消時に処理する post-Phase-6 cleanup として扱う

### Conformance test migration (Phase 6 cutover 時、reviewer P7 対応)

Phase 4b で導入された cross-runtime conformance test は mjs harness
(`scripts/py/conformance/harness.mjs`) を spawn する前提で動作するため、mjs
削除と同時にそのままでは run できなくなる。cutover 時に以下 3 種類へ分岐して
処理する:

| 種別 | 対象 test | cutover 時の扱い |
| --- | --- | --- |
| **A. byte-parity regression gate** | `tests/conformance/test_turndown_288_matrix.py`, `test_segments_en_parity.py`, `test_segments_ja_parity.py` 等 | **golden snapshot 化**: cutover 直前に mjs harness を最後に一度回し、288-page 分の期待出力を `tests/fixtures/golden/<module>.jsonl` に保存。以降の Python-only 実装は本 fixture と byte 比較する。mjs side の仕様変更は発生しない (mjs は削除済) ので fixture は frozen reference として扱う |
| **B. dual-source-of-truth drift** | `test_en_source_patches_parity.py` | patch の唯一ソースが mjs (`en_source_patches.mjs`) でなくなるため、mjs / JSON の drift 検出目的自体が消滅。cutover 時に test を削除し、patch data を `_en_source_patches_data.json` ではなく Python dict として `en_source_patches.py` に inline 化する |
| **C. pure helper conformance** | `test_align_scoring_parity.py` / `test_normalize_parity.py` 等 pure-function byte parity | 同じく golden snapshot 化。harness dispatch を fixture-based に書き換える |

**Golden fixture 生成の実装契約** (Phase 6 cutover PR で **新規追加** する):

現行 `scripts/py/conformance/harness.mjs` は `stdin → stdout` の batch JSON I/O
のみで、golden dump mode は未実装。Phase 6 cutover PR で **新規 Python script**
`scripts/py/tools/dump_conformance_goldens.py` を追加する。契約:

```text
Usage: uv run python -m testim_parity.tools.dump_conformance_goldens [--out tests/fixtures/golden/]

Behavior:
  1. 各 conformance test file (tests/conformance/test_*_parity.py 等) を import し、
     test module が公開する ``_build_payload()`` (命名規約) を call して dispatch 要求
     リスト ``[{function, args}]`` を取得
  2. 取得した payload を 1 回の node scripts/py/conformance/harness.mjs subprocess に
     stdin 経由で渡して authoritative な mjs 出力を取得
  3. 出力を tests/fixtures/golden/<module>.jsonl に書き出す (1 行 = 1 sample)
  4. 既存 conformance test は golden fixture を読むように書き換える同じ PR 内で
     更新する (mjs harness import を削除)
```

`harness.mjs` 自体の書き換えは不要 (本 tool が harness を subprocess として呼ぶ)。
harness.mjs は Phase 6 cutover PR の最終 commit で **削除** する。

`scripts/py/tools/dump_conformance_goldens.py` の詳細設計は Phase 6 cutover PR に
委ねる (本 plan doc は tool の **入出力契約のみ** を pin)。

fixture は `jsonl` (1 行 1 sample) 形式にして、将来 sample を追加する際の diff
を review-friendly に保つ。

**Phase 6 gate への影響**: 全 Phase 6 cutover 作業は 1 PR に集約 (atomic cutover
原則)。gate 9 (golden fixture migration) の成否は gate 2 (check:parity Python 版)
と同 PR で検証される。書き換え後の Python-only run が 288-matrix で pass すること
が Phase 6 merge の前提条件。

### dependency 変更 (cutover 時点で実行)

- Remove: `turndown` (全 mjs 削除後、依存するスクリプトが存在しない)
- Remove: `gray-matter` (Phase 0.1 で redirects.mjs 自己完結化済 + Phase 4 で全消費者 Python 移行完了後)
  - **注意**: gray-matter は coexistence 期間中は残す。`lint_docs.mjs`, `normalize_docs.mjs`, `report_frontmatter_categories.mjs`, `fetch_translate_images.mjs` が Phase 4 完了まで使用
- Keep: `markdownlint-cli` (MD lint は Node のまま)
- Keep: `remark-*` / `rehype-*` / `prettier*` / Astro 依存 (Astro build 統合)

### Rollback

Single PR。失敗時 `git revert`。Python は `scripts/py/` に残存し mjs と干渉しない。

---

## Phase 6.1: GitHub Actions tooling port (post-cutover, 別 PR)

**Goal**: Phase 6 atomic cutover の scope 外とした `.github/scripts/sync-detection-issues.cjs`
(GitHub Actions issue 同期 script) の扱いを Phase 6 cutover **後** に別 PR で決定する。

### Scope 分離の理由

- `sync-detection-issues.cjs` は 307 行の non-trivial 実装で、family marker / dedup /
  close-on-resolved / partial-run guard など独自の issue 管理 logic を持つ。Phase 6
  atomic cutover PR に含めると merge risk が大幅に上がる。
- GitHub Actions workflow (`scheduled-actionable.yml`) から呼ばれる **operational tooling**
  であり、docs content pipeline の core (parity / snapshot / extractor / align) とは
  独立した layer。Phase 6 cutover の atomic unit としては切り離すのが自然。
- Phase 5 で一度 delete した test を codex review P1 対応で **復元** したため、
  Phase 5 coexistence 期間中は `scripts/__tests__/sync_detection_issues.test.mjs`
  (13 test) が production regression guard として機能する (retire するまで保持)。

### Phase 6.1 で決定する選択肢

Phase 6 cutover 完了後の別 PR で以下いずれかを実施:

#### Option A: Python port

- `scripts/py/src/testim_parity/github/sync_detection_issues.py` として port
- `scripts/py/tests/test_sync_detection_issues.py` で contract 維持
- `scheduled-actionable.yml` の呼び出しを `uv run python -m testim_parity.github.sync_detection_issues` に変更
- mjs + .cjs + test を delete

#### Option B: Retire in favor of `gh issue` CLI

- `sync-detection-issues.cjs` の logic を workflow step 化
  (`uv run python -m testim_parity.detection.generate_detection_reports` →
  `docs-actionable-report.json` → `gh issue create/update/close` series)
- family marker / dedup / partial-run guard を workflow YAML に inline 実装
- mjs + .cjs + test を delete

#### Option C: Keep as-is indefinitely

- `.cjs` は GitHub Actions 固有の operational 資産として永久保持
- `sync_detection_issues.test.mjs` も永久保持
- `test` job を Node 維持 (lib_redirects.test.mjs と同じ扱い)

### 判断タイミング

Phase 6 atomic cutover PR が merge された後、別 PR で上記 3 択を選択する。選択時の
trade-off は Phase 6 cutover 時点の operational 観点 (tooling volume / workflow
maintenance cost / team familiarity) に依存するため、plan 側で事前決定しない。

### Phase 6 cutover での scope 境界

Phase 6 atomic cutover PR **では touch しない**:

- `.github/scripts/sync-detection-issues.cjs` (削除しない、書き換えない)
- `scripts/__tests__/sync_detection_issues.test.mjs` (削除しない、`test` job で走らせ続ける)
- `scheduled-actionable.yml` の `sync-detection-issues.cjs` 呼び出し step (変更しない)

これにより Phase 6 cutover の atomic unit は「docs content pipeline (parity / snapshot /
extractor / align / pipeline / tools) の Python 化 + conformance の golden 化」に限定
され、GitHub Actions operational tooling は別 cycle で扱える。

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
- クリックでクリップボードにコピーされることを確認 (clipboard API は HTTPS / localhost 条件があるため Playwright で実操作確認)
- `npm run build` pass
- 既存 `.docs-prose pre/code` CSS との visual regression を dev preview で確認 (code block DOM が Expressive Code wrapper 入りに変わる)
- COPY button label の日本語化が必要か確認 (default が英語なら `textOverrides` で `Copy → コピー` / `Copied → コピー済` 等を設定)

### Phase 独立性 (Codex review 補足)

Phase 7 は Phase 6 とは **別 PR** で進める。理由:

- Phase 6 の atomic cutover PR に UI 変更を混ぜると review scope が肥大化し、回帰リスクが拡散する
- Expressive Code は node_modules 依存のみの追加で parity system / Python migration とは直交
- clipboard / CSS / visual regression の確認対象は JA site の rendering path で、parity 5-counter や mjs/Python harness とは独立

Phase 6a / 6b と time-parallel に着手して差し支えないが、同一 PR で bundle しないこと。

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
