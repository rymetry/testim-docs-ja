import { defineMdastPlugin, type MdastNode } from 'satteri';

const CALLOUTS = {
  tip: {
    title: 'ヒント',
    hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>',
  },
  warning: {
    title: '注意',
    hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  },
  caution: {
    title: '警告',
    hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
  },
  danger: {
    title: 'エラー',
    hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
  },
  note: {
    title: 'メモ',
    hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 8h.01M12 12v4"></path><circle cx="12" cy="12" r="10"></circle></svg>',
  },
  info: {
    title: '情報',
    hint: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
  },
} as const;

type CalloutType = keyof typeof CALLOUTS;

function isCalloutType(value: string): value is CalloutType {
  return Object.hasOwn(CALLOUTS, value);
}

function text(value: string): MdastNode {
  return { type: 'text', value } as MdastNode;
}

function html(value: string): MdastNode {
  return { type: 'html', value } as MdastNode;
}

function div(name: string, className: string, children: MdastNode[]): MdastNode {
  return {
    type: 'containerDirective',
    name,
    attributes: {},
    children,
    data: {
      hName: 'div',
      hProperties: { className: [className] },
    },
  } as MdastNode;
}

/** Sätteri equivalent of the current remark-callout-directives contract. */
export const satteriCallout = defineMdastPlugin({
  name: 'testim-callout',
  containerDirective(node, ctx) {
    if (!isCalloutType(node.name)) return;

    const callout = CALLOUTS[node.name];
    const title = node.attributes?.title || callout.title;
    const content = [...node.children] as MdastNode[];

    const titleNode = {
      type: 'paragraph',
      children: [text(title)],
      data: {
        hName: 'div',
        hProperties: { className: ['callout-title'] },
      },
    } as MdastNode;
    const indicator = div('callout-indicator', 'callout-indicator', [
      div('callout-hint', 'callout-hint', [html(callout.hint)]),
      titleNode,
    ]);

    ctx.setProperty(node, 'data', {
      hName: 'aside',
      hProperties: { className: ['callout', `callout-${node.name}`] },
    });
    ctx.setProperty(node, 'children', [
      indicator,
      div('callout-content', 'callout-content', content),
    ]);
  },
});

export const satteriCalloutTypes = Object.freeze(Object.keys(CALLOUTS));
