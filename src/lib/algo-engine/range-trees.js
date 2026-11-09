/**
 * A two-level range tree on whole-number points, answering “which points lie in the rectangle
 * [x1, x2] × [y1, y2]?”. The primary tree is a balanced binary search tree on x with one point in
 * every node (the median of its part). Every node also keeps its associated structure: all the
 * points of its subtree sorted by y. A query searches x down to the split node, then walks one
 * path on each side. A subtree hanging inside the x range is canonical: its y-list is binary
 * searched instead of visiting its nodes. Each node on a path is checked on its own.
 */

/**
 * @typedef {object} RangePoint
 * @property {number} id
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {object} RangeQuery
 * @property {number} x1
 * @property {number} x2
 * @property {number} y1
 * @property {number} y2
 */

/**
 * @typedef {object} RangeNode
 * @property {number} id  The id of the point stored here.
 * @property {number} x
 * @property {number} y
 * @property {number | null} left
 * @property {number | null} right
 * @property {number[]} ys  Ids of the subtree’s points, sorted by y (then x, then id).
 */

/**
 * @typedef {object} RangeSearch
 * @property {number} node  The canonical subtree’s root.
 * @property {number[]} list  Its y-sorted ids.
 * @property {number} lo  First index with y ≥ y1.
 * @property {number} hi  First index with y > y2, so the matches are [lo, hi).
 * @property {number} comparisons  Comparisons the two binary searches made.
 */

/**
 * @typedef {object} RangeFrame
 * @property {'start' | 'build' | 'descend' | 'split' | 'none' | 'check' | 'search' | 'turn' | 'done'} kind
 * @property {number[]} lines
 * @property {RangePoint[]} points
 * @property {RangeNode[]} nodes  The tree, one node per point.
 * @property {number | null} root
 * @property {RangeQuery} query
 * @property {number | null} current  The node acted on now.
 * @property {number | null} split
 * @property {'left' | 'right' | null} side  Which path from the split node is being walked.
 * @property {'right' | 'left' | null} turn  Where a descend or path step goes next.
 * @property {boolean | null} hit  Whether the point just checked lies in the rectangle.
 * @property {number[]} visited  Nodes visited one by one, in order.
 * @property {number[]} canonical  Roots of the canonical subtrees found so far.
 * @property {RangeSearch | null} search  The binary search just made.
 * @property {number[]} reported  Ids of the points found so far.
 * @property {number} searches  Binary searches made.
 * @property {number} comparisons  y comparisons inside those searches.
 * @property {number} storage  Entries over all y-lists: the tree’s memory beyond its nodes.
 */

/** The plane the lesson’s points live on. */
export const GRID = { xMax: 12, yMax: 8 };
export const MAX_POINTS = 15;

export const rangeTreePseudocode = [
  'build(P): node = median of P by x; ys(node) = P sorted by y',
  '  node.left = build(points before it); node.right = build(points after it)',
  'query(x1, x2, y1, y2):',
  '  v = root',
  '  while v ≠ null and v.x ∉ [x1, x2]:',
  '    v = (v.x < x1) ? v.right : v.left',
  '  if v = null: return nothing',
  '  report v if v.y ∈ [y1, y2]',
  '  u = v.left    // left path',
  '  while u ≠ null:',
  '    if u.x ≥ x1:',
  '      report u if u.y ∈ [y1, y2]',
  '      binary search [y1, y2] in ys(u.right)',
  '      u = u.left',
  '    else: u = u.right',
  '  u = v.right   // right path',
  '  while u ≠ null:',
  '    if u.x ≤ x2:',
  '      report u if u.y ∈ [y1, y2]',
  '      binary search [y1, y2] in ys(u.left)',
  '      u = u.right',
  '    else: u = u.left',
  '  return the reported points',
];

/** @param {[number, number][]} coords @returns {RangePoint[]} */
const toPoints = (coords) => coords.map(([x, y], id) => ({ id, x, y }));

/** Point sets for the widget, each with a query that shows something. */
export const RANGE_PRESETS = {
  scatter: {
    points: toPoints([
      [1, 6],
      [2, 2],
      [3, 7],
      [4, 4],
      [5, 1],
      [6, 5],
      [7, 3],
      [8, 7],
      [9, 2],
      [10, 5],
      [11, 1],
      [12, 6],
      [6, 8],
    ]),
    query: { x1: 3, x2: 10, y1: 2, y2: 6 },
  },
  diagonal: {
    points: toPoints([
      [0, 0],
      [1, 1],
      [3, 2],
      [4, 3],
      [6, 4],
      [7, 5],
      [9, 6],
      [10, 7],
      [12, 8],
    ]),
    query: { x1: 2, x2: 8, y1: 0, y2: 8 },
  },
  column: {
    points: toPoints([
      [6, 0],
      [6, 2],
      [6, 4],
      [6, 6],
      [6, 8],
      [2, 3],
      [10, 5],
    ]),
    query: { x1: 5, x2: 7, y1: 1, y2: 5 },
  },
  empty: {
    points: toPoints([
      [1, 1],
      [2, 7],
      [4, 5],
      [9, 1],
      [10, 7],
      [11, 4],
    ]),
    query: { x1: 5, x2: 8, y1: 0, y2: 8 },
  },
};

/**
 * Distinct whole-number points on the plane.
 * @param {number} n
 * @param {() => number} [rand]
 * @returns {RangePoint[]}
 */
export function randomPoints(n, rand = Math.random) {
  const count = Math.min(n, MAX_POINTS);
  /** @type {RangePoint[]} */
  const out = [];
  while (out.length < count) {
    const x = Math.floor(rand() * (GRID.xMax + 1));
    const y = Math.floor(rand() * (GRID.yMax + 1));
    if (!out.some((p) => p.x === x && p.y === y)) out.push({ id: out.length, x, y });
  }
  return out;
}

/** @param {RangePoint} p @param {RangePoint} q */
const byX = (p, q) => p.x - q.x || p.y - q.y || p.id - q.id;
/** @param {RangePoint} p @param {RangePoint} q */
const byY = (p, q) => p.y - q.y || p.x - q.x || p.id - q.id;

/**
 * Builds the tree: the median by x at the top, each half below it. Points with equal x keep
 * their y order, so left subtree ≤ node ≤ right subtree in x always holds.
 * @param {RangePoint[]} points
 * @returns {{ root: number | null, nodes: RangeNode[] }}
 */
export function buildRangeTree(points) {
  const sorted = points.toSorted(byX);
  /** @type {RangeNode[]} */
  const nodes = [];
  /** @param {number} lo @param {number} hi @returns {number | null} */
  function build(lo, hi) {
    if (lo >= hi) return null;
    const mid = (lo + hi) >> 1;
    const p = sorted[mid];
    /** @type {RangeNode} */
    const node = {
      id: p.id,
      x: p.x,
      y: p.y,
      left: null,
      right: null,
      ys: sorted
        .slice(lo, hi)
        .toSorted(byY)
        .map((q) => q.id),
    };
    nodes.push(node);
    node.left = build(lo, mid);
    node.right = build(mid + 1, hi);
    return node.id;
  }
  const root = build(0, sorted.length);
  return { root, nodes };
}

/** The points in the rectangle, by checking each one: the oracle and the brute-force cost. */
/** @param {RangePoint[]} points @param {RangeQuery} q */
export const inRect = (points, q) =>
  points.filter((p) => q.x1 <= p.x && p.x <= q.x2 && q.y1 <= p.y && p.y <= q.y2);

/**
 * Runs one query and records every step.
 * @param {RangePoint[]} points  Distinct positions.
 * @param {RangeQuery} query  With x1 ≤ x2 and y1 ≤ y2.
 * @returns {RangeFrame[]}
 */
export function rangeTreeTrace(points, query) {
  const { root, nodes } = buildRangeTree(points);
  /** @type {Map<number, RangeNode>} */
  const byId = new Map(nodes.map((n) => [n.id, n]));
  /** @param {number} id */
  const at = (id) => /** @type {RangeNode} */ (byId.get(id));
  /** @type {Map<number, RangePoint>} */
  const pointOf = new Map(points.map((p) => [p.id, p]));
  const storage = nodes.reduce((sum, n) => sum + n.ys.length, 0);
  const { x1, x2, y1, y2 } = query;

  /** @type {RangeFrame[]} */
  const frames = [];
  /** @type {number | null} */
  let current = null;
  /** @type {number | null} */
  let split = null;
  /** @type {'left' | 'right' | null} */
  let side = null;
  /** @type {'left' | 'right' | null} */
  let turn = null;
  /** @type {boolean | null} */
  let hit = null;
  /** @type {number[]} */
  const visited = [];
  /** @type {number[]} */
  const canonical = [];
  /** @type {RangeSearch | null} */
  let search = null;
  /** @type {number[]} */
  const reported = [];
  let searches = 0;
  let comparisons = 0;

  /** @param {RangeFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      lines,
      points: points.map((p) => ({ ...p })),
      nodes: nodes.map((n) => ({ ...n, ys: n.ys.slice() })),
      root,
      query: { ...query },
      current,
      split,
      side,
      turn,
      hit,
      visited: visited.slice(),
      canonical: canonical.slice(),
      search: search && { ...search, list: search.list.slice() },
      reported: reported.slice(),
      searches,
      comparisons,
      storage,
    });

  /** Reports a node’s own point when its y fits; x is already known to fit. */
  /** @param {number} id @param {number[]} lines */
  function check(id, lines) {
    const node = at(id);
    hit = y1 <= node.y && node.y <= y2;
    if (hit) reported.push(id);
    search = null;
    push('check', lines);
    hit = null;
  }

  /**
   * Two binary searches in a canonical subtree’s y-list: the first y ≥ y1 and the first y > y2.
   * @param {number | null} id @param {number[]} lines
   */
  function searchSubtree(id, lines) {
    if (id === null) return;
    const list = at(id).ys;
    let count = 0;
    /** @param {(y: number) => boolean} before */
    const firstNot = (before) => {
      let lo = 0;
      let hi = list.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        count++;
        if (before(/** @type {RangePoint} */ (pointOf.get(list[mid])).y)) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };
    const lo = firstNot((y) => y < y1);
    const hi = firstNot((y) => y <= y2);
    canonical.push(id);
    searches++;
    comparisons += count;
    reported.push(...list.slice(lo, hi));
    search = { node: id, list: list.slice(), lo, hi, comparisons: count };
    push('search', lines);
  }

  push('start', [2]);
  push('build', [0, 1]);

  let v = root;
  current = v;
  while (v !== null && (at(v).x < x1 || at(v).x > x2)) {
    visited.push(v);
    turn = at(v).x < x1 ? 'right' : 'left';
    push('descend', [3, 4, 5]);
    v = turn === 'right' ? at(v).right : at(v).left;
    current = v;
  }
  turn = null;
  if (v === null) {
    push('none', [6]);
    current = null;
    push('done', [22]);
    return frames;
  }
  split = v;
  visited.push(v);
  push('split', [4]);
  check(v, [7]);

  /** @param {'left' | 'right'} which */
  function walk(which) {
    side = which;
    const l =
      which === 'left'
        ? { start: 8, loop: 9, test: 10, check: 11, search: 12, on: 13, off: 14 }
        : { start: 15, loop: 16, test: 17, check: 18, search: 19, on: 20, off: 21 };
    let u =
      which === 'left'
        ? at(/** @type {number} */ (split)).left
        : at(/** @type {number} */ (split)).right;
    current = u;
    search = null;
    push('turn', [l.start]);
    while (u !== null) {
      const node = at(u);
      current = u;
      visited.push(u);
      const inside = which === 'left' ? node.x >= x1 : node.x <= x2;
      if (inside) {
        check(u, [l.loop, l.test, l.check]);
        searchSubtree(which === 'left' ? node.right : node.left, [l.search]);
        u = which === 'left' ? node.left : node.right;
        turn = which;
      } else {
        u = which === 'left' ? node.right : node.left;
        turn = which === 'left' ? 'right' : 'left';
      }
      search = null;
      push('descend', inside ? [l.on] : [l.loop, l.test, l.off]);
      turn = null;
    }
  }

  walk('left');
  walk('right');
  side = null;
  current = null;
  search = null;
  push('done', [22]);
  return frames;
}
