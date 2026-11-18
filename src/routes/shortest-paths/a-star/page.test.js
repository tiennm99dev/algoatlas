// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/a-star/copy.vi.js';

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

/** Keyboard activation reports detail 0, which the grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

/** @param {string} value */
const radio = (value) =>
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));

const text = () => document.body.textContent ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** The comparison row of one heuristic, as [expanded, path]. @param {string} name */
function compareRow(name) {
  const row = [...document.querySelectorAll('tbody tr')].find(
    (r) => r.querySelector('th')?.textContent?.trim() === name,
  );
  return [...(row?.querySelectorAll('td') ?? [])].map((td) => td.textContent?.trim());
}

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

describe('A* lesson', () => {
  it('runs Manhattan A* to a shortest path and compares the heuristics', () => {
    render();
    expect(text()).toContain('Đưa điểm xuất phát vào tập mở với g = 0 và f = h(start) = 11.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Lấy (4,2) ra với f = g + h = 0 + 11 = 11');
    click(button('Bước tiếp'));
    expect(text()).toContain('g = 0 + 1 = 1 và h = 12, nên f = 13. Đẩy nó vào.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã đến đích sau khi mở rộng 36 ô. Đường đi có 15 bước');
    expect(statValue(m.stats.expanded)).toBe('36');
    expect(statValue(m.stats.path)).toBe('15');
    expect(compareRow(m.heuristics.zero)).toEqual(['118', '15']);
    expect(compareRow(m.heuristics.manhattan)).toEqual(['36', '15']);
    expect(compareRow(m.heuristics.triple)).toEqual(['39', '21']);
  });

  it('switches the heuristic and reruns', () => {
    render();
    radio('zero');
    expect(text()).toContain('A* chính là thuật toán Dijkstra');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.expanded)).toBe('118');
    radio('triple');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đường đi có 21 bước, nhưng 3 × Manhattan có thể đoán quá');
  });

  it('switches the cell numbers between g, h and f', () => {
    render();
    radio('h');
    expect(button('Hàng 0, cột 0, h 17')).toBeTruthy();
    radio('f');
    click(button('Đến bước cuối'));
    expect(button('Hàng 4, cột 2, Điểm xuất phát, f 11')).toBeTruthy();
    radio('g');
    expect(button('Hàng 4, cột 13, Đích, g 15')).toBeTruthy();
  });

  it('edits walls from the keyboard, refuses the start cell, and resets', () => {
    render();
    keyActivate(button('Hàng 4, cột 9, Tường'));
    expect(text()).toContain('Đã bỏ tường ở (4,9).');
    expect(compareRow(m.heuristics.manhattan)).toEqual(['12', '11']);
    keyActivate(button('Hàng 4, cột 2, Điểm xuất phát, f 11'));
    expect(text()).toContain(m.blockedCell);
    radio('goal');
    keyActivate(button('Hàng 0, cột 0'));
    expect(text()).toContain('Đã dời đích đến (0,0).');
    click(buttonByText(m.resetGrid));
    expect(compareRow(m.heuristics.manhattan)).toEqual(['36', '15']);
    expect(button('Hàng 4, cột 13, Đích')).toBeTruthy();
  });

  it('reports a sealed goal and steps with the keyboard', () => {
    render();
    for (const [r, c] of [
      [3, 13],
      [5, 13],
      [4, 12],
      [4, 14],
    ])
      keyActivate(button(`Hàng ${r}, cột ${c}`));
    click(button('Đến bước cuối'));
    expect(text()).toContain('tường đã chặn kín');
    click(button('Về bước đầu'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Lấy (4,2) ra');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '36');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '118');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
