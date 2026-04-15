// scripts/__tests__/phase2_baseline.test.mjs
/**
 * Phase 2 baseline util — enSideArtifact 分類契約が Phase 4 registry 一本化後も
 * 維持されていることの regression test。
 *
 * Context: Phase 4 で runtime registry に一本化した際、`categorizeToken` が
 * legacy typo tokens (`-variable`, `-this`, `step.This`) を静かに `cliFlag` /
 * `other` に落としていたため、enumerate_token_gaps 出力の分類が気付かれず
 * 変わっていた。Phase 4 registry (slug-scope) と phase2 の token-only 分類を
 * 意図的に分けて保持する契約を pin する。
 */

import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let categorizeToken;

before(async () => {
  ({ categorizeToken } = await import('../phase2/lib/baseline.mjs'));
});

describe('categorizeToken — Phase 2 legacy typo tokens (enSideArtifact 互換)', () => {
  it('classifies -variable as enSideArtifact', () => {
    assert.equal(categorizeToken('-variable'), 'enSideArtifact');
  });
  it('classifies -this as enSideArtifact', () => {
    assert.equal(categorizeToken('-this'), 'enSideArtifact');
  });
  it('classifies step.This as enSideArtifact', () => {
    assert.equal(categorizeToken('step.This'), 'enSideArtifact');
  });
});

describe('categorizeToken — Phase 4 registry tokens', () => {
  it('classifies /docs/index as enSideArtifact (registry token)', () => {
    assert.equal(categorizeToken('/docs/index'), 'enSideArtifact');
  });
  it('classifies http://google.com as enSideArtifact (registry token)', () => {
    assert.equal(categorizeToken('http://google.com'), 'enSideArtifact');
  });
});

describe('categorizeToken — 他 category (回帰防止)', () => {
  it('classifies --project-id as cliFlag', () => {
    assert.equal(categorizeToken('--project-id'), 'cliFlag');
  });
  it('classifies -f as cliFlag', () => {
    assert.equal(categorizeToken('-f'), 'cliFlag');
  });
  it('classifies /docs/api-access as internalLink', () => {
    assert.equal(categorizeToken('/docs/api-access'), 'internalLink');
  });
  it('classifies 1000ms as numericOrUnit', () => {
    assert.equal(categorizeToken('1000ms'), 'numericOrUnit');
  });
  it('classifies https://example.com as externalUrl', () => {
    assert.equal(categorizeToken('https://example.com'), 'externalUrl');
  });
  it('classifies unknown token as other', () => {
    assert.equal(categorizeToken('Ctrl+S'), 'other');
  });
  it('returns other for empty / null / undefined', () => {
    assert.equal(categorizeToken(''), 'other');
    assert.equal(categorizeToken(null), 'other');
    assert.equal(categorizeToken(undefined), 'other');
  });
});
