"""advisory_queue の mjs byte 一致 conformance。"""

from __future__ import annotations

import pytest

from testim_parity.advisory_queue import (
    build_advisory_queue_issue_key,
    build_advisory_review_queue,
    build_advisory_review_scope,
    is_advisory_review_candidate,
    is_blocking_advisory_review_issue,
    is_valid_advisory_acknowledgement,
    summarize_advisory_review_queue,
)

from ._harness import run_batch

CANDIDATE_SAMPLES = [
    {"type": "segment-inconclusive", "inconclusiveCategory": "tokenless-near-tie"},
    {"type": "segment-inconclusive", "inconclusiveCategory": "other"},
    {"type": "segment-missing", "inconclusiveCategory": "tokenless-near-tie"},
    {},
]


ACK_SAMPLES = [
    {"acknowledged": True},
    {"acknowledged": True, "ackExpired": True},
    {"acknowledged": False},
    {},
]


BLOCKING_SAMPLES = [
    {"type": "segment-inconclusive"},
    {"type": "segment-inconclusive", "baselined": True},
    {"type": "segment-inconclusive", "acknowledged": True},
    {"type": "segment-inconclusive", "acknowledged": True, "ackExpired": True},
]


KEY_SAMPLES = [
    # (slug, issue)
    ("a/b", {"type": "segment-inconclusive", "inconclusiveCategory": "tokenless-near-tie"}),
    (
        "a/b",
        {
            "type": "segment-inconclusive",
            "inconclusiveCategory": "tokenless-near-tie",
            "inconclusiveMeta": {"leftSectionPath": "L", "rightSectionPath": "R"},
        },
    ),
    (
        "a/b",
        {
            "type": "segment-inconclusive",
            "inconclusiveCategory": "tokenless-near-tie",
            "inconclusiveMeta": {"leftSectionPath": "L"},  # right なし
        },
    ),
    (None, {}),
]


SCOPE_SAMPLES: list = [
    {},
    {"slug": "a", "section": "b"},
    {"section": "sec"},
    {"totalFiles": 10, "checkedFiles": 5},
    {"checkedFiles": -1, "totalFiles": "nope"},
]


QUEUE_SAMPLES: list = [
    [],
    [
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
                    "inconclusiveMeta": {
                        "leftSectionPath": "L",
                        "rightSectionPath": "R",
                        "currentScore": 0.5,
                        "swapScore": 0.6,
                    },
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
    ],
]


SUMMARIZE_SAMPLES: list = [
    # (queue, scope)
    ([], None),
    (
        [
            {
                "issues": [
                    {"inconclusiveCategory": "tokenless-near-tie"},
                    {"inconclusiveCategory": "tokenless-near-tie"},
                    {"inconclusiveCategory": "other"},
                ]
            }
        ],
        {"isComplete": True, "type": "full"},
    ),
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.extend(
        {"function": "advisory_is_candidate", "args": [sample]} for sample in CANDIDATE_SAMPLES
    )
    calls.extend({"function": "advisory_is_valid_ack", "args": [sample]} for sample in ACK_SAMPLES)
    calls.extend(
        {"function": "advisory_is_blocking", "args": [sample]} for sample in BLOCKING_SAMPLES
    )
    calls.extend(
        {"function": "advisory_build_issue_key", "args": [slug, issue]}
        for slug, issue in KEY_SAMPLES
    )
    calls.extend({"function": "advisory_build_scope", "args": [opts]} for opts in SCOPE_SAMPLES)
    calls.extend(
        {"function": "advisory_build_queue", "args": [results]} for results in QUEUE_SAMPLES
    )
    calls.extend(
        {"function": "advisory_summarize", "args": list(args)} for args in SUMMARIZE_SAMPLES
    )
    results = run_batch(repo_root, calls, timeout=60.0)
    a = len(CANDIDATE_SAMPLES)
    b = a + len(ACK_SAMPLES)
    c = b + len(BLOCKING_SAMPLES)
    d = c + len(KEY_SAMPLES)
    e = d + len(SCOPE_SAMPLES)
    f = e + len(QUEUE_SAMPLES)
    g = f + len(SUMMARIZE_SAMPLES)
    return {
        "candidate": results[0:a],
        "ack": results[a:b],
        "blocking": results[b:c],
        "key": results[c:d],
        "scope": results[d:e],
        "queue": results[e:f],
        "summarize": results[f:g],
    }


def test_is_candidate_matches_mjs(mjs_results):
    for sample, mjs in zip(CANDIDATE_SAMPLES, mjs_results["candidate"], strict=True):
        assert is_advisory_review_candidate(sample) == mjs


def test_is_valid_ack_matches_mjs(mjs_results):
    for sample, mjs in zip(ACK_SAMPLES, mjs_results["ack"], strict=True):
        assert is_valid_advisory_acknowledgement(sample) == mjs


def test_is_blocking_matches_mjs(mjs_results):
    for sample, mjs in zip(BLOCKING_SAMPLES, mjs_results["blocking"], strict=True):
        assert is_blocking_advisory_review_issue(sample) == mjs


def test_key_matches_mjs(mjs_results):
    for (slug, issue), mjs in zip(KEY_SAMPLES, mjs_results["key"], strict=True):
        assert build_advisory_queue_issue_key(slug, issue) == mjs


_CAMEL_TO_SNAKE = {
    "totalFiles": "total_files",
    "checkedFiles": "checked_files",
    "slug": "slug",
    "section": "section",
}


def test_scope_matches_mjs(mjs_results):
    for opts, mjs in zip(SCOPE_SAMPLES, mjs_results["scope"], strict=True):
        kwargs = {_CAMEL_TO_SNAKE[k]: v for k, v in opts.items()}
        py = build_advisory_review_scope(**kwargs)
        assert py == mjs, f"diverge for opts={opts!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_queue_matches_mjs(mjs_results):
    for results, mjs in zip(QUEUE_SAMPLES, mjs_results["queue"], strict=True):
        assert build_advisory_review_queue(results) == mjs


def test_summarize_matches_mjs(mjs_results):
    for (queue, scope), mjs in zip(SUMMARIZE_SAMPLES, mjs_results["summarize"], strict=True):
        assert summarize_advisory_review_queue(queue, scope) == mjs
