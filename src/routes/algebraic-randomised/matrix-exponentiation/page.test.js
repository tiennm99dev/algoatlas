// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  MAX_EXACT_N,
  MAX_MODULUS,
  MIN_MODULUS,
  RECURRENCES,
  matrixPowTrace,
} from '$lib/algo-engine/matrix-exponentiation.js';
import { en as m } from '$lib/lessons/matrix-exponentiation/copy.en.js';
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
/** @param {string} id */
const cells = (id) =>
  [...document.querySelectorAll(`[data-testid="${id}"] td`)].map((td) => td.textContent?.trim());
const toLast = () => click(button('Last step'));
/** @param {string} value */
function pickMode(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="arithmetic"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

describe('matrix exponentiation lesson', () => {
  it('squares its way to the tenth Fibonacci number', () => {
    render();
    expect(narration()).toContain('In binary n is 1010');
    expect(cells('matrix-m')).toEqual(['1', '1', '1', '0']);
    expect(cells('matrix-r')).toEqual(['1', '0', '0', '1']);
    expect(stat('answer')).toBe(m.answerPending);
    click(button('Next step'));
    expect(narration()).toContain('bit 0 is 0');
    click(button('Next step'));
    expect(narration()).toContain('square P = P · P to get M^2');
    expect(cells('matrix-p')).toEqual(['2', '1', '1', '1']);
    click(button('Next step'));
    expect(narration()).toContain('bit 1 is 1');
    click(button('Next step'));
    expect(narration()).toContain('Now R = M^2');
    expect(stat('invariant')).toBe('R = M^2, P = M^2');
    toLast();
    expect(stat('answer')).toBe('55');
    expect(cells('matrix-r')).toEqual(['89', '55', '55', '34']);
    expect(stat('products')).toBe('5');
    expect(stat('scalar')).toBe('40');
    expect(stat('loop')).toBe('10');
    expect(narration()).toContain('F(10) = 55');
  });

  it('rebuilds from the recurrence, n, the arithmetic mode and presets', () => {
    render();
    commit(field('recurrence'), 'tribonacci');
    commit(field('n'), '20');
    toLast();
    expect(stat('answer')).toBe('35890');
    expect(cells('matrix-m')).toHaveLength(9);
    commit(field('preset'), 'fib1000');
    toLast();
    expect(stat('answer')?.length).toBe(209);
    expect(stat('digits')).toBe('209');
    expect(narration()).toContain('a number with 209 digits');
    commit(field('preset'), 'fibMod');
    expect(field('m').value).toBe(String(MAX_MODULUS));
    toLast();
    const expected = matrixPowTrace(RECURRENCES.fibonacci, 10 ** 15, MAX_MODULUS).at(-1)?.answer;
    expect(stat('answer')).toBe(expected);
    expect(stat('products')).toBe('69');
    expect(stat('scalar')).toBe(String(/** @type {any} */ (m.practice[4]).answer));
  });

  it('clamps n when switching back to exact numbers', () => {
    render();
    pickMode('mod');
    commit(field('m'), '1000');
    commit(field('n'), '5000');
    toLast();
    expect(stat('answer')).toBe(matrixPowTrace(RECURRENCES.fibonacci, 5000, 1000).at(-1)?.answer);
    pickMode('exact');
    expect(narration()).toBe(m.exactClamped(MAX_EXACT_N));
    expect(field('n').value).toBe(String(MAX_EXACT_N));
    expect(field('m')).toBeNull();
  });

  it('explains n = 0', () => {
    render();
    commit(field('n'), '0');
    expect(narration()).toContain('n = 0');
    toLast();
    expect(stat('answer')).toBe('0');
    expect(stat('products')).toBe('0');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    commit(field('n'), String(MAX_EXACT_N + 1));
    expect(narration()).toBe(m.nError(MAX_EXACT_N));
    expect(field('n').value).toBe('10');
    commit(field('n'), '');
    expect(narration()).toBe(m.nError(MAX_EXACT_N));
    pickMode('mod');
    commit(field('m'), '1');
    expect(narration()).toBe(m.mError(MIN_MODULUS, MAX_MODULUS));
    expect(field('m').value).toBe(String(MAX_MODULUS));
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
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const end =
      /** @param {keyof typeof RECURRENCES} r @param {number} n @param {number | null} mod */ (
        r,
        n,
        mod,
      ) =>
        /** @type {import('$lib/algo-engine/matrix-exponentiation.js').MatrixPowFrame} */ (
          matrixPowTrace(RECURRENCES[r], n, mod).at(-1)
        );
    expect(/** @type {any} */ (m.practice[0]).answer).toBe(
      end('fibonacci', 10, null).matrixProducts,
    );
    expect(/** @type {any} */ (m.practice[3]).answer).toBe(
      Number(end('tribonacci', 20, null).answer),
    );
    expect(/** @type {any} */ (m.practice[4]).answer).toBe(
      end('fibonacci', 10 ** 15, MAX_MODULUS).scalarProducts,
    );
  });
});
