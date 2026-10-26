/**
 * Decision trees of comparison sorts on three items, A, B and C. A comparison sort learns
 * about its input only by asking "is x < y?", so running it on every possible input order
 * traces a binary tree: each inner node is one question, each leaf one output order. The tree
 * is built by replaying the real algorithm with a scripted list of answers; a branch whose
 * answers no input order can give is an impossible leaf. A walk down the tree for one hidden
 * input order is the step trace.
 */

/** @typedef {'insertion'|'selection'} TreeAlgo */

/**
 * @typedef {object} DecisionNode
 * @property {string} id  The answers taken from the root: '' for the root, then 'y' or 'n' per step.
 * @property {'compare'|'leaf'|'impossible'} kind
 * @property {[number, number] | null} pair  On 'compare': the question "is item x < item y?".
 * @property {number[] | null} order  On 'leaf': the items in sorted order, smallest first.
 * @property {number} possible  How many input orders give the answers on the way here.
 * @property {number} depth  Comparisons made to get here.
 * @property {DecisionNode | null} yes
 * @property {DecisionNode | null} no
 */

/**
 * @typedef {object} TreeFrame
 * @property {'start'|'compare'|'done'} kind
 * @property {string} nodeId  The node the walk is at after this step.
 * @property {string[]} path  Ids of every node visited so far, root first.
 * @property {[number, number] | null} pair  On 'compare': the question just asked.
 * @property {boolean | null} answer  On 'compare': whether x < y for the hidden order.
 * @property {number} comparisons  Questions asked so far.
 * @property {number} possible  Input orders still consistent with the answers so far.
 * @property {number[] | null} order  On 'done': the sorted order the leaf names.
 * @property {number[]} lines
 */

export const N_ITEMS = 3;
export const ITEM_NAMES = ['A', 'B', 'C'];
export const MAX_BOUND_N = 20;

export const walkPseudocode = [
  'node = root of the decision tree',
  'while node asks "is x < y?":',
  '  if x < y: node = node.yes',
  '  else: node = node.no',
  'output the leaf’s order  // one per input order',
];

/** Thrown by the scripted comparison when the algorithm asks past the end of the script. */
class NeedAnswer {
  /** @param {[number, number]} pair */
  constructor(pair) {
    this.pair = pair;
  }
}

/**
 * The two sorts, written on item indices with a comparison callback.
 * @type {Record<TreeAlgo, (n: number, less: (x: number, y: number) => boolean) => number[]>}
 */
const SORTS = {
  insertion(n, less) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = 1; i < n; i++) {
      for (let j = i; j > 0 && less(a[j], a[j - 1]); j--) [a[j], a[j - 1]] = [a[j - 1], a[j]];
    }
    return a;
  },
  selection(n, less) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = 0; i < n - 1; i++) {
      let min = i;
      for (let j = i + 1; j < n; j++) if (less(a[j], a[min])) min = j;
      [a[i], a[min]] = [a[min], a[i]];
    }
    return a;
  },
};

/**
 * Every ranking of n items: ranks[item] is the item's place in sorted order.
 * @param {number} n
 * @returns {number[][]}
 */
export function allRankings(n) {
  if (n === 0) return [[]];
  /** @type {number[][]} */
  const out = [];
  for (const rest of allRankings(n - 1)) {
    for (let r = 0; r <= rest.length; r++) {
      out.push([...rest.map((x) => (x >= r ? x + 1 : x)), r]);
    }
  }
  return out;
}

/**
 * Items listed smallest first for a ranking.
 * @param {number[]} ranks
 */
export function orderOf(ranks) {
  return ranks.map((_, item) => item).sort((x, y) => ranks[x] - ranks[y]);
}

/**
 * The ranking that puts the items in this order, smallest first; the inverse of orderOf.
 * @param {number[]} order
 */
export function ranksOf(order) {
  /** @type {number[]} */
  const ranks = [];
  order.forEach((item, place) => (ranks[item] = place));
  return ranks;
}

/**
 * Builds the decision tree of one sort on N_ITEMS items.
 * @param {TreeAlgo} algo
 * @returns {DecisionNode}
 */
export function decisionTree(algo) {
  const rankings = allRankings(N_ITEMS);

  /** @param {boolean[]} answers */
  function replay(answers) {
    /** @type {[number, number][]} */
    const asked = [];
    let k = 0;
    /** @param {number} x @param {number} y */
    const less = (x, y) => {
      if (k === answers.length) throw new NeedAnswer([x, y]);
      asked.push([x, y]);
      return answers[k++];
    };
    try {
      return { order: SORTS[algo](N_ITEMS, less), need: null, asked };
    } catch (e) {
      if (e instanceof NeedAnswer) return { order: null, need: e.pair, asked };
      throw e;
    }
  }

  /** @param {boolean[]} answers @returns {DecisionNode} */
  function build(answers) {
    const run = replay(answers);
    const possible = rankings.filter((r) =>
      run.asked.every(([x, y], k) => r[x] < r[y] === answers[k]),
    ).length;
    const id = answers.map((a) => (a ? 'y' : 'n')).join('');
    const base = {
      id,
      possible,
      depth: answers.length,
      pair: null,
      order: null,
      yes: null,
      no: null,
    };
    if (possible === 0) return { ...base, kind: 'impossible' };
    if (run.order) return { ...base, kind: 'leaf', order: run.order };
    return {
      ...base,
      kind: 'compare',
      pair: run.need,
      yes: build([...answers, true]),
      no: build([...answers, false]),
    };
  }

  return build([]);
}

/**
 * Every node of a tree, in pre-order.
 * @param {DecisionNode} root
 * @returns {DecisionNode[]}
 */
export function treeNodes(root) {
  return [root, ...[root.yes, root.no].flatMap((c) => (c ? treeNodes(c) : []))];
}

/**
 * Leaf counts and the worst-case number of comparisons.
 * @param {DecisionNode} root
 */
export function treeStats(root) {
  const nodes = treeNodes(root);
  const leaves = nodes.filter((d) => d.kind === 'leaf');
  return {
    leaves: leaves.length,
    impossible: nodes.filter((d) => d.kind === 'impossible').length,
    height: Math.max(0, ...leaves.map((d) => d.depth)),
    totalDepth: leaves.reduce((s, d) => s + d.depth, 0),
  };
}

/**
 * Walks the tree for one hidden input order.
 * @param {DecisionNode} root
 * @param {number[]} ranks  ranks[item] is the item's place in the hidden sorted order.
 * @returns {TreeFrame[]}
 */
export function walkTrace(root, ranks) {
  /** @type {TreeFrame[]} */
  const frames = [];
  /** @type {string[]} */
  const path = [root.id];
  let node = root;
  let comparisons = 0;
  frames.push({
    kind: 'start',
    nodeId: root.id,
    path: path.slice(),
    pair: null,
    answer: null,
    comparisons,
    possible: root.possible,
    order: null,
    lines: [0],
  });
  while (node.kind === 'compare') {
    const [x, y] = /** @type {[number, number]} */ (node.pair);
    const answer = ranks[x] < ranks[y];
    comparisons++;
    node = /** @type {DecisionNode} */ (answer ? node.yes : node.no);
    path.push(node.id);
    frames.push({
      kind: 'compare',
      nodeId: node.id,
      path: path.slice(),
      pair: [x, y],
      answer,
      comparisons,
      possible: node.possible,
      order: null,
      lines: answer ? [1, 2] : [1, 3],
    });
  }
  frames.push({
    kind: 'done',
    nodeId: node.id,
    path: path.slice(),
    pair: null,
    answer: null,
    comparisons,
    possible: node.possible,
    order: node.order ? node.order.slice() : null,
    lines: [4],
  });
  return frames;
}

/**
 * The information bound for sorting n distinct items: a binary tree with n! leaves is at
 * least ⌈log₂ n!⌉ deep.
 * @param {number} n
 */
export function lowerBound(n) {
  let factorial = 1n;
  let log2 = 0;
  for (let k = 2; k <= n; k++) {
    factorial *= BigInt(k);
    log2 += Math.log2(k);
  }
  return {
    factorial,
    log2,
    // A rounding hair above an integer must not add a level.
    bound: Math.max(0, Math.ceil(log2 - 1e-9)),
    nLogN: n > 0 ? n * Math.log2(n) : 0,
  };
}
