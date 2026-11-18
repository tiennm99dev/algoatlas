// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import GlossaryPage from './+page.svelte';
import GlossaryTerms from '$lib/components/glossary-terms.svelte';
import { allTerms } from '$lib/glossary/index.js';

/** @type {Record<string, any> | null} */
let app = null;

/** @param {import('svelte').Component<any>} Component @param {Record<string, any>} [props] */
function render(Component, props = {}) {
  app = mount(Component, { target: document.body, props });
  flushSync();
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = '';
});

const status = () => document.querySelector('[role="status"]')?.textContent?.trim();
const shown = () =>
  [...document.querySelectorAll('.glossary-entry')].filter((e) => !e.hasAttribute('hidden'));

/** @param {string} value */
function search(value) {
  const input = /** @type {HTMLInputElement} */ (document.querySelector('input[type="search"]'));
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

describe('glossary page', () => {
  it('lists every term under one heading per letter, with a labelled search field', () => {
    render(GlossaryPage);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('h1')?.textContent).toBe('Thuật ngữ');
    expect(shown()).toHaveLength(allTerms().length);
    expect(status()).toBe(`Tìm thấy ${allTerms().length} thuật ngữ`);
    const label = document.querySelector('label[for="glossary-search"]');
    expect(label?.textContent).toBe('Tìm thuật ngữ');
    const letters = [...document.querySelectorAll('h2')].map((h) =>
      h.firstChild?.textContent?.trim(),
    );
    expect(letters).toContain('D');
    expect(letters).not.toContain('Đ');
  });

  it('marks English names with lang="en" and gives English terms their meaning', () => {
    render(GlossaryPage);
    const stack = /** @type {HTMLElement} */ (document.getElementById('stack'));
    expect(stack.querySelector('dt')?.getAttribute('lang')).toBe('en');
    expect(stack.textContent).toContain('ngăn xếp');
    const window = /** @type {HTMLElement} */ (document.getElementById('cua-so-truot'));
    expect(window.querySelector('dt [lang="en"]')?.textContent).toBe('sliding window');
    expect(window.querySelector('a[href="/arrays-strings/sliding-window/"]')?.textContent).toBe(
      'Cửa sổ trượt',
    );
  });

  it('filters by name without tone marks, never by definition, and counts the result', () => {
    render(GlossaryPage);
    search('ngan xep');
    const ids = shown().map((e) => e.id);
    expect(ids).toContain('stack');
    expect(ids).toContain('call-stack');
    expect(status()).toBe(`Tìm thấy ${ids.length} thuật ngữ`);
    search('stack');
    expect(shown().map((e) => e.id)).toContain('stack-don-dieu');
    search('LIFO');
    expect(shown().map((e) => e.id)).toEqual(['stack']);
    search('zzzz');
    expect(shown()).toHaveLength(0);
    expect(status()).toBe('Không tìm thấy thuật ngữ nào.');
    expect(
      [...document.querySelectorAll('.glossary-letter')].every((s) => s.hasAttribute('hidden')),
    ).toBe(true);
    search('');
    expect(shown()).toHaveLength(allTerms().length);
  });
});

describe('glossary cross-links', () => {
  it('clear a search that hides the entry they point at', async () => {
    // jsdom has no layout, so it has no scrollIntoView either.
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(GlossaryPage);
    search('LIFO');
    const link = /** @type {HTMLAnchorElement} */ (
      document.querySelector('#stack a[href="#queue"]')
    );
    link.click();
    flushSync();
    expect(
      /** @type {HTMLInputElement} */ (document.querySelector('input[type="search"]')).value,
    ).toBe('');
    expect(document.getElementById('queue')?.hasAttribute('hidden')).toBe(false);
    await tick();
    expect(scroll).toHaveBeenCalledOnce();
  });
});

describe('lesson glossary block', () => {
  it('links the terms a lesson teaches to their entries', () => {
    render(GlossaryTerms, { topic: 'stacks-queues', slug: 'queues-deques' });
    expect(document.querySelector('h2')?.textContent?.trim()).toBe('Thuật ngữ trong bài');
    const links = [...document.querySelectorAll('li a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/thuat-ngu/#deque',
      '/thuat-ngu/#queue',
    ]);
    expect(document.querySelector('li')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'deque: hàng đợi hai đầu',
    );
    expect(document.body.textContent).toContain('Xem tất cả thuật ngữ');
  });

  it('shows nothing for a lesson that teaches no terms', () => {
    render(GlossaryTerms, { topic: 'stacks-queues', slug: 'practice-stacks-queues' });
    expect(document.body.textContent?.trim()).toBe('');
  });
});
