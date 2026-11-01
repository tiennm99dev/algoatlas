/** @typedef {import('$lib/algo-engine/augmented-trees.js').AugFrame} AugFrame */
/** @typedef {import('$lib/algo-engine/augmented-trees.js').AugNode} AugNode */
/** @typedef {import('$lib/algo-engine/augmented-trees.js').AugOp} AugOp */

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** @param {number} n */
const ordinal = (n) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
};

/** @param {number} lo @param {number} hi */
const span = (lo, hi) => `[${lo}, ${hi}]`;
/** @param {AugNode} n */
const nodeSpan = (n) => span(n.key, n.high);
/** @param {AugFrame} f */
const querySpan = (f) => {
  const op = /** @type {{ key: number, high: number }} */ (f.op);
  return span(op.key, op.high);
};

/**
 * The sentences a rotation shares in both trees.
 * @param {AugFrame} f
 * @param {(n: AugNode) => string} name
 * @param {(n: AugNode) => string} field
 */
function rotation(f, name, field) {
  const up = f.nodes[f.moved];
  const down = f.nodes[f.sunk];
  const head = f.prepares
    ? `First half of ${f.imbalance}: rotate ${f.direction} at ${name(down)} to straighten the bend.`
    : `Balance is broken (${f.imbalance}): rotate ${f.direction} at ${name(down)}.`;
  return `${head} Only two nodes need recomputing: ${name(up)} now has ${field(up)} and ${name(down)} has ${field(down)}.`;
}

export const en = {
  slug: 'augmented-trees',
  topic: 'balanced-bst',
  level: 'Advanced',
  title: 'Ordered maps and augmented trees',
  intro:
    'An ordered map keeps its keys sorted, so it can answer “what is next?” as well as “is it here?”. Store one small extra field in each node of a balanced tree and it answers more: subtree sizes give the k-th smallest key and the rank of a key, and the largest endpoint in each subtree finds overlapping intervals. Each query walks one path, so it stays O(log n).',
  summary:
    'Store subtree sizes in a balanced tree to answer rank and k-th smallest queries in O(log n), and store maximum endpoints to find overlapping intervals.',
  instruction:
    'Each node shows its size. Step through the queries, watching k shrink and the bracket over the sorted keys grow. Type a key, then insert, delete, ask for its rank or use it as k. Then switch to the interval tree and try the “Long interval” preset.',
  modeLabel: 'Augmentation',
  modes: { order: 'Subtree sizes', interval: 'Interval tree' },
  keyLabel: 'Key or k',
  lowLabel: 'Low',
  highLabel: 'High',
  insert: 'Insert',
  remove: 'Delete',
  rank: 'Rank of key',
  select: 'k-th smallest',
  overlap: 'Find overlap',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  orderPresets: {
    queries: 'Rank and select',
    rotations: 'Sorted keys, with rotations',
    scores: 'Scoreboard',
    random: 'Random',
  },
  intervalPresets: {
    textbook: 'Ten intervals',
    long: 'Long interval',
    rotations: 'Sorted lows, with rotations',
    random: 'Random',
  },
  fullKeys: 'The tree is full (15 keys).',
  fullIntervals: 'The tree is full (10 intervals).',
  logFull: 'The log is full (20 operations). Undo or reset to continue.',
  keyError: 'Use a whole number from 0 to 99.',
  orderError: 'The low endpoint cannot be above the high endpoint.',
  emptyTree: 'The tree is empty.',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'current operation',
  /** @param {AugOp} op */
  opChip: (op) => {
    const at = 'high' in op ? span(op.key, op.high) : String(op.key);
    return op.type === 'insert'
      ? `insert ${at}`
      : op.type === 'delete'
        ? `delete ${at}`
        : op.type === 'select'
          ? `select(${op.key})`
          : op.type === 'rank'
            ? `rank(${op.key})`
            : `overlap ${at}`;
  },
  stats: {
    comparisons: 'Nodes inspected (this operation)',
    updates: 'Nodes recomputed (this operation)',
    rotations: 'Rotations (all)',
    height: 'Height',
    keys: 'Keys',
    intervals: 'Intervals',
    answer: 'Answer',
  },
  noAnswer: '—',
  noOverlap: 'none',
  sortedTitle: 'The same keys in sorted order',
  sortedNote: 'The number above each key is its rank.',
  countedLabel: 'before the answer',
  pointerX: 'x',
  pointerGap: 'gap',
  /** @param {number[]} keys */
  sortedLabel: (keys) => `Sorted keys: ${keys.join(', ') || 'none'}.`,
  /** @param {number} rank @param {number} key @param {string} state */
  sortedCell: (rank, key, state) => `Rank ${rank}, key ${key}${state ? `, ${state}` : ''}`,
  lineTitle: 'The same intervals on a number line',
  lineQuery: 'query',
  /** @param {string[]} spans @param {string | null} query */
  lineLabel: (spans, query) =>
    `Intervals on a number line from 0 to 99: ${spans.join(', ') || 'none'}.${query ? ` Query ${query}.` : ''}`,
  /** @param {number} lo @param {number} hi */
  span,
  /** @param {number} lo @param {number} hi */
  nodeText: (lo, hi) => `${lo}–${hi}`,
  /** @param {number} size */
  sizeNote: (size) => `size ${size}`,
  /** @param {number} max */
  maxNote: (max) => `max ${max}`,
  /** @param {number[]} keys @param {number} h */
  treeLabel: (keys, h) =>
    `Order-statistic tree with ${plural(keys.length, 'key')}, height ${h}. In order: ${keys.join(', ') || 'none'}.`,
  /** @param {string[]} spans @param {number} h */
  intervalTreeLabel: (spans, h) =>
    `Interval tree with ${plural(spans.length, 'interval')}, height ${h}. In order: ${spans.join(', ') || 'none'}.`,
  /** @param {string} name @param {string} note @param {string} state */
  nodeLabel: (name, note, state) => `${name}, ${note}${state ? `, ${state}` : ''}`,
  roles: {
    compare: 'inspected',
    path: 'on the path',
    added: 'new',
    retrace: 'recomputing',
    up: 'rotated up',
    down: 'rotated down',
    successor: 'successor',
    answer: 'answer',
  },
  markers: {
    compare: '?',
    path: '',
    added: '+',
    retrace: '✓',
    up: '↑',
    down: '↓',
    successor: 'S',
    answer: '★',
  },
  /** @param {AugFrame} f */
  describeOrder(f) {
    const key = f.op?.key ?? 0;
    const cur = f.current >= 0 ? f.nodes[f.current] : null;
    const at = cur?.key ?? null;
    /** @param {number} s */
    const sz = (s) => (s === -1 ? 0 : f.nodes[s].size);
    const leftSize = cur ? sz(cur.left) : 0;
    switch (f.kind) {
      case 'start':
        return en.emptyTree;
      case 'go-left':
        return `${key} < ${at}, so go left.`;
      case 'go-right':
        return `${key} > ${at}, so go right.`;
      case 'attach':
        return `Attach ${key} as a leaf with size 1. Every size above it is now one too small, so walk back up.`;
      case 'found':
        return `Found ${key}, the node to delete.`;
      case 'missing':
        return `${key} is not in the tree, so nothing changes.`;
      case 'dup':
        return `${key} is already in the tree, so the insert is ignored and no size changes.`;
      case 'successor':
        return `Two children: the successor is the smallest key on the right, which is ${f.nodes[f.succ].key}.`;
      case 'copy':
        return `Copy the successor ${f.nodes[f.succ].key} into the node that held ${key}. Its old node is removed next.`;
      case 'unlink':
        return 'The node is unlinked. Every size above it is now one too big, so walk back up.';
      case 'retrace': {
        const n = /** @type {AugNode} */ (cur);
        return `At ${at}: size = 1 + ${sz(n.left)} + ${sz(n.right)} = ${n.size}.`;
      }
      case 'rotate':
        return rotation(
          f,
          (n) => String(n.key),
          (n) => `size ${n.size}`,
        );
      case 'select-range':
        return `There is no ${ordinal(Math.max(key, 0))} smallest key: the root’s size says the tree holds ${plural(f.size, 'key')}. No walk is needed.`;
      case 'select-begin':
        return `Find the ${ordinal(key)} smallest key, starting at the root with k = ${key}.`;
      case 'select-left':
        return `At ${at}: s = ${leftSize} + 1 = ${f.s}. k = ${f.remaining} < ${f.s}, so the answer is on the left and k stays ${f.remaining}.`;
      case 'select-right':
        return `At ${at}: s = ${leftSize} + 1 = ${f.s}. k = ${f.remaining + f.s} > ${f.s}, so skip those ${f.s} keys: k = ${f.remaining + f.s} − ${f.s} = ${f.remaining}, and go right.`;
      case 'select-found':
        return `At ${at}: s = ${leftSize} + 1 = ${f.s}, which equals k. The ${ordinal(key)} smallest key is ${f.result}.`;
      case 'rank-begin':
        return `Find the rank of ${key}, starting at the root with r = 1.`;
      case 'rank-left':
        return `${key} < ${at}: ${at} and everything to its right are larger, so count nothing and go left.`;
      case 'rank-right':
        return `${key} > ${at}: ${at} and its ${plural(leftSize, 'left key')} are all smaller, so add ${leftSize + 1}. Now r = ${f.counted + 1}. Go right.`;
      case 'rank-found':
        return `Found ${key}. Its ${plural(leftSize, 'left key')} ${leftSize === 1 ? 'is' : 'are'} smaller too, so the rank is ${f.result}.`;
      case 'rank-missing':
        return `${key} is not in the tree, but the count still works: ${plural(f.counted, 'key')} ${f.counted === 1 ? 'is' : 'are'} smaller, so it would have rank ${f.result}.`;
      case 'done':
        return f.size === 0
          ? en.emptyTree
          : `The tree has ${plural(f.size, 'key')} and height ${f.height}, and every stored size is correct.`;
      default:
        return '';
    }
  },
  /** @param {AugFrame} f */
  describeInterval(f) {
    const cur = f.current >= 0 ? f.nodes[f.current] : null;
    const at = cur ? nodeSpan(cur) : '';
    const op = /** @type {{ key: number, high: number }} */ (f.op ?? { key: 0, high: 0 });
    const asked = span(op.key, op.high);
    const left = cur && cur.left !== -1 ? f.nodes[cur.left] : null;
    switch (f.kind) {
      case 'start':
        return en.emptyTree;
      case 'go-left':
        return `${asked} sorts before ${at}, by low endpoint and then high, so go left.`;
      case 'go-right':
        return `${asked} sorts after ${at}, by low endpoint and then high, so go right.`;
      case 'attach':
        return `Attach ${asked} as a leaf with max ${op.high}. The maxes above it may now be too small, so walk back up.`;
      case 'found':
        return `Found ${asked}, the node to delete.`;
      case 'missing':
        return `${asked} is not in the tree. Delete needs the exact interval, so nothing changes.`;
      case 'dup':
        return `${asked} is already in the tree, so the insert is ignored.`;
      case 'successor':
        return `Two children: the successor is the next interval in order, ${nodeSpan(f.nodes[f.succ])}.`;
      case 'copy':
        return `Copy the successor ${nodeSpan(f.nodes[f.succ])} into the node that held ${asked}. Its old node is removed next.`;
      case 'unlink':
        return 'The node is unlinked. The maxes above it may now be too big, so walk back up.';
      case 'retrace': {
        const n = /** @type {AugNode} */ (cur);
        const parts = [n.high];
        if (n.left !== -1) parts.push(f.nodes[n.left].max);
        if (n.right !== -1) parts.push(f.nodes[n.right].max);
        return `At ${at}: max = largest of ${parts.join(', ')} = ${n.max}.`;
      }
      case 'rotate':
        return rotation(f, nodeSpan, (n) => `max ${n.max}`);
      case 'overlap-begin':
        return `Look for any interval that overlaps ${querySpan(f)}, starting at the root.`;
      case 'overlap-check': {
        const n = /** @type {AugNode} */ (cur);
        const why =
          n.high < op.key
            ? `it ends at ${n.high}, before ${op.key}`
            : `it starts at ${n.key}, after ${op.high}`;
        return `${at} does not overlap ${querySpan(f)}: ${why}.`;
      }
      case 'overlap-left':
        return `The left subtree’s max is ${left?.max} ≥ ${op.key}, so go left. If nothing overlaps there, nothing overlaps on the right either.`;
      case 'overlap-right':
        return left
          ? `The left subtree’s max is ${left.max} < ${op.key}: everything there ends before the query starts, so go right.`
          : 'There is no left subtree, so go right.';
      case 'overlap-found':
        return `${at} overlaps ${querySpan(f)}: ${cur?.key} ≤ ${op.high} and ${op.key} ≤ ${cur?.high}. Found after ${plural(f.comparisons, 'inspection')}.`;
      case 'overlap-none':
        return `The walk left the tree after ${plural(f.comparisons, 'inspection')}, so no interval overlaps ${querySpan(f)}.`;
      case 'done':
        return f.size === 0
          ? en.emptyTree
          : `The tree has ${plural(f.size, 'interval')} and height ${f.height}, and every stored max is correct.`;
      default:
        return '';
    }
  },
  takeaways: [
    'An ordered map (Java’s TreeMap, C++’s std::map) is a balanced tree underneath. Keeping keys sorted is what buys floor, ceiling, in-order scans and range queries, which a hash table cannot do.',
    'Store size in each node. For select, s = size(left) + 1 is the current node’s position within its subtree: stop if k = s, go left if k < s, otherwise subtract s from k and go right. Rank adds s every time the walk turns right.',
    'A field can be kept up to date cheaply when it depends only on the node and its two children. Each change touches one path, and a rotation recomputes just two nodes, so inserts and deletes stay O(log n). A node’s rank cannot be stored this way: inserting a new smallest key would change every rank.',
    'An interval tree orders intervals by low endpoint and stores the largest high endpoint in each subtree. If left.max ≥ lo, going left is safe: when the left has no overlap, the interval reaching left.max must start after the query ends, and everything to the right starts later still.',
    'Try the “Long interval” preset: the only match for [80, 85] is [10, 90], far to the left by low endpoint, and the stored max leads straight to it. Then count how many keys of “Rank and select” lie in a range, using two rank queries.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Select, rank', 'O(log n)', 'One root-to-leaf path, with one size read per node.'],
    ['Size of the whole tree', 'O(1)', 'It is the size stored at the root.'],
    [
      'Insert, delete',
      'O(log n)',
      'The balanced tree’s own work, plus one recomputation per ancestor.',
    ],
    ['One rotation', 'O(1)', 'Two nodes are recomputed from their children.'],
    ['Find one overlap', 'O(log n)', 'The stored max decides the direction at each node.'],
    [
      'Find all k overlaps',
      'O(min(n, k log n))',
      'Repeat the search, removing each match, or prune a full walk with the stored max.',
    ],
    ['Memory', 'O(n)', 'One node per key, with one extra number each.'],
  ],
  nextTeaser:
    'Next up: Practice: balanced tree problems, where you run the same operations through a plain BST, an AVL tree and a skip list and compare the cost.',
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load “Rank and select”, which builds the tree of 10, 20, …, 70 with 40 at the root. Run select(6). What is k after leaving the root?',
      answer: 2,
      hints: ['At the root, s = size(left) + 1.', 'The left subtree holds 3 keys, so s = 4.'],
      solution:
        's = 3 + 1 = 4. Since 6 > 4, those 4 keys are skipped and the walk goes right with k = 6 − 4 = 2.',
    },
    {
      type: 'number',
      prompt: 'Which key does that select(6) return?',
      answer: 60,
      hints: ['At 60 the left subtree holds 1 key, so s = 2.'],
      solution:
        'At 60, s = 1 + 1 = 2, which equals k = 2, so select(6) returns 60. The sixth of 10, 20, 30, 40, 50, 60, 70 is indeed 60.',
    },
    {
      type: 'number',
      prompt: 'In the same tree, what does rank(45) return? The key 45 is not in the tree.',
      answer: 5,
      hints: [
        'Rank is 1 plus the number of smaller keys.',
        'Run it and watch r at each right turn.',
      ],
      solution:
        'At 40 the walk turns right and adds 3 + 1 = 4, so r = 5. It then goes left at 60 and at 50 without adding anything, and leaves the tree with r = 5. The keys 10, 20, 30, 40 are smaller.',
    },
    {
      type: 'number',
      prompt:
        'In that tree, how many keys lie in the range 25 to 55? Use two rank queries instead of walking the keys.',
      answer: 3,
      unit: 'keys',
      hints: [
        'Count the keys below 56, then take away the keys below 25.',
        'rank(x) − 1 is the number of keys below x.',
      ],
      solution:
        'rank(56) = 6 and rank(25) = 3, and 6 − 3 = 3. The keys are 30, 40 and 50. Each rank is O(log n), so a range count is too, however many keys the range holds.',
    },
    {
      type: 'number',
      prompt:
        'Load “Sorted keys, with rotations”. When 30 goes in, the first rotation lifts 20. How many nodes does that rotation recompute?',
      answer: 2,
      unit: 'nodes',
      hints: ['Step to the rotation and read the narration.'],
      solution:
        'Only 20 and 10 change children, so only their sizes are recomputed. The subtree above sees the same set of keys, so its size is unchanged.',
    },
    {
      type: 'multi',
      prompt: 'Which of these can a node store and keep correct in O(log n) per insert or delete?',
      options: [
        'The number of keys in its subtree',
        'The sum of the keys in its subtree',
        'The largest high endpoint in its subtree',
        'Its rank in the whole tree',
        'Its depth from the root',
      ],
      answers: [0, 1, 2],
      hints: [
        'Ask whether the value can be computed from the node and its two children alone.',
        'What happens to every rank when a new smallest key is inserted? What happens to depths after a rotation at the root?',
      ],
      solution:
        'Size, sum and max depend only on a node and its children, so one path and a few rotations are all that need recomputing. A new smallest key changes every rank, and a rotation changes the depth of a whole subtree, so those two can need O(n) updates.',
    },
    {
      type: 'text',
      prompt:
        'Load “Long interval” and run the first query, [80, 85]. Which interval does it find? Write it as low, high.',
      accept: ['10, 90', '[10, 90]', '10 90', '10-90', '10–90', '10 to 90', '(10, 90)'],
      hints: ['Follow the max values: the root’s left child has max 90.'],
      solution:
        'At [40, 45] the left max is 90 ≥ 80, so go left. At [20, 25] the left max is again 90, so go left, reaching [10, 90], which overlaps [80, 85].',
    },
    {
      type: 'choice',
      prompt:
        'At a node that does not overlap the query, left.max ≥ lo. Why can the search safely skip the right subtree if the left has no overlap?',
      options: [
        'Because every interval on the right is shorter',
        'Because the interval reaching left.max must start after the query ends, and everything on the right starts later still',
        'Because the right subtree’s max is always smaller than the left’s',
        'Because a balanced tree has at most one overlap',
      ],
      answer: 1,
      hints: [
        'Take the left interval whose high equals left.max. It reaches lo but does not overlap. What does that say about its low?',
      ],
      solution:
        'That interval ends at or after lo yet does not overlap, so its low must be above hi. Lows are sorted, so everything on the right also starts above hi and cannot overlap either.',
    },
    {
      type: 'number',
      prompt:
        'Load “Long interval”, then delete [10, 90] (low 10, high 90). What is the root’s max now?',
      answer: 75,
      hints: ['Only the path from that node to the root needs recomputing.'],
      solution:
        'The left side now reaches only 35, and the right subtree’s max is 75 from [70, 75]. The root’s own high is 45, so its max is the largest of 45, 35 and 75, which is 75.',
    },
  ],
};
