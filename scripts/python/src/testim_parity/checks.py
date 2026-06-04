"""EN / JA body の count・shape・heuristics 比較 (``source_parity_checks.mjs`` port)。

Phase 3 M3 の後半。``extract.py`` の関数を消費して section 別 count /
table structure / heading 列を比較し、coarse audit signal 系 issue
(bullet-count / paragraph-count / section-count / heading-mismatch /
table-* / callout-nesting 等) を emit する。``compare_snapshot_structure`` の
issue 列は mjs と byte-identical な契約。

なお ``image_parity_issues`` は mjs port 完了後に追加した **Python-only** の
画像パリティ検出器 (image-mismatch / image-order-mismatch) で、byte-parity
契約の対象外。EN を生 HTML から抽出する点が ``compare_snapshot_structure``
(turndown markdown 入力) と異なる。
"""

from __future__ import annotations

import re
from collections import Counter
from collections.abc import Iterable, Mapping
from typing import Any

from .extract import (
    detect_en_artifacts,
    extract_bullet_counts,
    extract_callout_positions,
    extract_heading_sequence,
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
    "image_parity_issues",
    "is_english_only_line",
    "load_sidebar_slugs",
    "load_sidebar_slugs_ordered",
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
    派生し、非空のもののみ set に収める (重複は自動的に排除)。``in`` lookup や
    集合演算を必要とする caller 向け。iteration 順を要求する caller は
    :func:`load_sidebar_slugs_ordered` を使うこと。
    """
    slugs: set[str] = set()
    for match in match_all_tricentis_urls(sidebar_text):
        slug = _extract_slug_from_url(match[0])
        if slug:
            slugs.add(slug)
    return slugs


def load_sidebar_slugs_ordered(sidebar_text: str) -> list[str]:
    """SIDEBAR_URLS.md テキストから Tricentis slug を **挿入順で** 抽出する。

    mjs ``loadSidebarSlugs`` は ``new Set()`` を返すが、JS ``Set`` は挿入順 =
    正規表現マッチ順を保つ。Python ``set`` は挿入順を保存しないため、
    ``page_coverage`` で iteration 順が必要な caller 用に list 版を提供する。
    dedup は ``dict.fromkeys`` で first-seen を保つ (mjs Set と同じ semantics)。
    """
    slugs: list[str] = []
    for match in match_all_tricentis_urls(sidebar_text):
        slug = _extract_slug_from_url(match[0])
        if slug:
            slugs.append(slug)
    return list(dict.fromkeys(slugs))


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
    """section 別 count map を比較して per-section または total diff を emit (mjs 等価)。

    **Precondition (python-reviewer HIGH 指摘)**: ``en_map`` / ``ja_map`` は同じ
    document 走査順で作られた dict であること (``extract_step_counts`` /
    ``extract_bullet_counts`` / ``extract_paragraph_counts`` は全て同一の linear
    scan で dict を build するため契約を満たす)。mjs ``Map.entries()`` 順と同じく
    Python 3.7+ dict の挿入順を両側で信頼する。異なる source から aggregate
    された map を渡すと per-section zip が silently 誤 diff を emit するため、
    caller は上記 3 関数で生成した map だけを渡すこと。
    """
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


# ---------------------------------------------------------------------------
# image_parity_issues — EN 基準の画像 枚数 / 重複 / 順序 比較
#
# EN を en_body (turndown markdown) から抽出すると ``![alt](src "title")`` の
# title が basename に混入し、title を持たない JA md と不一致になる。そのため
# EN は生 HTML (`en_html`) の ``src`` / ``href`` から直接抽出し、JA md と対称な
# basename 列を得る (この title 混入が原因で旧 ``_image_order_issues`` は事実上
# 機能しなかったため、本関数に統合・置換した)。
#
# 判定はすべて **EN を基準** とする multiset / 順序比較:
#   - EN に元々ある重複・順序は「正」とみなし、JA がそれを忠実にミラーすれば
#     一致 = 検知しない (誤検知を出さない)
#   - JA に EN へ無い余剰/不足/順序差があるときだけ issue を emit する
# ---------------------------------------------------------------------------

_IMAGE_EXT_GROUP = r"(?:png|jpe?g|gif|svg|webp)"
# ``(?<![\w:-])`` の属性境界で ``data-src`` / ``xlink:href`` 等の誤一致を防ぐ。
# クォートは ``"`` / ``'`` 両対応 (backref ``\1``)、拡張子の後ろの query /
# fragment (``?...`` / ``#...``) も許容して JA 側の basename 正規化と対称化する
# (group 1 = quote, group 2 = URL)。
_EN_IMAGE_SRC_RE = re.compile(
    r"(?<![\w:-])(?:src|href)\b\s*=\s*([\"'])"
    r"([^\"']+\." + _IMAGE_EXT_GROUP + r"(?:[?#][^\"']*)?)\1",
    re.IGNORECASE,
)
# markdown ``![alt](src)`` / HTML ``<img src>`` / Astro ``<Image src>`` の 3 形式。
# HTML 形式はクォート ``"`` / ``'`` 両対応 (backref ``\2``)、``(?<![\w:-])`` の
# 属性境界で ``data-src`` 等の誤一致を排除する。属性走査は ``[^<>]*?`` で次の
# ``<`` / ``>`` (= タグ境界) までに bound する。``[^>]*?`` だと閉じ ``>`` の無い
# 不正な ``<img`` 連続で各開始位置が EOL まで走査し O(n^2) になるため、``<`` も
# 境界に含めて線形性を保証する。
# 既知の制限: markdown の山括弧 destination (``![](<path>)``) は対象外 (JA 未使用)。
_JA_IMAGE_RE = re.compile(
    r"!\[[^\]]*\]\(\s*([^)\s]+)"
    r"|<(?:img|image)\b[^<>]*?(?<![\w:-])src\s*=\s*([\"'])([^\"']+)\2",
    re.IGNORECASE,
)
_IMAGE_EXT_SUFFIX_RE = re.compile(r"\." + _IMAGE_EXT_GROUP + r"$", re.IGNORECASE)
_IMAGE_HASH_PREFIX_RE = re.compile(r"^([0-9a-f]{6,})-", re.IGNORECASE)


def _normalize_image_token(src: str) -> str:
    """画像参照を比較用の canonical token に正規化する。

    - basename のみ採用 (クエリ / フラグメントは除去)
    - 拡張子を落とし、小文字化
    - 先頭ハッシュ prefix は 7 文字に揃える (EN snapshot の 7 桁 prefix と
      JA 側のフル SHA prefix を同一視。例: ``abc1234-foo`` ==
      ``abc1234ef..-foo``)
    """
    base = src.split("?", 1)[0].split("#", 1)[0].rstrip("/").rsplit("/", 1)[-1].lower()
    base = _IMAGE_EXT_SUFFIX_RE.sub("", base)
    match = _IMAGE_HASH_PREFIX_RE.match(base)
    if match:
        base = match.group(1)[:7] + "-" + base[match.end() :]
    return base


def _en_image_tokens(en_html: str) -> list[str]:
    """EN 生 HTML から画像 (``src`` / ``href`` の image URL) を出現順に抽出する。"""
    return [_normalize_image_token(url) for _quote, url in _EN_IMAGE_SRC_RE.findall(en_html)]


def _ja_image_tokens(ja_body: str) -> list[str]:
    """JA markdown から画像 (``![](...)`` / ``<img src>`` / ``<Image src>``) を出現順に抽出する。

    code fence 内は除外し、markdown の title (``"..."``) は drop する。
    """
    tokens: list[str] = []
    in_code_block = False
    for line in ja_body.split("\n"):
        if FENCE_LINE_RE.match(line):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue
        for md_src, _quote, tag_src in _JA_IMAGE_RE.findall(line):
            src = md_src or tag_src
            cleaned = src.split("?", 1)[0].split("#", 1)[0]
            if _IMAGE_EXT_SUFFIX_RE.search(cleaned):
                tokens.append(_normalize_image_token(src))
    return tokens


def image_parity_issues(en_html: str, ja_body: str) -> list[dict[str, Any]]:
    """EN (生 HTML) 基準で JA 画像の 枚数 / 重複 / 順序 を検証する。

    - multiset 不一致 (余剰 / 不足 / 重複) → ``image-mismatch``
    - multiset 一致だが順序が EN と相違 → ``image-order-mismatch``

    EN 側に元々ある重複・順序は正とみなすため、JA がそれを忠実にミラーする
    限り issue は出ない (EN-relative)。
    """
    issues: list[dict[str, Any]] = []
    en_tokens = _en_image_tokens(en_html)
    ja_tokens = _ja_image_tokens(ja_body)

    en_counts = Counter(en_tokens)
    ja_counts = Counter(ja_tokens)
    if en_counts != ja_counts:
        extra = ja_counts - en_counts  # EN に無い JA 余剰
        missing = en_counts - ja_counts  # JA に不足している EN 画像
        parts: list[str] = []
        if extra:
            parts.append(
                "JA 余剰: " + ", ".join(f"{name}×{count}" for name, count in sorted(extra.items()))
            )
        if missing:
            parts.append(
                "JA 不足: "
                + ", ".join(f"{name}×{count}" for name, count in sorted(missing.items()))
            )
        issues.append(
            _with_severity(
                {
                    "type": "image-mismatch",
                    "detail": "画像が原文と一致しません (" + "; ".join(parts) + ")",
                }
            )
        )
        return issues

    if en_tokens != ja_tokens:
        first = next(
            index for index in range(len(en_tokens)) if en_tokens[index] != ja_tokens[index]
        )
        issues.append(
            _with_severity(
                {
                    "type": "image-order-mismatch",
                    "detail": (
                        f"画像の順序が原文と異なります (位置 {first + 1}: "
                        f"原文={en_tokens[first]} / 翻訳={ja_tokens[first]})"
                    ),
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

    - ``callout-nesting-mismatch`` (callout 深さ差)
    - ``table-shape-mismatch`` / ``table-cell-*`` (テーブル形状と中身)
    - ``section-count-mismatch`` (H2-H4 見出し数)
    - ``heading-mismatch`` (heading level 不一致)
    - ``step-count-mismatch`` / ``bullet-count-mismatch`` /
      ``paragraph-count-mismatch`` (section 別 count)

    画像の枚数 / 重複 / 順序は ``image_parity_issues`` (EN 生 HTML 基準) が担当する。

    EN artifact (`<details>` 使用 / code-fence-wrapped) が検出されたら全 issue
    に ``artifacts`` field を付与する。
    """
    issues: list[dict[str, Any]] = []
    en_artifacts = detect_en_artifacts(en_body)

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
