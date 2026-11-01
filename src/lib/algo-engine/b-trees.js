/**
 * B-tree operation log: search, insert with bottom-up splits, and delete with borrowing and
 * merging. Order m follows Knuth: a node has at most m children and m − 1 keys, and every
 * node but the root has at least ⌈m/2⌉ − 1 keys. On overflow the key at index ⌊(m − 1)/2⌋
 * moves up. A delete from an inner node swaps in its in-order predecessor from a leaf; an
 * underfull node borrows from its left sibling first, then the right, and otherwise merges,
 * with the left sibling when there is one. Height counts levels (empty 0, one node 1).
 */

export const MAX_OPS = 24;
export const MAX_KEYS = 20;
export const MIN_KEY = 0;
export const MAX_KEY = 99;
export const ORDERS = /** @type {const} */ ([3, 4, 5]);

export const bTreePseudocode = [
  'search: read one node per level; scan its keys to pick a child',
  'insert: walk to the leaf where k belongs, add k in key order',
  'while a node holds m keys (overflow):',
  '  split it: the median moves up, the rest become two nodes',
  '  no parent: the median becomes a new root (height + 1)',
  'delete: k in an inner node? swap in its predecessor from a leaf',
  'remove k from the leaf',
  'while a non-root node holds under ⌈m/2⌉ − 1 keys (underflow):',
  '  a sibling can spare a key: borrow it through the parent',
  '  otherwise merge with a sibling and the separator between them',
  '  root left with no keys: its only child becomes the root (height − 1)',
];

/**
 * @typedef {object} BOp
 * @property {'insert'|'search'|'delete'} type
 * @property {number} key
 */

/**
 * @typedef {object} BNode
 * @property {number} id  Stable for the node’s life.
 * @property {number[]} keys
 * @property {BNode[]} children  Empty on a leaf.
 */

/**
 * @typedef {object} BFrame
 * @property {'start'|'read'|'found'|'missing'|'dup'|'place'|'overflow'|'split'|'new-root'|'swap-in'|'remove'|'underflow'|'borrow'|'merge'|'shrink'|'done'} kind
 * @property {number} order
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {BOp | null} op
 * @property {BNode | null} root
 * @property {number} active  Node id acted on, -1 when none.
 * @property {number} partner  Sibling or new node involved, -1 when none.
 * @property {number | null} moved  The key that just moved or was placed.
 * @property {number[]} path  Node ids read by this op.
 * @property {number} reads  Node reads by this op.
 * @property {number} scanned  Keys compared inside nodes by this op.
 * @property {number} splits  Over the whole log.
 * @property {number} merges  Over the whole log.
 * @property {number} borrows  Over the whole log.
 * @property {number} height
 * @property {number} size
 * @property {number[]} lines
 */

/** @param {BNode} node @returns {BNode} */
function clone(node) {
  return { id: node.id, keys: node.keys.slice(), children: node.children.map(clone) };
}

/** @param {BNode | null} node @returns {number} */
function heightOf(node) {
  return node ? 1 + (node.children.length ? heightOf(node.children[0]) : 0) : 0;
}

/** @param {BNode | null} node @returns {number[]} */
export function inorderKeys(node) {
  if (!node) return [];
  if (node.children.length === 0) return node.keys.slice();
  return node.children.flatMap((c, i) =>
    i < node.keys.length ? [...inorderKeys(c), node.keys[i]] : inorderKeys(c),
  );
}

/** Fewest keys a non-root node may hold. @param {number} order */
export const minKeys = (order) => Math.ceil(order / 2) - 1;

/**
 * @param {BOp[]} ops
 * @param {number} order
 * @returns {BFrame[]}
 */
export function bTreeTrace(ops, order) {
  const low = minKeys(order);
  /** @type {BNode | null} */
  let root = null;
  let nextId = 0;
  let splits = 0;
  let merges = 0;
  let borrows = 0;
  let reads = 0;
  let scanned = 0;
  /** @type {number[]} */
  let path = [];
  /** @type {BFrame[]} */
  const frames = [];

  /** @param {number[]} keys @param {BNode[]} [children] @returns {BNode} */
  const make = (keys, children = []) => ({ id: nextId++, keys, children });

  /**
   * @param {BFrame['kind']} kind
   * @param {number} opIndex
   * @param {number[]} lines
   * @param {{ active?: number, partner?: number, moved?: number | null }} [marks]
   */
  function push(kind, opIndex, lines, marks = {}) {
    frames.push({
      kind,
      order,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      root: root && clone(root),
      active: marks.active ?? -1,
      partner: marks.partner ?? -1,
      moved: marks.moved ?? null,
      path: path.slice(),
      reads,
      scanned,
      splits,
      merges,
      borrows,
      height: heightOf(root),
      size: inorderKeys(root).length,
      lines: lines.slice(),
    });
  }

  /**
   * The first index whose key is at least `key`, counting one comparison per key looked at.
   * @param {BNode} node
   * @param {number} key
   */
  function scan(node, key) {
    let i = 0;
    while (i < node.keys.length) {
      scanned++;
      if (key <= node.keys[i]) break;
      i++;
    }
    return i;
  }

  /**
   * Walks down reading nodes until the key turns up or a leaf ends the walk.
   * @param {number} key
   * @param {number} i  Op index.
   * @param {number[]} lines
   * @returns {{ stack: {node: BNode, at: number}[], hit: boolean }}
   */
  function walk(key, i, lines) {
    /** @type {{node: BNode, at: number}[]} */
    const stack = [];
    let node = root;
    while (node) {
      reads++;
      path.push(node.id);
      const at = scan(node, key);
      stack.push({ node, at });
      push('read', i, lines, { active: node.id });
      if (at < node.keys.length && node.keys[at] === key) return { stack, hit: true };
      node = node.children.length ? node.children[at] : null;
    }
    return { stack, hit: false };
  }

  /** @param {{node: BNode, at: number}[]} stack @param {number} i */
  function fixOverflow(stack, i) {
    for (let level = stack.length - 1; level >= 0; level--) {
      const node = stack[level].node;
      if (node.keys.length < order) return;
      push('overflow', i, [2], { active: node.id });
      const mid = Math.floor((order - 1) / 2);
      const median = node.keys[mid];
      const right = make(node.keys.slice(mid + 1), node.children.slice(mid + 1));
      node.keys = node.keys.slice(0, mid);
      node.children = node.children.slice(0, mid + 1);
      splits++;
      if (level === 0) {
        root = make([median], [node, right]);
        push('new-root', i, [3, 4], { active: root.id, partner: right.id, moved: median });
      } else {
        const parent = stack[level - 1];
        parent.node.keys.splice(parent.at, 0, median);
        parent.node.children.splice(parent.at + 1, 0, right);
        push('split', i, [3], { active: parent.node.id, partner: right.id, moved: median });
      }
    }
  }

  /** @param {{node: BNode, at: number}[]} stack @param {number} i */
  function fixUnderflow(stack, i) {
    for (let level = stack.length - 1; level >= 0; level--) {
      const node = stack[level].node;
      if (level === 0) {
        if (node.keys.length === 0) {
          root = node.children.length ? node.children[0] : null;
          if (root) push('shrink', i, [10], { active: root.id });
        }
        return;
      }
      if (node.keys.length >= low) return;
      push('underflow', i, [7], { active: node.id });

      const parent = stack[level - 1].node;
      const at = parent.children.indexOf(node);
      const left = at > 0 ? parent.children[at - 1] : null;
      const right = at + 1 < parent.children.length ? parent.children[at + 1] : null;
      reads += (left ? 1 : 0) + (right && (!left || left.keys.length <= low) ? 1 : 0);

      if (left && left.keys.length > low) {
        const up = /** @type {number} */ (left.keys.pop());
        node.keys.unshift(parent.keys[at - 1]);
        parent.keys[at - 1] = up;
        const moved = left.children.pop();
        if (moved) node.children.unshift(moved);
        borrows++;
        push('borrow', i, [8], { active: node.id, partner: left.id, moved: up });
        return;
      }
      if (right && right.keys.length > low) {
        const up = /** @type {number} */ (right.keys.shift());
        node.keys.push(parent.keys[at]);
        parent.keys[at] = up;
        const moved = right.children.shift();
        if (moved) node.children.push(moved);
        borrows++;
        push('borrow', i, [8], { active: node.id, partner: right.id, moved: up });
        return;
      }

      const into = left ?? node;
      const from = left ? node : /** @type {BNode} */ (right);
      const sep = left ? at - 1 : at;
      const separator = parent.keys[sep];
      into.keys = [...into.keys, separator, ...from.keys];
      into.children = [...into.children, ...from.children];
      parent.keys.splice(sep, 1);
      parent.children.splice(sep + 1, 1);
      merges++;
      push('merge', i, [9], { active: into.id, moved: separator });
    }
  }

  push('start', -1, [0]);

  ops.forEach((op, i) => {
    reads = 0;
    scanned = 0;
    path = [];
    const lines = op.type === 'search' ? [0] : op.type === 'insert' ? [1] : [0, 5];
    const { stack, hit } = walk(op.key, i, lines);

    if (op.type === 'search') {
      push(hit ? 'found' : 'missing', i, [0], {
        active: hit ? stack[stack.length - 1].node.id : -1,
      });
      return;
    }

    if (op.type === 'insert') {
      if (hit) {
        push('dup', i, [1], { active: stack[stack.length - 1].node.id });
        return;
      }
      if (stack.length === 0) {
        root = make([op.key]);
        push('place', i, [1], { active: root.id, moved: op.key });
        return;
      }
      const leaf = stack[stack.length - 1];
      leaf.node.keys.splice(leaf.at, 0, op.key);
      push('place', i, [1], { active: leaf.node.id, moved: op.key });
      fixOverflow(stack, i);
      return;
    }

    if (!hit) {
      push('missing', i, [0]);
      return;
    }
    push('found', i, [0, 5], { active: stack[stack.length - 1].node.id });

    const holder = stack[stack.length - 1];
    if (holder.node.children.length) {
      // The predecessor is the largest key of the subtree left of the key.
      let node = holder.node.children[holder.at];
      for (;;) {
        reads++;
        path.push(node.id);
        const at = node.children.length ? node.keys.length : node.keys.length - 1;
        stack.push({ node, at });
        push('read', i, [5], { active: node.id });
        if (!node.children.length) break;
        node = node.children[node.keys.length];
      }
      const leaf = node;
      const pred = leaf.keys[leaf.keys.length - 1];
      holder.node.keys[holder.at] = pred;
      push('swap-in', i, [5], { active: holder.node.id, partner: leaf.id, moved: pred });
      leaf.keys.pop();
      push('remove', i, [6], { active: leaf.id });
    } else {
      holder.node.keys.splice(holder.at, 1);
      push('remove', i, [6], { active: holder.node.id });
    }
    fixUnderflow(stack, i);
  });

  path = [];
  reads = 0;
  scanned = 0;
  push('done', -1, [0]);
  return frames;
}

/**
 * Pure drawing positions: leaves left to right, each parent centred over its children.
 * Widths and x are in key cells; `depth` is the level.
 * @param {BNode | null} root
 * @param {number} [gap]  Cells between sibling leaves.
 * @returns {{ nodes: {id: number, node: BNode, x: number, width: number, depth: number}[], edges: {from: number, to: number, slot: number}[], width: number, levels: number }}
 */
export function layoutBTree(root, gap = 0.5) {
  /** @type {{id: number, node: BNode, x: number, width: number, depth: number}[]} */
  const nodes = [];
  /** @type {{from: number, to: number, slot: number}[]} */
  const edges = [];
  let next = 0;
  let levels = 0;

  /** @param {BNode} node @param {number} depth @returns {{ x: number, width: number }} */
  function place(node, depth) {
    levels = Math.max(levels, depth + 1);
    const width = Math.max(1, node.keys.length);
    const entry = { id: node.id, node, x: 0, width, depth };
    nodes.push(entry);
    if (!node.children.length) {
      entry.x = next;
      next += width + gap;
    } else {
      const placed = node.children.map((c, slot) => {
        edges.push({ from: node.id, to: c.id, slot });
        return place(c, depth + 1);
      });
      const first = placed[0];
      const end = placed[placed.length - 1];
      entry.x = (first.x + end.x + end.width) / 2 - width / 2;
    }
    return entry;
  }
  if (root) place(root, 0);
  const left = Math.min(0, ...nodes.map((n) => n.x));
  for (const n of nodes) n.x -= left;
  return {
    nodes,
    edges,
    width: nodes.length ? Math.max(...nodes.map((n) => n.x + n.width)) : 0,
    levels,
  };
}

/**
 * @param {'grow'|'mixed'|'merge'|'random'} preset
 * @param {() => number} [rand]
 * @returns {BOp[]}
 */
export function makeOps(preset, rand = Math.random) {
  /** @param {number[]} keys @returns {BOp[]} */
  const inserts = (keys) => keys.map((key) => ({ type: 'insert', key }));
  if (preset === 'grow') return inserts([10, 20, 30, 40, 50, 60, 70]);
  if (preset === 'mixed') return inserts([50, 20, 80, 10, 30, 60, 90, 5, 15]);
  if (preset === 'merge') {
    return [
      ...inserts([10, 20, 30, 40, 50, 60, 70]),
      { type: 'delete', key: 70 },
      { type: 'delete', key: 40 },
    ];
  }
  /** @type {Set<number>} */
  const pool = new Set();
  while (pool.size < 12) pool.add(1 + Math.floor(rand() * 99));
  return inserts([...pool]);
}
