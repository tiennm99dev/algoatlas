// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/shortest-path-properties/copy.vi.js';

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
const presetSelect = () => /** @type {HTMLSelectElement} */ (document.querySelector('select'));

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

describe('shortest-path properties lesson', () => {
  it('relaxes the edge list once and ends with exact labels', () => {
    render();
    expect(text()).toContain('Bắt đầu: d[S] = 0 và mọi nhãn khác là ∞');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Nới lỏng S → A (trọng số 6): d[S] + 6 = 0 + 6 = 6 < ∞, nên ta giảm d[A] xuống 6 và đặt parent[A] = S.',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('Xong sau 7 lần nới lỏng: mọi nhãn đều là khoảng cách ngắn nhất thật');
    expect(statValue(m.stats.exact)).toBe('5 / 5');
    expect(statValue(m.stats.updates)).toBe('5');
    expect(text()).toContain('S → B → A → C → D: trọng số 2 + 3 + 2 + 1 = 8.');
    expect(vertex(4).getAttribute('aria-label')).toBe('Đỉnh D, d = 8, chính xác');
  });

  it('shows how a bad order leaves labels wrong, and fixes them with more relaxations', () => {
    render();
    commit(presetSelect(), 'reverse');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Nới lỏng B → D (trọng số 9): d[B] là ∞, nên đi qua B chưa giúp được gì.',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('mới có 2/5 nhãn chính xác');
    click(button(m.relaxAria('B → A')));
    expect(text()).toContain('d[B] + 3 = 2 + 3 = 5 < 6, nên ta giảm d[A] xuống 5');
    expect(statValue(m.stats.relaxations)).toBe('8');
    click(buttonByText(m.undo));
    expect(statValue(m.stats.relaxations)).toBe('7');
    click(buttonByText(m.clear));
    expect(statValue(m.stats.relaxations)).toBe('0');
    expect(text()).toContain(m.noPath('D'));
  });

  it('reruns the sequence when a weight changes and rejects a bad weight', () => {
    render();
    commit(weightField('S → B'), '9');
    click(button('Đến bước cuối'));
    expect(text()).toContain('S → A → C → D: trọng số 6 + 2 + 1 = 9.');
    commit(weightField('S → B'), '-3');
    expect(text()).toContain(m.badWeight(99));
    expect(weightField('S → B').value).toBe('9');
    click(buttonByText(m.resetWeights));
    expect(text()).toContain('trọng số 2 + 3 + 2 + 1 = 8');
  });

  it('flags a label that lags behind its tree path', () => {
    render();
    click(buttonByText(m.clear));
    for (const e of ['S → A', 'A → C', 'S → B', 'B → A']) click(button(m.relaxAria(e)));
    click(vertex(3));
    expect(text()).toContain('S → B → A → C: trọng số 2 + 3 + 2 = 7.');
    expect(text()).toContain('Nhãn d[C] = 8 vẫn còn lớn hơn');
  });

  it('picks a vertex with the keyboard and steps with the arrow key', () => {
    render();
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Nới lỏng S → A');
    press(vertex(1), 'Enter');
    expect(text()).toContain(`${m.pathTitle}: A`);
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '8');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '9');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
