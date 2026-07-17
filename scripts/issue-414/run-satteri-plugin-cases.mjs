import { defineHastPlugin, markdownToHtml } from 'satteri';

import { satteriCallout, satteriCalloutTypes } from '../../src/lib/satteri-callout.ts';
import { satteriHeadingLinks } from '../../src/lib/satteri-heading-links.ts';
import { satteriWrapTable } from '../../src/lib/satteri-wrap-table.ts';

const prewrappedTable = defineHastPlugin({
  name: 'prewrapped-table-fixture',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['overflow-x-auto', 'my-8'] },
        children: [],
      });
    },
  },
});

function render(source, hastPlugins = [satteriHeadingLinks, satteriWrapTable]) {
  return markdownToHtml(source, {
    features: {
      gfm: true,
      directive: true,
      headingAttributes: false,
      smartPunctuation: false,
    },
    mdastPlugins: [satteriCallout],
    hastPlugins,
  }).html;
}

const duplicateHeadings = render('# 同じ\n\n## 同じ');
const sequentialHeadings = [render('# 同じ'), render('# 同じ')];
const parallelHeadings = await Promise.all([
  Promise.resolve().then(() => render('# 並列')),
  Promise.resolve().then(() => render('# 並列')),
]);
const callouts = Object.fromEntries(
  satteriCalloutTypes.map((type) => [
    type,
    render(
      `::::${type}{title="明示タイトル"}\n**太字**と[リンク](/docs)と\`code\`\n\n- 項目\n::::`
    ),
  ])
);
const table = render('| A | B |\n| - | - |\n| 1 | 2 |');
const prewrapped = render('| A |\n| - |\n| 1 |', [prewrappedTable, satteriWrapTable]);
const codeFence = render('```js title="sample.js"\nconsole.log("ok")\n```');

console.log(
  JSON.stringify({
    duplicateHeadings,
    sequentialHeadings,
    parallelHeadings,
    callouts,
    table,
    prewrapped,
    codeFence,
  })
);
