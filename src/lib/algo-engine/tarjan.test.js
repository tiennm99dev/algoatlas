import { describe, expect, it } from 'vitest';
import { sccState, tarjanScc } from './tarjan.js';

// 0 → 1 → 2 → 0 is a cycle; 2 → 3 → 4 → 3 another; 5 stands alone.
const out = [[1], [2], [0, 3], [4], [3], []];

describe('tarjanScc', () => {
  it('numbers the components sinks first', () => {
    const s = tarjanScc(out);
    expect(s.count).toBe(3);
    expect(s.comp).toEqual([2, 2, 2, 1, 1, 3]);
    expect(s.stack).toEqual([]);
    expect(s.tin).toEqual([0, 1, 2, 3, 4, 5]);
    expect(s.low).toEqual([0, 0, 0, 3, 3, 5]);
  });

  it('calls the hooks in the order of the search', () => {
    /** @type {string[]} */
    const log = [];
    tarjanScc([[1], [0, 2], []], {
      enter: (u, top) => log.push(`enter ${u}${top ? ' top' : ''}`),
      edge: (u, v, kind) => log.push(`${kind} ${u}-${v}`),
      back: (u, v) => log.push(`back ${u}-${v}`),
      root: (u, popped) => log.push(`root ${u}: ${popped.join(',')}`),
      keep: (u) => log.push(`keep ${u}`),
    });
    expect(log).toEqual([
      'enter 0 top',
      'tree 0-1',
      'enter 1',
      'stack 1-0',
      'tree 1-2',
      'enter 2',
      'root 2: 2',
      'back 1-2',
      'keep 1',
      'back 0-1',
      'root 0: 1,0',
    ]);
  });

  it('reads arcs given as objects and fills a state it is handed', () => {
    const s = sccState(2);
    /** @type {number[][]} */
    const seen = [];
    tarjanScc(
      [[{ to: 1, edge: 0 }], [{ to: 0, edge: 1 }]],
      { root: (_, popped) => seen.push([...popped, s.count]) },
      s,
    );
    expect(seen).toEqual([[1, 0, 1]]);
    expect(s.comp).toEqual([1, 1]);
  });
});
