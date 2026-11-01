/**
 * AVL tree operation log: insert, search and delete, with heights kept in the nodes and the
 * rebalance played out on the way back up. Height counts nodes (empty 0, leaf 1) and the
 * balance factor is height(left) − height(right). A delete with two children copies in the
 * in-order successor. Nodes live in slots that are never reused, so a slot identifies a node
 * across frames.
 */

export const MAX_NODES = 15;
export const MAX_OPS = 20;
export const MIN_KEY = 0;
export const MAX_KEY = 99;

export const avlPseudocode = [
  'walk down from the root as in a BST',
  'insert: attach a leaf; delete: unlink the node (two children: copy the successor first)',
  'for each ancestor, from the bottom up:',
  '  height = 1 + max(height(left), height(right))',
  '  bf = height(left) − height(right)',
  '  bf = +2, left child bf ≥ 0: rotate right (LL)',
  '  bf = +2, left child bf < 0: rotate left at child, then right (LR)',
  '  bf = −2, right child bf ≤ 0: rotate left (RR)',
  '  bf = −2, right child bf > 0: rotate right at child, then left (RL)',
];

/**
 * @typedef {object} AvlOp
 * @property {'insert'|'search'|'delete'} type
 * @property {number} key
 */

/**
 * @typedef {object} AvlNode
 * @property {number | null} key  Null once the slot is freed.
 * @property {number} left  Slot, -1 for none.
 * @property {number} right  Slot, -1 for none.
 * @property {number} height  As stored; ancestors of a change are stale until the retrace reaches them.
 */

/** @typedef {'LL'|'LR'|'RR'|'RL'} AvlCase */

/**
 * @typedef {object} AvlFrame
 * @property {'start'|'visit'|'go-left'|'go-right'|'insert'|'found'|'missing'|'dup'|'successor'|'copy'|'unlink'|'retrace'|'unbalanced'|'rotate'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {AvlOp | null} op
 * @property {AvlNode[]} nodes
 * @property {number} root  -1 when empty.
 * @property {number} current  Slot acted on, -1 when none.
 * @property {number[]} path  Slots walked by this op.
 * @property {number} succ  Successor slot during a two-child delete, -1 otherwise.
 * @property {AvlCase | null} imbalance  The case being fixed on unbalanced and rotate frames.
 * @property {'left'|'right'|null} direction  Rotation direction on rotate frames.
 * @property {number} moved  The slot a rotation lifted, -1 otherwise.
 * @property {number} sunk  The slot a rotation lowered, -1 otherwise.
 * @property {boolean} prepares  True for the first rotation of a double rotation.
 * @property {number} comparisons  This op's comparisons.
 * @property {number} rotations  Single rotations over the whole log, a double counting as 2.
 * @property {number} opRotations  Single rotations of this op.
 * @property {number} height  True height of the tree.
 * @property {number} size
 * @property {number[]} lines
 */

/** @param {AvlNode[]} nodes @param {number} slot @returns {number} */
function trueHeight(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + Math.max(trueHeight(nodes, nodes[slot].left), trueHeight(nodes, nodes[slot].right));
}

/** @param {AvlNode[]} nodes @param {number} slot @returns {number} */
function sizeOf(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + sizeOf(nodes, nodes[slot].left) + sizeOf(nodes, nodes[slot].right);
}

/**
 * Balance factor from the heights as stored, the value the algorithm itself sees.
 * @param {AvlNode[]} nodes
 * @param {number} slot
 */
export function balanceOf(nodes, slot) {
  const n = nodes[slot];
  const h = (/** @type {number} */ s) => (s === -1 ? 0 : nodes[s].height);
  return h(n.left) - h(n.right);
}

/** @param {Pick<AvlFrame, 'nodes'|'root'>} f @returns {number[]} */
export function inorderKeys(f) {
  /** @param {number} s @returns {number[]} */
  const go = (s) =>
    s === -1
      ? []
      : [...go(f.nodes[s].left), /** @type {number} */ (f.nodes[s].key), ...go(f.nodes[s].right)];
  return go(f.root);
}

/**
 * @param {AvlOp[]} ops
 * @returns {AvlFrame[]}
 */
export function avlTrace(ops) {
  /** @type {AvlNode[]} */
  const nodes = [];
  let root = -1;
  let rotations = 0;
  /** @type {AvlFrame[]} */
  const frames = [];
  /** @type {Omit<AvlFrame, 'kind'|'opIndex'|'op'|'nodes'|'root'|'path'|'lines'|'rotations'|'height'|'size'>} */
  let live = blank();
  /** @type {number[]} */
  let path = [];

  function blank() {
    return {
      current: -1,
      succ: -1,
      imbalance: /** @type {AvlCase | null} */ (null),
      direction: /** @type {'left'|'right'|null} */ (null),
      moved: -1,
      sunk: -1,
      prepares: false,
      comparisons: 0,
      opRotations: 0,
    };
  }

  /** @param {AvlFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    const snapshot = nodes.map((n) => ({ ...n }));
    frames.push({
      ...live,
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: snapshot,
      root,
      path: path.slice(),
      lines: lines.slice(),
      rotations,
      height: trueHeight(snapshot, root),
      size: sizeOf(snapshot, root),
    });
  }

  /** @param {number} slot */
  const stored = (slot) => (slot === -1 ? 0 : nodes[slot].height);
  /** @param {number} slot */
  const refresh = (slot) => {
    nodes[slot].height = 1 + Math.max(stored(nodes[slot].left), stored(nodes[slot].right));
  };

  /**
   * Rotates at `pivot`, relinks `parent`, and returns the slot now on top.
   * @param {number} pivot @param {'left'|'right'} direction @param {number} parent
   */
  function rotate(pivot, direction, parent) {
    const lift = direction === 'left' ? nodes[pivot].right : nodes[pivot].left;
    if (direction === 'left') {
      nodes[pivot].right = nodes[lift].left;
      nodes[lift].left = pivot;
    } else {
      nodes[pivot].left = nodes[lift].right;
      nodes[lift].right = pivot;
    }
    refresh(pivot);
    refresh(lift);
    if (parent === -1) root = lift;
    else if (nodes[parent].left === pivot) nodes[parent].left = lift;
    else nodes[parent].right = lift;
    return lift;
  }

  /**
   * Walks the stack bottom up: refresh, measure, rotate when the factor reaches 2.
   * @param {number[]} stack  Ancestors of the change, root first.
   * @param {number} i  Op index.
   */
  function retrace(stack, i) {
    for (let at = stack.length - 1; at >= 0; at--) {
      const slot = stack[at];
      const parent = at > 0 ? stack[at - 1] : -1;
      refresh(slot);
      live.current = slot;
      live.imbalance = null;
      live.direction = null;
      live.moved = -1;
      live.sunk = -1;
      live.prepares = false;
      push('retrace', i, [2, 3, 4]);
      const bf = balanceOf(nodes, slot);
      if (Math.abs(bf) < 2) continue;

      const childSlot = bf > 0 ? nodes[slot].left : nodes[slot].right;
      const childBf = balanceOf(nodes, childSlot);
      /** @type {AvlCase} */
      const kase = bf > 0 ? (childBf >= 0 ? 'LL' : 'LR') : childBf <= 0 ? 'RR' : 'RL';
      const line = { LL: 5, LR: 6, RR: 7, RL: 8 }[kase];
      live.imbalance = kase;
      push('unbalanced', i, [line]);

      if (kase === 'LR' || kase === 'RL') {
        const direction = kase === 'LR' ? 'left' : 'right';
        const lift = rotate(childSlot, direction, slot);
        rotations++;
        live.opRotations++;
        live.direction = direction;
        live.moved = lift;
        live.sunk = childSlot;
        live.prepares = true;
        push('rotate', i, [line]);
      }
      const direction = bf > 0 ? 'right' : 'left';
      const lift = rotate(slot, direction, parent);
      rotations++;
      live.opRotations++;
      live.direction = direction;
      live.moved = lift;
      live.sunk = slot;
      live.prepares = false;
      push('rotate', i, [line]);
    }
  }

  push('start', -1, [0]);

  ops.forEach((op, i) => {
    live = blank();
    path = [];
    let node = root;
    let side = /** @type {'left'|'right'} */ ('left');
    /** @type {number[]} */
    const stack = [];
    while (node !== -1) {
      live.current = node;
      live.comparisons++;
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
        live.current = -1;
        push('missing', i, [0]);
        return;
      }
      nodes.push({ key: op.key, left: -1, right: -1, height: 1 });
      const slot = nodes.length - 1;
      const parent = stack.length ? stack[stack.length - 1] : -1;
      if (parent === -1) root = slot;
      else nodes[parent][side] = slot;
      live.current = slot;
      push('insert', i, [1]);
      retrace(stack, i);
      return;
    }

    if (op.type === 'insert') return void push('dup', i, [0]);
    push('found', i, op.type === 'delete' ? [1] : [0]);
    if (op.type === 'search') return;

    const target = nodes[node];
    if (target.left !== -1 && target.right !== -1) {
      // The successor is the leftmost node of the right subtree; its removal rebalances the
      // whole path down to it, so that path joins the stack.
      stack.push(node);
      let s = target.right;
      live.succ = s;
      push('successor', i, [1]);
      while (nodes[s].left !== -1) {
        stack.push(s);
        s = nodes[s].left;
        live.succ = s;
        push('successor', i, [1]);
      }
      target.key = nodes[s].key;
      push('copy', i, [1]);
      node = s;
    }

    const child = nodes[node].left === -1 ? nodes[node].right : nodes[node].left;
    const parent = stack.length ? stack[stack.length - 1] : -1;
    if (parent === -1) root = child;
    else if (nodes[parent].left === node) nodes[parent].left = child;
    else nodes[parent].right = child;
    nodes[node] = { key: null, left: -1, right: -1, height: 0 };
    live.current = child;
    live.succ = -1;
    push('unlink', i, [1]);
    retrace(stack, i);
  });

  live = blank();
  path = [];
  push('done', -1, [2]);
  return frames;
}

/**
 * @param {'ll'|'rr'|'lr'|'rl'|'sorted'|'cascade'|'random'} preset
 * @param {() => number} [rand]
 * @returns {AvlOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  /** @param {number[]} keys @returns {AvlOp[]} */
  const inserts = (keys) => keys.map((key) => ({ type: 'insert', key }));
  if (preset === 'll') return inserts([30, 20, 10]);
  if (preset === 'rr') return inserts([10, 20, 30]);
  if (preset === 'lr') return inserts([30, 10, 20]);
  if (preset === 'rl') return inserts([10, 30, 20]);
  if (preset === 'sorted') return inserts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  if (preset === 'cascade') {
    // Twelve keys, the fewest an AVL tree of height 5 can hold. Removing 80 rebalances at 70
    // and then again at the root.
    return [
      ...inserts([50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 65, 15]),
      { type: 'delete', key: 80 },
    ];
  }
  /** @type {Set<number>} */
  const pool = new Set();
  while (pool.size < 9) pool.add(1 + Math.floor(rand() * 99));
  return inserts([...pool]);
}
