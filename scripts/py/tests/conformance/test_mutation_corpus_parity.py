"""mutation_corpus.py の mjs byte 一致 conformance (Phase 3 M6)。

10 mutation type すべてで以下を検証する:

- ``classify_lines``: frontmatter / code fence / callout / heading / table /
  image / bullet / step / paragraph / details の分類が mjs と完全一致
- ``list_item_block_end`` / ``paragraph_block_range``: extent 計算が一致
- 各 mutation (delete_* / move_segment / insert_en_residual /
  drop_invariant_token / swap_section_bodies) が同じ mutated 本文 + metadata を返す
- ``generate_all_mutations`` / ``generate_corpus``: 複合 output の挿入順と内容

日本語 description 文言も byte 一致を確認する (レポート出力で使われるため)。
"""

from __future__ import annotations

import pytest

from testim_parity.mutation_corpus import (
    MUTATION_TYPES,
    classify_lines,
    generate_all_mutations,
    generate_corpus,
    list_item_block_end,
    paragraph_block_range,
)

from ._harness import run_batch

# 代表 corpus — 10 mutation type 全てを少なくとも 1 件発火させる構造。
SAMPLE_MD = """\
---
title: "Sample Page"
updated: "2026-04-21"
---

# Sample Title

これは日本語の段落 1 です。複数行にまたがる段落も含みます。
続きの段落行。

もう一つの段落 2 です。

## セクション A

段落 A-1 です。

段落 A-2 です。

- 箇条書きアイテム 1
- 箇条書きアイテム 2
- 箇条書きアイテム 3

1. 手順 1
2. 手順 2
3. 手順 3

:::note

callout 内の段落テキスト。
別の行も入ります。

- callout 内 bullet

:::

| Column A | Column B |
| :------- | :------- |
| val 1    | val 2    |
| val 3    | val 4    |

## セクション B

段落 B-1 です。

<table>
  <tr>
    <td>HTML cell 1</td>
    <td>HTML cell 2</td>
  </tr>
</table>

## セクション C

`--flag-name` と `API_KEY` と https://example.com/x を含む段落。

```bash
# code fence — classify_lines では code として無視される
echo --skip-this
```

## セクション D

D 段落 1。

D 段落 2。
"""


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    lines = SAMPLE_MD.split("\n")

    calls: list = []
    # 1. classify_lines
    calls.append({"function": "mutation_classify_lines", "args": [SAMPLE_MD]})
    # 2. type_keys (挿入順)
    calls.append({"function": "mutation_type_keys", "args": []})
    # 3. 各 mutation type 個別実行
    type_keys = list(MUTATION_TYPES.keys())
    for t in type_keys:
        calls.append({"function": "mutation_run", "args": [t, SAMPLE_MD, 0]})
    # 4. generate_all / generate_corpus
    calls.append({"function": "mutation_generate_all", "args": [SAMPLE_MD]})
    calls.append({"function": "mutation_generate_corpus", "args": [SAMPLE_MD, 3]})
    # 5. helper: list_item_block_end / paragraph_block_range
    # 代表 bullet の index / 代表 paragraph idx を Python 側で求めて渡す
    classified = classify_lines(SAMPLE_MD)
    bullet_line = next((c for c in classified if c["kind"] == "bullet"), None)
    paragraph_idx = next((i for i, c in enumerate(classified) if c["kind"] == "paragraph"), None)
    if bullet_line is not None:
        calls.append(
            {"function": "mutation_list_item_block_end", "args": [lines, bullet_line["index"]]}
        )
    if paragraph_idx is not None:
        calls.append(
            {"function": "mutation_paragraph_block_range", "args": [classified, paragraph_idx]}
        )

    results = run_batch(repo_root, calls, timeout=60.0)

    cursor = 0

    def take(n: int) -> list:
        nonlocal cursor
        chunk = results[cursor : cursor + n]
        cursor += n
        return chunk

    out: dict = {
        "classify": take(1)[0],
        "type_keys": take(1)[0],
        "mutations": dict(zip(type_keys, take(len(type_keys)), strict=True)),
        "generate_all": take(1)[0],
        "generate_corpus": take(1)[0],
    }
    if bullet_line is not None:
        out["list_end"] = take(1)[0]
        out["bullet_index"] = bullet_line["index"]
    if paragraph_idx is not None:
        out["paragraph_range"] = take(1)[0]
        out["paragraph_idx"] = paragraph_idx
    return out


def test_classify_lines_matches_mjs(mjs_results):
    assert classify_lines(SAMPLE_MD) == mjs_results["classify"]


def test_type_keys_order_matches_mjs(mjs_results):
    assert list(MUTATION_TYPES.keys()) == mjs_results["type_keys"]


def test_each_mutation_matches_mjs(mjs_results):
    for type_name, fn in MUTATION_TYPES.items():
        py = fn(SAMPLE_MD, 0)
        mjs = mjs_results["mutations"][type_name]
        assert py == mjs, f"diverge for {type_name}:\n  py={py!r}\n  mjs={mjs!r}"


def test_generate_all_matches_mjs(mjs_results):
    py = generate_all_mutations(SAMPLE_MD)
    assert py == mjs_results["generate_all"]
    # insertion order も一致 (Map / dict 両方とも挿入順保持)
    assert list(py.keys()) == list(mjs_results["generate_all"].keys())


def test_generate_corpus_matches_mjs(mjs_results):
    py = generate_corpus(SAMPLE_MD, 3)
    assert py == mjs_results["generate_corpus"]
    assert list(py.keys()) == list(mjs_results["generate_corpus"].keys())


def test_list_item_block_end_matches_mjs(mjs_results):
    if "list_end" not in mjs_results:
        pytest.skip("no bullet candidates in corpus")
    lines = SAMPLE_MD.split("\n")
    py = list_item_block_end(lines, mjs_results["bullet_index"])
    assert py == mjs_results["list_end"]


def test_paragraph_block_range_matches_mjs(mjs_results):
    if "paragraph_range" not in mjs_results:
        pytest.skip("no paragraph candidates in corpus")
    classified = classify_lines(SAMPLE_MD)
    py = list(paragraph_block_range(classified, mjs_results["paragraph_idx"]))
    assert py == mjs_results["paragraph_range"]


def test_at_least_9_mutation_types_fire():
    """9/9 recall の前提を Python 側でも確認 (どの mutation 種類が落ちても DoD 破綻)。"""
    results = generate_all_mutations(SAMPLE_MD)
    # 10 種あるが、sample によっては 1 件 None になる type もあり得る。
    # 最低でも 9 種は発火すること。
    assert len(results) >= 9, f"only {len(results)} mutation types fired: {list(results)}"
