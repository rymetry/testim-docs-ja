"""``_en_source_patches_data.json`` の schema + business rule validator。

Phase 6b cutover 以降、``_en_source_patches_data.json`` が en_source_patches の
唯一の authoritative source (mjs generator 削除後)。本 tool は編集時の safety net:

- JSON schema (top-level keys、各 patch entry の required fields)
- business rules:
    * ``defectClass`` が ``defectClasses`` allowlist 内
    * ``id`` が unique (全 patch 中で一意)
    * ``slugs`` が non-empty list[str]
    * ``find`` が非空 string
    * ``replace`` が string (空でもよい — "削除" を意味する)
    * ``addedAt`` / ``reviewAfter`` が ISO8601 date (``YYYY-MM-DD``)
    * ``reviewAfter`` が ``addedAt`` より後
    * ``linkedDefect`` が ``docs/UPSTREAM_DEFECTS.md#UD-...`` 形式

CI ``python-fast`` job の required step として registered。patch 追加時の編集ミスを
merge 前に catch する。

exit code: 0 全て OK、1 schema/business rule 違反あり、2 JSON 自体が壊れている
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any

from ..en_source_patches import _DATA_PATH

__all__ = ["main", "validate_data", "validate_file"]

_REQUIRED_TOP_KEYS: frozenset[str] = frozenset({"defectClasses", "patches"})
_REQUIRED_PATCH_KEYS: frozenset[str] = frozenset(
    {
        "id",
        "slugs",
        "defectClass",
        "find",
        "replace",
        "rationale",
        "linkedDefect",
        "addedAt",
        "reviewAfter",
    }
)
_ID_RE = re.compile(r"^[A-Z]{1,3}-\d{3}[A-Z]?(?:-[a-z0-9][a-z0-9-]*)*$")
_LINKED_DEFECT_RE = re.compile(r"^docs/[A-Z_]+\.md(?:#[A-Z]{1,4}-\d{3})?$")
_ISO_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _parse_iso_date(value: str, *, context: str) -> date | None:
    if not _ISO_DATE_RE.match(value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def validate_data(data: Any) -> list[str]:
    """``data`` (パース済 JSON) を検証し、error message の list を返す。

    empty list = 全て OK。1 つでも error があれば caller は exit 1 扱い。
    """
    errors: list[str] = []

    if not isinstance(data, dict):
        errors.append(f"top-level must be object, got {type(data).__name__}")
        return errors

    missing = _REQUIRED_TOP_KEYS - set(data.keys())
    if missing:
        errors.append(f"top-level missing required keys: {sorted(missing)}")

    defect_classes = data.get("defectClasses")
    if not isinstance(defect_classes, list) or not all(isinstance(c, str) for c in defect_classes):
        errors.append("defectClasses must be list[str]")
        defect_set: set[str] = set()
    else:
        defect_set = set(defect_classes)

    patches = data.get("patches")
    if not isinstance(patches, list):
        errors.append(
            f"patches must be list, got {type(patches).__name__ if patches is not None else 'None'}"
        )
        return errors

    seen_ids: set[str] = set()
    for idx, entry in enumerate(patches):
        if not isinstance(entry, dict):
            errors.append(f"patches[{idx}] must be object, got {type(entry).__name__}")
            continue

        ctx = f"patches[{idx}]"
        missing_patch = _REQUIRED_PATCH_KEYS - set(entry.keys())
        if missing_patch:
            errors.append(f"{ctx} missing required keys: {sorted(missing_patch)}")
            continue

        patch_id = entry["id"]
        ctx = f"patches[{idx}] id={patch_id!r}"

        if not isinstance(patch_id, str) or not patch_id:
            errors.append(f"{ctx}: id must be non-empty string")
        elif not _ID_RE.match(patch_id):
            errors.append(
                f"{ctx}: id must match pattern UPPER-NNN[-kebab-words] "
                "(e.g. 'UD-001A-dash-this-typo-plain')"
            )
        elif patch_id in seen_ids:
            errors.append(f"{ctx}: duplicate id (each patch id must be unique)")
        else:
            seen_ids.add(patch_id)

        slugs = entry["slugs"]
        if not isinstance(slugs, list) or not slugs or not all(isinstance(s, str) for s in slugs):
            errors.append(f"{ctx}: slugs must be non-empty list[str]")

        defect_class = entry["defectClass"]
        if defect_class not in defect_set:
            errors.append(
                f"{ctx}: defectClass={defect_class!r} not in allowlist {sorted(defect_set)}"
            )

        find = entry["find"]
        if not isinstance(find, str) or find == "":
            errors.append(f"{ctx}: find must be non-empty string (empty would match everywhere)")

        replace = entry["replace"]
        if not isinstance(replace, str):
            errors.append(f"{ctx}: replace must be string (may be empty for deletion)")

        linked = entry["linkedDefect"]
        if not isinstance(linked, str) or not _LINKED_DEFECT_RE.match(linked):
            errors.append(f"{ctx}: linkedDefect must be 'docs/<FILE>.md[#UD-NNN]' (got {linked!r})")

        added = entry["addedAt"]
        added_date = _parse_iso_date(added, context=ctx) if isinstance(added, str) else None
        if added_date is None:
            errors.append(f"{ctx}: addedAt must be ISO date YYYY-MM-DD (got {added!r})")

        review = entry["reviewAfter"]
        review_date = _parse_iso_date(review, context=ctx) if isinstance(review, str) else None
        if review_date is None:
            errors.append(f"{ctx}: reviewAfter must be ISO date YYYY-MM-DD (got {review!r})")

        if added_date is not None and review_date is not None and review_date <= added_date:
            errors.append(f"{ctx}: reviewAfter ({review}) must be after addedAt ({added})")

    return errors


def validate_file(json_path: Path) -> tuple[int, list[str]]:
    """JSON file を読み、(exit_code, errors) を返す。"""
    if not json_path.exists():
        return 2, [f"file not found: {json_path}"]
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as err:
        return 2, [f"invalid JSON in {json_path}: {err}"]
    errors = validate_data(data)
    return (1 if errors else 0), errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate _en_source_patches_data.json schema + business rules",
    )
    parser.add_argument(
        "--path",
        default=str(_DATA_PATH),
        help="JSON path to validate (default: package-bundled _en_source_patches_data.json)",
    )
    args = parser.parse_args(argv)

    rc, errors = validate_file(Path(args.path))
    if rc == 0:
        data = json.loads(Path(args.path).read_text(encoding="utf-8"))
        print(
            f"✅ en_source_patches validation passed: "
            f"{len(data['patches'])} patches across {len(data['defectClasses'])} defect classes"
        )
        return 0

    print(f"❌ en_source_patches validation failed ({len(errors)} error(s)):", file=sys.stderr)
    for err in errors:
        print(f"  - {err}", file=sys.stderr)
    return rc


if __name__ == "__main__":
    sys.exit(main())
