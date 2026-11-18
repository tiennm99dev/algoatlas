// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-hashing/copy.vi.js';
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
/** The map as [key, value] rows, without markers and screen-reader states. */
const mapRows = () =>
  [...document.querySelectorAll('[data-testid="map"] tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((td) => {
      const copy = /** @type {HTMLElement} */ (td.cloneNode(true));
      copy.querySelectorAll('.sr-only, [aria-hidden="true"]').forEach((el) => el.remove());
      return copy.textContent?.trim();
    }),
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: hashing problems lesson', () => {
  it('solves the classic two-sum and shows the map after each step', () => {
    render();
    expect(narration()).toBe('Map seen đang rỗng. Tìm hai số trong nums có tổng bằng 9.');
    next(1);
    expect(narration()).toBe('i = 0: nums[0] = 2, nên need = 9 − 2 = 7. 7 có trong seen không?');
    next(1);
    expect(narration()).toBe('Không. Lưu seen[2] = 0 rồi đi tiếp.');
    expect(mapRows()).toEqual([['2', '0']]);
    next(2);
    expect(narration()).toBe('Có: seen[2] = 0. nums[0] + nums[1] = 2 + 7 = 9. Trả về (0, 1).');
    expect(byTest('result')).toBe('(0, 1)');
    expect(byTest('lookups')).toBe('2');
  });

  it('runs the presets and reports a missing pair', () => {
    render();
    commit(field('select[name="preset"]'), 'late');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong: (4, 5) sau 6 lần tra, đã xét xong 15 cặp.');
    commit(field('select[name="preset"]'), 'none');
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('không có cặp');
    expect(byTest('entries')).toBe('4');
    click(button('Bước trước'));
    expect(narration()).toBe(
      'Không có hai số nào có tổng bằng 20: 4 lần tra đã xét xong cả 6 cặp.',
    );
  });

  it('never pairs a number with itself and keeps the last valid input', () => {
    render();
    commit(field('input[name="nums"]'), '5');
    commit(field('input[name="target"]'), '10');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong: không có cặp nào.');
    commit(field('input[name="nums"]'), '5, x');
    expect(narration()).toBe(m.numsErrors.format);
    expect(field('input[name="nums"]').value).toBe('5');
    commit(field('input[name="target"]'), '500');
    expect(narration()).toBe(m.targetError);
    expect(field('input[name="target"]').value).toBe('10');
    commit(field('input[name="nums"]'), '−3, 13');
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('(0, 1)');
  });

  it('groups anagrams by their sorted letters', () => {
    render();
    click(field('input[name="problem"][value="anagrams"]'));
    next(1);
    expect(narration()).toBe('Sắp xếp chữ cái của “eat” được “aet”. “aet” có trong groups không?');
    next(3);
    expect(narration()).toBe('Có: nối “tea” vào groups[“aet”], giờ nhóm này có 2 từ.');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong: 6 từ thuộc 3 nhóm.');
    expect(mapRows()).toEqual([
      ['aet', 'eat, tea, ate'],
      ['ant', 'tan, nat'],
      ['abt', 'bat'],
    ]);
    commit(field('input[name="words"]'), 'dog god 7');
    expect(narration()).toBe(m.wordErrors.format);
    commit(field('input[name="words"]'), 'Dog god cat');
    click(button('Đến bước cuối'));
    expect(byTest('groups')).toBe('2');
  });

  it('steps back with the arrow keys', () => {
    render();
    click(button('Đến bước cuối'));
    const before = narration();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    flushSync();
    expect(narration()).not.toBe(before);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[2]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '0, 0';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '(0, 2)';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
