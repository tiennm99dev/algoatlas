// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
import { mergeSortTrace, quickSortTrace } from '$lib/algo-engine/merge-quick-sort.js';
import { makeArray, toItems } from '$lib/algo-engine/sorting.js';

const INITIAL = [42, 17, 88, 5, 63, 29, 71, 12, 95, 36, 54, 24];

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
  vi.useRealTimers();
});

/** @param {string} label */
function button(label) {
  const el = document.querySelector(`button[aria-label="${label}"]`);
  if (!el) throw new Error(`no button labelled ${label}`);
  return /** @type {HTMLButtonElement} */ (el);
}

/** @param {HTMLElement} el */
function click(el) {
  el.click();
  flushSync();
}

/** @param {string} value */
function pickAlgo(value) {
  click(/** @type {HTMLInputElement} */ (document.querySelector(`input[value="${value}"]`)));
}

/** @param {string} selector @param {string} value */
function choose(selector, value) {
  const el = /** @type {HTMLSelectElement} */ (document.querySelector(selector));
  el.value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

/** @param {string} label */
function buttonByText(label) {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === label);
  if (!el) throw new Error(`no button reading ${label}`);
  return el;
}

const text = () => document.body.textContent ?? '';
const scrub = () =>
  /** @type {HTMLInputElement} */ (document.querySelector('input[aria-label="Bước"]'));

/** @param {number} index */
function seek(index) {
  const el = scrub();
  el.value = String(index);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

describe('merge and quick sort lesson', () => {
  it('splits the whole array on the first step', () => {
    render();
    click(button('Bước tiếp'));
    expect(text()).toContain('Chia [0–11] tại 5');
  });

  it('switches between the two algorithms and their pseudocode', () => {
    render();
    pickAlgo('quick');
    expect(text()).toContain('i = lo - 1');
    expect(text()).toContain('Các đoạn còn phải sắp xếp');
    pickAlgo('merge');
    expect(text()).toContain('aux = copy(a[lo..hi])');
    expect(text()).toContain('Call stack (ngoài cùng trước)');
  });

  it('keeps the pivot rule in place but enabled only for quicksort', () => {
    render();
    const pivot = /** @type {HTMLSelectElement} */ (document.querySelector('select[name="pivot"]'));
    expect(pivot.disabled).toBe(true);
    pickAlgo('quick');
    expect(pivot.disabled).toBe(false);
  });

  it('names the write action per algorithm in the legend', () => {
    render();
    expect(text()).toContain('Đang ghi vào mảng');
    pickAlgo('quick');
    expect(text()).toContain('Đang đổi chỗ');
    expect(text()).not.toContain('Đang ghi vào mảng');
  });

  it('caps the size slider where every buffer marker still fits', () => {
    render();
    const range = /** @type {HTMLInputElement} */ (document.querySelector('input[type="range"]'));
    expect(range.max).toBe('20');
  });

  it('finishes sorted with the totals in the narration', () => {
    render();
    click(button('Đến bước cuối'));
    expect(text()).toMatch(/Đã sắp xếp xong với \d+ lần so sánh và \d+ lần ghi\./);
    expect(document.querySelector('[role="img"]')?.getAttribute('aria-label')).toContain(
      'Đã xếp xong 12/12 phần tử',
    );
  });

  it('lists the total cost of both algorithms', () => {
    render();
    expect(text()).toMatch(/Merge sort\s*\d+ lần so sánh · \d+ lần ghi/);
    expect(text()).toMatch(/Quicksort\s*\d+ lần so sánh · \d+ lần đổi chỗ/);
    expect(text()).toContain('mảng này không có giá trị bằng nhau');
  });

  it('claims stability only when the array has equal values', () => {
    render();
    expect(text()).not.toContain('các giá trị bằng nhau giữ nguyên thứ tự');
    expect(text()).not.toContain('các giá trị bằng nhau bị đảo thứ tự');
    const preset = /** @type {HTMLSelectElement} */ (document.querySelector('select.field'));
    preset.value = 'few-unique';
    preset.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(text()).toContain('các giá trị bằng nhau giữ nguyên thứ tự');
  });

  it('keeps the buffer row mounted from the first frame while merge sort is selected', () => {
    render();
    const row = document.querySelector('[aria-label^="Vùng đệm:"]');
    expect(row).not.toBeNull();
    expect(row?.getAttribute('aria-label')).toBe('Vùng đệm: rỗng.');
    pickAlgo('quick');
    expect(document.querySelector('[aria-label^="Vùng đệm:"]')).toBeNull();
  });

  it('captions the buffer row during a merge', () => {
    render();
    const copy = mergeSortTrace(toItems(INITIAL)).findIndex((f) => f.kind === 'copy');
    seek(copy);
    expect(text()).toContain('Vùng đệm: bản sao của đoạn đang được trộn.');
    pickAlgo('quick');
    expect(text()).not.toContain('Vùng đệm: bản sao của đoạn đang được trộn.');
  });

  it('shows the merge buffer contents once a merge starts', () => {
    render();
    const copy = mergeSortTrace(toItems(INITIAL)).findIndex((f) => f.kind === 'copy');
    seek(copy);
    expect(document.querySelector('[aria-label^="Vùng đệm:"]')).not.toBeNull();
  });

  it('marks merged runs and the buffer head and taken slots with text', () => {
    render();
    const trace = mergeSortTrace(toItems(INITIAL));
    const runFrame = trace.findIndex((f) => f.runs.length > 0 && f.kind !== 'take');
    seek(runFrame);
    const chart = document.querySelector('[role="img"]');
    expect(chart?.textContent).toContain('▬');
    expect(chart?.getAttribute('aria-label')).toMatch(/Đang xử lí \[\d+–\d+\]\./);
    expect(text()).toContain('▬ Đoạn đã trộn');

    // A take frame after the first slot is written has a head and a taken slot in the buffer.
    const take = trace.findIndex(
      (f) => f.kind === 'take' && f.range && f.range[1] - f.range[0] >= 3 && f.k === f.range[0] + 1,
    );
    seek(take);
    const buffer = document.querySelector('[aria-label^="Vùng đệm:"]');
    expect(buffer?.textContent).toContain('↑');
    expect(buffer?.textContent).toContain('✕');
    expect(buffer?.getAttribute('aria-label')).toMatch(/Đã lấy 2\. Tiếp theo của đoạn/);
  });

  it('shows the pivot pre-swap as a write on the pivot frame', () => {
    render();
    pickAlgo('quick');
    const preset = /** @type {HTMLSelectElement} */ (
      document.querySelector('select[name="pivot"]')
    );
    preset.value = 'median3';
    preset.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    // Median-of-three on a fresh trace differs per array, so find the frame from what is drawn.
    const last = /** @type {HTMLInputElement} */ (
      document.querySelector('input[aria-label="Bước"]')
    );
    const frames = Number(last.max) + 1;
    let seen = false;
    for (let i = 0; i < frames && !seen; i++) {
      seek(i);
      if (text().includes('Đưa chốt đã chọn về cuối')) {
        const chart = document.querySelector('[aria-label^="Mảng:"]');
        expect((chart?.textContent?.match(/⇄/g) ?? []).length).toBe(2);
        seen = true;
      }
    }
    expect(seen).toBe(true);
  });

  it('loads an ascending array for the sorted preset, so last-pivot quicksort recurses once per element', () => {
    render();
    choose('select.field', 'sorted');
    const expected = makeArray('sorted', 12);
    expect(document.querySelector('[aria-label^="Mảng:"]')?.getAttribute('aria-label')).toContain(
      `Mảng: ${expected.join(', ')}.`,
    );
    pickAlgo('quick');
    click(button('Đến bước cuối'));
    expect(text()).toContain('(tối đa 11, cân bằng ≈ 4)');
  });

  it('draws the quicksort low side with the run marker during a scan', () => {
    render();
    pickAlgo('quick');
    const trace = quickSortTrace(toItems(INITIAL), 'last', Math.random);
    const scan = trace.findIndex((f) => f.kind === 'scan' && f.range && f.i >= f.range[0]);
    expect(scan).toBeGreaterThan(0);
    const before = trace.findIndex((f) => f.kind === 'scan');
    seek(before);
    expect(document.querySelector('[aria-label^="Mảng:"]')?.textContent).not.toContain('▬');
    seek(scan);
    expect(document.querySelector('[aria-label^="Mảng:"]')?.textContent).toContain('▬');
    expect(text()).toContain('▬ ≤ chốt, phía thấp');
  });

  it('states the stability verdict in the done narration', () => {
    render();
    click(button('Đến bước cuối'));
    expect(text()).not.toContain('Các giá trị bằng nhau');
    choose('select.field', 'few-unique');
    click(button('Đến bước cuối'));
    expect(text()).toMatch(/lần ghi\. Các giá trị bằng nhau giữ nguyên thứ tự\./);
    pickAlgo('quick');
    click(button('Đến bước cuối'));
    const narration = text();
    const reordered = narration.match(
      /Các giá trị bằng nhau bị đảo thứ tự: \d+ \(ban đầu đứng thứ \d+\) giờ đứng sau/,
    );
    const kept = narration.includes('Các giá trị bằng nhau giữ nguyên thứ tự.');
    expect(reordered !== null || kept).toBe(true);
  });

  it('announces a rebuild caused by the preset, size, or pivot rule', () => {
    render();
    choose('select.field', 'reversed');
    expect(text()).toContain('Đã nạp mảng mới.');
    click(button('Bước tiếp'));
    const range = /** @type {HTMLInputElement} */ (document.querySelector('input[type="range"]'));
    range.value = '8';
    range.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    expect(text()).toContain('Đã nạp mảng mới.');
    pickAlgo('quick');
    choose('select[name="pivot"]', 'median3');
    expect(text()).toContain('Quy tắc chọn chốt: Trung vị của ba. Đã dựng lại cả hai lần chạy.');
  });

  it('confirms a new array in the narration and drops it on the next frame', () => {
    render();
    click(buttonByText('Mảng mới'));
    expect(text()).toContain('Đã nạp mảng mới.');
    click(button('Bước tiếp'));
    expect(text()).not.toContain('Đã nạp mảng mới.');
  });
});
