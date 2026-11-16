/**
 * VERTEX COVER parameterised by k: is there a cover of at most k vertices?
 *
 * Bounded search tree: take the first uncovered edge u – v in input order. Any cover holds u
 * or v, so branch on taking u, then on taking v, each time with one less vertex to spend.
 * The tree is at most k deep and binary, so it has at most 2^(k+1) − 1 nodes, and the whole
 * search runs in O(2ᵏ · m), which is polynomial in the graph for every fixed k.
 *
 * Kernelisation (Buss), optional, before the search:
 * - a vertex with more than k edges must be in every cover of size at most k (otherwise its
 *   more than k neighbours would all be needed), so take it and lower k;
 * - afterwards every vertex covers at most k edges, so a graph with more than k² edges left
 *   has no cover of k vertices.
 * What is left, the kernel, has at most k² edges, whatever the size of the input.
 *
 * Vertices are numbered by their position in `ids` sorted ascending. Loops are dropped and a
 * repeated pair counts once, keeping its first place in the edge order. The search stops at
 * the first cover it finds.
 */

export const MAX_NODES = 10;
export const MAX_K = 5;

/**
 * @typedef {object} PlainEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/** @typedef {'active'|'fail'|'yes'|'done'} SearchStatus */

/**
 * @typedef {object} SearchNode
 * @property {number} id  Creation order, from 0 at the root.
 * @property {number} parent  -1 for the root.
 * @property {number} took  The vertex the edge from the parent took, -1 for the root.
 * @property {number} budget  Vertices still allowed.
 * @property {number} left  Uncovered edges at this node.
 * @property {SearchStatus} status
 */

/**
 * @typedef {object} FptFrame
 * @property {'start'|'forced'|'overBudget'|'tooBig'|'kernel'|'branch'|'yes'|'fail'|'back'|'done'} kind
 * @property {number} k  The parameter as given.
 * @property {number} budget  k after the kernel rules.
 * @property {[number, number][]} edges  Index pairs, in input order.
 * @property {number[]} forced  Vertices the kernel rule took.
 * @property {number} vertex  The vertex acted on, -1 when none.
 * @property {number} edge  The edge branched on, -1 when none.
 * @property {SearchNode[]} nodes  Search nodes made so far.
 * @property {number} current  The search node acted on, -1 when none.
 * @property {number[]} cover  Forced vertices plus the picks on the current path.
 * @property {boolean[]} covered  Per edge, by `cover`.
 * @property {'yes'|'no'|''} answer
 * @property {number} n
 * @property {number[]} lines
 */

export const fptPseudocode = [
  'vc(G, k):                    // a cover of at most k vertices?',
  '  while some v has more than k edges: take v; k = k − 1',
  '  if more than k² edges are left: return no',
  'search(G, k):',
  '  if G has no edges: return yes',
  '  if k = 0: return no',
  '  u – v = the first uncovered edge   // u or v is in any cover',
  '  return search(G − u, k − 1) or search(G − v, k − 1)',
];

/**
 * @param {number[]} ids
 * @param {PlainEdge[]} edges
 * @returns {{n: number, pairs: [number, number][]}}
 */
export function indexEdges(ids, edges) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {[number, number][]} */
  const pairs = [];
  const seen = new Set();
  for (const e of edges) {
    const a = index.get(e.from);
    const b = index.get(e.to);
    if (a === undefined || b === undefined || a === b) continue;
    const key = Math.min(a, b) * 64 + Math.max(a, b);
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([a, b]);
  }
  return { n: sorted.length, pairs };
}

/** How many sets of at most k of n vertices brute force would try. @param {number} n @param {number} k */
export function subsetsUpTo(n, k) {
  let total = 0;
  let c = 1;
  for (let i = 0; i <= Math.min(n, k); i++) {
    total += c;
    c = (c * (n - i)) / (i + 1);
  }
  return Math.round(total);
}

/**
 * Runs the kernel rules (when asked) and the bounded search, recording every step.
 * @param {{ids: number[], edges: PlainEdge[], k: number, kernel: boolean}} input
 * @returns {FptFrame[]}
 */
export function fptTrace({ ids, edges, k, kernel }) {
  const { n, pairs } = indexEdges(ids, edges);
  /** @type {number[]} */
  const forced = [];
  /** @type {number[]} */
  let path = [];
  /** @type {SearchNode[]} */
  const nodes = [];
  let budget = k;
  /** @type {FptFrame['answer']} */
  let answer = '';
  /** @type {FptFrame[]} */
  const frames = [];

  /** @param {number[]} cover */
  const coveredBy = (cover) => pairs.map(([u, v]) => cover.includes(u) || cover.includes(v));
  /** @param {number[]} cover */
  const leftOf = (cover) => coveredBy(cover).filter((c) => !c).length;

  /**
   * @param {FptFrame['kind']} kind
   * @param {{vertex?: number, edge?: number, current?: number}} at
   * @param {number[]} lines
   */
  function record(kind, at, lines) {
    const cover = [...forced, ...path];
    frames.push({
      kind,
      k,
      budget,
      edges: pairs.map(([u, v]) => [u, v]),
      forced: forced.slice(),
      vertex: at.vertex ?? -1,
      edge: at.edge ?? -1,
      nodes: nodes.map((x) => ({ ...x })),
      current: at.current ?? -1,
      cover,
      covered: coveredBy(cover),
      answer,
      n,
      lines,
    });
  }

  record('start', {}, [0]);
  if (kernel) {
    for (;;) {
      const covered = coveredBy(forced);
      const deg = Array.from({ length: n }, () => 0);
      pairs.forEach(([u, v], i) => {
        if (!covered[i]) {
          deg[u]++;
          deg[v]++;
        }
      });
      const v = deg.findIndex((d) => d > budget);
      if (v < 0) break;
      if (budget === 0) {
        answer = 'no';
        record('overBudget', { vertex: v }, [1]);
        record('done', {}, [1]);
        return frames;
      }
      forced.push(v);
      budget--;
      record('forced', { vertex: v }, [1]);
    }
    if (leftOf(forced) > budget * budget) {
      answer = 'no';
      record('tooBig', {}, [2]);
      record('done', {}, [2]);
      return frames;
    }
    record('kernel', {}, [2]);
  }

  /**
   * @param {number} parent @param {number} took @param {number} left
   * @returns {boolean} whether a cover was found below
   */
  function search(parent, took, left) {
    const id = nodes.length;
    const cover = [...forced, ...path];
    nodes.push({ id, parent, took, budget: left, left: leftOf(cover), status: 'active' });
    const covered = coveredBy(cover);
    const next = covered.indexOf(false);
    if (next < 0) {
      nodes[id].status = 'yes';
      answer = 'yes';
      record('yes', { current: id }, [3, 4]);
      return true;
    }
    if (left === 0) {
      nodes[id].status = 'fail';
      record('fail', { current: id }, [3, 5]);
      return false;
    }
    record('branch', { current: id, edge: next }, [3, 6]);
    for (const v of pairs[next]) {
      path.push(v);
      // A found cover keeps its path, so the last frame shows it.
      if (search(id, v, left - 1)) return true;
      path = path.slice(0, -1);
      record('back', { current: id, edge: next }, [7]);
    }
    nodes[id].status = 'done';
    return false;
  }

  const found = search(-1, -1, budget);
  if (!found) answer = 'no';
  record('done', {}, found ? [4] : [5]);
  return frames;
}

/**
 * @typedef {object} FptPreset
 * @property {string} key
 * @property {[number, number][]} spots  Vertex positions, by id.
 * @property {[number, number][]} pairs  Edges, as id pairs, in input order.
 * @property {number} k
 * @property {boolean} kernel
 */

const SPIDER = {
  spots: /** @type {[number, number][]} */ ([
    [240, 150],
    [130, 80],
    [350, 80],
    [240, 255],
    [40, 40],
    [440, 40],
    [100, 260],
  ]),
  pairs: /** @type {[number, number][]} */ ([
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [2, 5],
    [3, 6],
  ]),
};

/** @type {FptPreset[]} */
export const FPT_PRESETS = [
  { key: 'yes', ...SPIDER, k: 3, kernel: false },
  { key: 'no', ...SPIDER, k: 2, kernel: false },
  {
    key: 'stars',
    spots: [
      [130, 150],
      [350, 150],
      [40, 60],
      [40, 240],
      [130, 270],
      [130, 30],
      [440, 60],
      [440, 240],
      [350, 270],
      [350, 30],
    ],
    pairs: [
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
      [0, 1],
      [1, 6],
      [1, 7],
      [1, 8],
      [1, 9],
    ],
    k: 2,
    kernel: true,
  },
];
