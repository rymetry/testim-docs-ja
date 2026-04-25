"""``testim_parity.models`` の Pydantic schema テスト。

``Segment`` は cross-runtime JSON bridge で schema 検証したい呼び出し側向けに
公開している (現 Phase 0 時点では ``create_segment`` 経由の dict が dominant
だが、将来 artifact I/O を Python で組む段で model 化する契約)。ここでは
schema の invariant (kind whitelist, frozen, extra forbid) を guard する。
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from testim_parity.models import Segment


def _valid_payload(**overrides: object) -> dict[str, object]:
    base: dict[str, object] = {
        "sectionPath": "A > B",
        "segmentKind": "paragraph",
        "segmentIndex": 0,
        "textNorm": "hello world",
        "tokensInvariant": [],
        "sourceFingerprint": "abc123",
    }
    base.update(overrides)
    return base


def test_segment_accepts_valid_kind():
    seg = Segment(**_valid_payload())
    assert seg.segmentKind == "paragraph"
    assert seg.line is None


def test_segment_rejects_unknown_kind():
    """Literal[...] に無い kind は Pydantic validation で reject される。"""
    with pytest.raises(ValidationError):
        Segment(**_valid_payload(segmentKind="mystery-kind"))


def test_segment_rejects_extra_fields():
    """``extra='forbid'`` — schema 外 key は silently drop せず error にする。"""
    with pytest.raises(ValidationError):
        Segment(**_valid_payload(random_extra="nope"))


def test_segment_is_frozen():
    """immutable モデル — 後から mutation できない契約。"""
    seg = Segment(**_valid_payload())
    with pytest.raises(ValidationError):
        seg.textNorm = "mutated"  # type: ignore[misc]


def test_segment_round_trip_json():
    """JSON serialize/deserialize で bit-identical な Segment が復元される。"""
    seg = Segment(**_valid_payload(line=42, tokensInvariant=["x", "y"]))
    restored = Segment.model_validate_json(seg.model_dump_json())
    assert restored == seg


def test_segment_kind_literal_covers_all_expected():
    """``SegmentKind`` が ``segments_shared.SEGMENT_KINDS`` と一致する契約。

    ``models.py`` ヘッダの「1:1 対応」コメントを保証する guard。将来どちらか
    片方だけ更新すると test が壊れるので drift がすぐ分かる。
    """
    # SegmentKind は typing.Literal なので __args__ で値を取り出す。
    from testim_parity.models import SegmentKind
    from testim_parity.segments_shared import SEGMENT_KINDS

    literal_kinds = set(SegmentKind.__args__)  # type: ignore[attr-defined]
    assert literal_kinds == set(SEGMENT_KINDS)
