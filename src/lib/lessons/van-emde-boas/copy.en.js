/** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebFrame} VebFrame */
/** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebOp} VebOp */
/** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebOpType} VebOpType */

/** @param {number} k @param {string} one @param {string} many */
const count = (k, one, many) => `${k} ${k === 1 ? one : many}`;

export const en = {
  slug: 'van-emde-boas',
  topic: 'advanced-heaps',
  level: 'Advanced',
  title: 'van Emde Boas trees',
  intro:
    'When the keys are integers from a fixed universe {0, 1, …, u − 1}, a van Emde Boas tree beats every comparison-based structure. It splits the universe into √u clusters of √u keys, plus a summary that says which clusters hold anything, and does the same inside each of them. Each operation recurses into only one structure of size √u, so insert, delete, successor, min and max take O(log log u) time.',
  summary:
    'Insert, delete and successor queries on a van Emde Boas tree over 16 or 256 keys, with the universe split into clusters and a summary and each call traced level by level.',
  instruction:
    'Type a key and press Insert, Delete or Successor (Enter inserts). Step through and watch the call go down one level at a time: V is the whole tree, V.S its summary, V.3 its cluster 3, and V.3.S the summary inside that cluster. Switch the universe to 256 to see one more level.',
  universeLabel: 'Universe u',
  /** @param {number} u */
  universeOption: (u) => `u = ${u}`,
  valueLabel: 'Key x',
  ops: { insert: 'Insert', delete: 'Delete', successor: 'Successor' },
  undo: 'Undo',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: {
    clrs: 'u = 16: {2, 3, 4, 5, 7, 14, 15}',
    deletes: 'u = 16: deletes',
    wide: 'u = 256: successors',
    random: 'Random',
  },
  /** @param {number} u */
  valueError: (u) => `Type a whole number from 0 to ${u - 1}.`,
  full: 'The set holds at most 12 keys here. Delete one first.',
  /** @param {number} x */
  presentError: (x) => `${x} is already in the set: a vEB tree stores each key once.`,
  /** @param {number} x */
  absentError: (x) => `${x} is not in the set, so there is nothing to delete.`,
  logFull: 'The log holds 16 operations. Undo or reset to try more.',
  gridTitle: 'The universe, one row per cluster',
  /** @param {number} u @param {number[]} set */
  gridAria: (u, set) =>
    `Universe of ${u} keys in ${Math.sqrt(u)} clusters of ${Math.sqrt(u)}; stored: ${set.length ? set.join(', ') : 'none'}.`,
  /** @param {number} key @param {number} bit @param {string} state */
  cellLabel: (key, bit, state) =>
    [`Key ${key}: ${bit ? 'stored' : 'not stored'}`, state].filter(Boolean).join(', '),
  /** @param {number} c */
  rowHeader: (c) => `c${c}`,
  /** @param {number} x @param {number} u @param {number} high @param {number} low */
  split: (x, u, high, low) => {
    const r = Math.sqrt(u);
    return `x = ${x} in a structure of size ${u}: high(x) = ⌊${x} / ${r}⌋ = ${high}, low(x) = ${x} mod ${r} = ${low}.`;
  },
  /** @param {number} x */
  baseSplit: (x) => `x = ${x} in a structure of size 2: the base case, just min and max.`,
  splitIdle: 'The split of x into high(x) and low(x) appears while an operation runs.',
  treeTitle: 'Recursive structure: summary S and clusters c0, c1, …',
  /** @param {number} n */
  treeAria: (n) => `${count(n, 'structure', 'structures')} drawn; empty ones are left out.`,
  /** @param {number | null} min @param {number | null} max */
  minMax: (min, max) => (min === null ? '∅' : min === max ? `${min}` : `${min}–${max}`),
  /** @param {string} path @param {number} u @param {number | null} min @param {number | null} max @param {string} state */
  structLabel: (path, u, min, max, state) =>
    [
      `${path}, size ${u}`,
      min === null ? 'empty' : min === max ? `holds only ${min}` : `min ${min}, max ${max}`,
      state,
    ]
      .filter(Boolean)
      .join(', '),
  states: { current: 'visited now', open: 'call still open', write: 'min or max just changed' },
  stats: {
    keys: 'Keys stored',
    levels: 'Levels: log₂ log₂ u + 1',
    calls: 'Calls, this operation',
    depth: 'Levels reached',
    total: 'Calls, all operations',
    answer: 'Last successor',
  },
  none: 'none',
  pending: '—',
  stackTitle: 'Open calls (outermost first)',
  stackEmpty: 'none',
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  /** @param {VebOp} op */
  opChip: (op) =>
    op.type === 'insert'
      ? `+${op.value}`
      : op.type === 'delete'
        ? `−${op.value}`
        : `succ ${op.value}`,
  legend: {
    active: 'x itself',
    frontier: 'The keys x stands for at this level',
    sorted: 'The answer',
    visited: 'V.min: kept out of every cluster',
  },
  markers: { active: 'x', frontier: '·', sorted: '✓', visited: '★' },
  structLegend: {
    active: 'Structure visited now',
    frontier: 'A call still open above it',
    swap: 'Its min or max just changed',
  },
  structMarkers: { active: '→', frontier: '↑', swap: '✎' },
  /**
   * @param {VebFrame} f
   */
  describe(f) {
    const r = Math.sqrt(f.u);
    const name = f.path;
    const node = f.nodes.find((n) => n.path === f.path);
    switch (f.kind) {
      case 'start':
        return `A van Emde Boas tree over u = ${f.universe}: ${Math.sqrt(f.universe)} clusters of ${Math.sqrt(f.universe)} keys, a summary, and the same split inside each of them.`;
      case 'present':
        return `${f.x} is already in the set: a vEB tree stores each key once.`;
      case 'absent':
        return `${f.x} is not in the set, so there is nothing to delete.`;
      case 'call':
        return f.u === 2
          ? `${f.op}(${name}, ${f.x}): size 2, the base case, just min and max.`
          : `${f.op}(${name}, ${f.x}) on size ${f.u}: high(${f.x}) = ${f.high}, low(${f.x}) = ${f.low}.`;
      case 'empty-insert':
        return `${name} was empty: set min = max = ${f.x}. Nothing goes into a cluster, so this costs O(1).`;
      case 'swap-min':
        return `${f.x} < min ${f.result}: ${f.x} becomes the min of ${name}, and the old min ${f.result} is inserted below in its place.`;
      case 'cluster-empty':
        return `Cluster ${f.high} is empty: first record ${f.high} in the summary.`;
      case 'fill-cluster':
        return `Then cluster ${f.high} gets min = max = ${f.low} in O(1), so only the summary call did real work.`;
      case 'into-cluster':
        return `Cluster ${f.high} already holds keys: insert low = ${f.low} into it. The summary stays as it is.`;
      case 'set-max':
        return `${f.x} is larger than the max: the new max of ${name} is ${f.x}.`;
      case 'base':
        return f.result === null
          ? `Size 2: nothing above ${f.x} here, so no successor in ${name}.`
          : `Size 2: x = 0 and max = 1, so the successor is 1.`;
      case 'min-shortcut':
        return `${f.x} < min = ${f.result}: the min is the successor, with no call below.`;
      case 'in-cluster':
        return `max(cluster ${f.high}) is above low = ${f.low}: the successor is inside cluster ${f.high}. One call down.`;
      case 'to-summary':
        return `Cluster ${f.high} has nothing after ${f.low}: ask the summary for the next non-empty cluster after ${f.high}.`;
      case 'no-succ':
        return `No later cluster holds a key: ${f.x} has no successor in ${name}.`;
      case 'combine': {
        const result = /** @type {number} */ (f.result);
        const h = Math.floor(result / r);
        const off = result % r;
        return f.lines[0] === 12
          ? `index(${h}, ${off}) = ${h}·${r} + ${off} = ${result}: the successor in ${name}.`
          : `The next cluster with keys is ${h}, and its min is ${off}: index(${h}, ${off}) = ${h}·${r} + ${off} = ${result}.`;
      }
      case 'answer':
        if (f.op === 'successor')
          return `successor(${f.x}) = ${f.result === null ? 'none' : f.result}, after ${count(f.calls, 'call', 'calls')} on ${count(f.depth, 'level', 'levels')}.`;
        return `${f.op === 'insert' ? 'Inserted' : 'Deleted'} ${f.x}: ${count(f.calls, 'call', 'calls')} on ${count(f.depth, 'level', 'levels')}.`;
      case 'del-only':
        return `${name} holds only ${f.x}: clear its min and max in O(1).`;
      case 'del-base':
        return `Size 2 holding both 0 and 1: delete ${f.x}, leaving ${1 - f.x}.`;
      case 'del-min':
        return `${name}’s min is going: the next smallest key, ${f.x} (the min of the summary’s first cluster), becomes the min. Delete ${f.x} from its cluster instead.`;
      case 'del-into':
        return `Delete low = ${f.low} from cluster ${f.high}.`;
      case 'del-summary':
        return `Cluster ${f.high} is now empty: remove ${f.high} from the summary too. The cluster held one key, so that call was O(1).`;
      case 'del-max':
        return `${f.x} was the max of ${name}: the new max is ${node?.max ?? 'its min'}.`;
      case 'done':
        return `All operations done: ${count(f.totalCalls, 'call', 'calls')} in all.`;
    }
  },
  takeaways: [
    'A vEB tree works on integer keys from {0, …, u − 1}. Key x lives in cluster high(x) = ⌊x / √u⌋ at place low(x) = x mod √u, and index(h, l) = h·√u + l puts it back together.',
    'The summary is itself a vEB tree of size √u that records which clusters hold keys, so “the next non-empty cluster” is one successor query on it.',
    'Keeping min and max at every level, and the min out of the clusters, means every operation makes only one call that does real work: inserting into an empty cluster or deleting its last key is O(1).',
    'Each level takes a square root, u → √u → u^(1/4) → … → 2, so there are log₂ log₂ u levels and every operation costs O(log log u). The price is memory: O(u), however few keys are stored.',
    'Try it: ask successor(120) in u = 256 and count the levels, then ask a successor in u = 16. Squaring the universe adds just one level.',
  ],
  complexityHead: ['Operation', 'Cost', 'Why'],
  complexity: [
    ['Min, max', 'O(1)', 'Stored in the top structure.'],
    [
      'Insert, delete',
      'O(log log u)',
      'At most one call that does real work per level; the other call meets an empty or one-key structure, which costs O(1).',
    ],
    [
      'Successor, predecessor',
      'O(log log u)',
      'Either one call into the cluster or one into the summary, never both: T(u) = T(√u) + O(1).',
    ],
    ['Member', 'O(log log u)', 'Compare with min and max, then look in one cluster.'],
    [
      'Memory',
      'O(u)',
      'Every cluster and summary exists up front; hashing the non-empty ones brings it down to O(n).',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'text',
      prompt: 'With u = 16, what are high(13) and low(13)? Type them as high, low.',
      accept: ['3, 1', '3,1', '3 1', '(3, 1)'],
      hints: ['√16 = 4: high(x) = ⌊x / 4⌋ and low(x) = x mod 4.'],
      solution:
        'high(13) = ⌊13 / 4⌋ = 3 and low(13) = 13 mod 4 = 1: key 13 is place 1 of cluster 3.',
    },
    {
      type: 'number',
      prompt:
        'Load the u = 16 preset {2, 3, 4, 5, 7, 14, 15}. How many calls does successor(7) make?',
      answer: 3,
      unit: 'calls',
      hints: ['Step to the answer of the last operation and read Calls, this operation.'],
      solution:
        'Cluster 1 has nothing after 7, so successor(V, 7) asks the summary V.S for the cluster after 1, which asks V.S.S, a size-2 base case: 3 calls, one per level, and the answer is 14.',
    },
    {
      type: 'number',
      prompt:
        'How many levels does a vEB tree over u = 2³² = 4,294,967,296 keys have, counting the top one?',
      answer: 6,
      unit: 'levels',
      hints: ['Each level takes a square root: 2³² → 2¹⁶ → 2⁸ → …, down to size 2.'],
      solution:
        'The sizes are 2³², 2¹⁶, 2⁸, 2⁴, 2², 2¹: six levels, that is log₂ log₂ u + 1 = log₂ 32 + 1 = 6.',
    },
    {
      type: 'choice',
      prompt: 'Why does insert into an empty cluster not cost two full recursive calls?',
      options: [
        'Because the summary is never updated',
        'Because an empty cluster only needs min = max = low(x), which is O(1)',
        'Because clusters are hash tables',
        'Because high(x) is always 0',
      ],
      answer: 1,
      hints: ['What does insert do when V.min = nil?'],
      solution:
        'An empty structure takes a key by setting min = max, with no call below. Only the summary insert does real work, so T(u) = T(√u) + O(1) = O(log log u).',
    },
  ],
  nextTeaser:
    'Next up: Practice: advanced heaps, where you weigh binary, Fibonacci and van Emde Boas priority queues against real operation mixes.',
};
