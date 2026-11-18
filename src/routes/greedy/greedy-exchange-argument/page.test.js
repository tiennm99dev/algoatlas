// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/greedy-exchange-argument/copy.vi.js';

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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
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
const summary = () =>
  document.querySelector('[data-testid="counter-summary"]')?.textContent?.trim() ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('greedy change-making lesson', () => {
  it('starts on paying 6 with 1, 3, 4', () => {
    render();
    expect(narration()).toContain('Trả 6 bằng ít đồng nhất có thể từ 1, 3, 4.');
    expect(stat('Còn phải trả')).toBe('6');
    expect(stat('Số đồng ít nhất')).toBe('2');
  });

  it('steps through the sort and the first coin', () => {
    render();
    click(button('Bước tiếp'));
    expect(narration()).toContain('Sắp xếp các đồng xu từ lớn đến nhỏ: 4, 3, 1.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Đồng 4: ⌊6 / 4⌋ = 1');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Lấy 1 × 4. Còn phải trả 2.');
    expect(stat('Số đồng theo tham lam')).toBe('1');
  });

  it('ends with greedy using one coin too many', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Tham lam trả 6 = 4 + 1 + 1, 3 đồng, nhưng 3 + 3 chỉ dùng 2.');
    expect(stat('Kết luận')).toBe('Tham lam dùng quá nhiều đồng');
    const strip = document.querySelector('[aria-label^="Các đồng xu:"]');
    expect(strip?.textContent).toContain('×2');
  });

  it('finds no counterexample for canonical coins', () => {
    render();
    commit(field('preset'), 'us');
    expect(text()).toContain('Đã nạp bộ đồng xu mới.');
    expect(summary()).toBe('Với bộ đồng xu này, tham lam tối ưu cho mọi số tiền từ 1 đến 200.');
    expect(buttonByText('Chạy từng bước phản ví dụ nhỏ nhất').getAttribute('aria-disabled')).toBe(
      'true',
    );
    commit(field('preset'), 'vnd');
    expect(summary()).toContain('tham lam tối ưu cho mọi số tiền');
  });

  it('loads the smallest counterexample and steps through it', () => {
    render();
    commit(field('preset'), 'sevenTen');
    expect(summary()).toContain('Tham lam không tối ưu cho');
    click(buttonByText('Chạy từng bước phản ví dụ nhỏ nhất'));
    expect(narration()).toContain('Đã nạp số tiền 14');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Tham lam trả 14 = 10 + 1 + 1 + 1 + 1, 5 đồng, nhưng 7 + 7');
  });

  it('shows greedy stuck and impossible amounts without a 1 coin', () => {
    render();
    commit(field('preset'), 'noOne');
    commit(field('amount'), '9');
    click(button('Đến bước cuối'));
    expect(narration()).toContain(
      'Tham lam bị kẹt với 1 chưa trả, trong khi 9 = 3 + 3 + 3 trả được',
    );
    expect(stat('Kết luận')).toBe('Tham lam bị kẹt');
    commit(field('amount'), '7');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Không tổ hợp nào của các đồng xu này trả được 7');
    expect(stat('Số đồng ít nhất')).toBe('—');
  });

  it('reads typed coins and refuses bad input', () => {
    render();
    commit(field('coins'), '9 6 5 1');
    expect(/** @type {HTMLInputElement} */ (field('coins')).value).toBe('1, 5, 6, 9');
    expect(summary()).toContain('Tham lam không tối ưu');
    commit(field('coins'), '1, 0');
    expect(narration()).toContain('Mỗi đồng xu phải từ 1 đến 100.');
    expect(/** @type {HTMLInputElement} */ (field('coins')).value).toBe('1, 5, 6, 9');
    commit(field('amount'), '500');
    expect(narration()).toContain('Số tiền phải là số nguyên từ 1 đến 200.');
    expect(/** @type {HTMLInputElement} */ (field('amount')).value).toBe('6');
  });

  it('commits typed fields on Enter', () => {
    render();
    const amount = /** @type {HTMLInputElement} */ (field('amount'));
    amount.value = '11';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    amount.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('Trả 11 bằng ít đồng nhất');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '17';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '14';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
