/**
 * Three ways to count: Pascal's triangle built row by row, one binomial coefficient modulo a
 * prime through Lucas's theorem and factorial tables, and every balanced bracket sequence by
 * backtracking, whose number is the Catalan number.
 */

import { powMod } from './number-theory.js';

export const MAX_ROWS = 15;
export const MAX_CATALAN_N = 5;
export const MAX_LUCAS_N = 1_000_000_000;
export const MAX_PRIME = 1009;

/**
 * Exact C(n, k). The running product is itself a binomial after each division, so it stays whole.
 * Safe for the sizes this lesson shows (n up to 30).
 * @param {number} n
 * @param {number} k
 * @returns {number}
 */
export function binomial(n, k) {
  if (k < 0 || k > n) return 0;
  let out = 1;
  const low = Math.min(k, n - k);
  for (let i = 1; i <= low; i++) out = (out * (n - low + i)) / i;
  return out;
}

/** @param {number} n */
export const catalan = (n) => binomial(2 * n, n) / (n + 1);

export const pascalPseudocode = [
  'for n = 0 to N:',
  '  C[n][0] = C[n][n] = 1',
  '  for k = 1 to n − 1:',
  '    C[n][k] = C[n−1][k−1] + C[n−1][k]',
  'return C',
];

/**
 * @typedef {object} PascalFrame
 * @property {'start'|'edge'|'add'|'done'} kind
 * @property {number} N  The last row asked for.
 * @property {number} n  The row being filled; -1 before and after the run.
 * @property {number} k  The column being filled; -1 when none.
 * @property {(number|null)[][]} table  Row n has n + 1 cells; null is not filled yet.
 * @property {number} additions
 * @property {number} filled
 * @property {number[]} lines
 */

/**
 * @param {number} N  From 0 to MAX_ROWS.
 * @returns {PascalFrame[]}
 */
export function pascalTrace(N) {
  /** @type {(number|null)[][]} */
  const table = Array.from({ length: N + 1 }, (_, r) => Array(r + 1).fill(null));
  /** @type {PascalFrame[]} */
  const frames = [];
  let additions = 0;
  let filled = 0;

  /** @param {PascalFrame['kind']} kind @param {number} n @param {number} k @param {number[]} lines */
  const push = (kind, n, k, lines) =>
    frames.push({
      kind,
      N,
      n,
      k,
      table: table.map((row) => row.slice()),
      additions,
      filled,
      lines,
    });

  push('start', -1, -1, [0]);
  for (let n = 0; n <= N; n++) {
    table[n][0] = 1;
    table[n][n] = 1;
    filled += n === 0 ? 1 : 2;
    push('edge', n, 0, [0, 1]);
    for (let k = 1; k < n; k++) {
      table[n][k] =
        /** @type {number} */ (table[n - 1][k - 1]) + /** @type {number} */ (table[n - 1][k]);
      additions++;
      filled++;
      push('add', n, k, [2, 3]);
    }
  }
  push('done', -1, -1, [4]);
  return frames;
}

/**
 * Factorials and inverse factorials below p: the inverse of the largest comes from Fermat's
 * little theorem, and each smaller one from inv[i − 1] = inv[i] · i.
 * @param {number} p  A prime.
 */
export function factorialTables(p) {
  const fact = [1];
  for (let i = 1; i < p; i++) fact.push((fact[i - 1] * i) % p);
  const inv = Array(p).fill(1);
  inv[p - 1] = powMod(fact[p - 1], p - 2, p);
  for (let i = p - 1; i > 0; i--) inv[i - 1] = (inv[i] * i) % p;
  return { fact, inv };
}

export const lucasPseudocode = [
  'fact[0] = 1; fact[i] = fact[i−1] · i mod p',
  'inv[p−1] = fact[p−1]^(p−2) mod p; inv[i−1] = inv[i] · i mod p',
  'result = 1',
  'while n > 0 or k > 0:',
  '  nᵢ = n mod p, kᵢ = k mod p',
  '  if kᵢ > nᵢ: return 0',
  '  result = result · fact[nᵢ] · inv[kᵢ] · inv[nᵢ−kᵢ] mod p',
  '  n = ⌊n / p⌋, k = ⌊k / p⌋',
  'return result',
];

/**
 * @typedef {object} LucasRow
 * @property {number} pos  Digit position in base p, from the lowest.
 * @property {number} ni
 * @property {number} ki
 * @property {number|null} term  C(nᵢ, kᵢ) mod p; null until it is computed.
 */

/**
 * @typedef {object} LucasFrame
 * @property {'start'|'digit'|'zero'|'multiply'|'done'} kind
 * @property {number} n0
 * @property {number} k0
 * @property {number} p
 * @property {number} n  What is left of n.
 * @property {number} k  What is left of k.
 * @property {number} ni
 * @property {number} ki
 * @property {number} factN  fact[nᵢ], on a multiply frame.
 * @property {number} invK  inv[kᵢ], on a multiply frame.
 * @property {number} invD  inv[nᵢ − kᵢ], on a multiply frame.
 * @property {number} term  C(nᵢ, kᵢ) mod p, on a multiply frame.
 * @property {number} before  The result before a multiply frame.
 * @property {number} result
 * @property {LucasRow[]} rows
 * @property {number} tableSize  Entries in each factorial table: p.
 * @property {number[]} lines
 */

/**
 * @param {number} n0  From 0 to MAX_LUCAS_N.
 * @param {number} k0  From 0 to MAX_LUCAS_N.
 * @param {number} p  A prime up to MAX_PRIME.
 * @returns {LucasFrame[]}
 */
export function lucasTrace(n0, k0, p) {
  const { fact, inv } = factorialTables(p);
  /** @type {LucasRow[]} */
  const rows = [];
  /** @type {LucasFrame[]} */
  const frames = [];
  let [n, k, ni, ki, factN, invK, invD, term, before, result] = [n0, k0, 0, 0, 0, 0, 0, 0, 1, 1];

  /** @param {LucasFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      n0,
      k0,
      p,
      n,
      k,
      ni,
      ki,
      factN,
      invK,
      invD,
      term,
      before,
      result,
      rows: rows.map((row) => ({ ...row })),
      tableSize: p,
      lines,
    });

  push('start', [0, 1, 2]);
  while (n > 0 || k > 0) {
    ni = n % p;
    ki = k % p;
    rows.push({ pos: rows.length, ni, ki, term: null });
    push('digit', [3, 4, 5]);
    if (ki > ni) {
      rows[rows.length - 1].term = 0;
      before = result;
      result = 0;
      push('zero', [5]);
      push('done', [5]);
      return frames;
    }
    factN = fact[ni];
    invK = inv[ki];
    invD = inv[ni - ki];
    term = (((factN * invK) % p) * invD) % p;
    rows[rows.length - 1].term = term;
    before = result;
    result = (result * term) % p;
    n = Math.floor(n / p);
    k = Math.floor(k / p);
    push('multiply', [6, 7]);
  }
  push('done', [8]);
  return frames;
}

export const bracketPseudocode = [
  'generate(prefix, open, close):',
  '  if open + close = 2n:',
  '    output prefix; return',
  '  if open < n: generate(prefix + "(", open + 1, close)',
  '  if close < open: generate(prefix + ")", open, close + 1)',
  'generate("", 0, 0)',
];

/**
 * @typedef {object} BracketFrame
 * @property {'start'|'open'|'close'|'emit'|'done'} kind
 * @property {number} n
 * @property {string} prefix
 * @property {number} open
 * @property {number} close
 * @property {number} dropped  Characters undone to get back to this choice, on a close frame.
 * @property {string[]} found
 * @property {number} calls
 * @property {string} last  The sequence last output, drawn as a tree.
 * @property {number[]} lines
 */

/**
 * The height of the path after each character: `(` climbs and `)` descends.
 * @param {string} prefix
 * @returns {number[]}  Starts with 0, so it has one more entry than `prefix` has characters.
 */
export function heightsOf(prefix) {
  const out = [0];
  for (const c of prefix) out.push(out[out.length - 1] + (c === '(' ? 1 : -1));
  return out;
}

/**
 * The binary tree of a balanced sequence: every sequence is uniquely (A)B, where A becomes the
 * left subtree and B the right one. Nodes are numbered in the order their brackets open.
 * @param {string} seq  A balanced sequence.
 * @returns {import('$lib/components/tree-layout.js').TreeNode | null}
 */
export function treeOfSequence(seq) {
  let at = 0;
  let count = 0;
  /** @returns {import('$lib/components/tree-layout.js').TreeNode | null} */
  function read() {
    if (at >= seq.length || seq[at] === ')') return null;
    at++;
    const id = ++count;
    const left = read();
    at++;
    const right = read();
    return { id, label: String(id), children: [left, right] };
  }
  return read();
}

/**
 * @param {number} n  From 0 to MAX_CATALAN_N.
 * @returns {BracketFrame[]}
 */
export function bracketTrace(n) {
  /** @type {BracketFrame[]} */
  const frames = [];
  /** @type {string[]} */
  const found = [];
  let calls = 1;
  let last = '';
  let shown = 0;

  /**
   * @param {BracketFrame['kind']} kind @param {string} prefix @param {number} open
   * @param {number} close @param {number[]} lines
   */
  const push = (kind, prefix, open, close, lines) => {
    frames.push({
      kind,
      n,
      prefix,
      open,
      close,
      dropped: Math.max(0, shown - prefix.length + 1),
      found: found.slice(),
      calls,
      last,
      lines,
    });
    shown = prefix.length;
  };

  /** @param {string} prefix @param {number} open @param {number} close */
  function generate(prefix, open, close) {
    if (open + close === 2 * n) {
      found.push(prefix);
      last = prefix;
      push('emit', prefix, open, close, [1, 2]);
      return;
    }
    if (open < n) {
      calls++;
      push('open', `${prefix}(`, open + 1, close, [3]);
      generate(`${prefix}(`, open + 1, close);
    }
    if (close < open) {
      calls++;
      push('close', `${prefix})`, open, close + 1, [4]);
      generate(`${prefix})`, open, close + 1);
    }
  }

  push('start', '', 0, 0, [5, 0]);
  generate('', 0, 0);
  push('done', last, n, n, [5]);
  return frames;
}

/** @type {Record<'small'|'sierpinski'|'primeRow', {rows: number, p: number}>} */
export const PASCAL_PRESETS = {
  small: { rows: 6, p: 2 },
  sierpinski: { rows: 15, p: 2 },
  primeRow: { rows: 7, p: 7 },
};

/** @type {Record<'single'|'lucas'|'zero'|'parity'|'huge', {n: number, k: number, p: number}>} */
export const LUCAS_PRESETS = {
  single: { n: 10, k: 3, p: 13 },
  lucas: { n: 1000, k: 300, p: 13 },
  zero: { n: 6, k: 2, p: 3 },
  parity: { n: 12, k: 4, p: 2 },
  huge: { n: 1_000_000_000, k: 500_000_000, p: 1009 },
};
