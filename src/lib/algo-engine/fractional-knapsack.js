/**
 * Two greedy problems that sort once and then never look back.
 *
 * - Fractional knapsack: items have a value and a weight, and any fraction of an item may be
 *   taken for the same fraction of its value. Taking items by value per weight, highest first,
 *   whole while they fit and a fraction of the first that does not, is optimal. When items cannot
 *   be cut (0/1 knapsack) the same rule can lose, so the module also gives the 0/1 greedy result
 *   and the true 0/1 optimum from a dynamic-programming table.
 * - Job sequencing with deadlines: every job takes one unit slot and earns its profit only if it
 *   ends by its deadline. Taking jobs by profit, highest first, each in the latest free slot at
 *   or before its deadline, is optimal: the sets of jobs that can all meet their deadlines form
 *   a matroid, and greedy by weight is optimal on every matroid.
 *
 * Sorts are stable, so ties keep the typed order.
 */

export const MAX_N = 10;
export const MAX_VALUE = 999;
export const MAX_WEIGHT = 99;
export const MAX_CAPACITY = 200;
export const MAX_DEADLINE = 10;

/**
 * @typedef {object} Item
 * @property {number} value
 * @property {number} weight
 */

/**
 * @typedef {object} Job
 * @property {number} profit
 * @property {number} deadline  Slots are 1..deadline.
 */

/**
 * @typedef {object} KnapFrame
 * @property {'start'|'sort'|'consider'|'take'|'full'|'done'} kind
 * @property {Item[]} items  Typed order; indices below refer to it.
 * @property {number} capacity
 * @property {number[]} order  Scan order (typed order on 'start').
 * @property {number} current  Item scanned now, -1 outside the loop.
 * @property {number[]} taken  Weight units taken from each item.
 * @property {number[]} packed  Items with taken > 0, in the order they went in.
 * @property {number} room  Capacity left.
 * @property {number} total  Value packed so far.
 * @property {number} scanned  Items looked at so far.
 * @property {number[]} lines
 */

/**
 * @typedef {object} JobFrame
 * @property {'start'|'sort'|'consider'|'place'|'skip'|'done'} kind
 * @property {Job[]} jobs  Typed order.
 * @property {number[]} order  Scan order (typed order on 'start').
 * @property {number} current  Job scanned now, -1 outside the loop.
 * @property {number[]} slots  Job index in slot t + 1 (index t), -1 when empty.
 * @property {number[]} probed  On 'consider': slots t (1-based) looked at for this job, latest first.
 * @property {number} slot  On 'place': the slot it got (1-based), -1 otherwise.
 * @property {number[]} skipped  Jobs left out.
 * @property {number} profit
 * @property {number} probes  Slots looked at so far.
 * @property {number[]} lines
 */

export const knapsackPseudocode = [
  'fractionalKnapsack(items, W):',
  '  sort items by value / weight, highest first',
  '  room = W; total = 0',
  '  for each item i in that order:',
  '    if room = 0: stop  // the knapsack is full',
  '    take = min(wᵢ, room)  // all of it, or the fraction that fits',
  '    total = total + vᵢ · take / wᵢ; room = room − take',
  '  return total',
];

export const jobsPseudocode = [
  'jobSequencing(jobs):  // each job takes one time slot',
  '  sort jobs by profit, highest first',
  '  slots 1..max deadline start empty',
  '  for each job j in that order:',
  '    t = the latest empty slot ≤ deadline(j)',
  '    if t exists: put j in slot t; profit = profit + p(j)',
  '    else: skip j  // every slot up to its deadline is taken',
  '  return the slots',
];

/**
 * Reads `a/b` pairs separated by commas or spaces.
 * @param {string} text
 * @returns {[number, number][] | null}
 */
function readPairs(text) {
  const tokens = text.split(/[\s,;]+/).filter(Boolean);
  if (tokens.length === 0 || !tokens.every((t) => /^\d+\/\d+$/.test(t))) return null;
  return tokens.map((t) => /** @type {[number, number]} */ (t.split('/').map(Number)));
}

/**
 * @param {string} text  `value/weight` pairs.
 * @returns {{items: Item[]} | {error: 'format'|'value'|'weight'|'count'}}
 */
export function parseItems(text) {
  const pairs = readPairs(text);
  if (!pairs) return { error: 'format' };
  const items = pairs.map(([value, weight]) => ({ value, weight }));
  if (items.some((it) => it.value < 1 || it.value > MAX_VALUE)) return { error: 'value' };
  if (items.some((it) => it.weight < 1 || it.weight > MAX_WEIGHT)) return { error: 'weight' };
  if (items.length > MAX_N) return { error: 'count' };
  return { items };
}

/**
 * @param {string} text  `profit/deadline` pairs.
 * @returns {{jobs: Job[]} | {error: 'format'|'value'|'deadline'|'count'}}
 */
export function parseJobs(text) {
  const pairs = readPairs(text);
  if (!pairs) return { error: 'format' };
  const jobs = pairs.map(([profit, deadline]) => ({ profit, deadline }));
  if (jobs.some((j) => j.profit < 1 || j.profit > MAX_VALUE)) return { error: 'value' };
  if (jobs.some((j) => j.deadline < 1 || j.deadline > MAX_DEADLINE)) return { error: 'deadline' };
  if (jobs.length > MAX_N) return { error: 'count' };
  return { jobs };
}

/** @param {Item[]} items */
export const formatItems = (items) => items.map((it) => `${it.value}/${it.weight}`).join(', ');

/** @param {Job[]} jobs */
export const formatJobs = (jobs) => jobs.map((j) => `${j.profit}/${j.deadline}`).join(', ');

/** Indices sorted stably by value per weight, highest first. @param {Item[]} items */
export function densityOrder(items) {
  // Cross-multiplying compares v₁/w₁ with v₂/w₂ exactly.
  return items
    .map((_, i) => i)
    .sort((a, b) => items[b].value * items[a].weight - items[a].value * items[b].weight || a - b);
}

/**
 * 0/1 knapsack: the greedy rule by value per weight that skips items which do not fit whole,
 * and the true optimum from a table over capacities 0..W.
 * @param {Item[]} items @param {number} capacity
 */
export function zeroOne(items, capacity) {
  let room = capacity;
  let greedy = 0;
  for (const i of densityOrder(items)) {
    if (items[i].weight <= room) {
      room -= items[i].weight;
      greedy += items[i].value;
    }
  }
  const best = Array(capacity + 1).fill(0);
  for (const it of items) {
    for (let c = capacity; c >= it.weight; c--)
      best[c] = Math.max(best[c], best[c - it.weight] + it.value);
  }
  return { greedy, best: best[capacity] };
}

/**
 * @param {Item[]} input
 * @param {number} capacity
 * @returns {KnapFrame[]}
 */
export function knapsackTrace(input, capacity) {
  const items = input.map((it) => ({ ...it }));
  const order = densityOrder(items);
  /** @type {KnapFrame[]} */
  const frames = [];
  const taken = items.map(() => 0);
  /** @type {number[]} */
  const packed = [];
  let room = capacity;
  let total = 0;
  let scanned = 0;
  let sorted = false;

  /** @param {Pick<KnapFrame, 'kind'|'lines'> & Partial<KnapFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      ...f,
      items: items.map((it) => ({ ...it })),
      capacity,
      order: sorted ? order.slice() : items.map((_, i) => i),
      taken: taken.slice(),
      packed: packed.slice(),
      room,
      total,
      scanned,
    });

  push({ kind: 'start', lines: [0] });
  sorted = true;
  push({ kind: 'sort', lines: [1, 2] });
  for (const i of order) {
    scanned++;
    if (room === 0) {
      push({ kind: 'full', lines: [3, 4], current: i });
      break;
    }
    push({ kind: 'consider', lines: [3, 4], current: i });
    const take = Math.min(items[i].weight, room);
    taken[i] = take;
    packed.push(i);
    total += (items[i].value * take) / items[i].weight;
    room -= take;
    push({ kind: 'take', lines: [5, 6], current: i });
  }
  push({ kind: 'done', lines: [7] });
  return frames;
}

/**
 * Most profit by trying every subset: a set is feasible when, sorted by deadline, the k-th job
 * (1-based) has deadline ≥ k.
 * @param {Job[]} jobs
 */
export function bestJobProfit(jobs) {
  let best = 0;
  for (let mask = 0; mask < 1 << jobs.length; mask++) {
    const pick = jobs.filter((_, i) => mask & (1 << i)).sort((a, b) => a.deadline - b.deadline);
    if (pick.every((j, k) => j.deadline >= k + 1)) {
      best = Math.max(
        best,
        pick.reduce((s, j) => s + j.profit, 0),
      );
    }
  }
  return best;
}

/**
 * @param {Job[]} input
 * @returns {JobFrame[]}
 */
export function jobsTrace(input) {
  const jobs = input.map((j) => ({ ...j }));
  const order = jobs.map((_, i) => i).sort((a, b) => jobs[b].profit - jobs[a].profit || a - b);
  const maxDeadline = Math.max(0, ...jobs.map((j) => j.deadline));
  /** @type {JobFrame[]} */
  const frames = [];
  const slots = Array(maxDeadline).fill(-1);
  /** @type {number[]} */
  const skipped = [];
  let profit = 0;
  let probes = 0;
  let sorted = false;

  /** @param {Pick<JobFrame, 'kind'|'lines'> & Partial<JobFrame>} f */
  const push = (f) =>
    frames.push({
      current: -1,
      slot: -1,
      ...f,
      probed: (f.probed ?? []).slice(),
      jobs: jobs.map((j) => ({ ...j })),
      order: sorted ? order.slice() : jobs.map((_, i) => i),
      slots: slots.slice(),
      skipped: skipped.slice(),
      profit,
      probes,
    });

  push({ kind: 'start', lines: [0] });
  sorted = true;
  push({ kind: 'sort', lines: [1, 2] });
  for (const j of order) {
    /** @type {number[]} */
    const probed = [];
    let slot = -1;
    for (let t = jobs[j].deadline; t >= 1; t--) {
      probes++;
      probed.push(t);
      if (slots[t - 1] < 0) {
        slot = t;
        break;
      }
    }
    push({ kind: 'consider', lines: [3, 4], current: j, probed });
    if (slot > 0) {
      slots[slot - 1] = j;
      profit += jobs[j].profit;
      push({ kind: 'place', lines: [5], current: j, slot });
    } else {
      skipped.push(j);
      push({ kind: 'skip', lines: [6], current: j });
    }
  }
  push({ kind: 'done', lines: [7] });
  return frames;
}
