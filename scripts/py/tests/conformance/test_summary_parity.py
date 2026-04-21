"""``summary.py`` の mjs byte 一致 conformance (Phase 3 M5)。

``summarize_parity_results`` の全 counter が mjs と一致することを検証する。
5-counter = 0 DoD に直結するため、issue type / severity / ack / baseline の
各組み合わせで shape と値を厳密に pin する。
"""

from __future__ import annotations

import pytest

from testim_parity.summary import summarize_parity_results

from ._harness import run_batch


def _issue(**kwargs):
    base = {"type": "segment-missing", "severity": "actionable"}
    base.update(kwargs)
    return base


# sample は各 flag (coarse / structure / source-unusable / ack / baseline) を
# 組み合わせた代表 pattern を 1 件ずつ用意する。mjs との差異はここで検出する。
SAMPLES: list = [
    # 空入力
    [[], {}],
    # issue 0 件の file
    [[{"issues": []}], {}],
    # reportable actionable + active counter
    [
        [
            {
                "issues": [
                    _issue(type="segment-missing", severity="actionable"),
                ]
            }
        ],
        {},
    ],
    # ack 済み (active から除外)
    [
        [
            {
                "issues": [
                    _issue(severity="actionable", acknowledged=True),
                ]
            }
        ],
        {},
    ],
    # ack 期限切れ → active に戻す
    [
        [
            {
                "issues": [
                    _issue(
                        severity="actionable",
                        acknowledged=True,
                        ackExpired=True,
                    ),
                ]
            }
        ],
        {},
    ],
    # baseline (frozen) → reportable から除外
    [
        [
            {
                "issues": [
                    _issue(severity="actionable", baselined=True),
                ]
            }
        ],
        {},
    ],
    # coarse audit signal — reportable には入らない
    [
        [
            {
                "issues": [
                    _issue(type="table-count-mismatch", severity="signal"),
                ]
            }
        ],
        {},
    ],
    # structure mismatch — 専用 counter のみ
    [
        [
            {
                "issues": [
                    _issue(type="section-structure-mismatch", severity="actionable"),
                ]
            }
        ],
        {},
    ],
    # source-unusable — 専用 counter のみ、gate には載らない
    [
        [
            {
                "issues": [
                    _issue(type="source-unusable-html", severity="advisory"),
                ]
            }
        ],
        {},
    ],
    # error severity
    [
        [
            {
                "issues": [
                    _issue(severity="error"),
                ]
            }
        ],
        {},
    ],
    # signal severity (非 coarse) — gate には載る
    [
        [
            {
                "issues": [
                    _issue(severity="signal"),
                ]
            }
        ],
        {},
    ],
    # 複数 file / 複数 issue の mix
    [
        [
            {
                "issues": [
                    _issue(type="segment-missing", severity="actionable"),
                    _issue(type="segment-extra", severity="actionable", baselined=True),
                ]
            },
            {
                "issues": [
                    _issue(type="table-count-mismatch", severity="signal"),
                    _issue(type="section-structure-mismatch", severity="actionable"),
                ]
            },
        ],
        {"orphanBaselineEntries": 2, "orphanBaselineByType": {"segment-missing": 2}},
    ],
    # orphan meta 未指定 (empty dict で default)
    [[{"issues": []}], None],
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> list:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "summary_summarize", "args": args} for args in SAMPLES]
    return run_batch(repo_root, calls, timeout=60.0)


def test_summary_matches_mjs(mjs_results):
    for args, mjs in zip(SAMPLES, mjs_results, strict=True):
        results, orphan_meta = args
        py = summarize_parity_results(results, orphan_meta)
        assert py == mjs, f"diverge for args={args!r}:\n  py={py!r}\n  mjs={mjs!r}"


def test_summary_key_order_preserved():
    """return 辞書の key 順序が mjs object literal と一致する (byte parity 前提)。"""
    py = summarize_parity_results([], {})
    expected_order = [
        "filesWithIssues",
        "actionableFiles",
        "signalFiles",
        "errorFiles",
        "activeActionableFiles",
        "activeErrorFiles",
        "activeFiles",
        "totalIssues",
        "acknowledgedIssues",
        "expiredAcknowledgements",
        "issuesByType",
        "issuesBySeverity",
        "baselinedIssues",
        "baselinedFiles",
        "baselinedByType",
        "reportableActiveFiles",
        "reportableActiveActionableFiles",
        "auditSignalIssues",
        "auditSignalFiles",
        "auditSignalsByType",
        "structureMismatchIssues",
        "structureMismatchFiles",
        "structureMismatchByType",
        "snapshotUnusableIssues",
        "snapshotUnusableFiles",
        "snapshotUnusableByType",
        "orphanBaselineEntries",
        "orphanBaselineByType",
    ]
    assert list(py.keys()) == expected_order
