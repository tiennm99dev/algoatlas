import { describe, expect, it } from 'vitest';
import {
  MAX_NODES,
  TREE_PRESETS,
  addChild,
  childrenOf,
  randomTree,
  removeSubtree,
  treeDpPseudocode,
  treeDpTrace,
} from './tree-dp.js';
import { lcg } from './seeded-random.js';

/** Heaviest independent set by trying every subset. @param {import('./tree-dp.js').TreeInput} t */
function bruteSet(t) {
  const n = t.parent.length;
  let best = 0;
  for (let mask = 0; mask < 1 << n; mask++) {
    let ok = true;
    for (let i = 1; i < n && ok; i++) if (mask & (1 << i) && mask & (1 << t.parent[i])) ok = false;
    if (!ok) continue;
    let total = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) total += t.weight[i];
    best = Math.max(best, total);
  }
  return best;
}

/** Distance sums from every node, one breadth-first search each. @param {number[]} parent */
function bruteDistances(parent) {
  const n = parent.length;
  /** @type {number[][]} */
  const adj = parent.map(() => []);
  parent.forEach((p, i) => {
    if (p >= 0) {
      adj[p].push(i);
      adj[i].push(p);
    }
  });
  return parent.map((_, s) => {
    const dist = Array(n).fill(-1);
    dist[s] = 0;
    const queue = [s];
    for (let h = 0; h < queue.length; h++)
      for (const u of adj[queue[h]])
        if (dist[u] < 0) {
          dist[u] = dist[queue[h]] + 1;
          queue.push(u);
        }
    return dist.reduce((a, b) => a + b, 0);
  });
}

describe('maximum-weight independent set', () => {
  it('solves the presets', () => {
    const results = TREE_PRESETS.map((p) => treeDpTrace('mis', p.tree).at(-1)?.result);
    expect(results).toEqual([16, 14, 10]);
  });

  it('matches every subset by brute force and reads back a valid set of that weight', () => {
    const rand = lcg(41);
    for (let t = 0; t < 60; t++) {
      const tree = randomTree(1 + Math.floor(rand() * MAX_NODES), rand);
      const last = tree && treeDpTrace('mis', tree).at(-1);
      expect(last?.result).toBe(bruteSet(tree));
      const taken = last?.taken ?? [];
      let total = 0;
      tree.parent.forEach((p, i) => {
        if (p >= 0) expect(taken[i] && taken[p]).toBe(false);
        if (taken[i]) total += tree.weight[i];
      });
      expect(total).toBe(last?.result);
    }
  });

  it('fills children before their parent', () => {
    const frames = treeDpTrace('mis', TREE_PRESETS[0].tree);
    const order = frames.filter((f) => f.kind === 'settle').map((f) => f.v);
    expect(order).toEqual([4, 5, 1, 2, 6, 7, 3, 0]);
    for (const f of frames.filter((x) => x.kind === 'merge')) expect(f.settled[f.c]).toBe(true);
  });

  it('keeps inc and exc of a leaf as its weight and 0', () => {
    const last = treeDpTrace('mis', TREE_PRESETS[2].tree).at(-1);
    expect(last?.inc.slice(1)).toEqual([2, 3, 1, 2, 2]);
    expect(last?.exc.slice(1)).toEqual([0, 0, 0, 0, 0]);
    expect(last?.inc[0]).toBe(9);
    expect(last?.exc[0]).toBe(10);
  });

  it('handles a single node', () => {
    const last = treeDpTrace('mis', { parent: [-1], weight: [7] }).at(-1);
    expect(last?.result).toBe(7);
    expect(last?.taken).toEqual([true]);
  });
});

describe('rerooting', () => {
  it('matches a breadth-first search from every node', () => {
    const rand = lcg(42);
    const trees = [...TREE_PRESETS.map((p) => p.tree), { parent: [-1], weight: [1] }];
    for (let t = 0; t < 40; t++) trees.push(randomTree(1 + Math.floor(rand() * MAX_NODES), rand));
    for (const tree of trees) {
      const last = treeDpTrace('reroot', tree).at(-1);
      const want = bruteDistances(tree.parent);
      expect(last?.all).toEqual(want);
      expect(last?.result).toBe(Math.min(...want));
    }
  });

  it('counts subtree sizes and sums below', () => {
    const last = treeDpTrace('reroot', TREE_PRESETS[0].tree).at(-1);
    expect(last?.size).toEqual([8, 3, 1, 3, 1, 1, 1, 1]);
    expect(last?.sub).toEqual([11, 2, 0, 2, 0, 0, 0, 0]);
    expect(last?.all).toEqual([11, 13, 17, 13, 19, 19, 19, 19]);
  });

  it('visits each edge twice instead of once per root', () => {
    for (const p of TREE_PRESETS) {
      const n = p.tree.parent.length;
      expect(treeDpTrace('reroot', p.tree).at(-1)?.edges).toBe(2 * (n - 1));
      expect(treeDpTrace('mis', p.tree).at(-1)?.edges).toBe(n - 1);
    }
  });
});

describe('tree edits', () => {
  it('adds a child and removes a subtree, keeping parents before children', () => {
    const t = addChild(TREE_PRESETS[0].tree, 4, 7);
    expect(t.parent.at(-1)).toBe(4);
    expect(t.weight.at(-1)).toBe(7);
    const cut = removeSubtree(t, 1);
    expect(cut.parent).toEqual([-1, 0, 0, 2, 2]);
    expect(cut.weight).toEqual([3, 2, 4, 3, 3]);
    cut.parent.forEach((p, i) => expect(p).toBeLessThan(i));
    expect(childrenOf(cut.parent)).toEqual([[1, 2], [], [3, 4], [], []]);
  });

  it('builds random trees with parents first', () => {
    const t = randomTree(MAX_NODES, lcg(3));
    t.parent.forEach((p, i) => expect(p).toBeLessThan(i));
    expect(t.parent).toHaveLength(MAX_NODES);
  });
});

describe('frames', () => {
  it('do not alias each other or the input', () => {
    const tree = TREE_PRESETS[0].tree;
    const frames = treeDpTrace('mis', tree);
    const before = JSON.stringify(frames[4]);
    frames[3].inc[0] = 99;
    frames[3].parent[1] = 99;
    frames[3].stack.push(99);
    frames[3].settled[0] = true;
    frames[3].lines.push(9);
    expect(JSON.stringify(frames[4])).toBe(before);
    expect(tree.parent[1]).toBe(0);
  });

  it('start and end with the named kinds and stay small at the cap', () => {
    for (const p of /** @type {const} */ (['mis', 'reroot'])) {
      const frames = treeDpTrace(p, randomTree(MAX_NODES, lcg(9)));
      expect(frames[0].kind).toBe('start');
      expect(frames.at(-1)?.kind).toBe('done');
      expect(frames.length).toBeLessThan(400);
    }
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {const} */ (['mis', 'reroot']))('%s highlights every line', (p) => {
    const used = new Set(treeDpTrace(p, TREE_PRESETS[0].tree).flatMap((f) => f.lines));
    treeDpPseudocode[p].forEach((_, i) => expect(used.has(i), `line ${i}`).toBe(true));
  });
});
