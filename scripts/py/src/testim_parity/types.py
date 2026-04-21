"""parity issue severity と coarse signal / structure / source-unusable 型セット。

``scripts/lib/source_parity_types.mjs`` の port。ここのテーブルは reporter と
gate ロジックの裏方で、検出 issue の分類を決定する。変更時は
``docs/SYSTEM_SPEC.md`` 側も併せて更新すること。
"""

from __future__ import annotations

import re
from types import MappingProxyType

# issue-type → severity マッピング。
#
# segment-* 5 種は全て gate-eligible (actionable)。うち 3 種
# (segment-missing / segment-untranslated / segment-token-gap) は
# NON_ACKNOWLEDGEABLE_TYPES にも含まれており、ack で抑制できない契約。
# segment-extra と segment-shifted は ack 可能で、意図的な拡張や構造シフトを
# 人間レビューに渡すための余地として残してある。
ISSUE_SEVERITY: MappingProxyType[str, str] = MappingProxyType(
    {
        "untranslated": "actionable",
        "legacy-callout": "actionable",
        "jsx-callout": "actionable",
        "h1-in-body": "actionable",
        "image-mismatch": "actionable",
        "codeblock-mismatch": "actionable",
        "image-order-mismatch": "actionable",
        "callout-nesting-mismatch": "actionable",
        "step-count-mismatch": "signal",
        "bullet-count-mismatch": "signal",
        "paragraph-count-mismatch": "signal",
        "heading-mismatch": "signal",
        "section-count-mismatch": "signal",
        "table-shape-mismatch": "signal",
        "table-cell-english-residual": "signal",
        "table-cell-empty-mismatch": "signal",
        "table-cell-token-mismatch": "signal",
        "source-page-missing-local": "actionable",
        "local-page-orphan": "actionable",
        "missing-fresh-snapshot": "actionable",
        "missing-snapshot": "signal",
        "source-fetch-error": "error",
        "segment-missing": "actionable",
        "segment-extra": "actionable",
        "segment-shifted": "actionable",
        "segment-untranslated": "actionable",
        "segment-token-gap": "actionable",
        "segment-inconclusive": "actionable",
        "section-structure-mismatch": "actionable",
        "segment-order-mismatch": "actionable",
        "snapshot-incomplete": "actionable",
        "source-unusable": "actionable",
    }
)

# coarse count / shape signals を audit-only に降格するための明示 allowlist。
# **severity ベースフィルタ (「任意の signal」) にしてはならない** — それだと
# ``missing-snapshot`` まで誤降格され、新規/欠落ページの gate signal が失われる
# (``missing-fresh-snapshot`` の actionable 対と組になっているため reportable
# 必須)。
COARSE_SIGNAL_TYPES: frozenset[str] = frozenset(
    {
        "paragraph-count-mismatch",
        "bullet-count-mismatch",
        "step-count-mismatch",
        "section-count-mismatch",
        "heading-mismatch",
        "table-shape-mismatch",
        "table-cell-english-residual",
        "table-cell-empty-mismatch",
        "table-cell-token-mismatch",
    }
)

# canonical block-sequence comparator が出す structure-mismatch 型。
#
# 契約:
#   - coarse audit signals には含まれない
#   - summary の structureMismatchIssues / structureMismatchFiles に独立 counter
#     として集計 (gate counter と並走)
#   - isReportableParityIssue() は reportable 扱い。ack / baseline で覆われていない
#     active な structure mismatch は reportableActive* を経由して gate exit 1 を駆動
#   - acknowledgement 可 (NON_ACKNOWLEDGEABLE_TYPES に含まれない)
#   - baseline 対応済み — identity key は
#     ``sectionIndex + structureCategory + structureFingerprint``
STRUCTURE_MISMATCH_TYPES: frozenset[str] = frozenset(
    {
        "section-structure-mismatch",
        "segment-order-mismatch",
    }
)

# snapshot / source 起因で comparator が成立しないページ用の集合。
#
# 契約:
#   - coarse audit signals には含まれない
#   - summary の snapshotUnusableIssues / snapshotUnusableFiles に独立 counter
#     (translation drift とは別枠)
#   - isReportableParityIssue() は常に false — 翻訳者責任外の debt なので、
#     active source unusable があっても gate exit は 0 のまま。CLI は
#     ``(source unusable)`` suffix で advisory 表示する
#   - acknowledgement 可 (既知の snapshot 崩れを ack で抑制可能)
#   - baseline 対応済み — identity key は ``usabilityReason`` 単独。特殊ルール:
#     期限切れ baseline でも gate を refire しない
SOURCE_UNUSABLE_TYPES: frozenset[str] = frozenset(
    {
        "snapshot-incomplete",
        "source-unusable",
    }
)

UNTRANSLATED_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    # ``re.ASCII`` により ``\b`` を ASCII 単語境界に固定する。JS ``/.../i``
    # (``/u`` フラグ無し) がデフォルトで ASCII 境界を使うため、port で
    # Python デフォルト (Unicode 境界) に流れると "Hover over theé" のような
    # 入力で分岐し、翻訳済み判定がずれる。
    re.compile(pattern, re.IGNORECASE | re.ASCII)
    for pattern in (
        r"^(?:\d+\.\s*)?Hover over the\b",
        r"^(?:\d+\.\s*)?Click on the\b",
        r"^(?:\d+\.\s*)?Click on \*\*",
        r"^(?:\d+\.\s*)?Scroll down through the menu",
        r"^(?:\d+\.\s*)?Select the\b",
        r"^(?:\d+\.\s*)?If you would like to\b",
        r"^(?:\d+\.\s*)?The file is uploaded",
        r"^(?:\d+\.\s*)?In the\b.*\bpanel\b",
        r"^(?:\d+\.\s*)?From the\b.*\bdrop-?down\b",
    )
)

LEGACY_CALLOUT_RE = re.compile(
    r"^>\s*(?:\U0001f4d8|\u2757\ufe0f?|\U0001f6a7|\U0001f44d|\u26a0\ufe0f|"
    r"\U0001f4dd|\u2705|\u274c|\U0001f4a1|\u2139\ufe0f|\u26d4|\U0001f525|"
    r"\U0001f4a5|\U0001f3af|\U0001f4cc|\U0001f3f7\ufe0f)\s"
)
JSX_CALLOUT_RE = re.compile(r"^<Callout\b", re.IGNORECASE)
H1_IN_BODY_RE = re.compile(r"^#\s+\S")
FENCE_LINE_RE = re.compile(r"^\s*(?:(?:[-*+]\s+|\d+\.\s+))?```")


__all__ = [
    "ISSUE_SEVERITY",
    "COARSE_SIGNAL_TYPES",
    "STRUCTURE_MISMATCH_TYPES",
    "SOURCE_UNUSABLE_TYPES",
    "UNTRANSLATED_PATTERNS",
    "LEGACY_CALLOUT_RE",
    "JSX_CALLOUT_RE",
    "H1_IN_BODY_RE",
    "FENCE_LINE_RE",
]
