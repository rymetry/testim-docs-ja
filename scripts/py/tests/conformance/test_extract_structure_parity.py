"""extract.py の新規 13 関数 + classify_line の mjs byte 一致 conformance。

Phase 3 M3 で追加した markdown 構造抽出関数を mjs と batch 比較する。
invariant-token 部分は既存 ``test_extract_parity.py`` がカバー。
"""

from __future__ import annotations

import pytest

from testim_parity.extract import (
    classify_line,
    detect_en_artifacts,
    extract_bullet_counts,
    extract_callout_positions,
    extract_heading_sequence,
    extract_html_tables,
    extract_image_sequence,
    extract_markdown_tables,
    extract_paragraph_counts,
    extract_step_counts,
    extract_table_structure,
    is_untranslated_cell,
    normalize_en_artifacts,
    normalize_numeric_period_spacing,
    strip_markdown,
    strip_title_h1,
)

from ._harness import run_batch

BODY_SAMPLES: list[str] = [
    "",
    "## Intro\n\npara\n",
    "```\ncode\n```\n\n## A\n\n1. one\n2. two\n",
    "## X\n\n- a\n- b\n- c\n",
    ":::note\nNested callout\n:::\n",
    "  :::warning\n  Indented\n  :::\n",
    '![alt](/img/foo.png)\n<img src="/img/bar.jpg" />\n',
    "## H2\n\n### H3\n\n#### H4\n\n##### H5\n",
    "1.foo becomes 1. foo\n1.0 version stays\n1.1. sub stays\n",
    "line\n\u200b\nfinal\n",
    "| a | b |\n| - | - |\n| 1 | 2 |\n\n<table><tr><td>x</td></tr></table>\n",
    "<details>hi</details>\n",
]


TABLE_CELL_SAMPLES = [
    "short",
    "Hover over the main menu item to see options",
    "日本語テキスト here",
    "https://docs.tricentis.com/foo/bar",
    "This is an untranslated English sentence.",
    "1.0.0",
    "Alt+Shift+F",
]


STRIP_SAMPLES = [
    "",
    "**bold** plain",
    "*italic* `code` [link](url)",
    "_italic_ with no prefix",
    "~~strike~~ done",
    "![alt](url) and [link](url) combined",
]


CLASSIFY_SAMPLES: list[tuple[str, dict]] = [
    ("## Heading", {}),
    ("```js", {}),
    ("var x = 1", {"inCodeBlock": True}),
    (":::note", {}),
    (":::", {"inCallout": True}),
    ("body line", {"inCallout": True}),
    ("- bullet", {}),
    ("1. step", {}),
    ("![alt](x.png)3. text", {}),
    ("| a | b |", {}),
    ("<details>", {}),
    ("<!-- comment -->", {}),
    ("", {}),
    ("plain paragraph", {}),
    ("paragraph continuation", {"inParagraph": True}),
]


@pytest.fixture(scope="module")
def mjs_results(repo_root, node_available) -> dict:
    if not node_available:
        pytest.skip("node not available")
    calls: list = []
    calls.extend({"function": "extract_image_sequence", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_callout_positions", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_step_counts", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_bullet_counts", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_paragraph_counts", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_heading_sequence", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_strip_markdown", "args": [s]} for s in STRIP_SAMPLES)
    calls.extend(
        {"function": "extract_is_untranslated_cell", "args": [s]} for s in TABLE_CELL_SAMPLES
    )
    calls.extend({"function": "extract_strip_title_h1", "args": [b]} for b in BODY_SAMPLES)
    calls.extend(
        {"function": "extract_normalize_numeric_period", "args": [b]} for b in BODY_SAMPLES
    )
    calls.extend({"function": "extract_normalize_en_artifacts", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_markdown_tables", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_html_tables", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_table_structure", "args": [b]} for b in BODY_SAMPLES)
    calls.extend({"function": "extract_detect_en_artifacts", "args": [b]} for b in BODY_SAMPLES)
    calls.extend(
        {"function": "extract_classify_line", "args": [line, state]}
        for line, state in CLASSIFY_SAMPLES
    )
    results = run_batch(repo_root, calls, timeout=120.0)

    n = len(BODY_SAMPLES)
    c = len(TABLE_CELL_SAMPLES)
    s = len(STRIP_SAMPLES)
    cl = len(CLASSIFY_SAMPLES)
    offsets: dict[str, list] = {}
    cursor = 0
    for key, count in [
        ("image_sequence", n),
        ("callout_positions", n),
        ("step_counts", n),
        ("bullet_counts", n),
        ("paragraph_counts", n),
        ("heading_sequence", n),
        ("strip_markdown", s),
        ("is_untranslated", c),
        ("strip_title_h1", n),
        ("normalize_numeric", n),
        ("normalize_en_artifacts", n),
        ("markdown_tables", n),
        ("html_tables", n),
        ("table_structure", n),
        ("detect_artifacts", n),
        ("classify_line", cl),
    ]:
        offsets[key] = results[cursor : cursor + count]
        cursor += count
    return offsets


def test_image_sequence_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["image_sequence"], strict=True):
        assert extract_image_sequence(sample) == mjs


def test_callout_positions_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["callout_positions"], strict=True):
        assert extract_callout_positions(sample) == mjs


def test_step_counts_matches(mjs_results):
    """mjs ``Map.entries()`` は ``[[k, v], ...]`` で返るので py dict を対応形に揃える。"""
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["step_counts"], strict=True):
        py_pairs = [[k, v] for k, v in extract_step_counts(sample).items()]
        assert py_pairs == mjs


def test_bullet_counts_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["bullet_counts"], strict=True):
        py_pairs = [[k, v] for k, v in extract_bullet_counts(sample).items()]
        assert py_pairs == mjs


def test_paragraph_counts_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["paragraph_counts"], strict=True):
        py_pairs = [[k, v] for k, v in extract_paragraph_counts(sample).items()]
        assert py_pairs == mjs


def test_heading_sequence_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["heading_sequence"], strict=True):
        assert extract_heading_sequence(sample) == mjs


def test_strip_markdown_matches(mjs_results):
    for sample, mjs in zip(STRIP_SAMPLES, mjs_results["strip_markdown"], strict=True):
        assert strip_markdown(sample) == mjs


def test_is_untranslated_matches(mjs_results):
    for sample, mjs in zip(TABLE_CELL_SAMPLES, mjs_results["is_untranslated"], strict=True):
        assert is_untranslated_cell(sample) == mjs


def test_strip_title_h1_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["strip_title_h1"], strict=True):
        assert strip_title_h1(sample) == mjs


def test_normalize_numeric_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["normalize_numeric"], strict=True):
        assert normalize_numeric_period_spacing(sample) == mjs


def test_normalize_en_artifacts_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["normalize_en_artifacts"], strict=True):
        assert normalize_en_artifacts(sample) == mjs


def test_markdown_tables_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["markdown_tables"], strict=True):
        assert extract_markdown_tables(sample) == mjs


def test_html_tables_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["html_tables"], strict=True):
        assert extract_html_tables(sample) == mjs


def test_table_structure_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["table_structure"], strict=True):
        assert extract_table_structure(sample) == mjs


def test_detect_en_artifacts_matches(mjs_results):
    for sample, mjs in zip(BODY_SAMPLES, mjs_results["detect_artifacts"], strict=True):
        assert detect_en_artifacts(sample) == mjs


def test_classify_line_matches(mjs_results):
    for (line, state), mjs in zip(CLASSIFY_SAMPLES, mjs_results["classify_line"], strict=True):
        result = classify_line(line, state)
        py = {
            "kind": result["kind"],
            "heading": result.get("heading"),
            "nextState": result["nextState"],
        }
        assert py == mjs, f"line={line!r} state={state!r}:\n  py={py!r}\n  mjs={mjs!r}"
