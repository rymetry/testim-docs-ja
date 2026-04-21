"""Tests for ``testim_parity.align_scoring`` — shared pair scoring for
alignment and structure comparators.

Covers the full score hierarchy:
 1. fingerprint match (1000)
 2. textNorm match (500)
 3. token overlap (100 + 10 per token; 0 when disjoint)
 4. same-language penalty (0)
 5. tokenless cross-language weak score
 6. kind floor (1)
and the two helper functions used by the weak branch.
"""

from __future__ import annotations

from typing import Any

import pytest

from testim_parity.align_scoring import (
    SCORE_FINGERPRINT_MATCH,
    SCORE_KIND_FLOOR,
    SCORE_TEXTNORM_MATCH,
    SCORE_TOKEN_OVERLAP_BASE,
    SCORE_TOKEN_OVERLAP_PER_TOKEN,
    SCORE_WEAK_LENGTH_MAX,
    SCORE_WEAK_POSITION_MAX,
    compute_weak_length_score,
    compute_weak_position_score,
    score_segment_match,
)


def _seg(**kwargs: Any) -> dict[str, Any]:
    defaults = {
        "segmentKind": "paragraph",
        "sourceFingerprint": None,
        "textNorm": "",
        "tokensInvariant": [],
    }
    defaults.update(kwargs)
    return defaults


class TestWeakPositionScore:
    def test_midpoint_fallback_for_singleton_sections(self):
        # n=1 or m=1 → no position signal available; half of SCORE_WEAK_POSITION_MAX.
        assert compute_weak_position_score(0, 0, 1, 5) == SCORE_WEAK_POSITION_MAX // 2
        assert compute_weak_position_score(0, 0, 5, 1) == SCORE_WEAK_POSITION_MAX // 2

    def test_full_max_on_identical_ratios(self):
        assert compute_weak_position_score(0, 0, 5, 5) == SCORE_WEAK_POSITION_MAX
        assert compute_weak_position_score(4, 4, 5, 5) == SCORE_WEAK_POSITION_MAX

    def test_zero_on_opposite_ends(self):
        assert compute_weak_position_score(0, 4, 5, 5) == 0
        assert compute_weak_position_score(4, 0, 5, 5) == 0

    def test_monotonic_decrease_with_distance(self):
        # en ratio 0 (head); ja ratio sweep 0..1
        base = compute_weak_position_score(0, 0, 5, 5)
        mid = compute_weak_position_score(0, 2, 5, 5)
        far = compute_weak_position_score(0, 4, 5, 5)
        assert base > mid > far

    def test_js_math_round_parity_half_up(self):
        # Regression: Python round() uses banker's rounding; JS Math.round()
        # rounds half away from zero. The previous implementation wrapped
        # round(...) directly, which returned 2 for (0, 3, 2, 5) while the
        # mjs implementation returned 3. After the _js_round port the Python
        # must produce 3.
        # distance = |0/1 - 3/4| = 0.75 → score = round(10 * 0.25) = round(2.5)
        # JS Math.round(2.5) = 3; Python round(2.5) = 2 (banker's).
        assert compute_weak_position_score(0, 3, 2, 5) == 3


class TestWeakLengthScore:
    def test_zero_when_either_side_empty(self):
        assert compute_weak_length_score("", "abc") == 0
        assert compute_weak_length_score("abc", "") == 0
        assert compute_weak_length_score(None, "abc") == 0

    def test_full_max_on_equal_lengths(self):
        assert compute_weak_length_score("abc", "xyz") == SCORE_WEAK_LENGTH_MAX

    def test_proportional_to_length_ratio(self):
        score = compute_weak_length_score("abcde", "ab")
        # min/max = 2/5 = 0.4 → round(5 * 0.4) = 2
        assert score == 2

    def test_js_math_round_parity_half_up(self):
        # Regression: round(5 * (2/4)) = round(2.5). JS Math.round → 3;
        # Python round (banker's) → 2. After _js_round the Python must
        # produce 3 to match the mjs oracle.
        assert compute_weak_length_score("ab", "abcd") == 3
        # Single-char ja text against 10-char en: min/max = 1/10 = 0.1 →
        # round(0.5) = 1 in JS (half-up), 0 in Python banker's (half-to-even).
        assert compute_weak_length_score("あ", "ああああああああああ") == 1


class TestScoreSegmentMatch:
    def test_zero_on_kind_mismatch(self):
        en = _seg(segmentKind="heading", textNorm="same")
        ja = _seg(segmentKind="paragraph", textNorm="same")
        assert score_segment_match(en, ja, 0, 0, 5, 5) == 0

    def test_fingerprint_match_wins(self):
        en = _seg(sourceFingerprint="sha256:aaa", textNorm="different-a")
        ja = _seg(sourceFingerprint="sha256:aaa", textNorm="different-b")
        assert score_segment_match(en, ja, 0, 0, 5, 5) == SCORE_FINGERPRINT_MATCH

    def test_textnorm_match_beats_tokens(self):
        en = _seg(textNorm="same normalized text", tokensInvariant=["--foo"])
        ja = _seg(textNorm="same normalized text", tokensInvariant=["--bar"])
        assert score_segment_match(en, ja, 0, 0, 5, 5) == SCORE_TEXTNORM_MATCH

    def test_token_overlap_score(self):
        en = _seg(textNorm="en text", tokensInvariant=["--foo", "--bar"])
        ja = _seg(textNorm="ja text", tokensInvariant=["--foo", "--bar", "--baz"])
        expected = SCORE_TOKEN_OVERLAP_BASE + 2 * SCORE_TOKEN_OVERLAP_PER_TOKEN
        assert score_segment_match(en, ja, 0, 0, 5, 5) == expected

    def test_zero_on_disjoint_tokens(self):
        # Both sides carry tokens but none overlap — strong non-match.
        en = _seg(textNorm="en text", tokensInvariant=["--foo"])
        ja = _seg(textNorm="ja text", tokensInvariant=["--bar"])
        assert score_segment_match(en, ja, 0, 0, 5, 5) == 0

    def test_same_language_penalty(self):
        # Both ASCII-only with different textNorm → 0.
        en = _seg(textNorm="click the save button")
        ja = _seg(textNorm="press the submit link")
        assert score_segment_match(en, ja, 0, 0, 5, 5) == 0

    def test_tokenless_cross_language_uses_weak_score(self):
        # EN ASCII, JA CJK → same-language check does not trigger.
        en = _seg(textNorm="click the save button")
        ja = _seg(textNorm="保存ボタンをクリックします")
        score = score_segment_match(en, ja, 2, 2, 5, 5)
        # Positions aligned → full position score; some length score.
        assert score >= SCORE_KIND_FLOOR
        assert score >= SCORE_WEAK_POSITION_MAX  # at least position max component

    def test_kind_floor_when_no_other_signal(self):
        en = _seg(textNorm="")
        ja = _seg(textNorm="")
        # Single-element sections force position-score fallback to midpoint.
        score = score_segment_match(en, ja, 0, 0, 1, 1)
        assert score >= SCORE_KIND_FLOOR

    def test_attribute_style_segments(self):
        class Seg:
            def __init__(self, **kwargs: Any) -> None:
                self.segmentKind = kwargs.get("segmentKind", "paragraph")
                self.sourceFingerprint = kwargs.get("sourceFingerprint")
                self.textNorm = kwargs.get("textNorm", "")
                self.tokensInvariant = kwargs.get("tokensInvariant", [])

        en = Seg(textNorm="same normalized text")
        ja = Seg(textNorm="same normalized text")
        assert score_segment_match(en, ja, 0, 0, 5, 5) == SCORE_TEXTNORM_MATCH


@pytest.mark.parametrize(
    "i,j,n,m,expected",
    [
        (0, 0, 1, 1, SCORE_WEAK_POSITION_MAX // 2),
        (0, 0, 5, 5, SCORE_WEAK_POSITION_MAX),
        (4, 4, 5, 5, SCORE_WEAK_POSITION_MAX),
    ],
)
def test_weak_position_score_parametrized(i, j, n, m, expected):
    assert compute_weak_position_score(i, j, n, m) == expected
