// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { GCD_PRESETS, MAX_C, MAX_VALUE, gcdTrace } from '$lib/algo-engine/gcd-extended-euclid.js';
import { en as m } from '$lib/lessons/gcd-extended-euclid/copy.en.js';
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
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');
const toLast = () => click(button('Last step'));

describe('GCD and extended Euclid lesson', () => {
  it('walks 240 and 46 to the gcd, the coefficients and the squares', () => {
    render();
    expect(narration()).toBe(m.describe(gcdTrace(240, 46, 10)[0]));
    expect(stat('g')).toBe('—');
    click(button('Next step'));
    expect(narration()).toContain('240 = 5·46 + 10');
    expect(stat('divisions')).toBe('1');
    expect(stat('subtractions')).toBe('5');
    expect(titles()).toContain('Square of side 46, cut by division 1, just cut');
    expect(titles()).toContain('Part left to cut, 10 by 46');
    click(button('Next step'));
    expect(narration()).toContain('New row: r = 10');
    toLast();
    expect(stat('divisions')).toBe('5');
    expect(stat('subtractions')).toBe('13');
    expect(stat('g')).toBe('2');
    expect(stat('bezout')).toBe('−9, 47');
    expect(stat('solution')).toContain('x = 1, y = −5');
    expect(titles()).toContain('Square of side 2, cut by division 5, side equals the gcd');
    expect(titles().some((t) => t.startsWith('Part left'))).toBe(false);
  });

  it('rebuilds from each field and from a preset', () => {
    render();
    commit(field('a'), '7');
    commit(field('b'), '5');
    commit(field('c'), '3');
    toLast();
    expect(stat('g')).toBe('1');
    expect(stat('solution')).toContain('x = 4, y = −5');
    commit(field('preset'), 'noSolution');
    expect(field('a').value).toBe('6');
    toLast();
    expect(stat('g')).toBe('3');
    expect(stat('solution')).toContain('No solution');
    expect(narration()).toContain('no solution');
  });

  it('keeps a tall thin rectangle readable by scrolling it', () => {
    render();
    const box = () =>
      /** @type {HTMLElement} */ (document.querySelector('[data-testid="board-scroll"]'));
    expect(box().hasAttribute('tabindex')).toBe(false);
    commit(field('a'), '1');
    commit(field('b'), '999');
    expect(box().getAttribute('tabindex')).toBe('0');
    expect(Number(box().querySelector('svg')?.getAttribute('viewBox')?.split(' ')[2])).toBeCloseTo(
      10,
    );
  });

  it('shows the swap when a is smaller than b', () => {
    render();
    commit(field('preset'), 'tall');
    click(button('Next step'));
    expect(narration()).toContain('q = 0');
    expect(stat('subtractions')).toBe('0');
  });

  it('counts the worst case on Fibonacci and the best on a multiple', () => {
    render();
    commit(field('preset'), 'fibonacci');
    toLast();
    expect(stat('divisions')).toBe('11');
    commit(field('preset'), 'multiple');
    toLast();
    expect(stat('divisions')).toBe('1');
    expect(stat('g')).toBe(String(GCD_PRESETS.multiple.b));
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    commit(field('a'), '0');
    expect(narration()).toBe(m.valueError(MAX_VALUE));
    expect(field('a').value).toBe('240');
    commit(field('b'), String(MAX_VALUE + 1));
    expect(narration()).toBe(m.valueError(MAX_VALUE));
    expect(field('b').value).toBe('46');
    commit(field('b'), '');
    expect(narration()).toBe(m.valueError(MAX_VALUE));
    expect(field('b').value).toBe('46');
    commit(field('c'), String(MAX_C + 1));
    expect(narration()).toBe(m.cError(MAX_C));
    expect(field('c').value).toBe('10');
    commit(field('c'), '1.5');
    expect(narration()).toBe(m.cError(MAX_C));
  });

  it('steps with the keyboard', () => {
    render();
    const before = narration();
    const shell = /** @type {HTMLElement} */ (document.querySelector('[tabindex="-1"]'));
    shell.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).not.toBe(before);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '21';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const end = /** @param {number} a @param {number} b @param {number} c */ (a, b, c) =>
      /** @type {import('$lib/algo-engine/gcd-extended-euclid.js').GcdFrame} */ (
        gcdTrace(a, b, c).at(-1)
      );
    const answers = m.practice.map((ex) => /** @type {any} */ (ex).answer);
    expect(answers[0]).toBe(end(252, 105, 0).g);
    expect(answers[1]).toBe(end(240, 46, 2).subtractions);
    expect(answers[2]).toBe(end(240, 46, 2).y);
    expect(end(6, 9, 7).solvable).toBe(false);
    expect(answers[4]).toBe(end(7, 5, 3).smallX);
  });
});
