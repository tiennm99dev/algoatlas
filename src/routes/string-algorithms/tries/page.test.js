// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/tries/copy.vi.js';
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

/** Type without leaving the field. @param {HTMLInputElement} el @param {string} value */
function type(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const wordField = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="word"]'));
const presetField = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
/** @param {string} label */
const node = (label) => {
  const el = document.querySelector(`g[aria-label^="${label}"]`);
  if (!el) throw new Error(`no node ${label}`);
  return /** @type {SVGGElement} */ (el);
};
const toLast = () => click(button('Đến bước cuối'));
const chipsOf = (/** @type {string} */ title) => {
  const card = [...document.querySelectorAll('h2')].find((h) => h.textContent === title);
  return [...(card?.parentElement?.querySelectorAll('li') ?? [])].map((li) =>
    li.textContent?.trim(),
  );
};

describe('tries lesson', () => {
  it('opens on the finished preset with the typed word lit, and rewinds to the empty root', () => {
    render();
    expect(stat('nodes')).toBe('10');
    expect(node('Tiền tố car,').getAttribute('aria-label')).toContain('khớp với chữ bạn gõ');
    expect(chipsOf(m.resultsTitle)).toEqual(['car', 'card', 'care']);
    click(button('Về bước đầu'));
    expect(narration()).toBe('Ban đầu trie chỉ có một gốc rỗng.');
    expect(stat('nodes')).toBe('0');
    click(button('Bước tiếp'));
    expect(narration()).toBe('Chèn car: bắt đầu từ gốc.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Chưa có nút con cho c, nên ta tạo một nút');
    toLast();
    expect(stat('words')).toBe('6');
    expect(stat('letters')).toBe('20');
    expect(stat('nodes')).toBe('10');
    expect(document.body.textContent).toContain('Dùng chung tiền tố tiết kiệm được 10 nút');
  });

  it('inserts a word and shows only the new letters being created', () => {
    render();
    commit(wordField(), 'cart');
    click(buttonByText(m.insert));
    expect(narration()).toBe('Chèn cart: bắt đầu từ gốc.');
    click(button('Bước tiếp'));
    expect(narration()).toContain('Chữ c đã có nút');
    toLast();
    expect(stat('words')).toBe('7');
    expect(stat('nodes')).toBe('11');
  });

  it('tells a stored word from a prefix when searching', () => {
    render();
    commit(wordField(), 'ca');
    click(buttonByText(m.search));
    toLast();
    click(button('Bước trước'));
    expect(narration()).toContain('ca chỉ là tiền tố của những từ dài hơn');
    commit(wordField(), 'cat');
    click(buttonByText(m.search));
    toLast();
    click(button('Bước trước'));
    expect(narration()).toContain('cat đã được lưu');
    commit(wordField(), 'cow');
    click(buttonByText(m.search));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(narration()).toContain('Không có nút con cho o');
  });

  it('autocompletes a prefix into a sorted list of chips', () => {
    render();
    commit(wordField(), 'ca');
    click(buttonByText(m.complete));
    toLast();
    click(button('Bước trước'));
    expect(narration()).toBe('Tự động hoàn thành tìm được 4 từ sau khi đi qua 6 nút.');
    expect(chipsOf(m.resultsTitle)).toEqual(['car', 'card', 'care', 'cat']);
  });

  it('never claims a negative saving or an empty word list while a word is going in', () => {
    render();
    click(button('Về bước đầu'));
    for (let i = 0; i < 40; i++) {
      click(button('Bước tiếp'));
      expect(document.body.textContent).not.toMatch(/được -/);
      expect(stat('live')).not.toContain('Có 0 từ');
    }
    toLast();
    expect(document.body.textContent).toContain('Dùng chung tiền tố tiết kiệm được 10 nút');
  });

  it('follows typed letters live, before any operation runs', () => {
    render();
    toLast();
    type(wordField(), 'do');
    expect(stat('live')).toBe('Có 2 từ bắt đầu bằng “do”: dog, dot.');
    expect(node('Tiền tố do,').getAttribute('aria-label')).toContain('khớp với chữ bạn gõ');
    type(wordField(), 'dx');
    expect(stat('live')).toBe('“d” có trong trie, nhưng không từ nào đi tiếp bằng x.');
    type(wordField(), 'q');
    expect(stat('live')).toBe('Không có từ nào bắt đầu bằng q.');
    expect(wordField().value).toBe('q');
  });

  it('refuses a bad word, keeps the old one and blocks the click that follows', () => {
    render();
    commit(wordField(), 'c4t');
    expect(narration()).toBe(m.wordErrors(8).format);
    expect(wordField().value).toBe('car');
    click(buttonByText(m.insert));
    expect(stat('words')).not.toBe('7');
    commit(wordField(), 'abcdefghi');
    expect(narration()).toBe(m.wordErrors(8).length);
    commit(wordField(), '   ');
    expect(narration()).toBe(m.wordErrors(8).empty);
    expect(wordField().value).toBe('car');
  });

  it('undoes, resets and reloads presets', () => {
    render();
    toLast();
    const before = chipsOf(m.opsTitle).length;
    click(buttonByText(m.undo));
    expect(chipsOf(m.opsTitle).length).toBe(before - 1);
    click(buttonByText(m.reset));
    expect(stat('words')).toBe('0');
    expect(chipsOf(m.opsTitle)).toEqual([m.opsEmpty]);
    commit(presetField(), 'apart');
    expect(stat('words')).toBe('5');
    expect(stat('letters')).toBe('15');
    expect(stat('nodes')).toBe('15');
  });

  it('refuses a word past the capacity of the trie and a log past its cap', () => {
    render();
    click(buttonByText(m.reset));
    for (const w of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) {
      commit(wordField(), w);
      click(buttonByText(m.insert));
    }
    commit(wordField(), 'k');
    click(buttonByText(m.insert));
    expect(narration()).toBe(m.full(10));
    for (let i = 0; i < 10; i++) click(buttonByText(m.search));
    click(buttonByText(m.search));
    expect(narration()).toBe(m.logFull(20));
  });

  it('copies the prefix of a clicked node into the field, by pointer and keyboard', () => {
    render();
    toLast();
    node('Tiền tố car').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(wordField().value).toBe('car');
    node('Tiền tố ca,').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    flushSync();
    expect(wordField().value).toBe('ca');
    node('Gốc').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(wordField().value).toBe('ca');
  });

  it('inserts on Enter in the field', () => {
    render();
    const field = wordField();
    field.focus();
    type(field, 'zoo');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toBe('Chèn zoo: bắt đầu từ gốc.');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[0]);
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
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
