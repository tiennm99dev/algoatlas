import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  PRESETS,
  heldAfter,
  practicePseudocode,
  practiceTrace,
} from './practice-stacks-queues.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./practice-stacks-queues.js').PracticeOp} PracticeOp */
/** @typedef {import('./practice-stacks-queues.js').PracticeFrame} PracticeFrame */

/** @param {PracticeFrame[]} frames */
const results = (frames) =>
  frames
    .filter((f) => ['dequeue', 'pop-main', 'get-min', 'empty'].includes(f.kind))
    .map((f) => f.result);

describe('queue from two stacks', () => {
  it('matches a plain FIFO array on random logs', () => {
    const rand = seeded(31);
    for (let run = 0; run < 60; run++) {
      /** @type {PracticeOp[]} */
      const ops = [];
      /** @type {number[]} */
      const fifo = [];
      /** @type {(number | null)[]} */
      const want = [];
      for (let k = 0; k < MAX_OPS; k++) {
        if (rand() < 0.55) {
          const value = Math.floor(rand() * 100);
          ops.push({ type: 'enqueue', value });
          fifo.push(value);
        } else {
          ops.push({ type: 'dequeue' });
          want.push(fifo.length ? /** @type {number} */ (fifo.shift()) : null);
        }
      }
      const frames = practiceTrace('two-stack-queue', ops);
      expect(results(frames)).toEqual(want);
      const last = /** @type {PracticeFrame} */ (frames.at(-1));
      expect([...last.right].reverse().concat(last.left)).toEqual(fifo);
    }
  });

  it('moves each item at most once, so stack ops stay within 4 per item', () => {
    const rand = seeded(4);
    for (let run = 0; run < 40; run++) {
      /** @type {PracticeOp[]} */
      const ops = Array.from({ length: MAX_OPS }, () =>
        rand() < 0.5 ? { type: 'enqueue', value: 1 } : { type: 'dequeue' },
      );
      const last = /** @type {PracticeFrame} */ (practiceTrace('two-stack-queue', ops).at(-1));
      const enqueues = ops.filter((op) => op.type === 'enqueue').length;
      expect(last.transfers).toBeLessThanOrEqual(enqueues);
      expect(last.stackOps).toBeLessThanOrEqual(4 * enqueues);
      expect(last.done).toBe(ops.length);
    }
  });

  it('counts the mixed preset exactly', () => {
    const frames = practiceTrace('two-stack-queue', PRESETS['two-stack-queue'].mixed());
    expect(results(frames)).toEqual([1, 2, 3, 4]);
    const last = frames.at(-1);
    expect(last?.transfers).toBe(4);
    expect(last?.stackOps).toBe(16);
    expect(frames.filter((f) => f.kind === 'transfer').map((f) => f.moved)).toEqual([3, 2, 1, 4]);
  });

  it('pours only when the outbox is empty', () => {
    const frames = practiceTrace('two-stack-queue', PRESETS['two-stack-queue'].burst());
    const transfersPerDequeue = [0, 0, 0, 0, 0];
    let d = -1;
    for (const f of frames) {
      if (f.kind === 'check') d++;
      if (f.kind === 'transfer') transfersPerDequeue[d]++;
    }
    expect(transfersPerDequeue).toEqual([5, 0, 0, 0, 0]);
  });

  it('reports an empty queue', () => {
    const frames = practiceTrace('two-stack-queue', [{ type: 'dequeue' }]);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'check', 'empty', 'done']);
  });
});

describe('min-stack', () => {
  it('returns the true minimum after every random operation', () => {
    const rand = seeded(12);
    for (let run = 0; run < 60; run++) {
      /** @type {PracticeOp[]} */
      const ops = [];
      /** @type {number[]} */
      const stack = [];
      /** @type {(number | null)[]} */
      const want = [];
      for (let k = 0; k < MAX_OPS; k++) {
        const r = rand();
        if (r < 0.45) {
          const value = Math.floor(rand() * 6);
          ops.push({ type: 'push', value });
          stack.push(value);
        } else if (r < 0.7) {
          ops.push({ type: 'pop' });
          want.push(stack.length ? /** @type {number} */ (stack.pop()) : null);
        } else {
          ops.push({ type: 'get-min' });
          want.push(stack.length ? Math.min(...stack) : null);
        }
      }
      const frames = practiceTrace('min-stack', ops);
      expect(results(frames)).toEqual(want);
      expect(frames.at(-1)?.left).toEqual(stack);
    }
  });

  it('keeps a duplicate minimum so it survives a pop', () => {
    const frames = practiceTrace('min-stack', PRESETS['min-stack'].mixed());
    expect(frames.find((f) => f.kind === 'get-min')?.result).toBe(3);
    expect(frames.at(-1)?.right).toEqual([5, 3]);
  });

  it('skips values above the minimum and keeps mins sorted', () => {
    const frames = practiceTrace('min-stack', [
      { type: 'push', value: 4 },
      { type: 'push', value: 6 },
      { type: 'push', value: 2 },
      { type: 'push', value: 8 },
    ]);
    expect(frames.filter((f) => f.kind === 'skip-min')).toHaveLength(2);
    expect(frames.at(-1)?.right).toEqual([4, 2]);
  });

  it('reports pop and getMin on an empty stack', () => {
    const frames = practiceTrace('min-stack', [{ type: 'pop' }, { type: 'get-min' }]);
    expect(frames.filter((f) => f.kind === 'empty')).toHaveLength(2);
  });
});

describe('frames and helpers', () => {
  it('never alias arrays between frames', () => {
    const frames = practiceTrace('two-stack-queue', PRESETS['two-stack-queue'].burst());
    frames[2].left.push(99);
    frames[2].right.push(99);
    expect(frames[3].left).not.toContain(99);
    expect(frames[3].right).not.toContain(99);
  });

  it('measures what a log leaves held', () => {
    expect(heldAfter('two-stack-queue', PRESETS['two-stack-queue'].burst())).toBe(0);
    expect(heldAfter('min-stack', PRESETS['min-stack'].falling())).toBe(3);
  });

  it('stays small at the op cap', () => {
    /** @type {PracticeOp[]} */
    const ops = [
      ...Array.from({ length: 8 }, () => ({ type: /** @type {const} */ ('enqueue'), value: 1 })),
      ...Array.from({ length: 8 }, () => ({ type: /** @type {const} */ ('dequeue') })),
    ];
    expect(practiceTrace('two-stack-queue', ops).length).toBeLessThanOrEqual(400);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every two-stack queue line', () => {
    const frames = practiceTrace('two-stack-queue', [
      { type: 'dequeue' },
      ...PRESETS['two-stack-queue'].mixed(),
    ]);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort()).toEqual(practicePseudocode['two-stack-queue'].map((_, i) => i));
  });

  it('highlights every min-stack line', () => {
    const frames = practiceTrace('min-stack', PRESETS['min-stack'].mixed());
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort()).toEqual(practicePseudocode['min-stack'].map((_, i) => i));
  });
});
