"""parity summary を CLI 表示用の複数行テキストに整形するヘルパー。

``scripts/lib/source_parity_summary_format.mjs`` の port。mjs と byte-identical
な出力を返す契約 (conformance harness で直接比較する)。

現時点で公開されているのは ``format_source_unusable_section`` のみ。新しい
フォーマッタを mjs 側に追加したら、ここにも追加して ``summary_format_*``
conformance dispatch を併せて拡張する。
"""

from __future__ import annotations

from typing import Any

__all__ = ["format_source_unusable_section"]


def format_source_unusable_section(summary: Any) -> str | None:
    """``[source unusable]`` セクションを生成する (mjs 等価)。

    ``summary`` は ``summarize_parity_results()`` の戻り値と同 shape の
    mapping。``snapshotUnusableIssues`` / ``snapshotUnusableFiles`` /
    ``snapshotUnusableByType`` のみを読む。非ゼロ時は複数行テキスト、
    0 / 欠損時は ``None``。

    Args:
        summary: parity summary マッピング (dict ライク / None / 非 dict 可)。
    Returns:
        CLI 表示用の複数行テキスト。``None`` なら出力対象なし。
    """
    if not isinstance(summary, dict):
        return None
    issues = summary.get("snapshotUnusableIssues") or 0
    files = summary.get("snapshotUnusableFiles") or 0
    if issues == 0:
        return None
    by_type = summary.get("snapshotUnusableByType")
    if not isinstance(by_type, dict):
        by_type = {}
    header = (
        f"[source unusable] snapshot 比較不能 (advisory / 翻訳者責任外): "
        f"{issues} 件 / {files} ファイル"
    )
    lines = [
        header,
        "  snapshot 側 / source sync 側の debt です。翻訳 PR では修正できません。",
    ]
    sorted_types = sorted(by_type.keys())
    if sorted_types:
        lines.append("  type 別内訳:")
        for type_name in sorted_types:
            lines.append(f"    {type_name}: {by_type[type_name]} 件")
    return "\n".join(lines)
