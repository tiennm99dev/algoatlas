/**
 * A polynomial-time reduction from CLIQUE to INDEPENDENT SET, followed by the NP verifier
 * for CLIQUE.
 *
 * CLIQUE asks: does the graph G have k vertices that are all joined to each other?
 * INDEPENDENT SET asks: does the graph H have k vertices with no edge between any two?
 * The reduction builds the complement H of G (same vertices, an edge exactly where G has
 * none) and keeps k, so a set is a clique of G exactly when it is independent in H. It
 * looks at each of the n(n − 1)/2 pairs once, which is polynomial.
 *
 * The verifier takes a certificate S, a proposed set of vertices, and checks it in
 * polynomial time: at least k vertices, and every pair of them joined in G. A search, by
 * contrast, may have to try every k-subset of the vertices.
 *
 * Vertices are numbered by their position in `ids` sorted ascending; pairs go in
 * lexicographic order of those positions. Edges are undirected and duplicates count once.
 */

/** Largest graph the lesson draws. */
export const MAX_NODES = 8;

/**
 * @typedef {object} PlainEdge
 * @property {number} from  Vertex id.
 * @property {number} to    Vertex id.
 */

/**
 * @typedef {object} ReductionFrame
 * @property {'start'|'keep'|'add'|'mapped'|'small'|'pairOk'|'pairBad'|'accept'|'done'} kind
 * @property {number} n
 * @property {number} k
 * @property {[number, number][]} edges  Edges of G as index pairs, smaller index first.
 * @property {[number, number][]} built  Edges of H added so far.
 * @property {[number, number]|null} pair  The pair looked at now, or null.
 * @property {boolean} mapped  Whether H is complete.
 * @property {number[]} cert  The certificate S, as sorted indices.
 * @property {[number, number][]} checked  Certificate pairs the verifier has confirmed.
 * @property {number} mapSteps  Pairs the reduction has looked at.
 * @property {number} checks  Pairs the verifier has looked at.
 * @property {'accept'|'reject'|''} verdict  The verifier's answer once it has one.
 * @property {number} largest  The largest clique of G, found by brute force for the summary.
 * @property {number[]} witness  One largest clique of G, as sorted indices.
 * @property {number} subsets  How many k-subsets a brute-force search would have to try.
 * @property {number[]} lines
 */

export const reductionPseudocode = [
  'reduce(G, k):       // CLIQUE ≤ₚ TẬP ĐỘC LẬP',
  '  H = cùng tập đỉnh, chưa có cạnh',
  '  for (u, v) in pairs(V):',
  '    if u – v not in G: thêm u – v vào H',
  '  return (H, k)      // n(n − 1)/2 cặp',
  'verify(G, k, S):    // S: chứng chỉ',
  '  if |S| < k: return "bác bỏ"',
  '  for (u, v) in pairs(S):',
  '    if u – v not in G: return "bác bỏ"',
  '  return "chấp nhận"',
];

/**
 * The edges as sorted index pairs, one per pair, without loops.
 * @param {number[]} ids
 * @param {PlainEdge[]} edges
 * @returns {{n: number, index: Map<number, number>, pairs: [number, number][]}}
 */
export function indexGraph(ids, edges) {
  const sorted = ids.slice().sort((a, b) => a - b);
  const index = new Map(sorted.map((id, i) => [id, i]));
  /** @type {[number, number][]} */
  const pairs = [];
  const seen = new Set();
  for (const e of edges) {
    const a = index.get(e.from);
    const b = index.get(e.to);
    if (a === undefined || b === undefined || a === b) continue;
    const u = Math.min(a, b);
    const v = Math.max(a, b);
    if (seen.has(u * 64 + v)) continue;
    seen.add(u * 64 + v);
    pairs.push([u, v]);
  }
  pairs.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  return { n: sorted.length, index, pairs };
}

/** @param {number} n @param {number} k  The binomial coefficient C(n, k). */
export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/**
 * The largest clique by trying every subset, largest first; ties go to the first subset in
 * the order of its bit mask.
 * @param {number} n
 * @param {[number, number][]} pairs
 * @returns {number[]}
 */
export function largestClique(n, pairs) {
  const adj = Array.from({ length: n }, () => 0);
  for (const [u, v] of pairs) {
    adj[u] |= 1 << v;
    adj[v] |= 1 << u;
  }
  /** @type {number[]} */
  let best = [];
  for (let mask = 1; mask < 1 << n; mask++) {
    /** @type {number[]} */
    const members = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) members.push(i);
    if (members.length <= best.length) continue;
    const ok = members.every((u) => members.every((v) => u === v || adj[u] & (1 << v)));
    if (ok) best = members;
  }
  return best;
}

/**
 * Runs the reduction, then the verifier on the certificate, and records every step.
 * @param {{ids: number[], edges: PlainEdge[], k: number, cert: number[]}} input
 *   `cert` lists vertex ids.
 * @returns {ReductionFrame[]}
 */
export function reductionTrace({ ids, edges, k, cert }) {
  const { n, index, pairs } = indexGraph(ids, edges);
  const inG = new Set(pairs.map(([u, v]) => u * 64 + v));
  const s = [...new Set(cert.map((id) => index.get(id)).filter((i) => i !== undefined))]
    .map((i) => /** @type {number} */ (i))
    .sort((a, b) => a - b);
  const witness = largestClique(n, pairs);
  const subsets = choose(n, k);

  /** @type {[number, number][]} */
  const built = [];
  /** @type {[number, number][]} */
  const checked = [];
  let mapped = false;
  let mapSteps = 0;
  let checks = 0;
  /** @type {ReductionFrame['verdict']} */
  let verdict = '';
  /** The pseudocode line where the verifier rejected. */
  let rejectLine = 6;
  /** @type {ReductionFrame[]} */
  const frames = [];

  /**
   * @param {ReductionFrame['kind']} kind
   * @param {[number, number]|null} pair
   * @param {number[]} lines
   */
  function record(kind, pair, lines) {
    frames.push({
      kind,
      n,
      k,
      edges: pairs.map(([u, v]) => [u, v]),
      built: built.map(([u, v]) => [u, v]),
      pair: pair ? [pair[0], pair[1]] : null,
      mapped,
      cert: s.slice(),
      checked: checked.map(([u, v]) => [u, v]),
      mapSteps,
      checks,
      verdict,
      largest: witness.length,
      witness: witness.slice(),
      subsets,
      lines,
    });
  }

  record('start', null, [0, 1]);
  for (let u = 0; u < n; u++) {
    for (let v = u + 1; v < n; v++) {
      mapSteps++;
      if (inG.has(u * 64 + v)) {
        record('keep', [u, v], [2, 3]);
      } else {
        built.push([u, v]);
        record('add', [u, v], [2, 3]);
      }
    }
  }
  mapped = true;
  record('mapped', null, [4]);

  if (s.length < k) {
    verdict = 'reject';
    rejectLine = 6;
    record('small', null, [5, 6]);
  } else {
    let ok = true;
    outer: for (let i = 0; i < s.length; i++) {
      for (let j = i + 1; j < s.length; j++) {
        checks++;
        /** @type {[number, number]} */
        const p = [s[i], s[j]];
        if (!inG.has(p[0] * 64 + p[1])) {
          ok = false;
          verdict = 'reject';
          rejectLine = 8;
          record('pairBad', p, [7, 8]);
          break outer;
        }
        checked.push(p);
        record('pairOk', p, [7, 8]);
      }
    }
    if (ok) {
      verdict = 'accept';
      record('accept', null, [9]);
    }
  }
  record('done', null, verdict === 'accept' ? [9] : [rejectLine]);
  return frames;
}

/**
 * @typedef {object} ReductionPreset
 * @property {string} key
 * @property {[number, number][]} spots  Vertex positions, by id.
 * @property {[number, number][]} pairs  Edges, as id pairs.
 * @property {number} k
 * @property {number[]} cert  Certificate vertex ids.
 */

/** @type {ReductionPreset[]} */
export const REDUCTION_PRESETS = [
  {
    key: 'clique',
    spots: [
      [110, 50],
      [250, 50],
      [250, 180],
      [110, 180],
      [380, 110],
      [40, 260],
    ],
    pairs: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 2],
      [1, 3],
      [2, 3],
      [1, 4],
      [2, 4],
      [3, 5],
    ],
    k: 4,
    cert: [0, 1, 2, 3],
  },
  {
    key: 'house',
    spots: [
      [240, 40],
      [140, 130],
      [340, 130],
      [140, 260],
      [340, 260],
    ],
    pairs: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
    ],
    k: 3,
    cert: [0, 1, 3],
  },
  {
    key: 'cycle',
    spots: [
      [240, 40],
      [390, 140],
      [330, 260],
      [150, 260],
      [90, 140],
    ],
    pairs: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
    k: 3,
    cert: [0, 1],
  },
];
