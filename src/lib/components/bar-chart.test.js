// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import BarChart from './bar-chart.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {Record<string, any>} props */
function render(props) {
  app = mount(BarChart, { target: document.body, props: /** @type {any} */ (props) });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

/** @param {number} n */
const makeItems = (n) => Array.from({ length: n }, (_, i) => ({ id: i, value: i + 1 }));

const base = { stateOf: () => 'bg-slate-400', ariaLabel: 'bars', speed: 1 };

/** Columns of the main row. */
const columns = () => [...document.querySelectorAll('[aria-label="bars"] > div')];

describe('BarChart', () => {
  it('renders one column per item with value labels', () => {
    render({ ...base, items: makeItems(5) });
    expect(columns()).toHaveLength(5);
    expect(columns().map((c) => c.firstElementChild?.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
  });

  it('hides value labels above 20 items', () => {
    render({ ...base, items: makeItems(21), markerOf: () => 'X' });
    expect(columns()).toHaveLength(21);
    expect(document.body.textContent?.trim()).toBe('');
  });

  it('dims only the columns the callback selects', () => {
    render({ ...base, items: makeItems(4), dimmed: (/** @type {number} */ i) => i % 2 === 1 });
    expect(columns().map((c) => c.classList.contains('opacity-40'))).toEqual([
      false,
      true,
      false,
      true,
    ]);
  });

  it('draws an aux row with an empty column for null slots', () => {
    render({
      ...base,
      items: makeItems(3),
      aux: [{ id: 9, value: 3 }, null, null],
      auxLabel: 'buffer',
    });
    const aux = document.querySelector('[aria-label="buffer"]');
    expect(aux?.getAttribute('role')).toBe('img');
    expect(aux?.children).toHaveLength(3);
    const bars = [...(aux?.children ?? [])].map((c) => c.querySelectorAll('.rounded-t').length);
    expect(bars).toEqual([1, 0, 0]);
  });

  it('omits the aux row by default', () => {
    render({ ...base, items: makeItems(3) });
    expect(document.querySelectorAll('[role="img"]')).toHaveLength(1);
  });

  it('shows the marker under the right bar', () => {
    render({
      ...base,
      items: makeItems(3),
      markerOf: (/** @type {number} */ i) => (i === 1 ? '<>' : ''),
    });
    expect(columns().map((c) => c.lastElementChild?.textContent)).toEqual(['', '<>', '']);
  });
});
