// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { canonicalCover, segmentTrace, treeSpans } from '$lib/algo-engine/segment-tree.js';
import { en as m } from '$lib/lessons/segment-tree/copy.en.js';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
  app = mount(Page, { target: document.body, props: {} });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
  localStorage.clear();
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {Element} el */
function click(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));

const dragRow = () => /** @type {HTMLElement} */ (document.querySelector('.cursor-col-resize'));

const coverLine = () => document.querySelector('[data-testid="cover-line"]')?.textContent ?? '';

const inRange = () =>
  [...document.querySelectorAll('[data-index][aria-pressed="true"]')].map((el) =>
    Number(el.getAttribute('data-index')),
  );

/** Drag across the row: each cell of the 8 is 10 pixels wide in this fake layout. @param {number} from @param {number} to */
function drag(from, to) {
  const row = dragRow();
  row.getBoundingClientRect = () => /** @type {DOMRect} */ ({ left: 0, width: 80 });
  const at = (/** @type {number} */ i) => ({
    clientX: i * 10 + 5,
    bubbles: true,
    cancelable: true,
  });
  row.dispatchEvent(new MouseEvent('pointerdown', at(from)));
  flushSync();
  row.dispatchEvent(new MouseEvent('pointermove', at(to)));
  flushSync();
  row.dispatchEvent(new MouseEvent('pointerup', at(to)));
  flushSync();
}

/**
 * Press Enter in a field the way a browser does it: leaving the field fires its change event.
 * @param {HTMLInputElement} el @param {string} value
 */
function pressEnter(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.addEventListener('blur', () => el.dispatchEvent(new Event('change', { bubbles: true })), {
    once: true,
  });
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  flushSync();
}

describe('segment tree lesson', () => {
  it('opens on the finished query with its cover lit', () => {
    render();
    expect(text()).toContain('query[1, 6] = 29, from 4 covering nodes');
    expect(coverLine()).toContain('[1, 1] = 5, [2, 3] = 5, [4, 5] = 12, [6, 6] = 7');
    expect(inRange()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('drags a range and lights the nodes that cover it, live', () => {
    render();
    drag(2, 5);
    expect(inRange()).toEqual([2, 3, 4, 5]);
    expect(coverLine()).toContain('[2, 3] = 5, [4, 5] = 12. Sum of 2 nodes.');
    expect(text()).toContain('query[2, 5] = 17');
    drag(5, 0);
    expect(inRange()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(coverLine()).toContain('[0, 3] = 12, [4, 5] = 12');
  });

  it('ignores pointer moves after the release', () => {
    render();
    drag(2, 5);
    dragRow().dispatchEvent(new MouseEvent('pointermove', { clientX: 5, bubbles: true }));
    flushSync();
    expect(inRange()).toEqual([2, 3, 4, 5]);
  });

  it('chooses a range with the keyboard', () => {
    render();
    const cell = (/** @type {number} */ i) =>
      /** @type {HTMLElement} */ (document.querySelector(`[data-index="${i}"]`));
    cell(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('Range starts at 0.');
    cell(3).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    flushSync();
    expect(inRange()).toEqual([0, 1, 2, 3]);
    expect(coverLine()).toContain('[0, 3] = 12');
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    cell(0).dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(true);
  });

  it('replays the query through the three cases', () => {
    render();
    click(buttonByText(m.replay));
    expect(text()).toContain('Node [0, 7] is only partly inside [1, 6]');
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain('Node [0, 0] is outside [1, 6]: return the identity 0');
    click(button('Next step'));
    expect(text()).toContain('Node [1, 1] is fully inside [1, 6]: return its value 5');
    click(button('Next step'));
    expect(text()).toContain('Node [0, 1] merges what its children returned: 5.');
  });

  it('changes the merge function on the same operations', () => {
    render();
    click(/** @type {Element} */ (document.querySelector('input[value="min"]')));
    expect(text()).toContain('query[1, 6] = 1,');
    click(buttonByText(m.replay));
    for (let i = 0; i < 3; i++) click(button('Next step'));
    expect(text()).toContain('return the identity +∞');
    click(/** @type {Element} */ (document.querySelector('input[value="max"]')));
    expect(text()).toContain('query[1, 6] = 9,');
  });

  it('sets one value and recomputes one path', () => {
    render();
    commit(input('index'), '4');
    commit(input('value'), '0');
    click(buttonByText(m.setButton));
    expect(text()).toContain('Index 4 is in [0, 7]');
    click(button('Last step'));
    expect(text()).toContain('The root stores 28.');
  });

  it('steps back to the build', () => {
    render();
    click(button('First step'));
    expect(text()).toContain('Build bottom-up over 8 values with sum');
    click(button('Next step'));
    expect(text()).toContain('Leaf [0, 0] copies the value 2.');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Node [0, 1] = sum(left child, right child) = 7.');
  });

  it('undoes and resets, and a drag starts a new query', () => {
    render();
    click(buttonByText(m.undo));
    expect(text()).toContain('Done: all operations ran.');
    drag(0, 1);
    expect(coverLine()).toContain('[0, 1] = 7');
    click(buttonByText(m.reset));
    expect(inRange()).toEqual([]);
    expect(text()).toContain('The root stores 37.');
  });

  it('refuses bad input and keeps the last valid value', () => {
    render();
    commit(input('values'), '1, nope');
    expect(text()).toContain(m.valueErrors.format);
    expect(input('values').value).toBe('2, 5, 1, 4, 9, 3, 7, 6');
    commit(input('index'), '8');
    expect(text()).toContain(m.indexError(8));
    expect(input('index').value).toBe('4');
    commit(input('value'), '500');
    expect(text()).toContain(m.valueError);
    expect(input('value').value).toBe('0');
  });

  it('refuses a full log', () => {
    render();
    for (let k = 0; k < 7; k++) click(buttonByText(m.setButton));
    click(buttonByText(m.setButton));
    expect(text()).toContain(m.logFull);
  });

  it('clamps the log to a shorter array', () => {
    render();
    commit(input('values'), '4, 8, 15');
    expect(inRange()).toEqual([1, 2]);
    expect(text()).toContain('query[1, 2] = 23');
  });

  it('checks a practice answer with a hint', () => {
    render();
    const section = [...document.querySelectorAll('section')].find(
      (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
    );
    const q = /** @type {HTMLElement} */ (section?.querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const send = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '16';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
  });

  it('keeps a refusal on Enter and runs no operation', () => {
    render();
    const before = text().match(/set\(/g)?.length ?? 0;
    pressEnter(input('index'), '99');
    expect(text()).toContain(m.indexError(8));
    pressEnter(input('values'), 'abc');
    expect(text()).toContain(m.valueErrors.format);
    expect(text().match(/set\(/g)?.length ?? 0).toBe(before);
  });

  it('sets a value on Enter, and adds no operation for new values', () => {
    render();
    pressEnter(input('value'), '8');
    expect(text()).toContain('set(4, 8)');
    pressEnter(input('values'), '1, 2, 3, 4, 5, 6');
    expect(input('values').value).toBe('1, 2, 3, 4, 5, 6');
    expect(text().match(/set\(4, 8\)/g)).toHaveLength(1);
  });

  it('keeps a cell in the tab order when the array shrinks', () => {
    render();
    /** @type {HTMLElement} */ (dragRow().querySelector('[data-index="7"]')).focus();
    flushSync();
    commit(input('values'), '1, 2, 3');
    expect(dragRow().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it('counts a one-node cover in the singular', () => {
    render();
    drag(0, 7);
    expect(coverLine()).toContain('Sum of 1 node.');
  });
});

describe('segment tree practice answers', () => {
  const a = [2, 5, 1, 4, 9, 3, 7, 6];

  it('has well-formed questions', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('matches the engine', () => {
    const answers = m.practice.map((ex) => /** @type {{ answer?: unknown }} */ (ex).answer);
    expect(answers[0]).toBe(treeSpans(8).length);
    const built = segmentTrace(a, [], 'sum').at(-1);
    expect(answers[1]).toBe(built?.tree[3]);
    expect(answers[2]).toBe(canonicalCover(8, 1, 6).length);
    const min = segmentTrace(a, [{ type: 'query', l: 1, r: 6 }], 'min');
    expect(answers[3]).toBe(min.filter((f) => f.opIndex === 0).at(-1)?.result);
    const update = segmentTrace(a, [{ type: 'set', i: 4, x: 0 }], 'sum');
    expect(answers[4]).toBe(update.filter((f) => f.opIndex === 0).at(-1)?.visits);
    expect(update.at(-1)?.tree[1]).toBe(28);
    const sum = segmentTrace(a, [{ type: 'query', l: 1, r: 6 }], 'sum');
    expect(sum.filter((f) => f.opIndex === 0).at(-1)?.result).toBe(29);
  });
});
