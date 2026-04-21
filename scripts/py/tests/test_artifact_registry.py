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
        # UD-001 system: self-index link artifact
        assert is_artifact_excluded(slug="testops/insights/dashboard", token="/docs/index") is True

    def test_non_matching_slug(self):
        assert is_artifact_excluded(slug="unrelated/slug", token="/docs/index") is False

    def test_non_matching_token(self):
        assert is_artifact_excluded(slug="testops/insights/dashboard", token="/docs/other") is False


class TestRegistryEntries:
    def test_returns_tuple_of_entries(self):
        entries = registry_entries()
        assert isinstance(entries, tuple)
        # 初期インベントリは 2 entries
        assert len(entries) == 2

    def test_entries_are_readonly(self):
        entries = registry_entries()
        # MappingProxyType は代入不可
        import pytest

        with pytest.raises(TypeError):
            entries[0]["token"] = "oops"  # type: ignore[index]


class TestCoverage:
    def test_record_and_snapshot(self):
        cov = create_artifact_coverage()
        cov["record"](slug="a", token="/docs/index", reason="en-side")
        cov["record"](slug="a", token="/docs/index", reason="en-side")
        cov["record"](slug="b", token="/docs/index", reason=None)
        snap = cov["snapshot"]()
        assert snap["registryEntries"] == len(ARTIFACT_REGISTRY)
        assert snap["matchedHits"] == 3
        assert snap["bySlug"] == {"a": 2, "b": 1}
        assert snap["byToken"] == {"/docs/index": 3}

    def test_noop_coverage(self):
        snap = NOOP_COVERAGE["snapshot"]()
        assert snap["matchedHits"] == 0
        assert snap["bySlug"] == {}
        assert snap["byToken"] == {}
