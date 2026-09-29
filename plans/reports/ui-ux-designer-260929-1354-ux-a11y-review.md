# AlgoAtlas UX, accessibility, and learning-design review

Date: 2026-09-29. Scope: source read-only review of layout, hub, topic page, three lessons, shared components, palette, and English copy. No browser was used; layout figures at 360px are computed from the Tailwind classes, and contrast ratios are computed with the WCAG 2.x relative-luminance formula.

## Summary

The foundation is solid. Every lesson has a narration region, pseudocode sync, a shared player, labelled segmented radios, and a roving-tabindex grid, and most of the state palette passes contrast. Before adding more lessons, fix these four things: the primary teal CTA and the success green fail text contrast; the quiz question replaces the live region, so screen-reader users never hear it; the global arrow shortcuts break whenever a button has focus and swallow Alt+Left (browser Back); and in the default sorting view, bars at 92% of the maximum or above render at the same height.

## High

**H1. White text on teal-600 fails contrast (3.74:1) on the most-used controls.**
Files: `src/lib/components/step-controls.svelte:37` (Play), `src/routes/sorting/bubble-insertion-sort/+page.svelte:89`, `src/routes/searching/binary-search/+page.svelte:121,173`, `src/routes/graphs/bfs-grid/+page.svelte:161` (selected segment, "Try again").
The learner's eye goes first to these 14px labels, and they are the least legible text in the lesson. Fix: switch to `bg-teal-700` / `has-checked:bg-teal-700` (5.47:1), with `hover:bg-teal-800`.

**H2. White on emerald-600 / `--color-state-sorted` fails (3.77:1).**
Files: `src/app.css:14`, `bfs-grid/+page.svelte:127` (the "S" mark at 10px), `binary-search/+page.svelte:99` (the found cell).
The "found" moment and the start marker are hard to read. Fix: set `--color-state-sorted: #047857` (emerald-700, 5.48:1) and use `bg-emerald-700` for start. Sorted bars still read clearly as green.

**H3. The quiz question is never announced, and keyboard focus is lost when it opens.**
File: `bubble-insertion-sort/+page.svelte:140-157`.
The `{#if awaiting}` branch *replaces* the `aria-live` paragraph with a quiz box that has no live region, so the question is silent for screen readers. A keyboard user who pressed "Next step" also has that button become disabled under their focus (`step-controls.svelte:42`), which drops focus to `<body>`. Fix: keep one live region mounted at all times and put the question text inside it. When `awaiting` becomes true, move focus to the "Swap" button (a `bind:this` plus `$effect` calling `.focus()`). After the learner answers, return focus to the Next-step button.

**H4. The global shortcuts misfire.**
File: `step-controls.svelte:18-27`.
(a) The handler ignores any key event whose target is inside a `button`. After a mouse click, focus sits on the button in Chrome, Edge, and Firefox, so the advertised ← → keys stop working right after the learner clicks Next once. (b) Modifier keys are not checked, so Alt+← (browser Back) and Ctrl/Cmd+arrows are intercepted and `preventDefault`-ed. Fix: return early when `e.altKey || e.ctrlKey || e.metaKey || e.shiftKey`. Narrow the exclusion to `input, select, textarea, [role="grid"], [contenteditable]`. For Space on a focused button, return early and let the native click handle it, which avoids a double toggle. Arrow keys on a button are safe to handle.

**H5. Bars at 92% of the maximum or above are clamped to the same height in the default view.**
File: `bubble-insertion-sort/+page.svelte:123-129`.
Each column is `h-64` (256px) and holds a value label (16px line plus 4px margin) *and* a bar sized to `height: N%` of the full 256px. Flex-shrink then clamps every bar to 236px. With the initial array, 88 and 95 render at identical heights, and with "few unique" or "reversed", 100 and 92 look equal. The chart misrepresents the data it is teaching. Fix: size bars against a dedicated inner box, for example a `relative h-56 flex items-end` wrapper for the bar, with the label placed outside the percentage-sized area (above via `absolute -top-5`, or in a separate row below).

## Medium

**M1. Autoplay floods the live region.**
Files: `bubble-insertion-sort/+page.svelte:151`, `binary-search/+page.svelte:166`, `bfs-grid/+page.svelte:213`.
At 4× to 16×, every frame queues a polite announcement, and BFS has hundreds of frames. Screen-reader users hear a backlog long after pausing. Fix: `aria-live={player.playing ? 'off' : 'polite'}`, so narration is announced when the learner steps manually or pauses.

**M2. Reduced motion is not honoured for `animate:flip`.**
File: `bubble-insertion-sort/+page.svelte:125`.
Svelte 5 runs animations through the Web Animations API, and the CSS override in `app.css:27-34` does not affect it, so bars still slide under reduced motion. Fix: `import { prefersReducedMotion } from 'svelte/motion'` (available in Svelte 5.57), then `animate:flip={{ duration: prefersReducedMotion.current ? 0 : 200 }}`.

**M3. The BFS grid is too small to tap at 360px.**
File: `bfs-grid/+page.svelte:177-205`.
Available width is 360 − 32 (article padding) − 24 (card padding) − 4 (borders) ≈ 300px across 16 columns, so each cell is about 17.7px. That is below the WCAG 2.2 AA 24px target, and distance digits render at 10px. Because the grid is `touch-none`, a learner who tries to scroll the page by swiping over it paints walls instead. Fix: below `sm`, render the grid transposed (10 columns × 16 rows, about 29px cells) by mapping the display position `(c, r)` to the same `cell` index and swapping the arrow-key deltas. The engine, `DEFAULT_WALLS`, and the prerendered layout for `sm` and up stay the same. Pick the layout after mount with `matchMedia`.

**M4. The BFS grid does not expose distances to screen readers, and cell semantics are wrong.**
Files: `bfs-grid/copy.en.js:35-37`, `bfs-grid/+page.svelte:191-196`.
The label reads "Row 4, column 7, Visited" but omits the distance number that is the whole point of the lesson. `role="gridcell"` on a `<button>` also removes the button role, so screen readers do not announce the cell as actionable. Fix: pass `d` into `cellLabel` ("…, Visited, distance 3"), and use `<div role="gridcell"><button …></button></div>`, keeping the roving tabindex on the button.

**M5. The BFS focus ring disappears on colored cells.**
File: `bfs-grid/+page.svelte:197`.
The teal-600 outline is 1.01:1 against the emerald start cell and 1.68:1 against the indigo current cell. Fix: use a two-tone ring, `focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset`, so one of the two colors contrasts with any fill.

**M6. Color-only state encoding in the sorting chart.**
Files: `bubble-insertion-sort/+page.svelte:71-78,133-137`.
Sorted green versus unsorted slate-400 is only 1.47:1 in luminance, and amber "Comparing" versus green "Sorted" is 1.75:1, so the two are easily confused under deuteranopia. The `role="img"` label is static, so screen readers get no values. The insertion "key" state (`bg-state-active`) is also missing from the legend. Fix: (a) add a glyph row under the focused bars (`?` for compare, `⇄` for swap) and a small ✓ or baseline tick under sorted bars. (b) Make the `aria-label` dynamic ("Values: 17, 42, 88 …; first 4 sorted"). (c) Add a "Key" legend entry when `algo === 'insertion'`.

**M7. The hub promises quiz mode in every lesson.**
File: `src/lib/i18n/site.en.js:14` ("Predict it: Quiz mode stops before key decisions").
Only sorting has a quiz, binary search has "You drive", and BFS has neither. A first-time learner who looks for the quiz on BFS finds nothing, which erodes trust. Fix now: reword to "Predict it: quiz and you-drive modes let you make the next move yourself". The durable fix is a prediction step in BFS, for example "Which cell is dequeued next?", answered by clicking a queue chip.

**M8. The landing page has no starting point, and "How every lesson works" sits last.**
File: `src/routes/+page.svelte:19-57`.
The hero has no call to action, and the onboarding section (the most useful part for a first visit) is below the topic cards. Fix: add a primary "Start with binary search →" link in the hero, pointing to the shortest and most intuitive lesson, and move the "How" strip directly under the hero.

**M9. On mobile the code panel is far from the controls, so the code-to-visual link is lost.**
Files: `bubble-insertion-sort/+page.svelte:120-175`, and the same structure in the other two lessons.
Below `lg`, the stats and pseudocode stack under the step controls. The learner cannot see the highlighted line while stepping. Fix: make the controls sticky on small screens (`sticky bottom-2 z-10 shadow-lg lg:static` on the StepControls wrapper). The learner can then scroll to the code or queue and keep stepping.

**M10. Binary search on narrow widths: the window wraps across rows.**
File: `binary-search/+page.svelte:149-163`.
At 360px only 5 cells fit per row, so 31 cells take 7 rows, and the "halve the window" shape is lost. Wide screens also wrap at 31. Fix: add a single-row range strip above the cells, a full-width bar with the `[lo, hi]` span filled and a tick at `mid`. It shows the halving at any width and keeps the cells at 44px.

**M11. BFS coordinates have no axis, so narration cannot be mapped to cells.**
Files: `bfs-grid/copy.en.js:31-33,45-47`, `bfs-grid/+page.svelte:233-238`.
"Dequeue (4,2)" and the queue chips use (row, col), but the grid has no row or column numbers. Fix: add a 0-based header row and column in `text-[10px] text-slate-500 aria-hidden`, and highlight the corresponding cell while a queue chip is hovered or focused.

**M12. Slider value is off by one for screen readers.**
File: `step-controls.svelte:61-70`.
The range is 0-based while the visible text says "Step 1 of N", so screen readers announce "Step, 0". Fix: `aria-valuetext={c.stepOf(player.index + 1, player.frames.length)}`.

**M13. Value labels overflow at 16 bars on mobile.**
File: `bubble-insertion-sort/+page.svelte:126-127`.
At 360px with 16 bars, each slot is about 14.8px, while "100" in text-xs is about 21px, so labels overlap. Fix: base the label threshold on measured width (`bind:clientWidth`, then show labels when `width / n ≥ 22`) instead of a fixed `<= 16`.

## Low

- **L1.** Header nav is `hidden sm:block` with no mobile alternative (`+layout.svelte:18`). Topics are reachable only through the logo and hub. Fix: show the three links as a second row below `sm` (`flex sm:block`, with a wrapping row). Add `aria-current="page"` to the active topic. There is also no skip link.
- **L2.** Low-contrast small text. slate-400 on white is 2.56:1 for the index labels (`binary-search:159`), the shortcut hint (`step-controls:72`), and "empty" and "+N" (`bfs-grid:237,239`). The 24px bold "Linear scan reads" number (`binary-search:185`) also fails the 3:1 large-text rule. teal-200 on teal-700 is 4.34:1 for the hub step numbers (`+page.svelte:51`). Fix: use slate-500 (4.76:1) and teal-100.
- **L3.** Ruled-out binary-search cells use slate-300 on slate-100 (1.36:1, `binary-search:103`). Disabled controls are exempt from contrast rules, but learners reviewing the run cannot read the discarded values. Fix: `text-slate-500`, or keep `text-slate-400` with a hatched background.
- **L4.** Step icons (`step-controls:34-43`) use ⏮ ⏭ ⏸, which render as color emoji on iOS and Android. "Next step" also reuses the ▶ glyph from Play. Fix: use inline SVG icons (chevron-bar for step, triangle for play). Buttons are 40px (`size-10`), segmented labels about 32px, and selects about 30px. Use `size-11` and `py-2.5` on touch targets.
- **L5.** Quiz friction. Rewinding and returning re-asks and re-scores the same comparison (`bubble-insertion-sort:44`), so track answered indices in a `Set`. The question says "swap" for insertion sort, where the counter says "Shifts" (`copy.en.js:29-32`). "Correct!" gives no reason, so append the rule ("42 > 17, so they swap"). A size-30 reversed run asks 435 questions, so offer "ask every 3rd" or a skip button.
- **L6.** The sorting lesson's key idea ("very different on nearly sorted data") requires remembering numbers across toggles. Fix: keep the last completed `{comparisons, swaps}` per algorithm for the current array and show it in the stats cards ("Bubble: 66 · Insertion: 12").
- **L7.** In drive mode, the "missing" message (`binary-search/copy.en.js:52`) does not compare against binary search as the found message does. Add "Binary search needs ${best}". Selecting "Move start" and then tapping a wall does nothing silently (`bfs-grid:66`), so flash the narration ("Pick an open cell").
- **L8.** Code panel. The line-number span inside an `<ol>` makes screen readers read the number twice (`code-panel.svelte:18`), so add `aria-hidden="true"`. Replace `aria-label` with `aria-labelledby` on the `h2`.
- **L9.** Visual consistency. Secondary actions mix `px-3` and `px-4` (`bubble:111` vs the others). Filled slate-700, outlined, and teal buttons are defined inline in each lesson. Extract a shared button class set (primary teal-700, secondary slate-700, tertiary outline) next to `step-controls` so the tiers stay consistent. Buttons outside the step controls fall back to the browser focus ring; apply the same `focus-visible:outline-teal-700` everywhere.
- **L10.** The topic page shows the badge "Open" on every lesson (`[topic]/+page.svelte:37`), which carries no information. Show it only once "Coming soon" lessons exist, or replace it with an estimated time ("~5 min").

## What already works

The segmented controls are real radios with visible focus via `has-focus-visible`. The BFS grid has a correct roving tabindex and uses `e.detail === 0` so keyboard and pointer input stay separate. Narration sits in a persistent polite region in watch mode. Quiz feedback explains wrong answers, and "You drive" benchmarks the learner against binary search. The main palette pairs pass: white on indigo 6.29:1, slate-900 on sky 8.33:1, indigo-900 on visited 7.66:1, slate-900 on amber path 10.69:1, and white on rose-600 4.70:1.

## Unresolved questions

1. Is a BFS prediction mode in scope soon? The answer decides whether M7 needs only a copy fix or a new interaction.
2. Is a transposed mobile grid (M3) acceptable, or must the BFS grid keep the same orientation on every screen size?
