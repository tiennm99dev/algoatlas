/**
 * Maximum matching in a bipartite graph, two ways.
 *
 * Kuhn's algorithm takes the left vertices one by one and runs try(u): a depth-first search for
 * an augmenting path, which alternates unmatched and matched edges and ends at a free right
 * vertex. A right vertex is visited at most once per search. When the path is found, every edge
 * on it flips (matched becomes unmatched and back), so the matching grows by one. O(V·E).
 *
 * Hopcroft-Karp works in phases. BFS from every free left vertex at once, left to right on any
 * edge and right to left only along a matched edge, gives each left vertex a layer and finds
 * the length of the shortest augmenting paths. DFS then flips a maximal set of vertex-disjoint
 * augmenting paths of exactly that length. Only O(√V) phases are needed, so it runs in O(E·√V).
 * This is Dinic's algorithm on the unit-capacity flow network s → left → right → t.
 *
 * Left vertices are 0..left−1, right vertices 0..right−1; an edge is a pair [l, r].
 */

/** Most vertices on each side. */
export const MAX_SIDE = 6;

/** @typedef {[number, number]} Pair  A left vertex and a right vertex. */
/** @typedef {'kuhn' | 'hk'} MatchMethod */

/**
 * @typedef {object} MatchFrame
 * @property {'start'|'begin'|'look'|'skip'|'follow'|'back'|'flip'|'fail'|'phase'|'stuck'|'blocked'|'none'|'done'} kind
 * @property {number[]} matchL     Right partner of each left vertex, −1 when free.
 * @property {number[]} matchR     Left partner of each right vertex, −1 when free.
 * @property {number} root         Left vertex the current search started from, −1 when none.
 * @property {number} at           Left vertex being expanded, −1 when none.
 * @property {number} right        Right vertex looked at, −1 when none.
 * @property {number[]} path       Alternating path so far: l0, r0, l1, r1, … (on 'flip', the path flipped).
 * @property {boolean[]} visited   Right vertices visited by the current Kuhn search.
 * @property {number[]} layer      Hopcroft-Karp layer of each left vertex, −1 when not reached.
 * @property {number} length       Edges on a shortest augmenting path this phase, 0 when none.
 * @property {number} size         Matched pairs.
 * @property {number} checks       Edges looked at so far.
 * @property {number} phases       Hopcroft-Karp phases that found paths, or Kuhn searches started.
 * @property {number} phasePaths   Paths flipped in the current phase.
 * @property {number[]} lines
 */

export const kuhnPseudocode = [
  'match = none for every vertex',
  'for each left vertex u: clear the visited marks; if try(u): size += 1',
  'try(x):',
  '  for each right neighbour r of x that is not visited:',
  '    mark r visited',
  '    if r is free, or try(match[r]) re-routes its partner:',
  '      match x with r (flips the path); return true',
  '  return false',
];

export const hopcroftKarpPseudocode = [
  'match = none for every vertex',
  'loop (one phase): BFS from all free left vertices at once,',
  '  left → right on any edge, right → left on its matched edge; layer = depth',
  '  if no free right vertex is reached: stop, the matching is maximum',
  '  for each free left vertex u: DFS that only steps down one layer',
  '    if it ends at a free right vertex: flip that path; size += 1',
  '  the paths flipped are vertex-disjoint and all of the shortest length',
  'return match',
];

/**
 * Right neighbours of each left vertex, sorted, without duplicates or out-of-range ends.
 * @param {number} left @param {number} right @param {Pair[]} edges
 */
export function neighbours(left, right, edges) {
  /** @type {Set<number>[]} */
  const sets = Array.from({ length: left }, () => new Set());
  for (const [l, r] of edges) if (l >= 0 && l < left && r >= 0 && r < right) sets[l].add(r);
  return sets.map((s) => [...s].sort((a, b) => a - b));
}

/**
 * @param {{ left: number, right: number, edges: Pair[], method: MatchMethod }} input
 * @returns {MatchFrame[]}
 */
export function matchingTrace({ left, right, edges, method }) {
  const adj = neighbours(left, right, edges);
  const matchL = new Array(left).fill(-1);
  const matchR = new Array(right).fill(-1);
  let visited = new Array(right).fill(false);
  let layer = new Array(left).fill(-1);
  let root = -1;
  let at = -1;
  let r = -1;
  /** @type {number[]} */
  let path = [];
  let length = 0;
  let size = 0;
  let checks = 0;
  let phases = 0;
  let phasePaths = 0;

  /** @type {MatchFrame[]} */
  const frames = [];
  /** @param {MatchFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      matchL: matchL.slice(),
      matchR: matchR.slice(),
      root,
      at,
      right: r,
      path: path.slice(),
      visited: visited.slice(),
      layer: layer.slice(),
      length,
      size,
      checks,
      phases,
      phasePaths,
      lines,
    });

  /** Matches l0–r0, l1–r1, … along an alternating path. @param {number[]} p */
  function flip(p) {
    for (let i = 0; i + 1 < p.length; i += 2) {
      matchL[p[i]] = p[i + 1];
      matchR[p[i + 1]] = p[i];
    }
  }

  push('start', [0]);

  if (method === 'kuhn') {
    /** @param {number} x @returns {boolean} */
    const tryVertex = (x) => {
      for (const y of adj[x]) {
        at = x;
        r = y;
        checks++;
        path.push(y);
        if (visited[y]) {
          push('skip', [3]);
          path.pop();
          continue;
        }
        visited[y] = true;
        if (matchR[y] < 0) {
          push('look', [3, 4, 5]);
          return true;
        }
        push('follow', [3, 4, 5]);
        path.push(matchR[y]);
        if (tryVertex(matchR[y])) return true;
        path.pop();
        path.pop();
      }
      at = x;
      r = -1;
      if (x !== root) push('back', [7]);
      return false;
    };
    for (let u = 0; u < left; u++) {
      root = u;
      at = u;
      r = -1;
      visited = new Array(right).fill(false);
      path = [u];
      phases++;
      push('begin', [1, 2]);
      if (tryVertex(u)) {
        flip(path);
        size++;
        at = -1;
        r = -1;
        push('flip', [6, 1]);
      } else {
        push('fail', [7, 1]);
      }
      path = [];
    }
    root = -1;
    at = -1;
    r = -1;
    push('done', [1]);
    return frames;
  }

  // Hopcroft-Karp.
  for (;;) {
    phases++;
    phasePaths = 0;
    layer = new Array(left).fill(-1);
    /** @type {number[]} */
    const queue = [];
    for (let u = 0; u < left; u++)
      if (matchL[u] < 0) {
        layer[u] = 0;
        queue.push(u);
      }
    let freeAt = -1;
    for (let h = 0; h < queue.length; h++) {
      const u = queue[h];
      if (freeAt >= 0 && layer[u] >= freeAt) break;
      for (const y of adj[u]) {
        checks++;
        const v = matchR[y];
        if (v < 0) {
          if (freeAt < 0) freeAt = layer[u] + 1;
        } else if (layer[v] < 0) {
          layer[v] = layer[u] + 1;
          queue.push(v);
        }
      }
    }
    length = freeAt < 0 ? 0 : 2 * freeAt - 1;
    root = -1;
    at = -1;
    r = -1;
    path = [];
    if (freeAt < 0) {
      phases--;
      push('none', [1, 3]);
      break;
    }
    push('phase', [1, 2]);

    const dead = new Array(left).fill(false);
    /** @param {number} x @returns {boolean} */
    const descend = (x) => {
      for (const y of adj[x]) {
        checks++;
        const v = matchR[y];
        if (v < 0 ? layer[x] + 1 === freeAt : layer[v] === layer[x] + 1 && !dead[v]) {
          path.push(y);
          if (v < 0) return true;
          path.push(v);
          if (descend(v)) return true;
          path.pop();
          path.pop();
        }
      }
      dead[x] = true;
      return false;
    };
    for (let u = 0; u < left; u++) {
      if (matchL[u] >= 0 || layer[u] !== 0) continue;
      root = u;
      path = [u];
      if (descend(u)) {
        flip(path);
        size++;
        phasePaths++;
        push('flip', [4, 5]);
      } else {
        push('stuck', [4]);
      }
    }
    root = -1;
    path = [];
    push('blocked', [6]);
  }
  push('done', [7]);
  return frames;
}
