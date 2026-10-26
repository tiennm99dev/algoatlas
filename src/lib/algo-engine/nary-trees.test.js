import { describe, expect, it } from 'vitest';
import {
  MAX_CHILDREN,
  MAX_DEPTH,
  MAX_NODES,
  PRESETS,
  addChild,
  childrenLists,
  depthOf,
  isTree,
  makeTree,
  naryPseudocode,
  naryTrace,
  removeSubtree,
} from './nary-trees.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./nary-trees.js').NaryTree} NaryTree */
/** @typedef {import('./nary-trees.js').NaryFrame} NaryFrame */

/** @param {NaryFrame[]} frames */
const last = (frames) => /** @type {NaryFrame} */ (frames.at(-1));

/** BFS distances in the undirected tree. @param {NaryTree} t @param {number} from */
function distances(t, from) {
  /** @type {number[][]} */
  const adj = t.labels.map(() => []);
  t.parent.forEach((p, v) => {
    if (p >= 0) {
      adj[p].push(v);
      adj[v].push(p);
    }
  });
  const dist = t.labels.map(() => -1);
  dist[from] = 0;
  const q = [from];
  while (q.length) {
    const u = /** @type {number} */ (q.shift());
    for (const w of adj[u])
      if (dist[w] < 0) {
        dist[w] = dist[u] + 1;
        q.push(w);
      }
  }
  return dist;
}

/** Oracle diameter: farthest node from any node, then farthest from that one. @param {NaryTree} t */
function oracleDiameter(t) {
  const d0 = distances(t, 0);
  const far = d0.indexOf(Math.max(...d0));
  return Math.max(...distances(t, far));
}

/** Oracle size: count nodes whose ancestor chain reaches v. @param {NaryTree} t @param {number} v */
function oracleSize(t, v) {
  let n = 0;
  t.parent.forEach((_, u) => {
    for (let w = u; w >= 0; w = t.parent[w])
      if (w === v) {
        n++;
        break;
      }
  });
  return n;
}

/** Oracle height: deepest descendant depth minus own depth. @param {NaryTree} t @param {number} v */
function oracleHeight(t, v) {
  let h = 0;
  t.parent.forEach((_, u) => {
    let d = 0;
    for (let w = u; w >= 0; w = t.parent[w], d++) if (w === v) h = Math.max(h, d);
  });
  return h;
}

/** A random tree built by random attachment. @param {() => number} rand @returns {NaryTree} */
function randomTree(rand) {
  const n = 1 + Math.floor(rand() * MAX_NODES);
  const parent = [-1];
  for (let v = 1; v < n; v++) parent.push(Math.floor(rand() * v));
  return { labels: parent.map((_, i) => `n${i}`), parent };
}

describe('n-ary tree recursion trace', () => {
  it('matches oracles for sizes, heights and the diameter on random trees', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const t = randomTree(seeded(seed));
      const end = last(naryTrace(t));
      t.labels.forEach((_, v) => {
        expect(end.size[v]).toBe(oracleSize(t, v));
        expect(end.height[v]).toBe(oracleHeight(t, v));
      });
      expect(end.diameter).toBe(oracleDiameter(t));
      expect(end.path.length).toBe(end.diameter + 1);
      for (let k = 1; k < end.path.length; k++) {
        const [u, w] = [end.path[k - 1], end.path[k]];
        expect(t.parent[u] === w || t.parent[w] === u).toBe(true);
      }
      expect(new Set(end.path).size).toBe(end.path.length);
      expect(end.calls).toBe(t.labels.length);
    }
  });

  it('finds the presets’ diameters, inside and away from the root', () => {
    const org = last(naryTrace(makeTree('org')));
    expect(org.size[0]).toBe(10);
    expect(org.height[0]).toBe(3);
    expect(org.diameter).toBe(5);
    expect(org.best).toBe(0);
    const skewed = last(naryTrace(makeTree('skewed')));
    expect(skewed.diameter).toBe(5);
    expect(skewed.best).toBe(1);
    expect(skewed.bend[0]).toBe(4);
    expect(skewed.path.map((v) => makeTree('skewed').labels[v]).join('')).toBe('EDCBFG');
    expect(last(naryTrace(makeTree('star'))).diameter).toBe(2);
    expect(last(naryTrace(makeTree('path'))).diameter).toBe(4);
  });

  it('handles a single node', () => {
    const frames = naryTrace({ labels: ['A'], parent: [-1] });
    expect(frames.map((f) => f.kind)).toEqual(['start', 'enter', 'up', 'done']);
    expect(last(frames)).toMatchObject({ diameter: 0, path: [0] });
    expect(last(frames).height[0]).toBe(0);
  });

  it('adds each child’s size back into its parent', () => {
    const frames = naryTrace(makeTree('org'));
    const adds = frames.filter((f) => f.kind === 'add' && f.current === 0);
    expect(adds.map((f) => f.size[0])).toEqual([4, 5, 10]);
    expect(adds.map((f) => f.top)).toEqual([
      [1, -1],
      [1, 0],
      [2, 1],
    ]);
  });

  it('keeps the open calls on the stack', () => {
    for (const f of naryTrace(makeTree('path')))
      if (f.kind === 'enter') expect(f.stack.length).toBe(depthOf(makeTree('path'), f.current) + 1);
  });

  it('does not alias frames', () => {
    const frames = naryTrace(makeTree('org'));
    const before = JSON.stringify(frames[4]);
    frames[3].size[0] = 99;
    frames[3].stack.push(5);
    frames[3].top[0] = 7;
    frames[3].done[0] = true;
    expect(JSON.stringify(frames[4])).toBe(before);
  });

  it('stays bounded at the cap', () => {
    const parent = Array.from({ length: MAX_NODES }, (_, i) => i - 1);
    expect(naryTrace({ labels: parent.map(String), parent }).length).toBeLessThan(80);
  });
});

describe('editing the tree', () => {
  it('adds a child as the last child with the next free letter', () => {
    const r = addChild(makeTree('star'), 2);
    if (!r.ok) throw new Error('refused');
    expect(r.tree.labels.at(-1)).toBe('H');
    expect(childrenLists(r.tree)[2]).toEqual([7]);
  });

  it('refuses a full tree, a level too deep and too many children', () => {
    expect(addChild(makeTree('path'), 4)).toEqual({ ok: false, error: 'depth' });
    expect(addChild(makeTree('star'), 0)).toEqual({ ok: false, error: 'wide' });
    const big = {
      labels: Array.from({ length: MAX_NODES }, (_, i) => `n${i}`),
      parent: Array.from({ length: MAX_NODES }, (_, i) => (i === 0 ? -1 : 0)),
    };
    expect(addChild(big, 1)).toEqual({ ok: false, error: 'full' });
    expect(MAX_CHILDREN).toBe(6);
    expect(MAX_DEPTH).toBe(4);
  });

  it('removes a subtree and renumbers the rest', () => {
    const t = removeSubtree(makeTree('org'), 5);
    expect(t.labels).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(t.parent).toEqual([-1, 0, 1, 1, 0]);
    expect(isTree(t)).toBe(true);
    expect(removeSubtree(t, 0)).toEqual(t);
  });

  it('builds valid trees for every preset', () => {
    for (const p of PRESETS)
      for (const seed of [1, 2, 3]) expect(isTree(makeTree(p, seeded(seed)))).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(naryTrace(makeTree('org')).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(naryPseudocode.map((_, i) => i));
  });
});
