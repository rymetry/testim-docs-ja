"""Python port of the testim-docs-ja parity/sync tooling.

**Public API は各モジュールが個別に ``__all__`` で宣言する**。ルートパッケージ
は re-export を行わない (M3 指摘)。Phase 1-4 で leaf が 50+ 追加される見込み
のため、flat な ``__init__.__all__`` では dual maintenance が破綻する。

代わりに ``from testim_parity.<module> import <name>`` を正とする。新規 leaf
を port したら、その module 内の ``__all__`` に name を追加し、conformance
harness (``scripts/py/conformance/harness.mjs``) の DISPATCH へ同時登録する。

現在の module surface:

- ``testim_parity.align_scoring`` — weighted-LCS pair scoring
- ``testim_parity.artifact_registry`` — artifact 除外 registry と coverage
- ``testim_parity.en_source_patches`` — EN HTML patch 適用
- ``testim_parity.extract`` — invariant token 抽出
- ``testim_parity.glossary_mask`` — glossary / invariant マスカー
- ``testim_parity.madcap_toc`` — MadCap Flare TOC パーサ
- ``testim_parity.models`` — 共有 Pydantic DTO
- ``testim_parity.normalize`` — URL 正規化
- ``testim_parity.project`` — プロジェクトファイル索引
- ``testim_parity.segments_shared`` — セグメント生成・指紋
- ``testim_parity.sidebar`` — SIDEBAR_URLS.md パーサ
- ``testim_parity.types`` — severity / pattern 定数
"""

from __future__ import annotations

__version__ = "0.0.1"

__all__ = ["__version__"]
