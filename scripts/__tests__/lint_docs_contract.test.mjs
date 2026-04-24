/**
 * lint_docs contract test — Phase 5 coexistence 期間限定の Node-side 回帰 guard。
 *
 * PR #384 code-comment [P2] 対応: `lint:docs` は Phase 6 cutover まで
 * `node scripts/tools/lint_docs.mjs` を実行する契約。Python 側 (test_lint_docs.py)
 * と同じ contract を mjs 側でも pin し、coexistence 期間中に lint_docs.mjs が
 * silent に regress しないことを保証する。
 *
 * **Scope**: callout / frontmatter / link / feature-name / image 各 rule の
 * 最小 regression。`lint:docs` 全 rule (Python 側 `test_lint_docs.py` の 78 test)
 * を 1:1 port するわけではなく、**代表的な regression pattern** を 1-2 個ずつ
 * 押さえる coexistence guard。本番 corpus の full lint ``npm run lint:docs`` で
 * detect される rule は、corpus clean 維持と `lint_docs.mjs` 改変が混在する PR
 * では silent regression が検出できないため、unit レベルで pin する必要がある。
 *
 * Phase 6 cutover 時に lint:docs が Python 実装に切り替わり次第、本 file を
 * 削除する契約 (docs/PYTHON_MIGRATION_PLAN.md Phase 6 「削除対象」参照)。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  checkCallouts,
  checkFeatureNames,
  checkFrontmatter,
  checkImages,
  checkLinks,
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
    assert.equal(
      unknown.level,
      'error',
      'callout-unknown-type must report as error severity (Python parity)',
    );
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

  it('skips unknown callout inside unlabelled code fence (``` alone)', () => {
    const body = '```\n:::bogus-type\n:::\n```\n';
    const issues = collectCalloutIssues(body);
    assert.equal(
      issues.filter((i) => i.rule === 'callout-unknown-type').length,
      0,
      'language-less code fence must still skip callout detection',
    );
  });

  it('detects unknown callout after code fence (state recovery)', () => {
    const body =
      '```md\n:::example-only\n:::\n```\n\n:::bogus\nreal violation\n:::\n';
    const issues = collectCalloutIssues(body);
    const hits = issues.filter((i) => i.rule === 'callout-unknown-type');
    assert.equal(hits.length, 1);
    assert.ok(hits[0].message.includes('bogus'));
    assert.equal(hits[0].level, 'error');
  });

  it('accepts 4-colon fence with title attribute (::::info{title="補足"})', () => {
    // 実 corpus でよく使われる形式 — `{title="..."}` attr の regex 契約 pin
    const body = '::::info{title="補足"}\nContent\n::::\n';
    const issues = collectCalloutIssues(body);
    assert.equal(
      issues.filter((i) => i.rule === 'callout-unknown-type').length,
      0,
      '4-colon fence with attribute block must NOT trigger callout-unknown-type',
    );
  });
});

describe('callout-in-list-item', () => {
  it('errors on callout nested under list item', () => {
    const body = '- item one\n  :::note\n  body\n  :::\n- item two\n';
    const issues = collectCalloutIssues(body);
    const nested = issues.find((i) => i.rule === 'callout-in-list-item');
    assert.ok(nested, 'expected callout-in-list-item error');
    assert.equal(
      nested.level,
      'error',
      'callout-in-list-item must report as error severity (Python parity)',
    );
  });

  it('errors on callout nested under ordered list item', () => {
    const body = '1. step\n   :::warning\n   body\n   :::\n2. next\n';
    const issues = collectCalloutIssues(body);
    const hit = issues.find((i) => i.rule === 'callout-in-list-item');
    assert.ok(hit, 'expected error on ordered list nested callout');
    assert.equal(hit.level, 'error');
  });

  it('triggers rule for each leading whitespace pattern (parametrized)', () => {
    // Python 側の ``test_any_leading_whitespace_triggers_rule`` と同等。
    // [ \t]+ charset の regex 契約を space x1/2/3/4 + tab で pin。
    for (const indent of [' ', '  ', '   ', '    ', '\t']) {
      const body = `- item\n${indent}:::note\n${indent}body\n${indent}:::\n`;
      const issues = collectCalloutIssues(body);
      assert.ok(
        issues.some((i) => i.rule === 'callout-in-list-item'),
        `expected callout-in-list-item for indent ${JSON.stringify(indent)}`,
      );
    }
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

// ---------------------------------------------------------------------------
// 他 rule の代表的 regression pattern (PR #384 codex review P2-2):
//   callout 以外の rule (frontmatter / link / feature-name / image) も coexistence
//   期間中に Node 側で silent regression を起こしうるため、最小 pattern を pin する。
//   Python 側 test_lint_docs.py と同等の intent を 1-2 test ずつ確認。
// ---------------------------------------------------------------------------

function collectIssues(fn, body, extra) {
  const issues = [];
  const reporter = {
    err: (rule, message, line = null) => {
      issues.push({ rule, message, line, level: 'error' });
    },
    warn: (rule, message, line = null) => {
      issues.push({ rule, message, line, level: 'warning' });
    },
  };
  fn(body, 1, reporter, extra);
  return issues;
}

describe('checkFrontmatter (coexistence guard)', () => {
  it('errors on missing sourceUrl', () => {
    const issues = [];
    const reporter = {
      err: (rule, message, line = null) => {
        issues.push({ rule, message, line, level: 'error' });
      },
      warn: () => {},
    };
    // sourceUrl を落とす
    checkFrontmatter({ title: 'T', category: 'C', updated: '2026-01-01' }, reporter);
    assert.ok(issues.find((i) => i.rule === 'sourceUrl-required'));
  });

  it('errors on sourceUrl domain mismatch', () => {
    const issues = [];
    const reporter = {
      err: (rule, message, line = null) => {
        issues.push({ rule, message, line, level: 'error' });
      },
      warn: () => {},
    };
    checkFrontmatter(
      {
        title: 'T',
        category: 'C',
        updated: '2026-01-01',
        sourceUrl: 'https://example.com/docs/foo',
      },
      reporter,
    );
    assert.ok(issues.find((i) => i.rule === 'sourceUrl-format'));
  });

  it('errors on description placeholder (原文:)', () => {
    const issues = [];
    const reporter = {
      err: (rule, message, line = null) => {
        issues.push({ rule, message, line, level: 'error' });
      },
      warn: () => {},
    };
    checkFrontmatter(
      {
        title: 'T',
        category: 'C',
        updated: '2026-01-01',
        sourceUrl: 'https://docs.tricentis.com/testim/content/overview/testim-overview/index.htm',
        description: '原文: https://docs.tricentis.com/testim/content/overview/foo.htm',
      },
      reporter,
    );
    assert.ok(issues.find((i) => i.rule === 'description-placeholder'));
  });
});

describe('checkLinks (coexistence guard)', () => {
  const allSlugs = new Set(['overview/testim-overview', 'getting-started/getting-started']);

  it('errors on internal link to non-existent slug', () => {
    const body = 'See [page](/docs/nonexistent-page).\n';
    const issues = collectIssues(checkLinks, body, { allSlugs });
    assert.ok(issues.find((i) => i.rule === 'link-target-missing'));
  });

  it('stays clean on valid internal link', () => {
    const body = 'See [overview](/docs/overview/testim-overview).\n';
    const issues = collectIssues(checkLinks, body, { allSlugs });
    assert.equal(
      issues.filter((i) => i.rule === 'link-target-missing').length,
      0,
    );
  });

  it('skips links inside code block', () => {
    const body = '```\nSee [page](/docs/nonexistent-page).\n```\n';
    const issues = collectIssues(checkLinks, body, { allSlugs });
    assert.equal(
      issues.filter((i) => i.rule === 'link-target-missing').length,
      0,
      'code block content must not trigger link check',
    );
  });
});

describe('checkFeatureNames (coexistence guard)', () => {
  it('errors on Japanese feature name "Testim拡張機能"', () => {
    const body = 'Testim拡張機能を使ってテストを記録します。\n';
    const issues = collectIssues(checkFeatureNames, body);
    const hit = issues.find((i) => i.rule === 'feature-name-japanese');
    assert.ok(hit, 'expected feature-name-japanese error');
    assert.equal(hit.level, 'error');
  });

  it('errors on legacy :fa-*: icon syntax', () => {
    const body = ':fa-arrow-right: **テスト作成**\n';
    const issues = collectIssues(checkFeatureNames, body);
    assert.ok(issues.find((i) => i.rule === 'legacy-fa-icon'));
  });

  it('skips Japanese feature name inside code fence', () => {
    const body = '```\nTestim拡張機能\n```\n';
    const issues = collectIssues(checkFeatureNames, body);
    assert.equal(
      issues.filter((i) => i.rule === 'feature-name-japanese').length,
      0,
    );
  });
});

describe('checkImages (coexistence guard)', () => {
  it('errors on referenced image that does not exist', () => {
    const body = '![alt](/images/nonexistent-image.png)\n';
    const issues = collectIssues(checkImages, body);
    assert.ok(
      issues.find((i) => i.rule === 'image-missing'),
      'expected image-missing error',
    );
  });

  it('skips image reference inside code fence', () => {
    const body = '```\n![alt](/images/nonexistent-image.png)\n```\n';
    const issues = collectIssues(checkImages, body);
    assert.equal(
      issues.filter((i) => i.rule === 'image-missing').length,
      0,
      'code fence content must not trigger image-missing',
    );
  });
});
