// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/doubly-circular-lists/copy.vi.js';
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
  document.querySelector('svg[role="group"]')?.getAttribute('aria-label') ?? '';
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

describe('doubly and circular linked lists lesson', () => {
  it('opens on a removal and shows both pointer updates', () => {
    render();
    expect(narration()).toContain('Gỡ 20. Ta đang cầm sẵn nút này');
    next(1);
    expect(narration()).toBe('10.next = 30: đi xuôi giờ bỏ qua 20.');
    expect(byTest('writes')).toBe('1');
    expect(link('0-next')?.getAttribute('class')).toContain('stroke-teal-700');
    next(1);
    expect(narration()).toBe('30.prev = 10: đi ngược cũng bỏ qua 20.');
    expect(link('2-prev')?.getAttribute('class')).toContain('stroke-teal-700');
    next(1);
    expect(narration()).toBe('20 được giải phóng sau 2 lần ghi con trỏ. Danh sách có 3 nút.');
    click(button('Đến bước cuối'));
    expect(listLabel()).toBe(
      'Linked list đôi, vòng: S ⇄ 10 ⇄ 30 ⇄ 40 ⇄ quay về S. Đi ngược: 40, 30, 10.',
    );
  });

  it('removes a node picked in the drawing', () => {
    render();
    click(node(2));
    expect(byTest('selected')).toBe('30');
    click(buttonByText('Gỡ nút đã chọn'));
    expect(narration()).toContain('Gỡ 30.');
    click(button('Đến bước cuối'));
    expect(listLabel()).toContain('S ⇄ 10 ⇄ 40 ⇄ quay về S');
    expect(byTest('selected')).toBe('chưa chọn');
  });

  it('picks a node with the arrow keys and Enter', () => {
    render();
    const first = /** @type {SVGGElement} */ (document.querySelector('g[data-index="0"]'));
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    const second = /** @type {SVGGElement} */ (document.activeElement);
    expect(second.getAttribute('data-index')).toBe('1');
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(byTest('selected')).toBe('10');
  });

  it('refuses to remove the sentinel or nothing at all', () => {
    render();
    click(buttonByText('Gỡ nút đã chọn'));
    expect(narration()).toBe(m.pickFirst);
    click(node(-2));
    expect(narration()).toBe(m.sentinelPick);
  });

  it('counts special cases only in the head and tail design', () => {
    render();
    click(button('Đến bước cuối'));
    expect(byTest('special')).toBe('0');
    commit(
      /** @type {HTMLInputElement} */ (document.querySelectorAll('input[name="mode"]')[1]),
      'plain',
    );
    click(button('Đến bước cuối'));
    expect(byTest('special')).toBe('1');
    expect(listLabel()).toBe('Linked list đôi: null ← 10 ⇄ 30 ⇄ 40 → null. Đi ngược: 40, 30, 10.');
    click(node(0));
    click(buttonByText('Gỡ nút đã chọn'));
    next(1);
    expect(narration()).toBe(
      '10 không có nút nào đứng trước, nên head dời sang 30. Một trường hợp đặc biệt.',
    );
    expect(byTest('special')).toBe('2');
  });

  it('inserts at the front after the sentinel', () => {
    render();
    commit(input('value'), '5');
    click(buttonByText('Thêm vào đầu'));
    expect(narration()).toBe('Tạo một nút cho 5 với prev = S và next = 10. Chưa có gì trỏ tới nó.');
    click(button('Đến bước cuối'));
    expect(listLabel()).toContain('S ⇄ 5 ⇄ 10 ⇄ 30 ⇄ 40 ⇄ quay về S');
  });

  it('inserts at the back when Enter submits the form', () => {
    render();
    commit(input('value'), '50');
    const form = /** @type {HTMLFormElement} */ (input('value').closest('form'));
    form.requestSubmit();
    flushSync();
    click(button('Đến bước cuối'));
    expect(listLabel()).toContain('40 ⇄ 50 ⇄ quay về S');
    expect(buttonByText('Thêm vào đầu').type).toBe('button');
  });

  it('keeps the last valid value when the field is emptied or out of range', () => {
    render();
    commit(input('value'), '');
    expect(input('value').value).toBe('25');
    commit(input('value'), '120');
    expect(input('value').value).toBe('25');
  });

  it('empties down to the sentinel on reset and refills from a preset', () => {
    render();
    click(buttonByText('Xoá hết'));
    expect(listLabel()).toContain('chỉ có nút cầm canh S');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'front');
    expect(listLabel()).toContain('S ⇄ 40 ⇄ 30 ⇄ 20 ⇄ 10 ⇄ quay về S');
    click(buttonByText('Hoàn tác'));
    expect(listLabel()).toContain('S ⇄ 30 ⇄ 20 ⇄ 10 ⇄ quay về S');
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
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
