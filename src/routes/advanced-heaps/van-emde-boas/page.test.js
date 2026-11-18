// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/van-emde-boas/copy.vi.js';

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
const gridLabel = () =>
  document.querySelector('svg[aria-label^="Vũ trụ gồm"]')?.getAttribute('aria-label') ?? '';
const split = () => document.querySelector('[data-testid="split"]')?.textContent ?? '';
function submit() {
  document
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('van Emde Boas trees lesson', () => {
  it('starts on u = 16 and runs the textbook log to the end', () => {
    render();
    expect(text()).toContain('Cây van Emde Boas trên u = 16: 4 cụm, mỗi cụm 4 khoá');
    click(button('Bước tiếp'));
    expect(text()).toContain('insert(V, 2) trên kích thước 16: high(2) = 0, low(2) = 2.');
    expect(split()).toBe(m.split(2, 16, 0, 2));
    click(button('Đến bước cuối'));
    expect(gridLabel()).toContain('đang lưu: 2, 3, 4, 5, 7, 14, 15.');
    expect(text()).toMatch(/Phần tử kế tiếp gần nhất\s*14/);
  });

  it('traces a typed successor query level by level', () => {
    render();
    commit(valueInput(), '8');
    click(buttonByText(m.ops.successor));
    expect(text()).toContain('successor(V, 8) trên kích thước 16: high(8) = 2, low(8) = 0.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Cụm 2 không còn gì sau 0: hỏi bản tóm tắt');
    click(button('Bước tiếp'));
    expect(text()).toContain('successor(V.S, 2) trên kích thước 4');
    expect(text()).toMatch(/Các lời gọi đang mở \(ngoài cùng trước\)\s*V\s*V\.S\s/);
    click(button('Đến bước cuối'));
    expect(text()).toMatch(/Phần tử kế tiếp gần nhất\s*14/);
  });

  it('inserts with Enter and deletes a key', () => {
    render();
    commit(valueInput(), '9');
    submit();
    expect(text()).toContain('insert(V, 9) trên kích thước 16');
    click(button('Đến bước cuối'));
    expect(gridLabel()).toContain('đang lưu: 2, 3, 4, 5, 7, 9, 14, 15.');
    click(buttonByText(m.ops.delete));
    expect(text()).toContain('delete(V, 9) trên kích thước 16');
    click(button('Đến bước cuối'));
    expect(gridLabel()).toContain('đang lưu: 2, 3, 4, 5, 7, 14, 15.');
  });

  it('refuses duplicates, missing keys and keys outside the universe', () => {
    render();
    commit(valueInput(), '7');
    submit();
    expect(text()).toContain(m.presentError(7));
    commit(valueInput(), '8');
    click(buttonByText(m.ops.delete));
    expect(text()).toContain(m.absentError(8));
    commit(valueInput(), '16');
    expect(valueInput().value).toBe('8');
    expect(text()).toContain(m.valueError(16));
  });

  it('switches to u = 256 and goes one level deeper', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="256"]')));
    expect(text()).toContain('trên u = 256: 16 cụm, mỗi cụm 16 khoá');
    click(button('Đến bước cuối'));
    expect(gridLabel()).toContain('đang lưu: 9, 40, 43, 117, 200, 203.');
    expect(text()).toMatch(/Phần tử kế tiếp gần nhất\s*200/);
    expect(text()).toMatch(/Số tầng đã tới\s*4/);
    commit(valueInput(), '250');
    submit();
    expect(text()).toContain('insert(V, 250) trên kích thước 256: high(250) = 15, low(250) = 10.');
  });

  it('undoes, resets and loads a preset', () => {
    render();
    click(buttonByText(m.undo));
    click(button('Đến bước cuối'));
    expect(text()).toMatch(/Phần tử kế tiếp gần nhất\s*7/);
    click(buttonByText(m.reset));
    expect(gridLabel()).toContain('đang lưu: không có.');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'deletes');
    click(button('Đến bước cuối'));
    expect(gridLabel()).toContain('đang lưu: 3, 4, 5, 14.');
  });

  it('checks a practice answer with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[1]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const send = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '2';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
