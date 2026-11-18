/**
 * Runs a list of path and distance queries on a valued tree two ways and counts the work.
 *
 * - Naive: a sum or a distance walks the u–v path one node at a time, so it reads every node
 *   on the path; a set writes one value.
 * - Heavy-light decomposition: a sum adds one segment-tree range per chain the path meets, and
 *   costs the segment-tree nodes those range queries visit. A distance climbs chain by chain to
 *   the lowest common ancestor, one step per chain, then reads three depths:
 *   dist(u, v) = depth[u] + depth[v] − 2·depth[lca]. A set updates one segment-tree leaf and
 *   its ancestors, one write each.
 *
 * Both answer every query; the trace shows one frame per operation with both costs.
 */

import { decompose, pathNodes, pathRanges, sumTree } from './heavy-light-core.js';
import { isRootedTree, lettered, randomParents } from './rooted-tree.js';

export const MAX_NODES = 26;
export const MAX_OPS = 12;
export const MAX_VALUE = 9;

/**
 * @typedef {{ type: 'sum' | 'dist', u: number, v: number } | { type: 'set', u: number, x: number }} TreeOp
 */

/**
 * @typedef {object} TreeOpFrame
 * @property {'start'|'sum'|'dist'|'set'|'done'} kind
 * @property {number} op  Index of the operation, −1 on the first and last frames.
 * @property {number[]} values  Node values after this operation.
 * @property {number[]} path  sum, dist: the u–v path, u first.
 * @property {{ from: number, to: number }[]} ranges  sum, dist: the chain ranges, as positions.
 * @property {number} lca  sum, dist: the lowest common ancestor; −1 otherwise.
 * @property {number | null} answer  sum, dist: the result; set: the new value.
 * @property {number} naive  Work of the naive walk on this operation.
 * @property {number} hld  Work of the decomposition on this operation.
 * @property {number} naiveTotal
 * @property {number} hldTotal
 * @property {number[]} lines
 */

export const practicePseudocode = [
  'for op in ops:',
  '  sum u v:  thô: đi dọc đường đi, cộng giá trị   HLD: mỗi chuỗi một đoạn trên segment tree',
  '  dist u v: thô: đi dọc đường đi, đếm cạnh      HLD: leo theo các chuỗi đến lca;',
  '            dist = depth[u] + depth[v] − 2·depth[lca]',
  '  set v x:  thô: a[v] = x                         HLD: cập nhật lá và các tổ tiên của nó',
];

/**
 * Reads operations such as `sum M L, dist K O, set D 0`, separated by commas, semicolons or
 * new lines. Node names are the tree's letters, in either case.
 * @param {string} text @param {string[]} labels
 * @returns {{ ops: TreeOp[] } | { error: 'empty' | 'format' | 'node' | 'value' | 'many' }}
 */
export function parseOps(text, labels) {
  const parts = text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { error: 'empty' };
  if (parts.length > MAX_OPS) return { error: 'many' };
  /** @type {TreeOp[]} */
  const ops = [];
  /** @param {string} s */
  const node = (s) => labels.indexOf(s.toUpperCase());
  for (const part of parts) {
    const [word, a, b, ...rest] = part.split(/\s+/);
    const type = word.toLowerCase();
    if (rest.length > 0 || b === undefined || !['sum', 'dist', 'set'].includes(type))
      return { error: 'format' };
    const u = node(a);
    if (u < 0) return { error: 'node' };
    if (type === 'set') {
      if (!/^\d+$/.test(b) || Number(b) > MAX_VALUE) return { error: 'value' };
      ops.push({ type: 'set', u, x: Number(b) });
    } else {
      const v = node(b);
      if (v < 0) return { error: 'node' };
      ops.push({ type: /** @type {'sum' | 'dist'} */ (type), u, v });
    }
  }
  return { ops };
}

/** @param {TreeOp} op @param {string[]} labels */
export const formatOp = (op, labels) =>
  op.type === 'set' ? `set ${labels[op.u]} ${op.x}` : `${op.type} ${labels[op.u]} ${labels[op.v]}`;

/** @param {TreeOp[]} ops @param {string[]} labels */
export const formatOps = (ops, labels) => ops.map((op) => formatOp(op, labels)).join(', ');

/**
 * @param {import('./heavy-light-decomposition.js').ValuedTree} t @param {TreeOp[]} ops
 * @returns {TreeOpFrame[]}
 */
export function practiceTrace(t, ops) {
  if (!isRootedTree(t) || t.value.length !== t.parent.length) throw new Error('Not a rooted tree');
  const n = t.parent.length;
  const d = decompose(t.parent);
  const values = t.value.slice();
  const base = Array(n).fill(0);
  values.forEach((x, i) => (base[d.pos[i]] = x));
  const seg = sumTree(base);
  let naiveTotal = 0;
  let hldTotal = 0;
  /** @type {TreeOpFrame[]} */
  const frames = [];

  /**
   * @param {TreeOpFrame['kind']} kind @param {number} op @param {number[]} lines
   * @param {Partial<Pick<TreeOpFrame, 'path'|'ranges'|'lca'|'answer'|'naive'|'hld'>>} [extra]
   */
  function push(kind, op, lines, extra = {}) {
    frames.push({
      kind,
      op,
      values: values.slice(),
      path: extra.path?.slice() ?? [],
      ranges: extra.ranges?.map((r) => ({ ...r })) ?? [],
      lca: extra.lca ?? -1,
      answer: extra.answer ?? null,
      naive: extra.naive ?? 0,
      hld: extra.hld ?? 0,
      naiveTotal,
      hldTotal,
      lines: lines.slice(),
    });
  }

  push('start', -1, [0]);
  ops.forEach((op, i) => {
    if (!(op.u >= 0 && op.u < n) || (op.type !== 'set' && !(op.v >= 0 && op.v < n)))
      throw new Error('Operation node out of range');
    if (op.type === 'set') {
      values[op.u] = op.x;
      const hld = seg.set(d.pos[op.u], op.x);
      naiveTotal += 1;
      hldTotal += hld;
      push('set', i, [0, 4], { answer: op.x, naive: 1, hld });
      return;
    }
    const path = pathNodes(t.parent, op.u, op.v);
    const split = pathRanges(d, t.parent, op.u, op.v);
    const lca = split[split.length - 1].head;
    const ranges = split.map((r) => ({ from: r.from, to: r.to }));
    const naive = path.length;
    let hld;
    let answer;
    if (op.type === 'sum') {
      hld = 0;
      answer = 0;
      for (const r of ranges) {
        const q = seg.query(r.from, r.to);
        hld += q.visits;
        answer += q.sum;
      }
    } else {
      // One step per chain, then the three depths.
      hld = split.length + 3;
      answer = d.depth[op.u] + d.depth[op.v] - 2 * d.depth[lca];
    }
    naiveTotal += naive;
    hldTotal += hld;
    push(op.type, i, op.type === 'sum' ? [0, 1] : [0, 2, 3], {
      path,
      ranges,
      lca,
      answer,
      naive,
      hld,
    });
  });
  push('done', -1, []);
  return frames;
}

/** @param {number[]} parent @param {number[]} value */
const valued = (parent, value) => ({ ...lettered(parent), value: value.slice() });

export const PRACTICE_PRESETS = /** @type {const} */ (['sample', 'caterpillar', 'random']);
/** @typedef {typeof PRACTICE_PRESETS[number]} PracticePreset */

/**
 * A tree with a workload worth running on it.
 * @param {PracticePreset} preset @param {() => number} [rand]
 * @returns {{ tree: import('./heavy-light-decomposition.js').ValuedTree, ops: TreeOp[] }}
 */
export function makePracticePreset(preset, rand = Math.random) {
  if (preset === 'sample') {
    const tree = valued(
      [-1, 0, 0, 1, 1, 1, 2, 3, 3, 5, 6, 6, 7, 9, 13],
      [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 2],
    );
    const r = /** @type {{ ops: TreeOp[] }} */ (
      parseOps('sum M L, dist M L, set D 0, sum M L, dist K O', tree.labels)
    );
    return { tree, ops: r.ops };
  }
  if (preset === 'caterpillar') {
    // A spine A–M with one leg hanging from every spine node.
    const parent = [-1];
    for (let i = 1; i < 13; i++) parent.push(i - 1);
    for (let i = 0; i < 13; i++) parent.push(i);
    const tree = valued(
      parent,
      parent.map((_, i) => (i * 7 + 3) % 10),
    );
    const r = /** @type {{ ops: TreeOp[] }} */ (
      parseOps('sum N Z, dist N Z, sum Y Z, set G 9, sum N Z', tree.labels)
    );
    return { tree, ops: r.ops };
  }
  const n = 12 + Math.floor(rand() * (MAX_NODES - 11));
  const parent = randomParents(n, rand);
  const tree = valued(
    parent,
    parent.map(() => Math.floor(rand() * (MAX_VALUE + 1))),
  );
  /** @type {TreeOp[]} */
  const ops = [];
  const pick = () => Math.floor(rand() * n);
  for (let i = 0; i < 6; i++) {
    const roll = rand();
    if (roll < 0.45) ops.push({ type: 'sum', u: pick(), v: pick() });
    else if (roll < 0.8) ops.push({ type: 'dist', u: pick(), v: pick() });
    else ops.push({ type: 'set', u: pick(), x: Math.floor(rand() * (MAX_VALUE + 1)) });
  }
  return { tree, ops };
}
