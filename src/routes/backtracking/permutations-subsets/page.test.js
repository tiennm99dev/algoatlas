// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/permutations-subsets/copy.en.js';
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

describe('permutations, combinations and subsets lesson', () => {
  it('lists the permutations as the recursion picks and unpicks', () => {
    render();
    expect(narration()).toContain('Generate every permutation of 3 items');
    click(button('Next step'));
    expect(narration()).toBe('Pick A. The path is now A.');
    click(button('Last step'));
    expect(byTest('results')).toBe('6');
    expect(byTest('calls')).toBe('16');
    expect(byTest('copied')).toBe('18');
    expect(byTest('count')).toBe('n! = 6 if every item is different.');
    expect(narration()).toBe('Done: 6 results from 16 calls, with 18 items copied.');
  });

  it('skips duplicates only when asked to', () => {
    render();
    commit(field('input[name="items"]'), 'A A B');
    click(button('Last step'));
    expect(byTest('results')).toBe('6');
    click(field('input[name="unique"][value="on"]'));
    click(button('Last step'));
    expect(byTest('results')).toBe('3');
    expect(byTest('skipped')).not.toBe('0');
  });

  it('switches between the three problems', () => {
    render();
    click(field('input[name="mode"][value="subset"]'));
    click(button('Last step'));
    expect(byTest('results')).toBe('8');
    click(field('input[name="mode"][value="comb"]'));
    click(button('Last step'));
    expect(byTest('results')).toBe('3');
    commit(field('input[name="k"]'), '1');
    click(button('Last step'));
    expect(byTest('results')).toBe('3');
    commit(field('input[name="k"]'), '3');
    click(button('Last step'));
    expect(byTest('results')).toBe('1');
  });

  it('loads an example', () => {
    render();
    commit(field('select[name="preset"]'), 'five');
    click(button('Last step'));
    expect(byTest('results')).toBe('10');
    expect(field('input[name="items"]').value).toBe('A B C D E');
    commit(field('select[name="preset"]'), 'twins');
    click(button('Last step'));
    expect(byTest('results')).toBe('6');
  });

  it('cuts the list to the smaller cap on a switch to permutations', () => {
    render();
    commit(field('select[name="preset"]'), 'five');
    click(field('input[name="mode"][value="perm"]'));
    expect(field('input[name="items"]').value).toBe('A B C D');
  });

  it('refuses bad input and keeps the last valid values', () => {
    render();
    commit(field('input[name="items"]'), 'A B C D E');
    expect(narration()).toBe(
      'Enter 1 to 4 items, separated by spaces, each one or two letters or digits.',
    );
    expect(field('input[name="items"]').value).toBe('A B C');
    click(field('input[name="mode"][value="comb"]'));
    commit(field('input[name="k"]'), '9');
    expect(narration()).toBe('k must be a whole number from 0 to 3.');
    expect(field('input[name="k"]').value).toBe('2');
  });

  it('jumps to a call from the tree, by pointer and by keyboard', () => {
    render();
    click(button('Last step'));
    click(/** @type {Element} */ (document.querySelector('[data-node="0"]')));
    expect(byTest('calls')).toBe('1');
    click(button('Last step'));
    /** @type {Element} */ (document.querySelector('[data-node="0"]')).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    flushSync();
    expect(byTest('calls')).toBe('1');
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
    answer.value = '12';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {Element} */ (hint));
    expect(q.textContent).toContain('Four ways');
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).not.toContain('Not quite');
    expect(m.practice.flatMap((ex) => exerciseProblems(ex))).toEqual([]);
  });
});
