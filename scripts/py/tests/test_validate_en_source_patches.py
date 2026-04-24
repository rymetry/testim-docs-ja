"""``testim_parity.tools.validate_en_source_patches`` の unit test。

production ``_en_source_patches_data.json`` の schema 検証を pin しつつ、
invalid patch を差し込んだときに正しく error を返すことを検証する。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from testim_parity.tools import validate_en_source_patches as v

_VALID_MIN = {
    "defectClasses": ["typo"],
    "patches": [
        {
            "id": "UD-999A-test-patch",
            "slugs": ["test/slug"],
            "defectClass": "typo",
            "find": "needle",
            "replace": "fixed",
            "rationale": "test",
            "linkedDefect": "docs/UPSTREAM_DEFECTS.md#UD-999",
            "addedAt": "2026-04-25",
            "reviewAfter": "2026-10-25",
        }
    ],
}


class TestValidateData:
    def test_production_data_passes(self) -> None:
        data = json.loads(v._DATA_PATH.read_text(encoding="utf-8"))
        assert v.validate_data(data) == []

    def test_minimal_valid_passes(self) -> None:
        assert v.validate_data(_VALID_MIN) == []

    def test_non_object_top_level_fails(self) -> None:
        errors = v.validate_data([])
        assert any("must be object" in e for e in errors)

    def test_missing_top_keys_fails(self) -> None:
        errors = v.validate_data({"defectClasses": []})
        assert any("missing required keys" in e for e in errors)

    def test_missing_patch_keys_fails(self) -> None:
        bad = {"defectClasses": ["typo"], "patches": [{"id": "UD-999A-test"}]}
        errors = v.validate_data(bad)
        assert any("missing required keys" in e for e in errors)

    def test_id_format_invalid_fails(self) -> None:
        bad = {**_VALID_MIN}
        bad["patches"] = [{**_VALID_MIN["patches"][0], "id": "lowercase-bad"}]
        errors = v.validate_data(bad)
        assert any("id must match pattern" in e for e in errors)

    def test_duplicate_id_fails(self) -> None:
        bad = {
            "defectClasses": ["typo"],
            "patches": [
                _VALID_MIN["patches"][0],
                _VALID_MIN["patches"][0],  # same id
            ],
        }
        errors = v.validate_data(bad)
        assert any("duplicate id" in e for e in errors)

    def test_empty_slugs_fails(self) -> None:
        bad = {**_VALID_MIN}
        bad["patches"] = [{**_VALID_MIN["patches"][0], "slugs": []}]
        errors = v.validate_data(bad)
        assert any("slugs must be non-empty" in e for e in errors)

    def test_defect_class_not_in_allowlist_fails(self) -> None:
        bad = {**_VALID_MIN}
        bad["patches"] = [{**_VALID_MIN["patches"][0], "defectClass": "bogus"}]
        errors = v.validate_data(bad)
        assert any("not in allowlist" in e for e in errors)

    def test_empty_find_fails(self) -> None:
        bad = {**_VALID_MIN}
        bad["patches"] = [{**_VALID_MIN["patches"][0], "find": ""}]
        errors = v.validate_data(bad)
        assert any("find must be non-empty" in e for e in errors)

    def test_empty_replace_is_ok(self) -> None:
        """replace は空でも OK (deletion を意味する)。"""
        ok = {**_VALID_MIN}
        ok["patches"] = [{**_VALID_MIN["patches"][0], "replace": ""}]
        assert v.validate_data(ok) == []

    def test_linked_defect_format_invalid(self) -> None:
        bad = {**_VALID_MIN}
        bad["patches"] = [{**_VALID_MIN["patches"][0], "linkedDefect": "random string"}]
        errors = v.validate_data(bad)
        assert any("linkedDefect must be" in e for e in errors)

    def test_linked_defect_without_anchor_is_ok(self) -> None:
        """``docs/FILE.md`` (anchor 無し) も OK。"""
        ok = {**_VALID_MIN}
        ok["patches"] = [{**_VALID_MIN["patches"][0], "linkedDefect": "docs/UPSTREAM_DEFECTS.md"}]
        assert v.validate_data(ok) == []

    def test_invalid_iso_date_added_at(self) -> None:
        bad = {**_VALID_MIN}
        bad["patches"] = [{**_VALID_MIN["patches"][0], "addedAt": "2026/04/25"}]
        errors = v.validate_data(bad)
        assert any("addedAt must be ISO date" in e for e in errors)

    def test_review_after_before_added_at_fails(self) -> None:
        bad = {**_VALID_MIN}
        bad["patches"] = [
            {
                **_VALID_MIN["patches"][0],
                "addedAt": "2026-06-01",
                "reviewAfter": "2026-04-25",
            }
        ]
        errors = v.validate_data(bad)
        assert any("must be after addedAt" in e for e in errors)


class TestValidateFile:
    def test_missing_file_returns_two(self, tmp_path: Path) -> None:
        rc, errors = v.validate_file(tmp_path / "does-not-exist.json")
        assert rc == 2
        assert any("file not found" in e for e in errors)

    def test_invalid_json_returns_two(self, tmp_path: Path) -> None:
        p = tmp_path / "bad.json"
        p.write_text("{not-json", encoding="utf-8")
        rc, errors = v.validate_file(p)
        assert rc == 2
        assert any("invalid JSON" in e for e in errors)

    def test_schema_error_returns_one(self, tmp_path: Path) -> None:
        p = tmp_path / "schema-err.json"
        p.write_text(json.dumps({"defectClasses": ["typo"]}), encoding="utf-8")
        rc, errors = v.validate_file(p)
        assert rc == 1
        assert len(errors) > 0


class TestMain:
    def test_main_production_returns_zero(self, capsys: pytest.CaptureFixture[str]) -> None:
        rc = v.main([])
        assert rc == 0
        out = capsys.readouterr().out
        assert "passed" in out.lower()

    def test_main_custom_path_with_errors_returns_one(
        self, tmp_path: Path, capsys: pytest.CaptureFixture[str]
    ) -> None:
        p = tmp_path / "bad.json"
        p.write_text(
            json.dumps({"defectClasses": [], "patches": [{"id": "bad"}]}), encoding="utf-8"
        )
        rc = v.main(["--path", str(p)])
        assert rc == 1
        err = capsys.readouterr().err
        assert "failed" in err.lower()

    def test_main_missing_file_returns_two(self, tmp_path: Path) -> None:
        rc = v.main(["--path", str(tmp_path / "missing.json")])
        assert rc == 2
