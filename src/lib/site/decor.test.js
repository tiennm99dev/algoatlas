import { describe, expect, it } from 'vitest';
import css from './decor.css?raw';
import appCss from '../../app.css?raw';

// The decoration is plain files: the tokens, the hand-drawn SVGs and the theme block of
// app.css. They load as CSS backgrounds, so they are read here as text.
const files = /** @type {Record<string, string>} */ (
  import.meta.glob('./decor/*', { query: '?raw', import: 'default', eager: true })
);
const svgs = Object.entries(files)
  .filter(([path]) => path.endsWith('.svg'))
  .map(([path, text]) => ({ name: path.slice('./decor/'.length), text }));
const cases = /** @type {[string, string][]} */ (svgs.map((s) => [s.name, s.text]));
/** @param {string} text */
const bytes = (text) => new TextEncoder().encode(text).length;

const KB = 1024;
const ALLOWED = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
]);

describe('decoration tokens', () => {
  it.each(['--tile-line', '--spot-line', '--subject-tint', '--subject-ink'])(
    'defines %s',
    (name) => {
      expect(css).toMatch(new RegExp(`${name}:\\s*[^;]+;`));
    },
  );

  it('points every url() at a file that exists', () => {
    const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(Object.hasOwn(files, url), url).toBe(true);
  });

  it('gives every band token a value in app.css and keeps the theme block small', () => {
    const start = appCss.indexOf('/* theme:start');
    const end = appCss.indexOf('/* theme:end */');
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    const theme = appCss.slice(start, end);
    expect(bytes(theme)).toBeLessThanOrEqual(3 * KB);
    for (const used of new Set([...theme.matchAll(/var\((--[a-z-]+)/g)].map((m) => m[1]))) {
      const declared = new RegExp(`${used}:`).test(theme) || new RegExp(`${used}:`).test(css);
      expect(declared, used).toBe(true);
    }
  });
});

describe('decoration files', () => {
  it('stay inside the byte budget', () => {
    const total = Object.values(files).reduce((sum, text) => sum + bytes(text), bytes(css));
    expect(total).toBeLessThanOrEqual(24 * KB);
    for (const { name, text } of svgs) {
      const limit = name.startsWith('tile-') ? 6 * KB : 3 * KB;
      expect(bytes(text), name).toBeLessThanOrEqual(limit);
    }
  });

  it.each(cases)('%s uses only plain shapes', (name, text) => {
    const tags = [...text.matchAll(/<([a-zA-Z][\w:-]*)/g)].map((m) => m[1]);
    for (const tag of tags) expect(ALLOWED.has(tag), `${name}: <${tag}>`).toBe(true);
    expect(text).not.toMatch(/href|style=|filter|mask|gradient|<!--|\sid=/i);
    expect(text.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/https?:/);
  });

  it.each(cases)('%s has a square viewBox of the right size', (name, text) => {
    const size = name.startsWith('tile-') ? 480 : 120;
    expect(text).toContain(`viewBox="0 0 ${size} ${size}"`);
  });

  it.each(cases)('%s rounds coordinates to one decimal', (name, text) => {
    expect(text).not.toMatch(/\d\.\d{2,}/);
  });
});
