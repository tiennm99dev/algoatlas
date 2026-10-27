// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { checkAnswer, exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/review-foundations-lesson/copy.en.js';

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

/** @param {(ex: import('$lib/components/answer-check.js').Exercise) => boolean} test */
const indexOf = (test) => m.practice.findIndex(test);

describe('review: foundations', () => {
  it('renders every question of the quiz', () => {
    render();
    expect(document.querySelector('h1')?.textContent).toBe(m.title);
    expect(questions()).toHaveLength(m.practice.length);
    expect(document.body.textContent).toContain(`0 of ${m.practice.length}`);
  });

  it('checks a typed number, wrong then right after a hint', () => {
    render();
    const i = indexOf((ex) => ex.type === 'number' && ex.answer === 31);
    const q = questions()[i];
    type(q, '32');
    submit(q);
    expect(q.textContent).toContain('Not quite');
    click(buttonByText(q, 'Show a hint'));
    expect(q.textContent).toContain(m.practice[i].hints[0]);
    type(q, '31 copies');
    submit(q);
    expect(q.textContent).toContain('Correct!');
    click(buttonByText(q, 'Show solution'));
    expect(q.textContent).toContain(m.practice[i].solution);
  });

  it('checks a scenario choice', () => {
    render();
    const i = indexOf((ex) => ex.type === 'choice' && ex.prompt.includes('grid maze'));
    const q = questions()[i];
    const radios = /** @type {HTMLInputElement[]} */ ([
      ...q.querySelectorAll('input[type="radio"]'),
    ]);
    radios[1].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Not quite');
    radios[0].click();
    flushSync();
    submit(q);
    expect(q.textContent).toContain('Correct!');
  });

  it('accepts the stack output written in several ways', () => {
    render();
    const i = indexOf((ex) => ex.type === 'text' && ex.prompt.startsWith('Stacks.'));
    const q = questions()[i];
    type(q, '3, 4, 2');
    submit(q);
    expect(q.textContent).toContain('Not quite');
    type(q, '2,4,3');
    submit(q);
    expect(q.textContent).toContain('Correct!');
  });

  it('orders the BST keys in preorder with the move buttons', () => {
    render();
    const i = indexOf((ex) => ex.type === 'order' && ex.prompt.startsWith('Trees.'));
    const q = questions()[i];
    const up = (/** @type {string} */ key) => {
      const b = q.querySelector(`button[aria-label*="${key}"][data-dir="up"]`);
      click(/** @type {HTMLButtonElement} */ (b));
    };
    // 20 30 40 50 60 70 80 → 50 30 20 40 70 60 80
    for (let k = 0; k < 3; k++) up('50');
    up('30');
    up('70');
    submit(q);
    const order = [...q.querySelectorAll('ol li span.flex-1')].map((s) => s.textContent);
    expect(order).toEqual(['50', '30', '20', '40', '70', '60', '80']);
    expect(q.textContent).toContain('Correct!');
  });

  it('covers every foundations chapter with well-formed, correct questions', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const chapters = new Set(m.practice.map((ex) => ex.prompt.split('.')[0]));
    for (const c of ['Complexity', 'Arrays', 'Sorting', 'Searching', 'Linked lists', 'Stacks']) {
      expect(chapters).toContain(c);
    }
    for (const c of ['Hashing', 'Recursion', 'Trees', 'Heaps', 'Graphs']) {
      expect(chapters).toContain(c);
    }
    expect(new Set(m.practice.map((ex) => ex.type)).size).toBe(5);
  });
});

// Recompute the stored answers independently of the copy, so a typo in an answer fails here.
describe('stored answers', () => {
  /** @param {number} i */
  const ex = (i) => m.practice[i];

  it('match a direct computation', () => {
    let count = 0;
    for (let i = 1; i <= 10; i++) for (let j = 1; j <= i; j++) count++;
    expect(checkAnswer(ex(0), count).correct).toBe(true);

    let cap = 1;
    let size = 0;
    let copies = 0;
    for (let k = 0; k < 17; k++) {
      if (size === cap) {
        copies += size;
        cap *= 2;
      }
      size++;
    }
    expect(checkAnswer(ex(2), copies).correct).toBe(true);

    const a = [3, 1, 4, 1, 5, 9, 2, 6];
    const p = [0];
    for (const v of a) p.push(p[p.length - 1] + v);
    expect(checkAnswer(ex(3), p[6] - p[2]).correct).toBe(true);

    let f = 1;
    for (let k = 2; k <= 4; k++) f *= k;
    expect(checkAnswer(ex(7), Math.ceil(Math.log2(f))).correct).toBe(true);
    expect(checkAnswer(ex(8), Math.floor(Math.log2(1000)) + 1).correct).toBe(true);

    const sorted = [1, 3, 3, 3, 5, 8];
    expect(
      checkAnswer(
        ex(9),
        sorted.findIndex((v) => v > 3),
      ).correct,
    ).toBe(true);

    /** @type {number[]} */
    const stack = [];
    /** @type {number[]} */
    const out = [];
    for (const op of ['+1', '+2', '-', '+3', '+4', '-', '-']) {
      if (op === '-') out.push(/** @type {number} */ (stack.pop()));
      else stack.push(Number(op.slice(1)));
    }
    expect(checkAnswer(ex(11), out.join(', ')).correct).toBe(true);

    /** @type {(number | null)[]} */
    const table = Array(7).fill(null);
    for (const key of [10, 17, 24]) {
      let s = key % 7;
      while (table[s] !== null) s = (s + 1) % 7;
      table[s] = key;
    }
    expect(checkAnswer(ex(13), table.indexOf(24)).correct).toBe(true);

    /** @param {number} n @returns {number} */
    const calls = (n) => (n <= 1 ? 1 : 1 + calls(n - 1) + calls(n - 2));
    expect(checkAnswer(ex(15), calls(5)).correct).toBe(true);

    expect(checkAnswer(ex(17), Math.floor((9 - 1) / 2)).correct).toBe(true);
  });

  it('match a BST preorder', () => {
    /** @typedef {{ key: number, left: Node | null, right: Node | null }} Node */
    /** @type {Node | null} */
    let root = null;
    /** @param {Node | null} t @param {number} key @returns {Node} */
    const insert = (t, key) => {
      if (!t) return { key, left: null, right: null };
      if (key < t.key) t.left = insert(t.left, key);
      else t.right = insert(t.right, key);
      return t;
    };
    for (const k of [50, 30, 70, 20, 40, 60, 80]) root = insert(root, k);
    /** @type {string[]} */
    const pre = [];
    /** @param {Node | null} t */
    const walk = (t) => {
      if (!t) return;
      pre.push(String(t.key));
      walk(t.left);
      walk(t.right);
    };
    walk(root);
    const q = ex(16);
    if (q.type !== 'order') throw new Error('expected the preorder question');
    expect(q.answer.map((i) => q.items[i])).toEqual(pre);
  });

  it('match the only topological order', () => {
    const q = ex(21);
    if (q.type !== 'order') throw new Error('expected the topological order question');
    /** @type {[string, string][]} */
    const edges = [
      ['Intro', 'Discrete maths'],
      ['Intro', 'Data structures'],
      ['Discrete maths', 'Data structures'],
      ['Data structures', 'Algorithms'],
      ['Discrete maths', 'Algorithms'],
      ['Algorithms', 'Compilers'],
    ];
    const indeg = new Map(q.items.map((c) => [c, 0]));
    for (const [, to] of edges) indeg.set(to, (indeg.get(to) ?? 0) + 1);
    /** @type {string[]} */
    const order = [];
    while (order.length < q.items.length) {
      const ready = q.items.filter((c) => !order.includes(c) && indeg.get(c) === 0);
      expect(ready).toHaveLength(1);
      order.push(ready[0]);
      for (const [from, to] of edges)
        if (from === ready[0]) indeg.set(to, (indeg.get(to) ?? 0) - 1);
    }
    expect(q.answer.map((i) => q.items[i])).toEqual(order);
  });
});
