/** @typedef {import('$lib/algo-engine/tries.js').TrieFrame} TrieFrame */
/** @typedef {import('$lib/algo-engine/tries.js').TrieOp} TrieOp */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export const en = {
  slug: 'tries',
  topic: 'string-algorithms',
  level: 'Beginner',
  title: 'Tries',
  intro:
    'A trie, or prefix tree, stores a set of words as a tree of letters: every word that starts the same way shares the same path from the root. Looking up a word walks one node per letter, so the cost depends on the length of the word and not on how many words are stored.',
  summary:
    'Grow a prefix tree word by word, search it, and autocomplete a prefix by walking the shared paths.',
  instruction:
    'Type a word and watch the path that matches it light up in the tree. Insert it, search for it, or autocomplete it, then step through the walk. Click any node to copy its prefix into the field. Undo removes the last operation.',
  wordLabel: 'Word or prefix',
  insert: 'Insert',
  search: 'Search',
  complete: 'Autocomplete',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    shared: 'Shared prefixes',
    apart: 'Nothing shared',
    nested: 'Words inside words',
  },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  resultsTitle: 'Autocomplete results',
  resultsEmpty: 'none yet',
  rootLabel: 'ε',
  wordNote: 'word',
  /** @param {TrieOp} op */
  opChip: (op) => `${en[op.type]} ${op.word}`,
  stats: {
    steps: 'Nodes touched (this operation)',
    words: 'Words stored',
    letters: 'Letters in those words',
    nodes: 'Nodes below the root',
  },
  /** @param {number} letters @param {number} nodes */
  saved: (letters, nodes) =>
    `Sharing prefixes saves ${plural(letters - nodes, 'node', 'nodes')}: one node per letter would need ${letters}.`,
  /** @param {number} max */
  wordErrors: (max) => ({
    empty: 'Type a word first.',
    format: 'Use letters a to z only, with no spaces.',
    length: `A word may have at most ${max} letters.`,
  }),
  /** @param {number} max */
  full: (max) => `The trie is full (${max} words).`,
  /** @param {number} max */
  logFull: (max) => `The log is full (${max} operations). Undo or reset to continue.`,
  liveTitle: 'As you type',
  /** @param {string} prefix @param {number} matched @param {string[]} words */
  live(prefix, matched, words) {
    if (prefix === '') return 'Type letters to follow a path from the root.';
    if (matched < prefix.length) {
      const read = prefix.slice(0, matched);
      return matched === 0
        ? `No word starts with ${prefix[0]}.`
        : `“${read}” is in the trie, but no word continues with ${prefix[matched]}.`;
    }
    return `“${prefix}” starts ${plural(words.length, 'word', 'words')}: ${words.join(', ')}.`;
  },
  /** @param {number} nodes @param {number} words */
  treeLabel: (nodes, words) =>
    `Trie with ${plural(nodes, 'node', 'nodes')} and ${plural(words, 'word', 'words')}. Press Enter on a node to copy its prefix into the field.`,
  /** @param {string} prefix @param {boolean} isWord @param {string} state */
  nodeLabel(prefix, isWord, state) {
    const name = prefix === '' ? 'Root' : `Prefix ${prefix}`;
    return [name, isWord ? 'a stored word' : '', state].filter(Boolean).join(', ');
  },
  states: {
    current: 'being read',
    new: 'just created',
    found: 'word ends here',
    missing: 'stops here',
    path: 'on the walk',
    subtree: 'below the prefix',
    typed: 'matches what you typed',
  },
  markers: {
    current: '?',
    new: '+',
    found: '✓',
    missing: '✗',
    path: '•',
    subtree: '▾',
    typed: '›',
  },
  legend: {
    current: 'Being read',
    new: 'Just created',
    found: 'Word ends here',
    missing: 'Stops here',
    path: 'On the walk',
    subtree: 'Below the prefix',
    typed: 'Matches what you typed',
  },
  wordLegend: 'A “word” caption marks where a stored word ends.',
  /** @param {TrieFrame} f */
  describe(f) {
    const word = f.op?.word ?? '';
    const type = f.op?.type;
    const walked = f.path.length - 1;
    switch (f.kind) {
      case 'start':
        return 'The trie starts as a single empty root.';
      case 'begin':
        return type === 'insert'
          ? `Insert ${word}: start at the root.`
          : type === 'search'
            ? `Search for ${word}: start at the root.`
            : `Autocomplete ${word}: first walk down to the end of the prefix.`;
      case 'follow':
        return `Letter ${f.letter} already has a node, so follow it: the path spells “${word.slice(0, walked)}”.`;
      case 'create':
        return `No child for ${f.letter}, so create one: the prefix “${word.slice(0, walked)}” is new to the trie.`;
      case 'mark':
        return `The last letter is reached: flag this node as the end of the word ${word}.`;
      case 'dup':
        return `The node for ${word} is already flagged, so the word is stored already.`;
      case 'missing':
        return `No child for ${f.letter}, so nothing stored starts with “${word.slice(0, walked + 1)}”. Stop after ${plural(f.steps, 'node', 'nodes')}.`;
      case 'found':
        return `All ${word.length} letters matched and the node is flagged: ${word} is stored.`;
      case 'prefix-only':
        return `All ${word.length} letters matched, but the node has no flag: ${word} is only a prefix of longer words, not a stored word.`;
      case 'subtree':
        return `The prefix ends here. Every word that starts with ${word} ends at this node or in the ${plural(f.subtree.length - 1, 'node', 'nodes')} below it.`;
      case 'collect':
        return `This node is flagged, so report ${f.results[f.results.length - 1]}.`;
      case 'collected':
        return `Autocomplete found ${plural(f.results.length, 'word', 'words')} after touching ${plural(f.steps, 'node', 'nodes')}.`;
      case 'done':
        return `The trie holds ${plural(f.wordCount, 'word', 'words')} in ${plural(f.nodeCount - 1, 'node', 'nodes')} below the root.`;
    }
  },
  takeaways: [
    'Each node stands for one prefix, and two words share nodes for exactly as long as they start the same way.',
    'Insert and search touch one node per letter, so they cost O(L) for a word of length L, even with a million words stored.',
    'The end-of-word flag matters: a path can exist without any word ending there, as “ca” does in a trie holding only “car”.',
    'Autocomplete walks to the end of the prefix, then reads the words below it in sorted order. A hash table of words has no such shortcut.',
    'Try “Nothing shared” and then “Shared prefixes”: compare the letters stored with the nodes used, and watch how much sharing saves.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Insert or search', 'O(L)', 'One node per letter of the word, however many words are stored.'],
    [
      'Autocomplete',
      'O(L + k)',
      'Walk the L letters of the prefix, then read the k nodes below it.',
    ],
    [
      'Memory',
      'O(N · σ)',
      'N nodes at most the total letters stored, each with room for up to σ children when they are kept in an array.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Insert tea, ten, team and to into an empty trie. How many nodes does it have, counting the root?',
      answer: 7,
      unit: 'nodes',
      hints: [
        'Count distinct prefixes: t, te, tea, and so on, plus the empty prefix for the root.',
      ],
      solution:
        'The distinct non-empty prefixes are t, te, tea, ten, team and to, which is 6 nodes. The root makes 7.',
    },
    {
      type: 'number',
      prompt: 'A trie holds only car. How many new nodes does inserting card create?',
      answer: 1,
      unit: 'nodes',
      hints: ['Walk c, a, r first. Which of the four letters has no node yet?'],
      solution:
        'The path c → a → r already exists, so only d needs a new node. The node for r keeps its own word flag.',
    },
    {
      type: 'choice',
      prompt: 'A trie holds only car and card. What does search(ca) return, and why?',
      options: [
        'Found, because the path c → a exists',
        'Not found, because the node for a has no end-of-word flag',
        'Not found, because the path c → a does not exist',
        'Found, because ca is a prefix of a stored word',
      ],
      answer: 1,
      hints: ['Search and autocomplete walk the same path. What does search check at the end?'],
      solution:
        'The path exists, but no word ends at the node for a, so search answers not found. A prefix query would answer yes on the same walk.',
    },
    {
      type: 'order',
      prompt:
        'A trie holds cat, car, care and card. Put the results of complete(ca) in the order a depth-first walk reports them, with letters in order and a word before the words it starts.',
      items: ['cat', 'car', 'care', 'card'],
      answer: [1, 3, 2, 0],
      hints: ['Below the node for ca, r comes before t. Below the node for car, d comes before e.'],
      solution:
        'The walk reaches r first and reports car, then goes to d (card) and e (care), and finally to t (cat). That is sorted order.',
    },
    {
      type: 'number',
      prompt:
        'Store stop, star and start. How many nodes below the root does sharing save, compared with one node per stored letter?',
      answer: 6,
      unit: 'nodes',
      hints: ['The letters total 4 + 4 + 5. Now count the distinct non-empty prefixes.'],
      solution:
        'The words have 13 letters. The distinct prefixes are s, st, sto, stop, sta, star and start, so 7 nodes are enough: sharing saves 13 − 7 = 6.',
    },
  ],
  nextTeaser:
    'Next up: String hashing and Rabin-Karp, which turns each window of a text into a number so that comparing strings costs one comparison.',
};
