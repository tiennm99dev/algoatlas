// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/online-algorithms/copy.vi.js';

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
  vi.restoreAllMocks();
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

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} name @param {string} value */
const radio = (name, value) =>
  /** @type {HTMLInputElement} */ (
    document.querySelector(`input[name="${name}"][value="${value}"]`)
  );
/** @param {string} label */
const stat = (label) =>
  [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent;

/** @param {number} i */
function question(i) {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  return /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[i]);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const field = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('online algorithms lesson', () => {
  it('plays ski rental day by day until the secret season ends', () => {
    render();
    expect(text()).toContain('Mùa kết thúc vào một ngày bí mật. Hãy thuê hoặc mua cho ngày 1.');
    click(buttonByText(m.rent));
    expect(text()).toContain('Sau ngày 1 em đã trả 1. Mùa vẫn tiếp tục');
    click(buttonByText(m.rent));
    click(buttonByText(m.buy));
    // The secret season lasts 13 days: 2 rented days and the skis, 12, against min(13, 10).
    expect(text()).toContain('Mùa trượt kéo dài 13 ngày. Em đã trả 12');
    expect(stat(m.skiStats.ratio)).toBe('1.2');
    click(buttonByText(m.rent));
    expect(text()).toContain(m.notices.over);
    click(button('Về bước đầu'));
    click(button('Bước tiếp'));
    expect(text()).toContain('Ngày 1: Em thuê: +1.');
  });

  it('lets the adversary end the season right after buying', () => {
    render();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    click(radio('rule', 'adversary'));
    for (let i = 0; i < 4; i++) click(buttonByText(m.rent));
    click(buttonByText(m.buy));
    expect(text()).toContain('Mùa trượt kéo dài 5 ngày. Em đã trả 14');
    expect(stat(m.skiStats.ratio)).toBe('2.8');
    click(buttonByText(m.newSeason));
    expect(stat(m.skiStats.day)).toBe('0');
  });

  it('charts a fixed plan and finds its worst season', () => {
    render();
    click(radio('plan', 'fixed'));
    expect(input('buy-day').value).toBe('10');
    expect(text()).toContain('Kế hoạch tốt nhất, k = b, đảm bảo 2 − 1/b = 1.9.');
    commit(input('season'), '10');
    click(button('Đến bước cuối'));
    expect(stat(m.skiStats.ratio)).toBe('1.9');
    commit(input('buy-day'), '1');
    expect(text()).toContain('Tỉ số cạnh tranh của kế hoạch này: 10.');
    click(radio('plan', 'never'));
    expect(text()).toContain('Tỉ số cạnh tranh của kế hoạch này: không bị chặn.');
  });

  it('races LRU, FIFO and OPT on a paging sequence', () => {
    render();
    click(radio('mode', 'paging'));
    expect(text()).toContain('12 yêu cầu và một cache chứa 3 trang.');
    click(button('Đến bước cuối'));
    expect(stat(m.pagingStats.lru)).toBe('10');
    expect(stat(m.pagingStats.fifo)).toBe('9');
    expect(stat(m.pagingStats.opt)).toBe('7');
    commit(input('cache'), '4');
    click(button('Đến bước cuối'));
    expect(stat(m.pagingStats.fifo)).toBe('10');
    commit(input('cache'), '3');
    click(buttonByText(m.presets.loop));
    expect(input('requests').value).toBe('ABCDABCDABCD');
    click(button('Đến bước cuối'));
    expect(stat(m.pagingStats.lru)).toBe('12');
    expect(stat(m.pagingStats.opt)).toBe('6');
  });

  it('steps through requests and refuses a bad sequence', () => {
    render();
    click(radio('mode', 'paging'));
    for (let i = 0; i < 4; i++) click(button('Bước tiếp'));
    expect(text()).toContain(
      'Yêu cầu 4, trang D: LRU lỗi trang và đẩy A ra; FIFO lỗi trang và đẩy A ra; OPT lỗi trang và đẩy C ra.',
    );
    commit(input('requests'), 'ab1');
    expect(text()).toContain(m.notices.format);
    expect(input('requests').value).toBe('ABCDABEABCDE');
    commit(input('requests'), 'abab');
    click(button('Đến bước cuối'));
    expect(stat(m.pagingStats.opt)).toBe('2');
  });

  it('checks answers in the practice block', () => {
    render();
    const q = question(0);
    answer(q, '2');
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '1.9');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
