// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  FFT_PRESETS,
  MAX_ABS,
  MAX_COEFFS,
  fftTrace,
} from '$lib/algo-engine/fast-fourier-transform.js';
import { en as m } from '$lib/lessons/fast-fourier-transform/copy.en.js';
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
/** @param {number} times */
const next = (times) => {
  for (let i = 0; i < times; i++) click(button('Next step'));
};

describe('fast Fourier transform lesson', () => {
  it('multiplies (1 + 2x)(3 + x) through three transforms', () => {
    render();
    expect(narration()).toContain('n = 4');
    expect(stat('poly-a')).toBe('A(x) = 1 + 2x');
    expect(stat('result')).toBe(m.resultPending);
    next(1);
    expect(stat('phase')).toBe(m.phaseTitles.a);
    expect(narration()).toContain('bit-reversed order: 0, 2, 1, 3');
    next(1);
    expect(narration()).toContain('Stage 1, len 2: w = ω₄⁰ = 1');
    expect(titles()).toContain('Column 1, row 0: 1, u + t');
    expect(titles()).toContain('Column 0, row 1: 0, v');
    expect(stat('twiddle')).toBe('w = ω₄⁰ = 1');
    next(3);
    expect(stat('stage')).toBe('2');
    expect(stat('twiddle')).toBe('w = ω₄¹ = i');
    expect(narration()).toContain('t = w · v = 2i');
    next(1);
    expect(stat('phase')).toBe(m.phaseTitles.b);
    toLast();
    expect(stat('result')).toBe('3 + 7x + 2x²');
    expect(stat('butterflies')).toBe('12');
    expect(stat('naive')).toBe('4');
    expect(narration()).toContain('Check at x = 10: 21 × 13 = 273');
    expect(stat('phase')).toBe(m.phaseTitles.inverse);
  });

  it('fills the table of values after the pointwise product', () => {
    render();
    const frames = fftTrace(FFT_PRESETS.linear.a, FFT_PRESETS.linear.b);
    next(frames.findIndex((f) => f.kind === 'pointwise'));
    expect(narration()).toContain('only 4 multiplications');
    const rows = [...document.querySelectorAll('[data-testid="values"] tbody tr')].map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()),
    );
    expect(rows[0]).toEqual(['0', '3', '4', '12']);
    expect(rows[1]).toEqual(['1', '1 + 2i', '3 + i', '1 + 7i']);
  });

  it('rebuilds from each field and from a preset', () => {
    render();
    commit(field('a'), '3 2 1');
    commit(field('b'), '6, 5, 4');
    toLast();
    expect(stat('result')).toBe('18 + 27x + 28x² + 13x³ + 4x⁴');
    expect(stat('n')).toBe('8');
    expect(narration()).toContain('123 × 456 = 56088');
    commit(field('preset'), 'longest');
    expect(field('a').value).toBe('1, 2, 3, 4, 5, 6, 7, 8');
    toLast();
    expect(stat('n')).toBe('16');
    expect(stat('butterflies')).toBe('96');
    commit(field('a'), '−2');
    commit(field('b'), '5');
    toLast();
    expect(stat('result')).toBe('−10');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    commit(field('a'), '1, 2, x');
    expect(narration()).toBe(m.coeffError(MAX_COEFFS, MAX_ABS));
    expect(field('a').value).toBe('1, 2');
    commit(field('b'), '10');
    expect(narration()).toBe(m.coeffError(MAX_COEFFS, MAX_ABS));
    commit(field('b'), '1 1 1 1 1 1 1 1 1');
    expect(narration()).toBe(m.coeffError(MAX_COEFFS, MAX_ABS));
    expect(field('b').value).toBe('3, 1');
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
    answer.value = '16';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const end = /** @param {number[]} a @param {number[]} b */ (a, b) =>
      /** @type {import('$lib/algo-engine/fast-fourier-transform.js').FftFrame} */ (
        fftTrace(a, b).at(-1)
      );
    expect(/** @type {any} */ (m.practice[0]).answer).toBe(
      end([1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1]).n,
    );
    expect(/** @type {any} */ (m.practice[1]).answer).toBe(
      end(FFT_PRESETS.cubes.a, FFT_PRESETS.cubes.b).butterflies,
    );
    expect(m.poly(/** @type {number[]} */ (end([1, 2], [3, 1]).result))).toBe('3 + 7x + 2x²');
  });
});
