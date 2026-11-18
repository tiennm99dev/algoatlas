#!/usr/bin/env node
/**
 * Reports the gzip size of the client JS after `npm run build`, and exits 1 when any single
 * chunk is over the hard limit.
 *
 *   npm run size-report
 *
 * Every `.js` file under `.svelte-kit/output/client/_app/immutable/` counts, not only lesson
 * chunks: the shared layout, the entry and any chunk every page loads (such as the lesson
 * registry) can grow just as easily as one lesson can. The ten largest are listed.
 *
 * Budget: no client chunk may pass 60 KB gzip.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const IMMUTABLE_DIR = '.svelte-kit/output/client/_app/immutable';
const CHUNK_LIMIT = 60 * 1024;
const SHOWN = 10;

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
  if (over.length > 0) process.exit(1);
}

main();
