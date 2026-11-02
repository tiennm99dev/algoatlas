/** @typedef {import('$lib/algo-engine/rabin-karp.js').RabinKarpFrame} RabinKarpFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'rabin-karp',
  topic: 'string-algorithms',
  level: 'Intermediate',
  title: 'String hashing and Rabin-Karp',
  intro:
    'Comparing two strings letter by letter is slow, but comparing two numbers takes one step. A polynomial hash turns a string into a number, and a rolling update slides it along a text in constant time per place. Rabin-Karp searches by comparing those numbers, and only reads the letters when the numbers agree.',
  summary:
    'Slide a polynomial rolling hash over a text, and see how equal hashes can be real matches or spurious hits.',
  instruction:
    'Type a text and a pattern, then step. Each window’s hash lands in the bottom row of the board, and the panel shows the rolling update as numbers. Shrink the modulus or load “Bad base” to force spurious hits, where the hashes agree but the letters do not.',
  textLabel: 'Text',
  patternLabel: 'Pattern',
  baseLabel: 'Base b',
  modLabel: 'Modulus q',
  presetLabel: 'Example',
  presets: {
    plain: 'A chance collision',
    collide: 'Bad base',
    repeats: 'All repeats',
    large: 'Large modulus',
  },
  /** @param {number} maxText @param {number} maxPattern */
  fieldErrors: (maxText, maxPattern) => ({
    empty: 'Type at least one letter.',
    format: 'Use letters a to z only, with no spaces.',
    textLength: `The text may have at most ${maxText} letters.`,
    patternLength: `The pattern may have at most ${maxPattern} letters.`,
  }),
  /** @param {number} max */
  baseError: (max) => `The base must be a whole number from 2 to ${max}.`,
  /** @param {number} max */
  modError: (max) => `The modulus must be a whole number from 2 to ${max.toLocaleString('en-US')}.`,
  boardTitle: 'Window over the text',
  rows: { text: 'T', pattern: 'P', hash: '#' },
  boardNote:
    'Row # holds the hash of the window that starts in that column. Letters count as a = 1, b = 2, … z = 26.',
  /** @param {string} text @param {string} pattern */
  boardAria: (text, pattern) => `Text ${text} with pattern ${pattern} under the current window.`,
  /** @param {string} rowName @param {number} c @param {string} value @param {string} state */
  cellLabel: (rowName, c, value, state) =>
    `${rowName} column ${c}: ${value || 'empty'}${state ? `, ${state}` : ''}`,
  rowNames: { text: 'Text', pattern: 'Pattern', hash: 'Hash' },
  states: {
    window: 'in the window',
    hashing: 'being hashed',
    read: 'being compared',
    match: 'confirmed match',
    miss: 'letters disagree',
    spurious: 'spurious hit',
  },
  markers: { window: '', hashing: '#', read: '?', match: '✓', miss: '✗', spurious: '~' },
  legend: {
    window: 'In the window',
    hashing: 'Being hashed',
    read: 'Being compared',
    match: 'Confirmed match',
    miss: 'Letters disagree',
    spurious: 'Spurious hit',
  },
  stats: {
    checks: 'Hash comparisons',
    reads: 'Letter comparisons',
    matches: 'Matches',
    spurious: 'Spurious hits',
    naive: 'Plain matcher’s letter comparisons',
    hashWork: 'Letters hashed, rolling',
    scratch: 'Letters hashed, from scratch each time',
    expected: 'Spurious hits expected by chance',
  },
  hashTitle: 'Hashes',
  patternHash: 'hash(P)',
  windowHash: 'hash(window)',
  rollTitle: 'Rolling update',
  /** @param {RabinKarpFrame} f */
  rollLine(f) {
    if (!f.roll) return 'Each slide is worked out here as it happens.';
    const { out, in: incoming, before, after } = f.roll;
    return `(${f.base} · (${before} − ${out}·${f.high}) + ${incoming}) mod ${f.mod} = ${after}`;
  },
  rollKey: 'A letter here means its value, a = 1 to z = 26.',
  matchesTitle: 'Matches at',
  matchesEmpty: 'none yet',
  /** @param {RabinKarpFrame} f */
  describe(f) {
    const m = f.pattern.length;
    const w = f.text.slice(f.shift, f.shift + m);
    switch (f.kind) {
      case 'start':
        return `Search ${f.text} for ${f.pattern}, with base ${f.base} and modulus ${f.mod}.`;
      case 'high':
        return `The first letter of a window is worth b^(m − 1) = ${f.base}^${m - 1}, which is ${f.high} mod ${f.mod}.`;
      case 'hash-letter':
        return `Feed letter ${f.at} into ${f.windowHash === null ? 'hash(P)' : 'both hashes'}: multiply by ${f.base}, add its value. hash(P) = ${f.patternHash}${f.windowHash === null ? '' : `, hash(window) = ${f.windowHash}`}.`;
      case 'too-long':
        return 'The pattern is longer than the text, so no window exists.';
      case 'check':
        return f.equal
          ? `Window ${w} at ${f.shift} has hash ${f.windowHash}, equal to hash(P). That is only a suggestion, so check the letters.`
          : `Window ${w} at ${f.shift} has hash ${f.windowHash}, not ${f.patternHash}. It cannot match, and no letter is read.`;
      case 'verify':
        return f.equal
          ? `T[${f.shift + f.at}] = ${f.text[f.shift + f.at]} equals P[${f.at}].`
          : `T[${f.shift + f.at}] = ${f.text[f.shift + f.at]} differs from P[${f.at}] = ${f.pattern[f.at]}.`;
      case 'match':
        return `All letters agree: ${f.pattern} occurs at ${f.shift}.`;
      case 'spurious':
        return `A spurious hit: ${w} has the same hash as ${f.pattern} but different letters. The check saved a wrong answer.`;
      case 'roll':
        return `Slide one place: drop ${f.roll?.out}, multiply by ${f.base}, add ${f.roll?.in}. The new hash is ${f.roll?.after}, without rereading the letters between.`;
      case 'done':
        return `Done: ${plural(f.matches.length, 'match', 'matches')} and ${plural(f.spurious.length, 'spurious hit', 'spurious hits')}, with ${plural(f.hashChecks, 'hash comparison', 'hash comparisons')} and ${plural(f.letterReads, 'letter comparison', 'letter comparisons')}.`;
    }
  },
  takeaways: [
    'A polynomial hash treats a string as a number in base b: h = s[0]·b^(m−1) + … + s[m−1], all mod q.',
    'Sliding one place removes the first letter’s term, shifts by b and adds the new letter, so each slide costs O(1) instead of O(m).',
    'Different strings can share a hash. With q prime and b random, two given strings of length m collide with probability at most (m − 1)/q, so about 1/q is the usual working estimate per window.',
    'Equal hashes must be confirmed by reading the letters. A prime q helps, and a base that is a multiple of q ruins everything: only the last letter still counts.',
    'Try “Bad base”, then raise the modulus to 101: the spurious hits disappear, and so do their wasted letter comparisons.',
  ],
  complexityHead: ['Case', 'Cost', 'Why'],
  complexity: [
    ['Set-up', 'O(m)', 'Hash the pattern and the first window, one letter at a time.'],
    [
      'Expected search',
      'O(n + m)',
      'One O(1) slide and hash comparison per window, with few false alarms when q is large.',
    ],
    [
      'Worst case',
      'O(n · m)',
      'Every window hashes equal, as with all repeats, and all m letters are confirmed each time.',
    ],
    ['Memory', 'O(1)', 'Just two hashes and b^(m − 1), beyond the strings themselves.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'With a = 1, b = 2, c = 3, base 10 and modulus 1000, what is the hash of abc?',
      answer: 123,
      hints: ['Add 1·10², 2·10¹ and 3·10⁰.'],
      solution: '1·100 + 2·10 + 3 = 123, and that is below the modulus, so the hash is 123.',
    },
    {
      type: 'number',
      prompt:
        'Same base and modulus. The window abc has hash 123. Use the rolling update to find the hash of bcd, where d = 4.',
      answer: 234,
      hints: ['Here high = 10² = 100. Compute 10 · (123 − 1 · 100) + 4.'],
      solution: 'Remove the a: 123 − 1·100 = 23. Shift: 23·10 = 230. Add d: 230 + 4 = 234.',
    },
    {
      type: 'number',
      prompt:
        'Load “Bad base” (text abcbabaacab, pattern aba, base 10, modulus 5) and step to the end. How many spurious hits are there?',
      answer: 3,
      unit: 'hits',
      hints: ['Base 10 is a multiple of 5, so every term but the last letter vanishes mod 5.'],
      solution:
        'Only the last letter counts, so a window hits when it ends in a letter worth 1 mod 5, which among these letters means a. Windows cba at 2, baa at 5 and aca at 7 are spurious; aba at 4 is the one real match.',
    },
    {
      type: 'choice',
      prompt:
        'Load “All repeats”. Why does Rabin-Karp lose its advantage over the plain matcher here?',
      options: [
        'The rolling update stops working on repeated letters',
        'Every window really matches, so all m letters are confirmed at every position',
        'The modulus is too small for this text',
        'The hash of a repeated letter is always 0',
      ],
      answer: 1,
      hints: ['Look at how many letter comparisons each window causes.'],
      solution:
        'All windows match, so no window can be skipped by its hash, and each one costs m letter comparisons: Θ(n · m) in total. A false alarm is not the cause, since no hit here is spurious.',
    },
    {
      type: 'number',
      prompt:
        'A text has 1,002 letters and the pattern 3, so there are 1,000 windows. With q = 101, about how many spurious hits do you expect by chance, to the nearest whole number?',
      answer: 10,
      tolerance: 0.5,
      unit: 'hits',
      hints: ['Each window hits a given hash value about once in q tries.'],
      solution:
        '1,000 windows × 1/101 ≈ 9.9, so about 10. Raising q to about a million makes it about 0.001.',
    },
  ],
  nextTeaser:
    'Next up: Prefix function and KMP, which reads the text in one pass, never moving backwards, by remembering how much of the pattern still matches after a mismatch.',
};
