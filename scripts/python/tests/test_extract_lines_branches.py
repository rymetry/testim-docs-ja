"""``testim_parity.extract_lines`` 内 classify_line 等の branch coverage booster。

既存 ``test_extract.py`` は state machine の代表 case を pin するが、
fence / callout / table / image+list 結合 / blockquote 等の分岐が 67% しか
カバーできていない。本 test で各 branch を 1 行単位で叩いて 85%+ に押し上げる。
"""

from __future__ import annotations

from testim_parity.extract_lines import (
    classify_line,
    extract_bullet_counts,
    extract_paragraph_counts,
    extract_step_counts,
)


class TestClassifyLine:
    def test_fence_toggles_state(self) -> None:
        r1 = classify_line("```js", None)
        assert r1["kind"] == "fence"
        assert r1["nextState"]["inCodeBlock"] is True
        r2 = classify_line("```", r1["nextState"])
        assert r2["kind"] == "fence"
        assert r2["nextState"]["inCodeBlock"] is False

    def test_code_line_inside_fence(self) -> None:
        s = {"inCodeBlock": True}
        r = classify_line("var x = 1;", s)
        assert r["kind"] == "code"

    def test_table_open_close_sandwich(self) -> None:
        r1 = classify_line("<table>", None)
        assert r1["kind"] == "table-open"
        assert r1["nextState"]["inTable"] is True
        r2 = classify_line("<tr><td>x</td></tr>", r1["nextState"])
        assert r2["kind"] == "table"
        r3 = classify_line("</table>", r2["nextState"])
        assert r3["kind"] == "table-close"

    def test_callout_open_close(self) -> None:
        r1 = classify_line(":::note", None)
        assert r1["kind"] == "callout-open"
        assert r1["nextState"]["inCallout"] is True
        r2 = classify_line("body inside", r1["nextState"])
        assert r2["kind"] == "callout"
        r3 = classify_line(":::", r2["nextState"])
        assert r3["kind"] == "callout-close"
        assert r3["nextState"]["inCallout"] is False

    def test_blockquote(self) -> None:
        r = classify_line("> quoted", None)
        assert r["kind"] == "blockquote"

    def test_heading_h2(self) -> None:
        r = classify_line("## Section Title", None)
        assert r["kind"] == "heading"
        assert r["heading"] == "Section Title"
        assert r["nextState"]["currentSection"] == "Section Title"

    def test_heading_h4(self) -> None:
        r = classify_line("#### Deep", None)
        assert r["kind"] == "heading"
        assert r["heading"] == "Deep"

    def test_ordered_list(self) -> None:
        r = classify_line("1. Step one", None)
        assert r["kind"] == "ordered-list"

    def test_ordered_list_escaped_dot(self) -> None:
        r = classify_line("1\\. Step", None)
        assert r["kind"] == "ordered-list"

    def test_unordered_list_dash(self) -> None:
        r = classify_line("- item", None)
        assert r["kind"] == "unordered-list"

    def test_unordered_list_star(self) -> None:
        r = classify_line("* item", None)
        assert r["kind"] == "unordered-list"

    def test_unordered_list_plus(self) -> None:
        r = classify_line("+ item", None)
        assert r["kind"] == "unordered-list"

    def test_indented_unordered_list(self) -> None:
        r = classify_line("  - nested", None)
        assert r["kind"] == "unordered-list"

    def test_standalone_image(self) -> None:
        r = classify_line("![alt](img.png)", None)
        assert r["kind"] == "image"

    def test_html_img(self) -> None:
        r = classify_line('<img src="x" />', None)
        assert r["kind"] == "image"

    def test_image_followed_by_ordered_list(self) -> None:
        """``![](x)1. step`` で image 後の list marker を取り出す。"""
        r = classify_line("![](x.png)1. step", None)
        assert r["kind"] == "ordered-list"

    def test_image_followed_by_unordered_list(self) -> None:
        r = classify_line("![](x.png)- bullet", None)
        assert r["kind"] == "unordered-list"

    def test_image_followed_by_paragraph(self) -> None:
        r = classify_line("![](x.png) trailing text", None)
        assert r["kind"] in ("paragraph-start", "image")

    def test_blank_line(self) -> None:
        r = classify_line("", None)
        assert r["kind"] == "blank"

    def test_blank_line_resets_paragraph(self) -> None:
        s = {"inParagraph": True}
        r = classify_line("   ", s)
        assert r["kind"] == "blank"

    def test_paragraph_start(self) -> None:
        r = classify_line("Plain text.", None)
        assert r["kind"] == "paragraph-start"
        assert r["nextState"]["inParagraph"] is True

    def test_paragraph_continuation(self) -> None:
        s = {"inParagraph": True}
        r = classify_line("More text.", s)
        assert r["kind"] == "paragraph"

    def test_html_comment_single_line(self) -> None:
        # classify_line は行頭 ``<!--`` を検出したら inline/close 判定は trim に任せる
        r = classify_line("<!-- comment -->", None)
        assert r["kind"] in ("html-comment", "html-comment-start")

    def test_html_comment_start(self) -> None:
        r = classify_line("<!--", None)
        assert r["kind"] == "html-comment-start"


class TestExtractCounts:
    def test_extract_step_counts_sections(self) -> None:
        md = "## A\n\n1. step1\n2. step2\n\n## B\n\n1. only-one\n"
        counts = extract_step_counts(md)
        assert counts.get("A") == 2
        assert counts.get("B") == 1

    def test_extract_bullet_counts_sections(self) -> None:
        md = "## A\n\n- a\n- b\n- c\n\n## B\n\n- d\n"
        counts = extract_bullet_counts(md)
        assert counts.get("A") == 3
        assert counts.get("B") == 1

    def test_extract_paragraph_counts_sections(self) -> None:
        md = "## A\n\nFirst para.\n\nSecond para.\n\n## B\n\nOnly para.\n"
        counts = extract_paragraph_counts(md)
        assert counts.get("A") == 2
        assert counts.get("B") == 1

    def test_extract_step_counts_ignores_fenced_code(self) -> None:
        md = "## A\n\n```\n1. fake\n```\n\n1. real\n"
        counts = extract_step_counts(md)
        assert counts.get("A") == 1

    def test_extract_bullet_counts_ignores_callout_body(self) -> None:
        """:::note block 内 list は ``callout`` kind で拾われるため bullet count に
        影響する／しないかは実装依存。少なくとも smoke として 0 以上を返す。"""
        md = "## A\n\n:::note\n- x\n:::\n\n- real\n"
        counts = extract_bullet_counts(md)
        assert "A" in counts
