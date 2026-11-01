// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-dynamic-programming/copy.en.js';
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
const arrows = () => document.querySelectorAll('line[marker-end]').length;
const sample = (/** @type {string} */ name) =>
  /** @type {HTMLButtonElement} */ (document.querySelector(`button[data-sample="${name}"]`));
/** @param {string} term */
const term = (term) => field(`input[name="term-${term}"]`);

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('dynamic programming practice lesson', () => {
  it('opens on a failing design and shows the first wrong cell', () => {
    render();
    expect(narration()).toBe('Run your design on 9 values.');
    expect(byTest('samples-summary')).toBe('1 of 5 samples pass.');
    click(buttonByText(m.jumpWrong));
    expect(narration()).toBe(
      'dp[i−1] + a[i] → −1. dp[2] = −1. ✕ Your meaning says it should be 1.',
    );
  });

  it('solves maximum subarray once the design is right', () => {
    render();
    click(field('input[name="state"][value="ending"]'));
    click(term('a'));
    click(field('input[name="answer"][value="largest"]'));
    expect(byTest('samples-summary')).toBe(
      'All 5 samples pass: the cells keep the promise and the answer is right.',
    );
    click(button('Last step'));
    expect(byTest('got')).toBe('6 ✓');
    expect(byTest('expected')).toBe('6');
    expect(byTest('wrong')).toBe('0');
    expect(narration()).toBe(
      'Solved on this input: every cell keeps its promise and the answer is right.',
    );
    click(buttonByText(m.jumpWrong));
    expect(narration()).toBe(m.noWrong);
  });

  it('steps a cell with its options and arrows', () => {
    render();
    click(field('input[name="state"][value="ending"]'));
    click(term('a'));
    click(button('Next step'));
    expect(narration()).toBe('Base: dp[0] = 0.');
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toBe(
      'a[i] → 1; dp[i−1] + a[i] → −1. dp[2] = 1. ✓ It matches the meaning you chose.',
    );
    expect(byTest('options')).toContain('✓ chosen');
    expect(arrows()).toBe(1);
  });

  it('solves decode ways, and shows what a base of 0 does', () => {
    render();
    click(field('input[name="problem"][value="decode"]'));
    expect(field('input[name="values"]').value).toBe('226');
    click(term('prev'));
    click(term('prev-if'));
    click(term('prev2'));
    click(term('prev2-if'));
    click(button('Last step'));
    expect(byTest('got')).toBe('0 ✕');
    expect(byTest('expected')).toBe('3');
    click(field('input[name="base"][value="1"]'));
    click(button('Last step'));
    expect(byTest('got')).toBe('3 ✓');
    expect(byTest('samples-summary')).toContain('All 5 samples pass');
    click(sample('Sample 5'));
    expect(field('input[name="values"]').value).toBe('100');
    click(button('Last step'));
    expect(byTest('got')).toBe('0 ✓');
  });

  it('tells a state that does not answer the question from a broken cell', () => {
    render();
    click(field('input[name="problem"][value="climb"]'));
    click(field('input[name="state"][value="every"]'));
    click(button('Last step'));
    expect(byTest('wrong')).toBe('0');
    expect(narration()).toBe(
      'Every cell keeps its promise, but the answer is wrong. Either the state does not answer the question, or the answer is read from the wrong place.',
    );
  });

  it('keeps a design per problem', () => {
    render();
    click(term('a'));
    click(field('input[name="problem"][value="climb"]'));
    expect(term('prev-a').checked).toBe(true);
    expect(term('a').checked).toBe(false);
    click(field('input[name="problem"][value="max-subarray"]'));
    expect(term('a').checked).toBe(true);
  });

  it('reads typed input, adds it to the samples and refuses bad input', () => {
    render();
    commit(field('input[name="values"]'), '4, -1, 2');
    expect(sample(m.yourInput).textContent).toContain('4, −1, 2');
    expect(field('input[name="values"]').value).toBe('4, −1, 2');
    commit(field('input[name="values"]'), '4, x');
    expect(narration()).toBe('Write whole numbers separated by commas.');
    expect(field('input[name="values"]').value).toBe('4, −1, 2');
    commit(field('input[name="values"]'), '500');
    expect(narration()).toBe('Each value must be from −99 to 99.');
    commit(field('input[name="values"]'), '');
    expect(narration()).toBe('Type 1 to 10 values.');
  });

  it('draws a random input', () => {
    render();
    click(buttonByText(m.randomInput));
    expect(narration()).toMatch(/^Run your design on \d+ values\.$/);
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toBe('Base: dp[0] = 0.');
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
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
