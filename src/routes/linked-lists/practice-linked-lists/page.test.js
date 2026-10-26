// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { mergeTrace, middleTrace, nthTrace } from '$lib/algo-engine/practice-linked-lists.js';
import { en as m } from '$lib/lessons/practice-linked-lists/copy.en.js';
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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Next step'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {string} key */
const link = (key) => document.querySelector(`path[data-link="${key}"]`);

/** @param {'merge'|'middle'|'nth'} value */
function pickProblem(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="problem"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

describe('practice: linked list problems', () => {
  it('merges the two starting lists by relinking nodes', () => {
    render();
    expect(narration()).toContain('a starts at 2, b at 1.');
    next(1);
    expect(narration()).toBe('1 < 2: link tail → 1 and move b on to 6.');
    expect(link('-2-next')?.getAttribute('class')).toContain('stroke-teal-700');
    click(button('Last step'));
    expect(narration()).toBe('Merged: 1 → 2 → 5 → 6 → 7 → 9 → 12. 6 comparisons and no new nodes.');
    expect(byTest('answer')).toBe('1 → 2 → 5 → 6 → 7 → 9 → 12');
    expect(byTest('comparisons')).toBe('6');
  });

  it('refuses an unsorted list for merging and keeps the last one', () => {
    render();
    commit(input('list-b'), '9, 3');
    expect(narration()).toBe(m.listErrors.unsorted);
    expect(input('list-b').value).toBe('1, 6, 7, 12');
  });

  it('answers the first practice question in the sandbox', () => {
    render();
    commit(input('list-a'), '1, 4, 6');
    commit(input('list-b'), '2, 3, 7');
    click(button('Last step'));
    expect(byTest('comparisons')).toBe(
      String(m.practice[0].type === 'number' && m.practice[0].answer),
    );
  });

  it('finds the middle with slow and fast', () => {
    render();
    pickProblem('middle');
    commit(input('list-a'), '10, 20, 30, 40, 50, 60');
    click(button('Last step'));
    expect(byTest('answer')).toBe('40');
    expect(narration()).toContain('the second of the two middle nodes of 6');
    expect(document.querySelector('input[name="list-b"]')).toBeNull();
  });

  it('removes the nth node from the end in one pass', () => {
    render();
    pickProblem('nth');
    commit(input('list-a'), '5, 8, 13, 21, 34');
    commit(input('n'), '2');
    next(2);
    expect(narration()).toBe('fast moves to 8: now 2 of 2 steps ahead of slow.');
    click(button('Last step'));
    expect(byTest('answer')).toBe('removed 21');
    expect(narration()).toBe('Return dummy.next: 5 → 8 → 13 → 34. One pass, 8 pointer moves.');
  });

  it('removes the head through the dummy and refuses an n past the length', () => {
    render();
    pickProblem('nth');
    commit(input('list-a'), '5, 8, 13');
    commit(input('n'), '3');
    click(button('Last step'));
    expect(narration()).toContain('Return dummy.next: 8 → 13.');
    commit(input('n'), '4');
    expect(narration()).toBe(m.nError(3));
    expect(input('n').value).toBe('3');
  });

  it('sorts list A when switching back to merge', () => {
    render();
    pickProblem('middle');
    commit(input('list-a'), '9, 1, 5');
    pickProblem('merge');
    expect(narration()).toBe(m.sortedForMerge);
    expect(input('list-a').value).toBe('1, 5, 9');
  });

  it('stores practice answers that the engine reproduces', () => {
    const last = (/** @type {any[]} */ f) => f[f.length - 1];
    /** @param {number} i */
    const answer = (i) => {
      const ex = m.practice[i];
      return ex.type === 'number' ? ex.answer : NaN;
    };
    expect(last(mergeTrace([1, 4, 6], [2, 3, 7])).comparisons).toBe(answer(0));
    expect(last(mergeTrace([1, 2, 3], [4, 5, 6])).comparisons).toBe(answer(1));
    const mid = last(middleTrace([10, 20, 30, 40, 50, 60]));
    expect(mid.values[mid.slow]).toBe(answer(2));
    expect(last(middleTrace([1, 2, 3, 4, 5, 6, 7])).moves / 3).toBe(answer(3));
    expect(nthTrace([5, 8, 13, 21, 34], 2).filter((f) => f.kind === 'slide')).toHaveLength(
      answer(4),
    );
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const field = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    field.value = '6';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    field.value = '5';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
