"""testim-docs-ja の同期、検出、翻訳、保守ツール。

Public API は各モジュールが個別に ``__all__`` で宣言する。ルートパッケージは
re-export を行わず、``from testim_parity.<module> import <name>`` を正とする。

主な責務:

- ``testim_parity.detection``: パリティ確認、スナップショット取得、差分検出
- ``testim_parity.pipeline``: 英語原文取得、プレースホルダー生成、LLM 翻訳適用
- ``testim_parity.tools``: lint、正規化、frontmatter 同期、表記ゆれ修正
- ``testim_parity.*``: segment 抽出、align、baseline、summary、MadCap TOC などの共有基盤
"""

from __future__ import annotations

__version__ = "0.0.1"

__all__ = ["__version__"]
