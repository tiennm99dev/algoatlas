/**
 * Universal hashing and two-level (FKS) perfect hashing as in CLRS. The family is
 * h_{a,b}(k) = ((a·k + b) mod p) mod m with p = 101 prime, a in 1 … p − 1 and b in 0 … p − 1,
 * and keys in 0 … p − 1. For two distinct keys at most 1/m of its functions collide, so n keys
 * in m slots meet in at most n(n − 1)/(2m) pairs on average.
 *
 * The static perfect table hashes n keys into n buckets, redrawing the first-level function
 * until Σ nⱼ² < 4n (each draw passes with probability over 1/2). Each bucket j with nⱼ keys gets
 * a second table of mⱼ = nⱼ² slots and its own function, redrawn until no two of its keys share
 * a slot (again probability over 1/2 per draw). Lookups then cost two hashes in the worst case,
 * with O(n) total memory.
 */

export const P = 101;
export const MIN_N = 2;
export const MAX_N = 12;
export const MAX_KEY = P - 1;
/** Random draws per level before falling back to the first good function in order. */
export const MAX_DRAWS = 40;
export const SAMPLE_BATCH = 100;
export const MAX_SAMPLES = 5000;

export const perfectHashPseudocode = [
  'build(K, n khoá):',
  '  repeat:',
  '    rút a, b; h(k) = ((a·k + b) mod p) mod n',
  '    đặt mỗi khoá k vào ngăn h(k)',
  '  until Σ nⱼ² < 4n',
  '  for j in buckets if nⱼ > 0:',
  '    mⱼ = nⱼ²',
  '    repeat:',
  '      rút aⱼ, bⱼ; hⱼ(k) = ((aⱼ·k + bⱼ) mod p) mod mⱼ',
  '      đặt mỗi khoá k của ngăn j vào ô hⱼ(k)',
  '    until không có hai khoá nào chung một ô',
  'lookup(k): j = h(k); chỉ xem ô hⱼ(k) của ngăn j',
];

/** @param {number} k @param {number} a @param {number} b @param {number} m */
export const hashOf = (k, a, b, m) => ((a * k + b) % P) % m;

/**
 * One uniformly random member of the family.
 * @param {() => number} rand
 * @returns {{ a: number, b: number }}
 */
export function drawFunction(rand) {
  return { a: 1 + Math.floor(rand() * (P - 1)), b: Math.floor(rand() * P) };
}

/**
 * Pairs of keys that share a slot.
 * @param {number[]} keys
 * @param {(k: number) => number} h
 */
export function collidingPairs(keys, h) {
  /** @type {Map<number, number>} */
  const count = new Map();
  for (const k of keys) count.set(h(k), (count.get(h(k)) ?? 0) + 1);
  let pairs = 0;
  for (const c of count.values()) pairs += (c * (c - 1)) / 2;
  return pairs;
}

/**
 * Colliding pairs of the fixed hash k mod n, the one an adversary can aim at.
 * @param {number[]} keys
 */
export const fixedPairs = (keys) => collidingPairs(keys, (k) => k % keys.length);

/** The universal bound on the expected colliding pairs in n slots: n(n − 1)/(2n). @param {number} n */
export const pairBound = (n) => (n - 1) / 2;

/**
 * The exact average of colliding pairs over all (p − 1)·p functions of the family, with m = n.
 * @param {number[]} keys
 */
export function exactMeanPairs(keys) {
  const m = keys.length;
  let total = 0;
  for (let a = 1; a < P; a++) {
    for (let b = 0; b < P; b++) total += collidingPairs(keys, (k) => hashOf(k, a, b, m));
  }
  return total / ((P - 1) * P);
}

/**
 * One random first-level draw with m = n: its colliding pairs and Σ nⱼ², where Σ nⱼ² = n + 2·pairs.
 * @param {number[]} keys
 * @param {() => number} [rand]
 * @returns {{ pairs: number, sumSquares: number }}
 */
export function sampleDraw(keys, rand = Math.random) {
  const { a, b } = drawFunction(rand);
  const pairs = collidingPairs(keys, (k) => hashOf(k, a, b, keys.length));
  return { pairs, sumSquares: keys.length + 2 * pairs };
}

/**
 * @typedef {object} SecondTable
 * @property {number} a
 * @property {number} b
 * @property {number} m  nⱼ²; 0 until the bucket is built.
 * @property {(number | null)[]} slots
 * @property {number} draws
 * @property {boolean} done
 */

/**
 * @typedef {object} PerfectFrame
 * @property {'start'|'draw'|'place'|'check'|'second'|'slot'|'collide'|'fits'|'done'} kind
 * @property {number[]} keys
 * @property {number} a  The first-level function; 0 before the first draw.
 * @property {number} b
 * @property {number[][]} buckets  The keys of each bucket, in the order they arrived.
 * @property {number} sumSquares  Σ nⱼ² of the current first-level function.
 * @property {boolean} accepted  check: whether Σ nⱼ² < 4n.
 * @property {number} j  The bucket at hand; -1 when none.
 * @property {number} key  The key being hashed; -1 when none.
 * @property {number} slot  The second-level slot it went to; -1 when none.
 * @property {number} clash  collide: the key already in that slot; -1 otherwise.
 * @property {SecondTable[]} tables
 * @property {number} firstDraws
 * @property {number} secondDraws
 * @property {number} slots  Second-level slots in use, Σ mⱼ.
 * @property {boolean} fallback  draw or second: this draw came from the in-order search.
 * @property {number[]} lines
 */

/**
 * Draws until `ok` holds, at most MAX_DRAWS times; then takes the first good function in
 * (a, b) order, which exists because the average draw is good enough.
 * @param {() => number} rand
 * @param {(a: number, b: number) => boolean} ok
 * @returns {Generator<{ a: number, b: number, fallback: boolean }>}
 */
function* draws(rand, ok) {
  for (let t = 0; t < MAX_DRAWS; t++) {
    const d = drawFunction(rand);
    yield { ...d, fallback: false };
    if (ok(d.a, d.b)) return;
  }
  for (let a = 1; a < P; a++) {
    for (let b = 0; b < P; b++) {
      if (ok(a, b)) {
        yield { a, b, fallback: true };
        return;
      }
    }
  }
}

/**
 * Builds the two-level perfect hash table of distinct keys, frame by frame.
 * @param {number[]} keys  Distinct keys in 0 … p − 1.
 * @param {() => number} [rand]
 * @returns {PerfectFrame[]}
 */
export function perfectHashTrace(keys, rand = Math.random) {
  const n = keys.length;
  let a = 0;
  let b = 0;
  /** @type {number[][]} */
  let buckets = Array.from({ length: n }, () => []);
  let sumSquares = 0;
  let accepted = false;
  let j = -1;
  let key = -1;
  let slot = -1;
  let clash = -1;
  /** @type {SecondTable[]} */
  const tables = Array.from({ length: n }, () => ({
    a: 0,
    b: 0,
    m: 0,
    slots: [],
    draws: 0,
    done: false,
  }));
  let firstDraws = 0;
  let secondDraws = 0;
  let fallback = false;
  /** @type {PerfectFrame[]} */
  const frames = [];

  /** @param {PerfectFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      keys: keys.slice(),
      a,
      b,
      buckets: buckets.map((row) => row.slice()),
      sumSquares,
      accepted,
      j,
      key,
      slot,
      clash,
      tables: tables.map((t) => ({ ...t, slots: t.slots.slice() })),
      firstDraws,
      secondDraws,
      slots: tables.reduce((s, t) => s + t.m, 0),
      fallback,
      lines,
    });

  const squaresOf = (/** @type {number} */ ta, /** @type {number} */ tb) => {
    const sizes = Array(n).fill(0);
    for (const k of keys) sizes[hashOf(k, ta, tb, n)]++;
    return sizes.reduce((s, c) => s + c * c, 0);
  };

  push('start', [0]);
  for (const d of draws(rand, (ta, tb) => squaresOf(ta, tb) < 4 * n)) {
    ({ a, b, fallback } = d);
    firstDraws++;
    buckets = Array.from({ length: n }, () => []);
    sumSquares = 0;
    j = key = -1;
    push('draw', [1, 2]);
    for (const k of keys) {
      key = k;
      j = hashOf(k, a, b, n);
      buckets[j].push(k);
      sumSquares += 2 * buckets[j].length - 1;
      push('place', [3]);
    }
    j = key = -1;
    accepted = sumSquares < 4 * n;
    push('check', [4]);
  }

  for (j = 0; j < n; j++) {
    const group = buckets[j];
    if (group.length === 0) continue;
    const m = group.length * group.length;
    const fits = (/** @type {number} */ ta, /** @type {number} */ tb) =>
      collidingPairs(group, (k) => hashOf(k, ta, tb, m)) === 0;
    let first = true;
    for (const d of draws(rand, fits)) {
      secondDraws++;
      fallback = d.fallback;
      const t = tables[j];
      tables[j] = {
        a: d.a,
        b: d.b,
        m,
        slots: Array(m).fill(null),
        draws: t.draws + 1,
        done: false,
      };
      key = slot = clash = -1;
      push('second', first ? [5, 6, 7, 8] : [7, 8]);
      first = false;
      let ok = true;
      for (const k of group) {
        key = k;
        slot = hashOf(k, d.a, d.b, m);
        const there = tables[j].slots[slot];
        if (there !== null) {
          clash = there;
          push('collide', [9, 10]);
          ok = false;
          break;
        }
        tables[j].slots[slot] = k;
        push('slot', [9]);
      }
      if (ok) {
        tables[j].done = true;
        key = slot = clash = -1;
        push('fits', [10]);
      }
    }
  }
  j = key = slot = clash = -1;
  fallback = false;
  push('done', [11]);
  return frames;
}

/**
 * Where a key would be looked up in a finished table: its bucket and slot, and whether it is
 * there.
 * @param {PerfectFrame} f  A done frame.
 * @param {number} k
 * @returns {{ j: number, slot: number, found: boolean }}
 */
export function lookup(f, k) {
  const j = hashOf(k, f.a, f.b, f.keys.length);
  const t = f.tables[j];
  if (t.m === 0) return { j, slot: -1, found: false };
  const slot = hashOf(k, t.a, t.b, t.m);
  return { j, slot, found: t.slots[slot] === k };
}

/** @type {Record<'textbook'|'attack'|'small', number[]>} */
export const HASH_PRESETS = {
  textbook: [10, 22, 37, 40, 52, 60, 70, 72, 75],
  attack: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
  small: [3, 14, 15, 92],
};
