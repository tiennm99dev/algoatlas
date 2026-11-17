import { describe, expect, it } from 'vitest';
import {
  diameter,
  floodMaxTrace,
  floodPseudocode,
  hopDistances,
  neighboursOf,
  randomUids,
} from './distributed-algorithms.js';

/** Deterministic LCG so random graphs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * A graph on ids 0..n-1 from index pairs.
 * @param {number[]} uids @param {[number, number][]} pairs
 */
const graphOf = (uids, pairs) => ({
  ids: uids.map((_, i) => i),
  edges: pairs.map(([from, to]) => ({ from, to })),
  uids,
});

const ring = (/** @type {number[]} */ uids) =>
  graphOf(
    uids,
    uids.map((_, i) => /** @type {[number, number]} */ ([i, (i + 1) % uids.length])),
  );

/** A random connected graph: a random tree plus extra edges. */
function randomGraph(/** @type {number} */ n, /** @type {() => number} */ rand) {
  /** @type {[number, number][]} */
  const pairs = [];
  for (let i = 1; i < n; i++) pairs.push([Math.floor(rand() * i), i]);
  for (let k = 0; k < n; k++) {
    const a = Math.floor(rand() * n);
    const b = Math.floor(rand() * n);
    if (a !== b && !pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)))
      pairs.push([a, b]);
  }
  return graphOf(randomUids(n, rand), pairs);
}

describe('FloodMax leader election', () => {
  it('elects exactly the largest UID and tells every node', () => {
    const rand = seeded(5);
    for (let trial = 0; trial < 30; trial++) {
      const g = randomGraph(2 + Math.floor(rand() * 9), rand);
      for (const variant of /** @type {const} */ (['every', 'change'])) {
        const last = /** @type {import('./distributed-algorithms.js').FloodFrame} */ (
          floodMaxTrace(g, variant).at(-1)
        );
        const top = Math.max(...g.uids);
        expect(last.leaders).toEqual([g.uids.indexOf(top)]);
        expect(last.max.every((x) => x === top)).toBe(true);
      }
    }
  });

  it('builds a BFS tree rooted at the leader', () => {
    const rand = seeded(11);
    for (let trial = 0; trial < 30; trial++) {
      const g = randomGraph(3 + Math.floor(rand() * 8), rand);
      const adj = neighboursOf(g);
      const leader = g.uids.indexOf(Math.max(...g.uids));
      const dist = hopDistances(adj, leader);
      const last = /** @type {import('./distributed-algorithms.js').FloodFrame} */ (
        floodMaxTrace(g, 'change').at(-1)
      );
      for (let v = 0; v < adj.length; v++) {
        if (v === leader) {
          expect(last.parent[v]).toBe(-1);
          continue;
        }
        expect(last.learned[v]).toBe(dist[v]);
        expect(adj[v]).toContain(last.parent[v]);
        expect(dist[last.parent[v]]).toBe(dist[v] - 1);
      }
    }
  });

  it('runs D rounds, the diameter', () => {
    expect(diameter(neighboursOf(ring([1, 2, 3, 4, 5, 6])))).toBe(3);
    const frames = floodMaxTrace(ring([1, 2, 3, 4, 5, 6]), 'every');
    expect(frames.filter((f) => f.kind === 'send')).toHaveLength(3);
    expect(frames.at(-1)?.rounds).toBe(3);
  });

  it('counts 2|E| messages a round when every node always sends', () => {
    const g = ring([3, 7, 2, 9, 4, 6]);
    const frames = floodMaxTrace(g, 'every');
    for (const f of frames.filter((x) => x.kind === 'send')) expect(f.messages).toHaveLength(12);
    expect(frames.at(-1)?.sent).toBe(36);
  });

  it('sends fewer messages when only changed nodes send', () => {
    // A path 0 - 1 - 2 with UIDs 1, 2, 3: round 1 sends 1 + 2 + 1 messages; in round 2 only
    // nodes 0 and 1 changed, so they send 1 + 2.
    const g = graphOf(
      [1, 2, 3],
      [
        [0, 1],
        [1, 2],
      ],
    );
    expect(floodMaxTrace(g, 'change').at(-1)?.sent).toBe(7);
    expect(floodMaxTrace(g, 'every').at(-1)?.sent).toBe(8);
    const rand = seeded(3);
    for (let trial = 0; trial < 20; trial++) {
      const h = randomGraph(8, rand);
      const lazy = floodMaxTrace(h, 'change').at(-1)?.sent ?? 0;
      expect(lazy).toBeLessThanOrEqual(floodMaxTrace(h, 'every').at(-1)?.sent ?? 0);
    }
  });

  it('cannot break symmetry when every UID is the same', () => {
    const last = floodMaxTrace(ring([1, 1, 1, 1, 1]), 'every').at(-1);
    expect(last?.leaders).toEqual([0, 1, 2, 3, 4]);
    expect(last?.parent.every((p) => p === -1)).toBe(true);
  });

  it('elects one leader per piece of a disconnected network', () => {
    const g = graphOf(
      [5, 8, 2, 6],
      [
        [0, 1],
        [2, 3],
      ],
    );
    const last = floodMaxTrace(g, 'every').at(-1);
    expect(last?.leaders).toEqual([1, 3]);
    expect(last?.rounds).toBe(1);
  });

  it('handles a single node and an empty network', () => {
    const one = floodMaxTrace(graphOf([4], []), 'change');
    expect(one.map((f) => f.kind)).toEqual(['start', 'decide', 'done']);
    expect(one.at(-1)?.leaders).toEqual([0]);
    const none = floodMaxTrace(graphOf([], []), 'every');
    expect(none.at(-1)?.leaders).toEqual([]);
  });

  it('records frames that do not alias each other', () => {
    const frames = floodMaxTrace(ring([3, 7, 2, 9]), 'every');
    frames[0].max[0] = 99;
    frames[1].messages[0].value = 99;
    expect(frames[1].max[0]).toBe(3);
    expect(frames[2].messages[0].value).not.toBe(99);
  });

  it('draws distinct random UIDs', () => {
    const uids = randomUids(10, seeded(2));
    expect(new Set(uids).size).toBe(10);
    expect(uids.every((u) => u >= 1 && u <= 99)).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it.each(['every', 'change'])('%s highlights every line', (variant) => {
    const v = /** @type {import('./distributed-algorithms.js').FloodVariant} */ (variant);
    const frames = floodMaxTrace(ring([3, 7, 2, 9]), v);
    const seen = new Set(frames.flatMap((f) => f.lines));
    floodPseudocode(v).forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
