"""EN HTML 前処理 — ``scripts/lib/turndown.mjs`` の ``preprocessEnHtml`` を port。

Phase 1.0 では scaffolding のみを提供する。実際の entity decode / escaped
details normalization / callout normalization の port は Phase 1.1 で追加する。

mjs 側の extraction hot path (``source_parity_segments_en.mjs`` の先頭で
``preprocessEnHtml`` を呼ぶ) と対応する Python 入口を事前に確保し、
``segments_en.py`` scaffold からの import 解決を成立させる目的。

契約:

- 入力 HTML 文字列を受け取り、``BeautifulSoup`` パース済みツリーを返す
- パーサは ``lxml`` を優先し、失敗時 (segment 0 件) の再試行で ``html5lib``
  を使う (Phase 1.1 で fallback ロジックを追加)
"""

from __future__ import annotations

from bs4 import BeautifulSoup

__all__ = ["preprocess_en_html"]


def preprocess_en_html(html: str, slug: str | None = None) -> BeautifulSoup:
    """Phase 1.0 scaffold — ``lxml`` でパースした soup をそのまま返す。

    Phase 1.1 で以下を追加する:

    - ``codeSnippetCopyButton`` / anchor-only ``<a>`` / ``<thead>`` の除去
    - HTML コメント / ``<script>`` / ``<style>`` / ``<col>`` の除去
    - escaped ``<details>`` normalization
    - slug-scoped callout normalization (``CALLOUT_NORMALIZATION_SLUGS``)
    - lxml 失敗時の html5lib fallback

    ``slug`` 引数は Phase 1.1 の callout normalization で使う。現 scaffold では
    未使用だが、将来の signature 安定のため先に受ける。
    """
    del slug  # Phase 1.1 で使う
    return BeautifulSoup(html, "lxml")
