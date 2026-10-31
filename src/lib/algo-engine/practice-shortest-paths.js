/**
 * Three single-source shortest-path algorithms on one directed weighted graph, so a learner can
 * pick one for a scenario and see whether its answer is right.
 *
 * - BFS ignores the weights while searching: it finds the path with the fewest edges and adds
 *   up that path's weights. It is right exactly when every edge has the same positive weight.
 * - Dijkstra settles the vertex with the smallest label and never touches a settled vertex
 *   again (a lazy priority queue that skips settled entries). With a negative edge, a vertex can
 *   be settled too early and its label, and everything built on it, stays wrong.
 * - Bellman-Ford relaxes every edge for up to V − 1 rounds (stopping after a round with no
 *   change) and then checks for a negative cycle reachable from the source.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edges keep their order.
 */

import { cycleFrom, indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws. */
export const MAX_NODES = 10;
/** Weights range from −MAX_WEIGHT to MAX_WEIGHT. */
export const MAX_WEIGHT = 99;

/** @typedef {'bfs' | 'dijkstra' | 'bellman-ford'} Algo */
export const ALGOS = /** @type {Algo[]} */ (['bfs', 'dijkstra', 'bellman-ford']);

/**
 * @typedef {object} SpEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} SpInput
 * @property {number[]} ids
 * @property {SpEdge[]} edges
 * @property {number} source  Vertex index.
 */

/**
 * @typedef {object} SpFrame
 * @property {'start'|'take'|'skip'|'relax'|'keep'|'round'|'early'|'cycle'|'done'} kind
 * @property {number} current   Vertex taken, or tail of the edge; -1 when none.
 * @property {number} neighbor  Head of the edge, -1 when none.
 * @property {number} edge      Index of the edge in the input list, -1 when none.
 * @property {number} weight    Weight of that edge.
 * @property {number} before    Label of the head before a relaxation.
 * @property {number[]} dist    Label per vertex (Infinity = ∞). BFS: cost of its fewest-edge path.
 * @property {number[]} hops    BFS only: edges on the path found, -1 unseen.
 * @property {number[]} parent
 * @property {{v: number, d: number}[]} frontier  BFS queue (d = hops) or Dijkstra heap entries.
 * @property {number[]} settled Vertices taken (BFS) or settled (Dijkstra), in order.
 * @property {number} round     Bellman-Ford round, 0 otherwise.
 * @property {number} checks    Edges looked at so far.
 * @property {number[]} cycle   Bellman-Ford: the negative cycle, in edge order, from 'cycle' on.
 * @property {number[]} lines
 */

/** @type {Record<Algo, string[]>} */
export const pseudocode = {
  bfs: [
    'hops[s] = 0; cost[s] = 0; queue = [s]',
    'while queue is not empty:',
    '  u = queue.dequeue()',
    '  for each edge u → v of weight w:',
    '    if v is not seen: hops[v] = hops[u] + 1; cost[v] = cost[u] + w; enqueue v',
    'return cost      // cost of the path with the fewest edges',
  ],
  dijkstra: [
    'dist[s] = 0, every other dist = ∞; pq = [(0, s)]',
    'while pq is not empty:',
    '  (d, u) = pq.popMin(); if u is settled: skip it',
    '  settle u       // its label never changes again',
    '  for each edge u → v of weight w with v not settled:',
    '    if d + w < dist[v]: dist[v] = d + w; pq.push((dist[v], v))',
    'return dist',
  ],
  'bellman-ford': [
    'dist[s] = 0, every other dist = ∞',
    'repeat V − 1 times:',
    '  for each edge (u, v, w): if dist[u] + w < dist[v]: dist[v] = dist[u] + w',
    '  if no label changed this round: stop early',
    'if an edge can still be relaxed: report a negative cycle',
    'return dist',
  ],
};

/**
 * Builds frames that share the bookkeeping every algorithm needs.
 * @param {number} n
 */
function recorder(n) {
  const state = {
    dist: new Array(n).fill(Infinity),
    hops: new Array(n).fill(-1),
    parent: new Array(n).fill(-1),
    /** @type {{v: number, d: number}[]} */
    frontier: [],
    /** @type {number[]} */
    settled: [],
    round: 0,
    checks: 0,
    /** @type {number[]} */
    cycle: [],
  };
  /** @type {SpFrame[]} */
  const frames = [];
  /** @param {Pick<SpFrame, 'kind'|'lines'> & Partial<SpFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      neighbor: -1,
      edge: -1,
      weight: 0,
      before: Infinity,
      ...f,
      dist: state.dist.slice(),
      hops: state.hops.slice(),
      parent: state.parent.slice(),
      frontier: state.frontier.map((x) => ({ ...x })),
      settled: state.settled.slice(),
      round: state.round,
      checks: state.checks,
      cycle: state.cycle.slice(),
    });
  return { state, frames, push };
}

/** @param {SpInput} input */
function bfs({ ids, edges, source }) {
  const { n, list } = indexEdges(ids, edges);
  const { state: st, frames, push } = recorder(n);
  if (source >= 0 && source < n) {
    st.dist[source] = 0;
    st.hops[source] = 0;
    st.frontier.push({ v: source, d: 0 });
  }
  push({ kind: 'start', lines: [0] });
  while (st.frontier.length) {
    const { v: u } = /** @type {{v: number, d: number}} */ (st.frontier.shift());
    st.settled.push(u);
    push({ kind: 'take', current: u, lines: [1, 2] });
    for (const { u: a, v, w, edge } of list) {
      if (a !== u) continue;
      st.checks++;
      const base = { current: u, neighbor: v, edge, weight: w, before: st.dist[v] };
      if (st.hops[v] === -1) {
        st.hops[v] = st.hops[u] + 1;
        st.dist[v] = st.dist[u] + w;
        st.parent[v] = u;
        st.frontier.push({ v, d: st.hops[v] });
        push({ kind: 'relax', ...base, lines: [3, 4] });
      } else push({ kind: 'keep', ...base, lines: [3] });
    }
  }
  push({ kind: 'done', lines: [5] });
  return frames;
}

/** @param {SpInput} input */
function dijkstra({ ids, edges, source }) {
  const { n, list } = indexEdges(ids, edges);
  const { state: st, frames, push } = recorder(n);
  const isSettled = new Array(n).fill(false);
  if (source >= 0 && source < n) {
    st.dist[source] = 0;
    st.frontier.push({ v: source, d: 0 });
  }
  push({ kind: 'start', lines: [0] });
  while (st.frontier.length) {
    // The frontier is kept sorted by d, then by push order.
    const { v: u, d } = /** @type {{v: number, d: number}} */ (st.frontier.shift());
    if (isSettled[u]) {
      push({ kind: 'skip', current: u, before: d, lines: [1, 2] });
      continue;
    }
    isSettled[u] = true;
    st.settled.push(u);
    push({ kind: 'take', current: u, lines: [1, 2, 3] });
    for (const { u: a, v, w, edge } of list) {
      if (a !== u || isSettled[v]) continue;
      st.checks++;
      const base = { current: u, neighbor: v, edge, weight: w, before: st.dist[v] };
      if (d + w < st.dist[v]) {
        st.dist[v] = d + w;
        st.parent[v] = u;
        let at = st.frontier.length;
        while (at > 0 && st.frontier[at - 1].d > st.dist[v]) at--;
        st.frontier.splice(at, 0, { v, d: st.dist[v] });
        push({ kind: 'relax', ...base, lines: [4, 5] });
      } else push({ kind: 'keep', ...base, lines: [4, 5] });
    }
  }
  push({ kind: 'done', lines: [6] });
  return frames;
}

/**
 * Bellman-Ford. Only the relaxations that lower a label get a frame; the checks counter still
 * counts every edge looked at, so the cost stays visible without hundreds of frames.
 * @param {SpInput} input
 */
function bellmanFord({ ids, edges, source }) {
  const { n, list } = indexEdges(ids, edges);
  const { state: st, frames, push } = recorder(n);
  if (source >= 0 && source < n) st.dist[source] = 0;
  push({ kind: 'start', lines: [0] });
  for (st.round = 1; st.round <= n - 1; st.round++) {
    push({ kind: 'round', lines: [1] });
    let changed = false;
    for (const { u, v, w, edge } of list) {
      st.checks++;
      if (st.dist[u] + w < st.dist[v]) {
        const before = st.dist[v];
        st.dist[v] = st.dist[u] + w;
        st.parent[v] = u;
        changed = true;
        push({ kind: 'relax', current: u, neighbor: v, edge, weight: w, before, lines: [2] });
      }
    }
    if (!changed) {
      push({ kind: 'early', lines: [3] });
      push({ kind: 'done', lines: [5] });
      return frames;
    }
  }
  st.round = n;
  for (const { u, v, w, edge } of list) {
    st.checks++;
    if (st.dist[u] + w < st.dist[v]) {
      const links = st.parent.slice();
      links[v] = u;
      st.cycle = cycleFrom(links, v, n);
      const base = { current: u, neighbor: v, edge, weight: w, before: st.dist[v] };
      push({ kind: 'cycle', ...base, lines: [4] });
      push({ kind: 'done', lines: [4] });
      return frames;
    }
  }
  push({ kind: 'done', lines: [4, 5] });
  return frames;
}

/**
 * @param {SpInput & { algo: Algo }} input
 * @returns {SpFrame[]}
 */
export function shortestPathTrace(input) {
  if (input.algo === 'bfs') return bfs(input);
  if (input.algo === 'dijkstra') return dijkstra(input);
  return bellmanFord(input);
}

/**
 * The algorithm a scenario calls for: Bellman-Ford when any weight is negative, BFS when every
 * edge has the same positive weight, Dijkstra otherwise.
 * @param {SpInput} input
 * @returns {Algo}
 */
export function recommend({ ids, edges }) {
  const { list } = indexEdges(ids, edges);
  if (list.some((e) => e.w < 0)) return 'bellman-ford';
  if (list.every((e) => e.w === list[0].w && e.w > 0)) return 'bfs';
  return 'dijkstra';
}

/**
 * @typedef {object} Verdict
 * @property {'best' | 'works' | 'lucky' | 'wrong'} verdict
 *   best: right and the recommended pick; works: right and guaranteed, but not the best fit;
 *   lucky: right this time without a guarantee; wrong: the target's distance is wrong, or a
 *   reachable negative cycle went unreported.
 * @property {Algo} best
 * @property {boolean} negativeCycle  A negative cycle is reachable from the source.
 * @property {number[]} truth   Shortest distances (meaningless when negativeCycle).
 * @property {number[]} got     The algorithm's labels.
 * @property {number} checks    Edges the algorithm looked at.
 */

/**
 * Runs `algo` and compares its answer for `target` with Bellman-Ford's. A reachable negative
 * cycle means there is no right number to give, so only Bellman-Ford, which reports it, is right.
 * @param {SpInput} input
 * @param {Algo} algo
 * @param {number} target  Vertex index.
 * @returns {Verdict}
 */
export function judge(input, algo, target) {
  const truthFrame = /** @type {SpFrame} */ (bellmanFord(input).at(-1));
  const run = /** @type {SpFrame} */ (shortestPathTrace({ ...input, algo }).at(-1));
  const best = recommend(input);
  const negativeCycle = truthFrame.cycle.length > 0;
  const right = negativeCycle
    ? algo === 'bellman-ford'
    : run.dist[target] === truthFrame.dist[target];
  /** @type {Verdict['verdict']} */
  let verdict = 'wrong';
  if (right) {
    if (algo === best) verdict = 'best';
    else if (algo === 'bellman-ford' || (algo === 'dijkstra' && best === 'bfs')) verdict = 'works';
    else verdict = 'lucky';
  }
  return {
    verdict,
    best,
    negativeCycle,
    truth: truthFrame.dist,
    got: run.dist,
    checks: run.checks,
  };
}

/**
 * @typedef {object} Scenario
 * @property {{id: number, x: number, y: number, label: string}[]} nodes
 * @property {SpEdge[]} edges
 * @property {number} source  Vertex id.
 * @property {number} target  Vertex id.
 */

/** @param {[number, number, number][]} list @returns {SpEdge[]} */
const toEdges = (list) => list.map(([from, to, weight]) => ({ from, to, weight }));

/** @param {string[]} labels @param {[number, number][]} at */
const toNodes = (labels, at) =>
  labels.map((label, id) => ({ id, x: at[id][0], y: at[id][1], label }));

/** Ten states 1…10 on a circle, so the jumps i → 2i run inside it without crossing a vertex. */
const ring = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (2 * Math.PI * i) / 10;
  return /** @type {[number, number]} */ ([
    Math.round(240 + 125 * Math.cos(a)),
    Math.round(150 + 120 * Math.sin(a)),
  ]);
});

/** @type {Record<'moves' | 'roads' | 'cashback' | 'arbitrage', Scenario>} */
export const SCENARIOS = {
  // State i is the number on a counter; a move adds 1 or doubles it. 1 → 2 is both moves.
  moves: {
    nodes: toNodes(
      Array.from({ length: 10 }, (_, i) => String(i + 1)),
      ring,
    ),
    edges: toEdges([
      [0, 1, 1],
      [1, 2, 1],
      [1, 3, 1],
      [2, 3, 1],
      [2, 5, 1],
      [3, 4, 1],
      [3, 7, 1],
      [4, 5, 1],
      [4, 9, 1],
      [5, 6, 1],
      [6, 7, 1],
      [7, 8, 1],
      [8, 9, 1],
    ]),
    source: 0,
    target: 9,
  },
  roads: {
    nodes: toNodes(
      ['S', 'A', 'B', 'C', 'D', 'T'],
      [
        [40, 150],
        [170, 60],
        [170, 240],
        [300, 40],
        [320, 230],
        [440, 150],
      ],
    ),
    edges: toEdges([
      [0, 1, 4],
      [0, 2, 1],
      [2, 1, 2],
      [1, 5, 8],
      [1, 3, 2],
      [3, 4, 1],
      [4, 5, 2],
      [2, 4, 7],
    ]),
    source: 0,
    target: 5,
  },
  cashback: {
    nodes: toNodes(
      ['S', 'A', 'B', 'C', 'T'],
      [
        [40, 150],
        [190, 50],
        [190, 250],
        [330, 50],
        [440, 180],
      ],
    ),
    edges: toEdges([
      [0, 1, 2],
      [0, 2, 5],
      [2, 1, -4],
      [1, 3, 2],
      [3, 4, 3],
      [2, 4, 9],
    ]),
    source: 0,
    target: 4,
  },
  arbitrage: {
    nodes: toNodes(
      ['S', 'A', 'B', 'C', 'T'],
      [
        [40, 150],
        [170, 150],
        [300, 50],
        [300, 250],
        [440, 250],
      ],
    ),
    edges: toEdges([
      [0, 1, 1],
      [1, 2, 2],
      [2, 3, -3],
      [3, 1, -1],
      [3, 4, 2],
    ]),
    source: 0,
    target: 4,
  },
};
