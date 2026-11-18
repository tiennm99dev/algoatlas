// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { binaryHeapTrace, makeHeapOps } from '$lib/algo-engine/binary-heaps.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/binary-heaps/copy.vi.js';

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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
const valueInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="value"]'));
const heapLabel = () =>
  document.querySelector('svg[aria-label*="eap"]')?.getAttribute('aria-label') ?? '';
function submit() {
  document
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('binary heaps lesson', () => {
  it('starts on an empty min-heap and runs the log to the end', () => {
    render();
    expect(text()).toContain('Một min-heap rỗng.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Chèn 42: đặt vào ô trống tiếp theo, ô 0');
    click(button('Đến bước cuối'));
    const last = binaryHeapTrace(makeHeapOps('build')).at(-1);
    expect(heapLabel()).toContain(`Min-heap gồm 8 phần tử, dạng mảng: ${last?.values.join(', ')}.`);
    expect(text()).toContain(`${last?.comparisons} phép so sánh và ${last?.swaps} lần đổi chỗ`);
  });

  it('inserts a typed value and jumps to its first step', () => {
    render();
    commit(valueInput(), '1');
    submit();
    expect(text()).toContain('Chèn 1: đặt vào ô trống tiếp theo, ô 8');
    click(button('Đến bước cuối'));
    expect(heapLabel()).toMatch(/^Min-heap gồm 9 phần tử, dạng mảng: 1, /);
  });

  it('extracts the minimum and lists it as removed', () => {
    render();
    click(buttonByText('Lấy ra min'));
    expect(text()).toContain('Lấy gốc 8, giá trị nhỏ nhất.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã lấy ra, theo thứ tự');
    expect(heapLabel()).toMatch(/^Min-heap gồm 7 phần tử, /);
  });

  it('switches to a max-heap on the same log', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="max"]')));
    expect(buttonByText('Lấy ra max')).toBeTruthy();
    expect(heapLabel()).toContain(
      `Max-heap gồm 8 phần tử, dạng mảng: ${binaryHeapTrace(makeHeapOps('build'), 'max').at(-1)?.values.join(', ')}.`,
    );
    expect(text()).toContain('Đỉnh: giá trị lớn nhất');
  });

  it('undoes, resets and loads a preset', () => {
    render();
    click(buttonByText(m.undo));
    expect(heapLabel()).toMatch(/^Min-heap gồm 9 phần tử, dạng mảng: 5, /);
    click(buttonByText(m.reset));
    expect(text()).toContain('Một min-heap rỗng.');
    click(buttonByText('Lấy ra min'));
    expect(text()).toContain(m.emptyError);
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'drain');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Heap đang rỗng.');
  });

  it('refuses a bad value and keeps the last valid one', () => {
    render();
    commit(valueInput(), '150');
    expect(valueInput().value).toBe('12');
    valueInput().value = '';
    valueInput().dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(text()).toContain(m.valueError);
  });

  it('refuses inserts into a full heap', () => {
    render();
    for (let i = 0; i < 8; i++) {
      commit(valueInput(), String(i));
      submit();
    }
    expect(text()).toContain(m.full);
  });

  it('shows a slot’s parent and children from the keyboard', () => {
    render();
    click(button('Đến bước cuối'));
    const cells = [...document.querySelectorAll('[role="button"]')];
    const slot3 = /** @type {HTMLElement} */ (
      cells.find((c) => c.getAttribute('aria-label')?.startsWith('Ô 3:'))
    );
    slot3.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('Ô 3: cha là ⌊(3 − 1)/2⌋ = 1; các con là 2·3 + 1 = 7.');
  });

  it('checks a practice answer with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const send = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
