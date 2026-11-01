/**
 * Step traces for 0/1 knapsack and subset sum, whose tables have a capacity dimension: cell
 * (i, c) answers the problem for the first i items and capacity c.
 *
 * - 0/1 knapsack: K[i][c] = most value from items 1..i with total weight at most c. Each item
 *   is skipped, K[i−1][c], or taken once, K[i−1][c − w[i]] + v[i]. A tie keeps the skip.
 * - Subset sum: S[i][c] = true when some of items 1..i weigh exactly c. A cell already true
 *   through the skip stays a skip. The table stores true as 1 and false as 0.
 *
 * Three layouts share one frame shape. 'table' keeps every row, so the walk back can name the
 * items. 'row-down' keeps one row and sweeps c from W down, the correct space saving.
 * 'row-up' keeps one row and sweeps c upwards: dp[c − w] may already hold this item, so an
 * item can be used again, which solves the unbounded problem instead of the 0/1 problem.
 * In the row layouts `table` has one row and the current cell's row is 0.
 */

/** @typedef {'knapsack'|'subset'} KnapProblem */
/** @typedef {'table'|'row-down'|'row-up'} KnapLayout */
/** @typedef {{weight: number, value: number}} KnapItem */
/** @typedef {[number, number]} Cell */

/**
 * @typedef {object} KnapFrame
 * @property {'start'|'base'|'item'|'fill'|'trace'|'done'} kind
 * @property {KnapProblem} problem
 * @property {KnapLayout} layout
 * @property {KnapItem[]} items
 * @property {number} capacity
 * @property {number[][]} table  (n + 1) × (W + 1), or 1 × (W + 1) in a row layout; filled
 *                               cells only, later cells are null in `shown`.
 * @property {(number|null)[][]} shown  The table as drawn: null while not filled.
 * @property {number} i  Current item, 1-based; 0 for none.
 * @property {number} c  Current capacity, -1 for none.
 * @property {boolean} fits  fill: w[i] ≤ c.
 * @property {number} skip  fill: what skipping offers.
 * @property {number|null} take  fill: what taking offers; null when the item does not fit.
 * @property {boolean} took  fill and trace: this cell took the item.
 * @property {boolean} reused  fill, row-up: taking reads a cell that already holds this item.
 * @property {Cell[]} path  Walk back: the cells visited, from the answer cell.
 * @property {number[]} picked  Walk back: the taken items, 1-based and ascending.
 * @property {number} filled  Cells filled or updated so far.
 * @property {number} reuses  Takes so far that used an item again.
 * @property {number|null} result  The answer; for subset sum 1 is yes and 0 is no.
 * @property {number} correct  The true 0/1 answer, known in advance, for comparison.
 * @property {number[]} lines
 */

export const MAX_ITEMS = 6;
export const MAX_WEIGHT = 99;
export const MAX_VALUE = 99;
export const MAX_CAPACITY = 15;

export const KNAP_PRESETS = {
  /** @type {{key: string, items: KnapItem[], capacity: number}[]} */
  knapsack: [
    {
      key: 'small',
      items: [
        { weight: 1, value: 1 },
        { weight: 3, value: 4 },
        { weight: 4, value: 5 },
        { weight: 5, value: 7 },
      ],
      capacity: 7,
    },
    {
      key: 'trap',
      items: [
        { weight: 1, value: 6 },
        { weight: 2, value: 10 },
        { weight: 3, value: 12 },
      ],
      capacity: 5,
    },
    {
      key: 'single',
      items: [{ weight: 2, value: 3 }],
      capacity: 6,
    },
  ],
  /** @type {{key: string, items: KnapItem[], capacity: number}[]} */
  subset: [
    {
      key: 'yes',
      items: [3, 34, 4, 12, 5, 2].map((weight) => ({ weight, value: weight })),
      capacity: 9,
    },
    {
      key: 'even',
      items: [2, 4, 6, 8].map((weight) => ({ weight, value: weight })),
      capacity: 7,
    },
  ],
};

const rowLoop = {
  'row-down': (/** @type {string} */ w) => `    for c = W down to ${w}:`,
  'row-up': (/** @type {string} */ w) => `    for c = ${w} up to W:      // reads this item again`,
};

/** @type {Record<KnapProblem, Record<KnapLayout, string[]>>} */
export const knapPseudocode = {
  knapsack: {
    table: [
      'knapsack(w[1..n], v[1..n], W):',
      '  K[0][c] = 0 for every c            // no items, no value',
      '  for i = 1 to n: for c = 0 to W:',
      '    K[i][c] = K[i-1][c]              // skip item i',
      '    if w[i] ≤ c and K[i-1][c-w[i]] + v[i] > K[i][c]:',
      '      K[i][c] = K[i-1][c-w[i]] + v[i]   // take item i',
      '  walk back from K[n][W]: a change means item i was taken',
    ],
    'row-down': [
      'knapsack(w[1..n], v[1..n], W), one row:',
      '  dp[c] = 0 for every c',
      '  for i = 1 to n:',
      rowLoop['row-down']('w[i]'),
      '      dp[c] = max(dp[c], dp[c-w[i]] + v[i])',
      '  return dp[W]',
    ],
    'row-up': [
      'knapsack(w[1..n], v[1..n], W), one row:',
      '  dp[c] = 0 for every c',
      '  for i = 1 to n:',
      rowLoop['row-up']('w[i]'),
      '      dp[c] = max(dp[c], dp[c-w[i]] + v[i])',
      '  return dp[W]',
    ],
  },
  subset: {
    table: [
      'subsetSum(w[1..n], T):',
      '  S[0][0] = true; S[0][c] = false for c > 0',
      '  for i = 1 to n: for c = 0 to T:',
      '    S[i][c] = S[i-1][c]              // skip item i',
      '    if w[i] ≤ c and not S[i][c] and S[i-1][c-w[i]]:',
      '      S[i][c] = true                 // take item i',
      '  if S[n][T]: walk back to name the items',
    ],
    'row-down': [
      'subsetSum(w[1..n], T), one row:',
      '  dp[0] = true; dp[c] = false for c > 0',
      '  for i = 1 to n:',
      rowLoop['row-down']('w[i]').replace('W', 'T'),
      '      dp[c] = dp[c] or dp[c-w[i]]',
      '  return dp[T]',
    ],
    'row-up': [
      'subsetSum(w[1..n], T), one row:',
      '  dp[0] = true; dp[c] = false for c > 0',
      '  for i = 1 to n:',
      rowLoop['row-up']('w[i]').replace('W', 'T'),
      '      dp[c] = dp[c] or dp[c-w[i]]',
      '  return dp[T]',
    ],
  },
};

/**
 * Reads the item list: `weight:value` pairs for knapsack, plain weights for subset sum.
 * @param {KnapProblem} problem
 * @param {string} text
 * @returns {{items: KnapItem[]} | {error: 'format'|'count'|'range'}}
 */
export function parseItems(problem, text) {
  const parts = text
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > MAX_ITEMS) return { error: 'count' };
  const pattern = problem === 'knapsack' ? /^\d+:\d+$/ : /^\d+$/;
  if (!parts.every((p) => pattern.test(p))) return { error: 'format' };
  const items = parts.map((p) => {
    const [weight, value = weight] = p.split(':').map(Number);
    return { weight, value };
  });
  const bad = items.some(
    (it) => it.weight < 1 || it.weight > MAX_WEIGHT || it.value < 0 || it.value > MAX_VALUE,
  );
  return bad ? { error: 'range' } : { items };
}

/** @param {KnapProblem} problem @param {KnapItem[]} items */
export function formatItems(problem, items) {
  return items
    .map((it) => (problem === 'knapsack' ? `${it.weight}:${it.value}` : String(it.weight)))
    .join(', ');
}

/**
 * Reads the capacity or target, a whole number from 0 to MAX_CAPACITY.
 * @param {string} text
 * @returns {number|null}
 */
export function parseCapacity(text) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n > MAX_CAPACITY ? null : n;
}

/**
 * The value the greedy rule packs: whole items by value per weight, best first, skipping any
 * that no longer fit. Shown beside the table because it can miss the optimum.
 * @param {KnapItem[]} items
 * @param {number} capacity
 */
export function greedyValue(items, capacity) {
  const order = items.slice().sort((x, y) => y.value * x.weight - x.value * y.weight);
  let room = capacity;
  let total = 0;
  for (const it of order)
    if (it.weight <= room) {
      room -= it.weight;
      total += it.value;
    }
  return total;
}

/**
 * How many bits it takes to write W. The table grows with W itself, so one more bit can double
 * it: this is what pseudo-polynomial means.
 * @param {number} capacity
 */
export const capacityBits = (capacity) => Math.max(1, Math.ceil(Math.log2(capacity + 1)));

/** @param {KnapProblem} problem @param {KnapItem[]} items @param {number} capacity */
function trueAnswer(problem, items, capacity) {
  const row = Array(capacity + 1).fill(0);
  if (problem === 'subset') row[0] = 1;
  for (const it of items)
    for (let c = capacity; c >= it.weight; c--)
      row[c] =
        problem === 'subset'
          ? row[c] || row[c - it.weight]
          : Math.max(row[c], row[c - it.weight] + it.value);
  return row[capacity];
}

/**
 * @param {KnapProblem} problem
 * @param {KnapLayout} layout
 * @param {KnapItem[]} items
 * @param {number} capacity
 * @returns {KnapFrame[]}
 */
export function knapTrace(problem, layout, items, capacity) {
  return layout === 'table'
    ? tableTrace(problem, items, capacity)
    : rowTrace(problem, layout, items, capacity);
}

/**
 * @param {KnapProblem} problem
 * @param {KnapLayout} layout
 * @param {KnapItem[]} items
 * @param {number} capacity
 */
function framer(problem, layout, items, capacity) {
  const correct = trueAnswer(problem, items, capacity);
  /** @type {KnapFrame[]} */
  const frames = [];
  /**
   * @param {(number|null)[][]} shown
   * @param {Cell[]} path
   * @param {number[]} picked
   * @param {number} filled
   * @param {number} reuses
   * @param {Pick<KnapFrame, 'kind'|'lines'> & Partial<KnapFrame>} f
   */
  const push = (shown, path, picked, filled, reuses, f) => {
    const rows = shown.map((r) => r.slice());
    frames.push({
      i: 0,
      c: -1,
      fits: false,
      skip: 0,
      take: null,
      took: false,
      reused: false,
      result: null,
      ...f,
      lines: f.lines.slice(),
      problem,
      layout,
      items: items.map((it) => ({ ...it })),
      capacity,
      table: rows.map((r) => r.map((v) => v ?? 0)),
      shown: rows,
      path: path.map((p) => /** @type {Cell} */ ([p[0], p[1]])),
      picked: picked.slice(),
      filled,
      reuses,
      correct,
    });
  };
  return { frames, push };
}

/** @param {KnapProblem} problem @param {KnapItem[]} items @param {number} capacity */
function tableTrace(problem, items, capacity) {
  const n = items.length;
  const subset = problem === 'subset';
  const { frames, push } = framer(problem, 'table', items, capacity);
  /** @type {(number|null)[][]} */
  const table = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(null));
  const took = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(false));
  /** @type {Cell[]} */
  const path = [];
  /** @type {number[]} */
  const picked = [];
  let filled = 0;
  const at = (/** @type {number} */ r, /** @type {number} */ c) =>
    /** @type {number} */ (table[r][c]);
  const emit = (/** @type {Pick<KnapFrame, 'kind'|'lines'> & Partial<KnapFrame>} */ f) =>
    push(table, path, picked, filled, 0, f);

  emit({ kind: 'start', lines: [0] });
  for (let c = 0; c <= capacity; c++) table[0][c] = subset && c === 0 ? 1 : 0;
  filled += capacity + 1;
  emit({ kind: 'base', lines: [1] });

  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1];
    for (let c = 0; c <= capacity; c++) {
      const skip = at(i - 1, c);
      const fits = weight <= c;
      const take = !fits ? null : subset ? at(i - 1, c - weight) : at(i - 1, c - weight) + value;
      const taken = take !== null && take > skip;
      table[i][c] = taken ? take : skip;
      took[i][c] = taken;
      filled++;
      const lines = !fits ? [2, 3] : taken ? [2, 3, 4, 5] : [2, 3, 4];
      emit({ kind: 'fill', lines, i, c, fits, skip, take, took: taken });
    }
  }

  const result = at(n, capacity);
  if (!subset || result === 1) {
    let c = capacity;
    path.push([n, c]);
    for (let i = n; i >= 1; i--) {
      const taken = took[i][c];
      const from = c;
      if (taken) {
        picked.unshift(i);
        c -= items[i - 1].weight;
      }
      path.push([i - 1, c]);
      emit({ kind: 'trace', lines: [6], i, c: from, took: taken });
    }
  }
  emit({ kind: 'done', lines: [6], result });
  return frames;
}

/**
 * @param {KnapProblem} problem
 * @param {'row-down'|'row-up'} layout
 * @param {KnapItem[]} items
 * @param {number} capacity
 */
function rowTrace(problem, layout, items, capacity) {
  const subset = problem === 'subset';
  const { frames, push } = framer(problem, layout, items, capacity);
  const row = Array(capacity + 1).fill(null);
  let filled = 0;
  let reuses = 0;
  const emit = (/** @type {Pick<KnapFrame, 'kind'|'lines'> & Partial<KnapFrame>} */ f) =>
    push([row], [], [], filled, reuses, f);

  emit({ kind: 'start', lines: [0] });
  for (let c = 0; c <= capacity; c++) row[c] = subset && c === 0 ? 1 : 0;
  filled += capacity + 1;
  emit({ kind: 'base', lines: [1] });

  items.forEach(({ weight, value }, index) => {
    const i = index + 1;
    emit({ kind: 'item', lines: weight <= capacity ? [2, 3] : [2], i });
    // How many copies of this item the best answer at each capacity holds, during this pass.
    const copies = Array(capacity + 1).fill(0);
    const sweep = [];
    for (let c = weight; c <= capacity; c++) sweep.push(c);
    if (layout === 'row-down') sweep.reverse();
    for (const c of sweep) {
      const skip = row[c];
      const take = subset ? row[c - weight] : row[c - weight] + value;
      const taken = take > skip;
      const reused = taken && copies[c - weight] > 0;
      if (reused) reuses++;
      if (taken) {
        row[c] = take;
        copies[c] = copies[c - weight] + 1;
      }
      filled++;
      emit({
        kind: 'fill',
        lines: [3, 4],
        i,
        c,
        fits: true,
        skip,
        take,
        took: taken,
        reused,
      });
    }
  });

  emit({ kind: 'done', lines: [5], result: row[capacity] });
  return frames;
}
