// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/karatsuba-strassen/copy.en.js';

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
  vi.useRealTimers();
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

/** @param {string} value */
function pick(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const calls = () => [...document.querySelectorAll('svg g[role="button"]')];

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('Karatsuba and Strassen lesson', () => {
  it('splits 1213 × 3141 into four products first', () => {
    render();
    expect(narration()).toContain('Multiply 1213 × 3141');
    click(button('Next step'));
    expect(narration()).toContain('split at m = 2');
    expect(narration()).toContain('Four products: 12·31, 12·41, 13·31 and 13·41.');
    expect(calls()).toHaveLength(5);
  });

  it('ends with 16 one-digit products, then 9 with Karatsuba', () => {
    render();
    click(button('Last step'));
    expect(narration()).toContain('1213 × 3141 = 3810033, using 16 one-digit multiplications');
    pick('three');
    expect(text()).toContain('Now using Karatsuba’s three products per split.');
    click(button('Last step'));
    expect(narration()).toContain('using 9 one-digit multiplications');
    expect(stat('One-digit multiplications')).toBe('9');
  });

  it('explains the Karatsuba middle term when combining', () => {
    render();
    pick('three');
    let seen = false;
    for (let i = 0; i < 40 && !seen; i++) {
      click(button('Next step'));
      seen = narration().startsWith('z₁ = ');
    }
    expect(seen).toBe(true);
    expect(narration()).toMatch(/z₁ = \d+ − \d+ − \d+ = \d+, so/);
  });

  it('shows a carry note and a Karatsuba loss on 1234 × 5678', () => {
    render();
    commit(field('example'), 'classic');
    pick('three');
    expect(text()).toMatch(/Four \(plain split\)\s*16/);
    expect(text()).toMatch(/Three \(Karatsuba\)\s*17/);
  });

  it('lets a learner select a call to see its split', () => {
    render();
    click(button('Next step'));
    const root = /** @type {HTMLElement} */ (calls()[0]);
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('m = 2: x = 12·10^2 + 13, y = 31·10^2 + 41');
  });

  it('refuses bad factors and keeps the last valid one', () => {
    render();
    commit(field('x'), '12x');
    expect(narration()).toContain('Type a whole number');
    expect(/** @type {HTMLInputElement} */ (field('x')).value).toBe('1213');
    commit(field('y'), '1234567');
    expect(narration()).toContain('at most 6 digits');
    commit(field('y'), '7');
    commit(field('x'), '8');
    click(button('Last step'));
    expect(narration()).toContain('8 × 7 = 56, using 1 one-digit multiplication in 1 call');
  });

  it('tabulates n² against n^1.585', () => {
    render();
    expect(text()).toMatch(/1024\s*1,048,576\s*59,049/);
  });

  it('steps through Strassen’s seven products and four entries', () => {
    render();
    pick('matrices');
    expect(narration()).toContain('The definition needs 8 products');
    click(button('Next step'));
    expect(narration()).toContain('M₁ = (A₁₁ + A₂₂)(B₁₁ + B₂₂) = 5 × 13 = 65.');
    click(button('Last step'));
    expect(narration()).toContain('C = [19 22; 43 50], with 7 multiplications and 18 additions');
    expect(stat('Multiplications')).toBe('7');
    expect(stat('Additions and subtractions')).toBe('18');
  });

  it('rebuilds Strassen on new matrices and refuses bad ones', () => {
    render();
    pick('matrices');
    commit(field('A'), '1 0; 0 1');
    click(button('Last step'));
    expect(narration()).toContain('C = [5 6; 7 8]');
    commit(field('B'), '1 2 3');
    expect(narration()).toContain('Type four whole numbers');
    expect(/** @type {HTMLInputElement} */ (field('B')).value).toBe('5 6; 7 8');
    commit(field('B'), '1 2 3 12');
    expect(narration()).toContain('between −9 and 9');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[4]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '64';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[4].hints[0]);
    answer.value = '49';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
