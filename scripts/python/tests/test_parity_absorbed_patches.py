"""Artifacts the shared extractor absorbs instead of EN source patches."""

import json
from pathlib import Path

import pytest

from testim_parity.preprocess_en import _rewrite_bare_index_links, preprocess_en_html
from testim_parity.segments_en import extract_segments_from_html


@pytest.mark.parametrize("p", ["<p>​</p>", "<p>​ ​</p>", "<p>  </p>"])
def test_empty_paragraph_emits_no_segment(p):
    segments = extract_segments_from_html(
        f"<p>Before</p>{p}<p>After</p>", slug="x", callout_allow_slugs=None
    )
    assert [s["textNorm"] for s in segments] == ["before", "after"]


@pytest.mark.parametrize(
    "p, text",
    [("<p>Hi</p>", "hi"), ("<p><code>x</code></p>", "x"), ("<p>\u200bHi\u200b</p>", "hi")],
)
def test_non_empty_paragraph_still_emits(p, text):
    segments = extract_segments_from_html(
        f"<p>Before</p>{p}<p>After</p>", slug="x", callout_allow_slugs=None
    )
    assert len(segments) == 3 and text in segments[1]["textNorm"]


def test_malformed_index_slash_hash_link_is_not_rewritten():
    html = '<a href="index.htm/#/">x</a>'
    assert _rewrite_bare_index_links(html, "a/b/c") == html


def test_image_only_paragraph_is_unchanged():
    html = '<p>Before</p><p><img src="a.png"/></p>'
    kinds = [
        s["segmentKind"]
        for s in extract_segments_from_html(html, slug="x", callout_allow_slugs=None)
    ]
    assert kinds == ["paragraph"]


# --- bare index.htm links (UD-005E/F, UD-008, UD-013, UD-014) ---


_REPO = Path(__file__).resolve().parents[3]
_SNAPSHOTS = _REPO / "snapshots" / "en" / "content"
_PATCHES = Path(__file__).resolve().parents[1] / "src/testim_parity/_en_source_patches_data.json"


def test_bare_index_link_points_to_parent_folder():
    html = '<a href="index.htm">x</a>'
    assert (
        _rewrite_bare_index_links(html, "a/parameters/hidden")
        == '<a href="../parameters/index.htm">x</a>'
    )


def test_bare_index_link_keeps_fragment():
    out = _rewrite_bare_index_links('<a href="index.htm#s">x</a>', "a/b/c")
    assert 'href="../b/index.htm#s"' in out


def test_top_level_page_is_untouched():
    html = '<a href="index.htm">x</a>'
    assert _rewrite_bare_index_links(html, "top") == html


def test_non_bare_links_are_untouched():
    html = '<a href="../x/index.htm">x</a><a href="other.htm">y</a>'
    assert _rewrite_bare_index_links(html, "a/b/c") == html


def test_no_slug_skips_rewrite():
    html = '<a href="index.htm">x</a>'
    assert preprocess_en_html(html) == html


@pytest.mark.parametrize(
    "patch_prefix, slug",
    [
        (
            "UD-012",
            "advanced-editing/data-driven-testing/configuring-a-data-driven-test-from-the-visual-editor",
        ),
    ],
)
def test_patches_still_apply_before_link_rewrite(patch_prefix, slug):
    patch = next(
        p
        for p in json.loads(_PATCHES.read_text(encoding="utf-8"))["patches"]
        if p["id"].startswith(patch_prefix)
    )
    raw = (_SNAPSHOTS / f"{slug}.html").read_bytes().decode("utf-8")
    assert patch["replace"] in preprocess_en_html(raw, slug=slug)


@pytest.mark.real_repo
@pytest.mark.parametrize(
    "child",
    [
        "browserstack-integration",
        "lambdatest-integration",
        "custom-grid",
        "headspin-integration",
        "saucelabs-integration",
    ],
)
def test_grid_management_children_link_to_parent_category(child):
    slug = f"integrations/grid-management/{child}"
    raw = (_SNAPSHOTS / f"{slug}.html").read_bytes().decode("utf-8")
    assert 'href="../grid-management/index.htm#adding-a-grid"' in preprocess_en_html(raw, slug=slug)


@pytest.mark.real_repo
def test_no_category_index_snapshot_has_bare_index_link():
    # Conservative substring guard: also flags `index.htm` hrefs with a fragment or suffix.
    slugs = {
        p.relative_to(_SNAPSHOTS).with_suffix("").as_posix() for p in _SNAPSHOTS.rglob("*.html")
    }
    dirs = {p.relative_to(_SNAPSHOTS).as_posix() for p in _SNAPSHOTS.rglob("*") if p.is_dir()}
    offenders = [
        s
        for s in slugs & dirs
        if 'href="index.htm' in (_SNAPSHOTS / f"{s}.html").read_text(encoding="utf-8")
    ]
    assert offenders == []


def test_in_page_mobile_actions_link_is_not_rewritten():
    slug = "recording-tests/recording-a-mobile-test/recording-a-local-mobile-test"
    raw = (_SNAPSHOTS / f"{slug}.html").read_bytes().decode("utf-8")
    out = preprocess_en_html(raw, slug=slug)
    assert 'href="#supported-mobile-actions"' in out
    assert "index.htm#supported-mobile-actions" not in out


# --- mutations the HTML path must still catch without UD-016..UD-020 ---

_DOCS = _REPO / "src" / "content" / "docs"
_SL = "integrations/sealights-integration"
_SF = "salesforce-testing/create-a-salesforce-test"
_TS = "salesforce-testing/troubleshoot"
_PG = "advanced-editing/parameters/parameters-for-groups"
_VSTS = "integrations/integrate-testim-to-your-ci/vsts-and-tfs-integration"
_VD = "advanced-editing/validations/validate-download"
_SL_FLAG = "--sealights-build-session-id [sealights-suid-session-id]"
_SL_BULLET = f"- ```shell\n  {_SL_FLAG}\n  ```\n"


def _sub(old, new):
    def apply(text):
        assert text.count(old) == 1, old
        return text.replace(old, new)

    return apply


def _insert_after_li(anchor, li):
    def apply(text):
        start = text.index(anchor)
        end = text.index("</li>", start) + len("</li>")
        return text[:end] + li + text[end:]

    return apply


def _page_issues(slug, ja_change=None, en_change=None):
    from testim_parity.align import align_segments, parity_diffs_to_issues
    from testim_parity.html_structure import compare_html_structure
    from testim_parity.ja_render import render_ja_markdown
    from testim_parity.project import split_frontmatter
    from testim_parity.segments_en import CALLOUT_NORMALIZATION_SLUGS
    from testim_parity.segments_ja import extract_segments_from_markdown

    raw = (_SNAPSHOTS / f"{slug}.html").read_bytes().decode("utf-8")
    en = preprocess_en_html(en_change(raw) if en_change else raw, slug=slug)
    ja = split_frontmatter((_DOCS / f"{slug}.md").read_text(encoding="utf-8"))["body"]
    ja = ja_change(ja) if ja_change else ja
    en_segments = extract_segments_from_html(
        en, slug=slug, callout_allow_slugs=CALLOUT_NORMALIZATION_SLUGS
    )
    alignment = align_segments(en_segments, extract_segments_from_markdown(ja), slug=slug)
    issues = parity_diffs_to_issues(alignment["diffs"])
    issues += compare_html_structure(en, render_ja_markdown(ja), slug=slug)
    return sorted((i["type"], i.get("detail", "")) for i in issues)


@pytest.mark.real_repo
@pytest.mark.parametrize(
    "slug, ja_change, en_change",
    [
        pytest.param(
            "advanced-editing/api-testing",
            _sub("実行されません。\\\n設定手順:", "実行されません。\n\n設定手順:"),
            None,
            id="api-testing-split-assertion-paragraph",
        ),
        pytest.param(_SL, _sub(_SL_BULLET, ""), None, id="sealights-delete-code-bullet"),
        pytest.param(
            _SL,
            _sub(_SL_BULLET, _SL_BULLET.replace("session-id [", "sesion-id [")),
            None,
            id="sealights-misspell-flag",
        ),
        pytest.param(
            _SL, _sub(_SL_BULLET, f"```shell\n{_SL_FLAG}\n```\n"), None, id="sealights-plain-code"
        ),
        pytest.param(_SL, _sub(_SL_BULLET, f"- `{_SL_FLAG}`\n"), None, id="sealights-inline-code"),
        pytest.param(
            _SF,
            _sub(
                "6. Salesforce アプリケーションとやり取りしてステップを生成します。"
                "Salesforce ステップはクラウドアイコンで示されます。\n",
                "",
            ),
            None,
            id="salesforce-delete-step-6",
        ),
        pytest.param(
            _SF,
            _sub("7. テストの作成が完了したら、**Save**をクリックします。\n", ""),
            None,
            id="salesforce-delete-step-7",
        ),
        pytest.param(
            _SF,
            _sub("\n5. ![ログイン完了後", "\n![ログイン完了後"),
            None,
            id="salesforce-image-step-out-of-list",
        ),
        pytest.param(
            _TS,
            lambda t: "\n".join(
                line for line in t.split("\n") if not line.startswith("- IP アドレスがブロック")
            ),
            None,
            id="troubleshoot-delete-text-bullet",
        ),
        pytest.param(
            _TS,
            _sub("\n- ![ログイン履歴", "\n\n![ログイン履歴"),
            None,
            id="troubleshoot-image-bullet-out-of-list",
        ),
        pytest.param(
            _SF,
            None,
            _insert_after_li("When done creating the test", '<li value="8"><p>Run it.</p></li>'),
            id="en-salesforce-add-step",
        ),
        pytest.param(
            _TS,
            None,
            _insert_after_li("Login Hours (Profile level)", "<li><p>Check the proxy.</p></li>"),
            id="en-troubleshoot-add-bullet",
        ),
        pytest.param(
            _SL,
            None,
            _insert_after_li(
                "<code>--sealights-lab-id [sealights-lab-id]</code>",
                '<li><div class="codeSnippet"><div class="codeSnippetBody">'
                "<pre><code>--sealights-extra [x]</code></pre></div></div></li>",
            ),
            id="en-sealights-add-code-bullet",
        ),
        pytest.param(
            _PG,
            _sub(
                "パラメーター名の下の欄に値を入力します。",
                "5. パラメーター名の下の欄に値を入力します。",
            ),
            None,
            id="groups-paragraph-into-list-item",
        ),
        pytest.param(
            _VSTS,
            _sub("\n新しいビルドを作成します\n", "\n2. 新しいビルドを作成します\n"),
            None,
            id="vsts-paragraph-into-numbered-item",
        ),
        pytest.param(
            _VD,
            _sub("`| expectedText | JavaScript | 'A Simple PDF File' |`\n", ""),
            None,
            id="validate-download-delete-pipe-paragraph",
        ),
    ],
)
def test_absorbed_patch_mutation_is_detected(slug, ja_change, en_change):
    clean = _page_issues(slug)
    mutated = _page_issues(slug, ja_change, en_change)
    assert clean == []
    assert [i for i in mutated if i not in clean]


@pytest.mark.real_repo
@pytest.mark.parametrize(
    "slug",
    [
        "integrations/test-management-integrations/testrail-integration",  # UD-026 + URL token
        "advanced-editing/data-driven-testing/configuring-data-driven-tests-using-the-config-file",
        "results/test-results/network-logs",  # bare text paragraph
        "overview/changelog",  # MCDropDownHead paragraphs
        _PG,  # UD-010B: orphan "5. " paragraph between list items
        _VSTS,  # UD-010C/D: orphan "2. " / "3. " paragraphs
        _VD,  # UD-021: stray "|...|" paragraph after a table
    ],
)
def test_ruling_pages_have_no_issues(slug):
    assert _page_issues(slug) == []
