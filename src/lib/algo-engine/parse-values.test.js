import { describe, expect, it } from 'vitest';
import { parseValueList } from './parse-values.js';

const limits = { min: -9, max: 9, minN: 2, maxN: 3, signed: true };

describe('parseValueList', () => {
  it('reads commas, spaces and typographic minus signs', () => {
    expect(parseValueList('1, −2 3', limits)).toEqual({ values: [1, -2, 3] });
  });

  it('reports format, then range, then count', () => {
    expect(parseValueList('', limits)).toEqual({ error: 'format' });
    expect(parseValueList('1 x', limits)).toEqual({ error: 'format' });
    expect(parseValueList('10', limits)).toEqual({ error: 'range' });
    expect(parseValueList('1', limits)).toEqual({ error: 'count' });
    expect(parseValueList('1 2 3 4', limits)).toEqual({ error: 'count' });
  });

  it('refuses a minus sign unless the list is signed', () => {
    expect(parseValueList('-1', { max: 9, maxN: 3 })).toEqual({ error: 'format' });
  });
});
