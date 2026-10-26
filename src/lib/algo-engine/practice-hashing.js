/**
 * Two one-pass hash-map problems.
 *
 * - Two-sum: find indices j < i with nums[j] + nums[i] = target. A map from value to index
 *   answers "have I seen target − nums[i]?" in O(1) on average, so one pass covers all
 *   n(n − 1)/2 pairs. The map is checked before nums[i] is stored, so an element is never
 *   paired with itself; a repeated value keeps its latest index.
 * - Group anagrams: words with the same letters share the key "letters sorted", so a map from
 *   key to a list of words groups them in one pass.
 */

/** @typedef {'two-sum'|'anagrams'} HashProblem */

/**
 * @typedef {object} MapEntry
 * @property {string} key
 * @property {string} value
 */

/**
 * @typedef {object} HashPracticeFrame
 * @property {HashProblem} problem
 * @property {'start'|'look'|'found'|'store'|'none'|'key'|'join'|'new'|'done'} kind
 * @property {number} index       Position being processed, -1 when none.
 * @property {MapEntry[]} entries The map, in insertion order (deep-copied per frame).
 * @property {string} hotKey      Map key read or written now, '' when none.
 * @property {number} need        Two-sum: target − nums[index], NaN when none.
 * @property {number[]} pair      Two-sum: the answer [j, i] once found, else empty.
 * @property {string} sortedKey   Anagrams: the key of the current word, '' when none.
 * @property {number} lookups     Map lookups so far.
 * @property {number} covered     Two-sum: pairs (j, i) with j < i ruled in or out so far.
 * @property {number[]} lines
 */

export const MAX_NUMS = 12;
export const MAX_ABS = 99;
export const MAX_WORDS = 12;
export const MAX_WORD_LENGTH = 8;

/** @type {Record<HashProblem, string[]>} */
export const hashPracticePseudocode = {
  'two-sum': [
    'seen = empty map            // value → index',
    'for i = 0, 1, …, n − 1:',
    '  need = target − nums[i]',
    '  if need is in seen:',
    '    return (seen[need], i)',
    '  seen[nums[i]] = i',
    'return "no pair"',
  ],
  anagrams: [
    'groups = empty map          // sorted letters → words',
    'for each word w:',
    '  key = the letters of w, sorted',
    '  if key is in groups: append w to groups[key]',
    '  else: groups[key] = [w]',
    'return the lists in groups',
  ],
};

/**
 * @param {Partial<HashPracticeFrame> & {problem: HashProblem, kind: HashPracticeFrame['kind']}} f
 * @returns {HashPracticeFrame}
 */
const frameOf = (f) => ({
  index: -1,
  entries: [],
  hotKey: '',
  need: NaN,
  pair: [],
  sortedKey: '',
  lookups: 0,
  covered: 0,
  lines: [],
  ...f,
});

/**
 * @param {number[]} nums
 * @param {number} target
 * @returns {HashPracticeFrame[]}
 */
export function twoSumTrace(nums, target) {
  /** @type {Map<number, number>} */
  const seen = new Map();
  let lookups = 0;
  /** @type {HashPracticeFrame[]} */
  const frames = [];
  const problem = /** @type {const} */ ('two-sum');
  const entries = () => [...seen].map(([v, i]) => ({ key: String(v), value: String(i) }));

  frames.push(frameOf({ problem, kind: 'start', lines: [0] }));
  let pair = /** @type {number[]} */ ([]);
  for (let i = 0; i < nums.length && pair.length === 0; i++) {
    const need = target - nums[i];
    lookups++;
    const base = { problem, index: i, need, lookups, covered: (i * (i + 1)) / 2 };
    frames.push(
      frameOf({
        ...base,
        kind: 'look',
        entries: entries(),
        hotKey: String(need),
        lines: [1, 2, 3],
      }),
    );
    const j = seen.get(need);
    if (j !== undefined) {
      pair = [j, i];
      frames.push(
        frameOf({
          ...base,
          kind: 'found',
          entries: entries(),
          hotKey: String(need),
          pair,
          lines: [4],
        }),
      );
    } else {
      seen.set(nums[i], i);
      frames.push(
        frameOf({
          ...base,
          kind: 'store',
          entries: entries(),
          hotKey: String(nums[i]),
          lines: [5],
        }),
      );
    }
  }
  const covered = pair.length
    ? (pair[1] * (pair[1] + 1)) / 2
    : (nums.length * (nums.length - 1)) / 2;
  if (pair.length === 0) {
    frames.push(
      frameOf({ problem, kind: 'none', entries: entries(), lookups, covered, lines: [6] }),
    );
  }
  frames.push(
    frameOf({
      problem,
      kind: 'done',
      entries: entries(),
      lookups,
      covered,
      pair: pair.slice(),
      lines: [],
    }),
  );
  return frames;
}

/** @param {string} word */
export const anagramKey = (word) => [...word].sort().join('');

/**
 * @param {string[]} words
 * @returns {HashPracticeFrame[]}
 */
export function anagramTrace(words) {
  /** @type {Map<string, string[]>} */
  const groups = new Map();
  let lookups = 0;
  /** @type {HashPracticeFrame[]} */
  const frames = [];
  const problem = /** @type {const} */ ('anagrams');
  const entries = () => [...groups].map(([key, ws]) => ({ key, value: ws.join(', ') }));

  frames.push(frameOf({ problem, kind: 'start', lines: [0] }));
  words.forEach((word, i) => {
    const key = anagramKey(word);
    lookups++;
    const base = { problem, index: i, sortedKey: key, hotKey: key, lookups };
    frames.push(frameOf({ ...base, kind: 'key', entries: entries(), lines: [1, 2] }));
    const group = groups.get(key);
    if (group) {
      group.push(word);
      frames.push(frameOf({ ...base, kind: 'join', entries: entries(), lines: [3] }));
    } else {
      groups.set(key, [word]);
      frames.push(frameOf({ ...base, kind: 'new', entries: entries(), lines: [4] }));
    }
  });
  frames.push(frameOf({ problem, kind: 'done', entries: entries(), lookups, lines: [5] }));
  return frames;
}

/**
 * @param {string} text Comma-separated whole numbers.
 * @returns {{nums: number[]} | {error: 'format'|'range'|'count'}}
 */
export function parseNums(text) {
  const tokens = text.split(',').map((s) => s.trim().replace(/^[−–]/, '-'));
  if (!tokens.every((s) => /^-?\d+$/.test(s))) return { error: 'format' };
  const nums = tokens.map(Number);
  if (nums.some((v) => Math.abs(v) > MAX_ABS)) return { error: 'range' };
  if (nums.length > MAX_NUMS) return { error: 'count' };
  return { nums };
}

/**
 * @param {string} text Words separated by spaces or commas.
 * @returns {{words: string[]} | {error: 'empty'|'count'|'length'|'format'}}
 */
export function parseAnagramWords(text) {
  const words = text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (words.length === 0) return { error: 'empty' };
  if (!words.every((w) => /^[a-z]+$/.test(w))) return { error: 'format' };
  if (words.length > MAX_WORDS) return { error: 'count' };
  if (words.some((w) => w.length > MAX_WORD_LENGTH)) return { error: 'length' };
  return { words };
}

export const TWO_SUM_PRESETS = {
  classic: { nums: [2, 7, 11, 15], target: 9 },
  late: { nums: [3, 9, 1, 6, 12, 4], target: 16 },
  repeat: { nums: [5, 3, 5], target: 10 },
  none: { nums: [1, 2, 4, 8], target: 20 },
};

export const ANAGRAM_PRESETS = {
  classic: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'],
  listen: ['listen', 'google', 'silent', 'enlist', 'banana', 'tinsel', 'inlets'],
};
