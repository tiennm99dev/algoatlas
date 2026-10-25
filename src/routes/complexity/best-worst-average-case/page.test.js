// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/best-worst-average-case/copy.en.js';

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
  vi.restoreAllMocks();
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

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('best, worst and average case lesson', () => {
  it('finds 25 at index 4 after 5 comparisons', () => {
    render();
    expect(narration()).toBe('Search for x = 25 in 8 elements, from left to right.');
    click(button('Next step'));
    expect(narration()).toContain('Compare A[0] = 42 with 25: not equal.');
    click(button('Last step'));
    expect(stat('Comparisons (this run)')).toBe('5');
    expect(narration()).toContain('the average (n + 1)/2 = 4.5');
  });

  it('runs the best and worst cases and logs them', () => {
    render();
    click(buttonByText('Best case'));
    click(button('Last step'));
    expect(stat('Comparisons (this run)')).toBe('1');
    click(buttonByText('Worst case'));
    click(button('Last step'));
    expect(stat('Comparisons (this run)')).toBe('8');
    expect(narration()).toContain('This run cost 8 comparisons.');
    expect(input('target').value).toBe('0');
    expect(text()).toContain('best 42: 1');
    expect(text()).toContain('worst 0: 8');
  });

  it('averages the random runs', () => {
    const values = [0.0, 0.99];
    let k = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => values[k++ % 2]);
    render();
    click(buttonByText('Random element'));
    click(buttonByText('Random element'));
    expect(text()).toContain('Average of your 2 random runs: 4.5');
    click(buttonByText('Clear runs'));
    expect(text()).toContain('No random runs yet.');
  });

  it('searches a typed target with Enter and keeps the last valid one', () => {
    render();
    commit(input('target'), '93');
    /** @type {HTMLFormElement} */ (input('target').closest('form')).requestSubmit();
    flushSync();
    click(button('Last step'));
    expect(stat('Comparisons (this run)')).toBe('4');
    commit(input('target'), '120');
    expect(narration()).toBe(m.targetError);
    expect(input('target').value).toBe('93');
  });

  it('rebuilds on a new array and refuses a bad one', () => {
    render();
    commit(input('array'), '5 6 7');
    expect(stat('Worst case')).toBe('3');
    expect(stat('Average, x in the array')).toBe('2');
    commit(input('array'), '1, 2, x');
    expect(narration()).toBe(m.arrayError);
    expect(input('array').value).toBe('5, 6, 7');
    commit(input('array'), Array.from({ length: 13 }, (_, i) => i).join(' '));
    expect(input('array').value).toBe('5, 6, 7');
  });

  it('marks the outcome bar in the profile chart', () => {
    render();
    click(button('Last step'));
    const hot = document.querySelector('rect.fill-state-active');
    expect(hot).toBeTruthy();
    expect(document.querySelectorAll('svg[aria-label^="Bar chart"] rect')).toHaveLength(9);
  });

  it('checks the expected-cost question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[2]);
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
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
