/**
 * The Z-function of a string S, 0-based: Z[i] is the length of the longest substring starting at
 * i that matches a prefix of S. Z[0] is left undefined here. The Z-box [l, r) is the matching
 * segment that reaches furthest right so far; a position inside it starts from the Z value of
 * its mirror position i − l, and only letters past r need comparing. To search, run it on
 * P + $ + T, where the separator stops any Z value exceeding m.
 */

export const MAX_LEN = 20;
export const SEPARATOR = '$';

export const zPseudocode = [
  'l = 0, r = 0   // the Z-box is S[l..r)',
  'for i = 1 to n − 1:',
  '  Z[i] = i < r ? min(r − i, Z[i − l]) : 0',
  '  while i + Z[i] < n and S[Z[i]] == S[i + Z[i]]:',
  '    Z[i] = Z[i] + 1',
  '  if i + Z[i] > r: l = i, r = i + Z[i]',
  'with S = P + $ + T: P occurs at j where Z[m + 1 + j] == m',
];

/**
 * @typedef {object} ZFrame
 * @property {'start'|'outside'|'inside'|'compare'|'box'|'store'|'report'|'done'} kind
 * @property {string} s
 * @property {number} patternLength  m when searching, 0 for a plain string.
 * @property {(number|null)[]} z  null until computed; Z[0] stays null.
 * @property {number} i  The position being computed, -1 when none.
 * @property {number} value  The running value of Z[i].
 * @property {number} l
 * @property {number} r  The Z-box is [l, r), empty when l equals r.
 * @property {number} mirror  inside: i − l, -1 otherwise.
 * @property {boolean} equal  compare: the letters are equal.
 * @property {number} reused  Letters known without reading them, summed over all i.
 * @property {number} comparisons
 * @property {number[]} matches  Starts of the pattern in the text, when searching.
 * @property {number[]} lines
 */

/**
 * The string to run on: the text alone, or pattern + $ + text.
 * @param {string} text
 * @param {string} pattern
 */
export const zInput = (text, pattern) => (pattern ? pattern + SEPARATOR + text : text);

/**
 * Letter comparisons of computing each Z[i] from zero with no box.
 * @param {string} s
 * @returns {number}
 */
export function naiveZComparisons(s) {
  let total = 0;
  for (let i = 1; i < s.length; i++) {
    for (let k = 0; i + k < s.length; k++) {
      total++;
      if (s[k] !== s[i + k]) break;
    }
  }
  return total;
}

/**
 * @param {string} text
 * @param {string} [pattern]  Empty for a plain Z-function of the text.
 * @returns {ZFrame[]}
 */
export function zTrace(text, pattern = '') {
  const s = zInput(text, pattern);
  const n = s.length;
  const m = pattern.length;
  /** @type {(number|null)[]} */
  const z = Array.from({ length: n }, () => null);
  /** @type {number[]} */
  const matches = [];
  /** @type {ZFrame[]} */
  const frames = [];
  let l = 0;
  let r = 0;
  let reused = 0;
  let comparisons = 0;

  /**
   * @param {ZFrame['kind']} kind
   * @param {number[]} lines
   * @param {number} i
   * @param {number} value
   * @param {{mirror?: number, equal?: boolean}} [extra]
   */
  const push = (kind, lines, i, value, extra = {}) =>
    frames.push({
      kind,
      s,
      patternLength: m,
      z: z.slice(),
      i,
      value,
      l,
      r,
      mirror: extra.mirror ?? -1,
      equal: extra.equal ?? false,
      reused,
      comparisons,
      matches: matches.slice(),
      lines,
    });

  push('start', [0], -1, 0);

  for (let i = 1; i < n; i++) {
    let value = 0;
    if (i < r) {
      const mirror = i - l;
      value = Math.min(r - i, /** @type {number} */ (z[mirror]));
      reused += value;
      push('inside', [1, 2], i, value, { mirror });
    } else {
      push('outside', [1, 2], i, 0);
    }

    while (i + value < n) {
      comparisons++;
      const equal = s[value] === s[i + value];
      push('compare', equal ? [3, 4] : [3], i, value, { equal });
      if (!equal) break;
      value++;
    }

    if (i + value > r) {
      l = i;
      r = i + value;
      push('box', [5], i, value);
    }
    z[i] = value;
    push('store', [5], i, value);

    if (m > 0 && value === m) {
      matches.push(i - m - 1);
      push('report', [6], i, value);
    }
  }

  push('done', [], -1, 0);
  return frames;
}

/** @type {Record<'classic'|'palindrome'|'repeats'|'search', {text: string, pattern: string}>} */
export const Z_PRESETS = {
  classic: { text: 'aabxaabxcaabxaabxay', pattern: '' },
  palindrome: { text: 'abacabadabacaba', pattern: '' },
  repeats: { text: 'aaaaaaaaaaaa', pattern: '' },
  search: { text: 'abcabcabc', pattern: 'abc' },
};
