"""EN / JA body の count・shape・heuristics 比較 (``source_parity_checks.mjs`` port)。

Phase 3 M3 の後半。``extract.py`` の 13 関数を消費して section 別 count /
table structure / image / heading 列を比較し、coarse audit signal 系 issue
(bullet-count / paragraph-count / section-count / heading-mismatch /
table-* / image-order / callout-nesting 等) を emit する。

mjs と byte-identical な issue 列を返す契約。
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from typing import Any

from .extract import (
    detect_en_artifacts,
    extract_bullet_counts,
    extract_callout_positions,
    extract_heading_sequence,
    extract_image_sequence,
    extract_invariant_tokens,
    extract_paragraph_counts,
    extract_step_counts,
    extract_table_structure,
    is_untranslated_cell,
    normalize_en_artifacts,
    normalize_numeric_period_spacing,
    strip_markdown,
    strip_title_h1,
)
from .madcap_toc import extract_slug as _extract_slug_from_url
from .madcap_toc import match_all_tricentis_urls
from .types import (
    FENCE_LINE_RE,
    H1_IN_BODY_RE,
    ISSUE_SEVERITY,
    JSX_CALLOUT_RE,
    LEGACY_CALLOUT_RE,
    UNTRANSLATED_PATTERNS,
)

__all__ = [
    "compare_snapshot_structure",
    "is_english_only_line",
    "load_sidebar_slugs",
    "local_check",
]


def _with_severity(issue: dict[str, Any]) -> dict[str, Any]:
    """issue dict に severity を付与する (mjs ``withSeverity`` 等価)。"""
    return {**issue, "severity": ISSUE_SEVERITY.get(issue["type"], "signal")}


# ---------------------------------------------------------------------------
# is_english_only_line — untranslated 行の粗判定
# ---------------------------------------------------------------------------

_MARKDOWN_STRUCTURE_PREFIX_RE = re.compile(r"^(?:#{1,6}\s|[-*>|]|```|:::|!\[|<!--|\[.*\]\()")
_HTML_BLOCK_TAG_RE = re.compile(
    r"^</?(?:table|thead|tbody|tr|td|th|details|summary|img|kbd|br|hr|Image)\b",
    re.IGNORECASE,
)
_CJK_BODY_RE = re.compile(r"[\u3000-\u9fff\uf900-\ufaff]")
_ORDERED_PREFIX_RE = re.compile(r"^\d+\.\s*")


def is_english_only_line(line: str) -> bool:
    """行が英語のみで 15 文字以上、untranslated pattern に一致するか判定する。

    fast-path reject (markdown 構造 / HTML block / CJK) を通った後、
    ``UNTRANSLATED_PATTERNS`` の正規表現に一致するかで最終判定する (mjs 等価)。
    """
    trimmed = line.strip()
    if not trimmed:
        return False
    if _MARKDOWN_STRUCTURE_PREFIX_RE.match(trimmed):
        return False
    if _HTML_BLOCK_TAG_RE.match(trimmed):
        return False
    if _CJK_BODY_RE.search(trimmed):
        return False

    text_only = _ORDERED_PREFIX_RE.sub("", trimmed)
    if not text_only or len(text_only) < 15:
        return False

    return any(pattern.search(text_only) for pattern in UNTRANSLATED_PATTERNS)


# ---------------------------------------------------------------------------
# load_sidebar_slugs
# ---------------------------------------------------------------------------


def load_sidebar_slugs(sidebar_text: str) -> set[str]:
    """SIDEBAR_URLS.md テキストから Tricentis slug 集合を抽出する (mjs 等価)。

    ``match_all_tricentis_urls`` の matches から ``extract_slug`` で slug を
    派生し、非空のもののみ set に収める (重複は自動的に排除)。
    """
    slugs: set[str] = set()
    for match in match_all_tricentis_urls(sidebar_text):
        slug = _extract_slug_from_url(match[0])
        if slug:
            slugs.add(slug)
    return slugs


# ---------------------------------------------------------------------------
# local_check — callout / H1 / untranslated の line scan
# ---------------------------------------------------------------------------


def local_check(doc: Mapping[str, Any]) -> list[dict[str, Any]]:
    """doc body の単一ファイル lint (mjs ``localCheck`` 等価)。

    ``body`` を 1 行ずつ走査し以下を emit:

    - ``legacy-callout``: ``LEGACY_CALLOUT_RE`` 一致行 (blockquote-emoji pattern)
    - ``jsx-callout``: ``JSX_CALLOUT_RE`` 一致行 (trimmed、``<Callout``)
    - ``h1-in-body``: 2 行目以降の ``# `` (title は除く)
    - ``untranslated``: ``is_english_only_line`` 判定
    """
    body = doc["body"]
    issues: list[dict[str, Any]] = []
    lines = body.split("\n")
    in_code_block = False

    for index, line in enumerate(lines):
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        if LEGACY_CALLOUT_RE.match(line):
            issues.append(
                _with_severity(
                    {
                        "type": "legacy-callout",
                        "line": index + 1,
                        "text": line.strip()[:80],
                    }
                )
            )

        if JSX_CALLOUT_RE.match(line.strip()):
            issues.append(
                _with_severity(
                    {
                        "type": "jsx-callout",
                        "line": index + 1,
                        "text": line.strip()[:80],
                    }
                )
            )

        if H1_IN_BODY_RE.match(line) and index > 0:
            issues.append(
                _with_severity(
                    {
                        "type": "h1-in-body",
                        "line": index + 1,
                        "text": line.strip()[:80],
                    }
                )
            )

        if is_english_only_line(line):
            issues.append(
                _with_severity(
                    {
                        "type": "untranslated",
                        "line": index + 1,
                        "text": line.strip()[:100],
                    }
                )
            )

    return issues


# ---------------------------------------------------------------------------
# compare_section_counts — bullet / step / paragraph 共通
# ---------------------------------------------------------------------------


def _compare_section_counts(
    en_map: dict[str, int],
    ja_map: dict[str, int],
    issue_type: str,
    label: str,
    min_diff: int = 1,
) -> list[dict[str, Any]]:
    """section 別 count map を比較して per-section または total diff を emit (mjs 等価)。"""
    issues: list[dict[str, Any]] = []
    en_sections = [(k, v) for k, v in en_map.items() if k != "__top__"]
    ja_sections = [(k, v) for k, v in ja_map.items() if k != "__top__"]

    if len(en_sections) > 0 and len(en_sections) == len(ja_sections):
        for index in range(len(en_sections)):
            en_heading, en_count = en_sections[index]
            _, ja_count = ja_sections[index]
            diff = ja_count - en_count
            if abs(diff) >= min_diff and (en_count > 0 or ja_count > 0):
                sign = "+" if diff > 0 else ""
                issues.append(
                    _with_severity(
                        {
                            "type": issue_type,
                            "detail": (
                                f'セクション #{index + 1} "{en_heading}": {label} '
                                f"EN={en_count}, JA={ja_count} ({sign}{diff})"
                            ),
                        }
                    )
                )
        return issues

    if len(en_sections) == 0 and len(ja_sections) == 0:
        return issues

    en_total = sum(en_map.values())
    ja_total = sum(ja_map.values())
    if (
        en_total != ja_total
        and (en_total > 0 or ja_total > 0)
        and abs(ja_total - en_total) >= min_diff
    ):
        diff = ja_total - en_total
        sign = "+" if diff > 0 else ""
        issues.append(
            _with_severity(
                {
                    "type": issue_type,
                    "detail": (
                        f"{label}の総数が原文と異なります: EN={en_total}, "
                        f"JA={ja_total} ({sign}{diff})"
                    ),
                }
            )
        )

    return issues


# ---------------------------------------------------------------------------
# compare_table_structure
# ---------------------------------------------------------------------------


_DOC_LINK_FRAGMENT_RE = re.compile(r"^(/docs/[\w-]+)#.*$")
_MARKDOWN_LINK_BRACKET_RE = re.compile(r"\s*\[[^\]]*\]\s*")
_MULTI_WS_RE = re.compile(r"\s+")


def _normalize_doc_link(token: str) -> str:
    """``/docs/<basename>#fragment`` を ``/docs/<basename>`` に縮める (mjs 等価)。"""
    return _DOC_LINK_FRAGMENT_RE.sub(r"\1", token)


def _normalize_for_compare(value: str) -> str:
    """cell の英文一致比較前に Markdown を剥がし、link bracket を空白化して小文字 trim。"""
    text = strip_markdown(value)
    text = _MARKDOWN_LINK_BRACKET_RE.sub(" ", text)
    text = text.strip()
    text = _MULTI_WS_RE.sub(" ", text)
    return text.lower()


def _compare_table_structure(en_body: str, ja_body: str) -> list[dict[str, Any]]:
    """table shape + cell token + untranslated cell を比較する (mjs 等価)。"""
    issues: list[dict[str, Any]] = []
    en_tables = extract_table_structure(en_body)
    ja_tables = extract_table_structure(ja_body)

    if len(en_tables) != len(ja_tables) and (len(en_tables) > 0 or len(ja_tables) > 0):
        issues.append(
            _with_severity(
                {
                    "type": "table-shape-mismatch",
                    "detail": f"テーブル数: EN={len(en_tables)}, JA={len(ja_tables)}",
                }
            )
        )
        return issues

    if len(en_tables) == 0:
        return issues

    for table_index in range(len(en_tables)):
        en_table = en_tables[table_index]
        ja_table = ja_tables[table_index]
        en_rows = len(en_table["rows"])
        ja_rows = len(ja_table["rows"])
        en_cols = len(en_table["rows"][0]) if en_rows > 0 else 0
        ja_cols = len(ja_table["rows"][0]) if ja_rows > 0 else 0

        if en_rows != ja_rows or en_cols != ja_cols:
            issues.append(
                _with_severity(
                    {
                        "type": "table-shape-mismatch",
                        "detail": (
                            f"テーブル #{table_index + 1}: "
                            f"EN={en_rows}行×{en_cols}列, JA={ja_rows}行×{ja_cols}列"
                        ),
                    }
                )
            )
            continue

        for row_index in range(en_rows):
            for column_index in range(en_cols):
                en_cell = (
                    (
                        en_table["rows"][row_index][column_index]
                        if column_index < len(en_table["rows"][row_index])
                        else ""
                    )
                    or ""
                ).strip()
                ja_cell = (
                    (
                        ja_table["rows"][row_index][column_index]
                        if column_index < len(ja_table["rows"][row_index])
                        else ""
                    )
                    or ""
                ).strip()
                en_empty = len(en_cell) == 0
                ja_empty = len(ja_cell) == 0

                if en_empty != ja_empty:
                    en_state = "空" if en_empty else "非空"
                    ja_state = "空" if ja_empty else "非空"
                    issues.append(
                        _with_severity(
                            {
                                "type": "table-cell-empty-mismatch",
                                "detail": (
                                    f"テーブル #{table_index + 1} "
                                    f"[{row_index + 1},{column_index + 1}]: "
                                    f"EN={en_state}, JA={ja_state}"
                                ),
                            }
                        )
                    )
                    continue

                if not en_empty and not ja_empty:
                    en_tokens = [
                        _normalize_doc_link(tok) for tok in extract_invariant_tokens(en_cell)
                    ]
                    ja_tokens = [
                        _normalize_doc_link(tok) for tok in extract_invariant_tokens(ja_cell)
                    ]
                    en_set = sorted(set(en_tokens))
                    ja_set = sorted(set(ja_tokens))

                    if len(en_set) > 0 and "|".join(en_set) != "|".join(ja_set):
                        missing = [tok for tok in en_set if tok not in ja_set]
                        added = [tok for tok in ja_set if tok not in en_set]
                        detail_parts: list[str] = []
                        if missing:
                            detail_parts.append(f"欠落: {', '.join(missing[:3])}")
                        if added:
                            detail_parts.append(f"追加: {', '.join(added[:3])}")
                        if detail_parts:
                            issues.append(
                                _with_severity(
                                    {
                                        "type": "table-cell-token-mismatch",
                                        "detail": (
                                            f"テーブル #{table_index + 1} "
                                            f"[{row_index + 1},{column_index + 1}]: "
                                            f"{'; '.join(detail_parts)}"
                                        ),
                                    }
                                )
                            )

                if (
                    not ja_empty
                    and _normalize_for_compare(en_cell) != _normalize_for_compare(ja_cell)
                    and is_untranslated_cell(ja_cell)
                ):
                    issues.append(
                        _with_severity(
                            {
                                "type": "table-cell-english-residual",
                                "detail": (
                                    f"テーブル #{table_index + 1} "
                                    f"[{row_index + 1},{column_index + 1}]: "
                                    f'"{ja_cell[:50]}"'
                                ),
                            }
                        )
                    )

    return issues


# ---------------------------------------------------------------------------
# compare_snapshot_structure (main API)
# ---------------------------------------------------------------------------

_SECTION_HEADING_RE = re.compile(r"^#{2,4}\s+")


def _count_section_headings(body: str) -> int:
    """H2-H4 見出しの数を数える (code fence 内は除外)。"""
    count = 0
    in_code = False
    for line in body.split("\n"):
        if FENCE_LINE_RE.match(line):
            in_code = not in_code
            continue
        if not in_code and _SECTION_HEADING_RE.match(line):
            count += 1
    return count


def _image_order_issues(en_body: str, ja_body: str) -> list[dict[str, Any]]:
    """画像順序 inversion を検出する (mjs 等価)。"""
    issues: list[dict[str, Any]] = []
    en_images = extract_image_sequence(en_body)
    ja_images = extract_image_sequence(ja_body)

    if len(en_images) == 0 or len(ja_images) == 0:
        return issues

    en_files = [img["file"] for img in en_images]
    ja_files = [img["file"] for img in ja_images]
    unique_en: list[str] = []
    seen_en: set[str] = set()
    for f in en_files:
        if f in ja_files and f not in seen_en:
            unique_en.append(f)
            seen_en.add(f)
    unique_ja: list[str] = []
    seen_ja: set[str] = set()
    for f in ja_files:
        if f in en_files and f not in seen_ja:
            unique_ja.append(f)
            seen_ja.add(f)

    if len(unique_en) < 2 or len(unique_en) != len(unique_ja):
        return issues

    ja_index = {f: i for i, f in enumerate(unique_ja)}
    inversions: list[tuple[str, str]] = []
    for left in range(len(unique_en)):
        for right in range(left + 1, len(unique_en)):
            first = unique_en[left]
            second = unique_en[right]
            if first in ja_index and second in ja_index and ja_index[first] > ja_index[second]:
                inversions.append((first, second))

    if inversions:
        examples = "; ".join(f"{a} / {b}" for a, b in inversions[:3])
        issues.append(
            _with_severity(
                {
                    "type": "image-order-mismatch",
                    "detail": f"画像の順序が原文と異なります ({len(inversions)} 箇所): {examples}",
                }
            )
        )

    return issues


def _callout_nesting_issues(en_body: str, ja_body: str) -> list[dict[str, Any]]:
    """callout 深さ不一致を検出する (mjs 等価)。"""
    issues: list[dict[str, Any]] = []
    en_callouts = extract_callout_positions(en_body)
    ja_callouts = extract_callout_positions(ja_body)

    if len(en_callouts) != len(ja_callouts) or len(en_callouts) == 0:
        return issues

    for index in range(len(en_callouts)):
        if en_callouts[index]["depth"] == ja_callouts[index]["depth"]:
            continue
        en_level = "トップレベル" if en_callouts[index]["depth"] == 0 else "ネスト"
        ja_level = "トップレベル" if ja_callouts[index]["depth"] == 0 else "ネスト"
        issues.append(
            _with_severity(
                {
                    "type": "callout-nesting-mismatch",
                    "line": ja_callouts[index]["line"],
                    "detail": f"callout #{index + 1}: EN={en_level} → JA={ja_level}",
                }
            )
        )

    return issues


def _heading_level_mismatches(
    en_headings: list[dict[str, Any]], ja_headings: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """heading level 不一致を最大 3 件まで example として emit (mjs 等価)。"""
    compare_length = min(len(en_headings), len(ja_headings))
    if compare_length == 0:
        return []

    mismatches: list[dict[str, Any]] = []
    for index in range(compare_length):
        if en_headings[index]["level"] != ja_headings[index]["level"]:
            mismatches.append({"en": en_headings[index], "ja": ja_headings[index]})

    if not mismatches:
        return []

    examples = "; ".join(
        f"EN H{m['en']['level']} '{m['en']['text']}' → JA H{m['ja']['level']}"
        for m in mismatches[:3]
    )
    return [
        _with_severity(
            {
                "type": "heading-mismatch",
                "detail": f"見出しレベル不一致 ({len(mismatches)}件): {examples}",
            }
        )
    ]


def _apply_artifacts(
    issues: Iterable[dict[str, Any]], artifacts: list[str]
) -> list[dict[str, Any]]:
    """EN artifact があれば各 issue に ``artifacts`` field を追加する (mjs 等価)。"""
    if not artifacts:
        return list(issues)
    return [{**issue, "artifacts": artifacts} for issue in issues]


def compare_snapshot_structure(en_body: str, ja_body: str) -> list[dict[str, Any]]:
    """EN / JA body の shape / count heuristic 比較 (mjs ``compareSnapshotStructure`` 等価)。

    発火する issue type:

    - ``image-order-mismatch`` (画像順 inversion)
    - ``callout-nesting-mismatch`` (callout 深さ差)
    - ``table-shape-mismatch`` / ``table-cell-*`` (テーブル形状と中身)
    - ``section-count-mismatch`` (H2-H4 見出し数)
    - ``heading-mismatch`` (heading level 不一致)
    - ``step-count-mismatch`` / ``bullet-count-mismatch`` /
      ``paragraph-count-mismatch`` (section 別 count)

    EN artifact (`<details>` 使用 / code-fence-wrapped) が検出されたら全 issue
    に ``artifacts`` field を付与する。
    """
    issues: list[dict[str, Any]] = []
    en_artifacts = detect_en_artifacts(en_body)

    issues.extend(_image_order_issues(en_body, ja_body))
    issues.extend(_callout_nesting_issues(en_body, ja_body))
    issues.extend(_compare_table_structure(en_body, ja_body))

    normalized_en_body = normalize_en_artifacts(strip_title_h1(en_body))
    # WRITING_GUIDE §5.3.5: JA 側にも同じ `\d+\.\S` space 挿入を適用し、paragraph /
    # step count の asymmetric drift を避ける。
    normalized_ja_body = normalize_numeric_period_spacing(ja_body)

    en_section_count = _count_section_headings(normalized_en_body)
    ja_section_count = _count_section_headings(normalized_ja_body)
    if en_section_count > 0 and en_section_count != ja_section_count:
        issues.append(
            _with_severity(
                {
                    "type": "section-count-mismatch",
                    "detail": f"H2-H4 セクション数: EN={en_section_count}, JA={ja_section_count}",
                }
            )
        )

    en_headings = extract_heading_sequence(normalized_en_body)
    ja_headings = extract_heading_sequence(normalized_ja_body)
    issues.extend(_heading_level_mismatches(en_headings, ja_headings))

    en_steps = extract_step_counts(normalized_en_body)
    ja_steps = extract_step_counts(normalized_ja_body)
    en_bullets = extract_bullet_counts(normalized_en_body)
    ja_bullets = extract_bullet_counts(normalized_ja_body)
    en_paragraphs = extract_paragraph_counts(normalized_en_body)
    ja_paragraphs = extract_paragraph_counts(normalized_ja_body)

    en_step_total = sum(en_steps.values())
    ja_step_total = sum(ja_steps.values())
    if en_step_total > 0 and ja_step_total > 0 and en_step_total != ja_step_total:
        diff = ja_step_total - en_step_total
        direction = "多い" if diff > 0 else "少ない"
        issues.append(
            _with_severity(
                {
                    "type": "step-count-mismatch",
                    "detail": (
                        f"番号付きステップ数が原文と異なります: "
                        f"EN={en_step_total}, JA={ja_step_total} "
                        f"({abs(diff)} {direction})"
                    ),
                }
            )
        )

    issues.extend(_compare_section_counts(en_steps, ja_steps, "step-count-mismatch", "ステップ数"))
    issues.extend(
        _compare_section_counts(en_bullets, ja_bullets, "bullet-count-mismatch", "箇条書き数")
    )
    issues.extend(
        _compare_section_counts(en_paragraphs, ja_paragraphs, "paragraph-count-mismatch", "段落数")
    )

    return _apply_artifacts(issues, en_artifacts)
