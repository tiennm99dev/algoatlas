// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/backtracking-search-tree/copy.en.js';
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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
const nodes = () => [...document.querySelectorAll('[data-node]')];

describe('backtracking and the search tree lesson', () => {
  it('grows the tree as it steps and reports the answers', () => {
    render();
    expect(narration()).toContain('Start at the root');
    expect(nodes()).toHaveLength(1);
    click(button('Next step'));
    expect(narration()).toBe('Choose 3 and explore that branch. The sum is now 3.');
    expect(nodes()).toHaveLength(2);
    click(button('Last step'));
    expect(byTest('visited')).toBe('19 / 31');
    expect(byTest('pruned')).toBe('8');
    expect(byTest('solutions')).toBe('2');
    expect(narration()).toBe('Found 2 answers, after visiting 19 nodes and pruning 8.');
    expect(document.body.textContent).toContain('{3, 4}');
    expect(document.body.textContent).toContain('{5, 2}');
  });

  it('visits more nodes with weaker pruning', () => {
    render();
    click(field('input[name="prune"][value="off"]'));
    click(button('Last step'));
    expect(byTest('visited')).toBe('31 / 31');
    expect(byTest('pruned')).toBe('0');
    click(field('input[name="prune"][value="over"]'));
    click(button('Last step'));
    expect(byTest('visited')).toBe('25 / 31');
  });

  it('loads an example and edits the numbers and target', () => {
    render();
    commit(field('select[name="preset"]'), 'all');
    click(button('Last step'));
    expect(byTest('visited')).toBe('11 / 63');
    commit(field('input[name="numbers"]'), '2 3');
    commit(field('input[name="target"]'), '5');
    click(button('Last step'));
    expect(byTest('solutions')).toBe('1');
    expect(document.body.textContent).toContain('{2, 3}');
  });

  it('refuses bad input and keeps the last valid values', () => {
    render();
    commit(field('input[name="numbers"]'), '1 2 3 4 5 6');
    expect(narration()).toBe('Enter 1 to 5 whole numbers from 1 to 20.');
    expect(field('input[name="numbers"]').value).toBe('3, 5, 2, 4');
    commit(field('input[name="target"]'), '0');
    expect(narration()).toBe('The target must be a whole number from 1 to 100.');
    expect(field('input[name="target"]').value).toBe('7');
  });

  it('jumps to a node from the pointer and the keyboard', () => {
    render();
    click(button('Last step'));
    click(/** @type {Element} */ (document.querySelector('[data-node="0"]')));
    expect(byTest('visited')).toBe('1 / 31');
    click(button('Last step'));
    /** @type {Element} */ (document.querySelector('[data-node="0"]')).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(byTest('visited')).toBe('1 / 31');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Choose 3');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelector('li[aria-labelledby]'));
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '30';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('full binary tree');
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Not quite');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
