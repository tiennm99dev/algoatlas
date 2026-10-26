import { describe, expect, it } from 'vitest';
import {
  MAX_OPS,
  NIL,
  buildOps,
  layoutList,
  listValues,
  makeOps,
  singlyPseudocode,
  singlyTrace,
} from './singly-linked-lists.js';

/** Deterministic LCG so random cases are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./singly-linked-lists.js').SinglyOp} SinglyOp */

/**
 * Plain-array oracle: the list values after each op and each get's answer.
 * @param {SinglyOp[]} ops
 */
function oracle(ops) {
  /** @type {number[]} */
  let list = [];
  /** @type {(number | null)[]} */
  const answers = [];
  for (const op of ops) {
    if (op.type === 'insert-head') list = [/** @type {number} */ (op.value), ...list];
    else if (op.type === 'delete-head') list = list.slice(1);
    else if (op.type === 'get') answers.push(list[/** @type {number} */ (op.index)] ?? null);
    else {
      const at = list.indexOf(/** @type {number} */ (op.value));
      if (at >= 0) list = [...list.slice(0, at), ...list.slice(at + 1)];
    }
  }
  return { list, answers };
}

/** @param {SinglyOp[]} ops */
function traceAnswers(ops) {
  return singlyTrace(ops)
    .filter((f) => f.kind === 'found' || f.kind === 'out-of-range')
    .map((f) => (f.kind === 'found' ? f.nodes[f.cur].value : null));
}

describe('singly linked list trace', () => {
  it('builds the list front first from insert-head ops', () => {
    expect(listValues(/** @type {any} */ (singlyTrace(buildOps([3, 1, 2])).at(-1)))).toEqual([
      3, 1, 2,
    ]);
  });

  it('matches an array oracle on random op logs', () => {
    const rand = seeded(11);
    for (let run = 0; run < 40; run++) {
      /** @type {SinglyOp[]} */
      const ops = [];
      for (let k = 0; k < MAX_OPS; k++) {
        const r = rand();
        const value = Math.floor(rand() * 6);
        if (r < 0.4) ops.push({ type: 'insert-head', value });
        else if (r < 0.55) ops.push({ type: 'delete-head' });
        else if (r < 0.8) ops.push({ type: 'get', index: Math.floor(rand() * 6) });
        else ops.push({ type: 'delete', value });
      }
      const frames = singlyTrace(ops);
      const want = oracle(ops);
      expect(listValues(frames[frames.length - 1])).toEqual(want.list);
      expect(frames.at(-1)?.length).toBe(want.list.length);
      expect(traceAnswers(ops)).toEqual(want.answers);
    }
  });

  it('handles the empty list: delete head, get, and delete find nothing', () => {
    const frames = singlyTrace([
      { type: 'delete-head' },
      { type: 'get', index: 0 },
      { type: 'delete', value: 5 },
    ]);
    expect(frames.map((f) => f.kind)).toEqual([
      'start',
      'empty',
      'walk-start',
      'out-of-range',
      'scan-start',
      'miss',
      'done',
    ]);
  });

  it('inserts and deletes at the head with two and one pointer writes and no hops', () => {
    const frames = singlyTrace([...buildOps([1, 2, 3, 4, 5]), { type: 'delete-head' }]);
    const link = frames.filter((f) => f.kind === 'link-head');
    expect(link.every((f) => f.writes === 2 && f.steps === 0)).toBe(true);
    const free = frames.find((f) => f.kind === 'free');
    expect(free?.writes).toBe(1);
    expect(free?.steps).toBe(0);
    expect(listValues(/** @type {any} */ (frames.at(-1)))).toEqual([2, 3, 4, 5]);
  });

  it('counts i hops to read index i', () => {
    const base = buildOps([10, 20, 30, 40, 50]);
    for (let i = 0; i < 5; i++) {
      const found = singlyTrace([...base, { type: 'get', index: i }]).find(
        (f) => f.kind === 'found',
      );
      expect(found?.steps).toBe(i);
      expect(found && found.nodes[found.cur].value).toBe((i + 1) * 10);
    }
    const out = singlyTrace([...base, { type: 'get', index: 7 }]).find(
      (f) => f.kind === 'out-of-range',
    );
    expect(out?.steps).toBe(5);
  });

  it('deletes the first match only, keeping duplicates after it', () => {
    const frames = singlyTrace([...buildOps([4, 7, 4, 9]), { type: 'delete', value: 4 }]);
    expect(listValues(/** @type {any} */ (frames.at(-1)))).toEqual([7, 4, 9]);
    const unlink = frames.find((f) => f.kind === 'unlink');
    expect(unlink?.prev).toBe(NIL);
  });

  it('unlinks a middle node through prev.next and keeps it below the row until freed', () => {
    const frames = singlyTrace([...buildOps([4, 7, 9]), { type: 'delete', value: 7 }]);
    const unlink = /** @type {import('./singly-linked-lists.js').SinglyFrame} */ (
      frames.find((f) => f.kind === 'unlink')
    );
    expect(unlink.steps).toBe(1);
    expect(listValues(unlink)).toEqual([4, 9]);
    const cells = layoutList(unlink);
    expect(cells.find((c) => c.slot === unlink.removed)).toEqual({
      slot: unlink.removed,
      col: 0.5,
      row: 1,
    });
  });

  it('places a fresh node before the head it points at', () => {
    const frames = singlyTrace(buildOps([5, 6]));
    const create = frames.filter((f) => f.kind === 'create')[1];
    expect(layoutList(create)).toEqual([
      { slot: 0, col: 0, row: 0 },
      { slot: 1, col: -0.5, row: 1 },
    ]);
  });

  it('never aliases node arrays between frames', () => {
    const frames = singlyTrace(buildOps([1, 2, 3]));
    frames[2].nodes[0].value = 99;
    expect(frames[3].nodes[0].value).toBe(3);
  });

  it('keeps traces small at the op cap', () => {
    /** @type {SinglyOp[]} */
    const ops = [...buildOps([1, 2, 3, 4, 5, 6, 7, 8])];
    while (ops.length < MAX_OPS) ops.push({ type: 'delete', value: 99 });
    expect(singlyTrace(ops).length).toBeLessThanOrEqual(400);
  });

  it('builds presets of the expected sizes', () => {
    expect(makeOps('short')).toHaveLength(4);
    expect(makeOps('long')).toHaveLength(8);
    const random = makeOps('random', seeded(3));
    expect(random.length).toBeGreaterThanOrEqual(3);
    expect(random.length).toBeLessThanOrEqual(6);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const frames = singlyTrace([
      { type: 'delete-head' },
      ...buildOps([1, 2, 3]),
      { type: 'delete-head' },
      { type: 'get', index: 1 },
      { type: 'delete', value: 3 },
      { type: 'delete', value: 8 },
    ]);
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(singlyPseudocode.map((_, i) => i));
  });
});
