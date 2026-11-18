// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { checkAnswer, exerciseProblems } from '$lib/components/answer-check.js';
import { hullOf } from '$lib/algo-engine/plane-geometry.js';
import { en as m } from '$lib/lessons/review-advanced-lesson/copy.en.js';

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

/** @param {HTMLElement} q */
function orderShown(q) {
  return [...q.querySelectorAll('ol li span.flex-1')].map((s) => s.textContent ?? '');
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
 * @param {string | number | number[]} value
 */
function expectAnswer(words, value) {
  expect(checkAnswer(question(words), value).correct, words).toBe(true);
}

describe('review: advanced algorithms', () => {
  it('renders every question of the quiz', () => {
    render();
    expect(document.querySelector('h1')?.textContent).toBe(m.title);
    expect(questions()).toHaveLength(m.practice.length);
    expect(document.body.textContent).toContain(`Đã giải 0/${m.practice.length}`);
  });

  it('ends the curriculum with a link back to all topics', () => {
    render();
    expect(document.body.textContent).toContain(m.nextTeaser);
    expect([...document.querySelectorAll('a')].some((a) => a.textContent === 'Tất cả chủ đề')).toBe(
      true,
    );
  });

  it('checks a typed number, wrong then right after a hint', () => {
    render();
    const i = indexOf('inverse of 7 modulo 26');
    const q = questions()[i];
    type(q, '11');
    submit(q);
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText(q, 'Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[i].hints[0]);
    type(q, '15');
    submit(q);
    expect(q.textContent).toContain('Đúng rồi!');
    click(buttonByText(q, 'Xem lời giải'));
    expect(q.textContent).toContain(m.practice[i].solution);
  });

  it('checks a job mapped to a string matcher', () => {
    render();
    const q = questions()[indexOf('banned words')];
    const radios = /** @type {HTMLInputElement[]} */ ([
      ...q.querySelectorAll('input[type="radio"]'),
    ]);
    radios[1].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Chưa đúng');
    radios[0].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Đúng rồi!');
  });

  it('checks the ticked boxes of a several-answer question', () => {
    render();
    const q = questions()[indexOf('NP-complete')];
    const boxes = /** @type {HTMLInputElement[]} */ ([
      ...q.querySelectorAll('input[type="checkbox"]'),
    ]);
    for (const i of [0, 1, 2, 4]) boxes[i].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Chưa đúng');
    boxes[1].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Đúng rồi!');
  });

  it('accepts the prefix function written in several ways', () => {
    render();
    const q = questions()[indexOf('abacaba')];
    type(q, '0, 0, 1, 0, 1, 2, 2');
    submit(q);
    expect(q.textContent).toContain('Chưa đúng');
    type(q, '0, 0, 1, 0, 1, 2, 3');
    submit(q);
    expect(q.textContent).toContain('Đúng rồi!');
    type(q, '0 0 1 0 1 2 3');
    submit(q);
    expect(q.textContent).toContain('Đúng rồi!');
  });

  it('arranges the growth rates with the move buttons', () => {
    render();
    const i = indexOf('slowest-growing');
    const ex = m.practice[i];
    if (ex.type !== 'order') throw new Error('expected the growth order question');
    const q = questions()[i];
    const target = ex.answer.map((k) => ex.items[k]);
    // Bubble each item up to its place, one move button at a time.
    for (const [place, item] of target.entries()) {
      while (orderShown(q).indexOf(item) > place) {
        click(
          /** @type {HTMLButtonElement} */ (
            q.querySelector(`button[aria-label="Đưa “${item}” lên"]`)
          ),
        );
      }
    }
    expect(orderShown(q)).toEqual(target);
    submit(q);
    expect(q.textContent).toContain('Đúng rồi!');
  });

  it('covers every advanced chapter with well-formed questions of every type', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const chapters = new Set(m.practice.map((ex) => ex.prompt.split('.')[0]));
    expect(chapters).toEqual(
      new Set([
        'Range queries',
        'Strings',
        'Number theory',
        'Geometry',
        'Flows',
        'Advanced DP',
        'Tree techniques',
        'Algebra and randomness',
        'Intractability',
        'Advanced heaps',
        'Models of computation',
        'Choosing',
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
  it('match the Fenwick prefix walk', () => {
    let cells = 0;
    for (let i = 13; i > 0; i -= i & -i) cells++;
    expectAnswer('first 13 elements', cells);
  });

  it('match the prefix function of abacaba', () => {
    const s = 'abacaba';
    const pi = Array(s.length).fill(0);
    for (let i = 1; i < s.length; i++) {
      for (let len = i; len > 0; len--)
        if (s.slice(0, len) === s.slice(i - len + 1, i + 1)) {
          pi[i] = len;
          break;
        }
    }
    expectAnswer('abacaba', pi.join(', '));
  });

  it('match the suffix array and the distinct substrings of banana', () => {
    const s = 'banana';
    const sa = [...s].map((_, i) => i).sort((a, b) => (s.slice(a) < s.slice(b) ? -1 : 1));
    const q = question('suffix array lists');
    if (q.type !== 'order') throw new Error('expected the suffix order question');
    expect(q.answer.map((i) => q.items[i])).toEqual(sa.map((i) => s.slice(i)));

    /** @param {string} a @param {string} b */
    const lcp = (a, b) => {
      let k = 0;
      while (k < a.length && a[k] === b[k]) k++;
      return k;
    };
    const lcps = sa.slice(1).map((p, i) => lcp(s.slice(sa[i]), s.slice(p)));
    expect(lcps).toEqual([1, 3, 0, 0, 2]);
    const all = new Set();
    for (let i = 0; i < s.length; i++)
      for (let j = i + 1; j <= s.length; j++) all.add(s.slice(i, j));
    expectAnswer('distinct non-empty substrings', all.size);
  });

  it('match the number theory answers, by search', () => {
    const inv = Array.from({ length: 26 }, (_, x) => x).find((x) => (7 * x) % 26 === 1);
    expectAnswer('inverse of 7 modulo 26', /** @type {number} */ (inv));

    let x = 1;
    while (!(x % 3 === 2 && x % 5 === 3 && x % 7 === 2)) x++;
    expectAnswer('x ≡ 2 (mod 3)', x);

    const phi = (5 - 1) * (11 - 1);
    let d = 1;
    while ((3 * d) % phi !== 1) d++;
    expectAnswer('RSA key', d);
    // The key really decrypts: (m³)^d ≡ m (mod 55) for every message.
    for (let msg = 0; msg < 55; msg++) {
      let c = 1;
      for (let k = 0; k < 3 * d; k++) c = (c * msg) % 55;
      expect(c).toBe(msg);
    }
  });

  it('match the geometry answers', () => {
    const poly = [
      [0, 0],
      [4, 0],
      [4, 3],
      [1, 5],
      [0, 3],
    ];
    let twice = 0;
    for (let i = 0; i < poly.length; i++) {
      const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
      twice += a[0] * b[1] - b[0] * a[1];
    }
    expectAnswer('(1, 5)', Math.abs(twice) / 2);

    const cross = (4 - 0) * (3 - 0) - (0 - 0) * (2 - 0);
    expect(cross).toBeGreaterThan(0);
    const turn = question('which way do you turn');
    if (turn.type !== 'choice') throw new Error('expected the orientation question');
    expect(turn.options[turn.answer]).toContain('Counter-clockwise');

    const pts = [
      [0, 0],
      [2, 0],
      [4, 0],
      [6, 2],
      [4, 4],
      [2, 3],
      [1, 1],
      [0, 4],
      [3, 2],
    ].map(([px, py], id) => ({ id, x: px, y: py }));
    expectAnswer('convex hull', hullOf(pts).length);
  });

  it('match the maximum flow, from the smallest cut', () => {
    /** @type {[string, string, number][]} */
    const arcs = [
      ['s', 'a', 10],
      ['s', 'b', 8],
      ['a', 'b', 4],
      ['a', 't', 6],
      ['b', 't', 10],
    ];
    let best = Infinity;
    for (const side of [[], ['a'], ['b'], ['a', 'b']]) {
      const source = new Set(['s', ...side]);
      const cut = arcs
        .filter(([u, v]) => source.has(u) && !source.has(v))
        .reduce((sum, [, , c]) => sum + c, 0);
      best = Math.min(best, cut);
    }
    expectAnswer('maximum flow from s to t', best);
  });

  it('match the advanced DP answers', () => {
    expectAnswer('Held-Karp', 2 ** 15 * 15);

    const weight = [0, 3, 5, 4, 6, 2, 3];
    const edges = [
      [1, 2],
      [1, 3],
      [2, 4],
      [2, 5],
      [3, 6],
    ];
    let best = 0;
    for (let mask = 0; mask < 1 << 7; mask += 2) {
      if (edges.some(([u, v]) => mask & (1 << u) && mask & (1 << v))) continue;
      let sum = 0;
      for (let v = 1; v <= 6; v++) if (mask & (1 << v)) sum += weight[v];
      best = Math.max(best, sum);
    }
    expectAnswer('no two adjacent', best);
  });

  it('match the binary lifting table height', () => {
    let log = 0;
    while (2 ** log < 100000) log++;
    expectAnswer('Binary lifting stores', log);
  });

  it('match the winning Nim move, by trying every move', () => {
    const piles = [3, 4, 5];
    /** @type {[number, number][]} */
    const wins = [];
    for (const [i, p] of piles.entries())
      for (let take = 1; take <= p; take++) {
        const next = piles.with(i, p - take);
        if ((next[0] ^ next[1] ^ next[2]) === 0) wins.push([i, take]);
      }
    expect(wins).toEqual([[0, 2]]);
    expectAnswer('Nim', wins[0][1]);
  });

  it('match the Fibonacci entry of the matrix power', () => {
    /** @param {number[][]} a @param {number[][]} b */
    const mul = (a, b) => [
      [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
      [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
    ];
    let p = [
      [1, 0],
      [0, 1],
    ];
    for (let k = 0; k < 10; k++)
      p = mul(p, [
        [1, 1],
        [1, 0],
      ]);
    expectAnswer('M¹⁰', p[0][1]);
  });

  it('match the counting answers of the heaps and hardness chapters', () => {
    expectAnswer('parameter k = 10', 2 ** 10);
    let bits = 16;
    let halvings = 0;
    while (bits > 1) {
      bits /= 2;
      halvings++;
    }
    expectAnswer('van Emde Boas', halvings);
    expectAnswer('greedy scheduler', 100 / 5 + 10);
  });

  it('match the ski-rental worst case, over every season length', () => {
    let ratio = 0;
    for (let days = 1; days <= 30; days++) {
      const paid = days < 10 ? days : 9 + 10;
      ratio = Math.max(ratio, paid / Math.min(days, 10));
    }
    expect(ratio).toBeCloseTo(1.9);
    const q = question('Renting skis');
    if (q.type !== 'choice') throw new Error('expected the ski-rental question');
    expect(q.options[q.answer]).toContain('1.9');
  });

  it('match the running times that fit in a second', () => {
    const n = 1e5;
    const costs = [n * Math.log2(n), n * Math.sqrt(n), n * n, 2 ** n, n * Math.log2(n) ** 2];
    expectAnswer(
      'within about one second',
      costs.flatMap((c, i) => (c <= 1e8 ? [i] : [])),
    );
  });

  it('match the growth order, at a large n', () => {
    const q = question('slowest-growing');
    if (q.type !== 'order') throw new Error('expected the growth order question');
    const n = 64;
    /** @type {Record<string, number>} */
    const logValue = {
      'O(log log n)': Math.log(Math.log2(Math.log2(n))),
      'O(log n)': Math.log(Math.log2(n)),
      'O(√n)': 0.5 * Math.log(n),
      'O(n log n)': Math.log(n * Math.log2(n)),
      'O(n²)': 2 * Math.log(n),
      'O(2ⁿ)': n * Math.log(2),
      'O(n!)': Array.from({ length: n }, (_, k) => Math.log(k + 1)).reduce((a, b) => a + b, 0),
    };
    const sorted = [...q.items].sort((a, b) => logValue[a] - logValue[b]);
    expect(q.answer.map((i) => q.items[i])).toEqual(sorted);
  });
});
