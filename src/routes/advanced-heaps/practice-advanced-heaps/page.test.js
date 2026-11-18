// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-advanced-heaps/copy.vi.js';

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
/** @param {string} name @param {string} value */
const radio = (name, value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="${name}"][value="${value}"]`)
  );
const race = () =>
  document.querySelector('ul[aria-label^="Số bước đến giờ"]')?.getAttribute('aria-label');
/** @param {string} q */
const row = (q) => document.querySelector(`li[data-queue="${q}"]`)?.textContent ?? '';

/** @param {number} i */
function question(i) {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  return /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[i]);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const field = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('practice: advanced heaps lesson', () => {
  it('races the three queues on the default Dijkstra run', () => {
    render();
    expect(text()).toContain('Thuật toán Dijkstra xuất phát từ đỉnh 0 trên 12 đỉnh và 40 cạnh.');
    click(button('Bước tiếp'));
    expect(text()).toContain('insert(0, 0): đỉnh nguồn vào hàng đợi.');
    click(button('Bước tiếp'));
    expect(text()).toContain('extractMin() trả về đỉnh 0');
    click(button('Đến bước cuối'));
    expect(race()).toBe('Số bước đến giờ: nhị phân 80, Fibonacci 60, vEB 145.');
    expect(row('fibonacci')).toContain(m.leader);
    expect(text()).toContain('Ít bước nhất: heap Fibonacci.');
  });

  it('rebuilds the run when the graph changes', () => {
    render();
    commit(input('vertices'), '4');
    expect(input('edges').value).toBe('12');
    click(button('Đến bước cuối'));
    expect(text()).toMatch(/Số lần chèn\s*4/);
    click(buttonByText(m.newGraph));
    expect(text()).toContain('Thuật toán Dijkstra xuất phát từ đỉnh 0 trên 4 đỉnh và 12 cạnh.');
    click(buttonByText(m.resetSettings));
    click(button('Đến bước cuối'));
    expect(race()).toBe('Số bước đến giờ: nhị phân 80, Fibonacci 60, vEB 145.');
  });

  it('drops the vEB tree when the keys do not fit in u', () => {
    render();
    click(radio('universe', '4'));
    click(button('Đến bước cuối'));
    expect(row('veb')).toContain(m.noFit);
    expect(text()).toContain('khoá 27 không nhỏ hơn u = 2^4');
  });

  it('runs an operation mix set with sliders', () => {
    render();
    click(radio('mode', 'mix'));
    expect(text()).toContain('Một hàng đợi gồm n = 1024 khoá chạy 10 vòng theo tỉ lệ đã đặt.');
    commit(input('decreases'), '0');
    click(button('Bước tiếp'));
    expect(text()).toContain('Vòng 1: 4 lần chèn. Mỗi lần tốn nhị phân 11, Fibonacci 1, vEB 5.');
    click(button('Đến bước cuối'));
    expect(race()).toBe('Số bước đến giờ: nhị phân 880, Fibonacci 640, vEB 400.');
    expect(row('veb')).toContain(m.leader);
    commit(input('size'), '20');
    click(radio('universe', '16'));
    click(button('Đến bước cuối'));
    expect(row('veb')).toContain(m.noFit);
  });

  it('checks practice answers that need the widget', () => {
    render();
    // Both questions are found before a hint adds list items of its own.
    const q = question(0);
    const fib = question(1);
    answer(q, '4');
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Đúng rồi!');
    answer(fib, '60');
    expect(fib.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
