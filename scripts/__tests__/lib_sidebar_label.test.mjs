import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { extractJapaneseLabel, parseSidebarSections } from '../lib/sidebar.mjs';

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

describe('parseSidebarSections', () => {
  it('parses new domain URLs with /index.htm pattern', () => {
    const text = `## Overview（概要）

- ✅🔍 https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm
`;
    const sections = parseSidebarSections(text);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].items.length, 1);
    assert.equal(sections[0].items[0].slug, 'testim-overview');
    assert.equal(sections[0].items[0].status, '✅🔍');
  });

  it('parses new domain URLs with direct .htm pattern', () => {
    const text = `## Settings（設定）

- ✅ https://docs.tricentis.com/testim/content/settings/advanced-config.htm
`;
    const sections = parseSidebarSections(text);
    assert.equal(sections[0].items[0].slug, 'advanced-config');
  });

  it('ignores old domain URLs', () => {
    const text = `## Overview（概要）

- ✅ https://help.testim.io/docs/testim-overview
`;
    const sections = parseSidebarSections(text);
    assert.equal(sections[0].items.length, 0);
  });

  it('skips meta sections (翻訳ステータス, 検証ステータス, URL抽出方法)', () => {
    const text = `## 翻訳ステータス

- ✅ https://docs.tricentis.com/testim/content/overview/foo.htm

## Overview（概要）

- ✅ https://docs.tricentis.com/testim/content/overview/bar.htm
`;
    const sections = parseSidebarSections(text);
    assert.equal(sections.length, 1);
    assert.equal(sections[0].english, 'Overview');
  });
});
