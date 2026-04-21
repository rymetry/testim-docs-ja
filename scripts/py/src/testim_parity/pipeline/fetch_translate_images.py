"""``scripts/pipeline/fetch_translate_images.mjs`` の Python wrapper。

**重要**: 本 module は現在 mjs 実装に subprocess で delegate する thin wrapper
である。mjs の ``fetch_translate_images`` は以下に依存しているが、いずれも
Python への byte-identical port が現時点では実用的でない:

- ``turndown`` (HTML → markdown 変換ライブラリ) — ``markdownify`` / ``html2text``
  では出力が一致せず、JA docs を生成する hot path のため byte drift を許容できない
- ``gray-matter`` (frontmatter 生成) — 互換 library はあるが YAML emit の形が
  微妙に違うため、今段階では mjs 側に任せる

Phase 4b follow-up で turndown の等価実装を用意して pure Python に切り替える。
その時点で本 wrapper は削除し、mjs 側の spawn も消す。

公開 API (``parse_sidebar_list`` / ``get_untranslated_list`` / ``get_all_pages_list`` /
``compute_hash``) は pure-Python で実装しており、test / 他 module からはこちら
を使える。
"""

from __future__ import annotations

import argparse
import hashlib
import re
import subprocess
import sys
from collections.abc import Callable
from pathlib import Path

from ..madcap_toc import extract_slug
from ..project import ROOT_DIR

__all__ = [
    "compute_hash",
    "get_all_pages_list",
    "get_untranslated_list",
    "main",
    "parse_sidebar_list",
]


# mjs: /^##\s+(.+?)(?:（(.+?)）)?\s*$/
# 全角 `（...）` 区切りで English / Japanese の category name を分離する。
# このリテラルを落とすと section heading が 1 文字ずつに崩れる。
_SECTION_HEADING_RE = re.compile("^##\\s+(.+?)(?:\uff08(.+?)\uff09)?\\s*$")
_STATUS_LINE_RE = re.compile(
    r"^-\s*(✅🔍|✅|⏳)\s+(https?://docs\.tricentis\.com/testim/content/[^\s]+\.htm)\s*$"
)

_FETCH_TRANSLATE_IMAGES_MJS: Path = ROOT_DIR / "scripts" / "pipeline" / "fetch_translate_images.mjs"


def parse_sidebar_list(
    sidebar_text: str, filter_fn: Callable[[str], bool]
) -> list[dict[str, object]]:
    """SIDEBAR_URLS.md を構造化 list に変換する (mjs 等価)。"""
    lines = re.split(r"\r?\n", sidebar_text)
    out: list[dict[str, object]] = []
    current: dict[str, str] | None = None
    order = 0
    for line in lines:
        h = _SECTION_HEADING_RE.match(line)
        if h:
            english = h.group(1).strip()
            japanese = (h.group(2) or english).strip()
            current = {"english": english, "japanese": japanese}
            order = 0
            continue
        m = _STATUS_LINE_RE.match(line)
        if m and current:
            order += 1
            if not filter_fn(m.group(1)):
                continue
            url = m.group(2)
            slug = extract_slug(url)
            if not slug:
                continue
            out.append(
                {
                    "categoryEnglish": current["english"],
                    "categoryJapanese": current["japanese"],
                    "url": url,
                    "slug": slug,
                    "order": order,
                }
            )
    return out


def get_untranslated_list(sidebar_text: str) -> list[dict[str, object]]:
    return parse_sidebar_list(sidebar_text, lambda status: status == "⏳")


def get_all_pages_list(sidebar_text: str) -> list[dict[str, object]]:
    return parse_sidebar_list(sidebar_text, lambda _status: True)


def compute_hash(content: str) -> str:
    """mjs ``createHash('sha256').update(content).digest('hex')`` 等価。"""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def main(argv: list[str] | None = None) -> int:
    """CLI エントリポイント。

    現時点では ``node scripts/pipeline/fetch_translate_images.mjs`` を同じ
    引数で subprocess 起動する wrapper。turndown 等価実装が揃ったら in-proc
    に切り替える。``node`` 不在環境では exit 2 で返す。
    """
    if argv is None:
        argv = sys.argv[1:]

    parser = argparse.ArgumentParser(
        description="Fetch EN HTML, convert to markdown, translate images (Phase 4 wrapper)"
    )
    parser.add_argument("--mode", default="diff", choices=("full", "diff"))
    parser.add_argument("--section", default=None)
    # unknown 引数も捨てずに forward する (mjs CLI compat)。
    args, extras = parser.parse_known_args(argv)

    forwarded = [f"--mode={args.mode}"]
    if args.section:
        forwarded.append(f"--section={args.section}")
    forwarded.extend(extras)

    if not _FETCH_TRANSLATE_IMAGES_MJS.exists():
        print(
            f"fetch_translate_images.mjs not found at {_FETCH_TRANSLATE_IMAGES_MJS}",
            file=sys.stderr,
        )
        return 1

    try:
        completed = subprocess.run(
            ["node", str(_FETCH_TRANSLATE_IMAGES_MJS), *forwarded],
            cwd=str(ROOT_DIR),
            check=False,
        )
    except FileNotFoundError:
        print(
            "fetch_translate_images: node not found on PATH. Install Node.js "
            "to run the HTML→markdown + image fetch step (turndown delegation).",
            file=sys.stderr,
        )
        return 2
    return int(completed.returncode)


if __name__ == "__main__":
    sys.exit(main())
