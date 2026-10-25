/**
 * Pure editing operations for graph-canvas. Every function returns a new graph and never
 * mutates its input, so a page can keep the graph in `$state.raw` and rebuild its trace from
 * whatever comes back.
 */

/**
 * @typedef {object} GraphNode
 * @property {number} id
 * @property {number} x  Position in the canvas viewBox.
 * @property {number} y
 * @property {string} [label]  Defaults to the id.
 *
 * @typedef {object} GraphEdge
 * @property {number} from
 * @property {number} to
 * @property {number} [weight]
 *
 * @typedef {{ nodes: GraphNode[], edges: GraphEdge[] }} Graph
 *
 * @typedef {{ width: number, height: number, margin: number }} Bounds
 */

/** @param {GraphNode} node */
export function nodeName(node) {
  return node.label ?? String(node.id);
}

/** @param {GraphNode[]} nodes */
export function nextNodeId(nodes) {
  return nodes.reduce((m, n) => Math.max(m, n.id + 1), 0);
}

/**
 * @param {number} v @param {number} lo @param {number} hi
 */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * The first point on a coarse grid, scanned row by row, that keeps `gap` away from every
 * node; null when the canvas is full.
 * @param {GraphNode[]} nodes
 * @param {Bounds} bounds
 * @param {number} gap
 * @returns {{x: number, y: number} | null}
 */
export function freeSpot(nodes, { width, height, margin }, gap) {
  const step = gap;
  for (let y = margin; y <= height - margin; y += step) {
    for (let x = margin; x <= width - margin; x += step) {
      if (nodes.every((n) => Math.hypot(n.x - x, n.y - y) >= gap)) return { x, y };
    }
  }
  return null;
}

/**
 * Adds a node at a free spot (or at `at`, clamped into bounds). Returns null when the graph
 * already has `maxNodes` nodes or no spot is free.
 * @param {Graph} graph
 * @param {Bounds} bounds
 * @param {{ maxNodes: number, gap: number, at?: {x: number, y: number}, label?: string }} options
 * @returns {Graph | null}
 */
export function addNode(graph, bounds, { maxNodes, gap, at, label }) {
  if (graph.nodes.length >= maxNodes) return null;
  const spot = at
    ? {
        x: clamp(at.x, bounds.margin, bounds.width - bounds.margin),
        y: clamp(at.y, bounds.margin, bounds.height - bounds.margin),
      }
    : freeSpot(graph.nodes, bounds, gap);
  if (!spot) return null;
  /** @type {GraphNode} */
  const node = { id: nextNodeId(graph.nodes), ...spot };
  if (label !== undefined) node.label = label;
  return { nodes: [...graph.nodes, node], edges: graph.edges };
}

/**
 * Removes a node and every edge that touches it.
 * @param {Graph} graph
 * @param {number} id
 * @returns {Graph}
 */
export function removeNode(graph, id) {
  return {
    nodes: graph.nodes.filter((n) => n.id !== id),
    edges: graph.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

/**
 * Index of the edge between a and b, or -1. Undirected graphs match either direction.
 * @param {GraphEdge[]} edges
 * @param {number} a
 * @param {number} b
 * @param {boolean} directed
 */
export function findEdge(edges, a, b, directed) {
  return edges.findIndex(
    (e) => (e.from === a && e.to === b) || (!directed && e.from === b && e.to === a),
  );
}

/**
 * Adds the edge a → b, or removes it when it already exists. Self loops are refused (null).
 * @param {Graph} graph
 * @param {number} a
 * @param {number} b
 * @param {{ directed: boolean, weight?: number }} options
 * @returns {{ graph: Graph, added: boolean } | null}
 */
export function toggleEdge(graph, a, b, { directed, weight }) {
  if (a === b) return null;
  const at = findEdge(graph.edges, a, b, directed);
  if (at >= 0) {
    return { graph: { nodes: graph.nodes, edges: graph.edges.toSpliced(at, 1) }, added: false };
  }
  /** @type {GraphEdge} */
  const edge = { from: a, to: b };
  if (weight !== undefined) edge.weight = weight;
  return { graph: { nodes: graph.nodes, edges: [...graph.edges, edge] }, added: true };
}

/**
 * Removes one edge by index.
 * @param {Graph} graph
 * @param {number} index
 * @returns {Graph}
 */
export function removeEdge(graph, index) {
  return { nodes: graph.nodes, edges: graph.edges.toSpliced(index, 1) };
}

/**
 * Moves a node, clamped into bounds.
 * @param {Graph} graph
 * @param {number} id
 * @param {{x: number, y: number}} to
 * @param {Bounds} bounds
 * @returns {Graph}
 */
export function moveNode(graph, id, to, { width, height, margin }) {
  return {
    nodes: graph.nodes.map((n) =>
      n.id === id
        ? {
            ...n,
            x: Math.round(clamp(to.x, margin, width - margin)),
            y: Math.round(clamp(to.y, margin, height - margin)),
          }
        : n,
    ),
    edges: graph.edges,
  };
}

/**
 * Number of edges touching a node (in plus out for directed graphs).
 * @param {GraphEdge[]} edges
 * @param {number} id
 */
export function degree(edges, id) {
  return edges.reduce((d, e) => d + (e.from === id ? 1 : 0) + (e.to === id ? 1 : 0), 0);
}
