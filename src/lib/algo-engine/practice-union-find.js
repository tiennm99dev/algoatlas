/**
 * Edges of an undirected graph arrive one at a time. A union-find (union by size, path
 * compression) keeps the components current: an edge whose ends already share a root closes a
 * cycle and is flagged; any other edge merges two components into one. Vertices are 0 … n − 1.
 */

export const N = 8;
export const MAX_EDGES = 16;

export const streamPseudocode = [
  'components = n; every vertex is its own set',
  'for each edge (u, v), in arrival order:',
  '  ru = find(u); rv = find(v)',
  '  if ru == rv: u and v are already connected, so (u, v) closes a cycle',
  '  else: union(ru, rv); components = components − 1',
  'report the components and the flagged edges',
];

/** @typedef {[number, number]} Edge */

/**
 * @typedef {object} StreamFrame
 * @property {'start'|'take'|'cycle'|'merge'|'done'} kind
 * @property {number} edgeIndex  Edge being processed, -1 for start and done.
 * @property {('pending'|'tree'|'cycle')[]} status  Per edge: not processed yet, joined two components, or closed a cycle.
 * @property {number[]} parent
 * @property {number[]} comp     Per vertex: the smallest vertex of its component, a stable component name.
 * @property {number[]} root     Per vertex: the root of its tree in the union-find forest.
 * @property {number} ru
 * @property {number} rv
 * @property {number} components
 * @property {number[]} history  Components after each processed edge.
 * @property {number} cycles
 * @property {number} firstCycle  Index of the first edge that closed a cycle, -1 if none yet.
 * @property {number} links       Parent links followed by every find so far.
 * @property {number[]} lines
 */

/**
 * @param {Edge[]} edges
 * @param {number} [n]
 * @returns {StreamFrame[]}
 */
export function streamTrace(edges, n = N) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);
  /** @type {StreamFrame['status']} */
  const status = edges.map(() => 'pending');
  /** @type {number[]} */
  const history = [];
  let components = n;
  let cycles = 0;
  let firstCycle = -1;
  let links = 0;
  let ru = -1;
  let rv = -1;
  /** @type {StreamFrame[]} */
  const frames = [];

  /** @param {number} x */
  function find(x) {
    let r = x;
    while (parent[r] !== r) {
      r = parent[r];
      links++;
    }
    while (parent[x] !== r) {
      const next = parent[x];
      parent[x] = r;
      x = next;
    }
    return r;
  }

  /** @param {StreamFrame['kind']} kind @param {number} edgeIndex @param {number[]} lines */
  function push(kind, edgeIndex, lines) {
    const root = parent.map((_, i) => {
      let r = i;
      while (parent[r] !== r) r = parent[r];
      return r;
    });
    /** @type {number[]} */
    const smallest = new Array(n).fill(n);
    root.forEach((r, i) => (smallest[r] = Math.min(smallest[r], i)));
    frames.push({
      kind,
      edgeIndex,
      status: status.slice(),
      parent: parent.slice(),
      comp: root.map((r) => smallest[r]),
      root,
      ru,
      rv,
      components,
      history: history.slice(),
      cycles,
      firstCycle,
      links,
      lines: lines.slice(),
    });
  }

  push('start', -1, [0]);
  edges.forEach(([u, v], i) => {
    ru = find(u);
    rv = find(v);
    push('take', i, [1, 2]);
    if (ru === rv) {
      status[i] = 'cycle';
      cycles++;
      if (firstCycle < 0) firstCycle = i;
      history.push(components);
      push('cycle', i, [3]);
      return;
    }
    // Union by size: the smaller tree goes under the larger root.
    const [big, small] = size[ru] >= size[rv] ? [ru, rv] : [rv, ru];
    parent[small] = big;
    size[big] += size[small];
    components--;
    status[i] = 'tree';
    history.push(components);
    push('merge', i, [4]);
  });
  ru = -1;
  rv = -1;
  push('done', -1, [5]);
  return frames;
}

/**
 * @param {'roads'|'tree'|'random'} preset
 * @param {() => number} [rand]
 * @returns {Edge[]}
 */
export function makeEdges(preset, rand = Math.random) {
  if (preset === 'roads') {
    return [
      [0, 1],
      [2, 3],
      [1, 2],
      [0, 3],
      [4, 5],
      [5, 6],
      [6, 4],
      [3, 4],
      [1, 5],
    ];
  }
  if (preset === 'tree') {
    return [
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
      [4, 5],
      [6, 7],
      [5, 6],
    ];
  }
  /** @type {Edge[]} */
  const out = [];
  const seen = new Set();
  for (let tries = 0; out.length < 10 && tries < 1000; tries++) {
    const u = Math.floor(rand() * N);
    const v = Math.floor(rand() * N);
    const key = `${Math.min(u, v)}-${Math.max(u, v)}`;
    if (u === v || seen.has(key)) continue;
    seen.add(key);
    out.push([u, v]);
  }
  return out;
}

/** @param {Edge[]} edges @param {number} u @param {number} v */
export function hasEdge(edges, u, v) {
  return edges.some(([a, b]) => (a === u && b === v) || (a === v && b === u));
}
