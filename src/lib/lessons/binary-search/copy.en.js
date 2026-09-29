/** @typedef {import('$lib/algo-engine/searching.js').SearchFrame} SearchFrame */

export const en = {
  slug: 'binary-search',
  topic: 'searching',
  level: 'Beginner',
  title: 'Binary search',
  intro:
    'In a sorted array, one comparison tells you which half the target is in. Throw the other half away and repeat: a million elements take at most 20 comparisons.',
  instruction:
    'Watch mode runs the algorithm step by step. You-drive mode lets you probe any cell yourself — see if you can beat binary search.',
  modeLabel: 'Mode',
  modes: { watch: 'Watch', drive: 'You drive' },
  targetLabel: 'Target',
  sizeLabel: 'Size',
  newArray: 'New array',
  randomPresent: 'Random target',
  randomAbsent: 'Missing target',
  arrayLabel: 'Sorted array',
  cellLabel: /** @param {number} i @param {number} v @param {boolean} out */ (i, v, out) =>
    `Index ${i}, value ${v}${out ? ', ruled out' : ''}`,
  binaryCount: 'Binary search reads',
  linearCount: 'Linear scan reads',
  yourCount: 'Your probes',
  /** @param {SearchFrame} f @param {number[]} a @param {number} target */
  describe(f, a, target) {
    switch (f.kind) {
      case 'start':
        return `Looking for ${target}. The whole array, indices ${f.lo}–${f.hi}, is still possible.`;
      case 'mid':
        return `Middle of ${f.lo}–${f.hi} is index ${f.mid}. Read a[${f.mid}] = ${a[f.mid]}.`;
      case 'found':
        return `a[${f.mid}] = ${target}. Found it after ${f.comparisons} reads.`;
      case 'go-right':
        return `${a[f.mid]} < ${target}, so the target can only be to the right. lo = ${f.lo}.`;
      case 'go-left':
        return `${a[f.mid]} > ${target}, so the target can only be to the left. hi = ${f.hi}.`;
      case 'not-found':
        return `lo (${f.lo}) passed hi (${f.hi}): nothing left to check. ${target} is not in the array.`;
    }
  },
  drive: {
    prompt: 'Click any cell that is still possible to read its value.',
    higher: /** @param {number} v @param {number} t */ (v, t) =>
      `${v} < ${t}: everything left of here is ruled out.`,
    lower: /** @param {number} v @param {number} t */ (v, t) =>
      `${v} > ${t}: everything right of here is ruled out.`,
    found: /** @param {number} n @param {number} best */ (n, best) =>
      n <= best
        ? `Found in ${n} probes — as good as binary search (${best}).`
        : `Found in ${n} probes. Binary search needs ${best} — did you always pick the middle?`,
    missing: /** @param {number} n @param {number} best */ (n, best) =>
      `No cells left after ${n} probes — the target is not in the array. Binary search proves that in ${best}.`,
    restart: 'Try again',
  },
  takeaways: [
    'Binary search only works on sorted data — the comparison is what tells you which half to discard.',
    'Each read halves the candidates, so the cost is ⌊log₂ n⌋ + 1 reads at most. Doubling the array adds just one step.',
    'Picking the exact middle is what guarantees the bound. Probing off-center can get lucky, but its worst case is worse.',
    'Watch for off-by-one bugs: the loop runs while lo ≤ hi, and the window moves to mid ± 1, never to mid.',
  ],
  complexity: [
    ['Best', 'O(1)', 'The first midpoint is the target.'],
    ['Worst', 'O(log n)', 'The window halves every step until it is empty.'],
    ['Linear scan', 'O(n)', 'Without sorting you must read every element.'],
  ],
  nextTeaser: 'Next up: lower bound and upper bound — binary search for the first position that fits.',
};
