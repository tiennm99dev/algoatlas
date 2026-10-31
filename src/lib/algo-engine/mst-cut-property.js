/**
 * The two facts every minimum spanning tree algorithm rests on, as step-by-step checks on an
 * undirected weighted graph.
 *
 * - Cut property: split the vertices into a side S and the rest. A lightest edge crossing the
 *   cut belongs to some minimum spanning tree (to every one when it is strictly lightest).
 *   `cutTrace` scans the edges in input order and keeps the lightest crossing edge; on a tie
 *   the first one found stays.
 * - Cycle property: an edge that is strictly the heaviest on some cycle belongs to no minimum
 *   spanning tree. `cycleTrace` tests one edge a — b of weight w with a breadth-first search
 *   from a that may only use edges strictly lighter than w. Reaching b closes a cycle on which
 *   a — b is the strict maximum. Not reaching b leaves a cut (the reached vertices, the rest)
 *   that a — b crosses with no lighter edge, so by the cut property a — b is in some MST.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; edges keep their input
 * order. A vertex's edges are examined in order of the neighbour's number.
 */

import { indexEdges } from './weighted-edges.js';

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;
/** Largest edge weight the lesson accepts (the smallest is 1). */
export const MAX_WEIGHT = 99;

/**
 * @typedef {object} UEdge
 * @property {number} from    Vertex id.
 * @property {number} to      Vertex id.
 * @property {number} [weight] Defaults to 1.
 */

/**
 * @typedef {object} CutFrame
 * @property {'start'|'inside'|'best'|'heavier'|'done'} kind
 * @property {number} edge        Edge examined now, -1 when none.
 * @property {number} best        Lightest crossing edge so far, -1 when none.
 * @property {number[]} crossing  Crossing edges found so far, in input order.
 * @property {number[]} ties      On 'done': every crossing edge as light as the best.
 * @property {number} checked     Edges examined so far.
 * @property {number[]} lines
 */

/**
 * @typedef {object} CycleFrame
 * @property {'start'|'pop'|'follow'|'seen'|'heavy'|'found'|'done'} kind
 * @property {number} target      The edge under test.
 * @property {number} a           Its first end (the search starts here), -1 when no edge.
 * @property {number} b           Its other end.
 * @property {number} w           Its weight.
 * @property {number} current     Vertex whose edges are examined, -1 when none.
 * @property {number} neighbor    Other end of the examined edge, -1 when none.
 * @property {number} edge        Edge examined now, -1 when none.
 * @property {boolean[]} reached
 * @property {number[]} queue
 * @property {number[]} parent    BFS parent per vertex, -1 when none.
 * @property {number[]} path      On 'found' and 'done': the lighter route a → … → b, else [].
 * @property {''|'cycle'|'cut'} verdict  Set on 'done'.
 * @property {number} checked     Edges examined so far.
 * @property {number[]} lines
 */

export const cutPseudocode = [
  'S = the vertices on one side of the cut',
  'best = none',
  'for each edge u — v of weight w:',
  '  if u and v are on the same side: skip it',
  '  if best is none or w < best.w:',
  '    best = u — v',
  'return best    // a light edge: some MST contains it',
];

export const cyclePseudocode = [
  'test edge e = a — b of weight w',
  'reached = {a}; queue = [a]',
  'while queue is not empty:',
  '  x = queue.popFront()',
  '  for each edge x — y lighter than w:',
  '    if y is not reached: reach y; queue.push(y)',
  '    if y = b: cycle with e as its heaviest edge → no MST has e',
  'no lighter route: e is lightest across (reached, rest) → some MST has e',
];

/**
 * Numbers the vertices and lists every input edge by its ends' numbers, plus adjacency lists.
 * An edge that is a loop or names an unknown vertex keeps u = v = -1 and is never examined.
 * @param {number[]} ids
 * @param {UEdge[]} edges
 */
export function adjacency(ids, edges) {
  const { n, list: indexed } = indexEdges(ids, edges);
  /** @type {{to: number, w: number, edge: number}[][]} */
  const adj = Array.from({ length: n }, () => []);
  /** @type {{u: number, v: number, w: number}[]} */
  const list = edges.map((e) => ({ u: -1, v: -1, w: e.weight ?? 1 }));
  for (const { u, v, w, edge } of indexed) {
    list[edge] = { u, v, w };
    adj[u].push({ to: v, w, edge });
    adj[v].push({ to: u, w, edge });
  }
  for (const l of adj) l.sort((x, y) => x.to - y.to || x.edge - y.edge);
  return { n, adj, list };
}

/**
 * Scans every edge for the lightest one crossing the cut (S, rest).
 * @param {{ ids: number[], edges: UEdge[], side: boolean[] }} input  `side[i]` is true when
 *   vertex index i is in S.
 * @returns {CutFrame[]}
 */
export function cutTrace({ ids, edges, side }) {
  const { list } = adjacency(ids, edges);
  /** @type {number[]} */
  const crossing = [];
  let best = -1;
  let checked = 0;
  /** @type {CutFrame[]} */
  const frames = [];
  /** @param {Pick<CutFrame, 'kind'|'lines'> & Partial<CutFrame>} f */
  const push = (f) =>
    frames.push({ edge: -1, ties: [], ...f, best, crossing: crossing.slice(), checked });

  push({ kind: 'start', lines: [0, 1] });
  list.forEach(({ u, v, w }, k) => {
    if (u < 0 || v < 0 || u === v) return;
    checked++;
    if (Boolean(side[u]) === Boolean(side[v])) {
      push({ kind: 'inside', edge: k, lines: [2, 3] });
      return;
    }
    crossing.push(k);
    if (best < 0 || w < list[best].w) {
      best = k;
      push({ kind: 'best', edge: k, lines: [2, 4, 5] });
    } else push({ kind: 'heavier', edge: k, lines: [2, 4] });
  });
  const ties = best < 0 ? [] : crossing.filter((k) => list[k].w === list[best].w);
  push({ kind: 'done', ties, lines: [6] });
  return frames;
}

/**
 * Tests edge `edge` against the cycle property with a search over strictly lighter edges.
 * @param {{ ids: number[], edges: UEdge[], edge: number }} input
 * @returns {CycleFrame[]}
 */
export function cycleTrace({ ids, edges, edge }) {
  const { n, adj, list } = adjacency(ids, edges);
  const e = list[edge];
  const valid = e !== undefined && e.u >= 0 && e.v >= 0 && e.u !== e.v;
  const a = valid ? e.u : -1;
  const b = valid ? e.v : -1;
  const w = valid ? e.w : 0;
  const reached = new Array(n).fill(false);
  const parent = new Array(n).fill(-1);
  /** @type {number[]} */
  const queue = [];
  /** @type {number[]} */
  let path = [];
  let checked = 0;
  /** @type {CycleFrame[]} */
  const frames = [];
  /** @param {Pick<CycleFrame, 'kind'|'lines'> & Partial<CycleFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      neighbor: -1,
      edge: -1,
      verdict: '',
      ...f,
      target: valid ? edge : -1,
      a,
      b,
      w,
      reached: reached.slice(),
      queue: queue.slice(),
      parent: parent.slice(),
      path: path.slice(),
      checked,
    });

  if (!valid) {
    push({ kind: 'start', lines: [0] });
    push({ kind: 'done', lines: [7] });
    return frames;
  }
  reached[a] = true;
  queue.push(a);
  push({ kind: 'start', lines: [0, 1] });

  while (queue.length) {
    const x = /** @type {number} */ (queue.shift());
    push({ kind: 'pop', current: x, lines: [2, 3] });
    for (const { to: y, w: wy, edge: k } of adj[x]) {
      checked++;
      const base = { current: x, neighbor: y, edge: k };
      if (wy >= w) {
        push({ kind: 'heavy', ...base, lines: [4] });
        continue;
      }
      if (reached[y]) {
        push({ kind: 'seen', ...base, lines: [4, 5] });
        continue;
      }
      reached[y] = true;
      parent[y] = x;
      queue.push(y);
      if (y === b) {
        path = [];
        for (let v = b; v !== -1; v = parent[v]) path.unshift(v);
        push({ kind: 'found', ...base, lines: [4, 5, 6] });
        push({ kind: 'done', verdict: 'cycle', lines: [6] });
        return frames;
      }
      push({ kind: 'follow', ...base, lines: [4, 5] });
    }
  }
  push({ kind: 'done', verdict: 'cut', lines: [2, 7] });
  return frames;
}

/**
 * A minimum spanning forest by Kruskal’s rule (edges by weight, then input order), for the
 * page to overlay and for tests. Returns the chosen edge indices and their total weight.
 * @param {number[]} ids
 * @param {UEdge[]} edges
 */
export function minimumSpanningForest(ids, edges) {
  const { n, list } = adjacency(ids, edges);
  const parent = [...Array(n).keys()];
  /** @param {number} x @returns {number} */
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const order = list.map((_, k) => k).sort((x, y) => list[x].w - list[y].w || x - y);
  /** @type {number[]} */
  const tree = [];
  let weight = 0;
  for (const k of order) {
    const { u, v, w } = list[k];
    if (u < 0 || v < 0 || u === v) continue;
    const ru = find(u);
    const rv = find(v);
    if (ru === rv) continue;
    parent[ru] = rv;
    tree.push(k);
    weight += w;
  }
  return { tree, weight, components: n - tree.length };
}
