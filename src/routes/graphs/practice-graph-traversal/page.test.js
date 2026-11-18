// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-graph-traversal/copy.vi.js';

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Keyboard activation reports detail 0, which the grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {string} key */
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
/** @param {string} value */
const radio = (value) =>
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));

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

/** @param {string} label */
const compareRow = (label) =>
  [...document.querySelectorAll('tbody tr')]
    .find((tr) => tr.querySelector('th')?.textContent?.trim() === label)
    ?.querySelectorAll('td');

describe('practice traversal lesson', () => {
  it('runs BFS on the maze and compares it with DFS', () => {
    render();
    expect(text()).toContain('Đưa nguồn vào queue với khoảng cách 0.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Lấy (0,0) ra khỏi queue, khoảng cách 0.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã tới đích sau 52 lần thăm. Đường đi ngược về dài 24 bước.');
    const visits = compareRow(m.compareRows.visits);
    expect([visits?.[0].textContent, visits?.[1].textContent]).toEqual(['52', '25']);
    expect(statValue(m.stats.result)).toBe('24');
  });

  it('DFS on the open field finds a long path', () => {
    render();
    click(buttonByText(m.puzzles.field));
    radio('dfs');
    click(button('Bước tiếp'));
    expect(text()).toContain('Lấy (0,0) ra khỏi stack và thăm nó ở độ sâu 0.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đã tới đích sau 90 lần thăm. Đường đi ngược về dài 89 bước.');
    const steps = compareRow(m.compareRows.steps);
    expect([steps?.[0].textContent, steps?.[1].textContent]).toEqual(['7', '89']);
  });

  it('floods from three fires with one multi-source BFS', () => {
    render();
    click(buttonByText(m.puzzles.fire));
    expect(text()).toContain('Đưa cả 3 nguồn vào queue với khoảng cách 0');
    click(button('Đến bước cuối'));
    expect(text()).toContain('mọi ô đi tới được đều có khoảng cách tới nguồn gần nhất');
    expect(statValue(m.stats.reach)).toBe('6');
    expect(compareRow(m.floodRows.wrong)?.[1].textContent).toBe('76');
    expect(button('Hàng 0, cột 11, Đã thăm, nhãn 3')).toBeTruthy();
  });

  it('edits sources and the goal with the keyboard', () => {
    render();
    radio('source');
    keyActivate(button('Hàng 0, cột 2'));
    expect(text()).toContain('Đã thêm nguồn ở (0,2).');
    click(button('Bước tiếp'));
    expect(text()).toContain('Lấy (0,0) ra khỏi queue, khoảng cách 0.');
    expect(statValue(m.stats.adds)).toBe('2');
    keyActivate(button('Hàng 0, cột 4, Tường'));
    expect(text()).toContain(m.edits.blocked);
    keyActivate(button('Hàng 0, cột 2, Nguồn, nhãn 0'));
    keyActivate(button('Hàng 0, cột 0, Nguồn, nhãn 0'));
    expect(text()).toContain(m.edits.lastSource);
    radio('goal');
    keyActivate(button('Hàng 7, cột 11, Đích'));
    expect(text()).toContain(m.edits.goalRemoved);
    keyActivate(button('Hàng 2, cột 2'));
    expect(text()).toContain('Đã dời đích đến (2,2).');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.result)).toBe('6');
  });

  it('caps the number of sources', () => {
    render();
    click(buttonByText(m.puzzles.fire));
    radio('source');
    keyActivate(button('Hàng 7, cột 0'));
    keyActivate(button('Hàng 7, cột 1'));
    expect(text()).toContain(m.edits.tooManySources);
  });

  it('a pointer stroke paints walls and a walled-in goal is unreachable', () => {
    render();
    const a = button('Hàng 6, cột 11');
    const b = button('Hàng 7, cột 10');
    let under = a;
    document.elementFromPoint = () => under;
    a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    flushSync();
    under = b;
    b.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, buttons: 1 }));
    flushSync();
    expect(button('Hàng 6, cột 11, Tường')).toBeTruthy();
    expect(button('Hàng 7, cột 10, Tường')).toBeTruthy();
    click(button('Đến bước cuối'));
    expect(text()).toContain('vẫn chưa tới đích');
    expect(compareRow(m.compareRows.steps)?.[0].textContent).toBe('—');
  });

  it('moves focus with the arrow keys', () => {
    render();
    const first = button('Hàng 0, cột 0, Nguồn, nhãn 0');
    first.focus();
    press(first, 'ArrowRight');
    expect(document.activeElement).toBe(button('Hàng 0, cột 1'));
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '25');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '24');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
