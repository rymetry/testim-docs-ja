"""Python port of the testim-docs-ja parity/sync tooling.

**Public API は各モジュールが個別に ``__all__`` で宣言する**。ルートパッケージ
は re-export を行わない (M3 指摘)。Phase 1-4 で leaf が 50+ 追加される見込み
のため、flat な ``__init__.__all__`` では dual maintenance が破綻する。

代わりに ``from testim_parity.<module> import <name>`` を正とする。新規 leaf
を port したら、その module 内の ``__all__`` に name を追加し、conformance
harness (``scripts/py/conformance/harness.mjs``) の DISPATCH へ同時登録する。

現在の module surface (Phase 3 M4 時点、layer 順):

**基盤 (Phase 0)**:

- ``testim_parity.align_scoring`` — weighted-LCS pair scoring
- ``testim_parity.artifact_registry`` — artifact 除外 registry と coverage
- ``testim_parity.en_source_patches`` — EN HTML patch 適用
- ``testim_parity.extract`` — markdown / HTML 構造抽出 + invariant token
- ``testim_parity.glossary_mask`` — glossary / invariant マスカー
- ``testim_parity.madcap_toc`` — MadCap Flare TOC パーサ
- ``testim_parity.models`` — 共有 Pydantic DTO
- ``testim_parity.normalize`` — URL 正規化
- ``testim_parity.project`` — プロジェクトファイル索引
- ``testim_parity.segments_shared`` — セグメント生成・指紋
- ``testim_parity.sidebar`` — SIDEBAR_URLS.md パーサ
- ``testim_parity.types`` — severity / pattern 定数

**Segment extractors (Phase 1-2)**:

- ``testim_parity.preprocess_en`` — EN HTML 前処理 (callout / details 正規化)
- ``testim_parity.segments_en`` — BS4 / lxml ベース EN segment 抽出
- ``testim_parity.segments_ja`` — markdown-it-py hybrid JA segment 抽出
- ``testim_parity.segments_ja_html`` — JA 用 HTML / details / table helpers

**基盤 predicates/registry (Phase 3 M1)**:

- ``testim_parity.summary_format`` — CLI 用 summary section formatter
- ``testim_parity.issue_state`` — parity issue の 9 状態判定述語
- ``testim_parity.sync_exclusions`` — source-side debt registry
- ``testim_parity.page_coverage`` — page-level completeness gate

**中規模 supporting (Phase 3 M2)**:

- ``testim_parity.acknowledgements`` — ack fingerprint + schema validation +
  issue tagging
- ``testim_parity.advisory_queue`` — tokenless near-tie review queue
- ``testim_parity.source_usability`` — Layer 1/2/3 source usability detector
- ``testim_parity.sync_health`` — ``source-sync-status.json`` builder

**比較エンジン (Phase 3 M3-M4)**:

- ``testim_parity.structure`` — canonical block sequence comparator (3 stage)
- ``testim_parity.checks`` — count / shape / heuristic 比較 (segment 単位)
- ``testim_parity.align`` — weighted LCS alignment + ParityDiff 生成

Phase 3 M5-M7 (baseline / summary / mutation_corpus / detection_reports) は
別 PR で追加予定。
"""

from __future__ import annotations

__version__ = "0.0.1"

__all__ = ["__version__"]
