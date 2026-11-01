// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/memoization-tabulation/copy.en.js';
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
const treeNodes = () => document.querySelectorAll('svg[aria-label^="Call tree"] circle').length;
/** @param {string} label */
const cellTitles = (label) =>
  [...document.querySelectorAll('svg title')]
    .map((t) => t.textContent ?? '')
    .filter((t) => t.startsWith(label));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('memoization and tabulation lesson', () => {
  it('runs plain recursion and counts the repeated work', () => {
    render();
    expect(narration()).toBe(
      'Ready to call fib(5). Plain recursion stores nothing, so it will work out the same values again and again.',
    );
    click(button('Next step'));
    expect(narration()).toBe('Call fib(5). Is 5 ≤ 1?');
    click(button('Last step'));
    expect(byTest('result')).toBe('5');
    expect(byTest('calls')).toBe('15');
    expect(byTest('additions')).toBe('7');
    expect(byTest('hits')).toBe('0');
    expect(treeNodes()).toBe(15);
    expect(narration()).toBe(
      'fib(5) = 5 after 15 calls and 7 additions. fib(1) alone was worked out 5 times.',
    );
    expect(cellTitles('fib(2) worked out')).toEqual(['fib(2) worked out 3 times, repeated work']);
  });

  it('collapses the tree with memoization and drops it with tabulation', () => {
    render();
    click(field('input[name="mode"][value="memo"]'));
    click(button('Last step'));
    expect(byTest('calls')).toBe('9');
    expect(byTest('hits')).toBe('3');
    expect(byTest('additions')).toBe('4');
    expect(treeNodes()).toBe(9);
    expect(cellTitles('memo[5]')).toEqual(['memo[5]: 5, the answer']);
    click(button('Previous step'));
    expect(narration()).toBe(
      'fib(5) = fib(4) + fib(3) = 3 + 2 = 5. Store it in memo[5] so every later call can look it up.',
    );

    click(field('input[name="mode"][value="table"]'));
    expect(byTest('no-tree')).toBe(m.tableTreeText);
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toBe(
      'dp[3] = dp[2] + dp[1] = 1 + 1 = 2. Both cells were filled earlier in the loop.',
    );
    expect(cellTitles('dp[1]')).toEqual(['dp[1]: 1, read now']);
    click(button('Last step'));
    expect(byTest('calls')).toBe('0');
    expect(byTest('additions')).toBe('4');
    expect(byTest('result')).toBe('5');
  });

  it('refuses an n out of range and keeps the last valid one', () => {
    render();
    commit(field('input[name="n"]'), '9');
    expect(narration()).toBe(m.nError(8));
    expect(field('input[name="n"]').value).toBe('5');
    commit(field('input[name="n"]'), '6');
    click(button('Last step'));
    expect(byTest('calls')).toBe('25');
    expect(byTest('result')).toBe('8');
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
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '25';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
