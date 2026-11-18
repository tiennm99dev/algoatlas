// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/stacks/copy.vi.js';
import Page from './+page.svelte';

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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const valueInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="value"]'));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} prefix */
const svgLabel = (prefix) =>
  [...document.querySelectorAll('svg[role="img"]')]
    .map((s) => s.getAttribute('aria-label') ?? '')
    .find((l) => l.startsWith(prefix)) ?? '';
/** @param {string} value */
const pickImpl = (value) =>
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="impl"][value="${value}"]`)
    ),
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('stacks lesson', () => {
  it('starts empty and builds the three-plate preset', () => {
    render();
    expect(narration()).toContain('top = −1');
    click(button('Đến bước cuối'));
    expect(svgLabel('Ngăn xếp')).toBe('Ngăn xếp, từ đáy lên đỉnh: 3, 8, 5. Đỉnh là 5.');
    expect(byTest('top')).toBe('2');
    expect(byTest('pushes')).toBe('3');
  });

  it('pushes in two steps: check for room, then write a[top]', () => {
    render();
    commit(valueInput(), '42');
    click(buttonByText('push'));
    expect(narration()).toContain('push(42): top = 2, nhỏ hơn 5');
    click(button('Bước tiếp'));
    expect(narration()).toContain('a[3] = 42');
    expect(byTest('top')).toBe('3');
  });

  it('pops the last value pushed and leaves a stale slot', () => {
    render();
    click(buttonByText('pop'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('Đọc 5 từ a[2]');
    expect(byTest('result')).toBe('5');
    expect(svgLabel('Mảng')).toContain('a[2] 5 (cũ)');
    click(buttonByText('peek'));
    expect(narration()).toBe('peek() trả về 8, phần tử ở đỉnh, mà không lấy nó ra.');
  });

  it('overflows the array but not the linked list', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'overflow');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toContain('Tràn ngăn xếp: 5 không còn chỗ để vào');
    pickImpl('linked');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Ngăn xếp có 7 phần tử, 5 ở đỉnh');
    expect(svgLabel('Danh sách')).toContain(
      'Danh sách liên kết từ đỉnh: 5 → 6 → 1 → 7 → 2 → 9 → 4 → null',
    );
  });

  it('links a new node in front in the linked list', () => {
    render();
    pickImpl('linked');
    commit(valueInput(), '11');
    click(buttonByText('push'));
    expect(narration()).toContain('cho con trỏ kế tiếp của nút trỏ tới đỉnh hiện tại, 5');
    expect(svgLabel('Nút mới')).toContain('Nút mới 11, chưa được nối vào');
    click(button('Bước tiếp'));
    expect(byTest('top')).toBe('11');
  });

  it('reports underflow on an empty stack', () => {
    render();
    click(buttonByText('Làm lại'));
    click(buttonByText('pop'));
    click(button('Bước tiếp'));
    expect(narration()).toBe('Ngăn xếp rỗng: không có gì để pop. Ngăn xếp giữ nguyên.');
  });

  it('keeps the last valid value and shows a notice for a bad one', () => {
    render();
    commit(valueInput(), '150');
    expect(valueInput().value).toBe('7');
    valueInput().value = '';
    valueInput().dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    click(buttonByText('push'));
    expect(narration()).toBe(m.valueError);
    expect(valueInput().value).toBe('7');
  });

  it('refuses a ninth node in the linked drawing', () => {
    render();
    pickImpl('linked');
    for (let k = 0; k < 6; k++) click(buttonByText('push'));
    expect(narration()).toBe(m.drawingFull);
  });

  it('undoes, and pushes when Enter submits the form', () => {
    render();
    click(buttonByText('pop'));
    click(buttonByText('Hoàn tác'));
    expect(svgLabel('Ngăn xếp')).toContain('3, 8, 5');
    commit(valueInput(), '9');
    /** @type {HTMLFormElement} */ (valueInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toContain('push(9)');
    expect(buttonByText('pop').type).toBe('button');
  });

  it('steps back with the arrow keys', () => {
    render();
    click(button('Đến bước cuối'));
    const before = narration();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    flushSync();
    expect(narration()).not.toBe(before);
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
