/**
 * Step trace for a van Emde Boas tree over the universe {0, …, u − 1}, with u = 2^(2^k) so
 * every square root is a whole power of two (u = 16 or 256 here). A structure of size u keeps
 * its min and max, √u clusters of size √u and a summary of size √u that records which clusters
 * are non-empty. The min is stored only in the min field, never in a cluster; a structure of
 * size 2 is just its min and max. high(x) = ⌊x / √u⌋ names the cluster, low(x) = x mod √u the
 * place inside it, and index(h, l) = h·√u + l puts them back together. Every operation makes
 * at most one call that does real work per level, and there are log₂ log₂ u + 1 levels.
 *
 * Structures are named by their path: `V` is the whole tree, `V.S` its summary, `V.3` its
 * cluster 3, `V.3.S` the summary of that cluster, and so on.
 */

/**
 * @typedef {16|256} Universe
 * @typedef {'insert'|'delete'|'successor'} VebOpType
 * @typedef {{type: VebOpType, value: number}} VebOp
 * @typedef {'clrs'|'deletes'|'wide'|'random'} VebPreset
 */

/**
 * A non-empty structure (or the one being visited) in a frame.
 * @typedef {object} VebNode
 * @property {string} path
 * @property {number} u
 * @property {number | null} min
 * @property {number | null} max
 */

/**
 * @typedef {object} VebFrame
 * @property {'start'|'present'|'absent'|'call'|'empty-insert'|'swap-min'|'cluster-empty'|'fill-cluster'|'into-cluster'|'set-max'|'base'|'min-shortcut'|'in-cluster'|'to-summary'|'no-succ'|'combine'|'answer'|'del-only'|'del-base'|'del-min'|'del-into'|'del-summary'|'del-max'|'done'} kind
 * @property {Universe} universe
 * @property {VebNode[]} nodes  Every non-empty structure, plus the one being visited.
 * @property {number[]} set  The keys stored, ascending.
 * @property {number} opIndex  The operation this step belongs to; -1 on start and done.
 * @property {VebOpType | null} op
 * @property {string} path  The structure this step works in; '' when none.
 * @property {number} u  Its universe size; 0 when none.
 * @property {number} x  The argument in that structure's own numbering; -1 when none.
 * @property {number} high  high(x), or −1 when the step does not split x.
 * @property {number} low  low(x), or −1.
 * @property {number | null} result  On successor steps: the answer in this structure's numbering.
 * @property {[number, number] | null} span  The keys of the whole universe that x stands for, half-open.
 * @property {string[]} stack  Paths of the calls still open, outermost first.
 * @property {number} calls  Calls made by the current operation so far.
 * @property {number} depth  Deepest level reached by the current operation (the root is 1).
 * @property {number} totalCalls  Calls made by all operations so far.
 * @property {number | null} answer  The successor found by the last finished query.
 * @property {number} queries  Successor queries finished so far.
 * @property {number[]} lines
 */

export const UNIVERSES = /** @type {Universe[]} */ ([16, 256]);
export const MAX_KEYS = 12;
export const MAX_OPS = 16;

export const vebPseudocode = [
  'insert(V, x):',
  '  if V.min = nil: V.min = V.max = x; return    // rỗng: O(1)',
  '  if x < V.min: swap(x, V.min)',
  '  if V.u > 2:',
  '    if cluster[high(x)] rỗng:',
  '      insert(summary, high(x)); cluster[high(x)].min = .max = low(x)',
  '    else insert(cluster[high(x)], low(x))',
  '  if x > V.max: V.max = x',
  'successor(V, x):',
  '  if V.u = 2: return 1 if x = 0 and V.max = 1, else nil',
  '  if V.min ≠ nil and x < V.min: return V.min',
  '  if low(x) < max(cluster[high(x)]):',
  '    return index(high(x), successor(cluster[high(x)], low(x)))',
  '  c = successor(summary, high(x))',
  '  if c = nil: return nil',
  '  return index(c, min(cluster[c]))',
  'delete(V, x):',
  '  if V.min = V.max: V.min = V.max = nil; return',
  '  if V.u = 2: V.min = V.max = 1 − x; return',
  '  if x = V.min:',
  '    c = min(summary); x = index(c, min(cluster[c])); V.min = x',
  '  delete(cluster[high(x)], low(x))',
  '  if cluster[high(x)] rỗng:',
  '    delete(summary, high(x))',
  '    if x = V.max:',
  '      s = max(summary)',
  '      V.max = V.min if s = nil, else index(s, max(cluster[s]))',
  '  else if x = V.max: V.max = index(high(x), max(cluster[high(x)]))',
];

/**
 * @typedef {object} Veb
 * @property {number} u
 * @property {number | null} min
 * @property {number | null} max
 * @property {Veb | null} summary
 * @property {Veb[]} cluster
 */

/** @param {number} u @returns {Veb} */
function build(u) {
  if (u === 2) return { u, min: null, max: null, summary: null, cluster: [] };
  const r = Math.sqrt(u);
  return {
    u,
    min: null,
    max: null,
    summary: build(r),
    cluster: Array.from({ length: r }, () => build(r)),
  };
}

/** √u of a structure; its clusters and summary have this size. @param {number} u */
export const rootOf = (u) => Math.sqrt(u);

/** log₂ log₂ u, the number of levels below the top. @param {number} u */
export const levelsOf = (u) => Math.log2(Math.log2(u));

/**
 * A short name for a structure: `V`, `S` (a summary) or `c3` (cluster 3).
 * @param {string} path
 */
export function shortName(path) {
  const last = path.split('.').at(-1) ?? '';
  return last === 'V' || last === 'S' ? last : `c${last}`;
}

/**
 * The parent path of a structure, or null for the root.
 * @param {string} path
 */
export function parentPath(path) {
  const i = path.lastIndexOf('.');
  return i < 0 ? null : path.slice(0, i);
}

/**
 * @typedef {object} VebBranch
 * @property {VebNode} node
 * @property {VebBranch[]} children  The summary first, then the clusters by number.
 */

/**
 * The structures of a frame as a tree under V. A structure whose parent is not drawn (it can
 * only be empty) gets that parent drawn empty.
 * @param {VebNode[]} nodes
 * @returns {VebBranch | null}
 */
export function structureTree(nodes) {
  const all = nodes.slice();
  const has = (/** @type {string} */ p) => all.some((n) => n.path === p);
  for (const n of nodes) {
    let p = parentPath(n.path);
    let size = n.u;
    while (p && !has(p)) {
      size *= size;
      all.push({ path: p, u: size, min: null, max: null });
      p = parentPath(p);
    }
  }
  /** @param {string} path */
  const rank = (path) => {
    const last = path.split('.').at(-1);
    return last === 'S' ? -1 : Number(last);
  };
  /** @param {VebNode} node @returns {VebBranch} */
  const grow = (node) => ({
    node,
    children: all
      .filter((c) => parentPath(c.path) === node.path)
      .toSorted((a, b) => rank(a.path) - rank(b.path))
      .map(grow),
  });
  const top = all.find((n) => n.path === 'V');
  return top ? grow(top) : null;
}

/**
 * The keys stored after `ops` (inserts of a present key and deletes of a missing one change
 * nothing), so a page can check an operation before adding it.
 * @param {VebOp[]} ops
 * @returns {Set<number>}
 */
export function keysAfter(ops) {
  /** @type {Set<number>} */
  const set = new Set();
  for (const op of ops) {
    if (op.type === 'insert') set.add(op.value);
    else if (op.type === 'delete') set.delete(op.value);
  }
  return set;
}

/**
 * @param {VebOp[]} ops
 * @param {Universe} [universe]
 * @returns {VebFrame[]}
 */
export function vebTrace(ops, universe = 16) {
  const root = build(universe);
  /** @type {Set<number>} */
  const members = new Set();
  /** @type {VebFrame[]} */
  const frames = [];
  /** @type {string[]} */
  const stack = [];
  let opIndex = -1;
  /** @type {VebOpType | null} */
  let op = null;
  let calls = 0;
  let depth = 0;
  let totalCalls = 0;
  /** @type {number | null} */
  let answer = null;
  let queries = 0;
  // The structure being visited, drawn even while it is empty.
  let visiting = '';

  /** @returns {VebNode[]} */
  function snapshot() {
    /** @type {VebNode[]} */
    const out = [];
    /** @param {Veb} v @param {string} path */
    const walk = (v, path) => {
      if (v.min === null && path !== visiting) return;
      out.push({ path, u: v.u, min: v.min, max: v.max });
      if (v.summary) walk(v.summary, `${path}.S`);
      v.cluster.forEach((c, i) => walk(c, `${path}.${i}`));
    };
    // The root is always drawn, even when the set is empty.
    out.push({ path: 'V', u: root.u, min: root.min, max: root.max });
    if (root.summary) walk(root.summary, 'V.S');
    root.cluster.forEach((c, i) => walk(c, `V.${i}`));
    return out;
  }

  /**
   * @typedef {object} Ctx
   * @property {Veb} v
   * @property {string} path
   * @property {number} offset  First key of the whole universe this structure covers.
   * @property {number} scale  Keys of the whole universe per local key.
   */

  /**
   * @param {Pick<VebFrame, 'kind'|'lines'> & Partial<VebFrame>} f
   * @param {Ctx | null} ctx
   * @param {number} [x]
   */
  const push = (f, ctx, x = -1) => {
    const r = ctx && ctx.v.u > 2 ? rootOf(ctx.v.u) : 0;
    frames.push({
      result: null,
      ...f,
      universe,
      nodes: snapshot(),
      set: [...members].sort((a, b) => a - b),
      opIndex,
      op,
      path: ctx ? ctx.path : '',
      u: ctx ? ctx.v.u : 0,
      x,
      high: ctx && r && x >= 0 ? Math.floor(x / r) : -1,
      low: ctx && r && x >= 0 ? x % r : -1,
      span: ctx && x >= 0 ? [ctx.offset + x * ctx.scale, ctx.offset + (x + 1) * ctx.scale] : null,
      stack: stack.slice(),
      calls,
      depth,
      totalCalls,
      answer,
      queries,
    });
  };

  /** @param {Ctx} ctx @param {number} c @returns {Ctx} */
  const clusterCtx = (ctx, c) => ({
    v: ctx.v.cluster[c],
    path: `${ctx.path}.${c}`,
    offset: ctx.offset + c * rootOf(ctx.v.u) * ctx.scale,
    scale: ctx.scale,
  });
  /** @param {Ctx} ctx @returns {Ctx} */
  const summaryCtx = (ctx) => ({
    v: /** @type {Veb} */ (ctx.v.summary),
    path: `${ctx.path}.S`,
    offset: ctx.offset,
    scale: ctx.scale * rootOf(ctx.v.u),
  });

  /** Opens a call: counts it and draws its structure. @param {Ctx} ctx @param {number} x @param {number} line */
  function enter(ctx, x, line) {
    calls++;
    totalCalls++;
    stack.push(ctx.path);
    depth = Math.max(depth, stack.length);
    visiting = ctx.path;
    push({ kind: 'call', lines: [line] }, ctx, x);
  }

  /** @param {Ctx} ctx */
  function leave(ctx) {
    stack.pop();
    visiting = parentPath(ctx.path) ?? '';
  }

  /** @param {Ctx} ctx @param {number} x */
  function insert(ctx, x) {
    enter(ctx, x, 0);
    const v = ctx.v;
    if (v.min === null) {
      v.min = v.max = x;
      push({ kind: 'empty-insert', lines: [1] }, ctx, x);
      leave(ctx);
      return;
    }
    if (x < v.min) {
      const old = v.min;
      v.min = x;
      push({ kind: 'swap-min', lines: [2], result: old }, ctx, x);
      x = old;
    }
    if (v.u > 2) {
      const r = rootOf(v.u);
      const h = Math.floor(x / r);
      const l = x % r;
      const c = v.cluster[h];
      if (c.min === null) {
        push({ kind: 'cluster-empty', lines: [3, 4] }, ctx, x);
        insert(summaryCtx(ctx), h);
        c.min = c.max = l;
        push({ kind: 'fill-cluster', lines: [5] }, ctx, x);
      } else {
        push({ kind: 'into-cluster', lines: [3, 6] }, ctx, x);
        insert(clusterCtx(ctx, h), l);
      }
    }
    if (x > /** @type {number} */ (v.max)) {
      v.max = x;
      push({ kind: 'set-max', lines: [7] }, ctx, x);
    }
    leave(ctx);
  }

  /** @param {Ctx} ctx @param {number} x @returns {number | null} */
  function successor(ctx, x) {
    enter(ctx, x, 8);
    const v = ctx.v;
    /** @param {number | null} result */
    const done = (result) => {
      leave(ctx);
      return result;
    };
    if (v.u === 2) {
      const result = x === 0 && v.max === 1 ? 1 : null;
      push({ kind: 'base', lines: [9], result }, ctx, x);
      return done(result);
    }
    if (v.min !== null && x < v.min) {
      push({ kind: 'min-shortcut', lines: [10], result: v.min }, ctx, x);
      return done(v.min);
    }
    const r = rootOf(v.u);
    const h = Math.floor(x / r);
    const l = x % r;
    const maxLow = v.cluster[h].max;
    if (maxLow !== null && l < maxLow) {
      push({ kind: 'in-cluster', lines: [11, 12] }, ctx, x);
      const offset = /** @type {number} */ (successor(clusterCtx(ctx, h), l));
      const result = h * r + offset;
      visiting = ctx.path;
      push({ kind: 'combine', lines: [12], result }, ctx, x);
      return done(result);
    }
    push({ kind: 'to-summary', lines: [11, 13] }, ctx, x);
    const c = successor(summaryCtx(ctx), h);
    visiting = ctx.path;
    if (c === null) {
      push({ kind: 'no-succ', lines: [14] }, ctx, x);
      return done(null);
    }
    const result = c * r + /** @type {number} */ (v.cluster[c].min);
    push({ kind: 'combine', lines: [15], result }, ctx, x);
    return done(result);
  }

  /** @param {Ctx} ctx @param {number} x */
  function remove(ctx, x) {
    enter(ctx, x, 16);
    const v = ctx.v;
    if (v.min === v.max) {
      v.min = v.max = null;
      push({ kind: 'del-only', lines: [17] }, ctx, x);
      leave(ctx);
      return;
    }
    if (v.u === 2) {
      v.min = v.max = 1 - x;
      push({ kind: 'del-base', lines: [18] }, ctx, x);
      leave(ctx);
      return;
    }
    const r = rootOf(v.u);
    const summary = /** @type {Veb} */ (v.summary);
    if (x === v.min) {
      const c = /** @type {number} */ (summary.min);
      x = c * r + /** @type {number} */ (v.cluster[c].min);
      v.min = x;
      push({ kind: 'del-min', lines: [19, 20] }, ctx, x);
    }
    const h = Math.floor(x / r);
    push({ kind: 'del-into', lines: [21] }, ctx, x);
    remove(clusterCtx(ctx, h), x % r);
    visiting = ctx.path;
    if (v.cluster[h].min === null) {
      push({ kind: 'del-summary', lines: [22, 23] }, ctx, x);
      remove(summaryCtx(ctx), h);
      visiting = ctx.path;
      if (x === v.max) {
        const s = summary.max;
        v.max = s === null ? v.min : s * r + /** @type {number} */ (v.cluster[s].max);
        push({ kind: 'del-max', lines: [24, 25, 26] }, ctx, x);
      }
    } else if (x === v.max) {
      v.max = h * r + /** @type {number} */ (v.cluster[h].max);
      push({ kind: 'del-max', lines: [27] }, ctx, x);
    }
    leave(ctx);
  }

  push({ kind: 'start', lines: [] }, null);
  ops.forEach((o, k) => {
    opIndex = k;
    op = o.type;
    calls = 0;
    depth = 0;
    /** @type {Ctx} */
    const top = { v: root, path: 'V', offset: 0, scale: 1 };
    if (o.type === 'insert') {
      if (members.has(o.value)) push({ kind: 'present', lines: [0] }, top, o.value);
      else {
        members.add(o.value);
        insert(top, o.value);
        push({ kind: 'answer', lines: [] }, top, o.value);
      }
    } else if (o.type === 'delete') {
      if (!members.has(o.value)) push({ kind: 'absent', lines: [16] }, top, o.value);
      else {
        members.delete(o.value);
        remove(top, o.value);
        push({ kind: 'answer', lines: [] }, top, o.value);
      }
    } else {
      answer = successor(top, o.value);
      queries++;
      push({ kind: 'answer', lines: [], result: answer }, top, o.value);
    }
    visiting = '';
  });
  opIndex = -1;
  op = null;
  push({ kind: 'done', lines: [] }, null);
  return frames;
}

/**
 * A ready-made universe and operation log.
 * - `clrs`: the set {2, 3, 4, 5, 7, 14, 15} in u = 16, then successor queries.
 * - `deletes`: deletes that empty a cluster, remove the min and remove the max.
 * - `wide`: the same kind of set in u = 256, one level deeper.
 * @param {VebPreset} preset
 * @param {Universe} [universe]  Used by `random` only.
 * @param {() => number} [rand]
 * @returns {{universe: Universe, ops: VebOp[]}}
 */
export function makeVebOps(preset, universe = 16, rand = Math.random) {
  /** @param {number[]} values @returns {VebOp[]} */
  const inserts = (values) => values.map((value) => ({ type: 'insert', value }));
  /** @param {VebOpType} type @param {number} value @returns {VebOp} */
  const one = (type, value) => ({ type, value });
  if (preset === 'clrs')
    return {
      universe: 16,
      ops: [...inserts([2, 3, 4, 5, 7, 14, 15]), one('successor', 5), one('successor', 7)],
    };
  if (preset === 'deletes')
    return {
      universe: 16,
      ops: [
        ...inserts([2, 3, 4, 5, 7, 14, 15]),
        one('delete', 7),
        one('delete', 2),
        one('delete', 15),
        one('successor', 5),
      ],
    };
  if (preset === 'wide')
    return {
      universe: 256,
      ops: [...inserts([9, 40, 43, 117, 200, 203]), one('successor', 44), one('successor', 120)],
    };
  /** @type {Set<number>} */
  const picked = new Set();
  while (picked.size < 7) picked.add(Math.floor(rand() * universe));
  return {
    universe,
    ops: [...inserts([...picked]), one('successor', Math.floor(rand() * universe))],
  };
}
