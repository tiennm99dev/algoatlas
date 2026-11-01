/**
 * Two constraint-satisfaction searches by backtracking. Rows, columns and digits count from 0
 * for rows and columns and from 1 for digits.
 *
 * - N-queens puts one queen in each row, top to bottom. A square is tested against the queens
 *   above it in constant time, using one flag per column and per diagonal. Rejected squares
 *   do not get a step of their own: the next placement reports the columns it passed over.
 * - Sudoku fills the first empty cell, left to right and top to bottom, with the lowest digit
 *   that is not already in its row, column or box.
 *
 * Both undo a placement when everything after it has failed. A Sudoku search can take millions
 * of steps on a nearly empty grid, so its trace stops at MAX_FRAMES and says so.
 */

/** @typedef {'first'|'all'} QueensGoal */

/**
 * @typedef {object} QueensFrame
 * @property {'start'|'place'|'dead'|'remove'|'solved'|'done'} kind
 * @property {number} n
 * @property {QueensGoal} goal
 * @property {number|null} fixed  The column the top-row queen is held to, or null.
 * @property {number[]} queens  Column of the queen in each filled row, top to bottom.
 * @property {number} row  The row acted on, -1 for none.
 * @property {number} col  The column acted on, -1 for none.
 * @property {number[]} rejected  Columns of this row just tested and refused.
 * @property {number} tested  Squares tested so far.
 * @property {number} placed  Queens placed so far.
 * @property {number} removed  Queens taken back so far.
 * @property {number[][]} solutions  Solutions so far, as a column for each row.
 * @property {number[]} lines
 */

/**
 * @typedef {object} SudokuReject
 * @property {number} digit
 * @property {'row'|'column'|'box'} why
 */

/**
 * @typedef {object} SudokuFrame
 * @property {'start'|'place'|'dead'|'remove'|'solved'|'clash'|'done'} kind
 * @property {number[][]} grid  0 is an empty cell.
 * @property {boolean[][]} clue  Which cells were given.
 * @property {number} r  The cell acted on, -1 for none.
 * @property {number} c
 * @property {number} digit  The digit acted on, 0 for none.
 * @property {SudokuReject[]} rejected  Digits this cell just tested and refused.
 * @property {number} tested  Digits tested so far.
 * @property {number} placed  Digits placed so far.
 * @property {number} removed  Digits taken back so far.
 * @property {boolean} solved
 * @property {boolean} cutoff  The trace stopped at MAX_FRAMES before the search finished.
 * @property {number[]} lines
 */

export const MAX_QUEENS = 8;
export const MAX_QUEENS_ALL = 6;
export const MAX_FRAMES = 400;

export const queensPseudocode = [
  'place(row):',
  '  if row == n: record the board; return',
  '  for col = 0 to n-1:',
  '    if a queen attacks (row, col): continue',
  '    put a queen at (row, col)',
  '    place(row + 1)',
  '    take the queen back   // undo',
];

export const sudokuPseudocode = [
  'solve():',
  '  find the first empty cell; if none: return true',
  '  for d = 1 to size:',
  '    if d is in the row, column or box: continue',
  '    grid[r][c] = d',
  '    if solve(): return true',
  '    grid[r][c] = empty   // undo',
  '  return false   // no digit fits: back up',
];

/**
 * @type {{key: string, grid: number[][]}[]}
 */
export const SUDOKU_PRESETS = [
  {
    key: 'small',
    grid: [
      [0, 0, 0, 2],
      [2, 0, 0, 0],
      [0, 3, 0, 0],
      [0, 0, 1, 0],
    ],
  },
  {
    key: 'empty',
    grid: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
  {
    key: 'nine',
    grid: [
      [0, 3, 0, 0, 7, 0, 9, 1, 2],
      [6, 7, 0, 1, 0, 0, 3, 4, 0],
      [1, 9, 0, 0, 4, 0, 5, 0, 7],
      [0, 0, 0, 7, 0, 0, 4, 2, 0],
      [0, 2, 6, 8, 5, 3, 0, 9, 1],
      [7, 0, 3, 9, 2, 4, 8, 5, 0],
      [9, 6, 0, 0, 3, 7, 2, 8, 4],
      [0, 0, 7, 4, 1, 9, 6, 0, 0],
      [3, 4, 0, 2, 0, 6, 1, 7, 0],
    ],
  },
  {
    key: 'clash',
    grid: [
      [1, 0, 0, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  },
];

/**
 * Reads the board size, a whole number from 1 to MAX_QUEENS.
 * @param {string} text
 * @returns {number|null}
 */
export function parseSize(text) {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n < 1 || n > MAX_QUEENS ? null : n;
}

/**
 * Runs N-queens once and records every step.
 * @param {number} n
 * @param {{goal?: QueensGoal, fixed?: number|null}} [options]
 * @returns {QueensFrame[]}
 */
export function queensTrace(n, { goal = 'first', fixed = null } = {}) {
  /** @type {QueensFrame[]} */
  const frames = [];
  /** @type {number[]} */
  const queens = [];
  /** @type {number[][]} */
  const solutions = [];
  const cols = new Array(n).fill(false);
  const downs = new Array(2 * n).fill(false);
  const ups = new Array(2 * n).fill(false);
  let tested = 0;
  let placed = 0;
  let removed = 0;

  /**
   * @param {QueensFrame['kind']} kind @param {number} row @param {number} col
   * @param {number[]} rejected @param {number[]} lines
   */
  function record(kind, row, col, rejected, lines) {
    frames.push({
      kind,
      n,
      goal,
      fixed,
      queens: queens.slice(),
      row,
      col,
      rejected: rejected.slice(),
      tested,
      placed,
      removed,
      solutions: solutions.map((s) => s.slice()),
      lines,
    });
  }

  /** @param {number} row @param {number} col @param {boolean} on */
  function mark(row, col, on) {
    cols[col] = on;
    downs[row - col + n] = on;
    ups[row + col] = on;
  }

  /**
   * @param {number} row
   * @returns {boolean} true when the search should stop.
   */
  function place(row) {
    if (row === n) {
      solutions.push(queens.slice());
      record('solved', row - 1, queens[row - 1], [], [1]);
      return goal === 'first';
    }
    /** @type {number[]} */
    let rejected = [];
    let tried = false;
    for (let col = 0; col < n; col++) {
      if (row === 0 && fixed !== null && col !== fixed) continue;
      tested++;
      if (cols[col] || downs[row - col + n] || ups[row + col]) {
        rejected.push(col);
        continue;
      }
      tried = true;
      queens.push(col);
      mark(row, col, true);
      placed++;
      record('place', row, col, rejected, rejected.length ? [3, 4, 5] : [2, 4, 5]);
      rejected = [];
      if (place(row + 1)) return true;
      queens.pop();
      mark(row, col, false);
      removed++;
      record('remove', row, col, [], [6]);
    }
    if (!tried) record('dead', row, -1, rejected, [2, 3]);
    return false;
  }

  record('start', -1, -1, [], [0]);
  place(0);
  record('done', -1, -1, [], [0]);
  return frames;
}

/**
 * The rows and boxes of a Sudoku grid: 4 × 4 has 2 × 2 boxes and 9 × 9 has 3 × 3 boxes.
 * @param {number} size
 */
export const boxSide = (size) => Math.round(Math.sqrt(size));

/**
 * Why a digit cannot go in a cell, or null if it can. A row clash wins over a column clash, and
 * a column clash over a box clash.
 * @param {number[][]} grid @param {number} r @param {number} c @param {number} d
 * @returns {'row'|'column'|'box'|null}
 */
export function clashOf(grid, r, c, d) {
  const size = grid.length;
  const side = boxSide(size);
  for (let x = 0; x < size; x++) if (x !== c && grid[r][x] === d) return 'row';
  for (let y = 0; y < size; y++) if (y !== r && grid[y][c] === d) return 'column';
  const top = r - (r % side);
  const left = c - (c % side);
  for (let y = top; y < top + side; y++) {
    for (let x = left; x < left + side; x++) {
      if ((y !== r || x !== c) && grid[y][x] === d) return 'box';
    }
  }
  return null;
}

/**
 * The next digit for a cell when clicked: empty, then 1 up to the size, then empty again.
 * @param {number[][]} grid @param {number} r @param {number} c
 * @returns {number[][]}
 */
export function cycleCell(grid, r, c) {
  return grid.map((row, y) =>
    row.map((v, x) => (y === r && x === c ? (v + 1) % (grid.length + 1) : v)),
  );
}

/**
 * Runs the Sudoku search once and records every step.
 * @param {number[][]} input
 * @returns {SudokuFrame[]}
 */
export function sudokuTrace(input) {
  const size = input.length;
  const grid = input.map((row) => row.slice());
  const clue = input.map((row) => row.map((v) => v !== 0));
  /** @type {SudokuFrame[]} */
  const frames = [];
  let tested = 0;
  let placed = 0;
  let removed = 0;
  let cutoff = false;

  /**
   * @param {SudokuFrame['kind']} kind @param {number} r @param {number} c @param {number} digit
   * @param {SudokuReject[]} rejected @param {boolean} solved @param {number[]} lines
   */
  function record(kind, r, c, digit, rejected, solved, lines) {
    frames.push({
      kind,
      grid: grid.map((row) => row.slice()),
      clue: clue.map((row) => row.slice()),
      r,
      c,
      digit,
      rejected: rejected.map((x) => ({ ...x })),
      tested,
      placed,
      removed,
      solved,
      cutoff,
      lines,
    });
  }

  /** @returns {[number, number]|null} */
  function firstEmpty() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) if (grid[r][c] === 0) return [r, c];
    }
    return null;
  }

  /** Leaves room for the last two frames, which may still follow this check. */
  function outOfRoom() {
    if (frames.length >= MAX_FRAMES - 2) cutoff = true;
    return cutoff;
  }

  /** @returns {boolean} true when the grid is solved or the trace ran out of room. */
  function solve() {
    if (outOfRoom()) return true;
    const cell = firstEmpty();
    if (cell === null) {
      record('solved', -1, -1, 0, [], true, [1]);
      return true;
    }
    const [r, c] = cell;
    /** @type {SudokuReject[]} */
    let rejected = [];
    for (let d = 1; d <= size; d++) {
      tested++;
      const why = clashOf(grid, r, c, d);
      if (why !== null) {
        rejected.push({ digit: d, why });
        continue;
      }
      grid[r][c] = d;
      placed++;
      record('place', r, c, d, rejected, false, rejected.length ? [3, 4, 5] : [2, 4, 5]);
      rejected = [];
      if (solve()) return true;
      grid[r][c] = 0;
      removed++;
      record('remove', r, c, d, [], false, [6]);
      if (outOfRoom()) return true;
    }
    record('dead', r, c, 0, rejected, false, [2, 3, 7]);
    return false;
  }

  /** @returns {[number, number]|null} */
  function firstClash() {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0 && clashOf(grid, r, c, grid[r][c]) !== null) return [r, c];
      }
    }
    return null;
  }

  record('start', -1, -1, 0, [], false, [0]);
  const clash = firstClash();
  let solved = false;
  if (clash) {
    record('clash', clash[0], clash[1], grid[clash[0]][clash[1]], [], false, [0]);
  } else {
    solved = solve() && !cutoff;
  }
  record('done', -1, -1, 0, [], solved, [0]);
  return frames;
}
