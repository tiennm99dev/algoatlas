import { describe, expect, it } from 'vitest';
import { newToneMarks, oldToneMarks } from './tone-marks.js';

describe('newToneMarks', () => {
  it.each([
    ['hóa học', 'hoá học'],
    ['Hóa học', 'Hoá học'],
    ['HÓA HỌC', 'HOÁ HỌC'],
    ['hòa tan', 'hoà tan'],
    ['dầu hỏa', 'dầu hoả'],
    ['Thủy ngân', 'Thuỷ ngân'],
    ['tỏa nhiệt', 'toả nhiệt'],
    ['khóa', 'khoá'],
    ['lũy thừa', 'luỹ thừa'],
    ['tùy ý', 'tuỳ ý'],
    ['sức khỏe', 'sức khoẻ'],
    ['nhụy hoa', 'nhuỵ hoa'],
    ['tuyến tụy', 'tuyến tuỵ'],
    ['thỏa mãn', 'thoả mãn'],
    ['tọa độ', 'toạ độ'],
    ['(hóa)', '(hoá)'],
    ['oxi hóa-khử', 'oxi hoá-khử'],
  ])('%s → %s', (old, next) => {
    expect(newToneMarks(old)).toBe(next);
  });

  it('leaves closed syllables, qu syllables and new-style words alone', () => {
    const keep = 'khoảng cách, hoàn thành, thuyền, toán, quý, quả, quỳ, hoá, thuỷ, của, mùa';
    expect(newToneMarks(keep)).toBe(keep);
    expect(oldToneMarks(keep)).toEqual([]);
  });

  it('leaves unaccented slugs and ids alone', () => {
    const slug = 'hoa-hoc/bai-1-thuy-ngan';
    expect(newToneMarks(slug)).toBe(slug);
  });
});

describe('oldToneMarks', () => {
  it('lists each old-style word', () => {
    expect(oldToneMarks('Hóa học và thủy tinh, hóa trị')).toEqual(['Hóa', 'thủy', 'hóa']);
  });
});

/** Every source that can hold copy: lessons, curriculum, site text, components and engines. */
const sources = /** @type {Record<string, string>} */ (
  import.meta.glob(
    [
      '/src/lib/**/*.{js,svelte,json}',
      '/src/routes/**/*.{js,svelte}',
      '!/src/lib/components/tone-marks*.js',
    ],
    { eager: true, query: '?raw', import: 'default' },
  )
);

describe('site copy', () => {
  it('uses the new tone-mark style for any Vietnamese (hoá, thuỷ, khoẻ)', () => {
    const bad = Object.entries(sources).flatMap(([path, text]) => {
      const words = oldToneMarks(text);
      return words.length ? [`${path}: ${[...new Set(words)].join(', ')}`] : [];
    });
    expect(bad).toEqual([]);
  });
});
