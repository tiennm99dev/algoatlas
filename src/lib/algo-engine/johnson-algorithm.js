/**
 * Johnson's algorithm for all-pairs shortest paths on a directed weighted graph that may have
 * negative edge weights.
 *
 * 1. Add a new vertex q with a 0-weight edge to every vertex and run Bellman-Ford from q. The
 *    distances h(v) = δ(q, v) are the potentials. A negative cycle found here stops the run.
 * 2. Reweight every edge: w′(u, v) = w(u, v) + h(u) − h(v). The triangle inequality
 *    h(v) ≤ h(u) + w(u, v) makes every w′ non-negative, and along any path the h terms
 *    telescope, so every path from s to t changes by the same h(s) − h(t): shortest paths stay
 *    shortest.
 * 3. Run Dijkstra from every vertex s with the weights w′, then undo the shift:
 *    d(s, t) = d′(s, t) − h(s) + h(t).
 *
 * Bellman-Ford relaxes the edges of q first, then the graph's edges in list order, and stops
 * early after a round with no change. Dijkstra picks the unsettled vertex with the smallest d′
 * by a linear scan (ties go to the lower index), which is what a binary heap would return.
 * Vertices are numbered by their position in `ids` sorted ascending.
 */

/** Largest graph the lesson draws. */
export const MAX_NODES = 6;
/** Weights range from −MAX_WEIGHT to MAX_WEIGHT. */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} JohnsonEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {'start'|'bf-round'|'bf-q'|'bf-lower'|'bf-early'|'bf-check'|'cycle'|'reweight'|'dij-start'|'settle'|'lower'|'row'|'done'} JohnsonKind
 */

/**
 * @typedef {object} JohnsonFrame
 * @property {JohnsonKind} kind
 * @property {number} round        Bellman-Ford round (1..V), 0 outside that phase.
 * @property {number} edge         Index of the edge in the input list, -1 when none.
 * @property {number} current      Tail u of the edge or the settled vertex, -1 when none or q.
 * @property {number} neighbor     Head v of the edge, -1 when none.
 * @property {number} before       Old label of v on 'bf-lower' and 'lower'.
 * @property {number} source       Source of the current Dijkstra run, -1 outside that phase.
 * @property {number[]} h          Potential per vertex (Infinity = not set yet).
 * @property {(number | null)[]} reweighted  w′ per input edge, null until reweighted or invalid.
 * @property {number[]} dPrime     Dijkstra labels d′ of the current run (Infinity = ∞).
 * @property {number[]} settled    Vertices settled in the current run, in order.
 * @property {number[]} parent     Dijkstra parents of the current run.
 * @property {(number | null)[][]} matrix  Row s = d(s, ·) once run s is done, else nulls.
 * @property {number[]} cycle      Vertices of the negative cycle, in edge order, from 'cycle' on.
 * @property {number} bfChecks     Edge checks by Bellman-Ford, q's edges included.
 * @property {number} dijkstraChecks Edge checks by all Dijkstra runs so far.
 * @property {number[]} lines
 */

export const johnsonPseudocode = [
  'add a vertex q and an edge q → v of weight 0 for every v',
  'Bellman-Ford from q: h[q] = 0, every other h = ∞; up to V rounds:',
  '  for each edge (u, v, w): if h[u] + w < h[v]: h[v] = h[u] + w',
  'if an edge can still be relaxed: negative cycle; stop',
  'for each edge (u, v, w): w′ = w + h[u] − h[v]        // w′ ≥ 0',
  'for each vertex s:',
  '  Dijkstra from s with weights w′: d′[s] = 0, others ∞',
  '    settle the unsettled vertex u with the smallest d′',
  '    for each edge u → v: if d′[u] + w′ < d′[v]: d′[v] = d′[u] + w′',
  '  d[s][t] = d′[t] − h[s] + h[t] for every t',
  'return the matrix d',
];

/**
 * @param {number[]} ids
 * @param {JohnsonEdge[]} edges
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
 * Follows parent links back from a vertex an edge could still improve, lands on the cycle after
 * n steps, and lists the cycle in edge order, smallest vertex first.
 * @param {number[]} parent
 * @param {number} start
 * @param {number} n
 */
function cycleFrom(parent, start, n) {
  let x = start;
  for (let i = 0; i < n && x >= 0; i++) x = parent[x];
  if (x < 0) return [];
  const cycle = [x];
  for (let y = parent[x]; y !== x; y = parent[y]) {
    if (y < 0 || cycle.length > n) return [];
    cycle.push(y);
  }
  cycle.reverse();
  const at = cycle.indexOf(Math.min(...cycle));
  return [...cycle.slice(at), ...cycle.slice(0, at)];
}

/**
 * @param {{ ids: number[], edges: JohnsonEdge[] }} input
 * @returns {JohnsonFrame[]}
 */
export function johnsonTrace({ ids, edges }) {
  const { n, list } = prepare(ids, edges);
  const h = new Array(n).fill(Infinity);
  // q is vertex n of the extended graph, with h[q] = 0. Its edges never change after round 1.
  const hParent = new Array(n).fill(-1);
  /** @type {(number | null)[]} */
  const reweighted = edges.map(() => null);
  let dPrime = new Array(n).fill(Infinity);
  /** @type {number[]} */
  let settled = [];
  let parent = new Array(n).fill(-1);
  /** @type {(number | null)[][]} */
  const matrix = Array.from({ length: n }, () => new Array(n).fill(null));
  let round = 0;
  let source = -1;
  let bfChecks = 0;
  let dijkstraChecks = 0;

  /** @type {JohnsonFrame[]} */
  const frames = [];
  /** @param {Pick<JohnsonFrame, 'kind'|'lines'> & Partial<JohnsonFrame>} f */
  const push = (f) =>
    frames.push({
      edge: -1,
      current: -1,
      neighbor: -1,
      before: Infinity,
      cycle: [],
      ...f,
      round,
      source,
      h: h.slice(),
      reweighted: reweighted.slice(),
      dPrime: dPrime.slice(),
      settled: settled.slice(),
      parent: parent.slice(),
      matrix: matrix.map((r) => r.slice()),
      bfChecks,
      dijkstraChecks,
    });

  push({ kind: 'start', lines: [0] });

  // Phase 1: Bellman-Ford from q over n + 1 vertices, so up to n rounds.
  let early = false;
  for (round = 1; round <= n; round++) {
    let changed = false;
    push({ kind: 'bf-round', lines: [1] });
    for (let v = 0; v < n; v++) {
      bfChecks++;
      if (0 < h[v]) {
        h[v] = 0;
        hParent[v] = -1;
        changed = true;
      }
    }
    if (round === 1 && n > 0) push({ kind: 'bf-q', lines: [2] });
    for (const { u, v, w, edge } of list) {
      bfChecks++;
      if (h[u] + w < h[v]) {
        const before = h[v];
        h[v] = h[u] + w;
        hParent[v] = u;
        changed = true;
        push({ kind: 'bf-lower', edge, current: u, neighbor: v, before, lines: [2] });
      }
    }
    if (!changed) {
      push({ kind: 'bf-early', lines: [1] });
      early = true;
      break;
    }
  }
  if (!early) {
    round = n + 1;
    push({ kind: 'bf-check', lines: [3] });
    for (const { u, v, w, edge } of list) {
      bfChecks++;
      if (h[u] + w < h[v]) {
        const links = hParent.slice();
        links[v] = u;
        const cycle = cycleFrom(links, v, n + 1);
        push({ kind: 'cycle', edge, current: u, neighbor: v, before: h[v], cycle, lines: [3] });
        push({ kind: 'done', cycle, lines: [3] });
        return frames;
      }
    }
  }
  round = 0;

  // Phase 2: reweight every edge.
  for (const { u, v, w, edge } of list) {
    reweighted[edge] = w + h[u] - h[v];
    push({ kind: 'reweight', edge, current: u, neighbor: v, lines: [4] });
  }

  // Phase 3: Dijkstra from every vertex on the reweighted graph.
  for (source = 0; source < n; source++) {
    dPrime = new Array(n).fill(Infinity);
    dPrime[source] = 0;
    settled = [];
    parent = new Array(n).fill(-1);
    push({ kind: 'dij-start', lines: [5, 6] });
    const done = new Array(n).fill(false);
    for (;;) {
      let u = -1;
      for (let x = 0; x < n; x++) if (!done[x] && dPrime[x] < (u < 0 ? Infinity : dPrime[u])) u = x;
      if (u < 0) break;
      done[u] = true;
      settled.push(u);
      push({ kind: 'settle', current: u, lines: [7] });
      for (const { u: a, v, edge } of list) {
        if (a !== u) continue;
        dijkstraChecks++;
        const wp = /** @type {number} */ (reweighted[edge]);
        if (!done[v] && dPrime[u] + wp < dPrime[v]) {
          const before = dPrime[v];
          dPrime[v] = dPrime[u] + wp;
          parent[v] = u;
          push({ kind: 'lower', edge, current: u, neighbor: v, before, lines: [8] });
        }
      }
    }
    for (let t = 0; t < n; t++)
      matrix[source][t] = dPrime[t] === Infinity ? Infinity : dPrime[t] - h[source] + h[t];
    push({ kind: 'row', lines: [9] });
  }
  source = -1;
  dPrime = new Array(n).fill(Infinity);
  settled = [];
  parent = new Array(n).fill(-1);
  push({ kind: 'done', lines: [10] });
  return frames;
}
