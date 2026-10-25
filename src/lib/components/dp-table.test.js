// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import DpTable from './dp-table.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {Record<string, any>} props */
function render(props) {
  app = mount(DpTable, {
    target: document.body,
    props: /** @type {any} */ ({
      values: [
        [0, 0, 0],
        [0, 1, null],
      ],
      ariaLabel: 'LCS table.',
      rowHeaders: ['', 'a'],
      colHeaders: ['', 'a', 'b'],
      ...props,
    }),
  });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

/** @param {number} r @param {number} c */
const cell = (r, c) =>
  /** @type {SVGGElement} */ (document.querySelector(`[data-cell="${r}-${c}"]`));

/** @param {Element} el @param {string} key */
function press(el, key) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

describe('DpTable', () => {
  it('labels every cell, empty ones included', () => {
    render({
      stateOf: (/** @type {number} */ r, /** @type {number} */ c) =>
        r === 1 && c === 1 ? 'active' : '',
    });
    expect(document.querySelector('svg')?.getAttribute('role')).toBe('img');
    expect([...document.querySelectorAll('title')].map((t) => t.textContent)).toEqual([
      'Row 0, column 0: 0',
      'Row 0, column 1: 0',
      'Row 0, column 2: 0',
      'Row 1, column 0: 0',
      'Row 1, column 1: 1, current',
      'Row 1, column 2: empty',
    ]);
  });

  it('draws one arrow per dependency', () => {
    render({
      arrows: [
        { from: [0, 0], to: [1, 1] },
        { from: [0, 1], to: [1, 1] },
      ],
    });
    expect(document.querySelectorAll('line[marker-end]')).toHaveLength(2);
  });

  it('moves a roving focus over the grid and picks a cell', () => {
    const onselect = vi.fn();
    render({ onselect, selected: [0, 1] });
    expect(cell(0, 1).getAttribute('tabindex')).toBe('0');
    expect(cell(0, 1).getAttribute('aria-pressed')).toBe('true');
    press(cell(0, 1), 'ArrowDown');
    expect(document.activeElement).toBe(cell(1, 1));
    press(cell(1, 1), 'ArrowDown');
    expect(document.activeElement).toBe(cell(1, 1));
    press(cell(1, 1), 'End');
    expect(document.activeElement).toBe(cell(1, 2));
    press(cell(1, 2), 'Home');
    expect(document.activeElement).toBe(cell(1, 0));
    press(cell(1, 0), ' ');
    expect(onselect).toHaveBeenLastCalledWith(1, 0);
    expect(cell(1, 0).getAttribute('tabindex')).toBe('0');
    expect(cell(0, 1).getAttribute('tabindex')).toBe('-1');
  });
});
