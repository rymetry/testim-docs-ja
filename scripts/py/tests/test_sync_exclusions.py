"""sync_exclusions registry の unit test。

conformance test (test_sync_exclusions_parity.py) が mjs との byte 一致を保証。
ここでは Python 側の型分岐 (非 str slug / 空文字) と mutation 非波及を確認。
"""

from __future__ import annotations

import pytest

from testim_parity.sync_exclusions import (
    SOURCE_SYNC_EXCLUSIONS,
    get_exclusion,
    is_source_side_debt,
    list_source_side_debt_slugs,
)

REGISTERED_SLUG = "testops/testops-version-control/pull-requests"


def test_registry_contains_known_slug():
    assert REGISTERED_SLUG in SOURCE_SYNC_EXCLUSIONS
    entry = SOURCE_SYNC_EXCLUSIONS[REGISTERED_SLUG]
    assert entry["reason"] == "broken-upstream-source"
    assert entry["expectedIssueType"] == "snapshot-incomplete"
    assert entry["expectedReason"] == "extractor-empty"


def test_is_source_side_debt_positive():
    assert is_source_side_debt(REGISTERED_SLUG) is True


@pytest.mark.parametrize("slug", [None, "", 42, [], "unknown/slug"])
def test_is_source_side_debt_rejects_non_registered(slug):
    assert is_source_side_debt(slug) is False


def test_get_exclusion_returns_shallow_copy():
    entry = get_exclusion(REGISTERED_SLUG)
    assert entry is not None
    # mutation を試みても registry 本体は影響を受けない
    entry["reason"] = "MUTATED"
    fresh = get_exclusion(REGISTERED_SLUG)
    assert fresh is not None
    assert fresh["reason"] == "broken-upstream-source"


@pytest.mark.parametrize("slug", [None, "", 42, "missing/slug"])
def test_get_exclusion_returns_none_for_non_registered(slug):
    assert get_exclusion(slug) is None


def test_list_slugs_returns_sorted_copy():
    slugs = list_source_side_debt_slugs()
    assert slugs == sorted(slugs)
    # mutating the list should not affect future calls
    slugs.append("extra/slug")
    assert "extra/slug" not in list_source_side_debt_slugs()


def test_registry_is_read_only():
    """MappingProxyType で wrap されているため直接 mutation できない。"""
    with pytest.raises(TypeError):
        SOURCE_SYNC_EXCLUSIONS["new/slug"] = {}  # type: ignore[index]
