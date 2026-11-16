"""JA markdown canonical segment extractor。

JA Markdown body を ``render_ja_markdown`` で HTML にレンダリングし、EN と同じ
``extract_segments_from_document_html`` で segment 列を抽出する。EN / JA が同じ walker を
通るため、list / callout / details / table / code の分類規則は 1 箇所にしかない。

JA 側の segment は ``line`` を持たない (``None``)。
"""

from __future__ import annotations

from typing import Any

from .ja_render import render_ja_markdown
from .segments_en import extract_segments_from_document_html

__all__ = ["extract_segments_from_markdown"]


def extract_segments_from_markdown(body: object) -> list[dict[str, Any]]:
    """JA markdown document body から canonical segment 列を抽出する。

    input が string でなければ ``[]``。frontmatter と title H1 は renderer が除去する。
    """
    if not isinstance(body, str):
        return []
    return extract_segments_from_document_html(render_ja_markdown(body))
