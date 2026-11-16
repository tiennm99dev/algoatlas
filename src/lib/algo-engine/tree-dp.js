/**
 * Two dynamic programs on a rooted tree, traced step by step.
 *
 * The tree is a parent list with node 0 as the root and parent[i] < i for every other node, so
 * nodes are numbered in an order where a parent always comes before its children. Children are
 * visited in increasing number.
 *
 * - Maximum-weight independent set: pick nodes with the largest total weight so that no two
 *   picked nodes share an edge. In post-order, inc[v] is the best total of v's subtree with v
 *   picked and exc[v] the best with v left out: inc[v] = w[v] + Σ exc[c] and
 *   exc[v] = Σ max(inc[c], exc[c]). The set is read back top-down; a free node is picked when
 *   inc[v] ≥ exc[v].
 * - Rerooting, the sum of distances: for every node, the total number of edges to all other
 *   nodes. A post-order pass computes size[v] and sub[v], the distance sum to the nodes of v's
 *   subtree. Then all[root] = sub[root], and a pre-order pass moves the root across each edge:
 *   all[c] = all[v] − size[c] + (n − size[c]), since size[c] nodes come one step closer and the
 *   other n − size[c] one step further away.
 */

/** @typedef {'mis'|'reroot'} TreeProblem */

/**
 * @typedef {object} TreeInput
 * @property {number[]} parent  parent[0] = −1, parent[i] < i.
 * @property {number[]} weight  w[i] ≥ 0; only the independent set reads it.
 */

/**
 * @typedef {object} TreeDpFrame
 * @property {'start'|'enter'|'merge'|'settle'|'answer'|'pick'|'root'|'move'|'done'} kind
 * @property {TreeProblem} problem
 * @property {number} n
 * @property {number[]} parent
 * @property {number[]} weight
 * @property {number} v  The node worked on, −1 for none.
 * @property {number} c  merge, move: the child read or reached; −1 for none.
 * @property {number[]} stack  The recursion stack, root first.
 * @property {(number|null)[]} inc  mis: best with the node picked; null until entered.
 * @property {(number|null)[]} exc  mis: best with the node left out.
 * @property {(boolean|null)[]} taken  mis: the read-back choice; null until decided.
 * @property {(number|null)[]} size  reroot: nodes in the subtree.
 * @property {(number|null)[]} sub  reroot: distance sum to the subtree's nodes.
 * @property {(number|null)[]} all  reroot: distance sum to every node.
 * @property {boolean[]} settled  Nodes whose post-order values are final.
 * @property {number} edges  Edge visits so far.
 * @property {number|null} result  mis: the best total; reroot: the smallest distance sum.
 * @property {number[]} lines
 */

export const MAX_NODES = 12;
export const MAX_WEIGHT = 20;

/** @type {{key: string, tree: TreeInput}[]} */
export const TREE_PRESETS = [
  {
    key: 'company',
    tree: { parent: [-1, 0, 0, 0, 1, 1, 3, 3], weight: [3, 5, 2, 4, 6, 1, 3, 3] },
  },
  {
    key: 'path',
    tree: { parent: [-1, 0, 1, 2, 3, 4], weight: [4, 5, 4, 3, 6, 2] },
  },
  {
    key: 'star',
    tree: { parent: [-1, 0, 0, 0, 0, 0], weight: [9, 2, 3, 1, 2, 2] },
  },
];

/** @type {Record<TreeProblem, string[]>} */
export const treeDpPseudocode = {
  mis: [
    'solve(v):                       // post-order',
    '  inc[v] = w[v]; exc[v] = 0',
    '  for each child c of v:',
    '    solve(c)',
    '    inc[v] += exc[c]             // v picked: c left out',
    '    exc[v] += max(inc[c], exc[c]) // v left out: c is free',
    'answer = max(inc[root], exc[root])',
    'top-down: pick a free v if inc[v] ≥ exc[v]',
  ],
  reroot: [
    'down(v):                        // post-order',
    '  size[v] = 1; sub[v] = 0',
    '  for each child c: down(c)',
    '    size[v] += size[c]; sub[v] += sub[c] + size[c]',
    'all[root] = sub[root]',
    'up(v):                          // pre-order',
    '  for each child c:',
    '    all[c] = all[v] − size[c] + (n − size[c])',
  ],
};

/** Children of every node, in increasing order. @param {number[]} parent */
export function childrenOf(parent) {
  /** @type {number[][]} */
  const kids = parent.map(() => []);
  parent.forEach((p, i) => {
    if (p >= 0) kids[p].push(i);
  });
  return kids;
}

/** Adds a child of weight w under node p. @param {TreeInput} t @param {number} p @param {number} w */
export function addChild(t, p, w) {
  return { parent: [...t.parent, p], weight: [...t.weight, w] };
}

/**
 * Removes node v and its subtree, renumbering the rest in order, so parent[i] < i still holds.
 * @param {TreeInput} t @param {number} v
 */
export function removeSubtree(t, v) {
  const gone = t.parent.map(() => false);
  t.parent.forEach((p, i) => {
    gone[i] = i === v || (p >= 0 && gone[p]);
  });
  /** @type {number[]} */
  const newId = [];
  let next = 0;
  gone.forEach((g, i) => (newId[i] = g ? -1 : next++));
  const keep = t.parent.map((_, i) => i).filter((i) => !gone[i]);
  return {
    parent: keep.map((i) => (t.parent[i] < 0 ? -1 : newId[t.parent[i]])),
    weight: keep.map((i) => t.weight[i]),
  };
}

/**
 * A random tree of n nodes: each node hangs under an earlier one.
 * @param {number} n @param {() => number} [rand]
 * @returns {TreeInput}
 */
export function randomTree(n, rand = Math.random) {
  const parent = [-1];
  const weight = [1 + Math.floor(rand() * 9)];
  for (let i = 1; i < n; i++) {
    parent.push(Math.floor(rand() * i));
    weight.push(1 + Math.floor(rand() * 9));
  }
  return { parent, weight };
}

/**
 * @param {TreeProblem} problem
 * @param {TreeInput} tree
 * @returns {TreeDpFrame[]}
 */
export function treeDpTrace(problem, tree) {
  const { parent, weight } = tree;
  const n = parent.length;
  const kids = childrenOf(parent);
  const mis = problem === 'mis';
  /** @type {(number|null)[]} */
  const inc = Array(n).fill(null);
  /** @type {(number|null)[]} */
  const exc = Array(n).fill(null);
  /** @type {(boolean|null)[]} */
  const taken = Array(n).fill(null);
  /** @type {(number|null)[]} */
  const size = Array(n).fill(null);
  /** @type {(number|null)[]} */
  const sub = Array(n).fill(null);
  /** @type {(number|null)[]} */
  const all = Array(n).fill(null);
  const settled = Array(n).fill(false);
  /** @type {number[]} */
  const stack = [];
  /** @type {TreeDpFrame[]} */
  const frames = [];
  let edges = 0;

  /** @param {Pick<TreeDpFrame, 'kind'|'lines'> & Partial<TreeDpFrame>} f */
  const push = (f) =>
    frames.push({
      v: -1,
      c: -1,
      result: null,
      ...f,
      lines: f.lines.slice(),
      problem,
      n,
      parent: parent.slice(),
      weight: weight.slice(),
      stack: stack.slice(),
      inc: inc.slice(),
      exc: exc.slice(),
      taken: taken.slice(),
      size: size.slice(),
      sub: sub.slice(),
      all: all.slice(),
      settled: settled.slice(),
      edges,
    });

  const num = (/** @type {number|null} */ x) => /** @type {number} */ (x);

  push({ kind: 'start', lines: [0] });

  /** @param {number} v */
  function down(v) {
    stack.push(v);
    if (mis) {
      inc[v] = weight[v];
      exc[v] = 0;
    } else {
      size[v] = 1;
      sub[v] = 0;
    }
    push({ kind: 'enter', lines: v === 0 ? [0, 1] : mis ? [3, 1] : [2, 1], v });
    for (const c of kids[v]) {
      down(c);
      edges++;
      if (mis) {
        inc[v] = num(inc[v]) + num(exc[c]);
        exc[v] = num(exc[v]) + Math.max(num(inc[c]), num(exc[c]));
        push({ kind: 'merge', lines: [2, 4, 5], v, c });
      } else {
        size[v] = num(size[v]) + num(size[c]);
        sub[v] = num(sub[v]) + num(sub[c]) + num(size[c]);
        push({ kind: 'merge', lines: [3], v, c });
      }
    }
    settled[v] = true;
    push({ kind: 'settle', lines: [2], v });
    stack.pop();
  }

  if (n > 0) down(0);

  if (mis) {
    const result = n ? Math.max(num(inc[0]), num(exc[0])) : 0;
    push({ kind: 'answer', lines: [6], v: n ? 0 : -1, result });
    for (let v = 0; v < n; v++) {
      const free = v === 0 || !taken[parent[v]];
      taken[v] = free && num(inc[v]) >= num(exc[v]);
      push({ kind: 'pick', lines: [7], v, result });
    }
    push({ kind: 'done', lines: [7], result });
    return frames;
  }

  if (n > 0) {
    all[0] = sub[0];
    push({ kind: 'root', lines: [4], v: 0 });
  }
  /** @param {number} v */
  function up(v) {
    stack.push(v);
    for (const c of kids[v]) {
      edges++;
      all[c] = num(all[v]) - num(size[c]) + (n - num(size[c]));
      push({ kind: 'move', lines: [5, 6, 7], v, c });
      up(c);
    }
    stack.pop();
  }
  if (n > 0) up(0);
  const result = n ? Math.min(.../** @type {number[]} */ (all)) : 0;
  push({ kind: 'done', lines: [7], result });
  return frames;
}
