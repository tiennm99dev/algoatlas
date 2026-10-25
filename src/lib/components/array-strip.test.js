// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import ArrayStrip from './array-strip.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {Record<string, any>} props */
function render(props) {
  app = mount(ArrayStrip, {
    target: document.body,
    props: /** @type {any} */ ({ values: [5, 8, 13, 21], ariaLabel: 'Sorted array', ...props }),
  });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

const svg = () => /** @type {SVGSVGElement} */ (document.querySelector('svg'));
/** @param {number} i */
const cell = (i) => /** @type {SVGGElement} */ (document.querySelector(`[data-index="${i}"]`));

/** @param {Element} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

describe('ArrayStrip', () => {
  it('is a labelled picture with pointers and windows spelled out', () => {
    render({
      pointers: [
        { name: 'lo', index: 0 },
        { name: 'hi', index: 4 },
      ],
      windows: [{ from: 1, to: 3, label: 'window' }],
    });
    expect(svg().getAttribute('role')).toBe('img');
    expect(svg().getAttribute('aria-label')).toBe(
      'Sorted array. lo at 0. hi at 4. window covers 1 to 2',
    );
    expect(document.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  it('names each cell with its index, value and state', () => {
    render({ stateOf: (/** @type {number} */ i) => (i === 2 ? 'compare' : '') });
    const titles = [...document.querySelectorAll('title')].map((t) => t.textContent);
    expect(titles).toEqual(['Index 0: 5', 'Index 1: 8', 'Index 2: 13, compared', 'Index 3: 21']);
    expect(document.querySelectorAll('rect')[2].getAttribute('class')).toContain(
      'fill-state-compare',
    );
  });

  it('widens to show a pointer one past the end', () => {
    render({ pointers: [{ name: 'end', index: 4 }] });
    const indices = [...document.querySelectorAll('text')]
      .filter((t) => t.getAttribute('font-size') === '10')
      .map((t) => t.textContent);
    expect(indices).toEqual(['0', '1', '2', '3', '4']);
  });

  it('becomes a roving-focus row of buttons with onselect', () => {
    const onselect = vi.fn();
    render({ onselect, selected: 1 });
    expect(svg().getAttribute('role')).toBe('group');
    expect(
      [...document.querySelectorAll('[role="button"]')].map((b) => b.getAttribute('tabindex')),
    ).toEqual(['-1', '0', '-1', '-1']);
    expect(cell(1).getAttribute('aria-pressed')).toBe('true');
    press(cell(1), 'ArrowRight');
    expect(document.activeElement).toBe(cell(2));
    expect(cell(2).getAttribute('tabindex')).toBe('0');
    press(cell(2), 'End');
    expect(document.activeElement).toBe(cell(3));
    press(cell(3), 'Enter');
    expect(onselect).toHaveBeenLastCalledWith(3);
    press(cell(3), 'Home');
    press(cell(0), ' ');
    expect(onselect).toHaveBeenLastCalledWith(0);
    cell(2).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onselect).toHaveBeenLastCalledWith(2);
  });
});
