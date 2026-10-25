import { describe, expect, it } from 'vitest';
import { heapForest, layoutForest, parentForest, treeNeighbor } from './tree-layout.js';

/** @typedef {import('./tree-layout.js').TreeNode} TreeNode */

/** @param {string | number} id @param {(TreeNode | null)[]} [children] @returns {TreeNode} */
const n = (id, children = []) => ({ id, label: String(id), children });

/** @param {import('./tree-layout.js').TreeLayout} l */
const coords = (l) => Object.fromEntries(l.nodes.map((p) => [p.id, [p.x, p.depth]]));

describe('layoutForest: binary', () => {
  it('places nodes by in-order rank', () => {
    // 50 with left 30 (left 20) and right 70 (right 80)
    const tree = n(50, [n(30, [n(20), null]), n(70, [null, n(80)])]);
    const l = layoutForest([tree], { binary: true });
    expect(coords(l)).toEqual({ 50: [2, 0], 30: [1, 1], 20: [0, 2], 70: [3, 1], 80: [4, 2] });
    expect(l.columns).toBe(5);
    expect(l.levels).toBe(3);
    expect(l.nodes.map((p) => p.id)).toEqual([50, 30, 20, 70, 80]);
  });

  it('keeps a lone right child to the right of its parent', () => {
    const l = layoutForest([n(1, [null, n(2)])], { binary: true });
    expect(coords(l)).toEqual({ 1: [0, 0], 2: [1, 1] });
  });
});

describe('layoutForest: n-ary', () => {
  it('centres a parent over its first and last child', () => {
    const l = layoutForest([n('r', [n('a'), n('b', [n('c'), n('d')]), n('e')])]);
    expect(coords(l)).toEqual({
      a: [0, 1],
      c: [1, 2],
      d: [2, 2],
      b: [1.5, 1],
      e: [3, 1],
      r: [1.5, 0],
    });
    expect(l.edges).toEqual([
      { from: 'r', to: 'a', label: '' },
      { from: 'r', to: 'b', label: '' },
      { from: 'b', to: 'c', label: '' },
      { from: 'b', to: 'd', label: '' },
      { from: 'r', to: 'e', label: '' },
    ]);
  });

  it('lays a forest side by side with a gap', () => {
    const l = layoutForest([n('a', [n('b')]), n('c')]);
    expect(coords(l)).toEqual({ a: [0, 0], b: [0, 1], c: [1.5, 0] });
    expect(l.columns).toBe(2.5);
  });

  it('handles an empty forest and rejects duplicate ids', () => {
    expect(layoutForest([])).toMatchObject({ nodes: [], columns: 0, levels: 0 });
    expect(() => layoutForest([n(1, [n(1)])])).toThrow(/Duplicate/);
  });
});

describe('treeNeighbor', () => {
  const l = layoutForest([n('r', [n('a'), n('b', [n('c')])]), n('s')]);

  it('moves up, down and across siblings', () => {
    expect(treeNeighbor(l, 'b', 'ArrowUp')).toBe('r');
    expect(treeNeighbor(l, 'r', 'ArrowUp')).toBeNull();
    expect(treeNeighbor(l, 'r', 'ArrowDown')).toBe('a');
    expect(treeNeighbor(l, 'a', 'ArrowDown')).toBeNull();
    expect(treeNeighbor(l, 'a', 'ArrowRight')).toBe('b');
    expect(treeNeighbor(l, 'a', 'ArrowLeft')).toBeNull();
    expect(treeNeighbor(l, 'r', 'ArrowRight')).toBe('s');
    expect(treeNeighbor(l, 'a', 'Enter')).toBeNull();
  });
});

describe('heapForest', () => {
  it('builds the implicit tree of the heap part only', () => {
    const [root] = heapForest([9, 7, 8, 3, 1], 4, (i) => (i === 0 ? { state: 'active' } : {}));
    expect(root.state).toBe('active');
    const l = layoutForest([root], { binary: true });
    expect(l.nodes.map((p) => [p.id, p.node.label, p.parent])).toEqual([
      [0, '9', null],
      [1, '7', 0],
      [3, '3', 1],
      [2, '8', 0],
    ]);
    expect(heapForest([1, 2], 0)).toEqual([]);
  });
});

describe('parentForest', () => {
  it('turns a parent array into trees rooted at self-parents', () => {
    const forest = parentForest([0, 0, 1, 3, 3, 5], (i) => ({ note: `r${i}` }));
    expect(forest.map((t) => t.id)).toEqual([0, 3, 5]);
    expect(forest[0].children?.map((c) => c?.id)).toEqual([1]);
    expect(forest[0].children?.[0]?.children?.map((c) => c?.id)).toEqual([2]);
    expect(forest[1].children?.map((c) => c?.id)).toEqual([4]);
    expect(forest[2].note).toBe('r5');
  });
});
