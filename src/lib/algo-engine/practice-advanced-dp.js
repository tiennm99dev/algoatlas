/**
 * A problem runner that solves three DP problems twice, once naively and once with the
 * optimisation that fits, and counts the work of each so the gap shows at any size.
 *
 * - Window: stones 1..n with costs a[i]; a frog starts on stone 1, jumps 1 to k stones forward,
 *   and pays for every stone it lands on, the first and the last included. dp[i] = a[i] +
 *   min(dp[i − k..i − 1]). Naive: read the whole window, O(n·k). Optimised: a monotone deque of
 *   indices with increasing dp, O(n).
 * - Squares: stones at x[0] < … < x[n − 1]; a hop from stone j to a later stone i costs
 *   (x[i] − x[j])² + C. dp[i] = min over j < i of dp[j] + (x[i] − x[j])² + C. Naive: every j,
 *   O(n²). Optimised: expand the square, so each j is the line y = −2x[j]·X + dp[j] + x[j]² at
 *   X = x[i]; slopes fall and queries rise, so the convex hull trick runs in O(n).
 * - Tour: the shortest closed tour through n cities from city 0, distances in grid steps.
 *   Naive: every order of the other cities, (n − 1)! tours of n additions each. Optimised:
 *   Held-Karp over (set of visited cities, current city), O(2ⁿ · n²).
 *
 * Work counts what each method reads: window values or candidates, hull steps, additions.
 */

import { lcg } from './seeded-random.js';

/** @typedef {'window'|'squares'|'tour'} RaceProblem */

/**
 * @typedef {object} RaceInput
 * @property {RaceProblem} problem
 * @property {number[]} values  window: costs a[i]; squares: positions x[i].
 * @property {{x: number, y: number}[]} cities  tour only.
 * @property {number} param  window: k; squares: C; tour: unused.
 */

/** @typedef {{answer: number, ops: number}} RaceResult */

export const PROBLEMS = /** @type {RaceProblem[]} */ (['window', 'squares', 'tour']);

/** Size limits; the naive method must still finish in well under a second at the top. */
/** @type {Record<RaceProblem, {min: number, max: number}>} */
export const SIZE = {
  window: { min: 2, max: 20000 },
  squares: { min: 2, max: 3000 },
  tour: { min: 3, max: 10 },
};

/** @type {Record<RaceProblem, {min: number, max: number}>} */
export const PARAM = {
  window: { min: 1, max: 1000 },
  squares: { min: 0, max: 999 },
  tour: { min: 0, max: 0 },
};

/** @type {Record<RaceProblem, {n: number, param: number}>} */
export const DEFAULTS = {
  window: { n: 2000, param: 50 },
  squares: { n: 1000, param: 100 },
  tour: { n: 8, param: 0 },
};

export const MAX_SEED = 9999;
const GRID = 20;

/** @type {Record<RaceProblem, {naive: string[], fast: string[]}>} */
export const racePseudocode = {
  window: {
    naive: [
      'dp[1] = a[1]',
      'for i = 2 to n:',
      '  dp[i] = a[i] + min(dp[max(1, i-k) .. i-1])   // đọc tới k giá trị',
    ],
    fast: [
      'dp[1] = a[1];  deque = [1]       // chỉ số, dp tăng dần',
      'for i = 2 to n:',
      '  while front < i - k: pop front',
      '  dp[i] = a[i] + dp[front]',
      '  while dp[back] ≥ dp[i]: pop back;  push i',
    ],
  },
  squares: {
    naive: ['dp[1] = 0', 'for i = 2 to n:', '  dp[i] = min(dp[j] + (x[i] - x[j])² + C) với j < i'],
    fast: [
      'đường j: hệ số góc −2·x[j], tung độ gốc dp[j] + x[j]²',
      'dp[1] = 0;  thêm đường 1 vào hull',
      'for i = 2 to n:              // truy vấn x[i] tăng dần',
      '  dp[i] = x[i]² + C + đường thấp nhất tại x[i]   // con trỏ dịch phải',
      '  thêm đường i; pop các đường nó làm vô dụng   // hệ số góc giảm',
    ],
  },
  tour: {
    naive: [
      'for o in permutations(1..n-1):      // (n-1)! thứ tự',
      '  length = d[0][o1] + d[o1][o2] + … + d[o(n-1)][0]',
      'answer = length nhỏ nhất',
    ],
    fast: [
      'dp[{0}][0] = 0',
      'for mask tăng dần, j in mask, k not in mask:',
      '  dp[mask | 2ᵏ][k] = min(…, dp[mask][j] + d[j][k])',
      'answer = min(dp[all][j] + d[j][0]) với mọi j',
    ],
  },
};

/**
 * The input for an input number: costs 1..99, positions with gaps 1..9 from 0, or cities on
 * a 21 × 21 grid.
 * @param {RaceProblem} problem @param {number} n @param {number} param @param {number} seed
 * @returns {RaceInput}
 */
export function makeInput(problem, n, param, seed) {
  const rand = lcg(seed * 7919 + n);
  const int = (/** @type {number} */ lo, /** @type {number} */ hi) =>
    lo + Math.floor(rand() * (hi - lo + 1));
  if (problem === 'tour') {
    const cities = Array.from({ length: n }, () => ({ x: int(0, GRID), y: int(0, GRID) }));
    return { problem, values: [], cities, param: 0 };
  }
  if (problem === 'window') {
    return { problem, values: Array.from({ length: n }, () => int(1, 99)), cities: [], param };
  }
  /** @type {number[]} */
  const xs = [];
  for (let i = 0, x = 0; i < n; i++, x += int(1, 9)) xs.push(x);
  return { problem, values: xs, cities: [], param };
}

/** @param {RaceInput} input */
function windowNaive({ values: a, param: k }) {
  const dp = [a[0]];
  let ops = 0;
  for (let i = 1; i < a.length; i++) {
    let best = Infinity;
    for (let j = Math.max(0, i - k); j < i; j++) {
      best = Math.min(best, dp[j]);
      ops++;
    }
    dp.push(a[i] + best);
  }
  return { answer: dp[a.length - 1], ops };
}

/** @param {RaceInput} input */
function windowFast({ values: a, param: k }) {
  const dp = [a[0]];
  const deque = [0];
  let head = 0;
  let ops = 1;
  for (let i = 1; i < a.length; i++) {
    while (deque[head] < i - k) {
      head++;
      ops++;
    }
    dp.push(a[i] + dp[deque[head]]);
    ops++;
    while (deque.length > head && dp[deque[deque.length - 1]] >= dp[i]) {
      deque.pop();
      ops++;
    }
    deque.push(i);
    ops++;
  }
  return { answer: dp[a.length - 1], ops };
}

/** @param {RaceInput} input */
function squaresNaive({ values: x, param: C }) {
  const dp = [0];
  let ops = 0;
  for (let i = 1; i < x.length; i++) {
    let best = Infinity;
    for (let j = 0; j < i; j++) {
      best = Math.min(best, dp[j] + (x[i] - x[j]) ** 2 + C);
      ops++;
    }
    dp.push(best);
  }
  return { answer: dp[x.length - 1], ops };
}

/** @param {RaceInput} input */
function squaresFast({ values: x, param: C }) {
  const dp = [0];
  /** @type {{m: number, b: number}[]} */
  const hull = [{ m: -2 * x[0], b: x[0] ** 2 }];
  let p = 0;
  let ops = 1;
  const at = (/** @type {{m: number, b: number}} */ l, /** @type {number} */ X) => l.m * X + l.b;
  for (let i = 1; i < x.length; i++) {
    p = Math.min(p, hull.length - 1);
    while (p + 1 < hull.length && at(hull[p + 1], x[i]) <= at(hull[p], x[i])) {
      p++;
      ops++;
    }
    ops++;
    dp.push(x[i] ** 2 + C + at(hull[p], x[i]));
    const L = { m: -2 * x[i], b: dp[i] + x[i] ** 2 };
    while (hull.length >= 2) {
      const [a, b] = [hull[hull.length - 2], hull[hull.length - 1]];
      ops++;
      if ((L.b - a.b) * (a.m - b.m) > (b.b - a.b) * (a.m - L.m)) break;
      hull.pop();
    }
    hull.push(L);
    ops++;
  }
  return { answer: dp[x.length - 1], ops };
}

/** @param {{x: number, y: number}[]} cities */
function distances(cities) {
  return cities.map((a) => cities.map((b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)));
}

/** @param {RaceInput} input */
function tourNaive({ cities }) {
  const d = distances(cities);
  const n = cities.length;
  const order = Array.from({ length: n - 1 }, (_, i) => i + 1);
  let best = Infinity;
  let ops = 0;
  /** Heap's algorithm visits every order of the cities after 0. @param {number} size */
  const visit = (size) => {
    if (size <= 1) {
      let len = d[0][order[0]] + d[order[n - 2]][0];
      for (let i = 1; i < n - 1; i++) len += d[order[i - 1]][order[i]];
      ops += n;
      best = Math.min(best, len);
      return;
    }
    for (let i = 0; i < size; i++) {
      visit(size - 1);
      const j = size % 2 ? 0 : i;
      [order[j], order[size - 1]] = [order[size - 1], order[j]];
    }
  };
  visit(n - 1);
  return { answer: best, ops };
}

/** @param {RaceInput} input */
function tourFast({ cities }) {
  const d = distances(cities);
  const n = cities.length;
  const full = (1 << n) - 1;
  const dp = Array.from({ length: 1 << n }, () => Array(n).fill(Infinity));
  dp[1][0] = 0;
  let ops = 0;
  for (let mask = 1; mask < full; mask += 2)
    for (let j = 0; j < n; j++) {
      if (!(mask & (1 << j)) || dp[mask][j] === Infinity) continue;
      for (let k = 0; k < n; k++) {
        if (mask & (1 << k)) continue;
        const next = mask | (1 << k);
        dp[next][k] = Math.min(dp[next][k], dp[mask][j] + d[j][k]);
        ops++;
      }
    }
  let best = Infinity;
  for (let j = 1; j < n; j++) {
    best = Math.min(best, dp[full][j] + d[j][0]);
    ops++;
  }
  return { answer: best, ops };
}

/** @param {RaceInput} input @returns {RaceResult} */
export function solveNaive(input) {
  if (input.problem === 'window') return windowNaive(input);
  if (input.problem === 'squares') return squaresNaive(input);
  return tourNaive(input);
}

/** @param {RaceInput} input @returns {RaceResult} */
export function solveFast(input) {
  if (input.problem === 'window') return windowFast(input);
  if (input.problem === 'squares') return squaresFast(input);
  return tourFast(input);
}

/** Sizes for the growth table: a quarter, a half and all of n, or n − 2, n − 1, n for tours. */
/** @param {RaceProblem} problem @param {number} n */
export function growthSizes(problem, n) {
  const { min } = SIZE[problem];
  const sizes = problem === 'tour' ? [n - 2, n - 1, n] : [Math.round(n / 4), Math.round(n / 2), n];
  return [...new Set(sizes.map((s) => Math.max(min, s)))];
}
