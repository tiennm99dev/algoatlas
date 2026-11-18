// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import {
  blocksTrace,
  defaultBlockSize,
  moOrder,
  worstReads,
} from '$lib/algo-engine/sqrt-decomposition.js';
import { vi as m } from '$lib/lessons/sqrt-decomposition/copy.vi.js';
import { BLOCK_START, BLOCK_START_OPS } from './start-inputs.js';

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

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`[name="${name}"]`));

/** @param {number} k */
function next(k) {
  for (let i = 0; i < k; i++) click(button('Bước tiếp'));
}

const opsCard = () =>
  [...document.querySelectorAll('h2')].find((h) => h.textContent === m.opsTitle)?.parentElement
    ?.textContent ?? '';

const tradeOff = () => document.querySelector('[data-testid="trade-off"]')?.textContent ?? '';

const openMo = () => click(/** @type {Element} */ (document.querySelector('input[value="mo"]')));

/**
 * Press Enter in a field the way a browser does it: leaving the field fires its change event.
 * @param {HTMLInputElement} el @param {string} value
 */
function pressEnter(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.addEventListener('blur', () => el.dispatchEvent(new Event('change', { bubbles: true })), {
    once: true,
  });
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  flushSync();
}

describe('sqrt decomposition lesson: blocks', () => {
  it('opens on the first query and walks loose cells and whole blocks', () => {
    render();
    expect(text()).toContain('Tổng của a[2..13]: bắt đầu từ đầu trái với total = 0.');
    next(1);
    expect(text()).toContain(
      'Ô 2 không dùng được cả khối ở đây, nên ta đọc nó: 4. Tổng hiện tại = 4.',
    );
    next(2);
    expect(text()).toContain('Khối 1 nằm trọn trong đoạn, nên ta đọc tổng đã lưu 22');
    next(4);
    expect(text()).toContain('Tổng bằng 64, sau 6 lần đọc thay vì 12.');
  });

  it('applies a point update to one cell and one block sum', () => {
    render();
    next(8);
    expect(text()).toContain('a[5] thành 0, và tổng của khối 1 đổi thành 13.');
    click(button('Đến bước cuối'));
    click(button('Bước trước'));
    expect(text()).toContain('Tổng bằng 55, sau 6 lần đọc thay vì 12.');
  });

  it('steps back to the build', () => {
    render();
    click(button('Về bước đầu'));
    expect(text()).toContain('Chia 16 giá trị thành các khối 4 ô');
    next(1);
    expect(text()).toContain('a[0] = 3 thuộc khối 0, tổng của khối giờ là 3.');
  });

  it('shows the cost rise on both sides of the square root', () => {
    render();
    expect(tradeOff()).toContain('đoạn tốn kém nhất cần 8 lần đọc');
    commit(input('block'), '1');
    expect(tradeOff()).toContain('đoạn tốn kém nhất cần 16 lần đọc');
    commit(input('block'), '16');
    expect(tradeOff()).toContain('đoạn tốn kém nhất cần 15 lần đọc');
    click(buttonByText(m.rootButton));
    expect(input('block').value).toBe('4');
    expect(tradeOff()).toContain('đoạn tốn kém nhất cần 8 lần đọc');
  });

  it('runs a typed query with Enter, and a picked one with two clicks', () => {
    render();
    commit(input('l'), '4');
    commit(input('r'), '7');
    document
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(opsCard()).toContain('sum(4, 7)');
    next(1);
    expect(text()).toContain('Khối 1 nằm trọn trong đoạn');

    const cell = (/** @type {number} */ i) =>
      /** @type {HTMLElement} */ (document.querySelector(`[data-index="${i}"]`));
    click(cell(9));
    expect(text()).toContain('Đoạn bắt đầu ở 9.');
    cell(1).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(opsCard()).toContain('sum(1, 9)');
    expect(input('l').value).toBe('1');
  });

  it('sets a typed value, undoes it and resets', () => {
    render();
    commit(input('index'), '0');
    commit(input('value'), '-7');
    click(buttonByText(m.setButton));
    expect(text()).toContain('a[0] thành −7, và tổng của khối 0 đổi thành −1.');
    click(buttonByText(m.undo));
    expect(opsCard()).not.toContain('set(0, −7)');
    click(buttonByText(m.reset));
    expect(opsCard()).toContain(m.opsEmpty);
  });

  it('refuses bad input and keeps the last valid value', () => {
    render();
    commit(input('values'), '1, b');
    expect(text()).toContain(m.valueErrors.format());
    expect(input('values').value).toContain('3, 1, 4');
    commit(input('values'), Array(26).fill(1).join(' '));
    expect(text()).toContain(m.valueErrors.count(25));
    commit(input('block'), '17');
    expect(text()).toContain(m.blockError(16));
    expect(input('block').value).toBe('4');
    commit(input('l'), '14');
    expect(text()).toContain(m.rangeError(16));
    expect(input('l').value).toBe('2');
    commit(input('index'), '16');
    expect(text()).toContain(m.indexError(16));
    expect(input('index').value).toBe('5');
    commit(input('value'), '100');
    expect(text()).toContain(m.valueError);
    expect(input('value').value).toBe('0');
  });

  it('refuses a full log', () => {
    render();
    for (let k = 0; k < 5; k++) click(buttonByText(m.queryButton));
    click(buttonByText(m.queryButton));
    expect(text()).toContain(m.logFull);
  });

  it('fits the fields and the log to a shorter array', () => {
    render();
    commit(input('values'), '5, 6, 7');
    expect(input('block').value).toBe('3');
    expect(input('r').value).toBe('2');
    expect(opsCard()).toContain('sum(2, 2)');
    expect(opsCard()).not.toContain('set(5, 0)');
  });

  it('keeps a refusal on Enter and runs no operation', () => {
    render();
    const before = opsCard();
    pressEnter(input('l'), '99');
    expect(text()).toContain(m.rangeError(16));
    expect(opsCard()).toBe(before);
    pressEnter(input('block'), '99');
    expect(text()).toContain(m.blockError(16));
    expect(opsCard()).toBe(before);
  });

  it('runs the action of the field Enter was pressed in, and none for the block size', () => {
    render();
    pressEnter(input('value'), '7');
    expect(opsCard()).toContain('set(5, 7)');
    pressEnter(input('r'), '9');
    expect(opsCard()).toContain('sum(2, 9)');
    const before = opsCard();
    pressEnter(input('block'), '3');
    expect(input('block').value).toBe('3');
    expect(opsCard().replace(` (${m.opsHotLabel})`, '')).toBe(
      before.replace(` (${m.opsHotLabel})`, ''),
    );
  });

  it('does not claim more loose cells than the array has', () => {
    render();
    commit(input('block'), '16');
    expect(tradeOff()).toContain('đoạn tốn kém nhất cần 15 lần đọc');
    expect(tradeOff()).not.toMatch(/30|1 blocks/);
  });

  it('counts the cells of a short last block', () => {
    render();
    commit(input('values'), '1, 2, 3, 4, 5');
    commit(input('block'), '3');
    commit(input('l'), '3');
    commit(input('r'), '4');
    click(buttonByText(m.queryButton));
    next(1);
    expect(text()).toContain('thay vì 2 ô');
  });

  it('keeps the fields inside a shortened array after switching away and back', () => {
    render();
    commit(input('values'), '1, 2, 3');
    openMo();
    click(/** @type {Element} */ (document.querySelector('input[value="blocks"]')));
    expect(Number(input('r').value)).toBeLessThanOrEqual(2);
    expect(Number(input('l').value)).toBeLessThanOrEqual(Number(input('r').value));
    expect(Number(input('index').value)).toBeLessThanOrEqual(2);
    const before = opsCard();
    click(buttonByText(m.queryButton));
    expect(text()).not.toContain(m.rangeError(3));
    expect(opsCard()).not.toBe(before);
  });
});

describe('sqrt decomposition lesson: Mo’s algorithm', () => {
  it('sorts the queries, then slides the window', () => {
    render();
    openMo();
    expect(text()).toContain('6 truy vấn trên 16 giá trị, đã biết hết từ trước.');
    next(1);
    expect(text()).toContain('Sắp xếp theo khối của l, rồi theo r.');
    next(1);
    expect(text()).toContain('Tiếp theo là Q1, [0, 3].');
    next(1);
    expect(text()).toContain('Thêm a[0] = 1. Số giá trị phân biệt trong cửa sổ: 1.');
  });

  it('answers in the typed slots and reports both move counts', () => {
    render();
    openMo();
    click(button('Đến bước cuối'));
    expect(text()).toMatch(
      /Xong: \d+ bước dịch theo thứ tự đã sắp, so với \d+ theo thứ tự đã gõ\./,
    );
    expect(text()).toContain('Đáp án: 3, 3, 4, 2, 4, 4, theo thứ tự đã gõ.');
  });

  it('removes values and updates the counts', () => {
    render();
    openMo();
    next(10);
    expect(text()).toContain('Bỏ a[0] = 1.');
  });

  it('loads a preset and takes typed queries', () => {
    render();
    openMo();
    commit(input('preset'), 'nested');
    expect(input('queries').value).toBe('0 15, 1 14, 5 10, 6 9, 2 13');
    commit(input('queries'), '0 1, 2 3');
    expect(text()).toContain('2 truy vấn trên 16 giá trị');
    expect(input('preset').value).toBe('');
  });

  it('refuses bad queries and values, keeping the last valid ones', () => {
    render();
    openMo();
    commit(input('queries'), '3');
    expect(text()).toContain(m.queryErrors.format());
    expect(input('queries').value).toBe('0 3, 12 15, 1 4, 13 14, 2 5, 11 15');
    commit(input('queries'), '0 16');
    expect(text()).toContain(m.queryErrors.range(16));
    commit(input('queries'), Array(7).fill('0 1').join(', '));
    expect(text()).toContain(m.queryErrors.count());
    commit(input('mo-values'), 'x');
    expect(text()).toContain(m.valueErrors.format());
    commit(input('mo-values'), Array(17).fill(1).join(' '));
    expect(text()).toContain(m.valueErrors.count(16));
  });

  it('fits the queries to a shorter array', () => {
    render();
    openMo();
    commit(input('mo-values'), '1, 2, 1, 3');
    expect(input('queries').value).toBe('0 3, 1 3, 2 3');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Đáp án: 3, 3, 2, theo thứ tự đã gõ.');
  });

  it('keeps each half’s state across a switch', () => {
    render();
    commit(input('block'), '2');
    openMo();
    commit(input('queries'), '0 1');
    click(/** @type {Element} */ (document.querySelector('input[value="blocks"]')));
    expect(input('block').value).toBe('2');
    expect(tradeOff()).toContain('s = 2');
    openMo();
    expect(input('queries').value).toBe('0 1');
  });

  it('checks a practice answer with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const send = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '50';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Đúng rồi!');
  });
});

describe('sqrt decomposition practice answers', () => {
  it('has well-formed questions', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('matches the engine', () => {
    const answers = m.practice.map((ex) => /** @type {{ answer?: unknown }} */ (ex).answer);
    expect(answers[0]).toBe(defaultBlockSize(100));
    const frames = blocksTrace(BLOCK_START, 4, BLOCK_START_OPS);
    const first = frames.filter((f) => f.opIndex === 0).at(-1);
    expect(answers[1]).toBe(first?.reads);
    expect(answers[2]).toBe(first?.result);
    expect(answers[3]).toBe(frames.filter((f) => f.opIndex === 1).at(-1)?.sums[1]);
    expect(answers[4]).toBe(worstReads(16, 4));
    const queries = [
      { l: 9, r: 10 },
      { l: 1, r: 7 },
      { l: 2, r: 3 },
      { l: 5, r: 6 },
    ];
    expect(answers[5]).toEqual(moOrder(queries, 4));
  });
});
