"""Python port of the testim-docs-ja parity/sync tooling."""

from .align_scoring import (
    CJK_RE,
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
from .artifact_registry import (
    ARTIFACT_REGISTRY,
    NOOP_COVERAGE,
    create_artifact_coverage,
    is_artifact_excluded,
)
from .en_source_patches import (
    DEFECT_CLASSES,
    EN_SOURCE_PATCHES,
    NOOP_PATCH_COVERAGE,
    apply_en_source_patches,
    count_occurrences,
    create_en_source_patch_coverage,
)
from .extract import extract_invariant_tokens
from .glossary_mask import (
    GLOSSARY_PATH,
    INVARIANT_PATH,
    classify_segment,
    create_mask_coverage,
    load_glossary,
    load_invariant_patterns,
    mask_segment_text,
)
from .glossary_mask import (
    _clear_caches as _clear_glossary_caches,
)
from .madcap_toc import (
    DEFAULT_BASE_URL,
    TRICENTIS_URL_RE,
    build_index_lookup,
    build_sections,
    build_sidebar_snapshot,
    extract_slug,
    extract_slugs_from_snapshot,
    match_all_tricentis_urls,
    parse_amd_module,
    resolve_url,
)
from .models import Segment
from .normalize import (
    canonicalize_docs_url,
    normalize_segment_tokens,
    normalize_url_for_parity,
)
from .project import (
    DOCS_DIR,
    PROJECT_ROOT,
    ROOT_DIR,
    SIDEBAR_PATH,
    build_basename_to_path_map,
    build_docs_index,
    build_slug_index,
    extract_source_content_path,
    file_path_to_slug,
    find_md_files,
    get_doc_section,
    matches_section_filter,
    read_doc_file,
    reset_project_caches_for_test,
    resolve_slug,
    resolve_to_full_slug,
    split_frontmatter,
    to_kebab,
    to_relative_doc_path,
)
from .segments_shared import (
    GATE_ELIGIBLE_KINDS,
    SEGMENT_KINDS,
    build_section_path,
    compute_segment_fingerprint,
    create_segment,
    is_gate_eligible,
    normalize_segment_text,
    push_heading,
)
from .sidebar import (
    SIDEBAR_URLS_PATH,
    extract_japanese_label,
    filter_items_by_section,
    find_sidebar_section,
    get_section_slug_set,
    load_sidebar_sections,
    parse_sidebar_sections,
)
from .types import (
    COARSE_SIGNAL_TYPES,
    FENCE_LINE_RE,
    H1_IN_BODY_RE,
    ISSUE_SEVERITY,
    JSX_CALLOUT_RE,
    LEGACY_CALLOUT_RE,
    SOURCE_UNUSABLE_TYPES,
    STRUCTURE_MISMATCH_TYPES,
    UNTRANSLATED_PATTERNS,
)

__version__ = "0.0.1"

__all__ = [
    "__version__",
    # normalize
    "canonicalize_docs_url",
    "normalize_segment_tokens",
    "normalize_url_for_parity",
    # align_scoring
    "CJK_RE",
    "SCORE_FINGERPRINT_MATCH",
    "SCORE_KIND_FLOOR",
    "SCORE_TEXTNORM_MATCH",
    "SCORE_TOKEN_OVERLAP_BASE",
    "SCORE_TOKEN_OVERLAP_PER_TOKEN",
    "SCORE_WEAK_LENGTH_MAX",
    "SCORE_WEAK_POSITION_MAX",
    "compute_weak_length_score",
    "compute_weak_position_score",
    "score_segment_match",
    # types
    "COARSE_SIGNAL_TYPES",
    "FENCE_LINE_RE",
    "H1_IN_BODY_RE",
    "ISSUE_SEVERITY",
    "JSX_CALLOUT_RE",
    "LEGACY_CALLOUT_RE",
    "SOURCE_UNUSABLE_TYPES",
    "STRUCTURE_MISMATCH_TYPES",
    "UNTRANSLATED_PATTERNS",
    # models
    "Segment",
    # madcap_toc
    "DEFAULT_BASE_URL",
    "TRICENTIS_URL_RE",
    "build_index_lookup",
    "build_sections",
    "build_sidebar_snapshot",
    "extract_slug",
    "extract_slugs_from_snapshot",
    "match_all_tricentis_urls",
    "parse_amd_module",
    "resolve_url",
    # sidebar
    "SIDEBAR_URLS_PATH",
    "extract_japanese_label",
    "filter_items_by_section",
    "find_sidebar_section",
    "get_section_slug_set",
    "load_sidebar_sections",
    "parse_sidebar_sections",
    # project
    "DOCS_DIR",
    "PROJECT_ROOT",
    "ROOT_DIR",
    "SIDEBAR_PATH",
    "build_basename_to_path_map",
    "build_docs_index",
    "build_slug_index",
    "extract_source_content_path",
    "file_path_to_slug",
    "find_md_files",
    "get_doc_section",
    "matches_section_filter",
    "read_doc_file",
    "reset_project_caches_for_test",
    "resolve_slug",
    "resolve_to_full_slug",
    "split_frontmatter",
    "to_kebab",
    "to_relative_doc_path",
    # extract
    "extract_invariant_tokens",
    # segments_shared
    "GATE_ELIGIBLE_KINDS",
    "SEGMENT_KINDS",
    "build_section_path",
    "compute_segment_fingerprint",
    "create_segment",
    "is_gate_eligible",
    "normalize_segment_text",
    "push_heading",
    # glossary_mask
    "GLOSSARY_PATH",
    "INVARIANT_PATH",
    "_clear_glossary_caches",
    "classify_segment",
    "create_mask_coverage",
    "load_glossary",
    "load_invariant_patterns",
    "mask_segment_text",
    # artifact_registry
    "ARTIFACT_REGISTRY",
    "NOOP_COVERAGE",
    "create_artifact_coverage",
    "is_artifact_excluded",
    # en_source_patches
    "DEFECT_CLASSES",
    "EN_SOURCE_PATCHES",
    "NOOP_PATCH_COVERAGE",
    "apply_en_source_patches",
    "count_occurrences",
    "create_en_source_patch_coverage",
]
