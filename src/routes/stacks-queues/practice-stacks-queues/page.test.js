// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-stacks-queues/copy.vi.js';
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
const label = (prefix) =>
  [...document.querySelectorAll('svg[role="img"]')]
    .map((s) => s.getAttribute('aria-label') ?? '')
    .find((l) => l.startsWith(prefix)) ?? '';
/** @param {string} value */
const pickProblem = (value) =>
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="problem"][value="${value}"]`)
    ),
  );
/** @param {number} n */
const next = (n) => {
  for (let i = 0; i < n; i++) click(button('Bước tiếp'));
};

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: stacks and queues lesson', () => {
  it('pours the inbox into the outbox on the first dequeue', () => {
    render();
    next(4);
    expect(narration()).toBe('dequeue(): outbox rỗng, nên đổ cả inbox sang.');
    next(1);
    expect(narration()).toContain('Pop 3 từ inbox rồi push nó vào outbox');
    next(2);
    expect(label('outbox')).toBe(
      'outbox (dequeue pop từ đây), từ đáy lên đỉnh: 3, 2, 1. Đỉnh là 1.',
    );
    next(1);
    expect(narration()).toContain('Pop 1 từ outbox và trả về');
    expect(byTest('result')).toBe('1');
  });

  it('ends the mixed log with 4 pours and 2 stack ops per queue op', () => {
    render();
    click(button('Đến bước cuối'));
    expect(byTest('transfers')).toBe('4');
    expect(byTest('stack-ops')).toBe('16');
    expect(byTest('per-op')).toBe('2.00');
  });

  it('enqueues from the form and reports an empty queue', () => {
    render();
    click(buttonByText('Làm lại'));
    commit(valueInput(), '42');
    /** @type {HTMLFormElement} */ (valueInput().closest('form')).requestSubmit();
    flushSync();
    expect(narration()).toBe('enqueue(42): push 42 vào inbox. Một thao tác stack.');
    click(buttonByText('dequeue'));
    click(buttonByText('dequeue'));
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(narration()).toContain('queue rỗng');
  });

  it('refuses a ninth item and a bad value', () => {
    render();
    click(buttonByText('Làm lại'));
    for (let k = 0; k < 9; k++) click(buttonByText('enqueue'));
    expect(narration()).toBe(m.full);
    commit(valueInput(), '500');
    expect(valueInput().value).toBe('6');
  });

  it('tracks the minimum with a second stack in the min-stack', () => {
    render();
    pickProblem('min-stack');
    click(button('Đến bước cuối'));
    expect(label('mins')).toBe('mins (đỉnh = giá trị nhỏ nhất), từ đáy lên đỉnh: 5, 3. Đỉnh là 3.');
    expect(byTest('min')).toBe('3');
    click(button('Bước trước'));
    expect(narration()).toBe('getMin() đọc đỉnh của mins: 3. Không cần tìm kiếm.');
    click(buttonByText('Hoàn tác'));
    commit(valueInput(), '9');
    click(buttonByText('push'));
    click(button('Bước tiếp'));
    expect(narration()).toBe('9 > giá trị nhỏ nhất 3: mins giữ nguyên.');
  });

  it('loads a preset and undoes', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'burst');
    click(button('Đến bước cuối'));
    expect(byTest('transfers')).toBe('5');
    click(buttonByText('Hoàn tác'));
    expect(byTest('queue-ops')).toBe('9');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
