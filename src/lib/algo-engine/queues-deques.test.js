import { describe, expect, it } from 'vitest';
import {
  CAPACITY,
  MAX_OPS,
  dequePseudocode,
  dequeTrace,
  enqueueOps,
  makeDequeOps,
} from './queues-deques.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./queues-deques.js').DequeOp} DequeOp */
/** @typedef {import('./queues-deques.js').DequeFrame} DequeFrame */

/**
 * Plain-array oracle: contents front to back, each pop's result, and the shifts a plain array
 * with the front at index 0 makes.
 * @param {DequeOp[]} ops
 */
function oracle(ops) {
  /** @type {number[]} */
  let list = [];
  /** @type {(number | null)[]} */
  const answers = [];
  let shifts = 0;
  for (const op of ops) {
    const v = /** @type {number} */ (op.value);
    if (op.type === 'push-back') {
      if (list.length < CAPACITY) list = [...list, v];
    } else if (op.type === 'push-front') {
      if (list.length < CAPACITY) {
        shifts += list.length;
        list = [v, ...list];
      }
    } else if (op.type === 'pop-front') {
      if (list.length) shifts += list.length - 1;
      answers.push(list.length ? list[0] : null);
      list = list.slice(1);
    } else {
      answers.push(list.length ? list[list.length - 1] : null);
      list = list.slice(0, -1);
    }
  }
  return { list, answers, shifts };
}

/** @param {DequeFrame[]} frames */
const answers = (frames) =>
  frames
    .filter((f) => f.kind === 'pop-front' || f.kind === 'pop-back' || f.kind === 'empty')
    .map((f) => f.result);

describe('circular deque trace', () => {
  it('matches an array oracle on random op logs', () => {
    const rand = seeded(17);
    /** @type {DequeOp['type'][]} */
    const types = ['push-back', 'pop-front', 'push-front', 'pop-back'];
    for (let run = 0; run < 60; run++) {
      /** @type {DequeOp[]} */
      const ops = [];
      for (let k = 0; k < MAX_OPS; k++) {
        const type = types[Math.floor(rand() * (rand() < 0.5 ? 2 : 4))];
        ops.push(type.startsWith('push') ? { type, value: Math.floor(rand() * 100) } : { type });
      }
      const frames = dequeTrace(ops);
      const want = oracle(ops);
      const last = /** @type {DequeFrame} */ (frames.at(-1));
      expect(last.items).toEqual(want.list);
      expect(last.size).toBe(want.list.length);
      expect(answers(frames)).toEqual(want.answers);
      expect(last.naiveShifts).toBe(want.shifts);
    }
  });

  it('serves a queue first in, first out', () => {
    const frames = dequeTrace([
      ...enqueueOps([1, 2, 3]),
      { type: 'pop-front' },
      { type: 'pop-front' },
      { type: 'pop-front' },
    ]);
    expect(answers(frames)).toEqual([1, 2, 3]);
  });

  it('wraps the back index to slot 0 and counts the wrap', () => {
    const frames = dequeTrace(makeDequeOps('wrap'));
    const last = /** @type {DequeFrame} */ (frames.at(-1));
    expect(last.head).toBe(4);
    expect(last.size).toBe(5);
    expect(last.tail).toBe(1);
    expect(last.slots[0]).toBe(90);
    expect(last.items).toEqual([50, 60, 70, 80, 90]);
    expect(last.wraps).toBe(1);
    const wrap = frames.find((f) => f.wrapped);
    expect(wrap?.kind).toBe('push-back');
    expect(wrap?.at).toBe(0);
  });

  it('pushes at the front by stepping head back, wrapping from 0 to C − 1', () => {
    const frames = dequeTrace([{ type: 'push-front', value: 9 }]);
    const push = /** @type {DequeFrame} */ (frames.find((f) => f.kind === 'push-front'));
    expect(push.head).toBe(CAPACITY - 1);
    expect(push.at).toBe(CAPACITY - 1);
    expect(push.wrapped).toBe(true);
    expect(push.naiveShifts).toBe(0);
  });

  it('refuses a ninth item and a pop from empty, leaving the buffer unchanged', () => {
    const full = dequeTrace(makeDequeOps('full'));
    expect(full.filter((f) => f.kind === 'full')).toHaveLength(1);
    expect(full.at(-1)?.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(full.at(-1)?.tail).toBe(full.at(-1)?.head);
    const empty = dequeTrace([{ type: 'pop-front' }, { type: 'pop-back' }]);
    expect(empty.filter((f) => f.kind === 'empty')).toHaveLength(2);
    expect(empty.at(-1)?.tail).toBe(empty.at(-1)?.head);
  });

  it('a plain array shifts on every dequeue, the ring never does', () => {
    const frames = dequeTrace([...enqueueOps([1, 2, 3, 4, 5]), { type: 'pop-front' }]);
    expect(frames.at(-1)?.naiveShifts).toBe(4);
  });

  it('keeps stale values in popped slots', () => {
    const frames = dequeTrace([...enqueueOps([7, 8]), { type: 'pop-front' }]);
    expect(frames.at(-1)?.slots.slice(0, 2)).toEqual([7, 8]);
    expect(frames.at(-1)?.head).toBe(1);
  });

  it('never aliases arrays between frames', () => {
    const frames = dequeTrace(enqueueOps([1, 2, 3]));
    frames[2].slots[0] = 99;
    frames[2].items.push(99);
    expect(frames[3].slots[0]).toBe(1);
    expect(frames[3].items).not.toContain(99);
  });

  it('builds presets and keeps traces small at the op cap', () => {
    expect(makeDequeOps('queue')).toHaveLength(4);
    expect(makeDequeOps('deque').some((op) => op.type === 'push-front')).toBe(true);
    const random = makeDequeOps('random', seeded(2));
    expect(random.length).toBeGreaterThanOrEqual(8);
    expect(random.length).toBeLessThanOrEqual(MAX_OPS);
    expect(dequeTrace(enqueueOps(Array(MAX_OPS).fill(1))).length).toBeLessThanOrEqual(400);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = dequeTrace([
      { type: 'pop-front' },
      { type: 'pop-back' },
      ...enqueueOps([1, 2, 3, 4, 5, 6, 7, 8, 9]),
      { type: 'push-front', value: 0 },
      { type: 'pop-front' },
      { type: 'pop-back' },
      { type: 'push-front', value: 0 },
    ]);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(dequePseudocode.map((_, i) => i));
  });
});
