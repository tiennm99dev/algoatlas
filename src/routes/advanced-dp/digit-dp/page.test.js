// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { digitTrace } from '$lib/algo-engine/digit-dp.js';
import { en as m } from '$lib/lessons/digit-dp/copy.en.js';
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
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** Names given by an aria-label or an SVG title. @param {string} start */
const labelled = (start) =>
  [
    ...[...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label')),
    ...[...document.querySelectorAll('title')].map((el) => el.textContent),
  ].filter((l) => l?.startsWith(start));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('digit DP lesson', () => {
  it('fills digit by digit and lets the tight prefix die', () => {
    render();
    expect(narration()).toContain('Count the numbers from 0 to 345 whose digits add up to 10.');
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(narration()).toBe(
      'The tight prefix (sum 0) may take a digit below 3, from 0 to 2. Each one falls below N and becomes loose: +1 to sums 0..2.',
    );
    expect(labelled('Digit 3')).toEqual(['Digit 3: allowed, stays tight']);
    expect(labelled('Digit 4')).toEqual(['Digit 4: blocked, the number would pass N']);
    expect(labelled('Digit 1:')).toEqual(['Digit 1: allowed, the prefix is loose']);
    click(button('Next step'));
    expect(narration()).toBe(
      'Or the tight prefix takes 3 itself and still equals N’s prefix: t = 0 + 3 = 3.',
    );
    for (let i = 0; i < 4; i++) click(button('Next step'));
    expect(narration()).toBe(
      '1 loose prefix has sum 1. It is already below N, so any digit 0–9 may follow: add 1 to sums 1..10.',
    );
    expect(labelled('1 digit, sum 1:')).toEqual(['1 digit, sum 1: 1, spread now']);
    click(button('Last step'));
    expect(byTest('answer')).toBe('33');
    expect(byTest('transitions')).toBe('155 / 155');
    expect(byTest('brute')).toBe('346');
    expect(byTest('states')).toBe('44');
    expect(labelled('Position 3')).toEqual(['Position 3: digit 5, tight prefix died']);
    expect(labelled('3 digits, sum 10:')).toEqual(['3 digits, sum 10: 33, the answer']);
  });

  it('counts N itself when its tight prefix ends on S', () => {
    render();
    commit(field('input[name="limit"]'), '1234');
    expect(field('select[name="preset"]').value).toBe('');
    click(button('Last step'));
    const want = digitTrace(1234, 10).at(-1)?.result;
    expect(byTest('answer')).toBe(String(want));
    expect(narration()).toContain('plus N itself');
  });

  it('refuses values out of range and keeps the last good ones', () => {
    render();
    commit(field('input[name="limit"]'), '1000000');
    expect(narration()).toBe(m.limitError(999999));
    expect(field('input[name="limit"]').value).toBe('345');
    commit(field('input[name="target"]'), '21');
    expect(narration()).toBe(m.targetError(20));
    expect(field('input[name="target"]').value).toBe('10');
    commit(field('input[name="target"]'), '3');
    click(button('Last step'));
    expect(byTest('answer')).toBe(String(digitTrace(345, 3).at(-1)?.result));
  });

  it('loads a preset and steps with the keyboard', () => {
    render();
    commit(field('select[name="preset"]'), 'round');
    expect(field('input[name="limit"]').value).toBe('1000');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Before the first digit');
    click(button('Last step'));
    expect(byTest('answer')).toBe('21');
  });

  it('stores practice answers that the engine reproduces', () => {
    /** @param {number} i @returns {number} */
    const stored = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(digitTrace(345, 10).at(-1)?.result).toBe(stored(0));
    expect(digitTrace(1000, 5).at(-1)?.result).toBe(stored(1));
    const f99 = digitTrace(99, 10).at(-1)?.result ?? 0;
    expect(f99).toBe(9);
    expect(stored(0) - f99).toBe(stored(3));
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
    answer.value = '34';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '33';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
