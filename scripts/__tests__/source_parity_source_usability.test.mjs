/**
 * Unit tests for detectSourceUsability (Issue #247 PR3).
 *
 * 設計書 §4.5.1 に対応。純粋関数として detector を直接呼ぶ。
 * extractError を含む全引数パターンをカバーする。
 *
 * `raw=N` 表記: rawEnHtml.length が想定する byte 数。
 * MAX_EN_RAW_HTML_FOR_SHALLOW=800 との関係を明示するため。
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let detectSourceUsability;

before(async () => {
  ({ detectSourceUsability } = await import('../lib/source_parity_source_usability.mjs'));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * rawEnHtml 文字列を指定バイト数になるよう空白でパディングして返す。
 * escaped details が含まれない clean HTML を合成するのに使う。
 */
function makeCleanHtml(length) {
  const base = '<html><body><p>content</p></body></html>';
  if (base.length >= length) return base.slice(0, length);
  return base + ' '.repeat(length - base.length);
}

/**
 * escaped details marker を含む rawEnHtml を合成する。
 * `<p>&lt;/details&gt;</p>` (orphan close) を末尾に付ける。
 */
function makeHtmlWithEscapedDetails(length) {
  const escaped = '<html><body><p>text</p><p>&lt;/details&gt;</p></body></html>';
  if (escaped.length >= length) return escaped;
  return escaped + ' '.repeat(length - escaped.length);
}

/**
 * heading segment を作る最小 stub。
 */
function makeHeadingSeg(sectionPath = '__root__') {
  return { segmentKind: 'heading', sectionPath, rawText: 'Heading' };
}

/**
 * body (non-heading) segment を作る最小 stub。
 */
function makeBodySeg(sectionPath = '__root__') {
  return { segmentKind: 'paragraph', sectionPath, rawText: 'body text' };
}

/**
 * n 個の body segment 配列を返す。
 */
function bodySegs(n, sectionPath = '__root__') {
  return Array.from({ length: n }, () => makeBodySeg(sectionPath));
}

/**
 * n 個の heading + m 個の body segment を混合した配列を返す。
 */
function mixedSegs(headings, body) {
  return [
    ...Array.from({ length: headings }, () => makeHeadingSeg()),
    ...Array.from({ length: body }, () => makeBodySeg()),
  ];
}

// ---------------------------------------------------------------------------
// ガード (入力バリデーション)
// ---------------------------------------------------------------------------

describe('detectSourceUsability — ガード', () => {
  it('空入力ガード: rawEnHtml が空文字のとき null を返す', () => {
    const result = detectSourceUsability({
      rawEnHtml: '',
      enSegments: [],
      jaSegments: [],
    });
    assert.equal(result, null);
  });

  it('null/undefined ガード: rawEnHtml=null のとき null を返す', () => {
    const result = detectSourceUsability({
      rawEnHtml: null,
      enSegments: [],
      jaSegments: [],
    });
    assert.equal(result, null);
  });

  it('非文字列ガード: rawEnHtml=123 のとき null を返す', () => {
    const result = detectSourceUsability({
      rawEnHtml: 123,
      enSegments: [],
      jaSegments: [],
    });
    assert.equal(result, null);
  });

  it('非配列ガード: enSegments=null のとき null を返す', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(500),
      enSegments: null,
      jaSegments: [],
    });
    assert.equal(result, null);
  });

  it('非配列ガード: jaSegments=undefined のとき null を返す', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(500),
      enSegments: [],
      jaSegments: undefined,
    });
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// usable: 正常ページ (Layer 1/2/3 いずれも発火しない)
// ---------------------------------------------------------------------------

describe('detectSourceUsability — usable (null を返す)', () => {
  it('usable: 通常ページ (raw=5000, en=10 body + 5 heading, ja=10 body + 5 heading)', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(5000),
      enSegments: mixedSegs(5, 10),
      jaSegments: mixedSegs(5, 10),
      extractError: null,
    });
    assert.equal(result, null);
  });

  it('usable: 両方短いページ stub (raw=300, en=1 body, ja=1 body) — 誤検知ガード', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(300),
      enSegments: mixedSegs(1, 1),
      jaSegments: mixedSegs(1, 1),
    });
    assert.equal(result, null);
  });

  it('usable: enBody=3 (MAX_EN_BODY_FOR_SHALLOW=2 超え, raw<=800)', () => {
    // enBody=3 > MAX_EN_BODY_FOR_SHALLOW=2 で Layer 3 は発火しない
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(400),
      enSegments: bodySegs(3),
      jaSegments: bodySegs(8),
    });
    assert.equal(result, null);
  });

  it('usable: thin-not-shallow (raw=900, body=1, ja=12) — raw>800 で thin source 不成立', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(900),
      enSegments: bodySegs(1),
      jaSegments: bodySegs(12),
    });
    assert.equal(result, null);
  });

  it('usable: debugging-overview 仮想 drift (raw=832, heading=0, ja=5) — §4.6.3 root cause', () => {
    // raw=832 > 800 なので thin source 不成立 → Layer 3 発火しない
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(832),
      enSegments: bodySegs(1), // heading=0
      jaSegments: bodySegs(5),
    });
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// Layer 2: escaped-details-residue (最優先)
// ---------------------------------------------------------------------------

describe('detectSourceUsability — Layer 2: escaped-details-residue', () => {
  it('faq ライク: rawEnHtml に orphan </details> を含む, enSegments body=4', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeHtmlWithEscapedDetails(2000),
      enSegments: bodySegs(4),
      jaSegments: bodySegs(5),
      extractError: null,
    });
    assert.ok(result !== null, '結果が null でないこと');
    assert.equal(result.type, 'source-unusable');
    assert.equal(result.usabilitySignals.reason, 'escaped-details-residue');
  });

  it('Layer 2 は Layer 1 より先に発火する (escaped + extractor body=0)', () => {
    // enSegments body=0 → Layer 1 条件も満たすが、Layer 2 が先に評価される
    const result = detectSourceUsability({
      rawEnHtml: makeHtmlWithEscapedDetails(2000),
      enSegments: [], // body=0
      jaSegments: bodySegs(10),
      extractError: null,
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'source-unusable', 'source-unusable が正しい (Layer 2 優先 §4.6.1)');
    assert.equal(result.usabilitySignals.reason, 'escaped-details-residue');
  });

  it('Layer 2 は extractError でも発火する (rawEnHtml single-only signal)', () => {
    // extractError があっても Layer 2 は rawEnHtml の string match だけで動く
    const result = detectSourceUsability({
      rawEnHtml: makeHtmlWithEscapedDetails(2000),
      enSegments: [],
      jaSegments: bodySegs(10),
      extractError: new Error('boom'),
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'source-unusable');
    assert.equal(result.usabilitySignals.reason, 'escaped-details-residue');
  });

  it('open escaped details marker (<details>) で発火する — <p> 先頭以外に含まれる場合', () => {
    // preprocessEnHtml は <p> の trimmed 先頭が &lt;details&gt; のときのみ unescape する。
    // "see &lt;details&gt; section" のように途中に含まれる場合は unescape されず残る。
    const htmlWithEmbeddedOpen = makeCleanHtml(2000).replace(
      '<p>content</p>',
      '<p>See &lt;details&gt; section for info</p>',
    );
    const result = detectSourceUsability({
      rawEnHtml: htmlWithEmbeddedOpen,
      enSegments: bodySegs(3),
      jaSegments: bodySegs(5),
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'source-unusable');
    assert.equal(result.usabilitySignals.reason, 'escaped-details-residue');
  });
});

// ---------------------------------------------------------------------------
// Layer 1: extractor-empty (clean HTML 前提)
// ---------------------------------------------------------------------------

describe('detectSourceUsability — Layer 1: extractor-empty', () => {
  it('clean HTML + body=0, ja=12 → snapshot-incomplete/extractor-empty', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(2000),
      enSegments: [], // body=0
      jaSegments: bodySegs(12),
      extractError: null,
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'snapshot-incomplete');
    assert.equal(result.usabilitySignals.reason, 'extractor-empty');
  });

  it('extractor-empty + JA も短い (ja=2 < MIN_JA_BODY_FOR_EXTRACTOR_EMPTY=3) → null', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(2000),
      enSegments: [],
      jaSegments: bodySegs(2),
    });
    assert.equal(result, null);
  });

  it('extractor-empty は extractError ありでは発火しない (Layer 1 skip §4.6.2)', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(2000),
      enSegments: [],
      jaSegments: bodySegs(10),
      extractError: new Error('boom'),
    });
    assert.equal(result, null, 'extractError があるとき Layer 1 は skip される');
  });

  it('extractor-empty: MIN_JA_BODY_FOR_EXTRACTOR_EMPTY=3 の境界 (ja=3 → 発火)', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(2000),
      enSegments: [],
      jaSegments: bodySegs(3),
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'snapshot-incomplete');
    assert.equal(result.usabilitySignals.reason, 'extractor-empty');
  });
});

// ---------------------------------------------------------------------------
// Layer 3: shallow-snapshot (clean HTML + thin source 必須)
// ---------------------------------------------------------------------------

describe('detectSourceUsability — Layer 3: shallow-snapshot', () => {
  it('salesforce-testing-overview ライク (raw=361, body=1, ja=12) → snapshot-incomplete/shallow-snapshot', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(361),
      enSegments: bodySegs(1), // heading=0
      jaSegments: bodySegs(12),
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'snapshot-incomplete');
    assert.equal(result.usabilitySignals.reason, 'shallow-snapshot');
  });

  it('境界 raw=800 ぴったり (包含側) → snapshot-incomplete/shallow-snapshot', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(800),
      enSegments: bodySegs(2),
      jaSegments: bodySegs(8),
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'snapshot-incomplete');
    assert.equal(result.usabilitySignals.reason, 'shallow-snapshot');
  });

  it('thin source なし raw=801 → null (raw>800 で thin source 不成立 §4.6.3)', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(801),
      enSegments: bodySegs(2),
      jaSegments: bodySegs(8),
    });
    assert.equal(result, null);
  });

  it('ratio=4 ぴったり (raw=400, en=2, ja=8) → snapshot-incomplete/shallow-snapshot', () => {
    // ratio = max(2,1) * 4 = 8 → ja=8 は境界値で満たす
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(400),
      enSegments: bodySegs(2),
      jaSegments: bodySegs(8),
    });
    assert.ok(result !== null);
    assert.equal(result.type, 'snapshot-incomplete');
    assert.equal(result.usabilitySignals.reason, 'shallow-snapshot');
  });

  it('ratio=3.9 (en=2, ja=7, raw=400) → null (ratio < MIN_JA_EN_RATIO_FOR_SHALLOW=4)', () => {
    // ratio = ja/max(en,1) = 7/2 = 3.5 < 4
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(400),
      enSegments: bodySegs(2),
      jaSegments: bodySegs(7),
    });
    assert.equal(result, null);
  });

  it('ja body < MIN_JA_BODY_FOR_SHALLOW=5 (ja=4) → null', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(400),
      enSegments: bodySegs(1),
      jaSegments: bodySegs(4),
    });
    assert.equal(result, null);
  });

  it('shallow-snapshot: en=0 のとき max(0,1)=1 を ratio 計算の分母に使う', () => {
    // en=0, ja=4 → ratio = 4/max(0,1) = 4/1 = 4 → 境界値 (満たす)
    // ただし Layer 1 が先に発火するはず (body=0, ja>=3)
    // clean HTML でこのパターンは Layer 1 が取る。Layer 1 より Layer 3 を
    // 単独でテストするには ja=3 未満が必要 — ここは Layer 1 vs Layer 3 の
    // 順序依存を確認するケース。
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(400),
      enSegments: [], // body=0
      jaSegments: bodySegs(12),
    });
    // Layer 1 が先に発火する
    assert.ok(result !== null);
    assert.equal(result.usabilitySignals.reason, 'extractor-empty');
  });

  it('shallow-snapshot は extractError ありでは発火しない (Layer 3 skip §4.6.2)', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(400),
      enSegments: [],
      jaSegments: bodySegs(10),
      extractError: new Error('boom'),
    });
    assert.equal(result, null, 'extractError があるとき Layer 3 は skip される');
  });
});

// ---------------------------------------------------------------------------
// payload schema pin (§4.4 frozen contract)
// ---------------------------------------------------------------------------

describe('detectSourceUsability — payload schema pin', () => {
  it('shallow-snapshot ケースのキー集合がすべて存在する', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeCleanHtml(361),
      enSegments: bodySegs(1),
      jaSegments: bodySegs(12),
    });
    assert.ok(result !== null);

    // top-level fields
    assert.ok('type' in result, 'type');
    assert.ok('severity' in result, 'severity');
    assert.ok('scope' in result, 'scope');
    assert.ok('detail' in result, 'detail');
    assert.ok('usabilitySignals' in result, 'usabilitySignals');

    // fixed values
    assert.equal(result.severity, 'actionable');
    assert.equal(result.scope, 'page');
    assert.equal(typeof result.detail, 'string');
    assert.ok(result.detail.length > 0, 'detail は空でない');

    // usabilitySignals のキー集合 (PR5 baseline identity surface)
    const s = result.usabilitySignals;
    assert.ok('enRawHtmlLength' in s, 'enRawHtmlLength');
    assert.ok('enBodySegmentCount' in s, 'enBodySegmentCount');
    assert.ok('enHeadingSegmentCount' in s, 'enHeadingSegmentCount');
    assert.ok('jaBodySegmentCount' in s, 'jaBodySegmentCount');
    assert.ok('jaHeadingSegmentCount' in s, 'jaHeadingSegmentCount');
    assert.ok('residualEscapedDetailsOpen' in s, 'residualEscapedDetailsOpen');
    assert.ok('residualEscapedDetailsClose' in s, 'residualEscapedDetailsClose');
    assert.ok('reason' in s, 'reason');
  });

  it('source-unusable ケースの reason が escaped-details-residue', () => {
    const result = detectSourceUsability({
      rawEnHtml: makeHtmlWithEscapedDetails(2000),
      enSegments: bodySegs(4),
      jaSegments: bodySegs(5),
    });
    assert.ok(result !== null);
    assert.equal(result.usabilitySignals.reason, 'escaped-details-residue');
  });

  it('usabilitySignals の数値フィールドが期待値に一致する (shallow-snapshot)', () => {
    const html = makeCleanHtml(361);
    const result = detectSourceUsability({
      rawEnHtml: html,
      enSegments: bodySegs(1),
      jaSegments: [...bodySegs(12), makeHeadingSeg()],
    });
    assert.ok(result !== null);
    const s = result.usabilitySignals;
    assert.equal(s.enRawHtmlLength, 361);
    assert.equal(s.enBodySegmentCount, 1);
    assert.equal(s.enHeadingSegmentCount, 0);
    assert.equal(s.jaBodySegmentCount, 12);
    assert.equal(s.jaHeadingSegmentCount, 1);
    assert.equal(s.residualEscapedDetailsOpen, 0);
    assert.equal(s.residualEscapedDetailsClose, 0);
    assert.equal(s.reason, 'shallow-snapshot');
  });
});
