// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { scrollRegions, updateRegion } from './scroll-regions.js';

/**
 * A box with the given content and sizes; jsdom does no layout, so the sizes are set by hand.
 * @param {string} html @param {{ scroll?: number, client?: number, scrollH?: number, clientH?: number }} size
 * @param {string} [cls]
 */
function box(
  html,
  { scroll = 100, client = 100, scrollH = 50, clientH = 50 },
  cls = 'overflow-x-auto',
) {
  const el = document.createElement('div');
  el.className = cls;
  el.innerHTML = html;
  /** @param {string} key @param {number} value */
  const set = (key, value) => Object.defineProperty(el, key, { configurable: true, value });
  set('scrollWidth', scroll);
  set('clientWidth', client);
  set('scrollHeight', scrollH);
  set('clientHeight', clientH);
  document.body.append(el);
  return { el, set };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('updateRegion', () => {
  it('gives an overflowing box with nothing focusable a tab stop, and takes it back', () => {
    const { el, set } = box('<svg></svg>', { scroll: 300 });
    updateRegion(el);
    expect(el.tabIndex).toBe(0);
    expect(el.hasAttribute('data-scroll-region')).toBe(true);
    set('scrollWidth', 100);
    updateRegion(el);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.hasAttribute('data-scroll-region')).toBe(false);
  });

  it('counts a box that scrolls up and down', () => {
    const { el } = box('<table></table>', { scrollH: 400, clientH: 384 }, 'overflow-auto');
    updateRegion(el);
    expect(el.tabIndex).toBe(0);
  });

  it('leaves a box with a control, an author tabindex or a ScrollFrame alone', () => {
    const withButton = box('<button>Go</button>', { scroll: 300 }).el;
    updateRegion(withButton);
    expect(withButton.hasAttribute('tabindex')).toBe(false);

    const authored = box('<svg></svg>', { scroll: 300 }).el;
    authored.tabIndex = -1;
    updateRegion(authored);
    expect(authored.tabIndex).toBe(-1);
    expect(authored.hasAttribute('data-scroll-region')).toBe(false);

    const frame = box('<svg></svg>', { scroll: 300 }).el;
    frame.setAttribute('data-scroll-frame', '');
    updateRegion(frame);
    expect(frame.hasAttribute('tabindex')).toBe(false);
  });
});

describe('scrollRegions', () => {
  it('marks the scrolling boxes inside the root and stops on destroy', () => {
    const wide = box('<svg></svg>', { scroll: 300 }).el;
    const narrow = box('<svg></svg>', {}).el;
    const plain = box('<svg></svg>', { scroll: 300 }, 'flex').el;
    const action = scrollRegions(document.body);
    expect(wide.tabIndex).toBe(0);
    expect(narrow.hasAttribute('tabindex')).toBe(false);
    expect(plain.hasAttribute('tabindex')).toBe(false);
    action.destroy();
  });
});
