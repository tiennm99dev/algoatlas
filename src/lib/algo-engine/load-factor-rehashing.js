/**
 * A chained hash table that grows when its load factor α = n/m passes a threshold
 * (CLRS 17.4 for the amortized argument). Each insert costs one step, and a resize costs one
 * step per key moved into the new table. Doubling the size keeps the total work under
 * 3 steps per insert; adding a fixed number of buckets makes it grow like n².
 */

/** @typedef {'double'|'add'} Growth */
/** @typedef {0.5|0.75|1|null} Threshold  null never resizes. */

/**
 * @typedef {object} LoadFrame
 * @property {'start'|'insert'|'check'|'grow'|'move'|'rehashed'|'done'} kind
 * @property {number[][]} buckets  Every chain (deep-copied per frame); the new table while moving.
 * @property {number} m            Number of buckets drawn (the new size while moving).
 * @property {number} n            Keys stored.
 * @property {number} nextM        Size being grown to on a grow frame, else m.
 * @property {number} key          Key just inserted, -1 when none.
 * @property {number} bucket       Its bucket, -1 when none.
 * @property {number} moved        Key just moved by a resize, -1 when none.
 * @property {number} movedTo      Bucket it moved to, -1 when none.
 * @property {number[]} pending    Keys still waiting to move (empty outside a resize).
 * @property {boolean} over        True on a check frame whose α passed the threshold.
 * @property {number[]} costs      Steps spent on each insert so far (1 + keys moved).
 * @property {number} work         Running total of steps.
 * @property {number} moves        Running total of keys moved by resizes.
 * @property {number} grows        Resizes so far.
 * @property {number} load         n / m.
 * @property {number} longest      Longest chain.
 * @property {number[]} lines
 */

export const START_M = 4;
export const ADD_STEP = 4;
export const MAX_INSERTS = 32;

/** @type {Record<Growth, string[]>} */
export const loadPseudocode = {
  double: [
    'insert(k):',
    '  append k to chain k mod m;  n = n + 1',
    '  α = n / m',
    '  if α > threshold:',
    '    m′ = 2 · m',
    '    move every key k to chain k mod m′   // n moves',
    '    m = m′',
  ],
  add: [
    'insert(k):',
    '  append k to chain k mod m;  n = n + 1',
    '  α = n / m',
    '  if α > threshold:',
    '    m′ = m + 4',
    '    move every key k to chain k mod m′   // n moves',
    '    m = m′',
  ],
};

/**
 * The fixed key sequence: the first `count` distinct values of a small LCG in [0, 999], so
 * every run uses the same scattered keys.
 * @param {number} count
 * @returns {number[]}
 */
export function keySequence(count) {
  const seen = new Set();
  let s = 2024;
  while (seen.size < count) {
    s = (s * 1103515245 + 12345) % 2147483648;
    seen.add(Math.floor(s / 65536) % 1000);
  }
  return [...seen];
}

/** @param {number[][]} buckets */
const longestChain = (buckets) => buckets.reduce((best, c) => Math.max(best, c.length), 0);

/**
 * @param {number} count Inserts to run, clamped to [0, MAX_INSERTS].
 * @param {Threshold} threshold
 * @param {Growth} growth
 * @returns {LoadFrame[]}
 */
export function loadTrace(count, threshold, growth) {
  const keys = keySequence(Math.max(0, Math.min(MAX_INSERTS, Math.floor(count))));
  let m = START_M;
  /** @type {number[][]} */
  let buckets = Array.from({ length: m }, () => []);
  let n = 0;
  let work = 0;
  let moves = 0;
  let grows = 0;
  /** @type {number[]} */
  const costs = [];
  /** @type {LoadFrame[]} */
  const frames = [];

  /**
   * @param {LoadFrame['kind']} kind
   * @param {number[]} lines
   * @param {Partial<LoadFrame>} [extra]
   */
  function push(kind, lines, extra = {}) {
    frames.push({
      kind,
      buckets: buckets.map((c) => c.slice()),
      m,
      n,
      nextM: m,
      key: -1,
      bucket: -1,
      moved: -1,
      movedTo: -1,
      pending: [],
      over: false,
      costs: costs.slice(),
      work,
      moves,
      grows,
      load: n / m,
      longest: longestChain(buckets),
      lines,
      ...extra,
    });
  }

  push('start', []);
  for (const key of keys) {
    const bucket = key % m;
    buckets[bucket].push(key);
    n++;
    work++;
    costs.push(1);
    push('insert', [0, 1], { key, bucket });

    const over = threshold !== null && n / m > threshold;
    push('check', [2, 3], { key, bucket, over });
    if (!over) continue;

    const nextM = growth === 'double' ? 2 * m : m + ADD_STEP;
    const all = buckets.flat();
    push('grow', [4], { key, bucket, nextM, pending: all.slice() });
    m = nextM;
    buckets = Array.from({ length: m }, () => []);
    all.forEach((k, i) => {
      buckets[k % m].push(k);
      moves++;
      work++;
      costs[costs.length - 1]++;
      push('move', [5], { key, moved: k, movedTo: k % m, pending: all.slice(i + 1) });
    });
    grows++;
    push('rehashed', [6], { key, bucket: key % m });
  }
  push('done', []);
  return frames;
}
