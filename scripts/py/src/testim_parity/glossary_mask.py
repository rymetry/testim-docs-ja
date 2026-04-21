"""parity 検出用の glossary + invariant pattern マスカー。

``scripts/lib/parity_glossary_mask.mjs`` の port。``docs/GLOSSARY.md`` と
``docs/INVARIANT_TOKENS.md`` を読み、用語集と invariant regex の和で segment
テキストをマスクする。マスク残差が「完全にカバーされた」状態か「未翻訳の英文
prose を含む」かを分類する。
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

_ROOT = Path(__file__).resolve().parents[4]
GLOSSARY_PATH: Path = _ROOT / "docs" / "GLOSSARY.md"
INVARIANT_PATH: Path = _ROOT / "docs" / "INVARIANT_TOKENS.md"

# **挿入順を保持する** glossary cache。JS `Set` は挿入順を維持するが Python
# `set` はハッシュ順 (PYTHONHASHSEED でランダム化) のため、``sort(key=len,
# reverse=True)`` の stable sort で同長タイ (例: "iOS" / "ios") の順序が
# 両 runtime で divergence する。挿入順を保つ `list` で保管することで
# mask record の順序が mjs と byte 一致する。
_glossary_cache: list[str] | None = None
_patterns_cache: list[dict[str, Any]] | None = None


def _clear_caches() -> None:
    """モジュールレベル cache を消去 (underlying data を差し替える test 用)。

    single-underscore な private 関数として export する (dunder にすると Python の
    名前マングリング対象にならないものの、``from ... import __clear_caches`` は
    syntactically 許可されていても読みにくいため)。
    """
    global _glossary_cache, _patterns_cache
    _glossary_cache = None
    _patterns_cache = None


def load_glossary(path: Path | str = GLOSSARY_PATH) -> list[str]:
    """``docs/GLOSSARY.md`` をパースし、挿入順を保った canonical 用語リストを返す。

    各 ``##`` 見出し配下の ``| 用語 | ... |`` 行から先頭セルを抽出する。backtick
    包みの code cell と header separator 行は無視。初回成功時のみ cache する。

    **戻り値は set ではなく list**: JS `Set` の挿入順セマンティクスを踏襲し、
    ``mask_segment_text`` の長さ降順 stable sort で同長タイの順序が mjs と
    byte 一致するようにする (codex Round 4 指摘)。重複は登場順で破棄する。
    """
    global _glossary_cache
    if _glossary_cache is not None:
        return _glossary_cache

    md = Path(path).read_text(encoding="utf-8")
    terms: list[str] = []
    seen: set[str] = set()
    in_table = False
    skip_separator = False

    for line in md.split("\n"):
        if line.startswith("## "):
            in_table = False
            continue
        if line.startswith("|") and "|" in line:
            if not in_table:
                in_table = True
                skip_separator = True
                continue
            if skip_separator:
                skip_separator = False
                continue
            cells = [c.strip() for c in line.split("|")]
            raw = cells[1] if len(cells) > 1 else ""
            if not raw:
                continue
            term = raw.strip("`").strip()
            if term and term not in seen:
                terms.append(term)
                seen.add(term)
        else:
            in_table = False

    _glossary_cache = terms
    return terms


def _translate_js_flags_to_python(flags: str) -> int:
    """JS regex flag 文字列を Python ``re`` フラグへマップする。

    mjs loader は ``matchAll`` のため ``g`` を必須化するが、Python ``finditer`` は
    global 動作がデフォルトなので ``g`` は無視してよい。

    **Phase 3 M4 288-page conformance で発覚した bug 修正**:
    JS default の ``\\b`` は **ASCII 境界** で、``/pattern/u`` (``u`` フラグ) で
    Unicode 境界になる。一方 Python ``re`` はデフォルト Unicode 境界で、
    ``re.ASCII`` で ASCII 境界になる。この semantic を合わせるため:

    - JS ``u`` フラグ **あり** → Python ``re.UNICODE`` (default 相当) に mapping
    - JS ``u`` フラグ **なし** → Python ``re.ASCII`` を明示的に付ける

    こうしないと ``\\b(?:token|...)\\b`` が CJK 文字 ("tokenを") の直後で mjs
    は境界 match するが Python は ``\\w\\w`` 扱いで match しない、という
    divergence が起きる (sealights-integration 実例)。
    """
    py_flags = 0
    if "i" in flags:
        py_flags |= re.IGNORECASE
    if "m" in flags:
        py_flags |= re.MULTILINE
    if "s" in flags:
        py_flags |= re.DOTALL
    if "u" in flags:
        py_flags |= re.UNICODE
    else:
        # JS default = ASCII 境界。Python default = Unicode 境界。両者を揃える。
        py_flags |= re.ASCII
    return py_flags


def load_invariant_patterns(
    path: Path | str = INVARIANT_PATH,
) -> list[dict[str, Any]]:
    """``docs/INVARIANT_TOKENS.md`` を ``[{id, regex, flags}]`` のリストに分解する。

    各 ``## <id>`` 配下に ``id`` / ``regex`` 行 (オプションで ``flags``) のテーブル
    が続く前提。不正な regex 行は silently skip する (test が拾う mjs 契約)。
    """
    global _patterns_cache
    if _patterns_cache is not None:
        return _patterns_cache

    md = Path(path).read_text(encoding="utf-8")
    patterns: list[dict[str, Any]] = []
    # 最初の ``## `` 見出しより前を捨ててから後続を分割する
    sections = re.split(r"^## ", md, flags=re.MULTILINE)[1:]

    for section in sections:
        first_line = section.split("\n")[0].strip()
        if not first_line or first_line == "登録手順":
            continue
        pattern_id = first_line
        regex_match = re.search(r"\|\s*regex\s*\|\s*`(.+?)`\s*\|", section)
        if not regex_match:
            continue
        flags_match = re.search(r"\|\s*flags\s*\|\s*`(.+?)`\s*\|", section)
        base_flags = flags_match.group(1) if flags_match else ""
        # mjs は matchAll のため ``g`` を強制する。conformance 用に記録だけ残し、
        # Python re 側には流さない。
        flags_str = base_flags if "g" in base_flags else base_flags + "g"
        py_flags = _translate_js_flags_to_python(flags_str)
        try:
            compiled = re.compile(regex_match.group(1), py_flags)
        except re.error:
            continue
        patterns.append({"id": pattern_id, "regex": compiled, "flags": flags_str})

    _patterns_cache = patterns
    return patterns


_GLOSSARY_PLACEHOLDER = "__GLOSSARY__"
_INVARIANT_PLACEHOLDER = "__INVARIANT__"


def mask_segment_text(text: str) -> dict[str, Any]:
    """glossary 用語 + invariant pattern をマスクし、マスク済みテキストと記録を返す。

    順序は「長い用語優先 (複合語マッチを先に勝たせる)」→「invariant pattern は残余
    に適用」。各マッチは ``source``、``entry`` / ``pattern``、``span`` を coverage
    集計用に記録する。
    """
    if not isinstance(text, str) or len(text) == 0:
        return {"maskedText": text, "masks": []}

    glossary = load_glossary()
    patterns = load_invariant_patterns()
    masks: list[dict[str, Any]] = []

    # 長さ降順 stable sort。``glossary`` は挿入順を保った list なので、同長タイ
    # は入力ファイルでの登場順 (JS Set insertion order と同一) が保持される。
    sorted_terms = sorted(glossary, key=len, reverse=True)

    masked = text
    for term in sorted_terms:
        escaped = re.escape(term)
        # ``re.ASCII`` は ``\b`` を ASCII 境界として評価させる (JS の ``\b`` と
        # 同一セマンティクス)。Python default の Unicode 境界では CJK 文字が
        # ``\w`` 扱いになるため、``"Testimの設定"`` のように英語 term が JA 文字
        # と接する境界で ``\b`` が発火せず、mjs と結果が divergence する。
        pattern = re.compile(rf"\b{escaped}\b", re.IGNORECASE | re.ASCII)
        for match in pattern.finditer(masked):
            masks.append(
                {
                    "source": "glossary",
                    "entry": term,
                    "span": {"start": match.start(), "end": match.end()},
                }
            )
        masked = pattern.sub(_GLOSSARY_PLACEHOLDER, masked)

    for entry in patterns:
        regex: re.Pattern[str] = entry["regex"]
        for match in regex.finditer(masked):
            if len(match.group(0)) == 0:
                continue
            masks.append(
                {
                    "source": "invariant-pattern",
                    "pattern": entry["id"],
                    "span": {"start": match.start(), "end": match.end()},
                }
            )
        masked = regex.sub(_INVARIANT_PLACEHOLDER, masked)

    return {"maskedText": masked, "masks": masks}


_RESIDUE_MIN_WORDS = 3
_RESIDUE_MIN_LENGTH = 15
# ``parity_glossary_mask.mjs:155`` と **意図的に同一** の狭い CJK レンジ。
# ``source_parity_align_scoring.mjs`` は ``\uF900-\uFAFF`` (CJK 互換) と
# ``\u4E00-\u9FFF`` (統合漢字の拡張) を含む広い range を使っており、Python 側
# ``align_scoring.CJK_RE`` はそちらに倣う。両モジュールで range が異なるのは
# mjs から継承した契約で、**統一してはいけない** (port divergence を作る)。
# 将来 mjs 側が統一されたタイミングで Python 側も同時に追従する。
_CJK_CHAR_RE = re.compile(r"[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]")
_WORD_ASCII_RE = re.compile(r"[a-z]", re.IGNORECASE)

# inline code / link / URL を glossary マスク **前** に剥がす。URL 内に埋め込まれた
# glossary 用語 (``https``, ``ios`` 等) が URL 正規表現より先に消費され、英文片
# (``byby.dev``, ``open.spotify.com`` 等) が residue に残ってしまうバグを防ぐ。
_PRE_STRIP_PATTERNS: tuple[re.Pattern[str], ...] = (
    # GFM double-backtick + single-backtick inline code
    re.compile(r"``(?:[^`]|`(?!`))*``|`[^`]*`"),
    re.compile(r"\[[^\]]*\]\([^)]*\)"),  # markdown link [label](url)
    re.compile(r"<https?://[^>]+>"),  # GFM autolink
    re.compile(r"https?://\S+"),  # bare URL
    re.compile(r"/docs/\S+"),  # internal /docs link
)


def classify_segment(text: str) -> dict[str, Any]:
    """マスク後テキストを「完全カバー」または「未翻訳英文を含む」と分類する。

    順序契約: inline code / markdown link / autolink / bare URL / ``/docs`` link を
    glossary + invariant マスクより **前** に剥がす。そうしないと URL 内に紛れた
    glossary 用語が先に消費されて URL 正規表現が空振りし、英文片が残る。
    """
    if not isinstance(text, str) or len(text) == 0:
        return {"isFullyMasked": True, "residue": ""}

    stripped = text.strip()
    if not re.search(r"[a-zA-Z]", stripped):
        return {"isFullyMasked": True, "residue": ""}

    pre_stripped = text
    for pattern in _PRE_STRIP_PATTERNS:
        pre_stripped = pattern.sub(" ", pre_stripped)

    masked = mask_segment_text(pre_stripped)["maskedText"]

    residue = masked
    residue = re.sub(re.escape(_GLOSSARY_PLACEHOLDER), " ", residue)
    residue = re.sub(re.escape(_INVARIANT_PLACEHOLDER), " ", residue)
    residue = residue.strip()

    english_portion = _CJK_CHAR_RE.sub(" ", residue).strip()
    if len(english_portion) < _RESIDUE_MIN_LENGTH:
        return {"isFullyMasked": True, "residue": ""}
    words = [w for w in re.split(r"\s+", english_portion) if _WORD_ASCII_RE.search(w)]
    if len(words) < _RESIDUE_MIN_WORDS:
        return {"isFullyMasked": True, "residue": ""}

    return {"isFullyMasked": False, "residue": english_portion}


def create_mask_coverage() -> dict[str, Any]:
    """run 単位で使うマスク coverage の stateful 集計器。

    ``record(...)`` と ``to_json()`` を持つ dict を返す (mjs の closure bag と対応)。
    """
    entries: list[dict[str, Any]] = []
    by_glossary: dict[str, int] = {}
    by_pattern: dict[str, int] = {}

    def record(
        *, slug: str, segment_kind: str, section_path: str, masks: list[dict[str, Any]]
    ) -> None:
        if not isinstance(masks, list) or not masks:
            return
        entries.append(
            {
                "slug": slug,
                "segmentKind": segment_kind,
                "sectionPath": section_path,
                "masks": masks,
            }
        )
        for mask in masks:
            if mask.get("source") == "glossary":
                by_glossary[mask["entry"]] = by_glossary.get(mask["entry"], 0) + 1
            elif mask.get("source") == "invariant-pattern":
                by_pattern[mask["pattern"]] = by_pattern.get(mask["pattern"], 0) + 1

    def to_json() -> dict[str, Any]:
        return {
            "maskedSegments": list(entries),
            "summary": {
                "segmentsMasked": len(entries),
                "byGlossaryEntry": dict(by_glossary),
                "byInvariantPattern": dict(by_pattern),
            },
        }

    return {"record": record, "toJSON": to_json}


__all__ = [
    "GLOSSARY_PATH",
    "INVARIANT_PATH",
    "_clear_caches",
    "load_glossary",
    "load_invariant_patterns",
    "mask_segment_text",
    "classify_segment",
    "create_mask_coverage",
]
