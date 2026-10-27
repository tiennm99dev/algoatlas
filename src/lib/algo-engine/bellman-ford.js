/**
 * Bellman-Ford on a directed weighted graph: relax every edge, in list order, for up to V − 1
 * rounds. A shortest path without cycles has at most V − 1 edges, and after round i every vertex
 * whose shortest path has at most i edges holds its exact distance, so V − 1 rounds suffice
 * whenever no negative cycle is reachable. A round that changes nothing ends the run early. If
 * all V − 1 rounds run, one more pass (round V) checks every edge: an edge that can still be
 * relaxed proves a negative cycle reachable from the source, and the parent links lead to it.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edges keep their order.
 */

/** Largest graph the lesson draws. */
export const MAX_NODES = 7;
/** Weights range from −MAX_WEIGHT to MAX_WEIGHT. */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} BfEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} BellmanFordFrame
 * @property {'start'|'round'|'improve'|'keep'|'early'|'check'|'ok'|'cycle'|'done'} kind
 * @property {number} round       Current round (1..V), 0 before the first.
 * @property {number} edge        Index of the edge in the input list, -1 when none.
 * @property {number} current     Tail u of the edge, -1 when none.
 * @property {number} neighbor    Head v of the edge, -1 when none.
 * @property {number} weight
 * @property {number} before      d[v] before the relaxation or check.
 * @property {number[]} dist      Label per vertex (Infinity = ∞).
 * @property {number[]} parent
 * @property {number[][]} table   Row r = labels after round r (row 0 = start); the last row is live.
 * @property {boolean} changed    A label changed in the current round.
 * @property {number} relaxations Edge checks so far, round V included.
 * @property {number} updates     Labels lowered so far.
 * @property {number[]} cycle     Vertices of the negative cycle, in edge order, on 'cycle'.
 * @property {number[]} lines
 */

export const bellmanFordPseudocode = [
  'dist[v] = ∞ for every v; dist[s] = 0',
  'repeat V − 1 times (round i = 1, 2, …):',
  '  for each edge (u, v, w) in the list:',
  '    if dist[u] + w < dist[v]:',
  '      dist[v] = dist[u] + w; parent[v] = u',
  '  if no label changed this round: stop early (no negative cycle)',
  'round V: for each edge (u, v, w):',
  '  if dist[u] + w < dist[v]:',
  '    report a negative cycle; stop',
  'return dist, parent',
];

/**
 * @param {number[]} ids
 * @param {BfEdge[]} edges
 */
function prepare(ids, edges) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {{u: number, v: number, w: number, edge: number}[]} */
  const list = [];
  edges.forEach((e, k) => {
    const u = index.get(e.from);
    const v = index.get(e.to);
    if (u !== undefined && v !== undefined && u !== v)
      list.push({ u, v, w: e.weight ?? 1, edge: k });
  });
  return { n: sorted.length, list };
}

/**
 * Follows parent links from a vertex that a round-V edge could still improve, lands on the
 * cycle after n steps, and lists the cycle in edge order, smallest vertex first.
 * @param {number[]} parent  Parent links with the improving edge applied.
 * @param {number} start
 * @param {number} n
 */
export function cycleFrom(parent, start, n) {
  let x = start;
  for (let i = 0; i < n && x >= 0; i++) x = parent[x];
  if (x < 0) return [];
  const cycle = [x];
  for (let y = parent[x]; y !== x; y = parent[y]) {
    if (y < 0 || cycle.length > n) return [];
    cycle.push(y);
  }
  cycle.reverse();
  // Start at the smallest vertex so the same cycle always reads the same way.
  const at = cycle.indexOf(Math.min(...cycle));
  return [...cycle.slice(at), ...cycle.slice(0, at)];
}

/**
 * @param {{ ids: number[], edges: BfEdge[], source: number }} input  `source` is a vertex index.
 * @returns {BellmanFordFrame[]}
 */
export function bellmanFordTrace({ ids, edges, source }) {
  const { n, list } = prepare(ids, edges);
  const dist = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  if (source >= 0 && source < n) dist[source] = 0;
  /** @type {number[][]} */
  const table = [dist.slice()];
  let round = 0;
  let changed = false;
  let relaxations = 0;
  let updates = 0;

  /** @type {BellmanFordFrame[]} */
  const frames = [];
  /** @param {Pick<BellmanFordFrame, 'kind'|'lines'> & Partial<BellmanFordFrame>} f */
  const push = (f) =>
    frames.push({
      edge: -1,
      current: -1,
      neighbor: -1,
      weight: 0,
      before: Infinity,
      cycle: [],
      ...f,
      round,
      dist: dist.slice(),
      parent: parent.slice(),
      table: table.map((r) => r.slice()),
      changed,
      relaxations,
      updates,
    });

  push({ kind: 'start', lines: [0] });
  for (round = 1; round <= n - 1; round++) {
    changed = false;
    table.push(dist.slice());
    push({ kind: 'round', lines: [1] });
    for (const { u, v, w, edge } of list) {
      relaxations++;
      const before = dist[v];
      const base = { edge, current: u, neighbor: v, weight: w, before };
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        parent[v] = u;
        updates++;
        changed = true;
        table[round][v] = dist[v];
        push({ kind: 'improve', ...base, lines: [2, 3, 4] });
      } else {
        push({ kind: 'keep', ...base, lines: [2, 3] });
      }
    }
    if (!changed) {
      push({ kind: 'early', lines: [5] });
      push({ kind: 'done', lines: [9] });
      return frames;
    }
  }

  // round === n here: the negative-cycle check.
  changed = false;
  table.push(dist.slice());
  push({ kind: 'check', lines: [6] });
  for (const { u, v, w, edge } of list) {
    relaxations++;
    const base = { edge, current: u, neighbor: v, weight: w, before: dist[v] };
    if (dist[u] + w < dist[v]) {
      const links = parent.slice();
      links[v] = u;
      push({ kind: 'cycle', ...base, cycle: cycleFrom(links, v, n), lines: [7, 8] });
      return frames;
    }
    push({ kind: 'ok', ...base, lines: [6, 7] });
  }
  push({ kind: 'done', lines: [9] });
  return frames;
}
