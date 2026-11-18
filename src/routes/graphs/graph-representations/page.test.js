// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/graph-representations/copy.vi.js';

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
/** @param {number} r @param {number} c */
const matrixCell = (r, c) =>
  /** @type {Element} */ (document.querySelector(`[data-cell="${r}-${c}"]`));
const listRows = () =>
  [...document.querySelectorAll('ol.font-mono > li')].map((li) =>
    li.textContent?.replace(/\s+/g, ' ').trim(),
  );

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

describe('graph representations lesson', () => {
  it('starts empty and fills both panels by the last step', () => {
    render();
    expect(text()).toContain('Bắt đầu với một ma trận 5 × 5 toàn số 0 và 5 danh sách rỗng.');
    expect(statValue(m.stats.matrixCells)).toBe('25');
    click(button('Bước tiếp'));
    expect(text()).toContain('Cạnh A – B: ghi matrix[A][B] = 1 và thêm B vào danh sách của A.');
    click(button('Bước tiếp'));
    expect(text()).toContain('ta lưu cả chiều ngược lại: matrix[B][A] = 1');
    click(button('Đến bước cuối'));
    expect(text()).toContain('mỗi cạnh trong 6 cạnh xuất hiện hai lần');
    expect(statValue(m.stats.listEntries)).toBe('12');
    expect(listRows()[0]).toBe('A → B, C');
    expect(matrixCell(1, 0).getAttribute('aria-label')).toBe('Hàng B, cột A: 1');
  });

  it('switching to directed stores each edge once and breaks the symmetry', () => {
    render();
    radio('directed');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.listEntries)).toBe('6');
    expect(matrixCell(0, 1).getAttribute('aria-label')).toBe('Hàng A, cột B: 1');
    expect(matrixCell(1, 0).getAttribute('aria-label')).toBe('Hàng B, cột A: 0');
  });

  it('weighted mode writes the edge weights', () => {
    render();
    radio('weighted');
    click(button('Đến bước cuối'));
    expect(matrixCell(1, 3).getAttribute('aria-label')).toBe('Hàng B, cột D: 10');
    expect(listRows()[1]).toBe('B → A·4, C·5, D·10');
  });

  it('a vertex click compares what each representation reads', () => {
    render();
    click(vertex(3));
    expect(text()).toContain(
      'Các đỉnh kề D: B, E. Ma trận phải quét cả 5 ô của hàng D; danh sách chỉ đọc 2 mục của nó.',
    );
    expect(matrixCell(3, 0).getAttribute('aria-label')).toContain('hàng đang chọn');
    // The answer describes the finished panels, so the player shows them too.
    expect(statValue(m.stats.listEntries)).toBe('12');
    expect(listRows()[3]).toBe('D → B, E (đang chọn)');
  });

  it('a vertex press whose click lands on the canvas still selects the vertex', () => {
    render();
    const at = { bubbles: true, clientX: 40, clientY: 40 };
    const canvas = /** @type {Element} */ (vertex(1).closest('svg'));
    vertex(1).dispatchEvent(new MouseEvent('pointerdown', at));
    // With pointer capture on the canvas, the browser sends the release and click to the svg.
    canvas.dispatchEvent(new MouseEvent('pointerup', at));
    canvas.dispatchEvent(new MouseEvent('click', at));
    flushSync();
    expect(text()).toContain('Các đỉnh kề B: A, C, D.');
  });

  it('a matrix cell answers an edge test, also from the keyboard', () => {
    render();
    click(matrixCell(0, 3));
    expect(text()).toContain('Có cạnh A → D không? Ma trận trả lời sau một lần đọc: 0, không có.');
    press(matrixCell(0, 3), 'ArrowLeft');
    press(/** @type {Element} */ (document.activeElement), 'Enter');
    expect(text()).toContain('Có cạnh A → C không?');
    expect(text()).toContain('1, có.');
  });

  it('adding a vertex and an edge rebuilds the trace', () => {
    render();
    click(buttonByText('Thêm đỉnh'));
    expect(statValue(m.stats.vertices)).toBe('6');
    expect(statValue(m.stats.matrixCells)).toBe('36');
    radio('connect');
    click(vertex(5));
    click(vertex(0));
    expect(statValue(m.stats.edges)).toBe('7');
    click(button('Đến bước cuối'));
    expect(listRows()[5]).toBe('F → A');
    click(buttonByText(m.resetGraph));
    expect(statValue(m.stats.vertices)).toBe('5');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '6');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '12');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
