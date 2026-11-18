// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/two-pointers/copy.vi.js';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickMode(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="mode"][value="${value}"]`)
    ),
  );
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

const arrayLabel = () =>
  document.querySelector(`svg[aria-label^="${m.arrayAria}"]`)?.getAttribute('aria-label') ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('two pointers lesson', () => {
  it('finds 4 + 6 = 10 after 5 sums', () => {
    render();
    expect(narration()).toBe(
      'Mảng đã sắp xếp gồm 6 phần tử. Ta tìm hai giá trị có tổng bằng 10: lo bắt đầu ở 0, hi ở 5.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toBe('a[0] + a[5] = 1 + 11 = 12.');
    expect(text()).toContain('1 + 11 = 12 > 10');
    click(button('Bước tiếp'));
    expect(narration()).toContain('12 > 10');
    expect(narration()).toContain('dời hi đến 4');
    expect(arrayLabel()).toContain('hi ở 4');
    expect(text()).toContain('Chỉ số 5: 11, đã bị loại');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong: 4 + 6 = 10 sau 5 tổng; vét cạn có thể cần đến 15.');
    expect(stat(m.stats.sums)).toBe('5');
    expect(stat(m.stats.pairs)).toBe('15');
    expect(stat(m.stats.result)).toBe('(2, 3)');
  });

  it('checks n − 1 sums when no pair exists', () => {
    render();
    commit(input('target'), '99');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.sums)).toBe('5');
    expect(stat(m.stats.result)).toBe('không có');
    expect(narration()).toContain('không có cặp nào sau 5 tổng');
  });

  it('partitions the same values around 5 in place', () => {
    render();
    pickMode('partition');
    expect(input('pivot')).not.toBeNull();
    expect(text()).toContain('partition(a, p):');
    expect(narration()).toBe('Phân hoạch 6 giá trị quanh p = 5: i bắt đầu ở 0, j ở 5.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('đổi chỗ chúng để được 4 và 8');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.swaps)).toBe('2');
    expect(stat(m.stats.reads)).toBe('7');
    expect(stat(m.stats.result)).toBe('3');
    expect(arrayLabel()).toContain('< p phủ từ 0 đến 2');
    expect(narration()).toBe(
      'Xong: i đã vượt qua j. a[0..3) chứa 3 giá trị < 5, còn a[3..6) chứa phần còn lại, sau 2 lần đổi chỗ và không cần mảng phụ.',
    );
  });

  it('rejects bad values and keeps the last valid array', () => {
    render();
    commit(input('values'), '1, x');
    expect(narration()).toBe(m.valueErrors.format);
    expect(input('values').value).toBe('8, 3, 11, 1, 6, 4');
    commit(input('values'), '5');
    expect(narration()).toBe(m.valueErrors.count);
    commit(input('values'), '5 −200');
    expect(narration()).toBe(m.valueErrors.range);
    commit(input('target'), '500');
    expect(narration()).toBe(m.targetError);
    expect(input('target').value).toBe('10');
    commit(input('values'), '9 −3 2');
    expect(input('values').value).toBe('9, -3, 2');
    expect(narration()).toBe(
      'Mảng đã sắp xếp gồm 3 phần tử. Ta tìm hai giá trị có tổng bằng 10: lo bắt đầu ở 0, hi ở 2.',
    );
  });

  it('draws random values with a reachable target', () => {
    render();
    click(buttonByText(m.randomButton));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.result)).not.toBe('không có');
    expect(input('values').value.split(', ')).toHaveLength(6);
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
