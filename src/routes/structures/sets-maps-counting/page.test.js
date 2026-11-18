// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/sets-maps-counting/copy.vi.js';
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
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Bước tiếp'));
};
/** The map rows as "word count" pairs, in display order. */
const mapRows = () =>
  [...document.querySelectorAll('[data-testid="map"] li')].map((li) =>
    li.querySelector('.sr-only')?.textContent?.trim(),
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('sets, maps and frequency counting lesson', () => {
  it('counts the words and re-sorts the map by frequency', () => {
    render();
    expect(narration()).toBe('Ánh xạ count đang rỗng. Mỗi từ sẽ tốn một lần tra bảng băm.');
    next(1);
    expect(narration()).toBe('Đọc “lúa”, từ thứ 1. Nó đã là khoá của count chưa?');
    next(1);
    expect(narration()).toBe('Chưa: thêm “lúa” với số đếm 1. Ánh xạ giờ có 1 khoá.');
    next(6);
    expect(narration()).toBe('Rồi: count[“lúa”] tăng từ 1 lên 2.');
    expect(mapRows()[0]).toBe('lúa: 2');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong. 14 từ, 9 từ khác nhau. Xuất hiện nhiều nhất: “lúa”, 3 lần.');
    expect(mapRows().slice(0, 2)).toEqual(['lúa: 3', 'nếp: 2']);
    expect(byTest('lookups')).toBe('14');
    expect(byTest('list-compares')).toBe('55');
  });

  it('finds the first repeat with a set', () => {
    render();
    commit(field('select[name="preset"]'), 'an-qua');
    click(field('input[name="mode"][value="set"]'));
    next(14);
    expect(narration()).toBe('Rồi: “ăn” đã có trong seen. Đây là từ lặp lại đầu tiên.');
    expect(byTest('first-repeat')).toBe('ăn');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong. Có 10 từ khác nhau trong 14 từ; 4 từ là từ lặp lại.');
    expect(document.querySelector('[data-testid="set"]')?.textContent).toContain('trồng');
    click(field('input[name="mode"][value="map"]'));
    expect(narration()).toBe(
      'Xong. 14 từ, 10 từ khác nhau. Xuất hiện nhiều nhất: “ăn”, “nhớ”, “kẻ” và “trồng”, mỗi từ 2 lần.',
    );
  });

  it('counts typed words and keeps the last valid text on bad input', () => {
    render();
    const input = field('input[name="words"]');
    commit(input, '123 !!');
    expect(narration()).toBe(m.wordErrors.empty);
    expect(input.value).toBe('lúa nếp là lúa nếp làng lúa lên lớp lớp lòng nàng lâng lâng');
    commit(input, 'B a, A b c');
    click(button('Đến bước cuối'));
    expect(mapRows()).toEqual(['b: 2', 'a: 2', 'c: 1']);
    expect(byTest('repeats')).toBe('2');
  });

  it('steps with the arrow keys', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(narration()).toBe('Đọc “lúa”, từ thứ 1. Nó đã là khoá của count chưa?');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = 'quả';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = 'ăn';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
