/**
 * Two randomised ordered structures behind one lesson. A treap is a BST by key and a min-heap
 * by priority, where a smaller priority sits nearer the root. A skip list follows Pugh: each
 * tower’s height comes from fair coin flips, a search moves right while the next key is
 * smaller and otherwise drops a level. Random choices live in the operations, so a trace is
 * pure and an undo replays the same structure.
 */

export const MAX_OPS = 24;
export const MIN_KEY = 0;
export const MAX_KEY = 99;
export const MAX_SKIP_KEYS = 12;
export const MAX_TOWER = 5;
export const MAX_TREAP_KEYS = 12;
export const MAX_TREAP_OPS = 20;
export const MIN_PRIORITY = 0;
export const MAX_PRIORITY = 99;

export const skipListPseudocode = [
  'x = head, level = top',
  'while level ≥ 1:',
  '  if next(x, level).key < k: x = next(x, level) (move right)',
  '  else: remember x; level = level − 1 (drop)',
  'search / delete: next(x, 1).key = k? found : not found',
  'insert: flip a coin until tails; tower height = 1 + heads',
  'insert: link the new tower after the remembered x on each level; delete: unlink it',
];

export const treapPseudocode = [
  'walk down by key, as in a BST',
  'insert: attach a leaf with a random priority',
  'while the new node’s priority < its parent’s priority:',
  '  rotate the new node up (BST order stays, heap order improves)',
  'delete: while the node has a child:',
  '  rotate up the child with the smaller priority',
  'delete: the node is now a leaf, so remove it',
];

/**
 * @typedef {object} SkipOp
 * @property {'insert'|'search'|'delete'} type
 * @property {number} key
 * @property {number} [height]  The tower an insert would build, chosen when the op was made.
 */

/**
 * @typedef {object} SkipTower
 * @property {number} key
 * @property {number} height
 */

/**
 * @typedef {object} SkipFrame
 * @property {'start'|'begin'|'right'|'drop'|'found'|'missing'|'dup'|'flip'|'link'|'unlink'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {SkipOp | null} op
 * @property {SkipTower[]} towers  In key order.
 * @property {number} top  Levels in use, at least 1.
 * @property {number} at  Tower index of the search position, -1 for the head.
 * @property {number} level  Search level, 1 is the bottom; 0 when no search runs.
 * @property {number} next  Tower index just compared, -1 for none or the end.
 * @property {{ at: number, level: number }[]} path  Positions visited by this op.
 * @property {boolean[]} flips  Coin flips so far for this insert; true is heads.
 * @property {number} newTower  Index of the tower just changed, -1 otherwise.
 * @property {number} comparisons  This op’s key comparisons.
 * @property {number} rights  This op’s moves right.
 * @property {number} drops  This op’s drops.
 * @property {number} size
 * @property {number[]} lines
 */

/**
 * @typedef {object} TreapOp
 * @property {'insert'|'search'|'delete'} type
 * @property {number} key
 * @property {number} [priority]  Chosen when the op was made.
 */

/**
 * @typedef {object} TreapNode
 * @property {number | null} key  Null once the slot is freed.
 * @property {number} priority
 * @property {number} left  Slot, -1 for none.
 * @property {number} right  Slot, -1 for none.
 */

/**
 * @typedef {object} TreapFrame
 * @property {'start'|'visit'|'go-left'|'go-right'|'attach'|'found'|'missing'|'dup'|'heap-ok'|'rotate-up'|'rotate-down'|'remove'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {TreapOp | null} op
 * @property {TreapNode[]} nodes
 * @property {number} root  -1 when empty.
 * @property {number} current  Slot acted on, -1 when none.
 * @property {number} other  The other node of a rotation or check, -1 when none.
 * @property {'left'|'right'|null} direction  Rotation direction on rotate frames.
 * @property {number[]} path  Slots walked by this op.
 * @property {number} comparisons  This op’s comparisons.
 * @property {number} opRotations  This op’s rotations.
 * @property {number} rotations  Over the whole log.
 * @property {number} height  Nodes on the longest path, empty 0.
 * @property {number} size
 * @property {number[]} lines
 */

/**
 * One coin-flip tower height: 1 plus the heads before the first tails, capped.
 * @param {() => number} [rand]
 */
export function rollHeight(rand = Math.random) {
  let height = 1;
  while (height < MAX_TOWER && rand() < 0.5) height++;
  return height;
}

/**
 * @param {SkipOp[]} ops
 * @returns {SkipFrame[]}
 */
export function skipListTrace(ops) {
  /** @type {SkipTower[]} */
  let towers = [];
  /** @type {SkipFrame[]} */
  const frames = [];
  let at = -1;
  let level = 0;
  let next = -1;
  /** @type {{ at: number, level: number }[]} */
  let path = [];
  /** @type {boolean[]} */
  let flips = [];
  let newTower = -1;
  let comparisons = 0;
  let rights = 0;
  let drops = 0;

  /** @param {SkipFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      towers: towers.map((t) => ({ ...t })),
      top: Math.max(1, ...towers.map((t) => t.height)),
      at,
      level,
      next,
      path: path.map((p) => ({ ...p })),
      flips: flips.slice(),
      newTower,
      comparisons,
      rights,
      drops,
      size: towers.length,
      lines: lines.slice(),
    });
  }

  /** The first tower after `from` tall enough to reach `lvl`. @param {number} from @param {number} lvl */
  function nextAt(from, lvl) {
    for (let i = from + 1; i < towers.length; i++) if (towers[i].height >= lvl) return i;
    return -1;
  }

  push('start', -1, [0]);

  ops.forEach((op, i) => {
    at = -1;
    next = -1;
    flips = [];
    newTower = -1;
    comparisons = 0;
    rights = 0;
    drops = 0;
    level = Math.max(1, ...towers.map((t) => t.height));
    path = [{ at, level }];
    push('begin', i, [0, 1]);

    for (;;) {
      next = nextAt(at, level);
      if (next !== -1) comparisons++;
      if (next !== -1 && towers[next].key < op.key) {
        at = next;
        rights++;
        path.push({ at, level });
        push('right', i, [1, 2]);
        continue;
      }
      if (level === 1) break;
      level--;
      drops++;
      path.push({ at, level });
      push('drop', i, [1, 3]);
    }

    const hit = next !== -1 && towers[next].key === op.key;
    if (op.type === 'search') {
      push(hit ? 'found' : 'missing', i, [4]);
      return;
    }
    if (op.type === 'insert') {
      if (hit) {
        push('dup', i, [4]);
        return;
      }
      const height = Math.min(MAX_TOWER, Math.max(1, op.height ?? 1));
      for (let f = 1; f < height; f++) {
        flips.push(true);
        push('flip', i, [5]);
      }
      if (height < MAX_TOWER) {
        flips.push(false);
        push('flip', i, [5]);
      }
      towers = [...towers.slice(0, at + 1), { key: op.key, height }, ...towers.slice(at + 1)];
      newTower = at + 1;
      next = -1;
      push('link', i, [6]);
      return;
    }
    if (!hit) {
      push('missing', i, [4]);
      return;
    }
    push('found', i, [4]);
    towers = towers.filter((_, t) => t !== next);
    next = -1;
    push('unlink', i, [6]);
  });

  at = -1;
  level = 0;
  next = -1;
  path = [];
  flips = [];
  newTower = -1;
  comparisons = 0;
  rights = 0;
  drops = 0;
  push('done', -1, [0]);
  return frames;
}

/**
 * @param {'towers'|'flat'|'random'} preset
 * @param {() => number} [rand]
 * @returns {SkipOp[]}
 */
export function makeSkipOps(preset, rand = Math.random) {
  const keys = [10, 20, 30, 40, 50, 60, 70, 80];
  if (preset === 'towers') {
    const heights = [1, 2, 1, 3, 1, 2, 1, 4];
    return [
      ...keys.map((key, i) => ({ type: /** @type {const} */ ('insert'), key, height: heights[i] })),
      { type: 'search', key: 70 },
    ];
  }
  if (preset === 'flat') {
    return [
      ...keys.map((key) => ({ type: /** @type {const} */ ('insert'), key, height: 1 })),
      { type: 'search', key: 70 },
    ];
  }
  return [
    ...keys.map((key) => ({
      type: /** @type {const} */ ('insert'),
      key,
      height: rollHeight(rand),
    })),
    { type: 'search', key: 70 },
  ];
}

/** @param {TreapNode[]} nodes @param {number} slot @returns {number} */
function treapHeight(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + Math.max(treapHeight(nodes, nodes[slot].left), treapHeight(nodes, nodes[slot].right));
}

/** @param {TreapNode[]} nodes @param {number} slot @returns {number} */
function treapSize(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + treapSize(nodes, nodes[slot].left) + treapSize(nodes, nodes[slot].right);
}

/** @param {Pick<TreapFrame, 'nodes'|'root'>} f @returns {number[]} */
export function treapKeys(f) {
  /** @param {number} s @returns {number[]} */
  const go = (s) =>
    s === -1
      ? []
      : [...go(f.nodes[s].left), /** @type {number} */ (f.nodes[s].key), ...go(f.nodes[s].right)];
  return go(f.root);
}

/**
 * @param {TreapOp[]} ops
 * @returns {TreapFrame[]}
 */
export function treapTrace(ops) {
  /** @type {TreapNode[]} */
  const nodes = [];
  /** @type {TreapFrame[]} */
  const frames = [];
  let root = -1;
  let current = -1;
  let other = -1;
  /** @type {'left'|'right'|null} */
  let direction = null;
  /** @type {number[]} */
  let path = [];
  let comparisons = 0;
  let opRotations = 0;
  let rotations = 0;

  /** @param {TreapFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    const snapshot = nodes.map((n) => ({ ...n }));
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: snapshot,
      root,
      current,
      other,
      direction,
      path: path.slice(),
      comparisons,
      opRotations,
      rotations,
      height: treapHeight(snapshot, root),
      size: treapSize(snapshot, root),
      lines: lines.slice(),
    });
  }

  /**
   * Lifts `child` over its parent `up`, whose own parent is `above`.
   * @param {number} child @param {number} up @param {number} above
   */
  function lift(child, up, above) {
    if (nodes[up].left === child) {
      nodes[up].left = nodes[child].right;
      nodes[child].right = up;
      direction = 'right';
    } else {
      nodes[up].right = nodes[child].left;
      nodes[child].left = up;
      direction = 'left';
    }
    if (above === -1) root = child;
    else if (nodes[above].left === up) nodes[above].left = child;
    else nodes[above].right = child;
    rotations++;
    opRotations++;
  }

  push('start', -1, [0]);

  ops.forEach((op, i) => {
    current = -1;
    other = -1;
    direction = null;
    path = [];
    comparisons = 0;
    opRotations = 0;
    /** @type {number[]} */
    const stack = [];
    let node = root;
    let side = /** @type {'left'|'right'} */ ('left');
    while (node !== -1) {
      current = node;
      comparisons++;
      path.push(node);
      push('visit', i, [0]);
      const nodeKey = /** @type {number} */ (nodes[node].key);
      if (op.key === nodeKey) break;
      side = op.key < nodeKey ? 'left' : 'right';
      push(side === 'left' ? 'go-left' : 'go-right', i, [0]);
      stack.push(node);
      node = nodes[node][side];
    }

    if (node === -1) {
      if (op.type !== 'insert') {
        current = -1;
        push('missing', i, [0]);
        return;
      }
      nodes.push({ key: op.key, priority: op.priority ?? 0, left: -1, right: -1 });
      const z = nodes.length - 1;
      const parent = stack.length ? stack[stack.length - 1] : -1;
      if (parent === -1) root = z;
      else nodes[parent][side] = z;
      current = z;
      push('attach', i, [1]);
      path = [];
      for (;;) {
        const up = stack.length ? stack[stack.length - 1] : -1;
        if (up === -1 || nodes[up].priority <= nodes[z].priority) {
          other = up;
          direction = null;
          push('heap-ok', i, [2]);
          return;
        }
        stack.pop();
        const above = stack.length ? stack[stack.length - 1] : -1;
        lift(z, up, above);
        other = up;
        push('rotate-up', i, [2, 3]);
      }
    }

    if (op.type === 'insert') {
      push('dup', i, [0]);
      return;
    }
    push('found', i, op.type === 'delete' ? [0, 4] : [0]);
    if (op.type === 'search') return;

    const target = node;
    path = [];
    while (nodes[target].left !== -1 || nodes[target].right !== -1) {
      const l = nodes[target].left;
      const r = nodes[target].right;
      const child = l === -1 ? r : r === -1 ? l : nodes[l].priority <= nodes[r].priority ? l : r;
      const above = stack.length ? stack[stack.length - 1] : -1;
      lift(child, target, above);
      stack.push(child);
      current = target;
      other = child;
      push('rotate-down', i, [4, 5]);
    }
    const above = stack.length ? stack[stack.length - 1] : -1;
    if (above === -1) root = -1;
    else if (nodes[above].left === target) nodes[above].left = -1;
    else nodes[above].right = -1;
    nodes[target] = { key: null, priority: 0, left: -1, right: -1 };
    current = -1;
    other = -1;
    direction = null;
    push('remove', i, [6]);
  });

  current = -1;
  other = -1;
  direction = null;
  path = [];
  comparisons = 0;
  opRotations = 0;
  push('done', -1, [0]);
  return frames;
}

/**
 * @param {'shuffled'|'chain'|'reordered'|'random'} preset
 * @param {() => number} [rand]
 * @returns {TreapOp[]}
 */
export function makeTreapOps(preset, rand = Math.random) {
  const keys = [10, 20, 30, 40, 50, 60, 70];
  /** @param {number[]} ks @param {number[]} ps @returns {TreapOp[]} */
  const pairs = (ks, ps) => ks.map((key, i) => ({ type: 'insert', key, priority: ps[i] }));
  const shuffled = [41, 7, 88, 23, 64, 12, 55];
  if (preset === 'shuffled') return pairs(keys, shuffled);
  if (preset === 'chain') return pairs(keys, [1, 2, 3, 4, 5, 6, 7]);
  if (preset === 'reordered') return pairs(keys.slice().reverse(), shuffled.slice().reverse());
  return keys.map((key) => ({
    type: 'insert',
    key,
    priority: Math.floor(rand() * (MAX_PRIORITY + 1)),
  }));
}
