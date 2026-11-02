/**
 * Knuth-Morris-Pratt search, 0-based. The prefix function π[i] is the length of the longest
 * proper prefix of P[0..i] that is also a suffix of it (its longest border). The search keeps
 * `q`, the number of pattern letters matched so far ending just before T[i]; on a mismatch `q`
 * falls back to π[q − 1] and the text index never moves backwards.
 */

export const MAX_TEXT = 20;
export const MAX_PATTERN = 10;

export const kmpPseudocode = [
  'π[0] = 0, k = 0',
  'for i = 1 to m − 1:',
  '  while k > 0 and P[k] ≠ P[i]: k = π[k − 1]',
  '  if P[k] == P[i]: k = k + 1',
  '  π[i] = k',
  'q = 0',
  'for i = 0 to n − 1:',
  '  while q > 0 and P[q] ≠ T[i]: q = π[q − 1]',
  '  if P[q] == T[i]: q = q + 1',
  '  if q == m: report a match at i − m + 1, q = π[q − 1]',
];

/**
 * @typedef {object} KmpFrame
 * @property {'start'|'build-compare'|'build-fall'|'build-store'|'search-start'|'compare'|'fall'|'advance'|'match'|'done'} kind
 * @property {'build'|'search'} phase
 * @property {string} text
 * @property {string} pattern
 * @property {(number|null)[]} pi  null until computed.
 * @property {number} i  The index read now: in the pattern while building, in the text while searching.
 * @property {number} k  Letters currently matched: k while building, q while searching.
 * @property {boolean} equal  build-compare and compare: the two letters are equal.
 * @property {number} fallFrom  build-fall and fall: k before the jump, -1 otherwise.
 * @property {number[]} matches
 * @property {number} buildComparisons
 * @property {number} comparisons  Letter comparisons in the search.
 * @property {number} falls  Fallback jumps in the search.
 * @property {number} maxI  The furthest text index reached, -1 before the search.
 * @property {number[]} lines
 */

/**
 * The prefix function, computed directly.
 * @param {string} pattern
 * @returns {number[]}
 */
export function prefixFunction(pattern) {
  const pi = Array.from({ length: pattern.length }, () => 0);
  let k = 0;
  for (let i = 1; i < pattern.length; i++) {
    while (k > 0 && pattern[k] !== pattern[i]) k = pi[k - 1];
    if (pattern[k] === pattern[i]) k++;
    pi[i] = k;
  }
  return pi;
}

/**
 * @param {string} text
 * @param {string} pattern
 * @returns {KmpFrame[]}
 */
export function kmpTrace(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  /** @type {(number|null)[]} */
  const pi = Array.from({ length: m }, () => null);
  /** @type {KmpFrame[]} */
  const frames = [];
  /** @type {number[]} */
  const matches = [];
  /** @type {'build'|'search'} */
  let phase = 'build';
  let buildComparisons = 0;
  let comparisons = 0;
  let falls = 0;
  let maxI = -1;

  /**
   * @param {KmpFrame['kind']} kind
   * @param {number[]} lines
   * @param {number} i
   * @param {number} k
   * @param {{equal?: boolean, fallFrom?: number}} [extra]
   */
  const push = (kind, lines, i, k, extra = {}) =>
    frames.push({
      kind,
      phase,
      text,
      pattern,
      pi: pi.slice(),
      i,
      k,
      equal: extra.equal ?? false,
      fallFrom: extra.fallFrom ?? -1,
      matches: matches.slice(),
      buildComparisons,
      comparisons,
      falls,
      maxI,
      lines,
    });

  pi[0] = 0;
  push('start', [0], 0, 0);

  let k = 0;
  for (let i = 1; i < m; i++) {
    for (;;) {
      buildComparisons++;
      const equal = pattern[k] === pattern[i];
      const lines = equal || k === 0 ? [1, 3] : [1, 2];
      push('build-compare', lines, i, k, { equal });
      if (equal || k === 0) {
        if (equal) k++;
        break;
      }
      const from = k;
      k = /** @type {number} */ (pi[k - 1]);
      push('build-fall', [2], i, k, { fallFrom: from });
    }
    pi[i] = k;
    push('build-store', [4], i, k);
  }

  phase = 'search';
  push('search-start', [5], 0, 0);

  let q = 0;
  for (let i = 0; i < n; i++) {
    maxI = i;
    for (;;) {
      comparisons++;
      const equal = pattern[q] === text[i];
      const lines = equal || q === 0 ? [6, 8] : [6, 7];
      push('compare', lines, i, q, { equal });
      if (equal || q === 0) {
        if (equal) q++;
        break;
      }
      const from = q;
      q = /** @type {number} */ (pi[q - 1]);
      falls++;
      push('fall', [7], i, q, { fallFrom: from });
    }
    if (q === m) {
      matches.push(i - m + 1);
      push('match', [9], i, q);
      const from = q;
      q = /** @type {number} */ (pi[q - 1]);
      push('advance', [9], i, q, { fallFrom: from });
    }
  }

  push('done', [], n, q);
  return frames;
}

/** @type {Record<'classic'|'border'|'overlap'|'repeats', {text: string, pattern: string}>} */
export const KMP_PRESETS = {
  classic: { text: 'abababcabababd', pattern: 'ababd' },
  border: { text: 'aabaacaabaaab', pattern: 'aabaaab' },
  overlap: { text: 'abababab', pattern: 'abab' },
  repeats: { text: 'aaaaaaaaaaaaaaab', pattern: 'aaaab' },
};
