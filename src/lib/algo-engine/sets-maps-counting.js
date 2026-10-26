/**
 * Frequency counting with a hash map, which is also a set of the distinct words: each word
 * costs one membership lookup and one write. Beside the hash cost, the trace keeps the
 * comparisons a plain list of distinct words would need, scanned from the front, to show why
 * a hash table turns counting from O(n · d) into O(n) on average.
 */

/** @typedef {'map'|'set'} CountMode */
/** @typedef {'hat'|'woodchuck'|'hamlet'} WordPreset */

/**
 * @typedef {object} CountEntry
 * @property {string} word
 * @property {number} count
 * @property {number} first  Index of the word's first appearance in the stream.
 */

/**
 * @typedef {object} CountFrame
 * @property {'start'|'read'|'hit'|'miss'|'done'} kind
 * @property {number} index         Position of the word being read, -1 when none.
 * @property {string} word          The word being read, '' when none.
 * @property {CountEntry[]} entries Map entries sorted by count, largest first, ties by first appearance.
 * @property {number} lookups       Hash lookups so far: one per word read.
 * @property {number} listCompares  Comparisons a front-to-back list scan would have made.
 * @property {number} repeats       Words that were already present when read.
 * @property {string} firstRepeat   The first word read a second time, '' until there is one.
 * @property {number[]} lines
 */

export const MAX_WORDS = 40;
export const MAX_WORD_LENGTH = 12;

/** @type {Record<CountMode, string[]>} */
export const countPseudocode = {
  map: [
    'count = empty hash map',
    'for each word w in the stream:',
    '  if w is in count:          // one hash lookup',
    '    count[w] = count[w] + 1',
    '  else:',
    '    count[w] = 1',
    'list the entries by count, largest first',
  ],
  set: [
    'seen = empty hash set',
    'for each word w in the stream:',
    '  if w is in seen:           // one hash lookup',
    '    w is a repeat',
    '  else:',
    '    add w to seen',
    'seen holds every distinct word once',
  ],
};

/** @param {CountEntry} a @param {CountEntry} b */
const byCount = (a, b) => b.count - a.count || a.first - b.first;

/**
 * @param {string[]} words
 * @returns {CountFrame[]}
 */
export function countTrace(words) {
  /** @type {Map<string, CountEntry>} */
  const map = new Map();
  /** The distinct words in first-appearance order, as a plain list would store them. */
  /** @type {string[]} */
  const list = [];
  let lookups = 0;
  let listCompares = 0;
  let repeats = 0;
  let firstRepeat = '';
  /** @type {CountFrame[]} */
  const frames = [];

  /**
   * @param {CountFrame['kind']} kind
   * @param {number[]} lines
   * @param {number} index
   */
  function push(kind, lines, index) {
    frames.push({
      kind,
      index,
      word: index >= 0 ? words[index] : '',
      entries: [...map.values()].map((e) => ({ ...e })).sort(byCount),
      lookups,
      listCompares,
      repeats,
      firstRepeat,
      lines,
    });
  }

  push('start', [0], -1);
  words.forEach((word, i) => {
    lookups++;
    const at = list.indexOf(word);
    listCompares += at >= 0 ? at + 1 : list.length;
    push('read', [1, 2], i);
    const entry = map.get(word);
    if (entry) {
      entry.count++;
      repeats++;
      if (!firstRepeat) firstRepeat = word;
      push('hit', [3], i);
    } else {
      map.set(word, { word, count: 1, first: i });
      list.push(word);
      push('miss', [4, 5], i);
    }
  });
  push('done', [6], -1);
  return frames;
}

/** @type {Record<WordPreset, string>} */
export const PRESET_TEXT = {
  hat: 'the cat and the hat and the bat sat on the mat',
  woodchuck: 'how much wood would a woodchuck chuck if a woodchuck could chuck wood',
  hamlet: 'to be or not to be that is the question',
};

/**
 * Splits text into lower-case words of letters and inner apostrophes.
 * @param {string} text
 * @returns {{words: string[]} | {error: 'empty'|'count'|'length'}}
 */
export function parseWords(text) {
  const words = (text.toLowerCase().match(/[a-z]+(?:['’][a-z]+)*/g) ?? []).map((w) =>
    w.replace(/’/g, "'"),
  );
  if (words.length === 0) return { error: 'empty' };
  if (words.length > MAX_WORDS) return { error: 'count' };
  if (words.some((w) => w.length > MAX_WORD_LENGTH)) return { error: 'length' };
  return { words };
}
