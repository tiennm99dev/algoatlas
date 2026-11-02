/**
 * The sieve of Eratosthenes with a smallest-prime-factor table. Each prime p crosses out its
 * multiples, and the first prime to reach a number is its smallest prime factor. Multiples below
 * p·p already have a smaller factor, so crossing can start at p·p; starting at 2p does the same
 * job with more crossings, which the lesson uses as a comparison. The table then factorises any
 * x ≤ n by dividing out spf[x] repeatedly.
 */

export const MAX_N = 200;

export const sievePseudocode = [
  'spf[v] = v for v = 2 to n   // every v looks prime at first',
  'for p = 2; p·p ≤ n; p = p + 1:',
  '  if spf[p] == p:   // never crossed out, so p is prime',
  '    for j = s; j ≤ n; j = j + p:   // s = p·p, or 2p to compare',
  '      if spf[j] == j: spf[j] = p',
  '      cross out j',
  'primes = every v with spf[v] == v',
  'while x > 1:',
  '  record spf[x]; x = x / spf[x]',
];

/** @typedef {'square'|'double'} SieveStart */

/**
 * @typedef {object} SieveFrame
 * @property {'start'|'prime'|'skip'|'cross'|'stop'|'factorStart'|'factor'|'done'} kind
 * @property {number} n
 * @property {number} x  The number to factorise.
 * @property {SieveStart} from  Whether crossing starts at p·p or at 2p.
 * @property {number[]} spf  Indexed by value; 0 for 0 and 1.
 * @property {boolean[]} crossed  Indexed by value.
 * @property {number} p  The current p, 0 when none.
 * @property {number} j  The multiple just crossed, 0 when none.
 * @property {boolean} first  cross: this is the first time j was crossed out.
 * @property {number} s  prime: where crossing starts.
 * @property {number} crossings  Crossings so far.
 * @property {number} repeats  Crossings of a number that was already crossed out.
 * @property {number[]} primes  The primes confirmed so far.
 * @property {number[]} factors  The prime factors of x recorded so far.
 * @property {number} rest  What is left of x; 0 before factorising starts.
 * @property {number[]} lines
 */

/**
 * The total crossings for each way of starting, without building a trace.
 * @param {number} n
 * @param {SieveStart} from
 * @returns {number}
 */
export function crossingCount(n, from) {
  const crossed = Array.from({ length: n + 1 }, () => false);
  let total = 0;
  for (let p = 2; p * p <= n; p++) {
    if (crossed[p]) continue;
    for (let j = from === 'square' ? p * p : 2 * p; j <= n; j += p) {
      crossed[j] = true;
      total++;
    }
  }
  return total;
}

/**
 * @param {number} n  From 2 to MAX_N.
 * @param {number} x  From 2 to n.
 * @param {SieveStart} [from]
 * @returns {SieveFrame[]}
 */
export function sieveTrace(n, x, from = 'square') {
  const spf = Array.from({ length: n + 1 }, (_, v) => (v < 2 ? 0 : v));
  const crossed = Array.from({ length: n + 1 }, () => false);
  /** @type {number[]} */
  const primes = [];
  /** @type {number[]} */
  const factors = [];
  /** @type {SieveFrame[]} */
  const frames = [];
  let p = 0;
  let j = 0;
  let s = 0;
  let first = false;
  let crossings = 0;
  let repeats = 0;
  let rest = 0;

  /** @param {SieveFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      n,
      x,
      from,
      spf: spf.slice(),
      crossed: crossed.slice(),
      p,
      j,
      first,
      s,
      crossings,
      repeats,
      primes: primes.slice(),
      factors: factors.slice(),
      rest,
      lines,
    });

  push('start', [0]);

  for (p = 2; p * p <= n; p++) {
    j = 0;
    if (spf[p] !== p) {
      push('skip', [1, 2]);
      continue;
    }
    primes.push(p);
    s = from === 'square' ? p * p : 2 * p;
    push('prime', [1, 2]);
    for (j = s; j <= n; j += p) {
      first = !crossed[j];
      if (first) spf[j] = p;
      else repeats++;
      crossed[j] = true;
      crossings++;
      push('cross', [3, 4, 5]);
    }
  }

  // p is past the square root here, so everything still uncrossed is prime.
  j = 0;
  for (let v = 2; v <= n; v++) if (spf[v] === v && !primes.includes(v)) primes.push(v);
  push('stop', [1, 6]);

  p = 0;
  rest = x;
  push('factorStart', [7]);
  while (rest > 1) {
    factors.push(spf[rest]);
    rest /= spf[rest];
    push('factor', [7, 8]);
  }

  push('done', []);
  return frames;
}

/** @type {Record<'small'|'classic'|'hundred'|'large', {n: number, x: number}>} */
export const SIEVE_PRESETS = {
  small: { n: 30, x: 30 },
  classic: { n: 60, x: 60 },
  hundred: { n: 100, x: 84 },
  large: { n: 200, x: 180 },
};
