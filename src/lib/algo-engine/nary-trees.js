/**
 * Tree recursion on a general (n-ary) rooted tree stored as children lists. One postorder DFS
 * returns facts from the leaves up: the subtree size (1 + the children's sizes), the height in
 * edges (1 + the tallest child, a leaf has 0) and the longest path that bends at each node
 * (the two tallest children plus the two edges to them). The largest bend is the tree's
 * diameter, counted in edges.
 */

export const MAX_NODES = 16;
export const MAX_DEPTH = 4;
export const MAX_CHILDREN = 6;

export const naryPseudocode = [
  'dfs(v):',
  '  size = 1; a = b = −1   (two tallest child heights)',
  '  for each child c in v.children:',
  '    dfs(c)',
  '    size += size(c); keep the two tallest heights in a ≥ b',
  '  height(v) = a + 1',
  '  diameter = max(diameter, a + b + 2)',
];

/**
 * A rooted tree: node 0 is the root, `parent[v]` is v's parent (-1 for the root), and the
 * children of v are the nodes whose parent is v, in index order.
 * @typedef {object} NaryTree
 * @property {string[]} labels
 * @property {number[]} parent
 */

/**
 * @typedef {object} NaryFrame
 * @property {'start'|'enter'|'descend'|'add'|'up'|'done'} kind
 * @property {number} current  Node acted on, -1 when none.
 * @property {number} child  The child being entered or added back, -1 when none.
 * @property {(number | null)[]} size  Running size while a node is open, final once it is done.
 * @property {(number | null)[]} height  Null until the node is done.
 * @property {(number | null)[]} bend  a + b + 2 for finished nodes: the longest path bending there.
 * @property {boolean[]} done
 * @property {[number, number]} top  The running a ≥ b of the current node.
 * @property {number} diameter  Best so far, -1 before any node finishes.
 * @property {number} best  Node where the best bend sits, -1 before any node finishes.
 * @property {number[]} stack  Open dfs calls, outermost first.
 * @property {number[]} path  The diameter path, filled on the last frame.
 * @property {number} calls
 * @property {number[]} lines
 */

/** Children lists in index order. @param {NaryTree} t @returns {number[][]} */
export function childrenLists(t) {
  /** @type {number[][]} */
  const kids = t.labels.map(() => []);
  t.parent.forEach((p, v) => {
    if (p >= 0) kids[p].push(v);
  });
  return kids;
}

/** @param {NaryTree} t @param {number} v */
export function depthOf(t, v) {
  let d = 0;
  for (let u = v; t.parent[u] >= 0; u = t.parent[u]) d++;
  return d;
}

/** True when node 0 is the only root and every parent comes earlier. @param {NaryTree} t */
export function isTree(t) {
  return (
    t.labels.length === t.parent.length &&
    t.labels.length > 0 &&
    t.parent[0] === -1 &&
    t.parent.every((p, v) => v === 0 || (p >= 0 && p < v))
  );
}

/**
 * @param {NaryTree} t
 * @returns {NaryFrame[]}
 */
export function naryTrace(t) {
  if (!isTree(t)) throw new Error('Not a rooted tree');
  const kids = childrenLists(t);
  const n = t.labels.length;
  /** @type {(number | null)[]} */
  const size = Array(n).fill(null);
  /** @type {(number | null)[]} */
  const height = Array(n).fill(null);
  /** @type {(number | null)[]} */
  const bend = Array(n).fill(null);
  /** @type {boolean[]} */
  const done = Array(n).fill(false);
  /** @type {[number, number][]} */
  const tops = Array.from({ length: n }, () => [-1, -1]);
  /** @type {number[]} */
  const stack = [];
  /** @type {number[]} */
  let path = [];
  let diameter = -1;
  let best = -1;
  let calls = 0;
  /** @type {NaryFrame[]} */
  const frames = [];

  /** @param {NaryFrame['kind']} kind @param {number} current @param {number} child @param {number[]} lines */
  function push(kind, current, child, lines) {
    frames.push({
      kind,
      current,
      child,
      size: size.slice(),
      height: height.slice(),
      bend: bend.slice(),
      done: done.slice(),
      top: current >= 0 ? [tops[current][0], tops[current][1]] : [-1, -1],
      diameter,
      best,
      stack: stack.slice(),
      path: path.slice(),
      calls,
      lines: lines.slice(),
    });
  }

  /** @param {number} v */
  function dfs(v) {
    calls++;
    stack.push(v);
    size[v] = 1;
    push('enter', v, -1, [0, 1]);
    for (const c of kids[v]) {
      push('descend', v, c, [2, 3]);
      dfs(c);
      size[v] = /** @type {number} */ (size[v]) + /** @type {number} */ (size[c]);
      const h = /** @type {number} */ (height[c]);
      const top = tops[v];
      if (h > top[0]) tops[v] = [h, top[0]];
      else if (h > top[1]) tops[v] = [top[0], h];
      push('add', v, c, [4]);
    }
    const [a, b] = tops[v];
    height[v] = a + 1;
    bend[v] = a + b + 2;
    done[v] = true;
    if (/** @type {number} */ (bend[v]) > diameter) {
      diameter = /** @type {number} */ (bend[v]);
      best = v;
    }
    push('up', v, -1, [5, 6]);
    stack.pop();
  }

  push('start', -1, -1, [0]);
  dfs(0);

  /** Follows the tallest child down from c. @param {number} c */
  const chain = (c) => {
    const out = [c];
    for (let u = c; kids[u].length > 0;) {
      u = kids[u].reduce((x, y) =>
        /** @type {number} */ (height[y]) > /** @type {number} */ (height[x]) ? y : x,
      );
      out.push(u);
    }
    return out;
  };
  const byHeight = kids[best]
    .slice()
    .sort((x, y) => /** @type {number} */ (height[y]) - /** @type {number} */ (height[x]) || x - y);
  const left = byHeight[0] === undefined ? [] : chain(byHeight[0]).reverse();
  const right = byHeight[1] === undefined ? [] : chain(byHeight[1]);
  path = [...left, best, ...right];
  push('done', -1, -1, []);
  return frames;
}

/** First letter A–Z not used yet. @param {NaryTree} t */
export function nextLabel(t) {
  for (let c = 65; c <= 90; c++) {
    const l = String.fromCharCode(c);
    if (!t.labels.includes(l)) return l;
  }
  return '?';
}

/**
 * @typedef {{ ok: true, tree: NaryTree } | { ok: false, error: 'full' | 'depth' | 'wide' }} NaryEdit
 */

/** Adds a new last child under v. @param {NaryTree} t @param {number} v @returns {NaryEdit} */
export function addChild(t, v) {
  if (t.labels.length >= MAX_NODES) return { ok: false, error: 'full' };
  if (depthOf(t, v) >= MAX_DEPTH) return { ok: false, error: 'depth' };
  if (childrenLists(t)[v].length >= MAX_CHILDREN) return { ok: false, error: 'wide' };
  return {
    ok: true,
    tree: { labels: [...t.labels, nextLabel(t)], parent: [...t.parent, v] },
  };
}

/**
 * Removes v and everything below it, renumbering the rest in their old order. Removing the
 * root is refused by returning the tree unchanged.
 * @param {NaryTree} t @param {number} v @returns {NaryTree}
 */
export function removeSubtree(t, v) {
  if (v <= 0) return { labels: t.labels.slice(), parent: t.parent.slice() };
  /** @type {boolean[]} */
  const gone = t.labels.map(() => false);
  // Parents come before children, so one forward pass marks the whole subtree.
  t.parent.forEach((p, u) => {
    gone[u] = u === v || (p >= 0 && gone[p]);
  });
  /** @type {number[]} */
  const newIndex = [];
  let k = 0;
  gone.forEach((g, u) => (newIndex[u] = g ? -1 : k++));
  /** @type {NaryTree} */
  const out = { labels: [], parent: [] };
  t.labels.forEach((l, u) => {
    if (gone[u]) return;
    out.labels.push(l);
    out.parent.push(t.parent[u] < 0 ? -1 : newIndex[t.parent[u]]);
  });
  return out;
}

/** @param {number[]} parent @returns {NaryTree} */
const fromParents = (parent) => ({
  labels: parent.map((_, i) => String.fromCharCode(65 + i)),
  parent: parent.slice(),
});

export const PRESETS = /** @type {const} */ (['org', 'skewed', 'star', 'path', 'random']);
/** @typedef {typeof PRESETS[number]} NaryPreset */

/**
 * @param {NaryPreset} preset
 * @param {() => number} [rand]
 * @returns {NaryTree}
 */
export function makeTree(preset, rand = Math.random) {
  if (preset === 'org') return fromParents([-1, 0, 1, 1, 0, 0, 5, 6, 5, 5]);
  if (preset === 'skewed') return fromParents([-1, 0, 1, 2, 3, 1, 5]);
  if (preset === 'star') return fromParents([-1, 0, 0, 0, 0, 0, 0]);
  if (preset === 'path') return fromParents([-1, 0, 1, 2, 3]);
  /** @type {NaryTree} */
  let t = fromParents([-1]);
  const target = 6 + Math.floor(rand() * 7);
  for (let tries = 0; t.labels.length < target && tries < 200; tries++) {
    const r = addChild(t, Math.floor(rand() * t.labels.length));
    if (r.ok) t = r.tree;
  }
  return t;
}
