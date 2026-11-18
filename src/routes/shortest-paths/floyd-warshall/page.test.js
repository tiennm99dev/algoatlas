// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/floyd-warshall/copy.vi.js';

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

/** @param {Element} el */
function click(el) {
  /** @type {HTMLElement} */ (el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {Element} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {string} from @param {string} to */
const cell = (from, to) =>
  /** @type {Element} */ (
    [...document.querySelectorAll('[role="button"]')].find((el) =>
      (el.getAttribute('aria-label') ?? '').startsWith(`Từ ${from} đến ${to}:`),
    )
  );

describe('Floyd-Warshall lesson', () => {
  it('starts from direct edges and ends with all shortest distances', () => {
    render();
    expect(text()).toContain('Bắt đầu chỉ với các cạnh trực tiếp');
    expect(cell('D', 'A').getAttribute('aria-label')).toBe('Từ D đến A: ∞, đã chọn');
    click(button('Bước tiếp'));
    expect(text()).toContain('Giai đoạn k = A: giờ đường đi được phép đi qua A.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Xong: 64 phép so sánh');
    expect(cell('D', 'A').getAttribute('aria-label')).toBe('Từ D đến A: 3, đã chọn');
    expect(cell('A', 'B').getAttribute('aria-label')).toBe('Từ A đến B: −1');
    expect(text()).toContain('D → A: D → B → A, trọng số 3.');
  });

  it('jumps phase by phase with Next k and shows an improvement', () => {
    render();
    click(buttonByText(m.nextK));
    click(buttonByText(m.nextK));
    expect(text()).toContain('Giai đoạn k = B: giờ đường đi được phép đi qua A, B.');
    expect(cell('B', 'C').getAttribute('aria-label')).toBe('Từ B đến C: 2, hàng hoặc cột k');
    let guard = 0;
    while (!text().includes('Đi qua B ngắn hơn') && guard++ < 20) click(button('Bước tiếp'));
    expect(text()).toContain('D → B → A: −1 + 4 = 3 < ∞. Đi qua B ngắn hơn');
  });

  it('picks a cell with the pointer and the keyboard', () => {
    render();
    click(button('Đến bước cuối'));
    click(cell('A', 'B'));
    expect(text()).toContain('A → B: A → C → D → B, trọng số −1.');
    press(cell('A', 'B'), 'ArrowRight');
    press(cell('A', 'C'), 'Enter');
    expect(text()).toContain('A → C: A → C, trọng số −2.');
  });

  it('flags a negative cycle on the diagonal', () => {
    render();
    commit(presetSelect(), 'cycle');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đường chéo âm ở A, B, C, D');
    expect(text()).toContain('đường đi lọt vào một chu trình âm');
  });

  it('reruns on a typed weight, rejects a bad one, and steps with the keyboard', () => {
    render();
    commit(weightField('B → A'), '1');
    click(button('Đến bước cuối'));
    expect(cell('D', 'A').getAttribute('aria-label')).toBe('Từ D đến A: 0, đã chọn');
    commit(weightField('B → A'), 'abc');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('B → A').value).toBe('1');
    click(buttonByText(m.resetGraph));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Giai đoạn k = A');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
