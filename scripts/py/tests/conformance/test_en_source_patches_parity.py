"""en_source_patches のクロスランタイム conformance テスト。

registry サイズ・patch ID 一覧・defect class 一覧・count_occurrences・
apply_en_source_patches の出力が全て mjs と byte 一致することを保証する。
さらに dual source of truth (mjs literal registry と Python の JSON 生成) の
**drift 検出** のため、全 patch の全フィールドを byte-level で比較する。
"""

from __future__ import annotations

import pytest

from testim_parity.en_source_patches import (
    DEFECT_CLASSES,
    EN_SOURCE_PATCHES,
    apply_en_source_patches,
    count_occurrences,
)

from ._harness import run_batch

COUNT_SAMPLES = [
    ("aaa", "a"),
    ("abcabc", "abc"),
    ("", "x"),
    ("no match", "xyz"),
]


@pytest.fixture(scope="module")
def mjs_registry_size(repo_root, node_available) -> int:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "patch_registry_size", "args": []}]
    return run_batch(repo_root, calls)[0]


@pytest.fixture(scope="module")
def mjs_patch_ids(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "patch_registry_ids", "args": []}]
    return run_batch(repo_root, calls)[0]


@pytest.fixture(scope="module")
def mjs_defect_classes(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "patch_defect_classes", "args": []}]
    return run_batch(repo_root, calls)[0]


@pytest.fixture(scope="module")
def mjs_registry_dump(repo_root, node_available) -> list[dict]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "patch_registry_dump", "args": []}]
    return run_batch(repo_root, calls)[0]


def test_registry_size_matches(mjs_registry_size):
    assert len(EN_SOURCE_PATCHES) == mjs_registry_size


def test_patch_ids_match(mjs_patch_ids):
    py_ids = [p["id"] for p in EN_SOURCE_PATCHES]
    assert py_ids == mjs_patch_ids


def test_defect_classes_match(mjs_defect_classes):
    assert list(DEFECT_CLASSES) == mjs_defect_classes


def test_count_occurrences_parity(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    calls = [
        {"function": "patch_count_occurrences", "args": [hay, needle]}
        for hay, needle in COUNT_SAMPLES
    ]
    mjs = run_batch(repo_root, calls)
    for (hay, needle), m in zip(COUNT_SAMPLES, mjs, strict=True):
        assert count_occurrences(hay, needle) == m


def test_apply_patch_no_op_when_slug_absent(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    html = "<p>hello</p>"
    calls = [{"function": "patch_apply", "args": [html, "unrelated/slug"]}]
    (mjs,) = run_batch(repo_root, calls)
    assert apply_en_source_patches(html, "unrelated/slug") == mjs == html


def test_apply_patch_hits_known_typo(repo_root, node_available):
    if not node_available:
        pytest.skip("node not available")
    slug = "salesforce-testing/salesforce-steps/sfdc-step-create"
    html = "<p>Verify -this action verifies the field</p>"
    calls = [{"function": "patch_apply", "args": [html, slug]}]
    (mjs,) = run_batch(repo_root, calls)
    assert apply_en_source_patches(html, slug) == mjs
    assert "Verify - this action verifies" in mjs


# ---------------------------------------------------------------------------
# Dual-source-of-truth drift guard
# ---------------------------------------------------------------------------


def test_registry_full_dump_matches_mjs(mjs_registry_dump):
    """mjs の patch literal と Python の生成 JSON の **全フィールド** を byte 比較。

    このテストが失敗したら ``npm run regen:py-patches`` で JSON を再生成する。
    CI で blocking なので dual-source-of-truth が silent drift しない。
    """
    py_dump = [
        {
            "id": p["id"],
            "slugs": list(p["slugs"]),
            "defectClass": p["defectClass"],
            "find": p["find"],
            "replace": p["replace"],
            "rationale": p["rationale"],
            "linkedDefect": p["linkedDefect"],
            "addedAt": p["addedAt"],
            "reviewAfter": p["reviewAfter"],
        }
        for p in EN_SOURCE_PATCHES
    ]
    assert py_dump == mjs_registry_dump, (
        "patch registry drift detected — run `npm run regen:py-patches` "
        "to re-sync scripts/py/src/testim_parity/_en_source_patches_data.json"
    )


# ---------------------------------------------------------------------------
# Replay harness — 全 34 patch の find → replace 往復を両 runtime で検証
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("patch_idx", range(len(EN_SOURCE_PATCHES)))
def test_every_patch_replays_identically(patch_idx, repo_root, node_available):
    """各 patch の ``find`` をそのまま入力 HTML として渡し、Python と mjs が同じ
    ``replace`` 済み出力を返すことを確認する (全 patch 1 件ずつ)。

    これが全件 green なら ``find``/``replace``/``slugs`` の 3 フィールドが drift
    していないと保証される。``rationale`` 等 metadata-only フィールドは
    test_registry_full_dump_matches_mjs が別途カバー。
    """
    if not node_available:
        pytest.skip("node not available")
    patch = EN_SOURCE_PATCHES[patch_idx]
    slug = patch["slugs"][0]
    html = patch["find"]
    calls = [{"function": "patch_apply_find_string", "args": [patch["id"]]}]
    (mjs,) = run_batch(repo_root, calls)
    py = apply_en_source_patches(html, slug)
    assert py == mjs, f"patch {patch['id']} diverges: py={py!r} mjs={mjs!r}"
    # 正しく replace が反映されているべき。replace が空文字列の場合は、patch が
    # 「find を完全削除する」契約 (例: UD-015 の ZWSP paragraph 削除) なので
    # py != html で検証する。replace が非空なら必ず出力に現れるはず。
    if patch["replace"]:
        assert patch["replace"] in py, (
            f"patch {patch['id']} applied but replace not in output: py={py!r}"
        )
    else:
        assert py != html, f"patch {patch['id']} claimed empty replace but no-op: py={py!r}"
