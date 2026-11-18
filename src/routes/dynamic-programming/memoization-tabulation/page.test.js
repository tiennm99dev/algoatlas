// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/memoization-tabulation/copy.vi.js';
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

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));
const treeNodes = () => document.querySelectorAll('svg[aria-label^="Cây lời gọi"] circle').length;
/** @param {string} label */
const cellTitles = (label) =>
  [...document.querySelectorAll('svg title')]
    .map((t) => t.textContent ?? '')
    .filter((t) => t.startsWith(label));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('memoization and tabulation lesson', () => {
  it('runs plain recursion and counts the repeated work', () => {
    render();
    expect(narration()).toBe(
      'Sẵn sàng gọi fib(5). Đệ quy thuần không lưu gì, nên ta sẽ tính đi tính lại cùng những giá trị.',
    );
    click(button('Bước tiếp'));
    expect(narration()).toBe('Gọi fib(5). 5 ≤ 1 không?');
    click(button('Đến bước cuối'));
    expect(byTest('result')).toBe('5');
    expect(byTest('calls')).toBe('15');
    expect(byTest('additions')).toBe('7');
    expect(byTest('hits')).toBe('0');
    expect(treeNodes()).toBe(15);
    expect(narration()).toBe(
      'fib(5) = 5 sau 15 lời gọi và 7 phép cộng. Riêng fib(1) đã được tính 5 lần.',
    );
    expect(cellTitles('fib(2) được tính')).toEqual(['fib(2) được tính 3 lần, làm lặp lại']);
  });

  it('collapses the tree with memoization and drops it with tabulation', () => {
    render();
    click(field('input[name="mode"][value="memo"]'));
    click(button('Đến bước cuối'));
    expect(byTest('calls')).toBe('9');
    expect(byTest('hits')).toBe('3');
    expect(byTest('additions')).toBe('4');
    expect(treeNodes()).toBe(9);
    expect(cellTitles('memo[5]')).toEqual(['memo[5]: 5, đáp án']);
    click(button('Bước trước'));
    expect(narration()).toBe(
      'fib(5) = fib(4) + fib(3) = 3 + 2 = 5. Lưu vào memo[5] để mọi lời gọi sau tra được.',
    );

    click(field('input[name="mode"][value="table"]'));
    expect(byTest('no-tree')).toBe(m.tableTreeText);
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'dp[3] = dp[2] + dp[1] = 1 + 1 = 2. Cả hai ô đã được lấp ở các lần lặp trước.',
    );
    expect(cellTitles('dp[1]')).toEqual(['dp[1]: 1, đang đọc']);
    click(button('Đến bước cuối'));
    expect(byTest('calls')).toBe('0');
    expect(byTest('additions')).toBe('4');
    expect(byTest('result')).toBe('5');
  });

  it('refuses an n out of range and keeps the last valid one', () => {
    render();
    commit(field('input[name="n"]'), '9');
    expect(narration()).toBe(m.nError(8));
    expect(field('input[name="n"]').value).toBe('5');
    commit(field('input[name="n"]'), '6');
    click(button('Đến bước cuối'));
    expect(byTest('calls')).toBe('25');
    expect(byTest('result')).toBe('8');
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
    answer.value = '24';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '25';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
