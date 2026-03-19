import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

let updateFrontmatterDate;

before(async () => {
  ({ updateFrontmatterDate } = await import('../update_dates_from_english.mjs'));
});

describe('updateFrontmatterDate', () => {
  it('replaces an existing updated field', () => {
    const content = `---
title: Sample
updated: '2025-09-13'
---

Body
`;

    const next = updateFrontmatterDate(content, '2025-09-19');
    assert.match(next, /updated: '2025-09-19'/);
    assert.doesNotMatch(next, /2025-09-13/);
  });

  it('inserts updated before the closing frontmatter fence when missing', () => {
    const content = `---
title: Sample
category: Overview
---

Body
`;

    const next = updateFrontmatterDate(content, '2025-09-19');
    assert.match(
      next,
      /category: Overview\nupdated: '2025-09-19'\n---\n\nBody/s,
    );
  });
});
