/**
 * Binary search tree operation log: insert, search, and delete (CLRS 12.2-12.3, Hibbard
 * deletion with the in-order successor). The whole log is replayed into one frame trace.
 * Nodes live in slots that are never reused, so a slot index identifies a node across frames.
 */

export const MAX_NODES = 15;
export const MAX_OPS = 40;

export const bstPseudocode = [
  'search / insert: node = root',
  '  while node exists:',
  '    if key == node.key: found (insert: duplicate, stop)',
  '    node = key < node.key ? node.left : node.right',
  '  insert: attach a new leaf where the walk fell off; search: not found',
  'delete: find the node, then:',
  '  0 or 1 child: replace the node by its child (or nothing)',
  '  2 children: copy the smallest key of the right subtree here, delete that node',
];

/**
 * @typedef {object} BstOp
 * @property {'insert'|'search'|'delete'} type
 * @property {number} key
 */

/**
 * @typedef {object} BstNode
 * @property {number | null} key
 * @property {number} left
 * @property {number} right
 */

/**
 * @typedef {object} BstFrame
 * @property {'start'|'visit'|'go-left'|'go-right'|'insert'|'found'|'missing'|'dup'|'successor'|'relink'|'remove'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {BstOp | null} op
 * @property {BstNode[]} nodes  Slot-stable; children are slot indices, -1 none; freed slots have key null.
 * @property {number} root     -1 when empty.
 * @property {number} current  Slot being compared or changed, -1 when none.
 * @property {number[]} path   Slots visited by this op so far.
 * @property {number} succ     Successor slot during a two-child delete, -1 otherwise.
 * @property {number[]} lines
 * @property {number} comparisons  Per op (reset at each op's first frame).
 * @property {number} height   Nodes on the longest root-to-leaf path (empty 0).
 * @property {number} size
 */

/**
 * @param {BstNode[]} nodes
 * @param {number} slot
 * @returns {number}
 */
function heightOf(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + Math.max(heightOf(nodes, nodes[slot].left), heightOf(nodes, nodes[slot].right));
}

/**
 * @param {BstNode[]} nodes
 * @param {number} slot
 * @returns {number}
 */
function sizeOf(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + sizeOf(nodes, nodes[slot].left) + sizeOf(nodes, nodes[slot].right);
}

/** Visit reachable slots left, node, right. @param {Pick<BstFrame, 'nodes'|'root'>} f @param {(slot: number, depth: number) => void} fn */
function walk(f, fn) {
  /** @param {number} slot @param {number} depth */
  const go = (slot, depth) => {
    if (slot === -1) return;
    go(f.nodes[slot].left, depth + 1);
    fn(slot, depth);
    go(f.nodes[slot].right, depth + 1);
  };
  go(f.root, 0);
}

/** @param {BstFrame} frame */
export function inorderKeys(frame) {
  /** @type {number[]} */
  const keys = [];
  walk(frame, (slot) => keys.push(/** @type {number} */ (frame.nodes[slot].key)));
  return keys;
}

/** @param {BstFrame} frame */
export function treeHeight(frame) {
  return heightOf(frame.nodes, frame.root);
}

/**
 * x is the in-order rank and y the depth; freed and unreachable slots get null.
 * @param {BstFrame} frame
 * @returns {({x: number, y: number} | null)[]}
 */
export function layoutTree(frame) {
  /** @type {({x: number, y: number} | null)[]} */
  const out = frame.nodes.map(() => null);
  let rank = 0;
  walk(frame, (slot, depth) => {
    out[slot] = { x: rank++, y: depth };
  });
  return out;
}

/**
 * @param {BstOp[]} ops
 * @returns {BstFrame[]}
 */
export function bstTrace(ops) {
  /** @type {BstNode[]} */
  const nodes = [];
  let root = -1;
  let current = -1;
  let succ = -1;
  let comparisons = 0;
  /** @type {number[]} */
  let path = [];
  /** @type {BstFrame[]} */
  const frames = [];

  /** @param {BstFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    const snapshot = nodes.map((n) => ({ ...n }));
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: snapshot,
      root,
      current,
      path: path.slice(),
      succ,
      lines: lines.slice(),
      comparisons,
      height: heightOf(snapshot, root),
      size: sizeOf(snapshot, root),
    });
  }

  /** @param {number} key */
  function newSlot(key) {
    nodes.push({ key, left: -1, right: -1 });
    return nodes.length - 1;
  }

  push('start', -1, [0]);

  ops.forEach((op, i) => {
    comparisons = 0;
    path = [];
    current = -1;
    succ = -1;
    const isDelete = op.type === 'delete';
    const walkLines = isDelete ? [5, 1, 2] : [1, 2];

    let node = root;
    let parent = -1;
    let side = /** @type {'left'|'right'} */ ('left');
    while (node !== -1) {
      current = node;
      comparisons++;
      path.push(node);
      push('visit', i, walkLines);
      const nodeKey = /** @type {number} */ (nodes[node].key);
      if (op.key === nodeKey) break;
      side = op.key < nodeKey ? 'left' : 'right';
      push(side === 'left' ? 'go-left' : 'go-right', i, [3]);
      parent = node;
      node = nodes[node][side];
    }

    if (node === -1) {
      if (op.type !== 'insert') {
        push('missing', i, [4]);
        return;
      }
      const slot = newSlot(op.key);
      if (parent === -1) root = slot;
      else nodes[parent][side] = slot;
      current = slot;
      push('insert', i, [4]);
      return;
    }

    if (op.type === 'insert') return push('dup', i, [2]);
    if (op.type === 'search') return push('found', i, [2]);

    push('found', i, [2]);
    const target = nodes[node];
    if (target.left === -1 || target.right === -1) {
      const child = target.left === -1 ? target.right : target.left;
      if (parent === -1) root = child;
      else nodes[parent][side] = child;
      push('relink', i, [6]);
      nodes[node] = { key: null, left: -1, right: -1 };
      push('remove', i, [6]);
      return;
    }

    let s = target.right;
    let sParent = node;
    succ = s;
    push('successor', i, [7]);
    while (nodes[s].left !== -1) {
      sParent = s;
      s = nodes[s].left;
      succ = s;
      push('successor', i, [7]);
    }
    target.key = nodes[s].key;
    push('relink', i, [7]);
    // The successor has no left child; its right subtree takes its place.
    if (sParent === node) nodes[sParent].right = nodes[s].right;
    else nodes[sParent].left = nodes[s].right;
    nodes[s] = { key: null, left: -1, right: -1 };
    current = node;
    succ = -1;
    push('remove', i, [7]);
  });

  current = -1;
  succ = -1;
  path = [];
  push('done', -1, []);
  return frames;
}

/**
 * @param {'balanced'|'sorted'|'random'} preset
 * @param {() => number} [rand]
 * @returns {BstOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  /** @type {number[]} */
  let keys;
  if (preset === 'balanced') keys = [50, 30, 70, 20, 40, 60, 80];
  else if (preset === 'sorted') keys = [10, 20, 30, 40, 50, 60, 70];
  else {
    const pool = new Set();
    while (pool.size < 7) pool.add(1 + Math.floor(rand() * 99));
    keys = [...pool];
  }
  return keys.map((key) => ({ type: 'insert', key }));
}
