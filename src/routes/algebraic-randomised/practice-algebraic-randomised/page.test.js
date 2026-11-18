// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  BIG_PRESETS,
  MAX_COEFF,
  MAX_DIGITS,
  MAX_INDEX,
  MAX_MODULUS,
  MAX_ORDER,
  MIN_MODULUS,
  RECURRENCE_PRESETS,
  bigTrace,
  recurrenceByLoop,
  recurrenceTrace,
} from '$lib/algo-engine/practice-algebraic-randomised.js';
import { vi as m } from '$lib/lessons/practice-algebraic-randomised/copy.vi.js';
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
const toLast = () => click(button('Đến bước cuối'));
/** @param {number} times */
const next = (times) => {
  for (let i = 0; i < times; i++) click(button('Bước tiếp'));
};
/** @param {string} value */
function pickProblem(value) {
  const radio = /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="problem"][value="${value}"]`)
  );
  radio.click();
  flushSync();
}

describe('algebraic practice lesson', () => {
  it('builds the matrix of a recurrence with a constant row by row', () => {
    render();
    expect(stat('formula')).toBe('aₙ = 2·aₙ₋₁ + 3·aₙ₋₂ + 5; a₀ = 1, a₁ = 1');
    expect(stat('size')).toBe('3 × 3');
    next(1);
    expect(narration()).toContain('hệ số 2, 3 rồi đến hằng số 5');
    next(1);
    expect(narration()).toContain('Hàng 1 chỉ chép aₙ₋₁');
    next(1);
    expect(narration()).toContain('Hàng cuối giữ hằng số 1');
    next(1);
    expect(narration()).toContain('Bắt đầu với R = I và P = M, và e = n = 10.');
    toLast();
    expect(stat('answer')).toBe('66430');
    expect(stat('products')).toBe('5');
    expect(stat('e')).toBe('0');
    expect(narration()).toContain('a₁₀ = 66430');
  });

  it('rebuilds for new coefficients, start values, n and m, and refuses bad ones', () => {
    render();
    commit(field('coeffs'), '1 1 1');
    expect(field('initial').value).toBe('1, 1, 1');
    commit(field('constant'), '0');
    commit(field('initial'), '0 0 1');
    commit(field('n'), '30');
    toLast();
    const trib = { coeffs: [1, 1, 1], constant: 0, initial: [0, 0, 1] };
    expect(stat('answer')).toBe(recurrenceByLoop(trib, 30, 1_000_000_007));
    expect(stat('size')).toBe('3 × 3');
    commit(field('mod'), '97');
    toLast();
    expect(stat('answer')).toBe(recurrenceByLoop(trib, 30, 97));

    commit(field('coeffs'), '1 2 3 4 5');
    expect(narration()).toBe(m.coeffsError(MAX_ORDER, MAX_COEFF));
    expect(field('coeffs').value).toBe('1, 1, 1');
    commit(field('initial'), '1 2');
    expect(narration()).toBe(m.initialError(3, MAX_COEFF));
    commit(field('constant'), '100');
    expect(narration()).toBe(m.constantError(MAX_COEFF));
    expect(field('constant').value).toBe('0');
    commit(field('n'), '-1');
    expect(narration()).toBe(m.nError(MAX_INDEX));
    commit(field('mod'), '1');
    expect(narration()).toBe(m.modError(MIN_MODULUS, MAX_MODULUS));
    expect(field('mod').value).toBe('97');
  });

  it('loads a recurrence example with a huge index', () => {
    render();
    commit(field('rec-preset'), 'tribonacci');
    toLast();
    const p = RECURRENCE_PRESETS.tribonacci;
    expect(stat('answer')).toBe(recurrenceTrace(p.rec, p.n, p.mod).at(-1)?.answer);
    expect(Number(stat('products'))).toBeLessThan(80);
  });

  it('multiplies big numbers by diagonals and carries', () => {
    render();
    pickProblem('bignum');
    expect(narration()).toContain('Nhân 1234 với 5678');
    next(3);
    expect(narration()).toBe(
      'c[2] cộng các tích trên một đường chéo, nơi i + j = 2: 4·6 + 3·7 + 2·8 = 61.',
    );
    const marked = [...document.querySelectorAll('[role="img"] text, svg text')].filter(
      (t) => t.textContent === '+',
    );
    expect(marked.length).toBeGreaterThan(0);
    toLast();
    expect(stat('product')).toBe('7006652');
    expect(stat('digit-products')).toBe('16');
    commit(field('big-preset'), 'carries');
    toLast();
    expect(stat('product')).toBe('99980001');
    commit(field('x'), '1,000');
    expect(field('x').value).toBe('1000');
    toLast();
    expect(stat('product')).toBe('9999000');
    commit(field('y'), '007');
    expect(narration()).toBe(m.bigError(MAX_DIGITS));
    expect(field('y').value).toBe('9999');
  });

  it('keeps each problem’s position when switching between them', () => {
    render();
    toLast();
    pickProblem('bignum');
    expect(narration()).toContain('Nhân 1234 với 5678');
    pickProblem('recurrence');
    expect(stat('answer')).toBe('66430');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (document.querySelectorAll('li[aria-labelledby]')[4]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '60';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[4]).hints[0]);
    answer.value = '61';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('stores practice answers the engine agrees with', () => {
    const answer = (/** @type {number} */ i) => /** @type {any} */ (m.practice[i]).answer;
    const c = RECURRENCE_PRESETS.constant;
    const cEnd = recurrenceTrace(c.rec, c.n, c.mod).at(-1);
    expect(answer(0)).toBe(cEnd?.size);
    expect(String(answer(1))).toBe(cEnd?.answer);
    const f = RECURRENCE_PRESETS.fibonacci;
    expect(String(answer(2))).toBe(recurrenceTrace(f.rec, 100, f.mod).at(-1)?.answer);
    expect(answer(3)).toBe(recurrenceTrace(f.rec, 1_000_000, f.mod).at(-1)?.matrixProducts);
    expect(answer(4)).toBe(bigTrace(...BIG_PRESETS.small).at(-1)?.c[2]);
    expect(answer(5)).toBe(bigTrace(...BIG_PRESETS.long).at(-1)?.products);
    expect(answer(6)).toBe(bigTrace(...BIG_PRESETS.carries).at(-1)?.answer.length);
  });
});
