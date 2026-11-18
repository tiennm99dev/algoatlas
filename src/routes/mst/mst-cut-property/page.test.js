// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/mst-cut-property/copy.vi.js';

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
/** @param {number} id */
const vertex = (id) => /** @type {Element} */ (document.querySelector(`[data-node="${id}"]`));
/** @param {string} name */
const weightField = (name) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[aria-label="${m.weightAria(name)}"]`)
  );
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}
const testSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="test-edge"]'));

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

describe('Cut property and MST basics lesson', () => {
  it('scans the starting cut and names the lightest crossing edge', () => {
    render();
    expect(text()).toContain('S = {A, B, C}. Ta duyệt mọi cạnh');
    click(button('Bước tiếp'));
    expect(text()).toContain('Cạnh A — B (trọng số 3): cả hai đầu đều trong S');
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(text()).toContain(
      'Cạnh B — D (trọng số 5) đi qua lát cắt. Đây là cạnh đầu tiên đi qua lát cắt',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cạnh nhẹ nhất đi qua lát cắt là B — D (trọng số 5).');
    expect(statValue(m.stats.crossing)).toBe('3');
    expect(statValue(m.stats.mst)).toBe('18');
    expect(vertex(0).getAttribute('aria-label')).toBe('Đỉnh A, phía S');
  });

  it('moves a vertex across the cut by click and by keyboard', () => {
    render();
    click(vertex(3));
    expect(vertex(3).getAttribute('aria-label')).toBe('Đỉnh D, phía S');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Cạnh nhẹ nhất đi qua lát cắt là D — E (trọng số 7).');
    press(vertex(1), 'Enter');
    expect(vertex(1).getAttribute('aria-label')).toBe('Đỉnh B, phía còn lại');
    expect(text()).toContain('S = {A, C, D}.');
  });

  it('tests an edge against the cycle property', () => {
    render();
    radio('cycle');
    expect(text()).toContain('Kiểm tra cạnh C — D (trọng số 6). Ta tìm từ C');
    click(button('Đến bước cuối'));
    expect(text()).toContain('nặng hơn hẳn mọi cạnh khác, trên chu trình C → B → D → C');
    commit(testSelect(), '6');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Phép tìm kiếm dừng mà không tới được E. Các đỉnh đã tới {A, B, C, D} tạo thành một lát cắt',
    );
    commit(weightField('C — E'), '6');
    click(button('Đến bước cuối'));
    expect(text()).toContain('không cây khung nhỏ nhất nào chứa D — E');
  });

  it('rejects a bad weight and resets the graph', () => {
    render();
    commit(weightField('A — B'), '0');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('A — B').value).toBe('3');
    commit(weightField('A — B'), '10');
    expect(statValue(m.stats.mst)).toBe('19');
    click(buttonByText(m.resetGraph));
    expect(statValue(m.stats.mst)).toBe('18');
  });

  it('overlays a minimum spanning tree in place of the step colours', () => {
    render();
    expect(text()).toContain(m.legend.best);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[name="show-mst"]')));
    expect(text()).toContain(m.legend.mst);
    expect(text()).not.toContain(m.legend.best);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Cạnh A — B (trọng số 3)');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '6');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
