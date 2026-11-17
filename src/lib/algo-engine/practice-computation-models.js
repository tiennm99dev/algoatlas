/**
 * Scenario cards for choosing a model of computation and an algorithm. Each card describes a
 * job, holds a few parameters the learner can change, and lists candidate algorithms with their
 * cost in the card’s model:
 *
 * - parallel (work and span): time steps on P processors;
 * - distributed (synchronous rounds): messages sent;
 * - external memory: block transfers between memory and the cache;
 * - online: the competitive ratio against the offline optimum.
 *
 * The costs are the standard bounds of the earlier lessons, evaluated at the card’s parameters,
 * so the cheapest algorithm can change as the parameters move.
 */

/**
 * @typedef {'parallel'|'distributed'|'external'|'online'} Model
 * @typedef {{key: string, min: number, max: number, initial: number, pow2?: boolean}} ParamSpec
 * @typedef {Record<string, number>} Params
 * @typedef {{id: string, cost: (p: Params) => number}} Candidate
 * @typedef {{id: string, model: Model, params: ParamSpec[], candidates: Candidate[]}} Scenario
 * @typedef {{id: string, cost: number}} Costed
 */

/**
 * @typedef {object} MatchFrame
 * @property {'start'|'model'|'cost'|'verdict'|'done'} kind
 * @property {Model} model  The card’s model.
 * @property {boolean} modelOk  Whether the picked model is the card’s.
 * @property {Costed[]} costs  Candidates costed so far, in card order.
 * @property {string} candidate  The candidate costed in this step, or ''.
 * @property {string[]} best  Cheapest candidates (verdict and done).
 * @property {boolean} algorithmOk  Whether the picked algorithm is among the cheapest.
 * @property {number[]} lines
 */

export const MODELS = /** @type {Model[]} */ (['parallel', 'distributed', 'external', 'online']);

export const matchPseudocode = [
  'read the job and its numbers',
  'pick the model: what does the job pay for?',
  'cost each algorithm in that model',
  'choose the cheapest (ties are all fine)',
];

const log2 = (/** @type {number} */ x) => Math.ceil(Math.log2(x));

/** @type {Scenario[]} */
export const SCENARIOS = [
  {
    id: 'sum',
    model: 'parallel',
    params: [
      { key: 'logN', min: 10, max: 30, initial: 20, pow2: true },
      { key: 'p', min: 1, max: 64, initial: 8 },
    ],
    candidates: [
      { id: 'loop', cost: (q) => 2 ** q.logN - 1 },
      { id: 'forkJoin', cost: (q) => Math.ceil((2 ** q.logN - 1) / q.p) + q.logN },
      { id: 'chunks', cost: (q) => Math.ceil(2 ** q.logN / q.p) - 1 + log2(q.p) },
    ],
  },
  {
    id: 'sort',
    model: 'parallel',
    params: [
      { key: 'logN', min: 10, max: 24, initial: 20, pow2: true },
      { key: 'p', min: 1, max: 64, initial: 8 },
    ],
    candidates: [
      { id: 'serial', cost: (q) => 2 ** q.logN * q.logN },
      { id: 'serialMerge', cost: (q) => Math.ceil((2 ** q.logN * q.logN) / q.p) + 2 * 2 ** q.logN },
      { id: 'parallelMerge', cost: (q) => Math.ceil((2 ** q.logN * q.logN) / q.p) + q.logN ** 3 },
    ],
  },
  {
    id: 'election',
    model: 'distributed',
    params: [{ key: 'n', min: 3, max: 64, initial: 16 }],
    candidates: [
      { id: 'floodMax', cost: (q) => 2 * q.n * Math.floor(q.n / 2) },
      { id: 'allIds', cost: (q) => 2 * q.n * q.n },
    ],
  },
  {
    id: 'transpose',
    model: 'external',
    params: [
      { key: 'logN', min: 8, max: 14, initial: 12, pow2: true },
      { key: 'logB', min: 2, max: 10, initial: 6, pow2: true },
      { key: 'logM', min: 10, max: 24, initial: 14, pow2: true },
    ],
    candidates: [
      {
        id: 'rows',
        cost: (q) => {
          const n2 = 4 ** q.logN;
          const b = 2 ** q.logB;
          return 2 ** q.logM >= 2 ** q.logN * b ? (2 * n2) / b : n2 + n2 / b;
        },
      },
      {
        id: 'recursive',
        cost: (q) => {
          const n2 = 4 ** q.logN;
          const b = 2 ** q.logB;
          return 2 ** q.logM >= b * b ? (2 * n2) / b : n2 + n2 / b;
        },
      },
    ],
  },
  {
    id: 'servers',
    model: 'online',
    params: [{ key: 'b', min: 2, max: 50, initial: 24 }],
    candidates: [
      { id: 'buyNow', cost: (q) => q.b },
      { id: 'breakEven', cost: (q) => 2 - 1 / q.b },
      { id: 'alwaysRent', cost: () => Infinity },
    ],
  },
  {
    id: 'webCache',
    model: 'online',
    params: [{ key: 'k', min: 2, max: 64, initial: 16 }],
    candidates: [
      { id: 'lru', cost: (q) => q.k },
      { id: 'mru', cost: () => Infinity },
    ],
  },
];

/** @param {string} id */
export function scenario(id) {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`unknown scenario ${id}`);
  return s;
}

/** @param {Scenario} s @returns {Params} */
export const initialParams = (s) => Object.fromEntries(s.params.map((p) => [p.key, p.initial]));

/**
 * Every candidate’s cost and the cheapest ones.
 * @param {string} id @param {Params} params
 * @returns {{costs: Costed[], best: string[]}}
 */
export function evaluate(id, params) {
  const costs = scenario(id).candidates.map((c) => ({ id: c.id, cost: c.cost(params) }));
  const low = Math.min(...costs.map((c) => c.cost));
  return { costs, best: costs.filter((c) => c.cost === low).map((c) => c.id) };
}

/**
 * The trace of checking a match: the model, then each candidate’s cost, then the verdict.
 * @param {string} id @param {Params} params @param {{model: Model, algorithm: string}} pick
 * @returns {MatchFrame[]}
 */
export function matchTrace(id, params, pick) {
  const s = scenario(id);
  const { costs, best } = evaluate(id, params);
  const modelOk = pick.model === s.model;
  const algorithmOk = best.includes(pick.algorithm);
  /** @type {MatchFrame[]} */
  const frames = [];
  /** @param {Partial<MatchFrame> & Pick<MatchFrame, 'kind'|'lines'>} f @param {number} shown */
  const push = (f, shown) =>
    frames.push({
      model: s.model,
      modelOk,
      candidate: '',
      best: [],
      algorithmOk,
      ...f,
      costs: costs.slice(0, shown).map((c) => ({ ...c })),
    });
  push({ kind: 'start', lines: [0] }, 0);
  push({ kind: 'model', lines: [1] }, 0);
  costs.forEach((c, i) => push({ kind: 'cost', candidate: c.id, lines: [2] }, i + 1));
  push({ kind: 'verdict', best: best.slice(), lines: [3] }, costs.length);
  push({ kind: 'done', best: best.slice(), lines: [3] }, costs.length);
  return frames;
}
