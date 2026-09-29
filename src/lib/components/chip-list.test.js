// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import ChipList from './chip-list.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {Record<string, any>} props */
function render(props) {
  app = mount(ChipList, {
    target: document.body,
    props: /** @type {any} */ ({ title: 'Queue', emptyText: 'empty', ...props }),
  });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

const chips = () => [...document.querySelectorAll('li')];

describe('ChipList', () => {
  it('shows the empty text when there are no items', () => {
    render({ items: [] });
    expect(chips().map((c) => c.textContent?.trim())).toEqual(['empty']);
  });

  it('renders at most limit chips plus an overflow count', () => {
    render({ items: Array.from({ length: 7 }, (_, i) => ({ label: `c${i}` })), limit: 5 });
    expect(chips().map((c) => c.textContent?.trim())).toEqual(['c0', 'c1', 'c2', 'c3', 'c4', '+2']);
  });

  it('defaults the limit to 18', () => {
    render({ items: Array.from({ length: 20 }, (_, i) => ({ label: `c${i}` })) });
    expect(chips()).toHaveLength(19);
    expect(chips().at(-1)?.textContent?.trim()).toBe('+2');
  });

  it('highlights a hot chip', () => {
    render({ items: [{ label: 'a' }, { label: 'b', hot: true }] });
    expect(chips().map((c) => c.classList.contains('bg-sky-700'))).toEqual([false, true]);
  });

  it('renders duplicate labels without a keyed-each error', () => {
    render({ items: [{ label: 'x' }, { label: 'x' }, { label: 'x', hot: true }] });
    expect(chips().map((c) => c.textContent?.trim())).toEqual(['x', 'x', 'x']);
  });
});
