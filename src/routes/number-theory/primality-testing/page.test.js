// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { MAX_BASE, MAX_BASES, MAX_N, primalityTrace } from '$lib/algo-engine/primality-testing.js';
import { en as m } from '$lib/lessons/primality-testing/copy.en.js';
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
/** @param {string} value */
const method = (value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="method"][value="${value}"]`)
  );
const rows = () =>
  [...document.querySelectorAll('[data-testid="round"]')].map((r) =>
    [...r.querySelectorAll('th, td > span > span, td:last-child')]
      .map((c) => (c.textContent ?? '').replace(/\s+/g, ' ').trim())
      .join(' '),
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

describe('primality testing lesson', () => {
  it('walks Miller-Rabin on 561 until base 2 proves it composite', () => {
    render();
    expect(narration()).toContain('Is 561 prime?');
    expect(stat('verdict')).toBe('…');
    stepUntil('Split off the powers of two');
    expect(stat('decomposition')).toBe('n − 1 = 560 = 2^4 · 35');
    click(button('Next step'));
    expect(narration()).toBe('Base 2: x = a^35 mod 561 = 263.');
    expect(rows()[0]).toBe('2 263 …');
    stepUntil('a square root of 1');
    toLast();
    expect(stat('verdict')).toBe('Composite');
    expect(rows()[0]).toBe('2 263 166 67 1 ✗ witness');
    expect(stat('tested')).toBe('1');
    expect(stat('liars')).toBe('8 of 558');
  });

  it('shows Fermat fooled by the Carmichael number', () => {
    render();
    click(method('fermat'));
    toLast();
    expect(stat('verdict')).toBe('Probably prime');
    expect(rows()).toEqual(['2 1 ✓ passes', '5 1 ✓ passes', '7 1 ✓ passes']);
    expect(stat('liars')).toBe('318 of 558');
    commit(field('bases'), '3');
    toLast();
    expect(stat('verdict')).toBe('Composite');
    expect(narration()).toContain('Done: composite');
  });

  it('reports a divisor by trial division, and a prime when none appears', () => {
    render();
    click(method('trial'));
    commit(field('preset'), 'semiprime');
    toLast();
    expect(stat('verdict')).toBe('Composite');
    expect(stat('divisor')).toBe('97');
    expect(stat('cost')).toBe('48');
    expect(stat('limit')).toBe('99');
    commit(field('n'), '101');
    stepUntil('No d up to 10 divides 101');
    expect(stat('verdict')).toBe('Prime');
    expect(stat('divisor')).toBe('—');
  });

  it('proves a prime with the four bases and marks n − 1', () => {
    render();
    commit(field('preset'), 'smallPrime');
    toLast();
    expect(stat('verdict')).toBe('Prime');
    expect(narration()).toContain('Done: prime');
    expect(rows()[0]).toBe('2 8 64 22 96 = n − 1 ✓ passes');
    commit(field('bases'), '2');
    toLast();
    expect(stat('verdict')).toBe('Probably prime');
  });

  it('settles small and even numbers, and skips an unusable base', () => {
    render();
    commit(field('n'), '3');
    toLast();
    expect(stat('verdict')).toBe('Prime');
    commit(field('n'), '100');
    toLast();
    expect(stat('verdict')).toBe('Composite');
    expect(stat('liars')).toBe(m.liarsNone);
    commit(field('n'), '97');
    expect(stat('liars')).toBe(m.liarsNone);
    commit(field('n'), '5');
    commit(field('bases'), '7');
    stepUntil('outside 2 to n − 2');
    toLast();
    expect(stat('verdict')).toBe('Not tested');
    expect(rows()[0]).toBe('7 – skipped');
  });

  it('handles the largest n without losing precision', () => {
    render();
    commit(field('preset'), 'mersenne');
    toLast();
    expect(stat('verdict')).toBe('Prime');
    click(method('trial'));
    toLast();
    expect(stat('verdict')).toBe('Prime');
    expect(stat('cost')).toBe('23169');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    const errors = m.basesErrors(MAX_BASE, MAX_BASES);
    commit(field('n'), '1');
    expect(narration()).toBe(m.nError(MAX_N));
    expect(field('n').value).toBe('561');
    commit(field('n'), '');
    expect(narration()).toBe(m.nError(MAX_N));
    commit(field('bases'), 'x');
    expect(narration()).toBe(errors.format);
    expect(field('bases').value).toBe('2, 5, 7');
    commit(field('bases'), '1');
    expect(narration()).toBe(errors.range);
    commit(field('bases'), '2 3 4 5 6 7 8');
    expect(narration()).toBe(errors.count);
    expect(field('bases').value).toBe('2, 5, 7');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '97';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    /** @param {import('$lib/algo-engine/primality-testing.js').PrimalityMethod} how @param {number} n @param {number[]} [bases] */
    const end = (how, n, bases = []) =>
      /** @type {import('$lib/algo-engine/primality-testing.js').PrimalityFrame} */ (
        primalityTrace(how, n, bases).at(-1)
      );
    const q = m.practice.map((ex) => /** @type {any} */ (ex));
    expect(q[0].answer).toBe(end('trial', 9991).divisor);
    expect(q[1].answer).toBe(end('miller', 561, [2]).s);
    const witnesses = [2, 3, 5, 7, 11].flatMap((a, i) =>
      end('fermat', 561, [a]).verdict === 'composite' ? [i] : [],
    );
    expect(q[2].answers).toEqual(witnesses);
    expect(end('fermat', 341, [2]).verdict).toBe('probable');
    expect(end('fermat', 341, [3]).rounds[0].values).toEqual([56]);
    expect(end('miller', 2047, [2]).verdict).toBe('probable');
    expect(end('miller', 2047, [q[4].answer]).verdict).toBe('composite');
  });
});
