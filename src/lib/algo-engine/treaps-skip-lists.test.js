import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  MAX_SKIP_KEYS,
  MAX_TOWER,
  MAX_TREAP_KEYS,
  MAX_TREAP_OPS,
  makeSkipOps,
  makeTreapOps,
  rollHeight,
  skipListPseudocode,
  skipListTrace,
  treapKeys,
  treapPseudocode,
  treapTrace,
} from './treaps-skip-lists.js';

/** @typedef {import('./treaps-skip-lists.js').SkipFrame} SkipFrame */
/** @typedef {import('./treaps-skip-lists.js').SkipOp} SkipOp */
/** @typedef {import('./treaps-skip-lists.js').TreapFrame} TreapFrame */
/** @typedef {import('./treaps-skip-lists.js').TreapOp} TreapOp */

/** Deterministic LCG so sequences are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {SkipFrame[]} frames */
const lastSkip = (frames) => /** @type {SkipFrame} */ (frames.at(-1));
/** @param {TreapFrame[]} frames */
const lastTreap = (frames) => /** @type {TreapFrame} */ (frames.at(-1));

/** BST by key, min-heap by priority. @param {TreapFrame} f */
function assertTreap(f) {
  /** @param {number} s @param {number} lo @param {number} hi @param {number} floor */
  const check = (s, lo, hi, floor) => {
    if (s === -1) return;
    const n = f.nodes[s];
    const key = /** @type {number} */ (n.key);
    expect(key).toBeGreaterThan(lo);
    expect(key).toBeLessThan(hi);
    expect(n.priority).toBeGreaterThanOrEqual(floor);
    check(n.left, lo, key, n.priority);
    check(n.right, key, hi, n.priority);
  };
  check(f.root, -Infinity, Infinity, -Infinity);
}

describe('rollHeight', () => {
  it('counts heads before the first tails and caps the tower', () => {
    const coins = [0.1, 0.2, 0.9];
    let i = 0;
    expect(rollHeight(() => coins[i++])).toBe(3);
    expect(rollHeight(() => 0.9)).toBe(1);
    expect(rollHeight(() => 0)).toBe(MAX_TOWER);
  });

  it('averages close to height 2 and halves at each extra level', () => {
    const rand = seeded(11);
    const n = 20000;
    /** @type {number[]} */
    const counts = Array(MAX_TOWER + 1).fill(0);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const h = rollHeight(rand);
      counts[h]++;
      sum += h;
    }
    expect(sum / n).toBeGreaterThan(1.85);
    expect(sum / n).toBeLessThan(2.05);
    expect(counts[2] / counts[1]).toBeGreaterThan(0.45);
    expect(counts[2] / counts[1]).toBeLessThan(0.55);
  });
});

describe('skip list trace', () => {
  it('starts empty and ends on done', () => {
    const frames = skipListTrace([]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
    expect(frames[0].top).toBe(1);
  });

  it('drops level by level on the search through the towers preset', () => {
    const frames = skipListTrace(makeSkipOps('towers')).filter((f) => f.opIndex === 8);
    expect(frames.map((f) => f.kind)).toEqual([
      'begin',
      'drop',
      'right',
      'drop',
      'right',
      'drop',
      'found',
    ]);
    const found = /** @type {SkipFrame} */ (frames.at(-1));
    expect(found.comparisons).toBe(6);
    expect(found.rights).toBe(2);
    expect(found.drops).toBe(3);
    expect(found.towers[found.next].key).toBe(70);
  });

  it('walks every key when all towers are flat', () => {
    const found = /** @type {SkipFrame} */ (
      skipListTrace(makeSkipOps('flat')).find((f) => f.kind === 'found')
    );
    expect(found.comparisons).toBe(7);
    expect(found.rights).toBe(6);
    expect(found.drops).toBe(0);
  });

  it('flips one coin per extra level, then a tails', () => {
    const frames = skipListTrace([{ type: 'insert', key: 5, height: 3 }]);
    const flips = /** @type {SkipFrame} */ (frames.findLast((f) => f.kind === 'flip')).flips;
    expect(flips).toEqual([true, true, false]);
    const link = /** @type {SkipFrame} */ (frames.find((f) => f.kind === 'link'));
    expect(link.top).toBe(3);
    expect(link.newTower).toBe(0);
  });

  it('skips the tails when a tower reaches the cap', () => {
    const frames = skipListTrace([{ type: 'insert', key: 5, height: MAX_TOWER }]);
    const flips = /** @type {SkipFrame} */ (frames.findLast((f) => f.kind === 'flip')).flips;
    expect(flips).toEqual(Array(MAX_TOWER - 1).fill(true));
  });

  it('reports a missing key and ignores a duplicate before flipping', () => {
    const base = /** @type {SkipOp[]} */ ([{ type: 'insert', key: 5, height: 1 }]);
    expect(
      skipListTrace([...base, { type: 'search', key: 1 }]).some((f) => f.kind === 'missing'),
    ).toBe(true);
    expect(
      skipListTrace([...base, { type: 'delete', key: 1 }]).some((f) => f.kind === 'missing'),
    ).toBe(true);
    const dup = skipListTrace([...base, { type: 'insert', key: 5, height: 3 }]);
    expect(dup.some((f) => f.kind === 'dup')).toBe(true);
    expect(dup.filter((f) => f.opIndex === 1).some((f) => f.kind === 'flip')).toBe(false);
    expect(lastSkip(dup).top).toBe(1);
  });

  it('unlinks a tower and lowers the top with it', () => {
    const f = lastSkip(
      skipListTrace([
        { type: 'insert', key: 5, height: 1 },
        { type: 'insert', key: 9, height: 4 },
        { type: 'delete', key: 9 },
      ]),
    );
    expect(f.towers.map((t) => t.key)).toEqual([5]);
    expect(f.top).toBe(1);
  });

  it('agrees with a sorted set on random logs and finds what it holds', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rand = seeded(seed);
      const set = new Set();
      /** @type {SkipOp[]} */
      const ops = [];
      for (let i = 0; i < 40; i++) {
        const key = Math.floor(rand() * 25);
        const roll = rand();
        const type = roll < 0.5 ? 'insert' : roll < 0.75 ? 'delete' : 'search';
        ops.push({ type, key, height: rollHeight(rand) });
        const frames = skipListTrace(ops).filter((f) => f.opIndex === i);
        if (type === 'search') {
          const end = /** @type {SkipFrame} */ (frames.at(-1));
          expect(end.kind).toBe(set.has(key) ? 'found' : 'missing');
        }
        if (type === 'insert') set.add(key);
        if (type === 'delete') set.delete(key);
      }
      const end = lastSkip(skipListTrace(ops));
      expect(end.towers.map((t) => t.key)).toEqual([...set].sort((a, b) => a - b));
    }
  });

  it('stays under the frame budget at the caps', () => {
    /** @type {SkipOp[]} */
    const ops = Array.from({ length: MAX_SKIP_KEYS }, (_, i) => ({
      type: /** @type {const} */ ('insert'),
      key: i,
      height: i === MAX_SKIP_KEYS - 1 ? MAX_TOWER : 1,
    }));
    while (ops.length < MAX_OPS) ops.push({ type: 'search', key: MAX_SKIP_KEYS - 2 });
    expect(skipListTrace(ops).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = skipListTrace(makeSkipOps('towers'));
    const i = frames.findIndex((f) => f.kind === 'drop');
    const before = JSON.stringify(frames[i + 1]);
    frames[i].towers[0].key = 99;
    frames[i].path[0].level = 99;
    frames[i].flips.push(true);
    frames[i].lines.push(99);
    expect(JSON.stringify(frames[i + 1])).toBe(before);
  });
});

describe('treap trace', () => {
  it('starts empty and ends on done', () => {
    expect(treapTrace([]).map((f) => f.kind)).toEqual(['start', 'done']);
  });

  it('rotates a small priority up to the root', () => {
    const frames = treapTrace([
      { type: 'insert', key: 30, priority: 5 },
      { type: 'insert', key: 10, priority: 9 },
      { type: 'insert', key: 20, priority: 3 },
    ]);
    expect(frames.filter((f) => f.opIndex === 2 && f.kind === 'rotate-up').length).toBe(2);
    const f = lastTreap(frames);
    expect(f.nodes[f.root].key).toBe(20);
    expect(f.rotations).toBe(2);
    assertTreap(f);
  });

  it('builds a chain when priorities rise with the keys', () => {
    const f = lastTreap(treapTrace(makeTreapOps('chain')));
    expect(f.height).toBe(7);
    expect(f.rotations).toBe(0);
  });

  it('stays short on sorted keys with mixed priorities', () => {
    const f = lastTreap(treapTrace(makeTreapOps('shuffled')));
    expect(f.height).toBe(4);
    expect(f.nodes[f.root].key).toBe(20);
  });

  it('builds one shape for the same pairs in any insert order', () => {
    /** @param {TreapFrame} f */
    const shape = (f) => {
      /** @param {number} s @returns {unknown} */
      const go = (s) =>
        s === -1 ? null : [f.nodes[s].key, go(f.nodes[s].left), go(f.nodes[s].right)];
      return go(f.root);
    };
    expect(shape(lastTreap(treapTrace(makeTreapOps('reordered'))))).toEqual(
      shape(lastTreap(treapTrace(makeTreapOps('shuffled')))),
    );
    const rand = seeded(4);
    const base = makeTreapOps('shuffled');
    for (let t = 0; t < 10; t++) {
      const copy = base.slice().sort(() => rand() - 0.5);
      expect(shape(lastTreap(treapTrace(copy)))).toEqual(shape(lastTreap(treapTrace(base))));
    }
  });

  it('deletes by rotating the node down to a leaf', () => {
    const ops = /** @type {TreapOp[]} */ ([
      ...makeTreapOps('shuffled'),
      { type: 'delete', key: 20 },
    ]);
    const frames = treapTrace(ops);
    const during = frames.filter((f) => f.opIndex === ops.length - 1);
    expect(during.map((f) => f.kind)).toEqual([
      'visit',
      'found',
      'rotate-down',
      'rotate-down',
      'rotate-down',
      'rotate-down',
      'remove',
    ]);
    const f = lastTreap(frames);
    expect(treapKeys(f)).toEqual([10, 30, 40, 50, 60, 70]);
    assertTreap(f);
    expect(f.nodes[f.root].key).toBe(60);
  });

  it('removes the lone node and reports a missing key', () => {
    const f = lastTreap(
      treapTrace([
        { type: 'insert', key: 5, priority: 1 },
        { type: 'delete', key: 5 },
      ]),
    );
    expect(f.root).toBe(-1);
    expect(f.size).toBe(0);
    const miss = treapTrace([
      { type: 'insert', key: 5, priority: 1 },
      { type: 'search', key: 1 },
    ]);
    expect(miss.some((x) => x.kind === 'missing')).toBe(true);
    const dup = treapTrace([
      { type: 'insert', key: 5, priority: 1 },
      { type: 'insert', key: 5, priority: 2 },
    ]);
    expect(dup.some((x) => x.kind === 'dup')).toBe(true);
    expect(lastTreap(dup).nodes[0].priority).toBe(1);
  });

  it('keeps both orders on random logs, with ties among priorities', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rand = seeded(seed);
      const set = new Set();
      /** @type {TreapOp[]} */
      const ops = [];
      for (let i = 0; i < 40; i++) {
        const key = Math.floor(rand() * 25);
        const roll = rand();
        const type = roll < 0.55 ? 'insert' : roll < 0.8 ? 'delete' : 'search';
        ops.push({ type, key, priority: Math.floor(rand() * 10) });
        if (type === 'insert') set.add(key);
        if (type === 'delete') set.delete(key);
        const f = lastTreap(treapTrace(ops));
        expect(treapKeys(f)).toEqual([...set].sort((a, b) => a - b));
        assertTreap(f);
      }
    }
  });

  it('stays under the frame budget at the caps', () => {
    /** @type {TreapOp[]} */
    const ops = Array.from({ length: MAX_TREAP_KEYS }, (_, i) => ({
      type: /** @type {const} */ ('insert'),
      key: i,
      priority: i,
    }));
    while (ops.length < MAX_TREAP_OPS) ops.push({ type: 'search', key: MAX_TREAP_KEYS - 1 });
    expect(treapTrace(ops).length).toBeLessThan(400);
  });

  it('does not alias frames', () => {
    const frames = treapTrace(makeTreapOps('shuffled'));
    const i = frames.findIndex((f) => f.kind === 'rotate-up');
    const before = JSON.stringify(frames[i + 1]);
    frames[i].nodes[0].priority = 99;
    frames[i].lines.push(99);
    expect(JSON.stringify(frames[i + 1])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every skip list line', () => {
    const seen = new Set(
      skipListTrace([
        ...makeSkipOps('towers'),
        { type: 'insert', key: 45, height: 2 },
        { type: 'delete', key: 45 },
      ]).flatMap((f) => f.lines),
    );
    skipListPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });

  it('highlights every treap line', () => {
    const seen = new Set(
      treapTrace([...makeTreapOps('shuffled'), { type: 'delete', key: 20 }]).flatMap(
        (f) => f.lines,
      ),
    );
    treapPseudocode.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
