// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { TREE_PRESETS, treeDpTrace } from '$lib/algo-engine/tree-dp.js';
import { en as m } from '$lib/lessons/tree-dp/copy.en.js';
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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button with text ${label}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {Element} el @param {string} key */
function press(el, key) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const node = (name) => {
  const el = [...document.querySelectorAll('[role="button"][aria-label]')].find((n) =>
    n.getAttribute('aria-label')?.startsWith(`Node ${name},`),
  );
  if (!el) throw new Error(`no node ${name}`);
  return el;
};
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
const nodeCount = () =>
  [...document.querySelectorAll('[role="button"][aria-label]')].filter((n) =>
    n.getAttribute('aria-label')?.startsWith('Node '),
  ).length;

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('tree DP lesson', () => {
  it('solves the independent set in post-order and reads the choice back', () => {
    render();
    expect(narration()).toContain('Pick nodes of the largest total weight');
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Solve A: picked alone it brings inc = 3; left out, exc = 0. Its children come first.',
    );
    for (let i = 0; i < 4; i++) click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Fold in E (inc 6, exc 0). If B is picked, E must be left out: inc[B] += 0 → 5. If not, E takes its better value: exc[B] += 6 → 6.',
    );
    expect(node('E').getAttribute('aria-label')).toBe(
      'Node E, weight 6, include 6, exclude 0, child read now',
    );
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Best total 16, from the picked nodes A, E, F, G, H.');
    expect(byTest('answer')).toBe('16');
    expect(byTest('settled')).toBe('8 / 8');
    expect(byTest('edges')).toBe('7 / 7');
    expect(byTest('naive')).toBe('256');
    expect(node('B').getAttribute('aria-label')).toContain('left out');
  });

  it('reroots the tree for every distance sum', () => {
    render();
    click(field('input[name="problem"][value="reroot"]'));
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('11');
    expect(byTest('edges')).toBe('14 / 14');
    expect(byTest('naive')).toBe('56');
    expect(node('D').getAttribute('aria-label')).toBe(
      'Node D, distance sum 13, distance sum known',
    );
    expect(node('A').getAttribute('aria-label')).toBe('Node A, distance sum 11, best centre');
    click(button('Bước trước'));
    expect(narration()).toBe(
      'Move the root from D to H: 1 node comes one step closer and 7 move one step away. all[H] = 13 − 1 + 7 = 19.',
    );
  });

  it('edits the tree through the selected node', () => {
    render();
    click(buttonByText(m.addChild));
    expect(narration()).toBe(m.selectFirst);
    click(node('C'));
    expect(field('input[name="weight"]').value).toBe('2');
    commit(field('input[name="weight"]'), '9');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('22');
    commit(field('input[name="weight"]'), '99');
    expect(narration()).toBe(m.weightError(20));
    expect(field('input[name="weight"]').value).toBe('9');
    click(buttonByText(m.addChild));
    expect(nodeCount()).toBe(9);
    expect(field('input[name="weight"]').value).toBe('1');
    click(buttonByText(m.removeSubtree));
    expect(nodeCount()).toBe(8);
    click(node('A'));
    click(buttonByText(m.removeSubtree));
    expect(narration()).toBe(m.rootError);
    click(node('B'));
    click(buttonByText(m.removeSubtree));
    expect(nodeCount()).toBe(5);
  });

  it('picks nodes with the keyboard and loads presets', () => {
    render();
    press(node('A'), 'ArrowDown');
    press(node('B'), 'Enter');
    expect(field('input[name="weight"]').value).toBe('5');
    const select = /** @type {HTMLSelectElement} */ (
      document.querySelector('select[name="preset"]')
    );
    commit(select, 'star');
    expect(nodeCount()).toBe(6);
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('10');
  });

  it('stores practice answers that the engine reproduces', () => {
    /** @param {number} i @returns {number} */
    const stored = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    const [company, path] = TREE_PRESETS;
    expect(treeDpTrace('mis', company.tree).at(-1)?.result).toBe(stored(0));
    expect(treeDpTrace('mis', path.tree).at(-1)?.exc[0]).toBe(stored(1));
    expect(treeDpTrace('reroot', company.tree).at(-1)?.all[3]).toBe(stored(3));
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
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '16';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
