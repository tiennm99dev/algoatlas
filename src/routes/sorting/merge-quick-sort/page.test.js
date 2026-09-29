// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { mergeSortTrace, quickSortTrace } from '$lib/algo-engine/merge-quick-sort.js';
import { makeArray, toItems } from '$lib/algo-engine/sorting.js';

const INITIAL = [42, 17, 88, 5, 63, 29, 71, 12, 95, 36, 54, 24];

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

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {string} value */
function pickAlgo(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

/** @param {string} selector @param {string} value */
function choose(selector, value) {
  const el = /** @type {HTMLSelectElement} */ (document.querySelector(selector));
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

const text = () => document.body.textContent ?? '';
const scrub = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Step"]'));

/** @param {number} index */
function seek(index) {
  const el = scrub();
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

describe('merge and quick sort lesson', () => {
  it('splits the whole array on the first step', () => {
    render();
    click(button('Next step'));
    expect(text()).toContain('Split [0–11] at 5');
  });

  it('switches between the two algorithms and their pseudocode', () => {
    render();
    pickAlgo('quick');
    expect(text()).toContain('i = lo - 1');
    expect(text()).toContain('Ranges still to sort');
    pickAlgo('merge');
    expect(text()).toContain('aux = copy of a[lo..hi]');
    expect(text()).toContain('Call stack (outermost first)');
  });

  it('keeps the pivot rule in place but enabled only for quicksort', () => {
    render();
    const pivot = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="pivot"]'));
    expect(pivot.disabled).toBe(true);
    pickAlgo('quick');
    expect(pivot.disabled).toBe(false);
  });

  it('names the write action per algorithm in the legend', () => {
    render();
    expect(text()).toContain('Writing to the array');
    pickAlgo('quick');
    expect(text()).toContain('Swapping');
    expect(text()).not.toContain('Writing to the array');
  });

  it('caps the size slider where every buffer marker still fits', () => {
    render();
    const range = /** @type {HTMLInputElement} */ (document.querySelector('input[type="range"]'));
    expect(range.max).toBe('20');
  });

  it('finishes sorted with the totals in the narration', () => {
    render();
    click(button('Last step'));
    expect(text()).toMatch(/Sorted with \d+ comparisons and \d+ writes\./);
    expect(document.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain(
      '12 of 12 sorted',
    );
  });

  it('lists the total cost of both algorithms', () => {
    render();
    expect(text()).toMatch(/Merge sort\s*\d+ comparisons · \d+ writes/);
    expect(text()).toMatch(/Quicksort\s*\d+ comparisons · \d+ swaps/);
    expect(text()).toContain('no equal values on this array');
  });

  it('claims stability only when the array has equal values', () => {
    render();
    expect(text()).not.toContain('equal values kept their order');
    expect(text()).not.toContain('equal values were reordered');
    const preset = /** @type {HTMLSelectElement} */ (document.querySelector('select.field'));
    preset.value = 'few-unique';
    preset.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(text()).toContain('equal values kept their order');
  });

  it('keeps the buffer row mounted from the first frame while merge sort is selected', () => {
    render();
    const row = document.querySelector('[aria-label^="Buffer:"]');
    expect(row).not.toBeNull();
    expect(row?.getAttribute('aria-label')).toBe('Buffer: empty.');
    pickAlgo('quick');
    expect(document.querySelector('[aria-label^="Buffer:"]')).toBeNull();
  });

  it('captions the buffer row during a merge', () => {
    render();
    const copy = mergeSortTrace(toItems(INITIAL)).findIndex((f) => f.kind === 'copy');
    seek(copy);
    expect(text()).toContain('Buffer: a copy of the range being merged.');
    pickAlgo('quick');
    expect(text()).not.toContain('Buffer: a copy of the range being merged.');
  });

  it('shows the merge buffer contents once a merge starts', () => {
    render();
    const copy = mergeSortTrace(toItems(INITIAL)).findIndex((f) => f.kind === 'copy');
    seek(copy);
    expect(document.querySelector('[aria-label^="Buffer:"]')).not.toBeNull();
  });

  it('marks merged runs and the buffer head and taken slots with text', () => {
    render();
    const trace = mergeSortTrace(toItems(INITIAL));
    const runFrame = trace.findIndex((f) => f.runs.length > 0 && f.kind !== 'take');
    seek(runFrame);
    const chart = document.querySelector('[role="img"]');
    expect(chart?.textContent).toContain('▬');
    expect(chart?.getAttribute('aria-label')).toMatch(/Working on \[\d+–\d+\]\./);
    expect(text()).toContain('▬ Merged run');

    // A take frame after the first slot is written has a head and a taken slot in the buffer.
    const take = trace.findIndex(
      (f) => f.kind === 'take' && f.range && f.range[1] - f.range[0] >= 3 && f.k === f.range[0] + 1,
    );
    seek(take);
    const buffer = document.querySelector('[aria-label^="Buffer:"]');
    expect(buffer?.textContent).toContain('↑');
    expect(buffer?.textContent).toContain('✕');
    expect(buffer?.getAttribute('aria-label')).toMatch(/2 taken\. Next from the/);
  });

  it('shows the pivot pre-swap as a write on the pivot frame', () => {
    render();
    pickAlgo('quick');
    const preset = /** @type {HTMLSelectElement} */ (
      document.querySelector('select[name="pivot"]')
    );
    preset.value = 'median3';
    preset.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    // Median-of-three on a fresh trace differs per array, so find the frame from what is drawn.
    const last = /** @type {HTMLInputElement} */ (
      document.querySelector('input[aria-label="Step"]')
    );
    const frames = Number(last.max) + 1;
    let seen = false;
    for (let i = 0; i < frames && !seen; i++) {
      seek(i);
      if (text().includes('Move the chosen pivot to the end')) {
        const chart = document.querySelector('[aria-label^="Array:"]');
        expect((chart?.textContent?.match(/⇄/g) ?? []).length).toBe(2);
        seen = true;
      }
    }
    expect(seen).toBe(true);
  });

  it('loads an ascending array for the sorted preset, so last-pivot quicksort recurses once per element', () => {
    render();
    choose('select.field', 'sorted');
    const expected = makeArray('sorted', 12);
    expect(document.querySelector('[aria-label^="Array:"]')?.getAttribute('aria-label')).toContain(
      `Array: ${expected.join(', ')}.`,
    );
    pickAlgo('quick');
    click(button('Last step'));
    expect(text()).toContain('(max 11, balanced ≈ 4)');
  });

  it('draws the quicksort low side with the run marker during a scan', () => {
    render();
    pickAlgo('quick');
    const trace = quickSortTrace(toItems(INITIAL), 'last', Math.random);
    const scan = trace.findIndex((f) => f.kind === 'scan' && f.range && f.i >= f.range[0]);
    expect(scan).toBeGreaterThan(0);
    const before = trace.findIndex((f) => f.kind === 'scan');
    seek(before);
    expect(document.querySelector('[aria-label^="Array:"]')?.textContent).not.toContain('▬');
    seek(scan);
    expect(document.querySelector('[aria-label^="Array:"]')?.textContent).toContain('▬');
    expect(text()).toContain('▬ ≤ pivot, low side');
  });

  it('states the stability verdict in the done narration', () => {
    render();
    click(button('Last step'));
    expect(text()).not.toContain('Equal values');
    choose('select.field', 'few-unique');
    click(button('Last step'));
    expect(text()).toMatch(/writes\. Equal values kept their order\./);
    pickAlgo('quick');
    click(button('Last step'));
    const narration = text();
    const reordered = narration.match(
      /Equal values were reordered: \d+ \(originally \d+\w\w\) now follows/,
    );
    const kept = narration.includes('Equal values kept their order.');
    expect(reordered !== null || kept).toBe(true);
  });

  it('announces a rebuild caused by the preset, size, or pivot rule', () => {
    render();
    choose('select.field', 'reversed');
    expect(text()).toContain('New array loaded.');
    click(button('Next step'));
    const range = /** @type {HTMLInputElement} */ (document.querySelector('input[type="range"]'));
    range.value = '8';
    range.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(text()).toContain('New array loaded.');
    pickAlgo('quick');
    choose('select[name="pivot"]', 'median3');
    expect(text()).toContain('Pivot rule: Median of three. Both traces rebuilt.');
  });

  it('confirms a new array in the narration and drops it on the next frame', () => {
    render();
    click(buttonByText('New array'));
    expect(text()).toContain('New array loaded.');
    click(button('Next step'));
    expect(text()).not.toContain('New array loaded.');
  });
});
