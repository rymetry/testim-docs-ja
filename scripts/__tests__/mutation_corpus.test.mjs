import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let classifyLines;
let listItemBlockEnd;
let paragraphBlockRange;
let deleteParagraph;
let deleteBullet;
let deleteStep;
let deleteCalloutParagraph;
let deleteTableCell;
let deleteHtmlTableCell;
let moveSegment;
let insertEnResidual;
let dropInvariantToken;
let swapSectionBodies;
let generateAllMutations;
let generateCorpus;
let MUTATION_TYPES;

before(async () => {
  ({
    classifyLines,
    listItemBlockEnd,
    paragraphBlockRange,
    deleteParagraph,
    deleteBullet,
    deleteStep,
    deleteCalloutParagraph,
    deleteTableCell,
    deleteHtmlTableCell,
    moveSegment,
    insertEnResidual,
    dropInvariantToken,
    swapSectionBodies,
    generateAllMutations,
    generateCorpus,
    MUTATION_TYPES,
  } = await import('../lib/mutation_corpus.mjs'));
});

const CONTENT_ROOT = join(import.meta.dirname, '../../src/content/docs');
function readPage(slug) {
  return readFileSync(join(CONTENT_ROOT, `${slug}.md`), 'utf8');
}

// ---------------------------------------------------------------------------
// classifyLines
// ---------------------------------------------------------------------------
describe('classifyLines', () => {
  it('classifies frontmatter correctly', () => {
    const md = '---\ntitle: Test\n---\n\nHello world';
    const lines = classifyLines(md);
    assert.equal(lines[0].kind, 'frontmatter');
    assert.equal(lines[1].kind, 'frontmatter');
    assert.equal(lines[2].kind, 'frontmatter');
    assert.equal(lines[3].kind, 'blank');
    assert.equal(lines[4].kind, 'paragraph');
  });

  it('classifies code blocks correctly', () => {
    const lines = classifyLines('```shell\nnpm run test\n```');
    assert.equal(lines[0].kind, 'code-fence');
    assert.equal(lines[1].kind, 'code');
    assert.equal(lines[2].kind, 'code-fence');
  });

  it('classifies callouts correctly', () => {
    const lines = classifyLines(':::note{title="Info"}\nSome note text\n:::');
    assert.equal(lines[0].kind, 'callout-open');
    assert.equal(lines[1].kind, 'callout-body');
    assert.equal(lines[2].kind, 'callout-close');
  });

  it('classifies headings, bullets, steps, tables', () => {
    const lines = classifyLines('## Section\n\n- bullet\n1. step\n| col1 | col2 |');
    assert.equal(lines[0].kind, 'heading');
    assert.equal(lines[1].kind, 'blank');
    assert.equal(lines[2].kind, 'bullet');
    assert.equal(lines[3].kind, 'step');
    assert.equal(lines[4].kind, 'table');
  });

  it('classifies images', () => {
    const lines = classifyLines('![alt](/path.png)\n<Image src="/path.png" />');
    assert.equal(lines[0].kind, 'image');
    assert.equal(lines[1].kind, 'image');
  });

  it('classifies details/summary', () => {
    const lines = classifyLines('<details>\n<summary>Title</summary>\nContent\n</details>');
    assert.equal(lines[0].kind, 'details-open');
    assert.equal(lines[1].kind, 'summary');
    assert.equal(lines[2].kind, 'paragraph');
    assert.equal(lines[3].kind, 'details-close');
  });

  it('bullets inside callouts are classified as callout-body', () => {
    const lines = classifyLines(':::note\n- item inside callout\n:::');
    assert.equal(lines[1].kind, 'callout-body');
  });
});

// ---------------------------------------------------------------------------
// Block-extent helpers
// ---------------------------------------------------------------------------
describe('listItemBlockEnd', () => {
  it('includes continuation lines', () => {
    const lines = ['- item A', '  continuation', '- item B'];
    assert.equal(listItemBlockEnd(lines, 0), 2);
  });

  it('includes child items', () => {
    const lines = ['- parent', '  - child', '    grandchild', '- sibling'];
    assert.equal(listItemBlockEnd(lines, 0), 3);
  });

  it('includes blank lines between continuations', () => {
    const lines = ['1. step one', '', '   continuation after blank', '2. step two'];
    assert.equal(listItemBlockEnd(lines, 0), 3);
  });

  it('stops at same-indent sibling', () => {
    const lines = ['- A', '- B'];
    assert.equal(listItemBlockEnd(lines, 0), 1);
  });

  it('stops at blank followed by same-indent content', () => {
    const lines = ['- item', '', 'paragraph at indent 0'];
    assert.equal(listItemBlockEnd(lines, 0), 1);
  });

  it('handles numbered step with backslash continuations', () => {
    const lines = [
      '4. グリッドで選択します:\\',
      '   [仮想モバイルグリッド](/docs/link1)\\',
      '   [Device Cloud](/docs/link2)',
      '',
      '5. 次のステップ',
    ];
    assert.equal(listItemBlockEnd(lines, 0), 3);
  });
});

describe('paragraphBlockRange', () => {
  it('finds single-line paragraph', () => {
    const classified = classifyLines('## H\n\nSingle paragraph\n\n## H2');
    const paraIdx = classified.findIndex((l) => l.kind === 'paragraph');
    const [start, end] = paragraphBlockRange(classified, paraIdx);
    assert.equal(start, 2);
    assert.equal(end, 3);
  });

  it('finds multi-line paragraph', () => {
    const classified = classifyLines('Line one\nLine two\nLine three\n\nSeparate');
    const [start, end] = paragraphBlockRange(classified, 0);
    assert.equal(start, 0);
    assert.equal(end, 3);
  });
});

// ---------------------------------------------------------------------------
// deleteParagraph — block-aware
// ---------------------------------------------------------------------------
describe('deleteParagraph', () => {
  it('removes a single-line paragraph', () => {
    const md = '---\ntitle: T\n---\n\nFirst paragraph\n\nSecond paragraph\n\n## Section';
    const result = deleteParagraph(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'paragraph-delete');
    assert.equal(result.metadata.linesRemoved, 1);
  });

  it('removes a multi-line paragraph as one block', () => {
    const md = 'Line one of para\nLine two of para\n\nSeparate paragraph';
    const result = deleteParagraph(md, 0);
    assert.ok(result);
    assert.equal(result.metadata.linesRemoved, 2);
    assert.ok(!result.mutated.includes('Line one'));
    assert.ok(!result.mutated.includes('Line two'));
    assert.ok(result.mutated.includes('Separate paragraph'));
  });

  it('returns null for no paragraphs', () => {
    assert.equal(deleteParagraph('---\ntitle: T\n---\n\n## Only heading'), null);
  });

  it('nth selects different paragraph blocks', () => {
    const md = 'Para A\n\nPara B\n\nPara C';
    const r0 = deleteParagraph(md, 0);
    const r1 = deleteParagraph(md, 1);
    assert.ok(r0);
    assert.ok(r1);
    assert.notEqual(r0.metadata.lineIndex, r1.metadata.lineIndex);
  });
});

// ---------------------------------------------------------------------------
// deleteBullet — block-aware
// ---------------------------------------------------------------------------
describe('deleteBullet', () => {
  it('removes a simple bullet item', () => {
    const md = '- item 1\n- item 2\n- item 3';
    const result = deleteBullet(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'bullet-delete');
    assert.equal(result.metadata.linesRemoved, 1);
  });

  it('removes bullet with continuation lines', () => {
    const md = '- parent item\n  continuation line\n  more continuation\n- sibling';
    const result = deleteBullet(md, 0);
    assert.ok(result);
    assert.equal(result.metadata.linesRemoved, 3);
    assert.ok(!result.mutated.includes('parent item'));
    assert.ok(!result.mutated.includes('continuation'));
    assert.ok(result.mutated.includes('sibling'));
  });

  it('removes bullet with child items', () => {
    const md = '- parent\n  - child A\n  - child B\n- next';
    const result = deleteBullet(md, 0);
    assert.ok(result);
    assert.equal(result.metadata.linesRemoved, 3);
    assert.ok(result.mutated.includes('next'));
  });

  it('returns null for no bullets', () => {
    assert.equal(deleteBullet('## Heading\n\nA paragraph'), null);
  });

  it('does not remove bullets inside callouts', () => {
    const md = ':::note\n- callout bullet\n:::\n\n- regular bullet';
    const result = deleteBullet(md);
    assert.ok(result);
    assert.ok(result.metadata.originalText.includes('regular bullet'));
  });
});

// ---------------------------------------------------------------------------
// deleteStep — block-aware
// ---------------------------------------------------------------------------
describe('deleteStep', () => {
  it('removes a simple numbered step', () => {
    const md = '1. First step\n2. Second step\n3. Third step';
    const result = deleteStep(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'step-delete');
    assert.equal(result.metadata.linesRemoved, 1);
    assert.ok(!result.mutated.includes('First step'));
  });

  it('removes step with continuation lines', () => {
    const md = [
      '1. Step with details',
      '   Continuation line one',
      '   Continuation line two',
      '2. Next step',
    ].join('\n');
    const result = deleteStep(md, 0);
    assert.ok(result);
    assert.equal(result.metadata.linesRemoved, 3);
    assert.ok(!result.mutated.includes('Step with details'));
    assert.ok(!result.mutated.includes('Continuation'));
    assert.ok(result.mutated.includes('Next step'));
  });

  it('removes step with nested bullets', () => {
    const md = [
      '1. Setup:',
      '   - Sub-item A',
      '   - Sub-item B',
      '2. Execute',
    ].join('\n');
    const result = deleteStep(md, 0);
    assert.ok(result);
    assert.equal(result.metadata.linesRemoved, 3);
    assert.ok(result.mutated.includes('Execute'));
  });

  it('returns null for no steps', () => {
    assert.equal(deleteStep('- bullet\n- only'), null);
  });

  it('nth selects different steps', () => {
    const md = '1. A\n2. B\n3. C';
    const r0 = deleteStep(md, 0);
    const r1 = deleteStep(md, 1);
    assert.ok(r0);
    assert.ok(r1);
    assert.notEqual(r0.metadata.lineIndex, r1.metadata.lineIndex);
  });
});

// ---------------------------------------------------------------------------
// deleteCalloutParagraph — block-aware within callouts
// ---------------------------------------------------------------------------
describe('deleteCalloutParagraph', () => {
  it('removes plain text from inside a callout', () => {
    const md = ':::note\nCallout paragraph text\n:::';
    const result = deleteCalloutParagraph(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'callout-paragraph-delete');
    assert.ok(!result.mutated.includes('Callout paragraph text'));
  });

  it('removes one numbered step from inside a callout (same-level siblings are separate)', () => {
    const md = [
      ':::warning',
      '手順が必要です:',
      '',
      '1. 最初のステップ',
      '2. 次のステップ',
      '3. 最後のステップ',
      ':::',
    ].join('\n');
    // candidate 0 = "手順が必要です:", candidate 1 = "1. 最初のステップ"
    const result = deleteCalloutParagraph(md, 1);
    assert.ok(result);
    // Each same-level step is a separate structural element → 1 line removed
    assert.equal(result.metadata.linesRemoved, 1);
    assert.ok(!result.mutated.includes('最初のステップ'));
    assert.ok(result.mutated.includes('次のステップ'));
    assert.ok(result.mutated.includes('最後のステップ'));
  });

  it('removes numbered step with continuation from inside a callout', () => {
    const md = [
      ':::warning',
      '1. ステップ本文',
      '   continuation line',
      '2. 次のステップ',
      ':::',
    ].join('\n');
    const result = deleteCalloutParagraph(md, 0);
    assert.ok(result);
    // Step 1 + its continuation = 2 lines
    assert.equal(result.metadata.linesRemoved, 2);
    assert.ok(!result.mutated.includes('ステップ本文'));
    assert.ok(!result.mutated.includes('continuation'));
    assert.ok(result.mutated.includes('次のステップ'));
  });

  it('removes bullet block from inside a callout', () => {
    const md = [
      ':::note',
      '- bullet A',
      '  continuation',
      '- bullet B',
      ':::',
    ].join('\n');
    const result = deleteCalloutParagraph(md, 0);
    assert.ok(result);
    // "- bullet A" + "  continuation" = 2 lines
    assert.equal(result.metadata.linesRemoved, 2);
    assert.ok(result.mutated.includes('bullet B'));
  });

  it('does not cross callout boundary', () => {
    const md = [
      ':::note',
      '1. step inside',
      ':::',
      '',
      '1. step outside',
    ].join('\n');
    const result = deleteCalloutParagraph(md, 0);
    assert.ok(result);
    assert.equal(result.metadata.linesRemoved, 1);
    assert.ok(result.mutated.includes('step outside'));
  });

  it('returns null if no callout content', () => {
    assert.equal(deleteCalloutParagraph('## Heading\n\nRegular text'), null);
  });
});

// ---------------------------------------------------------------------------
// deleteTableCell — pipe tables
// ---------------------------------------------------------------------------
describe('deleteTableCell', () => {
  it('empties a cell in a data row', () => {
    const md = '| H1 | H2 |\n| --- | --- |\n| data1 | data2 |';
    const result = deleteTableCell(md);
    assert.ok(result);
    const dataRow = result.mutated.split('\n')[2];
    assert.ok(dataRow.includes('| |') || dataRow.includes('|  |'));
  });

  it('skips header and separator rows', () => {
    const md = '| H1 | H2 |\n| --- | --- |\n| data1 | data2 |';
    const result = deleteTableCell(md);
    assert.ok(result);
    assert.equal(result.metadata.lineIndex, 2);
  });

  it('returns null for no pipe tables', () => {
    assert.equal(deleteTableCell('No tables here'), null);
  });

  it('returns null for header-only table (no separator row)', () => {
    assert.equal(deleteTableCell('| col1 | col2 |'), null);
  });
});

// ---------------------------------------------------------------------------
// deleteHtmlTableCell
// ---------------------------------------------------------------------------
describe('deleteHtmlTableCell', () => {
  it('empties a non-empty <td> cell', () => {
    const md = '<table>\n<tr>\n<td>\nContent here\n</td>\n</tr>\n</table>';
    const result = deleteHtmlTableCell(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'html-table-cell-delete');
    assert.ok(!result.mutated.includes('Content here'));
    assert.ok(result.mutated.includes('<td>'));
    assert.ok(result.mutated.includes('</td>'));
  });

  it('skips already-empty cells', () => {
    const md = '<table><tr><td></td><td>Real content</td></tr></table>';
    const result = deleteHtmlTableCell(md);
    assert.ok(result);
    assert.equal(result.metadata.originalText, 'Real content');
  });

  it('handles cells with links', () => {
    const md = '<td>\n<a href="/docs/test">テスト</a>\n</td>';
    const result = deleteHtmlTableCell(md);
    assert.ok(result);
    assert.ok(result.metadata.originalText.includes('テスト'));
  });

  it('returns null for no HTML tables', () => {
    assert.equal(deleteHtmlTableCell('No HTML tables'), null);
  });

  it('nth selects different cells', () => {
    const md = '<td>Cell A</td>\n<td>Cell B</td>';
    const r0 = deleteHtmlTableCell(md, 0);
    const r1 = deleteHtmlTableCell(md, 1);
    assert.ok(r0);
    assert.ok(r1);
    assert.notEqual(r0.metadata.originalText, r1.metadata.originalText);
  });
});

// ---------------------------------------------------------------------------
// moveSegment — block-aware
// ---------------------------------------------------------------------------
describe('moveSegment', () => {
  it('swaps two single-line paragraphs', () => {
    const result = moveSegment('Para A\n\nPara B');
    assert.ok(result);
    const lines = result.mutated.split('\n');
    assert.equal(lines[0], 'Para B');
    assert.equal(lines[2], 'Para A');
  });

  it('swaps multi-line paragraph blocks', () => {
    const md = 'Line A1\nLine A2\n\nPara B';
    const result = moveSegment(md);
    assert.ok(result);
    const lines = result.mutated.split('\n');
    // Block B should come first, then blank, then Block A
    assert.equal(lines[0], 'Para B');
    assert.equal(lines[1], '');
    assert.equal(lines[2], 'Line A1');
    assert.equal(lines[3], 'Line A2');
  });

  it('does not swap lines within the same paragraph block', () => {
    // Two lines in the same paragraph should NOT be swapped
    const md = 'Line one\nLine two';
    const result = moveSegment(md);
    // Only 1 paragraph block → no pair → null
    assert.equal(result, null);
  });

  it('does not swap across headings', () => {
    assert.equal(moveSegment('Para A\n\n## Heading\n\nPara B'), null);
  });

  it('does not swap across code fences', () => {
    assert.equal(moveSegment('Para A\n\n```\ncode\n```\n\nPara B'), null);
  });

  it('does not swap across images', () => {
    assert.equal(moveSegment('Para A\n\n![alt](/img.png)\n\nPara B'), null);
  });

  it('does not swap across tables', () => {
    assert.equal(moveSegment('Para A\n\n| H |\n| - |\n| d |\n\nPara B'), null);
  });

  it('returns null for identical adjacent paragraph blocks', () => {
    assert.equal(moveSegment('Same text\n\nSame text'), null);
  });

  it('preserves gap lines between blocks', () => {
    const md = 'Block A\n\n\n\nBlock B';
    const result = moveSegment(md);
    assert.ok(result);
    // Total line count should be preserved
    assert.equal(result.mutated.split('\n').length, md.split('\n').length);
  });
});

// ---------------------------------------------------------------------------
// insertEnResidual
// ---------------------------------------------------------------------------
describe('insertEnResidual', () => {
  it('replaces a JA paragraph with English', () => {
    const result = insertEnResidual('テストの実行方法を学習してください\n\n別の段落');
    assert.ok(result);
    assert.ok(result.mutated.includes('Click on the Settings button'));
    assert.ok(!result.mutated.includes('テストの実行方法'));
  });

  it('returns null for no CJK paragraphs', () => {
    assert.equal(insertEnResidual('Only English text here'), null);
  });
});

// ---------------------------------------------------------------------------
// dropInvariantToken
// ---------------------------------------------------------------------------
describe('dropInvariantToken', () => {
  it('removes a CLI flag', () => {
    const result = dropInvariantToken('CLI で _--turbo-mode_ を使用します。');
    assert.ok(result);
    assert.ok(!result.mutated.includes('--turbo-mode'));
  });

  it('prefers backtick-wrapped flag over bare flag (dedup)', () => {
    const result = dropInvariantToken('`--parallel` オプションを指定', 0);
    assert.ok(result);
    assert.equal(result.metadata.originalText, '`--parallel`');
  });

  it('removes a URL', () => {
    const result = dropInvariantToken('詳細は https://example.com/docs を参照');
    assert.ok(result);
    assert.equal(result.metadata.originalText, 'https://example.com/docs');
  });

  it('skips tokens inside code blocks', () => {
    assert.equal(dropInvariantToken('```\n--token value\n```\n\nNormal text'), null);
  });

  it('skips image lines', () => {
    assert.equal(dropInvariantToken('![alt](https://example.com/img.png)\n\nテキスト'), null);
  });
});

// ---------------------------------------------------------------------------
// swapSectionBodies
// ---------------------------------------------------------------------------
describe('swapSectionBodies', () => {
  it('swaps the body of two adjacent H2 sections, leaving headings in place', () => {
    const md = [
      '## セクション A',
      '',
      'A の段落です。',
      '',
      '## セクション B',
      '',
      'B の段落です。',
    ].join('\n');
    const result = swapSectionBodies(md, 0);
    assert.ok(result);
    assert.equal(result.metadata.type, 'section-body-swap');
    // Headings preserved in original order
    const lines = result.mutated.split('\n');
    const headingLines = lines.filter((l) => l.startsWith('## '));
    assert.deepEqual(headingLines, ['## セクション A', '## セクション B']);
    // Body content swapped
    const aIdx = lines.indexOf('## セクション A');
    const bIdx = lines.indexOf('## セクション B');
    assert.ok(lines.slice(aIdx, bIdx).some((l) => l === 'B の段落です。'));
    assert.ok(lines.slice(bIdx).some((l) => l === 'A の段落です。'));
  });

  it('returns null when there are no adjacent body-bearing sections', () => {
    const md = '## Only one section\n\nbody';
    assert.equal(swapSectionBodies(md, 0), null);
  });

  it('skips H1 (treated as title) and uses H2/H3/H4 only', () => {
    const md = [
      '# Title',
      '',
      'preface body',
      '',
      '## Section A',
      '',
      'A body',
      '',
      '## Section B',
      '',
      'B body',
    ].join('\n');
    const result = swapSectionBodies(md, 0);
    assert.ok(result);
    // Title's H1 is untouched.
    assert.ok(result.mutated.startsWith('# Title'));
  });
});

// ---------------------------------------------------------------------------
// generateAllMutations — integration
// ---------------------------------------------------------------------------
describe('generateAllMutations', () => {
  it('generates mutations for a rich document', () => {
    const md = [
      '---', 'title: Test', '---', '',
      'テストの概要です。', '',
      '- bullet item 1', '- bullet item 2', '',
      '1. first step', '2. second step', '',
      ':::note', 'callout の内容です。', ':::', '',
      '| H1 | H2 |', '| --- | --- |', '| data1 | data2 |', '',
      '<table><tr><td>HTML cell</td></tr></table>', '',
      '`--flag` を使います。',
    ].join('\n');
    const mutations = generateAllMutations(md);
    assert.ok(mutations.size >= 7, `Expected >=7 types, got ${mutations.size}`);
    for (const [type, result] of mutations) {
      assert.equal(result.metadata.type, type);
      assert.notEqual(result.mutated, md);
    }
  });
});

// ---------------------------------------------------------------------------
// generateCorpus — integration
// ---------------------------------------------------------------------------
describe('generateCorpus', () => {
  it('generates multiple unique mutations per type', () => {
    const md = [
      'Para A です。', '', 'Para B です。', '', 'Para C です。', '',
      '- bullet 1', '- bullet 2', '- bullet 3',
    ].join('\n');
    const corpus = generateCorpus(md, 3);
    const paragraphs = corpus.get('paragraph-delete');
    assert.ok(paragraphs);
    assert.ok(paragraphs.length >= 2);
    const indices = paragraphs.map((m) => m.metadata.lineIndex);
    assert.equal(indices.length, new Set(indices).size, 'No duplicate mutations');
  });
});

// ---------------------------------------------------------------------------
// Real page corpus tests
// ---------------------------------------------------------------------------
describe('real page corpus coverage', () => {
  const manifest = JSON.parse(
    readFileSync(
      join(import.meta.dirname, 'fixtures/source-parity-goldens/manifest.json'),
      'utf8',
    ),
  );

  const allTypesProduced = new Set();

  for (const { slug, traits } of manifest.pages) {
    describe(`page: ${slug}`, () => {
      let md;
      let mutations;

      before(() => {
        md = readPage(slug);
        mutations = generateAllMutations(md);
      });

      it('reads without error', () => {
        assert.ok(md.length > 0);
      });

      it('produces at least one mutation', () => {
        assert.ok(mutations.size > 0, `No mutations for ${slug}`);
        for (const type of mutations.keys()) {
          allTypesProduced.add(type);
        }
      });

      it('each mutation changes the content', () => {
        for (const [type, result] of mutations) {
          assert.notEqual(result.mutated, md, `${type} should change content`);
        }
      });

      it('each mutation has correct linesRemoved metadata', () => {
        for (const [type, result] of mutations) {
          const originalLines = md.split('\n').length;
          const mutatedLines = result.mutated.split('\n').length;
          const { linesRemoved } = result.metadata;
          if (['segment-move', 'table-cell-delete', 'token-drop'].includes(type)) {
            assert.equal(linesRemoved, 0, `${type}: in-place mutation`);
          } else if (type === 'html-table-cell-delete') {
            // HTML cell replacement may change line count unpredictably
            assert.equal(linesRemoved, 0, `${type}: in-place mutation`);
          } else {
            // Block deletion: lines removed = original - mutated
            assert.equal(
              originalLines - mutatedLines, linesRemoved,
              `${type}: linesRemoved=${linesRemoved} but actual diff=${originalLines - mutatedLines}`,
            );
          }
        }
      });

      // Trait-specific expectations
      if (traits.includes('callouts') || traits.includes('callouts-mixed')) {
        it('produces callout-paragraph-delete', () => {
          assert.ok(mutations.has('callout-paragraph-delete'));
        });
      }
      if (traits.includes('pipe-table')) {
        it('produces table-cell-delete', () => {
          assert.ok(mutations.has('table-cell-delete'));
        });
      }
      if (traits.includes('html-table')) {
        it('produces html-table-cell-delete', () => {
          assert.ok(mutations.has('html-table-cell-delete'));
        });
      }
      if (traits.includes('cli-flags') || traits.includes('invariant-tokens')) {
        it('produces token-drop', () => {
          assert.ok(mutations.has('token-drop'));
        });
      }
      if (traits.includes('steps')) {
        it('produces step-delete', () => {
          assert.ok(mutations.has('step-delete'));
        });
      }
    });
  }

  // corpus-level coverage を維持する。
  // Each mutation type must be producible by at least one page in the corpus,
  // but individual pages are NOT required to support all types — a page without
  // pipe tables naturally cannot produce table-cell-delete, and a page whose
  // paragraphs are always separated by structural elements cannot produce
  // segment-move. Per-page type expectations are expressed via manifest traits.
  it('all 10 mutation types are covered across corpus', () => {
    const expected = Object.keys(MUTATION_TYPES);
    for (const type of expected) {
      assert.ok(
        allTypesProduced.has(type),
        `Mutation type "${type}" was not produced by any page`,
      );
    }
  });
});
