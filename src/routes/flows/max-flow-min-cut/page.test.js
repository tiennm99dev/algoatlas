// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/max-flow-min-cut/copy.vi.js';

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

/** @param {number} i */
const vertexTitle = (i) => document.querySelector(`[data-vertex="${i}"] > title`)?.textContent;

describe('Max-flow min-cut lesson', () => {
  it('finds the flow, shades the reachable set and reads off the cut', () => {
    render();
    expect(text()).toContain('Trước hết ta tìm một luồng cực đại từ S đến T');
    click(button('Bước tiếp'));
    expect(text()).toContain('Đã đẩy 12 theo S → A → C → T. Giá trị luồng: 12.');
    for (let i = 0; i < 3; i++) click(button('Bước tiếp'));
    expect(text()).toContain('luồng có giá trị 23 là cực đại.');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Lấy S ra khỏi queue. Các cung còn trống của nó đến được A và B, các đỉnh này vào phía S.',
    );
    expect(vertexTitle(0)).toBe('Đỉnh S, đỉnh phát, vừa lấy ra khỏi queue, s đến được');
    expect(vertexTitle(1)).toBe('Đỉnh A, vừa đến được, s đến được');
    click(button('Bước tiếp'));
    expect(text()).toContain('Lấy A ra khỏi queue. Nó không đến được đỉnh mới nào');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(text()).toContain(
      'S = {S, A, B, D}, còn T gồm các đỉnh còn lại. Các cạnh cắt A → C, D → C và D → T đều bão hoà, và các cạnh từ T về S không mang luồng, nên c(S, T) = 12 + 7 + 4 = 23 = |f|.',
    );
    expect(statValue(m.stats.cut)).toBe('23');
    expect(statValue(m.stats.edges)).toBe('3');
    expect(arcTitles()).toContain('Cạnh A → C: luồng 12/12, cạnh cắt');
    radio('residual');
    expect(arcTitles()).toContain('Cung S → A: còn trống 4');
    expect(arcTitles()).toContain('Cung ngược C → A: huỷ được 12');
  });

  it('lets the learner try their own cut', () => {
    render();
    radio('mine');
    expect(text()).toContain(m.mine.verdict(29, 23));
    click(button(m.mine.aria('A')));
    expect(text()).toContain('S → B (13), A → C (12)');
    expect(text()).toContain(m.mine.verdict(25, 23));
    click(button(m.mine.aria('B')));
    click(button(m.mine.aria('D')));
    expect(text()).toContain(m.mine.verdict(23, 23));
    expect(arcTitles()).toContain('Cạnh D → T: sức chứa 4, đi từ S sang T');
    expect(vertexTitle(4)).toBe('Đỉnh D, phía S');
    click(button(m.mine.aria('T')));
    expect(text()).toContain(m.mine.verdict(23, 23));
    click(button(m.mine.aria('D')));
    expect(text()).toContain(m.mine.verdict(26, 23));
  });

  it('returns the smallest minimum cut on ties and reruns on edits', () => {
    render();
    commit(select('preset'), 'ties');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Một lát cắt nhỏ nhất có sức chứa 7, bằng luồng cực đại.');
    expect(vertexTitle(1)).toBe('Đỉnh A');
    commit(capacityField('S → A'), '9');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.cut)).toBe('7');
    expect(vertexTitle(1)).toBe('Đỉnh A, phía S');
    commit(capacityField('S → A'), 'x');
    expect(text()).toContain(m.badCapacity(20));
    commit(select('source'), '3');
    expect(text()).toContain(m.sameEnds);
    click(buttonByText(m.resetGraph));
    click(button('Đến bước cuối'));
    expect(vertexTitle(1)).toBe('Đỉnh A');
    click(button('Về bước đầu'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('Đã đẩy 2 theo S → A → T.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '23');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '25');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
