import GithubSlugger from 'github-slugger';
import { defineHastPlugin, type HastNode } from 'satteri';

const SLUGGER_KEY = '__testimHeadingSlugger';

function getSlugger(data: Record<string, unknown>): GithubSlugger {
  const existing = data[SLUGGER_KEY];
  if (existing instanceof GithubSlugger) return existing;

  const slugger = new GithubSlugger();
  data[SLUGGER_KEY] = slugger;
  return slugger;
}

/** Adds stable per-document heading IDs before wrapping content in an anchor. */
export const satteriHeadingLinks = defineHastPlugin({
  name: 'testim-heading-links',
  element: {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    visit(node, ctx) {
      const existingId = node.properties?.id;
      const id =
        typeof existingId === 'string'
          ? existingId
          : getSlugger(ctx.data).slug(ctx.textContent(node));
      const children = [...node.children] as HastNode[];

      ctx.setProperty(node, 'id', id);
      ctx.setProperty(node, 'children', [
        {
          type: 'element',
          tagName: 'a',
          properties: {
            className: ['heading-link'],
            href: `#${id}`,
          },
          children,
        },
      ]);
    },
  },
});
