/**
 * Connected-component labelling on a grid map, by flood fill. Cells are row-major indices
 * (`r * cols + c`). The outer loop scans every cell; each land cell that has no label yet
 * starts a new island, and a breadth-first flood gives every land cell reachable from it the
 * same label. Neighbours are the 4 side cells, or also the 4 diagonal cells with 8-connectivity.
 */

/** Largest map the lesson draws; a fully land map stays under 400 frames. */
export const MAX_ROWS = 8;
export const MAX_COLS = 12;

/**
 * @typedef {object} IslandMap
 * @property {number} rows
 * @property {number} cols
 * @property {Set<number>} land
 * @property {4 | 8} connectivity
 */

/**
 * @typedef {object} ComponentsFrame
 * @property {'start'|'new-island'|'expand'|'label'|'done'} kind
 * @property {number[]} labels   Island number per cell (from 1), 0 for water or unlabelled.
 * @property {number} count      Islands found so far.
 * @property {number} current    Cell being expanded (or the seed of a new island), -1 none.
 * @property {number} touched    Neighbour just labelled, -1 none.
 * @property {number[]} queue    Flood queue, front first.
 * @property {number[]} sizes    sizes[k - 1] = cells in island k so far.
 * @property {number} checks     Neighbour cells examined so far.
 * @property {number[]} lines
 */

export const componentsPseudocode = [
  'count = 0; every cell starts with no label',
  'for each cell in row-major order:',
  '  if cell is land and has no label:',
  '    count += 1; label[cell] = count; queue = [cell]',
  '    while queue is not empty:',
  '      c = queue.dequeue()',
  '      for each neighbour n of c (4 or 8 directions):',
  '        if n is land and has no label:',
  '          label[n] = count; queue.enqueue(n)',
  'return count',
];

/**
 * Neighbours inside the map: up, right, down, left, then the diagonals with 8-connectivity.
 * @param {number} cell @param {number} rows @param {number} cols @param {4 | 8} connectivity
 * @returns {number[]}
 */
export function mapNeighbours(cell, rows, cols, connectivity) {
  const r = Math.floor(cell / cols);
  const c = cell % cols;
  const steps =
    connectivity === 8
      ? [
          [-1, 0],
          [0, 1],
          [1, 0],
          [0, -1],
          [-1, -1],
          [-1, 1],
          [1, 1],
          [1, -1],
        ]
      : [
          [-1, 0],
          [0, 1],
          [1, 0],
          [0, -1],
        ];
  const out = [];
  for (const [dr, dc] of steps) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push(nr * cols + nc);
  }
  return out;
}

/**
 * @param {IslandMap} map
 * @returns {ComponentsFrame[]}
 */
export function componentsTrace({ rows, cols, land, connectivity }) {
  const labels = new Array(rows * cols).fill(0);
  /** @type {number[]} */
  const sizes = [];
  /** @type {number[]} */
  let queue = [];
  let head = 0;
  let count = 0;
  let checks = 0;

  /** @type {ComponentsFrame[]} */
  const frames = [];
  /** @param {Pick<ComponentsFrame, 'kind'|'current'|'touched'|'lines'>} f */
  const push = (f) =>
    frames.push({
      ...f,
      labels: labels.slice(),
      count,
      queue: queue.slice(head),
      sizes: sizes.slice(),
      checks,
    });

  push({ kind: 'start', current: -1, touched: -1, lines: [0] });
  for (let cell = 0; cell < rows * cols; cell++) {
    if (!land.has(cell) || labels[cell] !== 0) continue;
    count++;
    labels[cell] = count;
    sizes.push(1);
    queue = [cell];
    head = 0;
    push({ kind: 'new-island', current: cell, touched: -1, lines: [1, 2, 3] });
    while (head < queue.length) {
      const c = queue[head++];
      push({ kind: 'expand', current: c, touched: -1, lines: [4, 5] });
      for (const n of mapNeighbours(c, rows, cols, connectivity)) {
        checks++;
        if (!land.has(n) || labels[n] !== 0) continue;
        labels[n] = count;
        sizes[count - 1]++;
        queue.push(n);
        push({ kind: 'label', current: c, touched: n, lines: [6, 7, 8] });
      }
    }
  }
  push({ kind: 'done', current: -1, touched: -1, lines: [9] });
  return frames;
}

/**
 * Scatter land at the given density.
 * @param {number} rows @param {number} cols @param {number} density 0..1
 * @param {() => number} [rand]
 * @returns {Set<number>}
 */
export function randomLand(rows, cols, density, rand = Math.random) {
  const land = new Set();
  for (let cell = 0; cell < rows * cols; cell++) if (rand() < density) land.add(cell);
  return land;
}
