// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/priority-queue-applications/copy.vi.js';

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

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} prefix */
const svgLabel = (prefix) =>
  document.querySelector(`svg[aria-label^="${prefix}"]`)?.getAttribute('aria-label') ?? '';
const topK = () =>
  click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="top-k"]')));

describe('priority queue applications lesson', () => {
  it('seeds the heap with each list head, then pops the smallest', () => {
    render();
    expect(text()).toContain('Trộn 3 danh sách đã sắp xếp gồm 9 giá trị.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Push 1, phần tử đầu của danh sách A.');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(svgLabel('Heap nhỏ nhất')).toContain('Heap nhỏ nhất dạng mảng: 1, 2, 5');
    click(button('Bước tiếp'));
    expect(text()).toContain('Pop phần tử đầu nhỏ nhất, 1 từ danh sách A');
    expect(svgLabel('Kết quả')).toBe('Kết quả: 1.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Danh sách A đi tiếp: push giá trị tiếp theo của nó, 4.');
  });

  it('ends with the merged output', () => {
    render();
    click(button('Đến bước cuối'));
    expect(svgLabel('Kết quả')).toBe('Kết quả: 1, 2, 3, 4, 5, 6, 7, 8, 9.');
    expect(text()).toContain('Đã trộn 9 giá trị với 18 thao tác trên heap');
    const titles = [...document.querySelectorAll('title')].map((t) => t.textContent);
    expect(titles).toContain('Vị trí 8: 9 từ danh sách A, đã vào kết quả');
    expect(text()).toContain('Heap đang rỗng.');
  });

  it('loads typed lists and refuses unsorted ones', () => {
    render();
    commit(input('lists'), '2, 5 / 1, 3');
    click(button('Đến bước cuối'));
    expect(svgLabel('Kết quả')).toBe('Kết quả: 1, 2, 3, 5.');
    commit(input('lists'), '5, 2 / 1');
    expect(text()).toContain(m.listErrors.unsorted);
    expect(input('lists').value).toBe('2, 5 / 1, 3');
  });

  it('keeps the top k of a stream', () => {
    render();
    topK();
    expect(text()).toContain('Giữ 3 giá trị lớn nhất trong một heap nhỏ nhất cỡ 3.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('gốc 7 của nó là số lớn thứ 3');
    expect(text()).toContain(m.resultTitle);
    expect(svgLabel('Heap nhỏ nhất')).toContain('Heap nhỏ nhất dạng mảng: 7, 8, 9');
  });

  it('changes k and refuses a bad k', () => {
    render();
    topK();
    commit(input('k'), '1');
    click(button('Đến bước cuối'));
    expect(svgLabel('Heap nhỏ nhất')).toContain('Heap nhỏ nhất dạng mảng: 9.');
    commit(input('k'), '9');
    expect(text()).toContain(m.kError);
    expect(input('k').value).toBe('1');
  });

  it('refuses a bad stream and loads new input', () => {
    render();
    topK();
    commit(input('stream'), '5, 500');
    expect(text()).toContain(m.streamErrors.range);
    click(buttonByText(m.newInputButton));
    expect(text()).toContain(m.newInputNotice);
    expect(input('stream').value.split(', ')).toHaveLength(12);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(text()).toContain('Push 1, phần tử đầu của danh sách A.');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
