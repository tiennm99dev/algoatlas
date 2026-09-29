// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
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
  vi.useRealTimers();
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

const text = () => document.body.textContent ?? '';
const field = (/** @type {string} */ selector) =>
  /** @type {HTMLInputElement} */ (document.querySelector(selector));

/** Jump to the final frame by stepping. */
function toEnd() {
  const next = button('Last step');
  click(next);
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent === label);
  return dt?.nextElementSibling?.textContent;
}

describe('hash table lesson', () => {
  it('ends with the inserts done and the table grown to 23', () => {
    render();
    toEnd();
    expect(text()).toContain('Inserted 10 keys into 23 buckets.');
    expect(stat('Table size')).toBe('23');
  });

  it('switching to multiplication resets and shows its formula', () => {
    render();
    toEnd();
    click(field('input[value="multiply"]'));
    expect(text()).toMatch(/Step 1 of/);
    expect(text()).toContain('frac(k');
    toEnd();
    expect(text()).toContain('into 16 buckets');
  });

  it('multiples of 8 pile up under a power of two and spread under a prime', () => {
    render();
    commit(field('select[name="preset"]'), 'multiples-of-8');
    click(field('input[value="mod-pow2"]'));
    toEnd();
    expect(stat('Longest chain')).toBe('5');
    click(field('input[value="mod-prime"]'));
    toEnd();
    expect(stat('Longest chain')).toBe('1');
  });

  it('seeks to a missing-key search and reports the whole chain', () => {
    render();
    commit(field('input[type="number"]'), '62');
    click(buttonByText('Search'));
    expect(text()).toContain('Search 62: hash to bucket 16.');
    toEnd();
    expect(text()).toContain('62 is not in chain 16: 2 comparisons.');
  });

  it('stops a search hit at the key’s position', () => {
    render();
    commit(field('input[type="number"]'), '39');
    click(buttonByText('Search'));
    toEnd();
    expect(text()).toContain('Found 39 at position 0 of chain 16 after 1 comparison.');
  });

  it('keeps the last valid keys when custom text is invalid', () => {
    render();
    commit(field('select[name="preset"]'), 'custom');
    const before = text().match(/Step \d+ of \d+/)?.[0];
    commit(field('input[type="text"]'), '5, -3');
    expect(text()).toContain('Keys must be whole numbers from 0 to 999.');
    expect(text().match(/Step \d+ of \d+/)?.[0]).toBe(before);
    expect(field('input[type="text"]').value).toBe('12, 44, 13, 88, 23, 94, 11, 39, 20, 16');
  });

  it('shows a refusal in the narration and drops it after the next step', () => {
    render();
    commit(field('select[name="preset"]'), 'custom');
    commit(field('input[type="text"]'), '5, -3');
    expect(document.querySelector('[role="alert"]')).toBeNull();
    const narration = document.querySelector('p[aria-live]');
    expect(narration?.textContent).toContain('Keys must be whole numbers from 0 to 999.');
    click(button('Next step'));
    expect(document.querySelector('p[aria-live]')?.textContent).not.toContain('Keys must be');
  });

  it('confirms new keys in the narration', () => {
    render();
    click(buttonByText('New keys'));
    expect(document.querySelector('p[aria-live]')?.textContent).toContain('New keys loaded.');
  });

  it('keeps the last valid search key when the entry is invalid', () => {
    render();
    const input = field('input[type="number"]');
    commit(input, '1500');
    expect(input.value).toBe('62');
    expect(text()).toContain('Keys must be whole numbers from 0 to 999.');
    commit(input, '39');
    commit(input, '');
    expect(input.value).toBe('39');
    click(buttonByText('Search'));
    expect(text()).toContain('Search 39: hash to bucket');
  });

  it('draws the hit chip at the end of a long colliding chain', () => {
    render();
    commit(field('select[name="preset"]'), 'custom');
    const keys = Array.from({ length: 22 }, (_, i) => i * 47);
    commit(field('input[type="text"]'), keys.join(', '));
    commit(field('input[type="number"]'), '987');
    click(buttonByText('Search'));
    toEnd();
    expect(text()).toContain('Found 987 at position 21');
    const hit = [...document.querySelectorAll('ol[aria-label="Buckets"] span.sr-only')].find((e) =>
      e.textContent?.includes('found'),
    );
    expect(hit?.parentElement?.textContent).toContain('987');
  });

  it('runs the search when Enter submits the search field', () => {
    render();
    const input = field('input[type="number"]');
    commit(input, '39');
    input.form?.requestSubmit();
    flushSync();
    expect(text()).toContain('Search 39: hash to bucket');
  });

  it('says a search was cleared when the hash function changes', () => {
    render();
    click(buttonByText('Search'));
    expect(text()).toContain('Search 62: hash to bucket');
    click(field('input[value="mod-pow2"]'));
    expect(document.querySelector('p[aria-live]')?.textContent).toContain(
      'The search was cleared because the table changed.',
    );
    expect(text()).toMatch(/Step 1 of/);
  });

  it('gives each bucket index a spoken Bucket prefix', () => {
    render();
    const first = document.querySelector('ol[aria-label="Buckets"] li');
    expect(first?.querySelector('span.sr-only')?.textContent).toBe('Bucket ');
    expect(first?.textContent).toMatch(/^Bucket 0/);
  });
});
