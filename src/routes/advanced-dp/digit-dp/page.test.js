// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { checkAnswer, exerciseProblems } from '$lib/components/answer-check.js';
import { digitTrace } from '$lib/algo-engine/digit-dp.js';
import { vi as m } from '$lib/lessons/digit-dp/copy.vi.js';
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
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** Names given by an aria-label or an SVG title. @param {string} start */
const labelled = (start) =>
  [
    ...[...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label')),
    ...[...document.querySelectorAll('title')].map((el) => el.textContent),
  ].filter((l) => l?.startsWith(start));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('digit DP lesson', () => {
  it('fills digit by digit and lets the tight prefix die', () => {
    render();
    expect(narration()).toContain('Đếm các số từ 0 đến 345 có tổng chữ số bằng 10.');
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Tiền tố chặt (tổng 0) có thể nhận một chữ số nhỏ hơn 3, từ 0 đến 2. Mỗi chữ số như vậy làm số nhỏ hơn N và tiền tố trở thành lỏng: +1 vào các tổng 0..2.',
    );
    expect(labelled('Chữ số 3')).toEqual(['Chữ số 3: được phép, vẫn chặt']);
    expect(labelled('Chữ số 4')).toEqual(['Chữ số 4: bị chặn, số sẽ vượt N']);
    expect(labelled('Chữ số 1:')).toEqual(['Chữ số 1: được phép, tiền tố lỏng']);
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Hoặc tiền tố chặt nhận đúng chữ số 3 và vẫn bằng tiền tố của N: t = 0 + 3 = 3.',
    );
    for (let i = 0; i < 4; i++) click(button('Bước tiếp'));
    expect(narration()).toBe(
      'Có 1 tiền tố lỏng với tổng 1, đều đã nhỏ hơn N, nên mọi chữ số 0–9 đều được đứng tiếp: cộng 1 vào các tổng 1..10.',
    );
    expect(labelled('1 chữ số, tổng 1:')).toEqual(['1 chữ số, tổng 1: 1, đang lan ra']);
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('33');
    expect(byTest('transitions')).toBe('155 / 155');
    expect(byTest('brute')).toBe('346');
    expect(byTest('states')).toBe('44');
    expect(labelled('Vị trí 3')).toEqual(['Vị trí 3: chữ số 5, tiền tố chặt đã bị loại']);
    expect(labelled('3 chữ số, tổng 10:')).toEqual(['3 chữ số, tổng 10: 33, đáp án']);
  });

  it('counts N itself when its tight prefix ends on S', () => {
    render();
    commit(field('input[name="limit"]'), '1234');
    expect(field('select[name="preset"]').value).toBe('');
    click(button('Đến bước cuối'));
    const want = digitTrace(1234, 10).at(-1)?.result;
    expect(byTest('answer')).toBe(String(want));
    expect(narration()).toContain('cộng thêm chính N');
  });

  it('names a single number in the singular when N is the only one', () => {
    render();
    commit(field('input[name="limit"]'), '5');
    commit(field('input[name="target"]'), '5');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('1');
    expect(narration()).toBe(
      'Có 1 số: 0 số lỏng có tổng 5, cộng thêm chính N, vì tiền tố chặt kết thúc với tổng 5.',
    );
  });

  it('refuses values out of range and keeps the last good ones', () => {
    render();
    commit(field('input[name="limit"]'), '1000000');
    expect(narration()).toBe(m.limitError(999999));
    expect(field('input[name="limit"]').value).toBe('345');
    commit(field('input[name="target"]'), '21');
    expect(narration()).toBe(m.targetError(20));
    expect(field('input[name="target"]').value).toBe('10');
    commit(field('input[name="target"]'), '3');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe(String(digitTrace(345, 3).at(-1)?.result));
  });

  it('loads a preset and steps with the keyboard', () => {
    render();
    commit(field('select[name="preset"]'), 'round');
    expect(field('input[name="limit"]').value).toBe('1000');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toContain('Trước chữ số đầu tiên');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toBe('21');
  });

  it('stores practice answers that the engine reproduces', () => {
    /** @param {number} i @returns {number} */
    const stored = (i) => /** @type {{answer: number}} */ (m.practice[i]).answer;
    expect(digitTrace(345, 10).at(-1)?.result).toBe(stored(0));
    expect(digitTrace(1000, 5).at(-1)?.result).toBe(stored(1));
    const f99 = digitTrace(99, 10).at(-1)?.result ?? 0;
    expect(f99).toBe(9);
    expect(stored(0) - f99).toBe(stored(3));
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '34';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    /** @type {HTMLButtonElement} */ (hint).click();
    flushSync();
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '33';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
    const cost = m.practice.find((ex) => ex.type === 'text');
    for (const typed of ['O(len * S)', 'O(10 * len * S)'])
      expect(checkAnswer(/** @type {any} */ (cost), typed).correct).toBe(true);
  });
});
