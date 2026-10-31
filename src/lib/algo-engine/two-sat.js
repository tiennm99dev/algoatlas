/**
 * 2-SAT through the implication graph. Literal `2i` is the variable xᵢ₊₁ and `2i + 1` its
 * negation, so `l ^ 1` negates a literal. A clause (a ∨ b) says “if not a then b” and “if
 * not b then a”, the edges ¬a → b and ¬b → a. The formula is unsatisfiable exactly when
 * some x and ¬x share a strongly connected component. Otherwise set x true when x’s
 * component comes later than ¬x’s in topological order. Tarjan’s algorithm finds components
 * sinks first, so that means: x is true when its component was found before ¬x’s.
 *
 * Tarjan runs over the literals in index order, each trying its out-edges in order of their
 * target; the trace shows each finished component rather than every DFS step.
 */

/** Variables in the lesson’s formulas. */
export const VARS = 4;
/** Most clauses a formula may have. */
export const MAX_CLAUSES = 8;

/** @typedef {[number, number]} Clause  Two literals, joined by “or”. */

/**
 * @typedef {object} Implication
 * @property {number} from    Literal.
 * @property {number} to      Literal.
 * @property {number} clause  Index of the clause that added it.
 */

/**
 * @typedef {object} TwoSatFrame
 * @property {'start'|'clause'|'scc'|'conflict'|'assign'|'done'} kind
 * @property {number} clause       Clause just turned into edges, -1 when none.
 * @property {Implication[]} edges Implication edges so far (no duplicates or self loops).
 * @property {number[]} added      Indices into `edges` added on this frame.
 * @property {number[]} comp       Component number per literal (from 1), 0 when not found yet.
 * @property {number} count        Components found so far.
 * @property {number[]} popped     Literals of the component found on this frame.
 * @property {number} variable     Variable index checked on this frame, -1 when none.
 * @property {number[]} value      Per variable: 1 true, 0 false, -1 not set yet.
 * @property {boolean | null} sat  Set on the last frames: satisfiable or not.
 * @property {number[]} lines
 */

export const twoSatPseudocode = [
  'for each clause (a ∨ b): add the edges ¬a → b and ¬b → a',
  'find the SCCs of the implication graph (Tarjan finds sinks first)',
  'for each variable x:',
  '  if x and ¬x are in the same SCC: unsatisfiable, stop',
  '  x = true if comp[x] was found before comp[¬x], else false',
  'every clause is satisfied',
];

/** @param {number} l */
export const negate = (l) => l ^ 1;

/**
 * Whether an assignment (1 true, 0 false per variable) makes a literal true.
 * @param {number} l @param {number[]} value
 */
export const literalTrue = (l, value) => (value[l >> 1] === 1) === (l % 2 === 0);

/**
 * @param {{ vars: number, clauses: Clause[] }} formula
 * @returns {TwoSatFrame[]}
 */
export function twoSatTrace({ vars, clauses }) {
  const n = 2 * vars;
  /** @type {Implication[]} */
  const edges = [];
  const keys = new Set();
  const comp = new Array(n).fill(0);
  const value = new Array(vars).fill(-1);
  let count = 0;

  /** @type {TwoSatFrame[]} */
  const frames = [];
  /**
   * @param {Pick<TwoSatFrame, 'kind'|'lines'> & Partial<Pick<TwoSatFrame, 'clause'|'added'|'popped'|'variable'|'sat'>>} f
   */
  const push = (f) =>
    frames.push({
      clause: -1,
      variable: -1,
      sat: null,
      ...f,
      added: f.added ? f.added.slice() : [],
      popped: f.popped ? f.popped.slice() : [],
      edges: edges.map((e) => ({ ...e })),
      comp: comp.slice(),
      count,
      value: value.slice(),
    });

  push({ kind: 'start', lines: [0] });
  clauses.forEach(([a, b], k) => {
    const added = [];
    for (const [from, to] of [
      [negate(a), b],
      [negate(b), a],
    ]) {
      const key = `${from}>${to}`;
      if (from === to || keys.has(key)) continue;
      keys.add(key);
      added.push(edges.length);
      edges.push({ from, to, clause: k });
    }
    push({ kind: 'clause', clause: k, added, lines: [0] });
  });

  /** @type {number[][]} */
  const out = Array.from({ length: n }, () => []);
  for (const e of edges) out[e.from].push(e.to);
  for (const l of out) l.sort((x, y) => x - y);

  const tin = new Array(n).fill(-1);
  const low = new Array(n).fill(0);
  const onStack = new Array(n).fill(false);
  /** @type {number[]} */
  const stack = [];
  let time = 0;
  /** @param {number} u */
  function connect(u) {
    tin[u] = low[u] = time++;
    stack.push(u);
    onStack[u] = true;
    for (const v of out[u]) {
      if (tin[v] === -1) {
        connect(v);
        low[u] = Math.min(low[u], low[v]);
      } else if (onStack[v]) low[u] = Math.min(low[u], tin[v]);
    }
    if (low[u] !== tin[u]) return;
    count++;
    const popped = [];
    let w;
    do {
      w = /** @type {number} */ (stack.pop());
      onStack[w] = false;
      comp[w] = count;
      popped.push(w);
    } while (w !== u);
    push({ kind: 'scc', popped, lines: [1] });
  }
  for (let l = 0; l < n; l++) if (tin[l] === -1) connect(l);

  for (let x = 0; x < vars; x++) {
    if (comp[2 * x] === comp[2 * x + 1]) {
      push({ kind: 'conflict', variable: x, sat: false, lines: [2, 3] });
      push({ kind: 'done', variable: x, sat: false, lines: [3] });
      return frames;
    }
    value[x] = comp[2 * x] < comp[2 * x + 1] ? 1 : 0;
    push({ kind: 'assign', variable: x, lines: [2, 3, 4] });
  }
  push({ kind: 'done', sat: true, lines: [5] });
  return frames;
}
