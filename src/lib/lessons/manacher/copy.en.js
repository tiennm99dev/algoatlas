/** @typedef {import('$lib/algo-engine/manacher.js').ManacherFrame} ManacherFrame */
import { palindromeAt } from '$lib/algo-engine/manacher.js';

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'manacher',
  topic: 'string-algorithms',
  level: 'Intermediate',
  title: 'Manacher’s algorithm',
  intro:
    'The simple way to find the longest palindrome expands around every centre, which takes O(n²) on repetitive text. Manacher’s algorithm notices that the inside of a palindrome is mirrored, so a centre inside a known palindrome already knows most of its radius. That single idea gives every palindromic radius in O(n).',
  summary:
    'Find the longest palindromic substring in linear time by copying radii from the mirror position inside the furthest palindrome.',
  instruction:
    'Type a string and step. Each arc above the letters is one palindrome, and the ▭ band marks the one that reaches furthest. When i lands inside the band, its radius starts from its mirror m, and no letters are read for that part. Compare the comparisons with the count for plain expansion.',
  textLabel: 'String',
  presetLabel: 'Example',
  presets: {
    nested: 'Nested palindromes',
    even: 'An even palindrome',
    repeats: 'All one letter',
    none: 'No repeats',
  },
  /** @param {number} max */
  fieldErrors: (max) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    length: `The string may have at most ${max} letters.`,
  }),
  boardTitle: 'Palindromic radii as arcs',
  /** @param {string} s */
  boardAria: (s) => `Arcs over the separated form of ${s}, one for each palindrome found.`,
  boardNote:
    'The # marks sit between letters, so an even palindrome such as abba has a centre too. P[i] is the radius at i in T and equals the palindrome’s length in S.',
  rowP: 'P',
  rowIndex: 'i',
  /** @param {number} c @param {string} letter @param {string} p @param {string} state */
  cellLabel: (c, letter, p, state) =>
    `Position ${c}: ${letter}${p ? `, radius ${p}` : ''}${state ? `, ${state}` : ''}`,
  states: {
    current: 'centre i',
    mirror: 'mirror of i',
    band: 'inside the furthest palindrome',
    equal: 'letters equal',
    miss: 'letters differ',
    best: 'longest palindrome',
  },
  markers: { current: 'i', mirror: 'm', band: '', equal: '✓', miss: '✗', best: '★' },
  legend: {
    current: 'i Current centre',
    mirror: 'm Mirror of i',
    band: '▭ Furthest palindrome',
    equal: '✓ Letters equal',
    miss: '✗ Letters differ',
    best: '★ Longest found',
  },
  centreMark: 'C',
  rightMark: 'R',
  arcs: {
    done: 'Thin arc: a finished radius',
    current: 'Bold arc: radius of i',
    mirror: 'Dashed arc: radius of the mirror',
  },
  stats: {
    i: 'Centre i',
    band: 'Centre C, right end R',
    comparisons: 'Letter comparisons',
    reused: 'Radius reused without reading',
    naive: 'Comparisons by plain expansion',
    best: 'Longest length',
  },
  /** @param {number} c @param {number} r */
  bandValue: (c, r) => (r === 0 ? '—' : `${c}, ${r}`),
  answerTitle: 'Longest palindrome so far',
  answerEmpty: 'none yet',
  /** @param {ManacherFrame} f */
  answer: (f) => palindromeAt(f.s, f.bestCentre, f.best),
  /** @param {ManacherFrame} f */
  describe(f) {
    const { t, i, value, c, r } = f;
    const left = i - value - 1;
    const right = i + value + 1;
    switch (f.kind) {
      case 'start':
        return `Put # between the letters: T = ${t}. Now every palindrome has a centre, whether its length is odd or even.`;
      case 'outside':
        return i === r && r > 0
          ? `i = ${i} is at the right end R, so nothing is known yet: start from radius 0.`
          : `i = ${i} is past the furthest palindrome, so nothing is known yet: start from radius 0.`;
      case 'inside':
        return `i = ${i} is inside the palindrome around ${c}, so it mirrors position ${f.mirror}. Start from min(R − i, P[${f.mirror}]) = min(${r - i}, ${f.p[f.mirror]}) = ${value}, without reading those letters.`;
      case 'compare':
        return f.equal
          ? `T[${left}] = T[${right}] = ${t[left]}, so the radius grows to ${value + 1}.`
          : `T[${left}] = ${t[left]} differs from T[${right}] = ${t[right]}, so the radius stays at ${value}.`;
      case 'box':
        return `This palindrome reaches further right, so C = ${c} and R = ${r}.`;
      case 'store':
        return `P[${i}] = ${value}.`;
      case 'best':
        return `A new longest: radius ${value} stands for ${palindromeAt(f.s, i, value)} in S, of length ${value}.`;
      case 'done':
        return `Done: the longest palindrome is ${palindromeAt(f.s, f.bestCentre, f.best)}, of length ${f.best}, after ${plural(f.comparisons, 'comparison', 'comparisons')}.`;
    }
  },
  takeaways: [
    'Putting # between letters gives every palindrome, odd or even, one centre in T. The radius P[i] then equals the palindrome’s length in S.',
    'Inside a palindrome with centre C, position i mirrors to 2C − i, and the letters around both look the same.',
    'So P[i] starts from min(R − i, P[2C − i]). The cap matters: past R, the mirror proves nothing.',
    'Each matching comparison moves R to the right, and R never moves back, so all the comparisons together are linear.',
    'Try “All one letter” and “No repeats”: compare the comparisons with plain expansion and notice how much of the radius is reused.',
  ],
  complexityHead: ['Approach', 'Cost', 'Why'],
  complexity: [
    [
      'Manacher',
      'O(n)',
      'Each matching comparison pushes R right, and each centre has at most one that fails: at most 2|T| in all, and |T| = 2n + 1.',
    ],
    [
      'Expanding from every centre',
      'O(n²)',
      'A text of one letter makes each centre expand as far as it can.',
    ],
    [
      'Checking every substring',
      'O(n³)',
      'There are about n²/2 substrings, and checking one takes up to n steps.',
    ],
    ['Memory', 'O(n)', 'The separated string and one radius per position.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How long is the separated string T for S = abba?',
      answer: 9,
      unit: 'characters',
      hints: ['There is one # before, between and after the letters: 2n + 1 characters.'],
      solution: 'T = #a#b#b#a#, which has 2 × 4 + 1 = 9 characters.',
    },
    {
      type: 'number',
      prompt: 'For S = abba, what is the radius P[4], at the middle # of T?',
      answer: 4,
      unit: 'characters',
      hints: ['Expand from the middle of #a#b#b#a# as far as both sides match.'],
      solution:
        'All of T is a palindrome around index 4, so the radius is 4: the same as the length of abba.',
    },
    {
      type: 'number',
      prompt: 'The furthest palindrome has C = 7 and R = 12. What is the mirror of i = 9?',
      answer: 5,
      unit: 'position',
      hints: ['The mirror is 2C − i.'],
      solution: '2 × 7 − 9 = 5.',
    },
    {
      type: 'number',
      prompt:
        'With C = 7, R = 12 and i = 9, the mirror has P = 1. What radius does i start from, before reading any letter?',
      answer: 1,
      unit: 'characters',
      hints: ['Use min(R − i, P[2C − i]).'],
      solution: 'min(12 − 9, 1) = min(3, 1) = 1.',
    },
    {
      type: 'text',
      prompt: 'What is the longest palindrome in xabbay?',
      accept: ['abba'],
      hints: ['Load “An even palindrome” and step to the end.'],
      solution:
        'abba, of length 4. Its centre is the # between the two b letters, which is why T needs the separators.',
    },
    {
      type: 'number',
      prompt:
        'Load “All one letter” and step to the end. How many comparisons does the mirror save, compared with plain expansion?',
      answer: 49,
      unit: 'comparisons',
      hints: ['Read both stat cards at the last step and subtract.'],
      solution:
        'Plain expansion makes 64 comparisons on T for aaaaaaaa, one for each step out from each centre. Manacher makes only 15 here, so 49 are saved.',
    },
  ],
  nextTeaser:
    'Next up: Regular expressions and NFA simulation, which turns a whole pattern language into a graph of states.',
};
