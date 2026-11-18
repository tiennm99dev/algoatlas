// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/edmonds-karp-dinic/copy.vi.js';

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
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
/** @param {string} name */
const capacityField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.editor.capacityAria(name)}"]`)
  );
/** Titles of the board's arrows. */
const arcTitles = () =>
  [...document.querySelectorAll('[data-arc] > title')].map((el) => el.textContent ?? '');

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

describe('Edmonds-Karp and Dinic lesson', () => {
  it('runs Edmonds-Karp with one BFS per augmenting path', () => {
    render();
    expect(text()).toContain('Mỗi vòng chạy BFS từ S');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'BFS đến được T sau 3 cung, theo S → A → C → T. Cổ chai của đường là b = 12.',
    );
    expect(arcTitles()).toContain('Cung S → A: còn trống 16, đường đi thêm luồng ở đây');
    click(button('Bước tiếp'));
    expect(statValue(m.stats.value)).toBe('12');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Xong: 3 đường tăng luồng và 4 lần BFS cho luồng cực đại 23 từ S đến T.',
    );
    expect(statValue(m.stats.searches.ek)).toBe('4');
    expect(statValue(m.stats.checks)).toBe('66');
  });

  it('switches to Dinic: levels, dead ends and blocking flows', () => {
    render();
    radio('dinic');
    expect(text()).toContain('Mỗi pha chạy BFS một lần');
    click(button('Bước tiếp'));
    expect(text()).toContain('Pha 1: BFS đặt T ở tầng 3.');
    expect(arcTitles()).toContain('Cung B → A: còn trống 4, ngoài đồ thị phân tầng');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'DFS đến được A, nhưng không cung nào của đồ thị phân tầng đi ra từ A còn trống',
    );
    expect(document.querySelector('[data-vertex="1"] > title')?.textContent).toBe(
      'Đỉnh A, tầng 1, ngõ cụt trong pha này',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Xong: 3 đường tăng luồng và 3 lần BFS cho luồng cực đại 23 từ S đến T.',
    );
    expect(statValue(m.stats.searches.dinic)).toBe('3');
  });

  it('needs one phase on the layered network and shows the flow view', () => {
    render();
    commit(select('preset'), 'layers');
    radio('dinic');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.searches.dinic)).toBe('2');
    expect(statValue(m.stats.paths)).toBe('4');
    radio('flow');
    expect(arcTitles()).toContain('Cạnh C → E: luồng 3/4, đang có luồng');
    radio('ek');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.searches.ek)).toBe('5');
  });

  it('reruns on a new capacity, refuses a bad one and a bad sink, and resets', () => {
    render();
    commit(select('preset'), 'zigzag');
    commit(capacityField('A → T'), '5');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.value)).toBe('25');
    commit(capacityField('A → T'), '0');
    expect(text()).toContain(m.badCapacity(20));
    expect(capacityField('A → T').value).toBe('5');
    commit(select('sink'), '0');
    expect(text()).toContain(m.sameEnds);
    click(buttonByText(m.resetGraph));
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.value)).toBe('40');
    click(button('Về bước đầu'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('theo S → A → T');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
