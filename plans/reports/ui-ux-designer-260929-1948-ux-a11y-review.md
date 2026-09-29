# AlgoAtlas UX and accessibility review (round 2)

Date: 2026-09-29. Source-only review of `src/` on `main`; no browser was used. Contrast ratios are computed with the WCAG 2.x relative-luminance formula from the hex values in `src/app.css` and the Tailwind 4 default palette. Layout widths at 360px are derived from the Tailwind classes. Items the previous report raised that are now fixed in source are listed at the end and not repeated.

## Summary

The previous round's fixes landed cleanly: the palette now passes text contrast everywhere it is used for text, the quiz is gone, shortcuts respect modifiers, the bar chart measures correctly, BFS cells carry distance and a two-tone focus ring, and the live region is muted during autoplay. The remaining problems are about **focus management and announcements**: buttons that disable themselves under keyboard focus (binary-search probes, step buttons), state changes that never reach a screen reader (pause, end of autoplay, keyboard grid edits), a global Space shortcut that steals page scrolling, and a pseudocode panel that scrolls but cannot be focused. Three layout items from round 1 (grid size on phones, binary array wrapping, sticky controls) are still open.

## High

**H1. Every keyboard probe in "You drive" drops focus to `<body>`.**
`src/routes/searching/binary-search/+page.svelte:176`. After `probe(i)` sets `lo = i + 1` or `hi = i - 1`, the cell the learner just activated is outside the window, so `disabled` becomes true on the element that holds focus. Browsers move focus to the body; screen-reader users lose their place after every single move of the exercise, and the next Tab restarts from wherever the browser's sequential-focus start point lands. Fix: keep the buttons enabled and mark them `aria-disabled`; `probe()` already ignores out-of-window clicks. Then move focus to the middle of the new window, which is also the pedagogically correct next cell.

```svelte
<script>
  /** @type {HTMLButtonElement[]} */
  const cellRefs = [];
  function probe(i) {
    // ... existing body ...
    if (driveStatus === 'playing') cellRefs[Math.floor((lo + hi) / 2)]?.focus();
  }
</script>
<button
  bind:this={cellRefs[i]}
  aria-disabled={mode !== 'drive' || driveStatus !== 'playing' || out}
  class="… aria-disabled:cursor-default aria-disabled:hover:border-slate-300"
  onclick={() => probe(i)}>{v}</button>
```
In watch mode the cells should stay `disabled` (they are not actionable), so keep `disabled={mode !== 'drive'}` and use `aria-disabled` only for the in-drive state.

## Medium

**M1. Step buttons disable themselves under focus at the ends of the trace.**
`src/lib/components/step-controls.svelte:53,60,71,78`. Pressing Enter on "Next step" until the last frame, or on "Previous step" back to frame 0, disables the focused button and drops focus to the body. The narration still announces the last frame, but the learner has to Tab back into the group. Fix: `aria-disabled` plus a guard; `player.step()` and `player.back()` are already no-ops at the boundaries.

```svelte
<button class="btn-icon aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
  onclick={player.step} aria-disabled={player.atEnd} aria-label={c.step} title={c.step}>
```
Apply the same to First/Last/Previous. Keep `disabled:` styles on `btn-icon` for other callers.

**M2. Pausing and the end of autoplay are never announced.**
`step-controls.svelte:64-67`, `bubble-insertion-sort/+page.svelte:162`, `binary-search/+page.svelte:189`, `bfs-grid/+page.svelte:254`. While playing the narration is `aria-live="off"`; when `player.playing` flips to false the attribute changes to `polite`, but the text does not change, and attribute changes do not trigger announcements. A screen-reader user who presses Play hears nothing while it runs and nothing when it stops, including the final "Sorted with N comparisons" result. Fix: a visually hidden status line in `step-controls.svelte` that is written only on a playing-to-stopped transition.

```svelte
<script>
  let stopped = $state('');
  let wasPlaying = false;
  $effect(() => {
    const p = player.playing;
    if (wasPlaying && !p) stopped = c.stoppedAt(player.index + 1, player.frames.length);
    wasPlaying = p;
  });
</script>
<p class="sr-only" role="status">{stopped}</p>
```
Add `stoppedAt: (i, n) => (i === n ? \`Finished, step ${n} of ${n}.\` : \`Paused at step ${i} of ${n}.\`)` to `controls` in `site.en.js`. The learner can then read the narration paragraph, which is adjacent in DOM order.

**M3. Keyboard edits on the BFS grid get no confirmation.**
`src/routes/graphs/bfs-grid/+page.svelte:71-83,59-68`. Pressing Enter on a cell toggles a wall or moves start/goal and calls `rebuild()`, which resets the player to frame 0. If the player was already at frame 0 the narration text is unchanged, so nothing is announced; the focused button's `aria-label` changes, but most screen readers do not re-read a label change on the focused element. Sighted users see the cell recolour; blind users hear silence. Fix: reuse the existing `notice` channel (already inside the live region) for a short confirmation.

```js
function edit(cell) {
  if (tool === 'wall') {
    const on = !walls.has(cell);
    setWall(cell, on);
    notice = on ? m.wallAdded(cell, COLS) : m.wallRemoved(cell, COLS);
    return;
  }
  // ...
  notice = tool === 'start' ? m.startMoved(cell, COLS) : m.goalMoved(cell, COLS);
}
```
`rebuild()` currently clears `notice` first, so set it after `rebuild()` or move the clear into the pointer path only. Copy: `wallAdded: (c, cols) => \`Wall added at ${this.coord(c, cols)}.\`` and so on. Do not emit notices from the pointer-drag path, which would flood the region.

**M4. The global Space shortcut steals page scrolling.**
`src/lib/components/step-controls.svelte:22-24`. `Space` anywhere outside a button, input, select, textarea, or the grid calls `player.toggle()` and `preventDefault()`. Keyboard users who page down with Space (very common) start autoplay instead of scrolling to the takeaways, and the narration below the fold changes silently. Arrow keys are less harmful because they do not scroll unless focus is on the body, but they share the issue. Fix: scope shortcuts to the lesson's interactive area and let Space fall through elsewhere.

```svelte
<!-- lesson-layout.svelte: wrap {@render children()} -->
<div data-player-scope>{@render children()}</div>

<!-- step-controls.svelte -->
if (!el?.closest('[data-player-scope]')) return; // before the key switch
```
This keeps the shortcuts working after any click inside the visualizer, controls, or code panel, and returns Space and arrows to the browser once the learner moves on to the text. Update `controls.shortcuts` to say "while the player has focus".

**M5. The pseudocode panel scrolls horizontally but cannot be reached by keyboard.**
`src/lib/components/code-panel.svelte:21`. Lines are `whitespace-pre` in an `overflow-x-auto` `<ol>`. The longest bubble-sort line is 40 characters of 14px mono (about 336px) plus line number, gap, and padding, roughly 400px, while the panel column at 360px is about 296px. The panel scrolls but has no `tabindex`, so keyboard users cannot scroll it (WCAG 2.1.1; Chrome only auto-focuses scrollers when they have no focusable children, which this has not, but Firefox and Safari do not). Fix: make the scroller focusable and named.

```svelte
<ol class="overflow-x-auto py-2 font-mono focus-ring" tabindex="0" aria-labelledby={headingId}>
```
Alternatively wrap lines with `whitespace-pre-wrap` and a hanging indent (`pl-8 -indent-4`) so nothing scrolls.

**M6. BFS grid is still too small to touch at 360px, and blocks scrolling.** (carried from round 1, M3; unchanged)
`bfs-grid/+page.svelte:198-199`. Width available is 360 − 32 − 24 − 2 = 302px, minus the new 24px axis column, across 16 columns: about 16.4px per cell after the 1px gaps. That is below the 24px minimum of WCAG 2.2 2.5.8, and `touch-none` means a swipe over the grid paints walls instead of scrolling. Fix as before: below `sm`, render transposed (10 columns × 16 rows, about 26px cells) by mapping display `(c, r)` to `at(r, c)` and swapping the arrow-key deltas; choose with `matchMedia('(max-width: 639px)')` after mount. Also replace `touch-none` with `touch-pan-y` so vertical swipes still scroll; drag-painting on touch then requires a small hold, which is acceptable.

**M7. Binary-search cells wrap into rows at narrow widths, and the window shape is lost.** (carried, M10)
`binary-search/+page.svelte:166-184`. At 360px only 5 of the 44px cells fit per row; 15 cells become 3 rows and 31 cells become 7, so "half the array is ruled out" is no longer visible as a shape. Fix: add a one-row range strip above the cells.

```svelte
<div class="relative mb-2 h-2 rounded bg-slate-200" aria-hidden="true">
  <div class="absolute inset-y-0 rounded bg-teal-700/60"
    style="left: {(windowLo / values.length) * 100}%; width: {((windowHi - windowLo + 1) / values.length) * 100}%"></div>
</div>
```

**M8. Non-text contrast of the state fills.**
`src/app.css:12-18`, used across all three visualizers. Against white: compare amber-500 2.15:1, frontier sky-400 2.14:1, path amber-400 1.67:1, visited indigo-200 1.49:1 (WCAG 1.4.11 asks 3:1 for graphics that convey information). Adjacent fills: compare vs idle slate-400 1.19:1, frontier vs visited 1.44:1, path vs visited 1.12:1, and the "touched" sky-700 ring on sky-400 is 2.77:1. Text markers (`?`, `⇄`, `✓`, distance digits, `lo mid hi`) already provide a non-colour channel, which is why this is medium rather than high, but a low-vision learner scanning the BFS grid cannot separate the amber path from the lavender visited cells by luminance at all. Fix, in order of value: give path cells an inset ring (`ring-2 ring-inset ring-amber-700`), darken `--color-state-visited` to `#a5b4fc` (indigo-300; indigo-900 text stays at 6.1:1), and set `--color-state-compare: #d97706` (amber-600, 2.9:1 on white, 1.6:1 vs slate-400; keep the `?` marker). Sky-700 ring: use `ring-sky-900` (4.2:1 on sky-400).

## Low

- **L1. Mobile topic navigation is still hidden.** `+layout.svelte:27` keeps `hidden sm:block`; topics are reachable only through the logo. Skip link and `aria-current` were added, so this is the remaining half of round-1 L1. Fix: drop `hidden sm:block`, let the header `flex-wrap`, and render the `<ul>` as a second row with `gap-3 text-xs`.
- **L2. Controls are not sticky on small screens.** (carried, M9) Below `lg` the pseudocode and counters stack under the controls; the learner cannot see the highlighted line while stepping. Fix: wrap `<StepControls>` in `<div class="sticky bottom-2 z-10 lg:static">` and give the group `shadow-lg lg:shadow-none`.
- **L3. Touch targets.** `segmented-control.svelte:21` labels are about 32px tall (`py-1.5`), `field` selects about 32px, `btn-icon` is 40px (`size-10`). All pass 2.5.8 (24px) but miss the 44px platform guidance on the controls learners tap most. Fix: `py-2.5` on the segment labels below `sm` (`py-2.5 sm:py-1.5`), `size-11 sm:size-10` on `btn-icon`.
- **L4. Colour transitions lag behind fast playback.** `bfs-grid/+page.svelte:233`, `bubble-insertion-sort/+page.svelte:141`, `binary-search/+page.svelte:171` use `transition-colors` (150ms) while 8× and 16× advance every 125ms and 62ms, so cells never settle and the frontier smears. Fix: `class:transition-colors={player.speed < 8}` or `duration-75`.
- **L5. Binary-search states have no legend.** `binary-search/+page.svelte:165-185`. Indigo "mid", green "found", grey "ruled out", and strike-through "probed" are explained only by the narration. Add the same `<ul>` legend the other two lessons use, and a `✓` marker under the found cell so the winning moment is not colour-only.
- **L6. BFS grid has no pointer affordance and its header row is empty for assistive tech.** `bfs-grid/+page.svelte:204-212,233`. Add `cursor-pointer` to the cell buttons. The axis row is all `aria-hidden` spans inside `role="row"`, so a table-navigating screen reader lands on an empty row; give the axis spans `role="columnheader"`/`role="rowheader"` with visible text and drop `aria-hidden` (the per-cell label already says "Row r, column c", so this is a cheap consistency win). PLAUSIBLE: `display: contents` on `role="row"` loses semantics in Safari before 16.4; explicit ARIA roles are retained in current Chrome and Firefox.
- **L7. Stale BFS notice.** `bfs-grid/+page.svelte:48,77`. `notice` is cleared only by a successful `rebuild()`, so "Pick an open cell" stays on screen after the learner switches tools. Clear it in the segmented control's `onchange`. Repeating the same blocked action also re-sets identical text, which live regions do not re-announce; append nothing, but set `notice = ''` before the assignment inside a microtask if repeat announcements matter.
- **L8. Copy consistency.** `binary-search/copy.en.js:11` says "You-drive mode" while the segment reads "You drive"; unify to "You drive". `binary-search/copy.en.js:43` "Click any cell" excludes keyboard users; use "Choose any cell (click, or Tab to it and press Enter)". `bfs-grid/copy.en.js:11` "Draw walls by clicking or dragging" likewise; add "or press Enter on a focused cell". `site.en.js:45-46` and `+page.svelte:24,60` put `←`/`→` in text, which screen readers announce as "leftwards arrow"; wrap the glyphs in `<span aria-hidden="true">`. `bfs-grid/copy.en.js:62-68` lists rows "Time" and "Memory" under a column headed "Case"; rename the BFS rows to "Any input" style cases or let each lesson supply its own `complexityHead`. `+layout.svelte:53` renders "©" as a lone token between dots; make it "© 2026 tiennm99" in one span.
- **L9. Markers overlap at 30 bars.** `bubble-insertion-sort/+page.svelte:145-147`. At 360px with 30 bars each column is about 5px, and the `text-sm` `⇄`/`?` glyphs are about 14px wide, so the two focused markers overlap each other. Hide markers when `frame.items.length > 20` (the same threshold as the value labels) and rely on colour plus the narration there, or size the marker with `text-[min(0.875rem,2.5vw)]`.
- **L10. Ruled-out cells.** `binary-search/+page.svelte:115` uses slate-500 on slate-100 (4.34:1), which is below AA for the 14px semibold digits. Use `text-slate-600` (6.15:1 on slate-100) or keep slate-500 and lighten the fill to slate-50.

## Verified as fixed since round 1

H1 teal-700 primaries (5.47:1), H2 emerald-700 sorted/start (5.48:1), H3 quiz mode removed entirely, H4 modifier keys and narrowed exclusion in `onKeydown`, H5 bar height measured in its own box, M1 `aria-live` muted during autoplay, M2 `prefersReducedMotion` on `animate:flip` (Svelte 5.57 confirmed in `package.json`), M4 distance in cell labels and `gridcell` wrapper, M5 two-tone focus ring, M6 markers plus dynamic `aria-label` plus Key legend, M7 hub copy, M8 hero CTA and "How" strip first, M11 axis numbers, M12 `aria-valuetext`, L2 slate-500 small text, L4 SVG icons, L6 per-algorithm totals, L7 "Binary search proves that in N" and the blocked-cell notice, L8 code-panel `aria-hidden`/`aria-labelledby`, L9 shared `btn-*` utilities, L10 "Open" badge removed, and the skip link and `aria-current` from L1. Text pairs recomputed this round all pass: white on slate-700 10.35, slate-900 on frontier 8.33, indigo-900 on visited 7.66, slate-900 on path 10.69, white on rose-600 4.70, active code line 11.48, queue chip 8.24, hub step number teal-100 on teal-700 4.86.

## Unresolved questions

1. Should Space remain a global play/pause key at all? M4 proposes scoping it; the alternative is to keep only the arrow keys global and drop Space from the hint.
2. Is a transposed phone layout for the BFS grid (M6) acceptable, or must the grid keep 16 columns everywhere? If the latter, the only remaining option is horizontal scrolling with `touch-pan-x`, which conflicts with drag-painting.
