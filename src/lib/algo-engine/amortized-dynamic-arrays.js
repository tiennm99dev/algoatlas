/**
 * n appends to a dynamic array that starts with capacity 1 and doubles when full, read with
 * the accounting method. Writing one element costs 1 and copying one element costs 1.
 *
 * Every append is charged a fixed number of coins c, paid into a bank before it runs; every
 * write and every copy then spends one coin. With c = 3 the bank never goes below 0: each
 * element pays 1 for its own write and saves 2, one to copy itself at the next resize and one
 * to copy an element of the older half that already spent its savings. With c = 2 the bank
 * goes into debt on append 5.
 *
 * Aggregate view: n appends write n elements and copy 1 + 2 + 4 + … (every power of 2 below
 * n), which is less than 2n, so the total cost is below 3n.
 */

export const MAX_APPENDS = 64;
export const MIN_CHARGE = 1;
export const MAX_CHARGE = 4;

export const appendPseudocode = [
  'append(x):              ▹ charged c coins',
  '  bank = bank + c',
  '  if size == capacity:',
  '    B = allocate(2 × capacity)',
  '    for i = 0 to size − 1:',
  '      B[i] = A[i]         ▹ spends 1 coin',
  '    A = B; capacity = 2 × capacity',
  '  A[size] = x             ▹ spends 1 coin',
  '  size = size + 1',
];

/**
 * @typedef {object} AppendFrame
 * @property {'start'|'charge'|'allocate'|'copy'|'grown'|'write'|'done'} kind
 * @property {number} n  Appends in the whole run.
 * @property {number} charge  Coins paid into the bank per append.
 * @property {(number|null)[]} cells  The block in use: one slot per unit of capacity. During a
 *   resize it is the new block B being filled.
 * @property {(number|null)[] | null} old  The full old block A while a resize copies it, else null.
 * @property {number} size
 * @property {number} capacity
 * @property {number} op  The append running now (1-based), 0 before the first.
 * @property {number} at  The index just copied or written, -1 when none.
 * @property {number} opCost  Steps so far in the current append.
 * @property {number[]} costs  Actual cost of appends 1..op (the last one may be running).
 * @property {number[]} banks  Bank after appends 0..op (banks[0] = 0; the last one is live).
 * @property {number} bank  Coins in the bank now; negative means debt.
 * @property {number} charged  Coins paid in so far.
 * @property {number} total  Steps (coins spent) so far: writes plus copies.
 * @property {number} copies
 * @property {number} writes
 * @property {number} firstDebt  The first append during which the bank went below 0, else -1.
 * @property {number[]} lines
 */

/** The value appended by append number k (1-based). @param {number} k */
export const appendedValue = (k) => k;

/**
 * Aggregate count: the cost of n appends from capacity 1 with doubling.
 * @param {number} n
 */
export function aggregateCost(n) {
  let copies = 0;
  for (let p = 1; p < n; p *= 2) copies += p;
  return { writes: n, copies, total: n + copies };
}

/**
 * @param {number} n  0 ≤ n ≤ MAX_APPENDS.
 * @param {number} charge  MIN_CHARGE ≤ charge ≤ MAX_CHARGE.
 * @returns {AppendFrame[]}
 */
export function appendTrace(n, charge) {
  /** @type {AppendFrame[]} */
  const frames = [];
  /** @type {(number|null)[]} */
  let cells = [null];
  /** @type {(number|null)[] | null} */
  let old = null;
  let size = 0;
  let op = 0;
  let at = -1;
  /** @type {number[]} */
  const costs = [];
  const banks = [0];
  let bank = 0;
  let charged = 0;
  let total = 0;
  let copies = 0;
  let writes = 0;
  let firstDebt = -1;

  /** @param {AppendFrame['kind']} kind @param {number[]} lines */
  function push(kind, lines) {
    frames.push({
      kind,
      n,
      charge,
      cells: cells.slice(),
      old: old ? old.slice() : null,
      size,
      capacity: cells.length,
      op,
      at,
      opCost: op > 0 ? costs[op - 1] : 0,
      costs: costs.slice(),
      banks: banks.slice(),
      bank,
      charged,
      total,
      copies,
      writes,
      firstDebt,
      lines: lines.slice(),
    });
  }

  function spend() {
    bank--;
    total++;
    costs[op - 1]++;
    banks[op] = bank;
    if (bank < 0 && firstDebt < 0) firstDebt = op;
  }

  push('start', [0]);
  for (op = 1; op <= n; op++) {
    at = -1;
    costs.push(0);
    bank += charge;
    charged += charge;
    banks.push(bank);
    push('charge', [0, 1]);
    const resizing = size === cells.length;
    if (resizing) {
      /** @type {(number|null)[]} */
      const next = Array.from({ length: 2 * cells.length }, () => null);
      old = cells;
      cells = next;
      push('allocate', [2, 3]);
      for (let i = 0; i < size; i++) {
        next[i] = old[i];
        copies++;
        at = i;
        spend();
        push('copy', [4, 5]);
      }
      at = -1;
      old = null;
      push('grown', [6]);
    }
    cells[size] = appendedValue(op);
    at = size;
    size++;
    writes++;
    spend();
    push('write', resizing ? [7, 8] : [2, 7, 8]);
  }
  op = n;
  at = -1;
  push('done', frames[frames.length - 1].lines);
  return frames;
}
