// Converts a syllabus manifest into src/lib/curriculum/dsa.json.
//
//   node scripts/import-curriculum.js <manifest.json> [out.json]
//
// The manifest's `grades` become `levels`. Only whitelisted fields are kept, slugs longer than
// 80 characters are trimmed at a hyphen, and the "Level N — " prefix is dropped from level
// titles. Chapter blurbs are not part of the manifest: they are written by hand in the output
// file and carried over, by chapter slug, when the import runs again.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';

const MAX_SLUG = 80;

/** @param {string} slug */
function trimSlug(slug) {
  if (slug.length <= MAX_SLUG) return slug;
  const cut = slug.slice(0, MAX_SLUG + 1).lastIndexOf('-');
  return slug.slice(0, cut > 0 ? cut : MAX_SLUG);
}

/**
 * @param {any} manifest
 * @param {Record<string, string>} [blurbs]  Existing chapter blurbs by chapter slug.
 */
function convert(manifest, blurbs = {}) {
  return {
    subject: manifest.subject,
    levels: manifest.grades.map((/** @type {any} */ g) => ({
      level: g.grade,
      title: String(g.title).replace(/^Level \d+\s*[—-]\s*/, ''),
      chapters: g.chapters.map((/** @type {any} */ c) => {
        const slug = trimSlug(c.slug);
        return {
          no: c.no,
          title: c.title,
          slug,
          strand: c.strand,
          blurb: blurbs[slug] ?? '',
          lessons: c.lessons.map((/** @type {any} */ l) => ({
            no: l.no,
            title: l.title,
            slug: trimSlug(l.slug),
            kind: l.kind,
            keyIdeas: l.keyIdeas,
            interactiveIdea: l.interactiveIdea,
          })),
        };
      }),
    })),
  };
}

/** @param {string} file */
function readBlurbs(file) {
  if (!existsSync(file)) return {};
  const current = JSON.parse(readFileSync(file, 'utf8'));
  /** @type {Record<string, string>} */
  const blurbs = {};
  for (const level of current.levels ?? [])
    for (const c of level.chapters) if (c.blurb) blurbs[c.slug] = c.blurb;
  return blurbs;
}

async function main() {
  const [input, output = 'src/lib/curriculum/dsa.json'] = process.argv.slice(2);
  if (!input) {
    console.error('usage: node scripts/import-curriculum.js <manifest.json> [out.json]');
    process.exit(2);
  }
  const out = resolve(output);
  const data = convert(JSON.parse(readFileSync(resolve(input), 'utf8')), readBlurbs(out));
  const options = { ...(await resolveConfig(out)), filepath: out };
  writeFileSync(out, await format(JSON.stringify(data), options));
  const chapters = data.levels.flatMap((l) => l.chapters);
  const missing = chapters.filter((c) => !c.blurb).map((c) => c.slug);
  console.log(
    `${output}: ${data.levels.length} levels, ${chapters.length} chapters, ` +
      `${chapters.reduce((n, c) => n + c.lessons.length, 0)} lessons`,
  );
  if (missing.length) console.warn(`chapters without a blurb: ${missing.join(', ')}`);
}

await main();
