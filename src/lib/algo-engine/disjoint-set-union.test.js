import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  N,
  dsuPseudocode,
  dsuTrace,
  forestHeight,
  groupsOf,
  makeOps,
  rootOf,
} from './disjoint-set-union.js';

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./disjoint-set-union.js').DsuFrame} DsuFrame @typedef {import('./disjoint-set-union.js').DsuOp} DsuOp */

/** @param {DsuFrame[]} frames */
const last = (frames) => /** @type {DsuFrame} */ (frames.at(-1));

/**
 * Independent oracle: a label per element, relabelled on every merge (quick-find).
 * @param {DsuOp[]} ops @param {number} n
 */
function oracle(ops, n) {
  const label = Array.from({ length: n }, (_, i) => i);
  /** @type {boolean[]} */
  const answers = [];
  for (const op of ops) {
    if (op.type === 'find') continue;
    const la = label[op.a];
    const lb = label[/** @type {number} */ (op.b)];
    if (op.type === 'same') answers.push(la === lb);
    else if (la !== lb) for (let i = 0; i < n; i++) if (label[i] === lb) label[i] = la;
  }
  /** @type {Map<number, number[]>} */
  const groups = new Map();
  label.forEach((l, i) => groups.set(l, [...(groups.get(l) ?? []), i]));
  return { answers, groups: [...groups.values()].sort((x, y) => x[0] - y[0]) };
}

/** @param {() => number} rand @returns {DsuOp[]} */
function randomLog(rand) {
  const count = Math.floor(rand() * (MAX_OPS + 1));
  const types = /** @type {const} */ (['union', 'union', 'find', 'same']);
  return Array.from({ length: count }, () => {
    const type = types[Math.floor(rand() * types.length)];
    const a = Math.floor(rand() * N);
    return type === 'find' ? { type, a } : { type, a, b: Math.floor(rand() * N) };
  });
}

describe('disjoint set union trace', () => {
  it('matches a quick-find oracle on random logs, groups and query answers', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const ops = randomLog(seeded(seed));
      const frames = dsuTrace(ops);
      const ref = oracle(ops, N);
      expect(groupsOf(last(frames).parent)).toEqual(ref.groups);
      expect(last(frames).sets).toBe(ref.groups.length);
      expect(frames.filter((f) => f.kind === 'answer').map((f) => f.answer)).toEqual(ref.answers);
    }
  });

  it('starts with every element alone and ends on done', () => {
    const frames = dsuTrace([]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[0].parent).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(frames[0].sets).toBe(N);
    expect(frames[0].height).toBe(0);
  });

  it('hangs the root of b under the root of a', () => {
    const f = last(
      dsuTrace([
        { type: 'union', a: 0, b: 1 },
        { type: 'union', a: 2, b: 3 },
        { type: 'union', a: 1, b: 3 },
      ]),
    );
    expect(f.parent.slice(0, 4)).toEqual([0, 0, 0, 2]);
    expect(f.sets).toBe(N - 3);
  });

  it('leaves the forest alone when both elements already share a root', () => {
    const frames = dsuTrace([
      { type: 'union', a: 0, b: 1 },
      { type: 'union', a: 1, b: 0 },
    ]);
    expect(frames.some((f) => f.kind === 'same-set')).toBe(true);
    expect(last(frames).sets).toBe(N - 1);
    expect(last(frames).parent[0]).toBe(0);
  });

  it('counts one step per parent link followed', () => {
    const ops = makeOps('chain');
    const frames = dsuTrace(ops);
    // The unions each find two roots without climbing; find(0) climbs the six-link chain.
    expect(last(frames).steps).toBe(6);
    expect(last(frames).height).toBe(6);
    const end = frames.filter((f) => f.opIndex === ops.length - 1).at(-1);
    expect(end?.kind).toBe('root');
    expect(end?.ra).toBe(6);
    expect(end?.opSteps).toBe(6);
  });

  it('replays the friends preset to five sets after ten steps', () => {
    const f = last(dsuTrace(makeOps('friends')));
    expect(groupsOf(f.parent)).toEqual([[0, 1, 2, 3], [4, 5, 6], [7], [8], [9]]);
    expect(f.steps).toBe(10);
    expect(f.height).toBe(2);
    const answers = dsuTrace(makeOps('friends'))
      .filter((x) => x.kind === 'answer')
      .map((x) => x.answer);
    expect(answers).toEqual([false, true]);
  });

  it('reports the root of a find and a self union as a no-op', () => {
    const frames = dsuTrace([
      { type: 'union', a: 4, b: 4 },
      { type: 'find', a: 4 },
    ]);
    expect(last(frames).sets).toBe(N);
    expect(frames.filter((f) => f.kind === 'root').map((f) => (f.ra >= 0 ? f.ra : f.rb))).toEqual([
      4, 4, 4,
    ]);
  });

  it('keeps random presets inside the element range', () => {
    const ops = makeOps('random', seeded(7));
    for (const op of ops) {
      expect(op.a).toBeGreaterThanOrEqual(0);
      expect(op.a).toBeLessThan(N);
      if (op.type !== 'find') expect(op.b).not.toBe(op.a);
    }
  });

  it('helpers agree with the trace', () => {
    const parent = [0, 0, 1, 2, 4];
    expect(rootOf(parent, 3)).toBe(0);
    expect(forestHeight(parent)).toBe(3);
    expect(groupsOf(parent)).toEqual([[0, 1, 2, 3], [4]]);
  });

  it('stays under 400 frames on a worst-case log at the cap', () => {
    /** @type {DsuOp[]} */
    const ops = [];
    for (let k = 1; k < N; k++) ops.push({ type: 'union', a: k, b: k - 1 });
    while (ops.length < MAX_OPS) ops.push({ type: 'same', a: 0, b: 0 });
    expect(dsuTrace(ops).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = dsuTrace(makeOps('friends'));
    frames[0].parent[0] = 99;
    frames[1].path.push(99);
    expect(frames[1].parent[0]).toBe(0);
    expect(frames[2].path).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = [...dsuTrace(makeOps('friends')), ...dsuTrace(makeOps('chain'))];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(dsuPseudocode.map((_, i) => i));
  });
});
