// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { selectTrace } from '$lib/algo-engine/quickselect.js';
import { en as m } from '$lib/lessons/quickselect/copy.en.js';

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
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
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

/** @param {number} index */
function seek(index) {
  const el = /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Step"]'));
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** @param {string} value */
function pickRule(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const EXAMPLE = [38, 12, 77, 5, 64, 29, 91, 46, 18, 83, 55, 3];

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('quickselect lesson', () => {
  it('starts on the 6th smallest of the example', () => {
    render();
    expect(narration()).toContain('Find the 6th smallest of 12 values');
    expect(narration()).toContain('slot 5');
  });

  it('finds the answer and reports rounds and comparisons', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('The 6th smallest is 38, found in 2 rounds with 21 comparisons');
    expect(stat('Rounds')).toBe('2');
  });

  it('fades the discarded side after a discard', () => {
    render();
    const trace = selectTrace(EXAMPLE, 6, 'last');
    const at = trace.findIndex((f) => f.kind === 'discard');
    seek(at);
    expect(narration()).toMatch(/so discard \[\d+–\d+\]/);
    expect(stat('Live values')).toBe(String(trace[at].hi - trace[at].lo + 1));
  });

  it('shows groups of 5 and their medians under median of medians', () => {
    render();
    pickRule('mom');
    expect(narration()).toContain('Pivot rule: Median of medians.');
    expect(text()).toContain('medianOfMedians(a, lo, hi):');
    const trace = selectTrace(EXAMPLE, 6, 'mom');
    seek(trace.findIndex((f) => f.kind === 'groups'));
    expect(narration()).toContain('into 3 groups of at most 5');
    seek(trace.findIndex((f) => f.kind === 'medians'));
    expect(narration()).toContain('found by a recursive selection');
    const strip = document.querySelector('[aria-label^="Array:"]');
    expect(strip?.textContent).toContain('m');
    expect(strip?.getAttribute('aria-label')).toContain('g1');
  });

  it('compares the three pivot rules on the same input', () => {
    render();
    expect(text()).toMatch(/Last value\s*21 comparisons/);
    expect(text()).toMatch(/Median of medians\s*30 comparisons/);
    expect(text()).toContain('19 of them spent choosing pivots');
    expect(text()).toContain('Sort first, then index');
  });

  it('runs the random rule without breaking the answer', () => {
    render();
    pickRule('random');
    click(button('Last step'));
    expect(narration()).toContain('The 6th smallest is 38');
  });

  it('shows the quadratic case for the minimum of sorted input', () => {
    render();
    commit(field('preset'), 'sorted');
    expect(text()).toContain('New array loaded.');
    commit(field('k'), '1');
    click(button('Last step'));
    expect(narration()).toContain('found in 11 rounds with 66 comparisons');
    pickRule('mom');
    click(button('Last step'));
    expect(narration()).toContain('found in 3 rounds with 36 comparisons');
  });

  it('refuses a k outside 1..n and bad values, keeping the last valid ones', () => {
    render();
    commit(field('k'), '13');
    expect(narration()).toContain('k must be a whole number from 1 to 12');
    expect(/** @type {HTMLInputElement} */ (field('k')).value).toBe('6');
    commit(field('values'), '1, 2, q');
    expect(narration()).toContain('Type whole numbers');
    expect(/** @type {HTMLInputElement} */ (field('values')).value).toBe(EXAMPLE.join(', '));
  });

  it('clamps k when fewer values are typed, and commits on Enter', () => {
    render();
    const values = /** @type {HTMLInputElement} */ (field('values'));
    values.value = '9 4 7';
    values.dispatchEvent(new Event('input', { bubbles: true }));
    values.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('Find the 3rd smallest of 3 values');
  });

  it('loads a random array from the button', () => {
    render();
    click(buttonByText('Random array'));
    expect(text()).toContain('New array loaded.');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[2]);
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
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
