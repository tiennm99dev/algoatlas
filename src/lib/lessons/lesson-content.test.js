import { describe, expect, it } from 'vitest';
import { exerciseProblems } from '$lib/components/answer-check.js';
import { findLesson, lessonOrder } from '$lib/curriculum/index.js';
import { lessonPath, lessons } from './registry.js';

// Page sources, read as text, show which shared building blocks a lesson page uses.
const pageSources = /** @type {Record<string, string>} */ (
  import.meta.glob('/src/routes/*/*/+page.svelte', {
    query: '?raw',
    import: 'default',
    eager: true,
  })
);

/** @param {import('./registry.js').LessonCopy} lesson */
function sourceOf(lesson) {
  return pageSources[`/src/routes${lessonPath(lesson)}+page.svelte`] ?? '';
}

/**
 * The fewest questions and exercise types a lesson's practice block may have, by kind.
 * @type {Record<import('$lib/curriculum/index.js').LessonKind, { questions: number, types: number }>}
 */
const minimums = {
  theory: { questions: 3, types: 1 },
  practice: { questions: 5, types: 1 },
  review: { questions: 10, types: 3 },
};

/**
 * Lower case, `&` as 'and', typographic apostrophes as `'` and runs of spaces as one, so a
 * title and the sentence that mentions it compare as plain words.
 * @param {string} s
 */
const words = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

/**
 * The words of a lesson title that its teaser must contain: the part before a colon
 * ('Amortized analysis' of 'Amortized analysis: aggregate, …'), or for 'Practice: …' and
 * 'Review: …' titles, both the kind and the part after the colon.
 * @param {string} title
 * @returns {string[]}
 */
function titleWords(title) {
  const [head, ...rest] = words(title).split(':');
  const tail = rest.join(':').trim();
  return (head === 'practice' || head === 'review') && tail ? [head, tail] : [head.trim()];
}

describe('next-lesson teasers', () => {
  it.each(lessons.map((l) => [l.slug, l]))(
    '%s names the next lesson in curriculum order',
    (_, lesson) => {
      const next = findLesson(lessonOrder[lessonOrder.indexOf(lesson.slug) + 1] ?? '');
      if (!next) return;
      const teaser = words(lesson.nextTeaser);
      for (const part of titleWords(next.lesson.title)) {
        expect(teaser, `${lesson.slug} → ${next.lesson.title}`).toContain(part);
      }
    },
  );
});

describe.each(lessons.map((l) => [l.slug, l]))('lesson %s', (_, lesson) => {
  const plan = /** @type {NonNullable<ReturnType<typeof findLesson>>} */ (findLesson(lesson.slug));
  const kind = plan.lesson.kind;
  const source = sourceOf(lesson);

  it('keeps the curriculum title and fills the copy the layout renders', () => {
    expect(lesson.title).toBe(plan.lesson.title);
    for (const field of ['intro', 'instruction', 'nextTeaser']) {
      expect(lesson[/** @type {'intro'} */ (field)].trim().length, field).toBeGreaterThan(0);
    }
    expect(lesson.takeaways.length).toBeGreaterThanOrEqual(3);
    expect(lesson.complexity.length).toBeGreaterThan(0);
  });

  it('renders through the shared lesson layout', () => {
    expect(source).toContain('$lib/components/lesson-layout.svelte');
  });

  if (kind === 'theory') {
    it('steps through the algorithm with the shared player controls', () => {
      expect(source).toContain('$lib/components/step-controls.svelte');
    });
  }

  if (kind !== 'theory' || lesson.practice !== undefined) {
    it('has a well-formed practice block of the required size', () => {
      const practice = lesson.practice ?? [];
      const min = minimums[kind];
      expect(practice.length).toBeGreaterThanOrEqual(min.questions);
      expect(new Set(practice.map((ex) => ex.type)).size).toBeGreaterThanOrEqual(min.types);
      for (const [i, ex] of practice.entries())
        expect(exerciseProblems(ex), `question ${i + 1}`).toEqual([]);
      expect(source).toContain('$lib/components/practice-block.svelte');
      expect(source).toMatch(/exercises=\{\w+\.practice\}/);
    });
  }
});
