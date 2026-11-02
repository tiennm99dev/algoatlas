/** @typedef {import('$lib/algo-engine/regular-expressions-nfa.js').NfaFrame} NfaFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** @param {number[]} set */
const setText = (set) => `{${set.join(', ')}}`;

export const en = {
  slug: 'regular-expressions-nfa',
  topic: 'string-algorithms',
  level: 'Advanced',
  title: 'Regular expressions and NFA simulation',
  intro:
    'A regular expression describes a whole set of strings. Thompson’s construction turns one into a small graph of states, an NFA, where ε edges can be followed without reading anything. Tracking the set of states the machine could be in tests any string in O(n · m), even on patterns that make a backtracking matcher take exponential time.',
  summary:
    'Build an NFA from a regular expression with Thompson’s construction and test strings by simulating the set of active states.',
  instruction:
    'Type a regular expression and an input, then step. The graph grows one piece per letter and operator. Then each letter moves the active states along matching edges, and ε edges spread them further. Load “Backtracking trap” and compare the two step counts.',
  regexLabel: 'Regular expression',
  inputLabel: 'Input (may be empty)',
  presetLabel: 'Example',
  syntax: 'Letters a to z, . for any letter, | for or, * + ? to repeat, and ( ) to group.',
  presets: {
    classic: '(a|b)*abb',
    choice: '(cat|dog)s?',
    optional: 'colou?r',
    dead: 'A dead end',
    blowup: 'Backtracking trap',
  },
  /** @param {number} regex @param {number} input */
  fieldErrors: (regex, input) => ({
    empty: 'Type a regular expression.',
    format: 'Use only letters a to z and . | * + ? ( ).',
    length: `The expression may have at most ${regex} characters.`,
    paren: 'The brackets do not match.',
    branch: 'Each side of | and each pair of brackets needs something inside.',
    repeat: 'Put a letter or a group before * + or ?.',
    stacked: 'Use one of * + ? at a time; wrap a group in brackets to repeat it again.',
    inputFormat: 'The input may use letters a to z only, with no spaces.',
    inputLength: `The input may have at most ${input} letters.`,
  }),
  boardTitle: 'The NFA',
  /** @param {string} regex @param {number} n */
  boardAria: (regex, n) => `The NFA of ${regex}, with ${plural(n, 'state', 'states')}.`,
  boardNote:
    'The arrow from the left marks the start state, and the double ring marks the accepting state. Each edge reads the letter on it; ε edges read nothing.',
  /** @param {number} id @param {string} role @param {boolean} accept @param {boolean} start */
  stateLabel: (id, role, accept, start) =>
    `State ${id}${start ? ', start' : ''}${accept ? ', accepting' : ''}${role ? `, ${role}` : ''}`,
  /** @param {number} from @param {number} to @param {string} label @param {boolean} taken */
  edgeLabel: (from, to, label, taken) =>
    `Edge from ${from} to ${to} on ${label}${taken ? ', just followed' : ''}`,
  states: { active: 'active', fresh: 'just reached', accept: 'accepting and active' },
  markers: { active: '●', fresh: '+', accept: '✓' },
  legend: {
    active: '● Active state',
    fresh: '+ Just reached',
    accept: '✓ Accepting and active',
    edge: 'Bold edge: just followed',
  },
  inputTitle: 'Input',
  inputAria: 'The input string, letter by letter.',
  inputEmpty: 'The input is empty, so the start set alone decides.',
  inputMarker: '↓',
  /** @param {number} i @param {string} letter @param {boolean} now */
  inputCell: (i, letter, now) => `Input position ${i}: ${letter}${now ? ', being read' : ''}`,
  stats: {
    states: 'NFA states',
    edges: 'NFA edges',
    active: 'Active states',
    checks: 'Edges looked at',
    backtrack: 'Backtracking attempts',
    verdict: 'Verdict',
  },
  /** @param {number} n */
  overCap: (n) => `over ${n.toLocaleString('en-US')}`,
  verdicts: { pending: '—', yes: 'accepted', no: 'rejected' },
  setTitle: 'Active set after each letter',
  setEmpty: 'nothing read yet',
  /** @param {{letter: string, set: number[]}} h */
  setChip: (h) => `${h.letter} → ${setText(h.set)}`,
  pieces: {
    char: 'a letter edge to a new state',
    any: 'an edge that takes any letter',
    cat: '',
    alt: 'ε edges into each branch and out to a new state',
    star: 'a loop back and a skip around, so it can repeat or be left out',
    plus: 'a loop back, so it can repeat but must happen once',
    opt: 'a skip around, so it can be left out',
  },
  /** @param {NfaFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `Build the NFA of ${f.regex}, starting from one state.`;
      case 'build': {
        const piece = /** @type {NonNullable<NfaFrame['piece']>} */ (f.piece);
        return `${piece.text}: add ${this.pieces[piece.type]}. The NFA now has ${plural(piece.states, 'state', 'states')}.`;
      }
      case 'ready':
        return `Before reading anything, follow every ε edge from the start: the active set is ${setText(f.set)}.`;
      case 'read':
        return f.fresh.length > 0
          ? `Read ${f.letter}: the edges taking ${f.letter} lead to ${setText(f.fresh)}.`
          : `Read ${f.letter}: no active state has an edge taking it.`;
      case 'closure':
        return f.fresh.length > 0
          ? `Follow ε edges from there, which adds ${setText(f.fresh)}. The active set is ${setText(f.set)}.`
          : `No ε edge adds a new state. The active set is ${setText(f.set)}.`;
      case 'dead':
        return 'The active set is empty, so no way of reading the rest can succeed.';
      case 'done':
        return f.accepted
          ? `The accepting state is active, so ${f.input === '' ? 'the empty input' : f.input} is accepted, after ${plural(f.edgeChecks, 'edge', 'edges')} looked at.`
          : `The accepting state is not active, so ${f.input === '' ? 'the empty input' : f.input} is rejected, after ${plural(f.edgeChecks, 'edge', 'edges')} looked at.`;
    }
  },
  takeaways: [
    'A regular expression has three core operators: concatenation, alternation with | and repetition with *. The forms + and ? are shorthand built from them.',
    'Thompson’s construction builds an NFA piece by piece: one edge per letter and a few ε edges per operator, so m symbols make at most 2m states.',
    'An ε edge can be followed without reading a letter. The ε-closure of a set is everything reachable that way.',
    'Simulation keeps a set of states instead of guessing one path: move on the letter, then take the closure. Each letter costs at most two passes over the edges.',
    'Load “Backtracking trap”, then add or remove letters in the input: the backtracking count doubles with each letter while edges looked at grow by a fixed amount.',
  ],
  complexityHead: ['Part', 'Cost', 'Why'],
  complexity: [
    ['Building the NFA', 'O(m)', 'One piece per symbol of the expression, each of fixed size.'],
    [
      'Simulation',
      'O(n · m)',
      'For each of the n letters, each edge is checked at most twice, once to move and once for the closure, and there are O(m) edges.',
    ],
    [
      'Backtracking matcher',
      'Exponential worst case',
      'An ambiguous pattern such as (a|a)*b retries both branches at every letter, so about 2ⁿ attempts; more branches make it worse.',
    ],
    ['Memory', 'O(m)', 'The graph, plus one active set of at most all its states.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many states does this construction make for a*?',
      answer: 4,
      unit: 'states',
      hints: ['Type a* into the widget and read the stat card.'],
      solution:
        'The entry state, then the inner start and the state after a, then a new exit: four in all.',
    },
    {
      type: 'number',
      prompt: 'How many ε edges does a|b have?',
      answer: 4,
      unit: 'edges',
      hints: ['Two lead into the branches and two lead out of them.'],
      solution: 'One ε edge into each branch and one out of each branch: 2 + 2 = 4.',
    },
    {
      type: 'number',
      prompt: 'Before reading any letter, how many states are active for a|b?',
      answer: 3,
      unit: 'states',
      hints: ['Start at the start state, then follow every ε edge.'],
      solution: 'The start state and the two branch starts reached by ε edges: three.',
    },
    {
      type: 'multi',
      prompt: 'Which of these does (a|b)*abb accept?',
      options: ['abb', 'aabb', 'abab', 'babb', 'ab'],
      answers: [0, 1, 3],
      hints: ['The expression means any string of a and b ending in abb.'],
      solution: 'abb, aabb and babb all end in abb. abab and ab do not.',
    },
    {
      type: 'choice',
      prompt: 'Why does the simulation avoid the exponential blow-up of backtracking?',
      options: [
        'It tries the branches in a cleverer order.',
        'It merges all ways of reaching a state into one member of the set.',
        'It only works on patterns with no repetition.',
      ],
      answer: 1,
      hints: ['How many times can one state appear in the set?'],
      solution:
        'However many paths reach a state, it enters the set only once, so the work per letter is bounded by the size of the graph.',
    },
  ],
  nextTeaser:
    'Next up: Data compression: run-length, Huffman and LZW, three ways of writing the same text in fewer bits.',
};
