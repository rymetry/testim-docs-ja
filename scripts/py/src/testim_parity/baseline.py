"""Frozen baseline mechanism (schema v2 / Phase 4 final)。

``scripts/lib/source_parity_baseline.mjs`` の port。baseline は cutover 時点の
既存 drift を凍結する仕組み。ack は「人がレビューして了承した例外」、baseline
は「cutover 時点の既知 debt」で意味も生成方法も寿命も違うため、
``parity-acknowledgements.json`` とは別ファイルで管理する。

純粋関数のみ。filesystem I/O は呼び出し側 (``check_source_parity`` /
``generate_parity_baseline``) が行う。``load_baseline_file`` だけ薄い fs wrapper。

**v2 変更点 (Phase 4)**:

- ``reviewAfter`` 概念を撤去 (期限切れ / expiringSoon も含めて全廃)
- ``BASELINE_ELIGIBLE_TYPES`` を JA-actionable 7 type に縮約
  (segment-inconclusive / snapshot-incomplete / source-unusable を除外)
- ``inconclusiveCategory`` / ``inconclusiveReason`` / ``usabilityReason`` は
  entry schema から除去 (runtime issue 側にのみ保持)
- ``priority`` (high/medium/low, default medium) / ``note`` (任意 free-text) を追加

mjs と byte-identical な出力契約 — conformance harness で key 生成 /
fingerprint / validate / tagging の戻り値 shape を全て比較する。
"""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Sequence
from pathlib import Path
from typing import Any

from .types import STRUCTURE_MISMATCH_TYPES

__all__ = [
    "BASELINE_ELIGIBLE_TYPES",
    "NOTE_MAX_LENGTH",
    "PRIORITY_VALUES",
    "STRUCTURE_CATEGORIES",
    "TYPES_ARG_ALLOWLIST",
    "build_baseline_key",
    "build_baseline_key_from_entry",
    "compute_orphan_baseline_entries",
    "compute_structure_fingerprint",
    "load_baseline_file",
    "tag_issues_with_baseline",
    "validate_baseline",
    "validate_types_arg",
]


# frozen baseline 対象になる issue type (schema v2)。
# JA-actionable な 7 type のみ。期限管理 / advisory の混在を避けるため
# segment-inconclusive (advisory) / snapshot-incomplete / source-unusable
# (source 側 debt) は eligibility から外した。identity key は
# ``build_baseline_key`` / ``build_baseline_key_from_entry`` で segment 系 vs
# structure 系で分岐する。
BASELINE_ELIGIBLE_TYPES: frozenset[str] = frozenset(
    {
        "segment-missing",
        "segment-extra",
        "segment-shifted",
        "segment-untranslated",
        "segment-token-gap",
        "section-structure-mismatch",
        "segment-order-mismatch",
    }
)


# ``generate_parity_baseline --types`` で受け入れる issueType の allowlist。
# v2 では structure mismatch 2 type のみ。segment-* は ``--regenerate`` で
# 全再構築するのが基本運用で、``--types`` による partial regenerate は
# structure family の migration 時のみ使う契約。
TYPES_ARG_ALLOWLIST: frozenset[str] = frozenset(
    {
        "section-structure-mismatch",
        "segment-order-mismatch",
    }
)


# baseline entry が取りうる priority 値 (schema v2)。
# default は ``medium``。generator / validator は in order で strict match する。
PRIORITY_VALUES: tuple[str, str, str] = ("high", "medium", "low")


# baseline entry に付与できる free-text note の最大長 (v2)。
NOTE_MAX_LENGTH: int = 500


# structure mismatch baseline 対象の structureCategory 列。
# ``structure.py`` の 3 stage (kind-multiset / kind-sequence / content-order)
# と 1:1 で対応する enum。emitter 側が新しい stage を追加する際は
# こちらも同期する必要がある (test で pin)。
STRUCTURE_CATEGORIES: frozenset[str] = frozenset(
    {"kind-multiset", "kind-sequence", "content-order"}
)


# mjs ``TYPES_ARG_ALLOWLIST`` は ``[...set].join(', ')`` で insertion order に
# 依存したエラー文言を出す。Python ``frozenset`` の iteration は非決定的なので
# 専用の sorted tuple を固定順で保持する (mjs byte parity 用)。
_TYPES_ARG_ALLOWLIST_ORDERED: tuple[str, ...] = (
    "section-structure-mismatch",
    "segment-order-mismatch",
)


def validate_types_arg(types: Any) -> dict[str, Any]:
    """``generate_parity_baseline --types=<csv>`` の引数を検証 (mjs 等価)。

    CLI wiring 側から呼び出すための thin helper。``main()`` を直接テスト
    する代わりにこのヘルパを単体テストする。

    受理:

    - ``None`` (= ``--types`` flag が指定されていない) → ``{"ok": True}``
    - ``TYPES_ARG_ALLOWLIST`` の非空部分集合 → ``{"ok": True}``

    reject:

    - 非 list → ``{"ok": False, "error": str}``
    - 空 list → ``{"ok": False, "error": str}`` (silent no-op 防止)
    - allowlist 外の要素を含む → ``{"ok": False, "error": str}``
    """
    if types is None:
        return {"ok": True}
    if not isinstance(types, list):
        # mjs ``typeof`` を Python 型名に翻訳して出力。型名ごとの drift を避ける
        # ため、mjs conformance では list 以外を渡さない (harness は非 list 入力を
        # 評価しない契約)。
        return {
            "ok": False,
            "error": f"--types must be a comma-separated list (got {type(types).__name__})",
        }
    if len(types) == 0:
        return {
            "ok": False,
            "error": (
                "--types cannot be empty. Use --regenerate for a full rebuild, "
                f"or pass a non-empty csv of: {', '.join(_TYPES_ARG_ALLOWLIST_ORDERED)}"
            ),
        }
    unknown = [t for t in types if t not in TYPES_ARG_ALLOWLIST]
    if unknown:
        return {
            "ok": False,
            "error": (
                f"--types contains unsupported issueType(s): {', '.join(unknown)}. "
                f"Allowed: {', '.join(_TYPES_ARG_ALLOWLIST_ORDERED)}"
            ),
        }
    return {"ok": True}


def compute_structure_fingerprint(
    *,
    structureCategory: Any,
    enKinds: Any,
    jaKinds: Any,
    contentPermutation: Any = None,
) -> str:
    """structure mismatch issue payload から ``structureFingerprint`` を derive。

    mjs ``computeStructureFingerprint`` 等価。key 順序と join 記号を厳密に
    固定することで、runtime 側の ``build_baseline_key`` と disk 側の
    ``build_baseline_key_from_entry`` が同じ fingerprint を経由して identity
    key を合成できるようにする。生の ``enKinds`` / ``jaKinds`` /
    ``contentPermutation`` は baseline entry に保存せず、ここで hash に畳み込む。

    注意点:

    - ``enKinds`` / ``jaKinds`` の順序は EN/JA それぞれの自然順を使う
      (``structure.py::buildBaseDiff`` の出力順)
    - ``contentPermutation`` は ``structureCategory === 'content-order'`` の
      ときのみ使用し、``enIndex`` 昇順に並べ替えて ``enIndex->jaIndex``
      形式に join する。``score`` は identity に含めない
    - ``kind-multiset`` / ``kind-sequence`` では ``contentPermutation`` を無視
      (``None`` / 省略で同じ fingerprint になる)

    キーワード引数名は mjs の camelCase destructuring と byte-identical に
    対応させるため camelCase のままにしている (conformance harness 経由で
    dict を展開する時に再マッピングしたくない)。
    """
    permutation_digest = ""
    if structureCategory == "content-order" and isinstance(contentPermutation, list):
        # enIndex 昇順に stable sort。同じ ``enIndex`` が複数あっても
        # mjs の ``Array.prototype.sort`` は v12+ stable なので順序は保たれる。
        sorted_perm = sorted(contentPermutation, key=lambda p: p["enIndex"])
        permutation_digest = ",".join(f"{p['enIndex']}->{p['jaIndex']}" for p in sorted_perm)

    en_kinds_part = "|".join(enKinds) if isinstance(enKinds, list) else ""
    ja_kinds_part = "|".join(jaKinds) if isinstance(jaKinds, list) else ""
    raw = "\n".join([structureCategory, en_kinds_part, ja_kinds_part, permutation_digest])
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


# sha256 fingerprint format — 64 小文字 hex (mjs と同じ)。
_FINGERPRINT_RE = re.compile(r"^sha256:[0-9a-f]{64}$")


def _is_valid_fingerprint(value: Any) -> bool:
    """mjs ``isValidFingerprint`` 等価の型 + regex ガード。"""
    return isinstance(value, str) and bool(_FINGERPRINT_RE.match(value))


def _is_valid_missing_tokens(value: Any) -> bool:
    """``missingTokens`` が非空 list[非空 str] か判定 (mjs 等価)。"""
    if not isinstance(value, list) or len(value) == 0:
        return False
    return all(isinstance(token, str) and len(token) > 0 for token in value)


def _missing_tokens_signature(value: Any) -> str:
    """``tokens`` の dedupe + sort + ``,`` join (mjs 等価、順序は str 昇順)。"""
    if not isinstance(value, list):
        return ""
    # ``new Set([...])`` で dedupe → ``.sort()`` で str 昇順。
    return ",".join(sorted(set(value)))


# validate 中に ``[...frozenset]`` で表示する時の安定順序 (mjs insertion order の
# byte-parity 用)。mjs は ``[...BASELINE_ELIGIBLE_TYPES].join(', ')`` で
# insertion 順を出力するため、Python 側は tuple で固定する。
_BASELINE_ELIGIBLE_TYPES_ORDERED: tuple[str, ...] = (
    "segment-missing",
    "segment-extra",
    "segment-shifted",
    "segment-untranslated",
    "segment-token-gap",
    "section-structure-mismatch",
    "segment-order-mismatch",
)

_STRUCTURE_CATEGORIES_ORDERED: tuple[str, ...] = (
    "kind-multiset",
    "kind-sequence",
    "content-order",
)


def validate_baseline(parsed: Any) -> Any:
    """``parity-baseline.json`` (schema v2) を validate (mjs 等価)。

    schema 違反で ``ValueError`` を raise (mjs は ``Error`` を throw)。正常なら
    入力と同じ reference を返す (mutate しない)。

    エラーメッセージは mjs と byte 一致させる必要があるため文言を厳密に維持する。
    """
    if not isinstance(parsed, dict):
        raise ValueError("Baseline file must be a JSON object")

    if parsed.get("schemaVersion") != 2:
        raise ValueError(
            f"Unsupported baseline schemaVersion: {parsed.get('schemaVersion')} (expected 2)"
        )

    entries = parsed.get("entries")
    if not isinstance(entries, list):
        raise ValueError('Baseline must have an "entries" array')

    for i, entry in enumerate(entries):
        prefix = f"Baseline entry #{i + 1}"

        if not isinstance(entry, dict):
            raise ValueError(f"{prefix}: must be an object")

        slug = entry.get("slug")
        if not isinstance(slug, str) or slug == "":
            raise ValueError(f'{prefix}: missing or invalid "slug"')

        issue_type = entry.get("issueType")
        if not isinstance(issue_type, str) or issue_type not in BASELINE_ELIGIBLE_TYPES:
            raise ValueError(
                f'{prefix}: invalid "issueType" — must be one of '
                f"{', '.join(_BASELINE_ELIGIBLE_TYPES_ORDERED)}"
            )

        snapshot_fp = entry.get("snapshotFingerprint")
        if not isinstance(snapshot_fp, str) or not _FINGERPRINT_RE.match(snapshot_fp):
            raise ValueError(f'{prefix}: invalid "snapshotFingerprint" — must be sha256:<64 hex>')

        # v2: priority (required, enum) / note (optional, <= 500 chars)
        if entry.get("priority") not in PRIORITY_VALUES:
            raise ValueError(
                f'{prefix}: invalid "priority" — must be one of {", ".join(PRIORITY_VALUES)}'
            )

        note = entry.get("note")
        if note is not None:
            if not isinstance(note, str):
                raise ValueError(f'{prefix}: "note" must be a string when present')
            if len(note) > NOTE_MAX_LENGTH:
                raise ValueError(
                    f'{prefix}: "note" exceeds {NOTE_MAX_LENGTH} characters (got {len(note)})'
                )

        # issueType ごとに、baseline の同定に必要な構造化フィールドを検証する。
        if issue_type in STRUCTURE_MISMATCH_TYPES:
            # sectionPath は可読性用に保持するが、同定には使わない。
            section_index = entry.get("sectionIndex")
            if (
                not isinstance(section_index, int)
                or isinstance(section_index, bool)
                or section_index < 0
            ):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have non-negative integer "
                    "sectionIndex (machine identity key)"
                )
            if not isinstance(entry.get("sectionPath"), str):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have string sectionPath "
                    "(empty string allowed for preface; reviewer readability only, "
                    "not identity)"
                )
            structure_category = entry.get("structureCategory")
            if (
                not isinstance(structure_category, str)
                or structure_category not in STRUCTURE_CATEGORIES
            ):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have structureCategory in "
                    f"{', '.join(_STRUCTURE_CATEGORIES_ORDERED)}"
                )
            if not _is_valid_fingerprint(entry.get("structureFingerprint")):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have valid structureFingerprint "
                    "(sha256:<64 hex>)"
                )
        elif issue_type in ("segment-extra", "segment-untranslated"):
            ja_segment_index = entry.get("jaSegmentIndex")
            # mjs ``typeof === 'number'`` には bool が含まれないので除外。
            if not isinstance(ja_segment_index, (int, float)) or isinstance(ja_segment_index, bool):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have numeric jaSegmentIndex (JA-owned diff)"
                )
            if not _is_valid_fingerprint(entry.get("jaSourceFingerprint")):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have valid jaSourceFingerprint"
                )
        elif issue_type == "segment-shifted":
            en_segment_index = entry.get("enSegmentIndex")
            if not isinstance(en_segment_index, (int, float)) or isinstance(en_segment_index, bool):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have numeric enSegmentIndex (EN-owned diff)"
                )
            if not _is_valid_fingerprint(entry.get("enSourceFingerprint")):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have valid enSourceFingerprint"
                )
            if not _is_valid_fingerprint(entry.get("jaSourceFingerprint")):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have valid jaSourceFingerprint"
                )
        else:
            # segment-missing / segment-token-gap
            en_segment_index = entry.get("enSegmentIndex")
            if not isinstance(en_segment_index, (int, float)) or isinstance(en_segment_index, bool):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have numeric enSegmentIndex (EN-owned diff)"
                )
            if not _is_valid_fingerprint(entry.get("enSourceFingerprint")):
                raise ValueError(
                    f"{prefix}: {issue_type} entry must have valid enSourceFingerprint"
                )
            if issue_type == "segment-token-gap" and not _is_valid_missing_tokens(
                entry.get("missingTokens")
            ):
                raise ValueError(f"{prefix}: {issue_type} entry must have non-empty missingTokens")

    return parsed


def load_baseline_file(file_path: str | Path) -> Any:
    """``parity-baseline.json`` を読み込み validate (mjs ``loadBaselineFile`` 等価)。"""
    path = Path(file_path)
    raw = path.read_text(encoding="utf-8")
    parsed = json.loads(raw)
    return validate_baseline(parsed)


# issueType の "ownership"。EN 側がオーナーなら ``enSegmentIndex`` を baseline
# 同定に使う。JA 側がオーナーなら ``jaSegmentIndex`` を使う。
_JA_OWNED_TYPES: frozenset[str] = frozenset({"segment-extra", "segment-untranslated"})


def _fmt_field(value: Any) -> str:
    """mjs ``value ?? '_null_'`` 等価。None は ``_null_`` 文字列に畳み込む。

    mjs は ``undefined`` も同じく ``_null_`` に畳み込むため、Python 側も
    key missing (= None) を同一視する。数値は str(int) で出力するが、
    mjs は ``Number`` そのまま埋め込むので float の trailing ``.0`` が付かない
    ような値 (0, 3 など) でないと drift が出る。整数の ``int`` はそのまま
    埋め込んでも末尾 ``.0`` 付与なし。
    """
    if value is None:
        return "_null_"
    return str(value)


def build_baseline_key(slug: str, issue: dict[str, Any]) -> str:
    """issue から安定 lookup key を構築する (mjs ``buildBaselineKey`` 等価)。

    key 規則 (schema v2):

    - JA-owned (segment-extra, segment-untranslated):
      ``slug|issueType|sectionPath|segmentKind|ja|jaSegmentIndex|jafp=jaSourceFingerprint``
    - EN-owned (segment-missing):
      ``slug|issueType|sectionPath|segmentKind|en|enSegmentIndex|enfp=enSourceFingerprint``
    - segment-token-gap: EN-owned + ``tokens=<missingTokens signature>``
    - segment-shifted: EN-owned + ``jafp=<jaSourceFingerprint>``
    - structure mismatch:
      ``slug|issueType|idx=sectionIndex|cat=structureCategory|sfp=<fingerprint>``
    """
    issue_type = issue.get("type")

    if issue_type in STRUCTURE_MISMATCH_TYPES:
        fp = compute_structure_fingerprint(
            structureCategory=issue.get("structureCategory"),
            enKinds=issue.get("enKinds") if isinstance(issue.get("enKinds"), list) else [],
            jaKinds=issue.get("jaKinds") if isinstance(issue.get("jaKinds"), list) else [],
            contentPermutation=issue.get("contentPermutation"),
        )
        return (
            f"{slug}|{issue_type}|idx={_fmt_field(issue.get('sectionIndex'))}|"
            f"cat={_fmt_field(issue.get('structureCategory'))}|sfp={fp}"
        )

    section_path = issue.get("sectionPath") or ""
    segment_kind = issue.get("segmentKind") or ""

    if issue_type in _JA_OWNED_TYPES:
        return (
            f"{slug}|{issue_type}|{section_path}|{segment_kind}|ja|"
            f"{_fmt_field(issue.get('jaSegmentIndex'))}|"
            f"jafp={_fmt_field(issue.get('jaSourceFingerprint'))}"
        )

    if issue_type == "segment-token-gap":
        return (
            f"{slug}|{issue_type}|{section_path}|{segment_kind}|en|"
            f"{_fmt_field(issue.get('enSegmentIndex'))}|"
            f"enfp={_fmt_field(issue.get('enSourceFingerprint'))}|"
            f"tokens={_missing_tokens_signature(issue.get('missingTokens'))}"
        )

    if issue_type == "segment-shifted":
        return (
            f"{slug}|{issue_type}|{section_path}|{segment_kind}|en|"
            f"{_fmt_field(issue.get('enSegmentIndex'))}|"
            f"enfp={_fmt_field(issue.get('enSourceFingerprint'))}|"
            f"jafp={_fmt_field(issue.get('jaSourceFingerprint'))}"
        )

    return (
        f"{slug}|{issue_type}|{section_path}|{segment_kind}|en|"
        f"{_fmt_field(issue.get('enSegmentIndex'))}|"
        f"enfp={_fmt_field(issue.get('enSourceFingerprint'))}"
    )


def build_baseline_key_from_entry(entry: dict[str, Any]) -> str:
    """baseline entry から安定 lookup key を構築 (mjs 等価)。

    ``build_baseline_key`` と同じ順序で key を組み立てるため、issue と entry が
    同一 fingerprint を経由して一致する。``structureFingerprint`` は baseline
    entry に既に保存済みなので再計算しない。
    """
    issue_type = entry.get("issueType")

    if issue_type in STRUCTURE_MISMATCH_TYPES:
        return (
            f"{entry.get('slug')}|{issue_type}|idx={_fmt_field(entry.get('sectionIndex'))}|"
            f"cat={_fmt_field(entry.get('structureCategory'))}|"
            f"sfp={_fmt_field(entry.get('structureFingerprint'))}"
        )

    section_path = entry.get("sectionPath") or ""
    segment_kind = entry.get("segmentKind") or ""

    if issue_type in _JA_OWNED_TYPES:
        return (
            f"{entry.get('slug')}|{issue_type}|{section_path}|{segment_kind}|ja|"
            f"{_fmt_field(entry.get('jaSegmentIndex'))}|"
            f"jafp={_fmt_field(entry.get('jaSourceFingerprint'))}"
        )

    if issue_type == "segment-token-gap":
        return (
            f"{entry.get('slug')}|{issue_type}|{section_path}|{segment_kind}|en|"
            f"{_fmt_field(entry.get('enSegmentIndex'))}|"
            f"enfp={_fmt_field(entry.get('enSourceFingerprint'))}|"
            f"tokens={_missing_tokens_signature(entry.get('missingTokens'))}"
        )

    if issue_type == "segment-shifted":
        return (
            f"{entry.get('slug')}|{issue_type}|{section_path}|{segment_kind}|en|"
            f"{_fmt_field(entry.get('enSegmentIndex'))}|"
            f"enfp={_fmt_field(entry.get('enSourceFingerprint'))}|"
            f"jafp={_fmt_field(entry.get('jaSourceFingerprint'))}"
        )

    return (
        f"{entry.get('slug')}|{issue_type}|{section_path}|{segment_kind}|en|"
        f"{_fmt_field(entry.get('enSegmentIndex'))}|"
        f"enfp={_fmt_field(entry.get('enSourceFingerprint'))}"
    )


def tag_issues_with_baseline(
    slug: str,
    issues: Sequence[dict[str, Any]],
    baseline_entries: Sequence[dict[str, Any]],
    current_snapshot_fingerprint: str | None,
) -> dict[str, Any]:
    """baseline entry にマッチする issue を ``baselined=True`` でタグ付け。

    mjs ``tagIssuesWithBaseline`` 等価。Page-level invalidation:
    そのページに baseline entry があっても ``snapshotFingerprint`` が現在の
    page snapshot と異なる場合、**全 entry が無効化** され、issue は一切
    タグ付けされず ``invalidated=True`` が返る。

    v2 契約: ``issue.baselined = True`` を付与するだけ (期限管理 / tagging
    metadata は全廃)。フィルタ側は ``is_frozen_by_baseline(issue) ≡
    issue.baselined is True`` で判定する。

    戻り値は常に新しい dict / list。入力は mutate しない (mjs 等価)。
    """
    slug_entries = [e for e in baseline_entries if e.get("slug") == slug]

    if len(slug_entries) == 0:
        return {
            "tagged": [dict(i) for i in issues],
            "invalidated": False,
            "matchedKeys": set(),
        }

    # fingerprint がずれたページでは、そのページの baseline を一括無効化する。
    fingerprint_mismatch = any(
        e.get("snapshotFingerprint") != current_snapshot_fingerprint for e in slug_entries
    )
    if fingerprint_mismatch:
        return {
            "tagged": [dict(i) for i in issues],
            "invalidated": True,
            "matchedKeys": set(),
        }

    entry_key_index: dict[str, dict[str, Any]] = {}
    for entry in slug_entries:
        entry_key_index[build_baseline_key_from_entry(entry)] = entry

    matched_keys: set[str] = set()
    tagged: list[dict[str, Any]] = []
    for issue in issues:
        if issue.get("type") not in BASELINE_ELIGIBLE_TYPES:
            tagged.append(dict(issue))
            continue
        key = build_baseline_key(slug, issue)
        if key in entry_key_index:
            matched_keys.add(key)
            tagged.append({**issue, "baselined": True})
        else:
            tagged.append(dict(issue))

    return {"tagged": tagged, "invalidated": False, "matchedKeys": matched_keys}


def compute_orphan_baseline_entries(
    slug: str,
    baseline_entries: Any,
    matched_keys: Any,
) -> list[dict[str, Any]]:
    """``tag_issues_with_baseline`` の ``matchedKeys`` を使って orphan entry を返す。

    mjs ``computeOrphanBaselineEntries`` 等価。page-level invalidation 時は全
    entry が unmatched になるため、呼び出し側で ``invalidated`` を見て orphan
    集計をスキップする。
    """
    if not isinstance(baseline_entries, list):
        return []
    if not isinstance(matched_keys, set):
        return []
    slug_entries = [e for e in baseline_entries if e.get("slug") == slug]
    return [e for e in slug_entries if build_baseline_key_from_entry(e) not in matched_keys]
