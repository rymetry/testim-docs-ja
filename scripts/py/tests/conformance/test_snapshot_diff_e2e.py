"""``snapshot_diff`` CLI の end-to-end byte parity test.

Phase 4b M5: Python CLI (``testim_parity.detection.snapshot_diff``) と mjs CLI
(``scripts/detection/snapshot_diff.mjs``) が同じ git HEAD + working tree
snapshot + (空の) ``src/content/docs`` + sidebar に対して byte-identical の
``snapshot-diff-status.json`` を生成することを検証する。

mjs は ``ROOT_DIR`` が script location から導出されるため、driver ``.mjs``
script で exported pure functions (``buildSidebarUrlMap`` / ``classifyChanges``)
を組み合わせて CLI orchestration を tmp_path 基準で再現する。git HEAD 読取は
両 CLI とも ``git show HEAD:<relative_path>`` (cwd = isolated tmp_path git
repo) で行う。

**volatile 正規化**: 以下 fields は realtime 依存のため比較前に除去:
- top-level ``checkedAt`` / ``runId``
- ``summary.runScope`` / top-level ``runScope`` の値 (runScope.type は残す)

``checkedAt`` は mjs driver / Python CLI で同じ ISO timestamp を明示的に注入して
同一化するため、結果的に ``runId`` も同一化するが、defensive に正規化する。
"""

from __future__ import annotations

import json
import subprocess
from datetime import UTC
from pathlib import Path
from typing import Any

import pytest

import testim_parity.detection.snapshot_diff as snap_mod

_DRIVER_SCRIPT = """\
import {{ execFileSync }} from 'node:child_process';
import {{ createHash }} from 'node:crypto';
import {{ readFileSync, writeFileSync, existsSync, readdirSync, statSync }} from 'node:fs';
import {{ dirname, join, relative }} from 'node:path';

import {{
  buildSidebarUrlMap,
  classifyChanges,
  MARKER_404_RE,
  SNAPSHOT_DIFF_SCHEMA_VERSION,
  fallbackSourceUrl,
}} from '{snap_mjs}';
import {{
  extractSlug as extractSlugFn,
  extractSlugsFromSnapshot,
  matchAllTricentisUrls,
}} from '{madcap_toc_mjs}';
import {{ buildRunScope }} from '{sync_health_mjs}';

const ROOT = {root_json};
const FIXED_CHECKED_AT = {checked_at_json};

const CONTENT_DIR = `${{ROOT}}/snapshots/en/content`;
const SIDEBAR_PATH = `${{ROOT}}/snapshots/en/sidebar.json`;
const SIDEBAR_URLS_PATH = `${{ROOT}}/docs/SIDEBAR_URLS.md`;
const SOURCE_SYNC_STATUS_PATH = `${{ROOT}}/source-sync-status.json`;
const OUTPUT_PATH = `${{ROOT}}/snapshot-diff-status.json`;

function readSourceSyncPayload() {{
  if (!existsSync(SOURCE_SYNC_STATUS_PATH)) return null;
  try {{
    const data = JSON.parse(readFileSync(SOURCE_SYNC_STATUS_PATH, 'utf8'));
    return data && typeof data === 'object' ? data : null;
  }} catch {{
    return null;
  }}
}}

function buildSnapshotDiffRunId(checkedAt, sourceInventoryFingerprint, scope) {{
  const seed = [
    checkedAt,
    sourceInventoryFingerprint ?? '_no-inventory_',
    scope.type,
    scope.filters?.slug ?? '',
    scope.filters?.section ?? '',
  ].join('|');
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 12);
  return `${{checkedAt}}#snapshot-diff-${{digest}}`;
}}

function findHtmlFiles(dir, baseDir = dir) {{
  if (!existsSync(dir)) return [];
  return readdirSync(dir, {{ withFileTypes: true }}).flatMap((entry) => {{
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return findHtmlFiles(fullPath, baseDir);
    if (entry.name.endsWith('.html')) return [relative(baseDir, fullPath)];
    return [];
  }});
}}

function getHeadContent(relativePath) {{
  try {{
    return execFileSync('git', ['show', `HEAD:${{relativePath}}`], {{
      encoding: 'utf8',
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    }});
  }} catch (e) {{
    if (e.status === 128) return null;
    throw new Error(
      `git show failed for ${{relativePath}}: ${{e.stderr?.toString().trim() || e.message}}`
    );
  }}
}}

function diffSidebar() {{
  const sidebarRelPath = relative(ROOT, SIDEBAR_PATH);
  if (!existsSync(SIDEBAR_PATH)) {{
    return {{ changed: false, addedPages: [], removedPages: [] }};
  }}
  const headContent = getHeadContent(sidebarRelPath);
  const currentContent = readFileSync(SIDEBAR_PATH, 'utf8');
  if (!headContent) {{
    try {{
      const snapshot = JSON.parse(currentContent);
      const pages = [...extractSlugsFromSnapshot(snapshot)];
      return {{ changed: true, addedPages: pages, removedPages: [] }};
    }} catch {{
      return {{ changed: true, addedPages: [], removedPages: [], parseError: true }};
    }}
  }}
  try {{
    const headSnapshot = JSON.parse(headContent);
    const currentSnapshot = JSON.parse(currentContent);
    const headPages = extractSlugsFromSnapshot(headSnapshot);
    const currentPages = extractSlugsFromSnapshot(currentSnapshot);
    const addedPages = [...currentPages].filter((p) => !headPages.has(p));
    const removedPages = [...headPages].filter((p) => !currentPages.has(p));
    return {{
      changed: addedPages.length > 0 || removedPages.length > 0,
      addedPages,
      removedPages,
    }};
  }} catch {{
    return {{ changed: true, addedPages: [], removedPages: [], parseError: true }};
  }}
}}

// Mirror CLI main with tmp_path-based paths. buildSourceUrlIndex は空 (tmp_path
// に src/content/docs が無いため空 map)、sidebarUrlMap は SIDEBAR_URLS.md から build。
const sourceUrls = {{}};
const sidebarText = existsSync(SIDEBAR_URLS_PATH)
  ? readFileSync(SIDEBAR_URLS_PATH, 'utf8')
  : '';
const sidebarUrlMap = buildSidebarUrlMap(sidebarText);

const snapshotFiles = findHtmlFiles(CONTENT_DIR);
const analyses = snapshotFiles
  .map((file) => {{
    const slug = file.replace(/\\.html$/, '');
    const snapshotPath = join(CONTENT_DIR, `${{slug}}.html`);
    const relPath = relative(ROOT, snapshotPath);
    const currentContent = readFileSync(snapshotPath, 'utf8');
    const headContent = getHeadContent(relPath);
    const sourceUrl = sourceUrls[slug] || fallbackSourceUrl(slug, sidebarUrlMap);
    const is404 = MARKER_404_RE.test(currentContent);
    if (!headContent) {{
      if (is404) return null;
      return {{
        kind: 'change',
        change: {{ slug, type: 'page-added', sourceUrl, categories: null, diffLines: 0 }},
      }};
    }}
    if (is404 && !MARKER_404_RE.test(headContent)) {{
      return {{
        kind: 'change',
        change: {{ slug, type: 'page-removed', sourceUrl, categories: null, diffLines: 0 }},
      }};
    }}
    if (headContent === currentContent) {{
      return {{ kind: 'unchanged' }};
    }}
    const {{ categories, diffLines }} = classifyChanges(headContent, currentContent);
    return {{
      kind: 'change',
      change: {{ slug, type: 'page-changed', sourceUrl, categories, diffLines }},
    }};
  }})
  .filter(Boolean);

const unchanged = analyses.filter((entry) => entry.kind === 'unchanged').length;
const changes = analyses.flatMap((entry) => (entry.kind === 'change' ? [entry.change] : []));
const sidebar = diffSidebar();
const scopedTotal = snapshotFiles.length;

const checkedAt = FIXED_CHECKED_AT;
const runScope = buildRunScope({{ slug: null, section: null }});
const sourceSyncPayload = readSourceSyncPayload();
const sourceInventoryFingerprint =
  typeof sourceSyncPayload?.sourceInventoryFingerprint === 'string'
    ? sourceSyncPayload.sourceInventoryFingerprint
    : null;
const sourceSyncRunId =
  typeof sourceSyncPayload?.runId === 'string' ? sourceSyncPayload.runId : null;
const runId = buildSnapshotDiffRunId(checkedAt, sourceInventoryFingerprint, runScope);

const report = {{
  schemaVersion: SNAPSHOT_DIFF_SCHEMA_VERSION,
  runId,
  sourceSyncRunId,
  sourceInventoryFingerprint,
  runScope,
  checkedAt,
  summary: {{
    totalSnapshots: scopedTotal,
    changed: changes.filter((c) => c.type === 'page-changed').length,
    added: changes.filter((c) => c.type === 'page-added').length,
    removed: changes.filter((c) => c.type === 'page-removed').length,
    unchanged,
    runScope,
  }},
  changes: changes.sort((a, b) => (b.diffLines || 0) - (a.diffLines || 0)),
  sidebar,
}};

writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2) + '\\n');
process.stdout.write('ok\\n');
"""


def _write_driver(
    tmp_path: Path,
    repo_root: Path,
    *,
    checked_at: str,
) -> Path:
    snap_mjs = repo_root / "scripts" / "detection" / "snapshot_diff.mjs"
    madcap_toc_mjs = repo_root / "scripts" / "lib" / "madcap_toc.mjs"
    sync_health_mjs = repo_root / "scripts" / "lib" / "source_sync_health.mjs"
    driver_src = _DRIVER_SCRIPT.format(
        snap_mjs=snap_mjs.as_posix(),
        madcap_toc_mjs=madcap_toc_mjs.as_posix(),
        sync_health_mjs=sync_health_mjs.as_posix(),
        root_json=json.dumps(str(tmp_path)),
        checked_at_json=json.dumps(checked_at),
    )
    driver_path = tmp_path / "_driver.mjs"
    driver_path.write_text(driver_src, encoding="utf-8")
    return driver_path


def _run_mjs(driver: Path, repo_root: Path) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["node", str(driver)],
        capture_output=True,
        text=True,
        check=False,
        cwd=str(repo_root),
        timeout=60,
    )
    return proc.returncode, proc.stdout, proc.stderr


def _run_git(tmp_path: Path, *args: str) -> None:
    """Run a git command inside ``tmp_path`` with noop user identity."""
    subprocess.run(
        [
            "git",
            "-c",
            "user.email=e2e@example.com",
            "-c",
            "user.name=E2E",
            "-c",
            "commit.gpgsign=false",
            *args,
        ],
        cwd=str(tmp_path),
        check=True,
        capture_output=True,
    )


def _init_repo(tmp_path: Path) -> None:
    """Initialize a fresh git repo with an empty commit so HEAD exists."""
    subprocess.run(
        ["git", "init", "--quiet", "--initial-branch=main"],
        cwd=str(tmp_path),
        check=True,
        capture_output=True,
    )
    # gitignore: ignore _driver.mjs, source-sync-status.json, snapshot-diff-status.json
    (tmp_path / ".gitignore").write_text(
        "_driver.mjs\nsource-sync-status.json\nsnapshot-diff-status.json\n",
        encoding="utf-8",
    )
    _run_git(tmp_path, "add", ".gitignore")
    _run_git(tmp_path, "commit", "--quiet", "-m", "init")


def _commit_all(tmp_path: Path, msg: str) -> None:
    _run_git(tmp_path, "add", "-A")
    _run_git(tmp_path, "commit", "--quiet", "-m", msg)


def _patch_py_paths(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    """Python CLI の module-level path 定数を tmp_path に差し替える。"""
    monkeypatch.setattr(snap_mod, "ROOT_DIR", tmp_path)
    monkeypatch.setattr(snap_mod, "_SNAPSHOTS_DIR", tmp_path / "snapshots" / "en")
    monkeypatch.setattr(snap_mod, "_CONTENT_DIR", tmp_path / "snapshots" / "en" / "content")
    monkeypatch.setattr(snap_mod, "_SIDEBAR_PATH", tmp_path / "snapshots" / "en" / "sidebar.json")
    monkeypatch.setattr(snap_mod, "_SIDEBAR_URLS_PATH", tmp_path / "docs" / "SIDEBAR_URLS.md")
    monkeypatch.setattr(snap_mod, "_SOURCE_SYNC_STATUS_PATH", tmp_path / "source-sync-status.json")
    monkeypatch.setattr(snap_mod, "_OUTPUT_PATH", tmp_path / "snapshot-diff-status.json")
    monkeypatch.setattr(snap_mod, "DOCS_DIR", tmp_path / "src" / "content" / "docs")


def _normalize_report(report: dict[str, Any]) -> dict[str, Any]:
    """volatile top-level fields を除去して比較。checkedAt / runId は fixture で
    明示的に同一化しているが、defensive に strip する。"""
    normalized = {k: v for k, v in report.items() if k not in {"checkedAt", "runId"}}
    return normalized


def _force_checked_at_for_py(monkeypatch: pytest.MonkeyPatch, checked_at: str) -> None:
    """Python 側で ``datetime.now(tz=UTC)`` が fixture 固定値を返すように stub する。

    ``snapshot_diff.main`` 内部の ``now = datetime.now(tz=UTC)`` を再現可能に
    するため ``checked_at`` (``YYYY-MM-DDTHH:MM:SS.sssZ``) を分解して datetime を
    組み立てる。
    """
    from datetime import datetime

    # FIXED_CHECKED_AT format: ``2026-04-22T10:00:00.000Z``
    # ISO 8601 の Z suffix は ``+00:00`` に置換してから fromisoformat。
    iso_utc = checked_at.replace("Z", "+00:00")
    fixed_dt = datetime.fromisoformat(iso_utc).astimezone(UTC)

    class _FrozenDateTime(datetime):
        @classmethod
        def now(cls, tz=None):  # type: ignore[override]
            if tz is None:
                return fixed_dt.replace(tzinfo=None)
            return fixed_dt.astimezone(tz)

    monkeypatch.setattr(snap_mod, "datetime", _FrozenDateTime)


@pytest.mark.integration
def test_snapshot_diff_all_unchanged_parity(
    tmp_path: Path,
    repo_root: Path,
    node_available: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """working tree と HEAD が完全一致 → unchanged count のみ、changes=[]。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    _init_repo(tmp_path)
    (tmp_path / "snapshots" / "en" / "content" / "overview").mkdir(parents=True)
    (tmp_path / "snapshots" / "en" / "content" / "overview" / "intro.html").write_text(
        "<p>hello</p>\n", encoding="utf-8"
    )
    _commit_all(tmp_path, "baseline snapshot")

    checked_at = "2026-04-22T10:00:00.000Z"
    _patch_py_paths(monkeypatch, tmp_path)
    _force_checked_at_for_py(monkeypatch, checked_at)
    py_exit = snap_mod.main(["--json"])
    assert py_exit == 0
    py_report = json.loads((tmp_path / "snapshot-diff-status.json").read_text(encoding="utf-8"))

    driver = _write_driver(tmp_path, repo_root, checked_at=checked_at)
    mjs_exit, _mjs_out, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_exit == 0, f"mjs stderr: {mjs_stderr}"
    mjs_report = json.loads((tmp_path / "snapshot-diff-status.json").read_text(encoding="utf-8"))

    assert _normalize_report(py_report) == _normalize_report(mjs_report), (
        "snapshot-diff-status.json structural drift"
    )
    assert py_report["summary"]["unchanged"] == 1
    assert py_report["summary"]["changed"] == 0
    assert py_report["changes"] == []


@pytest.mark.integration
def test_snapshot_diff_changed_and_added_parity(
    tmp_path: Path,
    repo_root: Path,
    node_available: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """HEAD に含まれる 1 page を working tree で変更 + 1 page 新規追加 → changed+added 各 1。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    _init_repo(tmp_path)
    content_dir = tmp_path / "snapshots" / "en" / "content" / "overview"
    content_dir.mkdir(parents=True)
    (content_dir / "intro.html").write_text("<h1>Intro</h1>\n<p>body</p>\n", encoding="utf-8")
    _commit_all(tmp_path, "baseline snapshot")

    # working tree 側: intro.html を変更 + newpage.html を追加
    (content_dir / "intro.html").write_text(
        "<h1>Intro v2</h1>\n<p>body</p>\n<p>extra</p>\n", encoding="utf-8"
    )
    (content_dir / "newpage.html").write_text("<p>new</p>\n", encoding="utf-8")

    checked_at = "2026-04-22T10:00:00.000Z"

    # --- Python 側 ---
    _patch_py_paths(monkeypatch, tmp_path)
    _force_checked_at_for_py(monkeypatch, checked_at)
    py_exit = snap_mod.main(["--json"])
    assert py_exit == 0
    py_report = json.loads((tmp_path / "snapshot-diff-status.json").read_text(encoding="utf-8"))

    # --- mjs 側 ---
    driver = _write_driver(tmp_path, repo_root, checked_at=checked_at)
    mjs_exit, _mjs_out, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_exit == 0, f"mjs stderr: {mjs_stderr}"
    mjs_report = json.loads((tmp_path / "snapshot-diff-status.json").read_text(encoding="utf-8"))

    assert _normalize_report(py_report) == _normalize_report(mjs_report), (
        "snapshot-diff-status.json structural drift"
    )
    # counters sanity check (両 CLI 等しいことは上で確認済)
    assert py_report["summary"]["changed"] == 1
    assert py_report["summary"]["added"] == 1


@pytest.mark.integration
def test_snapshot_diff_removed_404_marker_parity(
    tmp_path: Path,
    repo_root: Path,
    node_available: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """HEAD に正常ページがあり、working tree で 404 marker に置換 → page-removed 1。"""
    if not node_available:
        pytest.skip("node not available; cross-runtime parity requires node")

    _init_repo(tmp_path)
    content_dir = tmp_path / "snapshots" / "en" / "content" / "overview"
    content_dir.mkdir(parents=True)
    (content_dir / "page.html").write_text("<p>normal</p>\n", encoding="utf-8")
    _commit_all(tmp_path, "baseline snapshot")

    # working tree 側を 404 marker に置換
    (content_dir / "page.html").write_text("<!-- 404: page not found -->\n", encoding="utf-8")

    checked_at = "2026-04-22T10:00:00.000Z"
    _patch_py_paths(monkeypatch, tmp_path)
    _force_checked_at_for_py(monkeypatch, checked_at)
    py_exit = snap_mod.main(["--json"])
    assert py_exit == 0
    py_report = json.loads((tmp_path / "snapshot-diff-status.json").read_text(encoding="utf-8"))

    driver = _write_driver(tmp_path, repo_root, checked_at=checked_at)
    mjs_exit, _mjs_out, mjs_stderr = _run_mjs(driver, repo_root)
    assert mjs_exit == 0, f"mjs stderr: {mjs_stderr}"
    mjs_report = json.loads((tmp_path / "snapshot-diff-status.json").read_text(encoding="utf-8"))

    assert _normalize_report(py_report) == _normalize_report(mjs_report), (
        "snapshot-diff-status.json structural drift"
    )
    assert py_report["summary"]["removed"] == 1
