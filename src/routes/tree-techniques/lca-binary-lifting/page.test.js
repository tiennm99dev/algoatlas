// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/lca-binary-lifting/copy.en.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {string} name @param {string} value */
function choose(name, value) {
  const el = /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} label */
const node = (label) => {
  const el = [...document.querySelectorAll('g[role="button"]')].find((g) => {
    const name = g.getAttribute('aria-label') ?? '';
    return name === `Node ${label}` || name.startsWith(`Node ${label},`);
  });
  if (!el) throw new Error(`no node ${label}`);
  return el;
};
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Bước tiếp'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('lowest common ancestor and binary lifting lesson', () => {
  it('builds the table cell by cell from two half jumps', () => {
    render();
    expect(narration()).toContain('Build the jump table first: 14 nodes × 4 rows');
    next(1);
    expect(narration()).toContain('Row 2⁰ is each node’s parent');
    expect(byTest('cells')).toBe('14');
    next(4);
    expect(narration()).toBe(
      'up[1][D]: 1 level up from D is B, and 1 more from there is A. Two half jumps make one jump of 2.',
    );
    expect(node('D').getAttribute('aria-label')).toBe('Node D, depth 2, its cell is being filled');
    expect(node('B').getAttribute('aria-label')).toContain('halfway ancestor');
  });

  it('answers the family query and agrees with the Euler tour', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toBe('lca = B, after 10 table reads and 3 pointer moves.');
    expect(byTest('lca')).toBe('B');
    expect(byTest('d')).toBe('2');
    expect(byTest('cells')).toBe('56');
    expect(node('B').getAttribute('aria-label')).toContain('the lowest common ancestor');
    expect(node('H').getAttribute('aria-label')).toContain('on the u–v path');
    expect(byTest('euler')).toContain('the shallowest entry is B (depth 1)');
  });

  it('re-runs the query when u or v changes, opening on the query', () => {
    render();
    choose('v', '12');
    expect(narration()).toBe('Table done (56 cells). Now ask lca(N, M).');
    click(button('Đến bước cuối'));
    expect(byTest('lca')).toBe('A');
    expect(byTest('euler')).toContain('the shallowest entry is A (depth 0)');
  });

  it('swaps u and v when v is deeper and stops early on an ancestor', () => {
    render();
    choose('u', '1');
    next(1);
    expect(narration()).toContain('I is deeper, so swap: u = I (depth 3), v = B (depth 1).');
    click(button('Đến bước cuối'));
    expect(byTest('lca')).toBe('B');
    expect(narration()).toBe('lca = B, after 1 table read and 1 pointer move.');
  });

  it('lifts along a 16-node path by 8, 4, 2 and 1', () => {
    render();
    choose('preset', 'path');
    click(button('Đến bước cuối'));
    expect(byTest('d')).toBe('15');
    expect(byTest('reads')).toBe('4');
    expect(byTest('lca')).toBe('A');
  });

  it('adds and removes nodes, refuses the root and undoes', () => {
    render();
    click(node('I'));
    click(buttonByText('Add child'));
    expect(byTest('selected')).toBe('Selected: O');
    expect(byTest('cells')).toBe('60');
    click(node('A'));
    click(buttonByText('Remove subtree'));
    expect(narration()).toBe(m.errors.root);
    click(node('D'));
    click(buttonByText('Remove subtree'));
    // N went with D's subtree, so u falls back to the nearest kept ancestor, B.
    expect(byTest('selected')).toBe('Selected: B');
    click(button('Đến bước cuối'));
    expect(byTest('lca')).toBe('B');
    click(buttonByText('Undo'));
    click(buttonByText('Undo'));
    click(button('Đến bước cuối'));
    expect(byTest('cells')).toBe('56');
  });

  it('refuses a seventeenth node', () => {
    render();
    choose('preset', 'path');
    click(buttonByText('Add child'));
    expect(narration()).toBe(m.errors.full(16));
  });

  it('selects a node with the arrow keys and Enter', () => {
    render();
    const a = /** @type {SVGGElement} */ (node('A'));
    a.focus();
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flushSync();
    /** @type {SVGGElement} */ (document.activeElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    flushSync();
    expect(byTest('selected')).toBe('Selected: B');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '14';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '56';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
