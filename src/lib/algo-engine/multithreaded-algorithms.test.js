import { describe, expect, it } from 'vitest';
import {
  MAX_FIB,
  MAX_P,
  MAX_SORT,
  buildDag,
  fibPseudocode,
  mergeSortPseudocode,
  scheduleTime,
  scheduleTrace,
} from './multithreaded-algorithms.js';

/**
 * Work and span of P-FIB(n) from the recurrences T₁(n) = T₁(n−1) + T₁(n−2) + 2, T∞(n) = T∞(n−1) + 2.
 * @returns {{work: number, span: number}}
 */
function fibCosts(/** @type {number} */ n) {
  if (n <= 1) return { work: 1, span: 1 };
  const a = fibCosts(n - 1);
  const b = fibCosts(n - 2);
  return { work: a.work + b.work + 2, span: Math.max(a.span, b.span) + 2 };
}

/**
 * Work and span of merge sort with a serial merge on the range p..r.
 * @returns {{work: number, span: number}}
 */
function sortCosts(/** @type {number} */ p, /** @type {number} */ r) {
  if (p >= r) return { work: 1, span: 1 };
  const q = Math.floor((p + r) / 2);
  const a = sortCosts(p, q);
  const b = sortCosts(q + 1, r);
  const merge = r - p + 1;
  return { work: 1 + a.work + b.work + merge, span: 1 + Math.max(a.span, b.span) + merge };
}

describe('computation DAGs', () => {
  it('match the work and span recurrences of P-FIB', () => {
    for (let n = 0; n <= MAX_FIB; n++) {
      const dag = buildDag('fib', n);
      expect({ work: dag.work, span: dag.span }).toEqual(fibCosts(n));
    }
    expect(buildDag('fib', 6).span).toBe(11);
  });

  it('match the work and span recurrences of merge sort with a serial merge', () => {
    for (let n = 1; n <= MAX_SORT; n++) {
      const dag = buildDag('mergesort', n);
      expect({ work: dag.work, span: dag.span }).toEqual(sortCosts(0, n - 1));
    }
    // 16 elements: 15 splits, 16 base cases and merges of 16 per level over 4 levels.
    expect(buildDag('mergesort', 16).work).toBe(15 + 16 + 64);
  });

  it('lists strands in a topological order with a critical path of cost T∞', () => {
    const dag = buildDag('mergesort', 11);
    for (const s of dag.strands) for (const p of s.preds) expect(p).toBeLessThan(s.id);
    const cost = dag.critical.reduce((sum, id) => sum + dag.strands[id].cost, 0);
    expect(cost).toBe(dag.span);
    for (let i = 1; i < dag.critical.length; i++) {
      expect(dag.strands[dag.critical[i]].preds).toContain(dag.critical[i - 1]);
    }
  });

  it('has a single strand for the base cases', () => {
    expect(buildDag('fib', 1).strands).toHaveLength(1);
    expect(buildDag('mergesort', 1).strands).toHaveLength(1);
  });
});

describe('greedy schedule', () => {
  it('takes T₁ steps on one processor and T∞ with enough processors', () => {
    for (const dag of [buildDag('fib', 7), buildDag('mergesort', 16)]) {
      expect(scheduleTime(dag, 1)).toBe(dag.work);
      expect(scheduleTime(dag, dag.work)).toBe(dag.span);
    }
  });

  it('meets the work law, the span law and Brent’s bound', () => {
    for (const [program, max] of /** @type {const} */ ([
      ['fib', MAX_FIB],
      ['mergesort', MAX_SORT],
    ])) {
      for (let n = 2; n <= max; n++) {
        const dag = buildDag(program, n);
        for (let p = 1; p <= MAX_P; p++) {
          const tp = scheduleTime(dag, p);
          expect(tp).toBeGreaterThanOrEqual(Math.max(Math.ceil(dag.work / p), dag.span));
          expect(tp).toBeLessThanOrEqual(dag.work / p + dag.span);
        }
      }
    }
  });

  it('runs a strand only after its predecessors and keeps processors busy greedily', () => {
    const dag = buildDag('mergesort', 9);
    const frames = scheduleTrace(dag, 3);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
    /** @type {number[]} */
    const doneAt = Array(dag.strands.length).fill(Infinity);
    for (const f of frames.filter((x) => x.kind === 'step')) {
      expect(f.running.length).toBeLessThanOrEqual(3);
      // Greedy: a processor idles only when nothing is ready.
      if (f.running.length < 3) expect(f.ready).toBe(0);
      for (const id of f.running) {
        for (const p of dag.strands[id].preds) expect(doneAt[p]).toBeLessThan(f.t);
      }
      f.states.forEach((s, id) => {
        if (s === 'done' && doneAt[id] === Infinity) doneAt[id] = f.t;
      });
    }
    const last = /** @type {import('./multithreaded-algorithms.js').ScheduleFrame} */ (
      frames.at(-1)
    );
    expect(last.t).toBe(scheduleTime(dag, 3));
    expect(last.busy).toBe(dag.work);
    expect(last.busy + last.idle).toBe(3 * last.t);
    expect(last.states.every((s) => s === 'done')).toBe(true);
  });

  it('keeps a multi-step strand on one processor until it finishes', () => {
    const dag = buildDag('mergesort', 4);
    const frames = scheduleTrace(dag, 2);
    const root = dag.strands.length - 1;
    const steps = frames.filter((f) => f.running.includes(root));
    expect(steps).toHaveLength(4);
    expect(new Set(steps.map((f) => f.proc[root])).size).toBe(1);
    expect(steps.map((f) => f.remaining[root])).toEqual([3, 2, 1, 0]);
  });

  it('records frames that do not alias each other', () => {
    const frames = scheduleTrace(buildDag('fib', 4), 2);
    frames[1].states[0] = 'waiting';
    frames[1].remaining[0] = 99;
    frames[1].running.push(42);
    expect(frames[2].states[0]).toBe('done');
    expect(frames[2].remaining[0]).toBe(0);
    expect(frames[2].running).not.toContain(42);
  });

  it('stays under 100 frames at the size caps', () => {
    expect(scheduleTrace(buildDag('mergesort', MAX_SORT), 1).length).toBeLessThan(100);
    expect(scheduleTrace(buildDag('fib', MAX_FIB), 1).length).toBeLessThan(100);
  });
});

describe('pseudocode coverage', () => {
  it.each([
    ['fib', fibPseudocode, 5],
    ['mergesort', mergeSortPseudocode, 8],
  ])('%s highlights every line', (program, code, n) => {
    const frames = scheduleTrace(
      buildDag(/** @type {import('./multithreaded-algorithms.js').Program} */ (program), n),
      2,
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    code.forEach((_, i) => expect(seen.has(i), `line ${i}`).toBe(true));
  });
});
