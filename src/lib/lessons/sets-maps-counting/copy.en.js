/** @typedef {import('$lib/algo-engine/sets-maps-counting.js').CountFrame} CountFrame */
/** @typedef {import('$lib/algo-engine/sets-maps-counting.js').CountMode} CountMode */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {string} w */
const q = (w) => `“${w}”`;

/** @param {string[]} words */
const listWords = (words) =>
  words.length <= 1
    ? words.map(q).join('')
    : `${words.slice(0, -1).map(q).join(', ')} and ${q(words[words.length - 1])}`;

export const en = {
  slug: 'sets-maps-counting',
  topic: 'structures',
  level: 'Beginner',
  title: 'Sets, maps and frequency counting',
  intro:
    'Most programs use hash tables through two interfaces. A set answers “is x in here?”; a map stores a value for each key, such as how many times a word has appeared. Both cost O(1) per operation on average, so one pass over a stream of n words counts them all in O(n).',
  summary:
    'Feed a stream of words into a hash map that counts them and a hash set that spots repeats, and compare one hash lookup per word with scanning a list.',
  instruction:
    'Type some words or pick a preset, choose Map or Set, then step through the stream. Each word is looked up once: the map bumps its count, the set reports it as a repeat. Watch the frequency list re-sort as counts change, and compare the hash lookups with the comparisons a plain list would need.',
  takeaways: [
    'A set stores each key once and answers membership: add, remove and contains are O(1) on average.',
    'A map stores a value per key. Counting is the classic use: count[w] = count[w] + 1 if w is a key, else count[w] = 1.',
    'One pass with a hash map counts n words in O(n) on average. A list of distinct words scanned from the front costs up to d comparisons per word, O(n · d) in total.',
    'A hash table keeps no order: to list words by frequency, sort the d entries afterwards in O(d log d).',
    'Load “Woodchuck” in Set mode and find the first repeated word, then switch to Map and see which words tie for the top count.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['contains, add (set)', 'O(1)', 'On average: one hash and a short chain or probe run.'],
    ['get, put (map)', 'O(1)', 'On average: the same lookup, with a value stored beside the key.'],
    ['Count n words', 'O(n)', 'On average: one lookup and one write per word.'],
    ['Same with a list', 'O(n · d)', 'Each word may be compared with all d distinct words.'],
    ['Memory', 'O(d)', 'One entry per distinct word.'],
  ],
  nextTeaser:
    'Next up: practice hashing problems, where a map finds two numbers that add up to a target and groups anagrams in one pass.',

  modeLabel: 'Structure',
  modes: { map: 'Map (count)', set: 'Set (seen)' },
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: { hat: 'The hat', woodchuck: 'Woodchuck', hamlet: 'Hamlet' },
  wordsLabel: 'Words',
  wordErrors: {
    empty: 'Type at least one word made of letters.',
    count: 'Use at most 40 words.',
    length: 'Each word may have at most 12 letters.',
  },
  streamTitle: 'Word stream',
  streamStates: { active: 'being read, new', sorted: 'being read, seen before', done: 'read' },
  mapTitle: 'count, sorted by frequency',
  setTitle: 'seen, in the order added',
  emptyMap: 'empty',
  /** @param {string} word @param {number} c */
  entryLabel: (word, c) => `${word}: ${c}`,
  stats: {
    distinct: 'Distinct words',
    lookups: 'Hash lookups',
    listCompares: 'List-scan comparisons',
    repeats: 'Repeats',
    firstRepeat: 'First repeat',
  },
  none: '–',
  legend: {
    active: 'New key, just added',
    sorted: 'Key already present, found',
    visited: 'Word already read',
  },
  marks: { active: '+', sorted: '✓' },

  /** @param {CountFrame} f @param {CountMode} mode */
  describe(f, mode) {
    const w = q(f.word);
    const d = f.entries.length;
    switch (f.kind) {
      case 'start':
        return mode === 'map'
          ? 'The map count is empty. Each word will cost one hash lookup.'
          : 'The set seen is empty. Each word will cost one hash lookup.';
      case 'read':
        return `Read ${w}, word ${f.index + 1}. Is it ${mode === 'map' ? 'a key of count' : 'in seen'}?`;
      case 'hit': {
        const c = f.entries.find((e) => e.word === f.word)?.count ?? 0;
        if (mode === 'map') return `Yes: count[${w}] goes from ${c - 1} to ${c}.`;
        return f.firstRepeat === f.word && f.repeats === 1
          ? `Yes: ${w} is already in seen. It is the first repeated word.`
          : `Yes: ${w} is already in seen, so it is a repeat.`;
      }
      case 'miss':
        return mode === 'map'
          ? `No: add ${w} with count 1. The map now has ${count(d, 'key', 'keys')}.`
          : `No: add ${w} to seen. It now holds ${count(d, 'word', 'words')}.`;
      case 'done': {
        if (d === 0) return 'The stream is empty.';
        if (mode === 'set')
          return `Done. ${count(d, 'distinct word', 'distinct words')} out of ${f.lookups}; ${count(f.repeats, 'word was a repeat', 'words were repeats')}.`;
        const top = f.entries[0].count;
        const best = f.entries.filter((e) => e.count === top).map((e) => e.word);
        const each = best.length > 1 ? ' each' : '';
        return `Done. ${count(f.lookups, 'word', 'words')}, ${d} distinct. Most frequent: ${listWords(best)}, ${count(top, 'time', 'times')}${each}.`;
      }
    }
  },

  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many distinct words are in “the cat and the hat and the bat sat on the mat”?',
      answer: 8,
      unit: 'words',
      hints: ['“the” appears 4 times and “and” twice.'],
      solution:
        'The 12 words hold the, cat, and, hat, bat, sat, on and mat: 8 distinct words, so 4 of the 12 are repeats. Load “The hat” to check.',
    },
    {
      type: 'text',
      prompt:
        'Reading “how much wood would a woodchuck chuck if a woodchuck could chuck wood” from the left, which word is the first one already in the set when it is read?',
      accept: ['a', '“a”', '"a"'],
      hints: ['The first eight words are all different.'],
      solution:
        'how, much, wood, would, a, woodchuck, chuck and if are all new. The ninth word, “a”, is already in the set: it is the first repeat. Load “Woodchuck” in Set mode to see it.',
    },
    {
      type: 'number',
      prompt:
        'For “to be or not to be that is the question”, how many comparisons would a list of distinct words scanned from the front make in total? (A new word is compared with every word in the list; a known word stops at its position.)',
      answer: 31,
      unit: 'comparisons',
      hints: [
        'The eight new words cost 0, 1, 2, 3, 4, 5, 6 and 7 comparisons.',
        'The second “to” is found at position 1 and the second “be” at position 2.',
      ],
      solution:
        'New words: 0 + 1 + 2 + 3 + 4 + 5 + 6 + 7 = 28. Repeats: 1 for “to” and 2 for “be”. Total 31, against 10 hash lookups. Load “Hamlet” to check.',
    },
    {
      type: 'number',
      prompt: 'In the woodchuck sentence, how many different words share the highest count?',
      answer: 4,
      unit: 'words',
      hints: ['No word appears three times.'],
      solution:
        'wood, a, woodchuck and chuck each appear twice; every other word once. So 4 words tie for the top count of 2.',
    },
    {
      type: 'choice',
      prompt:
        'A server must reject a request whose ID it has already handled, and nothing else. Which structure fits best?',
      options: [
        'A hash set of handled IDs',
        'A hash map from ID to a count',
        'A sorted list of IDs',
      ],
      answer: 0,
      hints: ['The only question asked is “have I seen this ID?”'],
      solution:
        'Membership is all that is needed, so a set is enough: contains and add are O(1) on average. A map would store a value nobody reads, and a sorted list needs O(log n) searches and O(n) inserts.',
    },
  ],
};
