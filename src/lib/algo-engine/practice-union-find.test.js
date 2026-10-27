import { describe, expect, it } from 'vitest';
import {
  MAX_EDGES,
  N,
  hasEdge,
  makeEdges,
  streamPseudocode,
  streamTrace,
} from './practice-union-find.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./practice-union-find.js').StreamFrame} StreamFrame @typedef {import('./practice-union-find.js').Edge} Edge */

/** @param {StreamFrame[]} frames */
const last = (frames) => /** @type {StreamFrame} */ (frames.at(-1));

/**
 * Independent oracle: before each edge, a BFS over the edges accepted so far decides whether
 * its ends are already connected; components are counted by BFS as well.
 * @param {Edge[]} edges @param {number} n
 */
function oracle(edges, n) {
  /** @type {Edge[]} */
  const kept = [];
  /** @param {number} s */
  const reach = (s) => {
    const seen = new Set([s]);
    const queue = [s];
    while (queue.length) {
      const x = /** @type {number} */ (queue.shift());
      for (const [a, b] of kept) {
        const y = a === x ? b : b === x ? a : -1;
        if (y >= 0 && !seen.has(y)) {
          seen.add(y);
          queue.push(y);
        }
      }
    }
    return seen;
  };
  const count = () => {
    const seen = new Set();
    let c = 0;
    for (let i = 0; i < n; i++) {
      if (seen.has(i)) continue;
      c++;
      for (const x of reach(i)) seen.add(x);
    }
    return c;
  };
  /** @type {string[]} */
  const status = [];
  /** @type {number[]} */
  const history = [];
  for (const [u, v] of edges) {
    if (reach(u).has(v)) status.push('cycle');
    else {
      status.push('tree');
      kept.push([u, v]);
    }
    history.push(count());
  }
  return { status, history };
}

/** @param {() => number} rand @returns {Edge[]} */
function randomStream(rand) {
  const count = Math.floor(rand() * (MAX_EDGES + 1));
  /** @type {Edge[]} */
  const out = [];
  while (out.length < count) {
    const u = Math.floor(rand() * N);
    const v = Math.floor(rand() * N);
    if (u !== v) out.push([u, v]);
  }
  return out;
}

describe('edge stream trace', () => {
  it('flags cycle edges and counts components like a BFS oracle', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const edges = randomStream(seeded(seed));
      const f = last(streamTrace(edges));
      const ref = oracle(edges, N);
      expect(f.status).toEqual(ref.status);
      expect(f.history).toEqual(ref.history);
      expect(f.components).toBe(ref.history.at(-1) ?? N);
      // A forest keeps n − components edges.
      expect(f.status.filter((s) => s === 'tree').length).toBe(N - f.components);
    }
  });

  it('replays the roads preset', () => {
    const f = last(streamTrace(makeEdges('roads')));
    expect(f.history).toEqual([7, 6, 5, 5, 4, 3, 3, 2, 2]);
    expect(f.cycles).toBe(3);
    expect(f.firstCycle).toBe(3);
    expect(f.status).toEqual([
      'tree',
      'tree',
      'tree',
      'cycle',
      'tree',
      'tree',
      'cycle',
      'tree',
      'cycle',
    ]);
    expect(f.comp).toEqual([0, 0, 0, 0, 0, 0, 0, 7]);
  });

  it('accepts every edge of the tree preset and ends with one component', () => {
    const f = last(streamTrace(makeEdges('tree')));
    expect(f.components).toBe(1);
    expect(f.cycles).toBe(0);
    expect(f.firstCycle).toBe(-1);
  });

  it('handles an empty stream and a repeated edge', () => {
    expect(streamTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
    expect(last(streamTrace([])).components).toBe(N);
    const f = last(
      streamTrace([
        [2, 5],
        [5, 2],
      ]),
    );
    expect(f.status).toEqual(['tree', 'cycle']);
  });

  it('names each component by its smallest vertex and reports the two roots', () => {
    const frames = streamTrace([
      [6, 7],
      [5, 6],
    ]);
    const take = frames.filter((f) => f.kind === 'take')[1];
    expect(take.ru).toBe(5);
    expect(take.rv).toBe(take.root[6]);
    expect(last(frames).comp.slice(5)).toEqual([5, 5, 5]);
  });

  it('keeps random presets free of loops and repeats', () => {
    const edges = makeEdges('random', seeded(5));
    expect(edges).toHaveLength(10);
    edges.forEach(([u, v], i) => {
      expect(u).not.toBe(v);
      expect(hasEdge(edges.slice(0, i), u, v)).toBe(false);
    });
  });

  it('keeps union-by-size trees short and counts the links the finds climb', () => {
    // Union by size keeps every tree at most log₂ 8 = 3 links tall.
    for (let seed = 1; seed <= 50; seed++) {
      const frames = streamTrace(randomStream(seeded(seed)));
      for (const f of frames) {
        f.parent.forEach((_, i) => {
          let d = 0;
          for (let x = i; f.parent[x] !== x; x = f.parent[x]) d++;
          expect(d).toBeLessThanOrEqual(3);
        });
      }
    }
    expect(last(streamTrace([[0, 1]])).links).toBe(0);
    expect(
      last(
        streamTrace([
          [0, 1],
          [1, 0],
        ]),
      ).links,
    ).toBe(1);
  });

  it('stays small at the cap and does not alias frames', () => {
    const edges = randomStream(seeded(9))
      .concat(randomStream(seeded(10)))
      .slice(0, MAX_EDGES);
    expect(streamTrace(edges).length).toBeLessThanOrEqual(2 * MAX_EDGES + 2);
    const frames = streamTrace(makeEdges('roads'));
    frames[0].parent[0] = 99;
    frames[0].status[0] = 'cycle';
    frames[1].history.push(99);
    expect(frames[1].parent[0]).not.toBe(99);
    expect(frames[1].status[0]).toBe('pending');
    expect(frames[2].history).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(streamTrace(makeEdges('roads')).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(streamPseudocode.map((_, i) => i));
  });
});
