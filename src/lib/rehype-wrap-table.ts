import type { Element, Parent, Root } from 'hast';
import type { Plugin } from 'unified';
import { SKIP, visit } from 'unist-util-visit';

function isParent(node: unknown): node is Parent {
  return node !== null && typeof node === 'object' && 'children' in node;
}

function getClassNames(element: Element): string[] {
  const className = element.properties?.className;
  if (Array.isArray(className)) {
    return className.map(String);
  }
  if (typeof className === 'string') {
    return [className];
  }
  return [];
}

const rehypeWrapTable: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table') return;
      if (typeof index !== 'number' || !isParent(parent)) return;

      if (
        parent.type === 'element' &&
        parent.tagName === 'div' &&
        getClassNames(parent).includes('overflow-x-auto')
      ) {
        return;
      }

      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['overflow-x-auto', 'my-8'] },
        children: [node],
      };

      parent.children[index] = wrapper;
      return SKIP;
    });
  };
};

export default rehypeWrapTable;
