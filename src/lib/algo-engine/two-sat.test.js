import { describe, expect, it } from 'vitest';
import {
  MAX_CLAUSES,
  VARS,
  literalTrue,
  negate,
  twoSatPseudocode,
  twoSatTrace,
} from './two-sat.js';

/** Deterministic LCG so formulas are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @typedef {import('./two-sat.js').Clause} Clause */

/** Independent oracle: try every assignment. @param {number} vars @param {Clause[]} clauses */
function bruteForce(vars, clauses) {
  for (let mask = 0; mask < 1 << vars; mask++) {
    const value = Array.from({ length: vars }, (_, i) => (mask >> i) & 1);
    if (clauses.every(([a, b]) => literalTrue(a, value) || literalTrue(b, value))) return true;
  }
  return false;
}

/** Literals from the notation `1` = x₁, `-1` = ¬x₁. @param {number[][]} list @returns {Clause[]} */
const parse = (list) =>
  list.map(
    ([a, b]) => /** @type {Clause} */ ([a, b].map((x) => 2 * (Math.abs(x) - 1) + (x < 0 ? 1 : 0))),
  );

const LESSON = parse([
  [-1, 2],
  [-2, 3],
  [1, 3],
  [-3, -4],
  [4, 2],
]);
const UNSAT = parse([
  [1, 2],
  [1, -2],
  [-1, 3],
  [-1, -3],
]);

describe('two-sat trace', () => {
  it('agrees with brute force, and its assignment satisfies every clause', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rand = seeded(seed);
      const vars = 1 + (seed % VARS);
      const count = Math.floor(rand() * (MAX_CLAUSES + 1));
      /** @type {Clause[]} */
      const clauses = Array.from({ length: count }, () => [
        Math.floor(rand() * 2 * vars),
        Math.floor(rand() * 2 * vars),
      ]);
      const last = /** @type {import('./two-sat.js').TwoSatFrame} */ (
        twoSatTrace({ vars, clauses }).at(-1)
      );
      expect(last.sat, `seed ${seed}`).toBe(bruteForce(vars, clauses));
      if (last.sat) {
        for (const [a, b] of clauses)
          expect(literalTrue(a, last.value) || literalTrue(b, last.value)).toBe(true);
      }
    }
  });

  it('builds two implications per clause', () => {
    const frames = twoSatTrace({ vars: VARS, clauses: LESSON });
    const first = frames.find((f) => f.kind === 'clause');
    // (¬x₁ ∨ x₂) gives x₁ → x₂ and ¬x₂ → ¬x₁.
    expect(first?.edges.map((e) => [e.from, e.to])).toEqual([
      [0, 2],
      [3, 1],
    ]);
    expect(frames.at(-1)?.edges).toHaveLength(10);
  });

  it('solves the lesson formula through four components', () => {
    const frames = twoSatTrace({ vars: VARS, clauses: LESSON });
    expect(frames.filter((f) => f.kind === 'scc').map((f) => f.popped)).toEqual([
      [7, 4, 2],
      [0],
      [1],
      [5, 6, 3],
    ]);
    expect(frames.at(-1)?.value).toEqual([1, 1, 1, 0]);
    expect(frames.at(-1)?.sat).toBe(true);
  });

  it('stops at the first variable whose literals share a component', () => {
    const frames = twoSatTrace({ vars: VARS, clauses: UNSAT });
    const conflict = frames.find((f) => f.kind === 'conflict');
    expect(conflict?.variable).toBe(0);
    expect(conflict?.comp[0]).toBe(conflict?.comp[1]);
    expect(frames.at(-1)?.kind).toBe('done');
    expect(frames.at(-1)?.sat).toBe(false);
  });

  it('drops duplicate implications and tautology loops', () => {
    // (x₁ ∨ x₁) gives ¬x₁ → x₁ once; (x₂ ∨ ¬x₂) gives only self loops.
    const frames = twoSatTrace({
      vars: 2,
      clauses: [
        [0, 0],
        [2, 3],
        [0, 0],
      ],
    });
    expect(frames.at(-1)?.edges.map((e) => [e.from, e.to])).toEqual([[1, 0]]);
    expect(frames.at(-1)?.value[0]).toBe(1);
  });

  it('handles an empty formula', () => {
    const frames = twoSatTrace({ vars: 2, clauses: [] });
    expect(frames.at(-1)?.sat).toBe(true);
    expect(frames.filter((f) => f.kind === 'scc')).toHaveLength(4);
  });

  it('negates by flipping the low bit', () => {
    expect(negate(4)).toBe(5);
    expect(negate(5)).toBe(4);
    expect(literalTrue(5, [0, 0, 0])).toBe(true);
  });

  it('does not alias frames', () => {
    const frames = twoSatTrace({ vars: VARS, clauses: LESSON });
    const before = JSON.stringify(frames[3]);
    frames[2].edges[0].to = 9;
    frames[2].comp[0] = 9;
    frames[2].value[0] = 9;
    expect(JSON.stringify(frames[3])).toBe(before);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every pseudocode line', () => {
    const seen = new Set(
      [
        ...twoSatTrace({ vars: VARS, clauses: LESSON }),
        ...twoSatTrace({ vars: VARS, clauses: UNSAT }),
      ].flatMap((f) => f.lines),
    );
    expect([...seen].sort((a, b) => a - b)).toEqual(twoSatPseudocode.map((_, i) => i));
  });
});
