/**
 * Step traces for two dynamic programs over the prefixes of two strings a[1..m] and
 * b[1..n], each filling an (m + 1) × (n + 1) table row by row and then walking back from the
 * bottom-right cell to rebuild the answer.
 *
 * - Longest common subsequence: L[i][j] = LCS length of a[1..i] and b[1..j]. A match
 *   extends L[i−1][j−1]; otherwise drop a[i] (up) or b[j] (left), preferring up on a tie.
 * - Edit distance (Levenshtein): D[i][j] = fewest inserts, deletes and replaces turning
 *   a[1..i] into b[1..j]. Equal letters keep D[i−1][j−1] for free; otherwise 1 plus the
 *   cheapest of replace (diagonal), delete a[i] (up) and insert b[j] (left), in that order on
 *   a tie.
 * Row 0 and column 0 stand for the empty prefix.
 */

/** @typedef {'lcs'|'edit'} StringDpMode */
/** @typedef {'diag'|'up'|'left'} StringDpMove */
/** @typedef {[number, number]} Cell */

/**
 * One edit of the alignment, in order from the start of the strings.
 * @typedef {object} StringDpOp
 * @property {'keep'|'replace'|'delete'|'insert'} op
 * @property {string} from  The letter of a (empty for insert).
 * @property {string} to  The letter of b (empty for delete).
 */

/**
 * @typedef {object} StringDpFrame
 * @property {'start'|'base'|'fill'|'trace'|'done'} kind
 * @property {StringDpMode} mode
 * @property {string} a
 * @property {string} b
 * @property {(number|null)[][]} table  null while not filled.
 * @property {number} i  Current row, -1 for none.
 * @property {number} j  Current column, -1 for none.
 * @property {boolean} match  fill/trace: a[i] equals b[j].
 * @property {{move: StringDpMove, value: number}[]} options  fill: the cells read, with what
 *                                                            each offers.
 * @property {StringDpMove|null} move  fill: the winning move; trace: the move walked back.
 * @property {Cell[]} path  Cells walked so far, from the bottom-right corner.
 * @property {string} common  lcs: the common subsequence rebuilt so far.
 * @property {StringDpOp[]} ops  edit: the edits rebuilt so far, in string order.
 * @property {number} filled  Cells filled so far.
 * @property {number|null} result
 * @property {number[]} lines
 */

export const MAX_LEN = 8;

export const STRING_PRESETS = {
  clrs: ['ABCBDAB', 'BDCABA'],
  kitten: ['KITTEN', 'SITTING'],
  sunday: ['SUNDAY', 'SATURDAY'],
};

export const stringDpPseudocode = {
  lcs: [
    'lcs(a[1..m], b[1..n]):',
    '  L[i][0] = L[0][j] = 0        // an empty prefix shares nothing',
    '  for i = 1 to m: for j = 1 to n:',
    '    if a[i] == b[j]: L[i][j] = L[i-1][j-1] + 1   // match',
    '    else: L[i][j] = max(L[i-1][j], L[i][j-1])    // drop a[i] or b[j]',
    '  walk back from L[m][n] to read the LCS',
  ],
  edit: [
    'edit(a[1..m], b[1..n]):',
    '  D[i][0] = i; D[0][j] = j     // delete all, or insert all',
    '  for i = 1 to m: for j = 1 to n:',
    '    if a[i] == b[j]: D[i][j] = D[i-1][j-1]       // keep',
    '    else: D[i][j] = 1 + min(D[i-1][j-1],  // replace a[i] by b[j]',
    '                            D[i-1][j],    // delete a[i]',
    '                            D[i][j-1])    // insert b[j]',
    '  walk back from D[m][n] to read the edits',
  ],
};

/**
 * Reads a word of 0 to MAX_LEN letters, in capitals.
 * @param {string} text
 * @returns {{word: string} | {error: 'format'|'length'}}
 */
export function parseWord(text) {
  const word = text.trim().toUpperCase();
  if (!/^[A-Z]*$/.test(word)) return { error: 'format' };
  if (word.length > MAX_LEN) return { error: 'length' };
  return { word };
}

/** @type {Record<StringDpMove, Cell>} */
const STEP = { diag: [-1, -1], up: [-1, 0], left: [0, -1] };

/**
 * @param {StringDpMode} mode
 * @param {string} a
 * @param {string} b
 * @returns {StringDpFrame[]}
 */
export function stringDpTrace(mode, a, b) {
  const m = a.length;
  const n = b.length;
  const lcs = mode === 'lcs';
  /** @type {(number|null)[][]} */
  const table = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
  /** @type {(StringDpMove|null)[][]} */
  const moves = Array.from({ length: m + 1 }, () => Array(n + 1).fill(null));
  /** @type {StringDpFrame[]} */
  const frames = [];
  /** @type {Cell[]} */
  const path = [];
  let common = '';
  /** @type {StringDpOp[]} */
  let ops = [];
  let filled = 0;
  const walkLine = lcs ? 5 : 7;

  /** @param {Pick<StringDpFrame, 'kind'|'lines'> & Partial<StringDpFrame>} f */
  const push = (f) =>
    frames.push({
      i: -1,
      j: -1,
      match: false,
      move: null,
      result: null,
      ...f,
      options: (f.options ?? []).map((o) => ({ ...o })),
      lines: f.lines.slice(),
      mode,
      a,
      b,
      table: table.map((r) => r.slice()),
      path: path.map((c) => /** @type {Cell} */ ([c[0], c[1]])),
      common,
      ops: ops.map((o) => ({ ...o })),
      filled,
    });

  push({ kind: 'start', lines: [0] });

  for (let i = 0; i <= m; i++) {
    table[i][0] = lcs ? 0 : i;
    if (i > 0) moves[i][0] = 'up';
  }
  for (let j = 1; j <= n; j++) {
    table[0][j] = lcs ? 0 : j;
    moves[0][j] = 'left';
  }
  filled += m + n + 1;
  push({ kind: 'base', lines: [1] });

  const at = (/** @type {number} */ r, /** @type {number} */ c) =>
    /** @type {number} */ (table[r][c]);

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const match = a[i - 1] === b[j - 1];
      /** @type {{move: StringDpMove, value: number}[]} */
      let options;
      if (match) options = [{ move: 'diag', value: at(i - 1, j - 1) + (lcs ? 1 : 0) }];
      else if (lcs)
        options = [
          { move: 'up', value: at(i - 1, j) },
          { move: 'left', value: at(i, j - 1) },
        ];
      else
        options = [
          { move: 'diag', value: at(i - 1, j - 1) + 1 },
          { move: 'up', value: at(i - 1, j) + 1 },
          { move: 'left', value: at(i, j - 1) + 1 },
        ];
      let best = options[0];
      for (const o of options) if (lcs ? o.value > best.value : o.value < best.value) best = o;
      table[i][j] = best.value;
      moves[i][j] = best.move;
      filled++;
      const lines = match ? [2, 3] : lcs ? [2, 4] : [2, 4, 5, 6];
      push({ kind: 'fill', lines, i, j, match, options, move: best.move });
    }

  const result = at(m, n);
  let [i, j] = [m, n];
  path.push([i, j]);
  while (lcs ? i > 0 && j > 0 : i > 0 || j > 0) {
    const match = i > 0 && j > 0 && a[i - 1] === b[j - 1];
    const move = /** @type {StringDpMove} */ (lcs && match ? 'diag' : moves[i][j]);
    if (lcs) {
      if (move === 'diag') common = a[i - 1] + common;
    } else {
      /** @type {StringDpOp} */
      const op =
        move === 'diag'
          ? { op: match ? 'keep' : 'replace', from: a[i - 1], to: b[j - 1] }
          : move === 'up'
            ? { op: 'delete', from: a[i - 1], to: '' }
            : { op: 'insert', from: '', to: b[j - 1] };
      ops = [op, ...ops];
    }
    const [di, dj] = STEP[move];
    const [fi, fj] = [i, j];
    i += di;
    j += dj;
    path.push([i, j]);
    push({ kind: 'trace', lines: [walkLine], i: fi, j: fj, match, move });
  }

  push({ kind: 'done', lines: [walkLine], result });
  return frames;
}
