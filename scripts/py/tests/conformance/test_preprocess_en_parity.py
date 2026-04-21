"""``preprocess_en_html`` のクロスランタイム conformance。

mjs ``scripts/lib/turndown.mjs`` の ``preprocessEnHtml`` と Python port が
同じ入力に対して **byte-identical な HTML 文字列** を返すことを保証する。

Phase 1 verification gate の基礎。Phase 1.2 の extractor は本関数の出力に
依存するため、ここで divergence すると下流が連鎖的に壊れる。
"""

from __future__ import annotations

import pytest

from testim_parity.preprocess_en import preprocess_en_html

from ._harness import run_batch

# 代表的な EN snapshot パターン。mjs 側 test (``scripts/__tests__``) と
# en_source_patches registry から拾い、3 normalizer + slug-patch の全分岐を
# 網羅する。新規 divergence パターンを見つけたら、先にここへサンプルを積み、
# conformance を落としてから原因修正する運用。
SAMPLES: list[tuple[str, str | None]] = [
    # 空 / 平易系
    ("", None),
    ("<p>ordinary content</p>", None),
    ("<p>Use &gt; for redirection</p>", None),
    # normalize_escaped_callouts 正例
    ("<p>&gt; Title &gt; &gt; Body text</p>", None),
    ('<p class="x">&gt; Note &gt; &gt; Short body</p>', None),
    # 本文中の &gt; は書き換えない (guard 確認)
    ("<p>The operator &gt; is important. &gt; &gt; But this is not a callout.</p>", None),
    # unescape_details legacy path
    (
        "<p>&lt;details&gt;&lt;summary&gt;Q&lt;/summary&gt; body&lt;/details&gt;</p>",
        None,
    ),
    # normalize_escaped_faq_details 正例 (multi-paragraph broken tree)
    (
        "<p>&lt;details&gt; &lt;summary&gt;Q1&lt;/summary&gt; body1</p>"
        "<p>&lt;/details&gt; &lt;details&gt; &lt;summary&gt;Q2&lt;/summary&gt; body2</p>"
        "<p>&lt;/details&gt;</p>",
        None,
    ),
    # 複数 QnA が同じ <p> に連続する case C
    (
        "<p>&lt;details&gt; &lt;summary&gt;A&lt;/summary&gt; body-a "
        "&lt;/details&gt; &lt;details&gt; &lt;summary&gt;B&lt;/summary&gt; body-b"
        "&lt;/details&gt;</p>",
        None,
    ),
    # prose prefix → faq rewrite は skip、unescape も skip
    (
        "<p>Preamble. &lt;details&gt; inline &lt;/details&gt;</p>",
        None,
    ),
    # unbalanced open/close → no rewrite
    (
        "<p>&lt;details&gt; &lt;summary&gt;Q&lt;/summary&gt; missing close</p>",
        None,
    ),
    # Chain 確認 (callout rewrite + details co-existence)
    (
        "<p>&gt; Note &gt; &gt; Important.</p>"
        "<p>&lt;details&gt;&lt;summary&gt;FAQ&lt;/summary&gt; body&lt;/details&gt;</p>",
        None,
    ),
    # slug-scope patch 経路は slug 有無でのみ切替を確認。実際の patch 内容との
    # conformance は en_source_patches 側 test が担当するため、ここでは
    # 「slug 指定時も mjs と一致すること」だけ確保する。適用対象外 slug を
    # 渡して冪等性を確認する。
    ("<p>slug scope check</p>", "nonexistent/slug"),
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "preprocess_en_html", "args": [html, slug]} for html, slug in SAMPLES]
    return run_batch(repo_root, calls)


def test_preprocess_en_matches_mjs(mjs_results):
    """全 sample で Python 出力が mjs と byte 一致する。"""
    for (html, slug), mjs in zip(SAMPLES, mjs_results, strict=True):
        py = preprocess_en_html(html, slug=slug)
        assert py == mjs, f"divergence for html={html!r} slug={slug!r}:\n  py={py!r}\n  mjs={mjs!r}"
