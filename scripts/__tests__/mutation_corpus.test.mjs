import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let classifyLines;
let deleteParagraph;
let deleteBullet;
let deleteCalloutParagraph;
let deleteTableCell;
let moveSegment;
let insertEnResidual;
let dropInvariantToken;
let generateAllMutations;
let generateCorpus;
let MUTATION_TYPES;

before(async () => {
  ({
    classifyLines,
    deleteParagraph,
    deleteBullet,
    deleteCalloutParagraph,
    deleteTableCell,
    moveSegment,
    insertEnResidual,
    dropInvariantToken,
    generateAllMutations,
    generateCorpus,
    MUTATION_TYPES,
  } = await import('../lib/mutation_corpus.mjs'));
});

// ---------------------------------------------------------------------------
// Helper: read a representative page
// ---------------------------------------------------------------------------
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
    const md = '```shell\nnpm run test\n```';
    const lines = classifyLines(md);
    assert.equal(lines[0].kind, 'code-fence');
    assert.equal(lines[1].kind, 'code');
    assert.equal(lines[2].kind, 'code-fence');
  });

  it('classifies callouts correctly', () => {
    const md = ':::note{title="Info"}\nSome note text\n:::';
    const lines = classifyLines(md);
    assert.equal(lines[0].kind, 'callout-open');
    assert.equal(lines[1].kind, 'callout-body');
    assert.equal(lines[2].kind, 'callout-close');
  });

  it('classifies headings, bullets, steps, tables', () => {
    const md = '## Section\n\n- bullet\n1. step\n| col1 | col2 |';
    const lines = classifyLines(md);
    assert.equal(lines[0].kind, 'heading');
    assert.equal(lines[1].kind, 'blank');
    assert.equal(lines[2].kind, 'bullet');
    assert.equal(lines[3].kind, 'step');
    assert.equal(lines[4].kind, 'table');
  });

  it('classifies images', () => {
    const md = '![alt](/path.png)\n<Image src="/path.png" />';
    const lines = classifyLines(md);
    assert.equal(lines[0].kind, 'image');
    assert.equal(lines[1].kind, 'image');
  });

  it('classifies details/summary', () => {
    const md = '<details>\n<summary>Title</summary>\nContent\n</details>';
    const lines = classifyLines(md);
    assert.equal(lines[0].kind, 'details-open');
    assert.equal(lines[1].kind, 'summary');
    assert.equal(lines[2].kind, 'paragraph');
    assert.equal(lines[3].kind, 'details-close');
  });

  it('bullets inside callouts are classified as callout-body', () => {
    const md = ':::note\n- item inside callout\n:::';
    const lines = classifyLines(md);
    assert.equal(lines[1].kind, 'callout-body');
  });
});

// ---------------------------------------------------------------------------
// Individual mutation functions — unit tests
// ---------------------------------------------------------------------------
describe('deleteParagraph', () => {
  it('removes exactly one paragraph', () => {
    const md = '---\ntitle: T\n---\n\nFirst paragraph\n\nSecond paragraph\n\n## Section';
    const result = deleteParagraph(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'paragraph-delete');
    assert.ok(!result.mutated.includes(result.metadata.originalText));
    // One fewer line
    assert.equal(
      result.mutated.split('\n').length,
      md.split('\n').length - 1,
    );
  });

  it('returns null for no paragraphs', () => {
    const md = '---\ntitle: T\n---\n\n## Only heading';
    assert.equal(deleteParagraph(md), null);
  });

  it('nth selects different paragraphs', () => {
    const md = 'Para A\n\nPara B\n\nPara C';
    const r0 = deleteParagraph(md, 0);
    const r1 = deleteParagraph(md, 1);
    assert.ok(r0);
    assert.ok(r1);
    assert.notEqual(r0.metadata.lineIndex, r1.metadata.lineIndex);
  });
});

describe('deleteBullet', () => {
  it('removes exactly one bullet item', () => {
    const md = '- item 1\n- item 2\n- item 3';
    const result = deleteBullet(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'bullet-delete');
    assert.equal(result.mutated.split('\n').length, 2);
  });

  it('returns null for no bullets', () => {
    const md = '## Heading\n\nA paragraph';
    assert.equal(deleteBullet(md), null);
  });

  it('does not remove bullets inside callouts', () => {
    const md = ':::note\n- callout bullet\n:::\n\n- regular bullet';
    const result = deleteBullet(md);
    assert.ok(result);
    assert.equal(result.metadata.originalText, '- regular bullet');
  });
});

describe('deleteCalloutParagraph', () => {
  it('removes content from inside a callout', () => {
    const md = ':::note\nCallout paragraph text\n:::';
    const result = deleteCalloutParagraph(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'callout-paragraph-delete');
    assert.ok(!result.mutated.includes('Callout paragraph text'));
  });

  it('returns null if no callout content', () => {
    const md = '## Heading\n\nRegular text';
    assert.equal(deleteCalloutParagraph(md), null);
  });
});

describe('deleteTableCell', () => {
  it('empties a cell in a data row', () => {
    const md = '| H1 | H2 |\n| --- | --- |\n| data1 | data2 |';
    const result = deleteTableCell(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'table-cell-delete');
    // The data row should have an empty cell
    const dataRow = result.mutated.split('\n')[2];
    assert.ok(dataRow.includes('| |') || dataRow.includes('|  |'));
  });

  it('skips header and separator rows', () => {
    const md = '| H1 | H2 |\n| --- | --- |\n| data1 | data2 |';
    const result = deleteTableCell(md);
    assert.ok(result);
    // Should target line 2 (0-indexed = the data row)
    assert.equal(result.metadata.lineIndex, 2);
  });

  it('returns null for no pipe tables', () => {
    const md = 'No tables here\n\n## Section';
    assert.equal(deleteTableCell(md), null);
  });

  it('returns null for header-only table (no separator row)', () => {
    const md = '| col1 | col2 |';
    assert.equal(deleteTableCell(md), null);
  });
});

describe('moveSegment', () => {
  it('swaps two adjacent paragraphs', () => {
    const md = 'Para A\n\nPara B';
    const result = moveSegment(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'segment-move');
    const lines = result.mutated.split('\n');
    assert.equal(lines[0], 'Para B');
    assert.equal(lines[2], 'Para A');
  });

  it('does not swap across headings', () => {
    const md = 'Para A\n\n## Heading\n\nPara B';
    assert.equal(moveSegment(md), null);
  });

  it('returns null for identical adjacent paragraphs', () => {
    const md = 'Same text\n\nSame text';
    assert.equal(moveSegment(md), null);
  });
});

describe('insertEnResidual', () => {
  it('replaces a JA paragraph with English', () => {
    const md = 'テストの実行方法を学習してください\n\n別の段落';
    const result = insertEnResidual(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'en-residual');
    assert.ok(result.mutated.includes('Click on the Settings button'));
    assert.ok(!result.mutated.includes('テストの実行方法'));
  });

  it('returns null for no CJK paragraphs', () => {
    const md = 'Only English text here\n\nMore English';
    assert.equal(insertEnResidual(md), null);
  });
});

describe('dropInvariantToken', () => {
  it('removes a CLI flag', () => {
    const md = 'CLI で _--turbo-mode_ を使用します。';
    const result = dropInvariantToken(md);
    assert.ok(result);
    assert.equal(result.metadata.type, 'token-drop');
    assert.ok(result.metadata.originalText.includes('--turbo-mode'));
    assert.ok(!result.mutated.includes('--turbo-mode'));
  });

  it('removes a backtick-wrapped CLI flag', () => {
    const md = '`--parallel` オプションを指定してください。';
    const result = dropInvariantToken(md);
    assert.ok(result);
    assert.ok(result.metadata.originalText.includes('--parallel'));
  });

  it('removes a URL', () => {
    const md = '詳細は https://example.com/docs を参照';
    const result = dropInvariantToken(md);
    assert.ok(result);
    assert.equal(result.metadata.originalText, 'https://example.com/docs');
  });

  it('skips tokens inside code blocks', () => {
    const md = '```\n--token value\n```\n\nNormal text';
    const result = dropInvariantToken(md);
    assert.equal(result, null);
  });

  it('prefers backtick-wrapped flag over bare flag (dedup)', () => {
    const md = '`--parallel` オプションを指定';
    const result = dropInvariantToken(md, 0);
    assert.ok(result);
    // Should remove the full backtick-wrapped token, not the bare flag inside
    assert.equal(result.metadata.originalText, '`--parallel`');
    assert.ok(!result.mutated.includes('`--parallel`'));
  });

  it('skips image lines', () => {
    const md = '![alt](https://example.com/image.png)\n\nテキスト';
    const result = dropInvariantToken(md);
    // Should not target the image URL
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// generateAllMutations — integration with real pages
// ---------------------------------------------------------------------------
describe('generateAllMutations', () => {
  it('generates at least one mutation per applicable type', () => {
    const md = [
      '---',
      'title: Test',
      '---',
      '',
      'テストの概要です。',
      '',
      '- bullet item 1',
      '- bullet item 2',
      '',
      ':::note',
      'callout の内容です。',
      ':::',
      '',
      '| H1 | H2 |',
      '| --- | --- |',
      '| data1 | data2 |',
      '',
      '`--flag` を使います。',
    ].join('\n');
    const mutations = generateAllMutations(md);
    assert.ok(mutations.size >= 5, `Expected >=5 types, got ${mutations.size}`);
    for (const [type, result] of mutations) {
      assert.equal(result.metadata.type, type);
      assert.notEqual(result.mutated, md, `${type} should produce different content`);
    }
  });
});

// ---------------------------------------------------------------------------
// generateCorpus — integration
// ---------------------------------------------------------------------------
describe('generateCorpus', () => {
  it('generates multiple mutations per type', () => {
    const md = [
      'Para A です。',
      '',
      'Para B です。',
      '',
      'Para C です。',
      '',
      '- bullet 1',
      '- bullet 2',
      '- bullet 3',
    ].join('\n');
    const corpus = generateCorpus(md, 3);
    const paragraphMutations = corpus.get('paragraph-delete');
    assert.ok(paragraphMutations);
    assert.ok(paragraphMutations.length >= 2, 'Should have at least 2 paragraph mutations');
    // Verify no duplicates
    const lineIndices = paragraphMutations.map((m) => m.metadata.lineIndex);
    assert.equal(lineIndices.length, new Set(lineIndices).size, 'No duplicate mutations');
  });
});

// ---------------------------------------------------------------------------
// Real page corpus tests — verify all 7 mutation types are producible
// ---------------------------------------------------------------------------
describe('real page corpus coverage', () => {
  const manifest = JSON.parse(
    readFileSync(
      join(
        import.meta.dirname,
        'fixtures/source-parity-goldens/manifest.json',
      ),
      'utf8',
    ),
  );

  /** Collect all mutation types producible across all pages */
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
          assert.notEqual(
            result.mutated,
            md,
            `${type} mutation should change content`,
          );
        }
      });

      it('each mutation differs by exactly one structural element', () => {
        for (const [type, result] of mutations) {
          if (type === 'segment-move') {
            // Move doesn't change line count, just swaps
            assert.equal(
              result.mutated.split('\n').length,
              md.split('\n').length,
              `${type}: line count should be unchanged`,
            );
          } else if (type === 'table-cell-delete') {
            // Table cell mutation changes content of one cell
            assert.equal(
              result.mutated.split('\n').length,
              md.split('\n').length,
              `${type}: line count should be unchanged`,
            );
          } else if (type === 'en-residual' || type === 'token-drop') {
            // In-place replacement
            assert.equal(
              result.mutated.split('\n').length,
              md.split('\n').length,
              `${type}: line count should be unchanged`,
            );
          } else {
            // Deletion mutations remove exactly one line
            assert.equal(
              result.mutated.split('\n').length,
              md.split('\n').length - 1,
              `${type}: should remove exactly one line`,
            );
          }
        }
      });

      // Trait-specific expectations
      if (traits.includes('callouts') || traits.includes('callouts-mixed')) {
        it('produces callout-paragraph-delete mutation', () => {
          assert.ok(
            mutations.has('callout-paragraph-delete'),
            `${slug} should produce callout-paragraph-delete`,
          );
        });
      }

      if (traits.includes('pipe-table')) {
        it('produces table-cell-delete mutation', () => {
          assert.ok(
            mutations.has('table-cell-delete'),
            `${slug} should produce table-cell-delete`,
          );
        });
      }

      if (traits.includes('cli-flags') || traits.includes('invariant-tokens')) {
        it('produces token-drop mutation', () => {
          assert.ok(
            mutations.has('token-drop'),
            `${slug} should produce token-drop`,
          );
        });
      }
    });
  }

  it('all 7 mutation types are covered across corpus', () => {
    // This runs after all page tests
    const expected = Object.keys(MUTATION_TYPES);
    for (const type of expected) {
      assert.ok(
        allTypesProduced.has(type),
        `Mutation type "${type}" was not produced by any page in corpus`,
      );
    }
  });
});
