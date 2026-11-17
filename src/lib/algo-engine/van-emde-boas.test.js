import { describe, expect, it } from 'vitest';
import {
  MAX_KEYS,
  MAX_OPS,
  UNIVERSES,
  keysAfter,
  levelsOf,
  makeVebOps,
  parentPath,
  shortName,
  structureTree,
  vebPseudocode,
  vebTrace,
} from './van-emde-boas.js';

/** Deterministic LCG so shuffles are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./van-emde-boas.js').VebOp} VebOp */
/** @typedef {import('./van-emde-boas.js').VebNode} VebNode */
/** @typedef {import('./van-emde-boas.js').VebFrame} VebFrame */
/** @typedef {import('./van-emde-boas.js').Universe} Universe */

/**
 * An independent oracle: a plain sorted array; the successor is the first larger key.
 * @param {VebOp[]} ops
 */
function oracle(ops) {
  /** @type {number[]} */
  let set = [];
  /** @type {(number | null)[]} */
  const answers = [];
  for (const op of ops) {
    if (op.type === 'insert' && !set.includes(op.value))
      set = [...set, op.value].sort((a, b) => a - b);
    else if (op.type === 'delete') set = set.filter((k) => k !== op.value);
    else if (op.type === 'successor') answers.push(set.find((k) => k > op.value) ?? null);
  }
  return { set, answers };
}

/**
 * The keys a structure really stores, read back from the drawn nodes: its min and max plus
 * every cluster's keys, and a check that the summary lists exactly the non-empty clusters.
 * @param {VebNode[]} nodes @param {string} path @param {number} u
 * @returns {number[]}
 */
function readBack(nodes, path, u) {
  const n = nodes.find((x) => x.path === path);
  if (!n || n.min === null) return [];
  const keys = new Set([n.min, /** @type {number} */ (n.max)]);
  if (u > 2) {
    const r = Math.sqrt(u);
    /** @type {number[]} */
    const nonEmpty = [];
    for (let c = 0; c < r; c++) {
      const inner = readBack(nodes, `${path}.${c}`, r);
      if (inner.length) nonEmpty.push(c);
      for (const l of inner) {
        // The min is never stored again inside a cluster.
        expect(c * r + l).not.toBe(n.min);
        keys.add(c * r + l);
      }
    }
    expect(readBack(nodes, `${path}.S`, r)).toEqual(nonEmpty);
  }
  const sorted = [...keys].sort((a, b) => a - b);
  expect(sorted[0]).toBe(n.min);
  expect(sorted.at(-1)).toBe(n.max);
  return sorted;
}

/** @param {() => number} rand @param {Universe} u @returns {VebOp[]} */
function randomOps(rand, u) {
  /** @type {VebOp[]} */
  const ops = [];
  while (ops.length < MAX_OPS) {
    const set = [...keysAfter(ops)];
    const r = rand();
    if (set.length < MAX_KEYS && (set.length === 0 || r < 0.45)) {
      const x = Math.floor(rand() * u);
      if (!set.includes(x)) ops.push({ type: 'insert', value: x });
    } else if (r < 0.7) {
      ops.push({ type: 'delete', value: set[Math.floor(rand() * set.length)] });
    } else {
      ops.push({ type: 'successor', value: Math.floor(rand() * u) });
    }
  }
  return ops;
}

describe('van Emde Boas trace', () => {
  it.each(UNIVERSES)('matches a sorted array on random logs (u = %i)', (u) => {
    const rand = seeded(u);
    for (let t = 0; t < 150; t++) {
      const ops = randomOps(rand, u);
      const frames = vebTrace(ops, u);
      const want = oracle(ops);
      const last = /** @type {VebFrame} */ (frames.at(-1));
      expect(last.set).toEqual(want.set);
      expect(readBack(last.nodes, 'V', u)).toEqual(want.set);
      const answers = frames
        .filter((f) => f.kind === 'answer' && f.op === 'successor')
        .map((f) => f.result);
      expect(answers).toEqual(want.answers);
    }
  });

  it.each(UNIVERSES)('keeps the structure consistent after every operation (u = %i)', (u) => {
    const rand = seeded(u + 1);
    for (let t = 0; t < 30; t++) {
      for (const f of vebTrace(randomOps(rand, u), u)) {
        if (f.kind === 'answer') expect(readBack(f.nodes, 'V', u)).toEqual(f.set);
      }
    }
  });

  it.each(UNIVERSES)('visits at most log₂ log₂ u + 1 levels per successor (u = %i)', (u) => {
    const rand = seeded(7 * u);
    for (let t = 0; t < 30; t++) {
      for (const f of vebTrace(randomOps(rand, u), u)) {
        if (f.op === 'successor') {
          expect(f.depth).toBeLessThanOrEqual(levelsOf(u) + 1);
          expect(f.calls).toBeLessThanOrEqual(levelsOf(u) + 1);
        }
      }
    }
  });

  it('finds successors in the textbook set', () => {
    const { universe, ops } = makeVebOps('clrs');
    const frames = vebTrace(ops, universe);
    const answers = frames.filter((f) => f.kind === 'answer' && f.op === 'successor');
    expect(answers.map((f) => [f.result, f.calls, f.depth])).toEqual([
      [7, 3, 3],
      [14, 3, 3],
    ]);
    // successor(5) goes into cluster 1; successor(7) has to ask the summary.
    expect(frames.filter((f) => f.opIndex === 7).map((f) => f.kind)).toContain('in-cluster');
    expect(frames.filter((f) => f.opIndex === 8).map((f) => f.kind)).toContain('to-summary');
    const last = /** @type {VebFrame} */ (frames.at(-1));
    expect(last.nodes.find((n) => n.path === 'V')).toEqual({ path: 'V', u: 16, min: 2, max: 15 });
    // 2 is the root's min, so cluster 0 holds only 3 (low 3).
    expect(last.nodes.find((n) => n.path === 'V.0')).toEqual({ path: 'V.0', u: 4, min: 3, max: 3 });
  });

  it('goes one level deeper in u = 256', () => {
    const { universe, ops } = makeVebOps('wide');
    const frames = vebTrace(ops, universe);
    const last = frames.filter((f) => f.kind === 'answer').at(-1);
    expect(last?.result).toBe(200);
    expect(last?.depth).toBe(4);
    // In successor(44), V.S.S holds one bit per 64 keys.
    const call = frames.find((f) => f.opIndex === 6 && f.kind === 'call' && f.path === 'V.S.S');
    expect(call?.span).toEqual([0, 64]);
  });

  it('deletes the min, the max and a whole cluster', () => {
    const { universe, ops } = makeVebOps('deletes');
    const frames = vebTrace(ops, universe);
    const kinds = new Set(frames.map((f) => f.kind));
    for (const k of ['del-only', 'del-base', 'del-min', 'del-summary', 'del-max'])
      expect(kinds.has(/** @type {VebFrame['kind']} */ (k))).toBe(true);
    expect(frames.at(-1)?.set).toEqual([3, 4, 5, 14]);
    expect(frames.findLast((f) => f.kind === 'answer')?.result).toBe(14);
  });

  it('handles edge cases: no ops, an empty set, no successor, duplicates and missing keys', () => {
    expect(vebTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
    const empty = vebTrace([{ type: 'successor', value: 3 }]);
    expect(empty.find((f) => f.kind === 'answer')?.result).toBeNull();
    const top = vebTrace([
      { type: 'insert', value: 9 },
      { type: 'successor', value: 9 },
      { type: 'successor', value: 15 },
    ]);
    expect(top.filter((f) => f.kind === 'answer').map((f) => f.result)).toEqual([null, null, null]);
    const dup = vebTrace([
      { type: 'insert', value: 4 },
      { type: 'insert', value: 4 },
      { type: 'delete', value: 5 },
    ]);
    expect(dup.map((f) => f.kind)).toContain('present');
    expect(dup.map((f) => f.kind)).toContain('absent');
    expect(dup.at(-1)?.set).toEqual([4]);
    const one = vebTrace([
      { type: 'insert', value: 0 },
      { type: 'delete', value: 0 },
    ]);
    expect(one.at(-1)?.set).toEqual([]);
    expect(one.at(-1)?.nodes).toEqual([{ path: 'V', u: 16, min: null, max: null }]);
  });

  it('names paths and builds the drawn tree', () => {
    expect(['V', 'V.S', 'V.3', 'V.12.S'].map(shortName)).toEqual(['V', 'S', 'c3', 'S']);
    expect(parentPath('V.3.S')).toBe('V.3');
    expect(parentPath('V')).toBeNull();
    const tree = structureTree([
      { path: 'V', u: 16, min: 1, max: 9 },
      { path: 'V.2', u: 4, min: 1, max: 1 },
      { path: 'V.S', u: 4, min: 2, max: 2 },
      { path: 'V.1.S', u: 2, min: null, max: null },
    ]);
    expect(tree?.children.map((b) => b.node.path)).toEqual(['V.S', 'V.1', 'V.2']);
    expect(tree?.children[1].node).toEqual({ path: 'V.1', u: 4, min: null, max: null });
  });

  it('builds random presets within the limits', () => {
    for (const u of UNIVERSES) {
      const { universe, ops } = makeVebOps('random', u, seeded(3));
      expect(universe).toBe(u);
      expect(ops.length).toBeLessThanOrEqual(MAX_OPS);
      expect(keysAfter(ops).size).toBeLessThanOrEqual(MAX_KEYS);
      expect(ops.every((op) => op.value >= 0 && op.value < u)).toBe(true);
    }
  });

  it('stays under 400 frames at the caps', () => {
    // Fill 12 keys spread over every cluster, then delete four: the costliest log.
    const keys = [0, 17, 34, 51, 68, 85, 102, 119, 136, 153, 170, 255];
    /** @type {VebOp[]} */
    const ops = [
      ...keys.map((value) => /** @type {VebOp} */ ({ type: 'insert', value })),
      ...[0, 255, 119, 136].map((value) => /** @type {VebOp} */ ({ type: 'delete', value })),
    ];
    expect(ops).toHaveLength(MAX_OPS);
    expect(vebTrace(ops, 256).length).toBeLessThan(400);
    const rand = seeded(5);
    for (let t = 0; t < 50; t++)
      expect(vebTrace(randomOps(rand, 256), 256).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const { universe, ops } = makeVebOps('clrs');
    const frames = vebTrace(ops, universe);
    const before = JSON.stringify(frames[11]);
    frames[10].nodes[0].min = 99;
    frames[10].set.push(99);
    frames[10].stack.push('X');
    if (frames[10].span) frames[10].span[0] = -1;
    expect(JSON.stringify(frames[11])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const frames = [
      ...['clrs', 'deletes', 'wide'].flatMap((p) => {
        const { universe, ops } = makeVebOps(/** @type {'clrs'} */ (p));
        return vebTrace(ops, universe);
      }),
      ...vebTrace([
        { type: 'insert', value: 5 },
        { type: 'insert', value: 9 },
        { type: 'insert', value: 1 },
        { type: 'successor', value: 0 },
        { type: 'successor', value: 9 },
        { type: 'delete', value: 9 },
      ]),
    ];
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((x, y) => x - y)).toEqual(vebPseudocode.map((_, i) => i));
  });
});
