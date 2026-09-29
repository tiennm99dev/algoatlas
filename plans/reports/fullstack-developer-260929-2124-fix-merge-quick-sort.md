# Fix: merge/quick sort lesson and shared bar chart

Applied M4, M5, L1, L2, L4, C2, C4, C7. Only the eight owned files changed.

- M4: run bars carry a text marker, the buffer row shows head and taken markers, and the array label ends with the working range. The buffer label reports the taken count and the next values. `bar-chart.svelte` gained an optional `auxMarkerOf` prop (default off, existing props untouched).
- M5: `dimmed` now sets opacity only on the bar. Value labels stay full strength. Bubble/insertion tests pass untouched.
- L1: the totals show "no equal values on this array" when no value repeats, for both algorithms. The stability claim appears only with duplicates.
- L2: a pivot frame with two focused bars marks both as writes.
- L4: "New array" raises a frame-tied notice shown in place of the narration.
- C2: run, head and taken legend items show their glyph. C4: already `grid-cols-2` with the last card spanning. C7: `complexityHead` is `Case or resource`, since "Extra memory" is not an input case.

Tests added: bar-chart dim-only-bar and aux markers; page tests for M4, L1, L2, L4. The old "kept their order" assertion moved to the few-unique preset.

Validation: vitest, eslint, prettier, and `npm run check` were clean for these paths. The final `npm test` passed 21 files and 293 tests. One earlier vitest run failed two chip-list tests ("(current)" spacing), from another developer's in-flight edit, and they passed on the later full run.
