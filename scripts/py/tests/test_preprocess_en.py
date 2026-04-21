"""``testim_parity.preprocess_en`` のユニットテスト。

Phase 1.1 で port した 3 normalizer + full chain の挙動を固定する。
cross-runtime conformance は ``tests/conformance/test_preprocess_en_parity.py``
が担当するため、ここでは入出力の妥当性と edge case guard に集中する。
"""

from __future__ import annotations

import pytest

from testim_parity.preprocess_en import preprocess_en_html


class TestNormalizeEscapedCallouts:
    def test_basic_callout_rewrite(self):
        html = "<p>&gt; Title &gt; &gt; Body text</p>"
        out = preprocess_en_html(html)
        assert out == '<div class="note"><p>Body text</p></div>'

    def test_text_before_gt_left_unchanged(self):
        """本文中の ``&gt;`` は callout ではないため書き換えない。"""
        html = "<p>Use &gt; to redirect output</p>"
        assert preprocess_en_html(html) == html

    def test_missing_separator_left_unchanged(self):
        """``&gt; &gt;`` 区切りがない場合は書き換えない。"""
        html = "<p>&gt; Just a single arrow</p>"
        assert preprocess_en_html(html) == html

    def test_empty_body_left_unchanged(self):
        html = "<p>&gt; Title &gt; &gt;   </p>"
        assert preprocess_en_html(html) == html

    def test_truncated_attribute_guard(self):
        """value 内の ``>`` で tag が切れたケースは書き換えない (safety guard)。"""
        html = '<p class="warn">">&gt; Title &gt; &gt; Body</p>'
        assert preprocess_en_html(html) == html


class TestNormalizeEscapedFaqDetails:
    def test_balanced_multi_paragraph_rewrite(self):
        """case A: ``<p>&lt;details&gt;...&lt;summary&gt;Q&lt;/summary&gt; body``。"""
        html = (
            "<p>&lt;details&gt; &lt;summary&gt;Q1&lt;/summary&gt; body1</p>"
            "<p>&lt;/details&gt; &lt;details&gt; &lt;summary&gt;Q2&lt;/summary&gt; body2</p>"
            "<p>&lt;/details&gt;</p>"
        )
        out = preprocess_en_html(html)
        assert "<h2>Q1</h2>" in out
        assert "<h2>Q2</h2>" in out
        # 残存 escaped marker は掃除される
        assert "&lt;details" not in out
        assert "&lt;/details" not in out

    def test_unbalanced_open_close_left_unchanged(self):
        """open と close の件数不一致 → rewrite を skip (source-unusable 経路)。"""
        html = "<p>&lt;details&gt; &lt;summary&gt;Q&lt;/summary&gt; body</p>"
        # close がないので rewrite なし → callout 経路も通らず原文維持
        out = preprocess_en_html(html)
        assert "<h2>" not in out

    def test_prose_prefix_left_unchanged(self):
        """``<p>`` 先頭が substantive text の場合は rewrite を skip。"""
        html = (
            "<p>Here are some examples &lt;details&gt; &lt;summary&gt;Q&lt;/summary&gt;"
            " body&lt;/details&gt;</p>"
        )
        out = preprocess_en_html(html)
        # case A / B のいずれのパターンにも一致しない
        assert "<h2>" not in out


class TestUnescapeDetails:
    def test_legacy_single_paragraph_escaped_details(self):
        """legacy パス: ``<p>&lt;details&gt;...&lt;/details&gt;</p>`` を real ``<details>`` に。"""
        html = "<p>&lt;details&gt;&lt;summary&gt;Q&lt;/summary&gt; body&lt;/details&gt;</p>"
        out = preprocess_en_html(html)
        assert out.startswith("<details>")
        assert "<summary>Q</summary>" in out
        assert out.endswith("</details>")

    def test_entity_only_html_unchanged(self):
        html = "<p>Plain text without entities</p>"
        assert preprocess_en_html(html) == html

    def test_mid_paragraph_entities_untouched(self):
        """先頭が escaped ``<details>`` でなければ書き換えない。"""
        html = "<p>Preamble. &lt;details&gt; inline example &lt;/details&gt;</p>"
        assert preprocess_en_html(html) == html


class TestPreprocessEnHtmlEntry:
    def test_type_error_on_non_string(self):
        with pytest.raises(TypeError):
            preprocess_en_html(None)  # type: ignore[arg-type]

    def test_empty_input_returns_empty(self):
        assert preprocess_en_html("") == ""

    def test_slug_disabled_when_missing(self):
        """slug 未指定時は en_source_patches を適用しない。"""
        html = "<p>ordinary content</p>"
        assert preprocess_en_html(html) == html

    def test_idempotent_on_already_normalized(self):
        """正規化済みの HTML に再適用しても同じ結果を返す。"""
        html = "<p>nothing to normalize</p>"
        once = preprocess_en_html(html)
        twice = preprocess_en_html(once)
        assert once == twice
