/** @typedef {import('$lib/algo-engine/practice-heaps.js').MedianFrame} MedianFrame */
/** @typedef {import('$lib/algo-engine/practice-heaps.js').ClosestFrame} ClosestFrame */
/** @typedef {import('$lib/algo-engine/practice-heaps.js').Point} Point */

/** @param {number} i */
const pointName = (i) => 'ABCDEFGHIJKL'[i] ?? String(i + 1);
/** @param {Point} p */
const coords = (p) => `(${p.x}, ${p.y})`;

export const en = {
  slug: 'practice-heaps',
  topic: 'heaps',
  level: 'Intermediate',
  title: 'Practice: heap problems',
  intro:
    'Two classic heap problems. A running median splits the stream into two halves: a max-heap of the smaller half and a min-heap of the larger half, kept the same size, so the median sits on their tops. The k closest points keep a max-heap of size k, whose root is the farthest point still in the answer.',
  summary:
    'Keep the running median of a stream with two balanced heaps and find the k closest points to the origin with a size-k max-heap, then answer questions with the widget.',
  instruction:
    'Pick a problem. For Running median, type a stream and step through: watch each value join a half and the halves rebalance. For K closest points, type points as (x, y) and a k and watch far points get rejected. Use the widget to answer the questions below.',
  problemLabel: 'Problem',
  problems: { median: 'Running median', closest: 'K closest points' },
  streamLabel: 'Stream',
  pointsLabel: 'Points (x, y)',
  kLabel: 'k',
  newInputButton: 'New input',
  newInputNotice: 'New input loaded.',
  streamErrors: {
    format: 'Type whole numbers separated by commas or spaces.',
    range: 'Every value must be from 0 to 99.',
    count: 'The stream holds at most 15 values.',
  },
  pointErrors: {
    format: 'Write each point as (x, y), for example (1, 2) (−3, 0).',
    range: 'Coordinates must be from −5 to 5.',
    count: 'Use at most 12 points.',
    duplicate: 'Each point may appear only once.',
  },
  kError: 'k must be a whole number from 1 to 6.',
  streamTitle: 'Stream',
  streamAria: (/** @type {number[]} */ values) => `Stream: ${values.join(', ') || 'empty'}.`,
  lowTitle: 'Low half: max-heap',
  highTitle: 'High half: min-heap',
  /** @param {'low'|'high'} side @param {number[]} values */
  halfAria: (side, values) =>
    `${side === 'low' ? 'Low half, max-heap' : 'High half, min-heap'}: ${values.length === 0 ? 'empty' : values.join(', ')}.`,
  /** @param {'low'|'high'} side */
  halfEmpty: (side) => (side === 'low' ? 'The low half is empty.' : 'The high half is empty.'),
  /** @param {number} i @param {string} label @param {string} state */
  slotLabel: (i, label, state) => `Slot ${i}: ${label}${state ? `, ${state}` : ''}`,
  mediansTitle: 'Medians so far',
  mediansEmpty: 'none yet',
  balanceText: (/** @type {number} */ low, /** @type {number} */ high) =>
    `Sizes: low ${low}, high ${high}`,
  planeTitle: 'Points around the origin O',
  /** @param {Point[]} points */
  planeAria: (points) =>
    `Points: ${points.map((p, i) => `${pointName(i)} ${coords(p)}`).join(', ') || 'none'}.`,
  originLabel: 'O',
  /** @param {number} i @param {Point} p @param {string} state */
  pointLabel: (i, p, state) =>
    `Point ${pointName(i)} at ${coords(p)}, distance² ${p.x * p.x + p.y * p.y}${state ? `, ${state}` : ''}`,
  heapTitle: 'Max-heap by distance²',
  /** @param {string[]} labels */
  heapAria: (labels) =>
    labels.length === 0 ? 'The heap is empty.' : `Max-heap as an array: ${labels.join(', ')}.`,
  pointName,
  states: {
    active: 'acted on now',
    frontier: 'kept for now',
    visited: 'rejected',
    sorted: 'in the answer',
    compare: 'the root to beat',
  },
  legendMedian: {
    active: 'Value just added or moved',
    compare: 'Top of a half: the median comes from these',
    visited: 'Already read',
  },
  legendClosest: {
    active: 'Point read now',
    frontier: 'Kept in the heap',
    compare: 'Heap root: the farthest kept point',
    visited: 'Rejected',
    sorted: 'In the final answer',
  },
  markers: { active: '▶', frontier: 'k', visited: '✗', sorted: '★', compare: 'top' },
  readMarker: '✓',
  stats: {
    median: 'Median',
    moves: 'Moves between halves',
    heapOps: 'Heap pushes and pops',
    comparisons: 'Comparisons',
    read: 'Read',
  },
  /** @param {MedianFrame} f */
  describeMedian(f) {
    const lo = f.low[0];
    const hi = f.high[0];
    switch (f.kind) {
      case 'start':
        return 'Low is a max-heap of the smaller half, high a min-heap of the larger half. Low may hold one value more than high.';
      case 'read':
        return `Read ${f.value}.`;
      case 'push-low':
        return f.low.length === 1
          ? `Low is empty, so ${f.value} goes into low.`
          : `${f.value} ≤ low’s top ${lo}, so it belongs to the smaller half: push it into low.`;
      case 'push-high':
        return `${f.value} > low’s top ${lo}, so it belongs to the larger half: push it into high.`;
      case 'move-up':
        return `Low holds two more than high. Pop low’s top ${f.value} and push it into high.`;
      case 'move-down':
        return `High holds more than low. Pop high’s top ${f.value} and push it into low.`;
      case 'median':
        return f.low.length > f.high.length
          ? `Odd count: the median is low’s top, ${f.median}.`
          : `Even count: the median is (${lo} + ${hi}) / 2 = ${f.median}.`;
      case 'done':
        return f.medians.length === 0
          ? 'The stream was empty.'
          : `Done: ${f.medians.length} medians, ${f.moves} ${f.moves === 1 ? 'move' : 'moves'} between the halves.`;
    }
  },
  /** @param {ClosestFrame} f @param {Point[]} points @param {number} k */
  describeClosest(f, points, k) {
    const p = f.index >= 0 ? points[f.index] : null;
    const name = pointName(f.index);
    const d = p ? p.x * p.x + p.y * p.y : 0;
    const top = f.heap[0];
    switch (f.kind) {
      case 'start':
        return `Keep the ${k} closest points in a max-heap by distance², which avoids square roots. Its root is the farthest point kept.`;
      case 'read':
        return `Read ${name} ${p ? coords(p) : ''}: distance² = ${p?.x}² + ${p?.y}² = ${d}.`;
      case 'push':
        return `The heap holds fewer than ${k}, so push ${name}.`;
      case 'replace':
        return `${d} < ${pointName(f.evicted)}’s ${points[f.evicted].x ** 2 + points[f.evicted].y ** 2}, the farthest kept: drop ${pointName(f.evicted)} and put ${name} in its place.`;
      case 'skip':
        return `${d} ≥ ${top ? `${pointName(top.index)}’s ${top.d2}` : 'the root'}: ${name} is no closer than the farthest kept point. Reject it.`;
      case 'done':
        return f.heap.length === 0
          ? 'There were no points.'
          : `The ${f.heap.length} closest: ${f.heap
              .slice()
              .sort((a, b) => a.d2 - b.d2 || a.index - b.index)
              .map((e) => pointName(e.index))
              .join(', ')}.`;
    }
  },
  takeaways: [
    'Running median: a max-heap holds the smaller half and a min-heap the larger half. Each value costs one push and at most one move, O(log n), and the median is read from the tops in O(1).',
    'Keep the halves balanced (low has as many as high or one more) and ordered (every low value ≤ every high value); then the median is low’s top or the mean of both tops.',
    'For the k closest points, keep a max-heap of size k by distance: its root is the point to beat. That costs O(n log k) time and O(k) memory.',
    'Compare squared distances, x² + y²: they order points the same way as the real distances and need no square root.',
    'Try the stream 1, 2, 3, 4, 5: every other value has to move from high to low. A falling stream makes values move the other way.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    ['Add a value to the running median', 'O(log n)', 'One push and at most one pop and push.'],
    ['Read the median', 'O(1)', 'It is low’s top, or the mean of both tops.'],
    [
      'Running median by sorting each time',
      'O(n log n) per value',
      'Re-sorting the prefix wastes the work already done.',
    ],
    [
      'K closest of n points',
      'O(n log k)',
      'One comparison per point and a sift of O(log k) when it enters.',
    ],
    [
      'Memory',
      'O(n) for the median, O(k) for k closest',
      'The two halves hold every value; the k-heap only the winners.',
    ],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Run the stream 5, 15, 1, 3. What is the median after the fourth value?',
      answer: 4,
      hints: [
        'After four values the halves have two each, so the median is the mean of both tops.',
        'Low holds 1 and 3, high holds 5 and 15.',
      ],
      solution:
        'Sorted the values are 1, 3, 5, 15. Low’s top is 3 and high’s top is 5: (3 + 5) / 2 = 4.',
    },
    {
      type: 'number',
      prompt: 'Run the stream 2, 8, 4, 6, 10. Which value sits at the root of low at the end?',
      answer: 6,
      hints: ['Low holds the smaller three of five values, and it is a max-heap.'],
      solution:
        'Sorted: 2, 4, 6, 8, 10. Low holds 2, 4 and 6 with 6 on top, which is also the median; high holds 8 and 10.',
    },
    {
      type: 'number',
      prompt: 'Run the stream 1, 2, 3, 4, 5. How many values move between the halves?',
      answer: 2,
      unit: 'moves',
      hints: [
        'Every value larger than low’s top goes into high. Check the sizes after each one.',
        'After 3, high holds 2 and 3 while low holds only 1.',
      ],
      solution:
        '1 → low. 2 → high (sizes 1, 1). 3 → high, which now holds more, so 2 moves to low. 4 → high (2, 2). 5 → high, so 3 moves to low. Two moves.',
    },
    {
      type: 'multi',
      prompt:
        'Points A (1, 2), B (3, 1), C (−2, −2), D (0, 1), E (2, −3). Which are the 2 closest to the origin?',
      options: ['A', 'B', 'C', 'D', 'E'],
      answers: [0, 3],
      hints: ['Compute x² + y² for each point: A is 1 + 4 = 5.'],
      solution:
        'Squared distances: A 5, B 10, C 8, D 1, E 13. The two smallest are D (1) and A (5).',
    },
    {
      type: 'number',
      prompt: 'For the same five points with k = 2, how many points replace the heap’s root?',
      answer: 2,
      unit: 'points',
      hints: [
        'A and B fill the heap; the root is B with 10.',
        'Then compare C (8), D (1) and E (13) with the root each time.',
      ],
      solution:
        'C: 8 < 10 replaces B (root becomes C with 8). D: 1 < 8 replaces C (root A with 5). E: 13 ≥ 5 is rejected. Two replacements.',
    },
    {
      type: 'choice',
      prompt: 'Why does k closest keep a max-heap rather than a min-heap?',
      options: [
        'A max-heap is faster to build.',
        'The root must be the farthest kept point, the one a newcomer has to beat.',
        'A min-heap cannot hold points.',
        'The answer must come out from far to near.',
      ],
      answer: 1,
      hints: ['When a new point arrives, which kept point might it push out?'],
      solution:
        'A new point can only displace the farthest of the k kept points. A max-heap by distance puts exactly that point at the root, so one comparison decides and one sift repairs.',
    },
  ],
  nextTeaser:
    'Next up: graph representations, storing the same graph as an adjacency matrix or as adjacency lists.',
};
