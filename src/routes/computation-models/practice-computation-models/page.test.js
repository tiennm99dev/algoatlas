// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-computation-models/copy.vi.js';

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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const field = (name) =>
  /** @type {HTMLInputElement | HTMLSelectElement} */ (document.querySelector(`[name="${name}"]`));
/** @param {string} id */
const row = (id) => document.querySelector(`li[data-candidate="${id}"]`)?.textContent ?? '';
/** @param {string} id */
const result = (id) => document.querySelector(`li[data-result="${id}"]`)?.textContent ?? '';

/** @param {number} i */
function question(i) {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  return /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[i]);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const input = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('practice: choosing a model lesson', () => {
  it('costs every algorithm on the first card step by step', () => {
    render();
    expect(text()).toContain('Tính tổng một mảng lớn: Cộng n số');
    expect(row('loop')).toContain(m.costPending);
    click(button('Bước tiếp'));
    expect(text()).toContain('Đúng mô hình: Song song (work và span).');
    click(button('Bước tiếp'));
    expect(row('loop')).toContain('1048575 bước');
    click(button('Đến bước cuối'));
    expect(row('chunks')).toContain('131074 bước');
    expect(row('chunks')).toContain(m.bestMark);
    expect(text()).toContain('Thuật toán bạn chọn không phải rẻ nhất ở đây.');
  });

  it('records a right match and a wrong one', () => {
    render();
    commit(field('algorithm'), 'chunks');
    click(buttonByText(m.check));
    expect(text()).toContain('Cách ghép của bạn đúng rồi.');
    expect(text()).toContain(m.score(1, 6));
    expect(result('sum')).toContain('đã ghép đúng');
    commit(field('card'), 'webCache');
    commit(field('model'), 'external');
    commit(field('algorithm'), 'lru');
    click(buttonByText(m.check));
    expect(text()).toContain('Thuật toán bạn chọn đúng, nhưng hãy xem lại mô hình.');
    expect(result('webCache')).toContain('chưa đúng');
    expect(text()).toContain(m.score(1, 6));
  });

  it('changes the cheapest algorithm when the card’s numbers move', () => {
    render();
    commit(field('card'), 'sort');
    commit(field('p'), '1');
    click(buttonByText(m.check));
    expect(row('serial')).toContain(m.bestMark);
    expect(row('serial')).toContain('20971520 bước');
    commit(field('p'), '16');
    click(button('Đến bước cuối'));
    expect(row('parallelMerge')).toContain('1318720 bước');
    expect(row('parallelMerge')).toContain(m.bestMark);
  });

  it('shows a tie when the cache is not tall', () => {
    render();
    commit(field('card'), 'transpose');
    commit(field('model'), 'external');
    commit(field('logB'), '8');
    click(buttonByText(m.check));
    expect(row('rows')).toContain('16842752 lần chuyển khối');
    expect(text()).toContain('(hoà nhau)');
  });

  it('checks answers in the practice block', () => {
    render();
    const q = question(0);
    answer(q, '131092');
    expect(q.textContent).toContain('Chưa đúng');
    click(
      /** @type {HTMLElement} */ (
        [...q.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Xem gợi ý')
      ),
    );
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '131074');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
