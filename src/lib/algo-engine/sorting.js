/**
 * Step traces for comparison sorts. Each trace is an array of immutable
 * frames; a visualizer renders one frame at a time, so the algorithm runs
 * once up front and stepping backwards is free.
 */

/** @typedef {{id: number, value: number}} Item */

/**
 * @typedef {object} SortFrame
 * @property {'start'|'pass-start'|'pick'|'compare'|'swap'|'pass'|'place'|'done'} kind
 * @property {Item[]} items     Array state after this step.
 * @property {number[]} focus   Indices highlighted by this step.
 * @property {number[]} sorted  Indices known to be in final position (bubble)
 *                              or inside the sorted prefix (insertion).
 * @property {number[]} lines   Pseudocode lines this step executes.
 * @property {number} comparisons Running total.
 * @property {number} swaps       Running total (moves, for insertion sort).
 * @property {boolean} [swapped]  Compare outcome: whether a swap follows.
 */

/** Bubble sort with the early-exit flag. */
export const bubblePseudocode = [
  'for end = n-1 down to 1:',
  '  swapped = false',
  '  for i = 0 to end-1:',
  '    if a[i] > a[i+1]:',
  '      swap(a[i], a[i+1]); swapped = true',
  '  if not swapped: stop',
  'done — array is sorted',
];

export const insertionPseudocode = [
  'for i = 1 to n-1:',
  '  key = a[i]; j = i - 1',
  '  while j >= 0 and a[j] > key:',
  '    a[j+1] = a[j]; j = j - 1',
  '  a[j+1] = key',
  'done — array is sorted',
];

/** @param {number[]} values @returns {Item[]} */
export function toItems(values) {
  return values.map((value, id) => ({ id, value }));
}

/** @param {number} n @returns {number[]} */
function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * @param {Item[]} input
 * @returns {SortFrame[]}
 */
export function bubbleSortTrace(input) {
  const a = input.slice();
  const n = a.length;
  /** @type {SortFrame[]} */
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  /** @type {number[]} */
  let sorted = [];

  /** @param {Omit<SortFrame, 'items'|'sorted'|'comparisons'|'swaps'>} f */
  const push = (f) => frames.push({ ...f, items: a.slice(), sorted, comparisons, swaps });

  push({ kind: 'start', focus: [], lines: [] });
  for (let end = n - 1; end >= 1; end--) {
    let swapped = false;
    push({ kind: 'pass-start', focus: [end], lines: [0, 1] });
    for (let i = 0; i < end; i++) {
      comparisons++;
      const outOfOrder = a[i].value > a[i + 1].value;
      push({ kind: 'compare', focus: [i, i + 1], lines: [2, 3], swapped: outOfOrder });
      if (outOfOrder) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        swaps++;
        swapped = true;
        push({ kind: 'swap', focus: [i, i + 1], lines: [4] });
      }
    }
    if (!swapped) {
      sorted = range(n);
      push({ kind: 'pass', focus: [], lines: [5] });
      break;
    }
    sorted = [...sorted, end];
    push({ kind: 'pass', focus: [end], lines: [5] });
  }
  sorted = range(n);
  push({ kind: 'done', focus: [], lines: [6] });
  return frames;
}

/**
 * Insertion sort, drawn as the key sinking left one slot per shift — the
 * same memory writes as the textbook shift loop, but the key stays visible.
 * @param {Item[]} input
 * @returns {SortFrame[]}
 */
export function insertionSortTrace(input) {
  const a = input.slice();
  const n = a.length;
  /** @type {SortFrame[]} */
  const frames = [];
  let comparisons = 0;
  let swaps = 0;
  /** @type {number[]} */
  let sorted = n > 0 ? [0] : [];

  /** @param {Omit<SortFrame, 'items'|'sorted'|'comparisons'|'swaps'>} f */
  const push = (f) => frames.push({ ...f, items: a.slice(), sorted, comparisons, swaps });

  push({ kind: 'start', focus: [], lines: [] });
  for (let i = 1; i < n; i++) {
    let j = i - 1;
    push({ kind: 'pick', focus: [i], lines: [0, 1] });
    while (j >= 0) {
      comparisons++;
      const larger = a[j].value > a[j + 1].value;
      push({ kind: 'compare', focus: [j, j + 1], lines: [2], swapped: larger });
      if (!larger) break;
      [a[j], a[j + 1]] = [a[j + 1], a[j]];
      swaps++;
      // The shifted element joins the sorted run; only the key (now at j) is still moving.
      sorted = range(i + 1).filter((k) => k !== j);
      push({ kind: 'swap', focus: [j, j + 1], lines: [3] });
      j--;
    }
    sorted = range(i + 1);
    push({ kind: 'place', focus: [j + 1], lines: [4] });
  }
  sorted = range(n);
  push({ kind: 'done', focus: [], lines: [5] });
  return frames;
}

/**
 * Starting arrangements that expose best and worst cases.
 * @param {'random'|'nearly-sorted'|'reversed'|'few-unique'} preset
 * @param {number} n
 * @param {() => number} [rand] Injectable for deterministic tests.
 * @returns {number[]}
 */
export function makeArray(preset, n, rand = Math.random) {
  const ascending = Array.from({ length: n }, (_, i) => Math.round(((i + 1) / n) * 95) + 5);
  if (n < 2) return ascending;
  switch (preset) {
    case 'reversed':
      return ascending.reverse();
    case 'nearly-sorted': {
      const a = ascending.slice();
      for (let k = 0; k < Math.max(1, Math.floor(n / 8)); k++) {
        const i = Math.floor(rand() * (n - 1));
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
      }
      return a;
    }
    case 'few-unique':
      return Array.from({ length: n }, () => [25, 50, 75, 100][Math.floor(rand() * 4)]);
    default: {
      const a = ascending.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
  }
}
