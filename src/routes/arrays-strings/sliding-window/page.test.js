// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/sliding-window/copy.en.js';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickMode(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="mode"][value="${value}"]`)
    ),
  );
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let i = 0; i < 400 && !narration().includes(part); i++) click(button('Next step'));
}

const arrayLabel = () =>
  document.querySelector(`svg[aria-label^="${m.arrayAria}"]`)?.getAttribute('aria-label') ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('sliding window lesson', () => {
  it('slides a window of 3 to the best sum 9', () => {
    render();
    expect(narration()).toBe(
      'Find the largest sum of 3 consecutive values among 6. Start by adding up the first window.',
    );
    click(button('Next step'));
    expect(narration()).toBe('Add a[0] = 2: the first window’s sum is 2 so far.');
    stepUntil('Slide right');
    expect(narration()).toBe(
      'Slide right: add a[3] = 1 and take out a[0] = 2, so the sum is 7, not more than the best 8.',
    );
    expect(text()).toContain('Running sum: 8 + 1 − 2 = 7');
    expect(arrayLabel()).toContain('sum 7 covers 1 to 3');
    expect(arrayLabel()).toContain('best covers 0 to 2');
    expect(text()).toContain('Index 3: 1, just added to the sum');
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: the best window is a[2..5) with sum 9, after 9 updates instead of 12.',
    );
    expect(stat(m.stats.best)).toBe('9');
    expect(stat(m.stats.updates)).toBe('9');
    expect(stat(m.stats.brute)).toBe('12');
  });

  it('grows and shrinks a variable window', () => {
    render();
    pickMode('variable');
    expect(text()).toContain('shortestWindow(a, S):');
    stepUntil('Take out');
    expect(narration()).toBe('Take out a[0] = 2 and move l to 1: sum 6.');
    click(button('Last step'));
    expect(narration()).toBe(
      'Done: the shortest window is a[0..3), length 3. Each value entered once and left at most once: 9 updates.',
    );
    expect(stat(m.stats.bestLength)).toBe('3');
    expect(stat(m.stats.shrinks)).toBe('3');
    expect(stat(m.stats.brute)).toBe('21');
    commit(input('s'), '100');
    click(button('Last step'));
    expect(stat(m.stats.bestLength)).toBe(m.none);
    expect(narration()).toContain('no run of values reaches 100');
  });

  it('finds 4, 3 with five left moves', () => {
    render();
    pickMode('variable');
    commit(input('values'), '2 3 1 2 4 3');
    click(button('Last step'));
    expect(stat(m.stats.bestLength)).toBe('2');
    expect(stat(m.stats.shrinks)).toBe('5');
    expect(input('values').value).toBe('2, 3, 1, 2, 4, 3');
  });

  it('rejects bad input and keeps the last valid values', () => {
    render();
    commit(input('values'), '1, -2');
    expect(narration()).toBe(m.valueErrors.format);
    expect(input('values').value).toBe('2, 1, 5, 1, 3, 2');
    commit(input('values'), '1, 200');
    expect(narration()).toBe(m.valueErrors.range);
    commit(input('k'), '7');
    expect(narration()).toBe(m.kError(6));
    expect(input('k').value).toBe('3');
    commit(input('values'), '4 4');
    expect(input('k').value).toBe('2');
    click(button('Last step'));
    expect(stat(m.stats.best)).toBe('8');
  });

  it('draws random values', () => {
    render();
    click(buttonByText(m.randomButton));
    expect(input('values').value.split(', ')).toHaveLength(12);
    click(button('Last step'));
    expect(stat(m.stats.updates)).toBe(String(3 + 2 * 9));
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '8';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
