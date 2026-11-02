/**
 * Three ways to ask whether n is prime. Trial division is exact but costs O(√n). The Fermat test
 * checks a^(n−1) ≡ 1 for chosen bases and is fooled by Carmichael numbers. Miller-Rabin writes
 * n − 1 = 2^s · d and also watches the square roots of 1 along a^d, a^(2d), …, a^(n−1): a prime has
 * only ±1 as roots, so a composite n passes for at most a quarter of the bases. Bases 2, 3, 5 and 7
 * settle every n below 3,215,031,751, which is above MAX_N. Products use BigInt once n² could
 * lose precision in a double.
 */

export const MAX_N = 2_147_483_647;
export const MAX_BASES = 6;
export const MAX_BASE = 1_000_000;
/** The largest n whose liars the page counts by trying every base. */
export const MAX_SCAN_N = 5000;
/** How many trial-division frames a trace may show; longer runs show every k-th divisor. */
const MAX_TRY_FRAMES = 120;
const SAFE_NUMBER_MOD = 94_906_265;
const PROVING_BASES = [2, 3, 5, 7];

const SHARED = ['if n < 4: return prime   // 2 and 3', 'if n is even: return composite'];

export const trialPseudocode = [
  ...SHARED,
  'for d = 3; d·d ≤ n; d = d + 2:',
  '  if d divides n: return composite',
  'return prime',
];

export const fermatPseudocode = [
  ...SHARED,
  'for each base a from 2 to n − 2:',
  '  x = a^(n − 1) mod n',
  '  if x ≠ 1: a is a witness, return composite',
  'return probably prime',
];

export const millerPseudocode = [
  ...SHARED,
  'write n − 1 = 2^s · d with d odd',
  'for each base a from 2 to n − 2:',
  '  x = a^d mod n',
  '  if x == 1 or x == n − 1: a passes, next base',
  '  repeat s − 1 times:',
  '    x = x · x mod n',
  '    if x == n − 1: a passes, next base',
  '  a is a witness, return composite',
  'return probably prime',
];

/** @typedef {'trial'|'fermat'|'miller'} PrimalityMethod */
/** @typedef {'prime'|'composite'|'probable'|'unknown'} Verdict */

/**
 * @typedef {object} BaseRound
 * @property {number} a
 * @property {number[]} values  x after the power and after each squaring.
 * @property {'pass'|'witness'|'skip'|null} outcome  null while running.
 */

/**
 * @typedef {object} PrimalityFrame
 * @property {'start'|'small'|'even'|'try'|'divisor'|'decompose'|'skip'|'power'|'square'|'pass'|'witness'|'verdict'|'done'} kind
 * @property {PrimalityMethod} method
 * @property {number} n
 * @property {number} d  trial: the divisor tried. miller: the odd part of n − 1.
 * @property {number} s  miller: the power of two in n − 1.
 * @property {number} limit  trial: the largest d with d·d ≤ n.
 * @property {number} divisor  A divisor of n once found, 0 before.
 * @property {number[]} recent  trial: the divisors shown most recently.
 * @property {number} divisions  trial: divisibility checks.
 * @property {BaseRound[]} rounds
 * @property {number} tested  Bases actually tried.
 * @property {number} multiplications  Products mod n.
 * @property {Verdict|null} verdict
 * @property {boolean} proven  miller: bases 2, 3, 5 and 7 all passed, so n is certainly prime.
 * @property {number[]} lines
 */

/**
 * @param {number} p
 * @param {number} q
 * @param {number} n
 */
function mulMod(p, q, n) {
  return n <= SAFE_NUMBER_MOD ? (p * q) % n : Number((BigInt(p) * BigInt(q)) % BigInt(n));
}

/**
 * a^e mod n, right to left, with the count of products.
 * @param {number} a
 * @param {number} e
 * @param {number} n
 * @returns {{ value: number, products: number }}
 */
function powMod(a, e, n) {
  let [value, x, rest, products] = [1 % n, a % n, e, 0];
  while (rest > 0) {
    if (rest % 2 === 1) {
      value = mulMod(value, x, n);
      products++;
    }
    x = mulMod(x, x, n);
    products++;
    rest = Math.floor(rest / 2);
  }
  return { value, products };
}

/**
 * n − 1 written as 2^s · d with d odd, for odd n.
 * @param {number} n
 * @returns {{ s: number, d: number }}
 */
function splitPowerOfTwo(n) {
  let [s, d] = [0, n - 1];
  while (d % 2 === 0) {
    d /= 2;
    s++;
  }
  return { s, d };
}

/**
 * Whether the base a passes one Miller-Rabin round for odd n.
 * @param {number} a
 * @param {number} n
 * @param {number} s
 * @param {number} d
 */
function strongPass(a, n, s, d) {
  let x = powMod(a, d, n).value;
  if (x === 1 || x === n - 1) return true;
  for (let i = 1; i < s; i++) {
    x = mulMod(x, x, n);
    if (x === n - 1) return true;
  }
  return false;
}

/**
 * How many bases from 2 to n − 2 each test wrongly lets through. For an odd composite n up to
 * MAX_SCAN_N; null otherwise, as a base that passes on a prime tells the truth. A prime is the only
 * n every base passes, since strong liars are at most a quarter of the bases on a composite.
 * @param {number} n
 * @returns {{ bases: number, fermat: number, miller: number } | null}
 */
export function liarCounts(n) {
  if (n > MAX_SCAN_N || n < 5 || n % 2 === 0) return null;
  const { s, d } = splitPowerOfTwo(n);
  let [fermat, miller] = [0, 0];
  for (let a = 2; a <= n - 2; a++) {
    if (powMod(a, n - 1, n).value === 1) fermat++;
    if (strongPass(a, n, s, d)) miller++;
  }
  return miller === n - 3 ? null : { bases: n - 3, fermat, miller };
}

/**
 * @param {PrimalityMethod} method
 * @param {number} n  From 2 to MAX_N.
 * @param {number[]} [given]  The bases to try; ignored by trial division.
 * @returns {PrimalityFrame[]}
 */
export function primalityTrace(method, n, given = []) {
  /** @type {PrimalityFrame[]} */
  const frames = [];
  /** @type {BaseRound[]} */
  const rounds = [];
  /** @type {number[]} */
  const recent = [];
  let d = 0;
  let s = 0;
  let limit = 0;
  let divisor = 0;
  let divisions = 0;
  let tested = 0;
  let multiplications = 0;
  /** @type {Verdict|null} */
  let verdict = null;
  let proven = false;

  /** @param {PrimalityFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      method,
      n,
      d,
      s,
      limit,
      divisor,
      recent: recent.slice(),
      divisions,
      rounds: rounds.map((r) => ({ ...r, values: r.values.slice() })),
      tested,
      multiplications,
      verdict,
      proven,
      lines,
    });

  /** @param {Verdict} result @param {PrimalityFrame['kind']} kind @param {number[]} lines */
  const finish = (result, kind, lines) => {
    verdict = result;
    push(kind, lines);
    push('done', []);
    return frames;
  };

  push('start', [0, 1]);
  if (n < 4) return finish('prime', 'small', [0]);
  if (n % 2 === 0) {
    divisor = 2;
    return finish('composite', 'even', [1]);
  }

  if (method === 'trial') {
    limit = Math.floor(Math.sqrt(n));
    const every = Math.max(1, Math.ceil((limit - 1) / 2 / MAX_TRY_FRAMES));
    let sinceShown = 0;
    for (d = 3; d <= limit; d += 2) {
      divisions++;
      sinceShown++;
      recent.push(d);
      if (recent.length > 8) recent.shift();
      if (n % d === 0) {
        divisor = d;
        return finish('composite', 'divisor', [3]);
      }
      if (sinceShown === every) {
        sinceShown = 0;
        push('try', [2, 3]);
      }
    }
    d = limit;
    return finish('prime', 'verdict', [4]);
  }

  const miller = method === 'miller';
  const baseLine = miller ? 3 : 2;
  if (miller) {
    ({ s, d } = splitPowerOfTwo(n));
    push('decompose', [2]);
  }

  for (const a of given) {
    /** @type {BaseRound} */
    const round = { a, values: [], outcome: null };
    rounds.push(round);
    if (a < 2 || a > n - 2) {
      round.outcome = 'skip';
      push('skip', [baseLine]);
      continue;
    }
    tested++;
    const power = powMod(a, miller ? d : n - 1, n);
    multiplications += power.products;
    let x = power.value;
    round.values.push(x);
    push('power', miller ? [3, 4] : [2, 3]);

    if (!miller) {
      if (x !== 1) {
        round.outcome = 'witness';
        return finish('composite', 'witness', [4]);
      }
      round.outcome = 'pass';
      push('pass', [4]);
      continue;
    }

    let passed = x === 1 || x === n - 1;
    if (passed) {
      round.outcome = 'pass';
      push('pass', [5]);
      continue;
    }
    for (let i = 1; i < s && !passed; i++) {
      x = mulMod(x, x, n);
      multiplications++;
      round.values.push(x);
      push('square', [6, 7]);
      passed = x === n - 1;
    }
    if (!passed) {
      round.outcome = 'witness';
      return finish('composite', 'witness', [9]);
    }
    round.outcome = 'pass';
    push('pass', [8]);
  }

  if (tested === 0) return finish('unknown', 'verdict', [miller ? 10 : 5]);
  proven = miller && PROVING_BASES.every((a) => given.includes(a));
  return finish(proven ? 'prime' : 'probable', 'verdict', [miller ? 10 : 5]);
}

/** @type {Record<'smallPrime'|'semiprime'|'carmichael'|'fools'|'billion'|'mersenne', {n: number, bases: number[]}>} */
export const PRIMALITY_PRESETS = {
  smallPrime: { n: 97, bases: [2, 3, 5, 7] },
  semiprime: { n: 9991, bases: [2, 3] },
  carmichael: { n: 561, bases: [2, 5, 7] },
  fools: { n: 2047, bases: [2, 3] },
  billion: { n: 1_000_000_007, bases: [2, 3, 5, 7] },
  mersenne: { n: 2_147_483_647, bases: [2, 3, 5, 7] },
};
