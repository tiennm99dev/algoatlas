// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { en as m } from '$lib/lessons/tries/copy.en.js';
import Page from './+page.svelte';

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

/** @param {string} text */
function buttonByText(text) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!el) throw new Error(`no button with text ${text}`);
  return el;
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement | HTMLSelectElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** Type without leaving the field. @param {HTMLInputElement} el @param {string} value */
function type(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
/** @param {string} id */
const stat = (id) => document.querySelector(`[data-testid="${id}"]`)?.textContent?.trim();
const wordField = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[name="word"]'));
const presetField = () =>
  /** @type {HTMLSelectElement} */ (document.querySelector('select[name="preset"]'));
/** @param {string} label */
const node = (label) => {
  const el = document.querySelector(`g[aria-label^="${label}"]`);
  if (!el) throw new Error(`no node ${label}`);
  return /** @type {SVGGElement} */ (el);
};
const toLast = () => click(button('Last step'));
const chipsOf = (/** @type {string} */ title) => {
  const card = [...document.querySelectorAll('h2')].find((h) => h.textContent === title);
  return [...(card?.parentElement?.querySelectorAll('li') ?? [])].map((li) =>
    li.textContent?.trim(),
  );
};

describe('tries lesson', () => {
  it('opens on the finished preset with the typed word lit, and rewinds to the empty root', () => {
    render();
    expect(stat('nodes')).toBe('10');
    expect(node('Prefix car,').getAttribute('aria-label')).toContain('matches what you typed');
    expect(chipsOf(m.resultsTitle)).toEqual(['car', 'card', 'care']);
    click(button('First step'));
    expect(narration()).toBe('The trie starts as a single empty root.');
    expect(stat('nodes')).toBe('0');
    click(button('Next step'));
    expect(narration()).toBe('Insert car: start at the root.');
    click(button('Next step'));
    expect(narration()).toContain('No child for c, so create one');
    toLast();
    expect(stat('words')).toBe('6');
    expect(stat('letters')).toBe('20');
    expect(stat('nodes')).toBe('10');
    expect(document.body.textContent).toContain('Sharing prefixes saves 10 nodes');
  });

  it('inserts a word and shows only the new letters being created', () => {
    render();
    commit(wordField(), 'cart');
    click(buttonByText('Insert'));
    expect(narration()).toBe('Insert cart: start at the root.');
    click(button('Next step'));
    expect(narration()).toContain('Letter c already has a node');
    toLast();
    expect(stat('words')).toBe('7');
    expect(stat('nodes')).toBe('11');
  });

  it('tells a stored word from a prefix when searching', () => {
    render();
    commit(wordField(), 'ca');
    click(buttonByText('Search'));
    toLast();
    click(button('Previous step'));
    expect(narration()).toContain('ca is only a prefix of longer words');
    commit(wordField(), 'cat');
    click(buttonByText('Search'));
    toLast();
    click(button('Previous step'));
    expect(narration()).toContain('cat is stored');
    commit(wordField(), 'cow');
    click(buttonByText('Search'));
    click(button('Next step'));
    click(button('Next step'));
    expect(narration()).toContain('No child for o');
  });

  it('autocompletes a prefix into a sorted list of chips', () => {
    render();
    commit(wordField(), 'ca');
    click(buttonByText('Autocomplete'));
    toLast();
    click(button('Previous step'));
    expect(narration()).toBe('Autocomplete found 4 words after touching 6 nodes.');
    expect(chipsOf(m.resultsTitle)).toEqual(['car', 'card', 'care', 'cat']);
  });

  it('never claims a negative saving or an empty word list while a word is going in', () => {
    render();
    click(button('First step'));
    for (let i = 0; i < 40; i++) {
      click(button('Next step'));
      expect(document.body.textContent).not.toMatch(/saves -/);
      expect(stat('live')).not.toContain('starts 0 words');
    }
    toLast();
    expect(document.body.textContent).toContain('Sharing prefixes saves 10 nodes');
  });

  it('follows typed letters live, before any operation runs', () => {
    render();
    toLast();
    type(wordField(), 'do');
    expect(stat('live')).toBe('“do” starts 2 words: dog, dot.');
    expect(node('Prefix do,').getAttribute('aria-label')).toContain('matches what you typed');
    type(wordField(), 'dx');
    expect(stat('live')).toBe('“d” is in the trie, but no word continues with x.');
    type(wordField(), 'q');
    expect(stat('live')).toBe('No word starts with q.');
    expect(wordField().value).toBe('q');
  });

  it('refuses a bad word, keeps the old one and blocks the click that follows', () => {
    render();
    commit(wordField(), 'c4t');
    expect(narration()).toBe(m.wordErrors(8).format);
    expect(wordField().value).toBe('car');
    click(buttonByText('Insert'));
    expect(stat('words')).not.toBe('7');
    commit(wordField(), 'abcdefghi');
    expect(narration()).toBe(m.wordErrors(8).length);
    commit(wordField(), '   ');
    expect(narration()).toBe(m.wordErrors(8).empty);
    expect(wordField().value).toBe('car');
  });

  it('undoes, resets and reloads presets', () => {
    render();
    toLast();
    const before = chipsOf(m.opsTitle).length;
    click(buttonByText(m.undo));
    expect(chipsOf(m.opsTitle).length).toBe(before - 1);
    click(buttonByText(m.reset));
    expect(stat('words')).toBe('0');
    expect(chipsOf(m.opsTitle)).toEqual([m.opsEmpty]);
    commit(presetField(), 'apart');
    expect(stat('words')).toBe('5');
    expect(stat('letters')).toBe('15');
    expect(stat('nodes')).toBe('15');
  });

  it('refuses a word past the capacity of the trie and a log past its cap', () => {
    render();
    click(buttonByText(m.reset));
    for (const w of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']) {
      commit(wordField(), w);
      click(buttonByText('Insert'));
    }
    commit(wordField(), 'k');
    click(buttonByText('Insert'));
    expect(narration()).toBe(m.full(10));
    for (let i = 0; i < 10; i++) click(buttonByText('Search'));
    click(buttonByText('Search'));
    expect(narration()).toBe(m.logFull(20));
  });

  it('copies the prefix of a clicked node into the field, by pointer and keyboard', () => {
    render();
    toLast();
    node('Prefix car').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(wordField().value).toBe('car');
    node('Prefix ca,').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(wordField().value).toBe('ca');
    node('Root').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    flushSync();
    expect(wordField().value).toBe('ca');
  });

  it('inserts on Enter in the field', () => {
    render();
    const field = wordField();
    field.focus();
    type(field, 'zoo');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    flushSync();
    expect(narration()).toBe('Insert zoo: start at the root.');
  });

  it('checks a practice answer, wrong then right, with a hint', () => {
    render();
    const section = /** @type {HTMLElement} */ (
      [...document.querySelectorAll('section')].find(
        (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
      )
    );
    const q = /** @type {HTMLElement} */ (section.querySelectorAll('li[aria-labelledby]')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '5';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Not quite');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Show a hint',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(/** @type {any} */ (m.practice[0]).hints[0]);
    answer.value = '7';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Correct!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
