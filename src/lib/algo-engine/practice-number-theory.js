/**
 * Four step-by-step problem runners for number theory practice. Divisor sums: σ and τ of one n
 * from its factorisation, and the sum of σ(i) up to N by counting each divisor's multiples.
 * Modular counting: pairs and subarrays whose sum is divisible by m, from remainder buckets.
 * Every frame that leads to a new running total carries that total as `ask`, so the page can have
 * the learner compute it first. `calculate` is the scratch calculator beside them.
 */

export const MAX_DIVISOR_N = 1_000_000_000;
export const MAX_RANGE_N = 150;
export const MAX_VALUES = 12;
export const MAX_VALUE = 999;
export const MAX_MODULUS = 12;
export const MAX_CALC = 1_000_000_000;
export const MAX_CALC_MODULUS = 1_000_000_007;

/** @typedef {'divisors'|'rangeSum'|'pairs'|'subarrays'} Puzzle */
/** @typedef {'add'|'sub'|'mul'|'pow'|'div'} CalcOp */

export const PUZZLES = /** @type {Puzzle[]} */ (['divisors', 'rangeSum', 'pairs', 'subarrays']);
export const CALC_OPS = /** @type {CalcOp[]} */ (['add', 'sub', 'mul', 'pow', 'div']);

/** @type {Record<Puzzle, string[]>} */
export const PSEUDOCODE = {
  divisors: [
    'σ = 1, τ = 1, rest = n, d = 2',
    'while d · d ≤ rest:',
    '  e = times d divides rest; rest = rest / d^e',
    '  if e > 0: σ = σ · (1 + d + … + d^e), τ = τ · (e + 1)',
    '  d = d + 1',
    'if rest > 1: σ = σ · (1 + rest), τ = τ · 2',
    'return σ, τ',
  ],
  rangeSum: [
    'total = 0',
    'for d = 1 to N:',
    '  count = ⌊N / d⌋',
    '  total = total + d · count',
    'return total',
  ],
  pairs: [
    'seen[0..m−1] = 0, total = 0',
    'for each a:',
    '  r = a mod m, need = (m − r) mod m',
    '  total = total + seen[need]',
    '  seen[r] = seen[r] + 1',
    'return total',
  ],
  subarrays: [
    'seen[0] = 1, others 0, s = 0, total = 0',
    'for each a:',
    '  s = (s + a) mod m',
    '  total = total + seen[s]',
    '  seen[s] = seen[s] + 1',
    'return total',
  ],
};

/**
 * @typedef {object} PracticeFrame
 * @property {'start'|'factor'|'apply'|'term'|'add'|'read'|'count'|'done'} kind
 * @property {Puzzle} puzzle
 * @property {number} input  n or N; 0 for the list puzzles.
 * @property {number} m  The modulus of a list puzzle; 0 otherwise.
 * @property {number[]} values  The list; empty for the divisor puzzles.
 * @property {number} i  The list index being read; -1 when none.
 * @property {number} r  The remainder of a list element, or the prefix remainder.
 * @property {number} need  The bucket to look up.
 * @property {number[]} seen  The remainder buckets.
 * @property {number} d  The prime or divisor at hand.
 * @property {number} e  The prime's exponent.
 * @property {number} count  ⌊N / d⌋, or 1 + d + … + d^e for a factor.
 * @property {number} total  The running answer: σ, the sum, or the count.
 * @property {number} added  How much this step added to the total.
 * @property {number} tau  τ so far, for the divisors puzzle.
 * @property {number[][]} rows  The finished table rows.
 * @property {number[]} divisors  All divisors of n, on the divisors puzzle's done frame.
 * @property {number} steps  Trial divisors tried, or loop rounds.
 * @property {number} brute  The checks a brute-force solution would do.
 * @property {number|null} ask  What the total will be after the next step, when it changes.
 * @property {number[]} lines
 */

/** @returns {Omit<PracticeFrame, 'kind'|'ask'|'lines'>} */
function blank(/** @type {Puzzle} */ puzzle) {
  return {
    puzzle,
    input: 0,
    m: 0,
    values: [],
    i: -1,
    r: 0,
    need: 0,
    seen: [],
    d: 0,
    e: 0,
    count: 0,
    total: 0,
    added: 0,
    tau: 1,
    rows: [],
    divisors: [],
    steps: 0,
    brute: 0,
  };
}

/** @param {Omit<PracticeFrame, 'kind'|'ask'|'lines'>} s @param {PracticeFrame['kind']} kind @param {number[]} lines @param {number|null} [ask] @returns {PracticeFrame} */
function snap(s, kind, lines, ask = null) {
  return {
    ...s,
    kind,
    values: s.values.slice(),
    seen: s.seen.slice(),
    rows: s.rows.map((row) => row.slice()),
    divisors: s.divisors.slice(),
    ask,
    lines,
  };
}

/**
 * All divisors of n, in order, by checking up to √n.
 * @param {number} n  At least 1.
 */
export function divisorsOf(n) {
  const low = [];
  const high = [];
  for (let d = 1; d * d <= n; d++) {
    if (n % d !== 0) continue;
    low.push(d);
    if (d * d !== n) high.push(n / d);
  }
  return [...low, ...high.reverse()];
}

/**
 * σ(n) and τ(n) from the prime factorisation.
 * @param {number} n  From 1 to MAX_DIVISOR_N.
 * @returns {PracticeFrame[]}
 */
export function divisorsTrace(n) {
  const s = blank('divisors');
  s.input = n;
  s.total = 1;
  s.brute = n;
  /** @type {PracticeFrame[]} */
  const frames = [snap(s, 'start', [0])];

  /** @param {number} p @param {number} e @param {number[]} found @param {number[]} applied */
  const factor = (p, e, found, applied) => {
    let sum = 1;
    for (let i = 0, power = 1; i < e; i++) {
      power *= p;
      sum += power;
    }
    s.d = p;
    s.e = e;
    s.count = sum;
    frames.push(snap(s, 'factor', found, s.total * sum));
    s.added = s.total * sum - s.total;
    s.total *= sum;
    s.tau *= e + 1;
    s.rows.push([p, e, sum, s.total]);
    frames.push(snap(s, 'apply', applied));
    s.added = 0;
  };

  let rest = n;
  for (let d = 2; d * d <= rest; d++) {
    s.steps++;
    let e = 0;
    while (rest % d === 0) {
      rest /= d;
      e++;
    }
    if (e > 0) factor(d, e, [1, 2], [3, 4]);
  }
  if (rest > 1) factor(rest, 1, [5], [5]);
  s.divisors = divisorsOf(n);
  frames.push(snap(s, 'done', [6]));
  return frames;
}

/**
 * The sum of σ(i) for i from 1 to N: each d is a divisor of ⌊N/d⌋ of those numbers.
 * @param {number} N  From 1 to MAX_RANGE_N.
 * @returns {PracticeFrame[]}
 */
export function rangeSumTrace(N) {
  const s = blank('rangeSum');
  s.input = N;
  s.brute = (N * (N + 1)) / 2;
  /** @type {PracticeFrame[]} */
  const frames = [snap(s, 'start', [0])];
  for (let d = 1; d <= N; d++) {
    s.d = d;
    s.count = Math.floor(N / d);
    s.steps = d;
    frames.push(snap(s, 'term', [1, 2], s.total + d * s.count));
    s.added = d * s.count;
    s.total += s.added;
    s.rows.push([d, s.count, s.added, s.total]);
    frames.push(snap(s, 'add', [3]));
    s.added = 0;
  }
  frames.push(snap(s, 'done', [4]));
  return frames;
}

/**
 * Pairs i < j whose sum is divisible by m: a value needs an earlier one with the opposite remainder.
 * @param {number[]} values  At most MAX_VALUES.
 * @param {number} m  From 1 to MAX_MODULUS.
 * @returns {PracticeFrame[]}
 */
export function pairsTrace(values, m) {
  const s = blank('pairs');
  s.values = values.slice();
  s.m = m;
  s.seen = Array(m).fill(0);
  s.brute = (values.length * (values.length - 1)) / 2;
  /** @type {PracticeFrame[]} */
  const frames = [snap(s, 'start', [0])];
  values.forEach((a, i) => {
    s.i = i;
    s.steps = i + 1;
    s.r = a % m;
    s.need = (m - s.r) % m;
    frames.push(snap(s, 'read', [1, 2], s.total + s.seen[s.need]));
    s.added = s.seen[s.need];
    s.total += s.added;
    s.seen[s.r]++;
    frames.push(snap(s, 'count', [3, 4]));
    s.added = 0;
  });
  s.i = -1;
  frames.push(snap(s, 'done', [5]));
  return frames;
}

/**
 * Subarrays whose sum is divisible by m: two equal prefix remainders bound one such subarray.
 * @param {number[]} values  At most MAX_VALUES.
 * @param {number} m  From 1 to MAX_MODULUS.
 * @returns {PracticeFrame[]}
 */
export function subarraysTrace(values, m) {
  const s = blank('subarrays');
  s.values = values.slice();
  s.m = m;
  s.seen = Array(m).fill(0);
  s.seen[0] = 1;
  s.brute = (values.length * (values.length + 1)) / 2;
  /** @type {PracticeFrame[]} */
  const frames = [snap(s, 'start', [0])];
  let prefix = 0;
  values.forEach((a, i) => {
    s.i = i;
    s.steps = i + 1;
    prefix = (prefix + a) % m;
    s.r = prefix;
    s.need = prefix;
    frames.push(snap(s, 'read', [1, 2], s.total + s.seen[prefix]));
    s.added = s.seen[prefix];
    s.total += s.added;
    s.seen[prefix]++;
    frames.push(snap(s, 'count', [3, 4]));
    s.added = 0;
  });
  s.i = -1;
  frames.push(snap(s, 'done', [5]));
  return frames;
}

/**
 * The inverse of b mod m, by extended Euclid, or null when gcd(b, m) ≠ 1.
 * @param {number} b
 * @param {number} m
 * @returns {number|null}
 */
export function inverseMod(b, m) {
  let [r0, r1] = [m, b % m];
  let [t0, t1] = [0, 1];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [t0, t1] = [t1, t0 - q * t1];
  }
  if (r0 !== 1) return null;
  return ((t0 % m) + m) % m;
}

/**
 * One modular operation, in exact arithmetic.
 * @param {CalcOp} op
 * @param {number} a  From 0 to MAX_CALC.
 * @param {number} b  From 0 to MAX_CALC.
 * @param {number} m  From 1 to MAX_CALC_MODULUS.
 * @returns {{ value: number, inverse: number | null } | { error: 'noInverse' }}
 */
export function calculate(op, a, b, m) {
  const big = BigInt(m);
  const [x, y] = [BigInt(a), BigInt(b)];
  switch (op) {
    case 'add':
      return { value: Number((x + y) % big), inverse: null };
    case 'sub':
      return { value: Number((((x - y) % big) + big) % big), inverse: null };
    case 'mul':
      return { value: Number((x * y) % big), inverse: null };
    case 'pow': {
      let result = 1n % big;
      let base = x % big;
      for (let e = y; e > 0n; e /= 2n) {
        if (e % 2n === 1n) result = (result * base) % big;
        base = (base * base) % big;
      }
      return { value: Number(result), inverse: null };
    }
    case 'div': {
      const inverse = inverseMod(b, m);
      if (inverse === null) return { error: 'noInverse' };
      return { value: Number((x * BigInt(inverse)) % big), inverse };
    }
  }
}

/** The inputs each runner opens with. */
export const START = {
  n: 360,
  N: 10,
  values: [1, 2, 3, 4, 5, 6],
  m: 3,
  subValues: [4, 5, 0, 2, 3, 1],
  subM: 5,
};
