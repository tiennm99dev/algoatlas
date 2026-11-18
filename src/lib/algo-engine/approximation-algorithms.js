/**
 * Two fast vertex-cover heuristics, compared with the true optimum found by brute force.
 *
 * - Matching: walk the edges in input order; when neither end of an edge is in the cover,
 *   take both ends. The taken edges form a maximal matching M, and |C| = 2|M|. Matching edges
 *   share no vertex, so every cover needs a separate vertex for each: OPT ≥ |M|, hence
 *   |C| ≤ 2 · OPT. This is the 2-approximation.
 * - Greedy: repeatedly take the vertex touching the most uncovered edges (ties to the lowest
 *   number). This is greedy set cover with each vertex as the set of its edges, so
 *   |C| ≤ H(Δ) · OPT, where Δ is the largest degree and H(d) = 1 + 1/2 + … + 1/d ≈ ln d.
 *
 * Vertices are numbered by their position in `ids` sorted ascending. Loops are dropped and a
 * repeated pair counts once, keeping its first place in the edge order.
 */

import { indexPairs } from './plain-edges.js';

/** Largest graph the lesson draws, small enough for a brute-force optimum. */
export const MAX_NODES = 10;

/** @typedef {'matching'|'greedy'} CoverAlgorithm */

/** @typedef {import('./plain-edges.js').PlainEdge} PlainEdge */

/**
 * @typedef {object} CoverFrame
 * @property {'start'|'take'|'skip'|'pick'|'done'} kind
 * @property {CoverAlgorithm} algorithm
 * @property {[number, number][]} edges  Index pairs, in the order the algorithm reads them.
 * @property {number} edge  The edge acted on, -1 when none.
 * @property {number} vertex  The vertex picked by greedy now, -1 when none.
 * @property {number} gain  Edges the greedy pick covers now.
 * @property {number[]} cover  Vertices in the cover so far, in the order taken.
 * @property {boolean[]} covered  Per edge.
 * @property {number[]} matching  Edges taken by the matching algorithm.
 * @property {number[]} degree  Per vertex, how many uncovered edges it touches.
 * @property {number[]} optimum  One smallest cover, by brute force.
 * @property {number} looked  Edges or vertices the algorithm has examined.
 * @property {number[]} lines
 */

export const matchingPseudocode = [
  'approxCover(G):  // ghép cặp tối đại',
  '  C = { }',
  '  for u – v in edges(G):',
  '    if u not in C and v not in C:',
  '      thêm u và v vào C  // M nhận u – v',
  '    else: bỏ qua, đã được phủ',
  '  return C  // |C| = 2|M| ≤ 2 · OPT',
];

export const greedyPseudocode = [
  'greedyCover(G):  // tham lam cho phủ tập',
  '  C = { }',
  '  while còn cạnh chưa phủ:',
  '    v = đỉnh chạm tới nhiều cạnh chưa phủ nhất',
  '    thêm v vào C, đánh dấu các cạnh của v đã phủ',
  '  return C  // |C| ≤ H(Δ) · OPT',
];

/**
 * One smallest vertex cover, by trying every subset; ties go to the smallest bit mask.
 * @param {number} n
 * @param {[number, number][]} pairs
 * @returns {number[]}
 */
export function optimumCover(n, pairs) {
  let best = (1 << n) - 1;
  let size = n;
  for (let mask = 0; mask < 1 << n; mask++) {
    let bits = 0;
    for (let x = mask; x; x &= x - 1) bits++;
    if (bits >= size) continue;
    if (pairs.every(([u, v]) => mask & (1 << u) || mask & (1 << v))) {
      best = mask;
      size = bits;
    }
  }
  return Array.from({ length: n }, (_, i) => i).filter((i) => best & (1 << i));
}

/** H(d) = 1 + 1/2 + … + 1/d, the greedy set cover guarantee. @param {number} d */
export function harmonic(d) {
  let h = 0;
  for (let i = 1; i <= d; i++) h += 1 / i;
  return h;
}

/**
 * Runs one heuristic and records every step.
 * @param {{ids: number[], edges: PlainEdge[]}} graph
 * @param {CoverAlgorithm} algorithm
 * @returns {CoverFrame[]}
 */
export function coverTrace({ ids, edges }, algorithm) {
  const { n, pairs } = indexPairs(ids, edges);
  const optimum = optimumCover(n, pairs);
  const covered = pairs.map(() => false);
  const inCover = Array.from({ length: n }, () => false);
  /** @type {number[]} */
  const cover = [];
  /** @type {number[]} */
  const matching = [];
  let looked = 0;
  /** @type {CoverFrame[]} */
  const frames = [];

  const degrees = () => {
    const d = Array.from({ length: n }, () => 0);
    pairs.forEach(([u, v], i) => {
      if (!covered[i]) {
        d[u]++;
        d[v]++;
      }
    });
    return d;
  };

  /**
   * @param {CoverFrame['kind']} kind
   * @param {{edge?: number, vertex?: number, gain?: number}} at
   * @param {number[]} lines
   */
  function record(kind, at, lines) {
    frames.push({
      kind,
      algorithm,
      edges: pairs.map(([u, v]) => [u, v]),
      edge: at.edge ?? -1,
      vertex: at.vertex ?? -1,
      gain: at.gain ?? 0,
      cover: cover.slice(),
      covered: covered.slice(),
      matching: matching.slice(),
      degree: degrees(),
      optimum: optimum.slice(),
      looked,
      lines,
    });
  }

  /** @param {number} v */
  function take(v) {
    inCover[v] = true;
    cover.push(v);
    pairs.forEach(([a, b], i) => {
      if (a === v || b === v) covered[i] = true;
    });
  }

  record('start', {}, [0, 1]);
  if (algorithm === 'matching') {
    pairs.forEach(([u, v], i) => {
      looked++;
      if (!inCover[u] && !inCover[v]) {
        take(u);
        take(v);
        matching.push(i);
        record('take', { edge: i }, [2, 3, 4]);
      } else {
        record('skip', { edge: i }, [2, 3, 5]);
      }
    });
    record('done', {}, [6]);
  } else {
    while (covered.some((c) => !c)) {
      const d = degrees();
      looked += n;
      let best = 0;
      for (let v = 1; v < n; v++) if (d[v] > d[best]) best = v;
      const gain = d[best];
      take(best);
      record('pick', { vertex: best, gain }, [2, 3, 4]);
    }
    record('done', {}, [2, 5]);
  }
  return frames;
}

/**
 * @typedef {object} CoverPreset
 * @property {string} key
 * @property {[number, number][]} spots  Vertex positions, by id.
 * @property {[number, number][]} pairs  Edges, as id pairs, in the order the matching reads them.
 */

/** @type {CoverPreset[]} */
export const COVER_PRESETS = [
  {
    key: 'spider',
    spots: [
      [240, 150],
      [130, 80],
      [350, 80],
      [240, 255],
      [40, 40],
      [440, 40],
      [100, 260],
    ],
    pairs: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 4],
      [2, 5],
      [3, 6],
    ],
  },
  {
    key: 'star',
    spots: [
      [240, 150],
      [240, 40],
      [370, 110],
      [330, 260],
      [150, 260],
      [110, 110],
    ],
    pairs: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [0, 5],
    ],
  },
  {
    key: 'path',
    spots: [
      [40, 150],
      [120, 70],
      [200, 150],
      [280, 70],
      [360, 150],
      [440, 70],
    ],
    pairs: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
];
