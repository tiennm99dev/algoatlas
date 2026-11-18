// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { fvalue } from '$lib/algo-engine/rational.js';
import { LUP_PRESETS, MAX_ENTRY, lupTrace } from '$lib/algo-engine/lup-decomposition.js';
import { vi as m } from '$lib/lessons/lup-decomposition/copy.vi.js';
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
/** @param {string} key */
const vector = (key) =>
  [...document.querySelectorAll(`[data-testid="vector-${key}"] td`)]
    .slice(0, -1)
    .map((td) => td.textContent?.trim());
const work = () =>
  [...document.querySelectorAll('[data-testid="work"] tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((td) => td.lastChild?.textContent?.trim()),
  );
/** @param {string} role */
const roles = (role) =>
  document.querySelectorAll(`[data-testid="work"] td[data-role="${role}"]`).length;
const toLast = () => click(button('Đến bước cuối'));
/** @param {number} times */
const next = (times) => {
  for (let i = 0; i < times; i++) click(button('Bước tiếp'));
};
/** @param {string} value */
function pickPivoting(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="pivoting"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

describe('LUP decomposition lesson', () => {
  it('factors and solves the CLRS example', () => {
    render();
    expect(narration()).toContain('Phân tích ma trận 3×3');
    next(1);
    expect(narration()).toContain('là 5, ở hàng 2');
    expect(roles('pivot')).toBe(1);
    expect(roles('searched')).toBe(2);
    next(1);
    expect(narration()).toContain('Đổi chỗ hàng 0 và hàng 2');
    expect(vector('perm')).toEqual(['2', '1', '0']);
    next(1);
    expect(narration()).toContain('l = a[1][0] / a[0][0] = 3/5');
    expect(work()[1]).toEqual(['3/5', '2/5', '11/5']);
    expect(roles('updated')).toBe(3);
    toLast();
    expect(vector('x')).toEqual(['−7/5', '11/5', '3/5']);
    expect(vector('perm')).toEqual(['2', '0', '1']);
    expect(stat('swaps')).toBe('2');
    expect(narration()).toContain('x = (−7/5, 11/5, 3/5)');
    expect(document.querySelector('[data-testid="factor-L"]')).not.toBeNull();
    expect(roles('l')).toBe(3);
    expect(roles('u')).toBe(6);
  });

  it('shows plain LU failing on a zero pivot, and pivoting fixing it', () => {
    render();
    commit(field('preset'), 'zeroPivot');
    pickPivoting('lu');
    toLast();
    expect(narration()).toContain('Đã dừng vì gặp chốt bằng 0');
    expect(document.querySelector('[data-testid="factor-L"]')).toBeNull();
    click(button('Bước trước'));
    expect(narration()).toContain('LU thường không chia được cho nó');
    pickPivoting('lup');
    toLast();
    expect(vector('x')).toEqual(['1', '1', '1']);
    expect(stat('swaps')).toBe('2');
  });

  it('rebuilds from the size, a cell, b and the singular preset', () => {
    render();
    commit(field('size'), '2');
    expect(field('a-1-1').value).toBe('4');
    toLast();
    expect(vector('x')).toEqual(['1', '2']);
    commit(field('b-1'), '7');
    toLast();
    // x + 2y = 5, 3x + 4y = 7 → x = −3, y = 4.
    expect(vector('x')).toEqual(['−3', '4']);
    commit(field('a-0-0'), '2');
    toLast();
    // 2x + 2y = 5, 3x + 4y = 7 → x = 3, y = −1/2.
    expect(vector('x')).toEqual(['3', '−1/2']);
    commit(field('preset'), 'singular');
    toLast();
    expect(narration()).toContain('suy biến');
    commit(field('size'), '4');
    toLast();
    expect(vector('x')).toEqual(['1', '1', '1', '1']);
    expect(stat('factor-ops')).toBe('20');
  });

  it('refuses bad input with a notice and keeps the last good value', () => {
    render();
    commit(field('a-0-0'), String(MAX_ENTRY + 1));
    expect(narration()).toBe(m.entryError(MAX_ENTRY));
    expect(field('a-0-0').value).toBe('1');
    commit(field('b-2'), '');
    expect(narration()).toBe(m.entryError(MAX_ENTRY));
    expect(field('b-2').value).toBe('8');
    commit(field('a-1-2'), '1.5');
    expect(field('a-1-2').value).toBe('4');
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
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[1]).hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const end = /** @param {keyof typeof LUP_PRESETS} p */ (p) =>
      /** @type {import('$lib/algo-engine/lup-decomposition.js').LupFrame} */ (
        lupTrace(LUP_PRESETS[p].a, LUP_PRESETS[p].b, true).at(-1)
      );
    const x0 = /** @type {import('$lib/algo-engine/rational.js').Frac} */ (end('clrs').x[0]);
    expect(fvalue(x0)).toBeCloseTo(/** @type {any} */ (m.practice[0]).answer, 9);
    expect(/** @type {any} */ (m.practice[1]).answer).toBe(end('zeroPivot').swaps);
  });
});
