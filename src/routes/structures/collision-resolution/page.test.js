// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { collisionTrace } from '$lib/algo-engine/collision-resolution.js';
import { vi as m } from '$lib/lessons/collision-resolution/copy.vi.js';
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

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** @param {string} value */
const pickMethod = (value) => click(field(`input[name="method"][value="${value}"]`));
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Bước tiếp'));
};
/** @param {number} s */
const slotCell = (s) =>
  document.querySelector(`tr[data-slot="${s}"] td:last-child`)?.textContent?.trim();

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('collision resolution lesson', () => {
  it('fills both tables and compares the costs at the end', () => {
    render();
    expect(narration()).toContain('Cột trái dùng móc nối, cột phải dùng dò tuyến tính.');
    next(1);
    expect(narration()).toBe('Chèn 22: h(22) = 22 mod 11 = 0.');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong. Móc nối thực hiện 3 phép so sánh; dò tuyến tính đã xem 14 ô.');
    expect(byTest('probes')).toBe('14');
    expect(byTest('longest')).toBe('2');
    expect(slotCell(10)).toBe('30');
  });

  it('shows the probe sequence of a key that collides', () => {
    render();
    // 22, 41, 53, 46 go home; 30 collides at 8 and 9, then lands in 10.
    click(button('Đến bước cuối'));
    const frames = 60;
    for (let i = 0; i < frames && !narration().startsWith('Lần dò i = 2: ô 10'); i++) {
      click(button('Bước trước'));
    }
    expect(narration()).toBe('Lần dò i = 2: ô 10 trống. 30 vào ô này sau 2 lần va chạm.');
    const chips = [...document.querySelectorAll('ol li')].map((li) => li.textContent?.trim());
    expect(chips).toContain('i=0: 8');
    expect(chips).toContain('i=1: 9');
  });

  it('lets quadratic probing fail on keys with one home, and double hashing place them', () => {
    render();
    commit(field('select[name="preset"]'), 'same-home');
    pickMethod('quadratic');
    click(button('Đến bước cuối'));
    expect(byTest('failed')).toBe('1');
    expect(narration()).toContain('không đặt được 1 khoá');
    pickMethod('double');
    next(1);
    expect(narration()).toBe(
      'Chèn 0: h(0) = 0 mod 11 = 0. Bước nhảy của nó là h₂(0) = 7 − (0 mod 7) = 7.',
    );
    click(button('Đến bước cuối'));
    expect(byTest('failed')).toBe('0');
    expect(byTest('probes')).toBe('13');
  });

  it('seeks to a search and charges a miss in both tables', () => {
    render();
    click(buttonByText('Tìm'));
    expect(narration()).toBe('Tìm 34: h(34) = 34 mod 11 = 1.');
    next(3);
    expect(narration()).toBe(
      'Móc nối: 34 không có trong chuỗi 1. Lần tìm trượt tốn 2 phép so sánh, tức cả chuỗi.',
    );
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toBe(
      'Dò: ô 5 trống, nên 34 không có trong bảng. Lần tìm trượt tốn 5 lần dò.',
    );
  });

  it('runs the search when Enter submits the search field and finds a key', () => {
    render();
    const input = field('input[name="search"]');
    commit(input, '67');
    input.form?.requestSubmit();
    flushSync();
    expect(narration()).toBe('Tìm 67: h(67) = 67 mod 11 = 1.');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toBe('Dò: tìm thấy 67 ở ô 4 sau 4 lần dò.');
  });

  it('keeps the last valid keys and search value on bad input', () => {
    render();
    const keys = field('input[name="keys"]');
    commit(keys, '5, 5');
    expect(narration()).toBe(m.keyErrors.duplicate);
    expect(keys.value).toBe('22, 41, 53, 46, 30, 13, 1, 67');
    commit(keys, '1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11');
    expect(narration()).toBe(m.keyErrors.count);
    const search = field('input[name="search"]');
    commit(search, '150');
    search.form?.requestSubmit();
    flushSync();
    expect(search.value).toBe('34');
    expect(narration()).toBe(m.keyErrors.range);
    expect(document.body.textContent).toMatch(/Bước 1\//);
    commit(keys, '3, 14');
    click(button('Đến bước cuối'));
    expect(slotCell(4)).toBe('14');
  });

  it('does not promise another probe after the last one', () => {
    const trace = collisionTrace([0, 11, 22, 33, 44, 55, 66], 'quadratic');
    const last = trace[trace.findIndex((f) => f.kind === 'fail') - 1];
    expect(last.attempt).toBe(10);
    expect(m.describe(last, 'quadratic')).toBe(
      'Lần dò i = 10: ô 1 chứa 11. Va chạm, và đó là lần dò cuối cùng.',
    );
  });

  it('says a search was cleared when the method changes', () => {
    render();
    click(buttonByText('Tìm'));
    pickMethod('double');
    expect(narration()).toBe(m.searchDropped);
    expect(document.body.textContent).toMatch(/Bước 1\//);
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toBe('Chèn 22: h(22) = 22 mod 11 = 0.');
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
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
