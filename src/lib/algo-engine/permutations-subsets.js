/**
 * Generating every permutation, k-combination or subset of a list by backtracking. Items are
 * sorted first, so equal items sit side by side. With `unique` on, a level of the recursion
 * skips an item equal to the one before it (when that earlier copy is free, for permutations),
 * so each distinct arrangement comes out exactly once.
 *
 * Combinations also stop a loop as soon as too few items remain to reach k, so every call they
 * make leads to an output. That is what makes the cost output-sensitive: the work is
 * proportional to what is produced, however many arrangements there are.
 */

/** @typedef {'perm'|'comb'|'subset'} GenMode */

/**
 * @typedef {object} GenNode
 * @property {number} id  Visit order, from 0 at the root.
 * @property {number} parent  Parent id, -1 for the root.
 * @property {string} label  The item picked on the way here; empty at the root.
 * @property {string} path  Everything picked so far, joined.
 * @property {boolean} output  Whether this node produced an output.
 * @property {boolean} open  Whether the call is still running.
 */

/**
 * @typedef {object} GenFrame
 * @property {'start'|'pick'|'emit'|'unpick'|'skip'|'cut'|'done'} kind
 * @property {GenMode} mode
 * @property {boolean} unique
 * @property {string[]} items  The items in sorted order.
 * @property {number} k  The chosen size, for combinations.
 * @property {GenNode[]} nodes  Only the calls made so far.
 * @property {number} current  The node acted on, -1 at the end.
 * @property {number} at  Index of the item acted on, -1 for none.
 * @property {number[]} path  Indices of the items picked now, in order.
 * @property {string[]} outputs  Every arrangement produced so far.
 * @property {number} calls  Calls made so far, the first one included.
 * @property {number} copied  Items copied into outputs so far.
 * @property {number} skipped  Branches skipped as duplicates so far.
 * @property {number[]} lines
 */

export const MAX_ITEMS = { perm: 4, comb: 5, subset: 5 };
const MAX_LABEL = 2;

/** @type {{key: string, mode: GenMode, items: string[], k: number, unique: boolean}[]} */
export const GEN_PRESETS = [
  { key: 'abc', mode: 'perm', items: ['A', 'B', 'C'], k: 2, unique: true },
  { key: 'aab', mode: 'perm', items: ['A', 'A', 'B'], k: 2, unique: true },
  { key: 'five', mode: 'comb', items: ['A', 'B', 'C', 'D', 'E'], k: 3, unique: true },
  { key: 'twins', mode: 'subset', items: ['1', '2', '2'], k: 2, unique: true },
];

/** @type {Record<GenMode, string[]>} */
export const genPseudocode = {
  perm: [
    'permute(path):',
    '  if len(path) == n: output a copy of path; return',
    '  for i = 0 to n-1:',
    '    if used[i]: continue',
    '    if unique and i > 0 and a[i] == a[i-1] and not used[i-1]: continue',
    '    used[i] = true; path.push(a[i])   // pick',
    '    permute(path)',
    '    path.pop(); used[i] = false   // unpick',
  ],
  comb: [
    'combine(start, path):',
    '  if len(path) == k: output a copy of path; return',
    '  for i = start to n-1:',
    '    if n - i < k - len(path): break   // too few left',
    '    if unique and i > start and a[i] == a[i-1]: continue',
    '    path.push(a[i])   // pick',
    '    combine(i + 1, path)',
    '    path.pop()   // unpick',
  ],
  subset: [
    'subsets(start, path):',
    '  output a copy of path',
    '  for i = start to n-1:',
    '    if unique and i > start and a[i] == a[i-1]: continue',
    '    path.push(a[i])   // pick',
    '    subsets(i + 1, path)',
    '    path.pop()   // unpick',
  ],
};

/** Pseudocode line index of each step, per mode. */
const LINE = {
  perm: { call: 0, emit: 1, loop: 2, used: 3, dup: 4, pick: 5, recurse: 6, unpick: 7, cut: -1 },
  comb: { call: 0, emit: 1, loop: 2, used: -1, dup: 4, pick: 5, recurse: 6, unpick: 7, cut: 3 },
  subset: { call: 0, emit: 1, loop: 2, used: -1, dup: 3, pick: 4, recurse: 5, unpick: 6, cut: -1 },
};

/**
 * Reads the items: 1 to `max` short labels, separated by spaces or commas. A run of letters
 * with no separator reads as one item per letter, so `abc` and `a b c` mean the same.
 * @param {string} text
 * @param {number} max
 * @returns {string[]|null}
 */
export function parseItems(text, max) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const items = parts.length === 1 && /^\p{L}+$/u.test(parts[0]) ? [...parts[0]] : parts;
  if (items.length === 0 || items.length > max) return null;
  return items.every((s) => [...s].length <= MAX_LABEL && /^[\p{L}\d]+$/u.test(s)) ? items : null;
}

/**
 * Sorts items so equal ones are adjacent: numbers by value, then the rest in code-point order.
 * @param {string[]} items
 */
export function sortItems(items) {
  const numeric = (/** @type {string} */ s) => /^\d+$/.test(s);
  return items.slice().sort((a, b) => {
    if (numeric(a) && numeric(b)) return Number(a) - Number(b);
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/**
 * Reads k, a whole number from 0 to n.
 * @param {string} text
 * @param {number} n
 * @returns {number|null}
 */
export function parseK(text, n) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const k = Number(t);
  return k > n ? null : k;
}

/** @param {number} n */
export function factorial(n) {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/** @param {number} n @param {number} k */
export function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
}

/**
 * How many arrangements there are if every item counted as different.
 * @param {GenMode} mode @param {number} n @param {number} k
 */
export function plainCount(mode, n, k) {
  if (mode === 'perm') return factorial(n);
  return mode === 'comb' ? choose(n, k) : 2 ** n;
}

/**
 * Runs the generator once and records every step.
 * @param {GenMode} mode
 * @param {string[]} input
 * @param {{k?: number, unique?: boolean}} [options]
 * @returns {GenFrame[]}
 */
export function genTrace(mode, input, { k = 2, unique = true } = {}) {
  const items = sortItems(input);
  const n = items.length;
  const size = mode === 'comb' ? Math.min(k, n) : n;
  const L = LINE[mode];
  /** @type {GenFrame[]} */
  const frames = [];
  /** @type {GenNode[]} */
  const nodes = [{ id: 0, parent: -1, label: '', path: '', output: false, open: true }];
  /** @type {number[]} */
  const path = [];
  /** @type {string[]} */
  const outputs = [];
  const used = new Array(n).fill(false);
  let copied = 0;
  let skipped = 0;

  /** @param {GenFrame['kind']} kind @param {number} current @param {number} at @param {number[]} lines */
  function record(kind, current, at, lines) {
    frames.push({
      kind,
      mode,
      unique,
      items: items.slice(),
      k: size,
      nodes: nodes.map((x) => ({ ...x })),
      current,
      at,
      path: path.slice(),
      outputs: outputs.slice(),
      calls: nodes.length,
      copied,
      skipped,
      lines,
    });
  }

  const text = () => path.map((i) => items[i]).join(' ');

  /** @param {number} id */
  function emit(id) {
    outputs.push(text());
    copied += path.length;
    nodes[id].output = true;
    record('emit', id, -1, [L.emit]);
  }

  /** @param {number} id @param {number} i @param {(child: number) => void} recurse */
  function branch(id, i, recurse) {
    path.push(i);
    const child = nodes.length;
    nodes.push({ id: child, parent: id, label: items[i], path: text(), output: false, open: true });
    record('pick', child, i, mode === 'perm' ? [L.used, L.pick, L.recurse] : [L.pick, L.recurse]);
    recurse(child);
    nodes[child].open = false;
    path.pop();
    record('unpick', id, i, [L.unpick]);
  }

  /** @param {number} id @param {number} i */
  function skip(id, i) {
    skipped++;
    record('skip', id, i, [L.dup]);
  }

  /** @param {number} id */
  function permute(id) {
    if (path.length === n) {
      emit(id);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      if (unique && i > 0 && items[i] === items[i - 1] && !used[i - 1]) {
        skip(id, i);
        continue;
      }
      used[i] = true;
      branch(id, i, permute);
      used[i] = false;
    }
  }

  /** @param {number} id @param {number} start */
  function combine(id, start) {
    if (path.length === size) {
      emit(id);
      return;
    }
    for (let i = start; i < n; i++) {
      if (n - i < size - path.length) {
        record('cut', id, i, [L.cut]);
        break;
      }
      if (unique && i > start && items[i] === items[i - 1]) {
        skip(id, i);
        continue;
      }
      branch(id, i, (child) => combine(child, i + 1));
    }
  }

  /** @param {number} id @param {number} start */
  function subsets(id, start) {
    emit(id);
    for (let i = start; i < n; i++) {
      if (unique && i > start && items[i] === items[i - 1]) {
        skip(id, i);
        continue;
      }
      branch(id, i, (child) => subsets(child, i + 1));
    }
  }

  record('start', 0, -1, [L.call, L.loop]);
  if (mode === 'perm') permute(0);
  else if (mode === 'comb') combine(0, 0);
  else subsets(0, 0);
  nodes[0].open = false;
  record('done', -1, -1, [L.call]);
  return frames;
}
