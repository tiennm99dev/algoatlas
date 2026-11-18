// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { SNIPPETS } from '$lib/algo-engine/practice-complexity.js';
import { vi as m } from '$lib/lessons/practice-complexity/copy.vi.js';

/** @typedef {import('$lib/algo-engine/practice-complexity.js').SnippetId} SnippetId */

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
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

const narration = () => document.querySelector('p[aria-live]')?.textContent?.trim() ?? '';
const status = () => document.querySelector('[role="status"]')?.textContent?.trim() ?? '';

/** @param {SnippetId} id */
function card(id) {
  const el = document.querySelector(`button[aria-label^="${m.cards[id]},"]`);
  if (!el) throw new Error(`no card ${id}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {string} name */
const bucket = (name) =>
  /** @type {HTMLElement} */ (document.querySelector(`section[aria-label="${name}"]`));

/** @param {SnippetId} id @param {import('$lib/algo-engine/practice-complexity.js').Bucket} b */
function move(id, b) {
  click(card(id));
  click(button(m.putHereLabel(m.buckets[b])));
}

/** @param {string} label */
function stat(label) {
  const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent?.trim() === label);
  return dt?.nextElementSibling?.textContent?.trim();
}

function practice() {
  const section = [...document.querySelectorAll('section')].find(
    (s) => s.querySelector('h2')?.textContent?.trim() === m.practiceTitle,
  );
  if (!section) throw new Error('no practice block');
  return /** @type {HTMLElement} */ (section);
}

describe('practice: estimating running time', () => {
  it('measures the first card as n doubles', () => {
    render();
    expect(narration()).toContain('Hai vòng lặp đầy đủ: ta sẽ chạy nó với n = 1, 2, 4, …');
    click(button('Bước tiếp'));
    click(button('Bước tiếp'));
    expect(narration()).toBe(
      'n = 2: dòng được tô sáng đã chạy 4 lần. Nhân đôi n làm số lần nhân lên 4 (+3).',
    );
    click(button('Đến bước cuối'));
    expect(stat(m.stats.count)).toBe('1048576');
    expect(stat(m.stats.ratio)).toBe('× 4');
    expect(narration()).toContain('Xong ở n = 1024 với 1048576 thao tác.');
  });

  it('picking a card loads its experiment and the bucket button places it', () => {
    render();
    click(card('triangle'));
    expect(card('triangle').getAttribute('aria-pressed')).toBe('true');
    expect(status()).toBe(m.picked(m.cards.triangle));
    expect(document.body.textContent).toContain(m.measuring(m.cards.triangle));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.count)).toBe('524800');
    click(button(m.putHereLabel('O(n²)')));
    expect(bucket('O(n²)').textContent).toContain(m.cards.triangle);
    expect(bucket(m.trayTitle).textContent).not.toContain(m.cards.triangle);
    expect(status()).toBe(m.moved(m.cards.triangle, 'O(n²)'));
  });

  it('refuses a bucket with no card picked and sends a card back to the tray', () => {
    render();
    click(button(m.putHereLabel('O(1)')));
    expect(status()).toBe(m.noPick);
    move('formula', 'n');
    click(card('formula'));
    click(button(m.toTrayLabel));
    expect(bucket(m.trayTitle).textContent).toContain(m.cards.formula);
  });

  it('grades the sorting, reveals the answers and starts over', () => {
    render();
    move('nested', 'n2');
    move('halving', 'n');
    click(buttonByText(m.check));
    expect(status()).toBe(m.score(1, 10, 8));
    expect(card('nested').getAttribute('aria-label')).toContain(m.verdicts.right);
    expect(card('halving').getAttribute('aria-label')).toContain(m.verdicts.wrong);
    expect(document.body.textContent).toContain(m.why.nested);
    click(buttonByText(m.reveal));
    for (const s of SNIPPETS)
      expect(bucket(m.buckets[s.bucket]).textContent).toContain(m.cards[s.id]);
    expect(card('halving').getAttribute('aria-label')).toContain(m.verdicts.right);
    click(buttonByText(m.check));
    expect(status()).toBe(m.allRight);
    click(buttonByText(m.reset));
    expect(bucket(m.trayTitle).querySelectorAll('li button')).toHaveLength(SNIPPETS.length);
  });

  it('places a card by drag and drop and by keyboard', () => {
    render();
    card('fib').dispatchEvent(new Event('dragstart', { bubbles: true }));
    flushSync();
    bucket('O(2ⁿ)').dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
    flushSync();
    expect(bucket('O(2ⁿ)').textContent).toContain(m.cards.fib);
    expect(document.body.textContent).toContain(m.measuring(m.cards.fib));
    click(button('Đến bước cuối'));
    expect(stat(m.stats.count)).toBe('3193');
    const target = card('single');
    target.focus();
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    target.click();
    flushSync();
    expect(card('single').getAttribute('aria-pressed')).toBe('true');
  });

  it('checks a question with a hint', () => {
    render();
    const q = /** @type {HTMLElement} */ (practice().querySelectorAll('ol > li')[0]);
    const answer = /** @type {HTMLInputElement} */ (q.querySelector('input[name="answer"]'));
    const submit = () => {
      q.querySelector('form')?.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      flushSync();
    };
    answer.value = '4096';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Chưa đúng');
    const hint = [...q.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Xem gợi ý',
    );
    click(/** @type {HTMLButtonElement} */ (hint));
    expect(q.textContent).toContain(m.practice[0].hints[0]);
    answer.value = '2080';
    answer.dispatchEvent(new Event('input', { bubbles: true }));
    submit();
    expect(q.textContent).toContain('Đúng rồi!');
    for (const ex of m.practice) expect(exerciseProblems(ex)).toEqual([]);
  });
});
