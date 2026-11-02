/**
 * Suffix array and LCP array, 0-based, with no sentinel: a suffix that is a prefix of another
 * sorts first. Prefix doubling sorts by the first 2k letters using the ranks of the first k, so
 * the rounds at most double the sorted length each time. Kasai then visits the suffixes in text
 * order: the common prefix with the neighbour above can shrink by at most one per step, which
 * bounds the letter comparisons by 2n. LCP[r] is the common prefix of SA[r − 1] and SA[r].
 */

export const MAX_LEN = 16;

export const suffixPseudocode = [
  'rank[i] = letter at i; k = 1',
  'repeat:',
  '  key[i] = (rank[i], rank[i + k]), −1 past the end',
  '  sort the suffixes by key',
  '  rerank: the next number whenever the key changes',
  '  if all ranks differ: stop; else k = 2k',
  'h = 0',
  'for i = 0 to n − 1, in text order:',
  '  if rank[i] == 0: h = 0; continue',
  '  j = SA[rank[i] − 1]   // the neighbour above',
  '  while s[i + h] == s[j + h]: h = h + 1',
  '  LCP[rank[i]] = h',
  '  if h > 0: h = h − 1',
];

/**
 * @typedef {object} SuffixFrame
 * @property {'start'|'pairs'|'sorted'|'rerank'|'double'|'stop'|'kasai'|'skip'|'visit'|'compare'|'store'|'shrink'|'done'} kind
 * @property {string} s
 * @property {number[]} sa  The rows in their current order: start index of each suffix.
 * @property {number[]} rank  Current rank of the suffix starting at each index.
 * @property {[number, number][]} keys  pairs and sorted: the key of the suffix at each index.
 * @property {number} k  Letters each rank already covers.
 * @property {number} rounds  Sorting rounds finished.
 * @property {(number|null)[]} lcp  By row; null until computed, LCP[0] stays null.
 * @property {number} i  Kasai: the suffix being handled, -1 otherwise.
 * @property {number} j  Kasai: its neighbour above, -1 when none.
 * @property {number} h  Kasai: the running common prefix.
 * @property {boolean} equal  compare: the letters are equal.
 * @property {number} keyChecks  Key comparisons made by the sorts.
 * @property {number} comparisons  Letter comparisons made by Kasai.
 * @property {number[]} lines
 */

/**
 * Letter comparisons of sorting the suffixes directly, comparing them from the first letter.
 * @param {string} s
 * @returns {number}
 */
export function directSortComparisons(s) {
  let total = 0;
  Array.from(s, (_, i) => i).sort((a, b) => {
    for (let k = 0; a + k < s.length && b + k < s.length; k++) {
      total++;
      if (s[a + k] !== s[b + k]) return s[a + k] < s[b + k] ? -1 : 1;
    }
    return b - a;
  });
  return total;
}

/**
 * The number of different non-empty substrings, read off the LCP array: each suffix brings its
 * length, less the part it shares with the neighbour above.
 * @param {number} n
 * @param {(number|null)[]} lcp
 */
export function distinctSubstrings(n, lcp) {
  return (n * (n + 1)) / 2 - lcp.reduce((/** @type {number} */ sum, h) => sum + (h ?? 0), 0);
}

/**
 * The longest substring that occurs at least twice, or an empty string.
 * @param {string} s
 * @param {number[]} sa
 * @param {(number|null)[]} lcp
 */
export function longestRepeat(s, sa, lcp) {
  let best = 0;
  let at = 0;
  lcp.forEach((h, r) => {
    if (h !== null && h > best) {
      best = h;
      at = sa[r];
    }
  });
  return s.slice(at, at + best);
}

/**
 * @param {string} s
 * @returns {SuffixFrame[]}
 */
export function suffixTrace(s) {
  const n = s.length;
  let sa = Array.from({ length: n }, (_, i) => i);
  let rank = [...s].map((c) => c.charCodeAt(0) - 97);
  /** @type {[number, number][]} */
  let keys = [];
  /** @type {(number|null)[]} */
  const lcp = Array.from({ length: n }, () => null);
  /** @type {SuffixFrame[]} */
  const frames = [];
  let k = 1;
  let rounds = 0;
  let keyChecks = 0;
  let comparisons = 0;

  /**
   * @param {SuffixFrame['kind']} kind
   * @param {number[]} lines
   * @param {{i?: number, j?: number, h?: number, equal?: boolean}} [extra]
   */
  const push = (kind, lines, extra = {}) =>
    frames.push({
      kind,
      s,
      sa: sa.slice(),
      rank: rank.slice(),
      keys: keys.map(([a, b]) => [a, b]),
      k,
      rounds,
      lcp: lcp.slice(),
      i: extra.i ?? -1,
      j: extra.j ?? -1,
      h: extra.h ?? 0,
      equal: extra.equal ?? false,
      keyChecks,
      comparisons,
      lines,
    });

  push('start', [0]);

  for (;;) {
    keys = rank.map((r, i) => [r, i + k < n ? rank[i + k] : -1]);
    push('pairs', [1, 2]);
    const key = keys;
    /** @param {number} a @param {number} b */
    const byKey = (a, b) => {
      keyChecks++;
      return key[a][0] - key[b][0] || key[a][1] - key[b][1];
    };
    sa = sa.slice().sort(byKey);
    push('sorted', [3]);
    const next = rank.slice();
    next[sa[0]] = 0;
    for (let r = 1; r < n; r++) {
      const [a, b] = [sa[r - 1], sa[r]];
      const same = key[a][0] === key[b][0] && key[a][1] === key[b][1];
      next[b] = next[a] + (same ? 0 : 1);
    }
    rank = next;
    rounds++;
    push('rerank', [4]);
    if (rank[sa[n - 1]] === n - 1) break;
    k *= 2;
    push('double', [5]);
  }
  keys = [];
  push('stop', [5]);

  let h = 0;
  push('kasai', [6], { h });
  for (let i = 0; i < n; i++) {
    if (rank[i] === 0) {
      h = 0;
      push('skip', [7, 8], { i, h });
      continue;
    }
    const j = sa[rank[i] - 1];
    push('visit', [7, 9], { i, j, h });
    while (i + h < n && j + h < n) {
      comparisons++;
      const equal = s[i + h] === s[j + h];
      push('compare', [10], { i, j, h, equal });
      if (!equal) break;
      h++;
    }
    lcp[rank[i]] = h;
    push('store', [11], { i, j, h });
    if (h > 0) {
      h--;
      push('shrink', [12], { i, j, h });
    }
  }

  push('done', [], { h: 0 });
  return frames;
}

/** @type {Record<'banana'|'mississippi'|'repeats'|'blocks', string>} */
export const SUFFIX_PRESETS = {
  banana: 'banana',
  mississippi: 'mississippi',
  repeats: 'aaaaaaaa',
  blocks: 'abcabcabc',
};
