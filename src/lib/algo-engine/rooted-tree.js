/**
 * The small editable rooted-tree model the tree-technique lessons share.
 *
 * A tree is a parent list: node 0 is the root (parent −1) and every other node's parent has a
 * smaller index, so one forward pass sees a parent before its children. Every node also has a
 * stable letter name, so it keeps its name when other nodes are removed.
 */

/** Largest tree the editable lessons let a learner build. */
export const MAX_NODES = 16;

/**
 * A rooted tree with stable letter names, so a node keeps its name when others are removed.
 * @typedef {object} RootedTree
 * @property {string[]} labels
 * @property {number[]} parent  parent[0] = −1 and parent[v] < v for every other node.
 */

/** @param {RootedTree} t */
export function isRootedTree(t) {
  return (
    t.labels.length === t.parent.length &&
    t.parent.length > 0 &&
    t.parent[0] === -1 &&
    t.parent.every((p, v) => v === 0 || (Number.isInteger(p) && p >= 0 && p < v))
  );
}

/** Children of every node, in index order. @param {number[]} parent @returns {number[][]} */
export function childrenOf(parent) {
  /** @type {number[][]} */
  const kids = parent.map(() => []);
  parent.forEach((p, v) => {
    if (p >= 0) kids[p].push(v);
  });
  return kids;
}

/** Edges from the root down to every node. @param {number[]} parent */
export function depthsOf(parent) {
  /** @type {number[]} */
  const depth = [];
  parent.forEach((p, v) => (depth[v] = p < 0 ? 0 : depth[p] + 1));
  return depth;
}

/** First letter A–Z not used yet. @param {string[]} labels */
export function nextLabel(labels) {
  for (let c = 65; c <= 90; c++) {
    const l = String.fromCharCode(c);
    if (!labels.includes(l)) return l;
  }
  return '?';
}

/** @param {number[]} parent @returns {RootedTree} */
export const lettered = (parent) => ({
  labels: parent.map((_, i) => String.fromCharCode(65 + i)),
  parent: parent.slice(),
});

/**
 * Adds a new leaf under p, or returns null when the tree already has `max` nodes.
 * @param {RootedTree} t @param {number} p @param {number} [max]
 * @returns {RootedTree | null}
 */
export function addLeaf(t, p, max = MAX_NODES) {
  if (t.parent.length >= max) return null;
  return { labels: [...t.labels, nextLabel(t.labels)], parent: [...t.parent, p] };
}

/**
 * Removes v and everything below it. `keep` lists the old index of every node left, in their
 * new order, so a caller can carry its own per-node arrays across. The root cannot be removed.
 * @param {RootedTree} t @param {number} v
 * @returns {{ tree: RootedTree, keep: number[] }}
 */
export function removeSubtree(t, v) {
  const gone = t.parent.map(() => false);
  if (v > 0) t.parent.forEach((p, u) => (gone[u] = u === v || (p >= 0 && gone[p])));
  /** @type {number[]} */
  const keep = [];
  /** @type {number[]} */
  const newIndex = [];
  gone.forEach((g, u) => {
    newIndex[u] = g ? -1 : keep.length;
    if (!g) keep.push(u);
  });
  return {
    tree: {
      labels: keep.map((u) => t.labels[u]),
      parent: keep.map((u) => (t.parent[u] < 0 ? -1 : newIndex[t.parent[u]])),
    },
    keep,
  };
}

/**
 * A random parent list of n nodes, each node hanging under an earlier one. Recent nodes are
 * favoured, so the trees come out deeper than a uniform pick would make them.
 * @param {number} n @param {() => number} [rand]
 */
export function randomParents(n, rand = Math.random) {
  /** @type {number[]} */
  const parent = [-1];
  for (let v = 1; v < n; v++) {
    const span = Math.min(v, 4);
    parent.push(v - 1 - Math.floor(rand() * span));
  }
  return parent;
}
