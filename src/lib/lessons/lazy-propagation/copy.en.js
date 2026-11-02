/** @typedef {import('$lib/algo-engine/lazy-propagation.js').LazyFrame} LazyFrame */
/** @typedef {import('$lib/algo-engine/lazy-propagation.js').LazyOp} LazyOp */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** A signed number with a Unicode minus. @param {number} x */
const show = (x) => (x < 0 ? `−${-x}` : String(x));

/** An increment with its sign always shown. @param {number} x */
const plusMinus = (x) => (x < 0 ? `−${-x}` : `+${x}`);

/** @param {number} lo @param {number} hi */
const range = (lo, hi) => `[${lo}, ${hi}]`;

export const en = {
  slug: 'lazy-propagation',
  topic: 'range-queries',
  level: 'Advanced',
  title: 'Lazy propagation',
  intro:
    'A plain segment tree changes one value at a time, so adding to a whole range would touch up to 2n − 1 nodes. Lazy propagation stops at the nodes that fit inside the range and leaves a tag saying “your children still owe this”. The tag moves down only when a later operation needs to go below that node, so range updates and range queries both take O(log n).',
  summary:
    'Add to whole ranges in O(log n) by leaving pending tags on a segment tree, and watch them push down only when a query needs to go deeper.',
  instruction:
    'Choose a range by clicking two cells or typing l and r, then press Add x to range or Query sum and step through. A number at a node’s corner is its pending tag. Compare the true array with the leaves: they drift apart until a query pushes the tags down.',
  valuesLabel: 'Values',
  lLabel: 'From l',
  rLabel: 'To r',
  xLabel: 'Add x',
  queryButton: 'Query sum',
  addButton: 'Add x to range',
  undo: 'Undo last',
  reset: 'Reset',
  valueErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 3, −1, 4.',
    range: 'Every value must be from −99 to 99.',
    count: 'Type from 1 to 12 values.',
  },
  /** @param {number} n */
  rangeError: (n) => `l and r must be whole numbers with 0 ≤ l ≤ r ≤ ${n - 1}.`,
  xError: 'x must be a whole number from −99 to 99.',
  logFull: 'The log is full (8 operations). Undo or reset to continue.',
  pickHint: 'Click a cell to start a range, then another to end it. Enter works too.',
  /** @param {number} i */
  pickFirst: (i) => `Range starts at ${i}. Pick the cell where it ends.`,
  /** @param {number} l @param {number} r */
  picked: (l, r) => `Range set to ${range(l, r)}. Now press Query sum or Add x to range.`,
  treeScroller: 'Tree drawing, scrolls sideways',
  treeTitle: 'Segment tree: sum inside, range below, pending tag at the corner',
  /** @param {number} n @param {number} waiting */
  treeAria: (n, waiting) =>
    `Segment tree over ${plural(n, 'value')}, with ${plural(waiting, 'pending tag')}.`,
  arrayTitle: 'The array as it truly is',
  arrayAria: 'The true array, index 0 first',
  leavesTitle: 'What the leaves store right now',
  /** @param {number} stale */
  leavesAria: (stale) =>
    `The tree’s leaves, index 0 first. ${plural(stale, 'leaf is', 'leaves are')} behind.`,
  unbuilt: '·',
  show,
  /** @param {number} tag */
  tagText: (tag) => plusMinus(tag),
  /** @param {string} name @param {number} i @param {number} v @param {string} state */
  cellLabel: (name, i, v, state) => `${name} ${i} = ${show(v)}${state ? `, ${state}` : ''}`,
  /** @param {number} lo @param {number} hi @param {string} value @param {number} tag @param {string} state */
  nodeLabel: (lo, hi, value, tag, state) =>
    `Node over ${range(lo, hi)}, sum ${value}${tag !== 0 ? `, pending tag ${plusMinus(tag)}` : ''}${state ? `, ${state}` : ''}`,
  /** @param {LazyOp} op */
  opChip: (op) =>
    op.type === 'add' ? `add(${op.l}, ${op.r}, ${show(op.x)})` : `query(${op.l}, ${op.r})`,
  /** @param {number} lo @param {number} hi @param {number} tag */
  pendingChip: (lo, hi, tag) => `${range(lo, hi)} ${plusMinus(tag)}`,
  pendingTitle: 'Pending tags',
  opsTitle: 'Operations',
  opsEmpty: 'none',
  opsHotLabel: 'running now',
  markers: { cover: '✓', split: '↓', outside: '✕', write: '✎', merge: 'm', push: '⇣', stale: '…' },
  states: {
    cover: 'fully inside the range',
    split: 'partly inside, split',
    outside: 'outside the range',
    written: 'value written',
    received: 'just received a tag',
    pushing: 'pushing its tag down',
    merged: 'adding its children',
    pending: 'tag waiting',
    stale: 'behind the true value',
  },
  legend: {
    pending: '+x Tag waiting; … leaf behind',
    cover: '✓ Fully inside',
    split: '↓ Partly inside',
    outside: '✕ Outside',
    merge: '⇣ Pushing; m adding children',
    write: '✎ Sum just written',
  },
  stats: {
    visits: 'Nodes visited',
    pushes: 'Push-downs',
    writes: 'Node sums changed',
    eager: 'Changes without tags',
    result: 'Query answer',
  },
  pending: '—',
  practiceTitle: 'Check yourself',
  /** @param {LazyFrame} f */
  describe(f) {
    const span = f.spans.find((s) => s.v === f.node);
    const here = span ? range(span.lo, span.hi) : '';
    const op = f.op;
    const asked = op ? range(op.l, op.r) : '';
    switch (f.kind) {
      case 'start':
        return `Build the sums over ${plural(f.items.length, 'value')}. No node has a tag yet.`;
      case 'build-leaf':
        return `Leaf ${here} stores ${show(/** @type {number} */ (f.value))}.`;
      case 'build-pull':
        return `Node ${here} adds its children: ${show(/** @type {number} */ (f.value))}.`;
      case 'split':
        return f.tag[f.node] !== 0
          ? `Node ${here} is partly inside ${asked}, so the operation must go below it. Its tag ${plusMinus(f.tag[f.node])} has to move first.`
          : `Node ${here} is partly inside ${asked}. It holds no tag, so go straight to its children.`;
      case 'push': {
        const left = f.spans.find((s) => s.v === f.pushedTo[0]);
        const right = f.spans.find((s) => s.v === f.pushedTo[1]);
        return `Push ${plusMinus(f.pushed)} down: ${left ? range(left.lo, left.hi) : ''} and ${right ? range(right.lo, right.hi) : ''} take it, and this node’s tag clears. Only now do they see it.`;
      }
      case 'outside':
        return `Node ${here} is outside ${asked}: nothing to do here, and any tag it holds keeps waiting.`;
      case 'apply': {
        const x = op?.type === 'add' ? op.x : 0;
        const len = span ? span.hi - span.lo + 1 : 0;
        return len === 1
          ? `Leaf ${here} is inside ${asked}: its sum changes by ${plusMinus(x)}. A leaf has no children, so it needs no tag.`
          : `Node ${here} is fully inside ${asked}: its sum changes by ${plusMinus(x)} × ${len}, and its tag grows by ${plusMinus(x)}. Stop here: nothing below is touched.`;
      }
      case 'pull':
        return `Back up: node ${here} adds its children and now stores ${show(/** @type {number} */ (f.value))}.`;
      case 'cover':
        return f.tag[f.node] !== 0
          ? `Node ${here} is fully inside ${asked}: its sum ${show(/** @type {number} */ (f.value))} already includes its own tag, so no push is needed.`
          : `Node ${here} is fully inside ${asked}: return its sum ${show(/** @type {number} */ (f.value))}.`;
      case 'return':
        return `Node ${here} adds what its children returned: ${show(/** @type {number} */ (f.value))}.`;
      case 'answer':
        return `The sum of ${asked} is ${show(/** @type {number} */ (f.result))}, after ${plural(f.pushes, 'push', 'pushes')}. Tags elsewhere are still waiting.`;
      case 'done':
        return `Done: the updates changed ${plural(f.totalWrites, 'node sum')} in total; without tags they would have changed ${f.totalEager}.`;
    }
  },
  takeaways: [
    'A node fully inside an update changes its own sum by x · (hi − lo + 1) and adds x to its tag. It stops there, so at most about 2 log₂ n nodes take the change.',
    'A tag means “my sum is right, but my children have not received this yet”. A node’s sum already includes its own tag, so a query that stops at that node reads the right value without pushing.',
    'Push down before going below a node, in both updates and queries. Otherwise a child returns a stale sum, or the pull back up overwrites a change with stale values.',
    'After recursing, an update recomputes sum[v] from the children. Tags add up here, but other kinds need care: a “set range to x” tag overwrites a pending tag instead of adding to it.',
    'Try add(0, 7, 5) on 8 values: 1 node changes instead of 15, and every leaf falls behind the true array. Then query(5, 5) and watch tags move down one path while the left half keeps its tag.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Build', 'O(n)', '2n − 1 nodes, each computed once.'],
    [
      'Range add',
      'O(log n)',
      'At most four nodes per level are visited; only those change or push.',
    ],
    ['Range add without tags', 'O(n)', 'Every node that contains a value of the range changes.'],
    ['Range sum', 'O(log n)', 'The same walk, pushing tags on the way down.'],
    ['Push-down', 'O(1)', 'Two children change, and each needs one multiply and one add.'],
    ['Memory', 'O(n)', 'One sum and one tag per node.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'With 8 values, add(0, 7, 5) changes how many node sums?',
      unit: 'nodes',
      answer: 1,
      hints: ['The root covers the whole array, and it is fully inside the range.'],
      solution:
        'The root is fully inside, so it changes its sum and takes the tag +5. Nothing below is touched. Without tags, all 15 nodes would change.',
    },
    {
      type: 'number',
      prompt:
        'Start from a = [1, 2, 3, 4, 5, 6, 7, 8]. After add(0, 7, 5) and then add(4, 7, 2), what tag does the node over [4, 7] hold?',
      answer: 7,
      hints: [
        'The second update must go below the root, so the root pushes +5 to its children first.',
        'Then [4, 7] is fully inside the second update.',
      ],
      solution:
        'The push gives [4, 7] the tag +5. The second update then adds 2 to that tag: 5 + 2 = 7.',
    },
    {
      type: 'number',
      prompt: 'Same state. What sum does the node over [4, 7] store?',
      answer: 54,
      hints: ['Its original sum is 5 + 6 + 7 + 8 = 26.', 'Every one of its 4 values grew by 7.'],
      solution: '26 + 7 × 4 = 54.',
    },
    {
      type: 'number',
      prompt: 'Same state. How many push-downs does query(5, 5) make?',
      unit: 'pushes',
      answer: 2,
      hints: [
        'The walk goes root, [4, 7], [4, 5], [5].',
        'The root’s tag is 0 by now, and a leaf has nothing to push.',
      ],
      solution:
        'The root has no tag. [4, 7] pushes +7 to [4, 5] and [6, 7], and [4, 5] pushes +7 to its two leaves. That is 2 pushes, and the answer is 6 + 7 = 13.',
    },
    {
      type: 'choice',
      prompt:
        'A query stops at a node that is fully inside its range and holds a tag. What should it do?',
      options: [
        'Return its sum: the sum already includes its own tag',
        'Add tag × length to its sum, then return it',
        'Push the tag down first, then return its sum',
        'Walk down to the leaves and add them up',
      ],
      answer: 0,
      hints: ['When a node received the tag, what happened to its own sum?'],
      solution:
        'Applying a tag changes the node’s own sum at once. The tag is owed only to its children. Adding it again would count it twice, and pushing is needless work.',
    },
    {
      type: 'choice',
      prompt: 'Why must an update push a tag before going into the children?',
      options: [
        'Otherwise a child’s sum is out of date, and the pull back up would overwrite the parent with a wrong sum',
        'Because a tag can hold only one value',
        'Because the leaves must always match the true array',
        'To keep the tree balanced',
      ],
      answer: 0,
      hints: [
        'After recursing, sum[v] = sum[2v] + sum[2v + 1]. What if the children lack the tag?',
      ],
      solution:
        'The pull recomputes sum[v] from the children. If they still lack v’s tag, that total misses it. Leaves are allowed to lag behind, as the widget shows, as long as nodes above them hold the difference.',
    },
    {
      type: 'text',
      prompt: 'What is the cost of one range add with lazy propagation, in O notation?',
      accept: ['O(log n)', 'log n', 'Θ(log n)', 'O(logn)', 'logn'],
      hints: ['How many nodes per level does the walk visit?'],
      solution: 'At most four nodes per level over about log₂ n levels: O(log n).',
    },
  ],
  nextTeaser:
    'Next up: Sqrt decomposition and Mo’s algorithm, a simpler trade: split the array into blocks of about √n, and reorder queries when they can be answered offline.',
};
