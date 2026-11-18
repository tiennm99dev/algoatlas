// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/monotonic-stack-queue/copy.vi.js';
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
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} id */
const byTest = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
/** @param {string} prefix */
const label = (prefix) =>
  [...document.querySelectorAll('[role="img"]')]
    .map((s) => s.getAttribute('aria-label') ?? '')
    .find((l) => l.startsWith(prefix)) ?? '';
/** @param {string} value */
const pickMode = (value) =>
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="mode"][value="${value}"]`)
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

describe('monotonic stack and queue lesson', () => {
  it('pops shorter bars when a taller one arrives and records their answer', () => {
    render();
    expect(narration()).toContain('Ngăn xếp giữ các chỉ số còn đang chờ');
    next(7);
    expect(narration()).toBe('Đỉnh là a[1] = 2, nhỏ hơn 7: 7 là phần tử lớn hơn kế tiếp của nó.');
    next(1);
    expect(narration()).toBe('Pop chỉ số 1 và ghi answer[1] = 7. Nó bị bỏ hẳn.');
    expect(label('Đáp án lớn hơn kế tiếp')).toContain('chưa biết, 7, chưa biết');
    next(3);
    expect(label('Ngăn xếp')).toBe('Ngăn xếp, từ đáy lên đỉnh: chỉ số 2 (7).');
  });

  it('finishes with every answer and the 2n bound', () => {
    render();
    click(button('Đến bước cuối'));
    expect(label('Đáp án lớn hơn kế tiếp')).toBe(
      'Đáp án lớn hơn kế tiếp: 7, 7, 8, 5, 5, 8, -1, -1.',
    );
    expect(byTest('pushes')).toBe('8');
    expect(byTest('pops')).toBe('6');
    expect(byTest('bound')).toBe('14 ≤ 16');
  });

  it('never pops on falling input', () => {
    render();
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'falling');
    click(button('Đến bước cuối'));
    expect(byTest('pops')).toBe('0');
  });

  it('finds sliding window maxima with a deque', () => {
    render();
    pickMode('window-max');
    click(button('Đến bước cuối'));
    expect(label('Lớn nhất của các cửa sổ')).toBe('Lớn nhất của các cửa sổ: 7, 7, 7, 5, 8, 8.');
    click(button('Bước trước'));
    expect(narration()).toBe('Cửa sổ a[5..7] đã đủ: giá trị lớn nhất của nó ở đầu hàng, a[6] = 8.');
    commit(input('k'), '2');
    click(button('Đến bước cuối'));
    expect(label('Lớn nhất của các cửa sổ')).toBe('Lớn nhất của các cửa sổ: 4, 7, 7, 3, 5, 8, 8.');
  });

  it('expires the front when it leaves the window', () => {
    render();
    pickMode('window-max');
    commit(input('values'), '9 8 7');
    commit(input('k'), '2');
    const seen = [];
    for (let i = 0; i < 20; i++) {
      seen.push(narration());
      click(button('Bước tiếp'));
    }
    expect(seen).toContain('Chỉ số 0 đã trượt ra khỏi cửa sổ a[1..2]: pop nó ở đầu hàng.');
  });

  it('refuses bad values and a bad k, keeping the last valid ones', () => {
    render();
    commit(input('values'), '4, 0, 2');
    expect(narration()).toBe(m.valueErrors.range);
    expect(input('values').value).toBe('4, 2, 7, 3, 1, 5, 8, 6');
    pickMode('window-max');
    commit(input('k'), '9');
    expect(narration()).toBe(m.kError(8));
    expect(input('k').value).toBe('3');
  });

  it('shrinks k when fewer values are typed, and submits on Enter', () => {
    render();
    pickMode('window-max');
    input('values').value = '5 1';
    input('values').dispatchEvent(new Event('input', { bubbles: true }));
    /** @type {HTMLFormElement} */ (input('values').closest('form')).requestSubmit();
    flushSync();
    expect(input('k').value).toBe('2');
    click(button('Đến bước cuối'));
    expect(label('Lớn nhất của các cửa sổ')).toBe('Lớn nhất của các cửa sổ: 5.');
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
    answer.value = '8';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
