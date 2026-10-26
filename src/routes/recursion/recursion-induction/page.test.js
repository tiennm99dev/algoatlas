// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/recursion-induction/copy.en.js';
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
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

describe('recursion and induction lesson', () => {
  it('checks the sum invariant on entry, after each pass and on exit', () => {
    render();
    next(1);
    expect(narration()).toBe(
      'Initialization, before the first pass (i = 0): s = 0, and the sum of no values is 0. The invariant holds ✓.',
    );
    next(1);
    expect(narration()).toContain('In the middle of a pass the invariant may be broken');
    expect(byTest('verdict')).toBe(m.notChecked);
    next(1);
    expect(narration()).toBe(
      'Maintenance, after the pass (i = 1): s = 5, and a[0] = 5. The invariant holds ✓.',
    );
    expect(byTest('verdict')).toBe('✓ holds');
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: the answer is 10. All 8 checks held, so the argument goes through for this input and, by the same reasoning, for every input.',
    );
    expect(byTest('answer')).toContain('(right)');
    expect(byTest('passed')).toBe('8');
  });

  it('shows where a bug breaks the argument', () => {
    render();
    click(field('input[name="buggy"]'));
    expect(narration()).toBe(m.bugNotice(true, 'Sum loop'));
    next(1);
    expect(narration()).toBe(
      'Initialization, before the first pass (i = 1): s = 0, and a[0] = 5. The invariant is broken ✗.',
    );
    click(button('Last step'));
    expect(byTest('failed')).toBe('7');
    expect(byTest('passed')).toBe('0');
    expect(byTest('answer')).toContain('(wrong)');
  });

  it('catches the insertion sort bug on reversed input but not on sorted input', () => {
    render();
    commit(field('select[name="program"]'), 'insertion');
    click(field('input[name="buggy"]'));
    commit(field('select[name="preset"]'), 'sorted');
    click(button('Last step'));
    expect(byTest('failed')).toBe('0');
    expect(narration()).toContain('All 6 checks held on this input, yet the bug is still there');
    expect(narration()).not.toContain('by the same reasoning');
    commit(field('select[name="preset"]'), 'reversed');
    click(button('Last step'));
    expect(byTest('answer')).toContain('9, 0, 2, 4, 7');
    expect(byTest('failed')).toBe('5');
    click(button('Previous step'));
    expect(narration()).toContain('a[0] = 9 > a[1] = 0, so a[0..4] is not sorted');
  });

  it('proves the recursive sum by induction', () => {
    render();
    commit(field('select[name="program"]'), 'recursive');
    next(1);
    expect(narration()).toBe(
      'Call sum(a, 6). It needs sum(a, 5) first, so another frame goes on the stack.',
    );
    next(7);
    expect(narration()).toBe(
      'Base case: sum(a, 0) returned 0, and the sum of no values is 0. P(0) holds ✓.',
    );
    expect(text()).toContain('sum(a, 0)');
    next(2);
    expect(narration()).toBe(
      'Inductive step for P(2): r = sum(a, 1), then add a[1] = −2. Now sum(a, 2) returned 3, and the first 2 values add up to 3. P(2) holds ✓.',
    );
    click(button('Last step'));
    expect(byTest('passed')).toBe('7');
  });

  it('refuses bad values and keeps the last valid array', () => {
    render();
    commit(field('input[name="values"]'), '3, x');
    expect(narration()).toBe(m.valueErrors.format);
    expect(field('input[name="values"]').value).toBe('5, −2, 9, 1, −7, 4');
    commit(field('input[name="values"]'), '100');
    expect(narration()).toBe(m.valueErrors.range);
    commit(field('input[name="values"]'), '2 −3 4');
    click(button('Last step'));
    expect(byTest('answer')).toContain('3');
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
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[2]);
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
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '13';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
