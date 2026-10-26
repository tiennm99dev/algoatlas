// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { buildHeapTrace } from '$lib/algo-engine/build-heap.js';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/build-heap/copy.en.js';

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
  document.querySelector('svg[aria-label^="Array:"]')?.getAttribute('aria-label') ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();

describe('build heap lesson', () => {
  it('starts bottom-up at the last parent', () => {
    render();
    expect(text()).toContain('Slots 7 to 14 are leaves');
    click(button('Next step'));
    expect(text()).toContain('Sift down slot 6 (75). Both of its subtrees are already heaps.');
    click(button('Next step'));
    expect(text()).toContain('Children of slot 6: 81 and 17. The smaller is 17 at slot 14.');
  });

  it('ends with a min-heap and the per-level table filled', () => {
    render();
    click(button('Last step'));
    const last = buildHeapTrace(INITIAL).at(-1);
    expect(arrayLabel()).toBe(`Array: ${last?.values.join(', ')}.`);
    expect(text()).toContain(`The array is a min-heap after ${last?.swaps} swaps`);
    const table = [...document.querySelectorAll('table')].find((t) =>
      t.textContent?.includes(m.levelHead[2]),
    );
    const row = [...(table?.querySelectorAll('tbody tr') ?? [])].at(-1);
    const total = [...(row?.children ?? [])].map((c) => c.textContent?.trim()).join('|');
    // 15 nodes, bound 1·3 + 2·2 + 4·1 = 11.
    expect(total).toBe(`Total|15||11|${last?.swaps}`);
  });

  it('switches to one-by-one inserts and compares totals', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="one-by-one"]')));
    expect(text()).toContain('Slot 0 alone is a heap.');
    click(button('Next step'));
    expect(text()).toContain('Insert slot 1 (21) into the heap of slots 0 to 0');
    const oneByOne = buildHeapTrace(INITIAL, 'one-by-one').at(-1)?.swaps;
    expect(statValue(m.stats.oneByOne(15))).toBe(String(oneByOne));
    expect(text()).toContain(m.waitingLegend);
  });

  it('loads typed values and refuses bad ones', () => {
    render();
    commit(valuesInput(), '9, 4, 7, 1, 8, 2, 6');
    click(button('Last step'));
    expect(arrayLabel()).toBe('Array: 1, 4, 2, 9, 8, 7, 6.');
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
    expect(text()).toContain('Sift down slot 6 (75)');
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
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '9';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
