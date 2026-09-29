// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { mergeSortTrace } from '$lib/algo-engine/merge-quick-sort.js';
import { toItems } from '$lib/algo-engine/sorting.js';

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

  it('offers the pivot rule only for quicksort', () => {
    render();
    expect(document.querySelector('select[name="pivot"]')).toBeNull();
    pickAlgo('quick');
    expect(document.querySelector('select[name="pivot"]')).not.toBeNull();
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
    expect(text()).toContain('equal values kept their order');
  });

  it('shows the merge buffer once a merge starts', () => {
    render();
    expect(document.querySelector('[aria-label^="Buffer:"]')).toBeNull();
    const copy = mergeSortTrace(toItems(INITIAL)).findIndex((f) => f.kind === 'copy');
    seek(copy);
    expect(document.querySelector('[aria-label^="Buffer:"]')).not.toBeNull();
  });
});
