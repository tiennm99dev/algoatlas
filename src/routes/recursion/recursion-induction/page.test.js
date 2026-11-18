// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/recursion-induction/copy.vi.js';
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
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Bước tiếp'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('recursion and induction lesson', () => {
  it('checks the sum invariant on entry, after each pass and on exit', () => {
    render();
    next(1);
    expect(narration()).toBe(
      'Khởi tạo, trước lần lặp đầu tiên (i = 0): s = 0, và tổng của không giá trị nào là 0. Bất biến đúng ✓.',
    );
    next(1);
    expect(narration()).toContain('Giữa một lần lặp, bất biến có thể tạm bị phá vỡ');
    expect(byTest('verdict')).toBe(m.notChecked);
    next(1);
    expect(narration()).toBe('Duy trì, sau lần lặp (i = 1): s = 5, và a[0] = 5. Bất biến đúng ✓.');
    expect(byTest('verdict')).toBe('✓ đúng');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Xong: đáp số là 10. Cả 8 lần kiểm tra đều đúng, nên lập luận đứng vững với đầu vào này và, theo đúng cách suy luận ấy, với mọi đầu vào.',
    );
    expect(byTest('answer')).toContain('(đúng)');
    expect(byTest('passed')).toBe('8');
  });

  it('shows where a bug breaks the argument', () => {
    render();
    click(field('input[name="buggy"]'));
    expect(narration()).toBe(m.bugNotice(true, 'Vòng lặp tính tổng'));
    next(1);
    expect(narration()).toBe(
      'Khởi tạo, trước lần lặp đầu tiên (i = 1): s = 0, và a[0] = 5. Bất biến bị phá vỡ ✗.',
    );
    click(button('Đến bước cuối'));
    expect(byTest('failed')).toBe('7');
    expect(byTest('passed')).toBe('0');
    expect(byTest('answer')).toContain('(sai)');
  });

  it('catches the insertion sort bug on reversed input but not on sorted input', () => {
    render();
    commit(field('select[name="program"]'), 'insertion');
    click(field('input[name="buggy"]'));
    commit(field('select[name="preset"]'), 'sorted');
    click(button('Đến bước cuối'));
    expect(byTest('failed')).toBe('0');
    expect(narration()).toContain(
      'Cả 6 lần kiểm tra đều đúng trên đầu vào này, nhưng lỗi vẫn còn đó',
    );
    expect(narration()).not.toContain('theo đúng cách suy luận ấy');
    commit(field('select[name="preset"]'), 'reversed');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toContain('9, 0, 2, 4, 7');
    expect(byTest('failed')).toBe('5');
    click(button('Bước trước'));
    expect(narration()).toContain('a[0] = 9 > a[1] = 0, nên a[0..4] chưa được sắp xếp');
  });

  it('proves the recursive sum by induction', () => {
    render();
    commit(field('select[name="program"]'), 'recursive');
    next(1);
    expect(narration()).toBe(
      'Gọi sum(a, 6). Lời gọi này cần sum(a, 5) trước, nên thêm một khung được đẩy vào ngăn xếp.',
    );
    next(7);
    expect(narration()).toBe(
      'Trường hợp cơ sở: sum(a, 0) trả về 0, và tổng của không giá trị nào là 0. P(0) đúng ✓.',
    );
    expect(text()).toContain('sum(a, 0)');
    next(2);
    expect(narration()).toBe(
      'Bước quy nạp cho P(2): r = sum(a, 1), rồi cộng a[1] = −2. Giờ sum(a, 2) trả về 3, và tổng 2 giá trị đầu là 3. P(2) đúng ✓.',
    );
    click(button('Đến bước cuối'));
    expect(byTest('passed')).toBe('7');
  });

  it('refuses bad values and keeps the last valid array', () => {
    render();
    commit(field('input[name="values"]'), '3, x');
    expect(narration()).toBe(m.valueErrors.format);
    expect(field('input[name="values"]').value).toBe('5, −2, 9, 1, −7, 4');
    commit(field('input[name="values"]'), '100');
    expect(narration()).toBe(m.valueErrors.range);
    commit(field('input[name="values"]'), '2 −3 4');
    click(button('Đến bước cuối'));
    expect(byTest('answer')).toContain('3');
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
    answer.value = '12';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[2].hints[0]);
    answer.value = '13';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
