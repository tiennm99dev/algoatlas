# Phase 8 report: structures/bst

Status: DONE_WITH_CONCERNS

## Files created
- src/lib/algo-engine/bst.js, bst.test.js (17 tests)
- src/lib/lessons/bst/copy.en.js
- src/routes/structures/bst/+page.svelte, page.test.js (9 tests)

## Validation
- vitest on both test files: 26 passed. eslint and prettier clean on the five files. `npm run check` reports no diagnostics in bst paths. `npm test` (whole repo): 20 files, 259 tests, all pass.

## Trace lengths
- Balanced preset (7 inserts): about 50 frames.
- 40 ops, worst case found (15 sorted inserts, then 25 searches for the deepest key): 977 frames. A mixed 40-op log (balanced 15 inserts, then random search/delete/insert) reached 275. The worst case exceeds the 400 design target, but a scrubber over 977 frames is still cheap; no cap was changed.

## Decisions and deviations
- Frame semantics: a 0/1-child delete's `relink` frame already drops the node from the drawing (unreachable slots get no layout); the "removing" fill shows only for the successor slot in a two-child delete.
- Undo and preset seek to the last frame; Insert/Search/Delete seek to the op's first frame; Reset returns to frame 0.
- Extra copy fields beyond the phase file: `logFull` (40-op cap notice), `nodeLabel`, `states`, `markers` (glyphs so state is not color-only), plus describe text for go-left, go-right, insert, found, relink, remove.
- Insert of a duplicate key into a full tree is allowed (no new key); the `full` notice only fires for a genuinely new key.
- `ChipList` limit is set to MAX_OPS so the whole log is visible.

## Concerns
- The SVG layout and appearance are unverified without a browser (jsdom checks structure only: labels, titles, viewBox derived from frame).
- The `path` state has no glyph marker (light indigo fill plus the narration and legend text only).
- Nodes array grows with total inserts (slots never reused), up to 40 slots; layout handles it.
