// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Component */
function render(Component) {
  app = mount(Component, { target: document.body });
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

/** Keyboard activation reports detail 0, which the grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {KeyboardEventInit} init */
function key(target, init) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
  flushSync();
}

const text = () => document.body.textContent ?? '';

/** @param {string} label */
function statValue(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

describe('dfs lesson', () => {
  it('finds a long path on the default grid and compares it with BFS', () => {
    render(Page);
    click(button('Last step'));
    expect(text()).toContain('path of 54 steps');
    expect(statValue('BFS shortest path')).toBe('22');
    expect(statValue('DFS path length')).toBe('54');
  });

  it('keyboard activation toggles a wall and rebuilds the trace', () => {
    render(Page);
    keyActivate(button('Row 0, column 0'));
    expect(button('Row 0, column 0, Wall')).toBeTruthy();
    expect(text()).toMatch(/Step 1 of \d+/);
    expect(text()).toContain('Wall added at (0,0).');
  });

  it('announces visit numbers in cell labels', () => {
    render(Page);
    click(button('Last step'));
    expect(button('Row 4, column 2, Start, visit 1')).toBeTruthy();
  });

  it('narrates a push and lists it on the stack', () => {
    render(Page);
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Push (4,1): open and not visited yet.');
    const stack = [...document.querySelectorAll('ol li')].map((li) => li.textContent?.trim());
    expect(stack).toContain('(4,1)');
  });

  it('reports no path when the goal is walled in', () => {
    render(Page);
    for (const [r, c] of [
      [4, 13],
      [6, 13],
      [5, 12],
      [5, 14],
    ]) {
      keyActivate(button(`Row ${r}, column ${c}`));
    }
    click(button('Last step'));
    expect(text()).toContain('walls cut it off');
    expect(statValue('BFS shortest path')).toBe('—');
  });

  it('moves focus with the arrow keys', () => {
    render(Page);
    const startCell = button('Row 4, column 2, Start');
    startCell.focus();
    key(startCell, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(button('Row 4, column 3'));
  });
});
