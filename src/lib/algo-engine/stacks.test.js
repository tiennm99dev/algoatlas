import { describe, expect, it } from 'vitest';
import { CAPACITY, MAX_OPS, makeStackOps, pushOps, stackPseudocode, stackTrace } from './stacks.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./stacks.js').StackOp} StackOp */
/** @typedef {import('./stacks.js').StackImpl} StackImpl */

/**
 * Plain-array oracle: final contents and what each pop or peek returns (null on underflow).
 * @param {StackOp[]} ops @param {number} capacity
 */
function oracle(ops, capacity) {
  /** @type {number[]} */
  const list = [];
  /** @type {(number | null)[]} */
  const answers = [];
  for (const op of ops) {
    if (op.type === 'push') {
      if (list.length < capacity) list.push(/** @type {number} */ (op.value));
    } else if (op.type === 'pop')
      answers.push(list.length ? /** @type {number} */ (list.pop()) : null);
    else answers.push(list.length ? list[list.length - 1] : null);
  }
  return { list, answers };
}

/** @param {StackOp[]} ops @param {StackImpl} impl */
function traceAnswers(ops, impl) {
  return stackTrace(ops, impl)
    .filter((f) => f.kind === 'pop' || f.kind === 'peek' || f.kind === 'underflow')
    .map((f) => f.result);
}

describe.each(/** @type {StackImpl[]} */ (['array', 'linked']))('%s stack trace', (impl) => {
  const capacity = impl === 'array' ? CAPACITY : Infinity;

  it('matches an array oracle on random op logs', () => {
    const rand = seeded(impl === 'array' ? 5 : 9);
    for (let run = 0; run < 40; run++) {
      /** @type {StackOp[]} */
      const ops = [];
      for (let k = 0; k < MAX_OPS; k++) {
        const r = rand();
        if (r < 0.55) ops.push({ type: 'push', value: Math.floor(rand() * 100) });
        else if (r < 0.85) ops.push({ type: 'pop' });
        else ops.push({ type: 'peek' });
      }
      const frames = stackTrace(ops, impl);
      const want = oracle(ops, capacity);
      expect(frames.at(-1)?.items).toEqual(want.list);
      expect(traceAnswers(ops, impl)).toEqual(want.answers);
    }
  });

  it('pops in reverse push order: last in, first out', () => {
    const ops = [...pushOps([1, 2, 3]), { type: 'pop' }, { type: 'pop' }, { type: 'pop' }];
    expect(traceAnswers(/** @type {StackOp[]} */ (ops), impl)).toEqual([3, 2, 1]);
  });

  it('reports underflow on an empty stack for pop and peek', () => {
    const frames = stackTrace([{ type: 'pop' }, { type: 'peek' }], impl);
    expect(frames.filter((f) => f.kind === 'underflow')).toHaveLength(2);
    expect(frames.at(-1)?.pops).toBe(0);
    expect(frames.at(-1)?.top).toBe(-1);
  });

  it('touches at most one element per operation, whatever the size', () => {
    const frames = stackTrace(
      [...pushOps([1, 2, 3, 4, 5]), { type: 'pop' }, { type: 'peek' }],
      impl,
    );
    expect(Math.max(...frames.map((f) => f.touched))).toBe(1);
    const last = /** @type {import('./stacks.js').StackFrame} */ (frames.at(-1));
    expect(last.pushes).toBe(5);
    expect(last.pops).toBe(1);
    expect(last.top).toBe(3);
  });

  it('never aliases arrays between frames', () => {
    const frames = stackTrace(pushOps([1, 2, 3]), impl);
    frames[2].items.push(99);
    frames[2].slots.push(99);
    expect(frames[3].items).not.toContain(99);
    expect(frames[3].slots).not.toContain(99);
  });

  it('starts and ends with start and done frames', () => {
    const frames = stackTrace([], impl);
    expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
  });
});

describe('array implementation details', () => {
  it('overflows when every slot is full and keeps the stack unchanged', () => {
    const frames = stackTrace(pushOps([1, 2, 3, 4, 5, 6, 7]), 'array');
    expect(frames.filter((f) => f.kind === 'overflow')).toHaveLength(1);
    expect(frames.at(-1)?.items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(frames.at(-1)?.pushes).toBe(6);
  });

  it('leaves a popped value in its slot, past top', () => {
    const frames = stackTrace([...pushOps([4, 9]), { type: 'pop' }], 'array');
    const last = /** @type {import('./stacks.js').StackFrame} */ (frames.at(-1));
    expect(last.top).toBe(0);
    expect(last.slots.slice(0, 3)).toEqual([4, 9, null]);
  });

  it('the linked implementation never overflows', () => {
    const frames = stackTrace(pushOps([1, 2, 3, 4, 5, 6, 7, 8]), 'linked');
    expect(frames.some((f) => f.kind === 'overflow')).toBe(false);
    expect(frames.at(-1)?.items).toHaveLength(8);
    expect(frames.at(-1)?.slots).toEqual([]);
  });

  it('a linked push shows the new node before it becomes the top', () => {
    const frames = stackTrace(pushOps([4, 9]), 'linked');
    const create = frames.filter((f) => f.kind === 'create')[1];
    expect(create.fresh).toBe(9);
    expect(create.items).toEqual([4]);
  });
});

describe('presets', () => {
  it('build the expected logs', () => {
    expect(makeStackOps('plates')).toHaveLength(3);
    expect(stackTrace(makeStackOps('overflow'), 'array').some((f) => f.kind === 'overflow')).toBe(
      true,
    );
    expect(stackTrace(makeStackOps('underflow'), 'array').some((f) => f.kind === 'underflow')).toBe(
      true,
    );
    const random = makeStackOps('random', seeded(4));
    expect(random.length).toBeGreaterThanOrEqual(5);
    expect(random.length).toBeLessThanOrEqual(8);
    expect(random[0].type).toBe('push');
  });

  it('keeps traces small at the op cap', () => {
    const ops = pushOps(Array.from({ length: MAX_OPS }, (_, i) => i));
    expect(stackTrace(ops, 'array').length).toBeLessThanOrEqual(400);
  });
});

describe('pseudocode coverage', () => {
  it.each(/** @type {StackImpl[]} */ (['array', 'linked']))('highlights every %s line', (impl) => {
    /** @type {StackOp[]} */
    const ops = [
      { type: 'pop' },
      ...pushOps([1, 2, 3, 4, 5, 6, 7]),
      { type: 'peek' },
      { type: 'pop' },
    ];
    const seen = new Set(stackTrace(ops, impl).flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(stackPseudocode[impl].map((_, i) => i));
  });
});
