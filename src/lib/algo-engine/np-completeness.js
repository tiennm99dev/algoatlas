/**
 * The classic reduction 3-SAT ≤ₚ VERTEX COVER, and the cover it gives for one assignment.
 *
 * For a formula with n variables and m clauses of three literals each, the graph G has:
 * - for each variable x, a vertex x and a vertex ¬x joined by an edge;
 * - for each clause, a triangle with one vertex per literal;
 * - an edge from each triangle vertex to the variable vertex of the same literal.
 * Then G has a vertex cover of k = n + 2m vertices exactly when the formula is satisfiable.
 * Each variable edge needs one end and each triangle needs two vertices, so no cover is
 * smaller than k, and a cover of exactly k takes one end per variable (the true literal) and
 * leaves out, in each clause, one triangle vertex whose literal is true.
 *
 * Graph vertices are numbered: 2i is variable i, 2i + 1 its negation, and 2n + 3j + t is
 * literal t of clause j. A clause may repeat a variable.
 */

export const MAX_VARS = 4;
export const MAX_CLAUSES = 4;
/** Variable names, in order. */
export const VAR_NAMES = 'abcd';

/**
 * @typedef {object} Literal
 * @property {number} v  Variable index into the formula's `vars`.
 * @property {boolean} neg
 */

/**
 * @typedef {object} Formula
 * @property {string[]} vars  Names of the variables used, in alphabetical order.
 * @property {Literal[][]} clauses  Each of exactly three literals.
 */

/**
 * @typedef {object} GadgetEdge
 * @property {number} a  Graph vertex.
 * @property {number} b  Graph vertex.
 * @property {'variable'|'clause'|'link'} kind
 */

/**
 * @typedef {object} GadgetFrame
 * @property {'start'|'variable'|'clause'|'link'|'target'|'pickVar'|'pickClause'|'unsat'|'covered'|'uncovered'|'done'} kind
 * @property {number} shown  Graph vertices made so far (variables first, then clauses).
 * @property {GadgetEdge[]} edges  Edges made so far.
 * @property {number[]} current  Graph vertices acted on now.
 * @property {number} edge  Index into `edges` of the edge acted on, -1 when none.
 * @property {number} clause  Clause acted on, -1 when none.
 * @property {number} variable  Variable acted on, -1 when none.
 * @property {number} k  The target cover size, 0 until it is set.
 * @property {number[]} cover  Graph vertices in the cover so far.
 * @property {number[]} uncovered  Edge indices with neither end in the cover, once checked.
 * @property {boolean[]} assignment
 * @property {boolean} satisfies  Whether the assignment satisfies the formula.
 * @property {boolean[]|null} witness  A satisfying assignment found by brute force, or null.
 * @property {number[]} lines
 */

export const gadgetPseudocode = [
  'reduce(φ):          // n biến, m mệnh đề',
  '  for x in variables: thêm cạnh x – ¬x',
  '  for C in clauses: thêm một tam giác',
  '    nối mỗi đỉnh tam giác với literal của nó',
  '  return (G, k = n + 2m)',
  'cover(G, assignment):',
  '  for x in variables: lấy literal đúng của x',
  '  for C in clauses: bỏ ra đỉnh tam giác của',
  '    một literal đúng, lấy hai đỉnh còn lại',
  '  mọi cạnh được phủ ⇔ φ được thoả',
];

/**
 * Reads a formula: clauses separated by `∧`, `&` or commas, literals by `∨`, `|` or spaces,
 * each a variable a–d with an optional `¬`, `!`, `~` or `-` in front. Brackets are ignored.
 * Every clause must have exactly three literals.
 * @param {string} text
 * @returns {Formula|null}
 */
export function parseFormula(text) {
  const parts = text
    .replace(/[()]/g, ' ')
    .split(/[∧&,]/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_CLAUSES) return null;
  /** @type {{name: string, neg: boolean}[][]} */
  const raw = [];
  for (const part of parts) {
    const lits = part.split(/[∨|\s]+/).filter(Boolean);
    if (lits.length !== 3) return null;
    /** @type {{name: string, neg: boolean}[]} */
    const clause = [];
    for (const lit of lits) {
      const hit = /^([¬!~-]?)([a-z])$/i.exec(lit);
      if (!hit) return null;
      const name = hit[2].toLowerCase();
      if (!VAR_NAMES.includes(name)) return null;
      clause.push({ name, neg: hit[1] !== '' });
    }
    raw.push(clause);
  }
  const vars = [...new Set(raw.flat().map((l) => l.name))].sort();
  return {
    vars,
    clauses: raw.map((c) => c.map((l) => ({ v: vars.indexOf(l.name), neg: l.neg }))),
  };
}

/**
 * @param {Formula} f
 * @param {number} v
 * @param {boolean} neg
 */
export const literalText = (f, v, neg) => `${neg ? '¬' : ''}${f.vars[v]}`;

/**
 * Writes a formula the way `parseFormula` reads it.
 * @param {Formula} f
 */
export const formatFormula = (f) =>
  f.clauses.map((c) => `(${c.map((l) => literalText(f, l.v, l.neg)).join(' ∨ ')})`).join(' ∧ ');

/**
 * Whether the assignment makes literal `l` true.
 * @param {Literal} l @param {boolean[]} assignment
 */
export const literalTrue = (l, assignment) => assignment[l.v] !== l.neg;

/** @param {Formula} f @param {boolean[]} assignment */
export const satisfies = (f, assignment) =>
  f.clauses.every((c) => c.some((l) => literalTrue(l, assignment)));

/**
 * The first satisfying assignment in binary order (all false first), or null.
 * @param {Formula} f
 * @returns {boolean[]|null}
 */
export function satisfyingAssignment(f) {
  const n = f.vars.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const a = Array.from({ length: n }, (_, i) => (mask & (1 << (n - 1 - i))) !== 0);
    if (satisfies(f, a)) return a;
  }
  return null;
}

/** The graph vertex of literal `l`. @param {Literal} l */
export const literalVertex = (l) => 2 * l.v + (l.neg ? 1 : 0);

/** The graph vertex of literal `t` of clause `j`. @param {Formula} f @param {number} j @param {number} t */
export const clauseVertex = (f, j, t) => 2 * f.vars.length + 3 * j + t;

/**
 * The whole gadget graph, edges in the order the reduction adds them.
 * @param {Formula} f
 * @returns {{size: number, edges: GadgetEdge[]}}
 */
export function gadgetGraph(f) {
  /** @type {GadgetEdge[]} */
  const edges = [];
  for (let i = 0; i < f.vars.length; i++) edges.push({ a: 2 * i, b: 2 * i + 1, kind: 'variable' });
  f.clauses.forEach((c, j) => {
    const [p, q, r] = [0, 1, 2].map((t) => clauseVertex(f, j, t));
    edges.push({ a: p, b: q, kind: 'clause' }, { a: p, b: r, kind: 'clause' });
    edges.push({ a: q, b: r, kind: 'clause' });
    c.forEach((l, t) =>
      edges.push({ a: clauseVertex(f, j, t), b: literalVertex(l), kind: 'link' }),
    );
  });
  return { size: 2 * f.vars.length + 3 * f.clauses.length, edges };
}

/**
 * Builds the graph step by step, then the cover the assignment gives, and checks it.
 * @param {Formula} f
 * @param {boolean[]} assignment  One value per variable; missing ones count as false.
 * @returns {GadgetFrame[]}
 */
export function gadgetTrace(f, assignment) {
  const n = f.vars.length;
  const m = f.clauses.length;
  const values = Array.from({ length: n }, (_, i) => assignment[i] === true);
  const all = gadgetGraph(f).edges;
  const sat = satisfies(f, values);
  const witness = satisfyingAssignment(f);
  let shown = 0;
  let made = 0;
  let k = 0;
  /** @type {number[]} */
  const cover = [];
  /** @type {number[]} */
  let uncovered = [];
  /** @type {GadgetFrame[]} */
  const frames = [];

  /**
   * @param {GadgetFrame['kind']} kind
   * @param {{current?: number[], edge?: number, clause?: number, variable?: number}} at
   * @param {number[]} lines
   */
  function record(kind, at, lines) {
    frames.push({
      kind,
      shown,
      edges: all.slice(0, made).map((e) => ({ ...e })),
      current: at.current ? at.current.slice() : [],
      edge: at.edge ?? -1,
      clause: at.clause ?? -1,
      variable: at.variable ?? -1,
      k,
      cover: cover.slice(),
      uncovered: uncovered.slice(),
      assignment: values.slice(),
      satisfies: sat,
      witness: witness ? witness.slice() : null,
      lines,
    });
  }

  record('start', {}, [0]);
  for (let i = 0; i < n; i++) {
    shown += 2;
    made++;
    record('variable', { current: [2 * i, 2 * i + 1], edge: made - 1, variable: i }, [1]);
  }
  for (let j = 0; j < m; j++) {
    shown += 3;
    made += 3;
    record('clause', { current: [0, 1, 2].map((t) => clauseVertex(f, j, t)), clause: j }, [2]);
    for (let t = 0; t < 3; t++) {
      made++;
      const e = all[made - 1];
      record('link', { current: [e.a, e.b], edge: made - 1, clause: j }, [3]);
    }
  }
  k = n + 2 * m;
  record('target', {}, [4]);

  for (let i = 0; i < n; i++) {
    const v = 2 * i + (values[i] ? 0 : 1);
    cover.push(v);
    record('pickVar', { current: [v], variable: i }, [5, 6]);
  }
  f.clauses.forEach((c, j) => {
    const free = c.findIndex((l) => literalTrue(l, values));
    const out = free < 0 ? 0 : free;
    const take = [0, 1, 2].filter((t) => t !== out).map((t) => clauseVertex(f, j, t));
    cover.push(...take);
    record(free < 0 ? 'unsat' : 'pickClause', { current: take, clause: j }, [7, 8]);
  });
  const inCover = new Set(cover);
  uncovered = all.flatMap((e, i) => (inCover.has(e.a) || inCover.has(e.b) ? [] : [i]));
  record(uncovered.length ? 'uncovered' : 'covered', {}, [9]);
  record('done', {}, [9]);
  return frames;
}

/**
 * @typedef {object} MapProblem
 * @property {string} key
 * @property {number} x  Centre, in the map's 640 × 380 viewBox.
 * @property {number} y
 */

/** The map of classic NP-complete problems, every problem in NP at the top. */
/** @type {MapProblem[]} */
export const MAP_PROBLEMS = [
  { key: 'np', x: 320, y: 30 },
  { key: 'sat', x: 320, y: 100 },
  { key: 'threeSat', x: 320, y: 170 },
  { key: 'colouring', x: 545, y: 170 },
  { key: 'vertexCover', x: 130, y: 240 },
  { key: 'clique', x: 320, y: 240 },
  { key: 'subsetSum', x: 545, y: 240 },
  { key: 'setCover', x: 80, y: 310 },
  { key: 'hamCycle', x: 240, y: 310 },
  { key: 'independentSet', x: 400, y: 310 },
  { key: 'tsp', x: 240, y: 360 },
];

/** Reductions A → B, meaning A ≤ₚ B, so B is at least as hard as A. */
/** @type {[string, string][]} */
export const MAP_REDUCTIONS = [
  ['np', 'sat'],
  ['sat', 'threeSat'],
  ['threeSat', 'vertexCover'],
  ['threeSat', 'clique'],
  ['threeSat', 'subsetSum'],
  ['threeSat', 'colouring'],
  ['clique', 'independentSet'],
  ['vertexCover', 'setCover'],
  ['vertexCover', 'hamCycle'],
  ['hamCycle', 'tsp'],
];

/** @type {{key: string, formula: string, assignment: boolean[]}[]} */
export const GADGET_PRESETS = [
  {
    key: 'satisfied',
    formula: '(a ∨ b ∨ c) ∧ (¬a ∨ ¬b ∨ c) ∧ (a ∨ ¬b ∨ ¬c)',
    assignment: [true, false, true],
  },
  {
    key: 'missed',
    formula: '(a ∨ b ∨ c) ∧ (¬a ∨ ¬b ∨ c) ∧ (a ∨ ¬b ∨ ¬c)',
    assignment: [false, false, false],
  },
  {
    key: 'unsatisfiable',
    formula: '(a ∨ a ∨ b) ∧ (¬a ∨ ¬a ∨ b) ∧ (¬b ∨ ¬b ∨ ¬b)',
    assignment: [true, false],
  },
];
