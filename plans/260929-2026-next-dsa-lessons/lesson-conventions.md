# Lesson conventions (shared by phases 1 and 3-8)

Read this before any lesson phase. Phase 1 implements section 2 exactly; phases 3-8 consume it and must not change it.

## 1. Engine rules

- One new file per lesson in `src/lib/algo-engine/`. Pure, DOM-free, JSDoc typed (`checkJs` + `strict`, see `jsconfig.json`).
- Each trace runs the algorithm once and returns an array of frames. Copy every array into each frame (`a.slice()`, `buckets.map((c) => c.slice())`), as `sorting.js` `push()` does (sorting.js:67). Frames must not alias each other.
- Randomness only through an injected `rand = Math.random` parameter.
- Export the pseudocode as a `string[]`, copied verbatim from the phase file. `frame.lines` holds indices into it.
- Existing engines may be imported read-only (`toItems`, `makeArray`, `Item` from `sorting.js`; `neighbors`, `randomWalls`, `bfsGridTrace`, `Grid` from `graph.js`). Never edit them.
- Engine tests live next to the engine. Copy the seeded LCG from `sorting.test.js:12-15` locally. Every engine test file includes a "highlights every pseudocode line" test in the style of `sorting.test.js:98-108` (describe "pseudocode coverage").

## 2. Shared component contracts (built in phase 1)

**`src/lib/components/bar-chart.svelte`**, props (JSDoc on `$props()`):
`items: Item[]`, `stateOf: (i: number) => string` (fill classes, e.g. `'bg-state-compare'`), `markerOf?: (i: number) => string` (default `''`), `dimmed?: (i: number) => boolean` (true adds `opacity-40` to that column), `aux?: (Item | null)[] | null` (second row, same length as `items`, `null` = empty slot), `auxStateOf?: (i: number) => string`, `ariaLabel: string`, `auxLabel?: string`, `speed: number` (below 8 adds `transition-colors`).
Main row keeps today's markup from `routes/sorting/bubble-insertion-sort/+page.svelte:121-152`: `role="img"`, `flex h-72 gap-1`, columns keyed by `item.id` with `animate:flip` (duration 0 under `prefersReducedMotion`), value label and marker only when `items.length <= 20`. Heights use one `maxValue = max(1, all item and aux values)`. The aux row, when present, is a `flex h-24 gap-1` row with `role="img"` and `aria-label={auxLabel}`, keyed by index. The card wrapper and legend stay in the page.

**`src/lib/components/chip-list.svelte`**, props: `title: string`, `items: {label: string, hot?: boolean}[]`, `emptyText: string`, `limit?: number` (default 18).
Markup equals today's BFS queue panel (`routes/graphs/bfs-grid/+page.svelte:327-345`): card, `h2` title, `ol` of mono chips keyed by index (duplicates are legal: DFS stack, Dijkstra queue), hot = `bg-sky-700 text-white`, else `bg-sky-100 text-sky-900`, empty shows `emptyText`, overflow shows `+{n - limit}`.

**`src/lib/components/grid-board.svelte`**, props: `rows: number`, `cols: number`, `cellState: (cell: number) => {cls: string, mark: string, label: string}` (`label` is the full aria-label), `gridLabel: string`, `initialFocus: number`, `speed: number`, `onPaintStart: (cell: number) => boolean | null` (primary-button pointer down; return the paint value to start a drag, or `null` when the page handled it as a single edit), `onPaint: (cell: number, on: boolean) => void` (drag entered a cell), `onEdit: (cell: number) => void` (keyboard activation, i.e. click with `detail === 0`).
It owns everything in `bfs-grid/+page.svelte:33-46` (transposed drawing under `(max-width: 639px)`), the `painting` flag (line 81), `cellFromPoint` (line 123), `onPointerDown`/`onPointerMove` (button and `buttons & 1` checks), `onCellKeydown` (line 155, arrows in drawn coordinates), the roving `focusIndex`, `<svelte:window onpointerup onpointercancel>` (line 219), and the `role="grid"` markup with the aria-hidden axis labels (lines 239-292; the legend `ul` at line 293 stays in the page).

**`src/app.css`** gains `@utility terrain-mud` (diagonal hatch via `background-image`, so it layers over any `bg-*` state color).

If a lesson needs anything these contracts do not offer, do not edit the component: work around it in the page and report it under Concerns.

## 3. Page rules

- `+page.svelte` wraps everything in `<LessonLayout lesson={m}>`, imports copy as `import { en as m } from '$lib/lessons/<slug>/copy.en.js'`, and starts from a fixed initial input so prerendered and hydrated HTML match (see `bubble-insertion-sort/+page.svelte:29-31`).
- Layout: controls row `mb-4 flex flex-wrap items-end gap-4`; body `grid gap-4 lg:grid-cols-[1fr_22rem]`; left column = visual card + legend, narration `<p aria-live={player.playing ? 'off' : 'polite'}>`, sticky `<StepControls {player} />`; right column = stat `dl` cards, panels, `<CodePanel>`.
- Number and text fields commit on `change` and keep the last valid value when emptied or invalid (`binary-search/+page.svelte:47-50`).
- A rebuild calls `player.load(trace)`. Randomness (`Math.random`) only in user-triggered handlers.
- Copy module: `export const en = {...}` with every `LessonCopy` field (`registry.js:5-17`): `slug`, `topic`, `level: 'Intermediate'`, `title`, `intro`, `instruction`, `takeaways`, optional `complexityHead`, `complexity` (rows of exactly 3), `nextTeaser`; plus page labels and `describe(frame, ...)` narration. Start the file with a `@typedef` import of the frame type, like `bfs-grid/copy.en.js:1`.
- State is never color-only: markers, labels, or text accompany colors. Only existing `state-*` palette colors.

## 4. Page test harness

File `src/routes/<topic>/<slug>/page.test.js` (no `+`, so SvelteKit ignores it; `vitest.config.js` includes `src/**/*.test.js`). Start it with this block, copied (not imported) from `src/routes/lesson-pages.test.js:1-62`, importing only the lesson's own page as `Page`:

```js
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Page from './+page.svelte';
// helpers copied verbatim: app, render, afterEach, button, buttonByText, click, keyActivate, key, text
/** Commit a field the way a learner does: type, then leave the field. */
/** @param {HTMLInputElement} el @param {string} value */
function commit(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}
```

Drop helpers the file does not use (ESLint `no-unused-vars` fails otherwise).

## 5. Validation while phases run in parallel

Other lessons are being written in the same tree, so check only your own files:

```sh
npx vitest run <engine>.test.js <route>/page.test.js
npx eslint <your files>
npx prettier --check <your files>
npm run check 2>&1 | grep -E '<your paths>' ; test $? -eq 1   # no diagnostics in your files
```

Then run `npm test` once; failures in files you do not own are reported, not fixed.

## 6. Report

Write `plans/reports/fullstack-developer-260929-<hhmm>-phase-<N>-<slug>.md` and end your reply with `Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT`, `Summary:`, `Concerns/Blockers:`. List trace lengths at the size caps (the design aims for under about 400 frames; report if higher).
