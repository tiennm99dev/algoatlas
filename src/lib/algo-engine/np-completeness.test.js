import { describe, expect, it } from 'vitest';
import { en as m } from '$lib/lessons/np-completeness/copy.en.js';
import {
  GADGET_PRESETS,
  MAP_PROBLEMS,
  MAP_REDUCTIONS,
  MAX_CLAUSES,
  MAX_VARS,
  formatFormula,
  gadgetGraph,
  gadgetPseudocode,
  gadgetTrace,
  parseFormula,
  satisfies,
  satisfyingAssignment,
} from './np-completeness.js';

/** @typedef {import('./np-completeness.js').Formula} Formula */
/** @typedef {import('./np-completeness.js').GadgetFrame} GadgetFrame */

/** Deterministic LCG so random inputs are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** A random 3-CNF formula over the first `n` variables. @param {() => number} rand */
function randomFormula(
  rand,
  n = 1 + Math.floor(rand() * MAX_VARS),
  m = 1 + Math.floor(rand() * MAX_CLAUSES),
) {
  const names = 'abcd'.slice(0, n);
  const clauses = Array.from({ length: m }, () =>
    Array.from(
      { length: 3 },
      () => `${rand() < 0.5 ? '¬' : ''}${names[Math.floor(rand() * n)]}`,
    ).join(' ∨ '),
  );
  return /** @type {Formula} */ (parseFormula(clauses.map((c) => `(${c})`).join(' ∧ ')));
}

/** The smallest vertex cover size by trying every subset of the vertices. */
/** @param {number} size @param {{a: number, b: number}[]} edges */
function minCover(size, edges) {
  let best = size;
  for (let mask = 0; mask < 1 << size; mask++) {
    let bits = 0;
    for (let x = mask; x; x &= x - 1) bits++;
    if (bits >= best) continue;
    if (edges.every((e) => mask & (1 << e.a) || mask & (1 << e.b))) best = bits;
  }
  return best;
}

/** @param {Formula} f @param {boolean[]} a */
const last = (f, a) => /** @type {GadgetFrame} */ (gadgetTrace(f, a).at(-1));

const preset = (/** @type {string} */ key) => {
  const p = /** @type {(typeof GADGET_PRESETS)[number]} */ (
    GADGET_PRESETS.find((x) => x.key === key)
  );
  return { f: /** @type {Formula} */ (parseFormula(p.formula)), a: p.assignment };
};

describe('3-SAT to vertex cover', () => {
  it('has a cover of k vertices exactly when the formula is satisfiable', () => {
    const rand = seeded(3);
    let yes = 0;
    let no = 0;
    const fixed = [
      '(a ∨ a ∨ a) ∧ (¬a ∨ ¬a ∨ ¬a)',
      '(a ∨ a ∨ b) ∧ (¬a ∨ ¬a ∨ b) ∧ (¬b ∨ ¬b ∨ ¬b)',
      '(a ∨ b ∨ b) ∧ (a ∨ ¬b ∨ ¬b) ∧ (¬a ∨ b ∨ b) ∧ (¬a ∨ ¬b ∨ ¬b)',
    ].map((text) => /** @type {Formula} */ (parseFormula(text)));
    for (let t = 0; t < 43; t++) {
      const f =
        fixed[t] ?? randomFormula(rand, 1 + Math.floor(rand() * 3), 1 + Math.floor(rand() * 3));
      const { size, edges } = gadgetGraph(f);
      const k = f.vars.length + 2 * f.clauses.length;
      const best = minCover(size, edges);
      expect(best).toBeGreaterThanOrEqual(k);
      const sat = satisfyingAssignment(f) !== null;
      expect(best === k).toBe(sat);
      if (sat) yes++;
      else no++;
    }
    expect(yes).toBeGreaterThan(0);
    expect(no).toBeGreaterThan(0);
  });

  it('the cover from an assignment covers everything exactly when it satisfies the formula', () => {
    const rand = seeded(11);
    for (let t = 0; t < 150; t++) {
      const f = randomFormula(rand);
      const a = f.vars.map(() => rand() < 0.5);
      const end = last(f, a);
      expect(end.cover).toHaveLength(f.vars.length + 2 * f.clauses.length);
      expect(new Set(end.cover).size).toBe(end.cover.length);
      expect(end.uncovered.length === 0).toBe(satisfies(f, a));
    }
  });

  it('builds 2n + 3m vertices and n + 6m edges', () => {
    const rand = seeded(2);
    for (let t = 0; t < 30; t++) {
      const f = randomFormula(rand);
      const end = last(f, []);
      const n = f.vars.length;
      const c = f.clauses.length;
      expect(end.shown).toBe(2 * n + 3 * c);
      expect(end.edges).toHaveLength(n + 6 * c);
      expect(end.k).toBe(n + 2 * c);
    }
  });

  it('runs the three examples', () => {
    const sat = preset('satisfied');
    expect(last(sat.f, sat.a).uncovered).toEqual([]);
    const missed = preset('missed');
    const miss = last(missed.f, missed.a);
    expect(miss.uncovered).toHaveLength(1);
    expect(miss.witness).not.toBeNull();
    const none = preset('unsatisfiable');
    expect(last(none.f, none.a).uncovered.length).toBeGreaterThan(0);
    expect(last(none.f, none.a).witness).toBeNull();
    expect(gadgetTrace(missed.f, missed.a).some((x) => x.kind === 'unsat')).toBe(true);
  });

  it('finds a satisfying assignment by brute force', () => {
    const f = /** @type {Formula} */ (parseFormula('(a ∨ a ∨ a) ∧ (¬b ∨ ¬b ∨ ¬b)'));
    expect(satisfyingAssignment(f)).toEqual([true, false]);
    const g = /** @type {Formula} */ (parseFormula('(a ∨ a ∨ a) ∧ (¬a ∨ ¬a ∨ ¬a)'));
    expect(satisfyingAssignment(g)).toBeNull();
  });

  it('keeps frames independent', () => {
    const { f, a } = preset('satisfied');
    const frames = gadgetTrace(f, a);
    const i = frames.findIndex((x) => x.kind === 'pickVar');
    frames[i].cover.push(99);
    frames[i].edges[0].a = 99;
    frames[i].assignment[0] = !frames[i].assignment[0];
    expect(frames[i + 1].cover).not.toContain(99);
    expect(frames[i + 1].edges[0].a).toBe(0);
    expect(frames[i + 1].assignment[0]).toBe(a[0]);
  });

  it('stays small at the cap', () => {
    const f = randomFormula(seeded(1), MAX_VARS, MAX_CLAUSES);
    const frames = gadgetTrace(f, []);
    expect(frames.length).toBeLessThan(400);
    expect(frames[0].kind).toBe('start');
    expect(frames.at(-1)?.kind).toBe('done');
  });
});

describe('formula input', () => {
  it('reads and writes formulas', () => {
    const f = /** @type {Formula} */ (parseFormula('(a | !b | c) & (~a -b d)'));
    expect(f.vars).toEqual(['a', 'b', 'c', 'd']);
    expect(formatFormula(f)).toBe('(a ∨ ¬b ∨ c) ∧ (¬a ∨ ¬b ∨ d)');
    expect(parseFormula('c ∨ c ∨ ¬c')?.vars).toEqual(['c']);
  });

  it('refuses bad formulas', () => {
    expect(parseFormula('')).toBeNull();
    expect(parseFormula('(a ∨ b)')).toBeNull();
    expect(parseFormula('(a ∨ b ∨ c ∨ d)')).toBeNull();
    expect(parseFormula('(a ∨ b ∨ e)')).toBeNull();
    expect(parseFormula('(a ∨ b ∨ 1)')).toBeNull();
    expect(
      parseFormula(
        Array(MAX_CLAUSES + 1)
          .fill('(a ∨ b ∨ c)')
          .join(' ∧ '),
      ),
    ).toBeNull();
  });
});

describe('problem map', () => {
  it('links known problems, every one reachable from NP', () => {
    const keys = new Set(MAP_PROBLEMS.map((p) => p.key));
    for (const [a, b] of MAP_REDUCTIONS) {
      expect(keys.has(a)).toBe(true);
      expect(keys.has(b)).toBe(true);
    }
    const reached = new Set(['np']);
    for (let round = 0; round < keys.size; round++)
      for (const [a, b] of MAP_REDUCTIONS) if (reached.has(a)) reached.add(b);
    expect(reached).toEqual(keys);
    for (const key of keys) expect(m.problems[key]).toBeDefined();
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line', () => {
    const frames = GADGET_PRESETS.flatMap((p) =>
      gadgetTrace(/** @type {Formula} */ (parseFormula(p.formula)), p.assignment),
    );
    const seen = new Set(frames.flatMap((f) => f.lines));
    expect([...seen].sort((a, b) => a - b)).toEqual(gadgetPseudocode.map((_, i) => i));
  });
});

describe('quiz answers', () => {
  it('match the engine', () => {
    /** @param {number} i */
    const answer = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    const three = randomFormula(seeded(4), 3, 2);
    expect(three.vars).toHaveLength(3);
    expect(gadgetGraph(three).size).toBe(answer(0));
    const four = randomFormula(seeded(5), 4, 3);
    expect(four.vars).toHaveLength(4);
    expect(last(four, []).k).toBe(answer(1));
    const sat = preset('satisfied');
    expect(last(sat.f, sat.a).edges).toHaveLength(answer(2));
  });
});
