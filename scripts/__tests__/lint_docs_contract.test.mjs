/**
 * lint_docs contract test — Phase 5 coexistence 期間限定の Node-side 回帰 guard。
 *
 * PR #384 code-comment [P2] 対応: `lint:docs` は Phase 6 cutover まで
 * `node scripts/tools/lint_docs.mjs` を実行する契約。Python 側 (test_lint_docs.py)
 * と同じ contract を mjs 側でも pin し、coexistence 期間中に lint_docs.mjs が
 * silent に regress しないことを保証する。
 *
 * **Scope**: `callout-in-list-item` / `callout-unknown-type` + code fence skip の
 * minimum contract のみ (他の rule は lint の本番 corpus run で暗黙検証)。
 * Phase 6 cutover 時に Python に切り替わり次第、本 file も削除する。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkCallouts,
  lintContent,
} from '../tools/lint_docs.mjs';

function collectCalloutIssues(body) {
  const issues = [];
  const reporter = {
    err: (rule, message, line = null) => {
      issues.push({ rule, message, line, level: 'error' });
    },
    warn: () => {},
  };
  checkCallouts(body, 1, reporter);
  return issues;
}

function makeDoc(body) {
  return [
    '---',
    "title: 'Test Page'",
    "description: 'A description.'",
    "category: 'Overview'",
    "updated: '2026-01-01'",
    "sourceUrl: 'https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm'",
    '---',
    '',
    body,
  ].join('\n');
}

describe('callout-unknown-type', () => {
  it('errors on unknown callout type at top level', () => {
    const issues = collectCalloutIssues(':::bogus\nContent\n:::\n');
    const unknown = issues.find((i) => i.rule === 'callout-unknown-type');
    assert.ok(unknown, 'expected callout-unknown-type error');
  });

  it('does not error on known types', () => {
    for (const type of ['note', 'caution', 'warning', 'tip', 'danger', 'info']) {
      const issues = collectCalloutIssues(`:::${type}\nContent\n:::\n`);
      assert.equal(
        issues.filter((i) => i.rule === 'callout-unknown-type').length,
        0,
        `unexpected error for known type ${type}`,
      );
    }
  });

  it('skips unknown callout inside code fence (meta example)', () => {
    const body = '```md\n:::bogus-type\ncontent\n:::\n```\n';
    const issues = collectCalloutIssues(body);
    assert.equal(
      issues.filter((i) => i.rule === 'callout-unknown-type').length,
      0,
      'code fence content must not trigger callout-unknown-type',
    );
  });

  it('detects unknown callout after code fence (state recovery)', () => {
    const body =
      '```md\n:::example-only\n:::\n```\n\n:::bogus\nreal violation\n:::\n';
    const issues = collectCalloutIssues(body);
    const hits = issues.filter((i) => i.rule === 'callout-unknown-type');
    assert.equal(hits.length, 1);
    assert.ok(hits[0].message.includes('bogus'));
  });
});

describe('callout-in-list-item', () => {
  it('errors on callout nested under list item', () => {
    const body = '- item one\n  :::note\n  body\n  :::\n- item two\n';
    const issues = collectCalloutIssues(body);
    const nested = issues.find((i) => i.rule === 'callout-in-list-item');
    assert.ok(nested, 'expected callout-in-list-item error');
  });

  it('errors on callout nested under ordered list item', () => {
    const body = '1. step\n   :::warning\n   body\n   :::\n2. next\n';
    const issues = collectCalloutIssues(body);
    assert.ok(
      issues.find((i) => i.rule === 'callout-in-list-item'),
      'expected error on ordered list nested callout',
    );
  });

  it('does not error on top-level callout (no leading whitespace)', () => {
    const body = ':::note\nBody\n:::\n';
    const issues = collectCalloutIssues(body);
    assert.equal(
      issues.filter((i) => i.rule === 'callout-in-list-item').length,
      0,
    );
  });

  it('skips nested callout inside code fence (meta example)', () => {
    const body = '```md\n- item\n  :::note\n  nested\n  :::\n```\n';
    const issues = collectCalloutIssues(body);
    assert.equal(
      issues.filter((i) => i.rule === 'callout-in-list-item').length,
      0,
      'code fence content must not trigger callout-in-list-item',
    );
  });

  it('detects nested callout after code fence (state recovery)', () => {
    const body =
      '```md\n- item\n  :::note\n  :::\n```\n\n' +
      '- real item\n  :::note\n  body\n  :::\n';
    const issues = collectCalloutIssues(body);
    assert.ok(
      issues.find((i) => i.rule === 'callout-in-list-item'),
      'expected error on real nested callout after fence',
    );
  });
});

describe('lintContent integration (coexistence guard)', () => {
  it('full lintContent surfaces callout-in-list-item on list-nested body', () => {
    const body = '- item\n  :::note\n  body\n  :::\n';
    const issues = lintContent(makeDoc(body), 'src/content/docs/test.md');
    assert.ok(
      issues.find((i) => i.rule === 'callout-in-list-item'),
      'lintContent must emit callout-in-list-item for nested callout',
    );
  });

  it('full lintContent stays clean for valid body', () => {
    const body = ':::note\nBody\n:::\n\n## Section\n\nPlain text.\n';
    const issues = lintContent(makeDoc(body), 'src/content/docs/test.md');
    const errors = issues.filter((i) => i.level === 'error');
    assert.equal(errors.length, 0, `unexpected errors: ${JSON.stringify(errors)}`);
  });
});
