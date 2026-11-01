// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/longest-increasing-subsequence/copy.en.js';
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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
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
const chips = () => {
  const card = [...document.querySelectorAll('h2')].find((h) => h.textContent === m.lisTitle);
  return [...(card?.parentElement?.querySelectorAll('li') ?? [])].map((li) =>
    li.textContent?.trim(),
  );
};
const piles = () =>
  [...document.querySelectorAll('[data-testid="piles"] > ol > li')].map((li) =>
    li.getAttribute('aria-label'),
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('longest increasing subsequence lesson', () => {
  it('runs the O(n²) DP and rebuilds the LIS', () => {
    render();
    click(button('Next step'));
    expect(narration()).toBe(
      'Index 0, value 10: on its own it is a run of length 1, so L[0] = 1. Now check every earlier value.',
    );
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toBe(
      '10 < 22, so 22 can follow the run ending at index 0: L[1] = L[0] + 1 = 2, prev[1] = 0.',
    );
    click(button('Last step'));
    expect(byTest('comparisons')).toBe('45');
    expect(byTest('length')).toBe('6');
    expect(chips()).toEqual(['10', '22', '33', '50', '60', '80']);
    expect(narration()).toBe(
      'The LIS has length 6: 10, 22, 33, 50, 60, 80. That took 45 comparisons.',
    );
  });

  it('deals the values onto piles with fewer comparisons', () => {
    render();
    click(field('input[name="method"][value="patience"]'));
    expect(piles()).toEqual([]);
    for (let k = 0; k < 3; k++) click(button('Next step'));
    expect(narration()).toBe(
      'Take a[1] = 22. Binary search the 1 pile top for the leftmost top ≥ 22.',
    );
    click(button('Next step'));
    expect(narration()).toBe(
      'Search piles 0 to 0: the top of pile 0 is 10 < 22, so look to the right of it.',
    );
    click(button('Last step'));
    expect(byTest('comparisons')).toBe('17');
    expect(byTest('length')).toBe('6');
    expect(piles()).toHaveLength(6);
    expect(piles()[0]).toBe('Pile 0, bottom to top: 10, 9, 3.');
    expect(chips()).toEqual(['10', '22', '33', '41', '60', '80']);
  });

  it('runs on typed values and refuses bad ones', () => {
    render();
    commit(field('input[name="values"]'), '3 1 4 1 5 9 2 6');
    click(button('Last step'));
    expect(byTest('length')).toBe('4');
    expect(byTest('comparisons')).toBe('28');
    commit(field('input[name="values"]'), '3, x');
    expect(narration()).toBe(m.valueErrors(12, 99).format);
    expect(field('input[name="values"]').value).toBe('3, 1, 4, 1, 5, 9, 2, 6');
    click(buttonByText(m.exampleButton));
    expect(field('input[name="values"]').value).toBe('10, 22, 9, 33, 21, 50, 41, 60, 80, 3');
  });

  it('steps back with the arrow keys', () => {
    render();
    click(button('Last step'));
    const before = narration();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    flushSync();
    expect(narration()).not.toBe(before);
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
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
