// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import PracticeBlock from './practice-block.svelte';

/** @typedef {import('./answer-check.js').Exercise} Exercise */

const base = { hints: ['First hint', 'Second hint'], solution: 'Because.' };

/** @type {Exercise[]} */
const exercises = [
  { ...base, type: 'number', prompt: 'How many comparisons?', answer: 7, unit: 'comparisons' },
  { ...base, type: 'choice', prompt: 'Which is LIFO?', options: ['Queue', 'Stack'], answer: 1 },
  {
    ...base,
    type: 'multi',
    prompt: 'Which are O(log n)?',
    options: ['Binary search', 'Linear scan', 'Heap push'],
    answers: [0, 2],
  },
  { ...base, type: 'text', prompt: 'Name the cost of merge sort.', accept: ['O(n log n)'] },
  {
    ...base,
    type: 'order',
    prompt: 'Order by growth.',
    items: ['n²', 'log n', 'n'],
    answer: [1, 2, 0],
  },
];

/** @type {Record<string, any> | null} */
let app = null;

function render(id = 'quiz') {
  app = mount(PracticeBlock, { target: document.body, props: { exercises, id } });
  flushSync();
}

beforeEach(() => localStorage.clear());

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const text = () => document.body.textContent ?? '';
/** @param {number} i */
const question = (i) =>
  /** @type {HTMLElement} */ (document.querySelectorAll('section > ol > li')[i]);

/** @param {HTMLElement} scope @param {string} label */
function buttonIn(scope, label) {
  const el = [...scope.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === label || b.getAttribute('aria-label') === label,
  );
  if (!el) throw new Error(`no button ${label}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {HTMLElement} scope @param {string} value */
function type(scope, value) {
  const input = /** @type {HTMLInputElement} */ (scope.querySelector('input[name="answer"]'));
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

/** @param {HTMLElement} scope */
function submit(scope) {
  const form = /** @type {HTMLFormElement} */ (scope.querySelector('form'));
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

/** @param {HTMLElement} scope */
const status = (scope) =>
  scope.querySelector('p[role="status"]:not(.sr-only)')?.textContent?.trim();

describe('PracticeBlock', () => {
  it('checks a typed number and marks it solved', () => {
    render();
    const q = question(0);
    type(q, '');
    submit(q);
    expect(status(q)).toBe('Answer the question first.');
    type(q, '3,5');
    submit(q);
    expect(status(q)).toMatch(/plain number/);
    type(q, '8');
    submit(q);
    expect(status(q)).toBe('Not quite. Try again, or open a hint.');
    type(q, '7 comparisons');
    submit(q);
    expect(status(q)).toBe('Correct!');
    expect(q.textContent).toContain('Solved');
    expect(text()).toContain('1 of 5 solved');
  });

  it('reveals hints one at a time and the solution only after a try', () => {
    render();
    const q = question(0);
    expect(() => buttonIn(q, 'Show solution')).toThrow();
    click(buttonIn(q, 'Show a hint'));
    expect(q.textContent).toContain('First hint');
    expect(q.textContent).not.toContain('Second hint');
    click(buttonIn(q, 'Next hint (1 of 2)'));
    expect(q.textContent).toContain('Second hint');
    expect(() => buttonIn(q, 'Next hint (2 of 2)')).toThrow();
    type(q, '1');
    submit(q);
    click(buttonIn(q, 'Show solution'));
    expect(q.textContent).toContain('Because.');
  });

  it('checks a single choice', () => {
    render();
    const q = question(1);
    const radios = /** @type {NodeListOf<HTMLInputElement>} */ (
      q.querySelectorAll('input[type="radio"]')
    );
    click(radios[0]);
    submit(q);
    expect(status(q)).toMatch(/Not quite/);
    click(radios[1]);
    submit(q);
    expect(status(q)).toBe('Correct!');
  });

  it('checks a set of picks', () => {
    render();
    const q = question(2);
    const boxes = /** @type {NodeListOf<HTMLInputElement>} */ (
      q.querySelectorAll('input[type="checkbox"]')
    );
    click(boxes[0]);
    submit(q);
    expect(status(q)).toMatch(/Not quite/);
    click(boxes[2]);
    submit(q);
    expect(status(q)).toBe('Correct!');
  });

  it('accepts a cost formula with free spacing', () => {
    render();
    const q = question(3);
    type(q, 'o( N log N )');
    submit(q);
    expect(status(q)).toBe('Correct!');
  });

  it('reorders items with the move buttons and keeps focus on the moved item', async () => {
    render();
    const q = question(4);
    const order = () => [...q.querySelectorAll('ol li span.flex-1')].map((s) => s.textContent);
    expect(order()).toEqual(['n²', 'log n', 'n']);
    submit(q);
    expect(status(q)).toMatch(/Not quite/);
    const up = buttonIn(q, 'Move “log n” up');
    up.focus();
    click(up);
    await tick();
    expect(order()).toEqual(['log n', 'n²', 'n']);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Move “log n” up');
    expect(q.textContent).toContain('“log n” is now position 1 of 3.');
    click(buttonIn(q, 'Move “n” up'));
    expect(order()).toEqual(['log n', 'n', 'n²']);
    submit(q);
    expect(status(q)).toBe('Correct!');
  });

  it('remembers solved questions per id and resets them', () => {
    render('remember');
    const q = question(1);
    click(/** @type {HTMLInputElement} */ (q.querySelectorAll('input[type="radio"]')[1]));
    submit(q);
    expect(localStorage.getItem('algoatlas:practice:remember')).toBe('[1]');
    unmount(/** @type {any} */ (app));
    document.body.innerHTML = '';
    render('remember');
    expect(text()).toContain('1 of 5 solved');
    expect(question(1).textContent).toContain('Solved');
    click(buttonIn(document.body, 'Reset progress'));
    expect(text()).toContain('0 of 5 solved');
    expect(localStorage.getItem('algoatlas:practice:remember')).toBeNull();
  });

  it('ignores unreadable stored progress', () => {
    localStorage.setItem('algoatlas:practice:bad', '{"x":1}');
    render('bad');
    expect(text()).toContain('0 of 5 solved');
    localStorage.setItem('algoatlas:practice:range', '[0, 9, -1, 0, "2"]');
    unmount(/** @type {any} */ (app));
    render('range');
    expect(text()).toContain('1 of 5 solved');
  });

  it('still works when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render();
    const q = question(1);
    click(/** @type {HTMLInputElement} */ (q.querySelectorAll('input[type="radio"]')[1]));
    submit(q);
    expect(status(q)).toBe('Correct!');
    expect(text()).toContain('1 of 5 solved');
  });
});
