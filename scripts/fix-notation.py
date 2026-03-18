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

# Japanese character ranges (excluding fullwidth Latin/punctuation to avoid spacing issues)
JP = r'[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\u3000-\u303f]'

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
    """::: note → :::note (remove space between ::: and type name)."""
    return re.sub(r'^(:{3,})\s+(\w)', r'\1\2', text)


def fix_english_titles(text):
    """Translate known English callout titles to Japanese."""
    for eng, jpn in ENGLISH_TITLES.items():
        text = text.replace(f'title="{eng}"', f'title="{jpn}"')
    return text


# --- Spacing ---

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

        # Regular text — accumulate
        j = i + 1
        while j < n:
            if line[j] == '`':
                break
            if j + 1 < n and line[j] == ']' and line[j + 1] == '(':
                break
            if line[j] == '<' and j + 1 < n and (line[j + 1].isalpha() or line[j + 1] == '/'):
                break
            j += 1
        segments.append((line[i:j], True))
        i = j

    return segments


def fix_spacing_segment(text):
    """Add spaces between ASCII alphanumerics and Japanese characters."""
    text = re.sub(r'([a-zA-Z0-9%])(' + JP + ')', r'\1 \2', text)
    text = re.sub(r'(' + JP + r')([a-zA-Z0-9])', r'\1 \2', text)
    return text


def fix_spacing_line(line):
    segments = split_processable(line)
    return ''.join(
        fix_spacing_segment(t) if proc else t
        for t, proc in segments
    )


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


def fix_parens_line(line):
    segments = split_processable(line)
    return ''.join(
        fix_parens_segment(t) if proc else t
        for t, proc in segments
    )


# --- Legacy callout conversion ---

_emoji_pattern = re.compile(
    r'^>\s*(' + '|'.join(re.escape(e) for e in EMOJI_MAP) + r')\s*(.*)'
)


def convert_legacy_callouts(lines):
    """Convert > 📘/🚧/❗/👍 blockquote callouts to ::: format."""
    result = []
    i = 0

    while i < len(lines):
        m = _emoji_pattern.match(lines[i])
        if m:
            emoji = m.group(1)
            title_text = m.group(2).strip()

            callout_type = EMOJI_MAP.get(emoji, 'note')
            if emoji == '\U0001f4d8' and '注意' in title_text:
                callout_type = 'warning'

            body_lines = []
            i += 1
            while i < len(lines) and lines[i].startswith('>'):
                # Stop if a new legacy callout starts
                if _emoji_pattern.match(lines[i]):
                    break
                body_content = re.sub(r'^>\s?', '', lines[i])
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
                result.append(f':::{callout_type}{{title="{title_text}"}}')
            else:
                result.append(f':::{callout_type}')

            for bl in body_lines:
                result.append(bl)

            result.append(':::')

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


# --- Main processing ---

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    lines = content.split('\n')

    # Step 1: Legacy callout conversion
    lines = convert_legacy_callouts(lines)

    # Step 2: File-specific fixes
    lines = fix_danger_to_warning(filepath, lines)

    # Step 3: Detect code blocks and frontmatter
    code_lines = find_code_blocks(lines)
    fm_start, fm_end = find_frontmatter(lines)

    # Step 4: Per-line fixes
    new_lines = []
    for i, line in enumerate(lines):
        is_code = i in code_lines
        is_fm = fm_start is not None and fm_start <= i <= fm_end

        if is_code:
            new_lines.append(line)
            continue

        if is_fm:
            # Process all frontmatter text fields (title, description, keywords)
            # Skip only structural fields: sourceUrl, updated, order, category
            if not re.match(r'^(sourceUrl|updated|order|category|---)', line):
                line = fix_katakana(line)
                line = fix_tatoeba(line)
                if line.startswith('title:') or line.startswith('description:'):
                    line = fix_spacing_line(line)
                    line = fix_parens_line(line)
                line = fix_pro_label(line)  # after spacing to fix "PRO 機能"
            new_lines.append(line)
            continue

        # Regular line: apply all fixes in order
        line = fix_katakana(line)
        line = fix_tatoeba(line)
        line = fix_callout_space(line)
        line = fix_english_titles(line)
        line = fix_spacing_line(line)
        line = fix_pro_label(line)  # after spacing to fix "PRO 機能"
        line = fix_parens_line(line)

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
