import { describe, expect, it } from 'vitest';
import { oldToneMarks } from '$lib/components/tone-marks.js';
import { chapters, findLesson } from '$lib/curriculum/index.js';
import { english } from '$lib/i18n/glossary.js';
import { allTerms, fold, groups, letterOf, termsForLesson } from './index.js';

// Raw sources, for the size budget only.
const rawFiles = /** @type {Record<string, string>} */ (
  import.meta.glob(['./*.js', '!./index.js', '!./*.test.js'], {
    query: '?raw',
    import: 'default',
    eager: true,
  })
);

/** The data files the spec names, with the topics each one owns. */
const expectedTopics = {
  './analysis.js': ['complexity', 'recursion'],
  './arrays-sorting-searching.js': ['arrays-strings', 'sorting', 'searching'],
  './linear-structures.js': ['linked-lists', 'stacks-queues', 'structures'],
  './trees-heaps.js': ['trees', 'heaps', 'balanced-bst', 'advanced-heaps'],
  './graphs.js': ['graphs', 'shortest-paths', 'union-find', 'mst', 'advanced-graphs', 'flows'],
  './design-techniques.js': [
    'divide-and-conquer',
    'greedy',
    'dynamic-programming',
    'backtracking',
    'advanced-dp',
  ],
  './queries-strings.js': ['range-queries', 'string-algorithms', 'tree-techniques'],
  './maths-theory.js': [
    'number-theory',
    'geometry',
    'algebraic-randomised',
    'intractability',
    'computation-models',
  ],
};

const KEYS = new Set(['id', 'term', 'vi', 'en', 'def', 'lesson', 'see', 'aka']);
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Ids the glossary page already uses for itself, which an entry anchor must not take.
const RESERVED = /^(main|chu-.*|glossary-.*)$/;
const terms = allTerms();
const ids = new Set(terms.map((e) => e.id));
const englishTerms = new Set(english.map((t) => t.en));
const isStringArray = (/** @type {unknown} */ v) =>
  Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.length > 0);

describe('glossary files', () => {
  it('are exactly the eight group files, each owning its topics', () => {
    expect(Object.keys(groups).sort()).toEqual(Object.keys(expectedTopics).sort());
    for (const [file, group] of Object.entries(groups)) {
      expect(Object.keys(group).sort(), file).toEqual(['entries', 'topics']);
      expect(group.topics, file).toEqual(expectedTopics[/** @type {'./graphs.js'} */ (file)]);
    }
  });

  it('give every topic except the reviews to exactly one file', () => {
    const owned = Object.values(groups).flatMap((g) => g.topics);
    expect(new Set(owned).size).toBe(owned.length);
    const expected = chapters.map((c) => c.slug).filter((s) => !s.startsWith('review-'));
    expect([...owned].sort()).toEqual([...expected].sort());
  });

  it('hold 12 to 40 entries each, at most 3 per lesson', () => {
    for (const [file, group] of Object.entries(groups)) {
      expect(group.entries.length, file).toBeGreaterThanOrEqual(12);
      expect(group.entries.length, file).toBeLessThanOrEqual(40);
      /** @type {Record<string, number>} */
      const perLesson = {};
      for (const e of group.entries) perLesson[e.lesson] = (perLesson[e.lesson] ?? 0) + 1;
      for (const [lesson, n] of Object.entries(perLesson))
        expect(n, `${file} ${lesson}`).toBeLessThanOrEqual(3);
    }
  });

  it('stay within 64 KB of source in all', () => {
    const bytes = Object.values(rawFiles).reduce(
      (n, s) => n + new TextEncoder().encode(s).length,
      0,
    );
    expect(bytes).toBeLessThanOrEqual(64 * 1024);
  });
});

describe.each(Object.entries(groups))('glossary entries in %s', (file, group) => {
  it('have only the known fields, with the right types', () => {
    for (const e of group.entries) {
      for (const k of Object.keys(e)) expect(KEYS.has(k), `${e.id}.${k}`).toBe(true);
      for (const k of ['id', 'term', 'def', 'lesson'])
        expect(typeof e[/** @type {'id'} */ (k)], `${e.id}.${k}`).toBe('string');
      if (e.see !== undefined) expect(isStringArray(e.see), `${e.id}.see`).toBe(true);
      if (e.aka !== undefined) expect(isStringArray(e.aka), `${e.id}.aka`).toBe(true);
      expect(e.id, e.id).toMatch(ID_RE);
      expect(e.id, e.id).not.toMatch(RESERVED);
    }
  });

  it('give an English term its Vietnamese meaning and a Vietnamese term its English name', () => {
    for (const e of group.entries) {
      const isEnglish = englishTerms.has(e.term);
      expect(typeof (isEnglish ? e.vi : e.en), `${e.id}: ${e.term}`).toBe('string');
      expect(isEnglish ? e.en : e.vi, `${e.id}: only one of vi and en`).toBeUndefined();
      if (e.en !== undefined) expect(e.en, e.id).toMatch(/^[\x20-\x7e]+$/);
    }
  });

  it('point at a lesson of one of the file topics, and at existing entries', () => {
    for (const e of group.entries) {
      const [topic, slug] = e.lesson.split('/');
      expect(group.topics, `${e.id}: ${e.lesson}`).toContain(topic);
      expect(findLesson(slug)?.chapter.slug, `${e.id}: ${e.lesson}`).toBe(topic);
      for (const id of e.see ?? []) {
        expect(ids.has(id), `${e.id} → ${id}`).toBe(true);
        expect(id, e.id).not.toBe(e.id);
      }
    }
  });

  it('define each term in one or two plain sentences', () => {
    for (const e of group.entries) {
      const strings = [e.term, e.def, e.vi ?? '', ...(e.aka ?? [])];
      for (const s of strings) {
        expect(s.normalize('NFC'), e.id).toBe(s);
        expect(oldToneMarks(s), e.id).toEqual([]);
      }
      expect(e.def.length, e.id).toBeLessThanOrEqual(240);
      expect(e.def, e.id).toMatch(/^\p{Lu}.*\.$/u);
      // No TeX, Markdown or HTML: math is written with Unicode symbols (x², ≤, √, →).
      expect(e.def, e.id).not.toMatch(/[$`\\]|\*\*|\]\(|<\/?[a-z][^>]*>/i);
      expect(e.def.split(/[.!?](?:\s|$)/).filter((s) => s.trim()).length, e.id).toBeLessThan(3);
      expect(fold(e.def).startsWith(fold(e.term)), `${e.id} opens with its term`).toBe(false);
    }
  });
});

describe('glossary', () => {
  it('gives every entry an id unique across the site and every term one entry', () => {
    expect(ids.size).toBe(terms.length);
    const folded = terms.map((e) => fold(e.term));
    expect(new Set(folded).size).toBe(folded.length);
  });

  it('has an entry for every term the site writes in English', () => {
    const written = new Set(terms.map((e) => e.term));
    for (const { en } of english) expect(written.has(en), en).toBe(true);
  });

  it('sorts the Vietnamese way and files Đ under D', () => {
    const order = terms.map((e) => e.term);
    expect(order.indexOf('đồ thị')).toBeGreaterThan(order.indexOf('dãy con chung dài nhất'));
    expect(letterOf('đồ thị')).toBe('D');
    expect(letterOf('ước chung lớn nhất')).toBe('U');
    expect(letterOf('bài toán 2-SAT')).toBe('B');
    expect(fold('Ngăn xếp ĐƯỢC')).toBe('ngan xep duoc');
  });

  it('finds the terms a lesson teaches', () => {
    expect(termsForLesson('stacks-queues', 'stacks').map((e) => e.id)).toEqual(['stack']);
    expect(termsForLesson('stacks-queues', 'practice-stacks-queues')).toEqual([]);
  });
});
