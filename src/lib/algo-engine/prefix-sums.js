/**
 * Prefix sums and difference arrays, the two halves of one idea.
 *
 * - `prefix`: P has n + 1 entries, P[i] = a[0] + … + a[i − 1] and P[0] = 0, built in one pass.
 *   Then a[l] + … + a[r] = P[r + 1] − P[l]: two lookups, whatever the length of the range.
 * - `difference`: D[0] = a[0] and D[i] = a[i] − a[i − 1], so a is the prefix sum of D. Adding v
 *   to every a[l..r] only changes D[l] (+v) and D[r + 1] (−v); one prefix-sum pass at the end
 *   rebuilds the updated array. q range updates cost O(q + n) instead of O(q·n).
 *
 * Ranges here are inclusive, l ≤ r, and indices are 0-based.
 */

export const MAX_N = 16;
export const MIN_VALUE = -99;
export const MAX_VALUE = 99;
export const MAX_UPDATES = 6;

/** @typedef {'prefix' | 'difference'} PrefixMode */
/** @typedef {{ l: number, r: number, v: number }} RangeUpdate */

export const prefixPseudocode = {
  prefix: [
    'build(a):              ▹ P[i] = a[0] + … + a[i − 1]',
    '  P[0] = 0',
    '  for i = 0 to n − 1:',
    '    P[i + 1] = P[i] + a[i]',
    'rangeSum(l, r):        ▹ a[l] + … + a[r]',
    '  return P[r + 1] − P[l]',
  ],
  difference: [
    'D[0] = a[0]',
    'for i = 1 to n − 1: D[i] = a[i] − a[i − 1]',
    'addRange(l, r, v):     ▹ add v to a[l..r]',
    '  D[l] = D[l] + v',
    '  if r + 1 < n: D[r + 1] = D[r + 1] − v',
    'rebuild:',
    '  b[0] = D[0]',
    '  for i = 1 to n − 1: b[i] = b[i − 1] + D[i]',
  ],
};

/**
 * @typedef {object} PrefixFrame
 * @property {'start'|'build'|'query'|'diff'|'update-left'|'update-right'|'rebuild'|'done'} kind
 * @property {PrefixMode} mode
 * @property {number[]} items  The input array a.
 * @property {(number|null)[]} prefix  P, n + 1 entries, null until filled (empty in difference mode).
 * @property {(number|null)[]} diff  D, n entries, null until filled (empty in prefix mode).
 * @property {(number|null)[]} out  The rebuilt array b, null until filled (empty in prefix mode).
 * @property {number} at  The index just written, -1 when none.
 * @property {number} l  Left end of the query or of the current update.
 * @property {number} r  Right end (inclusive) of the query or of the current update.
 * @property {number} value  v of the current update, 0 otherwise.
 * @property {number} update  Index of the current update, -1 when none.
 * @property {number | null} result  The range sum once the query has run.
 * @property {number} additions  Additions and subtractions made so far.
 * @property {number} lookups  Entries of P read by the query.
 * @property {number} writes  D entries changed by range updates so far.
 * @property {number} naive  Work without the trick: r − l + 1 reads for the query, or the
 *   Σ (r − l + 1) element writes of the updates applied so far.
 * @property {boolean} skipped  On update-right: r + 1 = n, so there is nothing to cancel.
 * @property {number[]} lines
 */

/**
 * Reads a comma- or space-separated list of whole numbers.
 * @param {string} text
 * @returns {{ values: number[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parsePrefixValues(text) {
  const tokens = text
    .replace(/[−–]/g, '-')
    .split(/[\s,]+/)
    .filter(Boolean);
  if (tokens.length === 0 || !tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const values = tokens.map(Number);
  if (values.some((v) => v < MIN_VALUE || v > MAX_VALUE)) return { error: 'range' };
  if (values.length > MAX_N) return { error: 'count' };
  return { values };
}

/**
 * Reads range updates written as "l r v" triples separated by commas or semicolons, for an
 * array of length n. An empty text means no updates.
 * @param {string} text @param {number} n
 * @returns {{ updates: RangeUpdate[] } | { error: 'format' | 'range' | 'count' }}
 */
export function parseUpdates(text, n) {
  const parts = text
    .replace(/[−–]/g, '-')
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  /** @type {RangeUpdate[]} */
  const updates = [];
  for (const part of parts) {
    const t = part.split(/\s+/);
    if (t.length !== 3 || !t.every((s) => /^[+-]?\d+$/.test(s))) return { error: 'format' };
    const [l, r, v] = t.map(Number);
    if (l < 0 || r >= n || l > r || v < MIN_VALUE || v > MAX_VALUE) return { error: 'range' };
    updates.push({ l, r, v });
  }
  if (updates.length > MAX_UPDATES) return { error: 'count' };
  return { updates };
}

/** Writes updates back as text. @param {RangeUpdate[]} updates */
export const formatUpdates = (updates) => updates.map((u) => `${u.l} ${u.r} ${u.v}`).join(', ');

/**
 * @param {PrefixMode} mode @param {number[]} items
 */
function recorder(mode, items) {
  /** @type {PrefixFrame[]} */
  const frames = [];
  const n = items.length;
  const s = {
    /** @type {(number|null)[]} */
    prefix: mode === 'prefix' ? Array.from({ length: n + 1 }, () => null) : [],
    /** @type {(number|null)[]} */
    diff: mode === 'difference' ? Array.from({ length: n }, () => null) : [],
    /** @type {(number|null)[]} */
    out: mode === 'difference' ? Array.from({ length: n }, () => null) : [],
    at: -1,
    l: 0,
    r: 0,
    value: 0,
    update: -1,
    /** @type {number | null} */
    result: null,
    additions: 0,
    lookups: 0,
    writes: 0,
    naive: 0,
    skipped: false,
  };
  /** @param {PrefixFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      mode,
      items: items.slice(),
      ...s,
      prefix: s.prefix.slice(),
      diff: s.diff.slice(),
      out: s.out.slice(),
      lines: lines.slice(),
    });
  }
  return { frames, s, push };
}

/**
 * Builds P and answers one range-sum query.
 * @param {number[]} values  1 ≤ length ≤ MAX_N.
 * @param {number} l @param {number} r  0 ≤ l ≤ r < length.
 * @returns {PrefixFrame[]}
 */
export function prefixTrace(values, l, r) {
  const a = values.slice();
  const { frames, s, push } = recorder('prefix', a);
  const P = s.prefix;
  s.l = l;
  s.r = r;
  P[0] = 0;
  push('start', [0, 1]);
  for (let i = 0; i < a.length; i++) {
    P[i + 1] = /** @type {number} */ (P[i]) + a[i];
    s.at = i;
    s.additions++;
    push('build', [2, 3]);
  }
  s.at = -1;
  s.lookups = 2;
  s.additions++;
  s.naive = r - l + 1;
  s.result = /** @type {number} */ (P[r + 1]) - /** @type {number} */ (P[l]);
  push('query', [4, 5]);
  push('done', [5]);
  return frames;
}

/**
 * Builds D, applies the range updates to it and rebuilds the array.
 * @param {number[]} values  1 ≤ length ≤ MAX_N.
 * @param {RangeUpdate[]} updates  Each with 0 ≤ l ≤ r < length.
 * @returns {PrefixFrame[]}
 */
export function differenceTrace(values, updates) {
  const a = values.slice();
  const n = a.length;
  const { frames, s, push } = recorder('difference', a);
  const D = s.diff;
  const b = s.out;
  push('start', [0]);
  for (let i = 0; i < n; i++) {
    D[i] = i === 0 ? a[0] : a[i] - a[i - 1];
    if (i > 0) s.additions++;
    s.at = i;
    push('diff', [i === 0 ? 0 : 1]);
  }
  for (const [k, u] of updates.entries()) {
    s.update = k;
    s.l = u.l;
    s.r = u.r;
    s.value = u.v;
    s.naive += u.r - u.l + 1;
    D[u.l] = /** @type {number} */ (D[u.l]) + u.v;
    s.at = u.l;
    s.writes++;
    s.additions++;
    s.skipped = false;
    push('update-left', [2, 3]);
    if (u.r + 1 < n) {
      D[u.r + 1] = /** @type {number} */ (D[u.r + 1]) - u.v;
      s.at = u.r + 1;
      s.writes++;
      s.additions++;
    } else {
      s.at = -1;
      s.skipped = true;
    }
    push('update-right', [4]);
  }
  s.update = -1;
  s.value = 0;
  s.skipped = false;
  for (let i = 0; i < n; i++) {
    b[i] = i === 0 ? D[0] : /** @type {number} */ (b[i - 1]) + /** @type {number} */ (D[i]);
    if (i > 0) s.additions++;
    s.at = i;
    push('rebuild', i === 0 ? [5, 6] : [7]);
  }
  s.at = -1;
  push('done', [7]);
  return frames;
}

/**
 * The oracle the difference array must agree with: apply every update element by element.
 * @param {number[]} values @param {RangeUpdate[]} updates
 */
export function applyDirectly(values, updates) {
  const out = values.slice();
  for (const u of updates) for (let i = u.l; i <= u.r; i++) out[i] += u.v;
  return out;
}
