// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/singly-linked-lists/copy.vi.js';
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const listLabel = () => document.querySelector('svg[role="img"]')?.getAttribute('aria-label') ?? '';
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

describe('singly linked lists lesson', () => {
  it('builds the four-node preset by inserting at the head', () => {
    render();
    expect(narration()).toBe('Danh sách rỗng: head là null.');
    click(button('Đến bước cuối'));
    expect(listLabel()).toBe('Linked list đơn, từ đầu: 12 → 7 → 30 → 4 → null.');
    expect(byTest('length')).toBe('4');
  });

  it('inserts at the head in two pointer writes', () => {
    render();
    commit(input('value'), '15');
    click(buttonByText('Thêm vào đầu'));
    expect(narration()).toContain(
      'Tạo một nút cho 15 và cho next của nó trỏ vào nút đầu hiện tại, 12.',
    );
    expect(document.querySelector('[data-link]')).not.toBeNull();
    expect(document.querySelector('[data-pointer="node"]')).not.toBeNull();
    next(1);
    expect(narration()).toContain('Dời head sang nút mới');
    expect(byTest('writes')).toBe('2');
    expect(byTest('steps')).toBe('0');
    click(button('Đến bước cuối'));
    expect(listLabel()).toContain('15 → 12 → 7 → 30 → 4 → null');
  });

  it('walks index by index to read a value', () => {
    render();
    commit(input('index'), '2');
    click(buttonByText('Đọc chỉ số'));
    expect(narration()).toContain('cur bắt đầu ở head, 12');
    next(2);
    expect(byTest('steps')).toBe('2');
    next(1);
    expect(narration()).toContain('Chỉ số 2 chứa 30, tới được sau 2 bước nhảy');
  });

  it('reports an index past the end', () => {
    render();
    commit(input('index'), '6');
    click(buttonByText('Đọc chỉ số'));
    next(5);
    expect(narration()).toContain('Chỉ số 6 vượt quá cuối danh sách');
  });

  it('deletes a middle value by rewiring prev.next', () => {
    render();
    commit(input('value'), '30');
    click(buttonByText('Xoá giá trị'));
    for (let i = 0; i < 6 && !narration().includes('bỏ qua'); i++) next(1);
    expect(narration()).toContain('prev.next bỏ qua 30: nút 7 giờ trỏ tới chỗ 30 từng trỏ.');
    expect(byTest('writes')).toBe('1');
    click(button('Đến bước cuối'));
    expect(listLabel()).toContain('12 → 7 → 4 → null');
  });

  it('deletes the head, and refuses nothing on an empty list', () => {
    render();
    click(buttonByText('Xoá nút đầu'));
    click(button('Đến bước cuối'));
    expect(listLabel()).toContain('7 → 30 → 4 → null');
    click(buttonByText('Xoá hết'));
    click(buttonByText('Xoá nút đầu'));
    expect(narration()).toBe('head là null: không có gì để xoá.');
  });

  it('keeps the last valid value and index when a field is emptied or out of range', () => {
    render();
    commit(input('value'), '45');
    commit(input('value'), '');
    expect(input('value').value).toBe('45');
    commit(input('value'), '150');
    expect(input('value').value).toBe('45');
    commit(input('index'), '12');
    expect(input('index').value).toBe('2');
  });

  it('refuses an insert into a full list and shows it in place of the narration', () => {
    render();
    for (const v of [1, 2, 3, 4, 5, 6, 7]) {
      commit(input('value'), String(v));
      click(buttonByText('Thêm vào đầu'));
    }
    expect(narration()).toBe('Danh sách đã đầy (10 nút). Hãy xoá bớt một nút trước.');
    next(1);
    expect(narration()).not.toContain('đầy');
  });

  it('undoes the last operation and loads a preset', () => {
    render();
    click(buttonByText('Xoá nút đầu'));
    click(buttonByText('Hoàn tác'));
    expect(listLabel()).toContain('12 → 7 → 30 → 4 → null');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'long');
    expect(listLabel()).toContain('5 → 18 → 23 → 41 → 9 → 64 → 37 → 50 → null');
  });

  it('inserts when Enter submits the form', () => {
    render();
    commit(input('value'), '8');
    const form = /** @type {HTMLFormElement} */ (input('value').closest('form'));
    form.requestSubmit();
    flushSync();
    expect(narration()).toContain('Tạo một nút cho 8');
    expect(buttonByText('Xoá nút đầu').type).toBe('button');
    expect(buttonByText('Đọc chỉ số').type).toBe('button');
  });

  it('steps back with the arrow keys from the step controls', () => {
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
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('labels every node in the drawing', () => {
    render();
    click(button('Đến bước cuối'));
    expect(text()).toContain('head');
    expect(document.querySelectorAll('svg[role="img"] title')).toHaveLength(4);
  });
});
