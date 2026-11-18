// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/dijkstra-general/copy.vi.js';

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
const sourceSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="source"]'));
/** @param {string} value */
function radio(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
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

describe('Dijkstra on general graphs lesson', () => {
  it('runs from A, skips stale entries and ends with the final distances', () => {
    render();
    expect(text()).toContain('Đặt dist[A] = 0 và mọi nhãn khác là ∞. Đẩy (0, A) vào heap.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Lấy (0, A) ra, mục nhỏ nhất, và nó khớp với dist[A]. Chốt A');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Cạnh A — B (trọng số 4): 0 + 4 = 4 < ∞. Giảm dist[B] và đẩy (4, B) vào.',
    );
    for (let i = 0; i < 4; i++) click(button('Bước tiếp'));
    expect(text()).toContain(
      'Cạnh C — B (trọng số 2): 1 + 2 = 3 < 4. Giảm dist[B] và đẩy (3, B) vào; mục cũ (4, B) vẫn nằm trong heap, giờ thành bản cũ.',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Heap đã rỗng. Đã chốt 6 đỉnh với 10 lần đẩy vào và 10 lần lấy ra, trong đó 4 lần là bản cũ.',
    );
    expect(statValue(m.stats.stale)).toBe('4');
    expect(statValue(m.stats.relaxations)).toBe('18');
    expect(vertex(5).getAttribute('aria-label')).toBe('Đỉnh F, d = 13, đã chốt');
  });

  it('shows a stale pop in the narration and the heap', () => {
    render();
    let guard = 0;
    while (!text().includes('mục này là bản cũ') && guard++ < 40) click(button('Bước tiếp'));
    expect(text()).toContain('Lấy (4, B) ra, nhưng dist[B] đã là 3');
  });

  it('reruns when the source or a weight changes, and rejects a bad weight', () => {
    render();
    commit(sourceSelect(), '5');
    click(button('Đến bước cuối'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Đỉnh A, d = 13, đã chốt');
    commit(weightField('A — C'), '5');
    click(button('Đến bước cuối'));
    expect(vertex(0).getAttribute('aria-label')).toBe('Đỉnh A, d = 14, đã chốt');
    commit(weightField('A — C'), 'x');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('A — C').value).toBe('5');
    click(buttonByText(m.resetGraph));
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.stale)).toBe('4');
  });

  it('rebuilds when an edge is drawn on the canvas', () => {
    render();
    radio('connect');
    click(vertex(0));
    click(vertex(5));
    click(button('Đến bước cuối'));
    expect(vertex(5).getAttribute('aria-label')).toBe('Đỉnh F, d = 1, đã chốt');
    expect(weightField('A — F').value).toBe('1');
  });

  it('steps with the keyboard shortcut', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Chốt A');
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
