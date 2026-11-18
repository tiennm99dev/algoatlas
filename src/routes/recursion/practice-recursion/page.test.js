// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-recursion/copy.vi.js';
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

const boardLabel = () =>
  document.querySelector('[data-testid="board"]')?.getAttribute('aria-label') ?? '';

describe('practice: recursive thinking lesson', () => {
  it('solves three disks by trusting the smaller call', () => {
    render();
    expect(narration()).toBe(
      'Chuyển cả 3 đĩa từ cọc A sang cọc C, mỗi lần một đĩa, không bao giờ đặt đĩa lớn lên trên đĩa nhỏ.',
    );
    next(1);
    expect(narration()).toBe(
      'Gọi hanoi(3, A, C, B). Tin vào lời gọi nhỏ hơn: trước hết cất 2 đĩa trên cùng sang B.',
    );
    next(3);
    expect(narration()).toBe(
      'Chuyển đĩa 1 từ A sang C (bước chuyển 1). hanoi(1, A, C, B) đã xong.',
    );
    next(1);
    expect(narration()).toBe(
      'Đĩa nhỏ hơn đã được cất ở C, nên chuyển đĩa 2 từ A sang B (bước chuyển 2). Giờ đưa nó trở lại lên trên.',
    );
    expect(boardLabel()).toBe(
      'Cọc A: các đĩa 3, từ dưới lên. Cọc B: các đĩa 2, từ dưới lên. Cọc C: các đĩa 1, từ dưới lên.',
    );
    expect(byTest('depth')).toBe('2');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Đã giải: 3 đĩa trong 7 bước chuyển, đúng bằng 2³ − 1, ít nhất có thể.',
    );
    expect(byTest('moves')).toBe('7/7');
    expect(boardLabel()).toBe('Cọc A: trống. Cọc B: trống. Cọc C: các đĩa 3, 2, 1, từ dưới lên.');
  });

  it('refuses a bad disk count and keeps the last valid one', () => {
    render();
    commit(field('input[name="disks"]'), '9');
    expect(narration()).toBe(m.disksError(6));
    expect(field('input[name="disks"]').value).toBe('3');
    commit(field('input[name="disks"]'), '4');
    click(button('Đến bước cuối'));
    expect(byTest('moves')).toBe('15/15');
    expect(byTest('calls')).toBe('15');
  });

  it('lists every subset, leaving each item out before taking it', () => {
    render();
    click(field('input[name="problem"][value="subsets"]'));
    next(4);
    expect(narration()).toBe('i = n, mọi phần tử đã được quyết định: in ra {}, tập con thứ 1/8.');
    next(1);
    expect(narration()).toBe(
      'Quay lại subsets(2, {}): đã liệt kê xong mọi tập con không có c. Giờ lấy c.',
    );
    click(button('Đến bước cuối'));
    expect(byTest('outputs')).toBe('8/8');
    expect(byTest('calls')).toBe('15');
    expect(document.querySelectorAll('svg[role="img"] circle')).toHaveLength(15);
    expect(text()).toContain('{b, c}');
  });

  it('refuses bad items and keeps the last valid ones', () => {
    render();
    click(field('input[name="problem"][value="subsets"]'));
    commit(field('input[name="items"]'), 'a a');
    expect(narration()).toBe(m.itemErrors.duplicate);
    expect(field('input[name="items"]').value).toBe('a, b, c');
    commit(field('input[name="items"]'), 'xy');
    click(button('Đến bước cuối'));
    expect(byTest('outputs')).toBe('4/4');
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
    answer.value = '32';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
