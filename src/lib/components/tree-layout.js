/**
 * Pure layout for tree drawings, shared by tree-view, heap-view and union-find-forest.
 *
 * Binary trees place nodes by in-order rank, so every key sits left of its right subtree and
 * a missing child still leaves its side empty. N-ary trees use a simple tidy layout: leaves
 * take the next column and a parent centres over its first and last child. A forest lays its
 * trees side by side.
 */

/** @typedef {import('./visual-state.js').VisualState} VisualState */

/**
 * @typedef {object} TreeNode
 * @property {string | number} id  Unique across the whole forest.
 * @property {string} label
 * @property {(TreeNode | null)[]} [children]  Binary trees use `[left, right]`, `null` for none.
 * @property {VisualState} [state]
 * @property {string} [marker]  A short glyph drawn at the node's corner.
 * @property {string} [edgeLabel]  Text on the edge from the parent (trie letters, weights).
 * @property {string} [note]  A small caption under the node (rank, size, balance).
 */

/**
 * @typedef {object} PlacedNode
 * @property {string | number} id
 * @property {TreeNode} node
 * @property {number} x  Column, possibly fractional in n-ary layouts.
 * @property {number} depth
 * @property {string | number | null} parent
 * @property {(string | number)[]} children  Present children, left to right.
 *
 * @typedef {object} TreeLayout
 * @property {PlacedNode[]} nodes  In pre-order, forest order.
 * @property {{from: string | number, to: string | number, label: string}[]} edges
 * @property {number} columns  Width in columns (max x + 1).
 * @property {number} levels  Height in levels (max depth + 1).
 * @property {Map<string | number, PlacedNode>} byId
 * @property {(string | number)[]} roots
 */

/** Gap in columns between neighbouring trees of a forest. */
const FOREST_GAP = 0.5;

/**
 * @param {TreeNode[]} roots
 * @param {{ binary?: boolean }} [options]
 * @returns {TreeLayout}
 */
export function layoutForest(roots, { binary = false } = {}) {
  /** @type {PlacedNode[]} */
  const nodes = [];
  /** @type {TreeLayout['edges']} */
  const edges = [];
  /** @type {Map<string | number, PlacedNode>} */
  const byId = new Map();
  let next = 0;

  /**
   * Places a subtree and returns its node; the node is pushed in pre-order.
   * @param {TreeNode} node @param {number} depth @param {string | number | null} parent
   * @returns {PlacedNode}
   */
  function place(node, depth, parent) {
    if (byId.has(node.id)) throw new Error(`Duplicate tree node id ${node.id}`);
    /** @type {PlacedNode} */
    const placed = { id: node.id, node, x: 0, depth, parent, children: [] };
    byId.set(node.id, placed);
    nodes.push(placed);
    const kids = node.children ?? [];
    if (parent !== null) edges.push({ from: parent, to: node.id, label: node.edgeLabel ?? '' });

    if (binary) {
      const [left, right] = kids;
      if (left) placed.children.push(place(left, depth + 1, node.id).id);
      placed.x = next++;
      if (right) placed.children.push(place(right, depth + 1, node.id).id);
      return placed;
    }

    const present = kids.filter((k) => k !== null);
    if (present.length === 0) {
      placed.x = next++;
      return placed;
    }
    const xs = present.map((k) => {
      const child = place(k, depth + 1, node.id);
      placed.children.push(child.id);
      return child.x;
    });
    placed.x = (xs[0] + xs[xs.length - 1]) / 2;
    return placed;
  }

  roots.forEach((root, i) => {
    if (i > 0) next += FOREST_GAP;
    place(root, 0, null);
  });

  return {
    nodes,
    edges,
    columns: nodes.length ? Math.max(...nodes.map((n) => n.x)) + 1 : 0,
    levels: nodes.length ? Math.max(...nodes.map((n) => n.depth)) + 1 : 0,
    byId,
    roots: roots.map((r) => r.id),
  };
}

/**
 * Where an arrow key moves focus in a laid-out tree: Up to the parent, Down to the first
 * child, Left and Right to the neighbouring sibling (or neighbouring root in a forest).
 * Returns null when there is nowhere to go or the key is not a tree key.
 * @param {TreeLayout} layout
 * @param {string | number} id
 * @param {string} key
 * @returns {string | number | null}
 */
export function treeNeighbor(layout, id, key) {
  const at = layout.byId.get(id);
  if (!at) return null;
  if (key === 'ArrowUp') return at.parent;
  if (key === 'ArrowDown') return at.children[0] ?? null;
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null;
  const row = at.parent === null ? layout.roots : (layout.byId.get(at.parent)?.children ?? []);
  const i = row.indexOf(id) + (key === 'ArrowLeft' ? -1 : 1);
  return row[i] ?? null;
}

/**
 * The order to draw nodes in: the ids already drawn keep their places, ids that left drop out
 * and new ids follow in layout order. A keyed list in this order never moves an element when
 * the tree changes shape, so a focused node keeps keyboard focus (moving a DOM element blurs
 * it). The first drawing is plain layout order.
 * @param {(string | number)[]} previous  The order of the last drawing.
 * @param {(string | number)[]} ids  The ids of the new layout, in layout order.
 * @returns {(string | number)[]}
 */
export function stableOrder(previous, ids) {
  const present = new Set(ids);
  const kept = previous.filter((id) => present.has(id));
  const seen = new Set(kept);
  for (const id of ids) if (!seen.has(id)) kept.push(id);
  return kept;
}

/**
 * The implicit binary tree of an array heap: slot i has children 2i + 1 and 2i + 2. Only the
 * first `size` slots belong to the heap (heapsort parks sorted values after them).
 * @param {(number | string)[]} values
 * @param {number} size
 * @param {(i: number) => Partial<Pick<TreeNode, 'state' | 'marker' | 'note'>>} [decorate]
 * @returns {TreeNode[]}
 */
export function heapForest(values, size, decorate = () => ({})) {
  const n = Math.min(size, values.length);
  /** @param {number} i @returns {TreeNode | null} */
  const build = (i) =>
    i >= n
      ? null
      : {
          id: i,
          label: String(values[i]),
          ...decorate(i),
          children: 2 * i + 1 < n ? [build(2 * i + 1), build(2 * i + 2)] : [],
        };
  const root = build(0);
  return root ? [root] : [];
}

/**
 * The forest a union-find parent array describes: every `i` with `parent[i] === i` is a root,
 * and children are listed in index order.
 * @param {number[]} parent
 * @param {(i: number) => Partial<Pick<TreeNode, 'state' | 'marker' | 'note'>>} [decorate]
 * @returns {TreeNode[]}
 */
export function parentForest(parent, decorate = () => ({})) {
  /** @type {number[][]} */
  const kids = parent.map(() => []);
  parent.forEach((p, i) => {
    if (p !== i && p >= 0 && p < parent.length) kids[p].push(i);
  });
  /** @param {number} i @returns {TreeNode} */
  const build = (i) => ({ id: i, label: String(i), ...decorate(i), children: kids[i].map(build) });
  return parent.flatMap((p, i) => (p === i ? [build(i)] : []));
}
