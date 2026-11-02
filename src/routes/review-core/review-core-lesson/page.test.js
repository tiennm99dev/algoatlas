// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { checkAnswer, exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/review-core-lesson/copy.en.js';

/** @typedef {import('$lib/components/answer-check.js').Exercise} Exercise */

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  localStorage.clear();
});

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {ParentNode} root @param {string} label */
function buttonByText(root, label) {
  const el = [...root.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

function questions() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement[]} */ ([...section.querySelectorAll('li[aria-labelledby]')]);
}

/** @param {HTMLElement} q */
function submit(q) {
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {HTMLElement} q @param {string} value */
function type(q, value) {
  const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** @param {string} words @returns {number} the index of the question whose prompt has them */
function indexOf(words) {
  const i = m.practice.findIndex((ex) => ex.prompt.includes(words));
  if (i < 0) throw new Error(`no question mentions ${words}`);
  return i;
}

/** @param {string} words @returns {Exercise} */
const question = (words) => m.practice[indexOf(words)];

/**
 * @param {string} words
 * @param {string | number} value
 */
function expectAnswer(words, value) {
  expect(checkAnswer(question(words), value).correct, words).toBe(true);
}

describe('review: core algorithms', () => {
  it('renders every question of the quiz', () => {
    render();
    expect(document.querySelector('h1')?.textContent).toBe(m.title);
    expect(questions()).toHaveLength(m.practice.length);
    expect(document.body.textContent).toContain(`0 of ${m.practice.length}`);
  });

  it('checks a typed number, wrong then right after a hint', () => {
    render();
    const i = indexOf('Huffman code');
    const q = questions()[i];
    type(q, '300');
    submit(q);
    expect(q.textContent).toContain('Not quite');
    click(buttonByText(q, 'Show a hint'));
    expect(q.textContent).toContain(m.practice[i].hints[0]);
    type(q, '224 bits');
    submit(q);
    expect(q.textContent).toContain('Correct!');
    click(buttonByText(q, 'Show solution'));
    expect(q.textContent).toContain(m.practice[i].solution);
  });

  it('checks a problem statement mapped to a paradigm', () => {
    render();
    const q = questions()[indexOf('dictionary words')];
    const radios = /** @type {HTMLInputElement[]} */ ([
      ...q.querySelectorAll('input[type="radio"]'),
    ]);
    radios[0].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Not quite');
    radios[2].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Correct!');
  });

  it('accepts the master theorem answer written in several ways', () => {
    render();
    const q = questions()[indexOf('4T(n/2)')];
    type(q, 'O(n log n)');
    submit(q);
    expect(q.textContent).toContain('Not quite');
    type(q, 'O( N^2 )');
    submit(q);
    expect(q.textContent).toContain('Correct!');
  });

  it('orders the settled vertices with the move buttons', () => {
    render();
    const q = questions()[indexOf('Dijkstra settles')];
    click(
      /** @type {HTMLButtonElement} */ (
        q.querySelector('button[aria-label*="“C”"][data-dir="up"]')
      ),
    );
    submit(q);
    const order = [...q.querySelectorAll('ol li span.flex-1')].map((s) => s.textContent);
    expect(order).toEqual(['A', 'C', 'B', 'D', 'E']);
    expect(q.textContent).toContain('Correct!');
  });

  it('covers every core chapter with well-formed questions of every type', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const chapters = new Set(m.practice.map((ex) => ex.prompt.split('.')[0]));
    expect(chapters).toEqual(
      new Set([
        'Shortest paths',
        'Union-find',
        'Spanning trees',
        'Advanced graphs',
        'Divide and conquer',
        'Greedy',
        'Dynamic programming',
        'Backtracking',
        'Balanced trees',
        'Paradigms',
      ]),
    );
    expect(new Set(m.practice.map((ex) => ex.type)).size).toBe(5);
  });

  it('spreads the right option across positions, so its place gives nothing away', () => {
    const picks = m.practice.flatMap((ex) => (ex.type === 'choice' ? [ex.answer] : []));
    expect(new Set(picks)).toEqual(new Set([0, 1, 2, 3]));
  });
});

// Recompute the stored answers independently of the copy, so a typo in an answer fails here.
describe('stored answers', () => {
  it('match the Dijkstra settle order, from Bellman-Ford distances', () => {
    /** @type {[string, string, number][]} */
    const edges = [
      ['A', 'B', 7],
      ['A', 'C', 2],
      ['C', 'B', 3],
      ['C', 'D', 8],
      ['B', 'D', 1],
      ['D', 'E', 2],
      ['B', 'E', 9],
    ];
    /** @type {Record<string, number>} */
    const dist = { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity };
    for (let round = 0; round < 4; round++)
      for (const [u, v, w] of edges) dist[v] = Math.min(dist[v], dist[u] + w);
    const q = question('Dijkstra settles');
    if (q.type !== 'order') throw new Error('expected the settle order question');
    expect(q.answer.map((i) => q.items[i])).toEqual(
      Object.keys(dist).sort((a, b) => dist[a] - dist[b]),
    );
    expect(dist).toEqual({ A: 0, B: 5, C: 2, D: 6, E: 8 });
  });

  it('match the longest DAG path, by trying every path', () => {
    /** @type {Record<string, [string, number][]>} */
    const out = {
      A: [
        ['B', 3],
        ['C', 2],
      ],
      B: [['D', 4]],
      C: [['D', 6]],
      D: [['E', 1]],
      E: [],
    };
    /** @param {string} u @returns {number} */
    const longest = (u) => (u === 'E' ? 0 : Math.max(...out[u].map(([v, w]) => w + longest(v))));
    expectAnswer('longest path from A to E', longest('A'));
  });

  it('match union-find counts', () => {
    const parent = Array.from({ length: 9 }, (_, i) => i);
    /** @param {number} x @returns {number} */
    const find = (x) => (parent[x] === x ? x : find(parent[x]));
    let components = 8;
    for (const [a, b] of [
      [1, 2],
      [3, 4],
      [2, 3],
      [5, 6],
      [1, 4],
    ]) {
      if (find(a) !== find(b)) components--;
      parent[find(a)] = find(b);
    }
    expectAnswer('Vertices 1 to 8', components);

    let ranks = Array(16).fill(0);
    while (ranks.length > 1) {
      /** @type {number[]} */
      const next = [];
      for (let i = 0; i < ranks.length; i += 2) next.push(ranks[i] + 1);
      ranks = next;
    }
    expectAnswer('union by rank', ranks[0]);
  });

  it('match the minimum spanning tree, by trying every edge subset', () => {
    /** @type {[number, number, number][]} */
    const edges = [
      [0, 1, 1],
      [1, 2, 2],
      [0, 2, 3],
      [2, 3, 4],
      [1, 3, 5],
      [3, 4, 6],
      [2, 4, 7],
    ];
    let best = Infinity;
    for (let mask = 0; mask < 1 << edges.length; mask++) {
      const picked = edges.filter((_, i) => mask & (1 << i));
      if (picked.length !== 4) continue;
      const seen = new Set([0]);
      for (let round = 0; round < 5; round++)
        for (const [a, b] of picked)
          if (seen.has(a) || seen.has(b)) {
            seen.add(a);
            seen.add(b);
          }
      if (seen.size === 5)
        best = Math.min(
          best,
          picked.reduce((sum, e) => sum + e[2], 0),
        );
    }
    expectAnswer('minimum spanning tree?', best);
  });

  it('match the strongly connected components, from reachability', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F'];
    const arcs = ['AB', 'BC', 'CA', 'CD', 'DE', 'ED', 'EF'];
    const reach = new Set(names.map((v) => v + v));
    for (const a of arcs) reach.add(a);
    for (const k of names)
      for (const i of names)
        for (const j of names) if (reach.has(i + k) && reach.has(k + j)) reach.add(i + j);
    const groups = new Set(
      names.map((u) => names.filter((v) => reach.has(u + v) && reach.has(v + u)).join('')),
    );
    expectAnswer('strongly connected components', groups.size);
    expect(groups).toEqual(new Set(['ABC', 'DE', 'F']));
  });

  it('match the Eulerian degree claim, on a street map with those degrees', () => {
    const streets = ['ab', 'ac', 'ad', 'ae', 'bc', 'bd', 'ce'];
    /** @type {Record<string, number>} */
    const degree = {};
    for (const s of streets) for (const v of s) degree[v] = (degree[v] ?? 0) + 1;
    expect(Object.values(degree).sort()).toEqual([2, 2, 3, 3, 4]);
    expect(Object.values(degree).filter((d) => d % 2 === 1)).toHaveLength(2);
  });

  it('match the count of inversions', () => {
    const a = [3, 1, 4, 1, 5, 9, 2, 6];
    let count = 0;
    for (let i = 0; i < a.length; i++)
      for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) count++;
    expectAnswer('How many inversions', count);
  });

  it('match the largest set of compatible activities, by trying every subset', () => {
    const acts = [
      [1, 4],
      [3, 5],
      [0, 6],
      [5, 7],
      [3, 9],
      [5, 9],
      [6, 10],
      [8, 11],
      [8, 12],
      [2, 14],
      [12, 16],
    ];
    let best = 0;
    for (let mask = 0; mask < 1 << acts.length; mask++) {
      const picked = acts.filter((_, i) => mask & (1 << i)).sort((x, y) => x[0] - y[0]);
      if (picked.every((x, i) => i === 0 || picked[i - 1][1] <= x[0]))
        best = Math.max(best, picked.length);
    }
    expectAnswer('one room hold', best);
  });

  it('match the Huffman total, from code lengths', () => {
    const freq = [45, 13, 12, 16, 9, 5];
    const lengths = [1, 3, 3, 3, 4, 4];
    expect(lengths.reduce((sum, l) => sum + 2 ** -l, 0)).toBe(1);
    const total = freq.reduce((sum, f, i) => sum + f * lengths[i], 0);
    expectAnswer('Huffman code', total);

    const heap = [...freq];
    let merged = 0;
    while (heap.length > 1) {
      heap.sort((a, b) => a - b);
      const w = /** @type {number} */ (heap.shift()) + /** @type {number} */ (heap.shift());
      merged += w;
      heap.push(w);
    }
    expect(merged).toBe(total);
  });

  it('match the dynamic programming answers', () => {
    const items = [
      [10, 60],
      [20, 100],
      [30, 120],
    ];
    let best = 0;
    for (let mask = 0; mask < 8; mask++) {
      const picked = items.filter((_, i) => mask & (1 << i));
      const weight = picked.reduce((sum, it) => sum + it[0], 0);
      if (weight <= 50)
        best = Math.max(
          best,
          picked.reduce((sum, it) => sum + it[1], 0),
        );
    }
    expectAnswer('0/1 knapsack has capacity', best);

    const [s, t] = ['kitten', 'sitting'];
    const d = Array.from({ length: s.length + 1 }, (_, i) =>
      Array.from({ length: t.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );
    for (let i = 1; i <= s.length; i++)
      for (let j = 1; j <= t.length; j++)
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1),
        );
    expectAnswer('edit distance', d[s.length][t.length]);

    const dims = [10, 30, 5, 60];
    const left = dims[0] * dims[1] * dims[2] + dims[0] * dims[2] * dims[3];
    const right = dims[1] * dims[2] * dims[3] + dims[0] * dims[1] * dims[3];
    expectAnswer('scalar multiplications', Math.min(left, right));
  });

  it('match the SRTBOT initials', () => {
    const q = question('SRTBOT');
    if (q.type !== 'order') throw new Error('expected the framework question');
    expect(q.answer.map((i) => q.items[i][0]).join('')).toBe('SRTBOT');
  });

  it('match the count of 6-queens solutions, and the one the solution quotes', () => {
    /** @param {number[]} cols */
    const safe = (cols) =>
      cols.every((c, r) =>
        cols.every((d, s) => s === r || (c !== d && Math.abs(c - d) !== Math.abs(r - s))),
      );
    /** @param {number[]} cols @returns {number} */
    const place = (cols) => {
      if (cols.length === 6) return 1;
      let total = 0;
      for (let c = 1; c <= 6; c++) {
        const next = [...cols, c];
        if (safe(next)) total += place(next);
      }
      return total;
    };
    expectAnswer('6 queens', place([]));
    expect(safe([2, 4, 6, 1, 3, 5])).toBe(true);
  });

  it('match the balanced tree counts', () => {
    const fewest = [0, 1, 2];
    for (let h = 3; h <= 5; h++) fewest[h] = fewest[h - 1] + fewest[h - 2] + 1;
    expectAnswer('AVL tree of height 5', fewest[5]);

    expectAnswer('B-tree has order 100', (1 + 100 + 100 * 100) * 99);
    expectAnswer('order-statistic tree', 7 - 5 - 1);
  });

  it('match the AVL repair of the left-right case', () => {
    /** @typedef {{ key: number, left: Node | null, right: Node | null }} Node */
    /** @type {Node} */
    const pivot = { key: 20, left: null, right: null };
    /** @type {Node} */
    const inner = { key: 10, left: null, right: pivot };
    /** @type {Node} */
    const top = { key: 30, left: inner, right: null };
    // Left rotation at 10, then right rotation at 30.
    inner.right = pivot.left;
    pivot.left = inner;
    top.left = pivot.right;
    pivot.right = top;
    expect([pivot.key, pivot.left?.key, pivot.right?.key]).toEqual([20, 10, 30]);
    const q = question('Insert 30, 10, 20');
    if (q.type !== 'choice') throw new Error('expected the rotation question');
    expect(q.options[q.answer]).toContain('left rotation at 10, then a right rotation at 30');
  });
});
