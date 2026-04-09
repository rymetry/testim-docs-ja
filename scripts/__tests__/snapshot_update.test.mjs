import fs from 'node:fs';
import { afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let main;
let extractMainContent;
let runRecoveryProbe;

const originalFetch = global.fetch;
const originalLog = console.log;
const originalWriteFileSync = fs.writeFileSync;

function createResponse({ ok = true, status = 200, text = '' } = {}) {
  return {
    ok,
    status,
    text: async () => text,
  };
}

before(async () => {
  ({ main, extractMainContent, runRecoveryProbe } = await import('../snapshot_update.mjs'));
});

afterEach(() => {
  global.fetch = originalFetch;
  console.log = originalLog;
  fs.writeFileSync = originalWriteFileSync;
});

describe('extractMainContent', () => {
  it('extracts inner HTML from mc-main-content div', () => {
    const html = '<html><body><div id="mc-main-content" role="main"><h1>Title</h1><p>Body</p></div></body></html>';
    const result = extractMainContent(html);
    assert.equal(result, '<h1>Title</h1><p>Body</p>');
  });

  it('returns null when mc-main-content is absent', () => {
    const html = '<html><body><div>No main content</div></body></html>';
    assert.equal(extractMainContent(html), null);
  });

  it('handles nested divs inside mc-main-content', () => {
    const html = '<div id="mc-main-content"><div class="inner"><div>Deep</div></div></div>';
    const result = extractMainContent(html);
    assert.equal(result, '<div class="inner"><div>Deep</div></div>');
  });
});

describe('snapshot_update main', () => {
  it('fetches HTML content in dry-run mode', async () => {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs = "define({'/content/overview/testim-overview/index.htm':{i:[0],t:['Overview'],b:['']}});";
    const pageHtml = '<html><body><div id="mc-main-content" role="main"><h1>Testim overview</h1><p>Content</p></div></body></html>';

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      return createResponse({ text: pageHtml });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 1);
    assert.equal(result.errors, 0);
    assert.equal(result.sidebarVerified, true);
  });

  it('reports sidebar verification failure when TOC fetch fails', async () => {
    const pageHtml = '<html><body><div id="mc-main-content" role="main"><h1>Title</h1></div></body></html>';

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Data/Tocs')) return createResponse({ ok: false, status: 500 });
      return createResponse({ text: pageHtml });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 1);
    assert.equal(result.errors, 1, 'sidebar failure should count as an error');
    assert.equal(result.sidebarVerified, false);
  });

  it('includes sourceSyncStatus in main() return value', async () => {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs = "define({'/content/overview/testim-overview/index.htm':{i:[0],t:['Overview'],b:['']}});";
    const pageHtml = '<html><body><div id="mc-main-content" role="main"><h1>Title</h1></div></body></html>';

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      return createResponse({ text: pageHtml });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.ok(result.sourceSyncStatus, 'should include sourceSyncStatus');
    assert.equal(result.sourceSyncStatus.schemaVersion, 2);
    assert.equal(result.sourceSyncStatus.freshnessState, 'fresh');
    assert.equal(result.sourceSyncStatus.summary.targetPages, 1);
    assert.equal(result.sourceSyncStatus.summary.fetchedPages, 1);
    assert.equal(result.sourceSyncStatus.summary.sidebarVerified, true);
  });

  it('sets freshnessState to broken when sidebar fails', async () => {
    const pageHtml = '<html><body><div id="mc-main-content" role="main"><h1>T</h1></div></body></html>';

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Data/Tocs')) return createResponse({ ok: false, status: 500 });
      return createResponse({ text: pageHtml });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.sourceSyncStatus.freshnessState, 'broken');
    assert.equal(result.sourceSyncStatus.summary.sidebarVerified, false);
  });

  it('handles 404 response', async () => {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs = "define({'/content/overview/testim-overview/index.htm':{i:[0],t:['Overview'],b:['']}});";

    global.fetch = async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      return createResponse({ ok: false, status: 404 });
    };
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=testim-overview']);

    assert.equal(result.fetched, 0);
    assert.equal(result.notFound, 1);
  });
});

// ---------------------------------------------------------------------------
// Issue #255 Phase 3b — source-side debt exclusion wiring
//
// pull-requests は registry に登録されているので、snapshot_update は
//   1. fetch する
//   2. snapshot file を上書きしない
//   3. detectSourceUsability で recovery probe を実行する
//   4. 結果を pageResults (excluded-broken / excluded-recovered) に流す
// ---------------------------------------------------------------------------

describe('snapshot_update — source-side debt exclusion', () => {
  // broken upstream simulation: body 全体が <code> ブロックで wrap された
  // 実際の live HTML を模して、extractMainContent が extract しても body が
  // code/pre だけになるペイロード。detectSourceUsability は extractor-empty
  // を発火する (EN body segment が 0)。
  const BROKEN_PAGE_HTML =
    '<html><body><div role="main" id="mc-main-content">' +
    '<h1>Pull Requests</h1>' +
    '<div class="codeSnippet"><div class="codeSnippetBody"><pre><code>' +
    'Pull requests notify reviewers on changes introduced to a test.' +
    '</code></pre></div></div>' +
    '</div></body></html>';

  // clean upstream simulation: broken 状態から upstream が直り、
  // 正しく <h2> / <p> / <ol> に分解された clean HTML が返る想定。
  // detectSourceUsability が null を返すため excluded-recovered になる。
  const CLEAN_PAGE_HTML =
    '<html><body><div role="main" id="mc-main-content">' +
    '<h1>Pull Requests</h1>' +
    '<p>Pull requests notify reviewers on changes introduced to a test.</p>' +
    '<h2>Creating a Pull Request</h2>' +
    '<p>A pull request represents the difference between branches.</p>' +
    '<h2>Reviewing a Pull Request</h2>' +
    '<p>Reviewers are notified via email.</p>' +
    '<h2>Resubmitting a Pull Request</h2>' +
    '<p>If the reviewer sent back the PR you can respond.</p>' +
    '</div></body></html>';

  function mockTocFetchFor(pageHtml) {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs =
      "define({'/content/testops/testops-version-control/pull-requests/index.htm':{i:[0],t:['Pull Requests'],b:['']}});";

    return async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      return createResponse({ text: pageHtml });
    };
  }

  it('broken upstream → fetchStatus excluded-broken with recovery probe', async () => {
    global.fetch = mockTocFetchFor(BROKEN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    // 1 target in scope
    assert.equal(result.sourceSyncStatus.summary.targetPages, 1);
    // excluded は ok / error / not-found のどれにも count されない
    assert.equal(result.sourceSyncStatus.summary.fetchedPages, 0);
    assert.equal(result.sourceSyncStatus.summary.errorPages, 0);
    assert.equal(result.sourceSyncStatus.summary.notFoundPages, 0);
    // 新 counter
    assert.equal(result.sourceSyncStatus.summary.excludedPages, 1);
    assert.equal(result.sourceSyncStatus.summary.excludedBrokenPages, 1);
    assert.equal(result.sourceSyncStatus.summary.excludedRecoveredPages, 0);

    // page 単位に debtCategory / recoveryProbe が載っている
    const page = result.sourceSyncStatus.pages.find(
      (p) => p.slug === 'testops/testops-version-control/pull-requests',
    );
    assert.ok(page);
    assert.equal(page.fetchStatus, 'excluded-broken');
    assert.equal(page.debtCategory, 'source-side-debt');
    assert.ok(page.recoveryProbe);
    assert.equal(page.recoveryProbe.issueType, 'snapshot-incomplete');
    assert.equal(page.recoveryProbe.reason, 'extractor-empty');
    // registry の expected と一致するので true
    assert.equal(page.recoveryProbe.expectedMatch, true);

    // excluded は top-level errors に積まない
    assert.equal(result.sourceSyncStatus.errors.length, 0);
  });

  it('clean upstream → excluded-recovered (detectSourceUsability が null を返す)', async () => {
    global.fetch = mockTocFetchFor(CLEAN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    // upstream が復旧 — detectSourceUsability が issue なしと判定
    assert.equal(result.sourceSyncStatus.summary.excludedPages, 1);
    assert.equal(result.sourceSyncStatus.summary.excludedBrokenPages, 0);
    assert.equal(result.sourceSyncStatus.summary.excludedRecoveredPages, 1);

    const page = result.sourceSyncStatus.pages.find(
      (p) => p.slug === 'testops/testops-version-control/pull-requests',
    );
    assert.ok(page);
    assert.equal(page.fetchStatus, 'excluded-recovered');
    assert.equal(page.debtCategory, 'source-side-debt');
    assert.equal(page.recoveryProbe, null);
  });

  it('does not overwrite snapshot file even in non-dry-run mode', async () => {
    global.fetch = mockTocFetchFor(BROKEN_PAGE_HTML);
    console.log = () => {};

    // fs.writeFileSync を完全にスパイし、全 write 呼び出しを record するが
    // 実際のディスク書き込みは抑止する。これにより repo root 上の
    // source-sync-status.json / sidebar.json / snapshot HTML が
    // テスト実行で汚染されない。
    const writeCalls = [];
    fs.writeFileSync = (path, _content, ..._rest) => {
      writeCalls.push(String(path));
      // NOTE: 実 file には書かない — テストの目的は "どの path が write
      // 対象として渡ってくるか" を observe することのみ。
    };

    await main(['--slug=pull-requests']);

    const snapshotWrite = writeCalls.find((p) => p.includes('pull-requests.html'));
    assert.equal(
      snapshotWrite,
      undefined,
      `excluded slug の snapshot HTML を書き込んではならない — 書込発生: ${snapshotWrite}`,
    );
  });

  it('exposes excluded counter on main() return value', async () => {
    global.fetch = mockTocFetchFor(BROKEN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    // main() が新 counter を返すことを契約として pin する
    // (workflow / detection_reports から観測できるように)
    assert.equal(result.excluded, 1);
    assert.equal(result.fetched, 0);
  });

  it('debt-only run keeps freshnessState fresh (not broken)', async () => {
    global.fetch = mockTocFetchFor(BROKEN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    // excluded-only のみの scope でも sidebar さえ verified なら fresh
    assert.equal(result.sourceSyncStatus.freshnessState, 'fresh');
  });

  // --- Finding 1: EN-only probe は JA 入力に依存しない ---

  it('recovery probe は JA の有無で結果が変わらない (EN-only)', async () => {
    // JA body は collectTargets 経由で読まれるが probe には渡らない。
    // broken EN に対して excluded-broken が返ることだけを確認する。
    global.fetch = mockTocFetchFor(BROKEN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const page = result.sourceSyncStatus.pages[0];
    assert.equal(page.fetchStatus, 'excluded-broken');
    assert.equal(page.recoveryProbe.reason, 'extractor-empty');
    assert.equal(page.recoveryProbe.expectedMatch, true);
  });

  it('clean EN → excluded-recovered (detectSourceUsability returns null)', async () => {
    global.fetch = mockTocFetchFor(CLEAN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const page = result.sourceSyncStatus.pages[0];
    assert.equal(page.fetchStatus, 'excluded-recovered');
    assert.equal(page.recoveryProbe, null);
  });

  it('extractor throw in recovery probe fails closed as excluded-broken', () => {
    const result = runRecoveryProbe({
      rawEnHtml: CLEAN_PAGE_HTML,
      exclusionEntry: {
        expectedIssueType: 'snapshot-incomplete',
        expectedReason: 'extractor-empty',
      },
      extractSegments: () => {
        throw new Error('simulated extractor failure');
      },
    });

    assert.equal(result.fetchStatus, 'excluded-broken');
    assert.deepEqual(result.recoveryProbe, {
      issueType: 'probe-failed',
      reason: 'extractor-throw',
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'extractor-empty',
      expectedMatch: false,
    });
  });

  it('unsupported expectedReason in registry fails closed', () => {
    const result = runRecoveryProbe({
      rawEnHtml: CLEAN_PAGE_HTML,
      exclusionEntry: {
        expectedIssueType: 'snapshot-incomplete',
        expectedReason: 'unknown-reason',
      },
    });

    assert.equal(result.fetchStatus, 'excluded-broken');
    assert.deepEqual(result.recoveryProbe, {
      issueType: 'probe-failed',
      reason: 'unsupported-expected-reason',
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'unknown-reason',
      expectedMatch: false,
    });
  });

  it('cross-reason drift to shallow-snapshot stays excluded-broken', () => {
    const result = runRecoveryProbe({
      rawEnHtml: '<h1>Title</h1><p>A</p>',
      exclusionEntry: {
        expectedIssueType: 'snapshot-incomplete',
        expectedReason: 'extractor-empty',
      },
    });

    assert.equal(result.fetchStatus, 'excluded-broken');
    assert.deepEqual(result.recoveryProbe, {
      issueType: 'snapshot-incomplete',
      reason: 'shallow-snapshot',
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'extractor-empty',
      expectedMatch: false,
    });
  });

  // --- Finding 2: expectedMatch + actual/expected が probe output に載る ---

  it('excluded-broken probe に expectedIssueType / expectedReason / expectedMatch が載る', async () => {
    global.fetch = mockTocFetchFor(BROKEN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const probe = result.sourceSyncStatus.pages[0].recoveryProbe;
    assert.equal(probe.issueType, 'snapshot-incomplete');
    assert.equal(probe.reason, 'extractor-empty');
    assert.equal(probe.expectedIssueType, 'snapshot-incomplete');
    assert.equal(probe.expectedReason, 'extractor-empty');
    assert.equal(probe.expectedMatch, true);
  });
});

// ---------------------------------------------------------------------------
// excluded-fetch-error — fetch 失敗を source-sync 劣化として可視化
// ---------------------------------------------------------------------------

describe('snapshot_update — excluded-fetch-error', () => {
  function mockTocWithFetchError() {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs =
      "define({'/content/testops/testops-version-control/pull-requests/index.htm':{i:[0],t:['Pull Requests'],b:['']}});";

    return async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      // excluded slug の fetch が HTTP error を返す
      return createResponse({ ok: false, status: 500 });
    };
  }

  function mockTocWithFetchThrow() {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs =
      "define({'/content/testops/testops-version-control/pull-requests/index.htm':{i:[0],t:['Pull Requests'],b:['']}});";

    return async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      throw new Error('simulated network failure');
    };
  }

  it('excluded slug + HTTP error → excluded-fetch-error', async () => {
    global.fetch = mockTocWithFetchError();
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const page = result.sourceSyncStatus.pages.find(
      (p) => p.slug === 'testops/testops-version-control/pull-requests',
    );
    assert.ok(page);
    assert.equal(page.fetchStatus, 'excluded-fetch-error');
    assert.equal(page.debtCategory, 'source-side-debt');
    assert.equal(page.recoveryProbe, null);
    assert.ok(page.errorDetail);
  });

  it('excluded slug + fetch throw → excluded-fetch-error', async () => {
    global.fetch = mockTocWithFetchThrow();
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const page = result.sourceSyncStatus.pages.find(
      (p) => p.slug === 'testops/testops-version-control/pull-requests',
    );
    assert.ok(page);
    assert.equal(page.fetchStatus, 'excluded-fetch-error');
    assert.equal(page.debtCategory, 'source-side-debt');
    assert.equal(page.errorDetail, 'simulated network failure');
  });

  it('debt-only run + excluded-fetch-error → freshnessState broken', async () => {
    global.fetch = mockTocWithFetchError();
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    // fetch error は freshness 劣化 — fresh ではなく broken になる
    assert.equal(result.sourceSyncStatus.freshnessState, 'broken');
    assert.equal(result.errors, 1);
  });

  it('errors[] に excluded-fetch-error の slug が載る', async () => {
    global.fetch = mockTocWithFetchError();
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const errorEntry = result.sourceSyncStatus.errors.find(
      (e) => e.slug === 'testops/testops-version-control/pull-requests',
    );
    assert.ok(errorEntry, 'excluded-fetch-error must appear in top-level errors');
    assert.ok(errorEntry.detail);
  });

  it('excluded-fetch-error は excludedPages counter に含まれない', async () => {
    global.fetch = mockTocWithFetchError();
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    // fetch 失敗は errorPages に計上、excludedPages には含まない
    assert.equal(result.sourceSyncStatus.summary.excludedPages, 0);
    assert.equal(result.sourceSyncStatus.summary.errorPages, 1);
  });
});

// ---------------------------------------------------------------------------
// recovery probe — JA 非依存の synthetic segments テスト
// ---------------------------------------------------------------------------

describe('snapshot_update — recovery probe JA independence', () => {
  const BROKEN_PAGE_HTML =
    '<html><body><div role="main" id="mc-main-content">' +
    '<h1>Pull Requests</h1>' +
    '<div class="codeSnippet"><div class="codeSnippetBody"><pre><code>' +
    'Pull requests notify reviewers on changes introduced to a test.' +
    '</code></pre></div></div>' +
    '</div></body></html>';

  const CLEAN_PAGE_HTML =
    '<html><body><div role="main" id="mc-main-content">' +
    '<h1>Pull Requests</h1>' +
    '<p>Pull requests notify reviewers on changes introduced to a test.</p>' +
    '<h2>Creating a Pull Request</h2>' +
    '<p>A pull request represents the difference between branches.</p>' +
    '<h2>Reviewing a Pull Request</h2>' +
    '<p>Reviewers are notified via email.</p>' +
    '<h2>Resubmitting a Pull Request</h2>' +
    '<p>If the reviewer sent back the PR you can respond.</p>' +
    '</div></body></html>';

  function mockTocFetchFor(pageHtml) {
    const tocMainJs = "define({numchunks:1,prefix:'Mock_Chunk',tree:{n:[{i:0,c:0}]}});";
    const tocChunkJs =
      "define({'/content/testops/testops-version-control/pull-requests/index.htm':{i:[0],t:['Pull Requests'],b:['']}});";

    return async (url) => {
      const href = String(url);
      if (href.includes('Main.js')) return createResponse({ text: tocMainJs });
      if (href.includes('Mock_Chunk0.js')) return createResponse({ text: tocChunkJs });
      return createResponse({ text: pageHtml });
    };
  }

  it('broken EN → excluded-broken regardless of JA content (synthetic JA)', async () => {
    // probe は synthetic JA segments を使うため、実 JA ファイルの内容に
    // 依存しない。broken EN は常に excluded-broken になる。
    global.fetch = mockTocFetchFor(BROKEN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const page = result.sourceSyncStatus.pages[0];
    assert.equal(page.fetchStatus, 'excluded-broken');
    assert.equal(page.recoveryProbe.reason, 'extractor-empty');
    assert.equal(page.recoveryProbe.expectedMatch, true);
  });

  it('clean EN → excluded-recovered (detector が null を返す)', async () => {
    global.fetch = mockTocFetchFor(CLEAN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const page = result.sourceSyncStatus.pages[0];
    assert.equal(page.fetchStatus, 'excluded-recovered');
    assert.equal(page.recoveryProbe, null);
  });
});
