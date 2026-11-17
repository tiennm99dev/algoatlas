/**
 * Leader election by FloodMax in the synchronous model. Every node runs the same code and
 * knows only its own unique identifier (UID), its neighbours and the diameter D of the network.
 * In each round every node first sends, then receives everything its neighbours sent in that
 * round, then updates its state. After D rounds the largest UID has reached every node of the
 * network, and the node whose own UID is the largest declares itself leader.
 *
 * Each node also remembers the neighbour it first heard the largest UID from. The largest UID
 * reaches a node at distance d from the leader exactly in round d, from a neighbour at
 * distance d − 1, so those parent links form a breadth-first search tree rooted at the leader.
 *
 * Two variants: `every` sends the current maximum to every neighbour in every round (2|E|
 * messages per round); `change` sends only in round 1 and after the maximum has changed.
 */
import { arcLists, neighbourLists } from './graph-adjacency.js';

/**
 * @typedef {'every'|'change'} FloodVariant
 * @typedef {{from: number, to: number, value: number}} Message
 */

/**
 * @typedef {object} FloodFrame
 * @property {'start'|'send'|'receive'|'decide'|'done'} kind
 * @property {number} round  The round under way, from 1; 0 before the first.
 * @property {number} rounds  D, the number of rounds every node runs.
 * @property {number[]} max  The largest UID each node has seen.
 * @property {number[]} parent  The neighbour each node first heard its maximum from, or -1.
 * @property {number[]} learned  The round in which each node's maximum last changed (0: its own).
 * @property {number[]} senders  Nodes sending in this round.
 * @property {Message[]} messages  Messages sent in this round.
 * @property {number[]} updated  Nodes whose maximum grew in this round.
 * @property {number} sent  Messages sent so far.
 * @property {number[]} leaders  Nodes that declared themselves leader (decide and done).
 * @property {number[]} lines
 */

export const MAX_NODES = 10;
export const MAX_UID = 99;

/** @param {FloodVariant} variant */
export const floodPseudocode = (variant) => [
  'each node: max = own UID, parent = none',
  'for round = 1 to D:   ▹ D = diameter, known to all',
  variant === 'every'
    ? '  send max to every neighbour'
    : '  if round = 1 or max changed: send max to every neighbour',
  '  m = largest value received this round',
  '  if m > max: max = m, parent = a neighbour that sent m',
  'leader = (max = own UID)',
];

/**
 * Hop distances from `s`, -1 where it cannot reach.
 * @param {number[][]} adj
 * @param {number} s
 */
export function hopDistances(adj, s) {
  const dist = Array(adj.length).fill(-1);
  dist[s] = 0;
  const queue = [s];
  for (let h = 0; h < queue.length; h++) {
    const u = queue[h];
    for (const v of adj[u]) {
      if (dist[v] < 0) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return dist;
}

/**
 * The diameter: the largest hop distance between two nodes that can reach each other.
 * @param {number[][]} adj
 */
export function diameter(adj) {
  let d = 0;
  for (let s = 0; s < adj.length; s++) d = Math.max(d, ...hopDistances(adj, s));
  return d;
}

/**
 * @param {{ids: number[], edges: {from: number, to: number}[], uids: number[]}} graph
 *   `uids[i]` belongs to the i-th smallest id.
 * @returns {number[][]}
 */
export const neighboursOf = (graph) => neighbourLists(arcLists(graph.ids, graph.edges, false).out);

/**
 * The trace of FloodMax: per round one frame for the sends and one for the updates.
 * @param {{ids: number[], edges: {from: number, to: number}[], uids: number[]}} graph
 * @param {FloodVariant} variant
 * @returns {FloodFrame[]}
 */
export function floodMaxTrace(graph, variant) {
  const adj = neighboursOf(graph);
  const n = adj.length;
  const rounds = diameter(adj);
  const max = graph.uids.slice(0, n);
  const parent = Array(n).fill(-1);
  const learned = Array(n).fill(0);
  let changed = Array(n).fill(true);
  let sent = 0;
  /** @type {FloodFrame[]} */
  const frames = [];
  /**
   * @param {FloodFrame['kind']} kind @param {number} round @param {number[]} lines
   * @param {{senders?: number[], messages?: Message[], updated?: number[], leaders?: number[]}} [extra]
   */
  const push = (kind, round, lines, extra = {}) =>
    frames.push({
      kind,
      round,
      rounds,
      max: max.slice(),
      parent: parent.slice(),
      learned: learned.slice(),
      senders: extra.senders?.slice() ?? [],
      messages: (extra.messages ?? []).map((msg) => ({ ...msg })),
      updated: extra.updated?.slice() ?? [],
      sent,
      leaders: extra.leaders?.slice() ?? [],
      lines,
    });

  push('start', 0, [0]);
  for (let round = 1; round <= rounds; round++) {
    const senders = [];
    /** @type {Message[]} */
    const messages = [];
    for (let u = 0; u < n; u++) {
      if (variant === 'change' && !changed[u]) continue;
      if (adj[u].length === 0) continue;
      senders.push(u);
      for (const v of adj[u]) messages.push({ from: u, to: v, value: max[u] });
    }
    sent += messages.length;
    push('send', round, [1, 2], { senders, messages });

    /** The largest value each node received, and the first sender of it. */
    const best = Array(n).fill(-Infinity);
    const from = Array(n).fill(-1);
    for (const msg of messages) {
      if (msg.value > best[msg.to] || (msg.value === best[msg.to] && msg.from < from[msg.to])) {
        best[msg.to] = msg.value;
        from[msg.to] = msg.from;
      }
    }
    const updated = [];
    changed = Array(n).fill(false);
    for (let v = 0; v < n; v++) {
      if (best[v] > max[v]) {
        max[v] = best[v];
        parent[v] = from[v];
        learned[v] = round;
        changed[v] = true;
        updated.push(v);
      }
    }
    push('receive', round, [3, 4], { messages, updated });
  }
  const leaders = [];
  for (let v = 0; v < n; v++) if (max[v] === graph.uids[v]) leaders.push(v);
  push('decide', rounds, [5], { leaders });
  push('done', rounds, [5], { leaders });
  return frames;
}

/**
 * Distinct random UIDs from 1 to MAX_UID, one per node.
 * @param {number} n
 * @param {() => number} [rand]
 */
export function randomUids(n, rand = Math.random) {
  /** @type {number[]} */
  const out = [];
  while (out.length < n) {
    const u = 1 + Math.floor(rand() * MAX_UID);
    if (!out.includes(u)) out.push(u);
  }
  return out;
}
