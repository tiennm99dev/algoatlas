import { describe, expect, it } from 'vitest';
import {
  addNode,
  degree,
  findEdge,
  freeSpot,
  moveNode,
  nextNodeId,
  nodeName,
  notePlace,
  removeEdge,
  removeNode,
  toggleEdge,
} from './graph-editor.js';

/** @typedef {import('./graph-editor.js').Graph} Graph */

const bounds = { width: 200, height: 120, margin: 20 };

/** @type {Graph} */
const triangle = {
  nodes: [
    { id: 0, x: 20, y: 20, label: 'A' },
    { id: 1, x: 100, y: 20, label: 'B' },
    { id: 2, x: 60, y: 100 },
  ],
  edges: [
    { from: 0, to: 1 },
    { from: 1, to: 2 },
  ],
};

describe('graph editor', () => {
  it('names nodes by label or id and picks the next id', () => {
    expect(triangle.nodes.map(nodeName)).toEqual(['A', 'B', '2']);
    expect(nextNodeId(triangle.nodes)).toBe(3);
    expect(nextNodeId([])).toBe(0);
  });

  it('finds a free spot away from every node', () => {
    const spot = freeSpot(triangle.nodes, bounds, 40);
    expect(spot).not.toBeNull();
    const s = /** @type {{x: number, y: number}} */ (spot);
    for (const n of triangle.nodes)
      expect(Math.hypot(n.x - s.x, n.y - s.y)).toBeGreaterThanOrEqual(40);
    expect(freeSpot([], { width: 10, height: 10, margin: 20 }, 40)).toBeNull();
  });

  it('adds a node without touching the input, and refuses past the cap', () => {
    const next = addNode(triangle, bounds, { maxNodes: 4, gap: 40 });
    expect(next?.nodes).toHaveLength(4);
    expect(next?.nodes[3].id).toBe(3);
    expect(triangle.nodes).toHaveLength(3);
    expect(addNode(/** @type {Graph} */ (next), bounds, { maxNodes: 4, gap: 40 })).toBeNull();
  });

  it('clamps a requested position into bounds', () => {
    const next = addNode(triangle, bounds, {
      maxNodes: 9,
      gap: 40,
      at: { x: -50, y: 500 },
      label: 'Z',
    });
    expect(next?.nodes[3]).toEqual({ id: 3, x: 20, y: 100, label: 'Z' });
  });

  it('removes a node with its edges', () => {
    const next = removeNode(triangle, 1);
    expect(next.nodes.map((n) => n.id)).toEqual([0, 2]);
    expect(next.edges).toEqual([]);
  });

  it('toggles undirected edges in either direction', () => {
    expect(findEdge(triangle.edges, 1, 0, false)).toBe(0);
    const off = toggleEdge(triangle, 1, 0, { directed: false });
    expect(off?.added).toBe(false);
    expect(off?.graph.edges).toEqual([{ from: 1, to: 2 }]);
    const on = toggleEdge(triangle, 0, 2, { directed: false, weight: 4 });
    expect(on?.added).toBe(true);
    expect(on?.graph.edges.at(-1)).toEqual({ from: 0, to: 2, weight: 4 });
    expect(toggleEdge(triangle, 2, 2, { directed: false })).toBeNull();
  });

  it('treats directed edges as one-way', () => {
    expect(findEdge(triangle.edges, 1, 0, true)).toBe(-1);
    const both = toggleEdge(triangle, 1, 0, { directed: true });
    expect(both?.added).toBe(true);
    expect(both?.graph.edges).toHaveLength(3);
  });

  it('removes an edge by index, moves nodes in bounds and counts degree', () => {
    expect(removeEdge(triangle, 0).edges).toEqual([{ from: 1, to: 2 }]);
    const moved = moveNode(triangle, 2, { x: 999.4, y: 50.6 }, bounds);
    expect(moved.nodes[2]).toEqual({ id: 2, x: 180, y: 51 });
    expect(degree(triangle.edges, 1)).toBe(2);
    expect(degree(triangle.edges, 0)).toBe(1);
  });
});

describe('notePlace', () => {
  /** @param {[number, number][]} pairs @returns {Graph} */
  const star = (pairs) => ({
    nodes: [
      { id: 0, x: 100, y: 100 },
      { id: 1, x: 100, y: 200 },
      { id: 2, x: 100, y: 0 },
      { id: 3, x: 200, y: 100 },
      { id: 4, x: 0, y: 100 },
    ],
    edges: pairs.map(([from, to]) => ({ from, to })),
  });

  it('puts the note below a node with nothing coming in from below', () => {
    expect(notePlace(star([[2, 0]]), 0, 18)).toEqual({ x: 100, y: 127, anchor: 'middle' });
    expect(notePlace(star([]), 0, 18)).toEqual({ x: 100, y: 127, anchor: 'middle' });
  });

  it('moves the note off an arrow that comes in from below', () => {
    expect(notePlace(star([[1, 0]]), 0, 18)).toEqual({ x: 100, y: 73, anchor: 'middle' });
  });

  it('takes a side when edges come from above and below, and a diagonal when all four are taken', () => {
    expect(
      notePlace(
        star([
          [1, 0],
          [0, 2],
        ]),
        0,
        18,
      ),
    ).toEqual({ x: 122, y: 100, anchor: 'start' });
    const spot = notePlace(
      star([
        [1, 0],
        [2, 0],
        [3, 0],
        [0, 4],
      ]),
      0,
      18,
    );
    expect(spot.anchor).toBe('start');
    expect(spot.x).toBeGreaterThan(100);
    expect(spot.y).toBeGreaterThan(100);
  });

  it('keeps every chosen spot at least 40° from the edges when there is room', () => {
    const g = star([
      [1, 0],
      [0, 3],
    ]);
    const spot = notePlace(g, 0, 18);
    const angle = (Math.atan2(spot.y - 100, spot.x - 100) * 180) / Math.PI;
    for (const deg of [90, 0]) expect(Math.abs(angle - deg)).toBeGreaterThanOrEqual(40);
  });
});
