// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { medianTrace } from '$lib/algo-engine/practice-heaps.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/practice-heaps/copy.vi.js';

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
/** @param {string} prefix */
const svgLabel = (prefix) =>
  document.querySelector(`svg[aria-label^="${prefix}"]`)?.getAttribute('aria-label') ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
const closest = () =>
  click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="closest"]')));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('practice heaps lesson', () => {
  it('splits the stream into two halves and reports the median', () => {
    render();
    expect(text()).toContain('low là max-heap chứa nửa nhỏ hơn');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('low đang rỗng, nên 5 vào low.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Số lượng lẻ: trung vị là đỉnh của low, 5.');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('15 > đỉnh của low là 5, nên nó thuộc nửa lớn hơn');
    click(button('Bước tiếp'));
    expect(text()).toContain('Số lượng chẵn: trung vị là (5 + 15) / 2 = 10.');
  });

  it('ends with the running medians', () => {
    render();
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.median)).toBe('7');
    const last = medianTrace([5, 15, 1, 3, 8, 7, 9, 10, 2]).at(-1);
    expect(last?.medians).toEqual([5, 10, 5, 4, 5, 6, 7, 7.5, 7]);
    const chips = document.body.textContent?.split(m.mediansTitle)[1] ?? '';
    expect(chips).toContain('7.5');
    expect(svgLabel('Nửa dưới')).toBe(`Nửa dưới, max-heap: ${last?.low.join(', ')}.`);
    expect(svgLabel('Nửa trên')).toBe(`Nửa trên, min-heap: ${last?.high.join(', ')}.`);
  });

  it('loads a typed stream and refuses bad ones', () => {
    render();
    commit(input('stream'), '1, 2, 3, 4, 5');
    click(button('Đến bước cuối'));
    expect(statValue(m.stats.moves)).toBe('2');
    expect(statValue(m.stats.median)).toBe('3');
    commit(input('stream'), '1, 200');
    expect(text()).toContain(m.streamErrors.range);
    expect(input('stream').value).toBe('1, 2, 3, 4, 5');
  });

  it('finds the k closest points', () => {
    render();
    closest();
    expect(text()).toContain('Giữ 3 điểm gần nhất trong một max-heap');
    click(button('Bước tiếp'));
    expect(text()).toContain('Đọc A (1, 2): khoảng cách² = 1² + 2² = 5.');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(text()).toContain('Đọc C (-2, -2): khoảng cách² = (-2)² + (-2)² = 8.');
    click(button('Đến bước cuối'));
    expect(text()).toContain('3 điểm gần nhất: D, G, A.');
    expect(svgLabel('Các điểm:')).toContain('A (1, 2)');
  });

  it('changes k, refuses bad points and a bad k', () => {
    render();
    closest();
    commit(input('k'), '1');
    click(button('Đến bước cuối'));
    expect(text()).toContain('1 điểm gần nhất: D.');
    commit(input('k'), '0');
    expect(text()).toContain(m.kError);
    commit(input('points'), '(1, 2) (1, 2)');
    expect(text()).toContain(m.pointErrors.duplicate);
    commit(input('points'), '(3, 4) (0, 2)');
    click(button('Đến bước cuối'));
    expect(text()).toContain('1 điểm gần nhất: B.');
  });

  it('loads new input', () => {
    render();
    click(buttonByText(m.newInputButton));
    expect(text()).toContain(m.newInputNotice);
    expect(input('stream').value.split(', ')).toHaveLength(9);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(text()).toContain('Đọc 5.');
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '5');
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '4');
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
