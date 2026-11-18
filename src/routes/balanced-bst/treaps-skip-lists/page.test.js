// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/treaps-skip-lists/copy.vi.js';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Component @param {Record<string, any>} [props] */
function render(Component, props = {}) {
  app = mount(Component, { target: document.body, props });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  vi.useRealTimers();
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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const keyInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="key"]'));
const priorityInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="priority"]'));
const presetSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
const towerSelect = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="tower"]'));
const narration = () => document.querySelector('p[aria-live]')?.textContent ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const svgLabel = () => document.querySelector('svg[aria-label]')?.getAttribute('aria-label') ?? '';
/** @param {string} value */
function pickMode(value) {
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="mode"][value="${value}"]`)
  ).click();
  flushSync();
}
/** Steps forward until the narration holds `part`. @param {string} part */
function stepTo(part) {
  for (let i = 0; i < 80 && !narration().includes(part); i++) click(button('Bước tiếp'));
  expect(narration()).toContain(part);
}

describe('treaps and skip lists lesson', () => {
  it('opens on the skip list search, at the top of the towers', () => {
    render(Page);
    expect(narration()).toContain('Bắt đầu ở đầu danh sách trên tầng 4');
    expect(svgLabel()).toContain('8 khoá và 4 tầng');
  });

  it('drops level by level to the target', () => {
    render(Page);
    click(button('Bước tiếp'));
    expect(narration()).toContain('tụt xuống tầng 3');
    stepTo('nên sang phải');
    stepTo('Đã tìm thấy 70 ở tầng dưới cùng, sau 6 phép so sánh.');
    expect(stat('rights')).toBe('2');
    expect(stat('drops')).toBe('3');
  });

  it('walks every key on the flat preset', () => {
    render(Page);
    commit(presetSelect(), 'flat');
    stepTo('Đã tìm thấy 70');
    expect(stat('comparisons')).toBe('7');
    expect(stat('drops')).toBe('0');
    expect(stat('levels')).toBe('1');
  });

  it('flips a coin per level when inserting, then links the tower', () => {
    render(Page);
    commit(keyInput(), '45');
    commit(towerSelect(), '3');
    click(buttonByText('Chèn'));
    stepTo('Sấp: cột cao lên 2.');
    stepTo('Ngửa: cột dừng ở chiều cao 3.');
    stepTo('Nối cột mới của 45');
    expect(stat('size')).toBe('9');
    expect(svgLabel()).toContain('45 cao 3');
  });

  it('flips real coins when the field is left on coin flips', () => {
    const rand = vi.spyOn(Math, 'random').mockReturnValue(0.9);
    render(Page);
    commit(keyInput(), '45');
    click(buttonByText('Chèn'));
    expect(rand).toHaveBeenCalled();
    stepTo('Ngửa: cột dừng ở chiều cao 1.');
    rand.mockRestore();
  });

  it('searches, deletes, undoes and resets in the skip list', () => {
    render(Page);
    commit(keyInput(), '40');
    click(buttonByText('Xoá'));
    stepTo('Gỡ cột khỏi mọi tầng');
    expect(stat('size')).toBe('7');
    commit(keyInput(), '41');
    click(buttonByText('Tìm'));
    stepTo('nên 41 không có trong danh sách');
    click(buttonByText('Hoàn tác'));
    expect(presetSelect().value).toBe('');
    click(buttonByText('Đặt lại'));
    expect(narration()).toContain('Danh sách đang rỗng.');
    expect(buttonByText('Đặt lại').getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps the last valid key and refuses a bad one with a notice', () => {
    render(Page);
    commit(keyInput(), '45');
    commit(keyInput(), '');
    expect(keyInput().value).toBe('45');
    keyInput().value = '150';
    keyInput().dispatchEvent(new Event('input', { bubbles: true }));
    click(buttonByText('Tìm'));
    expect(narration()).toContain('số nguyên từ 0 đến 99');
    expect(keyInput().value).toBe('45');
  });

  it('refuses a key past the size cap and an operation past the log cap', () => {
    render(Page);
    commit(towerSelect(), '1');
    for (let k = 81; k < 86; k++) {
      commit(keyInput(), String(k));
      click(buttonByText('Chèn'));
    }
    expect(narration()).toContain('Danh sách đã đầy (12 khoá).');
    for (let i = 0; i < 12; i++) click(buttonByText('Tìm'));
    expect(narration()).toContain('Danh sách thao tác đã đầy (24 thao tác).');
  });

  it('switches to the treap and rotates a node up', () => {
    render(Page);
    pickMode('treap');
    expect(narration()).toContain('Treap đang rỗng.');
    stepTo('được đưa lên');
    click(button('Đến bước cuối'));
    expect(stat('height')).toBe('4');
    expect(stat('rotations')).toBe('4');
    expect(document.querySelector('svg')?.textContent).toContain('p 7');
  });

  it('keeps each structure when switching away and back', () => {
    render(Page);
    commit(keyInput(), '40');
    click(buttonByText('Xoá'));
    click(button('Đến bước cuối'));
    pickMode('treap');
    commit(keyInput(), '45');
    priorityInput().value = '1';
    priorityInput().dispatchEvent(new Event('input', { bubbles: true }));
    click(buttonByText('Chèn'));
    pickMode('skip');
    expect(stat('size')).toBe('7');
    pickMode('treap');
    click(button('Đến bước cuối'));
    expect(stat('size')).toBe('8');
  });

  it('inserts with a typed priority and rotates it to the root', () => {
    render(Page);
    pickMode('treap');
    commit(presetSelect(), 'chain');
    click(button('Đến bước cuối'));
    expect(stat('height')).toBe('7');
    commit(keyInput(), '45');
    commit(priorityInput(), '0');
    click(buttonByText('Chèn'));
    stepTo('Gắn 45 thành một lá với độ ưu tiên 0.');
    click(button('Đến bước cuối'));
    expect(stat('height')).toBe('5');
  });

  it('draws a random priority when the field is blank', () => {
    const rand = vi.spyOn(Math, 'random');
    render(Page);
    pickMode('treap');
    const before = rand.mock.calls.length;
    commit(keyInput(), '45');
    click(buttonByText('Chèn'));
    expect(rand.mock.calls.length).toBeGreaterThan(before);
    rand.mockRestore();
  });

  it('refuses a bad priority and clears the field', () => {
    render(Page);
    pickMode('treap');
    commit(priorityInput(), '500');
    expect(narration()).toContain('Độ ưu tiên phải là số nguyên');
    expect(priorityInput().value).toBe('');
  });

  it('deletes from the treap by rotating down', () => {
    render(Page);
    pickMode('treap');
    click(button('Đến bước cuối'));
    commit(keyInput(), '20');
    click(buttonByText('Xoá'));
    stepTo('quay nó xuống cho đến khi nó thành lá');
    stepTo('được đưa lên và 20 bị đưa xuống');
    stepTo('Giờ nút đã là lá');
    expect(stat('size')).toBe('6');
  });

  it('gives the same treap from the reordered pairs', () => {
    render(Page);
    pickMode('treap');
    click(button('Đến bước cuối'));
    const shape = document.querySelector('svg')?.getAttribute('aria-label');
    commit(presetSelect(), 'reordered');
    click(button('Đến bước cuối'));
    expect(document.querySelector('svg')?.getAttribute('aria-label')).toBe(shape);
    expect(stat('height')).toBe('4');
    expect(stat('rotations')).toBe('5');
  });

  it('picks a treap node by pointer and keyboard', () => {
    render(Page);
    pickMode('treap');
    click(button('Đến bước cuối'));
    const nodes = [...document.querySelectorAll('svg [role="button"]')];
    expect(nodes.length).toBe(7);
    nodes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    const first = keyInput().value;
    expect(first).not.toBe('45');
    nodes[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(keyInput().value).not.toBe(first);
  });

  it('lets the random presets be chosen twice in a row', () => {
    const rand = vi.spyOn(Math, 'random');
    render(Page);
    commit(presetSelect(), 'random');
    expect(presetSelect().value).toBe('');
    pickMode('treap');
    commit(presetSelect(), 'random');
    expect(presetSelect().value).toBe('');
    rand.mockRestore();
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render(Page);
    const block = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (block.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    /** @param {string} value */
    const submit = (value) => {
      answer.value = value;
      answer.dispatchEvent(new Event('input', { bubbles: true }));
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    submit('5');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    submit('6');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('marks the compared key on the level it was read from, even after the drop', () => {
    render(Page);
    click(button('Bước tiếp'));
    expect(narration()).toContain('Trên tầng 4, khoá kế tiếp là 80');
    const title = (/** @type {string} */ id) =>
      document.querySelector(`g[data-cell="${id}"] title`)?.textContent ?? '';
    expect(title('7-4')).toContain('đang so sánh');
    expect(title('7-3')).not.toContain('đang so sánh');
  });

  it('says a tower at the cap stops flipping', () => {
    render(Page);
    commit(keyInput(), '45');
    commit(towerSelect(), '5');
    click(buttonByText('Chèn'));
    stepTo('mức tối đa của hình minh hoạ này');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Nối cột mới');
  });

  it('keeps each structure’s preset across a switch', () => {
    render(Page);
    commit(presetSelect(), 'flat');
    pickMode('treap');
    commit(presetSelect(), 'chain');
    pickMode('skip');
    expect(presetSelect().value).toBe('flat');
    commit(keyInput(), '45');
    click(buttonByText('Tìm'));
    pickMode('treap');
    expect(presetSelect().value).toBe('chain');
    pickMode('skip');
    expect(presetSelect().value).toBe('');
  });

  it('narrates a rotation down through an only child', () => {
    render(Page);
    pickMode('treap');
    commit(presetSelect(), 'chain');
    commit(keyInput(), '10');
    click(buttonByText('Xoá'));
    stepTo('con 20 được đưa lên và 10 bị đưa xuống');
  });
});
