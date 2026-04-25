# Python tooling current state

この文書は、過去の移行履歴ではなく、現在の Python tooling 運用で維持すべき契約だけを記録する。

## 現在の方針

- `scripts/py/` は `uv` 管理の Python package として運用する。
- 依存関係は `scripts/py/pyproject.toml` と `scripts/py/uv.lock` を正とする。
- ローカル仮想環境 `scripts/py/.venv/` は生成物であり、リポジトリには保持しない。
- npm scripts は Node/Astro の入口を残しつつ、ドキュメント同期、検出、正規化、パリティ確認は `uv run python -m testim_parity...` で実行する。
- 旧実装との差分を抑制するための一時 allowlist は追加しない。検出された drift は実装またはコンテンツで解消する。

## Required gates

以下を現行の主要 gate とする。

```bash
npm run lint
npm run test:mjs
npm run test:py:quick
cd scripts/py && uv run pytest -o addopts= -m 'recall or boundary or real_repo' --tb=short
npm run test:py:corpus
npm run check:parity
npm run build
```

`npm run check:parity` は 5-counter = 0 を維持する。5-counter の定義と suppression 契約は `docs/SYSTEM_SPEC.md` と `docs/PARITY_GUIDE.md` を正とする。

### Self-enforcing cutover gate

`scripts/py/tests/test_cutover_gate.py` は、この表と `_EXCLUSION_REGISTRY` が一致することを検証する。以下の temporary drift registry はすべて空でなければならない。

| File                                | Exclusion symbol            | 処理                                                                   |
| ----------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| `tests/test_clean_page_fixtures.py` | `_PY_XFAIL_SLUGS`           | Python extractor / align drift を解消し、空集合を維持する              |
| `tests/test_structure_fixtures.py`  | `_PY_XFAIL_SLUGS`           | structure fixtures に現れる extractor drift を解消し、空集合を維持する |
| `tests/test_recall.py`              | `_PY_EXTRACTOR_DRIFT_SLUGS` | recall drift を実装修正で解消し、空集合を維持する                      |
| `tests/test_baseline_recall.py`     | `_PY_EXTRACTOR_DRIFT_SLUGS` | baseline recall drift を実装修正で解消し、空集合を維持する             |
| `tests/test_segments_boundary.py`   | `_PY_EXTRACTOR_DRIFT_SLUGS` | boundary stability drift を実装修正で解消し、空集合を維持する          |

新しい `_PY_*_SLUGS` を追加する場合は、同じ PR でこの表と `test_cutover_gate.py` の registry を更新する。ただし、追加は原則として禁止し、drift は修正で解消する。

## Python environment

初回セットアップ:

```bash
cd scripts/py
uv sync --all-extras
```

通常の実行:

```bash
uv run pytest
uv run ruff check src tests
uv run ruff format --check src tests
uv run mypy src
```

`uv` が作る `.venv/`、pytest/ruff/mypy の cache、coverage artifact はローカル生成物として扱う。
