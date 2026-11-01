/**
 * Two augmentations of one AVL tree. An order-statistic tree stores the size of each subtree,
 * which answers select (the k-th smallest, 1-based) and rank (1 plus the keys smaller than a
 * key) along one path. An interval tree is ordered by low endpoint, then high endpoint, and
 * stores the largest high endpoint of each subtree, which finds an overlapping closed interval
 * along one path. Both extra fields depend only on a node and its children, so the walk back up
 * after a change and each rotation refresh them in O(1) a node. Nodes live in slots that are
 * never reused, so a slot identifies a node across frames.
 */

export const MAX_KEYS = 15;
export const MAX_INTERVALS = 10;
export const MAX_OPS = 20;
export const MIN_KEY = 0;
export const MAX_KEY = 99;

export const orderPseudocode = [
  'insert / delete: walk down as in a BST and change one node',
  'walking back up, at each ancestor:',
  '  size = 1 + size(left) + size(right)',
  '  balance factor ±2: rotate and recompute the two moved sizes',
  'select(k): x = root (1 ≤ k ≤ size(root), else no such key)',
  '  s = size(x.left) + 1',
  '  k = s: return x',
  '  k < s: x = x.left',
  '  k > s: k = k − s, x = x.right',
  'rank(key): x = root, r = 1',
  '  key < x.key: x = x.left',
  '  key > x.key: r = r + size(x.left) + 1, x = x.right',
  '  key = x.key: return r + size(x.left)',
  '  x is empty: return r',
];

export const intervalPseudocode = [
  'insert / delete: walk down by low endpoint and change one node',
  'walking back up, at each ancestor:',
  '  max = largest of high, left.max, right.max',
  '  balance factor ±2: rotate and recompute the two moved maxes',
  'overlap(lo, hi): x = root',
  'while x exists and x does not overlap [lo, hi]:',
  '  x.left exists and x.left.max ≥ lo: x = x.left',
  '  otherwise: x = x.right',
  'return x (empty means nothing overlaps)',
];

/**
 * @typedef {object} OrderOp
 * @property {'insert'|'delete'|'select'|'rank'} type
 * @property {number} key  The key, or k for select.
 */

/**
 * @typedef {object} IntervalOp
 * @property {'insert'|'delete'|'overlap'} type
 * @property {number} key  Low endpoint.
 * @property {number} high  High endpoint, at least the low one.
 */

/** @typedef {OrderOp | IntervalOp} AugOp */

/**
 * @typedef {object} AugNode
 * @property {number} key  The key, or an interval's low endpoint.
 * @property {number} high  An interval's high endpoint; equals `key` in the order tree.
 * @property {number} left  Slot, -1 for none.
 * @property {number} right  Slot, -1 for none.
 * @property {number} height  As stored; ancestors of a change are stale until the walk back reaches them.
 * @property {number} size  As stored, likewise.
 * @property {number} max  As stored, likewise.
 */

/**
 * @typedef {object} AugFrame
 * @property {'start'|'go-left'|'go-right'|'attach'|'found'|'missing'|'dup'|'successor'|'copy'|'unlink'|'retrace'|'rotate'|'select-begin'|'select-range'|'select-left'|'select-right'|'select-found'|'rank-begin'|'rank-left'|'rank-right'|'rank-found'|'rank-missing'|'overlap-begin'|'overlap-check'|'overlap-left'|'overlap-right'|'overlap-found'|'overlap-none'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {AugOp | null} op
 * @property {AugNode[]} nodes
 * @property {number} root  -1 when empty.
 * @property {number} current  Slot acted on, -1 when none.
 * @property {number[]} path  Slots walked by this op.
 * @property {number} succ  Successor slot during a two-child delete, -1 otherwise.
 * @property {'LL'|'LR'|'RR'|'RL'|null} imbalance  The case being fixed on rotate frames.
 * @property {'left'|'right'|null} direction  Rotation direction on rotate frames.
 * @property {number} moved  The slot a rotation lifted, -1 otherwise.
 * @property {number} sunk  The slot a rotation lowered, -1 otherwise.
 * @property {boolean} prepares  True for the first rotation of a double rotation.
 * @property {number} s  Select: size(x.left) + 1 at the current node, 0 otherwise.
 * @property {number} remaining  Select: the k still being looked for, 0 otherwise.
 * @property {number} counted  Select and rank: keys known to come before the answer.
 * @property {number | null} result  The rank found, or the key select found; null otherwise.
 * @property {number} answer  Slot an operation found, -1 when none.
 * @property {number} comparisons  This op's node inspections.
 * @property {number} updates  This op's recomputed nodes.
 * @property {number} rotations  Single rotations over the whole log.
 * @property {number} height  True height of the tree.
 * @property {number} size  Number of keys or intervals.
 * @property {number[]} lines
 */

/** @param {AugNode[]} nodes @param {number} slot @returns {number} */
function trueHeight(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + Math.max(trueHeight(nodes, nodes[slot].left), trueHeight(nodes, nodes[slot].right));
}

/** @param {Pick<AugFrame, 'nodes'|'root'>} f @returns {number[]} Reachable slots in order. */
export function inorderSlots(f) {
  /** @param {number} s @returns {number[]} */
  const go = (s) => (s === -1 ? [] : [...go(f.nodes[s].left), s, ...go(f.nodes[s].right)]);
  return go(f.root);
}

/** Whether two closed intervals share a point. @param {number} a @param {number} b @param {number} c @param {number} d */
export function overlaps(a, b, c, d) {
  return a <= d && c <= b;
}

/**
 * @param {AugOp[]} ops
 * @returns {AugFrame[]}
 */
function runTrace(ops) {
  /** @type {AugNode[]} */
  const nodes = [];
  let root = -1;
  let count = 0;
  let rotations = 0;
  /** @type {AugFrame[]} */
  const frames = [];
  /** @type {number[]} */
  let path = [];
  let opIndex = -1;

  const blank = () => ({
    current: -1,
    succ: -1,
    imbalance: /** @type {AugFrame['imbalance']} */ (null),
    direction: /** @type {AugFrame['direction']} */ (null),
    moved: -1,
    sunk: -1,
    prepares: false,
    s: 0,
    remaining: 0,
    counted: 0,
    result: /** @type {number | null} */ (null),
    answer: -1,
    comparisons: 0,
    updates: 0,
  });
  let live = blank();

  /** @param {AugFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: nodes.map((n) => ({ ...n })),
      root,
      path: path.slice(),
      rotations,
      height: trueHeight(nodes, root),
      size: count,
      lines: lines.slice(),
      ...live,
    });
  }

  /** @param {number} s */
  const heightOf = (s) => (s === -1 ? 0 : nodes[s].height);
  /** @param {number} s */
  const sizeOf = (s) => (s === -1 ? 0 : nodes[s].size);
  /** @param {number} s */
  const maxOf = (s) => (s === -1 ? -Infinity : nodes[s].max);
  /** @param {number} s */
  const balanceOf = (s) => heightOf(nodes[s].left) - heightOf(nodes[s].right);

  /** Recompute a node's stored fields from its children. @param {number} s */
  function pull(s) {
    const n = nodes[s];
    n.height = 1 + Math.max(heightOf(n.left), heightOf(n.right));
    n.size = 1 + sizeOf(n.left) + sizeOf(n.right);
    n.max = Math.max(n.high, maxOf(n.left), maxOf(n.right));
    live.updates++;
  }

  /** @param {number} parent @param {number} from @param {number} to */
  function relink(parent, from, to) {
    if (parent === -1) root = to;
    else if (nodes[parent].left === from) nodes[parent].left = to;
    else nodes[parent].right = to;
  }

  /** @param {number} top @param {'left'|'right'} dir @param {number} parent @param {boolean} prepares */
  function rotate(top, dir, parent, prepares) {
    const t = nodes[top];
    const up = dir === 'right' ? t.left : t.right;
    if (dir === 'right') {
      t.left = nodes[up].right;
      nodes[up].right = top;
    } else {
      t.right = nodes[up].left;
      nodes[up].left = top;
    }
    pull(top);
    pull(up);
    relink(parent, top, up);
    rotations++;
    live.current = up;
    live.moved = up;
    live.sunk = top;
    live.direction = dir;
    live.prepares = prepares;
    push('rotate', [3]);
    live.moved = -1;
    live.sunk = -1;
    live.direction = null;
    live.prepares = false;
  }

  /** Walk back up the path, refreshing each ancestor and repairing any broken balance. */
  function retrace() {
    for (let i = path.length - 1; i >= 0; i--) {
      const s = path[i];
      pull(s);
      live.current = s;
      push('retrace', [1, 2]);
      const bf = balanceOf(s);
      if (Math.abs(bf) < 2) continue;
      const parent = i > 0 ? path[i - 1] : -1;
      if (bf === 2) {
        const child = nodes[s].left;
        live.imbalance = balanceOf(child) >= 0 ? 'LL' : 'LR';
        if (live.imbalance === 'LR') rotate(child, 'left', s, true);
        rotate(s, 'right', parent, false);
      } else {
        const child = nodes[s].right;
        live.imbalance = balanceOf(child) <= 0 ? 'RR' : 'RL';
        if (live.imbalance === 'RL') rotate(child, 'right', s, true);
        rotate(s, 'left', parent, false);
      }
      live.imbalance = null;
    }
    live.current = -1;
  }

  /**
   * Walk down to a key and interval, or to where it belongs. Returns the slot found or -1.
   * @param {number} key @param {number} high
   */
  function walk(key, high) {
    let x = root;
    while (x !== -1) {
      path.push(x);
      live.current = x;
      live.comparisons++;
      const c = key - nodes[x].key || high - nodes[x].high;
      if (c === 0) return x;
      push(c < 0 ? 'go-left' : 'go-right', [0]);
      x = c < 0 ? nodes[x].left : nodes[x].right;
    }
    return -1;
  }

  /** @param {number} key @param {number} high */
  function insert(key, high) {
    if (walk(key, high) !== -1) {
      push('dup', [0]);
      return;
    }
    const parent = path.length > 0 ? path[path.length - 1] : -1;
    const slot = nodes.length;
    nodes.push({ key, high, left: -1, right: -1, height: 1, size: 1, max: high });
    if (parent === -1) root = slot;
    else if ((key - nodes[parent].key || high - nodes[parent].high) < 0) nodes[parent].left = slot;
    else nodes[parent].right = slot;
    count++;
    live.current = slot;
    push('attach', [0]);
    retrace();
  }

  /** @param {number} key @param {number} high */
  function remove(key, high) {
    const z = walk(key, high);
    if (z === -1) {
      live.current = -1;
      push('missing', [0]);
      return;
    }
    push('found', [0]);
    const target = nodes[z];
    if (target.left !== -1 && target.right !== -1) {
      let s = target.right;
      path.push(s);
      while (nodes[s].left !== -1) {
        s = nodes[s].left;
        path.push(s);
      }
      live.succ = s;
      push('successor', [0]);
      target.key = nodes[s].key;
      target.high = nodes[s].high;
      push('copy', [0]);
      live.succ = -1;
    }
    const gone = /** @type {number} */ (path.pop());
    const child = nodes[gone].left !== -1 ? nodes[gone].left : nodes[gone].right;
    relink(path.length > 0 ? path[path.length - 1] : -1, gone, child);
    count--;
    live.current = -1;
    push('unlink', [0]);
    retrace();
  }

  /** @param {number} k */
  function select(k) {
    if (k < 1 || k > count) {
      push('select-range', [4]);
      return;
    }
    let x = root;
    live.remaining = k;
    live.current = x;
    push('select-begin', [4]);
    for (;;) {
      path.push(x);
      live.current = x;
      live.comparisons++;
      live.s = sizeOf(nodes[x].left) + 1;
      if (live.remaining === live.s) {
        live.counted += live.s - 1;
        live.answer = x;
        live.result = nodes[x].key;
        push('select-found', [5, 6]);
        return;
      }
      if (live.remaining < live.s) {
        push('select-left', [5, 7]);
        x = nodes[x].left;
      } else {
        live.remaining -= live.s;
        live.counted += live.s;
        push('select-right', [5, 8]);
        x = nodes[x].right;
      }
    }
  }

  /** @param {number} key */
  function rank(key) {
    let x = root;
    live.current = x;
    push('rank-begin', [9]);
    while (x !== -1) {
      path.push(x);
      live.current = x;
      live.comparisons++;
      const n = nodes[x];
      if (key < n.key) {
        push('rank-left', [10]);
        x = n.left;
      } else if (key > n.key) {
        live.counted += sizeOf(n.left) + 1;
        push('rank-right', [11]);
        x = n.right;
      } else {
        live.counted += sizeOf(n.left);
        live.answer = x;
        live.result = live.counted + 1;
        push('rank-found', [12]);
        return;
      }
    }
    live.current = -1;
    live.result = live.counted + 1;
    push('rank-missing', [13]);
  }

  /** @param {number} lo @param {number} hi */
  function overlap(lo, hi) {
    let x = root;
    live.current = x;
    push('overlap-begin', [4]);
    while (x !== -1) {
      const n = nodes[x];
      path.push(x);
      live.current = x;
      live.comparisons++;
      if (overlaps(n.key, n.high, lo, hi)) {
        live.answer = x;
        push('overlap-found', [5, 8]);
        return;
      }
      push('overlap-check', [5]);
      if (n.left !== -1 && nodes[n.left].max >= lo) {
        push('overlap-left', [6]);
        x = n.left;
      } else {
        push('overlap-right', [7]);
        x = n.right;
      }
    }
    live.current = -1;
    push('overlap-none', [8]);
  }

  push('start', [0]);
  ops.forEach((op, i) => {
    opIndex = i;
    live = blank();
    path = [];
    const high = 'high' in op ? op.high : op.key;
    if (op.type === 'insert') insert(op.key, high);
    else if (op.type === 'delete') remove(op.key, high);
    else if (op.type === 'select') select(op.key);
    else if (op.type === 'rank') rank(op.key);
    else overlap(op.key, high);
  });
  opIndex = -1;
  live = blank();
  path = [];
  push('done', [0]);
  return frames;
}

/** @param {OrderOp[]} ops */
export const orderTrace = (ops) => runTrace(ops);

/** @param {IntervalOp[]} ops */
export const intervalTrace = (ops) => runTrace(ops);

/**
 * @param {'queries'|'rotations'|'scores'|'random'} preset
 * @param {() => number} [rand]
 * @returns {OrderOp[]}
 */
export function makeOrderOps(preset, rand = Math.random) {
  /** @param {number[]} keys @returns {OrderOp[]} */
  const inserts = (keys) => keys.map((key) => ({ type: 'insert', key }));
  if (preset === 'queries') {
    return [
      ...inserts([40, 20, 60, 10, 30, 50, 70]),
      { type: 'select', key: 5 },
      { type: 'rank', key: 30 },
      { type: 'rank', key: 45 },
      { type: 'select', key: 9 },
    ];
  }
  if (preset === 'rotations') {
    return [...inserts([10, 20, 30, 40, 50, 60, 70]), { type: 'select', key: 4 }];
  }
  if (preset === 'scores') {
    return [
      ...inserts([55, 82, 17, 93, 41, 68, 29, 76]),
      { type: 'rank', key: 68 },
      { type: 'select', key: 8 },
      { type: 'delete', key: 93 },
      { type: 'select', key: 7 },
    ];
  }
  /** @type {Set<number>} */
  const pool = new Set();
  while (pool.size < 9) pool.add(1 + Math.floor(rand() * 99));
  const keys = [...pool];
  return [
    ...inserts(keys),
    { type: 'select', key: 1 + Math.floor(rand() * 9) },
    { type: 'rank', key: keys[Math.floor(rand() * 9)] },
  ];
}

/**
 * @param {'textbook'|'long'|'rotations'|'random'} preset
 * @param {() => number} [rand]
 * @returns {IntervalOp[]}
 */
export function makeIntervalOps(preset, rand = Math.random) {
  /** @param {[number, number][]} list @returns {IntervalOp[]} */
  const inserts = (list) => list.map(([key, high]) => ({ type: 'insert', key, high }));
  if (preset === 'textbook') {
    return [
      ...inserts([
        [16, 21],
        [8, 9],
        [25, 30],
        [5, 8],
        [15, 23],
        [17, 19],
        [26, 26],
        [0, 3],
        [6, 10],
        [19, 20],
      ]),
      { type: 'overlap', key: 22, high: 25 },
      { type: 'overlap', key: 11, high: 14 },
    ];
  }
  if (preset === 'long') {
    return [
      ...inserts([
        [40, 45],
        [20, 25],
        [60, 65],
        [10, 90],
        [30, 35],
        [50, 55],
        [70, 75],
      ]),
      { type: 'overlap', key: 80, high: 85 },
      { type: 'overlap', key: 92, high: 95 },
    ];
  }
  if (preset === 'rotations') {
    return [
      ...inserts([
        [10, 12],
        [20, 25],
        [30, 31],
        [40, 70],
        [50, 52],
      ]),
      { type: 'overlap', key: 65, high: 68 },
    ];
  }
  /** @type {[number, number][]} */
  const list = [];
  while (list.length < 8) {
    const lo = Math.floor(rand() * 90);
    const hi = lo + Math.floor(rand() * 10);
    if (!list.some(([a, b]) => a === lo && b === hi)) list.push([lo, hi]);
  }
  const lo = Math.floor(rand() * 90);
  return [...inserts(list), { type: 'overlap', key: lo, high: lo + 5 }];
}
