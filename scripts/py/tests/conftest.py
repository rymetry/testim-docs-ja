"""``testim_parity`` テスト向けの共有 pytest fixtures。

Phase 0 で確立したので、後続モジュール port 側で file ごとに再定義せずに
同じ segment factory / repo-root helper を再利用できる。
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest


@pytest.fixture(autouse=True)
def _reset_module_level_caches() -> None:
    """テスト間の module-level cache pollution を autouse で防ぐ。

    リセット対象:
      - ``project`` の 4 cache (``_section_cache`` 他) を
        ``reset_project_caches_for_test`` で一括消去
      - ``glossary_mask`` の ``_glossary_cache`` / ``_patterns_cache`` を
        ``_clear_caches`` で消去

    test が tmp_path や monkeypatch で underlying data を差し替える場合、stale
    cache hit を踏まないよう毎 test 前に完全 reset する。
    """
    from testim_parity.glossary_mask import _clear_caches as _clear_glossary_caches
    from testim_parity.project import reset_project_caches_for_test

    reset_project_caches_for_test()
    _clear_glossary_caches()


@pytest.fixture
def make_segment():
    """最小形の dict 形式 Segment を返す factory fixture。

    フィールドは ``scripts/lib/source_parity_segments_shared.mjs`` の ``Segment``
    typedef と 1:1 対応。kwargs で個別上書きする。
    """

    def _factory(**overrides: Any) -> dict[str, Any]:
        base: dict[str, Any] = {
            "sectionPath": "",
            "segmentKind": "paragraph",
            "segmentIndex": 0,
            "textNorm": "",
            "tokensInvariant": [],
            "sourceFingerprint": None,
            "line": None,
        }
        base.update(overrides)
        return base

    return _factory


@pytest.fixture(scope="session")
def repo_root() -> Path:
    """testim-docs-ja worktree のルート絶対 path。

    Phase 6b cutover で mjs harness は削除され、現時点で node subprocess を
    spawn するテストは残っていない。``repo_root`` 単体は conformance /
    check_source_parity 等で snapshot / content ディレクトリの base として
    まだ広く使われるため session fixture のまま保持する。
    """
    return Path(__file__).resolve().parents[3]
