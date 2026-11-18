// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/bipartite-cycles/copy.vi.js';

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

/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
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
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));

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

describe('bipartite and cycles lesson', () => {
  it('two-colours the odd cycle until C and D clash', () => {
    render();
    expect(text()).toContain('Chưa đỉnh nào có màu.');
    click(button('Bước tiếp'));
    expect(text()).toContain('A chưa có màu: tô màu 1 và bắt đầu một lần BFS từ đỉnh này.');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('B chưa có màu, nên nhận màu còn lại, màu 2.');
    expect(vertex(1).getAttribute('aria-label')).toBe('Đỉnh B, phía 2');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'C và D cùng có màu 1, nhưng có một cạnh nối chúng. Chu trình lẻ A, B, C, D, E: đồ thị không phải đồ thị hai phía.',
    );
    expect(statValue(m.stats.result)).toBe('chu trình lẻ dài 5');
    expect(vertex(4).getAttribute('aria-label')).toContain('trên chu trình');
    expect(vertex(6).getAttribute('aria-label')).toBe('Đỉnh G');
  });

  it('colours the even cycle into two sides', () => {
    render();
    click(buttonByText(m.presets.even));
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đồ thị hai phía. Phía 1: A, C, E. Phía 2: B, D, F.');
    expect(statValue(m.stats.checks)).toBe('14');
    expect(statValue(m.stats.sides)).toBe('3 | 3');
  });

  it('the diamond has an undirected cycle but no directed one', () => {
    render();
    click(buttonByText(m.presets.diamond));
    radio('undirected');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Chu trình A, B, D, C – A.');
    radio('directed');
    click(button('Đến bước cuối'));
    expect(text()).toContain('đồ thị có hướng này không có chu trình, nên nó là một DAG.');
    expect(statValue(m.stats.result)).toBe('không có chu trình');
    const next = button('Bước tiếp');
    click(button('Về bước đầu'));
    for (let i = 0; i < 40 && !text().includes('đã hoàn tất, nên mọi đường đi'); i++) click(next);
    expect(text()).toContain('Cạnh C → D: D đã hoàn tất');
  });

  it('skips the parent edge in the undirected check of a tree', () => {
    render();
    click(buttonByText(m.presets.tree));
    radio('undirected');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'B – A là cạnh ta vừa đi theo để đến đây, không phải chu trình. Bỏ qua.',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('đồ thị là một rừng');
  });

  it('finds the directed cycle of the odd preset with a back edge', () => {
    render();
    radio('directed');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Chu trình A, B, C, D, E → A.');
    click(button('Bước trước'));
    expect(text()).toContain('Cạnh E → A dẫn tới A, đỉnh vẫn đang thăm: đây là cạnh ngược.');
  });

  it('deleting an edge of the odd cycle makes the graph bipartite', () => {
    render();
    radio('remove');
    const edge = /** @type {Element} */ (
      document.querySelector('[aria-label="Xoá cạnh giữa C và D"]')
    );
    click(edge);
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.result)).toBe('hai phía');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('tô màu 1');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '3');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
