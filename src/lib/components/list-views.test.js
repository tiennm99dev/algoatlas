// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import LinkedListView from './linked-list-view.svelte';
import StackQueueView from './stack-queue-view.svelte';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Component @param {Record<string, any>} props */
function render(Component, props) {
  app = mount(Component, { target: document.body, props });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

const label = () => document.querySelector('svg')?.getAttribute('aria-label');
const nodes = [
  { id: 'a', label: '3' },
  { id: 'b', label: '8', state: /** @type {const} */ ('active') },
  { id: 'c', label: '5' },
];

describe('LinkedListView', () => {
  it('spells out the list and its pointers', () => {
    render(LinkedListView, {
      nodes,
      pointers: [
        { name: 'head', index: 0 },
        { name: 'curr', index: 3 },
      ],
    });
    expect(label()).toBe('Singly linked list: 3 → 8 → 5. head at 0. curr at 3');
    expect(document.body.textContent).toContain('null');
    expect(document.querySelectorAll('line')).toHaveLength(3);
  });

  it('draws back links when doubly linked and drops null when circular', () => {
    render(LinkedListView, { nodes, doubly: true, circular: true });
    expect(label()).toBe('Doubly linked list, circular: 3 → 8 → 5');
    expect(document.body.textContent).not.toContain('null');
    expect(document.querySelectorAll('line')).toHaveLength(4);
    expect(document.querySelectorAll('path[marker-end]')).toHaveLength(1);
  });

  it('picks nodes with the keyboard when selectable', () => {
    const onselect = vi.fn();
    render(LinkedListView, { nodes, onselect });
    const first = /** @type {SVGGElement} */ (document.querySelector('[data-index="0"]'));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    flushSync();
    const last = /** @type {SVGGElement} */ (document.querySelector('[data-index="2"]'));
    expect(document.activeElement).toBe(last);
    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onselect).toHaveBeenLastCalledWith(2);
    expect(last.getAttribute('aria-label')).toBe('Index 2: 5');
  });
});

describe('StackQueueView', () => {
  const items = [
    { label: 'a' },
    { label: 'b' },
    { label: 'c', state: /** @type {const} */ ('active') },
  ];

  it('describes a stack bottom to top and marks its ends', () => {
    render(StackQueueView, { kind: 'stack', items });
    expect(label()).toBe('Stack, bottom to top: a, b, c.');
    expect(document.body.textContent).toContain('top');
    expect(document.body.textContent).toContain('bottom');
    expect([...document.querySelectorAll('title')].map((t) => t.textContent)).toEqual([
      'a',
      'b',
      'c, current',
    ]);
  });

  it('describes a queue front to back and draws spare capacity', () => {
    render(StackQueueView, { kind: 'queue', items, capacity: 5 });
    expect(label()).toBe('Queue, front to back: a, b, c.');
    expect(document.querySelectorAll('rect[stroke-dasharray]')).toHaveLength(2);
  });

  it('says when it is empty', () => {
    render(StackQueueView, { kind: 'deque', items: [] });
    expect(label()).toBe('The deque is empty.');
  });
});
