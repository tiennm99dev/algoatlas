/**
 * Runs one workload of range sums, range minimums and point sets through six structures over the
 * same array, and counts what each one touches. A touch is one stored number read or written. A
 * structure may look at the current a[i] for free, so a set pays only for what depends on a[i].
 * Ranges are 0-based and inclusive.
 *
 * - Plain array: nothing to build. A query reads every cell of the range; a set writes one cell.
 * - Prefix sums: a sum reads two entries; a set rewrites every later entry. It has no minimum,
 *   because a minimum cannot be subtracted away.
 * - Sparse table of minimums: a minimum reads two blocks. A set rebuilds the whole table, the
 *   simple repair. Its two blocks overlap, which would count shared cells twice in a sum.
 * - Fenwick tree: a sum walks two chains of lowest set bits; a set walks one. A plain Fenwick
 *   tree answers prefixes, so it has no range minimum either.
 * - Segment tree: one touch per node visited, including calls that return at once because their
 *   node lies outside the range. A node holds a sum, a minimum or both, as the workload asks.
 * - Sqrt blocks: blocks of ⌊√n⌋ cells, each with a sum, a minimum or both, as the workload asks.
 *   A query reads loose cells and whole blocks. A set writes the cell and what its block holds
 *   and, only when the workload asks for minimums, rereads the block.
 *
 * A structure that meets a query it cannot answer drops out and stops counting.
 */

export const MIN_N = 4;
export const MAX_N = 1024;
export const DEFAULT_N = 1024;
export const MAX_OPS = 300;
export const MAX_VALUE = 99;
export const SHORT_RANGE = 8;
export const DEFAULT_SEED = 1;

/** @typedef {'plain'|'prefix'|'sparse'|'fenwick'|'segment'|'sqrt'} StructureId */

export const STRUCTURE_IDS = /** @type {StructureId[]} */ ([
  'plain',
  'prefix',
  'sparse',
  'fenwick',
  'segment',
  'sqrt',
]);

export const workloadPseudocode = [
  'for each structure: build it, counting touches',
  'for each operation in the workload:',
  '  sum or min of a[l..r]: each structure reads what it needs',
  '  set a[i] = v: each structure rewrites what depends on a[i]',
  '  a structure that cannot answer the query drops out',
  'cheapest = fewest total touches among those still in',
];

/**
 * @typedef {{ type: 'sum' | 'min', l: number, r: number } | { type: 'set', i: number, v: number }} WorkloadOp
 */

/** @typedef {'any'|'short'|'long'} RangeSize */

/**
 * @typedef {object} WorkloadShape
 * @property {number} sums
 * @property {number} mins
 * @property {number} sets
 * @property {RangeSize} ranges
 */

/**
 * @typedef {object} StructureStats
 * @property {number} build  Touches spent building.
 * @property {number} work  Touches spent on operations so far.
 * @property {number} total  build + work.
 * @property {number} cost  Touches of this operation, 0 outside operations.
 * @property {number} worst  The most expensive single operation so far.
 * @property {number} slots  Numbers stored beside the array.
 * @property {boolean} out  Whether it has met a query it cannot answer.
 * @property {number | null} answer  What it answered to this query, null otherwise.
 */

/**
 * @typedef {object} WorkloadFrame
 * @property {'start'|'build'|'op'|'done'} kind
 * @property {number} n
 * @property {number} opIndex  Index into the workload, -1 outside operations.
 * @property {WorkloadOp | null} op
 * @property {number | null} truth  The answer read directly from the array, null for a set.
 * @property {Record<StructureId, StructureStats>} stats
 * @property {StructureId[]} dropped  Structures this operation put out.
 * @property {StructureId[]} cheapest  The winners, on the last frame only.
 * @property {number[]} lines
 */

/**
 * @typedef {object} Structure
 * @property {number} build
 * @property {number} slots
 * @property {(l: number, r: number) => { answer: number, cost: number } | null} sum
 * @property {(l: number, r: number) => { answer: number, cost: number } | null} min
 * @property {(i: number, v: number) => number} set
 */

/** The starting array, the same for every n so a workload can be quoted. @param {number} n */
export function startValues(n) {
  return Array.from({ length: n }, (_, i) => (i * 37 + 11) % (MAX_VALUE + 1));
}

/** Deterministic generator for reproducible workloads. @param {number} [seed] */
export function seededRand(seed = DEFAULT_SEED) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number[]} values @returns {Structure} */
function plainArray(values) {
  const a = values.slice();
  /** @param {number} l @param {number} r */
  const scan = (l, r) => a.slice(l, r + 1);
  return {
    build: 0,
    slots: 0,
    sum: (l, r) => ({ answer: scan(l, r).reduce((x, y) => x + y, 0), cost: r - l + 1 }),
    min: (l, r) => ({ answer: Math.min(...scan(l, r)), cost: r - l + 1 }),
    set(i, v) {
      a[i] = v;
      return 1;
    },
  };
}

/** @param {number[]} values @returns {Structure} */
function prefixSums(values) {
  const a = values.slice();
  const n = a.length;
  const p = [0];
  for (const x of a) p.push(p[p.length - 1] + x);
  return {
    build: n + 1,
    slots: n + 1,
    sum: (l, r) => ({ answer: p[r + 1] - p[l], cost: 2 }),
    min: () => null,
    set(i, v) {
      const delta = v - a[i];
      a[i] = v;
      for (let j = i + 1; j <= n; j++) p[j] += delta;
      return n - i;
    },
  };
}

/** @param {number[]} values @returns {Structure} */
function sparseTable(values) {
  const a = values.slice();
  const n = a.length;
  /** @type {number[][]} */
  let st = [];
  const rebuild = () => {
    st = [a.slice()];
    for (let k = 1; 2 ** k <= n; k++) {
      const row = [];
      for (let i = 0; i + 2 ** k <= n; i++) {
        row.push(Math.min(st[k - 1][i], st[k - 1][i + 2 ** (k - 1)]));
      }
      st.push(row);
    }
    return st.reduce((cells, row) => cells + row.length, 0);
  };
  const cells = rebuild();
  return {
    build: cells,
    slots: cells,
    sum: () => null,
    min(l, r) {
      const k = 31 - Math.clz32(r - l + 1);
      return { answer: Math.min(st[k][l], st[k][r - 2 ** k + 1]), cost: 2 };
    },
    set(i, v) {
      a[i] = v;
      return rebuild();
    },
  };
}

/** @param {number[]} values @returns {Structure} */
function fenwickTree(values) {
  const a = values.slice();
  const n = a.length;
  const t = new Array(n + 1).fill(0);
  let build = 0;
  for (let i = 1; i <= n; i++) {
    t[i] += a[i - 1];
    build++;
    const up = i + (i & -i);
    if (up <= n) {
      t[up] += t[i];
      build++;
    }
  }
  /** @param {number} end  How many leading cells to add up. */
  const prefix = (end) => {
    let sum = 0;
    let reads = 0;
    for (let i = end; i > 0; i -= i & -i) {
      sum += t[i];
      reads++;
    }
    return { sum, reads };
  };
  return {
    build,
    slots: n,
    sum(l, r) {
      const upper = prefix(r + 1);
      const lower = prefix(l);
      return { answer: upper.sum - lower.sum, cost: upper.reads + lower.reads };
    },
    min: () => null,
    set(i, v) {
      const delta = v - a[i];
      a[i] = v;
      let writes = 0;
      for (let j = i + 1; j <= n; j += j & -j) {
        t[j] += delta;
        writes++;
      }
      return writes;
    },
  };
}

/** @param {number[]} values @param {number} fields  Numbers each node holds. @returns {Structure} */
function segmentTree(values, fields) {
  const n = values.length;
  /** @type {number[]} */
  const sums = [];
  /** @type {number[]} */
  const mins = [];
  /** @param {number} v */
  const pull = (v) => {
    sums[v] = sums[2 * v] + sums[2 * v + 1];
    mins[v] = Math.min(mins[2 * v], mins[2 * v + 1]);
  };
  /** @param {number} v @param {number} lo @param {number} hi */
  const build = (v, lo, hi) => {
    if (lo === hi) {
      sums[v] = values[lo];
      mins[v] = values[lo];
      return;
    }
    const mid = Math.floor((lo + hi) / 2);
    build(2 * v, lo, mid);
    build(2 * v + 1, mid + 1, hi);
    pull(v);
  };
  build(1, 0, n - 1);

  /**
   * @param {number[]} stored
   * @param {(x: number, y: number) => number} merge
   * @param {number} identity
   * @param {number} l
   * @param {number} r
   */
  function query(stored, merge, identity, l, r) {
    let cost = 0;
    /** @param {number} v @param {number} lo @param {number} hi @returns {number} */
    const go = (v, lo, hi) => {
      cost++;
      if (r < lo || hi < l) return identity;
      if (l <= lo && hi <= r) return stored[v];
      const mid = Math.floor((lo + hi) / 2);
      return merge(go(2 * v, lo, mid), go(2 * v + 1, mid + 1, hi));
    };
    const answer = go(1, 0, n - 1);
    return { answer, cost };
  }

  return {
    build: 2 * n - 1,
    slots: fields * (2 * n - 1),
    sum: (l, r) => query(sums, (x, y) => x + y, 0, l, r),
    min: (l, r) => query(mins, Math.min, Infinity, l, r),
    set(i, x) {
      let cost = 0;
      /** @param {number} v @param {number} lo @param {number} hi */
      const go = (v, lo, hi) => {
        cost++;
        if (lo === hi) {
          sums[v] = x;
          mins[v] = x;
          return;
        }
        const mid = Math.floor((lo + hi) / 2);
        if (i <= mid) go(2 * v, lo, mid);
        else go(2 * v + 1, mid + 1, hi);
        pull(v);
      };
      go(1, 0, n - 1);
      return cost;
    },
  };
}

/**
 * @param {number[]} values
 * @param {boolean} needsMin
 * @param {number} fields  Numbers each block holds.
 * @returns {Structure}
 */
function sqrtBlocks(values, needsMin, fields) {
  const a = values.slice();
  const n = a.length;
  const s = Math.floor(Math.sqrt(n));
  const blocks = Math.ceil(n / s);
  /** @param {number} b */
  const cellsOf = (b) => a.slice(b * s, (b + 1) * s);
  const sums = Array.from({ length: blocks }, (_, b) => cellsOf(b).reduce((x, y) => x + y, 0));
  const mins = Array.from({ length: blocks }, (_, b) => Math.min(...cellsOf(b)));

  /**
   * @param {number[]} stored
   * @param {(x: number, y: number) => number} merge
   * @param {number} identity
   * @param {number} l
   * @param {number} r
   */
  function query(stored, merge, identity, l, r) {
    let answer = identity;
    let cost = 0;
    for (let i = l; i <= r; cost++) {
      if (i % s === 0 && i + s - 1 <= r) {
        answer = merge(answer, stored[i / s]);
        i += s;
      } else {
        answer = merge(answer, a[i]);
        i++;
      }
    }
    return { answer, cost };
  }

  return {
    build: n + fields * blocks,
    slots: fields * blocks,
    sum: (l, r) => query(sums, (x, y) => x + y, 0, l, r),
    min: (l, r) => query(mins, Math.min, Infinity, l, r),
    set(i, v) {
      const b = Math.floor(i / s);
      sums[b] += v - a[i];
      a[i] = v;
      if (!needsMin) return 2;
      const cells = cellsOf(b);
      mins[b] = Math.min(...cells);
      return 1 + fields + cells.length;
    },
  };
}

/**
 * Runs the workload through all six structures.
 * @param {number} n
 * @param {WorkloadOp[]} ops
 * @returns {WorkloadFrame[]}
 */
export function workloadTrace(n, ops) {
  const values = startValues(n);
  const needsMin = ops.some((op) => op.type === 'min');
  const needsBoth = needsMin && ops.some((op) => op.type === 'sum');
  const fields = needsBoth ? 2 : 1;
  /** @type {Record<StructureId, Structure>} */
  const live = {
    plain: plainArray(values),
    prefix: prefixSums(values),
    sparse: sparseTable(values),
    fenwick: fenwickTree(values),
    segment: segmentTree(values, fields),
    sqrt: sqrtBlocks(values, needsMin, fields),
  };

  const stats = /** @type {Record<StructureId, StructureStats>} */ ({});
  for (const id of STRUCTURE_IDS) {
    stats[id] = {
      build: 0,
      work: 0,
      total: 0,
      cost: 0,
      worst: 0,
      slots: live[id].slots,
      out: false,
      answer: null,
    };
  }
  const truth = values.slice();

  /** @type {WorkloadFrame[]} */
  const frames = [];
  /**
   * @param {WorkloadFrame['kind']} kind
   * @param {number} opIndex
   * @param {number | null} answer
   * @param {StructureId[]} dropped
   * @param {StructureId[]} cheapest
   * @param {number[]} lines
   */
  const push = (kind, opIndex, answer, dropped, cheapest, lines) => {
    const copy = /** @type {Record<StructureId, StructureStats>} */ ({});
    for (const id of STRUCTURE_IDS) copy[id] = { ...stats[id] };
    frames.push({
      kind,
      n,
      opIndex,
      op: opIndex >= 0 ? { ...ops[opIndex] } : null,
      truth: answer,
      stats: copy,
      dropped: dropped.slice(),
      cheapest: cheapest.slice(),
      lines,
    });
  };

  push('start', -1, null, [], [], [0]);
  for (const id of STRUCTURE_IDS) {
    stats[id].build = live[id].build;
    stats[id].total = live[id].build;
  }
  push('build', -1, null, [], [], [0]);

  ops.forEach((op, index) => {
    /** @type {StructureId[]} */
    const dropped = [];
    for (const id of STRUCTURE_IDS) {
      const s = stats[id];
      s.cost = 0;
      s.answer = null;
      if (s.out) continue;
      if (op.type === 'set') {
        s.cost = live[id].set(op.i, op.v);
      } else {
        const result = live[id][op.type](op.l, op.r);
        if (!result) {
          s.out = true;
          dropped.push(id);
          continue;
        }
        s.cost = result.cost;
        s.answer = result.answer;
      }
      s.work += s.cost;
      s.total += s.cost;
      s.worst = Math.max(s.worst, s.cost);
    }
    /** @type {number | null} */
    let answer = null;
    if (op.type === 'set') {
      truth[op.i] = op.v;
    } else {
      const range = truth.slice(op.l, op.r + 1);
      answer = op.type === 'sum' ? range.reduce((x, y) => x + y, 0) : Math.min(...range);
    }
    const lines = [1, op.type === 'set' ? 3 : 2];
    if (dropped.length > 0) lines.push(4);
    push('op', index, answer, dropped, [], lines);
  });

  for (const id of STRUCTURE_IDS) {
    stats[id].cost = 0;
    stats[id].answer = null;
  }
  const standing = STRUCTURE_IDS.filter((id) => !stats[id].out);
  const best = Math.min(...standing.map((id) => stats[id].total));
  push(
    'done',
    -1,
    null,
    [],
    standing.filter((id) => stats[id].total === best),
    [5],
  );
  return frames;
}

/** Whether every index of the workload fits an array of n cells. @param {WorkloadOp[]} ops @param {number} n */
export function opsFit(ops, n) {
  return ops.every((op) => (op.type === 'set' ? op.i < n : op.r < n));
}

/**
 * Reads a workload such as `s0-9 m3-7 u4=50`: s for a range sum, m for a range minimum, u to set
 * one cell. Separated by spaces or commas.
 * @param {string} text
 * @param {number} n
 * @returns {{ ops: WorkloadOp[] } | { error: 'empty'|'format'|'count'|'range'|'value' }}
 */
export function parseOps(text, n) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return { error: 'empty' };
  if (parts.length > MAX_OPS) return { error: 'count' };
  /** @type {WorkloadOp[]} */
  const ops = [];
  for (const part of parts) {
    const query = /^([sm])(\d{1,4})-(\d{1,4})$/i.exec(part);
    const set = /^u(\d{1,4})=(\d{1,4})$/i.exec(part);
    if (query) {
      const l = Number(query[2]);
      const r = Number(query[3]);
      if (l > r || r >= n) return { error: 'range' };
      ops.push({ type: query[1].toLowerCase() === 's' ? 'sum' : 'min', l, r });
    } else if (set) {
      const i = Number(set[1]);
      const v = Number(set[2]);
      if (i >= n) return { error: 'range' };
      if (v > MAX_VALUE) return { error: 'value' };
      ops.push({ type: 'set', i, v });
    } else {
      return { error: 'format' };
    }
  }
  return { ops };
}

/** @param {WorkloadOp} op */
export function formatOp(op) {
  if (op.type === 'set') return `u${op.i}=${op.v}`;
  return `${op.type === 'sum' ? 's' : 'm'}${op.l}-${op.r}`;
}

/** @param {WorkloadOp[]} ops */
export function formatOps(ops) {
  return ops.map(formatOp).join(' ');
}

/**
 * A range of the asked size: any two ends, at most SHORT_RANGE cells, or at least half the array.
 * @param {number} n
 * @param {RangeSize} size
 * @param {() => number} rand
 */
function pickRange(n, size, rand) {
  /** @param {number} k */
  const below = (k) => Math.floor(rand() * k);
  if (size === 'any') {
    const x = below(n);
    const y = below(n);
    return { l: Math.min(x, y), r: Math.max(x, y) };
  }
  const shortest = size === 'short' ? 1 : Math.ceil(n / 2);
  const longest = size === 'short' ? Math.min(SHORT_RANGE, n) : n;
  const length = shortest + below(longest - shortest + 1);
  const l = below(n - length + 1);
  return { l, r: l + length - 1 };
}

/**
 * Builds a shuffled workload with the asked number of each operation.
 * @param {number} n
 * @param {WorkloadShape} shape
 * @param {() => number} [rand]
 * @returns {WorkloadOp[]}
 */
export function makeWorkload(n, { sums, mins, sets, ranges }, rand = Math.random) {
  /** @type {WorkloadOp[]} */
  const ops = [];
  for (let k = 0; k < sums; k++) ops.push({ type: 'sum', ...pickRange(n, ranges, rand) });
  for (let k = 0; k < mins; k++) ops.push({ type: 'min', ...pickRange(n, ranges, rand) });
  for (let k = 0; k < sets; k++) {
    ops.push({
      type: 'set',
      i: Math.floor(rand() * n),
      v: Math.floor(rand() * (MAX_VALUE + 1)),
    });
  }
  for (let i = ops.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ops[i], ops[j]] = [ops[j], ops[i]];
  }
  return ops;
}

/** @type {Record<string, WorkloadShape>} */
export const WORKLOAD_PRESETS = {
  staticSums: { sums: 300, mins: 0, sets: 0, ranges: 'any' },
  sumsAndSets: { sums: 150, mins: 0, sets: 150, ranges: 'any' },
  staticMins: { sums: 0, mins: 300, sets: 0, ranges: 'any' },
  minsAndSets: { sums: 0, mins: 150, sets: 150, ranges: 'any' },
  everything: { sums: 100, mins: 100, sets: 100, ranges: 'any' },
  shortRanges: { sums: 75, mins: 75, sets: 150, ranges: 'short' },
};
