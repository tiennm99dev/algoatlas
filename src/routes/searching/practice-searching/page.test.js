// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/practice-searching/copy.en.js';
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

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {number} x */
const targetCell = (x) =>
  /** @type {HTMLButtonElement} */ (document.querySelector(`button[data-target="${x}"]`));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: searching problems', () => {
  it('opens on version B missing 12', () => {
    render();
    expect(text()).toContain(
      'Version B: look for 12 in 7 sorted values, starting with lo = 0 and hi = 6.',
    );
    expect(text()).toContain('while lo < hi:');
    click(button('Last step'));
    expect(text()).toContain('Wrong: 12 is at index 2, and that cell was never read.');
    expect(byTest('verdict')).toBe('✕ misses x');
    expect(byTest('result')).toBe('-1');
    expect(byTest('targets-summary')).toBe('Version B fails on 4 of 30 targets.');
    expect(targetCell(12).getAttribute('aria-label')).toBe('Target 12: misses x');
  });

  it('version A is correct everywhere', () => {
    render();
    click(buttonByText('Version A'));
    expect(byTest('targets-summary')).toBe('Version A is correct on all 30 targets.');
    click(button('Last step'));
    expect(text()).toContain('Return 2: a[2] = 12. Correct after 3 probes.');
  });

  it('a target cell loads that target, and version C loops on 30', () => {
    render();
    click(buttonByText('Version C'));
    click(targetCell(30));
    expect(input('target').value).toBe('30');
    click(button('Last step'));
    expect(text()).toContain('lo = 5, hi = 6 is a state this run has been in before.');
    expect(byTest('result')).toBe('never');
    expect(byTest('broken')).toBe('24 of 30');
    expect(text()).toContain('(5, 6)');
  });

  it('version D reads past the end above every value', () => {
    render();
    click(buttonByText('Version D'));
    commit(input('target'), '31');
    click(button('Last step'));
    expect(text()).toContain('mid = 7 = n, so reading a[7] goes past the end of the array.');
    expect(byTest('verdict')).toBe('⚠ reads past the end');
  });

  it('a typed one-value array shows the single failure of each version', () => {
    render();
    commit(input('values'), '5');
    expect(byTest('targets-summary')).toBe('Version B fails on 1 of 3 targets.');
    click(buttonByText('Version E'));
    expect(targetCell(4).getAttribute('aria-label')).toBe('Target 4: loops forever');
  });

  it('refuses unsorted input and bad targets with a notice', () => {
    render();
    commit(input('values'), '8, 3');
    expect(text()).toContain('Binary search needs sorted input');
    expect(input('values').value).toBe('3, 8, 12, 17, 21, 26, 30');
    commit(input('target'), '99');
    expect(text()).toContain('The target must be a whole number from 0 to 60.');
    expect(input('target').value).toBe('12');
  });

  it('reveals the changed line on request', () => {
    render();
    expect(byTest('change')).toBeUndefined();
    click(input('show-change'));
    expect(byTest('change')).toBe('Changed line 2: while lo < hi:');
    click(buttonByText('Version A'));
    expect(byTest('change')).toBe(m.noChange);
  });

  it('New array loads a sorted array', () => {
    render();
    click(buttonByText('New array'));
    const vals = input('values').value.split(', ').map(Number);
    expect(vals.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThan(vals[i - 1]);
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
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '22';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
