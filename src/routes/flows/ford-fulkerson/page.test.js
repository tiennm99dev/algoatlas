// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/ford-fulkerson/copy.vi.js';

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

describe('Ford-Fulkerson lesson', () => {
  it('pushes augmenting paths until the flow is maximum', () => {
    render();
    expect(text()).toContain('Mọi cạnh bắt đầu với luồng 0.');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'DFS tìm được S → A → C → B → D → T. Phần trống nhỏ nhất trên đường là cổ chai b = 4.',
    );
    expect(statValue(m.stats.bottleneck)).toBe('4');
    click(button('Bước tiếp'));
    expect(statValue(m.stats.value)).toBe('4');
    expect(arcTitles()).toContain('Cạnh C → B: luồng 4/9, đường đi thêm luồng ở đây');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      'Xong sau 4 đường tăng luồng và 67 lần xét cung: luồng cực đại từ S đến T là 23.',
    );
    expect(statValue(m.stats.value)).toBe('23');
    expect(statValue(m.stats.paths)).toBe('4');
    click(button('Bước trước'));
    expect(text()).toContain('phép tìm kiếm chỉ đến được S, A, B và D.');
  });

  it('shows the backward step and the residual view', () => {
    render();
    commit(select('preset'), 'cancel');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('DFS tìm được S → B ⇠ A → T.');
    expect(text()).toContain('dùng A → B theo chiều ngược');
    radio('residual');
    expect(arcTitles()).toContain('Cung ngược B → A: huỷ được 1, trên đường tăng luồng');
    click(button('Bước tiếp'));
    expect(text()).toContain('và trừ bớt ở A → B');
    radio('flow');
    expect(arcTitles()).toContain('Cạnh A → B: luồng 0/1, đường đi huỷ luồng ở đây');
  });

  it('reruns on a new capacity, refuses a bad one, and resets', () => {
    render();
    commit(select('preset'), 'cancel');
    commit(capacityField('A → T'), '2');
    commit(capacityField('S → A'), '3');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.value)).toBe('3');
    commit(capacityField('S → A'), '25');
    expect(text()).toContain(m.badCapacity(20));
    expect(capacityField('S → A').value).toBe('3');
    click(buttonByText(m.resetGraph));
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.value)).toBe('2');
  });

  it('changes the ends and refuses a sink equal to the source', () => {
    render();
    commit(select('sink'), '0');
    expect(text()).toContain(m.sameEnds);
    expect(select('sink').value).toBe('5');
    commit(select('sink'), '3');
    click(button('Đến bước cuối'));
    expect(text()).toContain('luồng cực đại từ S đến C là 19');
    click(button('Về bước đầu'));
    press(document.body, 'ArrowRight');
    expect(text()).toContain('DFS tìm được S → A → C.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '20');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '23');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
