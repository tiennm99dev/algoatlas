// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/recursion-basics/copy.vi.js';
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
const stackRows = () => [...document.querySelectorAll('[data-testid="stack"] li')];
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

describe('recursion basics lesson', () => {
  it('pushes a frame per call down to the base case, then pops them', () => {
    render();
    expect(narration()).toBe('Sẵn sàng gọi fact(4). Mỗi lời gọi sẽ đẩy một khung riêng vào stack.');
    expect(stackRows()[0].textContent).toContain(m.stackEmpty);
    next(1);
    expect(narration()).toBe(
      'Gọi fact(4): đẩy vào một khung với n = 4. Stack sâu 1 khung. 4 ≤ 1 không?',
    );
    next(4);
    expect(narration()).toBe(
      '1 ≤ 1, trường hợp cơ sở: fact(1) trả về 1 mà không tự gọi lại, và khung của nó được lấy ra khỏi stack.',
    );
    expect(stackRows()).toHaveLength(4);
    expect(stackRows()[0].textContent).toContain('fact(1)');
    expect(stackRows()[1].textContent).toContain('n = 2, r = ?');
    next(1);
    expect(narration()).toBe('fact(1) trả về 1. Quay lại fact(2), hàm này chạy tiếp với r = 1.');
    expect(stackRows()).toHaveLength(3);
    expect(stackRows()[0].textContent).toContain('n = 2, r = 1');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'fact(4) = 24 sau 4 lời gọi. Stack sâu nhất 4 khung và giờ đã rỗng trở lại.',
    );
    expect(byTest('result')).toBe('24');
    expect(byTest('depth')).toBe('0 (tối đa 4)');
  });

  it('switches to Fibonacci and grows a branching call tree', () => {
    render();
    click(field('input[name="fn"][value="fib"]'));
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('3');
    expect(byTest('calls')).toBe('9');
    expect(document.querySelectorAll('svg[role="img"] circle')).toHaveLength(9);
    click(button('Bước trước'));
    expect(narration()).toBe('fib(4) = a + b = 2 + 1 = 3. Trả về 3 và lấy khung ra.');
  });

  it('refuses an n out of range and keeps the last valid one', () => {
    render();
    commit(field('input[name="n"]'), '20');
    expect(narration()).toBe(m.nError('fact', 12));
    expect(field('input[name="n"]').value).toBe('4');
    commit(field('input[name="n"]'), '6');
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('720');
    click(field('input[name="fn"][value="fib"]'));
    expect(field('input[name="n"]').value).toBe('6');
    commit(field('input[name="n"]'), '9');
    expect(narration()).toBe(m.nError('fib', 8));
  });

  it('overflows the stack without a base case', () => {
    render();
    click(field('input[name="base"]'));
    expect(narration()).toBe(m.baseNotice(false));
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe(m.resultOverflow);
    expect(byTest('calls')).toBe('14');
    expect(narration()).toContain('tràn stack sau 14 lời gọi');
    expect(text()).toContain(m.legend.lost);
    click(field('input[name="base"]'));
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('24');
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
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
