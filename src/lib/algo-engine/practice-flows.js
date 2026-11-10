/**
 * Flow modelling: turn a word problem into a flow network, then solve it with a maximum flow.
 * Each scenario fixes the vertices (places, people, routers, and the extra vertices a model
 * needs), a starting drawing taken straight from the story, and one correct model. The learner
 * edits the drawing; `checkModel` compares it edge by edge with the correct model, and
 * `modelTrace` runs Edmonds-Karp (shortest augmenting paths by BFS) on whatever is drawn, then
 * reads the minimum cut out of the final residual graph, so the learner sees what limits the
 * answer.
 *
 * Three modelling tricks appear: a super source and a super sink for many sources and sinks
 * (their edges carry the supplies and demands), splitting a vertex v into v → v′ to give it a
 * capacity (edges into v stay, edges out of v leave from v′), and unit capacities to count
 * edge-disjoint paths.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edge weights are
 * capacities.
 */

import {
  bottleneck,
  flowByEdge,
  flowNetwork,
  pathArcs,
  pushAlong,
  residual,
  residualAdjacency,
} from './ford-fulkerson.js';

export { MAX_CAPACITY } from './ford-fulkerson.js';

/** Largest network the modelling canvas takes. */
export const MAX_NODES = 8;

/** @typedef {import('./ford-fulkerson.js').CapEdge} CapEdge */
/** @typedef {import('./ford-fulkerson.js').PathArc} PathArc */
/** @typedef {import('./ford-fulkerson.js').ResidualArc} ResidualArc */
/** @typedef {'supply' | 'routers' | 'clubs' | 'convoys'} ScenarioKey */

/**
 * @typedef {object} Scenario
 * @property {{ id: number, x: number, y: number }[]} nodes  Positions on the 480 × 300 canvas.
 * @property {CapEdge[]} start   The drawing the learner starts from.
 * @property {CapEdge[]} model   One correct model.
 * @property {number} source     Vertex id of s.
 * @property {number} sink       Vertex id of t.
 * @property {number} answer     Maximum flow of the correct model: the answer to the story.
 */

/** @param {[number, number, number][]} list @returns {CapEdge[]} */
const caps = (list) => list.map(([from, to, weight]) => ({ from, to, weight }));
/** @param {[number, number, number][]} list */
const at = (list) => list.map(([id, x, y]) => ({ id, x, y }));

/** @type {Record<ScenarioKey, Scenario>} */
export const SCENARIOS = {
  // Two farms supply two markets through a depot. Vertices: S, F, G, D, P, Q, T.
  supply: {
    nodes: at([
      [0, 30, 150],
      [1, 140, 60],
      [2, 140, 240],
      [3, 250, 150],
      [4, 360, 60],
      [5, 360, 240],
      [6, 450, 150],
    ]),
    start: caps([
      [1, 3, 5],
      [1, 4, 3],
      [2, 3, 6],
      [2, 5, 2],
      [3, 4, 4],
      [3, 5, 6],
    ]),
    model: caps([
      [0, 1, 9],
      [0, 2, 7],
      [1, 3, 5],
      [1, 4, 3],
      [2, 3, 6],
      [2, 5, 2],
      [3, 4, 4],
      [3, 5, 6],
      [4, 6, 8],
      [5, 6, 9],
    ]),
    source: 0,
    sink: 6,
    answer: 15,
  },
  // Two routers that forward a limited rate. Vertices: S, A, A′, B, B′, T.
  routers: {
    nodes: at([
      [0, 30, 150],
      [1, 140, 60],
      [2, 270, 60],
      [3, 140, 240],
      [4, 270, 240],
      [5, 450, 150],
    ]),
    start: caps([
      [0, 1, 8],
      [0, 3, 6],
      [1, 3, 4],
      [1, 5, 5],
      [3, 5, 9],
    ]),
    model: caps([
      [0, 1, 8],
      [0, 3, 6],
      [1, 2, 6],
      [2, 3, 4],
      [2, 5, 5],
      [3, 4, 7],
      [4, 5, 9],
    ]),
    source: 0,
    sink: 5,
    answer: 12,
  },
  // Three students and two clubs. Vertices: S, X, Y, Z, C, R, T.
  clubs: {
    nodes: at([
      [0, 30, 150],
      [1, 160, 50],
      [2, 160, 150],
      [3, 160, 250],
      [4, 320, 90],
      [5, 320, 210],
      [6, 450, 150],
    ]),
    start: caps([
      [1, 4, 1],
      [1, 5, 1],
      [2, 4, 1],
      [3, 4, 1],
      [3, 5, 1],
    ]),
    model: caps([
      [0, 1, 2],
      [0, 2, 1],
      [0, 3, 2],
      [1, 4, 1],
      [1, 5, 1],
      [2, 4, 1],
      [3, 4, 1],
      [3, 5, 1],
      [4, 6, 2],
      [5, 6, 3],
    ]),
    source: 0,
    sink: 6,
    answer: 4,
  },
  // One-way roads labelled with their lengths. Vertices: S, A, B, C, D, E, F, T.
  convoys: {
    nodes: at([
      [0, 30, 150],
      [1, 140, 50],
      [2, 140, 150],
      [3, 140, 250],
      [4, 320, 50],
      [5, 320, 150],
      [6, 320, 250],
      [7, 450, 150],
    ]),
    start: caps([
      [0, 1, 4],
      [0, 2, 3],
      [0, 3, 5],
      [2, 1, 2],
      [2, 3, 2],
      [1, 4, 9],
      [3, 6, 8],
      [4, 5, 2],
      [6, 5, 2],
      [4, 7, 6],
      [5, 7, 3],
      [6, 7, 7],
    ]),
    model: caps([
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [2, 1, 1],
      [2, 3, 1],
      [1, 4, 1],
      [3, 6, 1],
      [4, 5, 1],
      [6, 5, 1],
      [4, 7, 1],
      [5, 7, 1],
      [6, 7, 1],
    ]),
    source: 0,
    sink: 7,
    answer: 2,
  },
};

export const SCENARIO_KEYS = /** @type {ScenarioKey[]} */ (Object.keys(SCENARIOS));

/**
 * @typedef {object} WrongCapacity
 * @property {number} from
 * @property {number} to
 * @property {number} want  Capacity in the correct model.
 * @property {number} got   Capacity drawn.
 */

/**
 * @typedef {object} ModelCheck
 * @property {CapEdge[]} missing       Edges of the correct model that are not drawn.
 * @property {CapEdge[]} extra         Drawn edges the correct model does not have.
 * @property {WrongCapacity[]} wrong   Edges drawn in the right place with the wrong capacity.
 * @property {boolean} ok              True when nothing is missing, extra or wrong.
 */

/**
 * Compares a drawn network with a correct model, edge by edge (direction counts).
 * @param {CapEdge[]} model
 * @param {CapEdge[]} drawn
 * @returns {ModelCheck}
 */
export function checkModel(model, drawn) {
  /** @param {CapEdge} e */
  const key = (e) => `${e.from}>${e.to}`;
  const want = new Map(model.map((e) => [key(e), e]));
  const got = new Map(drawn.map((e) => [key(e), e]));
  const missing = model.filter((e) => !got.has(key(e)));
  const extra = drawn.filter((e) => !want.has(key(e)));
  /** @type {WrongCapacity[]} */
  const wrong = [];
  for (const e of drawn) {
    const w = want.get(key(e));
    if (w && (w.weight ?? 1) !== (e.weight ?? 1))
      wrong.push({ from: e.from, to: e.to, want: w.weight ?? 1, got: e.weight ?? 1 });
  }
  return {
    missing: missing.map((e) => ({ ...e })),
    extra: extra.map((e) => ({ ...e })),
    wrong,
    ok: !missing.length && !extra.length && !wrong.length,
  };
}

/**
 * @typedef {object} ModelFrame
 * @property {'start'|'augment'|'maxflow'|'done'} kind
 * @property {number[]} flow         Flow per input edge.
 * @property {PathArc[]} path        The path just pushed, on 'augment'.
 * @property {number} bottleneck     Amount pushed on 'augment'.
 * @property {number} value          Flow value so far.
 * @property {number} augmentations
 * @property {boolean} valid         False when s or t is missing (or they coincide).
 * @property {boolean[]} side        S side of the minimum cut, from 'maxflow' on.
 * @property {number[]} cut          Input edges from S to T, from 'maxflow' on.
 * @property {number} cutCapacity    Their total capacity.
 * @property {number[]} lines
 */

export const modelPseudocode = [
  'model: vertices, edges with capacities, a source s and a sink t',
  'f = 0',
  'while BFS finds a shortest s → t path with room:',
  '  b = smallest room on the path',
  '  push b along the path; f = f + b',
  'no path left: the vertices s still reaches form S of a minimum cut',
  'the answer to the story is f = c(S, T)',
];

/**
 * @param {{ ids: number[], edges: CapEdge[], source: number, sink: number }} input
 *   `source` and `sink` are vertex indices (−1 when the vertex is missing).
 * @returns {ModelFrame[]}
 */
export function modelTrace({ ids, edges, source, sink }) {
  const { n, list } = flowNetwork(ids, edges);
  const adj = residualAdjacency(n, list);
  const flow = new Array(list.length).fill(0);
  const valid = source >= 0 && source < n && sink >= 0 && sink < n && source !== sink;
  /** @type {ResidualArc[]} */
  let path = [];
  let b = 0;
  let value = 0;
  let augmentations = 0;
  let side = new Array(n).fill(false);
  /** @type {number[]} */
  const cut = [];
  let capacity = 0;

  /** @type {ModelFrame[]} */
  const frames = [];
  /** @param {ModelFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      flow: flowByEdge(list, flow, edges.length),
      path: pathArcs(list, path),
      bottleneck: b,
      value,
      augmentations,
      valid,
      side: side.slice(),
      cut: cut.slice(),
      cutCapacity: capacity,
      lines,
    });

  /** Vertices reachable from s through arcs with room, and the arc that reached each. */
  function reach() {
    /** @type {(ResidualArc | null)[]} */
    const via = new Array(n).fill(null);
    const seen = new Array(n).fill(false);
    seen[source] = true;
    const q = [source];
    for (let h = 0; h < q.length; h++)
      for (const a of adj[q[h]])
        if (!seen[a.to] && residual(list, flow, a) > 0) {
          seen[a.to] = true;
          via[a.to] = a;
          q.push(a.to);
        }
    return { seen, via };
  }

  push('start', [0, 1]);
  if (!valid) {
    push('done', [6]);
    return frames;
  }

  for (let r = reach(); r.seen[sink]; r = reach()) {
    path = [];
    for (let x = sink; x !== source;) {
      const a = /** @type {ResidualArc} */ (r.via[x]);
      path.unshift(a);
      x = a.from;
    }
    b = bottleneck(list, flow, path);
    pushAlong(flow, path, b);
    value += b;
    augmentations++;
    push('augment', [2, 3, 4]);
  }
  path = [];
  b = 0;
  side = reach().seen;
  list.forEach((e) => {
    if (side[e.u] && !side[e.v]) {
      cut.push(e.edge);
      capacity += e.cap;
    }
  });
  cut.sort((x, y) => x - y);
  push('maxflow', [2, 5]);
  push('done', [6]);
  return frames;
}
