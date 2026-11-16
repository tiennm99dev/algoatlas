/**
 * Digit DP: how many whole numbers x with 0 ≤ x ≤ N have digit sum exactly S.
 *
 * Every x is written with as many digits as N, padded with leading zeros, which leave the digit
 * sum unchanged. The digits are filled left to right. After i digits a prefix is either tight,
 * equal to the first i digits of N, so the next digit may not exceed N's digit, or loose,
 * already smaller than N, so any digit 0..9 is allowed. Only one prefix is tight, so the state
 * is the loose count per digit sum, cnt[s], plus the tight prefix's sum t. Sums above S are
 * dropped, since digits never lower a sum; a tight prefix above S dies.
 */

/**
 * @typedef {object} DigitFrame
 * @property {'start'|'init'|'position'|'spread'|'branch'|'stay'|'row'|'done'} kind
 * @property {number} limit  N.
 * @property {number} target  S.
 * @property {number[]} digits  N's digits, most significant first.
 * @property {number} i  The position being filled, 0-based; −1 for none.
 * @property {number} s  spread: the loose sum spread out; branch: the tight sum t.
 * @property {number} from  spread: cnt[s], the prefixes that move on.
 * @property {(number|null)[][]} table  (len + 1) × (S + 1) loose counts; null rows not started.
 * @property {(number|null)[]} tight  The tight sum after each count of digits; null once dead.
 * @property {number} transitions  (prefix, digit) pairs tried so far.
 * @property {number|null} result
 * @property {number[]} lines
 */

export const MAX_LIMIT = 999999;
export const MAX_TARGET = 20;

/** @type {{key: string, limit: number, target: number}[]} */
export const DIGIT_PRESETS = [
  { key: 'small', limit: 345, target: 10 },
  { key: 'round', limit: 1000, target: 5 },
  { key: 'big', limit: 52817, target: 14 },
];

export const digitPseudocode = [
  'count(N, S):                 // x in 0..N with digit sum S',
  '  cnt[s] = 0 for every s;  t = 0   // t: sum of the tight prefix',
  '  for each position i, D = N[i]:',
  '    next[s] = 0 for every s',
  '    for each s, d = 0..9: next[s + d] += cnt[s]   // loose: any digit',
  '    for d = 0..D − 1: next[t + d] += 1          // tight, smaller digit → loose',
  '    t = t + D                                   // tight, same digit → still tight',
  '    cnt = next                     // sums above S are dropped',
  '  return cnt[S] + (t == S ? 1 : 0)',
];

/** Digit sum of x. @param {number} x */
export function digitSum(x) {
  let s = 0;
  for (let v = x; v > 0; v = Math.floor(v / 10)) s += v % 10;
  return s;
}

/**
 * @param {number} limit  N, 0 ≤ N ≤ MAX_LIMIT.
 * @param {number} target  S, 0 ≤ S ≤ MAX_TARGET.
 * @returns {DigitFrame[]}
 */
export function digitTrace(limit, target) {
  const digits = String(limit).split('').map(Number);
  const len = digits.length;
  /** @type {(number|null)[][]} */
  const table = Array.from({ length: len + 1 }, () => Array(target + 1).fill(null));
  /** @type {(number|null)[]} */
  const tight = Array(len + 1).fill(null);
  /** @type {DigitFrame[]} */
  const frames = [];
  let transitions = 0;

  /** @param {Pick<DigitFrame, 'kind'|'lines'> & Partial<DigitFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      s: 0,
      from: 0,
      result: null,
      ...f,
      lines: f.lines.slice(),
      limit,
      target,
      digits: digits.slice(),
      table: table.map((r) => r.slice()),
      tight: tight.slice(),
      transitions,
    });

  push({ kind: 'start', lines: [0] });
  table[0].fill(0);
  tight[0] = 0;
  push({ kind: 'init', lines: [1] });

  for (let i = 0; i < len; i++) {
    const D = digits[i];
    const cnt = /** @type {number[]} */ (table[i]);
    table[i + 1].fill(0);
    const next = /** @type {number[]} */ (table[i + 1]);
    push({ kind: 'position', lines: [2, 3], i });
    for (let s = 0; s <= target; s++) {
      if (!cnt[s]) continue;
      transitions += 10;
      for (let d = 0; d <= 9 && s + d <= target; d++) next[s + d] += cnt[s];
      push({ kind: 'spread', lines: [4], i, s, from: cnt[s] });
    }
    const t = tight[i];
    if (t !== null) {
      transitions += D;
      for (let d = 0; d < D && t + d <= target; d++) next[t + d] += 1;
      if (D > 0) push({ kind: 'branch', lines: [5], i, s: t });
      transitions++;
      tight[i + 1] = t + D <= target ? t + D : null;
      push({ kind: 'stay', lines: [6], i, s: t });
    }
    push({ kind: 'row', lines: [7], i });
  }

  const last = /** @type {number[]} */ (table[len]);
  const result = last[target] + (tight[len] === target ? 1 : 0);
  push({ kind: 'done', lines: [8], i: len, result });
  return frames;
}
