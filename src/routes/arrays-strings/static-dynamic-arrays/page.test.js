// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/static-dynamic-arrays/copy.vi.js';

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
  localStorage.clear();
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

const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const readLine = () =>
  document.querySelector('[data-testid="read-line"]')?.textContent?.trim() ?? '';

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

/** @param {string} value */
function pickGrowth(value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="growth"][value="${value}"]`)
    ),
  );
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** Step until the narration matches. @param {string} part */
function stepUntil(part) {
  for (let k = 0; k < 400 && !narration().includes(part); k++) click(button('Bước tiếp'));
}

/** @param {number} i */
const cellA = (i) =>
  /** @type {SVGElement} */ (
    document.querySelector(`svg[aria-label^="${m.blockAria}"] [data-index="${i}"]`)
  );

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('static and dynamic arrays lesson', () => {
  it('counts a resizing push as started in the steps per push', () => {
    render();
    stepUntil('Sao chép A[0]');
    // Pushes 1 and 2 wrote, push 3 has made one copy: 3 steps over 3 started pushes.
    expect(stat(m.stats.average)).toBe('1');
    stepUntil('Lần thêm 3: ghi');
    expect(stat(m.stats.average)).toBe('1.67');
  });

  it('doubles from capacity 2 through 9 pushes', () => {
    render();
    expect(narration()).toContain('Một mảng động rỗng, sức chứa 2, ở địa chỉ 1000.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Lần thêm 1: ghi 10 vào A[0]');
    expect(stat(m.stats.size)).toBe('1 / 2');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.size)).toBe('9 / 16');
    expect(stat(m.stats.copies)).toBe('14');
    expect(stat(m.stats.resizes)).toBe('3');
    expect(stat(m.stats.spare)).toBe('7');
    expect(stat(m.stats.average)).toBe('2.56');
    expect(narration()).toContain(
      '9 lần thêm gồm 9 lần ghi và 14 lần sao chép qua 3 lần đổi kích thước',
    );
  });

  it('shows the new block while copying and moves A to its address', () => {
    render();
    stepUntil('Cấp phát khối B');
    expect(text()).toContain(m.blockB);
    expect(narration()).toContain('Cấp phát khối B gồm 4 ô ở địa chỉ 1024');
    click(button('Bước tiếp'));
    expect(narration()).toBe('Sao chép A[0] = 10 sang B[0]. Lần thêm này đã sao chép 1 lần.');
    stepUntil('Giải phóng khối cũ');
    expect(narration()).toContain('A giờ bắt đầu ở 1024, sức chứa 4');
    expect(text()).not.toContain(m.blockB);
  });

  it('refuses pushes onto a full static array', () => {
    render();
    pickGrowth('static');
    expect(text()).toContain('error "mảng đã đầy"');
    click(button('Đến bước cuối'));
    expect(narration()).toBe(
      'Xong: lưu được 2 giá trị, 7 lần thêm bị từ chối vì mảng tĩnh đã đầy.',
    );
    expect(stat(m.stats.copies)).toBe('0');
  });

  it('copies far more when growing by one slot', () => {
    render();
    pickGrowth('plus-one');
    commit(input('capacity'), '1');
    commit(input('pushes'), '8');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.copies)).toBe('28');
    pickGrowth('double');
    click(button('Đến bước cuối'));
    expect(stat(m.stats.copies)).toBe('7');
  });

  it('reads an index by address with the keyboard', () => {
    render();
    click(button('Đến bước cuối'));
    expect(readLine()).toBe(m.readHint);
    cellA(0).focus();
    cellA(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(document.activeElement).toBe(cellA(1));
    cellA(1).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(readLine()).toContain('A[1] nằm ở');
    expect(readLine()).toContain('cho ra 20');
    cellA(12).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(readLine()).toBe(m.readSpare(12));
  });

  it('keeps the last valid values', () => {
    render();
    commit(input('capacity'), '0');
    expect(narration()).toBe(m.capacityError);
    expect(input('capacity').value).toBe('2');
    commit(input('pushes'), '25');
    expect(narration()).toBe(m.pushesError);
    expect(input('pushes').value).toBe('9');
    commit(input('pushes'), '0');
    click(button('Đến bước cuối'));
    expect(narration()).toBe('Xong: không có giá trị nào được thêm.');
  });

  it('checks the first question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '32';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '31';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
