#!/usr/bin/env python3
"""
Verification script for notation consistency after fix-notation.py.
Checks that all known issues have been resolved.
"""

import re
import sys
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parent.parent / "src" / "content" / "docs"

# Japanese character ranges — hiragana, katakana, CJK ideographs ONLY.
# Excludes \u3000-\u303f (CJK punctuation: 「」、。（）) to match fix-notation.py.
JP = r'[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]'

issues = []


def find_code_blocks(lines):
    code_lines = set()
    fence_char = None
    fence_len = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if fence_char is None:
            m = re.match(r'^(`{3,}|~{3,})', stripped)
            if m:
                fence_char = m.group(1)[0]
                fence_len = len(m.group(1))
                code_lines.add(i)
        else:
            code_lines.add(i)
            m = re.match(r'^(`{3,}|~{3,})\s*$', stripped)
            if m and m.group(1)[0] == fence_char and len(m.group(1)) >= fence_len:
                fence_char = None
    return code_lines


def find_frontmatter(lines):
    if not lines or lines[0].strip() != '---':
        return None, None
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            return 0, i
    return None, None


def strip_inline_code(line):
    """Remove inline code spans from line for checking."""
    return re.sub(r'`[^`]+`', '', line)


def strip_urls(line):
    """Remove URLs from line for checking."""
    return re.sub(r'https?://\S+', '', line)


def strip_non_processable(line):
    """Remove inline code, URLs, HTML tags, and markdown link URLs for checking."""
    line = strip_inline_code(line)
    line = strip_urls(line)
    # Remove markdown link URLs: ](...)
    line = re.sub(r'\]\([^)]*\)', ']()', line)
    # Remove HTML tags
    line = re.sub(r'<[^>]+>', '', line)
    return line


def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    code_lines = find_code_blocks(lines)
    fm_start, fm_end = find_frontmatter(lines)
    rel = str(filepath.relative_to(DOCS_DIR))

    for i, line in enumerate(lines):
        if i in code_lines:
            continue
        is_fm = fm_start is not None and fm_start <= i <= fm_end
        if is_fm and re.match(r'^(sourceUrl|updated|order|category|---)', line):
            continue

        lineno = i + 1
        # Strip non-processable content for checks that should skip code/URLs
        clean = strip_non_processable(line)

        # 1. Legacy callout remnants (including indented ones in list items)
        if re.match(r'^\s*>\s*(📘|🚧|❗|👍)', line):
            issues.append((rel, lineno, 'legacy-callout', line.strip()[:60]))

        # 2. パラメータ without ー (check clean text)
        if re.search(r'パラメータ(?!ー)', clean):
            issues.append((rel, lineno, 'パラメータ→パラメーター', line.strip()[:60]))

        # 3. ブラウザー (should be ブラウザ)
        if 'ブラウザー' in clean:
            issues.append((rel, lineno, 'ブラウザー→ブラウザ', line.strip()[:60]))

        # 4. エディタ without ー
        if re.search(r'エディタ(?!ー)', clean):
            issues.append((rel, lineno, 'エディタ→エディター', line.strip()[:60]))

        # 5. フォルダ without ー
        if re.search(r'フォルダ(?!ー)', clean):
            issues.append((rel, lineno, 'フォルダ→フォルダー', line.strip()[:60]))

        # 6. たとえば
        if 'たとえば' in clean:
            issues.append((rel, lineno, 'たとえば→例えば', line.strip()[:60]))

        # 7. PRO機能 variants
        if re.search(r'プロ機能|Pro\s*機能|PRO\s+機能', clean):
            issues.append((rel, lineno, 'PRO機能統一', line.strip()[:60]))

        # 8. ::: with space (including indented directives in list items)
        if re.match(r'^\s*:{3,}\s+\w', line):
            issues.append((rel, lineno, 'callout-space', line.strip()[:60]))

        # 9. Spacing: ASCII/digits directly adjacent to Japanese
        #    Matches fix_spacing_segment: [a-zA-Z0-9%]→JP and JP→[a-zA-Z0-9]
        if not is_fm:
            # Check both directions: ASCII/digit/%→JP and JP→ASCII/digit
            has_ascii_jp = re.search(r'[a-zA-Z0-9%]' + JP, clean)
            has_jp_ascii = re.search(JP + r'[a-zA-Z0-9]', clean)
            if has_ascii_jp or has_jp_ascii:
                # Exclude callout/directive syntax
                if re.match(r'^:{3,}', line):
                    pass
                # Exclude anchor fragments (#slug日本語)
                elif re.search(r'#[a-zA-Z0-9_-]*' + JP, clean) and not re.search(r'(?<!#)[a-zA-Z0-9%]' + JP, clean.split('#')[0] if '#' in clean else clean):
                    pass
                # Exclude PRO機能 (deliberate compound term)
                elif re.search(r'PRO機能', clean) and not re.search(r'(?<!PRO)[a-zA-Z0-9%]' + JP, clean.replace('PRO機能', '')) and not re.search(JP + r'[a-zA-Z0-9]', clean.replace('PRO機能', '')):
                    pass
                else:
                    issues.append((rel, lineno, 'spacing-missing', line.strip()[:80]))

        # 10. Half-width parens in Japanese context (check clean text)
        if not is_fm:
            for m in re.finditer(r'\(([^)]*)\)', clean):
                inner = m.group(1)
                # Skip if inside inline code (rough check)
                before = clean[:m.start()]
                if before.count('`') % 2 == 1:
                    continue
                # Skip markdown link syntax
                if m.start() > 0 and clean[m.start() - 1] == ']':
                    continue
                if re.search(JP, inner):
                    issues.append((rel, lineno, 'half-width-parens',
                                   line[max(0, m.start() - 5):m.end() + 5].strip()[:60]))


def main():
    if not DOCS_DIR.is_dir():
        print(f'Error: {DOCS_DIR} not found')
        sys.exit(1)

    print(f'Verifying files in {DOCS_DIR} ...\n')

    file_count = 0
    for filepath in sorted(DOCS_DIR.rglob('*.md')):
        check_file(filepath)
        file_count += 1

    if issues:
        print(f'Found {len(issues)} remaining issues:\n')
        current_file = None
        for rel, lineno, kind, excerpt in issues:
            if rel != current_file:
                current_file = rel
                print(f'\n  {rel}:')
            print(f'    L{lineno} [{kind}] {excerpt}')
        print(f'\nTotal: {len(issues)} issues in {file_count} files')
        sys.exit(1)
    else:
        print(f'All clean! {file_count} files verified, 0 issues found.')
        sys.exit(0)


if __name__ == '__main__':
    main()
