"""alignment / structure comparator が共有するペアスコアリング。

``scripts/lib/source_parity_align_scoring.mjs`` の port。

:func:`score_segment_match` は weighted-LCS aligner と Stage-C content-order
bijection の両方が呼ぶペア単位の等価オラクル。align と structure の循環 import を
避けるため独立モジュール化している。純粋関数 (mutation / I/O なし)。
"""

from __future__ import annotations

import math
import re
from typing import Any


def _js_round(x: float) -> int:
    """JavaScript ``Math.round`` の挙動 (half away from zero) を模倣する。

    Python 組み込み :func:`round` は banker's rounding (half to even) のため、
    ``0.5`` / ``2.5`` / ``-1.5`` 等で JS と異なる結果を返す。この 2 本の弱スコアは
    LCS tie-break に食わせるため、1 差が alignment 判断を反転させ得る。したがって
    正の入力に対しては :func:`math.floor` + ``0.5`` で half-away-from-zero を
    再現する。負値は対称動作になるよう符号を反転させる (現在の caller は非負しか
    渡さないが、契約は実数軸全体に成立させておく)。
    """
    if x >= 0:
        return math.floor(x + 0.5)
    return -math.floor(-x + 0.5)


# ひらがな・カタカナ・CJK 統合漢字・半角/全角・CJK 互換。幅広めにとっておくことで
# 翻訳済み JA 段落が「英文残留」と誤判定されない。
CJK_RE = re.compile(
    r"[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]"
)

# スコア重み。weighted LCS は STRONG > MEDIUM > WEAK の順序に依存する。絶対値は
# 重要でなく相対関係のみが load-bearing。
SCORE_FINGERPRINT_MATCH = 1000
SCORE_TEXTNORM_MATCH = 500
SCORE_TOKEN_OVERLAP_BASE = 100
SCORE_TOKEN_OVERLAP_PER_TOKEN = 10
SCORE_WEAK_POSITION_MAX = 10
SCORE_WEAK_LENGTH_MAX = 5
SCORE_KIND_FLOOR = 1


def compute_weak_position_score(i: int, j: int, n: int, m: int) -> int:
    """セクション内の 2 segment の相対位置の近さをスコア化する。

    正規化位置が完全一致なら :data:`SCORE_WEAK_POSITION_MAX`、最も遠ければ 0、
    片方のセクション長が 1 以下 (位置情報が取れない) なら中間値にフォールバック。
    """
    if n <= 1 or m <= 1:
        return SCORE_WEAK_POSITION_MAX // 2
    en_ratio = i / (n - 1)
    ja_ratio = j / (m - 1)
    distance = abs(en_ratio - ja_ratio)
    return max(0, _js_round(SCORE_WEAK_POSITION_MAX * (1 - distance)))


def compute_weak_length_score(en_text: str | None, ja_text: str | None) -> int:
    """2 segment の長さ類似度を弱スコア化する。

    JA は EN より短くなりがちなので強い予測力は無い。片方が空なら 0 を返す
    (ゼロ割回避)。
    """
    if not en_text or not ja_text:
        return 0
    min_len = min(len(en_text), len(ja_text))
    max_len = max(len(en_text), len(ja_text))
    if max_len == 0:
        return 0
    return _js_round(SCORE_WEAK_LENGTH_MAX * (min_len / max_len))


def score_segment_match(
    en: Any,
    ja: Any,
    en_local_index: int,
    ja_local_index: int,
    en_section_len: int,
    ja_section_len: int,
) -> int:
    """候補 (EN, JA) segment ペアを共有の score 階層で評価する。

    階層 (高い → 低い):

    1. ``sourceFingerprint`` 完全一致 → :data:`SCORE_FINGERPRINT_MATCH`
    2. ``textNorm`` 完全一致 → :data:`SCORE_TEXTNORM_MATCH`
    3. invariant-token overlap → base + per-token bonus。token 集合が
       disjoint なら 0 (強い非マッチ)。
    4. 同一言語ペナルティ → 両側 ASCII-only で ``textNorm`` が違えば 0
       (ほぼ確実に別コンテンツ)。
    5. Tokenless cross-language → 弱い position + length スコア。
    6. :data:`SCORE_KIND_FLOOR` — kind は一致するが textual / position
       シグナルなし。

    0 は「絶対にマッチさせない」シグナル: kind 違い / 同一言語別文 / token
    disjoint のいずれか。LCS と Stage-C comparator はどちらも 0 をハード非マッチ
    として扱う。

    ``en`` / ``ja`` は Segment 型の duck-typed オブジェクト (dict か属性アクセス)。
    Pydantic Segment もそのまま動く。
    """
    if _seg_field(en, "segmentKind") != _seg_field(ja, "segmentKind"):
        return 0

    en_fp = _seg_field(en, "sourceFingerprint")
    ja_fp = _seg_field(ja, "sourceFingerprint")
    if en_fp and en_fp == ja_fp:
        return SCORE_FINGERPRINT_MATCH

    en_text = _seg_field(en, "textNorm")
    ja_text = _seg_field(ja, "textNorm")
    if en_text and en_text == ja_text:
        return SCORE_TEXTNORM_MATCH

    en_tokens = _seg_field(en, "tokensInvariant") or []
    ja_tokens = _seg_field(ja, "tokensInvariant") or []
    if len(en_tokens) > 0 and len(ja_tokens) > 0:
        ja_set = set(ja_tokens)
        overlap = sum(1 for token in en_tokens if token in ja_set)
        if overlap > 0:
            return SCORE_TOKEN_OVERLAP_BASE + overlap * SCORE_TOKEN_OVERLAP_PER_TOKEN
        return 0  # token 集合 disjoint — 強い非マッチ

    # 同一言語ペナルティ: 両側 ASCII-only で textNorm が違う場合
    if en_text and ja_text and not CJK_RE.search(en_text) and not CJK_RE.search(ja_text):
        return 0

    # Tokenless cross-language: 位置 + 長さのハイブリッド弱スコア
    position_score = compute_weak_position_score(
        en_local_index, ja_local_index, en_section_len, ja_section_len
    )
    length_score = compute_weak_length_score(en_text, ja_text)
    return max(SCORE_KIND_FLOOR, position_score + length_score)


def _seg_field(segment: Any, name: str) -> Any:
    """Segment フィールドを属性 / mapping のどちらでも読めるようにする helper。"""
    if isinstance(segment, dict):
        return segment.get(name)
    return getattr(segment, name, None)


__all__ = [
    "CJK_RE",
    "SCORE_FINGERPRINT_MATCH",
    "SCORE_TEXTNORM_MATCH",
    "SCORE_TOKEN_OVERLAP_BASE",
    "SCORE_TOKEN_OVERLAP_PER_TOKEN",
    "SCORE_WEAK_POSITION_MAX",
    "SCORE_WEAK_LENGTH_MAX",
    "SCORE_KIND_FLOOR",
    "compute_weak_position_score",
    "compute_weak_length_score",
    "score_segment_match",
]
