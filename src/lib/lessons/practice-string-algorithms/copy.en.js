/** @typedef {import('$lib/algo-engine/practice-string-algorithms.js').MatcherId} MatcherId */
/** @typedef {import('$lib/algo-engine/practice-string-algorithms.js').SearchFrame} SearchFrame */
/** @typedef {import('$lib/algo-engine/practice-string-algorithms.js').StructureFrame} StructureFrame */

/** @type {Record<MatcherId, string>} */
const NAMES = {
  naive: 'Plain scan',
  rabin: 'Rabin-Karp',
  kmp: 'KMP',
  boyer: 'Boyer-Moore',
  z: 'Z-function',
};

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {string[]} parts */
const list = (parts) =>
  parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;

/**
 * What the current step of one matcher did.
 * @param {SearchFrame} f
 * @param {MatcherId} id
 */
function stepText(f, id) {
  const r = f.runs[id];
  const { text: T, pattern: P } = f;
  const j = r.patternAt;
  const i = r.textAt;
  const verdict = r.equal ? 'equal' : 'different';
  /** @param {number} at */
  const inP = (at) => P[at] ?? '$';
  switch (r.kind) {
    case 'table':
      return `Skip table: the rightmost ${P[j]} seen so far is at ${j}.`;
    case 'build':
      return `Preparing: P[${j}] = ${inP(j)} against position ${r.selfAt}, ${inP(r.selfAt)}: ${verdict}.`;
    case 'hash-letter':
      return j >= 0
        ? `P[${j}] = ${P[j]} goes into the pattern’s hash, now ${r.hash}.`
        : `T[${i}] = ${T[i]} goes into the first window’s hash, now ${r.hash}.`;
    case 'hash-check':
      return r.equal
        ? `The window at ${r.shift} hashes to ${r.hash}, the same as P. Check its letters.`
        : `The window at ${r.shift} hashes to ${r.hash}, P to ${r.target}. No letter needs reading.`;
    case 'verify':
      if (r.found >= 0) return `P[${j}] = ${P[j]} equals T[${i}]: a true match at ${r.found}.`;
      return r.spurious
        ? `P[${j}] = ${P[j]} differs from T[${i}] = ${T[i]}: a spurious hit, the hashes collided.`
        : `P[${j}] = ${P[j]} equals T[${i}]. Keep checking.`;
    case 'roll-out':
      return `T[${i}] = ${T[i]} leaves the window.`;
    case 'roll-in':
      return `T[${i}] = ${T[i]} enters: the window at ${r.shift} now hashes to ${r.hash}.`;
    case 'compare':
      if (j === P.length) return `The $ after P stops the run against T[${i}].`;
      return r.found >= 0
        ? `P[${j}] = ${P[j]} against T[${i}] = ${T[i]}: equal, and P occurs at ${r.found}.`
        : `P[${j}] = ${P[j]} against T[${i}] = ${T[i]}: ${verdict}.`;
    default:
      return '';
  }
}

/** Where a centre of T sits in the text. @param {number} i */
const spot = (i) =>
  i % 2 === 1 ? `letter ${(i - 1) / 2}` : i === 0 ? 'the start' : `the gap before letter ${i / 2}`;

/** The palindrome of the text a centre stands for. @param {string} s @param {number} c @param {number} r */
const palindrome = (s, c, r) => s.slice((c - r) / 2, (c - r) / 2 + r);

export const en = {
  slug: 'practice-string-algorithms',
  topic: 'string-algorithms',
  level: 'Advanced',
  title: 'Practice: string problems',
  intro:
    'String problems reward picking the right tool. Which matcher wins depends on the text and the pattern, and questions about repeats and mirror images have their own linear-time answers. Race five matchers on your own text here, then read the same text for its periods and palindromes.',
  summary:
    'Race five string matchers on your own text and count their steps, then read the same text for its periods and palindromes.',
  instruction:
    'Pick a preset or type a text and a pattern, and the final counts appear at once. Rewind and step to see one tick of every matcher at a time, and press a row to watch that matcher. Switch to Periods and palindromes to read the same text another way. Use the widget to answer the questions below.',
  modeLabel: 'Mode',
  modes: { search: 'Race the matchers', structure: 'Periods and palindromes' },
  textLabel: 'Text',
  patternLabel: 'Pattern',
  presetLabel: 'Preset',
  presets: {
    english: 'Everyday text',
    repeats: 'All one letter',
    tail: 'Only the last letter differs',
    head: 'Only the first letter differs',
    periodic: 'A repeating block',
    dna: 'Four-letter alphabet',
    palindrome: 'A long palindrome',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    textLength: `The text may have at most ${maxText} letters.`,
    patternLength: `The pattern may have at most ${maxPattern} letters.`,
    patternTooLong: 'The pattern must not be longer than the text.',
  }),
  matchers: NAMES,
  raceTitle: 'Steps so far',
  raceHelp:
    'A step is one letter compared, one letter fed into a hash, one hash compared or one letter entered into the skip table. Every tick spends one step of each unfinished matcher.',
  /** @param {string} name */
  watchLabel: (name) => `Watch ${name}`,
  barPrep: 'preparing',
  barSearch: 'searching',
  stats: {
    prep: 'preparing',
    search: 'searching',
    matches: 'matches',
    steps: 'Steps',
    prepTotal: 'Preparing',
    found: 'Matches found',
    spurious: 'Spurious hits, Rabin-Karp',
    period: 'Smallest period',
    repeats: 'Whole blocks',
    longest: 'Longest palindrome',
    palindromes: 'Palindromic substrings',
    piComparisons: 'Prefix function',
    tryPeriods: 'Testing each period',
    palComparisons: 'Manacher',
    tryCentres: 'Expanding each centre',
  },
  noValue: '—',
  finishedMark: '✓',
  finishedWord: 'finished',
  cheapestMark: '★',
  cheapestWord: 'cheapest',
  /** @param {string} name */
  boardTitle: (name) => `What ${name} reads`,
  boardRows: { text: 'T', pattern: 'P' },
  /** @param {string} name @param {string} text @param {string} pattern @param {number} shift */
  boardAria: (name, text, pattern, shift) =>
    shift < 0
      ? `${name} is preparing pattern ${pattern} over text ${text}.`
      : `${name} has pattern ${pattern} at position ${shift} of text ${text}.`,
  searchRoles: {
    equal: 'Equal',
    miss: 'Different',
    read: 'Hashed',
    found: 'In a match',
  },
  searchMarkers: { equal: '✓', miss: '✗', read: '#', found: '★' },
  matchesTitle: 'Matches at',
  matchesEmpty: 'none yet',
  /** @param {string} row @param {number} c @param {string} value @param {string} state */
  cellLabel: (row, c, value, state) =>
    `${row} ${c}: ${value === '' ? 'empty' : value}${state ? `, ${state}` : ''}`,
  /**
   * @param {SearchFrame} f
   * @param {MatcherId} id  The matcher being watched.
   */
  describeSearch(f, id) {
    const r = f.runs[id];
    if (f.kind === 'start') {
      return `All five matchers start on ${f.text.length} letters and a pattern of ${f.pattern.length}. Watching ${NAMES[id]}.`;
    }
    if (f.kind === 'done') {
      const best = f.runs[f.cheapest[0]].steps;
      return `Cheapest: ${list(f.cheapest.map((x) => NAMES[x]))} with ${plural(best, 'step', 'steps')}. Every matcher found ${plural(r.matches.length, 'match', 'matches')}.`;
    }
    if (r.finished) {
      return `${NAMES[id]} finished after ${plural(r.steps, 'step', 'steps')}. The others that are left keep running.`;
    }
    return stepText(f, id);
  },
  structureRows: { text: 'S', pi: 'π', odd: 'odd', even: 'even' },
  /** @param {string} text */
  structureAria: (text) => `Prefix function and palindrome lengths of ${text}.`,
  structureTitle: 'The text, its borders and its palindromes',
  structureHelp:
    'π[i] is the longest border of S[0..i]. “odd” is the longest palindrome centred on that letter, “even” the longest centred on the gap before it.',
  structureRowNames: {
    text: 'Letter',
    pi: 'Border length at',
    odd: 'Palindrome on letter',
    even: 'Palindrome on the gap before',
  },
  structureRoles: {
    now: 'Computed now',
    border: 'A border',
    period: 'One period',
    palindrome: 'This palindrome',
    best: 'Longest so far',
  },
  structureMarkers: { now: '•', border: '=', period: '|', palindrome: '↔', best: '★' },
  costsTitle: 'Comparisons, and what a brute force spends',
  periodsTitle: 'All periods',
  periodsEmpty: 'not known yet',
  longestTitle: 'Longest palindrome so far',
  /** @param {StructureFrame} f */
  describeStructure(f) {
    const S = f.text;
    const n = S.length;
    switch (f.kind) {
      case 'start':
        return `Read ${S} twice: first for its borders and periods, then for its palindromes.`;
      case 'pi': {
        const border = f.value > 0 ? `“${S.slice(0, f.value)}”` : 'empty';
        const falls = f.falls > 0 ? ` after ${plural(f.falls, 'fallback', 'fallbacks')}` : '';
        return `π[${f.i}] = ${f.value}${falls}: the longest border of S[0..${f.i}] is ${border}.`;
      }
      case 'period': {
        const head = `π[${n - 1}] = ${n - f.period}, so the smallest period is ${n} − ${n - f.period} = ${f.period}.`;
        if (f.repeats > 1) {
          return `${head} It divides ${n}, so S is “${S.slice(0, f.period)}” repeated ${f.repeats} times.`;
        }
        return f.period === n
          ? `${head} S has no border, so it repeats nothing.`
          : `${head} It does not divide ${n}, so the last block is cut short.`;
      }
      case 'centre': {
        const known = f.reused > 0 ? `${f.reused} known from the mirror, ` : '';
        const spent = `${known}${plural(f.read, 'comparison', 'comparisons')}`;
        return f.value > 0
          ? `Centre on ${spot(f.i)}: ${spent}, and the palindrome is “${palindrome(S, f.i, f.value)}”, length ${f.value}.`
          : `Centre on ${spot(f.i)}: ${spent}, and no palindrome.`;
      }
      case 'done':
        return `Longest palindrome: “${palindrome(S, f.bestCentre, f.best)}”, length ${f.best}, out of ${plural(f.palindromes, 'palindromic substring', 'palindromic substrings')}. Smallest period: ${f.period}.`;
    }
  },
  /** @param {StructureFrame} f */
  bestText: (f) => (f.best > 0 ? palindrome(f.text, f.bestCentre, f.best) : ''),
  takeaways: [
    'On everyday text with many different letters, Boyer-Moore’s skips win: it can read fewer letters than the text has, and a longer pattern skips further.',
    'On repetitive text, KMP and the Z-function are the safe choices. Neither ever moves backwards through the text, so they stay near 2n steps where a plain scan or bad-character Boyer-Moore can reach n · m.',
    'Rabin-Karp loses a single-pattern race, because it pays for every window’s hash. It earns its place when hashes do something else: many patterns of one length, or comparing substrings in O(1).',
    'The prefix function answers period questions: the smallest period is n − π[n − 1], and the text is a repeated block exactly when that period divides n and is smaller than n. Manacher’s algorithm gives every palindrome’s centre in O(n).',
    'Load “Only the last letter differs”, then “Only the first letter differs”. The same letters reverse Boyer-Moore’s and the plain scan’s places. Then type your own pair and predict the winner before you read the counts.',
  ],
  complexityHead: ['Tool', 'Cost', 'When to reach for it'],
  complexity: [
    [
      'Plain scan',
      'O(n · m) worst, about O(n) on random text',
      'Short texts and one-off searches. It needs no preparation and no extra memory.',
    ],
    [
      'Rabin-Karp',
      'O(n + m) expected, O(n · m) worst',
      'Many patterns of one length, or substring equality, through hashes kept in a set or table.',
    ],
    [
      'KMP',
      'O(n + m), with O(m) memory',
      'One pattern with a guarantee, or a text arriving as a stream, since it never moves back.',
    ],
    [
      'Boyer-Moore, bad-character rule',
      'About O(n / m) at best, O(n · m) worst',
      'Long patterns over a large alphabet. The good-suffix rule of the full algorithm repairs the worst case.',
    ],
    [
      'Z-function',
      'O(n + m), with O(n + m) memory',
      'Comparing every position with a prefix, which also makes a short search.',
    ],
    [
      'Aho-Corasick',
      'O(total pattern length + n + reports)',
      'Many patterns at once, of any lengths, in one pass over the text.',
    ],
    [
      'Suffix array',
      'Build O(n log n) or better, each query O(m log n)',
      'One fixed text with many queries that arrive later.',
    ],
    [
      'Prefix function, for periods',
      'O(n)',
      'Borders and periods: the smallest period is n − π[n − 1].',
    ],
    ['Manacher', 'O(n)', 'The longest palindrome, or a count of every palindromic substring.'],
  ],
  nextTeaser:
    'Next up: GCD and extended Euclid, an old algorithm that at least halves its numbers every two steps and also solves linear equations in whole numbers.',
  practiceTitle: 'Practice problems',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load “Everyday text”. How many steps does Boyer-Moore spend in total?',
      answer: 15,
      unit: 'steps',
      hints: ['The final counts show on Boyer-Moore’s row when the preset loads.'],
      solution:
        'It spends 4 steps entering the letters of lazy into its skip table and 11 comparing letters: 15 in all. The plain scan spends 35, so Boyer-Moore reads less than a third of the 35-letter text.',
    },
    {
      type: 'number',
      prompt:
        'Still on “Everyday text”, Rabin-Karp is the slowest. How many spurious hits does it suffer? The hash here uses base 31 modulo 101.',
      answer: 1,
      unit: 'hits',
      hints: [
        'Read the “Spurious hits” card, then rewind and watch Rabin-Karp to find the hit.',
        'A spurious hit is a window whose hash equals the pattern’s although its letters differ.',
      ],
      solution:
        'One: the window kbro at position 7 hashes to 27, the same as lazy. Comparing its first letter exposes it. A modulus as small as 101 makes this likely, and a real one is far larger.',
    },
    {
      type: 'choice',
      prompt:
        'Load “Only the last letter differs”, which searches aaaa… for aaab. Who wins, and why?',
      options: [
        'Plain scan, because it needs no preparation',
        'Boyer-Moore, because its first comparison at each position is the letter that differs',
        'KMP, because it never moves back in the text',
        'Rabin-Karp, because the hashes never match',
      ],
      answer: 1,
      hints: ['Compare the rows, then watch Boyer-Moore for a few ticks.'],
      solution:
        'Boyer-Moore spends 41 steps. It starts from the right, so the b fails at once at every position. The plain scan reads three equal letters first each time and spends 148, and KMP spends 82.',
    },
    {
      type: 'choice',
      prompt:
        'Now load “Only the first letter differs”, which searches aaaa… for baaa. Which matcher comes last?',
      options: ['Plain scan', 'Rabin-Karp', 'KMP', 'Boyer-Moore', 'Z-function'],
      answer: 3,
      hints: ['Boyer-Moore compares from the right. Where in baaa does it meet the b?'],
      solution:
        'Boyer-Moore spends 152 steps: it matches three a’s before failing on the b, and it can only skip 1 because a is at the end of baaa. The plain scan fails on the first letter every time and wins with 37. Bad character alone is O(n · m) in the worst case.',
    },
    {
      type: 'multi',
      prompt:
        'Load “All one letter”, where every position matches. Which matchers go over 100 steps?',
      options: ['Plain scan', 'Rabin-Karp', 'KMP', 'Boyer-Moore', 'Z-function'],
      answers: [0, 1, 3],
      hints: ['Read the totals. Which matchers read the same letters again at every position?'],
      solution:
        'The plain scan spends 148 and Boyer-Moore 152, reading all 4 letters at each of 37 positions. Rabin-Karp spends 265, since every window also passes through its hash. KMP (43) and the Z-function (83) reuse what they know, so matches cost them nothing extra.',
    },
    {
      type: 'text',
      prompt:
        'Load “A repeating block”, 36 letters of abc searched for abcabc. Which matcher is cheapest?',
      accept: ['kmp', 'knuth-morris-pratt', 'knuth morris pratt'],
      hints: ['Look for the ★ on the last step.'],
      solution:
        'KMP, with 41 steps: 5 to build π and exactly 36 to read the text once. After each match it falls back to π[5] = 3 instead of starting again. Boyer-Moore spends 72 and the plain scan 86.',
    },
    {
      type: 'number',
      prompt:
        'Switch to Periods and palindromes and type abaabaabaab. What is the smallest period of this text?',
      answer: 3,
      hints: [
        'Jump to the last step and read the “Smallest period” card.',
        'The formula is n − π[n − 1], and here π[10] = 8.',
      ],
      solution:
        'n − π[n − 1] = 11 − 8 = 3: aba repeats. Since 3 does not divide 11, the last block is cut short and the “Whole blocks” card says 1. Add one more a and the text becomes aba repeated four times.',
    },
    {
      type: 'number',
      prompt:
        'Load “A long palindrome” and stay on Periods and palindromes. How long is the longest palindrome?',
      answer: 10,
      unit: 'letters',
      hints: ['Read the “Longest palindrome” card. The answer has an even length.'],
      solution:
        'geeksskeeg has 10 letters. It is centred on the gap between the two s’s, which is why Manacher’s algorithm puts # around every letter: then odd and even palindromes both have a centre.',
    },
    {
      type: 'number',
      prompt:
        'Load “All one letter” in Periods and palindromes. How many comparisons does expanding each centre from zero spend, where Manacher’s algorithm spends 79?',
      answer: 1600,
      unit: 'comparisons',
      hints: ['Read “Expanding each centre” under the comparison counts.'],
      solution:
        'Expanding every centre spends 1,600, growing with n². Manacher’s algorithm spends 79, because inside the palindrome it already knows, a mirror gives each new radius almost for free.',
    },
    {
      type: 'number',
      prompt:
        'Type aaaa in Periods and palindromes. How many of its substrings are palindromes, counting each position separately?',
      answer: 10,
      unit: 'substrings',
      hints: [
        'Read the “Palindromic substrings” card.',
        'Every substring of aaaa is a palindrome. How many substrings do 4 letters have?',
      ],
      solution:
        'Four of length 1, three of length 2, two of length 3 and one of length 4: 10. Each centre with radius P adds ⌈P / 2⌉ palindromes, so one Manacher run counts them all.',
    },
    {
      type: 'choice',
      prompt:
        'You must scan a long log for 500 banned phrases of different lengths, all in one pass. Which tool fits best?',
      options: ['Boyer-Moore, run once per phrase', 'Rabin-Karp', 'Aho-Corasick', 'Manacher'],
      answer: 2,
      hints: ['One automaton can follow every phrase at once. Which lesson built one?'],
      solution:
        'Aho-Corasick builds a trie of the phrases with failure links and reads the log once, in O(total phrase length + n + reports). Running a matcher per phrase costs 500 passes, and Rabin-Karp’s window needs one length at a time.',
    },
  ],
};
