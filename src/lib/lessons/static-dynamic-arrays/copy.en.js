/** @typedef {import('$lib/algo-engine/static-dynamic-arrays.js').ArrayFrame} ArrayFrame */
/** @typedef {import('$lib/algo-engine/static-dynamic-arrays.js').Growth} Growth */

/** @param {number} k @param {string} word @param {string} [many] */
const plural = (k, word, many = `${word}s`) => `${k} ${k === 1 ? word : many}`;

/** Two decimal places unless whole, as on the steps-per-push card. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2));

export const en = {
  slug: 'static-dynamic-arrays',
  topic: 'arrays-strings',
  level: 'Beginner',
  title: 'Static and dynamic arrays',
  intro:
    'An array stores its elements side by side in one block of memory, so the address of element i is the start address plus i times the element size. That makes reading any index a single step. A static array has a fixed capacity; a dynamic array grows by moving everything into a bigger block when it runs out of room.',
  summary:
    'Push values onto a static or a dynamic array, watch a full array allocate a bigger block and copy every element across, and read any index in one address computation.',
  instruction:
    'Pick a growth rule, a starting capacity and a number of pushes, then step. Watch the spare slots run out, the copy count jump on each resize, and the block move to a new address. Click any stored cell to compute its address.',
  growthLegend: 'Growth rule',
  growths: /** @type {Record<Growth, string>} */ ({
    static: 'Static',
    double: 'Double',
    'plus-one': 'Add 1',
  }),
  capacityLabel: 'Start capacity',
  pushesLabel: 'Pushes n',
  capacityError: 'The start capacity must be a whole number from 1 to 8.',
  pushesError: 'The number of pushes must be a whole number from 0 to 24.',
  blockA: 'Array A',
  blockB: 'New block B',
  /** @param {number} base @param {number} cap @param {number} bytes */
  blockLine: (base, cap, bytes) =>
    `Starts at address ${base}, ${plural(cap, 'slot')} × ${bytes} bytes = ${cap * bytes} bytes`,
  blockAria: 'Slots of array A, index 0 first',
  blockBAria: 'Slots of the new block B, index 0 first',
  pointerSize: 'size',
  pointerI: 'i',
  spare: '·',
  /** @param {number} i @param {number | null} value @param {number} address @param {string} state */
  cellLabel: (i, value, address, state) =>
    `Index ${i} at address ${address}: ${value === null ? 'spare slot' : value}${state ? `, ${state}` : ''}`,
  states: { read: 'read for copying', written: 'just written' },
  legend: {
    stored: 'Stored element',
    spare: 'Spare slot (· marks it)',
    read: 'Read from A',
    written: 'Just written',
  },
  stats: {
    size: 'Size / capacity',
    spare: 'Spare slots',
    opCopies: 'Copies this push',
    copies: 'Copies in total',
    resizes: 'Resizes',
    average: 'Steps per push',
  },
  readTitle: 'Read an index in O(1)',
  readHint: 'Click or press Enter on a stored cell of A to compute where it lives.',
  /** @param {number} i @param {number} base @param {number} bytes @param {number} address @param {number} value */
  readLine: (i, base, bytes, address, value) =>
    `A[${i}] lives at ${base} + ${bytes} × ${i} = ${address}. One multiplication, one addition and one memory read give ${value}, whatever the size of the array.`,
  /** @param {number} i */
  readSpare: (i) => `Index ${i} is a spare slot: it holds nothing yet, so reading it is an error.`,
  pushesTitle: 'Values pushed',
  pushesEmpty: 'none',
  pushesHot: 'being pushed',
  practiceTitle: 'Check yourself',
  /** @param {ArrayFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return f.n === 0
          ? `An empty ${f.growth === 'static' ? 'static' : 'dynamic'} array with capacity ${f.capacity} at address ${f.base}. No pushes to run.`
          : `An empty ${f.growth === 'static' ? 'static' : 'dynamic'} array with capacity ${f.capacity} at address ${f.base}. We will push ${plural(f.n, 'value')}: 10, 20, 30, …`;
      case 'write':
        return `Push ${f.op}: write ${f.value} into A[${f.at}] and grow size to ${f.size}. ${f.opCopies === 0 ? 'There was a spare slot, so this push cost 1 step.' : `With the ${plural(f.opCopies, 'copy', 'copies')} it cost ${f.opCopies + 1} steps.`}`;
      case 'full':
        return `Push ${f.op}: size ${f.size} equals capacity ${f.capacity}. A static array cannot grow, so ${f.value} is refused, along with ${f.refused === 1 ? 'no other push' : `the ${plural(f.refused - 1, 'push', 'pushes')} after it`}.`;
      case 'allocate':
        return `Push ${f.op}: A is full (${f.size} of ${f.capacity}). Allocate block B with ${plural(f.next?.length ?? 0, 'slot')} at address ${f.nextBase}; memory after A may be taken, so the array cannot just extend in place.`;
      case 'copy':
        return `Copy A[${f.at}] = ${f.cells[f.at]} into B[${f.at}]. ${plural(f.opCopies, 'copy', 'copies')} so far in this push.`;
      case 'free':
        return `All ${plural(f.size, 'element')} are in the new block. Free the old one: A now starts at ${f.base} with capacity ${f.capacity}.`;
      case 'done': {
        const stored = f.writes;
        const steps = f.writes + f.copies;
        if (f.refused > 0)
          return `Done: ${plural(stored, 'value')} stored, ${plural(f.refused, 'push', 'pushes')} refused because the static array was full.`;
        return stored === 0
          ? 'Done: nothing was pushed.'
          : `Done: ${plural(stored, 'push', 'pushes')} made ${plural(f.writes, 'write')} and ${plural(f.copies, 'copy', 'copies')} over ${plural(f.resizes, 'resize')}, ${num(steps / stored)} steps per push on average.`;
      }
    }
  },
  takeaways: [
    'An array is one contiguous block: element i sits at base + i × element size, so reading or writing any index is O(1) — no walking from the front.',
    'A static array’s capacity is fixed when it is created. Once size reaches capacity, the next push has nowhere to go.',
    'A dynamic array keeps spare slots. When they run out it allocates a bigger block, copies all size elements across and frees the old block, so that one push costs Θ(n).',
    'Doubling makes resizes rare: from capacity 1, 17 pushes copy only 1 + 2 + 4 + 8 + 16 = 31 elements. Growing by one slot copies almost every time, 1 + 2 + … + (n − 1) in total, which is Θ(n²).',
    'Try 24 pushes from capacity 1 with Double, then with Add 1, and compare the total copies and the steps per push.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Read or write A[i]', 'O(1)', 'One address computation: base + i × element size.'],
    ['Push with a spare slot', 'O(1)', 'Write A[size] and add 1 to size.'],
    ['Push onto a full array', 'Θ(n)', 'Allocate a new block and copy all n elements across.'],
    [
      'n pushes, doubling',
      'Θ(n) total',
      'Copies 1 + 2 + 4 + … < 2n, so pushes are O(1) amortized.',
    ],
    ['n pushes, growing by 1', 'Θ(n²) total', 'Copies 1 + 2 + … + (n − 1) = n(n − 1)/2.'],
    ['Space', 'Θ(n)', 'Doubling keeps at most about half the slots spare.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'A doubling array starts with capacity 1. How many element copies do 17 pushes make in total?',
      answer: 31,
      unit: 'copies',
      hints: [
        'A resize happens when a push finds size = capacity: at sizes 1, 2, 4, 8 and 16.',
        'Each resize copies the current size: 1 + 2 + 4 + 8 + 16.',
      ],
      solution:
        'Pushes 2, 3, 5, 9 and 17 find the array full and copy 1, 2, 4, 8 and 16 elements: 31 copies, fewer than 2 × 17.',
    },
    {
      type: 'number',
      prompt:
        'After those 17 pushes, how many spare slots does the doubling array have? (Capacity minus size.)',
      answer: 15,
      unit: 'slots',
      hints: ['Push 17 doubled the capacity from 16 to 32.'],
      solution: 'The capacity is 32 and the size is 17, so 32 − 17 = 15 slots are spare.',
    },
    {
      type: 'number',
      prompt:
        'An array of 4-byte integers starts at address 1000. At what address does A[6] start?',
      answer: 1024,
      hints: ['Address = base + i × element size.'],
      solution:
        '1000 + 6 × 4 = 1024. The same single computation works for every index, which is why indexing is O(1).',
    },
    {
      type: 'number',
      prompt:
        'An array grows by one slot at a time from capacity 1. How many element copies do 8 pushes make?',
      answer: 28,
      unit: 'copies',
      hints: [
        'Every push after the first finds the array full.',
        'Push k copies k − 1 elements: 1 + 2 + … + 7.',
      ],
      solution:
        'Pushes 2 to 8 copy 1, 2, …, 7 elements: 7 × 8 / 2 = 28 copies. Doubling from capacity 1 needs only 1 + 2 + 4 = 7 for the same 8 pushes.',
    },
    {
      type: 'choice',
      prompt: 'Why is reading A[i] O(1) no matter how long the array is?',
      options: [
        'Its address is base + i × element size, computed in one step',
        'The computer checks every element in parallel',
        'Arrays keep a sorted index of their elements',
        'Only short arrays are read in O(1)',
      ],
      answer: 0,
      hints: ['Where does element i sit relative to element 0?'],
      solution:
        'The elements sit side by side, so the address of A[i] follows from the start address by one multiplication and one addition.',
    },
  ],
  nextTeaser:
    'Next up: Amortized analysis of dynamic arrays, where a coin bank shows why doubling makes each push O(1) on average.',
};
