/** Comparison and validation functions for EN/JA source parity checking. */
import fs from 'node:fs';
import path from 'node:path';

import { extractSlug as extractSlugFromUrl, matchAllTricentisUrls } from './madcap_toc.mjs';
import {
  detectEnArtifacts,
  extractBulletCounts,
  extractCalloutPositions,
  extractHeadingSequence,
  extractImageSequence,
  extractInvariantTokens,
  extractParagraphCounts,
  extractStepCounts,
  extractTableStructure,
  isUntranslatedCell,
  normalizeEnArtifacts,
  stripMarkdown,
  stripTitleH1,
} from './source_parity_extract.mjs';
import {
  FENCE_LINE_RE,
  H1_IN_BODY_RE,
  ISSUE_SEVERITY,
  JSX_CALLOUT_RE,
  LEGACY_CALLOUT_RE,
  UNTRANSLATED_PATTERNS,
} from './source_parity_types.mjs';

function withSeverity(issue) {
  return {
    ...issue,
    severity: ISSUE_SEVERITY[issue.type] ?? 'signal',
  };
}

export function isActionableIssue(issue) {
  return issue.severity === 'actionable';
}

export function isEnglishOnlyLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(?:#{1,6}\s|[-*>|]|```|:::|!\[|<!--|\[.*\]\()/.test(trimmed)) return false;
  if (/^<\/?(?:table|thead|tbody|tr|td|th|details|summary|img|kbd|br|hr|Image)\b/i.test(trimmed)) {
    return false;
  }
  if (/[\u3000-\u9FFF\uF900-\uFAFF]/.test(trimmed)) return false;

  const textOnly = trimmed.replace(/^\d+\.\s*/, '');
  if (!textOnly || textOnly.length < 15) return false;

  return UNTRANSLATED_PATTERNS.some((pattern) => pattern.test(textOnly));
}

export function loadSidebarSlugs(sidebarText) {
  const slugs = new Set();
  for (const match of matchAllTricentisUrls(sidebarText)) {
    const slug = extractSlugFromUrl(match[0]);
    if (slug) slugs.add(slug);
  }
  return slugs;
}

export function localCheck({ body, sidebarSlugs, slug }) {
  const issues = [];
  const lines = body.split('\n');
  let inCodeBlock = false;

  if (sidebarSlugs && slug && !sidebarSlugs.has(slug)) {
    issues.push(withSeverity({ type: 'orphan-page', detail: 'SIDEBAR_URLS.md に未掲載' }));
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (FENCE_LINE_RE.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (LEGACY_CALLOUT_RE.test(line)) {
      issues.push(
        withSeverity({
          type: 'legacy-callout',
          line: index + 1,
          text: line.trim().slice(0, 80),
        })
      );
    }

    if (JSX_CALLOUT_RE.test(line.trim())) {
      issues.push(
        withSeverity({
          type: 'jsx-callout',
          line: index + 1,
          text: line.trim().slice(0, 80),
        })
      );
    }

    if (H1_IN_BODY_RE.test(line) && index > 0) {
      issues.push(
        withSeverity({
          type: 'h1-in-body',
          line: index + 1,
          text: line.trim().slice(0, 80),
        })
      );
    }

    if (isEnglishOnlyLine(line)) {
      issues.push(
        withSeverity({
          type: 'untranslated',
          line: index + 1,
          text: line.trim().slice(0, 100),
        })
      );
    }
  }

  return issues;
}

function compareSectionCounts(enMap, jaMap, issueType, label, minDiff = 1) {
  const issues = [];
  const enSections = [...enMap.entries()].filter(([key]) => key !== '__top__');
  const jaSections = [...jaMap.entries()].filter(([key]) => key !== '__top__');

  if (enSections.length > 0 && enSections.length === jaSections.length) {
    for (let index = 0; index < enSections.length; index += 1) {
      const [enHeading, enCount] = enSections[index];
      const [, jaCount] = jaSections[index];
      const diff = jaCount - enCount;
      if (Math.abs(diff) >= minDiff && (enCount > 0 || jaCount > 0)) {
        issues.push(
          withSeverity({
            type: issueType,
            detail: `セクション #${index + 1} "${enHeading}": ${label} EN=${enCount}, JA=${jaCount} (${diff > 0 ? '+' : ''}${diff})`,
          })
        );
      }
    }
    return issues;
  }

  if (enSections.length === 0 && jaSections.length === 0) return issues;

  const enTotal = [...enMap.values()].reduce((sum, value) => sum + value, 0);
  const jaTotal = [...jaMap.values()].reduce((sum, value) => sum + value, 0);
  if (
    enTotal !== jaTotal &&
    (enTotal > 0 || jaTotal > 0) &&
    Math.abs(jaTotal - enTotal) >= minDiff
  ) {
    const diff = jaTotal - enTotal;
    issues.push(
      withSeverity({
        type: issueType,
        detail: `${label}の総数が原文と異なります: EN=${enTotal}, JA=${jaTotal} (${diff > 0 ? '+' : ''}${diff})`,
      })
    );
  }

  return issues;
}

function compareTableStructure(enBody, jaBody) {
  const issues = [];
  const enTables = extractTableStructure(enBody);
  const jaTables = extractTableStructure(jaBody);

  if (enTables.length !== jaTables.length && (enTables.length > 0 || jaTables.length > 0)) {
    issues.push(
      withSeverity({
        type: 'table-shape-mismatch',
        detail: `テーブル数: EN=${enTables.length}, JA=${jaTables.length}`,
      })
    );
    return issues;
  }
  if (enTables.length === 0) return issues;

  for (let tableIndex = 0; tableIndex < enTables.length; tableIndex += 1) {
    const enTable = enTables[tableIndex];
    const jaTable = jaTables[tableIndex];
    const enRows = enTable.rows.length;
    const jaRows = jaTable.rows.length;
    const enCols = enTable.rows[0]?.length || 0;
    const jaCols = jaTable.rows[0]?.length || 0;

    if (enRows !== jaRows || enCols !== jaCols) {
      issues.push(
        withSeverity({
          type: 'table-shape-mismatch',
          detail: `テーブル #${tableIndex + 1}: EN=${enRows}行×${enCols}列, JA=${jaRows}行×${jaCols}列`,
        })
      );
      continue;
    }

    for (let rowIndex = 0; rowIndex < enRows; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < enCols; columnIndex += 1) {
        const enCell = (enTable.rows[rowIndex]?.[columnIndex] || '').trim();
        const jaCell = (jaTable.rows[rowIndex]?.[columnIndex] || '').trim();
        const enEmpty = enCell.length === 0;
        const jaEmpty = jaCell.length === 0;

        if (enEmpty !== jaEmpty) {
          issues.push(
            withSeverity({
              type: 'table-cell-empty-mismatch',
              detail: `テーブル #${tableIndex + 1} [${rowIndex + 1},${columnIndex + 1}]: EN=${enEmpty ? '空' : '非空'}, JA=${jaEmpty ? '空' : '非空'}`,
            })
          );
          continue;
        }

        if (!enEmpty && !jaEmpty) {
          const normalizeDocLink = (token) => token.replace(/^(\/docs\/[\w-]+)#.*$/, '$1');
          const enTokens = extractInvariantTokens(enCell).map(normalizeDocLink);
          const jaTokens = extractInvariantTokens(jaCell).map(normalizeDocLink);
          const enSet = [...new Set(enTokens)].sort();
          const jaSet = [...new Set(jaTokens)].sort();

          if (enSet.length > 0 && enSet.join('|') !== jaSet.join('|')) {
            const missing = enSet.filter((token) => !jaSet.includes(token));
            const added = jaSet.filter((token) => !enSet.includes(token));
            const detailParts = [];
            if (missing.length > 0) detailParts.push(`欠落: ${missing.slice(0, 3).join(', ')}`);
            if (added.length > 0) detailParts.push(`追加: ${added.slice(0, 3).join(', ')}`);
            if (detailParts.length > 0) {
              issues.push(
                withSeverity({
                  type: 'table-cell-token-mismatch',
                  detail: `テーブル #${tableIndex + 1} [${rowIndex + 1},${columnIndex + 1}]: ${detailParts.join('; ')}`,
                })
              );
            }
          }
        }

        const normalizeForCompare = (value) =>
          stripMarkdown(value)
            .replace(/\s*\[[^\]]*\]\s*/g, ' ')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
        if (
          !jaEmpty &&
          normalizeForCompare(enCell) !== normalizeForCompare(jaCell) &&
          isUntranslatedCell(jaCell)
        ) {
          issues.push(
            withSeverity({
              type: 'table-cell-english-residual',
              detail: `テーブル #${tableIndex + 1} [${rowIndex + 1},${columnIndex + 1}]: "${jaCell.slice(0, 50)}"`,
            })
          );
        }
      }
    }
  }

  return issues;
}

export function compareSnapshotStructure(enBody, jaBody) {
  const issues = [];
  const enArtifacts = detectEnArtifacts(enBody);
  const enImages = extractImageSequence(enBody);
  const jaImages = extractImageSequence(jaBody);

  if (enImages.length > 0 && jaImages.length > 0) {
    const enFiles = enImages.map((image) => image.file);
    const jaFiles = jaImages.map((image) => image.file);
    const uniqueEn = [...new Set(enFiles.filter((file) => jaFiles.includes(file)))];
    const uniqueJa = [...new Set(jaFiles.filter((file) => enFiles.includes(file)))];

    if (uniqueEn.length >= 2 && uniqueEn.length === uniqueJa.length) {
      const jaIndex = new Map(uniqueJa.map((file, index) => [file, index]));
      const inversions = [];

      for (let left = 0; left < uniqueEn.length; left += 1) {
        for (let right = left + 1; right < uniqueEn.length; right += 1) {
          const first = uniqueEn[left];
          const second = uniqueEn[right];
          if (
            jaIndex.has(first) &&
            jaIndex.has(second) &&
            jaIndex.get(first) > jaIndex.get(second)
          ) {
            inversions.push([first, second]);
          }
        }
      }

      if (inversions.length > 0) {
        issues.push(
          withSeverity({
            type: 'image-order-mismatch',
            detail: `画像の順序が原文と異なります (${inversions.length} 箇所): ${inversions
              .slice(0, 3)
              .map(([first, second]) => `${first} / ${second}`)
              .join('; ')}`,
          })
        );
      }
    }
  }

  const enCallouts = extractCalloutPositions(enBody);
  const jaCallouts = extractCalloutPositions(jaBody);
  if (enCallouts.length === jaCallouts.length && enCallouts.length > 0) {
    for (let index = 0; index < enCallouts.length; index += 1) {
      if (enCallouts[index].depth === jaCallouts[index].depth) continue;
      const enLevel = enCallouts[index].depth === 0 ? 'トップレベル' : 'ネスト';
      const jaLevel = jaCallouts[index].depth === 0 ? 'トップレベル' : 'ネスト';
      issues.push(
        withSeverity({
          type: 'callout-nesting-mismatch',
          line: jaCallouts[index].line,
          detail: `callout #${index + 1}: EN=${enLevel} → JA=${jaLevel}`,
        })
      );
    }
  }

  issues.push(...compareTableStructure(enBody, jaBody));

  const normalizedEnBody = normalizeEnArtifacts(stripTitleH1(enBody));
  const countSectionHeadings = (body) => {
    let count = 0;
    let inCode = false;
    for (const line of body.split('\n')) {
      if (FENCE_LINE_RE.test(line)) {
        inCode = !inCode;
        continue;
      }
      if (!inCode && /^#{2,4}\s+/.test(line)) count += 1;
    }
    return count;
  };

  const enSectionCount = countSectionHeadings(normalizedEnBody);
  const jaSectionCount = countSectionHeadings(jaBody);
  if (enSectionCount > 0 && enSectionCount !== jaSectionCount) {
    issues.push(
      withSeverity({
        type: 'section-count-mismatch',
        detail: `H2-H4 セクション数: EN=${enSectionCount}, JA=${jaSectionCount}`,
      })
    );
  }

  const enHeadings = extractHeadingSequence(normalizedEnBody);
  const jaHeadings = extractHeadingSequence(jaBody);
  const headingCompareLength = Math.min(enHeadings.length, jaHeadings.length);
  if (headingCompareLength > 0) {
    const mismatches = [];
    for (let index = 0; index < headingCompareLength; index += 1) {
      if (enHeadings[index].level !== jaHeadings[index].level) {
        mismatches.push({ en: enHeadings[index], ja: jaHeadings[index] });
      }
    }
    if (mismatches.length > 0) {
      issues.push(
        withSeverity({
          type: 'heading-mismatch',
          detail: `見出しレベル不一致 (${mismatches.length}件): ${mismatches
            .slice(0, 3)
            .map(
              (mismatch) =>
                `EN H${mismatch.en.level} '${mismatch.en.text}' → JA H${mismatch.ja.level}`
            )
            .join('; ')}`,
        })
      );
    }
  }

  const enSteps = extractStepCounts(normalizedEnBody);
  const jaSteps = extractStepCounts(jaBody);
  const enBullets = extractBulletCounts(normalizedEnBody);
  const jaBullets = extractBulletCounts(jaBody);
  const enParagraphs = extractParagraphCounts(normalizedEnBody);
  const jaParagraphs = extractParagraphCounts(jaBody);

  const enStepTotal = [...enSteps.values()].reduce((sum, value) => sum + value, 0);
  const jaStepTotal = [...jaSteps.values()].reduce((sum, value) => sum + value, 0);
  if (enStepTotal > 0 && jaStepTotal > 0 && enStepTotal !== jaStepTotal) {
    const diff = jaStepTotal - enStepTotal;
    issues.push(
      withSeverity({
        type: 'step-count-mismatch',
        detail: `番号付きステップ数が原文と異なります: EN=${enStepTotal}, JA=${jaStepTotal} (${Math.abs(diff)} ${diff > 0 ? '多い' : '少ない'})`,
      })
    );
  }

  issues.push(
    ...compareSectionCounts(enSteps, jaSteps, 'step-count-mismatch', 'ステップ数'),
    ...compareSectionCounts(enBullets, jaBullets, 'bullet-count-mismatch', '箇条書き数'),
    ...compareSectionCounts(enParagraphs, jaParagraphs, 'paragraph-count-mismatch', '段落数')
  );

  if (enArtifacts.length > 0) {
    return issues.map((issue) => ({ ...issue, artifacts: enArtifacts }));
  }

  return issues;
}

export function checkSidebarCoverage({ sidebarSlugs, existingSlugs }) {
  const issues = [];
  for (const slug of sidebarSlugs) {
    if (!existingSlugs.has(slug)) {
      issues.push(
        withSeverity({
          type: 'sidebar-missing-file',
          detail: `SIDEBAR_URLS.md に掲載だがローカルファイルが存在しない: ${slug}`,
        })
      );
    }
  }
  return issues;
}

export function checkSourceSnapshotMissing({ slug, sourceUrl, snapshotsDir }) {
  if (!sourceUrl) return [];

  const snapshotPath = path.join(snapshotsDir, `${slug}.html`);
  if (fs.existsSync(snapshotPath)) return [];

  return [
    withSeverity({
      type: 'source-snapshot-missing',
      detail: `sourceUrl があるが EN スナップショットが存在しない: ${slug}`,
    }),
  ];
}
