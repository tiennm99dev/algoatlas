#!/usr/bin/env node
/**
 * Reports the gzip size of the client JS and the size of the prerendered "Thuật ngữ" page after
 * `npm run build`, and exits 1 when any single chunk is over the hard limit or the glossary page
 * passes its budget.
 *
 *   npm run size-report
 *
 * Every `.js` file under `.svelte-kit/output/client/_app/immutable/` counts, not only lesson
 * chunks: the shared layout, the entry and any chunk every page loads (such as the lesson
 * registry) can grow just as easily as one lesson can. The ten largest are listed.
 *
 * Budget: no client chunk may pass 60 KB gzip. `build/thuat-ngu/index.html` must exist and stay
 * within 540 KB raw and 100 KB gzip, with all its `class="…"` attributes together within 40 KB.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const IMMUTABLE_DIR = '.svelte-kit/output/client/_app/immutable';
const CHUNK_LIMIT = 60 * 1024;
const SHOWN = 10;
const GLOSSARY_PAGE = 'build/thuat-ngu/index.html';
const GLOSSARY_LIMITS = { raw: 540 * 1024, gzip: 100 * 1024, classes: 40 * 1024 };

/** @param {number} bytes */
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/** @param {string} dir @returns {string[]} */
function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return jsFiles(full);
    return e.name.endsWith('.js') ? [full] : [];
  });
}

/**
 * Prints the glossary page's raw, gzip and class-attribute bytes against their limits, and
 * returns how many limits it passes (1 when the page is missing).
 */
function glossaryReport() {
  if (!existsSync(GLOSSARY_PAGE)) {
    console.log(`FAIL  ${GLOSSARY_PAGE} is missing`);
    return 1;
  }
  const html = readFileSync(GLOSSARY_PAGE);
  let classes = 0;
  for (const m of html.toString('utf8').matchAll(/\sclass="[^"]*"/g)) {
    classes += Buffer.byteLength(m[0]);
  }
  const sizes = { raw: html.length, gzip: gzipSync(html).length, classes };
  let over = 0;
  for (const [name, limit] of Object.entries(GLOSSARY_LIMITS)) {
    const size = sizes[/** @type {keyof typeof sizes} */ (name)];
    if (size > limit) over += 1;
    console.log(
      `${size > limit ? 'FAIL' : 'ok  '}  ${kb(size).padStart(9)}  ${GLOSSARY_PAGE} ${name} (limit ${kb(limit)})`,
    );
  }
  return over;
}

function main() {
  if (!existsSync(IMMUTABLE_DIR)) {
    console.error(`${IMMUTABLE_DIR} is missing; run npm run build first.`);
    process.exit(2);
  }
  const chunks = jsFiles(IMMUTABLE_DIR)
    .map((file) => ({
      file: path.relative(IMMUTABLE_DIR, file),
      gzip: gzipSync(readFileSync(file)).length,
    }))
    .sort((a, b) => b.gzip - a.gzip || a.file.localeCompare(b.file));
  if (chunks.length === 0) {
    console.error(`${IMMUTABLE_DIR} holds no JS; run npm run build first.`);
    process.exit(2);
  }

  for (const { file, gzip } of chunks.slice(0, SHOWN)) {
    console.log(`${gzip > CHUNK_LIMIT ? 'FAIL' : 'ok  '}  ${kb(gzip).padStart(9)}  ${file}`);
  }
  const over = chunks.filter((c) => c.gzip > CHUNK_LIMIT);
  for (const { file, gzip } of over.slice(SHOWN)) {
    console.log(`FAIL  ${kb(gzip).padStart(9)}  ${file}`);
  }
  const total = chunks.reduce((n, c) => n + c.gzip, 0);
  console.log(
    `${chunks.length} client chunk(s), ${kb(total)} gzip in all; ` +
      `${over.length} over the ${kb(CHUNK_LIMIT)} limit`,
  );
  const glossaryFailures = glossaryReport();
  if (over.length > 0 || glossaryFailures > 0) process.exit(1);
}

main();
