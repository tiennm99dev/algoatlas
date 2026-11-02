/**
 * Manacher's algorithm on the separated string T = # s₀ # s₁ # … #, so odd and even palindromes
 * look the same: every palindrome of T has a centre, and P[i], its radius, equals the length of
 * the palindrome of S it stands for. (C, R) is the palindrome reaching furthest right so far. A
 * centre i inside it starts from its mirror 2C − i, capped at R − i, so only letters past R are
 * ever read for the first time.
 */

export const MAX_LEN = 16;
export const SEP = '#';

export const manacherPseudocode = [
  'T = # + letters of S joined by # + #   // length 2n + 1',
  'C = 0, R = 0   // centre and right end of the furthest palindrome',
  'for i = 0 to |T| − 1:',
  '  P[i] = i < R ? min(R − i, P[2C − i]) : 0',
  '  while T[i − P[i] − 1] == T[i + P[i] + 1], both inside T:',
  '    P[i] = P[i] + 1',
  '  if i + P[i] > R: C = i, R = i + P[i]',
  '  if P[i] > best: best = P[i], centre = i',
  'the answer starts at (centre − best) / 2 in S, with length best',
];

/**
 * @typedef {object} ManacherFrame
 * @property {'start'|'outside'|'inside'|'compare'|'box'|'store'|'best'|'done'} kind
 * @property {string} s
 * @property {string} t
 * @property {(number|null)[]} p  null until computed.
 * @property {number} i  The centre being computed, -1 when none.
 * @property {number} value  The running radius of i.
 * @property {number} c
 * @property {number} r
 * @property {number} mirror  inside: 2C − i, -1 otherwise.
 * @property {boolean} equal  compare: the letters are equal.
 * @property {number} reused  Radius known without reading, summed over all centres.
 * @property {number} comparisons
 * @property {number} best  The longest radius so far.
 * @property {number} bestCentre
 * @property {number[]} lines
 */

/** @param {string} s */
export const separate = (s) => SEP + [...s].join(SEP) + SEP;

/**
 * The palindrome of S that a centre and radius of T stand for.
 * @param {string} s
 * @param {number} centre
 * @param {number} radius
 */
export function palindromeAt(s, centre, radius) {
  const start = (centre - radius) / 2;
  return s.slice(start, start + radius);
}

/**
 * Letter comparisons of expanding around every centre from zero.
 * @param {string} t
 * @returns {number}
 */
export function naiveExpansions(t) {
  let total = 0;
  for (let i = 0; i < t.length; i++) {
    for (let k = 1; i - k >= 0 && i + k < t.length; k++) {
      total++;
      if (t[i - k] !== t[i + k]) break;
    }
  }
  return total;
}

/**
 * @param {string} s
 * @returns {ManacherFrame[]}
 */
export function manacherTrace(s) {
  const t = separate(s);
  const n = t.length;
  /** @type {(number|null)[]} */
  const p = Array.from({ length: n }, () => null);
  /** @type {ManacherFrame[]} */
  const frames = [];
  let c = 0;
  let r = 0;
  let reused = 0;
  let comparisons = 0;
  let best = 0;
  let bestCentre = 0;

  /**
   * @param {ManacherFrame['kind']} kind
   * @param {number[]} lines
   * @param {number} i
   * @param {number} value
   * @param {{mirror?: number, equal?: boolean}} [extra]
   */
  const push = (kind, lines, i, value, extra = {}) =>
    frames.push({
      kind,
      s,
      t,
      p: p.slice(),
      i,
      value,
      c,
      r,
      mirror: extra.mirror ?? -1,
      equal: extra.equal ?? false,
      reused,
      comparisons,
      best,
      bestCentre,
      lines,
    });

  push('start', [0, 1], -1, 0);

  for (let i = 0; i < n; i++) {
    let value = 0;
    if (i < r) {
      const mirror = 2 * c - i;
      value = Math.min(r - i, /** @type {number} */ (p[mirror]));
      reused += value;
      push('inside', [2, 3], i, value, { mirror });
    } else {
      push('outside', [2, 3], i, 0);
    }

    while (i - value - 1 >= 0 && i + value + 1 < n) {
      comparisons++;
      const equal = t[i - value - 1] === t[i + value + 1];
      push('compare', equal ? [4, 5] : [4], i, value, { equal });
      if (!equal) break;
      value++;
    }

    if (i + value > r) {
      c = i;
      r = i + value;
      push('box', [6], i, value);
    }
    p[i] = value;
    push('store', [6], i, value);
    if (value > best) {
      best = value;
      bestCentre = i;
      push('best', [7], i, value);
    }
  }

  push('done', [8], -1, 0);
  return frames;
}

/** @type {Record<'nested'|'even'|'repeats'|'none', string>} */
export const MANACHER_PRESETS = {
  nested: 'abacabacaba',
  even: 'xabbay',
  repeats: 'aaaaaaaa',
  none: 'abcdefg',
};
