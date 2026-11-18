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
    expect(status(q)).toBe('Em hãy trả lời trước khi kiểm tra.');
    type(q, '3 5');
    submit(q);
    expect(status(q)).toMatch(/Hãy nhập một số/);
    type(q, '8');
    submit(q);
    expect(status(q)).toBe('Chưa đúng, thử lại nhé. Em có thể mở gợi ý.');
    type(q, '7 comparisons');
    submit(q);
    expect(status(q)).toBe('Đúng rồi!');
    expect(q.textContent).toContain('Đã giải');
    expect(text()).toContain('Đã giải 1/5');
  });

  it('reveals hints one at a time and the solution only after a try', () => {
    render();
    const q = question(0);
    expect(() => buttonIn(q, 'Xem lời giải')).toThrow();
    click(buttonIn(q, 'Xem gợi ý'));
    expect(q.textContent).toContain('First hint');
    expect(q.textContent).not.toContain('Second hint');
    click(buttonIn(q, 'Gợi ý tiếp (1/2)'));
    expect(q.textContent).toContain('Second hint');
    expect(() => buttonIn(q, 'Gợi ý tiếp (2/2)')).toThrow();
    type(q, '1');
    submit(q);
    click(buttonIn(q, 'Xem lời giải'));
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
    expect(status(q)).toMatch(/Chưa đúng/);
    click(radios[1]);
    submit(q);
    expect(status(q)).toBe('Đúng rồi!');
  });

  it('checks a set of picks', () => {
    render();
    const q = question(2);
    const boxes = /** @type {NodeListOf<HTMLInputElement>} */ (
      q.querySelectorAll('input[type="checkbox"]')
    );
    click(boxes[0]);
    submit(q);
    expect(status(q)).toMatch(/Chưa đúng/);
    click(boxes[2]);
    submit(q);
    expect(status(q)).toBe('Đúng rồi!');
  });

  it('accepts a cost formula with free spacing', () => {
    render();
    const q = question(3);
    type(q, 'o( N log N )');
    submit(q);
    expect(status(q)).toBe('Đúng rồi!');
  });

  it('reorders items with the move buttons and keeps focus on the moved item', async () => {
    render();
    const q = question(4);
    const order = () => [...q.querySelectorAll('ol li span.flex-1')].map((s) => s.textContent);
    expect(order()).toEqual(['n²', 'log n', 'n']);
    submit(q);
    expect(status(q)).toMatch(/Chưa đúng/);
    const up = buttonIn(q, 'Đưa “log n” lên');
    up.focus();
    click(up);
    await tick();
    expect(order()).toEqual(['log n', 'n²', 'n']);
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Đưa “log n” lên');
    expect(q.textContent).toContain('“log n” giờ ở vị trí 1/3.');
    click(buttonIn(q, 'Đưa “n” lên'));
    expect(order()).toEqual(['log n', 'n', 'n²']);
    submit(q);
    expect(status(q)).toBe('Đúng rồi!');
  });

  it('remembers solved questions per id and resets them', () => {
    render('remember');
    const q = question(1);
    click(/** @type {HTMLInputElement} */ (q.querySelectorAll('input[type="radio"]')[1]));
    submit(q);
    expect(localStorage.getItem('tintuong:practice:remember')).toBe('[1]');
    unmount(/** @type {any} */ (app));
    document.body.innerHTML = '';
    render('remember');
    expect(text()).toContain('Đã giải 1/5');
    expect(question(1).textContent).toContain('Đã giải');
    click(buttonIn(document.body, 'Làm lại từ đầu'));
    expect(text()).toContain('Đã giải 0/5');
    expect(localStorage.getItem('tintuong:practice:remember')).toBeNull();
  });

  it.each(['algorithmally', 'algoatlas'])(
    'moves progress saved under the old %s key to the new key once',
    (old) => {
      localStorage.setItem(`${old}:practice:legacy`, '[0, 2]');
      render('legacy');
      expect(text()).toContain('Đã giải 2/5');
      expect(localStorage.getItem('tintuong:practice:legacy')).toBe('[0, 2]');
      expect(localStorage.getItem(`${old}:practice:legacy`)).toBeNull();
    },
  );

  it('keeps new-key progress over leftover old keys', () => {
    localStorage.setItem('tintuong:practice:both', '[1]');
    localStorage.setItem('algorithmally:practice:both', '[0, 2]');
    localStorage.setItem('algoatlas:practice:both', '[3]');
    render('both');
    expect(text()).toContain('Đã giải 1/5');
    expect(localStorage.getItem('tintuong:practice:both')).toBe('[1]');
    expect(localStorage.getItem('algorithmally:practice:both')).toBeNull();
    expect(localStorage.getItem('algoatlas:practice:both')).toBeNull();
  });

  it('prefers the newer old key over the oldest one', () => {
    localStorage.setItem('algorithmally:practice:older', '[1]');
    localStorage.setItem('algoatlas:practice:older', '[0, 2]');
    render('older');
    expect(text()).toContain('Đã giải 1/5');
    expect(localStorage.getItem('tintuong:practice:older')).toBe('[1]');
    expect(localStorage.getItem('algorithmally:practice:older')).toBeNull();
    expect(localStorage.getItem('algoatlas:practice:older')).toBeNull();
  });

  it('ignores unreadable stored progress', () => {
    localStorage.setItem('tintuong:practice:bad', '{"x":1}');
    render('bad');
    expect(text()).toContain('Đã giải 0/5');
    localStorage.setItem('tintuong:practice:range', '[0, 9, -1, 0, "2"]');
    unmount(/** @type {any} */ (app));
    render('range');
    expect(text()).toContain('Đã giải 1/5');
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
    expect(status(q)).toBe('Đúng rồi!');
    expect(text()).toContain('Đã giải 1/5');
  });
});
