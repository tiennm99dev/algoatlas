// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_N, sieveTrace } from '$lib/algo-engine/sieve-factorisation.js';
import { en as m } from '$lib/lessons/sieve-factorisation/copy.en.js';
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
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
/** @param {string} value */
const startRadio = (value) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="start"][value="${value}"]`));
/** The grid cell of value v. @param {number} v */
const cell = (v) =>
  /** @type {HTMLElement} */ (
    document.querySelector(`[data-cell="${Math.floor((v - 1) / 10)}-${(v - 1) % 10}"]`)
  );
const toLast = () => click(button('Last step'));
/** @param {string} kindText */
function stepUntil(kindText) {
  for (let i = 0; i < 400; i++) {
    if (narration().includes(kindText)) return;
    click(button('Next step'));
  }
  throw new Error(`never narrated ${kindText}`);
}

describe('sieve lesson', () => {
  it('crosses out multiples prime by prime, then factorises', () => {
    render();
    expect(narration()).toContain('Write the numbers up to 60');
    click(button('Next step'));
    expect(narration()).toContain('2 was never crossed out');
    expect(stat('p')).toBe('2');
    expect(stat('primes')).toBe('1');
    click(button('Next step'));
    expect(narration()).toBe(
      'Cross out 4 = 2·2. It is the first time, so its smallest prime factor is 2.',
    );
    expect(stat('crossings')).toBe('1');
    expect(cell(4).getAttribute('aria-label')).toBe('4, crossed out for the first time');
    stepUntil('Cross out 9');
    stepUntil('12 = 3·4 was already crossed out by 2');
    expect(cell(12).getAttribute('aria-label')).toBe('12, crossed out again');
    stepUntil('4 is already crossed out');
    stepUntil('8·8 = 64 is past 60');
    expect(stat('primes')).toBe('17');
    expect(cell(59).getAttribute('aria-label')).toBe('59, prime');
    expect(cell(1).getAttribute('aria-label')).toBe('1, neither prime nor composite');
    toLast();
    expect(narration()).toContain('60 = 2 · 2 · 3 · 5');
    expect(stat('crossings')).toBe(stat('total-square'));
  });

  it('compares starting at 2p with starting at p·p', () => {
    render();
    commit(field('preset'), 'small');
    expect(stat('total-square')).toBe('24');
    expect(stat('total-double')).toBe('28');
    toLast();
    expect(stat('crossings')).toBe('24');
    expect(stat('repeats')).toBe('5');
    click(startRadio('double'));
    toLast();
    expect(stat('crossings')).toBe('28');
    expect(stat('repeats')).toBe('9');
  });

  it('factorises the number picked on the grid, by pointer and keyboard', () => {
    render();
    click(cell(42));
    expect(narration()).toContain('factorise x = 42');
    expect(field('x').value).toBe('42');
    toLast();
    expect(narration()).toContain('42 = 2 · 3 · 7');
    cell(35).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(field('x').value).toBe('35');
    expect(narration()).toContain('factorise x = 35');
    click(cell(1));
    expect(narration()).toBe(m.pickError(1));
    expect(field('x').value).toBe('35');
  });

  it('moves focus across the grid with the arrow keys', () => {
    render();
    /** @type {SVGElement} */ (/** @type {unknown} */ (cell(11))).focus();
    cell(11).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(document.activeElement).toBe(cell(12));
  });

  it('rebuilds on a new n and keeps x within it', () => {
    render();
    commit(field('n'), '20');
    expect(field('x').value).toBe('20');
    toLast();
    expect(stat('primes')).toBe('8');
    commit(field('x'), '18');
    expect(narration()).toContain('factorise x = 18');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    commit(field('n'), '1');
    expect(narration()).toBe(m.nError(MAX_N));
    expect(field('n').value).toBe('60');
    commit(field('n'), String(MAX_N + 1));
    expect(narration()).toBe(m.nError(MAX_N));
    commit(field('x'), '61');
    expect(narration()).toBe(m.xError(60));
    expect(field('x').value).toBe('60');
    commit(field('x'), '');
    expect(narration()).toBe(m.xError(60));
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
    answer.value = '25';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    /** @param {number} n @param {number} x */
    const end = (n, x) =>
      /** @type {import('$lib/algo-engine/sieve-factorisation.js').SieveFrame} */ (
        sieveTrace(n, x).at(-1)
      );
    const q = m.practice.map((ex) => /** @type {any} */ (ex));
    expect(q[0].answer).toBe(end(30, 30).crossings);
    expect(q[1].answer).toBe(end(200, 2).primes.length);
    const crossers = sieveTrace(100, 2)
      .filter((f) => f.kind === 'prime')
      .map((f) => f.p);
    expect(q[2].answer).toBe(crossers.at(-1));
    expect(q[3].answer).toBe(end(100, 91).spf[91]);
    const order = q[4].answer.map((/** @type {number} */ i) => Number(q[4].items[i]));
    expect(order).toEqual(end(100, 84).factors);
  });
});
