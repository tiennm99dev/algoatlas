/**
 * The same keys hashed by a fixed hash function and by one drawn from the universal family
 * h(k) = ((a·k + b) mod p) mod m of Carter and Wegman (CLRS 11.3.3), with p = 1009 > every
 * key, 1 ≤ a < p and 0 ≤ b < p. The trace fills one histogram of bucket counts for each and
 * keeps the number of colliding pairs, Σ c·(c − 1)/2, which for a universal family is at most
 * C(n, 2)/m in expectation whatever the keys are.
 */

/** @typedef {'mod'|'multiply'} FixedHash */
/** @typedef {'attack'|'sequential'|'random'} KeySet */

/**
 * @typedef {object} HashFnFrame
 * @property {'start'|'hash'|'count'|'done'} kind
 * @property {number[]} left        Bucket counts under the fixed hash.
 * @property {number[]} right       Bucket counts under the universal hash.
 * @property {number} key           Key in flight, -1 when none.
 * @property {number} lb            Its bucket under the fixed hash, -1 when none.
 * @property {number} rb            Its bucket under the universal hash, -1 when none.
 * @property {number} n             Keys counted so far.
 * @property {number} leftPairs     Colliding pairs so far under the fixed hash.
 * @property {number} rightPairs    Colliding pairs so far under the universal hash.
 * @property {number[]} lines
 */

export const BUCKETS = 16;
export const P = 1009;
export const MAX_KEYS = 48;
export const MAX_KEY = 999;
/** Knuth's multiplicative constant, (√5 − 1)/2. */
const A = (Math.sqrt(5) - 1) / 2;

/** @type {Record<FixedHash, string>} */
const FIXED_LINE = {
  mod: '  fixed:     b₁ = k mod 16',
  multiply: '  fixed:     b₁ = ⌊16 · frac(k · 0.618…)⌋',
};

/** @param {FixedHash} fn */
const pseudocodeFor = (fn) => [
  'for each key k:',
  FIXED_LINE[fn],
  '  universal: b₂ = ((a·k + b) mod 1009) mod 16',
  '  count[b₁] += 1;  count[b₂] += 1',
  'colliding pairs = Σ c·(c − 1)/2 over the buckets',
];

/** @type {Record<FixedHash, string[]>} */
export const hashFnPseudocode = { mod: pseudocodeFor('mod'), multiply: pseudocodeFor('multiply') };

/**
 * @param {number} k
 * @param {FixedHash} fn
 */
export function fixedHash(k, fn) {
  if (fn === 'mod') return k % BUCKETS;
  return Math.floor(BUCKETS * ((k * A) % 1));
}

/**
 * @param {number} k
 * @param {number} a
 * @param {number} b
 */
export const universalHash = (k, a, b) => ((a * k + b) % P) % BUCKETS;

/**
 * @param {number[]} keys
 * @param {FixedHash} fn
 * @param {number} a In [1, P − 1].
 * @param {number} b In [0, P − 1].
 * @returns {HashFnFrame[]}
 */
export function hashFnTrace(keys, fn, a, b) {
  const left = Array(BUCKETS).fill(0);
  const right = Array(BUCKETS).fill(0);
  let leftPairs = 0;
  let rightPairs = 0;
  let n = 0;
  /** @type {HashFnFrame[]} */
  const frames = [];

  /**
   * @param {HashFnFrame['kind']} kind
   * @param {number[]} lines
   * @param {Partial<HashFnFrame>} [extra]
   */
  function push(kind, lines, extra = {}) {
    frames.push({
      kind,
      left: left.slice(),
      right: right.slice(),
      key: -1,
      lb: -1,
      rb: -1,
      n,
      leftPairs,
      rightPairs,
      lines,
      ...extra,
    });
  }

  push('start', []);
  for (const key of keys) {
    const lb = fixedHash(key, fn);
    const rb = universalHash(key, a, b);
    push('hash', [0, 1, 2], { key, lb, rb });
    // The new key collides with every key already in its bucket.
    leftPairs += left[lb];
    rightPairs += right[rb];
    left[lb]++;
    right[rb]++;
    n++;
    push('count', [3], { key, lb, rb });
  }
  push('done', [4]);
  return frames;
}

/**
 * The expected number of colliding pairs when every pair collides with chance 1/m.
 * @param {number} n
 */
export const expectedPairs = (n) => (n * (n - 1)) / 2 / BUCKETS;

/**
 * @param {KeySet} set
 * @param {number} count Clamped to [1, MAX_KEYS].
 * @param {FixedHash} fn The fixed hash an attack targets.
 * @param {() => number} [rand]
 * @returns {number[]}
 */
export function makeKeys(set, count, fn, rand = Math.random) {
  const n = Math.max(1, Math.min(MAX_KEYS, Math.floor(count)));
  if (set === 'sequential') return Array.from({ length: n }, (_, i) => 100 + i);
  if (set === 'attack') {
    // An adversary who knows the fixed hash picks keys that all land in bucket 0.
    /** @type {number[]} */
    const keys = [];
    for (let k = 0; keys.length < n; k++) if (fixedHash(k, fn) === 0) keys.push(k);
    return keys;
  }
  const seen = new Set();
  while (seen.size < n) seen.add(Math.floor(rand() * (MAX_KEY + 1)));
  return [...seen];
}

/**
 * A fresh random member of the universal family.
 * @param {() => number} [rand]
 */
export function drawAB(rand = Math.random) {
  return { a: 1 + Math.floor(rand() * (P - 1)), b: Math.floor(rand() * P) };
}
