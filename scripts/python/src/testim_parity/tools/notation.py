"""表記ゆれの一括修正と検証。

``src/content/docs/**/*.md`` に対して、カタカナ長音、英日スペース、PRO機能表記、
レガシー callout などを修正または検証する。コードブロック、インラインコード、
URL、HTML タグは変換対象から外す。
"""

from __future__ import annotations

import argparse
import re
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from ..project import DOCS_DIR

__all__ = [
    "Issue",
    "apply_text_fixes",
    "fix_file",
    "main",
    "verify_file",
]

JP = r"[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]"
EMOJI_MAP = {
    "\U0001f4d8": "note",
    "\U0001f6a7": "warning",
    "\u2757": "danger",
    "\U0001f44d": "tip",
}
ENGLISH_TITLES = {
    "Always Save Your Changes!": "変更を必ず保存してください",
    "Auto Recovery": "自動復旧",
    "Test Compatibility": "テスト互換性",
    "OS Compatibility": "OS 互換性",
    "BrowserStack certificate error": "BrowserStack 証明書エラー",
    "Permissions Notice": "権限について",
    "New branch": "新しいブランチ",
    "CLI Steps": "CLI ステップ",
}
DANGER_TO_WARNING = {
    "results/tag-remote-runs-failures.md",
    "steps-editing-tests/editing-a-steps-properties.md",
}
LEGACY_CALLOUT_RE = re.compile(
    r"^(\s*)>\s*(" + "|".join(re.escape(emoji) for emoji in EMOJI_MAP) + r")\s*(.*)"
)


@dataclass(frozen=True)
class Issue:
    file: str
    line: int
    kind: str
    excerpt: str


def find_code_blocks(lines: list[str]) -> set[int]:
    code_lines: set[int] = set()
    fence_char: str | None = None
    fence_len = 0

    for index, line in enumerate(lines):
        stripped = line.strip()
        if fence_char is None:
            match = re.match(r"^(`{3,}|~{3,})", stripped)
            if match:
                fence_char = match.group(1)[0]
                fence_len = len(match.group(1))
                code_lines.add(index)
            continue

        code_lines.add(index)
        match = re.match(r"^(`{3,}|~{3,})\s*$", stripped)
        if match and match.group(1)[0] == fence_char and len(match.group(1)) >= fence_len:
            fence_char = None

    return code_lines


def find_frontmatter(lines: list[str]) -> tuple[int | None, int | None]:
    if not lines or lines[0].strip() != "---":
        return None, None
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            return 0, index
    return None, None


def consume_non_processable(line: str, index: int) -> tuple[str, int] | None:
    if line[index] == "`":
        end = line.find("`", index + 1)
        if end != -1:
            return line[index : end + 1], end + 1

    if index + 1 < len(line) and line[index : index + 2] == "](":
        end = line.find(")", index + 2)
        if end != -1:
            return line[index : end + 1], end + 1

    if (
        line[index] == "<"
        and index + 1 < len(line)
        and (line[index + 1].isalpha() or line[index + 1] == "/")
    ):
        end = line.find(">", index + 1)
        if end != -1:
            return line[index : end + 1], end + 1

    if line[index : index + 4] == "http":
        match = re.match(r"https?://\S+", line[index:])
        if match:
            url = match.group(0)
            return url, index + len(url)

    return None


def split_processable(line: str) -> list[tuple[str, bool]]:
    segments: list[tuple[str, bool]] = []
    index = 0

    while index < len(line):
        skipped = consume_non_processable(line, index)
        if skipped:
            text, index = skipped
            segments.append((text, False))
            continue

        end = index + 1
        while end < len(line) and consume_non_processable(line, end) is None:
            end += 1
        segments.append((line[index:end], True))
        index = end

    return segments


def apply_to_processable(line: str, transform: Callable[[str], str]) -> str:
    return "".join(
        transform(text) if processable else text for text, processable in split_processable(line)
    )


def fix_katakana(text: str) -> str:
    text = re.sub(r"パラメータ(?!ー)", "パラメーター", text)
    text = text.replace("ブラウザー", "ブラウザ")
    text = re.sub(r"エディタ(?!ー)", "エディター", text)
    text = re.sub(r"フォルダ(?!ー)", "フォルダー", text)
    return text


def fix_tatoeba(text: str) -> str:
    return text.replace("たとえば", "例えば")


def fix_pro_label(text: str) -> str:
    text = text.replace("プロ機能", "PRO機能")
    text = re.sub(r"Pro\s*機能", "PRO機能", text)
    text = re.sub(r"PRO\s+機能", "PRO機能", text)
    text = re.sub(r"これは\s*PRO\s*機能です", "これはPRO機能です", text)
    return re.sub(r"これは\s*Pro\s*機能です", "これはPRO機能です", text)


def fix_callout_space(text: str) -> str:
    return re.sub(r"^(\s*:{3,})\s+(\w)", r"\1\2", text)


def fix_english_titles(text: str) -> str:
    for english, japanese in ENGLISH_TITLES.items():
        text = text.replace(f'title="{english}"', f'title="{japanese}"')
    return text


def fix_spacing_segment(text: str) -> str:
    text = re.sub(r"([a-zA-Z0-9%])(" + JP + ")", r"\1 \2", text)
    return re.sub(r"(" + JP + r")([a-zA-Z0-9])", r"\1 \2", text)


def find_close_paren(text: str, start: int) -> int:
    depth = 1
    index = start + 1
    while index < len(text):
        if text[index] == "(":
            depth += 1
        elif text[index] == ")":
            depth -= 1
            if depth == 0:
                return index
        index += 1
    return -1


def fix_parens_line(line: str) -> str:
    result: list[str] = []
    index = 0

    while index < len(line):
        skipped = consume_non_processable(line, index)
        if skipped:
            text, index = skipped
            result.append(text)
            continue

        if line[index] == "(":
            end = find_close_paren(line, index)
            if end != -1:
                inner = fix_parens_line(line[index + 1 : end])
                has_japanese_inside = bool(re.search(JP, inner))
                has_japanese_before = index > 0 and bool(re.search(JP, line[index - 1]))
                has_japanese_after = end + 1 < len(line) and bool(re.search(JP, line[end + 1]))
                if has_japanese_inside or has_japanese_before or has_japanese_after:
                    result.extend(("（", inner, "）"))
                else:
                    result.extend(("(", inner, ")"))
                index = end + 1
                continue

        result.append(line[index])
        index += 1

    return "".join(result)


def apply_text_fixes(line: str) -> str:
    line = apply_to_processable(line, fix_katakana)
    line = apply_to_processable(line, fix_tatoeba)
    line = fix_callout_space(line)
    line = fix_english_titles(line)
    line = apply_to_processable(line, fix_spacing_segment)
    line = apply_to_processable(line, fix_pro_label)
    return fix_parens_line(line)


def convert_legacy_callouts(lines: list[str], code_lines: set[int]) -> list[str]:
    result: list[str] = []
    index = 0

    while index < len(lines):
        if index in code_lines:
            result.append(lines[index])
            index += 1
            continue

        match = LEGACY_CALLOUT_RE.match(lines[index])
        if not match:
            result.append(lines[index])
            index += 1
            continue

        indent, emoji, title_text = match.group(1), match.group(2), match.group(3).strip()
        callout_type = EMOJI_MAP.get(emoji, "note")
        if emoji == "\U0001f4d8" and "注意" in title_text:
            callout_type = "warning"

        body_lines: list[str] = []
        index += 1
        while index < len(lines):
            stripped = lines[index].lstrip()
            if not stripped.startswith(">") or LEGACY_CALLOUT_RE.match(lines[index]):
                break
            body_lines.append(re.sub(r"^\s*>\s?", "", lines[index]))
            index += 1

        while body_lines and not body_lines[0].strip():
            body_lines.pop(0)
        while body_lines and not body_lines[-1].strip():
            body_lines.pop()

        if title_text and len(title_text) > 40:
            body_lines.insert(0, title_text)
            title_text = ""

        result.append(
            f'{indent}:::{callout_type}{{title="{title_text}"}}'
            if title_text
            else f"{indent}:::{callout_type}"
        )
        result.extend(
            f"{indent}{body_line}" if body_line.strip() else body_line for body_line in body_lines
        )
        result.append(f"{indent}:::")
        if index < len(lines) and lines[index].strip():
            result.append("")

    return result


def fix_danger_to_warning(file_path: Path, lines: list[str]) -> list[str]:
    try:
        relative = str(file_path.relative_to(DOCS_DIR))
    except ValueError:
        relative = file_path.name
    if relative not in DANGER_TO_WARNING:
        return lines
    return [
        line.replace(":::danger", ":::warning") if line.strip().startswith(":::danger") else line
        for line in lines
    ]


def should_skip_frontmatter_line(line: str) -> bool:
    return bool(re.match(r"^(sourceUrl|updated|order|category|---)", line))


def fix_frontmatter_line(line: str, *, text_field: bool) -> str:
    line = apply_to_processable(line, fix_katakana)
    line = apply_to_processable(line, fix_tatoeba)
    if text_field or re.match(r"^\s+-\s", line):
        line = apply_to_processable(line, fix_spacing_segment)
    line = apply_to_processable(line, fix_pro_label)
    return fix_parens_line(line) if text_field else line


def fix_content(raw: str, file_path: Path) -> str:
    lines = raw.split("\n")
    code_lines = find_code_blocks(lines)
    lines = convert_legacy_callouts(lines, code_lines)
    code_lines = find_code_blocks(lines)
    lines = fix_danger_to_warning(file_path, lines)
    frontmatter_start, frontmatter_end = find_frontmatter(lines)

    fixed_lines: list[str] = []
    in_frontmatter_text = False
    for index, line in enumerate(lines):
        if index in code_lines:
            fixed_lines.append(line)
            continue

        in_frontmatter = (
            frontmatter_start is not None
            and frontmatter_end is not None
            and frontmatter_start <= index <= frontmatter_end
        )
        if not in_frontmatter:
            fixed_lines.append(apply_text_fixes(line))
            continue

        if should_skip_frontmatter_line(line):
            in_frontmatter_text = False
            fixed_lines.append(line)
        elif re.match(r"^(title|description)\s*:", line):
            in_frontmatter_text = True
            fixed_lines.append(fix_frontmatter_line(line, text_field=True))
        elif line.startswith("  ") and in_frontmatter_text:
            fixed_lines.append(fix_frontmatter_line(line, text_field=True))
        else:
            in_frontmatter_text = False
            fixed_lines.append(fix_frontmatter_line(line, text_field=False))

    return "\n".join(fixed_lines)


def read_utf8_text(file_path: Path) -> str | None:
    try:
        return file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError as error:
        print(f"Warning: skipped non-UTF-8 file: {file_path} ({error})", file=sys.stderr)
        return None
    except OSError as error:
        print(f"Warning: skipped unreadable file: {file_path} ({error})", file=sys.stderr)
        return None


def fix_file(file_path: Path) -> bool:
    raw = read_utf8_text(file_path)
    if raw is None:
        return False
    fixed = fix_content(raw, file_path)
    if fixed == raw:
        return False
    try:
        file_path.write_text(fixed, encoding="utf-8")
    except OSError as error:
        print(f"Warning: failed to write {file_path} ({error})", file=sys.stderr)
        return False
    return True


def strip_non_processable(line: str) -> str:
    line = re.sub(r"`[^`]+`", "", line)
    line = re.sub(r"https?://\S+", "", line)
    line = re.sub(r"\]\([^)]*\)", "]()", line)
    return re.sub(r"<[^>]+>", "", line)


def verify_file(file_path: Path) -> list[Issue]:
    raw = read_utf8_text(file_path)
    if raw is None:
        try:
            relative = str(file_path.relative_to(DOCS_DIR))
        except ValueError:
            relative = file_path.name
        return [Issue(relative, 0, "unreadable-file", f"Could not read: {file_path}")]
    lines = raw.split("\n")
    code_lines = find_code_blocks(lines)
    frontmatter_start, frontmatter_end = find_frontmatter(lines)
    try:
        relative = str(file_path.relative_to(DOCS_DIR))
    except ValueError:
        relative = file_path.name
    issues: list[Issue] = []

    for index, line in enumerate(lines):
        if index in code_lines:
            continue
        in_frontmatter = (
            frontmatter_start is not None
            and frontmatter_end is not None
            and frontmatter_start <= index <= frontmatter_end
        )
        if in_frontmatter and re.match(r"^(sourceUrl|updated|order|category|---)", line):
            continue

        line_number = index + 1
        clean = strip_non_processable(line)
        excerpt = line.strip()[:80]
        checks: tuple[tuple[str, bool], ...] = (
            ("legacy-callout", bool(re.match(r"^\s*>\s*(📘|🚧|❗|👍)", line))),
            ("パラメータ→パラメーター", bool(re.search(r"パラメータ(?!ー)", clean))),
            ("ブラウザー→ブラウザ", "ブラウザー" in clean),
            ("エディタ→エディター", bool(re.search(r"エディタ(?!ー)", clean))),
            ("フォルダ→フォルダー", bool(re.search(r"フォルダ(?!ー)", clean))),
            ("たとえば→例えば", "たとえば" in clean),
            ("PRO機能統一", bool(re.search(r"プロ機能|Pro\s*機能|PRO\s+機能", clean))),
            ("callout-space", bool(re.match(r"^\s*:{3,}\s+\w", line))),
        )
        issues.extend(
            Issue(relative, line_number, kind, excerpt) for kind, has_issue in checks if has_issue
        )

        if in_frontmatter:
            continue

        has_ascii_japanese = re.search(r"[a-zA-Z0-9%]" + JP, clean)
        has_japanese_ascii = re.search(JP + r"[a-zA-Z0-9]", clean)
        clean_without_pro = clean.replace("PRO機能", "")
        if (
            (has_ascii_japanese or has_japanese_ascii)
            and not re.match(r"^:{3,}", line)
            and not (
                re.search(r"#[a-zA-Z0-9_-]*" + JP, clean)
                and not re.search(r"(?<!#)[a-zA-Z0-9%]" + JP, clean.split("#")[0])
            )
            and not (
                "PRO機能" in clean
                and not re.search(r"(?<!PRO)[a-zA-Z0-9%]" + JP, clean_without_pro)
                and not re.search(JP + r"[a-zA-Z0-9]", clean_without_pro)
            )
        ):
            issues.append(Issue(relative, line_number, "spacing-missing", excerpt))

        for match in re.finditer(r"\(([^)]*)\)", clean):
            if match.start() > 0 and clean[match.start() - 1] == "]":
                continue
            if re.search(JP, match.group(1)):
                issues.append(Issue(relative, line_number, "half-width-parens", excerpt))

    return issues


def iter_doc_files(docs_dir: Path = DOCS_DIR) -> list[Path]:
    return sorted(docs_dir.rglob("*.md"))


def run_fix(docs_dir: Path = DOCS_DIR) -> int:
    if not docs_dir.is_dir():
        print(f"Error: {docs_dir} not found", file=sys.stderr)
        return 1

    changed = 0
    files = iter_doc_files(docs_dir)
    for file_path in files:
        if fix_file(file_path):
            changed += 1
            print(f"  Modified: {file_path.relative_to(docs_dir)}")

    print(f"Done: {len(files)} files scanned, {changed} modified")
    return 0


def run_verify(docs_dir: Path = DOCS_DIR) -> int:
    if not docs_dir.is_dir():
        print(f"Error: {docs_dir} not found", file=sys.stderr)
        return 1

    files = iter_doc_files(docs_dir)
    issues = [issue for file_path in files for issue in verify_file(file_path)]
    if not issues:
        print(f"All clean. {len(files)} files verified, 0 issues found.")
        return 0

    print(f"Found {len(issues)} remaining issues:\n")
    current_file = ""
    for issue in issues:
        if issue.file != current_file:
            current_file = issue.file
            print(f"\n  {issue.file}:")
        print(f"    L{issue.line} [{issue.kind}] {issue.excerpt}")
    return 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fix or verify notation consistency in docs.")
    parser.add_argument("command", choices=("fix", "verify"), help="実行する処理")
    args = parser.parse_args(argv)

    if args.command == "fix":
        return run_fix()
    return run_verify()


if __name__ == "__main__":
    sys.exit(main())
