/**
 * Tarjan's strongly connected components on adjacency lists, with hooks so
 * a lesson's trace can record a frame at each step without re-implementing
 * the low-link bookkeeping. Vertices are tried in index order and their
 * neighbours in list order; components are numbered 1, 2, … in the order
 * they complete, so sinks of the condensation come first.
 */

/**
 * The live state the hooks read: discovery time `tin` (-1 unvisited), the
 * low-link `low`, the component number `comp` (0 until assigned), the stack
 * and who is on it, and how many components are done.
 * @param {number} n
 */
export function sccState(n) {
  return {
    tin: new Array(n).fill(-1),
    low: new Array(n).fill(-1),
    comp: new Array(n).fill(0),
    onStack: new Array(n).fill(false),
    /** @type {number[]} */
    stack: [],
    count: 0,
  };
}

/** @typedef {ReturnType<typeof sccState>} SccState */

/**
 * @template {number | { to: number }} T
 * @typedef {object} TarjanHooks
 * @property {(u: number, top: boolean) => void} [enter] u got its time and went on the stack; `top` when it starts a new search
 * @property {(u: number, arc: T, kind: 'tree' | 'stack' | 'done') => void} [edge] an arc is looked at: `tree` before the call into an unvisited end, `stack` after lowering low[u] by an end still on the stack, `done` for an end already in a component
 * @property {(u: number, arc: T) => void} [back] the call along a tree arc returned and low[u] took the child's low
 * @property {(u: number, popped: number[]) => void} [root] u closed a component; `popped` its vertices in pop order
 * @property {(u: number) => void} [keep] u finished but stays on the stack for an earlier root
 */

/**
 * Runs Tarjan's algorithm over every vertex.
 * @template {number | { to: number }} T
 * @param {T[][]} out arcs out of each vertex: plain ends or `{ to }` objects
 * @param {TarjanHooks<T>} [hooks]
 * @param {SccState} [s] state to fill, so the hooks can read it as it changes
 * @returns {SccState}
 */
export function tarjanScc(out, hooks = {}, s = sccState(out.length)) {
  let time = 0;
  const end = (/** @type {T} */ arc) => (typeof arc === 'number' ? arc : arc.to);

  /** @param {number} u @param {boolean} top */
  function connect(u, top) {
    s.tin[u] = s.low[u] = time++;
    s.stack.push(u);
    s.onStack[u] = true;
    hooks.enter?.(u, top);
    for (const arc of out[u]) {
      const v = end(arc);
      if (s.tin[v] === -1) {
        hooks.edge?.(u, arc, 'tree');
        connect(v, false);
        s.low[u] = Math.min(s.low[u], s.low[v]);
        hooks.back?.(u, arc);
      } else if (s.onStack[v]) {
        s.low[u] = Math.min(s.low[u], s.tin[v]);
        hooks.edge?.(u, arc, 'stack');
      } else {
        hooks.edge?.(u, arc, 'done');
      }
    }
    if (s.low[u] !== s.tin[u]) {
      hooks.keep?.(u);
      return;
    }
    s.count++;
    /** @type {number[]} */
    const popped = [];
    let w;
    do {
      w = /** @type {number} */ (s.stack.pop());
      s.onStack[w] = false;
      s.comp[w] = s.count;
      popped.push(w);
    } while (w !== u);
    hooks.root?.(u, popped);
  }

  for (let v = 0; v < out.length; v++) if (s.tin[v] === -1) connect(v, true);
  return s;
}
