"""Callout contract — 4 layers が同じ type 集合 {note, caution, warning, info, tip, danger}
に一致することを pin する。

* Layer 1 (EN extractor): ``segments_en._CALLOUT_CLASS_RE``
* Layer 2 (JA extractor): ``segments_ja._CALLOUT_OPEN_RE``
* Layer 3 (renderer):     ``astro.config.mjs`` の ``callouts: { ... }`` block
* Layer 4 (WRITING_GUIDE): ``docs/WRITING_GUIDE.md`` の callout mapping 表

Layer 1 / 2 は Python regex の pattern 文字列を直接検査する。Layer 3 / 4 は repo
root の外部ファイルを grep する (mjs 版と同じ契約)。
"""

from __future__ import annotations

import re

from testim_parity.project import PROJECT_ROOT
from testim_parity.segments_en import _CALLOUT_CLASS_RE
from testim_parity.segments_ja import _CALLOUT_OPEN_RE

EXPECTED: frozenset[str] = frozenset({"note", "caution", "warning", "info", "tip", "danger"})


def _extract_alternation(pattern: re.Pattern[str]) -> set[str]:
    """``r"\b(a|b|c)\b"`` 風の pattern から alternation 要素を抽出する。"""
    match = re.search(r"\(([a-zA-Z|\s]+)\)", pattern.pattern)
    assert match is not None, f"alternation not found in pattern {pattern.pattern!r}"
    return {token.strip() for token in match.group(1).split("|") if token.strip()}


class TestCalloutContract:
    def test_layer1_en_extractor(self) -> None:
        """Layer 1: segments_en の ``_CALLOUT_CLASS_RE`` が expected set に一致する。"""
        assert _extract_alternation(_CALLOUT_CLASS_RE) == EXPECTED

    def test_layer2_ja_extractor(self) -> None:
        """Layer 2: segments_ja の ``_CALLOUT_OPEN_RE`` が expected set に一致する。"""
        assert _extract_alternation(_CALLOUT_OPEN_RE) == EXPECTED

    def test_layer3_renderer_astro_config(self) -> None:
        """Layer 3: ``astro.config.mjs`` の ``callouts: { ... }`` key 集合を確認する。"""
        astro_config = (PROJECT_ROOT / "astro.config.mjs").read_text(encoding="utf-8")
        block_match = re.search(r"callouts:\s*\{([\s\S]+?)\n\s+\},\s*\n\s*\},", astro_config)
        assert block_match is not None, "callouts block not found in astro.config.mjs"
        keys = set(re.findall(r"^\s+(\w+):\s*\{", block_match.group(1), re.MULTILINE))
        assert keys == EXPECTED

    def test_layer4_writing_guide_mapping_table(self) -> None:
        """Layer 4: ``WRITING_GUIDE.md`` の callout マッピング表の JA 列を確認する。"""
        guide = (PROJECT_ROOT / "docs" / "WRITING_GUIDE.md").read_text(encoding="utf-8")
        section = re.search(
            r"### 原文 blockquote → JA callout 変換マッピング[\s\S]+?\n\n([\s\S]+?)\n\n",
            guide,
        )
        assert section is not None, "callout mapping section not found"
        table_rows = [
            line
            for line in section.group(1).split("\n")
            if line.startswith("|") and "---" not in line
        ]
        assert len(table_rows) >= 2, "expected header + at least 1 data row"
        ja_types: set[str] = set()
        for row in table_rows[1:]:
            cells = [cell.strip() for cell in row.split("|")]
            # ``cells[0]`` は先頭の ``|`` 由来の空文字。JA type 列は 3 番目 (index 2)。
            if len(cells) < 3:
                continue
            ja_cell = cells[2].replace("`", "").replace(":::", "")
            if ja_cell in EXPECTED:
                ja_types.add(ja_cell)
        assert ja_types == EXPECTED
