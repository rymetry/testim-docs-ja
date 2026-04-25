"""``testim_parity.tools.emit_corpus_oracle`` / ``summarize_corpus_oracle`` の smoke test。

Phase 6b cutover で mjs ``emit_corpus_oracle.mjs`` を Python 実装に port した
(SYSTEM_SPEC Phase 6b 「align 288-matrix golden 化」節参照)。本 test は:

1. emit 実装が 3 suite 全てで非空 JSONL を書けること
2. summarize が JSONL を TSV に正しく整形 + sort すること
3. 各 tool の CLI arg parse が期待通り動くこと

を pin する。byte-identical check (Python live == committed golden) は
``test_*_288_matrix.py`` + CI drift check で行うので本 test ではスコープ外。

## Fast gate 対応 (PR #389 レビュー P2 対応)

2026-04-24/25 レビューで「fast/corpus gate で 288-page oracle 生成が重い」指摘を
受け、pytest では ``monkeypatch`` で 2-page mini corpus (snapshots + JA md を tmp
に mock) を差し込む。現在は 1 scenario につき 2 slug を処理するだけなので数百 ms
で完走する。real corpus の値保証は ``test_*_288_matrix.py`` の 1 slug = 1 test
conformance と ``npm run test:py:corpus:regen`` の手動再生成で担保する。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from testim_parity.tools import emit_corpus_oracle, summarize_corpus_oracle

_MINI_HTML = """<html><body>
<h1>Page {slug}</h1>
<h2>Section A</h2>
<p>Para {slug} alpha.</p>
<ul><li>Bullet {slug} one</li><li>Bullet {slug} two</li></ul>
</body></html>
"""

_MINI_JA = """---
title: Page {slug}
category: overview
slug: {slug}
lastUpdated: 2026-01-01T00:00:00.000Z
---

# Page {slug}

## Section A

Para {slug} alpha。

- Bullet {slug} one
- Bullet {slug} two
"""


def _mini_corpus(tmp_path: Path, slugs: list[str]) -> tuple[Path, Path]:
    """2-slug mini corpus を tmp に作り、``(en_snapshot_root, ja_docs_root)`` を返す。

    ``emit_corpus_oracle`` module global の ``_EN_SNAPSHOT_ROOT`` / ``_JA_DOCS_ROOT``
    を monkeypatch でこのファクトリの戻り値に差し替えて使う。
    """
    en_root = tmp_path / "snapshots" / "en" / "content"
    ja_root = tmp_path / "src" / "content" / "docs"
    for slug in slugs:
        en_path = en_root / f"{slug}.html"
        en_path.parent.mkdir(parents=True, exist_ok=True)
        en_path.write_text(_MINI_HTML.format(slug=slug), encoding="utf-8")
        ja_path = ja_root / f"{slug}.md"
        ja_path.parent.mkdir(parents=True, exist_ok=True)
        ja_path.write_text(_MINI_JA.format(slug=slug), encoding="utf-8")
    return en_root, ja_root


@pytest.fixture
def mini_corpus(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> tuple[Path, Path, list[str]]:
    """2-page mini corpus + monkeypatch で ``emit_corpus_oracle`` module root を差し替え。"""
    slugs = ["mini/page-one", "mini/page-two"]
    en_root, ja_root = _mini_corpus(tmp_path, slugs)
    monkeypatch.setattr(emit_corpus_oracle, "_EN_SNAPSHOT_ROOT", en_root)
    monkeypatch.setattr(emit_corpus_oracle, "_JA_DOCS_ROOT", ja_root)
    return en_root, ja_root, slugs


class TestEmitCorpusOracleFast:
    """2-page mini corpus を使った fast gate 用 smoke。各 test 数百 ms 以内に完走する。"""

    def test_segments_en_suite_only(
        self, tmp_path: Path, mini_corpus: tuple[Path, Path, list[str]]
    ) -> None:
        _, _, slugs = mini_corpus
        out = tmp_path / "oracle.jsonl"
        rc = emit_corpus_oracle.main(["--out", str(out), "--suite", "segments_en"])
        assert rc == 0
        rows = [json.loads(line) for line in out.read_text().splitlines() if line.strip()]
        assert len(rows) == len(slugs)
        assert all(r["suite"] == "segments_en" for r in rows)
        for r in rows:
            assert {"schemaVersion", "suite", "slug", "sha256", "expected"} <= r.keys()

    def test_all_suites(self, tmp_path: Path, mini_corpus: tuple[Path, Path, list[str]]) -> None:
        """``--suite all`` で 3 suite × 2 slug = 6 rows が出る (align は JA md 有)。"""
        _, _, slugs = mini_corpus
        out = tmp_path / "oracle.jsonl"
        rc = emit_corpus_oracle.main(["--out", str(out), "--suite", "all"])
        assert rc == 0
        rows = [json.loads(line) for line in out.read_text().splitlines() if line.strip()]
        suites = {r["suite"] for r in rows}
        assert suites == {"segments_en", "turndown", "align"}
        # 3 suite × 2 slug = 6 rows (各 suite で slug カバレッジが同じ)
        assert len(rows) == 3 * len(slugs)

    def test_turndown_suite_produces_string_expected(
        self, tmp_path: Path, mini_corpus: tuple[Path, Path, list[str]]
    ) -> None:
        """turndown suite の ``expected`` は string (MD text)。"""
        out = tmp_path / "oracle.jsonl"
        rc = emit_corpus_oracle.main(["--out", str(out), "--suite", "turndown"])
        assert rc == 0
        rows = [json.loads(line) for line in out.read_text().splitlines() if line.strip()]
        for r in rows:
            assert isinstance(r["expected"], str)

    def test_align_suite_skipped_when_ja_missing(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """JA md が無い slug は align row を emit しない (optional suite 扱い)。"""
        en_root = tmp_path / "snapshots" / "en" / "content"
        ja_root = tmp_path / "src" / "content" / "docs"
        # EN only (JA は作らない)
        en_path = en_root / "no-ja.html"
        en_path.parent.mkdir(parents=True, exist_ok=True)
        en_path.write_text(_MINI_HTML.format(slug="no-ja"), encoding="utf-8")
        ja_root.mkdir(parents=True, exist_ok=True)

        monkeypatch.setattr(emit_corpus_oracle, "_EN_SNAPSHOT_ROOT", en_root)
        monkeypatch.setattr(emit_corpus_oracle, "_JA_DOCS_ROOT", ja_root)

        out = tmp_path / "oracle.jsonl"
        rc = emit_corpus_oracle.main(["--out", str(out), "--suite", "align"])
        assert rc == 0
        # align rows は 0 件 (JA 欠落時は skip される)
        rows = [json.loads(line) for line in out.read_text().splitlines() if line.strip()]
        assert rows == []

    def test_invalid_suite_rejected(self, tmp_path: Path) -> None:
        out = tmp_path / "oracle.jsonl"
        with pytest.raises(SystemExit) as exc:
            emit_corpus_oracle.main(["--out", str(out), "--suite", "bogus"])
        assert exc.value.code == 2

    def test_missing_out_argument_rejected(self) -> None:
        with pytest.raises(SystemExit) as exc:
            emit_corpus_oracle.main(["--suite", "segments_en"])
        assert exc.value.code == 2

    def test_empty_snapshot_root_returns_error(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """EN snapshot 無しなら exit 3 (``check:snapshots:fetch`` を走らせろ)。"""
        monkeypatch.setattr(emit_corpus_oracle, "_EN_SNAPSHOT_ROOT", tmp_path / "empty")
        out = tmp_path / "oracle.jsonl"
        rc = emit_corpus_oracle.main(["--out", str(out), "--suite", "all"])
        assert rc == 3


class TestCanonicalization:
    def test_canonical_sha256_matches_committed_golden_row(self) -> None:
        """実 corpus の 1 slug で canonical SHA-256 が committed golden と一致する。

        Real golden 1 行分の sha256 と ``_canonical_sha256(row["expected"])``
        が一致するか確認。実行時間は 1-2ms (golden 1 行パースするだけ)。
        """
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
            break

    def test_canonical_json_compact_serialization(self) -> None:
        from testim_parity.tools.emit_corpus_oracle import _canonical_json

        # mjs と同じ compact form (space 無し + sort_keys)
        assert _canonical_json({"b": 2, "a": 1}) == '{"a":1,"b":2}'


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
