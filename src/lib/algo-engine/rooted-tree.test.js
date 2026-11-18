import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  addLeaf,
  childrenOf,
  depthsOf,
  isRootedTree,
  lettered,
  nextLabel,
  randomParents,
  removeSubtree,
} from './rooted-tree.js';

/** Deterministic LCG so random trees are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

describe('rooted tree model', () => {
  it('adds leaves up to the cap and names them with unused letters', () => {
    let t = lettered([-1, 0]);
    t = /** @type {import('./rooted-tree.js').RootedTree} */ (addLeaf(t, 1));
    expect(t.labels).toEqual(['A', 'B', 'C']);
    expect(t.parent).toEqual([-1, 0, 1]);
    expect(addLeaf(lettered(randomParents(MAX_NODES, seeded(2))), 0)).toBeNull();
  });

  it('accepts only parent lists whose parents come first', () => {
    expect(isRootedTree(lettered([-1, 0, 0, 1]))).toBe(true);
    expect(isRootedTree({ labels: ['A', 'B'], parent: [-1, 1] })).toBe(false);
    expect(isRootedTree({ labels: ['A'], parent: [0] })).toBe(false);
    expect(isRootedTree({ labels: ['A', 'B'], parent: [-1] })).toBe(false);
    expect(isRootedTree({ labels: [], parent: [] })).toBe(false);
  });

  it('lists children in index order and depths from the root', () => {
    const parent = [-1, 0, 0, 1, 1, 2];
    expect(childrenOf(parent)).toEqual([[1, 2], [3, 4], [5], [], [], []]);
    expect(depthsOf(parent)).toEqual([0, 1, 1, 2, 2, 2]);
  });

  it('names a new node with the first free letter', () => {
    expect(nextLabel(['A', 'C'])).toBe('B');
    expect(nextLabel([])).toBe('A');
  });

  it('removes a subtree and renumbers the rest', () => {
    const { tree, keep } = removeSubtree(lettered([-1, 0, 1, 0, 2]), 1);
    expect(tree).toEqual({ labels: ['A', 'D'], parent: [-1, 0] });
    expect(keep).toEqual([0, 3]);
  });

  it('builds random trees that hang every node under an earlier one', () => {
    const rand = seeded(5);
    for (let n = 1; n <= MAX_NODES; n++) {
      expect(isRootedTree(lettered(randomParents(n, rand)))).toBe(true);
    }
  });
});
