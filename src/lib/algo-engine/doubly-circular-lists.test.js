import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  NIL,
  SENTINEL,
  backwardValues,
  doublyOrder,
  doublyTrace,
  doublyValues,
  layoutDoubly,
  liveSlots,
  makeOps,
  plainPseudocode,
  sentinelPseudocode,
} from './doubly-circular-lists.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./doubly-circular-lists.js').DoublyOp} DoublyOp */
/** @typedef {import('./doubly-circular-lists.js').DoublyFrame} DoublyFrame */

/**
 * Array oracle; slots are allocation order, so remove names an allocation index.
 * @param {DoublyOp[]} ops
 */
function oracle(ops) {
  /** @type {{slot: number, value: number}[]} */
  let list = [];
  let next = 0;
  for (const op of ops) {
    if (op.type === 'remove') list = list.filter((e) => e.slot !== op.slot);
    else {
      const e = { slot: next++, value: /** @type {number} */ (op.value) };
      list = op.type === 'push-front' ? [e, ...list] : [...list, e];
    }
  }
  return list.map((e) => e.value);
}

/** @param {() => number} rand */
function randomOps(rand) {
  /** @type {DoublyOp[]} */
  const ops = [];
  let made = 0;
  for (let k = 0; k < MAX_OPS; k++) {
    const r = rand();
    if (r < 0.35 && made > 0) ops.push({ type: 'remove', slot: Math.floor(rand() * made) });
    else {
      ops.push({ type: r < 0.65 ? 'push-front' : 'push-back', value: Math.floor(rand() * 50) });
      made++;
    }
  }
  return ops;
}

/** @param {DoublyFrame} f */
function checkLinks(f) {
  const values = doublyValues(f);
  expect(backwardValues(f)).toEqual(values.slice().reverse());
  if (f.mode === 'sentinel') {
    const order = doublyOrder(f);
    const last = order[order.length - 1];
    expect(f.sentinel.prev).toBe(last);
    if (last !== SENTINEL) expect(f.nodes[last].next).toBe(SENTINEL);
  }
}

describe.each([['sentinel'], ['plain']])('%s doubly linked list trace', (mode) => {
  const m = /** @type {import('./doubly-circular-lists.js').ListMode} */ (mode);

  it('matches an array oracle and keeps prev consistent with next', () => {
    const rand = seeded(5);
    for (let run = 0; run < 40; run++) {
      const ops = randomOps(rand);
      const frames = doublyTrace(ops, m);
      const last = /** @type {DoublyFrame} */ (frames.at(-1));
      expect(doublyValues(last)).toEqual(oracle(ops));
      expect(last.length).toBe(oracle(ops).length);
      checkLinks(last);
    }
  });

  it('builds front and back presets in the right order', () => {
    expect(
      doublyValues(/** @type {DoublyFrame} */ (doublyTrace(makeOps('back'), m).at(-1))),
    ).toEqual([10, 20, 30, 40]);
    expect(
      doublyValues(/** @type {DoublyFrame} */ (doublyTrace(makeOps('front'), m).at(-1))),
    ).toEqual([40, 30, 20, 10]);
  });

  it('writes four pointers for every insert and two for every inner removal', () => {
    const frames = doublyTrace([...makeOps('back'), { type: 'remove', slot: 1 }], m);
    const ends = frames.filter((f, i) => f.opIndex >= 0 && frames[i + 1]?.opIndex !== f.opIndex);
    expect(ends.map((f) => f.writes)).toEqual([4, 4, 4, 4, 2]);
  });

  it('removes the only node and empties the list', () => {
    const frames = doublyTrace(
      [
        { type: 'push-back', value: 7 },
        { type: 'remove', slot: 0 },
      ],
      m,
    );
    const last = /** @type {DoublyFrame} */ (frames.at(-1));
    expect(doublyValues(last)).toEqual([]);
    if (m === 'sentinel') expect(last.sentinel).toEqual({ next: SENTINEL, prev: SENTINEL });
    else expect([last.head, last.tail]).toEqual([NIL, NIL]);
  });

  it('reports a remove of a node that is already gone', () => {
    const frames = doublyTrace(
      [
        { type: 'push-back', value: 7 },
        { type: 'remove', slot: 0 },
        { type: 'remove', slot: 0 },
      ],
      m,
    );
    expect(frames.some((f) => f.kind === 'missing')).toBe(true);
  });

  it('never aliases node arrays between frames', () => {
    const frames = doublyTrace(makeOps('back'), m);
    frames[1].nodes[0].next = 42;
    expect(frames[2].nodes[0].next).not.toBe(42);
  });
});

describe('special cases', () => {
  it('counts null-end branches only without a sentinel', () => {
    const ops = /** @type {DoublyOp[]} */ ([
      { type: 'push-front', value: 1 },
      { type: 'push-back', value: 2 },
      { type: 'remove', slot: 0 },
      { type: 'remove', slot: 1 },
      { type: 'push-back', value: 3 },
    ]);
    expect(doublyTrace(ops, 'sentinel').at(-1)?.special).toBe(0);
    // First insert into empty (1), remove the head (1), remove the only node (2), insert into empty (1).
    expect(doublyTrace(ops, 'plain').at(-1)?.special).toBe(5);
  });
});

describe('layout', () => {
  it('drops a node being removed below the row, after its prev', () => {
    const frames = doublyTrace([...makeOps('back'), { type: 'remove', slot: 1 }], 'sentinel');
    const f = /** @type {DoublyFrame} */ (frames.find((x) => x.kind === 'unlink-next'));
    expect(layoutDoubly(f)).toContainEqual({ id: 1, col: 1.5, row: 1 });
    expect(f.hot).toEqual([{ id: 0, field: 'next' }]);
    const g = /** @type {DoublyFrame} */ (frames.find((x) => x.kind === 'unlink-prev'));
    expect(g.hot).toEqual([{ id: 2, field: 'prev' }]);
  });

  it('places a back insert to the right of the last node', () => {
    const frames = doublyTrace(makeOps('back'), 'sentinel');
    const creates = frames.filter((x) => x.kind === 'create');
    expect(layoutDoubly(creates[3])).toContainEqual({ id: 3, col: 4, row: 1 });
    expect(layoutDoubly(creates[0])).toContainEqual({ id: 0, col: 1, row: 1 });
  });

  it('lists live slots at the end of a log', () => {
    expect(liveSlots([...makeOps('back'), { type: 'remove', slot: 2 }])).toEqual([0, 1, 3]);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['sentinel', sentinelPseudocode],
    ['plain', plainPseudocode],
  ])('%s trace highlights every pseudocode line', (mode, code) => {
    const ops = /** @type {DoublyOp[]} */ ([
      { type: 'push-front', value: 1 },
      { type: 'push-front', value: 2 },
      { type: 'push-back', value: 3 },
      { type: 'remove', slot: 0 },
      { type: 'remove', slot: 1 },
      { type: 'remove', slot: 2 },
      { type: 'push-back', value: 4 },
      { type: 'push-back', value: 5 },
    ]);
    const frames = doublyTrace(ops, /** @type {'sentinel'|'plain'} */ (mode));
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(code.map((_, i) => i));
  });
});
