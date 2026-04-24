r"""Phase 4b M2/M3 verification gate: 288-page turndown conversion matrix。

``snapshots/en/content/**/*.html`` 全ページを Python の
``convert_en_html_to_md`` と JSONL oracle (mjs 側の値) で byte 比較する。
PYTHON_MIGRATION_PLAN.md の Phase 4b M2/M3 scope:

    > M2 ``check_source_parity.py`` は snapshot の Markdown 化に turndown を
    > 使う。M3 ``snapshot_update.py`` は extract 後に turndown で structure
    > 比較する実装を通す。M1 の代表 39 pattern だけでは real orchestration に
    > 入った turndown 経路の全 corpus 検証として不足。

## 現状 (2026-04-22, Phase 4b.1 完了時点)

Python の ``convert_en_html_to_md`` は **288 pages すべてで mjs と byte-
identical**。Phase 4b.1 で以下の turndown default rule を追加 port して
M1 時点の 168 divergence を解消した:

- ``_collapse_whitespace`` — mjs turndown の DOM ``collapseWhitespace`` を
  BS4 tree 上で pre-pass として再現 (block / ``<br>`` 境界の leading ws trim
  + void element 隣接 text の space preservation)
- ``_turndown_escape`` + ``_TurndownConverter.escape`` override — mjs
  turndown の 13 escape 規則 (``^-`` / ``^+ `` / ``^# `` / ``` ` ``` / ``_``
  / ``[`` / ``]`` 等) を markdownify の ``escape`` hook 経由で適用
- ``_TurndownConverter.convert_p`` — paragraph content の trailing ``  \\n``
  (``<br>`` hard break) を preserve (markdownify default の
  ``strip(' \\t\\r\\n')`` を回避)
- ``autolinks = False`` — ``<a href=URL>URL</a>`` の ``<URL>`` 縮約を無効化

## xdist 並列化 (PR B)

PR B で serial 1 test → **slug-parametrized 288 test** に分解し、pytest-xdist
``-n auto --dist load`` で worker 間に動的分散する。mjs harness は ``python-
corpus`` job で 1 回だけ spawn して expected JSONL を生成し、全 worker が
``TESTIM_CORPUS_EXPECTED_JSONL`` env var 経由でそれを共有する (詳細は
``tests/conformance/conftest.py`` の ``corpus_oracle`` fixture)。

本テストは Phase 6 atomic cutover で mjs を削除するまで regression gate と
して残す (node 不在環境では oracle fallback 経由で skip)。

## Allowlist lifecycle

``_ALLOWLIST`` は intentional divergence を吸収するための slug 台帳。現状は
**空**。Phase 6 atomic cutover で mjs を削除した時点で本テストは retire
する想定 (M1 と同様、cross-runtime conformance は cutover と同時に不要化)。

Entry の shape:

    {slug: AllowEntry(reason="...", expires_at_phase="phaseN", linked_issue=None)}

運用ルール:

1. 追加時は ``reason`` を必ず明記 (turndown 変換の差の理由 / 該当 mjs bug)
2. ``expires_at_phase`` は divergence 解消予定 Phase。Phase 完了時に見直し
3. ``linked_issue`` は明示指定必須 (None 許容だが省略不可)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pytest

from testim_parity.turndown import convert_en_html_to_md

from .conftest import canonical_sha256

SNAPSHOT_ROOT_PARTS = ("snapshots", "en", "content")


@dataclass(frozen=True)
class AllowEntry:
    """intentional divergence 1 件分の台帳エントリ。"""

    reason: str
    expires_at_phase: str
    linked_issue: str | None


# Intentional divergence 台帳。slug → AllowEntry。Phase 4b 時点では空 (reviewer
# P2#2 の要件)。Phase 5/6 で retire される想定。
_ALLOWLIST: dict[str, AllowEntry] = {}


def _collect_slugs() -> list[str]:
    """Collect slug list at **collect time** for ``@pytest.mark.parametrize``."""
    repo_root = Path(__file__).resolve().parents[4]
    root = repo_root
    for part in SNAPSHOT_ROOT_PARTS:
        root = root / part
    if not root.exists():
        return []
    slugs: list[str] = []
    for path in sorted(root.rglob("*.html")):
        rel = path.relative_to(root).with_suffix("")
        slug = rel.as_posix()
        if slug in _ALLOWLIST:
            continue
        slugs.append(slug)
    return slugs


_ALL_SLUGS = _collect_slugs()


def _read_html(slug: str) -> str:
    """Load EN snapshot HTML for a slug."""
    repo_root = Path(__file__).resolve().parents[4]
    path = repo_root
    for part in SNAPSHOT_ROOT_PARTS:
        path = path / part
    return (path / f"{slug}.html").read_text(encoding="utf-8")


@pytest.mark.corpus
@pytest.mark.parametrize("slug", _ALL_SLUGS)
def test_turndown_page_matches_oracle(slug: str, corpus_oracle: dict) -> None:
    """1 slug = 1 test: Python ``convert_en_html_to_md`` が oracle と byte 一致。

    xdist ``-n auto --dist load`` で 288 case が worker 間に動的分散される。
    ``sha256`` field も比較することで、oracle JSONL が tampered / truncated 時
    に早期検知する (drift 検知の byte-parity fingerprint)。
    """
    row = corpus_oracle.get(("turndown", slug))
    assert row is not None, (
        f"oracle JSONL missing turndown row for slug={slug!r}. "
        "Re-run `node scripts/py/tools/emit_corpus_oracle.mjs` to regenerate."
    )

    html = _read_html(slug)
    py = convert_en_html_to_md(html)
    expected = row["expected"]

    if py != expected:
        py_lines = py.splitlines()
        mjs_lines = expected.splitlines()
        first_diff_line: int | None = None
        for i in range(min(len(py_lines), len(mjs_lines))):
            if py_lines[i] != mjs_lines[i]:
                first_diff_line = i
                break
        detail = (
            f"  slug={slug}\n"
            f"    py_lines={len(py_lines)} mjs_lines={len(mjs_lines)}"
            f" py_bytes={len(py)} mjs_bytes={len(expected)}"
        )
        if first_diff_line is not None:
            detail += (
                f"\n    first diff at line {first_diff_line + 1}:"
                f"\n      py  = {py_lines[first_diff_line]!r}"
                f"\n      mjs = {mjs_lines[first_diff_line]!r}"
            )
        elif len(py_lines) != len(mjs_lines):
            longer = py_lines if len(py_lines) > len(mjs_lines) else mjs_lines
            detail += f"\n    extra trailing line: {longer[-1]!r}"
        pytest.fail(f"turndown divergence:\n{detail}")

    assert canonical_sha256(expected) == row["sha256"], (
        f"oracle JSONL sha256 mismatch for turndown/{slug} — "
        "JSONL may be truncated or tampered (regenerate via emit_corpus_oracle.mjs)"
    )


@pytest.mark.corpus
def test_turndown_summary_bytes_match(corpus_oracle: dict) -> None:
    """Aggregate check: 合計 byte 長が mjs と一致 + 一致率 100%。

    slug-parametrized test が throw した場合でも、ここで aggregate な
    divergence の規模を把握できる補助 assert。single-test で残す。
    """
    py_total_bytes = 0
    mjs_total_bytes = 0
    matching_pages = 0
    checked = 0
    for slug in _ALL_SLUGS:
        row = corpus_oracle.get(("turndown", slug))
        if row is None:
            continue
        checked += 1
        html = _read_html(slug)
        py = convert_en_html_to_md(html)
        mjs = row["expected"]
        py_total_bytes += len(py.encode("utf-8"))
        mjs_total_bytes += len(mjs.encode("utf-8"))
        if py == mjs:
            matching_pages += 1

    assert py_total_bytes == mjs_total_bytes, (
        f"aggregate byte length mismatch: py={py_total_bytes} mjs={mjs_total_bytes}"
    )
    assert matching_pages == checked, (
        f"{checked - matching_pages}/{checked} pages diverged from mjs turndown"
    )
