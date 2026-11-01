import { describe, expect, it } from 'vitest';
import {
  MAX_KEY,
  MAX_LIVE_KEYS,
  MAX_OPS,
  formatOps,
  makeRunnerOps,
  parseOps,
  runnerPseudocode,
  runnerTrace,
  seededRand,
} from './practice-balanced-bst.js';

/** @typedef {import('./practice-balanced-bst.js').RunnerFrame} Frame */
/** @typedef {import('./practice-balanced-bst.js').RunnerOp} Op */
/** @typedef {import('./practice-balanced-bst.js').TreeShape} Shape */

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {Frame[]} frames */
const last = (frames) => /** @type {Frame} */ (frames.at(-1));
/** @param {Shape | null} n @returns {number[]} */
const keysOf = (n) => (n ? [...keysOf(n.left), n.key, ...keysOf(n.right)] : []);
/** @param {Shape | null} n @returns {number} */
const heightOf = (n) => (n ? 1 + Math.max(heightOf(n.left), heightOf(n.right)) : 0);
/** @param {string} text */
const ops = (text) => /** @type {{ ops: Op[] }} */ (parseOps(text)).ops;

/** AVL shape: every node's subtrees within one level. @param {Shape | null} n @returns {number} */
function avlHeight(n) {
  if (!n) return 0;
  const l = avlHeight(n.left);
  const r = avlHeight(n.right);
  expect(Math.abs(l - r)).toBeLessThanOrEqual(1);
  return 1 + Math.max(l, r);
}

describe('runner trace', () => {
  it('starts and ends with frames that belong to no operation', () => {
    const frames = runnerTrace([]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[1].bst.total).toBe(0);
    expect(frames[1].size).toBe(0);
  });

  it('agrees with a sorted array on every structure, on random sequences', () => {
    const rand = seeded(5);
    for (let round = 0; round < 40; round++) {
      /** @type {Op[]} */
      const list = [];
      /** @type {number[]} */
      const oracle = [];
      /** @type {(string | number)[]} */
      const expected = [];
      for (let i = 0; i < MAX_OPS; i++) {
        const key = Math.floor(rand() * 30);
        const r = rand();
        const type = r < 0.45 ? 'insert' : r < 0.6 ? 'search' : r < 0.8 ? 'delete' : 'rank';
        list.push({ type, key });
        const at = oracle.indexOf(key);
        if (type === 'insert') {
          expected.push(at >= 0 ? 'dup' : 'added');
          if (at < 0) oracle.push(key);
          oracle.sort((a, b) => a - b);
        } else if (type === 'delete') {
          expected.push(at >= 0 ? 'removed' : 'missing');
          if (at >= 0) oracle.splice(at, 1);
        } else if (type === 'search') {
          expected.push(at >= 0 ? 'found' : 'missing');
        } else {
          expected.push(1 + oracle.filter((k) => k < key).length);
        }
      }
      const frames = runnerTrace(list, { rand });
      frames.slice(1, -1).forEach((f, i) => {
        expect(f.op?.type === 'rank' ? f.rank : f.outcome).toBe(expected[i]);
        expect(keysOf(f.bstTree)).toEqual(keysOf(f.avlTree));
        expect(keysOf(f.avlTree)).toEqual(f.towers.map((t) => t.key));
        expect(avlHeight(f.avlTree)).toBe(f.avl.height);
        expect(heightOf(f.bstTree)).toBe(f.bst.height);
      });
      expect(last(frames).towers.map((t) => t.key)).toEqual(oracle);
    }
  });

  it('counts a chain on sorted keys and a logarithmic walk in the AVL tree', () => {
    const frames = runnerTrace(makeRunnerOps('sorted'));
    const f = last(frames);
    expect(f.bst.height).toBe(15);
    expect(f.avl.height).toBe(4);
    expect(f.bst.worst).toBe(15);
    expect(f.avl.worst).toBe(4);
  });

  it('a search compares exactly the keys on its path, ending at the key', () => {
    const frames = runnerTrace(ops('i5 i3 i8 s8 s4'));
    expect(frames[4].bst.path).toEqual([5, 8]);
    expect(frames[5].bst.path).toEqual([5, 3]);
    expect(frames[5].outcome).toBe('missing');
    expect(frames[4].bst.cost).toBe(2);
  });

  it('a skip list compares each next tower it reads, with known towers', () => {
    // Heads then tails gives heights from the generator: 5 gets height 2 and 3 gets height 1.
    const coins = [0.1, 0.9, 0.9];
    const rand = () => /** @type {number} */ (coins.shift());
    const frames = runnerTrace(ops('i5 i3 s5 s9'), { rand });
    expect(frames[2].towers).toEqual([
      { key: 3, height: 1 },
      { key: 5, height: 2 },
    ]);
    expect(frames[3].skip.path).toEqual([5, 3, 5]);
    expect(frames[3].outcome).toBe('found');
    expect(frames[4].skip.path).toEqual([5]);
    expect(frames[4].outcome).toBe('missing');
  });

  it('rank without counts compares in sorted order; with counts it walks one path', () => {
    const list = ops('i10 i20 i30 i40 i50 r35 r99 r5');
    const walk = runnerTrace(list);
    expect(walk[6].rank).toBe(4);
    expect(walk[6].bst.path).toEqual([10, 20, 30, 40]);
    expect(walk[6].skip.path).toEqual([10, 20, 30, 40]);
    expect(walk[7].rank).toBe(6);
    expect(walk[7].avl.cost).toBe(5);
    expect(walk[8].rank).toBe(1);
    expect(walk[8].avl.cost).toBe(1);
    const counted = runnerTrace(list, { counted: true });
    expect(counted[6].rank).toBe(4);
    expect(counted[6].bst.path).toEqual([10, 20, 30, 40]);
    expect(counted[6].avl.cost).toBeLessThanOrEqual(3);
  });

  it('a duplicate insert and a missing delete change nothing', () => {
    const frames = runnerTrace(ops('i5 i5 d9'));
    expect(frames[2].outcome).toBe('dup');
    expect(frames[3].outcome).toBe('missing');
    expect(last(frames).size).toBe(1);
    expect(last(frames).towers).toHaveLength(1);
  });

  it('counts AVL rotations and never rotates the plain tree', () => {
    const frames = runnerTrace(ops('i1 i2 i3'));
    expect(frames[3].opRotations).toBe(1);
    expect(last(frames).rotations).toBe(1);
    expect(heightOf(last(frames).bstTree)).toBe(3);
  });

  it('deletes two-child nodes correctly in both trees', () => {
    const frames = runnerTrace(ops('i4 i2 i6 i1 i3 i5 i7 d4 d2'));
    expect(keysOf(last(frames).bstTree)).toEqual([1, 3, 5, 6, 7]);
    expect(keysOf(last(frames).avlTree)).toEqual([1, 3, 5, 6, 7]);
  });

  it('the same seed gives the same towers, and another seed can differ', () => {
    const list = makeRunnerOps('sorted');
    const a = last(runnerTrace(list, { rand: seededRand(1) }));
    const b = last(runnerTrace(list, { rand: seededRand(1) }));
    expect(a.towers).toEqual(b.towers);
    const totals = new Set();
    for (let s = 1; s <= 12; s++)
      totals.add(last(runnerTrace(list, { rand: seededRand(s) })).skip.total);
    expect(totals.size).toBeGreaterThan(1);
  });

  it('does not alias frames', () => {
    const frames = runnerTrace(ops('i2 i1 i3 s3'));
    const before = JSON.stringify(frames[3]);
    frames[2].towers[0].key = 99;
    /** @type {Shape} */ (frames[2].bstTree).key = 99;
    frames[2].bst.path.push(99);
    frames[2].lines.push(99);
    expect(JSON.stringify(frames[3])).toBe(before);
  });

  it('stays well under the frame budget', () => {
    expect(runnerTrace(makeRunnerOps('window')).length).toBeLessThanOrEqual(MAX_OPS + 2);
  });
});

describe('parseOps', () => {
  it('reads letters and keys, in either case, separated by spaces or commas', () => {
    expect(ops('i5, S7  d3 R99')).toEqual([
      { type: 'insert', key: 5 },
      { type: 'search', key: 7 },
      { type: 'delete', key: 3 },
      { type: 'rank', key: MAX_KEY },
    ]);
    expect(formatOps(ops('i5, S7  d3 R99'))).toBe('i5 s7 d3 r99');
  });

  it('refuses what it cannot read', () => {
    expect(parseOps('  ')).toEqual({ error: 'empty' });
    expect(parseOps('x5')).toEqual({ error: 'format' });
    expect(parseOps('i')).toEqual({ error: 'format' });
    expect(parseOps('i100')).toEqual({ error: 'format' });
    expect(
      parseOps(
        Array(MAX_OPS + 1)
          .fill('s1')
          .join(' '),
      ),
    ).toEqual({ error: 'count' });
    const tooMany = Array.from({ length: MAX_LIVE_KEYS + 1 }, (_, i) => `i${i}`).join(' ');
    expect(parseOps(tooMany)).toEqual({ error: 'full' });
    expect('ops' in parseOps(`${tooMany.replace('i15', 'd0')} i15`)).toBe(true);
  });

  it('accepts every preset', () => {
    for (const p of /** @type {const} */ (['sorted', 'shuffled', 'scoreboard', 'window'])) {
      expect(parseOps(formatOps(makeRunnerOps(p)))).toEqual({ ops: makeRunnerOps(p) });
    }
    expect('ops' in parseOps(formatOps(makeRunnerOps('random', seeded(9))))).toBe(true);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line across both rank modes', () => {
    const list = makeRunnerOps('scoreboard');
    const seen = new Set(
      [...runnerTrace(list), ...runnerTrace(list, { counted: true })].flatMap((f) => f.lines),
    );
    runnerPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});

describe('numbers the practice questions rely on', () => {
  /** @param {Parameters<typeof makeRunnerOps>[0]} preset @param {boolean} [counted] */
  const finish = (preset, counted = false) => last(runnerTrace(makeRunnerOps(preset), { counted }));

  it('sorted inserts', () => {
    const f = finish('sorted');
    expect(f.bst.total).toBe(170);
    expect(f.avl.worst).toBe(4);
  });

  it('shuffled inserts favour the plain tree slightly', () => {
    const f = finish('shuffled');
    expect(f.bst.total).toBe(57);
    expect(f.avl.total).toBe(59);
  });

  it('stored counts save 50 AVL comparisons on the scoreboard, all of them in the ranks', () => {
    const walk = runnerTrace(makeRunnerOps('scoreboard'));
    const counted = runnerTrace(makeRunnerOps('scoreboard'), { counted: true });
    expect(last(walk).avl.total).toBe(117);
    expect(last(counted).avl.total).toBe(67);
    /** @param {Frame[]} frames */
    const ranks = (frames) =>
      frames.filter((f) => f.op?.type === 'rank').reduce((s, f) => s + f.avl.cost, 0);
    expect(ranks(walk)).toBe(80);
    expect(ranks(counted)).toBe(30);
  });

  it('the sliding window', () => {
    const f = finish('window');
    expect(f.bst.total).toBe(100);
    expect(f.avl.total).toBe(69);
  });

  it('the typed rank question', () => {
    expect(runnerTrace(ops('i10 i20 i30 i40 i50 r35'))[6].rank).toBe(4);
  });

  it('1,000 sorted inserts', () => {
    expect((1000 * 999) / 2).toBe(499500);
  });
});
