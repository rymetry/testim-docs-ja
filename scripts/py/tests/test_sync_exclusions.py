"""sync_exclusions registry の unit test。

conformance test (test_sync_exclusions_parity.py) が mjs との byte 一致を保証。
ここでは Python 側の型分岐 (非 str slug / 空文字) と mutation 非波及を確認。
"""

from __future__ import annotations

import re

import pytest

from testim_parity.sync_exclusions import (
    SOURCE_SYNC_EXCLUSIONS,
    get_exclusion,
    is_source_side_debt,
    list_source_side_debt_slugs,
)

RECOVERED_SLUG = "testops/testops-version-control/pull-requests"

REQUIRED_METADATA_FIELDS = (
    "reason",
    "note",
    "expectedIssueType",
    "expectedReason",
    "addedAt",
    "linkedIssue",
)


def test_registry_starts_empty_after_recovery_cleanup():
    assert len(SOURCE_SYNC_EXCLUSIONS) == 0
    assert RECOVERED_SLUG not in SOURCE_SYNC_EXCLUSIONS


def test_recovered_slug_is_not_source_side_debt():
    assert is_source_side_debt(RECOVERED_SLUG) is False


@pytest.mark.parametrize("slug", [None, "", 42, [], "unknown/slug"])
def test_is_source_side_debt_rejects_non_registered(slug):
    assert is_source_side_debt(slug) is False


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


# ---------------------------------------------------------------------------
# registry shape (mjs parity: every entry has required metadata fields)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field", REQUIRED_METADATA_FIELDS)
def test_every_registry_entry_has_required_field(field: str) -> None:
    """全 entry に必須 metadata が揃っている (mjs schema contract と同じ)。"""
    for slug, entry in SOURCE_SYNC_EXCLUSIONS.items():
        assert field in entry, f"registry[{slug}] missing required field {field!r}"


def test_pull_requests_entry_removed_after_recovery() -> None:
    """pull-requests は upstream recovery 確認後に registry から削除済み。"""
    assert get_exclusion(RECOVERED_SLUG) is None


@pytest.mark.parametrize(
    "field,pattern",
    [
        ("addedAt", r"^\d{4}-\d{2}-\d{2}$"),
        ("reviewAfter", r"^\d{4}-\d{2}-\d{2}$"),
    ],
)
def test_entry_date_fields_match_iso_yyyy_mm_dd(field: str, pattern: str) -> None:
    """registry date fields are ISO-8601 ``YYYY-MM-DD``."""
    for slug, entry in SOURCE_SYNC_EXCLUSIONS.items():
        # reviewAfter は未だ optional の可能性があるので存在するものだけ検証
        if field in entry:
            assert re.match(pattern, entry[field]) is not None, (
                f"registry[{slug}].{field} must match {pattern}, got {entry[field]!r}"
            )


def test_list_slugs_empty_when_no_active_debt() -> None:
    assert list_source_side_debt_slugs() == []


def test_get_exclusion_values_match_registry() -> None:
    """registry に entry がある場合は shallow copy として返す。"""
    for slug, registry_entry in SOURCE_SYNC_EXCLUSIONS.items():
        entry = get_exclusion(slug)
        assert entry is not None
        assert entry is not registry_entry
        for key, value in registry_entry.items():
            assert entry[key] == value


def test_registry_is_plain_mapping_not_list() -> None:
    """registry は slug → metadata の dict-like。list にしない。"""
    # list ではない (``list_source_side_debt_slugs`` が slug list を露出する経路)。
    assert not isinstance(SOURCE_SYNC_EXCLUSIONS, list)
    assert hasattr(SOURCE_SYNC_EXCLUSIONS, "items")
