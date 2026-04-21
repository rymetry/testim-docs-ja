"""``segments_en`` のクロスランタイム conformance。

mjs ``source_parity_segments_en.mjs`` と Python port が同じ EN HTML に対して
**byte-identical な segment list** を返すことを保証する。

Phase 1 verification gate の要。segments_en は parity system 全体の入口で、
ここで divergence すると下流 (alignment / structure / baseline) が連鎖的に
壊れる。conformance sample は以下の分類をカバーする:

- 単純 DOM (heading + paragraph + list)
- Issue #368 の核心: ネスト ``<li>`` を 1 segment にフラット化
- MadCap fragmented ``<ol>`` に non-``<li>`` sibling (``<p>`` / ``<img>`` / ``<div>``)
- ``<div class="note|caution|warning">`` callout
- ``<details><summary>``
- ``<table>``
- ``<code>`` / ``<a href>`` / ``<span class="FileOrFilePath">`` の inline token
- ``<div class="codeSnippet">`` drop
- HTML entity decode (named + numeric + hex)
- slug-scope ``<blockquote>`` → callout 書き換え (allow list 内のみ)
"""

from __future__ import annotations

import pytest

from testim_parity.segments_en import (
    CALLOUT_NORMALIZATION_SLUGS,
    decode_entities,
    extract_segments_from_html,
)

from ._harness import run_batch

# decode_entities 単体テスト用 sample
DECODE_SAMPLES: list[str] = [
    "plain text",
    "&amp;&lt;&gt;&quot;&apos;",
    "em dash &mdash; en dash &ndash;",
    "hex &#x2019; decimal &#8217;",
    "unknown &foobar; preserved",
    "mixed &copy; 2026 &reg; &trade;",
    "",
    # Codex F1: mjs 17-entity subset 外の named entity は **両 runtime とも**
    # ``decode_entities`` レイヤで原文保持される (mjs の ``_NAMED_ENTITIES`` に
    # 無いキーは match してもテーブル lookup で null → 原文 return、Python 側の
    # ``_NAMED_ENTITIES.get()`` も同 17 entry で同じ挙動)。lxml 経由の auto-
    # decode とは **別の経路**。こちらで正しく一致することを guard する
    "subset gaps &euro; &hearts; &delta;",
]

# Codex F2: Unicode 範囲外 numeric entity は **意図的に divergent**。mjs は
# ``String.fromCodePoint(0x110000)`` で RangeError を throw し、harness は
# ``{__error: ...}`` envelope で通す。Python は ``OverflowError`` を catch して
# 原文保持する (defensive, より lenient)。production segment 抽出経路では
# BS4 が entity を扱うため ``decode_entities`` は呼ばれず、この divergence は
# conformance harness 経由でのみ観測される (``test_segments_en.py`` の
# ``test_out_of_range_numeric_entity_preserved`` が Python 側の正しい挙動を
# 記録済み。byte-level mjs 一致は意図的に要求しない)。

# extract_segments_from_html 用 sample。slug None / 指定を混在させて両分岐
# をカバーする。mjs 側 ``options.calloutAllowSlugs`` は harness が
# CALLOUT_NORMALIZATION_SLUGS を自動で渡す (allow list 不一致時の
# no-op 挙動も確認)。
EXTRACT_SAMPLES: list[tuple[str, str | None]] = [
    # 空 / 無 HTML
    ("", None),
    ("   ", None),
    # 基本 DOM (h1 は title 扱いで emit されない)
    (
        "<html><body><h1>Title</h1><h2>Sec</h2><p>Hello</p></body></html>",
        None,
    ),
    # ネスト ``<li>`` (Issue #368 の核心)。li 内に ul があっても外側 li は
    # 1 segment としてフラット化される
    (
        "<body><ul><li>Outer <ul><li>Inner A</li><li>Inner B</li></ul></li></ul></body>",
        None,
    ),
    # MadCap fragmented <ol>: non-li sibling (433 件の対象パターン)
    (
        "<body><ol><li>first</li><p>mid para</p><li>second</li></ol></body>",
        None,
    ),
    (
        '<body><ol><li>a</li><img src="x.png"/><li>b</li></ol></body>',
        None,
    ),
    # Callout div
    (
        '<body><h2>T</h2><div class="note"><p>Body</p></div></body>',
        None,
    ),
    (
        '<body><div class="warning"><p>line 1</p><p>line 2</p></div></body>',
        None,
    ),
    # details / summary
    (
        "<body><details><summary>Q</summary><p>body</p></details></body>",
        None,
    ),
    # table
    (
        "<body><table><tbody><tr><td>cell 1</td><td>cell 2</td></tr>"
        "<tr><td>cell 3</td><td>cell 4</td></tr></tbody></table></body>",
        None,
    ),
    # Inline tokens: code, link, FileOrFilePath
    (
        "<body><p>Use <code>npm install</code> to install.</p></body>",
        None,
    ),
    (
        '<body><p>See <a href="https://example.com">docs</a> for details.</p></body>',
        None,
    ),
    (
        '<body><p>Edit <span class="FileOrFilePath">/etc/hosts</span> file.</p></body>',
        None,
    ),
    # codeSnippet drop
    (
        '<body><h2>X</h2><div class="codeSnippet"><pre>code</pre></div><p>after</p></body>',
        None,
    ),
    # Loose text + inline merging into paragraph
    (
        "<body>loose <strong>text</strong> merges</body>",
        None,
    ),
    # Entity decode
    (
        "<body><p>Copyright &copy; 2026 &amp; beyond.</p></body>",
        None,
    ),
    # slug-scope callout (allow list 内)
    (
        "<body><h2>API</h2><blockquote><p><strong>Note</strong> short body.</p>"
        "</blockquote></body>",
        "administration/api-access",
    ),
    # slug-scope callout (allow list 外 — 書き換えなし)
    (
        "<body><h2>API</h2><blockquote><p><strong>Note</strong> short body.</p>"
        "</blockquote></body>",
        "unrelated/page",
    ),
    # review H2: <table> 直下 <tr> (tbody なし) — lxml は暗黙に tbody を挿入し、
    # mjs custom tokenizer は挿入しない。両方の walker が table-cell を emit
    # できるか確認 (mjs: walkTable 直下 tr 分岐、Python: lxml auto-tbody 経由)
    (
        "<body><table><tr><td>a</td><td>b</td></tr></table></body>",
        None,
    ),
    # LOW coverage: <pre> block (code-block segment kind)
    (
        "<body><h2>X</h2><pre>var x = 1;</pre></body>",
        None,
    ),
    # LOW coverage: 数値 entity が正常 / 例外 (OverflowError) の両経路
    (
        "<body><p>pi is &#x3C0; and &#8217;curly&#8217;.</p></body>",
        None,
    ),
    # HTML コメント + script 除去
    (
        "<body><h2>X</h2><!-- comment --><script>alert(1)</script><p>after</p></body>",
        None,
    ),
    # thead 除去 (header row は non-gate、tbody のみ emit)
    (
        "<body><table><thead><tr><th>h1</th></tr></thead>"
        "<tbody><tr><td>v1</td></tr></tbody></table></body>",
        None,
    ),
]


@pytest.fixture(scope="module")
def mjs_decode_results(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    calls = [{"function": "segments_en_decode_entities", "args": [t]} for t in DECODE_SAMPLES]
    return run_batch(repo_root, calls)


@pytest.fixture(scope="module")
def mjs_allow_slugs(repo_root, node_available) -> list[str]:
    if not node_available:
        pytest.skip("node not available")
    return run_batch(
        repo_root, [{"function": "segments_en_callout_normalization_slugs", "args": []}]
    )[0]


@pytest.fixture(scope="module")
def mjs_extract_results(repo_root, node_available) -> list[list[dict]]:
    if not node_available:
        pytest.skip("node not available")
    calls = [
        {"function": "segments_en_extract", "args": [html, slug]} for html, slug in EXTRACT_SAMPLES
    ]
    return run_batch(repo_root, calls)


def test_decode_entities_matches(mjs_decode_results):
    for text, mjs in zip(DECODE_SAMPLES, mjs_decode_results, strict=True):
        py = decode_entities(text)
        assert py == mjs, f"decode divergence for {text!r}: py={py!r} mjs={mjs!r}"


def test_callout_normalization_slugs_match(mjs_allow_slugs):
    """allow list が mjs と 1:1 で同期している (drift 即検出)。"""
    assert sorted(CALLOUT_NORMALIZATION_SLUGS) == mjs_allow_slugs


def test_extract_segments_matches(mjs_extract_results):
    """全 sample で Python segment list が mjs と byte 一致する。

    harness 側 (``harness.mjs:segments_en_extract``) が
    ``CALLOUT_NORMALIZATION_SLUGS`` を明示的に options に入れるため、Python 側も
    production caller と同じ shape で allow list を explicit に渡す
    (review H4 で default が None = no normalization に変更済み)。
    """
    for (html, slug), mjs in zip(EXTRACT_SAMPLES, mjs_extract_results, strict=True):
        py = extract_segments_from_html(
            html, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
        )
        assert len(py) == len(mjs), (
            f"segment count differs for slug={slug!r}:\n"
            f"  py={len(py)} mjs={len(mjs)}\n"
            f"  py segments={py!r}\n"
            f"  mjs segments={mjs!r}"
        )
        for i, (py_seg, mjs_seg) in enumerate(zip(py, mjs, strict=True)):
            assert py_seg == mjs_seg, (
                f"segment[{i}] differs for slug={slug!r}:\n  py={py_seg!r}\n  mjs={mjs_seg!r}"
            )
