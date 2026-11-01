/** @typedef {import('$lib/algo-engine/huffman-coding.js').HuffFrame} HuffFrame */
/** @typedef {import('$lib/algo-engine/huffman-coding.js').HuffNode} HuffNode */

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/**
 * The symbols under a node, left to right: a leaf is its symbol, a merged node joins its leaves.
 * @param {HuffNode[]} nodes @param {number} id @returns {string}
 */
function leaves(nodes, id) {
  const n = nodes[id];
  return n.left < 0 ? n.symbol : leaves(nodes, n.left) + leaves(nodes, n.right);
}

/** A tree as `fe (14)`. @param {HuffFrame} f @param {number} id */
const tree = (f, id) => `${leaves(f.nodes, id)} (${f.nodes[id].weight})`;

/** @param {number} x */
const twoPlaces = (x) => x.toFixed(2);

export const en = {
  slug: 'huffman-coding',
  topic: 'greedy',
  level: 'Intermediate',
  title: 'Huffman coding',
  intro:
    'A fixed-length code spends the same number of bits on every symbol. Huffman coding gives frequent symbols short codes and rare symbols long ones, and keeps the code prefix-free, so no code is the start of another and a bit string decodes without separators. Its greedy rule, merge the two least frequent trees, builds a code with the fewest total bits possible.',
  summary:
    'Watch Huffman’s algorithm merge the two lightest trees again and again, read each symbol’s code off the tree, and compare the bits with a fixed-length code.',
  instruction:
    'Type symbol:frequency pairs, count the letters of a text, or load a preset, then step. The queue is drawn lightest first; each merge adds its weight to the bit count. Pick a node to jump to its merge, or a leaf to the step that reads its code. Count “abracadabra” and compare its bits with the fixed-length code.',
  frequenciesLabel: 'Frequencies (symbol:count)',
  textLabel: 'Or count the letters of',
  presetLabel: 'Example',
  presetPlaceholder: 'Load frequencies…',
  presets: {
    textbook: 'Textbook: a:45 … f:5',
    equal: 'Four equal counts',
    skewed: 'Powers of two',
    vowels: 'English vowels',
  },
  errors: {
    format:
      'Type pairs like a:45, b:13, one character before each colon. The last valid ones are back.',
    range: 'Keep every count between 1 and 999. The last valid frequencies are back.',
    duplicate: 'Give each symbol once. The last valid frequencies are back.',
    count: 'Use between 2 and 10 different symbols. The last valid frequencies are back.',
    empty: 'Type a text to count its letters.',
    long: 'Keep the text to 200 characters.',
  },
  newFrequenciesNotice: 'New frequencies loaded.',
  /** @param {number} n */
  countedNotice: (n) => `Counted ${plural(n, 'different character')}; a space shows as ␣.`,
  /** @param {number} n */
  treeAria: (n) => `Huffman forest of ${plural(n, 'tree')}, lightest first.`,
  /** @param {string} name @param {number} weight @param {string} code @param {string} state */
  nodeLabel: (name, weight, code, state) =>
    `${name}, weight ${weight}${code ? `, code ${code}` : ''}${state ? `, ${state}` : ''}`,
  legend: {
    picked: 'One of the two lightest',
    made: 'Merged node',
    path: 'Path to the leaf whose code is read',
    coded: 'Leaf with its code',
  },
  markers: { picked: '↓', made: '+', path: '→', coded: '✓' },
  stats: {
    merges: 'Merges',
    bits: 'Huffman bits',
    fixed: 'Fixed-length bits',
    average: 'Bits per symbol',
  },
  queueTitle: 'Queue, lightest first',
  queueEmpty: 'empty',
  tableTitle: 'Codes',
  tableHead: { symbol: 'Symbol', freq: 'Count', code: 'Code', bits: 'Bits' },
  pending: '…',
  /** @param {number} width */
  fixedNote: (width) => `${width} bits each`,
  practiceTitle: 'Check yourself',
  /** @param {HuffFrame} f */
  describe(f) {
    const leafCount = f.nodes.filter((n) => n.left < 0).length;
    switch (f.kind) {
      case 'start':
        return `${plural(leafCount, 'symbol')}, each a one-leaf tree in the queue, lightest first: ${f.queue.map((id) => tree(f, id)).join(', ')}.`;
      case 'pick': {
        const [x, y] = f.picked;
        return `Take the two lightest trees: ${tree(f, x)} and ${tree(f, y)}.`;
      }
      case 'merge': {
        const z = f.nodes[f.made];
        return `Merge them under a node of weight ${z.weight}: left edge 0, right edge 1. Every symbol below it gets one bit longer, which adds ${z.weight} bits. ${plural(f.queue.length, 'tree')} left.`;
      }
      case 'code': {
        const leaf = f.nodes[f.leaf];
        const code = f.codes[f.leaf];
        return `${leaf.symbol}: follow the edges from the root to read ${code}, ${plural(code.length, 'bit')} × ${leaf.weight} = ${code.length * leaf.weight} bits.`;
      }
      case 'done': {
        const total = f.nodes.filter((n) => n.left < 0).reduce((s, n) => s + n.weight, 0);
        const width = Math.ceil(Math.log2(leafCount));
        return `Done: ${f.cost} bits in all, ${twoPlaces(f.cost / total)} bits per symbol on average, against ${width * total} bits for a fixed ${width}-bit code. No prefix-free code does better.`;
      }
    }
  },
  twoPlaces,
  takeaways: [
    'A prefix-free code is a binary tree with the symbols at the leaves: a code is the path from the root, 0 for left and 1 for right. Because no symbol sits on another’s path, a bit string decodes from left to right with no separators.',
    'The cost of a code is Σ frequency × code length. Each merge pushes every symbol under the new node one level deeper, so the total is also the sum of the merged weights.',
    'Greedy choice: in some optimal tree the two least frequent symbols are siblings at the deepest level, since swapping a deeper symbol with a rarer one never adds bits. Merging them and solving the smaller problem is then safe, which is the exchange argument behind Huffman’s algorithm.',
    'With a min-heap the n − 1 merges cost O(n log n). Equal counts on a power-of-two number of symbols give a balanced tree, no better than a fixed-length code; skewed counts such as powers of two give codes of 1, 2, 3, … bits.',
    'Count “abracadabra”: Huffman needs 23 bits where a fixed 3-bit code needs 33. Then load “Four equal counts” and see both costs agree.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    ['Build the queue', 'O(n)', 'Heapify the n leaves.'],
    [
      'Merges',
      'O(n log n)',
      'n − 1 merges, each two extractMin and one insert on a heap of at most n trees.',
    ],
    ['Read the codes', 'O(n · L)', 'One walk from the root to each leaf; L is the longest code.'],
    ['Encode a text of m symbols', 'O(m · L)', 'Look up each symbol’s code and write its bits.'],
    ['Extra memory', 'O(n)', 'The tree has n leaves and n − 1 merged nodes.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Huffman’s algorithm runs on a:45, b:13, c:12, d:16, e:9, f:5. How many bits does the whole encoded text take?',
      answer: 224,
      unit: 'bits',
      hints: [
        'Add up the weights of every merged node.',
        'The merges make 14, 25, 30, 55 and 100.',
      ],
      solution:
        '14 + 25 + 30 + 55 + 100 = 224 bits, the same as Σ f · length: 45·1 + 13·3 + 12·3 + 16·3 + 9·4 + 5·4. A fixed 3-bit code needs 300.',
    },
    {
      type: 'number',
      prompt: 'How many bits does the Huffman code of “abracadabra” use for the whole word?',
      answer: 23,
      unit: 'bits',
      hints: [
        'The counts are a:5, b:2, r:2, c:1, d:1.',
        'Type abracadabra in the text field and step to the end.',
      ],
      solution:
        'The merges make 2 (c + d), 4 (b + r), 6 and 11, so the cost is 2 + 4 + 6 + 11 = 23 bits: a gets 1 bit, the other four 3 bits each. A fixed 3-bit code needs 11 × 3 = 33.',
    },
    {
      type: 'number',
      prompt:
        'In the textbook example a:45, b:13, c:12, d:16, e:9, f:5, how long is the code of f, the rarest symbol?',
      answer: 4,
      unit: 'bits',
      hints: [
        'f is in the very first merge, and in every merge above it.',
        'Count the merges on the path from f up to the root.',
      ],
      solution:
        'f joins e (14), then d (30), then the 25 tree (55), then a (100): four edges, so its code 1100 has 4 bits.',
    },
    {
      type: 'text',
      prompt: 'With the prefix-free code a = 0, c = 100, b = 101, decode the bit string 0101100.',
      accept: ['abc'],
      hints: [
        'Read from the left and stop as soon as the bits so far form a code.',
        '0 is already a full code.',
      ],
      solution:
        '0 is a, then 101 is b, then 100 is c: abc. A prefix-free code never makes you guess where a code ends.',
    },
    {
      type: 'choice',
      prompt: 'Why does Huffman’s algorithm merge the two least frequent trees first?',
      options: [
        'They are the easiest to find in a queue',
        'Some optimal code makes them sibling leaves at the deepest level',
        'It keeps the tree balanced',
        'It makes every code the same length',
      ],
      answer: 1,
      hints: [
        'The deepest leaves get the longest codes.',
        'Think about which symbols should pay for long codes.',
      ],
      solution:
        'An exchange argument shows that swapping the two rarest symbols into the deepest sibling pair never adds bits, so some optimal tree has them as siblings. Merging them first is a safe greedy choice.',
    },
  ],
  nextTeaser:
    'Next up: Fractional knapsack and scheduling with deadlines, where ranking items by value per weight and jobs by profit is enough for the best answer.',
};
