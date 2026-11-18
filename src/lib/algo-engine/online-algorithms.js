/**
 * Two online problems, where each decision is made before the rest of the input is known, and
 * the algorithm is judged by its competitive ratio: its cost divided by the cost of the best
 * offline solution, which sees the whole input in advance, in the worst case.
 *
 * Ski rental: renting costs 1 per day and buying costs b once; the season ends on a day no one
 * announces. A plan is "rent until day k − 1, buy on day k" (k = 0: never buy). The offline
 * optimum pays min(d, b) for a season of d days.
 *
 * Paging: a cache holds k pages; a request for a page not in the cache is a fault, and the page
 * must be loaded, evicting another one when the cache is full. LRU evicts the least recently
 * used page and FIFO the one loaded earliest; OPT (Belady’s rule) evicts the page needed
 * furthest in the future, which needs the whole sequence and makes the fewest faults.
 */

/**
 * @typedef {'rent'|'buy'|'own'} SkiAction
 * @typedef {'lru'|'fifo'|'opt'} Policy
 */

/**
 * @typedef {object} SkiFrame
 * @property {'start'|'day'|'done'} kind
 * @property {number} day  Days so far.
 * @property {SkiAction[]} actions  What was done on each day so far.
 * @property {number} cost  What the plan has paid so far.
 * @property {number} opt  min(day, b): the offline optimum if the season ended today.
 * @property {boolean} over  Whether the season has ended (done frame only).
 * @property {number[]} lines
 */

/**
 * @typedef {object} PolicyState
 * @property {(string | null)[]} slots  The page in each cache slot, or null.
 * @property {boolean} hit
 * @property {number} slot  The slot hit or loaded in this step, or -1.
 * @property {string | null} evicted
 * @property {number} faults  Faults so far.
 */

/**
 * @typedef {object} PagingFrame
 * @property {'start'|'request'|'done'} kind
 * @property {number} t  Index of the request served now, or -1.
 * @property {Record<Policy, PolicyState>} policies
 * @property {number[]} lines
 */

export const MAX_DAYS = 30;
export const MAX_BUY = 15;
export const MAX_REQUESTS = 30;
export const MAX_K = 5;
export const POLICIES = /** @type {Policy[]} */ (['lru', 'fifo', 'opt']);

export const skiPseudocode = [
  'for t = 1, 2, … tới khi mùa kết thúc (không biết trước):',
  '  if đã có ván: trượt miễn phí',
  '  else if t = k: mua ván, trả b',
  '  else: thuê, trả 1',
  'ratio = chi phí của bạn / min(số ngày, b)   ▹ OPT biết trước độ dài mùa',
];

export const pagingPseudocode = [
  'for p in requests:',
  '  if p in cache: trúng',
  '  else: lỗi trang',
  '    if cache đầy: đẩy một trang ra',
  '      LRU: lâu chưa dùng nhất · FIFO: nạp sớm nhất · OPT: lâu nữa mới cần',
  '    nạp p vào ô trống',
];

/**
 * What a plan pays for a season of d days.
 * @param {number} b @param {number} k  Buy on day k; 0 never buys. @param {number} d
 */
export function skiCost(b, k, d) {
  if (k === 0 || k > d) return d;
  return k - 1 + b;
}

/**
 * The plan’s ratio cost / OPT for each season length 1 … maxD.
 * @param {number} b @param {number} k @param {number} [maxD]
 */
export const ratioCurve = (b, k, maxD = MAX_DAYS) =>
  Array.from({ length: maxD }, (_, i) => skiCost(b, k, i + 1) / Math.min(i + 1, b));

/**
 * The worst ratio of buying on day k over every season length: (k − 1 + b) / min(k, b), when
 * the season ends right after the purchase. Never buying has no bound (Infinity).
 * @param {number} b @param {number} k
 */
export const competitiveRatio = (b, k) => (k === 0 ? Infinity : (k - 1 + b) / Math.min(k, b));

/**
 * The trace of a plan over the first `days` days of a season.
 * @param {number} b  Price of the skis.
 * @param {number} k  Buy on day k; 0 never buys.
 * @param {number} days  Days to run.
 * @param {boolean} over  Whether the season ends after these days.
 * @returns {SkiFrame[]}
 */
export function skiTrace(b, k, days, over) {
  /** @type {SkiAction[]} */
  const actions = [];
  let cost = 0;
  /** @type {SkiFrame[]} */
  const frames = [{ kind: 'start', day: 0, actions: [], cost: 0, opt: 0, over: false, lines: [0] }];
  for (let t = 1; t <= days; t++) {
    /** @type {SkiAction} */
    let action = 'rent';
    if (k !== 0 && t > k) action = 'own';
    else if (t === k) action = 'buy';
    cost += action === 'buy' ? b : action === 'rent' ? 1 : 0;
    actions.push(action);
    frames.push({
      kind: 'day',
      day: t,
      actions: actions.slice(),
      cost,
      opt: Math.min(t, b),
      over: false,
      lines: action === 'own' ? [0, 1] : action === 'buy' ? [0, 2] : [0, 3],
    });
  }
  frames.push({
    kind: 'done',
    day: days,
    actions: actions.slice(),
    cost,
    opt: Math.min(days, b),
    over,
    lines: [4],
  });
  return frames;
}

/**
 * Serves the requests with LRU, FIFO and OPT side by side, all starting empty.
 * @param {string[]} requests
 * @param {number} k  Cache size in pages.
 * @returns {PagingFrame[]}
 */
export function pagingTrace(requests, k) {
  /** @type {Record<Policy, {slots: (string | null)[], stamp: number[], faults: number}>} */
  const caches = {
    lru: { slots: Array(k).fill(null), stamp: Array(k).fill(0), faults: 0 },
    fifo: { slots: Array(k).fill(null), stamp: Array(k).fill(0), faults: 0 },
    opt: { slots: Array(k).fill(null), stamp: Array(k).fill(0), faults: 0 },
  };
  /** @param {number} from @param {string | null} page */
  const nextUse = (from, page) => {
    const i = requests.indexOf(/** @type {string} */ (page), from);
    return i < 0 ? Infinity : i;
  };
  /** @param {Record<Policy, PolicyState>} p @returns {Record<Policy, PolicyState>} */
  const copy = (p) =>
    /** @type {Record<Policy, PolicyState>} */ (
      Object.fromEntries(POLICIES.map((q) => [q, { ...p[q], slots: p[q].slots.slice() }]))
    );
  /** @type {Record<Policy, PolicyState>} */
  const empty = /** @type {Record<Policy, PolicyState>} */ (
    Object.fromEntries(
      POLICIES.map((q) => [
        q,
        { slots: Array(k).fill(null), hit: false, slot: -1, evicted: null, faults: 0 },
      ]),
    )
  );
  /** @type {PagingFrame[]} */
  const frames = [{ kind: 'start', t: -1, policies: copy(empty), lines: [] }];
  let last = empty;
  requests.forEach((page, t) => {
    /** @type {Record<string, PolicyState>} */
    const now = {};
    let evictedAny = false;
    let faultAny = false;
    for (const q of POLICIES) {
      const c = caches[q];
      let slot = c.slots.indexOf(page);
      /** @type {string | null} */
      let evicted = null;
      const hit = slot >= 0;
      if (hit) {
        if (q === 'lru') c.stamp[slot] = t + 1;
      } else {
        c.faults++;
        faultAny = true;
        slot = c.slots.indexOf(null);
        if (slot < 0) {
          evictedAny = true;
          slot = 0;
          for (let s = 1; s < k; s++) {
            const better =
              q === 'opt'
                ? nextUse(t + 1, c.slots[s]) > nextUse(t + 1, c.slots[slot])
                : c.stamp[s] < c.stamp[slot];
            if (better) slot = s;
          }
          evicted = c.slots[slot];
        }
        c.slots[slot] = page;
        c.stamp[slot] = t + 1;
      }
      now[q] = { slots: c.slots.slice(), hit, slot, evicted, faults: c.faults };
    }
    last = /** @type {Record<Policy, PolicyState>} */ (now);
    /** @type {number[]} */
    let lines = [0, 1];
    if (evictedAny) lines = [0, 1, 2, 3, 4, 5];
    else if (faultAny) lines = [0, 1, 2, 5];
    frames.push({ kind: 'request', t, policies: copy(last), lines });
  });
  frames.push({ kind: 'done', t: -1, policies: copy(last), lines: [] });
  return frames;
}

/**
 * A sequence that cycles through k + 1 pages: LRU and FIFO fault on every request.
 * @param {number} k @param {number} length
 */
export const loopRequests = (k, length) =>
  Array.from({ length }, (_, i) => String.fromCharCode(65 + (i % (k + 1))));
