/** @typedef {import('$lib/algo-engine/segment-tree.js').SegFrame} SegFrame */
/** @typedef {import('$lib/algo-engine/segment-tree.js').SegMerge} SegMerge */
/** @typedef {import('$lib/algo-engine/segment-tree.js').SegOp} SegOp */
/** @typedef {import('$lib/algo-engine/segment-tree.js').SegSpan} SegSpan */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** A value with a Unicode minus, and the identities of min and max as infinities. @param {number} x */
const show = (x) => {
  if (x === Infinity) return '+∞';
  if (x === -Infinity) return '−∞';
  return x < 0 ? `−${-x}` : String(x);
};

/** @param {number} lo @param {number} hi */
const range = (lo, hi) => `[${lo}, ${hi}]`;

export const en = {
  slug: 'segment-tree',
  topic: 'range-queries',
  level: 'Intermediate',
  title: 'Segment tree',
  intro:
    'A segment tree is a binary tree of ranges: the root covers the whole array, each node splits its range in half, and each leaf is one value. Every node stores the merge of its range. Any query range breaks into at most two nodes per level, so range queries and point updates both take O(log n).',
  summary:
    'Drag a range and watch a segment tree answer it from a few stored nodes, with any merge function, then update one value along one path.',
  instruction:
    'Drag across the array to choose a range: the nodes that answer it light up with a tick. Use Replay query to step through the recursion. Change the merge to Min or Max, or set one value and watch a single path recompute.',
  mergeLegend: 'Merge',
  merges: /** @type {Record<SegMerge, string>} */ ({ sum: 'Sum', min: 'Min', max: 'Max' }),
  valuesLabel: 'Values',
  indexLabel: 'Index i',
  valueLabel: 'New value',
  setButton: 'Set a[i]',
  undo: 'Undo last',
  reset: 'Reset',
  replay: 'Replay query',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 3, −1, 4.',
    range: 'Every value must be from −99 to 99.',
    count: 'Type from 1 to 12 values.',
  },
  /** @param {number} n */
  indexError: (n) => `The index must be a whole number from 0 to ${n - 1}.`,
  valueError: 'The new value must be a whole number from −99 to 99.',
  logFull: 'The log is full (8 operations). Undo or reset to continue.',
  /** @param {number} i */
  pickFirst: (i) => `Range starts at ${i}. Pick the cell where it ends.`,
  dragTitle: 'Array a: drag to choose the query range',
  dragAria: 'Array a. Drag across the cells, or press Enter on two cells, to choose a range.',
  dragHint: 'Keyboard: arrow keys move, Enter on one cell starts the range and on another ends it.',
  treeScroller: 'Tree drawing, scrolls sideways',
  treeTitle: 'Segment tree: each node shows its value and its range',
  /** @param {SegFrame} f */
  treeAria: (f) =>
    `Segment tree over ${f.items.length} values with ${f.merge}. The root stores ${f.tree[1] === null ? 'nothing yet' : show(f.tree[1])}.`,
  unbuilt: '·',
  show,
  /** @param {number} i @param {number} v */
  cellLabel: (i, v) => `a[${i}] = ${show(v)}`,
  /** @param {number} lo @param {number} hi @param {string} value @param {string} state */
  nodeLabel: (lo, hi, value, state) =>
    `Node over ${range(lo, hi)}, value ${value}${state ? `, ${state}` : ''}`,
  /** @param {SegOp} op */
  opChip: (op) => (op.type === 'query' ? `query(${op.l}, ${op.r})` : `set(${op.i}, ${show(op.x)})`),
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  markers: { cover: '✓', split: '↓', outside: '✕', write: '✎', merge: 'm' },
  states: {
    cover: 'fully inside, answers the query',
    split: 'partly inside, split',
    outside: 'outside the range',
    written: 'value written',
    merged: 'merging its children',
  },
  legend: {
    cover: '✓ Fully inside: use its value',
    split: '↓ Partly inside: split',
    outside: '✕ Outside: identity',
    write: '✎ Value written',
    merge: 'm Merging its children',
  },
  stats: {
    visits: 'Nodes visited (this operation)',
    merges: 'Merges (this operation)',
    naive: 'Reads by scanning the range',
    result: 'Query answer',
  },
  pending: '—',
  /** @param {SegSpan[]} spans @param {(number|null)[]} tree @param {SegMerge} merge */
  coverLine: (spans, tree, merge) =>
    `Cover: ${spans.map((s) => `${range(s.lo, s.hi)} = ${show(/** @type {number} */ (tree[s.v]))}`).join(', ')}. ${en.merges[merge]} of these ${plural(spans.length, 'node')}.`,
  practiceTitle: 'Check yourself',
  /** @param {SegFrame} f */
  describe(f) {
    const span = f.spans.find((s) => s.v === f.node);
    const here = span ? range(span.lo, span.hi) : '';
    const op = f.op;
    const asked = op?.type === 'query' ? range(op.l, op.r) : '';
    switch (f.kind) {
      case 'start':
        return `Build bottom-up over ${plural(f.items.length, 'value')} with ${f.merge}: leaves copy the array, and each parent merges its two children.`;
      case 'build-leaf':
        return `Leaf ${here} copies the value ${show(/** @type {number} */ (f.value))}.`;
      case 'build-pull':
        return `Node ${here} = ${f.merge}(left child, right child) = ${show(/** @type {number} */ (f.value))}.`;
      case 'split':
        return `Node ${here} is only partly inside ${asked}, so its stored value cannot be used. Split it.`;
      case 'outside':
        return `Node ${here} is outside ${asked}: return the identity ${show(/** @type {number} */ (f.value))}, which changes nothing.`;
      case 'cover':
        return `Node ${here} is fully inside ${asked}: return its value ${show(/** @type {number} */ (f.value))} without going deeper.`;
      case 'return':
        return `Node ${here} merges what its children returned: ${show(/** @type {number} */ (f.value))}.`;
      case 'answer':
        return `query${asked} = ${show(/** @type {number} */ (f.result))}, from ${plural(f.covered.length, 'covering node')} and ${plural(f.visits, 'visit')}.`;
      case 'descend':
        return `Index ${op?.type === 'set' ? op.i : 0} is in ${here}. Go down to the child whose range holds it.`;
      case 'write':
        return `Leaf ${here} takes the new value ${show(/** @type {number} */ (f.value))}.`;
      case 'pull':
        return `Back up: node ${here} merges its children again and now stores ${show(/** @type {number} */ (f.value))}. Other branches keep their values.`;
      case 'done':
        return `Done: all operations ran. The root stores ${show(/** @type {number} */ (f.tree[1]))}.`;
    }
  },
  takeaways: [
    'Each node stores the merge of its range, and each split goes at mid = ⌊(lo + hi) / 2⌋. For n values there are 2n − 1 nodes, and the build merges n − 1 times.',
    'A query meets three cases: outside the range (return the identity), fully inside (return the stored value and stop), or partly inside (split and merge).',
    'The fully-inside nodes form the range’s cover: at most two per level, so about 2 log₂ n. Only the two boundary paths go deep, which makes a query O(log n).',
    'The merge can be any associative function with an identity: sum with 0, min with +∞, max with −∞, gcd with 0. The order of children is kept, so it need not be commutative.',
    'Try dragging the full array: only the root is visited. Then drag from 1 to the second-to-last cell, the costly shape, and compare the visits with the reads a scan would make.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Build', 'O(n)', '2n − 1 nodes, one constant-time merge per inner node.'],
    [
      'Range query',
      'O(log n)',
      'At most four nodes per level are visited, in a tree of height about log₂ n.',
    ],
    [
      'Point update',
      'O(log n)',
      'One root-to-leaf path recomputes; other nodes do not contain the index.',
    ],
    ['Memory', 'O(n)', '2n − 1 nodes; the array form reserves 4n slots to fit any n.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'How many nodes does a segment tree over 8 values have?',
      unit: 'nodes',
      answer: 15,
      hints: ['There are 8 leaves. Each inner node merges two children.'],
      solution: '8 leaves + 7 inner nodes = 2n − 1 = 15.',
    },
    {
      type: 'number',
      prompt: 'With a = [2, 5, 1, 4, 9, 3, 7, 6] and Sum, what does the node over [4, 7] store?',
      answer: 25,
      hints: ['It stores the sum of a[4], a[5], a[6] and a[7].'],
      solution: '9 + 3 + 7 + 6 = 25.',
    },
    {
      type: 'number',
      prompt: 'Same array. How many nodes form the cover of the query [1, 6]?',
      unit: 'nodes',
      answer: 4,
      hints: [
        'A node is used only if it is fully inside [1, 6] and its parent is not.',
        'Look at [1], [2, 3], [4, 5] and [6].',
      ],
      solution:
        'The cover is [1], [2, 3], [4, 5] and [6]: four nodes. Their sums are 5 + 5 + 12 + 7 = 29. Drag this range in the widget to check.',
    },
    {
      type: 'number',
      prompt: 'Same array, now with Min. What does the query [1, 6] return?',
      answer: 1,
      hints: ['The tree is built with the new merge. The range holds 5, 1, 4, 9, 3, 7.'],
      solution: 'The cover nodes store 5, 1, 3 and 7, and the smallest is 1.',
    },
    {
      type: 'number',
      prompt: 'Same array with Sum. Setting a[4] = 0 recomputes how many nodes, leaf included?',
      unit: 'nodes',
      answer: 4,
      hints: ['Only nodes whose range contains index 4 change.'],
      solution:
        'The path is [0, 7], [4, 7], [4, 5] and [4]: 4 nodes, one per level. The root drops from 37 to 28.',
    },
    {
      type: 'text',
      prompt: 'With Min as the merge, what should a node outside the query range return?',
      accept: ['+∞', '∞', 'infinity', '+infinity', 'positive infinity', 'inf', '+inf'],
      hints: ['It must leave the other side of min(x, ?) unchanged for every x.'],
      solution: 'min(x, +∞) = x for every x, so +∞ is the identity of min.',
    },
    {
      type: 'multi',
      prompt: 'Which of these can be a segment tree merge?',
      options: [
        'Greatest common divisor',
        'Average of the two children',
        'Maximum',
        '2 × 2 matrix product',
      ],
      answers: [0, 2, 3],
      hints: [
        'The merge must be associative: grouping must not change the result.',
        'Average of average of (1, 2) and 3 is not the average of 1 and the average of (2, 3).',
      ],
      solution:
        'Gcd, max and matrix product are associative. Matrix product is not commutative, which is fine because the left child stays on the left. An average of two averages depends on the grouping, so a node would need to store a sum and a count instead.',
    },
  ],
  nextTeaser:
    'Next up: Lazy propagation, where one update changes a whole range and each node postpones the work until a query needs it.',
};
