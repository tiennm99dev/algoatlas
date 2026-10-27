/** @typedef {import('$lib/algo-engine/practice-union-find.js').StreamFrame} StreamFrame */
/** @typedef {import('$lib/algo-engine/practice-union-find.js').Edge} Edge */

import { letter } from '$lib/components/graph-editor.js';

/** @param {Edge} e */
const edgeName = ([u, v]) => `${letter(u)}–${letter(v)}`;
/** @param {number} k @param {string} [one] @param {string} [many] */
const plural = (k, one = 'component', many = 'components') => `${k} ${k === 1 ? one : many}`;

export const en = {
  slug: 'practice-union-find',
  topic: 'union-find',
  level: 'Intermediate',
  title: 'Practice: union-find problems',
  intro:
    'Union-find shines when a graph arrives one edge at a time. Each new edge costs two finds: if both ends already share a root, the edge closes a cycle; otherwise a union merges two components. The component count and the first cycle are known after every edge, with no search over the whole graph.',
  summary:
    'Feed an edge stream into union-find, count components online and flag every edge that closes a cycle.',
  instruction:
    'Load a stream or add your own edges with From, To and Add edge, then step through. Vertices are coloured and named by component; dashed grey edges have not arrived yet, dark edges joined two components, and red edges marked ✕ closed a cycle. Undo removes the last edge.',
  fromLabel: 'From',
  toLabel: 'To',
  add: 'Add edge',
  undo: 'Undo last',
  clear: 'Clear',
  presetLabel: 'Stream',
  presetPlaceholder: 'Load a stream…',
  presets: { roads: 'Road network', tree: 'Spanning tree', random: 'Random' },
  letter,
  edgeName,
  streamTitle: 'Edge stream',
  streamEmpty: 'no edges yet',
  historyTitle: 'Components after each edge',
  historyEmpty: 'no edges processed',
  hotLabel: 'current edge',
  /** @param {number} i @param {Edge} e @param {'pending'|'tree'|'cycle'} s */
  streamChip: (i, e, s) =>
    `#${i + 1} ${edgeName(e)}${s === 'tree' ? ' ✓' : s === 'cycle' ? ' ✕' : ''}`,
  /** @param {number} i @param {number} c */
  historyChip: (i, c) => `#${i + 1}: ${c}`,
  stats: {
    components: 'Components',
    accepted: 'Edges that merged',
    cycles: 'Edges that closed a cycle',
    first: 'First cycle edge',
  },
  /** @param {number} i */
  firstCycle: (i) => (i < 0 ? '—' : `#${i + 1}`),
  /** @param {number} c */
  setNote: (c) => `set ${letter(c)}`,
  legend: {
    pending: 'Not arrived yet',
    tree: '✓ Merged two components',
    cycle: '✕ Closed a cycle',
    current: 'Edge being processed',
    component: 'Vertex fill and “set” name: its component',
  },
  /** @param {number} v @param {number} c @param {boolean} current */
  vertexLabel: (v, c, current) =>
    `Vertex ${letter(v)}, in set ${letter(c)}${current ? ', an end of the current edge' : ''}`,
  /** @param {number} i @param {Edge} e @param {'pending'|'tree'|'cycle'} s */
  edgeLabel: (i, e, s) =>
    `Edge #${i + 1} ${edgeName(e)}: ${s === 'pending' ? 'not arrived yet' : s === 'tree' ? 'merged two components' : 'closed a cycle'}`,
  /** @param {number[][]} groups @param {string[]} flagged */
  graphLabel: (groups, flagged) =>
    `${plural(groups.length)}: ${groups.map((g) => `{${g.map(letter).join(', ')}}`).join(', ')}. ${
      flagged.length
        ? `Edges that closed a cycle: ${flagged.join(', ')}.`
        : 'No edge has closed a cycle.'
    }`,
  edits: {
    loop: 'Pick two different vertices: an edge from a vertex to itself is a trivial cycle.',
    repeat: 'That edge is already in the stream.',
    full: 'The stream is full (16 edges). Undo or clear to continue.',
  },
  /** @param {StreamFrame} f @param {Edge[]} edges */
  describe(f, edges) {
    const e = f.edgeIndex >= 0 ? edges[f.edgeIndex] : null;
    const name = e ? `#${f.edgeIndex + 1} ${edgeName(e)}` : '';
    switch (f.kind) {
      case 'start':
        return `${edges.length === 0 ? 'No edges yet.' : `${edges.length} edges will arrive one at a time.`} Every vertex starts alone: ${plural(f.components)}.`;
      case 'take':
        return `Edge ${name}: find(${letter(e?.[0] ?? 0)}) = ${letter(f.ru)}, find(${letter(e?.[1] ?? 0)}) = ${letter(f.rv)}.`;
      case 'cycle':
        return `Same root ${letter(f.ru)}: the ends are already connected, so ${name} closes a cycle. Flag it; still ${plural(f.components)}.`;
      case 'merge':
        return `Different roots: union them. Two components became one: ${plural(f.components)}.`;
      case 'done':
        return `All ${plural(edges.length, 'edge', 'edges')} processed: ${plural(f.components)}, ${plural(f.cycles, 'edge', 'edges')} closed a cycle${
          f.firstCycle >= 0 ? `, the first was #${f.firstCycle + 1}` : ''
        }.`;
    }
  },
  takeaways: [
    'Counting components online: start at n and subtract one for every edge whose ends had different roots. The count is correct after every single edge.',
    'Cycle detection: an edge whose ends already share a root closes a cycle, because a path between them already exists. Kruskal’s algorithm skips exactly these edges.',
    'The accepted edges form a spanning forest. It always has n − c edges, where c is the number of components, so n − 1 edges connect everything without a cycle.',
    'Each edge costs two finds and at most one union, O(α(n)) with both heuristics, instead of a fresh O(V + E) search per edge.',
    'Try “Road network”: step to edge #4 and see why A–D is flagged, then undo edges until no cycle is left.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    [
      'Process m edges on n vertices',
      'O(n + m α(n))',
      'Setup, then two finds and maybe one union per edge.',
    ],
    [
      'Same task, one search per edge',
      'O(m (n + m))',
      'BFS or DFS over the edges so far, for every new edge.',
    ],
    ['Components after each edge', 'O(1) each', 'A counter that drops on every merge.'],
    ['Memory', 'O(n)', 'Parent and size per vertex; edges need not be stored.'],
  ],
  practiceTitle: 'Practice',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'Load Road network and step to the end. How many components are left?',
      answer: 2,
      unit: 'components',
      hints: [
        'Read the Components card on the last step. A vertex with no edges is a component too.',
      ],
      solution: 'A to G end up in one component, and H never gets an edge, so 2 components remain.',
    },
    {
      type: 'number',
      prompt: 'In Road network, which edge number is the first to close a cycle?',
      answer: 4,
      hints: [
        'Step through the stream and watch for the first red edge.',
        'After A–B, C–D and B–C, are A and D already connected?',
      ],
      solution:
        'Edge #4 A–D: the path A–B–C–D already joins its ends, so find(A) and find(D) return the same root.',
    },
    {
      type: 'number',
      prompt: 'In Road network, how many components are there right after edge #6?',
      answer: 3,
      unit: 'components',
      hints: ['The Components after each edge list shows the count after every edge.'],
      solution:
        'Edges #1, #2, #3, #5 and #6 each merged two components, and #4 closed a cycle: 8 − 5 = 3 components, {A, B, C, D}, {E, F, G} and {H}.',
    },
    {
      type: 'number',
      prompt:
        'Rebuild Road network without edge #8 (D–E): load it, undo the last two edges, then add B–F again. How many edges now close a cycle?',
      answer: 2,
      unit: 'edges',
      hints: [
        'Without D–E, is B already connected to F when B–F arrives?',
        'Step to the end and read the Edges that closed a cycle card.',
      ],
      solution:
        'A–D and G–E still close cycles, but B–F now joins {A, B, C, D} and {E, F, G} for the first time, so it merges instead. Whether an edge is flagged depends on the edges before it.',
    },
    {
      type: 'number',
      prompt:
        'A stream on 8 vertices ends with 3 components and no edge ever closed a cycle. How many edges were in it?',
      answer: 5,
      unit: 'edges',
      hints: ['Every accepted edge lowers the component count by exactly one, from 8.'],
      solution:
        'Each accepted edge merges two components, so going from 8 to 3 takes 8 − 3 = 5 edges. Load Spanning tree to see the case of 1 component: 7 edges.',
    },
    {
      type: 'choice',
      prompt:
        'Why use union-find rather than a BFS before each new edge to check whether its ends are connected?',
      options: [
        'BFS gives wrong answers on undirected graphs.',
        'Union-find spends about O(α(n)) per edge, while each BFS may scan the whole graph again.',
        'Union-find also finds the shortest cycle.',
        'Union-find can remove edges later, and BFS cannot.',
      ],
      answer: 1,
      hints: ['Compare the cost per edge of the two approaches.'],
      solution:
        'Both are correct, but a BFS per edge costs O(V + E) each time, while union-find keeps the components up to date for nearly constant time per edge. It cannot delete edges and says nothing about cycle lengths.',
    },
  ],
  nextTeaser:
    'Next up: Cut property and MST basics, where the lightest edge across any cut belongs to a minimum spanning tree, the idea behind Kruskal’s use of union-find.',
};
