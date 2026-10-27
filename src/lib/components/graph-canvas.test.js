// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import GraphCanvas from './graph-canvas.svelte';

/** @typedef {import('./graph-editor.js').Graph} Graph */

/** @type {Record<string, any> | null} */
let app = null;

/** @returns {Graph} */
const sample = () => ({
  nodes: [
    { id: 0, x: 40, y: 40, label: 'A' },
    { id: 1, x: 200, y: 40, label: 'B' },
    { id: 2, x: 120, y: 160, label: 'C' },
  ],
  edges: [{ from: 0, to: 1, weight: 3 }],
});

/** @param {Record<string, any>} props */
function render(props) {
  const g = sample();
  app = mount(GraphCanvas, {
    target: document.body,
    props: /** @type {any} */ ({ ...g, ariaLabel: 'Sample graph.', ...props }),
  });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

/** @param {number} id */
const node = (id) => /** @type {SVGGElement} */ (document.querySelector(`[data-node="${id}"]`));
const svg = () => /** @type {SVGSVGElement} */ (document.querySelector('svg'));

/** @param {Element} el @param {string} key @param {KeyboardEventInit} [init] */
async function press(el, key, init = {}) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
  flushSync();
  await Promise.resolve();
}

/** @param {string} text */
function button(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {string} value */
function pickTool(value) {
  const radio = /** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`));
  radio.click();
  flushSync();
}

describe('GraphCanvas', () => {
  it('is a labelled picture when read-only', () => {
    render({ nodeState: (/** @type {number} */ id) => (id === 1 ? 'active' : '') });
    expect(svg().getAttribute('role')).toBe('img');
    expect(svg().getAttribute('aria-label')).toBe(
      'Sample graph. Undirected graph with 3 nodes and 1 edge.',
    );
    expect([...document.querySelectorAll('title')].map((t) => t.textContent)).toEqual([
      'Node A, 1 edge',
      'Node B, 1 edge, current',
      'Node C, 0 edges',
    ]);
    expect(document.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  it('picks a node by click or keyboard with onselect', async () => {
    const onselect = vi.fn();
    render({ onselect, selected: 0 });
    expect(node(0).getAttribute('tabindex')).toBe('0');
    expect(node(1).getAttribute('tabindex')).toBe('-1');
    await press(node(0), 'ArrowRight');
    expect(document.activeElement).toBe(node(1));
    await press(node(1), 'Enter');
    expect(onselect).toHaveBeenLastCalledWith(1);
    node(2).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onselect).toHaveBeenLastCalledWith(2);
  });

  it('selects a node on a press that does not move, even when the click goes to the canvas', () => {
    const onselect = vi.fn();
    render({ editable: true, onselect });
    svg().setPointerCapture = () => {};
    const at = { bubbles: true, button: 0, clientX: 40, clientY: 40 };
    node(2).dispatchEvent(new MouseEvent('pointerdown', at));
    svg().dispatchEvent(new MouseEvent('pointerup', at));
    svg().dispatchEvent(new MouseEvent('click', at));
    flushSync();
    expect(onselect).toHaveBeenCalledTimes(1);
    expect(onselect).toHaveBeenLastCalledWith(2);
    // When the click does reach the node, the release already acted, so it is not repeated.
    node(1).dispatchEvent(new MouseEvent('pointerdown', at));
    svg().dispatchEvent(new MouseEvent('pointerup', at));
    node(1).dispatchEvent(new MouseEvent('click', at));
    flushSync();
    expect(onselect).toHaveBeenCalledTimes(2);
    expect(onselect).toHaveBeenLastCalledWith(1);
  });

  it('does not select a node that was dragged', () => {
    const onselect = vi.fn();
    render({ editable: true, onselect });
    node(2).dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 40, clientY: 40 }),
    );
    svg().dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 90, clientY: 40 }));
    svg().dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 90, clientY: 40 }));
    flushSync();
    expect(onselect).toHaveBeenCalledTimes(0);
  });

  it('adds nodes until the cap and reports each change', () => {
    const onchange = vi.fn();
    render({ editable: true, maxNodes: 4, onchange });
    click(button('Add node'));
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0].nodes).toHaveLength(4);
    expect(document.querySelectorAll('[data-node]')).toHaveLength(4);
    click(button('Add node'));
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain('The graph is full.');
  });

  it('connects and disconnects two nodes with the keyboard, with the chosen weight', async () => {
    const onchange = vi.fn();
    render({ editable: true, weighted: true, onchange });
    pickTool('connect');
    const weight = /** @type {HTMLInputElement} */ (document.querySelector('input[type="number"]'));
    weight.value = '7';
    weight.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    await press(node(1), 'Enter');
    expect(document.body.textContent).toContain('From B: pick the node to connect or disconnect.');
    await press(node(2), 'Enter');
    expect(onchange.mock.lastCall?.[0].edges).toEqual([
      { from: 0, to: 1, weight: 3 },
      { from: 1, to: 2, weight: 7 },
    ]);
    await press(node(1), 'Enter');
    await press(node(0), 'Enter');
    expect(onchange.mock.lastCall?.[0].edges).toEqual([{ from: 1, to: 2, weight: 7 }]);
  });

  it('refuses a self loop and cancels a pending pick with Escape', async () => {
    const onchange = vi.fn();
    render({ editable: true, onchange });
    pickTool('connect');
    await press(node(0), 'Enter');
    await press(node(0), 'Enter');
    expect(document.body.textContent).toContain('An edge needs two different nodes.');
    await press(node(0), 'Enter');
    await press(node(0), 'Escape');
    expect(document.querySelector('[role="status"]')?.textContent).toBe('');
    expect(onchange).not.toHaveBeenCalled();
  });

  it('deletes a node with its edges and moves focus on', async () => {
    const onchange = vi.fn();
    render({ editable: true, onchange });
    pickTool('remove');
    node(0).focus();
    await press(node(0), 'Enter');
    expect(onchange.mock.lastCall?.[0]).toEqual({
      nodes: [
        { id: 1, x: 200, y: 40, label: 'B' },
        { id: 2, x: 120, y: 160, label: 'C' },
      ],
      edges: [],
    });
    expect(document.activeElement).toBe(node(1));
  });

  it('deletes an edge through its button in the delete tool', async () => {
    const onchange = vi.fn();
    render({ editable: true, onchange });
    expect(document.querySelector('line[role="button"]')).toBeNull();
    pickTool('remove');
    const edge = /** @type {SVGLineElement} */ (document.querySelector('line[role="button"]'));
    expect(edge.getAttribute('aria-label')).toBe('Delete edge A and B');
    await press(edge, 'Enter');
    expect(onchange.mock.lastCall?.[0].edges).toEqual([]);
  });

  it('nudges a node with Shift and an arrow key', async () => {
    const onchange = vi.fn();
    render({ editable: true, onchange });
    await press(node(2), 'ArrowUp', { shiftKey: true });
    expect(onchange.mock.lastCall?.[0].nodes[2]).toEqual({ id: 2, x: 120, y: 150, label: 'C' });
  });
});
