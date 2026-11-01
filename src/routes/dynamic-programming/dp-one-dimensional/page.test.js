// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/dp-one-dimensional/copy.en.js';
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

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
const arcs = () => document.querySelectorAll('[data-testid="row"] path[marker-end]');
const titles = () =>
  [...document.querySelectorAll('[data-testid="row"] title')].map((t) => t.textContent);
const chips = () =>
  [...document.querySelectorAll('ol li')]
    .map((li) => li.textContent?.trim() ?? '')
    .filter((t) => t.startsWith('house') || /^\d+$/.test(t));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('1D DP lesson', () => {
  it('fills the stairs row left to right with two arcs per cell', () => {
    render();
    expect(narration()).toBe(
      'Count the ways to climb 5 steps. The row has a cell per step, dp[0] to dp[5].',
    );
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toBe(
      'The last move to step 2 climbed 1 step (from 1) or 2 (from 0). Count both: dp[2] = dp[1] + dp[0] = 1 + 1 = 2.',
    );
    expect(arcs()).toHaveLength(2);
    expect(titles()[2]).toBe('dp[2]: 2, filled now');
    click(button('Last step'));
    expect(arcs()).toHaveLength(0);
    expect(byTest('result')).toBe('8');
    expect(byTest('lookups')).toBe('8');
    expect(byTest('filled')).toBe('6 / 6');
  });

  it('finds the fewest coins and the coins used', () => {
    render();
    click(field('input[name="problem"][value="coins"]'));
    click(button('Last step'));
    expect(byTest('result')).toBe('2');
    expect(byTest('lookups')).toBe('13');
    expect(chips()).toEqual(['3', '3']);
    expect(titles()[3]).toBe('dp[3]: 1, on the best chain');
    click(button('Previous step'));
    expect(arcs()).toHaveLength(3);
    expect(narration()).toBe(
      'Try each coin as the last one: coin 1 → dp[5] + 1 = 3; coin 3 → dp[3] + 1 = 2; coin 4 → dp[2] + 1 = 3. The fewest is 2, with coin 3 last.',
    );
    commit(field('input[name="coins"]'), '2 5');
    commit(field('input[name="amount"]'), '3');
    click(button('Last step'));
    expect(byTest('result')).toBe('∞');
    expect(narration()).toBe('dp[3] = ∞: these coins cannot make 3.');
  });

  it('robs the best houses', () => {
    render();
    click(field('input[name="problem"][value="robber"]'));
    click(button('Last step'));
    expect(byTest('result')).toBe('12');
    expect(chips()).toEqual(['house 1', 'house 3', 'house 5']);
    commit(field('input[name="houses"]'), '5, 1, 1, 5');
    click(button('Last step'));
    expect(byTest('result')).toBe('10');
    expect(chips()).toEqual(['house 1', 'house 4']);
  });

  it('refuses bad input and keeps the last valid value', () => {
    render();
    commit(field('input[name="steps"]'), '16');
    expect(narration()).toBe(m.errors.steps(15));
    expect(field('input[name="steps"]').value).toBe('5');
    click(field('input[name="problem"][value="coins"]'));
    commit(field('input[name="coins"]'), '1, x');
    expect(narration()).toBe(m.errors.coins(4, 10));
    expect(field('input[name="coins"]').value).toBe('1, 3, 4');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toBe(
      'Base cases: dp[0] = 1, the one way to climb nothing, and dp[1] = 1, a single step.',
    );
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
