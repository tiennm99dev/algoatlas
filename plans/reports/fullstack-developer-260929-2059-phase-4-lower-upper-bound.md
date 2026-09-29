# Phase 4: lower/upper bound lesson

Status: DONE. Five files created, nothing existing edited, nothing committed.

Files: src/lib/algo-engine/lower-upper-bound.js (+ .test.js), src/lib/lessons/lower-upper-bound/copy.en.js, src/routes/searching/lower-upper-bound/+page.svelte and page.test.js.

Validation: vitest on both test files 19/19 pass; eslint and prettier clean; `npm run check` 0 errors, 0 warnings; full `npm test` 18 files / 244 tests pass.

Trace length: at most 2 + 2*ceil(log2(n+1)) frames. At the size cap n=24 the observed maximum over 200 random arrays was 12 frames, far under 400.

Notes: added copy field `windowHint` (half-open explanation under the legend). Caret is drawn on the left edge of slot `answer` (including the trailing slot n). Visual placement is unverified (no browser).
