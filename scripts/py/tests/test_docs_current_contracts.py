"""Regression checks for current operational docs and source contracts.

Historical migration notes may still mention the removed mjs implementation.
These tests pin only the current contracts that operators and future parser
changes are expected to follow.
"""

from __future__ import annotations

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]

CURRENT_CONTRACT_PATHS = (
    "scripts/py/src/testim_parity/segments_ja.py",
    "docs/PARITY_GUIDE.md",
    "docs/OPS_DESIGN.md",
    "docs/WRITING_GUIDE.md",
    ".github/copilot-instructions.md",
    ".claude/CLAUDE.md",
    "scripts/README.md",
)

CURRENT_OPS_PATHS = (
    "docs/PARITY_GUIDE.md",
    "docs/OPS_DESIGN.md",
    "docs/SYSTEM_SPEC.md",
    "docs/DOCS_DATE_TRACKING.md",
    "docs/UPSTREAM_DEFECTS.md",
    "docs/GLOSSARY.md",
    "docs/INVARIANT_TOKENS.md",
    "docs/TRANSLATION_GUIDE.md",
    "docs/WRITING_GUIDE.md",
    ".github/copilot-instructions.md",
    ".claude/CLAUDE.md",
    "scripts/README.md",
)

CURRENT_AGENT_GUIDE_PATHS = (
    ".github/copilot-instructions.md",
    ".claude/CLAUDE.md",
)

REMOVED_MJS_CANONICAL_REFERENCES = (
    "scripts/pipeline/pipeline.mjs",
    "generate_untranslated_placeholders.mjs",
    "prepare_llm_tasks.mjs",
    "apply_llm_translations.mjs",
    "scripts/lib/madcap_toc.mjs",
    "scripts/lib/source_sync_exclusions.mjs",
    "scripts/lib/en_source_patches.mjs",
    "scripts/detection/check_source_parity.mjs",
    "check_source_parity.mjs",
    "scripts/detection/snapshot_update.mjs",
    "snapshot_update.mjs",
    "scripts/detection/snapshot_diff.mjs",
    "snapshot_diff.mjs",
    "source_sync_health.mjs",
    "check_upstream_recovery.mjs",
    "generate_detection_reports.mjs",
)


def _matches(paths: tuple[str, ...], needle: str) -> list[str]:
    matches: list[str] = []
    for relative_path in paths:
        path = ROOT_DIR / relative_path
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if needle in line:
                matches.append(f"{relative_path}:{line_number}: {line.strip()}")
    return matches


def test_current_contracts_do_not_document_old_body_indent_rule() -> None:
    assert _matches(CURRENT_CONTRACT_PATHS, "leadingWs > bodyIndent") == []


def test_current_ops_docs_do_not_reference_removed_summary_mjs() -> None:
    assert _matches(CURRENT_OPS_PATHS, "generate_detection_reports.mjs") == []


def test_agent_guides_do_not_present_removed_mjs_as_canonical() -> None:
    offenders: list[str] = []
    for needle in REMOVED_MJS_CANONICAL_REFERENCES:
        offenders.extend(_matches(CURRENT_AGENT_GUIDE_PATHS, needle))
    assert offenders == []


def test_current_docs_reference_existing_normalize_module() -> None:
    assert (
        _matches(
            CURRENT_OPS_PATHS,
            "testim_parity.detection.parity_normalize",
        )
        == []
    )
    assert (ROOT_DIR / "scripts/py/src/testim_parity/normalize.py").is_file()
