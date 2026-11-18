// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/interval-scheduling/copy.vi.js';

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

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
const text = () => document.body.textContent ?? '';
const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} name */
const bar = (name) =>
  [...document.querySelectorAll('g[role="listitem"]')]
    .find((g) => g.getAttribute('aria-label')?.startsWith(`${name} [`))
    ?.getAttribute('aria-label') ?? '';

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('interval scheduling lesson', () => {
  it('starts on the 11 classic activities', () => {
    render();
    expect(narration()).toContain('Giữ lại nhiều nhất có thể trong 11 đoạn');
    expect(stat('Nhiều nhất có thể')).toBe('4');
    expect(document.querySelectorAll('g[role="listitem"]')).toHaveLength(11);
  });

  it('sorts by finish time and keeps the first interval', () => {
    render();
    click(button('Bước tiếp'));
    expect(narration()).toContain('Sắp xếp theo thời điểm kết thúc');
    click(button('Bước tiếp'));
    expect(narration()).toContain('A [1, 4): chưa giữ đoạn nào, nên đoạn này vừa.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Giữ A; lastFinish thành 4.');
    expect(bar('A')).toContain('đã giữ hoặc đã xếp phòng');
    click(button('Bước tiếp'));
    expect(narration()).toContain('B [3, 5): 3 < lastFinish 4, nên đoạn này chồng với A [1, 4).');
    expect(bar('A')).toContain('chồng với đoạn đang quét');
  });

  it('keeps four activities by earliest finish', () => {
    render();
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Đã giữ 4 đoạn: A, D, H, K.');
    expect(stat('Đã giữ')).toBe('4');
    expect(stat('Số lần kiểm tra chồng')).toBe('11');
    expect(bar('B')).toContain('đã bỏ qua');
  });

  it('shows shortest first losing on its trap', () => {
    render();
    commit(field('preset'), 'shortTrap');
    expect(text()).toContain('Đã nạp các đoạn mới.');
    commit(field('rule'), 'shortest');
    expect(narration()).toContain('Quy tắc: Chọn: ngắn nhất trước.');
    expect(text()).toContain('if I không chồng với đoạn nào trong chosen:');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Đã giữ 1 đoạn: B. Kết thúc sớm nhất giữ được 2');
    expect(text()).toMatch(/Chọn: kết thúc sớm nhất\s*2 đoạn/);
  });

  it('shows earliest start losing and the rooms it needs', () => {
    render();
    commit(field('preset'), 'startTrap');
    commit(field('rule'), 'start');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Đã giữ 1 đoạn: A. Kết thúc sớm nhất giữ được 3');
    commit(field('rule'), 'rooms');
    expect(text()).toContain('free = min-heap rỗng chứa thời điểm kết thúc các phòng');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('2 phòng chứa được mọi đoạn. Lúc 1, có 2 đoạn chồng nhau');
    expect(stat('Số phòng')).toBe('2');
    expect(stat('Độ sâu')).toBe('2');
    expect(bar('C')).toContain('phòng R2');
  });

  it('partitions the classic activities into 6 rooms', () => {
    render();
    commit(field('rule'), 'rooms');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('C [0, 6): chưa có phòng nào mở.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Mở phòng R1 cho C.');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('6 phòng chứa được mọi đoạn. Lúc 8, có 6 đoạn chồng nhau');
    expect(text()).toContain('R1: ');
  });

  it('reads typed intervals and refuses bad ones', () => {
    render();
    commit(field('intervals'), '1-4, 4-6');
    click(button('Đến bước cuối'));
    expect(narration()).toContain('Đã giữ 2 đoạn: A, B.');
    commit(field('intervals'), '5-3');
    expect(narration()).toContain('Mỗi đoạn phải kết thúc sau khi bắt đầu.');
    expect(/** @type {HTMLInputElement} */ (field('intervals')).value).toBe('1-4, 4-6');
    commit(field('intervals'), '1-30');
    expect(narration()).toContain('Mọi thời điểm phải từ 0 đến 24.');
  });

  it('commits typed intervals on Enter and loads random ones', () => {
    render();
    const input = /** @type {HTMLInputElement} */ (field('intervals'));
    input.value = '0-2 1-3 2-4';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(narration()).toContain('Giữ lại nhiều nhất có thể trong 3 đoạn');
    click(buttonByText('Các đoạn ngẫu nhiên'));
    expect(text()).toContain('Đã nạp các đoạn mới.');
  });

  it('checks a practice answer, shows a hint, and accepts the right one', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[1]);
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
    expect(q.textContent).toContain(m.practice[1].hints[0]);
    answer.value = '6';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
