"""advisory_queue の unit test。

conformance test (test_advisory_queue_parity.py) が mjs との byte 一致を担当。
ここでは Python 側の dict/非 dict 扱い、queue key 形式、sort 順、error path を
個別確認する。
"""

from __future__ import annotations

from testim_parity.advisory_queue import (
    build_advisory_artifacts,
    build_advisory_queue_issue_key,
    build_advisory_review_queue,
    build_advisory_review_scope,
    is_advisory_review_candidate,
    is_blocking_advisory_review_issue,
    is_valid_advisory_acknowledgement,
    summarize_advisory_review_queue,
)


def test_is_candidate_matches_tokenless_near_tie():
    assert (
        is_advisory_review_candidate(
            {"type": "segment-inconclusive", "inconclusiveCategory": "tokenless-near-tie"}
        )
        is True
    )
    assert (
        is_advisory_review_candidate(
            {"type": "segment-inconclusive", "inconclusiveCategory": "other"}
        )
        is False
    )
    assert (
        is_advisory_review_candidate(
            {"type": "segment-missing", "inconclusiveCategory": "tokenless-near-tie"}
        )
        is False
    )


def test_is_candidate_rejects_non_dict():
    assert is_advisory_review_candidate(None) is False
    assert is_advisory_review_candidate("not-a-dict") is False


def test_is_valid_advisory_ack():
    assert is_valid_advisory_acknowledgement({"acknowledged": True}) is True
    assert is_valid_advisory_acknowledgement({"acknowledged": True, "ackExpired": True}) is False
    assert is_valid_advisory_acknowledgement({}) is False


def test_is_blocking_requires_no_ack_no_baseline():
    issue = {"type": "segment-inconclusive"}
    assert is_blocking_advisory_review_issue(issue) is True
    assert is_blocking_advisory_review_issue({**issue, "baselined": True}) is False
    assert is_blocking_advisory_review_issue({**issue, "acknowledged": True}) is False


def test_build_scope_slug_wins_over_section():
    scope = build_advisory_review_scope(slug="a", section="b")
    assert scope["type"] == "slug"
    assert scope["isComplete"] is False
    assert scope["filters"] == {"slug": "a", "section": "b"}


def test_build_scope_full_when_both_empty():
    scope = build_advisory_review_scope()
    assert scope["type"] == "full"
    assert scope["isComplete"] is True


def test_build_scope_coerces_bad_int_fields():
    scope = build_advisory_review_scope(checked_files=-1, total_files="nope")  # type: ignore[arg-type]
    assert scope["checkedFiles"] == 0
    assert scope["totalFiles"] == 0


def test_queue_key_minimal():
    key = build_advisory_queue_issue_key(
        "a/b",
        {"type": "segment-inconclusive", "inconclusiveCategory": "tokenless-near-tie"},
    )
    assert key == "a/b|segment-inconclusive|category=tokenless-near-tie"


def test_queue_key_includes_pair_when_section_paths_present():
    issue = {
        "type": "segment-inconclusive",
        "inconclusiveCategory": "tokenless-near-tie",
        "inconclusiveMeta": {"leftSectionPath": "L", "rightSectionPath": "R"},
    }
    key = build_advisory_queue_issue_key("a/b", issue)
    assert key.endswith("|pair=L=>R")


def test_queue_key_handles_none_slug_and_type():
    key = build_advisory_queue_issue_key(None, {})
    assert "_unknown-slug_" in key
    assert "_unknown-type_" in key


def test_build_queue_filters_non_candidates_and_sorts_by_file():
    results = [
        {
            "file": "src/content/docs/b.md",
            "sourceUrl": "https://x",
            "category": "cat",
            "issues": [
                {
                    "type": "segment-inconclusive",
                    "inconclusiveCategory": "tokenless-near-tie",
                    "severity": "actionable",
                    "detail": "d",
                }
            ],
        },
        {
            "file": "src/content/docs/a.md",
            "issues": [
                {
                    "type": "segment-inconclusive",
                    "inconclusiveCategory": "other-category",
                }
            ],
        },
        {
            "file": "src/content/docs/c.md",
            "issues": [
                {
                    "type": "segment-inconclusive",
                    "inconclusiveCategory": "tokenless-near-tie",
                    "severity": "actionable",
                    "detail": "c-detail",
                }
            ],
        },
    ]
    queue = build_advisory_review_queue(results)
    # a.md は filter 対象なので queue に入らない
    files = [entry["file"] for entry in queue]
    assert files == ["src/content/docs/b.md", "src/content/docs/c.md"]
    # slug は DOCS_PREFIX + .md が剥がされる
    assert queue[0]["slug"] == "b"
    assert queue[1]["slug"] == "c"


def test_summarize_empty_queue():
    summary = summarize_advisory_review_queue([])
    assert summary["advisoryQueueIssues"] == 0
    assert summary["advisoryQueueFiles"] == 0
    assert summary["advisoryQueueComplete"] is None
    assert summary["advisoryQueueScopeType"] is None


def test_summarize_aggregates_categories():
    queue = [
        {
            "issues": [
                {"inconclusiveCategory": "tokenless-near-tie"},
                {"inconclusiveCategory": "tokenless-near-tie"},
                {"inconclusiveCategory": "other"},
            ]
        }
    ]
    scope = {"isComplete": True, "type": "full"}
    summary = summarize_advisory_review_queue(queue, scope)
    assert summary["advisoryQueueIssues"] == 3
    assert summary["advisoryQueueByCategory"] == {"tokenless-near-tie": 2, "other": 1}
    assert summary["advisoryQueueComplete"] is True
    assert summary["advisoryQueueScopeType"] == "full"


def test_queue_key_rejects_bool_scores():
    """python-reviewer LOW 指摘対応: bool は JS ``typeof === 'boolean'`` なので
    number 扱いされない — normalize_finite_number が None を返す経路を確認する。
    """
    issue = {
        "type": "segment-inconclusive",
        "inconclusiveCategory": "tokenless-near-tie",
        "inconclusiveMeta": {
            # bool は mjs で number 扱いされないので normalize で None になる
            "currentScore": True,
            "swapScore": False,
            "leftSectionPath": "",  # 空文字で None
        },
    }
    # meta 全 field が None になるため pair key は emit されない
    key = build_advisory_queue_issue_key("a/b", issue)
    assert "pair=" not in key


def test_build_artifacts_captures_exception():
    def failing_builder(_results):
        raise RuntimeError("boom")

    artifacts = build_advisory_artifacts(build_queue=failing_builder)
    assert artifacts["advisoryQueue"] == []
    assert "boom" in artifacts["advisoryQueueError"]
    assert artifacts["advisoryQueueScope"]["type"] == "full"
