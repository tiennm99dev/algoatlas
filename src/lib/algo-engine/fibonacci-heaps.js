/**
 * Step trace for two mergeable min-heaps built from heap-ordered trees: a Fibonacci heap and
 * a binomial heap. Both keep a root list of trees and run the same consolidation after
 * extract-min (link two roots of equal degree, the larger key under the smaller, until every
 * degree appears once). They differ in when they do the work:
 *
 * - Fibonacci: insert only adds a one-node tree to the root list (lazy); decrease-key cuts the
 *   node out to the root list and cascades the cut through marked ancestors.
 * - Binomial: insert links equal-degree trees at once, like a binary counter carrying;
 *   decrease-key sifts the item up inside its tree.
 *
 * Items get ids in insertion order (the k-th insert is item k). Ties between equal keys are
 * broken by id, so both variants hold and remove exactly the same items.
 */

/**
 * @typedef {'fibonacci'|'binomial'} HeapVariant
 * @typedef {{type: 'insert', value: number} | {type: 'extract'} | {type: 'decrease', id: number, value: number}} FibOp
 * @typedef {'lazy'|'cascade'|'counter'|'random'} FibPreset
 */

/**
 * A tree of the root list as plain data: the item id, its key, whether it is marked (lost a
 * child since it was last linked; Fibonacci only) and its children, oldest link first.
 * @typedef {object} FibTree
 * @property {number} id
 * @property {number} key
 * @property {boolean} mark
 * @property {FibTree[]} children
 */

/**
 * @typedef {object} FibFrame
 * @property {'start'|'insert'|'carry'|'carry-link'|'placed'|'empty'|'extract'|'promote'|'scan'|'link'|'slot'|'rebuild'|'decrease'|'cut'|'mark'|'cascade'|'sift'|'settled'|'done'} kind
 * @property {HeapVariant} variant
 * @property {FibTree[]} trees  The root list, left to right.
 * @property {number | null} minId  The item the min pointer names; null while consolidating.
 * @property {(number | null)[]} table  The degree table A during consolidation: A[d] is the id
 *   of the root of degree d seen so far. Empty outside consolidation.
 * @property {number} opIndex  The operation this step belongs to; -1 on start and done.
 * @property {number} node  The item acted on; -1 when none.
 * @property {number} other  The second item (parent, the tree it meets, the tree linked under); -1 when none.
 * @property {number} degree  The degree in play on scan, link and slot steps; -1 otherwise.
 * @property {number | null} value  The key inserted, removed or set by the current operation.
 * @property {number} [old]  On a decrease: the key before.
 * @property {number[]} out  Keys removed so far, in order.
 * @property {number} links  Running total of links (one tree hung under another root).
 * @property {number} cuts  Running total of cuts (a subtree moved to the root list).
 * @property {number} siftSwaps  Running total of swaps by a binomial decrease-key.
 * @property {number[]} lines
 */

export const MAX_SIZE = 15;
export const MAX_OPS = 24;
export const MIN_VALUE = 0;
export const MAX_VALUE = 99;

export const fibonacciPseudocode = [
  'insert(x):',
  '  thêm cây một nút x vào danh sách gốc; cập nhật min',
  'extractMin():',
  '  z = min; đưa các con của z lên danh sách gốc; bỏ z',
  '  consolidate():',
  '    for w in roots:',
  '      while A[degree(w)] chứa một gốc y:',
  '        nối gốc lớn hơn trong w, y xuống dưới gốc nhỏ hơn',
  '      A[degree(w)] = w',
  '    danh sách gốc = các gốc trong A; min = gốc nhỏ nhất',
  'decreaseKey(x, k):',
  '  key(x) = k; y = parent(x)',
  '  if y tồn tại and k < key(y):',
  '    cut(x): đưa x lên danh sách gốc, bỏ đánh dấu',
  '    while y có cha:',
  '      if y chưa được đánh dấu: đánh dấu y; stop',
  '      cut(y); y = cha cũ của y    // cắt dây chuyền',
  '  if k < key(min): min = x',
];

export const binomialPseudocode = [
  'insert(x):',
  '  carry = cây một nút x (bậc 0)',
  '  while có gốc t với degree(t) = degree(carry):',
  '    carry = link(t, carry)    // như số nhớ trong phép cộng nhị phân',
  '  thêm carry vào danh sách gốc',
  'extractMin():',
  '  z = gốc nhỏ nhất; đưa các con của z lên danh sách gốc; bỏ z',
  '  consolidate():',
  '    for w in roots:',
  '      while A[degree(w)] chứa một gốc y:',
  '        nối gốc lớn hơn trong w, y xuống dưới gốc nhỏ hơn',
  '      A[degree(w)] = w',
  '    danh sách gốc = các gốc trong A',
  'decreaseKey(x, k):',
  '  key(x) = k',
  '  while x có cha p and k < key(p):',
  '    swap phần tử của x và p; x = p',
];

/** @param {HeapVariant} variant */
export const heapPseudocode = (variant) =>
  variant === 'fibonacci' ? fibonacciPseudocode : binomialPseudocode;

/**
 * Pseudocode line indices of each step, by variant.
 * @type {Record<HeapVariant, Record<string, number[]>>}
 */
const LINES = {
  fibonacci: {
    insert: [0, 1],
    empty: [2],
    extract: [2, 3],
    promote: [3],
    scan: [4, 5],
    link: [6, 7],
    slot: [8],
    rebuild: [9],
    decrease: [10, 11],
    cut: [12, 13],
    mark: [14, 15],
    cascade: [14, 16],
    settled: [17],
    noCut: [12, 17],
  },
  binomial: {
    insert: [0, 1],
    carry: [2],
    carryLink: [3],
    placed: [2, 4],
    empty: [5],
    extract: [5, 6],
    promote: [6],
    scan: [7, 8],
    link: [9, 10],
    slot: [11],
    rebuild: [12],
    decrease: [13, 14],
    sift: [15, 16],
    settled: [15],
  },
};

/**
 * @typedef {object} Node
 * @property {number} id
 * @property {number} key
 * @property {boolean} mark
 * @property {Node | null} parent
 * @property {Node[]} children
 */

/** Heap order: smaller key first, ties by id. @param {Node} a @param {Node} b */
const less = (a, b) => a.key < b.key || (a.key === b.key && a.id < b.id);

/** @param {Node} n @returns {FibTree} */
const plain = (n) => ({ id: n.id, key: n.key, mark: n.mark, children: n.children.map(plain) });

/** @param {Node[]} roots @returns {Node | null} */
function smallest(roots) {
  let best = null;
  for (const r of roots) if (!best || less(r, best)) best = r;
  return best;
}

/** @param {Node[]} roots @param {number} id @returns {Node | null} */
function findNode(roots, id) {
  for (const r of roots) {
    if (r.id === id) return r;
    const hit = findNode(r.children, id);
    if (hit) return hit;
  }
  return null;
}

/**
 * The keys held after `ops`, by item id (an item is gone once extracted). Lets a page check a
 * decrease-key before adding it. Ties are broken by id, as in the trace.
 * @param {FibOp[]} ops
 * @returns {Map<number, number>}
 */
export function liveKeys(ops) {
  /** @type {Map<number, number>} */
  const keys = new Map();
  let next = 0;
  for (const op of ops) {
    if (op.type === 'insert') keys.set(next++, op.value);
    else if (op.type === 'decrease') {
      if (keys.has(op.id) && op.value < /** @type {number} */ (keys.get(op.id)))
        keys.set(op.id, op.value);
    } else if (keys.size > 0) {
      let best = -1;
      for (const [id, key] of keys) {
        const k = /** @type {number} */ (keys.get(best) ?? Infinity);
        if (best < 0 || key < k || (key === k && id < best)) best = id;
      }
      keys.delete(best);
    }
  }
  return keys;
}

/**
 * @param {FibOp[]} ops
 * @param {HeapVariant} [variant]
 * @returns {FibFrame[]}
 */
export function fibonacciHeapTrace(ops, variant = 'fibonacci') {
  const L = LINES[variant];
  /** @type {Node[]} */
  let roots = [];
  /** @type {Node | null} */
  let min = null;
  /** @type {(Node | null)[]} */
  let table = [];
  /** @type {number[]} */
  const out = [];
  /** @type {FibFrame[]} */
  const frames = [];
  let links = 0;
  let cuts = 0;
  let siftSwaps = 0;
  let nextId = 0;
  let opIndex = -1;
  /** @type {number | null} */
  let value = null;

  /** @param {Pick<FibFrame, 'kind'|'lines'> & Partial<FibFrame>} f */
  const push = (f) =>
    frames.push({
      node: -1,
      other: -1,
      degree: -1,
      ...f,
      variant,
      trees: roots.map(plain),
      minId: min ? min.id : null,
      table: table.map((n) => (n ? n.id : null)),
      opIndex,
      value,
      out: out.slice(),
      links,
      cuts,
      siftSwaps,
    });

  /** Hangs y under x; y stops being a root. @param {Node} y @param {Node} x */
  function link(y, x) {
    roots = roots.filter((r) => r !== y);
    y.parent = x;
    y.mark = false;
    x.children.push(y);
    links++;
  }

  /** Moves x out of its parent's children to the end of the root list, unmarked. @param {Node} x */
  function cut(x) {
    const p = /** @type {Node} */ (x.parent);
    p.children = p.children.filter((c) => c !== x);
    x.parent = null;
    x.mark = false;
    roots.push(x);
    cuts++;
  }

  /** Degree order keeps a binomial root list readable as binary digits. */
  const byDegree = () => {
    roots = roots.toSorted((a, b) => a.children.length - b.children.length);
  };

  function consolidate() {
    min = null;
    table = [];
    for (const w of roots.slice()) {
      let x = w;
      let d = x.children.length;
      push({ kind: 'scan', lines: L.scan, node: x.id, degree: d });
      while (table[d]) {
        let y = /** @type {Node} */ (table[d]);
        if (less(y, x)) [x, y] = [y, x];
        table[d] = null;
        link(y, x);
        push({ kind: 'link', lines: L.link, node: x.id, other: y.id, degree: d });
        d++;
      }
      table[d] = x;
      push({ kind: 'slot', lines: L.slot, node: x.id, degree: d });
    }
    roots = /** @type {Node[]} */ (table.filter(Boolean));
    table = [];
    min = smallest(roots);
    push({ kind: 'rebuild', lines: L.rebuild, node: min ? min.id : -1 });
  }

  /** @param {number} key */
  function insert(key) {
    /** @type {Node} */
    const x = { id: nextId++, key, mark: false, parent: null, children: [] };
    if (variant === 'fibonacci') {
      roots.push(x);
      if (!min || less(x, min)) min = x;
      push({ kind: 'insert', lines: L.insert, node: x.id });
      return;
    }
    roots.unshift(x);
    push({ kind: 'insert', lines: L.insert, node: x.id });
    let carry = x;
    for (;;) {
      const c = carry;
      const t = roots.find((r) => r !== c && r.children.length === c.children.length);
      if (!t) break;
      push({
        kind: 'carry',
        lines: L.carry,
        node: carry.id,
        other: t.id,
        degree: c.children.length,
      });
      const [top, under] = less(t, carry) ? [t, carry] : [carry, t];
      link(under, top);
      carry = top;
      byDegree();
      push({
        kind: 'carry-link',
        lines: L.carryLink,
        node: top.id,
        other: under.id,
        degree: top.children.length,
      });
    }
    byDegree();
    min = smallest(roots);
    push({ kind: 'placed', lines: L.placed, node: carry.id, degree: carry.children.length });
  }

  function extract() {
    if (roots.length === 0) {
      value = null;
      push({ kind: 'empty', lines: L.empty });
      return;
    }
    const z = /** @type {Node} */ (variant === 'fibonacci' ? min : smallest(roots));
    min = z;
    value = z.key;
    push({ kind: 'extract', lines: L.extract, node: z.id });
    out.push(z.key);
    const i = roots.indexOf(z);
    for (const c of z.children) {
      c.parent = null;
      c.mark = false;
    }
    roots = [...roots.slice(0, i), ...roots.slice(i + 1), ...z.children];
    z.children = [];
    min = null;
    push({ kind: 'promote', lines: L.promote, node: z.id });
    if (roots.length > 0) consolidate();
  }

  /** @param {number} id @param {number} key */
  function decrease(id, key) {
    const x = findNode(roots, id);
    if (!x || key >= x.key) return;
    const old = x.key;
    x.key = key;
    value = key;
    if (variant === 'binomial') {
      push({ kind: 'decrease', lines: L.decrease, node: x.id, old });
      let at = x;
      while (at.parent && less(at, at.parent)) {
        const p = at.parent;
        [at.id, p.id] = [p.id, at.id];
        [at.key, p.key] = [p.key, at.key];
        siftSwaps++;
        push({ kind: 'sift', lines: L.sift, node: p.id, other: at.id });
        at = p;
      }
      min = smallest(roots);
      push({
        kind: 'settled',
        lines: L.settled,
        node: at.id,
        other: at.parent ? at.parent.id : -1,
      });
      return;
    }
    const y = x.parent;
    push({ kind: 'decrease', lines: L.decrease, node: x.id, other: y ? y.id : -1, old });
    if (y && less(x, y)) {
      cut(x);
      push({ kind: 'cut', lines: L.cut, node: x.id, other: y.id });
      let z = y;
      while (z.parent) {
        if (!z.mark) {
          z.mark = true;
          push({ kind: 'mark', lines: L.mark, node: z.id });
          break;
        }
        const p = z.parent;
        cut(z);
        push({ kind: 'cascade', lines: L.cascade, node: z.id, other: p.id });
        z = p;
      }
      if (min && less(x, min)) min = x;
      push({ kind: 'settled', lines: L.settled, node: x.id });
      return;
    }
    if (min && less(x, min)) min = x;
    push({ kind: 'settled', lines: L.noCut, node: x.id });
  }

  push({ kind: 'start', lines: [] });
  ops.forEach((op, k) => {
    opIndex = k;
    value = op.type === 'extract' ? null : op.value;
    if (op.type === 'insert') insert(op.value);
    else if (op.type === 'extract') extract();
    else decrease(op.id, op.value);
  });
  opIndex = -1;
  value = null;
  push({ kind: 'done', lines: [] });
  return frames;
}

/** Number of nodes in a forest. @param {FibTree[]} trees @returns {number} */
export const countNodes = (trees) => trees.reduce((s, t) => s + 1 + countNodes(t.children), 0);

/** Number of marked nodes in a forest. @param {FibTree[]} trees @returns {number} */
export const countMarked = (trees) =>
  trees.reduce((s, t) => s + (t.mark ? 1 : 0) + countMarked(t.children), 0);

/**
 * Every item's key in a forest, by id.
 * @param {FibTree[]} trees
 * @returns {Map<number, number>}
 */
export function keyIndex(trees) {
  /** @type {Map<number, number>} */
  const map = new Map();
  /** @param {FibTree[]} list */
  const walk = (list) =>
    list.forEach((t) => {
      map.set(t.id, t.key);
      walk(t.children);
    });
  walk(trees);
  return map;
}

/**
 * The ids of the marked nodes of a forest.
 * @param {FibTree[]} trees
 * @returns {Set<number>}
 */
export function markedIds(trees) {
  /** @type {Set<number>} */
  const set = new Set();
  /** @param {FibTree[]} list */
  const walk = (list) =>
    list.forEach((t) => {
      if (t.mark) set.add(t.id);
      walk(t.children);
    });
  walk(trees);
  return set;
}

/**
 * The potential Φ = t + 2m of the amortized analysis: t roots and m marked nodes.
 * @param {FibTree[]} trees
 */
export const potential = (trees) => trees.length + 2 * countMarked(trees);

/**
 * A ready-made operation log.
 * - `lazy` inserts nine keys (nine roots, no work) and extracts once: one consolidation
 *   turns the eight left into a single tree.
 * - `cascade` follows with decrease-keys that cut, mark and then cascade a cut.
 * - `counter` inserts eight keys: in a binomial heap the root degrees follow a binary counter.
 * @param {FibPreset} preset
 * @param {() => number} [rand]
 * @returns {FibOp[]}
 */
export function makeFibOps(preset, rand = Math.random) {
  /** @param {number[]} values @returns {FibOp[]} */
  const inserts = (values) => values.map((value) => ({ type: 'insert', value }));
  /** @type {FibOp} */
  const extract = { type: 'extract' };
  const lazy = [...inserts([41, 18, 52, 7, 26, 3, 30, 39, 46]), extract];
  if (preset === 'lazy') return lazy;
  if (preset === 'cascade')
    return [
      ...lazy,
      { type: 'decrease', id: 8, value: 15 },
      { type: 'decrease', id: 6, value: 20 },
      { type: 'decrease', id: 7, value: 2 },
    ];
  if (preset === 'counter') return inserts([5, 9, 2, 14, 8, 11, 6, 20]);
  const values = Array.from({ length: 10 }, () => Math.floor(rand() * (MAX_VALUE + 1)));
  /** @type {FibOp[]} */
  const ops = [...inserts(values), extract];
  for (let t = 0; t < 2; t++) {
    const live = [...liveKeys(ops)].filter(([, key]) => key > 0);
    if (live.length === 0) break;
    const [id, key] = live[Math.floor(rand() * live.length)];
    ops.push({ type: 'decrease', id, value: Math.floor(rand() * key) });
  }
  return ops;
}
