/**
 * Centroid decomposition of a tree, counting the pairs of nodes exactly K edges apart.
 *
 * The tree is a parent list, read as undirected edges. A centroid of a piece of the tree is a
 * node whose removal leaves no piece with more than half of its nodes; every tree has one. To
 * find it, size the piece from any node r, then walk from r towards a child whose subtree holds
 * more than half the piece, until there is none. Removing the centroid splits the piece, and
 * each part is decomposed the same way, its centroid becoming a child of this one in the
 * centroid tree. A part has at most half the nodes of its piece, so the centroid tree has
 * depth O(log n) and every node takes part in O(log n) pieces: O(n log n) work in all.
 *
 * Every path either passes through the centroid or lies inside one part. So the pairs at
 * distance K are counted at the first centroid that separates them (or is one of them): the
 * distances from the centroid are collected part by part, and a node at distance d pairs with
 * every node already seen at distance K − d. Pieces are processed depth first, parts in the
 * order of the centroid's neighbours (its parent, then its children).
 */

import {
  MAX_NODES,
  childrenOf,
  isRootedTree,
  lettered,
  randomParents,
} from './lca-binary-lifting.js';

export const MAX_K = 15;

export const centroidPseudocode = [
  'decompose(piece, p):',
  '  size[] = subtree sizes of the piece, rooted at its first node r',
  '  c = r; while c has a child w with size[w] > |piece| / 2: c = w',
  '  c is the centroid: no part left without c has more than |piece| / 2 nodes',
  '  count pairs through c: dist(x) + dist(y) = K, x and y in different parts (or y = c)',
  '  remove c; its parent in the centroid tree is p',
  '  for each part P left by removing c: decompose(P, c)',
];

/**
 * @typedef {object} CentroidFrame
 * @property {'start'|'component'|'walk'|'centroid'|'count'|'remove'|'done'} kind
 * @property {boolean[]} removed
 * @property {(number | null)[]} level  Depth in the centroid tree, null until removed.
 * @property {(number | null)[]} ctParent  Centroid-tree parent (−1 for its root), null until removed.
 * @property {number[]} piece  Nodes of the piece worked on, its first node r first.
 * @property {(number | null)[]} size  Subtree sizes inside the piece, rooted at r.
 * @property {(number | null)[]} dist  count: distance from the centroid inside the piece.
 * @property {number} c  The walk's node or the centroid, −1 when none.
 * @property {number[]} parts  centroid onwards: the sizes of the parts left without c.
 * @property {number[][]} pending  Pieces waiting, next one last.
 * @property {number} k
 * @property {number} pairs  Pairs at distance K found so far.
 * @property {number} added  count: pairs found at this centroid.
 * @property {number} work  Nodes sized so far, summed over all pieces.
 * @property {number[]} lines
 */

/**
 * @param {import('./lca-binary-lifting.js').RootedTree} t @param {number} k
 * @returns {CentroidFrame[]}
 */
export function centroidTrace(t, k) {
  if (!isRootedTree(t)) throw new Error('Not a rooted tree');
  if (!(Number.isInteger(k) && k >= 1)) throw new Error('K must be a positive whole number');
  const n = t.parent.length;
  const kids = childrenOf(t.parent);
  /** @type {number[][]} */
  const adj = kids.map((cs, v) => (t.parent[v] >= 0 ? [t.parent[v], ...cs] : cs.slice()));
  const removed = Array(n).fill(false);
  /** @type {(number | null)[]} */
  const level = Array(n).fill(null);
  /** @type {(number | null)[]} */
  const ctParent = Array(n).fill(null);
  /** @type {(number | null)[]} */
  let size = Array(n).fill(null);
  /** @type {(number | null)[]} */
  let dist = Array(n).fill(null);
  /** @type {number[]} */
  let piece = [];
  /** @type {number[]} */
  let parts = [];
  /** @type {{ nodes: number[], p: number }[]} */
  const stack = [{ nodes: [0], p: -1 }];
  let pairs = 0;
  let added = 0;
  let work = 0;
  /** @type {CentroidFrame[]} */
  const frames = [];

  /** @param {CentroidFrame['kind']} kind @param {number[]} lines @param {number} c */
  function push(kind, lines, c) {
    frames.push({
      kind,
      removed: removed.slice(),
      level: level.slice(),
      ctParent: ctParent.slice(),
      piece: piece.slice(),
      size: size.slice(),
      dist: dist.slice(),
      c,
      parts: parts.slice(),
      pending: stack.map((s) => s.nodes.slice()),
      k,
      pairs,
      added,
      work,
      lines: lines.slice(),
    });
  }

  /**
   * Nodes reachable from r without crossing a removed node, in DFS pre-order, with parents.
   * @param {number} r
   */
  function explore(r) {
    /** @type {number[]} */
    const order = [];
    /** @type {Map<number, number>} */
    const par = new Map([[r, -1]]);
    /** @param {number} x */
    const go = (x) => {
      order.push(x);
      for (const y of adj[x]) {
        if (removed[y] || par.has(y)) continue;
        par.set(y, x);
        go(y);
      }
    };
    go(r);
    return { order, par };
  }

  // The first piece is the whole tree; later ones are listed in full when they are pushed.
  stack[0].nodes = explore(0).order;
  push('start', [0], -1);

  while (stack.length > 0) {
    const { nodes, p } = /** @type {{ nodes: number[], p: number }} */ (stack.pop());
    const r = nodes[0];
    const { order, par } = explore(r);
    piece = order;
    parts = [];
    dist = Array(n).fill(null);
    size = Array(n).fill(null);
    for (let i = order.length - 1; i >= 0; i--) {
      const x = order[i];
      size[x] =
        1 +
        adj[x].reduce((s, y) => (par.get(y) === x ? s + /** @type {number} */ (size[y]) : s), 0);
    }
    work += order.length;
    added = 0;
    push('component', [0, 1], -1);

    const total = order.length;
    let c = r;
    for (;;) {
      const heavy = adj[c].find(
        (y) => par.get(y) === c && /** @type {number} */ (size[y]) * 2 > total,
      );
      if (heavy === undefined) break;
      c = heavy;
      push('walk', [2], c);
    }

    // The parts left without c: the subtrees of its children, and everything above it.
    parts = adj[c]
      .filter((y) => !removed[y])
      .map((y) =>
        par.get(y) === c
          ? /** @type {number} */ (size[y])
          : total - /** @type {number} */ (size[c]),
      );
    push('centroid', [2, 3], c);

    dist[c] = 0;
    /** @type {number[]} */
    const seen = Array(total + 1).fill(0);
    seen[0] = 1;
    const neighbours = adj[c].filter((y) => !removed[y]);
    /** @type {number[][]} */
    const partNodes = [];
    for (const y of neighbours) {
      /** @type {number[]} */
      const ds = [];
      /** @type {number[]} */
      const members = [];
      /** @param {number} x @param {number} from @param {number} d */
      const walk = (x, from, d) => {
        dist[x] = d;
        ds.push(d);
        members.push(x);
        for (const z of adj[x]) if (z !== from && !removed[z] && z !== c) walk(z, x, d + 1);
      };
      walk(y, c, 1);
      for (const d of ds) if (d <= k && k - d <= total) added += seen[k - d] ?? 0;
      for (const d of ds) seen[d]++;
      partNodes.push(members);
    }
    pairs += added;
    push('count', [4], c);

    removed[c] = true;
    ctParent[c] = p;
    level[c] = p < 0 ? 0 : /** @type {number} */ (level[p]) + 1;
    for (let i = partNodes.length - 1; i >= 0; i--) stack.push({ nodes: partNodes[i], p: c });
    // The piece is gone: what is left of it now waits as parts.
    piece = [];
    size = Array(n).fill(null);
    dist = Array(n).fill(null);
    push('remove', [5, 6], c);
  }

  piece = [];
  size = Array(n).fill(null);
  dist = Array(n).fill(null);
  parts = [];
  added = 0;
  push('done', [], -1);
  return frames;
}

/** Pairs of nodes exactly k edges apart, by a BFS from every node: the oracle. @param {number[]} parent @param {number} k */
export function pairsAtDistance(parent, k) {
  const kids = childrenOf(parent);
  const adj = kids.map((cs, v) => (parent[v] >= 0 ? [parent[v], ...cs] : cs));
  let count = 0;
  for (let s = 0; s < parent.length; s++) {
    const d = Array(parent.length).fill(-1);
    d[s] = 0;
    const queue = [s];
    for (let i = 0; i < queue.length; i++)
      for (const y of adj[queue[i]])
        if (d[y] < 0) {
          d[y] = d[queue[i]] + 1;
          queue.push(y);
        }
    for (let x = s + 1; x < parent.length; x++) if (d[x] === k) count++;
  }
  return count;
}

export const CENTROID_PRESETS = /** @type {const} */ (['sample', 'path', 'star', 'random']);
/** @typedef {typeof CENTROID_PRESETS[number]} CentroidPreset */

/**
 * @param {CentroidPreset} preset @param {() => number} [rand]
 * @returns {import('./lca-binary-lifting.js').RootedTree}
 */
export function makeCentroidPreset(preset, rand = Math.random) {
  if (preset === 'sample') return lettered([-1, 0, 0, 1, 1, 2, 3, 3, 4, 5, 5, 7, 9, 11]);
  if (preset === 'path') return lettered(Array.from({ length: 15 }, (_, i) => i - 1));
  if (preset === 'star') return lettered([-1, 0, 0, 0, 0, 0, 0, 0, 0]);
  return lettered(randomParents(8 + Math.floor(rand() * (MAX_NODES - 7)), rand));
}

/** The centroid tree's height in levels, from a finished trace. @param {CentroidFrame} f */
export const centroidLevels = (f) => Math.max(0, ...f.level.map((l) => (l === null ? 0 : l + 1)));
