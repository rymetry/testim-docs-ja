"""``scripts/pipeline/update_sidebar_urls_from_live.mjs`` の Python port。

MadCap Flare の live TOC data を fetch し、``docs/SIDEBAR_URLS.md`` を再生成する。
TOC fetch が失敗したら sitemap.xml を fallback として利用する。

既存 SIDEBAR_URLS.md の ``✅🔍`` / ``✅`` 検証マークは preserve する
(翻訳 + 検証状態を失わないため)。
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from ..madcap_toc import fetch_toc_data, resolve_url
from ..project import PROJECT_ROOT

__all__ = [
    "build_output",
    "extract_urls",
    "fetch_sitemap",
    "main",
    "normalize_url",
    "parse_existing_status_map",
]


_SIDEBAR_URLS_PATH: Path = PROJECT_ROOT / "docs" / "SIDEBAR_URLS.md"

_JP_LABEL_BY_EN: dict[str, str] = {
    "Overview": "概要",
    "Getting Started": "はじめに",
    "Recording Tests": "テストの記録",
    "Editing Tests": "テスト編集",
    "Advanced Editing": "高度な編集",
    "Running Tests": "テスト実行",
    "Results": "結果",
    "Debugging Tests": "デバッグ",
    "Test Management": "テスト管理",
    "Mobile Apps": "モバイルアプリ",
    "Device Management": "デバイス管理",
    "Integrations": "統合",
    "Settings": "設定",
    "Administration": "管理",
    "Testops": "TestOps",
    "Salesforce Testing": "Salesforceテスト",
    "Testim Extension": "Testim拡張機能",
    "Security": "セキュリティ",
    "Guides": "ガイド",
    "Testim Labs": "Testim Labs",
}

_STATUS_RE = re.compile(
    r"^-\s+(✅🔍|✅)\s+(https://docs\.tricentis\.com/testim/content/[^\s#]+)\s*$"
)
_HREF_RE = re.compile(r"""<a\b[^>]*\bhref="([^"]+)\"""", re.IGNORECASE)
_SITEMAP_LOC_RE = re.compile(r"<loc>(https://docs\.tricentis\.com/testim/content/[^<]+)</loc>")
_FOOTER_RE = re.compile(r"\n---\n\n## URL抽出方法[\s\S]*$")


def _today_ja() -> str:
    # mjs 等価: ``new Date().getFullYear()/getMonth()/getDate()`` は local time
    # なので naive ``datetime.now()`` を使い、runner の timezone に追従させる。
    # UTC 固定にすると JST 日付と ±1 day ずれる日が発生するため意図的な挙動。
    now = datetime.now()  # noqa: DTZ005
    return f"{now.year}年{now.month}月{now.day}日"


def normalize_url(href: str | None) -> str | None:
    """Testim docs URL 以外は捨てる (mjs 等価)。"""
    if not href:
        return None
    if href.startswith("https://docs.tricentis.com/testim/"):
        return href
    return None


def parse_existing_status_map(text: str) -> dict[str, str]:
    """既存 SIDEBAR_URLS.md から URL→status マークを抽出 (mjs 等価)。"""
    status_by_url: dict[str, str] = {}
    for line in re.split(r"\r?\n", text):
        match = _STATUS_RE.match(line)
        if match:
            status_by_url[match.group(2)] = match.group(1)
    return status_by_url


def extract_urls(section_html: str) -> list[str]:
    """HTML から重複除去済みの URL list を返す (mjs 等価)。"""
    seen: set[str] = set()
    urls: list[str] = []
    for match in _HREF_RE.finditer(section_html):
        url = normalize_url(match.group(1))
        if not url or url in seen:
            continue
        seen.add(url)
        urls.append(url)
    return urls


def build_output(
    *,
    sections: list[dict[str, Any]],
    status_by_url: dict[str, str],
    existing_header: str,
) -> str:
    """mjs ``buildOutput`` 等価。SIDEBAR_URLS.md の全文を生成する。"""
    all_urls: list[str] = []
    seen_global: set[str] = set()
    for section in sections:
        for url in section.get("urls", []):
            if url in seen_global:
                continue
            seen_global.add(url)
            all_urls.append(url)

    verified = 0
    translated_only = 0
    for url in all_urls:
        st = status_by_url.get(url, "✅🔍")
        if st == "✅🔍":
            verified += 1
        elif st == "✅":
            translated_only += 1

    header_lines = [
        "# Testim Documentation - 全サイドバーURL一覧",
        "",
        f"取得日: {_today_ja()}",
        f"総数: {len(all_urls)} URL",
        "",
        "## 翻訳ステータス",
        "",
        f"- ✅ 翻訳済み: {len(all_urls)}個",
        "- ⏳ 未翻訳: 0個",
        "",
        "## 検証ステータス",
        "",
        f"- ✅🔍 検証済み(frontmatter・keywords・リンク・lint): {verified}個",
        f"- ✅   翻訳のみ完了: {translated_only}個",
        "",
        "### アイコンの意味",
        "- ✅🔍 翻訳完了 + 検証済み(frontmatter、keywords最適化、内部リンク化、lint確認)",
        "- ✅   翻訳完了",
        "",
        "---",
        "",
    ]

    body: list[str] = []
    seen_body: set[str] = set()
    for section in sections:
        title = section.get("title", "")
        jp = _JP_LABEL_BY_EN.get(title, title)
        body.append(f"## {title}({jp})")
        body.append("")
        for url in section.get("urls", []):
            if url in seen_body:
                continue
            seen_body.add(url)
            st = status_by_url.get(url, "✅🔍")
            body.append(f"- {st} {url}")
        body.append("")

    footer: list[str] = []
    footer_match = _FOOTER_RE.search(existing_header)
    if footer_match:
        footer.append(footer_match.group(0).rstrip())

    combined = header_lines + body + ([""] + footer if footer else [])
    return "\n".join(combined) + "\n"


def fetch_sitemap(fetch_fn: Any = None) -> list[str]:
    """Fallback URL source: ``sitemap.xml`` から ``<loc>`` を拾う (mjs 等価)。"""
    sitemap_url = "https://docs.tricentis.com/testim/sitemap.xml"
    try:
        if fetch_fn is not None:
            xml = fetch_fn(sitemap_url)
        else:
            import httpx

            response = httpx.get(sitemap_url, timeout=30.0)
            if response.status_code != 200:
                print(
                    f"fetchSitemap: HTTP {response.status_code} from {sitemap_url}",
                    file=sys.stderr,
                )
                return []
            xml = response.text
    except Exception as e:
        print(f"fetchSitemap: failed ({e}).", file=sys.stderr)
        return []
    return _SITEMAP_LOC_RE.findall(xml)


def _toc_sections_to_output_sections(toc_sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """TOC ``{title, pages[{url,...}]}`` → ``{title, urls[...]}`` に畳む (mjs 等価)。"""
    return [
        {
            "title": section.get("title", ""),
            "urls": [resolve_url(page.get("url", "")) for page in section.get("pages", [])],
        }
        for section in toc_sections
    ]


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント (exit 0 or 1)。"""
    parser = argparse.ArgumentParser(description="Update SIDEBAR_URLS.md from live TOC")
    _ = parser.parse_args(argv)

    existing = _SIDEBAR_URLS_PATH.read_text(encoding="utf-8") if _SIDEBAR_URLS_PATH.exists() else ""
    status_by_url = parse_existing_status_map(existing)

    sections: list[dict[str, Any]] = []

    try:
        toc = fetch_toc_data()
        toc_sections = toc.get("sections", [])
        if toc_sections:
            sections = _toc_sections_to_output_sections(toc_sections)
    except Exception as e:
        print(f"TOC fetch failed ({e}). Trying sitemap fallback.", file=sys.stderr)

    if not sections:
        sitemap_urls = fetch_sitemap()
        if sitemap_urls:
            if _SIDEBAR_URLS_PATH.exists():
                print(
                    "WARNING: TOC fetch failed. Sitemap fallback would replace "
                    'section structure with flat "All" list.',
                    file=sys.stderr,
                )
                print(
                    "Preserving existing SIDEBAR_URLS.md to prevent data loss.",
                    file=sys.stderr,
                )
                return 0
            sections = [{"title": "All", "urls": sitemap_urls}]

    total_urls = len({u for s in sections for u in s.get("urls", [])})
    if total_urls == 0:
        print("Fatal: 0 URLs collected. Aborting.", file=sys.stderr)
        return 1

    out = build_output(sections=sections, status_by_url=status_by_url, existing_header=existing)
    _SIDEBAR_URLS_PATH.parent.mkdir(parents=True, exist_ok=True)
    _SIDEBAR_URLS_PATH.write_text(out, encoding="utf-8")

    print(f"Updated {_SIDEBAR_URLS_PATH}")
    print(f"Sections: {len(sections)}")
    print(f"Total unique URLs: {total_urls}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
