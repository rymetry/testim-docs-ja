"""conformance suite 共通 fixtures (288-matrix corpus oracle loader)。

288-page corpus conformance test (``test_segments_en_288_matrix.py`` /
``test_turndown_288_matrix.py`` / ``test_align_288_matrix.py``) で共有する
oracle JSONL loader を提供する。

## Oracle JSONL 契約

1 row = ``{schemaVersion:1, suite, slug, sha256, expected}``。詳細は
``testim_parity.tools.emit_corpus_oracle`` の module docstring 参照。

## Loader の優先順位 (Phase 6b cutover 後)

1. ``TESTIM_CORPUS_EXPECTED_JSONL`` env var が set されていれば、**絶対パス**
   として扱って JSONL を読む。nightly oracle drift workflow / local debug で
   live oracle snapshot を注入する escape hatch。
2. committed golden (``tests/conformance/__oracle__/corpus_golden.jsonl``) が
   存在すれば、それを authoritative oracle として使う。Phase 6b 以降の
   default。subprocess 不要で xdist worker でも stable。
3. committed golden が無い場合は ``pytest.UsageError`` で fail させる。
   Phase 6b で mjs 削除後は live oracle regen ができないため (mjs harness
   無し)、golden 消失は必ず CI-visible な error として扱う。``npm run
   test:py:corpus:regen`` が Python 実装で golden を regenerate する。

## xdist 下での session 共有

``scope="session"`` な fixture は xdist ``--dist load`` では worker 毎に 1 回
ロードされる (xdist の session は process 境界で区切られる)。committed
golden file を全 worker が同じ file system path で読むため、実データは
共有される (env var 経由の場合も同じ)。
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

import pytest

# Supported oracle row schema versions. ``testim_parity.tools.emit_corpus_oracle``
# が bump した時は本定数にも追加し、必要なら loader 側で後方互換パースを書く契約。
_SUPPORTED_SCHEMA_VERSIONS: frozenset[int] = frozenset({1})
_REQUIRED_ROW_KEYS: frozenset[str] = frozenset(
    {"schemaVersion", "suite", "slug", "sha256", "expected"}
)


def canonical_sha256(value: object) -> str:
    """Canonical-JSON SHA-256 fingerprint matching ``emit_corpus_oracle`` の contract.

    ``json.dumps(value, sort_keys=True, separators=(",", ":"),
    ensure_ascii=False)`` で canonical JSON を生成し、UTF-8 で SHA-256 を取る。
    Phase 6b cutover 前の mjs ``canonicalStringify`` 実装と byte-identical な
    canonical form (Phase 6b で Python 側が authoritative 実装に昇格、
    ``verify_golden_against_mjs.py`` で byte-identical を pin 済)。

    **主な目的**: "oracle JSONL row の canonical serialization 契約を pin"
    すること (test 内で ``py == expected`` がすでに値一致を保証するため、
    sha256 自体が tamper 検知に回るケースは稀)。canonical form の仕様が
    emitter と loader で divergence したら即座に fail する regression guard。
    """
    canon = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()


def _is_xdist_worker() -> bool:
    """``PYTEST_XDIST_WORKER`` env var が set されているか (xdist 内)。"""
    return os.environ.get("PYTEST_XDIST_WORKER") is not None


def _validate_row(row: dict, line_no: int) -> None:
    """1 row の schema contract を assert する (必須 key / schemaVersion)。

    JSONL tamper / schema drift を loader 時点で早期検知する。conformance
    test が個別 assert に辿り着く前に整合性エラーは fail-fast させる。
    """
    missing = _REQUIRED_ROW_KEYS - set(row.keys())
    if missing:
        raise ValueError(
            f"oracle JSONL row {line_no} missing required keys: {sorted(missing)}. "
            "Regenerate via `npm run test:py:corpus:regen` "
            "(or `uv run python -m testim_parity.tools.emit_corpus_oracle`)."
        )
    schema_version = row["schemaVersion"]
    if schema_version not in _SUPPORTED_SCHEMA_VERSIONS:
        raise ValueError(
            f"oracle JSONL row {line_no} has unsupported schemaVersion={schema_version!r}. "
            f"Supported: {sorted(_SUPPORTED_SCHEMA_VERSIONS)}. "
            "Update conftest._SUPPORTED_SCHEMA_VERSIONS or regenerate oracle."
        )


@pytest.fixture(scope="session")
def corpus_oracle(repo_root: Path) -> dict[tuple[str, str], dict]:
    """288-matrix corpus oracle を ``(suite, slug) -> row`` dict でロードする。

    Phase 6b cutover で mjs harness 削除後は committed golden が唯一の
    authoritative oracle。env var で上書きも可能 (nightly drift workflow の
    escape hatch)。session 内で 1 回だけ dict にパースする。
    """
    env_path = os.environ.get("TESTIM_CORPUS_EXPECTED_JSONL")
    if env_path:
        # Priority 1: env var escape hatch (nightly drift workflow / local debug)。
        # committed golden を迂回して live oracle を注入するために使う。
        jsonl_path = Path(env_path)
        if not jsonl_path.is_absolute():
            raise pytest.UsageError(
                "TESTIM_CORPUS_EXPECTED_JSONL must be an absolute path "
                "(relative paths break xdist worker cwd semantics). "
                f"Got: {env_path!r}"
            )
    else:
        # Priority 2: committed golden (Phase 6b cutover 後の sole authority)。
        jsonl_path = (
            repo_root
            / "scripts"
            / "python"
            / "tests"
            / "conformance"
            / "__oracle__"
            / "corpus_golden.jsonl"
        )
        if not jsonl_path.exists():
            # Phase 6b 以降は mjs が無いので live regen は Python tool でしか
            # 行えない。silent skip させず ``pytest.UsageError`` で fail させる。
            raise pytest.UsageError(
                "corpus oracle not available. Regenerate via:\n  npm run test:py:corpus:regen"
            )

    if not jsonl_path.exists():
        raise FileNotFoundError(f"oracle JSONL not found at {jsonl_path}")

    oracle: dict[tuple[str, str], dict] = {}
    with jsonl_path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            if not line.strip():
                continue
            row = json.loads(line)
            _validate_row(row, line_no)
            key = (row["suite"], row["slug"])
            if key in oracle:
                raise ValueError(
                    f"oracle JSONL has duplicate (suite, slug) key {key!r} "
                    f"at line {line_no}. Regenerate via `npm run test:py:corpus:regen` "
                    "(or `uv run python -m testim_parity.tools.emit_corpus_oracle`)."
                )
            oracle[key] = row
    return oracle
