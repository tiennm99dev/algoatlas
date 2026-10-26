/**
 * Two hash tables of the same size filled with the same keys: one resolves collisions by
 * separate chaining, the other by open addressing (CLRS 11.2 and 11.4). Both use the home
 * bucket h(k) = k mod M. Open addressing probes slots in the order the chosen method gives:
 *
 * - linear:    (h(k) + i) mod M
 * - quadratic: (h(k) + i²) mod M
 * - double:    (h(k) + i · h₂(k)) mod M, with h₂(k) = 7 − (k mod 7)
 *
 * for i = 0, 1, …, M − 1. The trace inserts every key into both tables, then optionally
 * searches both for one key.
 */

/** @typedef {'linear'|'quadratic'|'double'} ProbeMethod */
/** @typedef {'mixed'|'cluster'|'same-home'|'random'} CollisionPreset */

/**
 * @typedef {object} CollisionFrame
 * @property {'start'|'hash'|'chain-compare'|'chain-add'|'probe'|'place'|'fail'|'chain-hit'|'chain-miss'|'probe-hit'|'probe-miss'|'done'} kind
 * @property {number[][]} chains     Every chain of the chaining table (deep-copied per frame).
 * @property {(number | null)[]} slots  The open-addressing table; null is an empty slot.
 * @property {number} key            Key in flight, -1 when none.
 * @property {number} home           h(key), -1 when none.
 * @property {number} step           h₂(key) for double hashing, 0 otherwise.
 * @property {number} pos            Chain position being compared, -1 when none.
 * @property {number} slot           Slot being probed, -1 when none.
 * @property {number} attempt        Probe number i of the current probe, -1 when none.
 * @property {boolean} search        True while the final lookup runs.
 * @property {number} chainCompares  Running total of key comparisons in chains.
 * @property {number} probes         Running total of slots inspected by open addressing.
 * @property {number} placed         Keys stored in the open-addressing table.
 * @property {number} failed         Keys open addressing could not place.
 * @property {number} longest        Longest chain.
 * @property {number[]} lines
 */

/** Table size, a prime so that double hashing reaches every slot. */
export const M = 11;
/** The prime in the second hash h₂(k) = R − (k mod R). */
export const R = 7;
export const MAX_KEYS = 10;
export const MAX_KEY = 99;

/** @type {Record<ProbeMethod, string>} */
const PROBE_LINE = {
  linear: '    s = (h(k) + i) mod 11',
  quadratic: '    s = (h(k) + i²) mod 11',
  double: '    s = (h(k) + i · h₂(k)) mod 11,  h₂(k) = 7 − (k mod 7)',
};

/** @param {ProbeMethod} method */
const pseudocodeFor = (method) => [
  'insert(k):',
  '  chaining: b = h(k) = k mod 11',
  '    compare k with every key in chain b',
  '    append k to chain b',
  '  probing: for i = 0, 1, …, 10:',
  PROBE_LINE[method],
  '    if slot s is empty: put k there and stop',
  '    else slot s is taken: a collision, try i + 1',
  '  every probe hit a taken slot: the insert fails',
  'search(k): same order; stop at k (hit) or at an empty slot (miss)',
];

/** @type {Record<ProbeMethod, string[]>} */
export const collisionPseudocode = {
  linear: pseudocodeFor('linear'),
  quadratic: pseudocodeFor('quadratic'),
  double: pseudocodeFor('double'),
};

/** @param {number} k */
export const homeOf = (k) => k % M;

/** @param {number} k */
export const stepOf = (k) => R - (k % R);

/**
 * The slot open addressing inspects on probe i.
 * @param {number} k
 * @param {number} i
 * @param {ProbeMethod} method
 */
export function probeSlot(k, i, method) {
  const h = homeOf(k);
  if (method === 'linear') return (h + i) % M;
  if (method === 'quadratic') return (h + i * i) % M;
  return (h + i * stepOf(k)) % M;
}

/** @param {number[][]} chains */
const longestChain = (chains) => chains.reduce((best, c) => Math.max(best, c.length), 0);

/**
 * @param {number[]} keys Distinct keys in [0, MAX_KEY], at most MAX_KEYS of them.
 * @param {ProbeMethod} method
 * @param {number | null} [search] Key to look up after the inserts, or null.
 * @returns {CollisionFrame[]}
 */
export function collisionTrace(keys, method, search = null) {
  /** @type {number[][]} */
  const chains = Array.from({ length: M }, () => []);
  /** @type {(number | null)[]} */
  const slots = Array.from({ length: M }, () => null);
  let chainCompares = 0;
  let probes = 0;
  let placed = 0;
  let failed = 0;
  /** @type {CollisionFrame[]} */
  const frames = [];

  /**
   * @param {CollisionFrame['kind']} kind
   * @param {number[]} lines
   * @param {Partial<CollisionFrame>} [extra]
   */
  function push(kind, lines, extra = {}) {
    frames.push({
      kind,
      chains: chains.map((c) => c.slice()),
      slots: slots.slice(),
      key: -1,
      home: -1,
      step: 0,
      pos: -1,
      slot: -1,
      attempt: -1,
      search: false,
      chainCompares,
      probes,
      placed,
      failed,
      longest: longestChain(chains),
      lines,
      ...extra,
    });
  }

  push('start', []);
  for (const key of keys) {
    const home = homeOf(key);
    const step = method === 'double' ? stepOf(key) : 0;
    const at = { key, home, step };
    push('hash', [0, 1], at);

    const chain = chains[home];
    for (let pos = 0; pos < chain.length; pos++) {
      chainCompares++;
      push('chain-compare', [2], { ...at, pos });
    }
    chain.push(key);
    push('chain-add', [3], { ...at, pos: chain.length - 1 });

    let done = false;
    for (let i = 0; i < M && !done; i++) {
      const slot = probeSlot(key, i, method);
      probes++;
      if (slots[slot] === null) {
        slots[slot] = key;
        placed++;
        push('place', [4, 5, 6], { ...at, slot, attempt: i });
        done = true;
      } else {
        push('probe', [4, 5, 7], { ...at, slot, attempt: i });
      }
    }
    if (!done) {
      failed++;
      push('fail', [8], at);
    }
  }

  if (search !== null) {
    const home = homeOf(search);
    const step = method === 'double' ? stepOf(search) : 0;
    const at = { key: search, home, step, search: true };
    push('hash', [9], at);

    const chain = chains[home];
    let hit = -1;
    for (let pos = 0; pos < chain.length; pos++) {
      chainCompares++;
      push('chain-compare', [9, 2], { ...at, pos });
      if (chain[pos] === search) {
        hit = pos;
        break;
      }
    }
    if (hit >= 0) push('chain-hit', [9], { ...at, pos: hit });
    else push('chain-miss', [9], at);

    let ended = false;
    for (let i = 0; i < M && !ended; i++) {
      const slot = probeSlot(search, i, method);
      probes++;
      if (slots[slot] === search) {
        push('probe-hit', [9], { ...at, slot, attempt: i });
        ended = true;
      } else if (slots[slot] === null) {
        push('probe-miss', [9], { ...at, slot, attempt: i });
        ended = true;
      } else {
        push('probe', [9, 5], { ...at, slot, attempt: i });
      }
    }
    if (!ended) push('probe-miss', [9], at);
  }

  push('done', []);
  return frames;
}

/** @type {Record<Exclude<CollisionPreset, 'random'>, number[]>} */
const FIXED = {
  mixed: [22, 41, 53, 46, 30, 13, 1, 67],
  cluster: [12, 13, 14, 1, 2, 23, 34, 15],
  'same-home': [0, 11, 22, 33, 44, 55, 66],
};

/**
 * @param {CollisionPreset} preset
 * @param {() => number} [rand]
 * @returns {number[]}
 */
export function makeKeys(preset, rand = Math.random) {
  if (preset !== 'random') return FIXED[preset].slice();
  const seen = new Set();
  while (seen.size < 8) seen.add(Math.floor(rand() * (MAX_KEY + 1)));
  return [...seen];
}

/**
 * @param {string} text Comma-separated whole numbers.
 * @returns {{keys: number[]} | {error: 'format'|'range'|'count'|'duplicate'}}
 */
export function parseKeys(text) {
  const tokens = text.split(',').map((s) => s.trim());
  if (!tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const keys = tokens.map(Number);
  if (keys.some((k) => k < 0 || k > MAX_KEY)) return { error: 'range' };
  if (keys.length > MAX_KEYS) return { error: 'count' };
  if (new Set(keys).size !== keys.length) return { error: 'duplicate' };
  return { keys };
}
