"""``scripts/tools/lint_docs.mjs`` の Python port。

WRITING_GUIDE 準拠チェック — ``src/content/docs/**/*.md`` に対し、
frontmatter / 内部リンク / feature name / code fence / callout / 画像存在の
lint rule を適用する。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any

import frontmatter

from ..project import DOCS_DIR, PROJECT_ROOT, file_path_to_slug
from ..sidebar import get_section_slug_set

__all__ = [
    "check_callouts",
    "check_code_blocks",
    "check_feature_names",
    "check_frontmatter",
    "check_images",
    "check_links",
    "lint_content",
    "main",
    "to_kebab",
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
_HEADING_LEVEL_RE = re.compile(r"^#{2,4}\s+(.+)")
_EXPLICIT_HEADING_ID_RE = re.compile(r"\{#([^}]+)\}\s*$")
_HEADING_ID_STRIP_RE = re.compile(r"\s*\{#[^}]+\}\s*$")

_CODE_FENCE_RE = re.compile(r"^```")
_CODE_BLOCK_RE = re.compile(r"```[\s\S]*?```")
_INLINE_CODE_RE = re.compile(r"`[^`]*`")

_CALLOUT_RE = re.compile(r"^:{3,}\s*([a-zA-Z][a-zA-Z-]*)(?:\{[^}]*\})?\s*$", re.MULTILINE)
# list item 内に nest された ``:::callout`` を検出するための regex。plan doc
# Phase 2 でも明文化されている通り、JA parser は list context を追跡しないので
# indented callout は ambiguous な flatten を招く。docs/WRITING_GUIDE.md で
# 禁止を明記、ここで lint ガードを pin する契約。
_LIST_NESTED_CALLOUT_RE = re.compile(
    r"^[ \t]+:{3,}\s*[a-zA-Z][a-zA-Z-]*(?:\{[^}]*\})?\s*$", re.MULTILINE
)
_MARKDOWN_LINK_RE = re.compile(r"\]\(/docs/([a-z0-9_-]+(?:/[a-z0-9_-]+)*)(#[^)]+)?\)")
_HTML_LINK_RE = re.compile(
    r"""<a\b[^>]*href=["']/docs/([a-z0-9_-]+(?:/[a-z0-9_-]+)*)(#[^\s"']*)?\s*["'][^>]*>""",
    re.IGNORECASE,
)
_IMAGE_RE = re.compile(r"""!\[[^\]]*]\((/images/[^)]+)\)|<img[^>]+src=["'](/images/[^"']+)["']""")

_DESCRIPTION_PLACEHOLDER_RE = re.compile(r"^原文:", re.UNICODE)
_DESCRIPTION_TODO_RE = re.compile(r"^todo", re.IGNORECASE)


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


def to_kebab(text: str) -> str:
    """見出し text を kebab-case slug に変換 (Astro / GitHub と互換、mjs 等価)。"""
    s = re.sub(r"`([^`]*)`", r"\1", text)
    s = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
    s = s.lower()
    s = re.sub(r"[^\w\s\-\u3000-\u9fff\uff00-\uffef]", "", s)
    s = re.sub(r"[\s\u3000]+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-")
    return s


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
    if not all_slugs:
        return
    body_stripped = _strip_code(body)
    stripped_lines = body_stripped.split("\n")

    def _validate(slug_path: str, fragment: str | None, line: int) -> None:
        display_path = f"/docs/{slug_path}"
        if slug_path not in all_slugs:
            reporter.err(
                "link-target-missing",
                f"Internal link target does not exist: {display_path}",
                line,
            )
            return
        if not fragment or headings_by_slug is None:
            return
        fragment_id = fragment[1:]
        headings = headings_by_slug.get(slug_path)
        if headings is not None and fragment_id not in headings:
            reporter.warn(
                "link-fragment-missing",
                f'Fragment "{fragment}" not found in {display_path}',
                line,
            )

    for index, line in enumerate(stripped_lines):
        line_number = _to_absolute_line(index + 1, body_start)
        for match in _MARKDOWN_LINK_RE.finditer(line):
            _validate(match.group(1), match.group(2), line_number)
        for match in _HTML_LINK_RE.finditer(line):
            _validate(match.group(1), match.group(2), line_number)


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

        # list item 内 nest された ``:::callout`` を検出。plan doc Phase 2 で JA
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


def lint_content(
    content: str,
    file_path: Path,
    *,
    all_slugs: set[str] | None = None,
    headings_by_slug: dict[str, set[str]] | None = None,
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
        headings: set[str] = set()

        for line in body.split("\n"):
            match = _HEADING_LEVEL_RE.match(line)
            if not match:
                continue
            heading_text = match.group(1).strip()
            explicit = _EXPLICIT_HEADING_ID_RE.search(heading_text)
            if explicit:
                headings.add(explicit.group(1))
                headings.add(to_kebab(_HEADING_ID_STRIP_RE.sub("", heading_text)))
                continue
            headings.add(to_kebab(heading_text))

        all_slugs.add(slug)
        headings_by_slug[slug] = headings

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
            issues = lint_content(
                content,
                file_path,
                all_slugs=all_slugs,
                headings_by_slug=headings_by_slug,
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
