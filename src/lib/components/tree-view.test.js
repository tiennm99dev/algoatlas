// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import TreeView from './tree-view.svelte';
import HeapView from './heap-view.svelte';
import UnionFindForest from './union-find-forest.svelte';

/** @typedef {import('./tree-layout.js').TreeNode} TreeNode */

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Component @param {Record<string, any>} props */
function render(Component, props) {
  app = mount(Component, { target: document.body, props });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

/** @param {Element} el @param {string} key */
function press(el, key) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

/** @param {string} label */
const byLabel = (label) =>
  /** @type {SVGGElement} */ (document.querySelector(`[aria-label="${label}"]`));

/** @param {string | number} id @param {(TreeNode | null)[]} [children] @returns {TreeNode} */
const n = (id, children = []) => ({ id, label: String(id), children });

const bst = () => [
  n(50, [
    n(30, [n(20), null]),
    { ...n(70), state: /** @type {const} */ ('compare'), edgeLabel: 'R' },
  ]),
];

describe('TreeView', () => {
  it('draws a labelled picture with one line per edge', () => {
    render(TreeView, { roots: bst(), binary: true, ariaLabel: 'BST' });
    expect(document.querySelector('svg')?.getAttribute('role')).toBe('img');
    expect(document.querySelectorAll('line')).toHaveLength(3);
    expect([...document.querySelectorAll('title')].map((t) => t.textContent)).toEqual([
      '50, depth 0',
      '30, depth 1',
      '20, depth 2',
      '70, depth 1, compared',
    ]);
    expect(document.body.textContent).toContain('R');
  });

  it('shows the empty text for an empty forest', () => {
    render(TreeView, { roots: [], ariaLabel: 'BST', emptyText: 'Nothing yet.' });
    expect(document.querySelector('svg')).toBeNull();
    expect(document.body.textContent).toContain('Nothing yet.');
  });

  it('walks the tree with arrow keys and picks with Enter', () => {
    const onselect = vi.fn();
    render(TreeView, { roots: bst(), binary: true, ariaLabel: 'BST', onselect });
    const root = byLabel('50, depth 0');
    expect(root.getAttribute('tabindex')).toBe('0');
    press(root, 'ArrowDown');
    expect(document.activeElement).toBe(byLabel('30, depth 1'));
    press(/** @type {Element} */ (document.activeElement), 'ArrowRight');
    expect(document.activeElement).toBe(byLabel('70, depth 1, compared'));
    press(/** @type {Element} */ (document.activeElement), 'ArrowUp');
    expect(document.activeElement).toBe(root);
    press(root, 'Enter');
    expect(onselect).toHaveBeenLastCalledWith(50);
  });
});

describe('HeapView', () => {
  it('draws the heap part as a tree and the whole array beneath', () => {
    render(HeapView, { values: [9, 7, 8, 1], size: 3 });
    const titles = [...document.querySelectorAll('title')].map((t) => t.textContent);
    expect(titles).toEqual([
      'Slot 0: 9',
      'Slot 1: 7',
      'Slot 2: 8',
      'Slot 0: 9',
      'Slot 1: 7',
      'Slot 2: 8',
      'Slot 3: 1, sorted',
    ]);
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'Heap of 3 as an array: 9, 7, 8.',
    );
  });

  it('picks a slot from either drawing', () => {
    const onselect = vi.fn();
    render(HeapView, { values: [9, 7, 8], onselect });
    const [inTree, inArray] = document.querySelectorAll('[aria-label="Slot 2: 8"]');
    press(inTree, 'Enter');
    expect(onselect).toHaveBeenLastCalledWith(2);
    press(inArray, ' ');
    expect(onselect).toHaveBeenLastCalledWith(2);
  });
});

describe('UnionFindForest', () => {
  it('draws one tree per set and the parent row', () => {
    render(UnionFindForest, {
      parent: [0, 0, 1, 3],
      noteOf: (/** @type {number} */ i) => (i === 0 ? 'r1' : ''),
    });
    const titles = [...document.querySelectorAll('title')].map((t) => t.textContent);
    expect(titles.slice(0, 4)).toEqual([
      '0 is a root',
      'parent of 1 is 0',
      'parent of 2 is 1',
      '3 is a root',
    ]);
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe('4 elements in 2 sets.');
    expect(document.body.textContent).toContain('r1');
    expect(document.body.textContent).toContain('parent');
  });

  it('hides the parent row on request', () => {
    render(UnionFindForest, { parent: [0, 0], showParentRow: false });
    expect(document.querySelectorAll('svg')).toHaveLength(1);
  });
});
