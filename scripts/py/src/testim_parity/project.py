"""project レイアウト utilities: docs slug 解決、frontmatter 対応 index 構築。

``scripts/lib/project.mjs`` の port。大半は純粋 path 計算で、一部のみ docs tree を
走査しその結果を ``docs_dir`` ごとにキャッシュする。``matches_section_filter`` は
sidebar 由来の slug 集合を先に引き、失敗時のみ緩いヒューリスティックへ fallback する
(mjs と同じ契約)。
"""

from __future__ import annotations

import logging
import re
import unicodedata
from pathlib import Path
from typing import Any

import frontmatter

_ROOT = Path(__file__).resolve().parents[4]

ROOT_DIR: Path = _ROOT
PROJECT_ROOT: Path = _ROOT
DOCS_DIR: Path = _ROOT / "src" / "content" / "docs"
SIDEBAR_PATH: Path = _ROOT / "docs" / "SIDEBAR_URLS.md"

_log = logging.getLogger(__name__)

_SOURCE_URL_RE = re.compile(
    r"^https://docs\.tricentis\.com/testim/content/([a-z0-9_-]+(?:/[a-z0-9_-]+)*)\.htm$"
)


def _normalize_match_value(value: Any) -> str:
    s = "" if value is None else str(value)
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def find_md_files(dir_path: Path | str = DOCS_DIR) -> list[Path]:
    """``dir_path`` 配下の ``.md`` ファイルを再帰的に列挙する。"""
    base = Path(dir_path)
    return sorted(base.rglob("*.md"))


def to_relative_doc_path(file_path: Path | str) -> str:
    """``file_path`` を :data:`ROOT_DIR` 相対の文字列に変換する。"""
    rel = Path(file_path).resolve().relative_to(ROOT_DIR)
    # mjs は OS の path separator を使うので Python 側も同じ挙動にして cross-runtime
    # の conformance 比較が成立するようにしておく。
    return str(rel)


def get_doc_section(relative_path: str) -> str:
    """``src/content/docs/<section>/...`` の section フォルダ名を返す。"""
    parts = relative_path.split("/") if "/" in relative_path else relative_path.split("\\")
    return parts[3] if len(parts) > 3 else ""


def file_path_to_slug(file_path: Path | str, docs_dir: Path | str = DOCS_DIR) -> str:
    """絶対 ``.md`` path を path-based slug に変換する。

    例: ``/.../src/content/docs/overview/testim-overview.md`` →
    ``overview/testim-overview``.
    """
    rel = Path(file_path).resolve().relative_to(Path(docs_dir).resolve())
    return rel.with_suffix("").as_posix()


# モジュールレベル cache (docs_dir 単位)。mjs 挙動と整合させる。test 向けに
# reset API を公開している。plain dict で十分 (key は任意 path、invalidate は
# 明示的)。
# ``_section_cache`` は mjs と同じく **成功時のみ** set を格納する (unknown
# section の ValueError は cache しない — mjs は毎回 sidebar を引き直し warning
# を出すため、conformance 上もその挙動を踏襲する)。キャッシュされた空 set は
# 「sidebar に存在するが slug 0 件の section」という意味で、``if slug_set is not
# None:`` で slug-set 路へ流す。
_section_cache: dict[str, set[str]] = {}
_basename_map_cache: dict[str, dict[str, str | None]] = {}
_slug_index_cache: dict[str, dict[str, dict[str, Any]]] = {}
_resolve_to_full_slug_cache: dict[str, dict[str, str]] = {}


def reset_project_caches_for_test() -> None:
    """モジュールレベル cache を全消去する (tmp ``docs_dir`` を使う test 用)。"""
    _section_cache.clear()
    _basename_map_cache.clear()
    _slug_index_cache.clear()
    _resolve_to_full_slug_cache.clear()


def build_slug_index(docs_dir: Path | str = DOCS_DIR) -> dict[str, dict[str, Any]]:
    """``slug → {categoryFolder, filePath}`` の index を lazy cache 付きで返す。"""
    key = str(Path(docs_dir).resolve())
    cached = _slug_index_cache.get(key)
    if cached is not None:
        return cached
    index: dict[str, dict[str, Any]] = {}
    base = Path(docs_dir)
    for md_file in base.rglob("*.md"):
        slug = file_path_to_slug(md_file, docs_dir)
        category_folder = md_file.parent.name
        index[slug] = {"categoryFolder": category_folder, "filePath": str(md_file)}
    _slug_index_cache[key] = index
    return index


def build_basename_to_path_map(
    docs_dir: Path | str = DOCS_DIR,
) -> dict[str, str | None]:
    """``basename → slug`` の lookup を構築する。重複 basename は ``None``。"""
    key = str(Path(docs_dir).resolve())
    cached = _basename_map_cache.get(key)
    if cached is not None:
        return cached
    slug_index = build_slug_index(docs_dir)
    result: dict[str, str | None] = {}
    for slug in slug_index:
        bn = slug.split("/")[-1]
        if bn in result:
            result[bn] = None  # ambiguous (複数 folder にまたがる basename)
        else:
            result[bn] = slug
    _basename_map_cache[key] = result
    return result


def resolve_to_full_slug(slug: str, docs_dir: Path | str = DOCS_DIR) -> str:
    """省略形 slug を full 形式へ解決。未解決ならそのまま返す。"""
    key = str(Path(docs_dir).resolve())
    cache = _resolve_to_full_slug_cache.setdefault(key, {})
    if slug in cache:
        return cache[slug]
    index = build_slug_index(docs_dir)
    if slug in index:
        resolved = slug
    else:
        basename = slug.split("/")[-1]
        basename_map = build_basename_to_path_map(docs_dir)
        resolved = basename_map.get(basename) or slug
    cache[slug] = resolved
    return resolved


def resolve_slug(input_value: str | None, docs_dir: Path | str = DOCS_DIR) -> str | None:
    """CLI の ``--slug`` 値を full slug へ解決する (path-based 優先)。"""
    if not input_value:
        return None
    index = build_slug_index(docs_dir)
    if input_value in index:
        return input_value
    basename = None if "/" in input_value else input_value
    if not basename:
        return None
    matches = [slug for slug in index if slug.split("/")[-1] == basename]
    if len(matches) == 1:
        _log.warning(
            'Deprecated: basename slug "%s" → "%s". Use the full path-based slug instead.',
            input_value,
            matches[0],
        )
        return matches[0]
    if len(matches) > 1:
        _log.warning(
            'Ambiguous slug "%s" matches multiple paths: %s. Use full path.',
            input_value,
            ", ".join(matches),
        )
    return None


def extract_source_content_path(source_url: str | None) -> str | None:
    """frontmatter ``sourceUrl`` から EN 側の content path を抽出する。

    非文字列・非マッチングは ``None`` を返す。
    """
    if not isinstance(source_url, str):
        return None
    match = _SOURCE_URL_RE.match(source_url)
    if not match:
        return None
    raw = match.group(1)
    return raw[: -len("/index")] if raw.endswith("/index") else raw


def build_docs_index(docs_dir: Path | str = DOCS_DIR) -> dict[str, dict[str, Any]]:
    """EN ``sourceUrl`` 由来の content path も含めた docs index を構築する。

    key は path-based slug (例: ``overview/testim-overview``)。
    """
    index: dict[str, dict[str, Any]] = {}
    base = Path(docs_dir)
    for md_file in base.rglob("*.md"):
        slug = file_path_to_slug(md_file, docs_dir)
        local_folder = md_file.parent.name
        data: dict[str, Any]
        with md_file.open("r", encoding="utf-8") as fh:
            post = frontmatter.load(fh)
            data = dict(post.metadata)
        source_content_path = extract_source_content_path(data.get("sourceUrl"))
        index[slug] = {
            "filePath": str(md_file),
            "localFolder": local_folder,
            "sourceContentPath": source_content_path,
        }
    return index


def split_frontmatter(md: str) -> dict[str, str]:
    """Markdown 文字列を ``fm`` + ``body`` に分割する (mjs と同じ挙動)。

    frontmatter delimiter 無しなら ``{"fm": "", "body": md}`` を返す。
    ``fm`` スライスには末尾の ``\\n---`` を含める (mjs semantics を維持)。
    """
    if not md.startswith("---\n"):
        return {"fm": "", "body": md}
    end = md.find("\n---", 4)
    if end == -1:
        return {"fm": "", "body": md}
    fm = md[: end + 4]
    body = md[end + 4 :].lstrip("\n")
    return {"fm": fm, "body": body}


def to_kebab(value: Any) -> str:
    """mjs ``toKebab`` helper と同じ lossy kebab-case 変換。"""
    s = unicodedata.normalize("NFKC", str(value)).lower()
    s = s.replace("&", " ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-")
    return s


def read_doc_file(file_path: Path | str) -> dict[str, Any]:
    """単一の .md を読み、``{content, body, data, relativePath, section}`` を返す。"""
    path = Path(file_path)
    content = path.read_text(encoding="utf-8")
    post = frontmatter.loads(content)
    relative_path = to_relative_doc_path(path)
    return {
        "content": content,
        "body": post.content,
        "data": dict(post.metadata),
        "relativePath": relative_path,
        "section": get_doc_section(relative_path),
    }


def matches_section_filter(
    relative_path: str, data: dict[str, Any] | None, section_filter: str | None
) -> bool:
    """``relative_path`` が ``section_filter`` に属するか判定する。

    sidebar 由来の slug 集合を先に consult (成功キャッシュ付き)。失敗時のみ緩い
    ヒューリスティックに fallback する。``sidebar`` は ``madcap_toc`` に依存し、
    ``madcap_toc`` は ``project`` に依存しないので、local import で循環回避する。
    """
    if not section_filter:
        return True

    # Cache は **成功時のみ** 格納する (mjs と同じ semantics)。
    #   - hit (value は空 set 含む) → slug-set 路
    #   - miss (key 未登録) → sidebar を引き、失敗したら warning + heuristic へ
    # mjs は unknown section を cache せず毎回 ``getSectionSlugSet`` を再呼び出し
    # するため、Python も同じく cache しない。Round 2 の sentinel 最適化案は
    # Round 3 codex レビューで divergence として指摘されたため取り消した。
    # (実使用では 1 process あたりの `matchesSectionFilter` 呼び出し回数は高々
    # ページ数 O(10^3) 程度で、unknown section path の重複 disk read は許容範囲。)
    slug_set: set[str] | None = _section_cache.get(section_filter)
    if slug_set is None:
        try:
            from .sidebar import get_section_slug_set

            slug_set = get_section_slug_set(section_filter)
            _section_cache[section_filter] = slug_set
        except ValueError as exc:
            _log.warning("matches_section_filter: %s — falling back to heuristic match", exc)
        except Exception as exc:  # noqa: BLE001 — mjs の catch-all に合わせる
            _log.warning("matches_section_filter: unexpected error: %s", exc)

    # sidebar に存在する section (空 set 含む) は slug-set 路。None は失敗ケースの
    # heuristic fallback。
    if slug_set is not None:
        docs_prefix = "src/content/docs/"
        if relative_path.startswith(docs_prefix):
            rel = relative_path[len(docs_prefix) :].removesuffix(".md")
        else:
            rel = Path(relative_path).stem
        return rel in slug_set

    target = _normalize_match_value(section_filter)
    if not target:
        return True
    candidates = [
        relative_path,
        get_doc_section(relative_path),
        (data or {}).get("category"),
        Path(relative_path).stem,
    ]
    normalized = [_normalize_match_value(c) for c in candidates if c]
    return any(target in candidate for candidate in normalized)


__all__ = [
    "ROOT_DIR",
    "PROJECT_ROOT",
    "DOCS_DIR",
    "SIDEBAR_PATH",
    "find_md_files",
    "to_relative_doc_path",
    "get_doc_section",
    "file_path_to_slug",
    "build_slug_index",
    "build_basename_to_path_map",
    "resolve_to_full_slug",
    "resolve_slug",
    "extract_source_content_path",
    "build_docs_index",
    "split_frontmatter",
    "to_kebab",
    "read_doc_file",
    "matches_section_filter",
    "reset_project_caches_for_test",
]
