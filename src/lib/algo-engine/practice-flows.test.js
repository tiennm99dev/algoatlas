import { describe, expect, it } from 'vitest';
import {
  MAX_CAPACITY,
  MAX_NODES,
  SCENARIOS,
  SCENARIO_KEYS,
  checkModel,
  modelPseudocode,
  modelTrace,
} from './practice-flows.js';

/** Deterministic LCG so random networks are reproducible. */
function seeded(seed = 1) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** @param {number} n */
const range = (n) => [...Array(n).keys()];

/**
 * Oracle: the smallest s-t cut capacity over every split of the vertices.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges
 * @param {number} s @param {number} t
 */
function bruteCut(n, edges, s, t) {
  let best = Infinity;
  for (let mask = 0; mask < 1 << n; mask++) {
    if (!(mask & (1 << s)) || mask & (1 << t)) continue;
    let c = 0;
    for (const e of edges)
      if (mask & (1 << e.from) && !(mask & (1 << e.to)) && e.from !== e.to) c += e.weight ?? 1;
    best = Math.min(best, c);
  }
  return best;
}

/**
 * Oracle for vertex capacities: vertex v (id) becomes v and v + n, joined by an edge of the
 * vertex's capacity; edges out of v leave from v + n.
 * @param {number} n @param {{from: number, to: number, weight?: number}[]} edges
 * @param {Map<number, number>} limits
 */
function splitVertices(n, edges, limits) {
  const out = (/** @type {number} */ v) => (limits.has(v) ? v + n : v);
  return [
    ...[...limits].map(([v, c]) => ({ from: v, to: v + n, weight: c })),
    ...edges.map((e) => ({ from: out(e.from), to: e.to, weight: e.weight })),
  ];
}

/** @param {import('./practice-flows.js').ScenarioKey} key @param {'start' | 'model'} which */
function run(key, which) {
  const sc = SCENARIOS[key];
  const ids = sc.nodes.map((n) => n.id).toSorted((a, b) => a - b);
  return modelTrace({
    ids,
    edges: sc[which],
    source: ids.indexOf(sc.source),
    sink: ids.indexOf(sc.sink),
  });
}

describe('scenarios', () => {
  it('stay inside the canvas limits', () => {
    for (const key of SCENARIO_KEYS) {
      const sc = SCENARIOS[key];
      expect(sc.nodes.length).toBeLessThanOrEqual(MAX_NODES);
      for (const e of [...sc.start, ...sc.model]) {
        expect(e.weight).toBeGreaterThanOrEqual(1);
        expect(e.weight).toBeLessThanOrEqual(MAX_CAPACITY);
      }
      for (const p of sc.nodes) {
        expect(p.x).toBeGreaterThanOrEqual(22);
        expect(p.x).toBeLessThanOrEqual(480 - 22);
        expect(p.y).toBeGreaterThanOrEqual(22);
        expect(p.y).toBeLessThanOrEqual(300 - 22);
      }
    }
  });

  it('store the maximum flow of the correct model as the answer', () => {
    for (const key of SCENARIO_KEYS) {
      const sc = SCENARIOS[key];
      const last = run(key, 'model').at(-1);
      expect(last?.value).toBe(sc.answer);
      expect(last?.cutCapacity).toBe(sc.answer);
      expect(bruteCut(sc.nodes.length, sc.model, sc.source, sc.sink)).toBe(sc.answer);
    }
    expect(SCENARIOS.supply.answer).toBe(15);
    expect(SCENARIOS.routers.answer).toBe(12);
    expect(SCENARIOS.clubs.answer).toBe(4);
    expect(SCENARIOS.convoys.answer).toBe(2);
  });

  it('start from a drawing that is not yet the model', () => {
    for (const key of SCENARIO_KEYS) {
      const sc = SCENARIOS[key];
      expect(checkModel(sc.model, sc.start).ok).toBe(false);
      expect(checkModel(sc.model, sc.model).ok).toBe(true);
    }
    // Ignoring the router limits overstates the answer; lengths as capacities mean nothing.
    expect(run('routers', 'start').at(-1)?.value).toBe(14);
    expect(run('convoys', 'start').at(-1)?.value).toBe(12);
    expect(run('supply', 'start').at(-1)?.value).toBe(0);
  });

  it('model the routers by splitting both limited vertices', () => {
    // Story vertices S 0, A 1, B 3, T 5; the split copies A′ 2 and B′ 4.
    const story = [
      { from: 0, to: 1, weight: 8 },
      { from: 0, to: 2, weight: 6 },
      { from: 1, to: 2, weight: 4 },
      { from: 1, to: 3, weight: 5 },
      { from: 2, to: 3, weight: 9 },
    ];
    const split = splitVertices(
      4,
      story,
      new Map([
        [1, 6],
        [2, 7],
      ]),
    );
    // Split copies are v + 4: A′ is 5 and B′ is 6.
    const rename = [0, 1, 3, 5, -1, 2, 4];
    const renamed = split.map((e) => ({ ...e, from: rename[e.from], to: rename[e.to] }));
    expect(checkModel(SCENARIOS.routers.model, renamed).ok).toBe(true);
  });

  it('model the convoys with capacity 1 on every road of the story', () => {
    const { start, model } = SCENARIOS.convoys;
    expect(model).toEqual(start.map((e) => ({ ...e, weight: 1 })));
  });
});

describe('checkModel', () => {
  const model = [
    { from: 0, to: 1, weight: 3 },
    { from: 1, to: 2, weight: 2 },
    { from: 0, to: 2, weight: 4 },
  ];

  it('sorts the differences into missing, extra and wrong capacity', () => {
    const c = checkModel(model, [
      { from: 1, to: 0, weight: 3 },
      { from: 1, to: 2, weight: 5 },
      { from: 0, to: 2, weight: 4 },
    ]);
    expect(c.missing).toEqual([{ from: 0, to: 1, weight: 3 }]);
    expect(c.extra).toEqual([{ from: 1, to: 0, weight: 3 }]);
    expect(c.wrong).toEqual([{ from: 1, to: 2, want: 2, got: 5 }]);
    expect(c.ok).toBe(false);
  });

  it('ignores the order of the edges and treats a missing weight as 1', () => {
    expect(checkModel([{ from: 0, to: 1 }], [{ from: 0, to: 1, weight: 1 }]).ok).toBe(true);
    expect(checkModel(model, model.toReversed()).ok).toBe(true);
    expect(checkModel([], []).ok).toBe(true);
    expect(checkModel(model, []).missing).toHaveLength(3);
  });
});

describe('modelTrace', () => {
  it('matches the brute-force minimum cut on random networks', () => {
    const rand = seeded(7);
    for (let trial = 0; trial < 150; trial++) {
      const n = 2 + Math.floor(rand() * 6);
      /** @type {{from: number, to: number, weight: number}[]} */
      const edges = [];
      for (let u = 0; u < n; u++)
        for (let v = 0; v < n; v++)
          if (u !== v && rand() < 0.4)
            edges.push({ from: u, to: v, weight: 1 + Math.floor(rand() * MAX_CAPACITY) });
      const t = n - 1;
      const frames = modelTrace({ ids: range(n), edges, source: 0, sink: t });
      const last = /** @type {import('./practice-flows.js').ModelFrame} */ (frames.at(-1));
      const best = bruteCut(n, edges, 0, t);
      expect(last.value).toBe(best);
      expect(last.cutCapacity).toBe(best);
      expect(last.side[0]).toBe(true);
      expect(last.side[t]).toBe(false);
      // Conservation at every inner vertex and capacity on every edge.
      for (let v = 1; v < t; v++) {
        let net = 0;
        edges.forEach((e, k) => {
          if (e.to === v) net += last.flow[k];
          if (e.from === v) net -= last.flow[k];
        });
        expect(net).toBe(0);
      }
      edges.forEach((e, k) => {
        expect(last.flow[k]).toBeGreaterThanOrEqual(0);
        expect(last.flow[k]).toBeLessThanOrEqual(e.weight);
      });
      // Every cut edge is saturated.
      for (const k of last.cut) expect(last.flow[k]).toBe(edges[k].weight);
    }
  });

  it('counts one augmenting path per unit on a unit network', () => {
    const frames = run('convoys', 'model');
    expect(frames.map((f) => f.kind)).toEqual(['start', 'augment', 'augment', 'maxflow', 'done']);
    expect(frames.at(-1)?.augmentations).toBe(2);
    expect(frames.filter((f) => f.kind === 'augment').map((f) => f.bottleneck)).toEqual([1, 1]);
    expect(frames.at(-1)?.cut).toEqual([5, 6]);
  });

  it('reads the limiting router out of the minimum cut', () => {
    const last = run('routers', 'model').at(-1);
    expect(last?.side).toEqual([true, true, false, false, false, false]);
    // S → B and A → A′.
    expect(last?.cut).toEqual([1, 2]);
  });

  it('gives a zero flow when the sink cannot be reached', () => {
    const frames = run('clubs', 'start');
    expect(frames.map((f) => f.kind)).toEqual(['start', 'maxflow', 'done']);
    expect(frames.at(-1)?.value).toBe(0);
    expect(frames.at(-1)?.cut).toEqual([]);
  });

  it('stops at once when s or t is missing or they coincide', () => {
    for (const [source, sink] of [
      [-1, 2],
      [0, -1],
      [1, 1],
    ]) {
      const frames = modelTrace({ ids: range(3), edges: [{ from: 0, to: 2 }], source, sink });
      expect(frames.map((f) => f.kind)).toEqual(['start', 'done']);
      expect(frames.every((f) => !f.valid)).toBe(true);
    }
    const empty = modelTrace({ ids: [], edges: [], source: -1, sink: -1 });
    expect(empty.at(-1)?.value).toBe(0);
  });

  it('records frames that do not alias each other or the input', () => {
    const edges = SCENARIOS.supply.model.map((e) => ({ ...e }));
    const before = JSON.stringify(edges);
    const frames = modelTrace({ ids: range(7), edges, source: 0, sink: 6 });
    expect(JSON.stringify(edges)).toBe(before);
    const [a, b] = frames;
    a.flow[0] = 99;
    a.side[0] = true;
    a.lines.push(42);
    expect(b.flow[0]).not.toBe(99);
    expect(b.side[0]).toBe(false);
    expect(b.lines).not.toContain(42);
    const nextPath = frames[2].path.length;
    frames[1].path.push({ edge: 0, forward: true, from: 0, to: 1 });
    expect(frames[2].path).toHaveLength(nextPath);
    const last = /** @type {import('./practice-flows.js').ModelFrame} */ (frames.at(-1));
    const prev = frames[frames.length - 2];
    last.cut.push(99);
    expect(prev.cut).not.toContain(99);
  });
});

describe('pseudocode coverage', () => {
  it('highlights every line in some frame', () => {
    const used = new Set(run('supply', 'model').flatMap((f) => f.lines));
    for (const i of modelPseudocode.keys()) expect(used.has(i)).toBe(true);
  });
});
