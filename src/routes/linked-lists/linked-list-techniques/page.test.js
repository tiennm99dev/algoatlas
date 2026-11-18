// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/linked-list-techniques/copy.vi.js';
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
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const listLabel = () =>
  document.querySelector('[data-node]')?.closest('svg')?.getAttribute('aria-label') ?? '';
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

/** @param {number} id */
const node = (id) => /** @type {SVGGElement} */ (document.querySelector(`g[data-node="${id}"]`));
/** @param {string} key */
const link = (key) => document.querySelector(`path[data-link="${key}"]`);

describe('linked list techniques lesson', () => {
  it('races slow and fast until they meet, then finds the cycle start', () => {
    render();
    expect(narration()).toContain('slow và fast cùng bắt đầu ở nút đầu, 3.');
    next(6);
    expect(narration()).toContain('slow và fast gặp nhau ở 6 sau 5 lượt');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Chu trình bắt đầu ở #2 (5), tìm được sau 19 lần dời con trỏ, chỉ dùng thêm hai con trỏ.',
    );
    expect(byTest('steps')).toBe('7');
    expect(byTest('mu')).toBe('2');
    expect(byTest('lambda')).toBe('5');
  });

  it('stops when fast runs off a list without a cycle', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select[name="cycle"]')), '-1');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Không có chu trình, biết được sau 9 lần dời con trỏ, chỉ dùng thêm hai con trỏ.',
    );
    click(button('Bước trước'));
    expect(narration()).toContain('fast tới cuối danh sách sau 3 lượt');
  });

  it('points the tail at a node clicked in the drawing', () => {
    render();
    click(node(0));
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Chu trình bắt đầu ở #0 (3)');
    expect(byTest('mu')).toBe('0');
  });

  it('points the tail at a node chosen with the keyboard', () => {
    render();
    const g = /** @type {SVGGElement} */ (document.querySelector('g[data-index="6"]'));
    g.focus();
    g.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Chu trình bắt đầu ở #6 (2)');
    expect(byTest('lambda')).toBe('1');
  });

  it('reverses the list one flipped arrow at a time', () => {
    render();
    commit(
      /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="algo"]')[1]),
      'reverse',
    );
    next(1);
    expect(narration()).toBe('Lưu next = curr.next (8) trước khi mũi tên đi ra từ 3 bị ghi đè.');
    next(1);
    expect(narration()).toBe('Lật mũi tên: 3.next = prev (null). Một lần ghi, không tạo nút mới.');
    expect(link('0-next')).toBeNull();
    next(2);
    next(1);
    expect(link('1-next')?.getAttribute('class')).toContain('stroke-teal-700');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'head = prev = 2. Danh sách đã được đảo ngược sau 7 lần lật mũi tên, chỉ dùng thêm ba con trỏ.',
    );
    expect(listLabel()).toBe(
      'Phần đã đảo, tính từ prev: 2 → 6 → 9 → 1 → 5 → 8 → 3 → null. Phần còn lại, tính từ curr: null.',
    );
  });

  it('refuses bad values and keeps the last valid list', () => {
    render();
    commit(input('values'), 'a, b');
    expect(narration()).toBe(m.valueErrors.format);
    expect(input('values').value).toBe('3, 8, 5, 1, 9, 6, 2');
    commit(input('values'), '1 2 3 4 5 6 7 8 9 10 11');
    expect(narration()).toBe(m.valueErrors.count);
  });

  it('keeps the refusal on screen when Enter submits a bad list', () => {
    render();
    commit(input('values'), 'a, b');
    input('values').form?.requestSubmit();
    flushSync();
    expect(narration()).toBe(m.valueErrors.format);
    expect(input('values').value).toBe('3, 8, 5, 1, 9, 6, 2');
  });

  it('keeps the cycle inside a shorter list', () => {
    render();
    commit(input('values'), '4, 7');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Chu trình bắt đầu ở #1 (7)');
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
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
