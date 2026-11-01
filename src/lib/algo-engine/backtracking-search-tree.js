/**
 * Backtracking on the state-space tree of subset sum: find every subset of positive numbers
 * that adds up to a target. Each level of the tree decides one number, the left branch takes
 * it (choose, explore, unchoose) and the right branch leaves it out, so a full tree over n
 * numbers has 2ⁿ⁺¹ − 1 nodes. All numbers are positive, which is what makes both prunes safe:
 * a sum over the target can only grow, and a sum that cannot reach the target even with
 * everything left will never get there.
 */

/** @typedef {'off'|'over'|'both'} PruneMode */
/** @typedef {'active'|'open'|'finished'|'pruned'|'found'|'dead'} TreeStatus */

/**
 * @typedef {object} SearchNode
 * @property {number} id  Visit order, from 0 at the root.
 * @property {number} parent  Parent id, -1 for the root.
 * @property {number} depth  How many numbers have been decided.
 * @property {number} sum  Total of the numbers chosen on the way here.
 * @property {boolean} took  Whether the edge from the parent took the number.
 * @property {TreeStatus} status
 */

/**
 * @typedef {object} SearchFrame
 * @property {'start'|'choose'|'skip'|'undo'|'over'|'short'|'found'|'dead'|'done'} kind
 * @property {PruneMode} mode
 * @property {number[]} values
 * @property {number} target
 * @property {SearchNode[]} nodes  Only the nodes visited so far: the tree grows as it runs.
 * @property {number} current  The node acted on, -1 at the end.
 * @property {number} depth  Index of the number being decided.
 * @property {number} sum  Total of the current choices.
 * @property {number} rest  Total of the numbers not decided yet.
 * @property {number[]} chosen  Indices of the numbers currently chosen.
 * @property {number[][]} solutions  Every subset found so far, as values.
 * @property {number} visited  Nodes visited so far.
 * @property {number} pruned  Nodes cut off by a prune check so far.
 * @property {number[]} lines
 */

export const MAX_N = 5;
export const MAX_VALUE = 20;
export const MAX_TARGET = 100;

/** @type {{key: string, values: number[], target: number}[]} */
export const SEARCH_PRESETS = [
  { key: 'two', values: [3, 5, 2, 4], target: 7 },
  { key: 'big', values: [8, 7, 6, 5, 4], target: 9 },
  { key: 'all', values: [1, 2, 3, 4, 5], target: 15 },
  { key: 'none', values: [2, 4, 6, 8], target: 5 },
];

const LINES = /** @type {const} */ ([
  ['call', 'search(i, sum):'],
  ['over', '  if sum > target: return   // prune: too big'],
  ['short', '  if sum + rest[i] < target: return   // prune: too small'],
  ['leaf', '  if i == n:'],
  ['record', '    if sum == target: record chosen'],
  ['back', '    return'],
  ['choose', '  chosen.push(a[i])   // choose'],
  ['exploreTake', '  search(i + 1, sum + a[i])   // explore'],
  ['undo', '  chosen.pop()   // unchoose'],
  ['exploreSkip', '  search(i + 1, sum)   // explore without a[i]'],
]);

/** @typedef {typeof LINES[number][0]} LineKey */

/** @param {PruneMode} mode */
const keysOf = (mode) =>
  LINES.filter(
    ([key]) => !(key === 'over' && mode === 'off') && !(key === 'short' && mode !== 'both'),
  );

/** @type {Record<PruneMode, string[]>} */
export const searchPseudocode = {
  off: keysOf('off').map(([, text]) => text),
  over: keysOf('over').map(([, text]) => text),
  both: keysOf('both').map(([, text]) => text),
};

/**
 * Reads the numbers: positive whole numbers up to MAX_VALUE, separated by commas or spaces.
 * @param {string} text
 * @returns {number[]|null}
 */
export function parseValues(text) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_N) return null;
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  const values = parts.map(Number);
  return values.every((v) => v >= 1 && v <= MAX_VALUE) ? values : null;
}

/**
 * Reads the target, a whole number from 1 to MAX_TARGET.
 * @param {string} text
 * @returns {number|null}
 */
export function parseTarget(text) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n < 1 || n > MAX_TARGET ? null : n;
}

/**
 * Nodes in the full tree with no pruning.
 * @param {number} n
 */
export const fullTreeSize = (n) => 2 ** (n + 1) - 1;

/**
 * Runs the search once and records every step.
 * @param {number[]} values
 * @param {number} target
 * @param {PruneMode} [mode]
 * @returns {SearchFrame[]}
 */
export function searchTrace(values, target, mode = 'both') {
  const n = values.length;
  const rest = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) rest[i] = rest[i + 1] + values[i];
  const keys = keysOf(mode).map(([key]) => key);
  /** @param {LineKey[]} names */
  const linesOf = (names) => names.map((name) => keys.indexOf(name));

  /** @type {SearchFrame[]} */
  const frames = [];
  /** @type {SearchNode[]} */
  const nodes = [{ id: 0, parent: -1, depth: 0, sum: 0, took: false, status: 'active' }];
  /** @type {number[]} */
  const chosen = [];
  /** @type {number[][]} */
  const solutions = [];
  let pruned = 0;

  /**
   * @param {SearchFrame['kind']} kind @param {number} current @param {number} depth
   * @param {number} sum @param {LineKey[]} names
   */
  function record(kind, current, depth, sum, names) {
    frames.push({
      kind,
      mode,
      values: values.slice(),
      target,
      nodes: nodes.map((x) => ({ ...x })),
      current,
      depth,
      sum,
      rest: rest[Math.min(depth, n)],
      chosen: chosen.slice(),
      solutions: solutions.map((s) => s.slice()),
      visited: nodes.length,
      pruned,
      lines: linesOf(names),
    });
  }

  /** @param {number} parent @param {number} depth @param {number} sum @param {boolean} took */
  function addNode(parent, depth, sum, took) {
    const id = nodes.length;
    nodes[parent].status = 'open';
    nodes.push({ id, parent, depth, sum, took, status: 'active' });
    return id;
  }

  /** @param {number} id @param {number} i @param {number} sum */
  function search(id, i, sum) {
    if (mode !== 'off' && sum > target) {
      pruned++;
      nodes[id].status = 'pruned';
      record('over', id, i, sum, ['over']);
      return;
    }
    if (mode === 'both' && sum + rest[i] < target) {
      pruned++;
      nodes[id].status = 'pruned';
      record('short', id, i, sum, ['short']);
      return;
    }
    if (i === n) {
      if (sum === target) {
        solutions.push(chosen.map((at) => values[at]));
        nodes[id].status = 'found';
        record('found', id, i, sum, ['leaf', 'record', 'back']);
      } else {
        nodes[id].status = 'dead';
        record('dead', id, i, sum, ['record', 'back']);
      }
      return;
    }
    chosen.push(i);
    const take = addNode(id, i + 1, sum + values[i], true);
    record('choose', take, i, sum + values[i], ['choose', 'exploreTake']);
    search(take, i + 1, sum + values[i]);
    chosen.pop();
    nodes[id].status = 'active';
    record('undo', id, i, sum, ['undo']);
    const skip = addNode(id, i + 1, sum, false);
    record('skip', skip, i, sum, ['exploreSkip']);
    search(skip, i + 1, sum);
    nodes[id].status = 'finished';
  }

  record('start', 0, 0, 0, ['call']);
  search(0, 0, 0);
  nodes.forEach((x) => {
    if (x.status === 'open' || x.status === 'active') x.status = 'finished';
  });
  record('done', -1, n, 0, ['call']);
  return frames;
}
