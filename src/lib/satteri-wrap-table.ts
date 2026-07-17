import { defineHastPlugin } from 'satteri';

function classNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  return [];
}

/** Sätteri equivalent of rehype-wrap-table. */
export const satteriWrapTable = defineHastPlugin({
  name: 'testim-wrap-table',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      const parent = ctx.parent(node);
      if (
        parent?.type === 'element' &&
        parent.tagName === 'div' &&
        classNames(parent.properties?.className).includes('overflow-x-auto')
      ) {
        return;
      }

      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['overflow-x-auto', 'my-8'] },
        children: [],
      });
    },
  },
});
