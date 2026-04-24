"""``testim_parity.tools.emit_corpus_oracle`` / ``summarize_corpus_oracle`` の smoke test。

Phase 6b cutover で mjs ``emit_corpus_oracle.mjs`` を Python 実装に port した
(plan doc Phase 6b 「align 288-matrix golden 化」節参照)。本 test は:

1. emit 実装が 3 suite 全てで非空 JSONL を書けること
2. summarize が JSONL を TSV に正しく整形 + sort すること
3. 各 tool の CLI arg parse が期待通り動くこと

を pin する。byte-identical check (Python live == committed golden) は
``test_*_288_matrix.py`` + CI drift check で行うので本 test ではスコープ外。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

from testim_parity.tools import emit_corpus_oracle, summarize_corpus_oracle


class TestEmitCorpusOracle:
    def test_runs_segments_en_suite_only(self, tmp_path: Path) -> None:
        out = tmp_path / "oracle.jsonl"
        rc = emit_corpus_oracle.main(["--out", str(out), "--suite", "segments_en"])
        assert rc == 0
        rows = [json.loads(line) for line in out.read_text().splitlines() if line.strip()]
        assert len(rows) > 0
        assert all(r["suite"] == "segments_en" for r in rows)
        # canonical schema fields
        for r in rows:
            assert {"schemaVersion", "suite", "slug", "sha256", "expected"} <= r.keys()

    def test_default_all_suites_emits_three_suites(self, tmp_path: Path) -> None:
        out = tmp_path / "oracle.jsonl"
        rc = emit_corpus_oracle.main(["--out", str(out), "--suite", "all"])
        assert rc == 0
        rows = [json.loads(line) for line in out.read_text().splitlines() if line.strip()]
        suites = {r["suite"] for r in rows}
        assert suites == {"segments_en", "turndown", "align"}

    def test_invalid_suite_rejected(self, tmp_path: Path) -> None:
        out = tmp_path / "oracle.jsonl"
        with pytest.raises(SystemExit) as exc:
            emit_corpus_oracle.main(["--out", str(out), "--suite", "bogus"])
        assert exc.value.code == 2

    def test_missing_out_argument_rejected(self) -> None:
        with pytest.raises(SystemExit) as exc:
            emit_corpus_oracle.main(["--suite", "segments_en"])
        assert exc.value.code == 2

    def test_canonical_sha256_matches_committed_golden_row(self) -> None:
        """実 corpus の 1 slug で canonical SHA-256 が committed golden と一致する。"""
        golden_path = (
            Path(__file__).resolve().parents[1]
            / "tests"
            / "conformance"
            / "__oracle__"
            / "corpus_golden.jsonl"
        )
        if not golden_path.exists():
            pytest.skip("committed golden not present; nothing to check")
        for raw in golden_path.read_text().splitlines():
            raw = raw.strip()
            if not raw:
                continue
            row = json.loads(raw)
            assert emit_corpus_oracle._canonical_sha256(row["expected"]) == row["sha256"]
            break  # 1 row で十分


class TestSummarizeCorpusOracle:
    def test_tsv_output_sorted_by_suite_then_slug(self, tmp_path: Path) -> None:
        jsonl = tmp_path / "oracle.jsonl"
        jsonl.write_text(
            "\n".join(
                [
                    json.dumps(
                        {
                            "schemaVersion": 1,
                            "suite": "turndown",
                            "slug": "z-last",
                            "sha256": "deadbeef",
                            "expected": "...",
                        }
                    ),
                    json.dumps(
                        {
                            "schemaVersion": 1,
                            "suite": "segments_en",
                            "slug": "a-first",
                            "sha256": "cafebabe",
                            "expected": [],
                        }
                    ),
                    json.dumps(
                        {
                            "schemaVersion": 1,
                            "suite": "segments_en",
                            "slug": "b-second",
                            "sha256": "feedface",
                            "expected": [],
                        }
                    ),
                ]
            ),
            encoding="utf-8",
        )
        out = tmp_path / "oracle.tsv"
        rc = summarize_corpus_oracle.main(["--in", str(jsonl), "--out", str(out)])
        assert rc == 0
        lines = out.read_text().rstrip("\n").split("\n")
        # (suite, slug) lexicographic: segments_en comes before turndown
        assert lines == [
            "segments_en\ta-first\tcafebabe",
            "segments_en\tb-second\tfeedface",
            "turndown\tz-last\tdeadbeef",
        ]

    def test_empty_jsonl_writes_empty_tsv(self, tmp_path: Path) -> None:
        jsonl = tmp_path / "empty.jsonl"
        jsonl.write_text("", encoding="utf-8")
        out = tmp_path / "empty.tsv"
        rc = summarize_corpus_oracle.main(["--in", str(jsonl), "--out", str(out)])
        assert rc == 0
        assert out.read_text() == "\n"

    def test_missing_in_argument_rejected(self, tmp_path: Path) -> None:
        out = tmp_path / "out.tsv"
        with pytest.raises(SystemExit) as exc:
            summarize_corpus_oracle.main(["--out", str(out)])
        assert exc.value.code == 2

    def test_canonical_json_compact_serialization(self) -> None:
        from testim_parity.tools.emit_corpus_oracle import _canonical_json

        # mjs と同じ compact form (space 無し + sort_keys)
        assert _canonical_json({"b": 2, "a": 1}) == '{"a":1,"b":2}'
