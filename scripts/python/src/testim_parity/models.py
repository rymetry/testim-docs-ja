"""Segment 形状データ用の Pydantic モデル。

mjs 実装は plain object を ``createSegment`` で作るだけだが、Python port では
factory を残しつつ型付きモデルも公開し、schema 検証された payload を使いたい
呼び出し側 (cross-runtime bridge への JSON serialize 等) が選択できるようにする。
フィールド名は mjs パイプラインがディスクで使う camelCase を踏襲する — artifact
schema の parity は hard requirement。
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# segments_shared.SEGMENT_KINDS と 1:1 で対応する Literal 型。cross-runtime で
# JSON deserialize した Segment が未知の kind を持ち込むと schema validation で
# 即 reject する。
SegmentKind = Literal[
    "heading",
    "paragraph",
    "ordered-list-item",
    "unordered-list-item",
    "callout-body",
    "table-cell",
    "details-summary",
    "image-caption",
    "code-block",
    "image",
]


class Segment(BaseModel):
    """EN / JA 抽出器が emit する canonical segment。"""

    model_config = ConfigDict(extra="forbid", frozen=True, populate_by_name=True)

    sectionPath: str = Field(default="")
    segmentKind: SegmentKind
    segmentIndex: int
    textNorm: str
    tokensInvariant: list[str] = Field(default_factory=list)
    sourceFingerprint: str
    line: int | None = None


__all__ = ["Segment", "SegmentKind"]
