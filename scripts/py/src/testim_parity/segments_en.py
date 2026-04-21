"""EN HTML canonical segment extractor — ``source_parity_segments_en.mjs`` の port。

Phase 1.0 では scaffolding のみを提供する。本体の tree walker / heading stack /
per-context emitter は Phase 1.2 で実装する。

**Phase 1.0 decision (Library-only)**: Phase 1–3 の Python modules は standalone
library として提供し、pipeline wiring は Phase 4 まで遅延する。mjs 側は当分
``source_parity_segments_en.mjs`` を使い続け、Python 側は conformance test で
byte 一致を保証するだけ。``scripts/detection/check_source_parity.mjs`` からは
本モジュールを呼ばない (mjs 実装のまま)。

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

    mjs 側 ``extractSegmentsFromHtml`` (``source_parity_segments_en.mjs:710`` 付近)
    と同一の return shape を持つ辞書リストを返す契約。Phase 1.2 で以下を実装:

    1. preprocess (regex + BS4 normalization)
    2. tree walk (``walk_block_container``)
    3. heading stack 更新 (``push_heading``)
    4. segment emit (``create_segment``)

    ``slug`` は preprocess の callout normalization slug allowlist 判定に使う。
    """
    soup: BeautifulSoup = preprocess_en_html(html, slug)
    del soup  # Phase 1.2 で walk する
    return []
