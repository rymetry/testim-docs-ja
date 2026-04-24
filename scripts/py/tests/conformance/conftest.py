"""conformance suite 共通 fixtures (288-matrix corpus oracle loader)。

288-page corpus conformance test (``test_segments_en_288_matrix.py`` /
``test_turndown_288_matrix.py``) で共有する oracle JSONL loader を提供する。

## Oracle JSONL 契約 (emit_corpus_oracle.mjs と対)

1 row = ``{schemaVersion:1, suite, slug, sha256, expected}``。詳細は
``scripts/py/tools/emit_corpus_oracle.mjs`` の module docstring 参照。

## Loader の優先順位

1. ``TESTIM_CORPUS_EXPECTED_JSONL`` env var が set されていれば、**絶対パス**
   として扱って JSONL を読む。CI の ``python-corpus`` job が採用する経路。
2. env var が無く、かつ **xdist worker** 内なら ``pytest.UsageError`` を raise
   して fail する (silent な N-way harness 呼び出し / 誤 green を防ぐ。
   ``pytest.skip`` だと「テストが走らなかった」ことを silent に受け入れて
   しまう)。
3. env var が無く、**単一 process** で走っている local 実行なら session 内で
   1 回だけ ``emit_corpus_oracle.mjs`` を spawn して JSONL を生成する。

## xdist 下での session 共有

``scope="session"`` な fixture は xdist ``--dist load`` では worker 毎に 1 回
ロードされる (xdist の session は process 境界で区切られる)。env var 経由で
**同じ JSONL file** を全 worker が読むため、実データは共有される。
"""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
from pathlib import Path

import pytest

# Supported oracle row schema versions. ``emit_corpus_oracle.mjs`` が bump した
# 時は本定数にも追加し、必要なら loader 側で後方互換パースを書く契約。
_SUPPORTED_SCHEMA_VERSIONS: frozenset[int] = frozenset({1})
_REQUIRED_ROW_KEYS: frozenset[str] = frozenset(
    {"schemaVersion", "suite", "slug", "sha256", "expected"}
)


def canonical_sha256(value: object) -> str:
    """Canonical-JSON SHA-256 fingerprint matching ``emit_corpus_oracle.mjs``.

    ``json.dumps(value, sort_keys=True, separators=(",", ":"),
    ensure_ascii=False)`` で canonical JSON を生成し、UTF-8 で SHA-256 を取る。
    mjs 側の ``canonicalStringify`` 実装と byte-identical な canonical form。

    **主な目的**: "oracle JSONL row の canonical serialization 契約を pin"
    すること (test 内で ``py == expected`` がすでに値一致を保証するため、
    sha256 自体が tamper 検知に回るケースは稀)。canonical form の仕様が
    mjs と Python で divergence したら即座に fail する regression guard。
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
            f"Regenerate via `node scripts/py/tools/emit_corpus_oracle.mjs`."
        )
    schema_version = row["schemaVersion"]
    if schema_version not in _SUPPORTED_SCHEMA_VERSIONS:
        raise ValueError(
            f"oracle JSONL row {line_no} has unsupported schemaVersion={schema_version!r}. "
            f"Supported: {sorted(_SUPPORTED_SCHEMA_VERSIONS)}. "
            "Update conftest._SUPPORTED_SCHEMA_VERSIONS or regenerate oracle."
        )


@pytest.fixture(scope="session")
def corpus_oracle(
    repo_root: Path, node_available: bool, tmp_path_factory: pytest.TempPathFactory
) -> dict[tuple[str, str], dict]:
    """288-matrix corpus oracle を ``(suite, slug) -> row`` dict でロードする。

    env var 経由 or fallback 生成で JSONL を取得し、session 内で 1 回だけ
    dict にパースする。返り値は immutable view ではなく plain dict だが、
    tests は lookup のみを行う契約。
    """
    env_path = os.environ.get("TESTIM_CORPUS_EXPECTED_JSONL")
    if env_path:
        jsonl_path = Path(env_path)
        if not jsonl_path.is_absolute():
            raise pytest.UsageError(
                "TESTIM_CORPUS_EXPECTED_JSONL must be an absolute path "
                "(relative paths break xdist worker cwd semantics). "
                f"Got: {env_path!r}"
            )
    else:
        if _is_xdist_worker():
            # xdist 下で env var なしは **契約違反**。``pytest.skip`` は silent に
            # 「テストが走らなかった」ことを受け入れて green になってしまうので、
            # ``pytest.UsageError`` で fail させて誤 green を防ぐ。
            raise pytest.UsageError(
                "TESTIM_CORPUS_EXPECTED_JSONL is required under pytest-xdist to "
                "avoid N-way harness invocation. Run:\n"
                "  node scripts/py/tools/emit_corpus_oracle.mjs --out /tmp/oracle.jsonl\n"
                "  TESTIM_CORPUS_EXPECTED_JSONL=/tmp/oracle.jsonl uv run pytest "
                "-m corpus -n auto --dist load"
            )
        if not node_available:
            pytest.skip("node not available; cannot generate oracle JSONL in fallback")
        tmp_dir = tmp_path_factory.mktemp("corpus_oracle")
        jsonl_path = (tmp_dir / "oracle.jsonl").resolve()
        emit_script = repo_root / "scripts" / "py" / "tools" / "emit_corpus_oracle.mjs"
        subprocess.run(
            ["node", str(emit_script), "--out", str(jsonl_path)],
            check=True,
            timeout=600,
            cwd=repo_root,
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
                    f"at line {line_no}. Regenerate via emit_corpus_oracle.mjs."
                )
            oracle[key] = row
    return oracle
