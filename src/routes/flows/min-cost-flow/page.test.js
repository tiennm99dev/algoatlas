// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/min-cost-flow/copy.vi.js';

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
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** @param {string} name */
const select = (name) =>
  /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
/** @param {string} row @param {string} col */
const costField = (row, col) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.costAria(row, col)}"]`)
  );
/** Title of a table cell, by the start of its label. @param {string} start */
const cellTitle = (start) =>
  [...document.querySelectorAll('svg title')]
    .map((el) => el.textContent ?? '')
    .find((l) => l.startsWith(start));

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

describe('Min-cost flow and the assignment problem lesson', () => {
  it('shifts potentials and flips paths to the cheapest assignment', () => {
    render();
    expect(text()).toContain('Mọi thế năng bắt đầu bằng 0');
    click(button('Bước tiếp'));
    expect(text()).toContain('Thêm người A.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Độ dư nhỏ nhất là δ = 2, ở cột 2 (từ hàng A).');
    expect(cellTitle('người A, việc 2:')).toBe('người A, việc 2: 2, độ dư nhỏ nhất');
    click(button('Bước tiếp'));
    expect(text()).toContain('Cộng δ = 2 vào u của hàng A. Các cạnh của cây vẫn bằng 0');
    expect(cellTitle('người A, u:')).toBe('người A, u: 2, thế năng vừa dịch');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Lật đường đi: A → 2. Đã phân công 1/4 hàng, chi phí 2; Σ u + Σ v = 2.',
    );
    expect(cellTitle('người A, việc 2:')).toBe(
      'người A, việc 2: 0, vừa được lật vào phép phân công',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Xong: A → 2, B → 1, C → 3 và D → 4 có chi phí 13, và Σ u + Σ v cũng bằng 13, điều này chứng tỏ không phép phân công nào rẻ hơn. Vét cạn sẽ phải so sánh 24 phép phân công.',
    );
    expect(statValue(m.stats.cost)).toBe('13');
    expect(statValue(m.stats.bound)).toBe('13');
    expect(statValue(m.stats.rows)).toBe('4 / 4');
    expect(cellTitle('v, việc 3:')).toBe('v, việc 3: −3');
    expect(cellTitle('người C, việc 3:')).toBe('người C, việc 3: 0, đã phân công');
  });

  it('solves the greedy trap and the five by five matrix', () => {
    render();
    commit(select('preset'), 'trap');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.cost)).toBe('8');
    commit(select('preset'), 'five');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Vét cạn sẽ phải so sánh 120 phép phân công.');
  });

  it('reruns on a new cost, refuses a bad one, resizes and resets', () => {
    render();
    commit(costField('A', '2'), '20');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.cost)).toBe('18');
    commit(costField('A', '2'), '100');
    expect(text()).toContain(m.badCost(99));
    expect(costField('A', '2').value).toBe('20');
    commit(select('size'), '2');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.cost)).toBe('13');
    commit(select('size'), '3');
    expect(costField('C', '3').value).toBe('10');
    click(buttonByText(m.resetCosts));
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.cost)).toBe('13');
    click(button('Về bước đầu'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Thêm người A.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '14');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '13');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
