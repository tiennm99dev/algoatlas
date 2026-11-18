/** @typedef {import('$lib/algo-engine/practice-advanced-heaps.js').RaceFrame} RaceFrame */
/** @typedef {import('$lib/algo-engine/practice-advanced-heaps.js').Costs} Costs */

/** @param {number} k @param {string} one @param {string} many */
const count = (k, one, many) => `${k.toLocaleString('en-US')} ${k === 1 ? one : many}`;

const NAMES = { binary: 'binary heap', fibonacci: 'Fibonacci heap', veb: 'vEB tree' };

/** @param {number} k */
const num = (k) => k.toLocaleString('en-US');

/** @param {Costs} c */
const costs = (c) => `binary ${num(c.binary)}, Fibonacci ${num(c.fibonacci)}, vEB ${num(c.veb)}`;

/** @param {Costs} c @param {number} k */
const perOp = (c, k) => ({
  binary: c.binary / k,
  fibonacci: c.fibonacci / k,
  veb: c.veb / k,
});

export const vi = {
  slug: 'practice-advanced-heaps',
  topic: 'advanced-heaps',
  level: 'Nâng cao',
  title: 'Luyện tập: heap nâng cao',
  intro:
    'Which priority queue should an algorithm use? It depends on its mix of operations, on how many keys the queue holds, and on whether the keys are small integers. Race a binary heap, a Fibonacci heap and a van Emde Boas tree on Dijkstra’s real queue operations, or on a mix you set, and see which one does the fewest steps.',
  summary:
    'Race a binary heap, a Fibonacci heap and a van Emde Boas tree on Dijkstra’s queue operations or on an operation mix, and pick the right priority queue.',
  instruction:
    'In Dijkstra, move the sliders to change the graph (or press New graph) and step through the run: every insert, extract-min and decrease-key is charged to all three queues. In Operation mix, set the queue size and the operations per round. Change the vEB universe u in both, and press Last step to read the totals.',
  modeLabel: 'Workload',
  modes: { dijkstra: 'Dijkstra', mix: 'Operation mix' },
  verticesLabel: 'Vertices V',
  edgesLabel: 'Edges E',
  weightLabel: 'Largest weight',
  newGraph: 'New graph',
  /** @param {number} seed */
  graphName: (seed) => `Graph #${seed}`,
  sizeLabel: 'Queue size n',
  insertsLabel: 'Inserts per round',
  decreasesLabel: 'Decrease-keys per round',
  extractsLabel: 'Extract-mins per round',
  universeLabel: 'vEB universe u',
  /** @param {number} bits */
  universeOption: (bits) => `2^${bits}`,
  resetSettings: 'Reset settings',
  /** @param {number} bits */
  power: (bits) => `2^${bits} = ${(2 ** bits).toLocaleString('en-US')}`,
  raceTitle: 'Steps so far',
  /** @param {RaceFrame} f */
  raceAria: (f) => `Steps so far: ${costs(f.total)}.`,
  queues: { binary: 'Binary heap', fibonacci: 'Fibonacci heap', veb: 'van Emde Boas tree' },
  /** @param {number} step */
  stepNote: (step) => `+${num(step)} this step`,
  /** @param {number} steps */
  total: (steps) => num(steps),
  leader: '✓ fewest steps',
  noFit: '✗ keys do not fit in u',
  stats: {
    inserts: 'Inserts',
    decreases: 'Decrease-keys',
    extracts: 'Extract-mins',
    size: 'Queue size (largest)',
    maxKey: 'Largest key',
    memory: 'vEB memory: u slots',
  },
  noKeys: '—',
  costTitle: 'Steps per operation at this size',
  /** @param {number} s */
  costCaption: (s) => `Charged with s = ${s.toLocaleString('en-US')} keys in the queue.`,
  costHead: ['Operation', 'Binary', 'Fibonacci', 'vEB'],
  opNames: { insert: 'insert', decrease: 'decrease-key', extract: 'extract-min' },
  modelTitle: 'The cost model',
  model: [
    'Binary heap: ⌊log₂ s⌋ + 1 for every operation, one root-to-leaf path.',
    'Fibonacci heap (amortized): 1 for insert and decrease-key; ⌊log_φ s⌋ + 1 for extract-min.',
    'van Emde Boas tree: log₂ log₂ u + 1 for every operation, but only for integer keys below u.',
  ],
  legend: {
    sorted: 'Fewest steps so far',
    pruned: 'Cannot hold these keys',
  },
  markers: { sorted: '✓', pruned: '✗' },
  /** @param {RaceFrame} f @param {{v: number, e: number}} graph @param {number} bits */
  describe(f, graph, bits) {
    const one = f.batch > 0 ? perOp(f.step, f.batch) : f.step;
    const fit = f.fits
      ? ''
      : ` The vEB tree cannot take part: ${f.mode === 'dijkstra' ? `key ${f.maxKey} is not below u = 2^${bits}` : `n = ${f.size.toLocaleString('en-US')} keys do not fit in u = 2^${bits}`}.`;
    switch (f.kind) {
      case 'start':
        return f.mode === 'dijkstra'
          ? `Dijkstra from vertex 0 on ${count(graph.v, 'vertex', 'vertices')} and ${count(graph.e, 'edge', 'edges')}. Every queue operation is charged to all three queues.`
          : `A queue of n = ${f.size.toLocaleString('en-US')} keys runs 10 rounds of the mix. Every operation is charged to all three queues.`;
      case 'insert':
        if (f.mode === 'mix')
          return `Round ${f.round}: ${count(f.batch, 'insert', 'inserts')}. Each costs ${costs(one)}.${fit}`;
        return f.opIndex === 0
          ? `insert(0, 0): the source enters the queue. Costs: ${costs(f.step)}.`
          : `Vertex ${f.vertex} is reached for the first time: insert it with key ${f.key}. Costs: ${costs(f.step)}.${fit}`;
      case 'decrease':
        if (f.mode === 'mix')
          return `Round ${f.round}: ${count(f.batch, 'decrease-key', 'decrease-keys')}. Each costs ${costs(one)}.${fit}`;
        return `A shorter path to vertex ${f.vertex}: decrease its key to ${f.key}. Costs: ${costs(f.step)}.`;
      case 'extract':
        if (f.mode === 'mix')
          return `Round ${f.round}: ${count(f.batch, 'extract-min', 'extract-mins')}. Each costs ${costs(one)}.${fit}`;
        return `extractMin() returns vertex ${f.vertex}: its distance ${f.key} is final. Costs: ${costs(f.step)}.`;
      case 'done': {
        const all = /** @type {(keyof Costs)[]} */ (['binary', 'fibonacci', 'veb']).filter(
          (k) => k !== 'veb' || f.fits,
        );
        const best = Math.min(...all.map((k) => f.total[k]));
        const win = all
          .filter((k) => f.total[k] === best)
          .map((k) => NAMES[k])
          .join(' and ');
        return `Done: ${count(f.counts.insert, 'insert', 'inserts')}, ${count(f.counts.decrease, 'decrease-key', 'decrease-keys')}, ${count(f.counts.extract, 'extract-min', 'extract-mins')}. Totals: ${costs(f.total)}. Fewest steps: the ${win}.${fit}`;
      }
    }
  },
  takeaways: [
    'Dijkstra does V inserts, V extract-mins and up to E decrease-keys. A binary heap pays log V for each, O((V + E) log V); a Fibonacci heap pays O(1) amortized for the decrease-keys, O(E + V log V), which wins on dense graphs.',
    'A Fibonacci heap’s extract-min costs more than a binary heap’s (the bound log_φ n is about 1.44 log₂ n), so a workload of mostly extract-mins favours the binary heap; in real code its larger constants and pointer chasing widen the gap.',
    'With integer keys below u, a van Emde Boas tree does every operation in O(log log u), which beats log n once the queue is large. It needs the keys to fit in u, and O(u) memory however few keys it holds.',
    'Choose by the workload: a binary heap by default, a Fibonacci (or pairing) heap when decrease-keys dominate, and a vEB tree or a bucket queue for many small integer keys.',
    'Try it: in Operation mix, set n = 2^20 with only inserts and extract-mins, then switch u from 2^32 down to 2^16 and watch the vEB tree drop out.',
  ],
  complexityHead: ['Queue', 'Cost', 'Why'],
  complexity: [
    [
      'Binary heap',
      'O(log n) for each operation',
      'Insert, extract-min and decrease-key each walk one root-to-leaf path.',
    ],
    [
      'Fibonacci heap',
      'O(1) insert and decrease-key, O(log n) extract-min, amortized',
      'Lazy root list, consolidation on extract-min, cascading cuts.',
    ],
    [
      'van Emde Boas tree',
      'O(log log u) for each operation',
      'One real call per level, and there are log₂ log₂ u + 1 levels; integer keys below u only.',
    ],
    [
      'Dijkstra',
      'O((V + E) log V) binary; O(E + V log V) Fibonacci',
      'V inserts and extract-mins, up to E decrease-keys.',
    ],
    [
      'Memory',
      'O(n) heaps; O(u) vEB',
      'A heap stores its keys; a vEB tree has a slot for every key of u.',
    ],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Start from the default settings (Reset settings): Dijkstra on 12 vertices and 40 edges, largest weight 20, Graph #2. How many decrease-keys does the run make?',
      answer: 5,
      unit: 'decrease-keys',
      hints: ['Press Last step and read Decrease-keys.'],
      solution:
        'Only 5 of the 40 edges find a shorter path to a vertex already in the queue; the other relaxations either reach a vertex for the first time (an insert) or do not improve it.',
    },
    {
      type: 'number',
      prompt: 'On the same run, how many steps does the Fibonacci heap take in all?',
      answer: 60,
      unit: 'steps',
      hints: ['Read the Fibonacci heap’s bar at the last step.'],
      solution:
        'Its 12 inserts and 5 decrease-keys cost 1 step each (17), and its 12 extract-mins cost ⌊log_φ s⌋ + 1 each, 43 in all: 60 steps, against 80 for the binary heap.',
    },
    {
      type: 'choice',
      prompt: 'On the same run, set the vEB universe to u = 2^4. What happens?',
      options: [
        'The vEB tree gets faster and wins',
        'The vEB tree drops out: some keys are 16 or more',
        'Nothing changes',
        'The binary heap drops out',
      ],
      answer: 1,
      hints: ['Read Largest key, then compare it with u = 16.'],
      solution:
        'The largest key is the distance 27, and a vEB tree over u = 16 holds only the keys 0 to 15, so it cannot run this Dijkstra. A smaller u means fewer levels, but the keys have to fit.',
    },
    {
      type: 'choice',
      prompt:
        'Switch to Operation mix with n = 2^10, u = 2^16 and 4 inserts, 0 decrease-keys and 4 extract-mins per round. Which queue takes the fewest steps?',
      options: ['Binary heap', 'Fibonacci heap', 'van Emde Boas tree'],
      answer: 2,
      hints: ['Set the sliders, press Last step and look for ✓ fewest steps.'],
      solution:
        'Per round the vEB tree pays 8 × 5 = 40 steps, the Fibonacci heap 4 × 1 + 4 × 15 = 64 and the binary heap 8 × 11 = 88. Over 10 rounds: 400, 640 and 880.',
    },
    {
      type: 'number',
      prompt:
        'Keep n = 2^10 and u = 2^16, and set 0 inserts, 0 decrease-keys and 4 extract-mins per round. How many more steps than the binary heap does the Fibonacci heap take?',
      answer: 160,
      unit: 'steps',
      hints: ['Read both totals at the last step and subtract.'],
      solution:
        'Each extract-min costs the binary heap 11 steps and the Fibonacci heap ⌊log_φ 1024⌋ + 1 = 15. 40 extract-mins: 440 against 600, so 160 more. Extract-heavy work favours the binary heap.',
    },
    {
      type: 'choice',
      prompt:
        'Now set 4 inserts, 20 decrease-keys and 4 extract-mins per round (n = 2^10, u = 2^16). Which queue wins?',
      options: ['Binary heap', 'Fibonacci heap', 'van Emde Boas tree'],
      answer: 1,
      hints: ['Decrease-keys cost the Fibonacci heap 1 step each.'],
      solution:
        'Per round: Fibonacci 4 + 20 + 4 × 15 = 84, vEB 28 × 5 = 140, binary 28 × 11 = 308. Over 10 rounds: 840, 1,400 and 3,080. Many decrease-keys are where Fibonacci heaps shine, as in Dijkstra on a dense graph.',
    },
    {
      type: 'multi',
      prompt: 'Which statements are true?',
      options: [
        'A vEB tree over u = 2^16 cannot hold a queue of n = 2^20 distinct keys',
        'A Fibonacci heap makes every single extract-min fast',
        'Dijkstra with a Fibonacci heap runs in O(E + V log V)',
        'A vEB tree’s memory grows with u, not with the number of keys',
      ],
      answers: [0, 2, 3],
      hints: ['Try n = 2^20 with u = 2^16 in Operation mix.'],
      solution:
        'There are only 2^16 keys below u = 2^16, so 2^20 distinct keys cannot fit. Fibonacci bounds are amortized: one extract-min can consolidate a long root list. Dijkstra pays O(1) per decrease-key and O(log V) per extract-min, so O(E + V log V). A vEB tree reserves room for all of u.',
    },
  ],
  nextTeaser: 'Bài tiếp theo: Thuật toán đa luồng.',
};
