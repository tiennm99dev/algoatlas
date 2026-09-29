# Phase 1 report: shared components

Status: DONE

Extracted `bar-chart.svelte`, `chip-list.svelte`, and `grid-board.svelte` with the prop contracts from lesson-conventions.md section 2, added the `terrain-mud` utility to `src/app.css`, and migrated the sorting and BFS pages. `lesson-pages.test.js` is untouched and passes.

## Files
- New: three components, `bar-chart.test.js` (6 tests), `chip-list.test.js` (5 tests).
- Modified: sorting page, BFS page, `src/app.css`.

## Gate
`npm run lint`, `format:check`, `check` (0 errors, 0 warnings), `npm test` (94 passed), `npm run build` all pass. `terrain-mud` appears in the built CSS. The BFS page has no `onpointerdown`, `matchMedia`, or `role="grid"`; the sorting page no longer imports `svelte/animate`.

## Implementation notes for later phases
- Aux row: each slot is a `flex-1` column with an optional value label (shown when `items.length <= 20`) above a bar area; `null` renders an empty bar area. It sits `mt-2` under the main row, inside the same page card. `auxStateOf` defaults to `bg-slate-400`.
- `GridBoard` takes `initialFocus` once (initial roving focus); it is not reactive. The `state_referenced_locally` warning is suppressed with `svelte-ignore` for that reason.
- `GridBoard` uses `cellState(cell).label` directly as the button `aria-label`.
- `terrain-mud` was reformatted by prettier onto multiple lines; same declaration.
- Pointer drag has no jsdom test; the pointer code was moved verbatim, with `onPaintStart` returning the paint value in place of the inline `painting = ...`.

## Concerns
None. The contract was implementable as written.
