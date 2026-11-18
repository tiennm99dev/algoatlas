// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/queues-deques/copy.vi.js';
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
const ringLabel = () =>
  document.querySelector('svg[aria-label^="Bộ đệm vòng"]')?.getAttribute('aria-label') ?? '';
const preset = () => /** @type {HTMLSelectElement} */ (document.querySelector('select'));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('queues and deques lesson', () => {
  it('builds the short queue and draws every slot of the ring', () => {
    render();
    expect(narration()).toContain('Một bộ đệm vòng rỗng');
    click(button('Đến bước cuối'));
    expect(ringLabel()).toBe(
      'Bộ đệm vòng gồm 8 ô, head = 0, tail = 4, size = 4. Từ đầu đến cuối: 12, 5, 31, 8.',
    );
    expect(document.querySelectorAll('svg[aria-label^="Bộ đệm vòng"] title')).toHaveLength(8);
  });

  it('dequeues from the front by moving head, with no shifting', () => {
    render();
    click(buttonByText('dequeue'));
    expect(narration()).toContain('dequeue(): size = 4');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Đọc 12 từ ô 0 rồi dời head đến 1');
    expect(byTest('result')).toBe('12');
    expect(byTest('naive-shifts')).toBe('3');
    expect(byTest('ring-shifts')).toBe('0');
  });

  it('wraps the tail into slot 0', () => {
    render();
    commit(preset(), 'wrap');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toContain('Ghi 90 vào ô 0');
    expect(narration()).toContain('quay vòng về đầu');
    expect(byTest('wraps')).toBe('1');
    expect(byTest('tail')).toBe('1');
  });

  it('pushes at the front and pops at the back as a deque', () => {
    render();
    click(buttonByText('Làm lại'));
    commit(valueInput(), '9');
    click(buttonByText('pushFront'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('Lùi head về ô 7 rồi ghi 9 vào đó');
    expect(byTest('head')).toBe('7');
    click(buttonByText('popBack'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('Đọc 9 từ ô 7');
  });

  it('refuses a ninth item and a pop from an empty buffer', () => {
    render();
    commit(preset(), 'full');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toContain('Đầy: cả 8 ô đều đang dùng, nên 9 bị từ chối');
    click(buttonByText('Làm lại'));
    click(buttonByText('dequeue'));
    click(button('Bước tiếp'));
    expect(narration()).toBe('Rỗng: không có gì để lấy ra. Bộ đệm giữ nguyên.');
  });

  it('keeps the last valid value and shows a notice for a bad one', () => {
    render();
    commit(valueInput(), '-3');
    expect(valueInput().value).toBe('17');
    valueInput().value = '';
    valueInput().dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    click(buttonByText('pushFront'));
    expect(narration()).toBe(m.valueError);
  });

  it('undoes, and enqueues when Enter submits the form', () => {
    render();
    click(buttonByText('dequeue'));
    click(buttonByText('Hoàn tác'));
    expect(ringLabel()).toContain('Từ đầu đến cuối: 12, 5, 31, 8.');
    commit(valueInput(), '44');
    /** @type {HTMLFormElement} */ (valueInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toContain('enqueue(44)');
    expect(buttonByText('dequeue').type).toBe('button');
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
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
