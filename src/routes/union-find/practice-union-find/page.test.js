// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-union-find/copy.vi.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
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

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();

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
/** @param {string} name */
const select = (name) =>
  /** @type {HTMLSelectElement} */ (document.querySelector(`select[name="${name}"]`));
const graphLabel = () =>
  document.querySelector('svg[role="img"]')?.getAttribute('aria-label') ?? '';

describe('union-find practice lesson', () => {
  it('runs the road network to two components and three cycle edges', () => {
    render();
    expect(narration()).toContain('9 cạnh sẽ lần lượt đến từng cạnh một');
    expect(statValue('Số thành phần')).toBe('8');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Đã xử lí hết 9 cạnh: còn 2 thành phần, 3 cạnh khép kín chu trình, cạnh đầu tiên là #4.',
    );
    expect(statValue('Số cạnh đã gộp')).toBe('6');
    expect(statValue('Cạnh đầu tiên khép chu trình')).toBe('#4');
    expect(graphLabel()).toContain('{A, B, C, D, E, F, G}, {H}');
    expect(graphLabel()).toContain('A–D, G–E, B–F');
  });

  it('flags the edge that closes the first cycle', () => {
    render();
    for (let i = 0; i < 7; i++) click(button('Bước tiếp'));
    expect(narration()).toBe('Cạnh #4 A–D: find(A) = A, find(D) = A.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('#4 A–D khép kín một chu trình');
    expect(text()).toContain('#4 A–D ✕');
    expect(text()).toContain('#4: 5');
  });

  it('adds an edge with Enter and refuses loops and repeats', () => {
    render();
    commit(select('from'), '7');
    commit(select('to'), '0');
    const form = /** @type {HTMLFormElement} */ (select('from').closest('form'));
    form.requestSubmit();
    flushSync();
    expect(narration()).toBe('Cạnh #10 H–A: find(H) = H, find(A) = A.');
    click(button('Đến bước cuối'));
    expect(statValue('Số thành phần')).toBe('1');
    commit(select('to'), '7');
    click(buttonByText('Thêm cạnh'));
    expect(narration()).toBe(m.edits.loop);
    commit(select('from'), '0');
    commit(select('to'), '1');
    click(buttonByText('Thêm cạnh'));
    expect(narration()).toBe(m.edits.repeat);
    expect(text()).not.toContain('#11');
  });

  it('undoes, clears and loads the spanning tree stream', () => {
    render();
    click(buttonByText('Hoàn tác'));
    click(button('Đến bước cuối'));
    expect(statValue('Số cạnh khép chu trình')).toBe('2');
    click(buttonByText('Xoá hết'));
    expect(text()).toContain('chưa có cạnh nào');
    expect(buttonByText('Xoá hết').getAttribute('aria-disabled')).toBe('true');
    commit(select('preset'), 'tree');
    click(button('Đến bước cuối'));
    expect(statValue('Số thành phần')).toBe('1');
    expect(statValue('Cạnh đầu tiên khép chu trình')).toBe('—');
  });

  it('refuses a seventeenth edge', () => {
    render();
    const pairs = [
      [0, 2],
      [0, 4],
      [0, 5],
      [0, 6],
      [0, 7],
      [1, 3],
      [1, 4],
    ];
    for (const [u, v] of pairs) {
      commit(select('from'), String(u));
      commit(select('to'), String(v));
      click(buttonByText('Thêm cạnh'));
    }
    expect(text()).toContain('#16');
    commit(select('from'), '1');
    commit(select('to'), '6');
    click(buttonByText('Thêm cạnh'));
    expect(narration()).toBe(m.edits.full);
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '1');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '2');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
