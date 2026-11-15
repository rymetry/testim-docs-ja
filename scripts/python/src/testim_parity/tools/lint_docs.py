"""``scripts/tools/lint_docs.mjs`` の Python port。

WRITING_GUIDE 準拠チェック — ``src/content/docs/**/*.md`` に対し、
frontmatter / 内部リンク / feature name / code fence / callout / 画像存在の
lint rule を適用する。
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any
from urllib.parse import unquote

import frontmatter

from ..preprocess_en import preprocess_en_html
from ..project import DOCS_DIR, PROJECT_ROOT, file_path_to_slug
from ..segments_en import CALLOUT_NORMALIZATION_SLUGS, extract_segments_from_html
from ..segments_ja import extract_segments_from_markdown
from ..segments_shared import GATE_ELIGIBLE_KINDS
from ..sidebar import get_section_slug_set

__all__ = [
    "check_callouts",
    "check_code_blocks",
    "check_feature_names",
    "check_frontmatter",
    "check_images",
    "check_structure_signature",
    "check_links",
    "lint_content",
    "heading_ids",
    "heading_slug",
    "main",
]


_PUBLIC_ROOT: Path = PROJECT_ROOT / "public"


_VALID_CALLOUT_TYPES: frozenset[str] = frozenset(
    {"note", "caution", "warning", "tip", "danger", "info"}
)
_VALID_SOURCE_URL_RE = re.compile(
    r"^https://docs\.tricentis\.com/testim/content/"
    r"[a-z0-9_-]+(?:/[a-z0-9_-]+)*(?:/index)?\.htm$"
)


_FEATURE_NAME_RULES: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"Testim拡張機能"), "Testim Extension"),
    (re.compile(r"Tricentis Testim拡張機能"), "Tricentis Testim Extension"),
    (re.compile(r"Testimビジュアルエディタ(?:ー)?"), "Testim Visual Editor"),
    (re.compile(r"Testim ビジュアルエディタ(?:ー)?"), "Testim Visual Editor"),
    (re.compile(r"(?<!Testim )ビジュアルエディタ(?:ー)?"), "Visual Editor"),
    (re.compile(r"エージェント型テスト自動化"), "Agentic Test Automation"),
)

_LEGACY_FA_ICON_RE = re.compile(r":fa-[a-z][a-z-]*:")
_HEADING_LEVEL_RE = re.compile(r"^#{1,6}[ \t]+(.+)")
# src/lib/remark-heading-ids.mjs と同じ条件 (空白を含む {#...} は明示 id にならない)。
# 先頭に \s* を置くと空白の連続で二次時間になるので、id だけを取り出す形にしている。
_EXPLICIT_HEADING_ID_RE = re.compile(r"\{#([^}\s]+)\}\s*$")

_CODE_FENCE_RE = re.compile(r"^```")
_CODE_BLOCK_RE = re.compile(r"```[\s\S]*?```")
_INLINE_CODE_RE = re.compile(r"`[^`]*`")

_CALLOUT_RE = re.compile(r"^:{3,}\s*([a-zA-Z][a-zA-Z-]*)(?:\{[^}]*\})?\s*$", re.MULTILINE)
# list item 内に nest された ``:::callout`` を検出するための regex。SYSTEM_SPEC
# Phase 2 でも明文化されている通り、JA parser は list context を追跡しないので
# indented callout は ambiguous な flatten を招く。docs/WRITING_GUIDE.md で
# 禁止を明記、ここで lint ガードを pin する契約。
_LIST_NESTED_CALLOUT_RE = re.compile(
    r"^[ \t]+:{3,}\s*[a-zA-Z][a-zA-Z-]*(?:\{[^}]*\})?\s*$", re.MULTILINE
)
# リンク先は ``/docs/<slug>`` (末尾 ``/`` 可)、``/docs/<slug>#frag``、同一ページの ``#frag``。
# どちらの group も空なら内部リンクではない。
_LINK_TARGET = r"(?:/docs/([a-z0-9_-]+(?:/[a-z0-9_-]+)*)/?)?"
_MARKDOWN_LINK_RE = re.compile(rf"\]\({_LINK_TARGET}(#[^)\n]*)?\)")
# body 全体に当てるので ``href`` が ``<a`` より後の行にあっても拾う。属性部から ``<`` を
# 除くのは、閉じない ``<a`` が並んだときに走査が二次時間になるのを防ぐため。
_HTML_LINK_RE = re.compile(
    rf"""<a\b[^<>]*href=["']{_LINK_TARGET}(#[^\s"']*)?\s*["'][^>]*>""",
    re.IGNORECASE,
)
_IMAGE_RE = re.compile(r"""!\[[^\]]*]\((/images/[^)]+)\)|<img[^>]+src=["'](/images/[^"']+)["']""")

_DESCRIPTION_PLACEHOLDER_RE = re.compile(r"^原文:", re.UNICODE)
_DESCRIPTION_TODO_RE = re.compile(r"^todo", re.IGNORECASE)

_FRONTMATTER_RULES: frozenset[str] = frozenset(
    {
        "sourceUrl-required",
        "sourceUrl-format",
        "description-placeholder",
        "title-required",
        "category-required",
        "updated-required",
    }
)


def _parse_frontmatter_with_lines(content: str) -> tuple[dict[str, Any], str, int]:
    """frontmatter を抽出し、body の 1-based 開始行も返す。"""
    post = frontmatter.loads(content)
    fm = dict(post.metadata) if post.metadata else {}
    if content.startswith("---\n"):
        end = content.find("\n---", 4)
        if end >= 0:
            fm_block = content[: end + 4]
            body_start = len(fm_block.split("\n")) + 2
            return fm, post.content, body_start
    return fm, post.content or content, 1


def _strip_code(body: str) -> str:
    return _INLINE_CODE_RE.sub("", _CODE_BLOCK_RE.sub("", body))


def _to_absolute_line(body_line_number: int, body_start_line: int) -> int:
    return body_start_line + body_line_number - 1


class _Reporter:
    """issue collector (mjs ``createIssueCollector`` 等価)。"""

    def __init__(self, file_path: Path) -> None:
        self.file_path = file_path
        self.issues: list[dict[str, Any]] = []

    def err(self, rule: str, message: str, line: int | None = None) -> None:
        self.issues.append(
            {
                "file": str(self.file_path),
                "line": line,
                "rule": rule,
                "message": message,
                "level": "error",
            }
        )

    def warn(self, rule: str, message: str, line: int | None = None) -> None:
        self.issues.append(
            {
                "file": str(self.file_path),
                "line": line,
                "rule": rule,
                "message": message,
                "level": "warning",
            }
        )


def _is_slug_char(ch: str) -> bool:
    """github-slugger が slug に残す文字か (文字・結合記号・数字・``_`` 類・``-``・半角スペース)。

    残さない文字は消すだけで、半角スペース以外の空白も ``-`` にはならない。
    """
    # shortcut: Unicode 一般カテゴリで近似。github-slugger 2.0.0 の regex (Unicode 13 固定) との
    # 差は Unicode 14 以降の追加文字と丸囲み・四角囲み英字 130 字のみ (全コードポイントで照合済み)。
    # それらが見出しに現れたら regex.js の範囲表に置き換える。
    category = unicodedata.category(ch)
    return ch in "- " or category[0] in "LM" or category in {"Nd", "Nl", "Pc"}


def heading_slug(text: str) -> str:
    """見出し text を、サイトが見出し id に使う github-slugger と同じ slug に変換する。

    記号は消すだけで、半角スペースだけを ``-`` にする。連続・先頭・末尾の ``-`` はそのまま残す。
    """
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    s = s.strip().lower()
    return "".join(ch for ch in s if _is_slug_char(ch)).replace(" ", "-")


def heading_ids(body: str) -> set[str]:
    """Markdown body の見出しにサイトが付ける id の集合を返す。

    期待値は scripts/__tests__/fixtures/heading-ids.json でサイトの実パイプラインと共有している。
    """
    # shortcut: Markdown を行単位の正規表現で読む。見出し内のインライン HTML・文字参照・画像・
    # ``_強調_``・参照リンク・``:name`` ディレクティブ・空白で囲んだコードスパン、setext 見出し、
    # 引用やリスト内の見出し、HTML コメント/ブロック内の ``## ``、``~~~`` や 4 連以上のフェンス、
    # リストマーカーと同じ行で開くフェンス、行頭がインラインの 3 連バッククォートは
    # サイトと id がずれる (現行コンテンツに該当なし)。使い始めたら fixture にケースを足し、
    # ここを Markdown パーサーに置き換える。
    ids: set[str] = set()
    occurrences: dict[str, int] = {}  # github-slugger と同じ重複カウンタ
    in_code_block = False
    for line in body.split("\n"):
        if _CODE_FENCE_RE.match(line.strip()):
            in_code_block = not in_code_block
            continue
        match = None if in_code_block else _HEADING_LEVEL_RE.match(line)
        if not match:
            continue
        heading_text = match.group(1).rstrip()
        without_hashes = heading_text.rstrip("#")
        if without_hashes != heading_text and without_hashes[-1:] in ("", " ", "\t"):
            heading_text = without_hashes.rstrip()  # ATX の閉じ ``##``
        explicit = _EXPLICIT_HEADING_ID_RE.search(heading_text)
        if explicit:
            # 明示 id は slug 化も重複回避も通らず、自動 id は付かない
            ids.add(explicit.group(1))
            continue
        base = slug = heading_slug(heading_text)
        while slug in occurrences:  # 同じ見出しが続くと -1, -2 ... が付く
            occurrences[base] += 1
            slug = f"{base}-{occurrences[base]}"
        occurrences[slug] = 0
        ids.add(slug)
    return ids


def check_frontmatter(fm: dict[str, Any], reporter: _Reporter) -> None:
    source_url = fm.get("sourceUrl")
    if not source_url or source_url == "undefined":
        reporter.err("sourceUrl-required", "frontmatter: sourceUrl is required")
    elif not _VALID_SOURCE_URL_RE.match(source_url):
        reporter.err(
            "sourceUrl-format",
            f"frontmatter: sourceUrl must match "
            f"https://docs.tricentis.com/testim/content/.../{{slug}}.htm (got: {source_url})",
        )

    description = fm.get("description")
    if description is not None and (
        _DESCRIPTION_PLACEHOLDER_RE.match(str(description))
        or _DESCRIPTION_TODO_RE.match(str(description))
    ):
        reporter.err(
            "description-placeholder",
            f'frontmatter: description must not be a placeholder (got: "{description}")',
        )

    for field in ("title", "category", "updated"):
        value = fm.get(field)
        if not value or value == "undefined":
            reporter.err(f"{field}-required", f"frontmatter: {field} is required")


def check_links(
    body: str,
    body_start: int,
    reporter: _Reporter,
    *,
    all_slugs: set[str] | None = None,
    headings_by_slug: dict[str, set[str]] | None = None,
) -> None:
    body_stripped = _strip_code(body)
    own_headings = heading_ids(body)

    def _validate(slug_path: str | None, fragment: str | None, line: int) -> None:
        headings: set[str] | None
        if slug_path is None:  # 同一ページの ``#frag``
            headings, display_path = own_headings, "this page"
        elif not all_slugs:
            return
        else:
            display_path = f"/docs/{slug_path}"
            if slug_path not in all_slugs:
                reporter.err(
                    "link-target-missing",
                    f"Internal link target does not exist: {display_path}",
                    line,
                )
                return
            headings = (headings_by_slug or {}).get(slug_path)
        fragment_id = (fragment or "")[1:]
        if headings is None or not fragment_id:
            return
        # ブラウザと同じく、そのままの id と percent-decode した id の両方で探す
        if fragment_id not in headings and unquote(fragment_id) not in headings:
            reporter.err(
                "link-fragment-missing",
                f'Fragment "{fragment}" not found in {display_path}',
                line,
            )

    matches = [*_MARKDOWN_LINK_RE.finditer(body_stripped), *_HTML_LINK_RE.finditer(body_stripped)]
    for match in sorted(matches, key=lambda m: m.start()):
        if match.group(1) is None and match.group(2) is None:
            continue
        body_line = body_stripped.count("\n", 0, match.start()) + 1
        _validate(match.group(1), match.group(2), _to_absolute_line(body_line, body_start))


def check_feature_names(body: str, body_start: int, reporter: _Reporter) -> None:
    body_without_code = _strip_code(body)
    lines = body_without_code.split("\n")

    for pattern, expected in _FEATURE_NAME_RULES:
        for index, line in enumerate(lines):
            if pattern.search(line):
                reporter.err(
                    "feature-name-japanese",
                    f"Testim feature name must remain in English (use: {expected})",
                    _to_absolute_line(index + 1, body_start),
                )

    for index, line in enumerate(lines):
        if _LEGACY_FA_ICON_RE.search(line):
            reporter.err(
                "legacy-fa-icon",
                '":fa-*:" は ReadMe.io 固有構文です。テキストまたは絵文字に置換してください',
                _to_absolute_line(index + 1, body_start),
            )


def check_code_blocks(body: str, body_start: int, reporter: _Reporter) -> None:
    in_code_block = False
    for index, line in enumerate(body.split("\n")):
        if not _CODE_FENCE_RE.match(line):
            continue
        if not in_code_block:
            language = line[3:].strip()
            if not language:
                reporter.warn(
                    "code-block-no-language",
                    "Code block missing language specifier",
                    _to_absolute_line(index + 1, body_start),
                )
            in_code_block = True
            continue
        in_code_block = False


def check_callouts(body: str, body_start: int, reporter: _Reporter) -> None:
    # Code fence 内の ``:::callout`` 風 literal は meta-documentation (反例示)
    # として lint しない。``check_images`` と同じ state machine で fence を
    # 追跡し、fence 内の行を skip する。fence 閉じ後は通常の検出に戻る。
    sorted_types = ", ".join(sorted(_VALID_CALLOUT_TYPES))
    in_code_block = False
    for index, line in enumerate(body.split("\n")):
        if _CODE_FENCE_RE.match(line.strip()):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        line_number = _to_absolute_line(index + 1, body_start)

        top_match = _CALLOUT_RE.match(line)
        if top_match:
            callout_type = top_match.group(1).lower()
            if callout_type not in _VALID_CALLOUT_TYPES:
                reporter.err(
                    "callout-unknown-type",
                    f'Unknown callout type "{top_match.group(1)}". Valid types: {sorted_types}',
                    line_number,
                )

        # list item 内 nest された ``:::callout`` を検出。SYSTEM_SPEC Phase 2 で JA
        # parser は list context を追跡しないと明記されているため、indented
        # callout は ambiguous な flatten を招く。top-level でない callout を
        # 全て不許可にする (docs/WRITING_GUIDE.md 参照)。
        if _LIST_NESTED_CALLOUT_RE.match(line):
            reporter.err(
                "callout-in-list-item",
                "Callout directive nested inside a list item is unsupported "
                "(JA extractor cannot flatten it deterministically). "
                "Keep callouts at top level — see docs/WRITING_GUIDE.md.",
                line_number,
            )


def check_images(body: str, body_start: int, reporter: _Reporter) -> None:
    in_code_block = False
    for index, line in enumerate(body.split("\n")):
        if _CODE_FENCE_RE.match(line.strip()):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue
        for match in _IMAGE_RE.finditer(line):
            image_path = match.group(1) or match.group(2)
            absolute = _PUBLIC_ROOT / image_path.lstrip("/")
            if absolute.exists():
                continue
            reporter.err(
                "image-missing",
                f"Referenced image does not exist: {image_path}",
                _to_absolute_line(index + 1, body_start),
            )


_GATE_KIND_SET: frozenset[str] = frozenset(GATE_ELIGIBLE_KINDS)
_LIST_ITEM_KINDS: frozenset[str] = frozenset({"ordered-list-item", "unordered-list-item"})
_LIST_CONTINUATION_KINDS: frozenset[str] = frozenset(
    {"paragraph", "image", "code-block", "ordered-list-item", "unordered-list-item"}
)


def _format_structure_diffs(diffs: list[dict[str, Any]]) -> str:
    preview: list[str] = []
    for diff in diffs[:3]:
        kind = diff.get("segmentKind") or "section"
        section = diff.get("sectionPath") or "(preface)"
        preview.append(f"{diff.get('type')}:{kind}@{section}")
    suffix = "" if len(diffs) <= 3 else f", ... +{len(diffs) - 3}"
    return "[" + ", ".join(preview) + suffix + "]"


def _split_kinds_by_heading(segments: list[dict[str, Any]]) -> list[list[str]]:
    sections: list[list[str]] = [[]]
    for segment in segments:
        kind = str(segment.get("segmentKind") or "")
        if kind == "heading":
            sections.append([])
            continue
        if kind in _GATE_KIND_SET:
            sections[-1].append(kind)
    return sections


def _kind_lcs_unmatched(en_kinds: list[str], ja_kinds: list[str]) -> tuple[set[int], set[int]]:
    n = len(en_kinds)
    m = len(ja_kinds)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n - 1, -1, -1):
        for j in range(m - 1, -1, -1):
            if en_kinds[i] == ja_kinds[j]:
                dp[i][j] = dp[i + 1][j + 1] + 1
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j + 1])

    matched_en: set[int] = set()
    matched_ja: set[int] = set()
    i = 0
    j = 0
    while i < n and j < m:
        if en_kinds[i] == ja_kinds[j]:
            matched_en.add(i)
            matched_ja.add(j)
            i += 1
            j += 1
        elif dp[i + 1][j] >= dp[i][j + 1]:
            i += 1
        else:
            j += 1

    return set(range(n)) - matched_en, set(range(m)) - matched_ja


def _is_list_continuation_sensitive(kinds: list[str], index: int) -> bool:
    kind = kinds[index]
    if kind in _LIST_ITEM_KINDS:
        return True
    return kind in _LIST_CONTINUATION_KINDS and index > 0 and kinds[index - 1] in _LIST_ITEM_KINDS


def _structure_kind_diffs(
    en_segments: list[dict[str, Any]], ja_segments: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    en_sections = _split_kinds_by_heading(en_segments)
    ja_sections = _split_kinds_by_heading(ja_segments)
    if len(en_sections) != len(ja_sections):
        return [
            {
                "type": "section-count-mismatch",
                "segmentKind": "section",
                "sectionPath": f"EN={len(en_sections)} JA={len(ja_sections)}",
            }
        ]

    diffs: list[dict[str, Any]] = []
    for section_index, (en_kinds, ja_kinds) in enumerate(
        zip(en_sections, ja_sections, strict=False)
    ):
        unmatched_en, unmatched_ja = _kind_lcs_unmatched(en_kinds, ja_kinds)
        for index in sorted(unmatched_en):
            if _is_list_continuation_sensitive(en_kinds, index):
                diffs.append(
                    {
                        "type": "segment-missing",
                        "segmentKind": en_kinds[index],
                        "sectionPath": f"section#{section_index}",
                    }
                )
        for index in sorted(unmatched_ja):
            if _is_list_continuation_sensitive(ja_kinds, index):
                diffs.append(
                    {
                        "type": "segment-extra",
                        "segmentKind": ja_kinds[index],
                        "sectionPath": f"section#{section_index}",
                    }
                )
    return diffs


def check_structure_signature(
    body: str,
    reporter: _Reporter,
    *,
    slug: str,
    en_snapshot_path: Path | None,
) -> None:
    """EN snapshot と JA markdown の structure alignment を比較する。

    ``npm run lint`` は翻訳文の exact parity までは見ない。ここでは parity 本体と
    同じ parser で section ごとの kind skeleton を作り、Issue #368 で問題になった
    list continuation / image / code fence の分離のような segment 欠落・余剰だけを
    早期に落とす。
    """

    if en_snapshot_path is None or not en_snapshot_path.exists():
        return
    try:
        raw_en_html = en_snapshot_path.read_bytes().decode("utf-8")
    except OSError as err:
        reporter.err(
            "structure-snapshot-read-failed",
            f"Failed to read EN snapshot for structure lint: {err}",
            1,
        )
        return
    try:
        en_html = preprocess_en_html(raw_en_html, slug=slug)
        en_segments = list(
            extract_segments_from_html(
                en_html,
                slug=slug,
                callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS,
            )
        )
        ja_segments = list(extract_segments_from_markdown(body))
    except Exception as err:  # noqa: BLE001 - lint should surface parser/extractor failures
        reporter.err(
            "structure-signature-mismatch",
            f"EN/JA structure lint could not extract segments: {err}",
            1,
        )
        return

    structure_diffs = _structure_kind_diffs(en_segments, ja_segments)
    if not structure_diffs:
        return

    reporter.err(
        "structure-signature-mismatch",
        f"EN/JA structure signature differs: {_format_structure_diffs(structure_diffs)}",
        1,
    )


def lint_content(
    content: str,
    file_path: Path,
    *,
    all_slugs: set[str] | None = None,
    headings_by_slug: dict[str, set[str]] | None = None,
    en_snapshot_path: Path | None = None,
    slug: str | None = None,
) -> list[dict[str, Any]]:
    """1 document を lint する (mjs ``lintContent`` 等価)。"""
    reporter = _Reporter(file_path)
    fm, body, body_start = _parse_frontmatter_with_lines(content)

    check_frontmatter(fm, reporter)
    check_links(body, body_start, reporter, all_slugs=all_slugs, headings_by_slug=headings_by_slug)
    check_feature_names(body, body_start, reporter)
    check_code_blocks(body, body_start, reporter)
    check_callouts(body, body_start, reporter)
    check_images(body, body_start, reporter)
    if en_snapshot_path is not None and not any(
        issue["rule"] in _FRONTMATTER_RULES for issue in reporter.issues
    ):
        resolved_slug = slug
        if resolved_slug is None:
            try:
                resolved_slug = file_path_to_slug(file_path, DOCS_DIR)
            except ValueError:
                resolved_slug = None
        if resolved_slug is not None:
            check_structure_signature(
                body,
                reporter,
                slug=resolved_slug,
                en_snapshot_path=en_snapshot_path,
            )

    return reporter.issues


def _collect_doc_files() -> list[Path]:
    """``src/content/docs/**/*.md`` を集める。"""
    return sorted(DOCS_DIR.rglob("*.md"))


def _build_heading_index(
    files: list[Path],
) -> tuple[set[str], dict[str, set[str]]]:
    """全 doc の slug + 見出し id set を構築する (``checkLinks`` fragment 検証用)。"""
    all_slugs: set[str] = set()
    headings_by_slug: dict[str, set[str]] = {}

    for file_path in files:
        slug = file_path_to_slug(file_path, DOCS_DIR)
        raw = file_path.read_text(encoding="utf-8")
        _, body, _ = _parse_frontmatter_with_lines(raw)
        all_slugs.add(slug)
        headings_by_slug[slug] = heading_ids(body)

    return all_slugs, headings_by_slug


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (error あれば exit 1、その他は 0)。"""
    parser = argparse.ArgumentParser(description="Lint docs for WRITING_GUIDE compliance")
    parser.add_argument("--path", default=None, help="特定 file / glob のみ lint")
    parser.add_argument("--section", default=None, help="sidebar section 単位で絞り込む")
    args = parser.parse_args(argv)

    all_files = _collect_doc_files()
    files: list[Path] = [Path(args.path).resolve()] if args.path else list(all_files)

    if args.section:
        slug_set = get_section_slug_set(args.section)
        files = [p for p in files if file_path_to_slug(p, DOCS_DIR) in slug_set]

    all_slugs, headings_by_slug = _build_heading_index(all_files)

    total_errors = 0
    total_warnings = 0

    for file_path in files:
        try:
            content = file_path.read_text(encoding="utf-8")
            slug = file_path_to_slug(file_path, DOCS_DIR)
            en_snapshot_path = PROJECT_ROOT / "snapshots" / "en" / "content" / f"{slug}.html"
            issues = lint_content(
                content,
                file_path,
                all_slugs=all_slugs,
                headings_by_slug=headings_by_slug,
                en_snapshot_path=en_snapshot_path,
                slug=slug,
            )
            for issue in issues:
                location = f":{issue['line']}" if issue.get("line") else ""
                try:
                    rel = Path(str(issue["file"])).relative_to(PROJECT_ROOT)
                except ValueError:
                    rel = Path(str(issue["file"]))
                icon = "❌" if issue["level"] == "error" else "⚠️ "
                print(f"{icon} {rel}{location} [{issue['rule']}] {issue['message']}")
                if issue["level"] == "error":
                    total_errors += 1
                else:
                    total_warnings += 1
        except OSError as err:
            try:
                rel = file_path.relative_to(PROJECT_ROOT)
            except ValueError:
                rel = file_path
            print(f"❌ Failed to lint {rel}: {err}", file=sys.stderr)
            total_errors += 1

    print(
        f"\nLint complete: {total_errors} error(s), "
        f"{total_warnings} warning(s) in {len(files)} file(s)"
    )
    return 1 if total_errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
