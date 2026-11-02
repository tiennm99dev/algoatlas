// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { lazyTrace } from '$lib/algo-engine/lazy-propagation.js';
import { en as m } from '$lib/lessons/lazy-propagation/copy.en.js';

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

const opsCard = () =>
  [...document.querySelectorAll('h2')].find((h) => h.textContent === m.opsTitle)?.parentElement
    ?.textContent ?? '';

/** @param {number} k */
function next(k) {
  for (let i = 0; i < k; i++) click(button('Next step'));
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

describe('lazy propagation lesson', () => {
  it('opens on the first update, which stops at the root with a tag', () => {
    render();
    expect(text()).toContain(
      'Node [0, 7] is fully inside [0, 7]: its sum changes by +5 × 8, and its tag grows by +5.',
    );
    expect(text()).toContain('[0, 7] +5');
    expect(document.querySelector('svg[aria-label*="1 pending tag"]')).toBeTruthy();
  });

  it('shows the leaves falling behind the true array', () => {
    render();
    expect(document.querySelector('svg[aria-label*="8 leaves are behind"]')).toBeTruthy();
  });

  it('pushes the tag down when the next update must go below the node', () => {
    render();
    next(1);
    expect(text()).toContain('Its tag +5 has to move first.');
    next(1);
    expect(text()).toContain('Push +5 down: [0, 3] and [4, 7] take it');
    next(1);
    expect(text()).toContain('Node [0, 3] is outside [4, 7]');
    next(1);
    expect(text()).toContain('its sum changes by +2 × 4, and its tag grows by +2');
    next(1);
    expect(text()).toContain('Back up: node [0, 7] adds its children and now stores 84.');
  });

  it('answers the query after pushing along one path', () => {
    render();
    click(button('Last step'));
    click(button('Previous step'));
    expect(text()).toContain('The sum of [5, 5] is 13, after 2 pushes.');
    expect(text()).toContain('[0, 3] +5');
  });

  it('adds to a typed range and jumps to its first step', () => {
    render();
    commit(input('l'), '1');
    commit(input('r'), '2');
    commit(input('x'), '-4');
    click(buttonByText(m.addButton));
    expect(text()).toContain('add(1, 2, −4)');
    expect(text()).toContain('Node [0, 7] is partly inside [1, 2]');
  });

  it('runs a sum query with Enter', () => {
    render();
    commit(input('l'), '0');
    commit(input('r'), '7');
    document
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSync();
    expect(text()).toContain('query(0, 7)');
  });

  it('fills the range with two picks and with the keyboard', () => {
    render();
    const cell = (/** @type {number} */ i) =>
      /** @type {HTMLElement} */ (document.querySelector(`[data-index="${i}"]`));
    click(cell(6));
    expect(text()).toContain('Range starts at 6.');
    cell(3).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain('Range set to [3, 6].');
    expect(input('l').value).toBe('3');
    expect(input('r').value).toBe('6');
  });

  it('undoes and resets the log', () => {
    render();
    click(buttonByText(m.undo));
    expect(opsCard()).not.toContain('query(5, 5)');
    expect(text()).toContain('Done: the updates and push-downs changed');
    click(buttonByText(m.reset));
    expect(opsCard()).not.toContain('add(0, 7, 5)');
    expect(text()).toContain('Done: the updates and push-downs changed 0 node sums');
  });

  it('refuses bad input and keeps the last valid value', () => {
    render();
    commit(input('values'), 'one two');
    expect(text()).toContain(m.valueErrors.format);
    expect(input('values').value).toBe('1, 2, 3, 4, 5, 6, 7, 8');
    commit(input('r'), '8');
    expect(text()).toContain(m.rangeError(8));
    expect(input('r').value).toBe('5');
    commit(input('x'), '100');
    expect(text()).toContain(m.xError);
    expect(input('x').value).toBe('3');
  });

  it('refuses a full log, and an earlier refusal does not block later operations', () => {
    render();
    commit(input('x'), '100');
    for (let k = 0; k < 5; k++) click(buttonByText(m.addButton));
    expect(text()).toContain('add(2, 5, 3)');
    click(buttonByText(m.queryButton));
    expect(text()).toContain(m.logFull);
  });

  it('clamps the log to a shorter array', () => {
    render();
    commit(input('values'), '1, 2, 3');
    expect(opsCard()).toContain('add(0, 2, 5)');
    expect(opsCard()).not.toContain('add(4, 7, 2)');
    expect(input('r').value).toBe('2');
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
    answer.value = '15';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '1';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
  });

  it('keeps a refusal on Enter and runs no operation', () => {
    render();
    const before = opsCard();
    pressEnter(input('r'), '99');
    expect(text()).toContain(m.rangeError(8));
    expect(opsCard()).toBe(before);
    pressEnter(input('x'), '500');
    expect(text()).toContain(m.xError);
    expect(opsCard()).toBe(before);
  });

  it('runs the action of the field Enter was pressed in, and none for new values', () => {
    render();
    pressEnter(input('r'), '6');
    expect(opsCard()).toContain('query(2, 6)');
    pressEnter(input('x'), '4');
    expect(opsCard()).toContain('add(2, 6, 4)');
    const before = opsCard();
    pressEnter(input('values'), '1, 2, 3, 4, 5, 6, 7, 8, 9');
    expect(opsCard().replace(' (running now)', '')).toBe(before.replace(' (running now)', ''));
  });
});

describe('lazy propagation practice answers', () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8];

  it('has well-formed questions', () => {
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });

  it('matches the engine', () => {
    const answers = m.practice.map((ex) => /** @type {{ answer?: unknown }} */ (ex).answer);
    const frames = lazyTrace(a, [
      { type: 'add', l: 0, r: 7, x: 5 },
      { type: 'add', l: 4, r: 7, x: 2 },
      { type: 'query', l: 5, r: 5 },
    ]);
    const of = (/** @type {number} */ index) =>
      /** @type {import('$lib/algo-engine/lazy-propagation.js').LazyFrame} */ (
        frames.filter((f) => f.opIndex === index).at(-1)
      );
    expect(answers[0]).toBe(of(0).writes);
    expect(of(0).eager).toBe(15);
    expect(answers[1]).toBe(of(1).tag[3]);
    expect(answers[2]).toBe(of(1).sum[3]);
    expect(answers[3]).toBe(of(2).pushes);
    expect(of(2).result).toBe(13);
  });
});
