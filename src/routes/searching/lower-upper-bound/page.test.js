// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
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

const text = () => document.body.textContent ?? '';
const targetInput = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {number} i */
const cell = (i) => /** @type {HTMLElement} */ (document.querySelector(`[data-index="${i}"]`));

describe('lower and upper bound lesson', () => {
  it('lower bound ends at 8 and shades the four copies', () => {
    render();
    click(button('Last step'));
    expect(text()).toContain('Lower bound of 17 is 8.');
    expect(text()).toContain('4 copies of 17');
    for (let i = 8; i <= 11; i++) expect(cell(i).className).toContain('bg-state-sorted');
    expect(cell(7).className).not.toContain('bg-state-sorted');
    expect(cell(12).className).not.toContain('bg-state-sorted');
  });

  it('switching to upper bound changes the test and the answer, not the count', () => {
    render();
    click(/** @type {HTMLElement} */ (document.querySelector('input[value="upper"]')));
    expect(text()).toContain('if a[mid] <= x:');
    click(button('Last step'));
    expect(text()).toContain('Upper bound of 17 is 12.');
    expect(text()).toContain('4 copies of 17');
  });

  it('a target above every value gives n and no copies', () => {
    render();
    commit(targetInput(), '99');
    click(button('Last step'));
    expect(text()).toContain('Lower bound of 99 is 15.');
    expect(text()).toContain('0 copies of 99');
  });

  it('ignores a target the learner is still typing', () => {
    render();
    const input = targetInput();
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    click(button('Last step'));
    expect(text()).toContain('Lower bound of 17 is 8.');
  });

  it('keeps the last target when the field is cleared', () => {
    render();
    commit(targetInput(), '');
    expect(text()).toContain('bound of 17');
    expect(text()).not.toContain('null');
  });

  it('shows a placeholder for the result until the search ends', () => {
    render();
    expect(text()).toContain('—');
    expect(text()).not.toContain('copies of 17');
    click(button('Last step'));
    expect(text()).toContain('copies of 17');
  });
});
