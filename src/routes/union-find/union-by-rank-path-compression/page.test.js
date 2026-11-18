// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/union-by-rank-path-compression/copy.vi.js';
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

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const preset = () => /** @type {HTMLSelectElement} */ (document.querySelector('select'));
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
/** @param {string} value */
const radio = (value) =>
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
/** @param {string} label */
const tableRow = (label) =>
  [...document.querySelectorAll('tbody tr')].find((r) =>
    r.querySelector('th')?.textContent?.includes(label),
  );

describe('union by rank and path compression lesson', () => {
  it('climbs the nine-link chain and flattens it with compression', () => {
    render();
    expect(narration()).toContain('Mỗi phần tử là gốc của chính nó với hạng 0.');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Xong: 1 tập, cây cao nhất dài 1 liên kết, đã đi qua 10 liên kết và trỏ lại 8 ô.',
    );
    expect(statValue('Số liên kết đã đi (tổng)')).toBe('10');
  });

  it('narrates a compression step', () => {
    render();
    let guard = 0;
    while (!narration().startsWith('Nén đường đi') && guard++ < 200) click(button('Bước tiếp'));
    expect(narration()).toBe('Nén đường đi: 0 từng trỏ vào 1; giờ nó trỏ thẳng vào gốc 9.');
  });

  it('keeps the chain tall with compression off', () => {
    render();
    radio('off');
    click(button('Đến bước cuối'));
    expect(statValue('Số liên kết đã đi (tổng)')).toBe('17');
    expect(statValue('Cây cao nhất (số liên kết)')).toBe('9');
    expect(tableRow('Thông thường, không nén')?.textContent).toContain('(đang hiển thị)');
  });

  it('never forms the chain with union by rank and shows ranks', () => {
    render();
    radio('rank');
    click(button('Đến bước cuối'));
    expect(statValue('Cây cao nhất (số liên kết)')).toBe('1');
    expect(statValue('Số liên kết đã đi (tổng)')).toBe('8');
    expect(text()).toContain('r1');
    expect(tableRow('Cả hai')?.textContent).toContain('(đang hiển thị)');
  });

  it('compares all four settings on the same log', () => {
    render();
    commit(preset(), 'mixed');
    expect(tableRow('Thông thường, không nén')?.textContent).toContain('13');
    expect(tableRow('Chỉ hợp theo hạng')?.textContent).toContain('11');
    expect(tableRow('Chỉ nén đường đi')?.textContent).toContain('10');
    expect(tableRow('Cả hai')?.textContent).toContain('8');
  });

  it('adds a union with Enter and a find by picking a node', () => {
    render();
    click(buttonByText('Đặt lại'));
    commit(field('a'), '2');
    commit(field('b'), '5');
    const form = /** @type {HTMLFormElement} */ (field('a').closest('form'));
    form.requestSubmit();
    flushSync();
    expect(narration()).toBe('Tìm gốc của a = 2: bắt đầu ở 2.');
    const node = /** @type {HTMLElement} */ (
      document.querySelector('g[role="button"][aria-label^="5 là gốc"]')
    );
    node.focus();
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toBe('find(5): bắt đầu ở 5.');
    expect(text()).toContain('find(5)');
  });

  it('keeps the last valid element and refuses a full log', () => {
    render();
    commit(field('a'), '20');
    expect(field('a').value).toBe('0');
    // The first click follows the refused value, so it is refused too and adds nothing.
    click(buttonByText('Tìm gốc của a'));
    expect(narration()).toBe(m.elementError);
    for (let i = 0; i < 6; i++) click(buttonByText('Tìm gốc của a'));
    expect(narration()).toBe(m.logFull);
    click(buttonByText('Hoàn tác'));
    expect(text()).not.toContain(m.logFull);
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '8');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '1');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
