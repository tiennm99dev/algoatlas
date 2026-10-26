// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/recursion-basics/copy.en.js';
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
const stackRows = () => [...document.querySelectorAll('[data-testid="stack"] li')];
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

describe('recursion basics lesson', () => {
  it('pushes a frame per call down to the base case, then pops them', () => {
    render();
    expect(narration()).toBe(
      'Ready to call fact(4). Each call will push its own frame onto the stack.',
    );
    expect(stackRows()[0].textContent).toContain(m.stackEmpty);
    next(1);
    expect(narration()).toBe(
      'Call fact(4): push a frame with n = 4. The stack is 1 deep. Is 4 ≤ 1?',
    );
    next(4);
    expect(narration()).toBe(
      '1 ≤ 1, the base case: fact(1) returns 1 without calling itself, and its frame pops off the stack.',
    );
    expect(stackRows()).toHaveLength(4);
    expect(stackRows()[0].textContent).toContain('fact(1)');
    expect(stackRows()[1].textContent).toContain('n = 2, r = ?');
    next(1);
    expect(narration()).toBe('fact(1) returned 1. Back in fact(2), which resumes with r = 1.');
    expect(stackRows()).toHaveLength(3);
    expect(stackRows()[0].textContent).toContain('n = 2, r = 1');
    click(button('Last step'));
    expect(narration()).toBe(
      'fact(4) = 24 after 4 calls. The stack was at most 4 frames deep and is empty again.',
    );
    expect(byTest('result')).toBe('24');
    expect(byTest('depth')).toBe('0 (max 4)');
  });

  it('switches to Fibonacci and grows a branching call tree', () => {
    render();
    click(field('input[name="fn"][value="fib"]'));
    click(button('Last step'));
    expect(byTest('result')).toBe('3');
    expect(byTest('calls')).toBe('9');
    expect(document.querySelectorAll('svg[role="img"] circle')).toHaveLength(9);
    click(button('Previous step'));
    expect(narration()).toBe('fib(4) = a + b = 2 + 1 = 3. Return 3 and pop the frame.');
  });

  it('refuses an n out of range and keeps the last valid one', () => {
    render();
    commit(field('input[name="n"]'), '20');
    expect(narration()).toBe(m.nError('fact', 12));
    expect(field('input[name="n"]').value).toBe('4');
    commit(field('input[name="n"]'), '6');
    click(button('Last step'));
    expect(byTest('result')).toBe('720');
    click(field('input[name="fn"][value="fib"]'));
    expect(field('input[name="n"]').value).toBe('6');
    commit(field('input[name="n"]'), '9');
    expect(narration()).toBe(m.nError('fib', 8));
  });

  it('overflows the stack without a base case', () => {
    render();
    click(field('input[name="base"]'));
    expect(narration()).toBe(m.baseNotice(false));
    click(button('Last step'));
    expect(byTest('result')).toBe(m.resultOverflow);
    expect(byTest('calls')).toBe('14');
    expect(narration()).toContain('stack overflow after 14 calls');
    expect(text()).toContain(m.legend.lost);
    click(field('input[name="base"]'));
    click(button('Last step'));
    expect(byTest('result')).toBe('24');
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
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
