/**
 * A race between three priority queues on the same sequence of operations: a binary heap, a
 * Fibonacci heap and a van Emde Boas tree. The sequence comes either from a real run of
 * Dijkstra’s algorithm on a generated graph (one step per operation), or from an operation mix
 * the learner sets on a queue that holds n keys throughout (one step per batch of a round).
 *
 * Each operation is charged steps under a simple cost model, with s the queue size at that
 * moment and L(s) = ⌊log₂ s⌋ + 1 the levels of a binary heap of s items:
 *
 * - binary heap: L(s) for insert, extract-min and decrease-key alike (one root-to-leaf path);
 * - Fibonacci heap (amortized): 1 for insert and decrease-key, D(s) + 1 for extract-min, where
 *   D(s) = ⌊log_φ s⌋ bounds the degree of a root after consolidation;
 * - van Emde Boas tree: log₂ log₂ u + 1 for every operation, one call per level, but only for
 *   integer keys below u.
 */

/**
 * @typedef {'dijkstra'|'mix'} RaceMode
 * @typedef {{sizeBits: number, inserts: number, decreases: number, extracts: number}} OpMix
 * @typedef {'insert'|'extract'|'decrease'} QueueOpType
 * @typedef {{type: QueueOpType, vertex: number, key: number}} QueueOp
 * @typedef {{binary: number, fibonacci: number, veb: number}} Costs
 * @typedef {{from: number, to: number, weight: number}} WeightedEdge
 */

/**
 * @typedef {object} RaceFrame
 * @property {'start'|'insert'|'extract'|'decrease'|'done'} kind
 * @property {RaceMode} mode
 * @property {number} opIndex  Dijkstra: the operation this step runs; -1 otherwise.
 * @property {number} round  Mix: the round this batch belongs to, from 1; -1 otherwise.
 * @property {number} batch  How many operations this step runs (1 for Dijkstra).
 * @property {number} vertex  Dijkstra: the vertex of this operation; -1 otherwise.
 * @property {number} key  Dijkstra: its key, a tentative distance; -1 otherwise.
 * @property {number} size  Queue size after this step (the mix keeps it at n).
 * @property {Costs} step  Steps this step costs each queue.
 * @property {Costs} total  Running totals.
 * @property {{insert: number, extract: number, decrease: number}} counts
 * @property {number} maxKey  Largest key seen so far; -1 when keys are not modelled.
 * @property {number} maxSize  Largest queue size so far.
 * @property {boolean} fits  Whether the vEB universe holds every key so far: Dijkstra’s keys
 *   must be below u, and a mix’s n distinct keys need n ≤ u.
 * @property {number[]} lines
 */

export const MIN_V = 4;
export const MAX_V = 40;
export const MAX_E = 160;
export const MAX_W = 50;
/** A mix runs this many rounds; each takes up to MAX_BATCH of each operation. */
export const ROUNDS = 10;
export const MAX_BATCH = 20;
/** A mix's queue holds n = 2^sizeBits keys, up to about a million. */
export const MAX_SIZE_BITS = 20;
/** Universes a vEB tree can take here: 2^4, 2^8, 2^16, 2^32. */
export const UNIVERSE_BITS = [4, 8, 16, 32];

export const dijkstraPseudocode = [
  'insert(s, 0)',
  'while the queue is not empty:',
  '  u = extractMin()',
  '  for each edge u → v with weight w:',
  '    if v was never queued: insert(v, dist(u) + w)',
  '    else if v is queued and dist(u) + w < key(v):',
  '      decreaseKey(v, dist(u) + w)',
];

export const mixPseudocode = [
  'repeat for each round (the queue holds n keys):',
  '  insert a new keys',
  '  decreaseKey on d keys',
  '  extractMin() e times',
];

/** @param {RaceMode} mode */
export const racePseudocode = (mode) => (mode === 'dijkstra' ? dijkstraPseudocode : mixPseudocode);

const PHI = (1 + Math.sqrt(5)) / 2;

/** Levels of a binary heap of s items, at least 1. @param {number} s */
export const heapLevels = (s) => (s <= 1 ? 1 : Math.floor(Math.log2(s)) + 1);

/** D(s) + 1: the amortized steps of a Fibonacci extract-min on s items. @param {number} s */
export const fibExtract = (s) => (s <= 1 ? 1 : Math.floor(Math.log(s) / Math.log(PHI) + 1e-9) + 1);

/** log₂ log₂ u + 1 for u = 2^bits: the levels of a vEB tree. @param {number} bits */
export const vebLevels = (bits) => Math.log2(bits) + 1;

/**
 * Steps charged to each queue for one operation.
 * @param {QueueOpType} type
 * @param {number} s  Queue size: after an insert, before an extract, during a decrease.
 * @param {number} bits  The vEB universe is 2^bits.
 * @returns {Costs}
 */
export function opCost(type, s, bits) {
  return {
    binary: heapLevels(s),
    fibonacci: type === 'extract' ? fibExtract(s) : 1,
    veb: vebLevels(bits),
  };
}

/**
 * A connected directed graph: a random tree from vertex 0 reaches every vertex, then extra
 * edges are added at random until there are `e`. Weights are whole numbers from 1 to `maxW`.
 * @param {number} v
 * @param {number} e
 * @param {number} maxW
 * @param {number} seed
 * @returns {WeightedEdge[]}
 */
export function makeGraph(v, e, maxW, seed) {
  let s = seed >>> 0;
  const rand = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pick = (/** @type {number} */ n) => Math.floor(rand() * n);
  const weight = () => 1 + pick(maxW);
  /** @type {WeightedEdge[]} */
  const edges = [];
  /** @type {Set<string>} */
  const seen = new Set();
  for (let i = 1; i < v; i++) {
    const from = pick(i);
    edges.push({ from, to: i, weight: weight() });
    seen.add(`${from}>${i}`);
  }
  const target = Math.min(e, v * (v - 1));
  while (edges.length < target) {
    const from = pick(v);
    const to = pick(v);
    if (from === to || seen.has(`${from}>${to}`)) continue;
    seen.add(`${from}>${to}`);
    edges.push({ from, to, weight: weight() });
  }
  return edges;
}

/** The largest edge count a graph on v vertices may have here. @param {number} v */
export const maxEdges = (v) => Math.min(MAX_E, v * (v - 1));

/**
 * The queue operations of Dijkstra’s algorithm from vertex 0, with lazy insertion: a vertex
 * enters the queue when it is first reached. Ties go to the smaller vertex.
 * @param {number} v
 * @param {WeightedEdge[]} edges
 * @returns {QueueOp[]}
 */
export function dijkstraOps(v, edges) {
  /** @type {WeightedEdge[][]} */
  const out = Array.from({ length: v }, () => []);
  for (const e of edges) out[e.from].push(e);
  for (const list of out) list.sort((a, b) => a.to - b.to);
  /** @type {(number | null)[]} */
  const key = Array(v).fill(null);
  const done = Array(v).fill(false);
  /** @type {QueueOp[]} */
  const ops = [{ type: 'insert', vertex: 0, key: 0 }];
  key[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < v; i++) {
      const k = key[i];
      if (k !== null && !done[i] && (u < 0 || k < /** @type {number} */ (key[u]))) u = i;
    }
    if (u < 0) break;
    done[u] = true;
    const du = /** @type {number} */ (key[u]);
    ops.push({ type: 'extract', vertex: u, key: du });
    for (const e of out[u]) {
      const nd = du + e.weight;
      const kv = key[e.to];
      if (kv === null) {
        key[e.to] = nd;
        ops.push({ type: 'insert', vertex: e.to, key: nd });
      } else if (!done[e.to] && nd < kv) {
        key[e.to] = nd;
        ops.push({ type: 'decrease', vertex: e.to, key: nd });
      }
    }
  }
  return ops;
}

/** @param {Omit<RaceFrame, 'step'|'total'|'counts'> & {step: Costs, total: Costs, counts: RaceFrame['counts']}} f @returns {RaceFrame} */
const snap = (f) => ({ ...f, step: { ...f.step }, total: { ...f.total }, counts: { ...f.counts } });

const ZERO = { binary: 0, fibonacci: 0, veb: 0 };

/**
 * The race on Dijkstra’s queue operations, one step per operation.
 * @param {QueueOp[]} ops
 * @param {number} bits  The vEB universe is 2^bits.
 * @returns {RaceFrame[]}
 */
export function dijkstraRace(ops, bits) {
  /** @type {RaceFrame[]} */
  const frames = [];
  const total = { ...ZERO };
  const counts = { insert: 0, extract: 0, decrease: 0 };
  let size = 0;
  let maxSize = 0;
  let maxKey = -1;
  /** @param {Partial<RaceFrame> & Pick<RaceFrame, 'kind'|'lines'>} f */
  const push = (f) =>
    frames.push(
      snap({
        mode: 'dijkstra',
        opIndex: -1,
        round: -1,
        batch: 0,
        vertex: -1,
        key: -1,
        step: ZERO,
        ...f,
        size,
        total,
        counts,
        maxKey,
        maxSize,
        fits: maxKey < 2 ** bits,
      }),
    );

  push({ kind: 'start', lines: [] });
  ops.forEach((op, i) => {
    let s = size;
    if (op.type === 'insert') s = ++size;
    const step = opCost(op.type, s, bits);
    if (op.type === 'extract') size--;
    maxSize = Math.max(maxSize, size);
    total.binary += step.binary;
    total.fibonacci += step.fibonacci;
    total.veb += step.veb;
    counts[op.type]++;
    maxKey = Math.max(maxKey, op.key);
    /** @type {number[]} */
    let lines = [3, 4];
    if (op.type === 'extract') lines = [1, 2];
    else if (op.type === 'decrease') lines = [3, 5, 6];
    else if (i === 0) lines = [0];
    push({ kind: op.type, lines, opIndex: i, batch: 1, vertex: op.vertex, key: op.key, step });
  });
  push({ kind: 'done', lines: [1] });
  return frames;
}

/**
 * The race on an operation mix: a queue that holds n = 2^sizeBits keys throughout runs
 * ROUNDS rounds of `inserts` inserts, `decreases` decrease-keys and `extracts` extract-mins.
 * One step per non-empty batch.
 * @param {OpMix} mix
 * @param {number} bits  The vEB universe is 2^bits.
 * @returns {RaceFrame[]}
 */
export function mixRace(mix, bits) {
  const n = 2 ** mix.sizeBits;
  /** @type {RaceFrame[]} */
  const frames = [];
  const total = { ...ZERO };
  const counts = { insert: 0, extract: 0, decrease: 0 };
  /** @param {Partial<RaceFrame> & Pick<RaceFrame, 'kind'|'lines'>} f */
  const push = (f) =>
    frames.push(
      snap({
        mode: 'mix',
        opIndex: -1,
        round: -1,
        batch: 0,
        vertex: -1,
        key: -1,
        step: ZERO,
        ...f,
        size: n,
        total,
        counts,
        maxKey: -1,
        maxSize: n,
        fits: n <= 2 ** bits,
      }),
    );

  push({ kind: 'start', lines: [] });
  /** @type {[QueueOpType, number, number][]} */
  const batches = [
    ['insert', mix.inserts, 1],
    ['decrease', mix.decreases, 2],
    ['extract', mix.extracts, 3],
  ];
  for (let round = 1; round <= ROUNDS; round++) {
    for (const [type, batch, line] of batches) {
      if (batch === 0) continue;
      const one = opCost(type, n, bits);
      const step = {
        binary: one.binary * batch,
        fibonacci: one.fibonacci * batch,
        veb: one.veb * batch,
      };
      total.binary += step.binary;
      total.fibonacci += step.fibonacci;
      total.veb += step.veb;
      counts[type] += batch;
      push({
        kind: type,
        lines: round === 1 && type === 'insert' ? [0, line] : [line],
        round,
        batch,
        step,
      });
    }
  }
  push({ kind: 'done', lines: [0] });
  return frames;
}

/** Which queue costs the fewest steps in a frame; vEB only when its universe fits. @param {RaceFrame} f @returns {(keyof Costs)[]} */
export function leaders(f) {
  const names = /** @type {(keyof Costs)[]} */ (['binary', 'fibonacci', 'veb']).filter(
    (k) => k !== 'veb' || f.fits,
  );
  const best = Math.min(...names.map((k) => f.total[k]));
  return names.filter((k) => f.total[k] === best);
}
