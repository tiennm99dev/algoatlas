// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/connected-components/copy.en.js';

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

/** Keyboard activation reports detail 0, which the grid treats as an edit. */
/** @param {HTMLElement} el */
function keyActivate(el) {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
  flushSync();
}

/** @param {HTMLElement} target @param {string} key */
function press(target, key) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  flushSync();
}

const text = () => document.body.textContent ?? '';
/** @param {string} label */
const statValue = (label) =>
  [...document.querySelectorAll('dt')]
    .find((d) => d.textContent?.trim() === label)
    ?.nextElementSibling?.textContent?.trim();
/** @param {string} value */
const radio = (value) =>
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

/** @param {HTMLElement} q @param {string} value */
function answer(q, value) {
  const el = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  q.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('connected components lesson', () => {
  it('labels the first island, then counts all nine', () => {
    render();
    expect(text()).toContain('No cell has a label yet.');
    click(button('Next step'));
    expect(text()).toContain('(0,0) is land with no label: a new island. Label it 1');
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('(0,1) is unlabelled land next to (0,0): label it 1 and enqueue it.');
    const queue = [...document.querySelectorAll('ol li')].map((li) => li.textContent?.trim());
    expect(queue).toContain('(0,1) (just labelled)');
    click(button('Last step'));
    expect(statValue(m.stats.islands)).toBe('9');
    expect(statValue(m.stats.largest)).toBe('7');
    expect(text()).toContain('Scan finished: 9 islands, after 97 neighbour checks.');
    expect(button('Row 6, column 6, island 7')).toBeTruthy();
  });

  it('8 directions merge the diagonal chain', () => {
    render();
    radio('8');
    click(button('Last step'));
    expect(statValue(m.stats.islands)).toBe('7');
    expect(button('Row 4, column 2, island 4')).toBeTruthy();
  });

  it('keyboard edits switch land and water and rebuild the trace', () => {
    render();
    keyActivate(button('Row 0, column 3, Water'));
    expect(text()).toContain('Land added at (0,3).');
    click(button('Last step'));
    expect(statValue(m.stats.islands)).toBe('10');
    keyActivate(button('Row 0, column 3, island 2'));
    expect(text()).toContain('Water at (0,3).');
  });

  it('a pointer stroke paints land across cells', () => {
    render();
    const a = button('Row 0, column 3, Water');
    const b = button('Row 0, column 4, Water');
    // jsdom has no layout, so point the hit test at the cell under the pretend pointer.
    let under = a;
    document.elementFromPoint = () => under;
    a.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    flushSync();
    under = b;
    b.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, buttons: 1 }));
    flushSync();
    expect(button('Row 0, column 3, Land, no label')).toBeTruthy();
    expect(button('Row 0, column 4, Land, no label')).toBeTruthy();
  });

  it('all water and reset change the map', () => {
    render();
    click(buttonByText(m.clearMap));
    click(button('Last step'));
    expect(statValue(m.stats.islands)).toBe('0');
    expect(text()).toContain('Scan finished: 0 islands');
    click(buttonByText(m.resetMap));
    click(button('Last step'));
    expect(statValue(m.stats.islands)).toBe('9');
  });

  it('moves focus with the arrow keys', () => {
    render();
    const first = button('Row 0, column 0, Land, no label');
    first.focus();
    press(first, 'ArrowRight');
    expect(document.activeElement).toBe(button('Row 0, column 1, Land, no label'));
  });

  it('checks practice answers with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    answer(q, '7');
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer(q, '9');
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
