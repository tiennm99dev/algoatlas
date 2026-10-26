/** @typedef {import('$lib/algo-engine/counting-radix-sort.js').CountingFrame} CountingFrame */
/** @typedef {import('$lib/algo-engine/counting-radix-sort.js').RadixFrame} RadixFrame */

/** @param {number} place */
const placeName = (place) => ({ 1: 'ones', 10: 'tens', 100: 'hundreds' })[place] ?? `${place}s`;

export const en = {
  slug: 'counting-radix-sort',
  topic: 'sorting',
  level: 'Intermediate',
  title: 'Counting sort and radix sort',
  intro:
    'When keys are small whole numbers, you can sort without comparing them at all. Counting sort counts how often each key appears and works out where each key’s block starts. Radix sort applies a stable pass to one digit at a time, from the ones digit up. Both run in linear time when the keys are short.',
  summary:
    'Step through counting sort’s tallies and running sums, then watch radix sort fill digit buckets pass by pass, all without comparing two keys.',
  instruction:
    'Pick an algorithm, type keys or press Random, then step through. For counting sort, watch the count row turn from tallies into end positions. For radix sort, watch each number drop into the bucket of the underlined digit.',
  algorithmLabel: 'Algorithm',
  algorithms: { counting: 'Counting sort', radix: 'Radix sort' },
  keysLabel: { counting: 'Keys (0 to 9)', radix: 'Keys (0 to 999)' },
  randomButton: 'Random',
  keyErrors: {
    format: 'Type whole numbers separated by commas or spaces, for example 2, 5, 3.',
    range: {
      counting: 'Counting sort here takes keys from 0 to 9.',
      radix: 'Every key must be from 0 to 999.',
    },
    count: 'Type from 2 to 12 keys.',
  },
  inputTitle: 'Input a',
  countTitle: 'count, indexed by key',
  outputTitle: 'Output out',
  arrayTitle: 'Array a',
  bucketsTitle: 'Buckets by digit',
  /** @param {number} place */
  digitNote: (place) =>
    place ? `The ${placeName(place)} digit is underlined; it picks the bucket.` : '',
  inputAria: 'Input array a',
  countAria: 'Count array, one cell per key',
  outputAria: 'Output array',
  arrayAria: 'Array a',
  /** @param {number} d @param {number[]} values */
  bucketAria: (d, values) => `Bucket ${d}: ${values.length === 0 ? 'empty' : values.join(', ')}`,
  tagNote: 'Letters a, b, c tell equal keys apart by input order.',
  stats: {
    steps: 'Loop steps',
    budget: 'n + k + n',
    passes: 'Passes',
    moves: 'Moves',
    perPass: 'n per pass, in and out',
  },
  legend: {
    read: 'Being read',
    write: 'Just written',
    done: 'Placed',
    drop: 'Being dropped (marker: its digit)',
    dropped: 'Already in a bucket',
    arrived: 'Just collected or dropped',
    sorted: 'Sorted',
  },
  markers: { read: '?', write: '⇄', done: '✓' },
  states: {
    read: 'being read',
    write: 'just written',
    done: 'placed',
    dropped: 'already in a bucket',
    sorted: 'sorted',
  },
  /** @param {number} i @param {string} value @param {string} state */
  cellLabel: (i, value, state) =>
    `Slot ${i}: ${value === '' ? 'empty' : value}${state ? `, ${state}` : ''}`,
  /**
   * @param {CountingFrame} f
   * @param {(id: number) => string} tag  letter of an item among equal keys
   */
  describeCounting(f, tag) {
    const k = f.count.length - 1;
    switch (f.kind) {
      case 'start':
        return `The largest key is ${k}, so count has ${k + 1} cells, all 0. No two keys are ever compared.`;
      case 'count':
        return `a[${f.i}] = ${f.v}: add one to count[${f.v}], which is now ${f.count[f.v]}.`;
      case 'prefix':
        return `count[${f.v}] += count[${f.v - 1}]: ${f.count[f.v]} keys are ≤ ${f.v}, so the block of ${f.v}s ends just before slot ${f.count[f.v]}.`;
      case 'place': {
        const item = f.input[f.i];
        return `a[${f.i}] = ${item.value}${tag(item.id)}: count[${f.v}] drops to ${f.pos}, so it goes to out[${f.pos}], the last free slot of its block.`;
      }
      case 'done':
        return `Sorted in ${f.steps} loop steps: n = ${f.input.length} to count, k = ${k} to sum, n to place. Equal keys kept their input order.`;
    }
  },
  /** @param {RadixFrame} f */
  describeRadix(f) {
    switch (f.kind) {
      case 'start': {
        const max = Math.max(0, ...f.items.map((it) => it.value));
        return `The largest key, ${max}, has ${String(max).length} ${String(max).length === 1 ? 'digit' : 'digits'}, so radix sort makes that many passes, ones digit first.`;
      }
      case 'pass':
        return `Pass ${f.passes}: sort by the ${placeName(f.place)} digit. Start with ten empty buckets.`;
      case 'drop': {
        const x = f.items[f.i].value;
        return `${x} has ${placeName(f.place)} digit ${f.digit}: append it to bucket ${f.digit}.`;
      }
      case 'collect':
        return `Read the buckets 0 to 9 in order back into a. Inside a bucket, numbers keep the order they arrived in, so the earlier digits’ work is not undone.`;
      case 'done':
        return `Sorted in ${f.passes} ${f.passes === 1 ? 'pass' : 'passes'} and ${f.moves} moves, without comparing two keys.`;
    }
  },
  takeaways: [
    'Counting sort uses each key as an array index: count the keys, then a running sum turns count[v] into the end of the block for key v.',
    'Placing items from right to left, each into the last free slot of its block, keeps equal keys in input order: counting sort is stable.',
    'It runs in O(n + k) time and space, where k is the largest key, so it pays off only when k is not much larger than n.',
    'Radix sort runs one stable pass per digit, from the least significant up. With d digits it is O(d·(n + 10)), linear when d is a small constant. It is not limited by the n log n bound, because it never compares two keys.',
    'Try radix sort on 21, 12, 22, 11: after the ones pass the order looks wrong, but the tens pass keeps ties in that order and finishes the job.',
  ],
  complexityHead: ['Algorithm', 'Cost', 'Why'],
  complexity: [
    ['Counting sort, time', 'O(n + k)', 'One pass to count, k steps to sum, one pass to place.'],
    ['Counting sort, memory', 'O(n + k)', 'The count array and a separate output array.'],
    [
      'Radix sort, time',
      'O(d·(n + b))',
      'd digit passes, each touching n items and b = 10 buckets.',
    ],
    ['Radix sort, memory', 'O(n + b)', 'The buckets hold every item once per pass.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Counting sort on 2, 5, 3, 0, 2, 3, 0, 3. After the running-sum loop, what is count[3]?',
      answer: 7,
      hints: [
        'First the tallies: two 0s, no 1s, two 2s, three 3s.',
        'count[3] is the number of keys ≤ 3.',
      ],
      solution:
        'The tallies are 2, 0, 2, 3, 0, 1 for keys 0 to 5. The running sums are 2, 2, 4, 7, 7, 8, so count[3] = 7: seven keys are ≤ 3, and the 3s fill slots 4 to 6.',
    },
    {
      type: 'text',
      prompt:
        'Radix sort on 170, 45, 75, 90, 802, 24, 2, 66. Type the array after the first pass (ones digit), separated by commas.',
      accept: [
        '170, 90, 802, 2, 24, 45, 75, 66',
        '170 90 802 2 24 45 75 66',
        '170,90,802,2,24,45,75,66',
        '[170, 90, 802, 2, 24, 45, 75, 66]',
      ],
      hints: [
        'Bucket 0 gets 170 and 90, bucket 2 gets 802 and 2, in that order.',
        'Then bucket 4 (24), bucket 5 (45, 75) and bucket 6 (66).',
      ],
      solution:
        'By ones digit: bucket 0 holds 170, 90; bucket 2 holds 802, 2; bucket 4 holds 24; bucket 5 holds 45, 75; bucket 6 holds 66. Joined: 170, 90, 802, 2, 24, 45, 75, 66.',
    },
    {
      type: 'number',
      prompt: 'How many passes does radix sort make on 1,000 keys from 0 to 999?',
      answer: 3,
      unit: 'passes',
      hints: ['The number of passes depends on the digits of the largest key, not on n.'],
      solution:
        '999 has three decimal digits, so there are three passes: ones, tens, hundreds. Each pass touches all 1,000 keys.',
    },
    {
      type: 'choice',
      prompt: 'Why must each radix pass be stable?',
      options: [
        'So keys that tie on this digit stay in the order the earlier, lower digits put them in',
        'So the pass uses less memory',
        'So the buckets can be read in any order',
        'Stability does not matter for radix sort',
      ],
      answer: 0,
      hints: ['Think about 21 and 22 in the tens pass: both have tens digit 2.'],
      solution:
        'After the ones pass, 21 is before 22. In the tens pass they tie, and a stable pass keeps 21 first. An unstable pass could swap them and undo the ones pass.',
    },
  ],
  nextTeaser:
    'Next up: sorting applications, where sorting first turns hard problems such as merging intervals into a single scan.',
};
