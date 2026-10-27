/** @typedef {import('$lib/algo-engine/union-by-rank-path-compression.js').RankFrame} RankFrame */
/** @typedef {import('$lib/algo-engine/union-by-rank-path-compression.js').RankOp} RankOp */

/** @param {number} k */
const links = (k) => `${k} ${k === 1 ? 'link' : 'links'}`;

export const en = {
  slug: 'union-by-rank-path-compression',
  topic: 'union-find',
  level: 'Intermediate',
  title: 'Union by rank and path compression',
  intro:
    'A plain union-find forest can grow into a long chain, and then every find climbs all of it. Two small changes fix this: union by rank hangs the shorter tree under the taller one, and path compression points every element a find walks past straight at the root. Together they make each operation cost α(n), the inverse Ackermann function, which is at most 4 for any input that fits in our universe.',
  summary:
    'Turn union by rank and path compression on and off, watch a tall chain flatten, and compare the find cost of all four settings on the same operations.',
  instruction:
    'Pick a union rule and switch path compression on or off, then step through. The Chain preset builds a nine-link path with plain unions; watch find(0) climb it and then flatten it. Click a node, or focus it and press Enter, to run find on it. The table runs the same log under all four settings.',
  ruleLabel: 'Union rule',
  rules: { plain: 'Plain', rank: 'By rank' },
  compressLabel: 'Path compression',
  compressOptions: { off: 'Off', on: 'On' },
  aLabel: 'a',
  bLabel: 'b',
  union: 'Union',
  find: 'Find a',
  undo: 'Undo last',
  reset: 'Reset',
  presetLabel: 'Preset',
  presetPlaceholder: 'Load a preset…',
  presets: { chain: 'Chain', mixed: 'Mixed', random: 'Random' },
  opsTitle: 'Operations',
  opsEmpty: 'none yet',
  opsHotLabel: 'running now',
  /** @param {RankOp} op */
  opChip: (op) => (op.type === 'find' ? `find(${op.a})` : `union(${op.a}, ${op.b})`),
  /** @param {number} r */
  rankNote: (r) => `r${r}`,
  stats: {
    opSteps: 'Links followed (this operation)',
    steps: 'Links followed (total)',
    height: 'Tallest tree (links)',
    writes: 'Entries re-pointed by compression',
  },
  compareTitle: 'The same log under each setting',
  compareHead: ['Setting', 'Links followed', 'Tallest tree'],
  variants: {
    plain: 'Plain, no compression',
    rank: 'By rank only',
    compress: 'Compression only',
    both: 'Both',
  },
  shownLabel: '(shown)',
  logFull: 'The log is full (16 operations). Undo or reset to continue.',
  elementError: 'Elements must be whole numbers from 0 to 9.',
  legend: {
    current: 'Find is here',
    climbed: 'Climbed through',
    root: 'Root',
    moved: 'Re-pointed at the root',
    linked: 'Just hung under the other root',
    operand: 'Operand a or b, not visited yet',
    rank: 'r = rank (when union by rank is on)',
  },
  markers: { current: '?', climbed: '↑', root: '✓', moved: '*', linked: '↓' },
  /** @param {RankFrame} f @param {boolean} compress */
  describe(f, compress) {
    const op = f.op;
    const start = f.path[0];
    const r = f.path.at(-1) ?? -1;
    const prev = f.path.length > 1 ? f.path[f.path.length - 2] : f.current;
    switch (f.kind) {
      case 'start':
        return `Every element is its own root with rank 0. ${f.sets} sets.`;
      case 'visit':
        return op?.type === 'find'
          ? `find(${start}): start at ${start}.`
          : `Find the root of ${f.side} = ${start}: start at ${start}.`;
      case 'climb':
        return `parent[${prev}] = ${f.current}, so climb to ${f.current}.`;
      case 'root':
        return `parent[${r}] = ${r}: ${r} is the root, reached after ${links(f.path.length - 1)}.${
          compress && f.path.length > 2 ? ' Now compress the path.' : ''
        }`;
      case 'compress': {
        const old = f.path[f.path.indexOf(f.current) + 1];
        return `Path compression: ${f.current} pointed at ${old}; now it points straight at the root ${r}.`;
      }
      case 'found':
        if (compress && f.moved.length > 0)
          return `Every element on the path now points at ${r}, so the next find from here climbs 1 link. Return ${r}.`;
        if (compress) return `The path is already flat, so nothing moves. Return ${r}.`;
        return `Return ${r}. Without compression the path stays as it was, so the walk from ${start} keeps all ${links(f.path.length - 1)}.`;
      case 'same-set':
        return `Both roots are ${f.ra}: ${op?.a} and ${op?.b} are already in the same set.`;
      case 'swap':
        return `a’s root ${f.rb} has rank ${f.rank[f.rb]}, less than rank ${f.rank[f.ra]} of b’s root ${f.ra}, so swap them: the lower-ranked ${f.rb} will go under ${f.ra}.`;
      case 'link':
        return `Set parent[${f.rb}] = ${f.ra}. Two sets became one: ${f.sets} ${f.sets === 1 ? 'set remains' : 'sets remain'}.`;
      case 'rank-up':
        return `The ranks were equal, so the merged tree may be one level taller: rank[${f.ra}] becomes ${f.rank[f.ra]}.`;
      case 'done':
        return `Done: ${f.sets} ${f.sets === 1 ? 'set' : 'sets'}, tallest tree ${links(f.height)}, ${links(f.steps)} followed and ${f.writes} ${f.writes === 1 ? 'entry' : 'entries'} re-pointed.`;
    }
  },
  takeaways: [
    'Union by rank: each root keeps a rank, an upper bound on its tree’s height. The root with the smaller rank goes under the other; only a tie makes the new root’s rank grow by one.',
    'A tree whose root has rank r holds at least 2^r elements, so rank, and with it the height, never exceeds log₂ n. Every find is O(log n) even without compression.',
    'Path compression: once find reaches the root, it points every element it walked past straight at the root. The work is paid once; later finds from that path climb one link.',
    'With both, any sequence of m operations on n elements costs O(m α(n)), where α is the inverse Ackermann function. α(n) ≤ 4 for every practical n, so each operation is constant time in practice. Compression may shorten a tree; ranks are left as they are, as upper bounds.',
    'Try “Chain” with the plain rule: compare 17 links with compression off and 10 with it on, then switch to By rank and watch the chain never form.',
  ],
  complexityHead: ['Setting', 'Cost per operation', 'Why'],
  complexity: [
    ['Plain union, no compression', 'O(n) worst', 'Unlucky unions build a chain of n − 1 links.'],
    ['Union by rank only', 'O(log n)', 'Rank r needs at least 2^r elements, so height ≤ log₂ n.'],
    [
      'Path compression only',
      'O(log n) amortized',
      'Long walks flatten what they touch, so they cannot repeat often.',
    ],
    [
      'Rank and compression',
      'O(α(n)) amortized',
      'Tarjan’s bound; α(n) ≤ 4 for any n that fits in memory.',
    ],
    ['Memory', 'O(n)', 'A parent and a rank per element.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load Chain with the plain rule and path compression on. How many links does the second find, find(1), climb?',
      answer: 1,
      unit: 'links',
      hints: [
        'The first find(0) climbs the whole chain. What does compression do to every element it passed?',
      ],
      solution:
        'find(0) re-points 0 to 7 straight at the root 9 (8 already pointed there). So find(1) climbs a single link, instead of 8 without compression.',
    },
    {
      type: 'number',
      prompt:
        'Load Mixed. How many links do all its operations follow with the plain rule and no compression?',
      answer: 13,
      unit: 'links',
      hints: ['Read the table: the first row runs the log with both heuristics off.'],
      solution:
        'The plain forest grows a four-link path 3 → 2 → 0 → 4 → 8, and the finds climb 13 links in total. With both heuristics the same log costs 8.',
    },
    {
      type: 'number',
      prompt: 'With union by rank, what is the largest rank any root can reach on our 10 elements?',
      answer: 3,
      hints: [
        'A root of rank r has at least 2^r elements in its tree.',
        'Find the largest r with 2^r ≤ 10.',
      ],
      solution:
        'Rank r needs at least 2^r elements, and 2^3 = 8 ≤ 10 < 16 = 2^4. So the rank, and the height, stay at most 3. Mixed reaches it: root 4 ends with rank 3.',
    },
    {
      type: 'text',
      prompt:
        'With both heuristics, a sequence of m operations costs O(m · f(n)). Name f, the function that grows so slowly it is at most 4 in practice.',
      accept: [
        'α(n)',
        'alpha(n)',
        'α',
        'alpha',
        'inverse Ackermann',
        'inverse Ackermann function',
        'the inverse Ackermann function',
      ],
      hints: ['It is the inverse of a famous function that grows faster than any tower of powers.'],
      solution:
        'The inverse Ackermann function α(n). Tarjan proved the O(m α(n)) bound, and it is tight for this structure.',
    },
  ],
  nextTeaser:
    'Next up: Practice: union-find problems, where an edge stream counts components online and flags the edge that closes a cycle.',
};
