"""``testim_parity.detection.snapshot_diff`` main() / branch coverage を
押し上げる smoke test (PR #389 round-2 review: fast gate coverage 82 → 90 対応)。

既存 ``test_snapshot_diff.py`` は classify_changes / parse_args 等の pure 関数を
網羅するが、``main()`` / ``_diff_sidebar()`` / ``assert_safe_refspec_path()``
/ ``_get_head_content()`` が 39% coverage。git subprocess を mock して以下を cover:

1. refspec guard (absolute path / ``..`` traversal rejected)
2. sidebar diff (head 不在 / parse error / add/remove 検知)
3. main() の happy/failure path
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from testim_parity.detection import snapshot_diff

# ---------------------------------------------------------------------------
# assert_safe_refspec_path guard
# ---------------------------------------------------------------------------


class TestAssertSafeRefspecPath:
    def test_accepts_relative_path(self) -> None:
        result = snapshot_diff.assert_safe_refspec_path(Path("a/b/c.md"))
        assert result == "a/b/c.md"

    def test_rejects_absolute_path(self) -> None:
        with pytest.raises(ValueError, match="refuse to pass absolute path"):
            snapshot_diff.assert_safe_refspec_path(Path("/tmp/x.md"))

    def test_rejects_parent_traversal(self) -> None:
        with pytest.raises(ValueError, match="refuse to pass '..'"):
            snapshot_diff.assert_safe_refspec_path(Path("../etc/passwd"))

    def test_accepts_windows_style_forward_slash(self) -> None:
        # POSIX 区切りで返す
        result = snapshot_diff.assert_safe_refspec_path(Path("docs/sub/file.md"))
        assert "/" in result or "\\" not in result


# ---------------------------------------------------------------------------
# _diff_sidebar
# ---------------------------------------------------------------------------


class TestDiffSidebar:
    def test_sidebar_path_missing_returns_unchanged(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """sidebar.json が無ければ unchanged を返す (初期化された snapshot 相当)。"""
        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_PATH", tmp_path / "no-sidebar.json")
        result = snapshot_diff._diff_sidebar()
        assert result == {"changed": False, "addedPages": [], "removedPages": []}

    def test_sidebar_all_added_when_no_head(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """HEAD に sidebar が無いとき、現 snapshot の pages 全部を ``addedPages`` とする。"""
        sidebar_path = tmp_path / "sidebar.json"
        # ``extract_slugs_from_snapshot`` は ``sections[].pages[].slug`` を読む契約。
        sidebar_content = {
            "sections": [
                {
                    "pages": [
                        {"slug": "overview/a"},
                        {"slug": "overview/b"},
                    ]
                }
            ]
        }
        sidebar_path.write_text(json.dumps(sidebar_content), encoding="utf-8")

        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_PATH", sidebar_path)
        monkeypatch.setattr(snapshot_diff, "ROOT_DIR", tmp_path)
        monkeypatch.setattr(snapshot_diff, "_get_head_content", lambda _: None)

        result = snapshot_diff._diff_sidebar()
        assert result["changed"] is True
        assert set(result["addedPages"]) == {"overview/a", "overview/b"}

    def test_sidebar_diff_parse_error_graceful(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """新 sidebar JSON 破損時は parseError:true で graceful degradation。"""
        sidebar_path = tmp_path / "sidebar.json"
        sidebar_path.write_text("{not-json", encoding="utf-8")

        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_PATH", sidebar_path)
        monkeypatch.setattr(snapshot_diff, "ROOT_DIR", tmp_path)
        monkeypatch.setattr(snapshot_diff, "_get_head_content", lambda _: None)

        result = snapshot_diff._diff_sidebar()
        assert result.get("parseError") is True

    def test_sidebar_diff_detects_added_and_removed(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """HEAD vs current の slug set diff で added/removed を正しく取り出す。"""
        sidebar_path = tmp_path / "sidebar.json"
        current = {
            "sections": [
                {
                    "pages": [
                        {"slug": "overview/new-page"},
                        {"slug": "overview/kept"},
                    ]
                }
            ]
        }
        head = {
            "sections": [
                {
                    "pages": [
                        {"slug": "overview/kept"},
                        {"slug": "overview/removed"},
                    ]
                }
            ]
        }
        sidebar_path.write_text(json.dumps(current), encoding="utf-8")

        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_PATH", sidebar_path)
        monkeypatch.setattr(snapshot_diff, "ROOT_DIR", tmp_path)
        monkeypatch.setattr(snapshot_diff, "_get_head_content", lambda _: json.dumps(head))

        result = snapshot_diff._diff_sidebar()
        assert result["changed"] is True
        assert "overview/new-page" in result["addedPages"]
        assert "overview/removed" in result["removedPages"]

    def test_sidebar_git_error_returns_parse_error(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        sidebar_path = tmp_path / "sidebar.json"
        sidebar_path.write_text("{}", encoding="utf-8")

        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_PATH", sidebar_path)
        monkeypatch.setattr(snapshot_diff, "ROOT_DIR", tmp_path)

        def fail_git(_path: Path) -> None:
            raise RuntimeError("git not installed")

        monkeypatch.setattr(snapshot_diff, "_get_head_content", fail_git)

        result = snapshot_diff._diff_sidebar()
        assert result.get("parseError") is True


# ---------------------------------------------------------------------------
# _get_head_content — git subprocess wrapper
# ---------------------------------------------------------------------------


class TestGetHeadContent:
    def test_git_not_found_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def raise_fnf(*_a, **_kw):
            raise FileNotFoundError("git")

        monkeypatch.setattr(subprocess, "run", raise_fnf)
        with pytest.raises(RuntimeError, match="git command not found"):
            snapshot_diff._get_head_content(Path("file.md"))

    def test_git_exit_128_returns_none(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """HEAD に file が無い (exit 128) ケースは None を返す (mjs 等価)。"""

        def fake_run(*_a, **_kw):
            return subprocess.CompletedProcess([], 128, "", "fatal: file missing")

        monkeypatch.setattr(subprocess, "run", fake_run)
        assert snapshot_diff._get_head_content(Path("new.md")) is None

    def test_git_success_returns_stdout(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def fake_run(*_a, **_kw):
            return subprocess.CompletedProcess([], 0, "content\nline2\n", "")

        monkeypatch.setattr(subprocess, "run", fake_run)
        assert snapshot_diff._get_head_content(Path("x.md")) == "content\nline2\n"

    def test_git_other_failure_raises(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def fake_run(*_a, **_kw):
            return subprocess.CompletedProcess([], 1, "", "some git error")

        monkeypatch.setattr(subprocess, "run", fake_run)
        with pytest.raises(RuntimeError, match="git show failed"):
            snapshot_diff._get_head_content(Path("x.md"))

    def test_unsafe_refspec_raises_wrapped_runtime_error(self) -> None:
        with pytest.raises(RuntimeError, match="refuse to pass"):
            snapshot_diff._get_head_content(Path("/absolute/x.md"))


# ---------------------------------------------------------------------------
# main() — CLI entry flow
# ---------------------------------------------------------------------------


class TestMain:
    def test_main_slug_unknown_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """``--slug=<unknown>`` で exit 1 (mjs 等価)。"""
        rc = snapshot_diff.main(["--slug=does-not-exist-xyz-abc"])
        assert rc == 1

    def test_main_empty_snapshots_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """空 snapshots/ dir は ``check:snapshots:fetch`` 案内 + exit 1 (mjs 等価)。"""
        monkeypatch.setattr(snapshot_diff, "_CONTENT_DIR", tmp_path / "empty-content")
        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_PATH", tmp_path / "sidebar.json")
        monkeypatch.setattr(snapshot_diff, "_OUTPUT_PATH", tmp_path / "snapshot-diff-status.json")
        rc = snapshot_diff.main([])
        assert rc == 1

    def test_main_sidebar_parse_error_writes_error_report_and_returns_one(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        content_dir = tmp_path / "snapshots" / "en" / "content"
        content_dir.mkdir(parents=True)
        snapshot_path = content_dir / "overview" / "page.html"
        snapshot_path.parent.mkdir(parents=True)
        snapshot_path.write_text("<p>unchanged</p>", encoding="utf-8")

        sidebar_path = tmp_path / "snapshots" / "en" / "sidebar.json"
        sidebar_path.write_text("{not-json", encoding="utf-8")
        source_status_path = tmp_path / "source-sync-status.json"
        source_status_path.write_text(
            json.dumps(
                {
                    "runId": "source-run",
                    "sourceInventoryFingerprint": "sha256:test",
                    "runScope": {
                        "type": "full",
                        "isComplete": True,
                        "filters": {"slug": None, "section": None},
                    },
                }
            ),
            encoding="utf-8",
        )
        output_path = tmp_path / "snapshot-diff-status.json"

        monkeypatch.setattr(snapshot_diff, "ROOT_DIR", tmp_path)
        monkeypatch.setattr(snapshot_diff, "_CONTENT_DIR", content_dir)
        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_PATH", sidebar_path)
        monkeypatch.setattr(snapshot_diff, "_SIDEBAR_URLS_PATH", tmp_path / "sidebar-urls.md")
        monkeypatch.setattr(snapshot_diff, "_SOURCE_SYNC_STATUS_PATH", source_status_path)
        monkeypatch.setattr(snapshot_diff, "_OUTPUT_PATH", output_path)
        monkeypatch.setattr(snapshot_diff, "_build_source_url_index", lambda **_kwargs: {})

        def fake_head_content(path: Path) -> str:
            if path.name == "page.html":
                return "<p>unchanged</p>"
            raise RuntimeError("git sidebar failure")

        monkeypatch.setattr(snapshot_diff, "_get_head_content", fake_head_content)

        assert snapshot_diff.main([]) == 1
        report = json.loads(output_path.read_text(encoding="utf-8"))
        assert report["error"] is True
        assert report["sidebar"]["parseError"] is True
        assert "Sidebar diff failed" in report["errorDetail"]
