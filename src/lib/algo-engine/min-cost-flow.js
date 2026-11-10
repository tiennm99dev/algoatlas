/**
 * The assignment problem: n workers (rows), n jobs (columns), a cost for each pair; give every
 * worker a different job at the smallest total cost. It is a min-cost flow on the bipartite
 * network s → row → column → t with unit capacities, and the Hungarian algorithm solves it by
 * successive shortest augmenting paths, one per row.
 *
 * Potentials u[i] (rows) and v[j] (columns) keep every reduced cost
 * r(i, j) = c(i, j) − u[i] − v[j] at 0 or more, and every matched pair at exactly 0. Adding row i
 * grows an alternating tree from it, Dijkstra-style: slack[j] is the smallest reduced cost from a
 * tree row to column j, the column with the smallest slack δ joins the tree, and δ is added to
 * the tree rows' u and taken from the tree columns' v, which keeps the tree tight and makes the
 * new column's edge tight. When the new column is free, the alternating path back to row i flips,
 * like an augmenting path in a matching. This is the O(n³) version with potentials.
 *
 * Rows and columns are 0-based; the cost matrix is square.
 */

/** Largest matrix the lesson draws. */
export const MAX_N = 5;
/** Costs range from 0 to MAX_COST. */
export const MAX_COST = 99;

/**
 * @typedef {object} HungarianFrame
 * @property {'start'|'row'|'scan'|'adjust'|'tight'|'free'|'augment'|'done'} kind
 * @property {number[]} u            Row potentials.
 * @property {number[]} v            Column potentials.
 * @property {number[][]} reduced    c(i, j) − u[i] − v[j].
 * @property {number[]} colOf        Column of each row, −1 when unassigned.
 * @property {number[]} rowOf        Row of each column, −1 when unassigned.
 * @property {number} root           Row being added, −1 when none.
 * @property {number} from           Tree row whose edges the scan reads, −1 when none.
 * @property {number[]} treeRows     Rows in the alternating tree.
 * @property {number[]} treeCols     Columns in the alternating tree.
 * @property {(number | null)[]} slack  Smallest reduced cost from the tree to each column outside it.
 * @property {number[]} via          Tree row that gives each column its slack, −1 when none.
 * @property {number} pick           Column with the smallest slack, −1 when none.
 * @property {number} delta          That slack δ.
 * @property {[number, number][]} path  Pairs (row, column) assigned by the last flip.
 * @property {number} cost           Total cost of the pairs assigned so far.
 * @property {number} bound          Σ u + Σ v.
 * @property {number} reads          Reduced costs read by the scans so far.
 * @property {number[]} lines
 */

export const hungarianPseudocode = [
  'u[i] = 0, v[j] = 0; reduced cost r(i, j) = c(i, j) − u[i] − v[j] ≥ 0',
  'for each row i: grow an alternating tree from row i',
  '  repeat: for each column j outside the tree,',
  '    slack[j] = min(slack[j], r(newest tree row, j))',
  '    δ = the smallest slack; j = its column',
  '    u += δ on tree rows, v −= δ on tree columns (r stays ≥ 0, r(·, j) becomes 0)',
  '    add column j to the tree; if j has a row, add that row and repeat',
  '  j is free: flip the alternating path from j back to row i',
  'return the assignment; its cost equals Σ u + Σ v',
];

/**
 * @param {{ costs: number[][] }} input  A square matrix of whole numbers.
 * @returns {HungarianFrame[]}
 */
export function hungarianTrace({ costs }) {
  const n = costs.length;
  const c = costs.map((row) => row.slice(0, n));
  const u = new Array(n).fill(0);
  const v = new Array(n).fill(0);
  const colOf = new Array(n).fill(-1);
  const rowOf = new Array(n).fill(-1);
  let root = -1;
  let from = -1;
  /** @type {number[]} */
  let treeRows = [];
  /** @type {number[]} */
  let treeCols = [];
  /** @type {(number | null)[]} */
  let slack = new Array(n).fill(null);
  let via = new Array(n).fill(-1);
  let pick = -1;
  let delta = 0;
  /** @type {[number, number][]} */
  let path = [];
  let reads = 0;

  /** @type {HungarianFrame[]} */
  const frames = [];
  /** @param {HungarianFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      u: u.slice(),
      v: v.slice(),
      reduced: c.map((row, i) => row.map((x, j) => x - u[i] - v[j])),
      colOf: colOf.slice(),
      rowOf: rowOf.slice(),
      root,
      from,
      treeRows: treeRows.slice(),
      treeCols: treeCols.slice(),
      slack: slack.slice(),
      via: via.slice(),
      pick,
      delta,
      path: path.map(([i, j]) => /** @type {[number, number]} */ ([i, j])),
      cost: colOf.reduce((sum, j, i) => sum + (j >= 0 ? c[i][j] : 0), 0),
      bound: u.reduce((a, b) => a + b, 0) + v.reduce((a, b) => a + b, 0),
      reads,
      lines,
    });

  push('start', [0]);
  for (let i = 0; i < n; i++) {
    root = i;
    treeRows = [i];
    treeCols = [];
    slack = new Array(n).fill(null);
    via = new Array(n).fill(-1);
    path = [];
    pick = -1;
    delta = 0;
    from = -1;
    push('row', [1]);
    from = i;
    for (;;) {
      for (let j = 0; j < n; j++) {
        if (treeCols.includes(j)) continue;
        reads++;
        const r = c[from][j] - u[from] - v[j];
        const s = slack[j];
        if (s === null || r < s) {
          slack[j] = r;
          via[j] = from;
        }
      }
      pick = -1;
      for (let j = 0; j < n; j++) {
        const s = slack[j];
        if (treeCols.includes(j) || s === null) continue;
        if (pick < 0 || s < /** @type {number} */ (slack[pick])) pick = j;
      }
      delta = /** @type {number} */ (slack[pick]);
      push('scan', [2, 3, 4]);
      if (delta > 0) {
        for (const r of treeRows) u[r] += delta;
        for (const j of treeCols) v[j] -= delta;
        slack = slack.map((s, j) => (s === null || treeCols.includes(j) ? s : s - delta));
        push('adjust', [5]);
      }
      treeCols.push(pick);
      slack[pick] = null;
      if (rowOf[pick] < 0) break;
      treeRows.push(rowOf[pick]);
      push('tight', [6]);
      from = rowOf[pick];
    }
    push('free', [6, 7]);
    // Flip: walk back from the free column through the rows that reached each column.
    path = [];
    for (let j = pick; j >= 0;) {
      const r = via[j];
      const prev = colOf[r];
      path.unshift([r, j]);
      j = r === i ? -1 : prev;
    }
    for (const [r, j] of path) {
      colOf[r] = j;
      rowOf[j] = r;
    }
    from = -1;
    pick = -1;
    delta = 0;
    slack = new Array(n).fill(null);
    push('augment', [7]);
  }
  root = -1;
  treeRows = [];
  treeCols = [];
  path = [];
  push('done', [8]);
  return frames;
}
