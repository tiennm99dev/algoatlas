// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import SortPage from './sorting/bubble-insertion-sort/+page.svelte';
import BinaryPage from './searching/binary-search/+page.svelte';
import BfsPage from './graphs/bfs-grid/+page.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Page */
function render(Page) {
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

describe('sorting lesson', () => {
  it('steps forward through the trace', () => {
    render(SortPage);
    expect(text()).toMatch(/Step 1 of \d+/);
    click(button('Next step'));
    expect(text()).toMatch(/Step 2 of \d+/);
    expect(text()).toContain('42 > 17: out of order.');
  });

  it('quiz mode blocks stepping until the comparison is answered', () => {
    render(SortPage);
    const quiz = /** @type {HTMLInputElement} */ (document.querySelector('input[type="checkbox"]'));
    click(quiz);
    click(button('Next step'));
    expect(text()).toContain('Comparing 42 and 17. Will they swap?');
    expect(button('Next step').disabled).toBe(true);

    const swap = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Swap');
    click(/** @type {HTMLButtonElement} */ (swap));
    expect(text()).toContain('Correct!');
    expect(text()).toContain('Score: 1 / 1');
    expect(button('Next step').disabled).toBe(false);
  });

  it('switching algorithm reloads the pseudocode and trace', () => {
    render(SortPage);
    const insertion = /** @type {HTMLInputElement} */ (document.querySelector('input[value="insertion"]'));
    click(insertion);
    expect(text()).toContain('key = a[i]; j = i - 1');
    expect(text()).toMatch(/Step 1 of \d+/);
  });
});

describe('binary search lesson', () => {
  it('watch mode reaches the target', () => {
    render(BinaryPage);
    click(button('Last step'));
    expect(text()).toContain('a[11] = 53. Found it after');
  });

  it('you-drive mode rules out cells and detects a hit', () => {
    render(BinaryPage);
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="drive"]')));
    click(button('Index 7, value 31'));
    expect(text()).toContain('31 < 53: everything left of here is ruled out.');
    expect(button('Index 3, value 14, ruled out').disabled).toBe(true);
    click(button('Index 11, value 53'));
    expect(text()).toMatch(/Found in 2 probes/);
  });
});

describe('bfs lesson', () => {
  it('finds the shortest path on the default grid', () => {
    render(BfsPage);
    click(button('Last step'));
    expect(text()).toMatch(/shortest path of \d+ steps/);
  });

  it('keyboard activation toggles a wall and rebuilds the trace', () => {
    render(BfsPage);
    const cell = button('Row 0, column 0');
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    flushSync();
    expect(button('Row 0, column 0, Wall')).toBeTruthy();
    expect(text()).toMatch(/Step 1 of \d+/);
  });

  it('reports no path when the goal is walled in', () => {
    render(BfsPage);
    // Goal sits at row 5, column 13; seal its four neighbors.
    for (const [r, c] of [[4, 13], [6, 13], [5, 12], [5, 14]]) {
      const cell = button(`Row ${r}, column ${c}`);
      cell.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      flushSync();
    }
    click(button('Last step'));
    expect(text()).toContain('walls cut it off');
  });
});
