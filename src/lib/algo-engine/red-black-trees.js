/**
 * Red-black tree insert and search, with the CLRS bottom-up repair (section 13.3). The NIL
 * leaves are all black and are not stored: a child slot of -1 stands for one. Black height
 * follows CLRS: the black nodes on a path from a node down to a NIL, counting the NIL but not
 * the node itself. Height counts nodes (empty 0, one node 1). Nodes live in slots that are
 * never reused.
 */

export const MAX_NODES = 15;
export const MAX_OPS = 24;
export const MIN_KEY = 0;
export const MAX_KEY = 99;

export const redBlackPseudocode = [
  'walk down from the root as in a BST',
  'insert: attach z as a new RED leaf',
  'while z.parent is red:',
  '  uncle = sibling of z.parent',
  '  uncle red: parent, uncle = black; grandparent = red; z = grandparent',
  '  uncle black, z an inner child: z = parent; rotate at z, away from the bend',
  '  uncle black, z an outer child: parent = black; grandparent = red; rotate at grandparent',
  'root = black',
];

/**
 * @typedef {object} RbOp
 * @property {'insert'|'search'} type
 * @property {number} key
 */

/**
 * @typedef {object} RbNode
 * @property {number} key
 * @property {'red'|'black'} color
 * @property {number} left  Slot, -1 for a NIL.
 * @property {number} right  Slot, -1 for a NIL.
 * @property {number} parent  Slot, -1 for the root.
 */

/**
 * @typedef {object} RbRules
 * @property {boolean} rootBlack  The root is black (true for an empty tree).
 * @property {boolean} noRedRed  No red node has a red child.
 * @property {boolean} sameBlack  Every path to a NIL has the same number of black nodes.
 */

/**
 * @typedef {object} RbFrame
 * @property {'start'|'visit'|'go-left'|'go-right'|'attach'|'found'|'missing'|'dup'|'parent-black'|'red-red'|'recolour-uncle'|'rotate-inner'|'recolour-outer'|'rotate-outer'|'paint-root'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {RbOp | null} op
 * @property {RbNode[]} nodes
 * @property {number} root  -1 when empty.
 * @property {number} z  The node being repaired or compared, -1 when none.
 * @property {number} uncle  Slot of z’s uncle on repair frames, -1 for a NIL or none.
 * @property {number} parent  Slot of z’s parent on repair frames, -1 when none.
 * @property {number} grand  Slot of z’s grandparent on repair frames, -1 when none.
 * @property {number[]} path  Slots walked by this op.
 * @property {'left'|'right'|null} direction  Rotation direction on rotate frames.
 * @property {number} pivot  The slot a rotation lowered, -1 otherwise.
 * @property {number} comparisons  This op’s comparisons.
 * @property {number} recolours  Nodes that changed colour, over the whole log.
 * @property {number} rotations  Over the whole log.
 * @property {number} height
 * @property {number} size
 * @property {number} blackHeight  Of the root; -1 when paths disagree (never at rest).
 * @property {RbRules} rules
 * @property {number[]} lines
 */

/** @param {RbNode[]} nodes @param {number} slot @returns {number} */
function heightOf(nodes, slot) {
  if (slot === -1) return 0;
  return 1 + Math.max(heightOf(nodes, nodes[slot].left), heightOf(nodes, nodes[slot].right));
}

/**
 * Black nodes from below `slot` down to a NIL, the NIL included; -1 if the paths disagree.
 * @param {RbNode[]} nodes
 * @param {number} slot
 * @returns {number}
 */
export function blackHeightOf(nodes, slot) {
  if (slot === -1) return 0;
  /** @param {number} child @returns {number} */
  const through = (child) => {
    if (child === -1) return 1;
    const below = blackHeightOf(nodes, child);
    return below === -1 ? -1 : below + (nodes[child].color === 'black' ? 1 : 0);
  };
  const l = through(nodes[slot].left);
  const r = through(nodes[slot].right);
  return l === -1 || l !== r ? -1 : l;
}

/** @param {RbNode[]} nodes @param {number} root @returns {RbRules} */
export function checkRules(nodes, root) {
  let noRedRed = true;
  /** @param {number} s */
  const walk = (s) => {
    if (s === -1) return;
    const n = nodes[s];
    if (n.color === 'red') {
      for (const c of [n.left, n.right]) if (c !== -1 && nodes[c].color === 'red') noRedRed = false;
    }
    walk(n.left);
    walk(n.right);
  };
  walk(root);
  return {
    rootBlack: root === -1 || nodes[root].color === 'black',
    noRedRed,
    sameBlack: root === -1 || blackHeightOf(nodes, root) !== -1,
  };
}

/** @param {Pick<RbFrame, 'nodes'|'root'>} f @returns {number[]} */
export function inorderKeys(f) {
  /** @param {number} s @returns {number[]} */
  const go = (s) =>
    s === -1 ? [] : [...go(f.nodes[s].left), f.nodes[s].key, ...go(f.nodes[s].right)];
  return go(f.root);
}

/**
 * @param {RbOp[]} ops
 * @returns {RbFrame[]}
 */
export function redBlackTrace(ops) {
  /** @type {RbNode[]} */
  const nodes = [];
  let root = -1;
  let z = -1;
  let uncle = -1;
  let parent = -1;
  let grand = -1;
  let pivot = -1;
  let comparisons = 0;
  let recolours = 0;
  let rotations = 0;
  /** @type {'left'|'right'|null} */
  let direction = null;
  /** @type {number[]} */
  let path = [];
  /** @type {RbFrame[]} */
  const frames = [];

  /** @param {RbFrame['kind']} kind @param {number} opIndex @param {number[]} lines */
  function push(kind, opIndex, lines) {
    const snapshot = nodes.map((n) => ({ ...n }));
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      nodes: snapshot,
      root,
      z,
      uncle,
      parent,
      grand,
      path: path.slice(),
      direction,
      pivot,
      comparisons,
      recolours,
      rotations,
      height: heightOf(snapshot, root),
      size: snapshot.length,
      blackHeight: root === -1 ? 0 : blackHeightOf(snapshot, root),
      rules: checkRules(snapshot, root),
      lines: lines.slice(),
    });
  }

  /** @param {number} slot @param {'red'|'black'} color */
  function paint(slot, color) {
    if (nodes[slot].color !== color) recolours++;
    nodes[slot].color = color;
  }

  /** @param {number} x @param {'left'|'right'} dir */
  function rotate(x, dir) {
    const other = dir === 'left' ? 'right' : 'left';
    const y = nodes[x][other];
    const moved = nodes[y][dir];
    nodes[x][other] = moved;
    if (moved !== -1) nodes[moved].parent = x;
    const p = nodes[x].parent;
    nodes[y].parent = p;
    if (p === -1) root = y;
    else if (nodes[p].left === x) nodes[p].left = y;
    else nodes[p].right = y;
    nodes[y][dir] = x;
    nodes[x].parent = y;
    rotations++;
    direction = dir;
    pivot = x;
  }

  push('start', -1, [0]);

  ops.forEach((op, i) => {
    comparisons = 0;
    path = [];
    uncle = -1;
    parent = -1;
    grand = -1;
    pivot = -1;
    direction = null;
    z = -1;

    let node = root;
    let last = -1;
    let side = /** @type {'left'|'right'} */ ('left');
    while (node !== -1) {
      z = node;
      comparisons++;
      path.push(node);
      push('visit', i, [0]);
      if (op.key === nodes[node].key) break;
      side = op.key < nodes[node].key ? 'left' : 'right';
      push(side === 'left' ? 'go-left' : 'go-right', i, [0]);
      last = node;
      node = nodes[node][side];
    }

    if (node !== -1) {
      push(op.type === 'insert' ? 'dup' : 'found', i, [0]);
      return;
    }
    if (op.type === 'search') {
      z = -1;
      push('missing', i, [0]);
      return;
    }

    nodes.push({ key: op.key, color: 'red', left: -1, right: -1, parent: last });
    z = nodes.length - 1;
    if (last === -1) root = z;
    else nodes[last][side] = z;
    push('attach', i, [1]);
    path = [];

    while (nodes[z].parent !== -1 && nodes[nodes[z].parent].color === 'red') {
      parent = nodes[z].parent;
      // A red parent is never the root at rest, so a grandparent always exists.
      grand = nodes[parent].parent;
      const parentIsLeft = nodes[grand].left === parent;
      uncle = parentIsLeft ? nodes[grand].right : nodes[grand].left;
      direction = null;
      pivot = -1;
      push('red-red', i, [2, 3]);

      if (uncle !== -1 && nodes[uncle].color === 'red') {
        paint(parent, 'black');
        paint(uncle, 'black');
        paint(grand, 'red');
        push('recolour-uncle', i, [4]);
        z = grand;
        parent = -1;
        grand = -1;
        uncle = -1;
        continue;
      }

      const zIsLeft = nodes[parent].left === z;
      if (zIsLeft !== parentIsLeft) {
        const next = parent;
        rotate(next, parentIsLeft ? 'left' : 'right');
        z = next;
        parent = nodes[z].parent;
        push('rotate-inner', i, [5]);
      }

      direction = null;
      pivot = -1;
      paint(parent, 'black');
      paint(grand, 'red');
      push('recolour-outer', i, [6]);
      rotate(grand, parentIsLeft ? 'right' : 'left');
      push('rotate-outer', i, [6]);
    }

    direction = null;
    pivot = -1;
    if (nodes[root].color === 'red') {
      uncle = -1;
      parent = -1;
      grand = -1;
      paint(root, 'black');
      z = root;
      push('paint-root', i, [7]);
    } else {
      parent = nodes[z].parent;
      uncle = -1;
      grand = -1;
      push('parent-black', i, [2]);
    }
  });

  z = -1;
  uncle = -1;
  parent = -1;
  grand = -1;
  pivot = -1;
  direction = null;
  path = [];
  comparisons = 0;
  push('done', -1, [7]);
  return frames;
}

/**
 * @param {'uncle'|'inner'|'outer'|'sorted'|'clrs'|'random'} preset
 * @param {() => number} [rand]
 * @returns {RbOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  /** @param {number[]} keys @returns {RbOp[]} */
  const inserts = (keys) => keys.map((key) => ({ type: 'insert', key }));
  if (preset === 'uncle') return inserts([20, 10, 30, 5]);
  if (preset === 'inner') return inserts([30, 10, 20]);
  if (preset === 'outer') return inserts([10, 20, 30]);
  if (preset === 'sorted') return inserts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  if (preset === 'clrs') return inserts([11, 2, 14, 1, 7, 15, 5, 8, 4]);
  /** @type {Set<number>} */
  const pool = new Set();
  while (pool.size < 9) pool.add(1 + Math.floor(rand() * 99));
  return inserts([...pool]);
}
