"""EN (patched) HTML と JA rendered HTML の DOM 構造比較。

``checks.compare_snapshot_structure`` (turndown markdown + 行 regex) の置き換え。
issue type / severity / detail wording は同一契約で、``code-block-count-mismatch``
だけが追加。JA 側は ``ja_render.render_ja_markdown`` の出力を受け取る。

数え方 (両側同一):

- 見出し: 他の内容より前にある最初の ``<h1>`` は title として除外し、以降の
  ``<h1>`` は h2 として扱う (MadCap は本文 section に ``<h1>`` を使う)。
  section 境界は H2-H4。
- step / bullet: ``table`` の外にある ``ol > li`` / ``ul > li`` (画像のみの item も
  数える)。table cell 内の list は JA で ``<br>`` 区切りに書かれるため cell 比較に任せる。
- 段落: ``li`` / ``table`` / ``blockquote`` / ``details`` / callout の外にある
  ``<p>`` のうち、テキストを持つもの (空・画像のみ・zero-width のみは除外)。
  加えて list item 内の継続段落 (item 直下の ``<p>`` のうち、item 本文を包む先頭
  ``<p>`` を除いたもの) も段落として数える。MadCap の ``<p>`` を持たない本文も
  同じ位置にあれば段落とする: ``.MCDropDownHead`` 1 つ、および block container
  直下で block 要素に区切られた bare text の run 1 つ (どちらも segment 抽出では
  paragraph になる)。
- コードブロック: ``table`` の外にある ``<pre>``。
- table: ``extract_html_tables`` + 既存の cell 比較。cell 内の
  ``span.FileOrFilePath`` は ``<code>`` と同じく token 化し、``<br>`` と block
  境界には空白を入れて隣接テキストの融合を防ぐ。
- callout nesting: callout div が ``li`` 内か否か (top-level / nested の 2 値)。JA の
  ``data-line`` を ``line`` に載せる。

旧 Markdown checker との意図的な差分:

- nested ``ol`` の step も数える (旧は column-0 の番号行のみ)。
- callout / blockquote 内の list と、callout 内の見出しも数える (旧は callout 内を skip)。
- table cell 内の list item は数えない (旧も table 行を skip していたので実質同じ)。
- list item 内の継続段落は上記の規則で数える (旧はインデントされた段落行として数えていた)。
"""

from __future__ import annotations

import html
import re
from typing import Any

from bs4 import BeautifulSoup, NavigableString, Tag

from .checks import _apply_artifacts, _compare_section_counts, _compare_tables, _with_severity
from .extract import extract_html_tables
from .segments_en import CALLOUT_NORMALIZATION_SLUGS, _clean_soup, _is_callout_div

__all__ = ["compare_html_structure"]

_HEADING_RE = re.compile(r"^h[1-6]$")
_CELL_BLOCK_TAGS = ("p", "div", "ul", "ol", "li", "pre", "blockquote", "h1", "h2", "h3", "h4")
_TABLE = frozenset({"table"})
_PARAGRAPH_EXCLUDED = frozenset({"li", "table", "blockquote", "details"})
# 段落を直接持ち得る block container と、その中で inline run を区切る block 要素。
_BARE_TEXT_CONTAINERS = frozenset({"body", "div", "section", "article", "main", "ol", "ul"})
_BLOCK_TAGS = frozenset(
    {"p", "div", "ol", "ul", "li", "table", "pre", "blockquote", "details", "figure", "hr"}
    | {f"h{n}" for n in range(1, 7)}
)
_ZERO_WIDTH = dict.fromkeys(map(ord, "\u200b\u200c\u200d\ufeff"))


def _text(node: Tag) -> str:
    return " ".join(node.get_text().translate(_ZERO_WIDTH).split())


def _parse(source: str, slug: str | None, allow: frozenset[str] | None) -> tuple[Tag, list[Any]]:
    """soup root と table 一覧を返す。table は thead を含めるため clean 前に取る。"""
    soup = BeautifulSoup(source, "lxml")
    root: Tag = soup.body if soup.body is not None else soup
    for cell in root.find_all(["td", "th"]):
        for span in cell.find_all("span", class_="FileOrFilePath"):
            span.name = "code"
        for br in cell.find_all("br"):
            br.replace_with(" ")
        for block in cell.find_all(_CELL_BLOCK_TAGS):
            block.insert_before(" ")
            block.insert_after(" ")
    tables = extract_html_tables(str(root))
    for table in tables:
        table["rows"] = [[html.unescape(cell) for cell in row] for row in table["rows"]]
    _clean_soup(soup, slug=slug, callout_allow_slugs=allow)
    return root, tables


def _headings(root: Tag) -> list[tuple[int, str, Tag]]:
    out: list[tuple[int, str, Tag]] = []
    for index, node in enumerate(root.find_all(_HEADING_RE)):
        level = int(node.name[1])
        if level == 1:
            is_title = index == 0 and node.find_previous("img") is None
            is_title = is_title and not any(
                s.translate(_ZERO_WIDTH).strip() for s in node.find_all_previous(string=True)
            )
            if is_title:
                continue
            level = 2
        out.append((level, _text(node), node))
    return out


def _inside(node: Tag | NavigableString, names: frozenset[str], callouts: bool) -> bool:
    return any(p.name in names or (callouts and _is_callout_div(p)) for p in node.parents)


def _counts(root: Tag, headings: list[tuple[int, str, Tag]]) -> dict[str, dict[str, int]]:
    """section 見出し別の step / bullet / paragraph / code 数 (key 順は文書順)。"""
    section_of = {id(node): text for level, text, node in headings if level <= 4}
    counts: dict[str, dict[str, int]] = {k: {} for k in ("step", "bullet", "para", "code")}
    section = "__top__"
    for node in root.descendants:
        if isinstance(node, NavigableString):
            if _starts_bare_text_paragraph(node):
                counts["para"][section] = counts["para"].get(section, 0) + 1
            continue
        if not isinstance(node, Tag):
            continue
        if id(node) in section_of:
            section = section_of[id(node)]
            for per_section in counts.values():
                per_section.setdefault(section, 0)
            continue
        kind = None
        parent = node.parent.name if node.parent is not None else None
        if node.name == "li" and parent in ("ol", "ul") and not _inside(node, _TABLE, False):
            kind = "step" if parent == "ol" else "bullet"
            if not _inside(node, _PARAGRAPH_EXCLUDED - {"li"}, True):
                counts["para"][section] = counts["para"].get(section, 0) + _continuations(node)
        elif node.name == "p" and _text(node) and not _inside(node, _PARAGRAPH_EXCLUDED, True):
            kind = "para"
        elif (
            "MCDropDownHead" in (node.get("class") or [])
            and _text(node)
            and not _inside(node, _PARAGRAPH_EXCLUDED, True)
        ):
            kind = "para"  # MadCap dropdown head: 段落 segment として抽出される見出しテキスト
        elif node.name == "pre" and not _inside(node, _TABLE, False):
            kind = "code"
        if kind:
            counts[kind][section] = counts[kind].get(section, 0) + 1
    return counts


def _starts_bare_text_paragraph(text: NavigableString) -> bool:
    """block container 直下の bare text run (MadCap が ``<p>`` を落とした本文) の先頭か。

    run は block 要素で区切られた inline 兄弟の並び。run 内の最初の非空白 text だけが
    True を返すので、1 run = 1 段落になる。
    """
    parent = text.parent
    if type(text) is not NavigableString:  # Comment / Doctype 等は本文ではない
        return False
    if parent is None or parent.name not in _BARE_TEXT_CONTAINERS:
        return False
    if not str(text).translate(_ZERO_WIDTH).strip():
        return False
    if _is_callout_div(parent) or _inside(text, _PARAGRAPH_EXCLUDED, True):
        return False
    for sibling in text.previous_siblings:
        if isinstance(sibling, Tag) and sibling.name in _BLOCK_TAGS:
            return True
        if type(sibling) is NavigableString and str(sibling).translate(_ZERO_WIDTH).strip():
            return False
    return True


def _continuations(item: Tag) -> int:
    """list item 内の継続段落数。item 本文を包む先頭 ``<p>`` (loose list / MadCap) は除く。"""
    paragraphs = [p for p in item.find_all("p", recursive=False) if isinstance(p, Tag)]
    count = sum(1 for p in paragraphs if _text(p))
    first = next((c for c in item.children if not (isinstance(c, str) and not c.strip())), None)
    if paragraphs and first is paragraphs[0] and _text(paragraphs[0]):
        count -= 1
    return count


def _artifacts(root: Tag) -> list[str]:
    artifacts: list[str] = []
    if root.find("details") is not None:
        artifacts.append("EN uses <details> blocks")
    total = len(_text(root))
    pre = sum(len(_text(node)) for node in root.find_all("pre"))
    if total and pre > total * 0.5:
        artifacts.append("EN body largely wrapped in code fence")
    return artifacts


def _callout_nesting_issues(en_root: Tag, ja_root: Tag) -> list[dict[str, Any]]:
    en_callouts = en_root.find_all(_is_callout_div)
    ja_callouts = ja_root.find_all(_is_callout_div)
    if len(en_callouts) != len(ja_callouts):
        return []
    issues: list[dict[str, Any]] = []
    for index, (en, ja) in enumerate(zip(en_callouts, ja_callouts, strict=True)):
        # old contract は top-level / nested の 2 値 (extract_callout_positions の depth 0/1)
        en_depth = min(len(en.find_parents("li")), 1)
        ja_depth = min(len(ja.find_parents("li")), 1)
        if en_depth == ja_depth:
            continue
        line = ja.get("data-line")
        en_level = "トップレベル" if en_depth == 0 else "ネスト"
        ja_level = "トップレベル" if ja_depth == 0 else "ネスト"
        issues.append(
            _with_severity(
                {
                    "type": "callout-nesting-mismatch",
                    "line": int(line) if isinstance(line, str) and line.isdigit() else None,
                    "detail": f"callout #{index + 1}: EN={en_level} → JA={ja_level}",
                }
            )
        )
    return issues


def _heading_issues(
    en_headings: list[tuple[int, str, Tag]], ja_headings: list[tuple[int, str, Tag]]
) -> list[dict[str, Any]]:
    issues: list[dict[str, Any]] = []
    en_sections = sum(1 for level, _, _ in en_headings if level <= 4)
    ja_sections = sum(1 for level, _, _ in ja_headings if level <= 4)
    if en_sections > 0 and en_sections != ja_sections:
        issues.append(
            _with_severity(
                {
                    "type": "section-count-mismatch",
                    "detail": f"H2-H4 セクション数: EN={en_sections}, JA={ja_sections}",
                }
            )
        )
    mismatches = [
        (en, ja) for en, ja in zip(en_headings, ja_headings, strict=False) if en[0] != ja[0]
    ]
    if mismatches:
        examples = "; ".join(f"EN H{en[0]} '{en[1]}' → JA H{ja[0]}" for en, ja in mismatches[:3])
        issues.append(
            _with_severity(
                {
                    "type": "heading-mismatch",
                    "detail": f"見出しレベル不一致 ({len(mismatches)}件): {examples}",
                }
            )
        )
    return issues


def _count_issues(en: dict[str, dict[str, int]], ja: dict[str, dict[str, int]]) -> list[Any]:
    issues: list[dict[str, Any]] = []
    en_steps, ja_steps = sum(en["step"].values()), sum(ja["step"].values())
    if en_steps > 0 and ja_steps > 0 and en_steps != ja_steps:
        diff = ja_steps - en_steps
        direction = "多い" if diff > 0 else "少ない"
        issues.append(
            _with_severity(
                {
                    "type": "step-count-mismatch",
                    "detail": (
                        f"番号付きステップ数が原文と異なります: EN={en_steps}, JA={ja_steps} "
                        f"({abs(diff)} {direction})"
                    ),
                }
            )
        )
    for kind, issue_type, label in (
        ("step", "step-count-mismatch", "ステップ数"),
        ("bullet", "bullet-count-mismatch", "箇条書き数"),
        ("para", "paragraph-count-mismatch", "段落数"),
        ("code", "code-block-count-mismatch", "コードブロック数"),
    ):
        issues.extend(_compare_section_counts(en[kind], ja[kind], issue_type, label))
    en_code, ja_code = sum(en["code"].values()), sum(ja["code"].values())
    if en_code != ja_code and not any(i["type"] == "code-block-count-mismatch" for i in issues):
        # 見出しの無いページでも code block 数は比較する (_compare_section_counts は skip する)
        diff = ja_code - en_code
        issues.append(
            _with_severity(
                {
                    "type": "code-block-count-mismatch",
                    "detail": (
                        f"コードブロック数の総数が原文と異なります: EN={en_code}, "
                        f"JA={ja_code} ({'+' if diff > 0 else ''}{diff})"
                    ),
                }
            )
        )
    return issues


def compare_html_structure(en_html: str, ja_html: str, *, slug: str) -> list[dict[str, Any]]:
    """EN / JA HTML の shape / count 比較。EN artifact があれば全 issue に ``artifacts``。"""
    en_root, en_tables = _parse(en_html, slug, CALLOUT_NORMALIZATION_SLUGS)
    ja_root, ja_tables = _parse(ja_html, None, None)
    en_headings, ja_headings = _headings(en_root), _headings(ja_root)

    issues = _callout_nesting_issues(en_root, ja_root)
    issues.extend(_compare_tables(en_tables, ja_tables))
    issues.extend(_heading_issues(en_headings, ja_headings))
    issues.extend(_count_issues(_counts(en_root, en_headings), _counts(ja_root, ja_headings)))
    return _apply_artifacts(issues, _artifacts(en_root))
