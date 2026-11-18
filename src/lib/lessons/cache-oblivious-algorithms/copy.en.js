/** @typedef {import('$lib/algo-engine/cache-oblivious-algorithms.js').TransposeFrame} TransposeFrame */
/** @typedef {import('$lib/algo-engine/cache-oblivious-algorithms.js').TransposeSetup} TransposeSetup */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** 'A', 'A and B', 'A, B and C'. @param {string[]} items */
const list = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

export const en = {
  slug: 'cache-oblivious-algorithms',
  topic: 'computation-models',
  level: 'Advanced',
  title: 'Cache-oblivious algorithms',
  intro:
    'On a real machine, reading one word from main memory brings in a whole block of B neighbouring words, and the cache keeps only M words. When data is big, the number of block transfers decides the running time far more than the number of instructions. A cache-oblivious algorithm keeps that number low for every B and M without knowing either: it splits the problem recursively until the pieces fit.',
  summary:
    'Transpose a matrix through a small LRU cache and count block transfers for the row-by-row loop against the recursive, cache-oblivious order and a Z-order layout.',
  instruction:
    'Step through the transpose B = Aᵀ. Outlined boxes are memory blocks, shaded cells sit in the cache, and ✗ marks an access that had to fetch its block. Switch the order, the layout, N, B and the cache size, and compare Block transfers with the ideal 2N²/B.',
  orderLabel: 'Order',
  orders: { rows: 'Row by row', recursive: 'Recursive' },
  layoutLabel: 'Layout',
  layouts: { row: 'Row-major', z: 'Z-order' },
  sizeLabel: 'N',
  blockLabel: 'Block B',
  cacheLabel: 'Cache C (blocks)',
  /** @param {number} c @param {number} b */
  cacheNote: (c, b) => `M = C · B = ${c * b} words`,
  /** @param {'A'|'B'} name @param {number} n */
  matrixTitle: (name, n) => (name === 'A' ? `A (${n} × ${n}), read` : `B = Aᵀ, written`),
  /** @param {'A'|'B'} name @param {number} cached @param {number} total */
  matrixAria: (name, cached, total) =>
    `Matrix ${name}: ${plural(total, 'block', 'blocks')}, ${cached} in the cache.`,
  /** @param {'A'|'B'} name @param {number} i @param {number} j @param {number} block @param {string} state */
  cellLabel: (name, i, j, block, state) =>
    `${name}[${i}][${j}], block ${name}${block}${state ? `, ${state}` : ''}`,
  states: {
    now: 'accessed now',
    cached: 'its block is cached',
    done: 'copied',
    miss: 'a miss',
    hit: 'a hit',
  },
  markers: { miss: '✗', hit: '✓', done: '·' },
  legend: {
    now: 'Accessed now: ✗ miss, ✓ hit',
    cached: 'Block in the cache',
    done: '· Copied already',
    block: 'A memory block of B words',
  },
  cacheTitle: 'Cache, least recently used first',
  cacheEmpty: 'Empty.',
  hotBlock: 'used now',
  /** @param {'A'|'B'} name @param {number} k */
  blockName: (name, k) => `${name}${k}`,
  stats: {
    copied: 'Elements copied',
    transfers: 'Block transfers',
    split: 'Misses on A / on B',
    ideal: 'Ideal 2N²/B',
  },
  /** @param {number} a @param {number} b */
  split: (a, b) => `${a} / ${b}`,
  /**
   * @param {TransposeFrame} f @param {TransposeSetup} s
   * @param {(id: number) => string} name  Block id to its name.
   */
  describe(f, s, name) {
    const total = f.missA + f.missB;
    const ideal = (2 * s.n * s.n) / s.block;
    switch (f.kind) {
      case 'start':
        return `Copy every A[i][j] to B[j][i]. Each matrix is ${plural((s.n * s.n) / s.block, 'block', 'blocks')} of ${s.block} words, and the cache holds ${plural(s.cache, 'block', 'blocks')}. Any order must fetch every block at least once: ${ideal} transfers.`;
      case 'copy': {
        const read = f.hitA ? 'hits' : 'misses, so its block is fetched';
        const write = f.hitB ? 'hits' : 'misses, so its block is fetched';
        const out = f.evicted.length
          ? ` Evicted: ${list(f.evicted.map(name))}, the least recently used.`
          : '';
        return `B[${f.j}][${f.i}] = A[${f.i}][${f.j}]: the read ${read}; the write ${write}.${out}`;
      }
      case 'done': {
        const verdict =
          total === ideal
            ? 'the ideal: every block was fetched exactly once.'
            : `${(total / ideal).toFixed(2)} times the ideal ${ideal}: some blocks were evicted and fetched again.`;
        return `Done: ${plural(s.n * s.n, 'element', 'elements')} copied with ${plural(total, 'block transfer', 'block transfers')}, ${verdict}`;
      }
    }
  },
  takeaways: [
    'The external-memory model counts block transfers: memory moves in blocks of B words, and a cache holds M words. Scanning n words costs about n/B transfers, not n.',
    'Row by row, a transpose reads A along rows but writes B down columns. Unless the cache can hold a block for every row it writes, each write fetches a block and uses one word of it: about N² transfers instead of N²/B.',
    'The recursive transpose splits the longer side until the pieces fit in the cache, whatever B and M are. Once a piece fits, each of its blocks is fetched once, so it needs only O(N²/B) transfers under the tall-cache assumption M ≥ B².',
    'A recursive layout such as Z order stores every quadrant contiguously, so a small square is a few whole blocks; with it, the recursive transpose reaches the ideal even with a tiny cache.',
    'Try it: with N = 8 and B = 4, raise the cache from 2 to 16 blocks in each order. Row by row needs 11 blocks to reach 32 transfers; the recursive order needs 7, and only 2 in Z order.',
  ],
  complexityHead: ['Algorithm', 'Block transfers', 'Why'],
  complexity: [
    ['Scan n words', 'Θ(n/B + 1)', 'Each block is fetched once and every word in it is used.'],
    [
      'Transpose, row by row',
      'Θ(N²) when M < N · B',
      'Each column write of B touches a new block, and it is evicted before the next column.',
    ],
    [
      'Transpose, recursive',
      'Θ(N²/B) when M ≥ B²',
      'Sub-matrices of about B × B fit in the cache, so each block is fetched O(1) times.',
    ],
    [
      'Merge sort vs funnelsort',
      'Θ((n/B) log₂(n/M)) vs Θ((n/B) log_{M/B}(n/B))',
      'A recursive multi-way merge uses the whole cache without knowing its size.',
    ],
    ['Memory', 'Two N × N matrices', 'The cache only copies blocks; it adds no new storage.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'With the starting settings (Row by row, Row-major, N = 8, B = 4, C = 4), how many block transfers does the transpose take?',
      answer: 80,
      unit: 'transfers',
      hints: ['Press Last step and read Block transfers.'],
      solution:
        'The reads of A miss once per block, 16 times; each of the 64 writes of B goes down a column and misses, because 4 cached blocks cannot keep a block for each of the 8 rows of B. 16 + 64 = 80, against the ideal 32.',
    },
    {
      type: 'number',
      prompt:
        'Switch to the Recursive order and keep the Row-major layout. What is the smallest cache C (in blocks) that brings the transpose down to the ideal 32 transfers?',
      answer: 7,
      unit: 'blocks',
      hints: [
        'Move the cache slider up one block at a time and read Block transfers at the last step.',
      ],
      solution:
        'C = 4 gives 56, 5 gives 48, 6 gives 44 and 7 gives 32. A 4 × 4 sub-matrix touches 4 blocks of A and 4 of B, but not all 8 at once: its first two rows of A are finished before the last two are read, so 6 blocks are in use at a time. LRU needs one more than that, because with 6 it evicts a block of B that is still needed instead of a finished block of A; with 7 the block it evicts is always a finished one, so every block is fetched once.',
    },
    {
      type: 'choice',
      prompt: 'Now choose the Z-order layout with the Recursive order and C = 2. What happens?',
      options: [
        'It still needs 56 transfers',
        'It reaches the ideal 32 transfers',
        'It needs more transfers than row by row',
        'It cannot run with only 2 blocks',
      ],
      answer: 1,
      hints: ['In Z order, a 2 × 2 square of cells is one block of 4 words.'],
      solution:
        'Each 2 × 2 square of A is one block, and its transpose in B is one block too. The recursion finishes a square before moving on, so one block of each matrix is all it needs: 16 + 16 = 32.',
    },
  ],
  nextTeaser:
    'Next up: online algorithms and competitive analysis, where decisions are made before the future is known and compared with the best offline choice.',
};
