// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/srtbot-framework/copy.en.js';
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
const current = () =>
  document.querySelector('[data-testid="guide"] li[aria-current="step"]')?.textContent ?? '';
const next = (/** @type {number} */ n) => {
  for (let i = 0; i < n; i++) click(button('Next step'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('SRTBOT framework lesson', () => {
  it('walks the six steps and fills the bowling table', () => {
    render();
    expect(narration()).toBe(
      'Design a dynamic program for bowling in six SRTBOT steps, then run it on these 10 values.',
    );
    expect(current()).toBe('');
    next(1);
    expect(current()).toContain(m.stepNames.subproblems);
    next(3);
    expect(current()).toContain(m.stepNames.base);
    expect(narration()).toBe('B, base case: B(10) = 0. No pins are left, so no points.');
    next(1);
    expect(current()).toContain(m.stepNames.relate);
    expect(narration()).toBe(
      'B(9) = max of skip pin 9: B(10) = 0; hit pin 9: 2 + 0 = 2. The best is 2.',
    );
    const options = document.querySelectorAll('[data-testid="options"] li');
    expect(options).toHaveLength(2);
    expect(options[1].textContent).toContain(m.chosenMark);
    click(button('Last step'));
    expect(current()).toContain(m.stepNames.time);
    expect(byTest('answer')).toBe('104');
    expect(byTest('work')).toBe('29');
    expect(byTest('filled')).toBe('11 / 11');
  });

  it('jumps to a step from the guide', () => {
    render();
    click(button(m.showAria(m.stepNames.original)));
    expect(narration()).toBe('O, original problem: B(0) = 104, the best score on the whole row.');
    click(button(m.showAria(m.stepNames.topo)));
    expect(narration()).toBe(
      'T, topological order: every B(i) needs larger indices only, so fill from B(10) down to B(0).',
    );
  });

  it('switches problem and runs on typed values', () => {
    render();
    click(field('input[name="problem"][value="maxsub"]'));
    expect(field('input[name="values"]').value).toBe('−2, 1, −3, 4, −1, 2, 1, −5, 4');
    click(button(m.showAria(m.stepNames.original)));
    expect(narration()).toBe(
      'O, original problem: the best run may end anywhere, so take the largest x(i). It is x(6) = 6.',
    );
    click(field('input[name="problem"][value="bowling"]'));
    commit(field('input[name="values"]'), '3 4 -1 5');
    expect(field('input[name="values"]').value).toBe('3, 4, −1, 5');
    click(button('Last step'));
    expect(byTest('answer')).toBe('17');
    click(buttonByText(m.exampleButton));
    click(button('Last step'));
    expect(byTest('answer')).toBe('104');
  });

  it('refuses bad values and keeps the last valid ones', () => {
    render();
    commit(field('input[name="values"]'), '1, x');
    expect(narration()).toBe(m.valueErrors(10, 9).format);
    expect(field('input[name="values"]').value).toBe('−1, 1, 1, 1, 9, 9, 3, −3, −5, 2');
    commit(field('input[name="values"]'), '12');
    expect(narration()).toBe(m.valueErrors(10, 9).range);
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(current()).toContain(m.stepNames.subproblems);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
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
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '17';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
