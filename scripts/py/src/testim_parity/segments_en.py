"""EN HTML canonical segment extractor — ``source_parity_segments_en.mjs`` の port。

Phase 1.0 scaffold + Phase 1.1 で preprocess 層を port。tree walker / heading
stack / per-context emitter は Phase 1.2 で実装する。

**Phase 1.0 decision (Library-only)**: Phase 1–3 の Python modules は standalone
library として提供し、pipeline wiring は Phase 4 まで遅延する。mjs 側は当分
``source_parity_segments_en.mjs`` を使い続け、Python 側は conformance test で
byte 一致を保証するだけ。

Issue #368 の根本原因 (JA parser の line-based regex) を解くため、Phase 2 で
markdown-it-py AST を採用する。本モジュール (EN 側) は BS4 ベースでネスト ``<li>``
を 1 segment へフラット化する既存挙動を **維持** する (mjs と byte 一致)。
"""

from __future__ import annotations

from bs4 import BeautifulSoup

from .preprocess_en import preprocess_en_html

__all__ = ["extract_segments_from_html"]


def extract_segments_from_html(html: str, slug: str | None = None) -> list[dict[str, object]]:
    """Phase 1.0 scaffold — 空 segment list を返す (本体は Phase 1.2)。

    mjs 側 ``extractSegmentsFromHtml`` (``source_parity_segments_en.mjs:710``
    付近) と同一の return shape を持つ辞書リストを返す契約。Phase 1.2 で:

    1. ``preprocess_en_html`` で slug-scoped normalization (実装済み)
    2. BS4 で tree build (``BeautifulSoup(html, "lxml")``)
    3. walk_block_container で tree walk
    4. heading stack 更新 (``push_heading``)
    5. segment emit (``create_segment``)
    """
    normalized = preprocess_en_html(html, slug)
    # Phase 1.2 で ``BeautifulSoup(normalized, "lxml")`` して walk する。
    # scaffold 段階では parse だけ回して BS4/lxml 連携が壊れていないことを
    # smoke-test しておく。
    _soup: BeautifulSoup = BeautifulSoup(normalized, "lxml")
    return []
