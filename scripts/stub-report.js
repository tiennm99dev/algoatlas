// Lists curriculum lessons that have no hand-written route yet (they render as stubs).
//
//   npm run stubs                    counts per level and topic
//   npm run stubs -- <topic>         one topic, with the unwritten lesson slugs
//   npm run stubs -- [<topic>] --strict   exit 1 while any stub remains in scope
//
// A lesson counts as written when src/routes/<topic>/<slug>/+page.svelte exists.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lessonRouteFile, stubReport } from '../src/lib/curriculum/stubs.js';

const root = fileURLToPath(new URL('..', import.meta.url));
/** @param {number} n */
const stubWord = (n) => (n === 1 ? 'stub' : 'stubs');
const usage = 'Usage: npm run stubs -- [<topic>] [--strict]';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const rest = args.filter((a) => a !== '--strict');
if (rest.length > 1 || rest.some((a) => a.startsWith('-'))) {
  console.error(usage);
  process.exit(2);
}
const onlyTopic = rest[0];

const curriculum = JSON.parse(
  readFileSync(new URL('../src/lib/curriculum/dsa.json', import.meta.url), 'utf8'),
);
/** @type {import('../src/lib/curriculum/index.js').Level[]} */
const levels = curriculum.levels;

if (onlyTopic !== undefined && !levels.some((l) => l.chapters.some((c) => c.slug === onlyTopic))) {
  console.error(`Unknown topic "${onlyTopic}". ${usage}`);
  process.exit(2);
}

const report = stubReport(
  levels,
  (topic, slug) => existsSync(`${root}${lessonRouteFile(topic, slug)}`),
  onlyTopic,
);

let planned = 0;
let stubs = 0;
for (const level of report) {
  console.log(`Level ${level.level}: ${level.title}`);
  for (const t of level.topics) {
    planned += t.planned;
    stubs += t.stubs.length;
    const written = t.planned - t.stubs.length;
    console.log(
      `  ${t.topic.padEnd(22)} ${`${written}/${t.planned}`.padStart(5)} written  ${t.stubs.length} ${stubWord(t.stubs.length)}`,
    );
    if (onlyTopic !== undefined) for (const slug of t.stubs) console.log(`    - ${slug}`);
  }
}
console.log(`Total: ${planned - stubs} of ${planned} lessons written, ${stubs} ${stubWord(stubs)}`);

if (strict && stubs > 0) process.exit(1);
