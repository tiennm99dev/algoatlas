/**
 * Runs one sequence of operations through a plain binary search tree, an AVL tree and a skip
 * list, and counts the key comparisons each spends. Height counts nodes (empty 0, leaf 1). A
 * skip list compares a key each time it reads a next tower, and a tower's height comes from
 * fair coin flips drawn through the injected generator. A rank without stored counts compares
 * keys in sorted order until one is at least k; with subtree sizes or skip-list link widths it
 * costs one search walk. Rank is 1 plus the number of smaller keys.
 */

export const MAX_OPS = 40;
export const MAX_LIVE_KEYS = 15;
export const MIN_KEY = 0;
export const MAX_KEY = 99;
export const MAX_TOWER = 5;
export const DEFAULT_SEED = 1;

export const OP_LETTERS = /** @type {const} */ ({
  i: 'insert',
  s: 'search',
  d: 'delete',
  r: 'rank',
});

export const runnerPseudocode = [
  'for each operation in the sequence:',
  '  plain BST: walk from the root, no repairs',
  '  AVL tree: walk from the root, then rotate if a factor reaches ±2',
  '  skip list: move right and drop; an insert flips coins for its height',
  '  rank, no stored counts: compare keys in sorted order until one ≥ k',
  '  rank, stored counts: walk one path, adding what it skips',
  'compare total comparisons, the worst operation and the height',
];

/**
 * @typedef {object} RunnerOp
 * @property {'insert'|'search'|'delete'|'rank'} type
 * @property {number} key
 */

/**
 * @typedef {object} TreeShape
 * @property {number} key
 * @property {TreeShape | null} left
 * @property {TreeShape | null} right
 */

/**
 * @typedef {object} SkipTower
 * @property {number} key
 * @property {number} height
 */

/**
 * @typedef {object} StructureStats
 * @property {number} cost  Comparisons of this operation.
 * @property {number} total  Comparisons so far.
 * @property {number} worst  The dearest single operation so far.
 * @property {number} height  Tree height, or skip list levels in use.
 * @property {number[]} path  Keys compared by this operation.
 */

/**
 * @typedef {object} RunnerFrame
 * @property {'start'|'op'|'done'} kind
 * @property {number} opIndex  Index into ops, -1 for start and done.
 * @property {RunnerOp | null} op
 * @property {'added'|'dup'|'found'|'missing'|'removed'|'ranked'|null} outcome
 * @property {number | null} rank  The rank a rank operation found.
 * @property {number} size  Keys stored.
 * @property {StructureStats} bst
 * @property {StructureStats} avl
 * @property {StructureStats} skip
 * @property {TreeShape | null} bstTree
 * @property {TreeShape | null} avlTree
 * @property {SkipTower[]} towers  In key order.
 * @property {number} opRotations  AVL rotations of this operation.
 * @property {number} rotations  AVL rotations so far.
 * @property {number[]} lines
 */

/**
 * @typedef {object} TreeNode
 * @property {number} key
 * @property {TreeNode | null} left
 * @property {TreeNode | null} right
 * @property {number} height
 */

/** @param {TreeNode | null} n */
const heightOf = (n) => (n ? n.height : 0);

/** @param {TreeNode} n */
function refresh(n) {
  n.height = 1 + Math.max(heightOf(n.left), heightOf(n.right));
}

/** @param {TreeNode} n */
const balanceOf = (n) => heightOf(n.left) - heightOf(n.right);

/** A binary search tree that repairs its balance after each change when `balanced` is set. @param {boolean} balanced */
function makeTree(balanced) {
  /** @type {TreeNode | null} */
  let root = null;
  let rotations = 0;

  /** @param {TreeNode} n */
  function rotateRight(n) {
    const up = /** @type {TreeNode} */ (n.left);
    n.left = up.right;
    up.right = n;
    refresh(n);
    refresh(up);
    rotations++;
    return up;
  }

  /** @param {TreeNode} n */
  function rotateLeft(n) {
    const up = /** @type {TreeNode} */ (n.right);
    n.right = up.left;
    up.left = n;
    refresh(n);
    refresh(up);
    rotations++;
    return up;
  }

  /** @param {TreeNode} n @returns {TreeNode} */
  function fix(n) {
    refresh(n);
    if (!balanced) return n;
    const bf = balanceOf(n);
    if (bf === 2) {
      const child = /** @type {TreeNode} */ (n.left);
      if (balanceOf(child) < 0) n.left = rotateLeft(child);
      return rotateRight(n);
    }
    if (bf === -2) {
      const child = /** @type {TreeNode} */ (n.right);
      if (balanceOf(child) > 0) n.right = rotateRight(child);
      return rotateLeft(n);
    }
    return n;
  }

  /** @param {TreeNode | null} n @param {number} key @returns {TreeNode} */
  function add(n, key) {
    if (!n) return { key, left: null, right: null, height: 1 };
    if (key < n.key) n.left = add(n.left, key);
    else n.right = add(n.right, key);
    return fix(n);
  }

  /** @param {TreeNode | null} n @param {number} key @returns {TreeNode | null} */
  function drop(n, key) {
    if (!n) return null;
    if (key < n.key) n.left = drop(n.left, key);
    else if (key > n.key) n.right = drop(n.right, key);
    else if (!n.left || !n.right) return n.left ?? n.right;
    else {
      let s = n.right;
      while (s.left) s = s.left;
      n.key = s.key;
      n.right = drop(n.right, s.key);
    }
    return fix(n);
  }

  return {
    /** The keys a search compares on its way down, ending at the key if it is there. @param {number} key */
    walk(key) {
      /** @type {number[]} */
      const path = [];
      let x = root;
      while (x) {
        path.push(x.key);
        if (key === x.key) break;
        x = key < x.key ? x.left : x.right;
      }
      return { path, hit: x !== null };
    },
    /** @param {number} key */
    insert(key) {
      root = add(root, key);
    },
    /** @param {number} key */
    remove(key) {
      root = drop(root, key);
    },
    height: () => heightOf(root),
    rotationCount: () => rotations,
    /** @returns {TreeShape | null} */
    shape() {
      /** @param {TreeNode | null} n @returns {TreeShape | null} */
      const copy = (n) => n && { key: n.key, left: copy(n.left), right: copy(n.right) };
      return copy(root);
    },
  };
}

/** One coin-flip tower height: 1 plus the heads before the first tails, capped. @param {() => number} rand */
function rollHeight(rand) {
  let height = 1;
  while (height < MAX_TOWER && rand() < 0.5) height++;
  return height;
}

/** @param {SkipTower[]} towers @param {number} key */
function skipWalk(towers, key) {
  /** @type {number[]} */
  const path = [];
  const top = Math.max(1, ...towers.map((t) => t.height));
  let at = -1;
  let hit = false;
  for (let level = top; level >= 1; level--) {
    for (;;) {
      let next = at + 1;
      while (next < towers.length && towers[next].height < level) next++;
      if (next === towers.length) break;
      path.push(towers[next].key);
      if (towers[next].key < key) {
        at = next;
        continue;
      }
      if (towers[next].key === key) hit = true;
      break;
    }
  }
  return { path, hit };
}

/**
 * The generator a trace uses for its coin flips, so the same seed gives the same towers.
 * @param {number} seed
 */
export function seededRand(seed) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/**
 * @param {RunnerOp[]} ops
 * @param {{ rand?: () => number, counted?: boolean }} [options]  `counted` stores subtree sizes
 *   and link widths, so a rank costs one walk.
 * @returns {RunnerFrame[]}
 */
export function runnerTrace(ops, { rand = seededRand(DEFAULT_SEED), counted = false } = {}) {
  const bst = makeTree(false);
  const avl = makeTree(true);
  /** @type {SkipTower[]} */
  let towers = [];
  /** @type {RunnerFrame[]} */
  const frames = [];
  const totals = { bst: 0, avl: 0, skip: 0 };
  const worsts = { bst: 0, avl: 0, skip: 0 };

  /**
   * @param {RunnerFrame['kind']} kind
   * @param {number} opIndex
   * @param {RunnerFrame['outcome']} outcome
   * @param {number | null} rank
   * @param {{ bst: number[], avl: number[], skip: number[] }} paths
   * @param {number} opRotations
   * @param {number[]} lines
   */
  function push(kind, opIndex, outcome, rank, paths, opRotations, lines) {
    /** @param {'bst'|'avl'|'skip'} id @param {number} height @returns {StructureStats} */
    const stats = (id, height) => ({
      cost: paths[id].length,
      total: totals[id],
      worst: worsts[id],
      height,
      path: paths[id].slice(),
    });
    frames.push({
      kind,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      outcome,
      rank,
      size: towers.length,
      bst: stats('bst', bst.height()),
      avl: stats('avl', avl.height()),
      skip: stats('skip', Math.max(towers.length ? 1 : 0, ...towers.map((t) => t.height))),
      bstTree: bst.shape(),
      avlTree: avl.shape(),
      towers: towers.map((t) => ({ ...t })),
      opRotations,
      rotations: avl.rotationCount(),
      lines: lines.slice(),
    });
  }

  const none = { bst: [], avl: [], skip: [] };
  push('start', -1, null, null, none, 0, [0]);

  ops.forEach((op, i) => {
    const before = avl.rotationCount();
    const b = bst.walk(op.key);
    const a = avl.walk(op.key);
    const s = skipWalk(towers, op.key);
    /** @type {RunnerFrame['outcome']} */
    let outcome = s.hit ? 'found' : 'missing';
    /** @type {number | null} */
    let rank = null;
    let paths = { bst: b.path, avl: a.path, skip: s.path };
    let lines = [0, 1, 2, 3];

    if (op.type === 'insert') {
      outcome = s.hit ? 'dup' : 'added';
      if (!s.hit) {
        bst.insert(op.key);
        avl.insert(op.key);
        const height = rollHeight(rand);
        const at = towers.findIndex((t) => t.key > op.key);
        const tower = { key: op.key, height };
        towers = at < 0 ? [...towers, tower] : [...towers.slice(0, at), tower, ...towers.slice(at)];
      }
    } else if (op.type === 'delete') {
      outcome = s.hit ? 'removed' : 'missing';
      if (s.hit) {
        bst.remove(op.key);
        avl.remove(op.key);
        towers = towers.filter((t) => t.key !== op.key);
      }
    } else if (op.type === 'rank') {
      outcome = 'ranked';
      const smaller = towers.filter((t) => t.key < op.key);
      rank = smaller.length + 1;
      lines = [0, counted ? 5 : 4];
      if (!counted) {
        const stop = towers[smaller.length];
        const walked = [...smaller.map((t) => t.key), ...(stop ? [stop.key] : [])];
        paths = { bst: walked, avl: walked, skip: walked };
      }
    }

    for (const id of /** @type {const} */ (['bst', 'avl', 'skip'])) {
      totals[id] += paths[id].length;
      worsts[id] = Math.max(worsts[id], paths[id].length);
    }
    push('op', i, outcome, rank, paths, avl.rotationCount() - before, lines);
  });

  push('done', -1, null, null, none, 0, [6]);
  return frames;
}

/**
 * Reads a sequence such as `i5 i3 s5 d3 r5`: a letter (insert, search, delete, rank) and a key
 * from 0 to 99, separated by spaces or commas.
 * @param {string} text
 * @returns {{ ops: RunnerOp[] } | { error: 'empty'|'format'|'count'|'full' }}
 */
export function parseOps(text) {
  const parts = text
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length === 0) return { error: 'empty' };
  if (parts.length > MAX_OPS) return { error: 'count' };
  /** @type {RunnerOp[]} */
  const ops = [];
  /** @type {Set<number>} */
  const live = new Set();
  for (const part of parts) {
    const hit = /^([isdr])(\d{1,2})$/i.exec(part);
    if (!hit) return { error: 'format' };
    const letter = /** @type {keyof typeof OP_LETTERS} */ (hit[1].toLowerCase());
    const key = Number(hit[2]);
    const type = OP_LETTERS[letter];
    ops.push({ type, key });
    if (type === 'insert') live.add(key);
    if (type === 'delete') live.delete(key);
    if (live.size > MAX_LIVE_KEYS) return { error: 'full' };
  }
  return { ops };
}

/** @param {RunnerOp[]} ops */
export function formatOps(ops) {
  return ops.map((op) => `${op.type[0]}${op.key}`).join(' ');
}

export const RUNNER_PRESETS = /** @type {const} */ ([
  'sorted',
  'shuffled',
  'scoreboard',
  'window',
  'random',
]);

/**
 * @param {typeof RUNNER_PRESETS[number]} preset
 * @param {() => number} [rand]
 * @returns {RunnerOp[]}
 */
export function makeRunnerOps(preset, rand = Math.random) {
  /** @param {number[]} keys @returns {RunnerOp[]} */
  const inserts = (keys) => keys.map((key) => ({ type: 'insert', key }));
  /** @param {number[]} keys @returns {RunnerOp[]} */
  const searches = (keys) => keys.map((key) => ({ type: 'search', key }));
  if (preset === 'sorted') {
    return [
      ...inserts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
      ...searches([15, 14, 13, 12, 11]),
    ];
  }
  if (preset === 'shuffled') {
    return [
      ...inserts([7, 2, 13, 5, 11, 1, 15, 9, 4, 14, 3, 8, 12, 6, 10]),
      ...searches([1, 15, 8, 6, 10]),
    ];
  }
  if (preset === 'scoreboard') {
    const scores = [55, 82, 17, 93, 41, 68, 29, 76, 3, 60, 12, 99, 48, 35, 71];
    return [
      ...inserts(scores),
      ...scores.slice(0, 10).map((key) => ({ type: /** @type {const} */ ('rank'), key })),
    ];
  }
  if (preset === 'window') {
    /** @type {RunnerOp[]} */
    const ops = inserts([1, 2, 3, 4, 5, 6, 7, 8]);
    for (let i = 1; i <= 8; i++) {
      ops.push({ type: 'delete', key: i }, { type: 'insert', key: i + 8 });
    }
    return [...ops, { type: 'search', key: 16 }];
  }
  /** @type {Set<number>} */
  const pool = new Set();
  while (pool.size < 12) pool.add(Math.floor(rand() * 100));
  const keys = [...pool];
  return [
    ...inserts(keys),
    ...searches([keys[0], keys[5], keys[11]]),
    { type: 'rank', key: keys[3] },
    { type: 'delete', key: keys[6] },
  ];
}
