// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/fibonacci-heaps/copy.en.js';

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

/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
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
const forestLabel = () =>
  document.querySelector('svg[aria-label*="key"]')?.getAttribute('aria-label') ?? '';
/** @param {string} start */
const node = (start) =>
  /** @type {HTMLElement} */ (
    [...document.querySelectorAll('[role="button"]')].find((c) =>
      c.getAttribute('aria-label')?.startsWith(start),
    )
  );
function submit() {
  document
    .querySelector('form')
    ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  flushSync();
}

describe('binomial and Fibonacci heaps lesson', () => {
  it('starts lazily and consolidates on extract-min', () => {
    render();
    expect(text()).toContain('An empty Fibonacci heap');
    click(button('Next step'));
    expect(text()).toContain('Insert 41: add it to the root list as a one-node tree');
    click(button('Last step'));
    expect(forestLabel()).toContain('1 tree holding 8 keys.');
    expect(text()).toContain('All operations done: 7 links, 0 cuts.');
  });

  it('shows the degree table while consolidating', () => {
    render();
    expect(text()).toContain(m.tableIdle);
    // Step past nine inserts, the extract and the promotion to the first scan.
    for (let i = 0; i < 12; i++) click(button('Next step'));
    expect(text()).toContain('Consolidate: take the root');
    expect(document.querySelector('svg[aria-label^="Degree table"]')).not.toBeNull();
  });

  it('inserts a typed key and extracts the minimum', () => {
    render();
    commit(input('value'), '1');
    submit();
    expect(text()).toContain('Insert 1: add it to the root list');
    click(buttonByText(m.extract));
    expect(text()).toContain('Extract min: the min pointer names 1.');
    click(button('Last step'));
    expect(forestLabel()).toContain('holding 8 keys.');
  });

  it('switches to a binomial heap on the same log', () => {
    render();
    click(/** @type {HTMLInputElement} */ (document.querySelector('input[value="binomial"]')));
    expect(text()).toContain('Sift-up swaps');
    commit(/** @type {HTMLSelectElement} */ (document.querySelector('select')), 'counter');
    click(button('Next step'));
    click(button('Next step'));
    click(button('Next step'));
    expect(text()).toContain('Insert 9: it starts as a carry');
    click(button('Next step'));
    expect(text()).toContain('also has degree 0, so the two trees must link');
    click(button('Last step'));
    expect(forestLabel()).toContain('1 tree holding 8 keys.');
  });

  it('decreases a chosen key from the keyboard and cuts it out', () => {
    render();
    click(button('Last step'));
    const leaf = node('Key 46,');
    leaf.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(text()).toContain(m.selectedInfo(46));
    commit(input('key'), '2');
    click(buttonByText(m.decrease));
    expect(text()).toContain('Decrease 46 to 2. Its parent holds 39.');
    click(button('Next step'));
    expect(text()).toContain('cut 2 out with its subtree');
    click(button('Last step'));
    expect(forestLabel()).toContain('2 trees holding 8 keys.');
    expect(text()).toContain('46↓2');
  });

  it('refuses a decrease without a node, a larger key and a bad value', () => {
    render();
    click(buttonByText(m.decrease));
    expect(text()).toContain(m.pickFirst);
    click(button('Last step'));
    node('Key 18,').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    commit(input('key'), '30');
    click(buttonByText(m.decrease));
    expect(text()).toContain(m.notSmaller(18));
    commit(input('key'), '150');
    expect(input('key').value).toBe('30');
    expect(text()).toContain(m.valueError);
  });

  it('undoes, resets and refuses to extract from an empty heap', () => {
    render();
    click(buttonByText(m.undo));
    expect(forestLabel()).toContain('9 trees holding 9 keys.');
    click(buttonByText(m.reset));
    expect(text()).toContain('An empty Fibonacci heap');
    click(buttonByText(m.extract));
    expect(text()).toContain(m.emptyError);
  });

  it('refuses inserts into a full heap', () => {
    render();
    for (let i = 0; i < 8; i++) {
      commit(input('value'), String(i));
      submit();
    }
    expect(text()).toContain(m.full);
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
    answer.value = '4';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Not quite');
    click(buttonByText('Show a hint'));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '3';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    send();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
