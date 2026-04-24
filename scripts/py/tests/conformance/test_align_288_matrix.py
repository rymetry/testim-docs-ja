"""288-page corpus での ``align_segments`` の byte-identical conformance。

Phase 6b cutover 前は mjs harness を毎回 spawn して align の byte parity を
確認していたが、mjs 削除に伴い **committed golden JSONL 比較** に移行した。
oracle は ``scripts/py/tests/conformance/__oracle__/corpus_golden.jsonl`` の
``suite="align"`` 行を読み、slug 毎に ``align_segments`` の出力を canonical
SHA-256 で比較する。Phase 6a の segments_en / turndown と同じ契約で ``corpus``
marker に合流し、pytest-xdist の worker に均等分散する。

Drift 検知:

1. ``npm run test:py:corpus:drift`` で summarize(committed JSONL) vs committed
   TSV を比較し、committed golden 側の tamper を検出する
2. 本 test が Python ``align_segments`` の live output を committed JSONL と
   byte 比較して Python 側の drift を検出する

Phase 6b atomic cutover PR で align golden を commit し、mjs 削除と同時に本 test
を committed 読み込みに書き換えた (plan doc Phase 6b 「align 288-matrix golden 化」節)。
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

import pytest

from testim_parity.align import align_segments
from testim_parity.project import ROOT_DIR
from testim_parity.segments_en import CALLOUT_NORMALIZATION_SLUGS, extract_segments_from_html
from testim_parity.segments_ja import extract_segments_from_markdown

pytestmark = pytest.mark.corpus

_GOLDEN_PATH = (Path(__file__).parent / "__oracle__" / "corpus_golden.jsonl").resolve()


def _canonical_sha256(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def _load_align_golden() -> dict[str, dict[str, Any]]:
    """committed golden JSONL から ``suite="align"`` 行のみ抽出して slug 辞書で返す。"""
    if not _GOLDEN_PATH.exists():
        pytest.skip(
            f"committed align golden not found at {_GOLDEN_PATH}. "
            "Run ``npm run test:py:corpus:regen`` to emit it."
        )
    by_slug: dict[str, dict[str, Any]] = {}
    for raw in _GOLDEN_PATH.read_text(encoding="utf-8").splitlines():
        raw = raw.strip()
        if not raw:
            continue
        row = json.loads(raw)
        if row.get("suite") != "align":
            continue
        by_slug[row["slug"]] = row
    return by_slug


def _extract_ja_body(md_content: str) -> str:
    without_fm = re.sub(r"^---[\s\S]*?---\n", "", md_content, count=1, flags=re.MULTILINE)
    return without_fm.strip()


def _align_slugs() -> list[str]:
    golden = _load_align_golden()
    return sorted(golden.keys())


@pytest.mark.parametrize("slug", _align_slugs())
def test_align_byte_identical_with_committed_golden(slug: str) -> None:
    """slug 毎に ``align_segments`` の live 出力が committed golden と byte 一致。

    Phase 6b cutover で mjs authority 削除後、**committed JSONL が唯一の
    authoritative oracle**。本 test が fail したら Python 側の drift なので、
    root cause (``segments_en`` / ``segments_ja`` / ``align`` の変更) を特定して
    必要なら content / parser 側を修正 + golden を regenerate する。
    """
    golden = _load_align_golden()
    expected_row = golden[slug]

    en_snapshot = (
        (ROOT_DIR / "snapshots" / "en" / "content" / f"{slug}.html").read_bytes().decode("utf-8")
    )
    ja_md_path = ROOT_DIR / "src" / "content" / "docs" / f"{slug}.md"
    if not ja_md_path.exists():
        pytest.skip(f"JA markdown missing for {slug}")
    ja_body = _extract_ja_body(ja_md_path.read_text(encoding="utf-8"))

    en_segments = extract_segments_from_html(
        en_snapshot, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
    )
    ja_segments = extract_segments_from_markdown(ja_body)

    try:
        actual = {"ok": True, "result": align_segments(en_segments, ja_segments, slug=slug)}
    except Exception as exc:  # noqa: BLE001 — match mjs-side outer catch
        actual = {"ok": False, "error": str(exc)}

    expected = expected_row["expected"]
    assert actual == expected, (
        f"align drift for {slug}: live output differs from committed golden. "
        f"Re-run ``npm run test:py:corpus:regen`` if the change is intentional."
    )

    # sha256 も独立に検証 (tamper 防止の二重 gate)
    assert _canonical_sha256(actual) == expected_row["sha256"], (
        f"align sha256 drift for {slug}: {_canonical_sha256(actual)} vs "
        f"committed {expected_row['sha256']}"
    )
