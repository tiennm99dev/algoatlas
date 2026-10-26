// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/priority-queue-applications/copy.en.js';

/** @type {Record<string, any> | null} */
let app = null;

function render() {
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

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} name */
const input = (name) =>
  /** @type {HTMLInputElement} */ (document.querySelector(`input[name="${name}"]`));
/** @param {string} prefix */
const svgLabel = (prefix) =>
  document.querySelector(`svg[aria-label^="${prefix}"]`)?.getAttribute('aria-label') ?? '';
const topK = () =>
  click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="top-k"]')));

describe('priority queue applications lesson', () => {
  it('seeds the heap with each list head, then pops the smallest', () => {
    render();
    expect(text()).toContain('Merge 3 sorted lists of 9 values.');
    click(button('Next step'));
    expect(text()).toContain('Push 1, the head of list A.');
    click(button('Next step'));
    click(button('Next step'));
    expect(svgLabel('Min-heap')).toContain('Min-heap as an array: 1, 2, 5');
    click(button('Next step'));
    expect(text()).toContain('Pop the smallest head, 1 from list A');
    expect(svgLabel('Output')).toBe('Output: 1.');
    click(button('Next step'));
    expect(text()).toContain('List A moves on: push its next value, 4.');
  });

  it('ends with the merged output', () => {
    render();
    click(button('Last step'));
    expect(svgLabel('Output')).toBe('Output: 1, 2, 3, 4, 5, 6, 7, 8, 9.');
    expect(text()).toContain('Merged 9 values with 18 heap operations');
    const titles = [...document.querySelectorAll('title')].map((t) => t.textContent);
    expect(titles).toContain('Position 8: 9 from list A, in the output');
    expect(text()).toContain('The heap is empty.');
  });

  it('loads typed lists and refuses unsorted ones', () => {
    render();
    commit(input('lists'), '2, 5 / 1, 3');
    click(button('Last step'));
    expect(svgLabel('Output')).toBe('Output: 1, 2, 3, 5.');
    commit(input('lists'), '5, 2 / 1');
    expect(text()).toContain(m.listErrors.unsorted);
    expect(input('lists').value).toBe('2, 5 / 1, 3');
  });

  it('keeps the top k of a stream', () => {
    render();
    topK();
    expect(text()).toContain('Keep the 3 largest values in a min-heap of size 3.');
    click(button('Last step'));
    expect(text()).toContain('its root 7 is the 3rd largest');
    expect(text()).toContain(m.resultTitle);
    expect(svgLabel('Min-heap')).toContain('Min-heap as an array: 7, 8, 9');
  });

  it('changes k and refuses a bad k', () => {
    render();
    topK();
    commit(input('k'), '1');
    click(button('Last step'));
    expect(svgLabel('Min-heap')).toContain('Min-heap as an array: 9.');
    commit(input('k'), '9');
    expect(text()).toContain(m.kError);
    expect(input('k').value).toBe('1');
  });

  it('refuses a bad stream and loads new input', () => {
    render();
    topK();
    commit(input('stream'), '5, 500');
    expect(text()).toContain(m.streamErrors.range);
    click(buttonByText(m.newInputButton));
    expect(text()).toContain(m.newInputNotice);
    expect(input('stream').value.split(', ')).toHaveLength(12);
  });

  it('steps with the keyboard shortcut', () => {
    render();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    flushSync();
    expect(text()).toContain('Push 1, the head of list A.');
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
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
