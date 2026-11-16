"""artifact_registry のユニットテスト — EN-side artifact 判定と coverage 集計。"""

from __future__ import annotations

from testim_parity.artifact_registry import (
    ARTIFACT_REGISTRY,
    NOOP_COVERAGE,
    create_artifact_coverage,
    is_artifact_excluded,
    registry_entries,
)


class TestIsArtifactExcluded:
    def test_matching_slug_and_token(self):
        assert (
            is_artifact_excluded(
                slug="getting-started/creating-your-first-codeless-test", token="http://google.com"
            )
            is True
        )

    def test_non_matching_slug(self):
        assert is_artifact_excluded(slug="unrelated/slug", token="http://google.com") is False

    def test_non_matching_token(self):
        assert (
            is_artifact_excluded(
                slug="getting-started/creating-your-first-codeless-test", token="/docs/other"
            )
            is False
        )


class TestRegistryEntries:
    def test_returns_tuple_of_entries(self):
        entries = registry_entries()
        assert isinstance(entries, tuple)
        assert len(entries) == 1

    def test_entries_are_readonly(self):
        entries = registry_entries()
        # MappingProxyType は代入不可
        import pytest

        with pytest.raises(TypeError):
            entries[0]["token"] = "oops"  # type: ignore[index]


class TestCoverage:
    def test_record_and_snapshot(self):
        cov = create_artifact_coverage()
        cov["record"](slug="a", token="http://google.com", reason="en-side")
        cov["record"](slug="a", token="http://google.com", reason="en-side")
        cov["record"](slug="b", token="http://google.com", reason=None)
        snap = cov["snapshot"]()
        assert snap["registryEntries"] == len(ARTIFACT_REGISTRY)
        assert snap["matchedHits"] == 3
        assert snap["bySlug"] == {"a": 2, "b": 1}
        assert snap["byToken"] == {"http://google.com": 3}

    def test_noop_coverage(self):
        snap = NOOP_COVERAGE["snapshot"]()
        assert snap["matchedHits"] == 0
        assert snap["bySlug"] == {}
        assert snap["byToken"] == {}
