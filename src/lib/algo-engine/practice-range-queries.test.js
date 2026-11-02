import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SEED,
  MAX_N,
  MAX_OPS,
  MIN_N,
  STRUCTURE_IDS,
  WORKLOAD_PRESETS,
  formatOps,
  makeWorkload,
  opsFit,
  parseOps,
  seededRand,
  startValues,
  workloadPseudocode,
  workloadTrace,
} from './practice-range-queries.js';

/** @typedef {import('./practice-range-queries.js').WorkloadFrame} Frame */
/** @typedef {import('./practice-range-queries.js').WorkloadOp} Op */

/** Deterministic LCG so workloads are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {Frame[]} frames */
const last = (frames) => /** @type {Frame} */ (frames.at(-1));
/** @param {string} text @param {number} n */
const ops = (text, n) => /** @type {{ ops: Op[] }} */ (parseOps(text, n)).ops;
/** The frame of the only operation of a one-operation workload. @param {string} text @param {number} n */
const only = (text, n) => workloadTrace(n, ops(text, n))[2];

/** @param {number} x */
const bits = (x) => x.toString(2).replace(/0/g, '').length;

/** Answers to a workload from the bare array, written independently of the engine. @param {number} n @param {Op[]} list */
function oracle(n, list) {
  const a = startValues(n);
  return list.map((op) => {
    if (op.type === 'set') {
      a[op.i] = op.v;
      return null;
    }
    let sum = 0;
    let min = Infinity;
    for (let i = op.l; i <= op.r; i++) {
      sum += a[i];
      min = Math.min(min, a[i]);
    }
    return op.type === 'sum' ? sum : min;
  });
}

describe('workload trace', () => {
  it('opens with nothing built, then pays the builds, then closes on the winner', () => {
    const frames = workloadTrace(8, ops('s0-3', 8));
    expect(frames.map((f) => f.kind)).toEqual(['start', 'build', 'op', 'done']);
    expect(frames[0].stats.segment.total).toBe(0);
    expect(frames[1].stats.segment.total).toBe(15);
    expect(last(frames).cheapest).toEqual(['plain']);
    expect(frames[2].cheapest).toEqual([]);
  });

  it('keeps every answer equal to the oracle, on random mixed workloads', () => {
    const rand = seeded(5);
    for (const n of [MIN_N, 5, 7, 16, 31, 64, 100]) {
      for (let round = 0; round < 15; round++) {
        const list = makeWorkload(n, { sums: 20, mins: 20, sets: 20, ranges: 'any' }, rand);
        const expected = oracle(n, list);
        workloadTrace(n, list)
          .filter((f) => f.kind === 'op')
          .forEach((f, i) => {
            expect(f.truth).toBe(expected[i]);
            for (const id of STRUCTURE_IDS) {
              const s = f.stats[id];
              if (f.truth !== null && !s.out) expect(s.answer).toBe(expected[i]);
            }
          });
      }
    }
  });

  it('keeps Fenwick and prefix sums right on sums and sets, and the sparse table on mins', () => {
    const rand = seeded(9);
    for (const n of [MIN_N, 13, 32, 50]) {
      for (let round = 0; round < 10; round++) {
        const sums = makeWorkload(n, { sums: 30, mins: 0, sets: 30, ranges: 'any' }, rand);
        const sumAnswers = oracle(n, sums);
        workloadTrace(n, sums)
          .filter((f) => f.kind === 'op')
          .forEach((f, i) => {
            expect(f.truth).toBe(sumAnswers[i]);
            expect(f.stats.fenwick.answer).toBe(sumAnswers[i]);
            expect(f.stats.prefix.answer).toBe(sumAnswers[i]);
          });

        const mins = makeWorkload(n, { sums: 0, mins: 30, sets: 30, ranges: 'any' }, rand);
        const minAnswers = oracle(n, mins);
        workloadTrace(n, mins)
          .filter((f) => f.kind === 'op')
          .forEach((f, i) => expect(f.stats.sparse.answer).toBe(minAnswers[i]));
      }
    }
  });

  it('counts builds and stored numbers', () => {
    const n = 16;
    const { stats } = workloadTrace(n, ops('s0-1', n))[1];
    expect(stats.plain.build).toBe(0);
    expect(stats.prefix.build).toBe(n + 1);
    // Levels of 16, 15, 13, 9 and 1 blocks.
    expect(stats.sparse.build).toBe(54);
    expect(stats.segment.build).toBe(2 * n - 1);
    expect(stats.sqrt.build).toBe(n + 4);
    expect(stats.plain.slots).toBe(0);
    expect(stats.fenwick.slots).toBe(n);
    expect(stats.sparse.slots).toBe(54);
    expect(stats.sqrt.slots).toBe(4);
  });

  it('counts a Fenwick build as one write per cell and one push per cell with a parent', () => {
    // Of 1..16, only 16 has no parent inside the array.
    expect(workloadTrace(16, ops('s0-1', 16))[1].stats.fenwick.build).toBe(16 + 15);
    // Of 1..7, cells 4, 6 and 7 all point at 8, which is outside.
    expect(workloadTrace(7, ops('s0-1', 7))[1].stats.fenwick.build).toBe(7 + 4);
  });

  it('counts each structure’s reads on a query with a known cost', () => {
    const n = 1024;
    const f = only('s3-500', n).stats;
    expect(f.plain.cost).toBe(498);
    expect(f.prefix.cost).toBe(2);
    expect(f.fenwick.cost).toBe(bits(501) + bits(3));
    expect(only('m3-500', n).stats.sparse.cost).toBe(2);
    expect(only('s0-1023', n).stats.segment.cost).toBe(1);
    expect(only('s0-1023', n).stats.fenwick.cost).toBe(1);
    expect(only('s0-1022', n).stats.fenwick.cost).toBe(10);
    // Whole blocks of 32: 0..31 and 32..63, then one loose cell.
    expect(only('s0-64', n).stats.sqrt.cost).toBe(3);
    // One cell inside a block: no block is read.
    expect(only('s5-5', n).stats.sqrt.cost).toBe(1);
  });

  it('counts each structure’s writes on a set with a known cost', () => {
    const n = 1024;
    const first = only('u0=5', n).stats;
    expect(first.plain.cost).toBe(1);
    expect(first.prefix.cost).toBe(1024);
    expect(first.fenwick.cost).toBe(11);
    expect(first.segment.cost).toBe(11);
    expect(first.sparse.cost).toBe(first.sparse.build);
    const end = only('u1023=5', n).stats;
    expect(end.prefix.cost).toBe(1);
    expect(end.fenwick.cost).toBe(1);
  });

  it('charges a block reread on a set only when the workload asks for minimums', () => {
    expect(workloadTrace(16, ops('u1=5 s0-3', 16))[2].stats.sqrt.cost).toBe(2);
    expect(workloadTrace(16, ops('u1=5 m0-3', 16))[2].stats.sqrt.cost).toBe(2 + 4);
  });

  it('rereads only the cells a shorter last block has', () => {
    // n = 10 gives blocks of 3, so the last block holds index 9 alone.
    expect(workloadTrace(10, ops('u9=1 m0-1', 10))[2].stats.sqrt.cost).toBe(2 + 1);
  });

  it('sums the build and the operations, and tracks the worst operation', () => {
    const frames = workloadTrace(32, ops('s0-3 s0-20 u5=1', 32));
    const { plain, fenwick } = last(frames).stats;
    expect(plain.work).toBe(4 + 21 + 1);
    expect(plain.total).toBe(26);
    expect(plain.worst).toBe(21);
    expect(fenwick.total).toBe(fenwick.build + fenwick.work);
  });

  it('drops a structure at the first query it cannot answer and stops its count', () => {
    const frames = workloadTrace(16, ops('s0-3 m0-3 u0=1 s0-3', 16));
    const op = frames.filter((f) => f.kind === 'op');
    expect(op[0].dropped).toEqual(['sparse']);
    expect(op[1].dropped).toEqual(['prefix', 'fenwick']);
    expect(op[2].dropped).toEqual([]);
    expect(op[1].lines).toContain(4);
    expect(op[2].lines).not.toContain(4);
    expect(op[0].stats.prefix.answer).toBe(op[0].truth);
    expect(op[1].stats.prefix.answer).toBeNull();
    const frozen = op[1].stats.prefix.total;
    expect(op[3].stats.prefix.total).toBe(frozen);
    expect(op[3].stats.prefix.cost).toBe(0);
    expect(last(frames).cheapest).not.toContain('prefix');
    expect(last(frames).cheapest).not.toContain('sparse');
  });

  it('names every structure that ties for cheapest', () => {
    // n = 4: Fenwick builds in 7 and the segment tree in 7, and each answers the whole array in 1.
    const { stats, cheapest } = last(workloadTrace(4, ops('s0-3 s0-3 s0-3', 4)));
    expect(stats.fenwick.total).toBe(10);
    expect(stats.segment.total).toBe(10);
    expect(stats.prefix.total).toBe(5 + 6);
    expect(stats.plain.total).toBe(12);
    expect(cheapest).toEqual(['fenwick', 'segment']);
  });

  it('crowns the textbook winner on each preset at the largest size', () => {
    /** @param {string} name */
    const winner = (name) =>
      last(workloadTrace(MAX_N, makeWorkload(MAX_N, WORKLOAD_PRESETS[name], seededRand())))
        .cheapest;
    expect(winner('staticSums')).toEqual(['prefix']);
    expect(winner('sumsAndSets')).toEqual(['fenwick']);
    expect(winner('staticMins')).toEqual(['sparse']);
    expect(winner('minsAndSets')).toEqual(['segment']);
    expect(winner('everything')).toEqual(['segment']);
    expect(winner('shortRanges')).toEqual(['plain']);
  });

  it('stays under the frame budget at the largest workload', () => {
    const list = makeWorkload(MAX_N, { sums: MAX_OPS, mins: 0, sets: 0, ranges: 'any' }, seeded(3));
    expect(workloadTrace(MAX_N, list).length).toBeLessThan(400);
  });

  it('does not alias between frames', () => {
    const frames = workloadTrace(8, ops('s0-3 u1=1', 8));
    frames[2].stats.plain.total = 999;
    frames[2].dropped.push('plain');
    /** @type {Op} */ (frames[2].op).type = 'min';
    expect(frames[3].stats.plain.total).not.toBe(999);
    expect(frames[3].dropped).toEqual([]);
    expect(frames[1].stats.plain.total).toBe(0);
  });

  it('does not change the workload it is given', () => {
    const list = ops('s0-3 u1=1 m0-2', 8);
    const before = formatOps(list);
    workloadTrace(8, list);
    expect(formatOps(list)).toBe(before);
  });
});

describe('workload parsing', () => {
  it('reads each operation and writes it back the same way', () => {
    const r = parseOps('s2-9, m0-5  U4=50', 16);
    expect(r).toEqual({
      ops: [
        { type: 'sum', l: 2, r: 9 },
        { type: 'min', l: 0, r: 5 },
        { type: 'set', i: 4, v: 50 },
      ],
    });
    expect(formatOps(/** @type {{ ops: Op[] }} */ (r).ops)).toBe('s2-9 m0-5 u4=50');
  });

  it('names each kind of refusal', () => {
    expect(parseOps('  ', 8)).toEqual({ error: 'empty' });
    expect(parseOps('x1-2', 8)).toEqual({ error: 'format' });
    expect(parseOps('s3', 8)).toEqual({ error: 'format' });
    expect(parseOps('u3', 8)).toEqual({ error: 'format' });
    expect(parseOps('s5-2', 8)).toEqual({ error: 'range' });
    expect(parseOps('s0-8', 8)).toEqual({ error: 'range' });
    expect(parseOps('u8=1', 8)).toEqual({ error: 'range' });
    expect(parseOps('u1=100', 8)).toEqual({ error: 'value' });
    expect(
      parseOps(
        Array(MAX_OPS + 1)
          .fill('s0-1')
          .join(' '),
        8,
      ),
    ).toEqual({ error: 'count' });
  });

  it('tells whether a workload fits a smaller array', () => {
    const list = ops('s0-9 u3=1', 16);
    expect(opsFit(list, 10)).toBe(true);
    expect(opsFit(list, 9)).toBe(false);
    expect(opsFit(ops('u9=1', 16), 9)).toBe(false);
  });
});

describe('workload builder', () => {
  it('makes exactly the asked counts inside the array', () => {
    const rand = seeded(11);
    for (const ranges of /** @type {const} */ (['any', 'short', 'long'])) {
      for (const n of [MIN_N, 9, 64, MAX_N]) {
        const list = makeWorkload(n, { sums: 7, mins: 5, sets: 3, ranges }, rand);
        expect(list.filter((op) => op.type === 'sum')).toHaveLength(7);
        expect(list.filter((op) => op.type === 'min')).toHaveLength(5);
        expect(list.filter((op) => op.type === 'set')).toHaveLength(3);
        expect(opsFit(list, n)).toBe(true);
        for (const op of list) {
          if (op.type === 'set') continue;
          const length = op.r - op.l + 1;
          expect(op.l).toBeGreaterThanOrEqual(0);
          expect(length).toBeGreaterThanOrEqual(ranges === 'long' ? Math.ceil(n / 2) : 1);
          if (ranges === 'short') expect(length).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it('repeats a workload from the same seed', () => {
    const shape = WORKLOAD_PRESETS.everything;
    expect(formatOps(makeWorkload(64, shape, seededRand(DEFAULT_SEED)))).toBe(
      formatOps(makeWorkload(64, shape, seededRand(DEFAULT_SEED))),
    );
  });
});

describe('pseudocode coverage', () => {
  it('every line is highlighted by some frame', () => {
    const seen = new Set(workloadTrace(16, ops('s0-3 m0-3 u1=1', 16)).flatMap((f) => f.lines));
    workloadPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
