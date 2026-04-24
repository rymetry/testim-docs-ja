"""Phase 1 verification gate: 288-page segment extraction matrix。

``snapshots/en/content/**/*.html`` 全ページについて、Python の
``extract_segments_from_html`` 出力を JSONL oracle (mjs 側の値) と byte 比較
する。PYTHON_MIGRATION_PLAN.md の Phase 1 verification gate:

    > 全 288+ snapshot ページで segments_en 出力を mjs と比較
    > 比較対象: segmentKind, sectionPath, segment 数が一致

本テストは **segment count + {segmentKind, sectionPath, textNorm,
tokensInvariant, segmentIndex} full equality** を hard 確認する。

## xdist 並列化 (PR B)

PR B で serial 1 test → **slug-parametrized 288 test** に分解し、pytest-xdist
``-n auto --dist load`` で worker 間に動的分散する。mjs harness は ``python-
corpus`` job で 1 回だけ spawn して expected JSONL を生成し、全 worker が
``TESTIM_CORPUS_EXPECTED_JSONL`` env var 経由でそれを共有する (詳細は
``tests/conformance/conftest.py`` の ``corpus_oracle`` fixture)。

## Allowlist lifecycle (architect review H3)

``_ALLOWLIST`` は intentional divergence を吸収するための slug 台帳。現状は
**空**。将来、Phase 2 (JA extractor) が EN 側と異なる segmentation を意図的
に emit する時などに entry を追加する。Entry の shape (3 フィールド全て明示
指定必須):

    # 関連 issue / UD 番号がある場合
    {slug: AllowEntry(reason="...", expires_at_phase="phaseN", linked_issue="#123")}
    # 純粋な design divergence で tracker なしの場合も明示的に None を渡す
    {slug: AllowEntry(reason="...", expires_at_phase="phaseN", linked_issue=None)}

運用ルール:

1. 追加時は ``reason`` を必ず明記する (parity 変更の理由 / 対応する上流欠陥)
2. ``expires_at_phase`` は「この divergence が解消されるべき Phase」。Phase N
   完了時に必ず見直して、不要なら削除する
3. ``linked_issue`` は ``str | None`` (nullable) で **明示指定必須**。tracker
   があれば GitHub issue 番号 / UD 番号、無ければ ``None`` を明示的に渡す。
   省略可能 default を置かないのは、silent に tracker なし divergence が
   積み上がるのを防ぐため
4. 288-matrix 自体の役割は Phase 4 (pipeline wiring) まで。Phase 5 の
   aggregate-counter gate へ移行したタイミングで本 test は retire する想定
   (plan ``docs/PYTHON_MIGRATION_PLAN.md`` Phase 5 tier 戦略)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pytest

from testim_parity.segments_en import CALLOUT_NORMALIZATION_SLUGS, extract_segments_from_html

from .conftest import canonical_sha256

SNAPSHOT_ROOT_PARTS = ("snapshots", "en", "content")


@dataclass(frozen=True)
class AllowEntry:
    """intentional divergence 1 件分の台帳エントリ。

    **3 フィールドすべて構築時に明示指定必須**。``linked_issue`` は型としては
    ``str | None`` (省略可能ではなく nullable) — GitHub issue 番号
    (例: ``"#368"``) や ``docs/UPSTREAM_DEFECTS.md`` の UD 番号 (例: ``"UD-017"``)
    を入れる。関連 issue が無い純粋な design divergence の場合は **明示的に**
    ``linked_issue=None`` を渡す (architect review H3、Codex LOW)。

    default 値を持たない設計の意図: allow list に entry を追加する contributor が
    「linked_issue を付けるか付けないか」を必ず意識する。省略可能 default にすると
    silent に tracker なし divergence が積み上がるリスクがある。
    """

    reason: str
    expires_at_phase: str
    linked_issue: str | None


# Intentional divergence 台帳。slug (SNAPSHOT_ROOT からの相対 path) → AllowEntry。
# 空でキープするのが理想。entry を追加する場合は必ず reason / expires_at_phase を
# 明記し、対応 Phase 完了時に retire する (docstring の lifecycle 節参照)。
_ALLOWLIST: dict[str, AllowEntry] = {}


def _collect_slugs() -> list[str]:
    """Collect slug list at **collect time** for ``@pytest.mark.parametrize``.

    ``pytest_generate_tests`` を使わず module-level 定数にすることで、xdist
    worker 側 collection も同じ list を生成する (filesystem-deterministic)。
    """
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
def test_segments_en_page_matches_oracle(slug: str, corpus_oracle: dict) -> None:
    """1 slug = 1 test: Python segment list が JSONL oracle (mjs) と byte 一致。

    xdist ``-n auto --dist load`` で 288 case が worker 間に動的分散される。
    ``corpus_oracle`` fixture は session-scope で (suite, slug) key の dict を
    持つ (xdist worker 毎に 1 回だけロード、JSONL file は env var 経由で共有)。

    ``sha256`` field も比較することで、**oracle JSONL row の canonical JSON
    serialization 契約** を pin する (``py == expected`` が既に値一致を保証
    するため、主目的は mjs 側と Python 側の canonical form 仕様 drift を
    早期検知すること; JSONL tamper 検知は副次効果)。
    """
    row = corpus_oracle.get(("segments_en", slug))
    assert row is not None, (
        f"oracle JSONL missing segments_en row for slug={slug!r}. "
        "Re-run `npm run test:py:corpus:regen` "
        "(or `uv run python -m testim_parity.tools.emit_corpus_oracle --out <golden.jsonl> --suite all`)."
    )

    html = _read_html(slug)
    # production caller と同じ shape で callout allow list を明示的に渡す
    # (review H4: Python default は None = no normalization で mjs と揃えた
    # ため、test 側が production API 契約をシミュレートする)。
    py = extract_segments_from_html(
        html, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
    )
    expected = row["expected"]

    if py != expected:
        py_count = len(py)
        ex_count = len(expected)
        first_diff_idx: int | None = None
        for i in range(min(py_count, ex_count)):
            if py[i] != expected[i]:
                first_diff_idx = i
                break
        detail = f"  slug={slug}\n    py_count={py_count} mjs_count={ex_count}"
        if first_diff_idx is not None:
            detail += (
                f"\n    first diff at index {first_diff_idx}:"
                f"\n      py  = {py[first_diff_idx]!r}"
                f"\n      mjs = {expected[first_diff_idx]!r}"
            )
        elif py_count != ex_count:
            longer = py if py_count > ex_count else expected
            detail += f"\n    extra trailing segment: {longer[-1]!r}"
        pytest.fail(f"segment divergence:\n{detail}")

    # canonical serialization contract pin (sha256 recomputation matches oracle)
    assert canonical_sha256(expected) == row["sha256"], (
        f"oracle JSONL canonical-JSON sha256 diverged for segments_en/{slug} — "
        "canonicalStringify / Python json.dumps(sort_keys=True) の仕様が "
        "drift した可能性あり (regenerate via `npm run test:py:corpus:regen` "
        "or fix `testim_parity.tools.emit_corpus_oracle._canonical_json`)"
    )


@pytest.mark.corpus
def test_segment_counts_and_kinds_summary(corpus_oracle: dict) -> None:
    """Aggregate check: 合計 segment 数と kind 分布が oracle と一致。

    slug-parametrized test が throw した場合でも、ここで aggregate な
    divergence 把握ができるよう補助 assert を置く。single-test のまま残す
    (aggregate なので parametrize する意味が薄い)。
    """
    py_total = 0
    mjs_total = 0
    py_kinds: dict[str, int] = {}
    mjs_kinds: dict[str, int] = {}
    for slug in _ALL_SLUGS:
        row = corpus_oracle.get(("segments_en", slug))
        if row is None:
            continue
        html = _read_html(slug)
        py = extract_segments_from_html(
            html, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
        )
        mjs = row["expected"]
        py_total += len(py)
        mjs_total += len(mjs)
        for s in py:
            py_kinds[s["segmentKind"]] = py_kinds.get(s["segmentKind"], 0) + 1
        for s in mjs:
            mjs_kinds[s["segmentKind"]] = mjs_kinds.get(s["segmentKind"], 0) + 1
    assert py_total == mjs_total, f"total segment count mismatch: py={py_total} mjs={mjs_total}"
    assert py_kinds == mjs_kinds, f"kind distribution mismatch:\n  py={py_kinds}\n  mjs={mjs_kinds}"
