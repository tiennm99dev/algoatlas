// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/sorting-applications/copy.vi.js';

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
  vi.useRealTimers();
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

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name @param {string} value */
function pick(name, value) {
  click(
    /** @type {HTMLInputElement} */ (
      document.querySelector(`input[name="${name}"][value="${value}"]`)
    ),
  );
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
const blocksLabel = () =>
  document
    .querySelector('ol[aria-label^="Các khối đã gộp"], ol[aria-label="Chưa có khối nào."]')
    ?.getAttribute('aria-label');

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('sorting applications lesson', () => {
  it('sorts by start and merges the example into three blocks', () => {
    render();
    expect(blocksLabel()).toBe('Chưa có khối nào.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Đã sắp xếp theo điểm đầu');
    expect(
      document
        .querySelector('ol[aria-label^="Các đoạn theo thứ tự quét"]')
        ?.getAttribute('aria-label'),
    ).toBe('Các đoạn theo thứ tự quét: 1–3, 2–6, 4–5, 8–10, 12–16, 15–18.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Mở khối đầu tiên với 1–3.');
    click(button('Bước tiếp'));
    expect(text()).toContain(
      '2–6 bắt đầu ở 2, không sau điểm cuối của khối: chúng chồng nhau, nên khối thành 1–6.',
    );
    click(button('Đến bước cuối'));
    expect(text()).toContain('3 khối sau 5 lần kiểm tra: 1–6, 8–10, 12–18. Đây là cách gộp đúng.');
    expect(blocksLabel()).toBe('Các khối đã gộp: 1–6, 8–10, 12–18.');
    expect(text()).toContain('✓ gộp đúng');
  });

  it('shows a wrong merge when sorting by end or not at all', () => {
    render();
    pick('by', 'end');
    expect(text()).toContain('sắp xếp intervals theo end, bằng nhau thì theo start');
    click(button('Đến bước cuối'));
    expect(text()).toContain('Sai: cách gộp đúng là 1–6, 8–10, 12–18.');
    expect(text()).toContain('✕ gộp sai');
    pick('by', 'none');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain(
      'Nhưng nó kết thúc trước khi khối bắt đầu ở 8: thật ra chúng không chồng nhau, và khối vẫn là 8–10.',
    );
    click(button('Đến bước cuối'));
    expect(blocksLabel()).toBe('Các khối đã gộp: 8–10, 15–18.');
  });

  it('loads typed intervals and refuses bad ones', () => {
    render();
    commit(field('intervals'), '1-3 3-5');
    click(button('Đến bước cuối'));
    expect(blocksLabel()).toBe('Các khối đã gộp: 1–5.');
    commit(field('intervals'), '5-2, 6-7');
    expect(text()).toContain('Mỗi đoạn cần có điểm đầu < điểm cuối');
    expect(field('intervals').value).toBe('1-3, 3-5');
    commit(field('intervals'), '1-3, oops');
    expect(text()).toContain('Hãy gõ các đoạn dạng đầu-cuối');
  });

  it('removes duplicates with one neighbour check per value', () => {
    render();
    pick('mode', 'dedup');
    expect(text()).toContain('8 giá trị. Sắp xếp chúng trước');
    click(button('Bước tiếp'));
    expect(text()).toContain('Đã sắp xếp: 1, 3, 3, 7, 7, 9, 9, 9.');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('a[2] = 3 bằng a[1]: bỏ qua giá trị lặp lại.');
    click(button('Đến bước cuối'));
    expect(text()).toContain(
      '4 giá trị khác nhau sau 7 lần kiểm tra. Nếu không sắp xếp, so sánh mọi cặp sẽ tốn 28 lần.',
    );
    commit(field('values'), '5, 5');
    click(button('Đến bước cuối'));
    expect(text()).toContain('1 giá trị khác nhau sau 1 lần kiểm tra.');
    commit(field('values'), '5');
    expect(text()).toContain('Hãy gõ từ 2 đến 14 giá trị.');
  });

  it('checks the first practice question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '1-3, 2-6, 8-10, 15-18';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '1-6, 8-10, 15-18';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
