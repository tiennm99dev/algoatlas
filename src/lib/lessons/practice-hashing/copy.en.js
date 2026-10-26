/** @typedef {import('$lib/algo-engine/practice-hashing.js').HashPracticeFrame} HashPracticeFrame */

/** A count with its noun, singular for 1. */
/** @param {number} n @param {string} one @param {string} many */
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {string} w */
const q = (w) => `“${w}”`;

/** @param {number} v Signed numbers use a true minus sign. */
const num = (v) => (v < 0 ? `−${-v}` : String(v));

export const en = {
  slug: 'practice-hashing',
  topic: 'structures',
  level: 'Intermediate',
  title: 'Practice: hashing problems',
  intro:
    'Two classic problems that a hash map solves in one pass. Two-sum asks for two numbers that add up to a target: instead of trying every pair, remember each number you pass and ask whether its partner is already there. Grouping anagrams gives every word the key “its letters, sorted”, so words with the same letters fall into the same list.',
  summary:
    'Run two-sum and group-anagrams on your own input and watch the hash map after every step, then answer questions with the runner.',
  instruction:
    'Pick a problem, type the input or load a preset, then step through. The map panel shows every entry after each step, with the entry being read or written highlighted. Use the runner to answer the questions below.',
  takeaways: [
    'Two-sum in one pass: for each nums[i], look up need = target − nums[i] in a map from value to index. A hit gives the pair; a miss stores nums[i]. O(n) time and memory on average, against O(n²) for the double loop.',
    'Look up before you store: otherwise an element can pair with itself, as 5 + 5 = 10 would with a single 5.',
    'The lookup at index i settles i pairs at once: all (j, i) with j < i. So n lookups cover all n(n − 1)/2 pairs.',
    'Grouping by key: map each item to a key that equal items share (sorted letters for anagrams), then append the item to that key’s list. Sorting a word of k letters costs O(k log k), so n words cost O(n · k log k).',
    'Load “Repeated value” and step through it, then type nums 5 and target 10 and check that 5 is not paired with itself.',
  ],
  complexityHead: ['Problem', 'Cost', 'Why'],
  complexity: [
    [
      'Two-sum, hash map',
      'O(n)',
      'Average time: one lookup and at most one store per number. The map uses O(n) memory.',
    ],
    [
      'Two-sum, double loop',
      'O(n²)',
      'Up to n(n − 1)/2 pairs are checked one by one, with O(1) extra memory.',
    ],
    [
      'Group anagrams',
      'O(n·k log k)',
      'On average: sort each word of at most k letters, then one map lookup.',
    ],
    ['Memory, anagrams', 'O(n·k)', 'Every word is stored once, in its group.'],
  ],
  nextTeaser:
    'Next up: recursion basics, where a function solves a problem by calling itself on a smaller copy and the call stack keeps track.',

  problemLabel: 'Problem',
  problems: { 'two-sum': 'Two-sum', anagrams: 'Group anagrams' },
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    'two-sum': {
      classic: 'Classic',
      late: 'Late pair',
      repeat: 'Repeated value',
      none: 'No pair',
    },
    anagrams: { classic: 'eat, tea, tan…', listen: 'listen, silent…' },
  },
  numsLabel: 'nums (comma-separated)',
  targetLabel: 'target',
  wordsLabel: 'Words',
  numsErrors: {
    format: 'nums must be whole numbers separated by commas.',
    range: 'Each number must be between −99 and 99.',
    count: 'Use at most 12 numbers.',
  },
  targetError: 'target must be a whole number between −198 and 198.',
  wordErrors: {
    empty: 'Type at least one word.',
    format: 'Words may contain only the letters a to z.',
    count: 'Use at most 12 words.',
    length: 'Each word may have at most 8 letters.',
  },
  arrayLabel: 'nums',
  /** @param {number[]} nums */
  arrayAria: (nums) => `nums: ${nums.map(num).join(', ')}.`,
  wordsTitle: 'Words',
  wordsHot: 'current word',
  mapTitles: { 'two-sum': 'seen: value → index', anagrams: 'groups: sorted letters → words' },
  mapHead: { 'two-sum': ['value', 'index'], anagrams: ['key', 'words'] },
  mapEmpty: 'empty',
  mapStates: { compare: 'being looked up', active: 'just written', sorted: 'the partner found' },
  stats: {
    lookups: 'Map lookups',
    covered: 'Pairs settled',
    entries: 'Map entries',
    result: 'Answer',
    groups: 'Groups',
  },
  none: '–',
  noPair: 'no pair',
  /** @param {number[]} pair */
  pairText: (pair) => `(${pair[0]}, ${pair[1]})`,
  pointerI: 'i',
  legend: {
    compare: 'Key being looked up',
    active: 'Entry just written',
    sorted: 'Pair found',
  },
  marks: { compare: '?', active: '+', sorted: '✓' },

  /**
   * @param {HashPracticeFrame} f
   * @param {{nums: number[], target: number, words: string[]}} input
   */
  describe(f, input) {
    const i = f.index;
    if (f.problem === 'two-sum') {
      const x = input.nums[i];
      const t = num(input.target);
      switch (f.kind) {
        case 'start':
          return `The map seen is empty. Find two numbers in nums that add up to ${t}.`;
        case 'look':
          return `i = ${i}: nums[${i}] = ${num(x)}, so need = ${t} − ${x < 0 ? `(${num(x)})` : x} = ${num(f.need)}. Is ${num(f.need)} in seen?`;
        case 'found': {
          const [j] = f.pair;
          return `Yes: seen[${num(f.need)}] = ${j}. nums[${j}] + nums[${i}] = ${num(input.nums[j])} + ${x < 0 ? `(${num(x)})` : x} = ${t}. Return (${j}, ${i}).`;
        }
        case 'store':
          return `No. Store seen[${num(x)}] = ${i} and move on.`;
        case 'none':
          return `No two numbers add up to ${t}: ${count(f.lookups, 'lookup', 'lookups')} settled all ${count(f.covered, 'pair', 'pairs')}.`;
        case 'done':
          return f.pair.length
            ? `Done: (${f.pair[0]}, ${f.pair[1]}) after ${count(f.lookups, 'lookup', 'lookups')}, which settled ${count(f.covered, 'pair', 'pairs')}.`
            : 'Done: there is no pair.';
      }
    }
    const w = input.words[i];
    switch (f.kind) {
      case 'start':
        return 'The map groups is empty. Words with the same sorted letters will share a key.';
      case 'key':
        return `${q(w)} sorted is ${q(f.sortedKey)}. Is ${q(f.sortedKey)} in groups?`;
      case 'join': {
        const size = f.entries.find((e) => e.key === f.sortedKey)?.value.split(', ').length ?? 0;
        return `Yes: append ${q(w)} to groups[${q(f.sortedKey)}], which now holds ${count(size, 'word', 'words')}.`;
      }
      case 'new':
        return `No: start groups[${q(f.sortedKey)}] = [${q(w)}].`;
      case 'done':
        return `Done: ${count(input.words.length, 'word', 'words')} in ${count(f.entries.length, 'group', 'groups')}.`;
      default:
        return '';
    }
  },

  practiceTitle: 'Practice with the runner',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Two-sum on nums = 2, 7, 11, 15 with target 9. At which index i is the pair found?',
      answer: 1,
      hints: ['At i = 0, need = 7, and seen is still empty.'],
      solution:
        'At i = 0 the map is empty, so 2 is stored. At i = 1, need = 9 − 7 = 2, which is in seen with index 0: the answer is (0, 1), found at i = 1. Load “Classic” to check.',
    },
    {
      type: 'number',
      prompt:
        'Load “Late pair” (nums = 3, 9, 1, 6, 12, 4, target 16). How many map lookups happen before the answer is returned?',
      answer: 6,
      unit: 'lookups',
      hints: ['The partner of 4 is 12, which is stored at index 4.'],
      solution:
        'Every number up to 12 misses (needs 13, 7, 15, 10 and 4 are not yet stored), and the sixth lookup, need = 16 − 4 = 12, hits. Six lookups settle all 15 pairs among six numbers.',
    },
    {
      type: 'text',
      prompt:
        'Load “Repeated value” (nums = 5, 3, 5, target 10). Which pair of indices is returned? Write it as j, i.',
      accept: ['0, 2', '(0, 2)', '0 2', '[0, 2]', '0,2'],
      hints: ['At i = 0 the map is empty, so the first 5 cannot pair with itself.'],
      solution:
        'At i = 0, need = 5 but seen is empty, so seen[5] = 0. At i = 1, need = 7 misses. At i = 2, need = 5 is in seen with index 0: the answer is (0, 2).',
    },
    {
      type: 'number',
      prompt:
        'Load “No pair” (nums = 1, 2, 4, 8, target 20). How many entries does seen hold at the end?',
      answer: 4,
      unit: 'entries',
      hints: ['Every lookup misses, so every number is stored.'],
      solution:
        'No two of 1, 2, 4 and 8 add up to 20, so all four lookups miss and all four numbers are stored. Those 4 lookups settled all 6 pairs.',
    },
    {
      type: 'number',
      prompt: 'Group the anagrams in eat, tea, tan, ate, nat, bat. How many groups are there?',
      answer: 3,
      unit: 'groups',
      hints: ['Sort the letters of each word: eat → aet, tan → ant, bat → abt.'],
      solution:
        'eat, tea and ate share aet; tan and nat share ant; bat has abt alone. That is 3 groups. Load “eat, tea, tan…” to check.',
    },
    {
      type: 'text',
      prompt: 'What key does the anagram grouping use for the word “listen”?',
      accept: ['eilnst', '“eilnst”', '"eilnst"'],
      hints: ['Write its letters in alphabetical order.'],
      solution:
        'The letters l, i, s, t, e, n sorted are e, i, l, n, s, t: the key is eilnst, shared with silent, enlist, tinsel and inlets.',
    },
    {
      type: 'choice',
      prompt:
        'A variant stores seen[nums[i]] = i before looking up need. What goes wrong on nums = 5, 1 with target 10?',
      options: [
        'Nothing: the answer is still “no pair”',
        'It returns (0, 0): the 5 is paired with itself',
        'It misses a real pair',
      ],
      answer: 1,
      hints: ['At i = 0, what is in seen when need = 5 is looked up?'],
      solution:
        'Storing first puts 5 → 0 into seen, and the lookup of need = 10 − 5 = 5 then finds index 0 itself, returning (0, 0). Looking up before storing only ever pairs i with an earlier j.',
    },
  ],
};
