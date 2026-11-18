/**
 * Held-Karp for the travelling salesman: cities on a grid, distances in grid steps (Manhattan
 * distance |Δx| + |Δy|), and a tour that starts and ends at city A (index 0).
 *
 * A state is (mask, j): bit c of mask is 1 when city c has been visited, and the walk now stands
 * at city j. dp[mask][j] is the shortest walk that starts at A, visits exactly the cities of
 * mask, and ends at j. The table fills forward ("push"): masks run in increasing numeric order,
 * and every state hands its value to the states one city larger, mask | 2^k. Adding a bit makes
 * the number larger, so a state is final before its turn comes. A strict < keeps the first
 * predecessor on a tie, and the first smallest end city wins when the tour closes.
 */

/**
 * @typedef {object} City
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} TspFrame
 * @property {'start'|'base'|'mask'|'try'|'close'|'trace'|'done'} kind
 * @property {number} n  Number of cities.
 * @property {number[][]} dist  n × n distances.
 * @property {(number|null)[][]} dp  2^n × n, dp[mask][j]; null when not reached.
 * @property {number} mask  The state being read; 0 for none.
 * @property {number} j  Its end city, −1 for none.
 * @property {number} k  try: the city added; close: A; trace: the predecessor of j; −1 for none.
 * @property {number|null} cand  try: dp[mask][j] + d[j][k]; close: dp[full][j] + d[j][A].
 * @property {number|null} old  try: dp[mask | 2^k][k] before; close: the best tour before.
 * @property {boolean} improved  try, close: the candidate beat the old value.
 * @property {number[]} route  The best walk to (mask, j), city by city from A.
 * @property {number[]} tour  trace, done: the tour read back so far, ending at A.
 * @property {number} tries  Transitions tried so far.
 * @property {number} reached  States given a value so far.
 * @property {number|null} best  The shortest closed tour found so far.
 * @property {number|null} result
 * @property {number[]} lines
 */

export const MIN_CITIES = 3;
export const MAX_CITIES = 6;
export const GRID = { xMax: 8, yMax: 6 };

/** @type {{key: string, cities: City[]}[]} */
export const CITY_PRESETS = [
  {
    key: 'four',
    cities: [
      { x: 1, y: 1 },
      { x: 6, y: 1 },
      { x: 2, y: 5 },
      { x: 7, y: 4 },
    ],
  },
  {
    key: 'five',
    cities: [
      { x: 0, y: 0 },
      { x: 4, y: 1 },
      { x: 8, y: 0 },
      { x: 6, y: 5 },
      { x: 1, y: 4 },
    ],
  },
  {
    key: 'six',
    cities: [
      { x: 1, y: 2 },
      { x: 3, y: 0 },
      { x: 7, y: 1 },
      { x: 8, y: 5 },
      { x: 4, y: 6 },
      { x: 2, y: 4 },
    ],
  },
];

export const tspPseudocode = [
  'heldKarp(d[0..n-1][0..n-1]):    // xuất phát và kết thúc ở A',
  '  dp[{A}][A] = 0                 // mask 1: mới thăm A',
  '  for mask = 1 to 2ⁿ − 1:  // chỉ xét mask chứa A',
  '    for j in mask:  // dp[mask][j] đã có giá trị',
  '      for k not in mask:',
  '        cand = dp[mask][j] + d[j][k]',
  '        if cand < dp[mask | 2ᵏ][k]: ghi cand; from = j',
  '  best = min(dp[2ⁿ − 1][j] + d[j][A]) với j ≠ A',
  '  lần theo from[][] để dựng lại hành trình',
];

/** Grid steps between every pair of cities. @param {City[]} cities */
export function distances(cities) {
  return cities.map((a) => cities.map((b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)));
}

/** Cities of a mask, lowest index first. @param {number} mask @param {number} n */
export function citiesOf(mask, n) {
  /** @type {number[]} */
  const out = [];
  for (let c = 0; c < n; c++) if (mask & (1 << c)) out.push(c);
  return out;
}

/** Directed tours brute force would measure: (n − 1)!, every order of the cities after A. */
/** @param {number} n */
export function tourCount(n) {
  let f = 1;
  for (let k = 2; k < n; k++) f *= k;
  return f;
}

/** Transitions Held-Karp tries: every reachable state times every city it can add. */
/** @param {number} n */
export function transitionCount(n) {
  if (n < 1) return 0;
  // Mask {A} adds n − 1 cities; a mask of s cities with A has s − 1 ends and n − s additions.
  let total = n - 1;
  let choose = 1; // C(n − 1, s − 1)
  for (let s = 2; s < n; s++) {
    choose = (choose * (n - s + 1)) / (s - 1);
    total += choose * (s - 1) * (n - s);
  }
  return Math.round(total);
}

/**
 * @param {number[][]} dist
 * @returns {TspFrame[]}
 */
export function heldKarpTrace(dist) {
  const n = dist.length;
  const size = 1 << n;
  const full = size - 1;
  /** @type {(number|null)[][]} */
  const dp = Array.from({ length: size }, () => Array(n).fill(null));
  /** @type {number[][]} */
  const from = Array.from({ length: size }, () => Array(n).fill(-1));
  /** @type {TspFrame[]} */
  const frames = [];
  let tries = 0;
  let reached = 0;
  /** @type {number|null} */
  let best = null;
  /** @type {number[]} */
  let tour = [];

  /** The best walk to (mask, j), read back through from[][]. */
  /** @param {number} mask @param {number} j */
  function routeTo(mask, j) {
    /** @type {number[]} */
    const route = [];
    let m = mask;
    let c = j;
    while (c >= 0) {
      route.unshift(c);
      const p = from[m][c];
      m ^= 1 << c;
      c = p;
    }
    return route;
  }

  /** @param {Pick<TspFrame, 'kind'|'lines'> & Partial<TspFrame>} f */
  const push = (f) =>
    frames.push({
      mask: 0,
      j: -1,
      k: -1,
      cand: null,
      old: null,
      improved: false,
      result: null,
      ...f,
      lines: f.lines.slice(),
      route: (f.route ?? []).slice(),
      tour: tour.slice(),
      n,
      dist: dist.map((r) => r.slice()),
      dp: dp.map((r) => r.slice()),
      tries,
      reached,
      best,
    });

  push({ kind: 'start', lines: [0] });
  if (n === 0) {
    push({ kind: 'done', lines: [8], result: 0 });
    return frames;
  }
  dp[1][0] = 0;
  reached++;
  push({ kind: 'base', lines: [1], mask: 1, j: 0, route: [0] });

  for (let mask = 1; mask < full; mask += 2) {
    const ends = citiesOf(mask, n).filter((j) => dp[mask][j] !== null);
    if (!ends.length) continue;
    push({ kind: 'mask', lines: [2], mask });
    for (const j of ends) {
      const here = /** @type {number} */ (dp[mask][j]);
      const route = routeTo(mask, j);
      for (let k = 0; k < n; k++) {
        if (mask & (1 << k)) continue;
        const next = mask | (1 << k);
        const cand = here + dist[j][k];
        const old = dp[next][k];
        const improved = old === null || cand < old;
        tries++;
        if (improved) {
          if (old === null) reached++;
          dp[next][k] = cand;
          from[next][k] = j;
        }
        push({
          kind: 'try',
          lines: improved ? [3, 4, 5, 6] : [3, 4, 5],
          mask,
          j,
          k,
          cand,
          old,
          improved,
          route,
        });
      }
    }
  }

  let bestEnd = 0;
  if (n === 1) best = 0;
  for (let j = 1; j < n; j++) {
    const cand = /** @type {number} */ (dp[full][j]) + dist[j][0];
    const old = best;
    const improved = old === null || cand < old;
    if (improved) {
      best = cand;
      bestEnd = j;
    }
    push({
      kind: 'close',
      lines: [7],
      mask: full,
      j,
      k: 0,
      cand,
      old,
      improved,
      route: routeTo(full, j),
    });
  }

  // Read the tour back: A at the end, then each city's predecessor, until A at the start.
  tour = [0];
  let m = full;
  let c = bestEnd;
  while (c > 0) {
    tour.unshift(c);
    const p = from[m][c];
    push({ kind: 'trace', lines: [8], mask: m, j: c, k: p });
    m ^= 1 << c;
    c = p;
  }
  tour.unshift(0);
  push({ kind: 'done', lines: [8], mask: full, result: best, route: tour });
  return frames;
}
