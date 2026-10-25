/**
 * m increments of a k-bit binary counter that starts at 0, the classic example for amortized
 * analysis. Bit 0 is the lowest bit. One flip (0 → 1 or 1 → 0) costs 1.
 *
 * - Aggregate: bit i flips ⌊t/2ⁱ⌋ times in the first t increments, so the total is
 *   Σ ⌊t/2ⁱ⌋ < 2t.
 * - Accounting: every 0 → 1 flip is charged 2, pays 1 and leaves 1 credit coin on the new 1;
 *   every 1 → 0 flip is paid by the coin on that bit. The bank always equals the number of 1s.
 * - Potential: Φ = number of 1s. An increment that resets r ones and sets one bit costs
 *   r + 1 and changes Φ by 1 − r, so its amortized cost c + ΔΦ is 2. On overflow (all k bits
 *   are 1) it resets k ones, sets nothing and wraps to 0: cost k, ΔΦ = −k, amortized 0.
 */

export const MIN_BITS = 2;
export const MAX_BITS = 8;
export const MAX_OPS = 64;

export const incrementPseudocode = [
  'increment(A):          ▹ A[0] is the lowest bit',
  '  i = 0',
  '  while i < k and A[i] == 1:',
  '    A[i] = 0           ▹ paid by the coin on this 1',
  '    i = i + 1',
  '  if i < k:',
  '    A[i] = 1           ▹ costs 1, leaves 1 coin',
];

/**
 * @typedef {object} CounterFrame
 * @property {'start'|'call'|'reset'|'set'|'overflow'|'done'} kind
 * @property {number} k  Number of bits.
 * @property {number} m  Increments in the whole run.
 * @property {number[]} bits  bits[i] is bit i (0 = lowest).
 * @property {number} value  The counter value the bits spell.
 * @property {number} op  The increment running now (1-based), 0 before the first.
 * @property {number} i  The bit just touched, -1 when none.
 * @property {number} opCost  Flips so far in the current increment.
 * @property {number[]} costs  Actual cost of increments 1..op (the last one may be running).
 * @property {number[]} amortized  c + ΔΦ of every finished increment.
 * @property {number[]} potentials  Φ after increments 0..op (Φ₀ = 0; the last one is live).
 * @property {number} phi  Φ now: the number of 1 bits, which is also the coins in the bank.
 * @property {number} phiBefore  Φ when the current increment began.
 * @property {number} total  Flips in the whole run so far.
 * @property {number} charged  Credits charged so far: 2 per finished increment that set a bit.
 * @property {number[]} flips  flips[i] counts how often bit i has flipped.
 * @property {number[]} lines
 */

/** Ones in a bit array. @param {number[]} bits */
const ones = (bits) => bits.reduce((s, b) => s + b, 0);

/** The value of a little-endian bit array. @param {number[]} bits */
const valueOf = (bits) => bits.reduce((s, b, i) => s + b * 2 ** i, 0);

/** Aggregate bound: total flips of t increments on a k-bit counter. @param {number} t @param {number} k */
export function aggregateFlips(t, k) {
  let s = 0;
  for (let i = 0; i < k; i++) s += Math.floor(t / 2 ** i);
  return s;
}

/**
 * @param {number} k  MIN_BITS ≤ k ≤ MAX_BITS.
 * @param {number} m  1 ≤ m ≤ MAX_OPS.
 * @returns {CounterFrame[]}
 */
export function counterTrace(k, m) {
  /** @type {CounterFrame[]} */
  const frames = [];
  const bits = Array.from({ length: k }, () => 0);
  const flips = Array.from({ length: k }, () => 0);
  /** @type {number[]} */
  const costs = [];
  /** @type {number[]} */
  const amortized = [];
  const potentials = [0];
  let op = 0;
  let i = -1;
  let total = 0;
  let charged = 0;
  let phiBefore = 0;

  /** @param {CounterFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      k,
      m,
      bits: bits.slice(),
      value: valueOf(bits),
      op,
      i,
      opCost: op > 0 ? costs[op - 1] : 0,
      costs: costs.slice(),
      amortized: amortized.slice(),
      potentials: potentials.slice(),
      phi: ones(bits),
      phiBefore,
      total,
      charged,
      flips: flips.slice(),
      lines: lines.slice(),
    });
  }

  /** @param {number} b @param {number} to */
  function flip(b, to) {
    bits[b] = to;
    flips[b]++;
    costs[op - 1]++;
    total++;
    potentials[op] = ones(bits);
  }

  push('start', [0]);
  for (op = 1; op <= m; op++) {
    phiBefore = ones(bits);
    costs.push(0);
    potentials.push(phiBefore);
    i = 0;
    push('call', [0, 1]);
    while (i < k && bits[i] === 1) {
      flip(i, 0);
      push('reset', [2, 3, 4]);
      i++;
    }
    if (i < k) {
      flip(i, 1);
      charged += 2;
      amortized.push(costs[op - 1] + ones(bits) - phiBefore);
      push('set', [2, 5, 6]);
    } else {
      i = -1;
      amortized.push(costs[op - 1] + ones(bits) - phiBefore);
      push('overflow', [2, 5]);
    }
  }
  op = m;
  i = -1;
  push('done', frames[frames.length - 1].lines);
  return frames;
}
