/**
 * Boyer-Moore search with the bad-character rule only, 0-based. The pattern is compared from its
 * right end. On a mismatch at pattern index j against text letter c, the pattern slides so that
 * the rightmost c in it lines up with that letter: by j − last[c], or by 1 when that is not
 * positive. After a full match it lines up the letter just past the window the same way. The
 * good-suffix rule of the full algorithm is left out.
 */

export const MAX_TEXT = 20;
export const MAX_PATTERN = 8;

export const boyerMoorePseudocode = [
  'last[c] = rightmost index of c in P, −1 if absent',
  's = 0',
  'while s ≤ n − m:',
  '  j = m − 1',
  '  while j ≥ 0 and P[j] == T[s + j]: j = j − 1',
  '  if j < 0: report a match at s',
  '    s = s + (s + m < n ? m − last[T[s + m]] : 1)',
  '  else: s = s + max(1, j − last[T[s + j]])',
];

/**
 * @typedef {object} BoyerMooreFrame
 * @property {'start'|'table'|'align'|'compare'|'match'|'shift'|'done'} kind
 * @property {string} text
 * @property {string} pattern
 * @property {Record<string, number>} last  Rightmost index of each pattern letter seen so far.
 * @property {number} shift  Where the pattern starts in the text.
 * @property {number} j  The pattern index read now, -1 when none.
 * @property {boolean} equal  compare: the letters are equal.
 * @property {number} badAt  shift: the text index whose letter decides the skip, -1 when none.
 * @property {string} badLetter  shift: that letter, empty when there is none.
 * @property {number} skip  shift: how far the pattern moves, 0 otherwise.
 * @property {boolean} afterMatch  shift: the skip follows a full match.
 * @property {number[]} matches
 * @property {number[]} skips  Every skip so far.
 * @property {number[]} reads  Text indices compared at least once, ascending.
 * @property {number} comparisons
 * @property {number} alignments
 * @property {number[]} lines
 */

/**
 * The rightmost index of each letter in a pattern.
 * @param {string} pattern
 * @returns {Record<string, number>}
 */
export function lastOccurrence(pattern) {
  /** @type {Record<string, number>} */
  const last = {};
  [...pattern].forEach((c, j) => (last[c] = j));
  return last;
}

/**
 * @param {string} text
 * @param {string} pattern
 * @returns {BoyerMooreFrame[]}
 */
export function boyerMooreTrace(text, pattern) {
  const n = text.length;
  const m = pattern.length;
  /** @type {BoyerMooreFrame[]} */
  const frames = [];
  /** @type {Record<string, number>} */
  const last = {};
  /** @type {number[]} */
  const matches = [];
  /** @type {number[]} */
  const skips = [];
  /** @type {Set<number>} */
  const reads = new Set();
  let shift = 0;
  let comparisons = 0;
  let alignments = 0;

  /**
   * @param {BoyerMooreFrame['kind']} kind
   * @param {number[]} lines
   * @param {Partial<Pick<BoyerMooreFrame, 'j'|'equal'|'badAt'|'badLetter'|'skip'|'afterMatch'>>} [extra]
   */
  const push = (kind, lines, extra = {}) =>
    frames.push({
      kind,
      text,
      pattern,
      last: { ...last },
      shift,
      j: extra.j ?? -1,
      equal: extra.equal ?? false,
      badAt: extra.badAt ?? -1,
      badLetter: extra.badLetter ?? '',
      skip: extra.skip ?? 0,
      afterMatch: extra.afterMatch ?? false,
      matches: matches.slice(),
      skips: skips.slice(),
      reads: [...reads].sort((a, b) => a - b),
      comparisons,
      alignments,
      lines,
    });

  push('start', []);
  for (let j = 0; j < m; j++) {
    last[pattern[j]] = j;
    push('table', [0], { j });
  }

  const lastOf = (/** @type {string} */ c) => last[c] ?? -1;

  while (shift <= n - m) {
    alignments++;
    push('align', [1, 2, 3]);
    let j = m - 1;
    let equal = true;
    while (j >= 0 && equal) {
      comparisons++;
      reads.add(shift + j);
      equal = pattern[j] === text[shift + j];
      push('compare', [4], { j, equal });
      if (equal) j--;
    }
    if (j < 0) {
      matches.push(shift);
      push('match', [5]);
      const badAt = shift + m < n ? shift + m : -1;
      const badLetter = badAt >= 0 ? text[badAt] : '';
      const skip = badAt >= 0 ? m - lastOf(badLetter) : 1;
      skips.push(skip);
      push('shift', [6], { badAt, badLetter, skip, afterMatch: true });
      shift += skip;
    } else {
      const badAt = shift + j;
      const badLetter = text[badAt];
      const skip = Math.max(1, j - lastOf(badLetter));
      skips.push(skip);
      push('shift', [7], { j, badAt, badLetter, skip });
      shift += skip;
    }
  }

  shift = Math.min(shift, Math.max(0, n - m));
  push('done', []);
  return frames;
}

/** @type {Record<'classic'|'absent'|'matches'|'worst', {text: string, pattern: string}>} */
export const BOYER_MOORE_PRESETS = {
  classic: { text: 'hereisasimpleexample', pattern: 'example' },
  absent: { text: 'aaaaaaaaaaaaaaaaaaaa', pattern: 'xyz' },
  matches: { text: 'abracadabracadabra', pattern: 'abra' },
  worst: { text: 'aaaaaaaaaaaaaaaa', pattern: 'baaaa' },
};
