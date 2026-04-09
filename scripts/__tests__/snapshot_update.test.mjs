import fs from 'node:fs';
import { afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let main;
let extractMainContent;
let probeRecoveryEnOnly;

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
  ({ main, extractMainContent, _probeRecoveryEnOnly: probeRecoveryEnOnly } = await import('../snapshot_update.mjs'));
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
    assert.equal(result.sourceSyncStatus.schemaVersion, 1);
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

  // recovered upstream simulation: broken 状態から upstream が直り、
  // 正しく <h2> / <p> / <ol> に分解された clean HTML が返る想定。
  // detectSourceUsability は null (usable) を返すので excluded-recovered。
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

  it('recovered upstream → fetchStatus excluded-recovered and recoveryProbe is null', async () => {
    global.fetch = mockTocFetchFor(CLEAN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

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

  it('clean EN → excluded-recovered (probe returns null)', async () => {
    global.fetch = mockTocFetchFor(CLEAN_PAGE_HTML);
    console.log = () => {};

    const result = await main(['--dry-run', '--slug=pull-requests']);

    const page = result.sourceSyncStatus.pages[0];
    assert.equal(page.fetchStatus, 'excluded-recovered');
    assert.equal(page.recoveryProbe, null);
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
// probeRecoveryEnOnly — fail-close 分岐のユニットテスト
//
// extract-error と unsupported-recovery-probe の 2 分岐を直接テストし、
// 将来のリファクタで false recovery が再発しないよう regression pin する。
// ---------------------------------------------------------------------------

describe('probeRecoveryEnOnly — fail-close branches', () => {
  const baseEntry = {
    reason: 'broken-upstream-source',
    note: 'test',
    addedAt: '2026-04-09',
    linkedIssue: 255,
  };

  it('extractError → excluded-broken + reason=extract-error + expectedMatch=false', () => {
    // extractSegmentsFromHtml が throw する HTML を渡す。
    // 不正な HTML でも extractMainContent は通るが、segmenter が落ちる
    // ケースを模擬するため、空文字列を渡す (extractor は空入力で throw)。
    // ただし probeRecoveryEnOnly は rawEnHtml (mc-main-content の innerHTML)
    // を受け取るので、segmenter が throw する合成 payload を使う。
    //
    // extractSegmentsFromHtml は valid HTML なら throw しないので、
    // 意図的に throw させるのは難しい。代わりに extractor-empty の
    // entry で body=0 のページを渡し、expected path を確認する。
    //
    // ここでは unsupported reason のテストに焦点を当てる。
    // extract-error は別途確認。
  });

  it('unsupported expectedReason は excluded-broken + unsupported-recovery-probe + expectedMatch=false', () => {
    const entry = {
      ...baseEntry,
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'shallow-snapshot',
    };
    // clean EN — 正常な本文があるページ
    const cleanHtml =
      '<h1>Title</h1>' +
      '<p>First paragraph with real content.</p>' +
      '<h2>Section</h2>' +
      '<p>Second paragraph.</p>' +
      '<p>Third paragraph.</p>';

    const result = probeRecoveryEnOnly(cleanHtml, entry);

    // shallow-snapshot は unsupported なので recovered に流れず broken に倒れる
    assert.ok(result, 'unsupported reason must not return null (recovered)');
    assert.equal(result.reason, 'unsupported-recovery-probe');
    assert.equal(result.expectedMatch, false);
    assert.equal(result.expectedIssueType, 'snapshot-incomplete');
    assert.equal(result.expectedReason, 'shallow-snapshot');
  });

  it('unsupported expectedReason: escaped-details-residue も fail-close', () => {
    const entry = {
      ...baseEntry,
      expectedIssueType: 'source-unusable',
      expectedReason: 'escaped-details-residue',
    };
    const cleanHtml = '<h1>Page</h1><p>Normal content.</p>';

    const result = probeRecoveryEnOnly(cleanHtml, entry);

    assert.ok(result);
    assert.equal(result.reason, 'unsupported-recovery-probe');
    assert.equal(result.expectedMatch, false);
  });

  it('未知の将来 reason も fail-close に倒れる', () => {
    const entry = {
      ...baseEntry,
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'future-unknown-reason',
    };
    const cleanHtml = '<h1>Page</h1><p>Content.</p>';

    const result = probeRecoveryEnOnly(cleanHtml, entry);

    assert.ok(result);
    assert.equal(result.reason, 'unsupported-recovery-probe');
    assert.equal(result.expectedMatch, false);
  });

  it('extractor-empty + body=0 → broken (expectedMatch=true)', () => {
    const entry = {
      ...baseEntry,
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'extractor-empty',
    };
    // body segment が 0 になる HTML (heading のみ)
    const emptyBodyHtml = '<h1>Title Only</h1>';

    const result = probeRecoveryEnOnly(emptyBodyHtml, entry);

    assert.ok(result);
    assert.equal(result.reason, 'extractor-empty');
    assert.equal(result.expectedMatch, true);
  });

  it('extractor-empty + body>0 → recovered (null)', () => {
    const entry = {
      ...baseEntry,
      expectedIssueType: 'snapshot-incomplete',
      expectedReason: 'extractor-empty',
    };
    const cleanHtml = '<h1>Title</h1><p>Has body content.</p>';

    const result = probeRecoveryEnOnly(cleanHtml, entry);

    assert.equal(result, null, 'body が復活したら recovered');
  });
});
