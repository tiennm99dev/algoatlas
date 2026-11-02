// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  MAX_CONGRUENCES,
  MAX_CRT_MODULUS,
  MAX_CRT_REMAINDER,
  MAX_INVERSE_MODULUS,
  MAX_INVERSE_VALUE,
  crtTrace,
  euclidInverseTrace,
  fermatInverseTrace,
} from '$lib/algo-engine/modular-inverse-crt.js';
import { en as m } from '$lib/lessons/modular-inverse-crt/copy.en.js';
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
/** @param {string} name @param {string} value */
const radio = (name, value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="${name}"][value="${value}"]`)
  );
const titles = () => [...document.querySelectorAll('svg title')].map((t) => t.textContent ?? '');
const toLast = () => click(button('Last step'));
/** @param {string} kindText */
function stepUntil(kindText) {
  for (let i = 0; i < 400; i++) {
    if (narration().includes(kindText)) return;
    click(button('Next step'));
  }
  throw new Error(`never narrated ${kindText}`);
}

const errors = m.systemErrors(MAX_CRT_MODULUS, MAX_CRT_REMAINDER, MAX_CONGRUENCES);

describe('modular inverse and CRT lesson', () => {
  it('walks Sun Tzu’s system until all the clocks align', () => {
    render();
    expect(document.querySelectorAll('[data-testid="clock"]').length).toBe(3);
    expect(narration()).toBe('Start with the first congruence: x ≡ 2 (mod 3). The candidate is 2.');
    expect(stat('candidate')).toBe('2');
    stepUntil('k = 1: x = 5');
    expect(titles()).toContain(
      'Clock modulo 3: the hand points at 2, and it must point at 2. Merged: it stays aligned',
    );
    expect(titles()).toContain(
      'Clock modulo 5: the hand points at 0, and it must point at 3. Being solved',
    );
    stepUntil('k = 2: x = 8');
    expect(narration()).toContain('lands on 3');
    toLast();
    expect(stat('candidate')).toBe('23');
    expect(stat('big-m')).toBe('105');
    expect(stat('walked')).toBe('3');
    expect(stat('solution')).toBe('23 mod 105');
    expect(narration()).toContain('x ≡ 23 (mod 105)');
  });

  it('shows a contradiction and a shared factor', () => {
    render();
    commit(field('preset'), 'conflict');
    expect(field('system').value).toBe('1 mod 4, 2 mod 6');
    stepUntil('no solution');
    toLast();
    expect(stat('solution')).toBe('none');
    commit(field('preset'), 'shared');
    toLast();
    expect(stat('solution')).toBe('9 mod 12');
  });

  it('rebuilds from a typed system', () => {
    render();
    commit(field('system'), '1 mod 2, 2 mod 3');
    expect(field('preset').value).toBe('');
    toLast();
    expect(stat('solution')).toBe('5 mod 6');
  });

  it('refuses a bad system with a notice and keeps the last good value', () => {
    render();
    commit(field('system'), 'nonsense');
    expect(narration()).toBe(errors.format);
    expect(field('system').value).toBe('2 mod 3, 3 mod 5, 2 mod 7');
    commit(field('system'), '2 mod 99');
    expect(narration()).toBe(errors.range);
    commit(field('system'), '1 mod 2, 1 mod 3, 1 mod 5, 1 mod 7, 1 mod 11');
    expect(narration()).toBe(errors.count);
    expect(field('system').value).toBe('2 mod 3, 3 mod 5, 2 mod 7');
  });

  it('finds an inverse by Euclid, and shows when there is none', () => {
    render();
    click(radio('task', 'inverse'));
    expect(narration()).toContain('Find x with 3·x ≡ 1 (mod 7)');
    expect(document.querySelectorAll('[data-testid="clock"]').length).toBe(1);
    click(button('Next step'));
    expect(narration()).toContain('t = -2'.replace('-', '−'));
    toLast();
    expect(stat('inverse')).toBe('5');
    expect(stat('check')).toBe('1');
    expect(stat('rounds')).toBe('2');
    commit(field('preset'), 'noInverse');
    toLast();
    expect(stat('inverse')).toBe('none');
    expect(stat('extra')).toBe('2');
    expect(narration()).toContain('share the factor 2');
  });

  it('finds an inverse by Fermat, and refuses a composite modulus', () => {
    render();
    click(radio('task', 'inverse'));
    click(radio('method', 'fermat'));
    expect(narration()).toContain('7 is prime');
    toLast();
    expect(stat('inverse')).toBe('5');
    expect(stat('rounds')).toBe('3');
    expect(stat('extra')).toBe('5');
    commit(field('modulus'), '8');
    expect(narration()).toBe(m.primeError);
    expect(field('modulus').value).toBe('7');
    commit(field('preset'), 'noInverse');
    expect(radio('method', 'euclid').checked).toBe(true);
    click(radio('method', 'fermat'));
    expect(narration()).toBe(m.primeError);
    expect(radio('method', 'euclid').checked).toBe(true);
  });

  it('refuses a bad number with a notice and keeps the last good value', () => {
    render();
    click(radio('task', 'inverse'));
    commit(field('a'), String(MAX_INVERSE_VALUE + 1));
    expect(narration()).toBe(m.aError(MAX_INVERSE_VALUE));
    expect(field('a').value).toBe('3');
    commit(field('modulus'), '1');
    expect(narration()).toBe(m.mError(MAX_INVERSE_MODULUS));
    expect(field('modulus').value).toBe('7');
    commit(field('modulus'), '');
    expect(narration()).toBe(m.mError(MAX_INVERSE_MODULUS));
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
    answer.value = '2';
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
    /** @param {import('$lib/algo-engine/modular-inverse-crt.js').ModFrame[]} t */
    const end = (t) =>
      /** @type {import('$lib/algo-engine/modular-inverse-crt.js').ModFrame} */ (t.at(-1));
    const answers = m.practice.map((ex) => /** @type {any} */ (ex));
    expect(answers[0].answer).toBe(end(euclidInverseTrace(3, 7)).inverse);
    const invertible = [5, 6, 7, 9].flatMap((v, i) =>
      end(euclidInverseTrace(v, 12)).inverse === null ? [] : [i],
    );
    expect(answers[1].answers).toEqual(invertible);
    expect(answers[2].answer).toBe(end(fermatInverseTrace(2, 11)).inverse);
    const sun = [
      { r: 2, m: 3 },
      { r: 3, m: 5 },
      { r: 2, m: 7 },
    ];
    expect(answers[3].answer).toBe(end(crtTrace(sun)).R);
    const clash = [
      { r: 1, m: 4 },
      { r: 2, m: 6 },
    ];
    expect(end(crtTrace(clash)).solvable).toBe(false);
    const shared = [
      { r: 1, m: 4 },
      { r: 3, m: 6 },
    ];
    expect(answers[5].answer).toBe(end(crtTrace(shared)).M);
  });
});
