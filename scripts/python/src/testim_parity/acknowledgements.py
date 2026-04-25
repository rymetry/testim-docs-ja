"""acknowledgement の fingerprint 計算と schema 検証 + issue tagging。

``scripts/lib/source_parity_acknowledgements.mjs`` の port。structure mismatch と
source unusable も、slug + issueType + detailIncludes/detailRegex の汎用契約で扱う。
専用 key 分岐は追加しない。

mjs と byte-identical な出力契約 — conformance harness で fingerprint / validate
/ tagging の戻り値 shape を全て比較する。
"""

from __future__ import annotations

import datetime
import hashlib
import re
from collections.abc import Sequence
from types import MappingProxyType
from typing import Any

from .types import COARSE_SIGNAL_TYPES, ISSUE_SEVERITY

__all__ = [
    "NON_ACKNOWLEDGEABLE_TYPES",
    "compute_snapshot_fingerprint",
    "find_matching_acknowledgement",
    "is_acknowledgement_expired",
    "tag_issues_with_acknowledgements",
    "validate_acknowledgements",
]


# mjs `Object.freeze(new Set([...]))` 等価。Python 側は ``frozenset`` で immutable 化。
# segment-missing / segment-untranslated / segment-token-gap は hard gap で
# 抑制禁止。source-page-missing-local / segment-inconclusive も含む。
NON_ACKNOWLEDGEABLE_TYPES: frozenset[str] = frozenset(
    {
        "source-page-missing-local",
        "segment-missing",
        "segment-untranslated",
        "segment-token-gap",
        "segment-inconclusive",
    }
)


# Strict YYYY-MM-DD — ``isAcknowledgementExpired`` の lexicographic 比較を安全に
# するため。``2026-7-6`` のような unpadded は reject する。
_REVIEW_AFTER_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

# sha256 fingerprint format — 64 小文字 hex。
_SHA256_FINGERPRINT_RE = re.compile(r"^sha256:[0-9a-f]{64}$")


def compute_snapshot_fingerprint(content: str) -> str:
    """EN snapshot content の SHA-256 fingerprint を返す (mjs 等価)。

    形式: ``sha256:<64 小文字 hex>``。UTF-8 encode してから hash する
    (Node.js ``createHash().update(str)`` のデフォルト encoding と一致)。
    """
    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
    return f"sha256:{digest}"


def _validate_review_after_date(date_str: str, prefix: str) -> None:
    """mjs と同じ 2 段階検証 — format と calendar-validity で異なる error を出す。

    - step 1: strict ``YYYY-MM-DD`` regex (``2026-7-6`` を reject)
    - step 2: ``datetime.date`` round-trip で実在日 (``2026-02-31`` を reject)

    mjs のエラーメッセージと byte 一致させる必要があるため、メッセージ文言も
    両 step で別個に合わせる。
    """
    if not _REVIEW_AFTER_RE.match(date_str):
        raise ValueError(
            f'{prefix}: reviewAfter must be strict YYYY-MM-DD format (got "{date_str}")'
        )
    year, month, day = (int(part) for part in date_str.split("-"))
    try:
        datetime.date(year, month, day)
    except ValueError as exc:
        raise ValueError(
            f'{prefix}: reviewAfter "{date_str}" is not a valid calendar date'
        ) from exc


def validate_acknowledgements(parsed: Any) -> Any:
    """``parity-acknowledgements.json`` を validation する (mjs 等価)。

    schema 違反で ``ValueError`` を raise (mjs は ``Error`` を throw)。正常なら
    入力と同じ reference を返す (mutate しない)。

    検証項目:

    - object であること (array / None / 非 dict は reject)
    - ``schemaVersion === 1``
    - ``entries`` が list であること
    - 各 entry の REQUIRED_FIELDS (``slug`` / ``issueType`` / ``sourceFingerprint``
      / ``reason`` / ``owner`` / ``reviewAfter``) が str で非空
    - ``issueType`` が NON_ACKNOWLEDGEABLE_TYPES に含まれない
    - ``issueType`` が COARSE_SIGNAL_TYPES に含まれない (audit-only で no-op になる)
    - ``issueType`` が ISSUE_SEVERITY registry に含まれる
    - ``detailIncludes`` / ``detailRegex`` のいずれかを持つ
    - ``detailRegex`` は有効な regex
    - ``sourceFingerprint`` が ``sha256:<64hex>`` 形式
    - ``reviewAfter`` が strict YYYY-MM-DD の実在日付
    """
    if not isinstance(parsed, dict):
        raise ValueError("Acknowledgements file must be a JSON object")

    if parsed.get("schemaVersion") != 1:
        raise ValueError(
            f"Unsupported acknowledgements schemaVersion: {parsed.get('schemaVersion')}"
        )

    entries = parsed.get("entries")
    if not isinstance(entries, list):
        raise ValueError('Acknowledgements must have an "entries" array')

    required_fields = (
        "slug",
        "issueType",
        "sourceFingerprint",
        "reason",
        "owner",
        "reviewAfter",
    )

    for i, entry in enumerate(entries):
        prefix = f"Acknowledgement entry #{i + 1}"
        if not isinstance(entry, dict):
            raise ValueError(f"{prefix}: must be a JSON object")

        for field in required_fields:
            value = entry.get(field)
            if not value or not isinstance(value, str):
                raise ValueError(f'{prefix}: missing or invalid "{field}"')

        issue_type = entry["issueType"]
        if issue_type in NON_ACKNOWLEDGEABLE_TYPES:
            raise ValueError(f'{prefix}: issueType "{issue_type}" cannot be acknowledged')

        if issue_type in COARSE_SIGNAL_TYPES:
            raise ValueError(
                f'{prefix}: issueType "{issue_type}" は audit-only coarse signal — '
                "acknowledgement は受け付けない (no-op になるため)"
            )

        if issue_type not in ISSUE_SEVERITY:
            raise ValueError(
                f'{prefix}: unknown issueType "{issue_type}" '
                "(not in ISSUE_SEVERITY registry — check for typos)"
            )

        has_detail_includes = bool(entry.get("detailIncludes"))
        has_detail_regex = bool(entry.get("detailRegex"))
        if not has_detail_includes and not has_detail_regex:
            raise ValueError(f'{prefix}: must specify "detailIncludes" or "detailRegex"')

        if has_detail_regex:
            try:
                re.compile(entry["detailRegex"])
            except re.error as exc:
                raise ValueError(
                    f'{prefix}: invalid detailRegex: "{entry["detailRegex"]}"'
                ) from exc

        if not _SHA256_FINGERPRINT_RE.match(entry["sourceFingerprint"]):
            raise ValueError(f"{prefix}: invalid sourceFingerprint format")

        _validate_review_after_date(entry["reviewAfter"], prefix)

    return parsed


# mjs ``isAcknowledgementExpired`` の戻り値 shape。
_NOT_EXPIRED: MappingProxyType[str, Any] = MappingProxyType({"expired": False})


def is_acknowledgement_expired(
    entry: dict[str, Any],
    current_snapshot_fingerprint: str | None,
    today: str,
) -> dict[str, Any]:
    """ack entry の expiration を priority 順で判定 (mjs 等価)。

    判定順:

    1. ``current_snapshot_fingerprint`` が None → ``no-snapshot``
    2. ``entry.sourceFingerprint != current_snapshot_fingerprint`` → ``fingerprint-changed``
    3. ``today > entry.reviewAfter`` (inclusive) → ``review-date-passed``
    4. いずれでもなければ ``{"expired": False}``

    戻り値は常に新しい dict (caller が mutate しても entry は影響しない)。
    """
    if current_snapshot_fingerprint is None:
        return {"expired": True, "reason": "no-snapshot"}
    if entry.get("sourceFingerprint") != current_snapshot_fingerprint:
        return {"expired": True, "reason": "fingerprint-changed"}
    # slice(0, 10) で YYYY-MM-DD だけを比較する (mjs と同じ挙動)
    if today[:10] > entry.get("reviewAfter", "")[:10]:
        return {"expired": True, "reason": "review-date-passed"}
    return dict(_NOT_EXPIRED)


def find_matching_acknowledgement(
    slug: str,
    issue: dict[str, Any],
    entries: Sequence[dict[str, Any]],
    current_snapshot_fingerprint: str | None,
    today: str,
) -> dict[str, Any] | None:
    """issue にマッチする最初の ack entry を返す (mjs 等価)。

    マッチ条件 (全て真):

    1. ``entry.slug == slug``
    2. ``entry.issueType == issue.type``
    3. ``entry.detailIncludes`` 指定時は detail に substring が含まれる
    4. ``entry.detailRegex`` 指定時は detail に regex がマッチする

    detail は ``issue.detail`` > ``issue.text`` > ``""`` の優先順 (mjs と同一)。

    マッチなしで ``None``。マッチありで ``{"entry": ..., "expired": bool,
    "expiryReason": str | None}``。
    """
    detail = issue.get("detail") or issue.get("text") or ""

    for entry in entries:
        if entry.get("slug") != slug:
            continue
        if entry.get("issueType") != issue.get("type"):
            continue
        detail_includes = entry.get("detailIncludes")
        if detail_includes and detail_includes not in detail:
            continue
        detail_regex = entry.get("detailRegex")
        if detail_regex and not re.search(detail_regex, detail):
            continue

        expiry = is_acknowledgement_expired(entry, current_snapshot_fingerprint, today)
        expired = bool(expiry["expired"])
        return {
            "entry": entry,
            "expired": expired,
            "expiryReason": expiry.get("reason") if expired else None,
        }

    return None


def tag_issues_with_acknowledgements(
    slug: str,
    issues: Sequence[dict[str, Any]],
    entries: Sequence[dict[str, Any]],
    current_snapshot_fingerprint: str | None,
    today: str,
) -> list[dict[str, Any]]:
    """issues に ack metadata を付与 (filter しない、immutable — mjs 等価)。

    マッチした issue には ``acknowledged`` / ``ackReason`` / ``ackOwner`` /
    ``ackReviewAfter`` / ``ackExpired`` を追加。期限切れなら ``ackExpiryReason``
    も追加。マッチしない issue は元 reference をそのまま返す (mjs も
    ``return issue;`` で同一 reference を返す — 本 port も shallow dict の同一
    reference を返す)。
    """
    tagged: list[dict[str, Any]] = []
    for issue in issues:
        match = find_matching_acknowledgement(
            slug, issue, entries, current_snapshot_fingerprint, today
        )
        if match is None:
            tagged.append(issue)
            continue

        entry = match["entry"]
        decorated: dict[str, Any] = {
            **issue,
            "acknowledged": True,
            "ackReason": entry["reason"],
            "ackOwner": entry["owner"],
            "ackReviewAfter": entry["reviewAfter"],
            "ackExpired": match["expired"],
        }
        if match["expired"]:
            decorated["ackExpiryReason"] = match["expiryReason"]
        tagged.append(decorated)
    return tagged
