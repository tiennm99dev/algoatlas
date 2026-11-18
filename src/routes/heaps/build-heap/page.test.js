// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { buildHeapTrace } from '$lib/algo-engine/build-heap.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { vi as m } from '$lib/lessons/build-heap/copy.vi.js';

const INITIAL = [53, 21, 87, 9, 64, 38, 75, 12, 46, 95, 30, 68, 5, 81, 17];

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
const valuesInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="values"]'));
const arrayLabel = () =>
  document.querySelector('svg[aria-label^="Mảng:"]')?.getAttribute('aria-label') ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();

describe('build heap lesson', () => {
  it('starts bottom-up at the last parent', () => {
    render();
    expect(text()).toContain('Các ô từ 7 đến 14 là lá');
    click(button('Bước tiếp'));
    expect(text()).toContain('Vun xuống ô 6 (75). Hai cây con của nó đều đã là heap.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Các con của ô 6: 81 và 17. Con nhỏ hơn là 17 ở ô 14.');
  });

  it('ends with a min-heap and the per-level table filled', () => {
    render();
    click(button('Đến bước cuối'));
    const last = buildHeapTrace(INITIAL).at(-1);
    expect(arrayLabel()).toBe(`Mảng: ${last?.values.join(', ')}.`);
    expect(text()).toContain(`Mảng đã là một min-heap sau ${last?.swaps} lần đổi chỗ`);
    const table = [...document.querySelectorAll('table')].find((t) =>
      t.textContent?.includes(m.levelHead[2]),
    );
    const row = [...(table?.querySelectorAll('tbody tr') ?? [])].at(-1);
    const total = [...(row?.children ?? [])].map((c) => c.textContent?.trim()).join('|');
    // 15 nodes, bound 1·3 + 2·2 + 4·1 = 11.
    expect(total).toBe(`${m.totalRow}|15||11|${last?.swaps}`);
  });

  it('switches to one-by-one inserts and compares totals', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="one-by-one"]')));
    expect(text()).toContain('Riêng ô 0 đã là một heap.');
    click(button('Bước tiếp'));
    expect(text()).toContain('Chèn ô 1 (21) vào heap gồm các ô 0 đến 0');
    const oneByOne = buildHeapTrace(INITIAL, 'one-by-one').at(-1)?.swaps;
    expect(statValue(m.stats.oneByOne(15))).toBe(String(oneByOne));
    expect(text()).toContain(m.waitingLegend);
  });

  it('loads typed values and refuses bad ones', () => {
    render();
    commit(valuesInput(), '9, 4, 7, 1, 8, 2, 6');
    click(button('Đến bước cuối'));
    expect(arrayLabel()).toBe('Mảng: 1, 4, 2, 9, 8, 7, 6.');
    commit(valuesInput(), '9, 4, 300');
    expect(text()).toContain(m.valueErrors.range);
    expect(valuesInput().value).toBe('9, 4, 7, 1, 8, 2, 6');
  });

  it('loads the descending worst case at size 31', () => {
    render();
    commit(
      /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]')),
      'descending',
    );
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select[name="size"]')), '31');
    expect(text()).toContain(m.newArrayNotice);
    expect(valuesInput().value.split(', ')).toHaveLength(31);
    expect(statValue(m.stats.bottomUp(31))).toBe('26');
    expect(statValue(m.stats.oneByOne(31))).toBe('98');
  });

  it('draws a fresh array with the New array button', () => {
    render();
    click(buttonByText(m.newArrayButton));
    expect(text()).toContain(m.newArrayNotice);
    expect(valuesInput().value.split(', ')).toHaveLength(15);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(text()).toContain('Vun xuống ô 6 (75)');
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
    answer.value = '10';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Chưa đúng');
    click(buttonByText('Xem gợi ý'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
