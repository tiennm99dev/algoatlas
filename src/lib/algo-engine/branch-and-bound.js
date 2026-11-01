import { makeHeap } from '$lib/components/item-heap.js';

/**
 * Branch and bound for the 0/1 knapsack problem. Items are sorted by value per unit of weight,
 * highest first, with ties in input order. A node decides the items in that order, so it holds
 * a level, a value and a weight. Its bound is the fractional-knapsack value of the rest: add
 * whole items while they fit, then the fitting fraction of the next. No completion of the node
 * can beat that, so a node whose bound is not above the best value found so far is pruned.
 *
 * Every node is a valid packing on its own, since the undecided items can stay out, so each
 * one can improve the best value. The two search orders differ only in which node they take
 * from the frontier: the highest bound (ties to the earliest made), or the most recently added,
 * with the take branch on top so it goes first.
 */

/** @typedef {'best'|'depth'} SearchOrder */
/** @typedef {'frontier'|'active'|'expanded'|'pruned'|'over'} BnbStatus */

/**
 * @typedef {object} BnbItem
 * @property {string} name  A letter in input order.
 * @property {number} weight
 * @property {number} value
 */

/**
 * @typedef {object} BnbNode
 * @property {number} id  Creation order, from 0 at the root.
 * @property {number} parent  Parent id, -1 for the root.
 * @property {number} level  How many items are decided.
 * @property {boolean} took  Whether the edge from the parent took its item.
 * @property {number} value
 * @property {number} weight
 * @property {number} bound  The most any completion can reach; an over-capacity node holds its value.
 * @property {BnbStatus} status
 */

/**
 * @typedef {object} BnbFrame
 * @property {'start'|'pop'|'prunePop'|'over'|'better'|'push'|'pruneChild'|'done'} kind
 * @property {SearchOrder} order
 * @property {BnbItem[]} items  In the order they are decided.
 * @property {number} capacity
 * @property {BnbNode[]} nodes  Only the nodes made so far.
 * @property {number} current  The node acted on, -1 at the end.
 * @property {number[]} frontier  Ids waiting in the frontier, next to be taken first.
 * @property {number} best  The best value found so far.
 * @property {number} bestNode  The node holding it.
 * @property {number} expanded  Nodes whose children were made.
 * @property {number} pruned  Nodes cut off by their bound.
 * @property {number[]} lines
 */

export const MAX_ITEMS = 6;
export const MAX_NUMBER = 99;

/** @type {{key: string, items: [number, number][], capacity: number}[]} */
export const BNB_PRESETS = [
  {
    key: 'classic',
    items: [
      [2, 40],
      [3, 50],
      [5, 100],
      [4, 95],
    ],
    capacity: 8,
  },
  {
    key: 'greedy',
    items: [
      [6, 60],
      [5, 45],
      [5, 45],
    ],
    capacity: 10,
  },
  {
    key: 'order',
    items: [
      [4, 27],
      [12, 64],
      [1, 6],
      [1, 8],
      [5, 31],
      [5, 29],
    ],
    capacity: 14,
  },
];

export const bnbPseudocode = [
  'knapsack(items sorted by value / weight, capacity):',
  '  best = 0; frontier = {root}',
  '  while the frontier is not empty:',
  '    node = take the next node   // highest bound, or the latest',
  '    if bound(node) ≤ best: prune it; continue',
  '    for child in (take the next item, leave it out):',
  '      if child is over capacity: discard it; continue',
  '      if value(child) > best: best = value(child)',
  '      if bound(child) > best: add child to the frontier',
  '      else: prune child',
  '  return best',
];

/**
 * Reads items written as `weight:value`, separated by spaces or commas.
 * @param {string} text
 * @returns {[number, number][]|null}
 */
export function parseItems(text) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_ITEMS) return null;
  /** @type {[number, number][]} */
  const items = [];
  for (const part of parts) {
    const hit = /^(\d+):(\d+)$/.exec(part);
    if (!hit) return null;
    const w = Number(hit[1]);
    const v = Number(hit[2]);
    if (w < 1 || w > MAX_NUMBER || v < 1 || v > MAX_NUMBER) return null;
    items.push([w, v]);
  }
  return items;
}

/**
 * Formats items the way `parseItems` reads them.
 * @param {[number, number][]} items
 */
export const formatItems = (items) => items.map(([w, v]) => `${w}:${v}`).join(' ');

/**
 * Reads the capacity, a whole number from 1 to MAX_NUMBER.
 * @param {string} text
 * @returns {number|null}
 */
export function parseCapacity(text) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n < 1 || n > MAX_NUMBER ? null : n;
}

/**
 * Names items A, B, … in input order, then sorts them by value per weight, highest first.
 * @param {[number, number][]} pairs
 * @returns {BnbItem[]}
 */
export function sortItems(pairs) {
  return pairs
    .map(([weight, value], i) => ({ name: String.fromCharCode(65 + i), weight, value, i }))
    .sort((a, b) => b.value * a.weight - a.value * b.weight || a.i - b.i)
    .map(({ name, weight, value }) => ({ name, weight, value }));
}

/**
 * The fractional-knapsack bound of a node: its value, plus whole items from `level` on while
 * they fit, plus the fitting fraction of the first that does not.
 * @param {BnbItem[]} items
 * @param {number} capacity
 * @param {number} level
 * @param {number} value
 * @param {number} weight
 */
export function boundOf(items, capacity, level, value, weight) {
  let total = value;
  let room = capacity - weight;
  for (let i = level; i < items.length; i++) {
    if (items[i].weight <= room) {
      total += items[i].value;
      room -= items[i].weight;
    } else {
      total += (items[i].value * room) / items[i].weight;
      break;
    }
  }
  return total;
}

/**
 * How many nodes plain backtracking visits with no bound: every packing that fits, partial ones
 * included, plus each over-capacity child it has to look at and throw away.
 * @param {[number, number][]} pairs
 * @param {number} capacity
 */
export function plainNodeCount(pairs, capacity) {
  const items = sortItems(pairs);
  /** @param {number} level @param {number} weight @returns {number} */
  const visit = (level, weight) => {
    if (weight > capacity) return 1;
    if (level === items.length) return 1;
    return 1 + visit(level + 1, weight + items[level].weight) + visit(level + 1, weight);
  };
  return visit(0, 0);
}

/**
 * Runs the search once and records every step.
 * @param {[number, number][]} pairs  [weight, value] for each item.
 * @param {number} capacity
 * @param {SearchOrder} [order]
 * @returns {BnbFrame[]}
 */
export function bnbTrace(pairs, capacity, order = 'best') {
  const items = sortItems(pairs);
  /** @type {BnbNode[]} */
  const nodes = [
    {
      id: 0,
      parent: -1,
      level: 0,
      took: false,
      value: 0,
      weight: 0,
      bound: boundOf(items, capacity, 0, 0, 0),
      status: 'frontier',
    },
  ];
  /** Best-first order: higher bound first, then the node made earliest. */
  const heap = makeHeap(
    /** @type {(a: number, b: number) => boolean} */ (
      (a, b) => nodes[a].bound > nodes[b].bound || (nodes[a].bound === nodes[b].bound && a < b)
    ),
  );
  /** @type {number[]} */
  const stack = [];
  const size = () => (order === 'best' ? heap.a.length : stack.length);

  /**
   * Adds a node. On the stack, a parent's later child goes under its earlier one, so the take
   * branch comes off first.
   * @param {number} id @param {number} base  The stack height before the parent's children.
   */
  function add(id, base) {
    if (order === 'best') heap.push(id);
    else stack.splice(base, 0, id);
  }
  const take = () =>
    order === 'best' ? /** @type {number} */ (heap.pop()) : /** @type {number} */ (stack.pop());

  /** Ids in the order they would come out, leaving the frontier as it is. */
  function waiting() {
    if (order === 'depth') return stack.slice().reverse();
    return heap.a.slice().sort((a, b) => nodes[b].bound - nodes[a].bound || a - b);
  }

  let best = 0;
  let bestNode = 0;
  let expanded = 0;
  let pruned = 0;
  /** @type {BnbFrame[]} */
  const frames = [];

  /** @param {BnbFrame['kind']} kind @param {number} current @param {number[]} lines */
  function record(kind, current, lines) {
    frames.push({
      kind,
      order,
      items: items.map((x) => ({ ...x })),
      capacity,
      nodes: nodes.map((x) => ({ ...x })),
      current,
      frontier: waiting(),
      best,
      bestNode,
      expanded,
      pruned,
      lines,
    });
  }

  /** @param {number} parent @param {boolean} took @returns {number} */
  function makeChild(parent, took) {
    const p = nodes[parent];
    const item = items[p.level];
    const value = p.value + (took ? item.value : 0);
    const weight = p.weight + (took ? item.weight : 0);
    const over = weight > capacity;
    const id = nodes.length;
    nodes.push({
      id,
      parent,
      level: p.level + 1,
      took,
      value,
      weight,
      bound: over ? value : boundOf(items, capacity, p.level + 1, value, weight),
      status: over ? 'over' : 'active',
    });
    return id;
  }

  add(0, 0);
  record('start', 0, [0, 1]);
  while (size() > 0) {
    const id = take();
    const node = nodes[id];
    if (node.bound <= best) {
      node.status = 'pruned';
      pruned++;
      record('prunePop', id, [2, 3, 4]);
      continue;
    }
    node.status = 'active';
    expanded++;
    record('pop', id, [2, 3]);
    const base = stack.length;
    for (const took of [true, false]) {
      const child = makeChild(id, took);
      if (nodes[child].status === 'over') {
        record('over', child, [5, 6]);
        continue;
      }
      if (nodes[child].value > best) {
        best = nodes[child].value;
        bestNode = child;
        record('better', child, [5, 7]);
      }
      if (nodes[child].bound > best) {
        nodes[child].status = 'frontier';
        add(child, base);
        record('push', child, [8]);
      } else {
        nodes[child].status = 'pruned';
        pruned++;
        record('pruneChild', child, [9]);
      }
    }
    node.status = 'expanded';
  }
  record('done', -1, [10]);
  return frames;
}
