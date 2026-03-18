#!/usr/bin/env python3
"""
Comprehensive fix for notation inconsistencies in Testim docs.
Handles:
1. Katakana long vowel fixes
2. たとえば → 例えば
3. PRO機能 standardization
4. English-Japanese spacing
5. Parentheses (half-width → full-width in Japanese context)
6. Legacy callout conversion (> 📘 → :::note etc.)
7. Callout formatting fixes
8. English callout title translation
"""

import re
import sys
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parent.parent / "src" / "content" / "docs"

# Japanese character ranges — hiragana, katakana, CJK ideographs ONLY.
# Excludes \u3000-\u303f (CJK punctuation: 「」、。（）) to prevent
# spacing insertion around Japanese punctuation marks.
JP = r'[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]'

EMOJI_MAP = {
    '\U0001f4d8': 'note',   # 📘
    '\U0001f6a7': 'warning', # 🚧
    '\u2757': 'danger',      # ❗
    '\U0001f44d': 'tip',     # 👍
}

ENGLISH_TITLES = {
    'Always Save Your Changes!': '変更を必ず保存してください',
    'Auto Recovery': '自動復旧',
    'Test Compatibility': 'テスト互換性',
    'OS Compatibility': 'OS 互換性',
    'BrowserStack certificate error': 'BrowserStack 証明書エラー',
    'Permissions Notice': '権限について',
    'New branch': '新しいブランチ',
    'CLI Steps': 'CLI ステップ',
}

# Files where :::danger should be :::warning
DANGER_TO_WARNING = {
    'results/tag-remote-runs-failures.md',
    'steps-editing-tests/editing-a-steps-properties.md',
}

stats = {'files_modified': 0, 'files_total': 0}


def find_code_blocks(lines):
    """Return set of line indices inside fenced code blocks."""
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
    """Return (start, end) line indices of frontmatter, or (None, None)."""
    if not lines or lines[0].strip() != '---':
        return None, None
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            return 0, i
    return None, None


# --- Tokenization ---
# All text transformations go through this to protect inline code, URLs, HTML.

def split_processable(line):
    """Split line into (text, processable) segments.
    Non-processable: inline code, markdown link URLs, HTML tags.
    """
    segments = []
    i = 0
    n = len(line)

    while i < n:
        # Inline code
        if line[i] == '`':
            j = line.find('`', i + 1)
            if j != -1:
                segments.append((line[i:j + 1], False))
                i = j + 1
                continue

        # Markdown link/image URL: ](url)
        if i + 1 < n and line[i] == ']' and line[i + 1] == '(':
            j = line.find(')', i + 2)
            if j != -1:
                segments.append((line[i:j + 1], False))
                i = j + 1
                continue

        # HTML tag
        if line[i] == '<' and i + 1 < n and (line[i + 1].isalpha() or line[i + 1] == '/'):
            j = line.find('>', i + 1)
            if j != -1:
                segments.append((line[i:j + 1], False))
                i = j + 1
                continue

        # Bare URL (http:// or https://)
        if line[i:i+4] == 'http':
            m = re.match(r'https?://\S+', line[i:])
            if m:
                url = m.group(0)
                segments.append((url, False))
                i += len(url)
                continue

        # Regular text — accumulate
        j = i + 1
        while j < n:
            if line[j] == '`':
                break
            if j + 1 < n and line[j] == ']' and line[j + 1] == '(':
                break
            if line[j] == '<' and j + 1 < n and (line[j + 1].isalpha() or line[j + 1] == '/'):
                break
            if line[j:j+4] == 'http' and re.match(r'https?://', line[j:]):
                break
            j += 1
        segments.append((line[i:j], True))
        i = j

    return segments


def apply_to_processable(line, fn):
    """Apply a text transformation function only to processable segments."""
    segments = split_processable(line)
    return ''.join(
        fn(t) if proc else t
        for t, proc in segments
    )


# --- Simple text replacements ---

def fix_katakana(text):
    """Fix katakana long vowel inconsistencies."""
    text = re.sub(r'パラメータ(?!ー)', 'パラメーター', text)
    text = text.replace('ブラウザー', 'ブラウザ')
    text = re.sub(r'エディタ(?!ー)', 'エディター', text)
    text = re.sub(r'フォルダ(?!ー)', 'フォルダー', text)
    return text


def fix_tatoeba(text):
    return text.replace('たとえば', '例えば')


def fix_pro_label(text):
    """Standardize PRO機能 variants. Run AFTER spacing to fix 'PRO 機能'."""
    text = text.replace('プロ機能', 'PRO機能')
    text = re.sub(r'Pro\s*機能', 'PRO機能', text)
    text = re.sub(r'PRO\s+機能', 'PRO機能', text)
    text = re.sub(r'これは\s*PRO\s*機能です', 'これはPRO機能です', text)
    text = re.sub(r'これは\s*Pro\s*機能です', 'これはPRO機能です', text)
    return text


def fix_callout_space(text):
    """::: note → :::note (remove space between ::: and type name).
    Handles indented directives (e.g. '   ::: note' inside list items).
    """
    return re.sub(r'^(\s*:{3,})\s+(\w)', r'\1\2', text)


def fix_english_titles(text):
    """Translate known English callout titles to Japanese."""
    for eng, jpn in ENGLISH_TITLES.items():
        text = text.replace(f'title="{eng}"', f'title="{jpn}"')
    return text


# --- Spacing ---

def fix_spacing_segment(text):
    """Add spaces between ASCII alphanumerics and Japanese characters."""
    text = re.sub(r'([a-zA-Z0-9%])(' + JP + ')', r'\1 \2', text)
    text = re.sub(r'(' + JP + r')([a-zA-Z0-9])', r'\1 \2', text)
    return text


def fix_spacing_line(line):
    return apply_to_processable(line, fix_spacing_segment)


# --- Parentheses ---

def find_close_paren(text, start):
    """Find matching close paren handling nesting. Returns index or -1."""
    depth = 1
    i = start + 1
    while i < len(text):
        if text[i] == '(':
            depth += 1
        elif text[i] == ')':
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def fix_parens_segment(text):
    """Convert half-width () to full-width （） in Japanese context."""
    result = []
    i = 0
    n = len(text)

    while i < n:
        if text[i] == '(':
            j = find_close_paren(text, i)
            if j != -1:
                inner = text[i + 1:j]
                inner = fix_parens_segment(inner)  # recursive

                has_jp_inside = bool(re.search(JP, inner))
                has_jp_before = i > 0 and bool(re.search(JP, text[i - 1]))
                has_jp_after = j + 1 < n and bool(re.search(JP, text[j + 1]))

                if has_jp_inside or has_jp_before or has_jp_after:
                    result.append('（')
                    result.append(inner)
                    result.append('）')
                    i = j + 1
                    continue
                else:
                    result.append('(')
                    result.append(inner)
                    result.append(')')
                    i = j + 1
                    continue
        result.append(text[i])
        i += 1

    return ''.join(result)


def _fix_parens_raw(line):
    """Convert half-width () to full-width （） in Japanese context.
    Works on the full line to handle parens that span across inline code/links.
    Skips: markdown link URLs ](url), inline code `...`, HTML tags <...>, bare URLs.
    """
    result = []
    i = 0
    n = len(line)

    while i < n:
        # Skip inline code spans
        if line[i] == '`':
            j = line.find('`', i + 1)
            if j != -1:
                result.append(line[i:j + 1])
                i = j + 1
                continue

        # Skip markdown link URL: ](url)
        if i + 1 < n and line[i] == ']' and line[i + 1] == '(':
            j = line.find(')', i + 2)
            if j != -1:
                result.append(line[i:j + 1])
                i = j + 1
                continue

        # Skip HTML tags
        if line[i] == '<' and i + 1 < n and (line[i + 1].isalpha() or line[i + 1] == '/'):
            j = line.find('>', i + 1)
            if j != -1:
                result.append(line[i:j + 1])
                i = j + 1
                continue

        # Skip bare URLs
        if line[i:i + 4] == 'http':
            m = re.match(r'https?://\S+', line[i:])
            if m:
                url = m.group(0)
                result.append(url)
                i += len(url)
                continue

        if line[i] == '(':
            j = find_close_paren(line, i)
            if j != -1:
                inner = line[i + 1:j]
                # Recursively process inner content for nested parens
                inner = _fix_parens_raw(inner)

                has_jp_inside = bool(re.search(JP, inner))
                has_jp_before = i > 0 and bool(re.search(JP, line[i - 1]))
                has_jp_after = j + 1 < n and bool(re.search(JP, line[j + 1]))

                if has_jp_inside or has_jp_before or has_jp_after:
                    result.append('（')
                    result.append(inner)
                    result.append('）')
                    i = j + 1
                    continue
                else:
                    result.append('(')
                    result.append(inner)
                    result.append(')')
                    i = j + 1
                    continue
        result.append(line[i])
        i += 1

    return ''.join(result)


def fix_parens_line(line):
    return _fix_parens_raw(line)


# --- Legacy callout conversion ---

_emoji_pattern = re.compile(
    r'^(\s*)>\s*(' + '|'.join(re.escape(e) for e in EMOJI_MAP) + r')\s*(.*)'
)


def convert_legacy_callouts(lines, code_lines):
    """Convert > 📘/🚧/❗/👍 blockquote callouts to ::: format.
    Handles both non-indented and indented callouts (e.g. inside list items).
    Skips lines inside code blocks.
    """
    result = []
    i = 0

    while i < len(lines):
        if i in code_lines:
            result.append(lines[i])
            i += 1
            continue

        m = _emoji_pattern.match(lines[i])
        if m:
            indent = m.group(1)
            emoji = m.group(2)
            title_text = m.group(3).strip()

            callout_type = EMOJI_MAP.get(emoji, 'note')
            if emoji == '\U0001f4d8' and '注意' in title_text:
                callout_type = 'warning'

            body_lines = []
            i += 1
            while i < len(lines):
                stripped = lines[i].lstrip()
                if not stripped.startswith('>'):
                    break
                # Stop if a new legacy callout starts
                if _emoji_pattern.match(lines[i]):
                    break
                body_content = re.sub(r'^\s*>\s?', '', lines[i])
                body_lines.append(body_content)
                i += 1

            # Trim empty lines from body
            while body_lines and not body_lines[0].strip():
                body_lines.pop(0)
            while body_lines and not body_lines[-1].strip():
                body_lines.pop()

            # Long title (>40 chars) → move to body
            if title_text and len(title_text) > 40:
                body_lines.insert(0, title_text)
                title_text = ''

            if title_text:
                result.append(f'{indent}:::{callout_type}{{title="{title_text}"}}')
            else:
                result.append(f'{indent}:::{callout_type}')

            for bl in body_lines:
                result.append(f'{indent}{bl}' if bl.strip() else bl)

            result.append(f'{indent}:::')

            # Ensure blank line after callout
            if i < len(lines) and lines[i].strip():
                result.append('')
        else:
            result.append(lines[i])
            i += 1

    return result


# --- File-specific fixes ---

def fix_danger_to_warning(filepath, lines):
    rel = str(filepath.relative_to(DOCS_DIR))
    if rel not in DANGER_TO_WARNING:
        return lines
    return [
        line.replace(':::danger', ':::warning') if line.strip().startswith(':::danger') else line
        for line in lines
    ]


# --- Frontmatter helpers ---

def is_fm_structural_line(line):
    """Return True for frontmatter lines that should not be text-processed."""
    return bool(re.match(r'^(sourceUrl|updated|order|category|---)', line))


def is_fm_text_field_header(line):
    """Return True for frontmatter text field headers (title:, description:)."""
    return bool(re.match(r'^(title|description)\s*:', line))


def is_fm_continuation_line(line):
    """Return True for YAML folded/continuation lines (indented, no key:)."""
    return bool(re.match(r'^  \S', line)) and ':' not in line.split()[0] if line.strip() else False


# --- Main processing ---

def apply_text_fixes(line):
    """Apply all text-level fixes to a processable line, protecting inline code/URLs."""
    line = apply_to_processable(line, fix_katakana)
    line = apply_to_processable(line, fix_tatoeba)
    line = fix_callout_space(line)
    line = fix_english_titles(line)
    line = fix_spacing_line(line)
    line = apply_to_processable(line, fix_pro_label)  # after spacing
    line = fix_parens_line(line)
    return line


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    lines = content.split('\n')

    # Step 1: Detect code blocks FIRST (before any transformation)
    code_lines = find_code_blocks(lines)

    # Step 2: Legacy callout conversion (now respects code blocks)
    lines = convert_legacy_callouts(lines, code_lines)

    # Step 3: Recalculate code blocks after callout conversion
    code_lines = find_code_blocks(lines)

    # Step 4: File-specific fixes
    lines = fix_danger_to_warning(filepath, lines)

    # Step 5: Detect frontmatter
    fm_start, fm_end = find_frontmatter(lines)

    # Track if we're in a text field continuation in frontmatter
    in_fm_text_field = False

    # Step 6: Per-line fixes
    new_lines = []
    for i, line in enumerate(lines):
        is_code = i in code_lines
        is_fm = fm_start is not None and fm_start <= i <= fm_end

        if is_code:
            new_lines.append(line)
            continue

        if is_fm:
            if is_fm_structural_line(line):
                in_fm_text_field = False
                new_lines.append(line)
                continue

            # Check if this is a text field header or continuation
            if is_fm_text_field_header(line):
                in_fm_text_field = True
                # Apply all fixes including spacing and parens
                line = apply_to_processable(line, fix_katakana)
                line = apply_to_processable(line, fix_tatoeba)
                line = fix_spacing_line(line)
                line = apply_to_processable(line, fix_pro_label)
                line = fix_parens_line(line)
                new_lines.append(line)
                continue
            elif line.startswith('  ') and in_fm_text_field:
                # Continuation line of title/description
                line = apply_to_processable(line, fix_katakana)
                line = apply_to_processable(line, fix_tatoeba)
                line = fix_spacing_line(line)
                line = apply_to_processable(line, fix_pro_label)
                line = fix_parens_line(line)
                new_lines.append(line)
                continue
            elif re.match(r'^keywords\s*:', line):
                in_fm_text_field = False
                # keywords header line — apply katakana/tatoeba/pro only
                line = apply_to_processable(line, fix_katakana)
                line = apply_to_processable(line, fix_tatoeba)
                line = apply_to_processable(line, fix_pro_label)
                new_lines.append(line)
                continue
            elif re.match(r'^\s+-\s', line):
                # keywords list item — apply katakana/tatoeba/spacing/pro
                in_fm_text_field = False
                line = apply_to_processable(line, fix_katakana)
                line = apply_to_processable(line, fix_tatoeba)
                line = fix_spacing_line(line)
                line = apply_to_processable(line, fix_pro_label)
                new_lines.append(line)
                continue
            else:
                in_fm_text_field = False
                # Other frontmatter lines — apply katakana/tatoeba/pro
                line = apply_to_processable(line, fix_katakana)
                line = apply_to_processable(line, fix_tatoeba)
                line = apply_to_processable(line, fix_pro_label)
                new_lines.append(line)
                continue

        # Regular line: apply all fixes via tokenization
        line = apply_text_fixes(line)
        new_lines.append(line)

    content = '\n'.join(new_lines)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        stats['files_modified'] += 1
        print(f'  Modified: {filepath.relative_to(DOCS_DIR)}')

    stats['files_total'] += 1


def main():
    if not DOCS_DIR.is_dir():
        print(f'Error: {DOCS_DIR} not found')
        sys.exit(1)

    print(f'Processing files in {DOCS_DIR} ...\n')

    for filepath in sorted(DOCS_DIR.rglob('*.md')):
        process_file(filepath)

    print(f"\nDone: {stats['files_total']} files scanned, "
          f"{stats['files_modified']} modified")


if __name__ == '__main__':
    main()
