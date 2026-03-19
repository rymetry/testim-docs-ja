import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { extractJapaneseLabel } from '../lib/sidebar.mjs';

describe('extractJapaneseLabel', () => {
  it('extracts Japanese label from parenthesized section title', () => {
    assert.equal(extractJapaneseLabel('Getting Started（はじめに）'), 'はじめに');
  });

  it('extracts from half-width parentheses', () => {
    assert.equal(extractJapaneseLabel('Overview(概要)'), '概要');
  });

  it('returns full title when no parentheses present', () => {
    assert.equal(extractJapaneseLabel('概要'), '概要');
  });

  it('trims whitespace', () => {
    assert.equal(extractJapaneseLabel('  Test（テスト）  '), 'テスト');
  });

  it('returns trimmed title for plain string', () => {
    assert.equal(extractJapaneseLabel('  Plain Title  '), 'Plain Title');
  });
});
