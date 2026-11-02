// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  MAX_BASE,
  MAX_EXPONENT,
  MAX_MODULUS,
  powTrace,
} from '$lib/algo-engine/modular-exponentiation.js';
import { en as m } from '$lib/lessons/modular-exponentiation/copy.en.js';
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

describe('modular exponentiation lesson', () => {
  it('walks 3 to the 13 mod 7, bit by bit', () => {
    render();
    expect(narration()).toContain('In binary e is 1101');
    expect(stat('result')).toBe('1');
    expect(stat('x')).toBe('3');
    click(button('Next step'));
    expect(narration()).toContain('bit 0 is 1');
    expect(titles()).toContain('Bit with weight 2 to the 0: 1, being read');
    click(button('Next step'));
    expect(narration()).toBe('result = 1·3 mod 7 = 3, so now result ≡ a^1.');
    expect(stat('invariant')).toBe('result ≡ a^1 (mod 7)');
    click(button('Next step'));
    expect(narration()).toContain('x = 3·3 mod 7 = 2');
    click(button('Next step'));
    expect(narration()).toContain('bit 1 is 0');
    toLast();
    expect(stat('result')).toBe('3');
    expect(stat('multiplications')).toBe('7');
    expect(stat('naive')).toBe('13');
    expect(stat('invariant')).toBe('result ≡ a^13 (mod 7)');
    expect(titles()).toContain('Bit with weight 2 to the 1: 0, skipped');
    expect(titles()).toContain('Bit with weight 2 to the 3: 1, multiplied in');
    expect(narration()).toContain('3^13 mod 7 = 3');
  });

  it('rebuilds from each field and from a preset', () => {
    render();
    commit(field('a'), '2');
    commit(field('e'), '10');
    commit(field('m'), '1000');
    toLast();
    expect(stat('result')).toBe('24');
    commit(field('preset'), 'huge');
    expect(field('m').value).toBe('1000000007');
    toLast();
    expect(stat('result')).toBe('140625001');
    expect(stat('multiplications')).toBe('43');
    expect(stat('full-digits')).toBe('301029996');
  });

  it('explains an exponent of zero and a modulus of one', () => {
    render();
    commit(field('e'), '0');
    expect(narration()).toContain('no bits to use');
    toLast();
    expect(stat('result')).toBe('1');
    expect(stat('multiplications')).toBe('0');
    commit(field('m'), '1');
    toLast();
    expect(stat('result')).toBe('0');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    commit(field('a'), String(MAX_BASE + 1));
    expect(narration()).toBe(m.aError(MAX_BASE));
    expect(field('a').value).toBe('3');
    commit(field('e'), '-1');
    expect(narration()).toBe(m.eError(MAX_EXPONENT));
    expect(field('e').value).toBe('13');
    commit(field('e'), '');
    expect(narration()).toBe(m.eError(MAX_EXPONENT));
    commit(field('m'), '0');
    expect(narration()).toBe(m.mError(MAX_MODULUS));
    expect(field('m').value).toBe('7');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[1]);
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
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[1]).hints[0]);
    answer.value = '8';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const end = /** @param {number} a @param {number} e @param {number} mod */ (a, e, mod) =>
      /** @type {import('$lib/algo-engine/modular-exponentiation.js').PowFrame} */ (
        powTrace(a, e, mod).at(-1)
      );
    expect(/** @type {any} */ (m.practice[2]).answer).toBe(end(3, 13, 7).result);
    expect(end(3, 13, 7).used).toEqual([1, 4, 8]);
    expect(/** @type {any} */ (m.practice[4]).answer).toBe(
      end(2, 1_000_000_000, 1_000_000_007).multiplications,
    );
    expect(((123 % 10) * (456 % 10)) % 10).toBe(/** @type {any} */ (m.practice[1]).answer);
  });
});
