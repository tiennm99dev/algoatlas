# AlgoAtlas UX and accessibility review: the six new lessons

Date: 2026-09-29. Source-only review of `src/` on `main` at 4dae0d3; no browser was used. Contrast ratios use the WCAG 2.x relative-luminance formula on the hex values in `src/app.css` and the Tailwind default palette (Tailwind 4 ships oklch equivalents that differ by well under 0.1 in ratio). Widths at 360px assume the `max-w-5xl px-4` article, card `p-4`, and the `lg:grid-cols-[1fr_22rem]` body. Items the round-2 report already covers (Space scoping, step-button focus, code-panel wrapping, grid transposition, sticky controls) are verified as landed in the shared components and are not repeated.

## Summary

The shared pieces are solid: every lesson follows the section 3 layout, notices are tied to `player.index`, keyboard edits on grids are confirmed, and `aria-disabled` is used where focus must stay put. The problems are concentrated in three places. First, two pedagogical payoffs are not reachable or not visible: quicksort's worst case needs a sorted array that no preset produces, and the merge buffer row has no caption and near-invisible "taken" slots. Second, two new text-on-fill pairs fail AA: white on `state-compare` (3.19:1) on hash chips and BST nodes, and the mud hatch on the expanding cell (1.36:1). Third, the BST SVG scales to unreadable at 15 nodes on a phone. Everything else is medium or low polish.

## Merge sort and quicksort

**MQ1 (high). The lesson tells learners to use a sorted array that cannot be loaded.**
`src/lib/lessons/merge-quick-sort/copy.en.js:11,131`, `src/routes/sorting/merge-quick-sort/+page.svelte:23,93`, `src/lib/algo-engine/sorting.js:147-169`. The instruction says "try each pivot rule on the sorted and reversed arrays" and takeaway 3 says last-pivot quicksort is quadratic on sorted input, but `m.presets` has no `sorted` entry and `makeArray`'s default branch is a shuffle, so adding the key to copy alone would silently load a random array. The quicksort-worst-case payoff is only half reachable (reversed works; sorted does not, and "Nearly sorted" swaps `n/8` pairs so depth stays low). Fix in the page, since `sorting.js` is read-only: add `sorted: 'Sorted'` to `m.presets` and branch in `regenerate()`:

```js
const values = preset === 'sorted' ? makeArray('reversed', size).reverse() : makeArray(preset, size);
rebuild(values);
```

**MQ2 (high). The buffer row has no visible caption and its taken slots are invisible.**
`+page.svelte:167-171,276-287`, `src/lib/components/bar-chart.svelte:66-88`. Sighted learners see a second row of grey bars appear under the chart at every `copy` frame with nothing that says "buffer"; the word only exists in `auxLabel`, which is an `aria-label`. The `taken` fill is `bg-slate-200`, 1.23:1 against the white card and 2.08:1 against the `waiting` slate-400, so "already taken" reads as "empty" until the learner notices the `✕`. The head ring (`ring-state-active` on slate-400) is 2.45:1. Fix: use the dimming convention the main row already teaches, and add a caption under the chart (the component has no slot for it, so it goes in the page):

```js
const auxClass = {
  head: 'bg-slate-400 ring-2 ring-inset ring-slate-900',
  taken: 'bg-slate-400 opacity-40',
  waiting: 'bg-slate-400',
};
```

```svelte
{#if auxRow}<p class="mt-1 text-xs text-slate-500">{m.bufferCaption}</p>{/if}
```

with `bufferCaption: 'Buffer: a copy of the range being merged. ↑ next from each run, ✕ already written back.'`. The `merged` frame should also name the buffer row in narration ("…the buffer is discarded") so the row's disappearance is explained.

**MQ3 (medium). The buffer row appears and disappears, moving the narration 120px.**
`bar-chart.svelte:66-67`, `+page.svelte:151-155`. `aux` is `null` outside `copy…merged`, so the `mt-2 h-28` row mounts at every merge start and unmounts at every `merged` frame. Below `lg` the narration and legend jump each time; at 4× that is a jump every few seconds. Fix in the page: keep the row mounted with empty slots when merge sort is selected, so only the bars change:

```js
const auxRow = $derived.by(() => {
  if (!merging) return null;
  const { aux, range } = frame;
  return frame.items.map((_, i) => (aux && range && i >= range[0] && i <= range[1] ? aux[i - range[0]] : null));
});
```

**MQ4 (medium). The quicksort low side is not drawn, so the partition payoff is invisible.**
`+page.svelte:117-129`. During `scan` and `swap` frames the bars at `lo..frame.i` (values ≤ pivot, already on the low side) look identical to the unscanned bars. The learner sees swaps but never sees the low side grow, which is the whole point of partition. Fix: reuse the `run` tier for the low side and switch the legend label per algorithm:

```js
if (!merging && frame.i >= 0 && frame.range && i >= frame.range[0] && i <= frame.i && i !== frame.pivot) return 'run';
```

Legend row for quicksort: `['bg-state-visited', \`${m.markers.run} ${m.legend.lowSide}\`]` with `lowSide: '≤ pivot, low side'`. `state-visited` as "finished-but-not-final" fits section 7.

**MQ5 (medium). Sizes 21 to 24 hide every buffer marker.**
`+page.svelte:242-249`, `bar-chart.svelte:37`. `labelled = items.length <= 20`, so at 21 to 24 the value labels, `↑`, and `✕` vanish and the buffer row is grey bars only, while the legend still lists both glyphs. The bubble lesson tolerates this because its markers are secondary; here the buffer semantics depend on them. Fix: `max="20"` on the size range for this lesson.

**MQ6 (medium). The depth card gives no balanced reference, so "n levels deep" has nothing to compare against.**
`+page.svelte:321-326`, `copy.en.js:28`. BST shows "Perfectly balanced height: 3" next to "Height 7"; this lesson shows "12 (max 12)" with no hint that about 4 is expected. Fix: `depthValue: (d, max, n) => \`${d} (max ${max}, balanced ≈ ${Math.ceil(Math.log2(n))})\`` and pass `frame.items.length`.

**MQ7 (medium). Stability is only reported in the side panel, never where the learner is looking.**
`+page.svelte:332-345`, `copy.en.js:36-41,125`. The `done` narration says "Sorted with N comparisons and M writes" while the stability verdict sits in a `text-xs` line of the totals panel. Since `DivideFrame.items` carries ids, the verdict can be computed in `describe` (same test as `isStable`) and appended: "Equal values kept their order." or "…were reordered: 50 (originally 3rd) now follows 50 (originally 7th)." For the few-unique preset that sentence is the payoff.

**MQ8 (low).** `+page.svelte:233,247,257`: changing the preset, size, or pivot rule rebuilds at frame 0 without a notice, unlike "New array" (line 97-100). Route all three through `newArray()` and add `pivotNotice: (r) => \`Pivot rule: ${r}. Both traces rebuilt.\``. `+page.svelte:252-263`: the Pivot select mounts only for quicksort, so "New array" shifts sideways when the algorithm toggles; render it always with `disabled={merging}`. `copy.en.js:71`: legend `write` says "Writing or swapping" for both algorithms; use `{ merge: 'Writing to the array', quick: 'Swapping' }`.

## Lower bound and upper bound

**LB1 (medium). No window strip, so the half-open window disappears when cells wrap.**
`src/routes/searching/lower-upper-bound/+page.svelte:128-167` versus `binary-search/+page.svelte:194-204`. At 360px the 16 slots (15 values plus the dashed `n` slot, 44px + 6px gap) wrap at 6 per row into three rows; at `lg` 24 values wrap into two rows. Binary search got a one-row strip for exactly this reason; this lesson, whose whole point is the window shape, has none. The `▼` caret (`left-0 -translate-x-1/2`) also loses its "between answer−1 and answer" meaning whenever `answer` is the first cell of a wrapped row. Fix: copy the strip with `n + 1` slots so `hi = n` is representable:

```svelte
<div class="relative mb-3 h-2 rounded bg-slate-200" aria-hidden="true">
  <div class="absolute inset-y-0 rounded bg-teal-700/60"
    style="left: {(frame.lo / (n + 1)) * 100}%; width: {((frame.hi - frame.lo) / (n + 1)) * 100}%"></div>
</div>
```

**LB2 (medium). Legend labels "Test held" and "Test failed" do not say which test.**
`src/lib/lessons/lower-upper-bound/copy.en.js:36-42`, `+page.svelte:83-88`. A first-time learner reads "Test held (left of lo)" with no test in sight; the test is in pseudocode line 4 and changes with the variant. Fix: make the legend a function of the variant, since `legend` is already `$derived`:

```js
left: (test) => `a[i] ${test} x held: left of lo`,
right: (keep) => `a[i] ${keep} x: hi and beyond`,
```

with `test = variant === 'lower' ? '<' : '≤'` and `keep = variant === 'lower' ? '≥' : '>'`, mirroring `describe()`.

**LB3 (low).** `copy.en.js:31` "Present target" while binary search says "Random target" (`binary-search/copy.en.js:17`); pick one, "Present target" is the clearer. `+page.svelte:45-53`: `newArray()` with a random present target can pick the same value as before, leaving the `start` narration text unchanged at frame 0 and therefore unannounced; append a notice as merge-quick does (`say(m.newArrayNotice)`). PLAUSIBLE: Enter in the number field commits via `change` in Chromium and Firefox without a form; Safari does the same, so no form is needed here.

## Hash table

**HT1 (high). White text on `state-compare` chips is 3.19:1.**
`src/routes/structures/hash-table/+page.svelte:133`. The "Comparing" chip is `bg-state-compare text-white` at `text-xs` mono, the state shown on every `walk` frame. AA needs 4.5:1. Fix: `compare: 'bg-state-compare text-slate-900'` (5.60:1), which also matches the dark-on-frontier pattern the grid lessons use. Apply the same to BST (BT2).

**HT2 (medium). Enter in the search field does nothing; the search is silently dropped by other controls.**
`+page.svelte:202-213,168`. `commitSearch` only validates; the learner must also click "Search". Typing a key and pressing Enter is the natural action and yields nothing. Switching the hash function or keys calls `rebuild()` with no search, so the lookup vanishes without a word. Fix: wrap the field and button in a form and say when a lookup is dropped:

```svelte
<form class="flex flex-wrap items-end gap-4" onsubmit={(e) => { e.preventDefault(); runSearch(); }}>
  <label class={labelClass}>{m.searchLabel}<input type="number" … bind:value={searchDraft} /></label>
  <button type="submit" class="btn-outline">{m.searchButton}</button>
</form>
```

and in the segmented `onchange`: `rebuild(); if (searched) say(m.searchDropped)` with a `searched` flag set in `runSearch`.

**HT3 (medium). At 47 buckets the focused bucket can be far off-screen.**
`+page.svelte:223`. With `mod-prime` and 18 or more keys the table reaches 47 buckets. Below `sm` the list is one column of 47 × 28px rows (about 1.3 screens); at `sm` it is `columns-2`, about 660px. The narration and controls are sticky at the bottom, but the ring-highlighted bucket the narration refers to is often above the fold. Fix: `columns-2` from the base breakpoint when `m > 16` and `md:columns-3` when `m > 32`, and scroll the focused row into view when stepping (not while playing):

```js
$effect(() => {
  const b = frame.bucket;
  if (b < 0 || player.playing) return;
  document.querySelector(`[data-bucket="${b}"]`)?.scrollIntoView({ block: 'nearest' });
});
```

**HT4 (low).** `+page.svelte:246`: "empty" is `text-slate-400` on white, 2.56:1; use `text-slate-500` (4.76:1). `+page.svelte:227-228`: a screen reader hears "0 12 44" for bucket 0, so the index reads as a key; prefix `<span class="sr-only">Bucket </span>{b}`. `+page.svelte:288-295`: the "Waiting to rehash" card mounts only during growth, shifting the code panel; keep it mounted with `pendingEmpty` outside growth. `copy.en.js:22-24`: the head says "Operation" but rows are "Average" and "Worst"; use `['Search or insert, average', 'Search or insert, worst', 'Grow']` or the default "Case" head.

## Binary search tree

**BT1 (high). At 15 nodes on a phone the tree is unreadable.**
`src/routes/structures/bst/+page.svelte:22-23,120-121,236-242`. `viewBox` width is `size × 40`; at 15 nodes that is 600 units drawn into about 296px (360 − 32 article padding − 32 card padding), a 0.49 scale: node radius 7.9px, key text 6.4px, edge stroke 0.7px. The sorted preset at 15 keys is 600 × 720 units, so the text is the same 6.4px and the card is 355px tall. Even at 7 nodes on a 320px viewport the scale is 0.91. Fix: let the SVG keep a minimum readable size and scroll sideways, with a keyboard-reachable scroller:

```svelte
<div class="overflow-x-auto focus-ring" tabindex="0" aria-label={m.treeScroller}>
  <svg viewBox="0 0 {vbW} {vbH}" role="img" aria-label={…} class="mx-auto h-auto"
    style="width: {vbW * 1.2}px; min-width: {vbW * 0.85}px; max-width: 100%"></svg>
</div>
```

`min-width` 0.85 keeps text at 11px; the wrapper scrolls only when that does not fit. `touch-pan-x` is not needed since nothing on the SVG intercepts pointer events.

**BT2 (high). White key text on the "Compared" node is 3.19:1.**
`+page.svelte:139-148`. `compare: 'fill-state-compare'` with `fill-white` at 13px semibold; this is the state of every `visit` frame. Fix: add `'compare'` to `DARK_TEXT` (slate-900 on amber-600 is 5.60:1).

**BT3 (medium). Enter in the key field inserts nothing.**
`+page.svelte:197-219`. The field commits on `change` but there is no default action, so "type 45, Enter" only validates. Fix: a form whose submit is Insert, with Search and Delete as `type="button"`:

```svelte
<form class="flex flex-wrap items-end gap-4" onsubmit={(e) => { e.preventDefault(); add('insert'); }}>
```

Also group the buttons: Insert/Search/Delete in one `div`, then `<div class="flex gap-2 border-l border-slate-300 pl-2">` for Undo and Reset, so the destructive Delete is not styled and placed like a log action.

**BT4 (medium). The state marker sits on the edge to the parent for every left child.**
`+page.svelte:274-284`. The marker is at `(cx + 13, cy − 13)`; a left child's parent is at `(+40, −48)`, and the edge passes through `(13, −15.6)`. The `?`, `✓`, `+`, `×`, `S` glyphs then overlap a slate-400 line with no halo. Fix: `stroke="white" stroke-width="3" paint-order="stroke"` on the marker `<text>`, or place the marker on the side away from the parent (`cx − 13` when the node is a left child, which the layout knows from `rank`).

**BT5 (low).** `+page.svelte:254-255`: `<title>` inside `role="img"` is not exposed to assistive tech (fine as a tooltip; the in-order `aria-label` is the real channel), but the label says nothing about shape. Append the root and height comparison: `…Root ${rootKey}. Balanced height would be ${h}.` `+page.svelte:223-228`: selecting the already-selected "Random" preset fires no `change`, so it cannot be re-rolled; reset `preset` to `''` after loading a random one. `+page.svelte:312-315`: "Comparisons" resets per operation; label it "Comparisons (this operation)". `copy.en.js:86`: "The spare node is gone" — "spare" is unexplained; use "The unlinked node is gone."

## DFS on a grid

The page mirrors BFS closely and carries the round-2 fixes. The BFS-versus-DFS payoff is delivered by the paired cards (`+page.svelte:159-168`), and the pseudocode neighbor order (`dfs-grid.js:30`) matches `neighbors()` reversed, so the narration and the drawing agree.

**DF1 (low).** `+page.svelte:170-176`: the hot chip is announced with ChipList's default `hotLabel` "current", but it is the entry just pushed; pass `hotLabel="just pushed"`. `+page.svelte:87-96`: eight legend items wrap to three rows at 360px; acceptable, but "Stale copy, skipped" could be shortened to "Stale, skipped" to save a row. `copy.en.js:57` says DFS "keeps only the current branch and its pending neighbors" while the complexity row says memory is O(V + E) because of duplicates; add "with duplicates" to the takeaway so the two agree.

## Dijkstra on a grid

**DJ1 (medium). The mud hatch is invisible on the expanding cell and cuts digit contrast on visited cells.**
`src/app.css:60-66`, `+page.svelte:114`. The stripe (amber-900 at 0.55) composites to 1.36:1 on `state-active`, 2.28:1 on `state-visited`, 2.34:1 on `state-path`, 2.38:1 on `state-frontier`, 2.90:1 on white, all under the 3:1 graphic threshold. Worse, the `indigo-900` cost digits on a visited mud cell cross stripes at 2.52:1. The label carries "mud, cost 5" so it is not colour-only, but a sighted learner cannot see which expanding cell is mud, which is exactly when the cost matters. Fix in two parts. Stripe: use a lighter hatch so it shows on dark fills and lifts less contrast from text, `rgb(120 53 15 / 0.45)` with `0 3px, transparent 3px 8px`, plus a paired inset ring for mud cells, `ring-1 ring-inset ring-amber-900` added to `mudCls` when no other ring is present (path and touched already ring; leave those). Narration: state the cost in every `relax` (DJ2), so the expanding cell's terrain is spoken even when the hatch is faint.

**DJ2 (medium). The relax narration hides the step cost, which is the rule the lesson teaches.**
`copy.en.js:76-79`. "reaches (4,6) for 8" makes the learner subtract to learn what the step cost. The frame has `popped` and `dist`, so the cost is `f.dist[f.touched] - f.popped`. Fix: `…reaches ${at(f.touched)} for ${f.popped} + ${step} = ${f.dist[f.touched]}` with `step` named "(mud step)" when it is 3 or 5.

**DJ3 (medium). "Same grid, fewest steps" does not say what the panel compares.**
`copy.en.js:31`. The card holds two routes with steps and cost; the title reads as a caption for one of them. Fix: `compareTitle: 'Fewest steps vs cheapest route'`, and make the cheaper cost `font-semibold` so the eye lands on the payoff.

**DJ4 (low).** `copy.en.js:13`: the instruction omits the keyboard hint that BFS and DFS carry ("or press Enter on a focused cell"); add it. `copy.en.js:21`: "Clear" alone is ambiguous next to "Random terrain"; use "Clear terrain". `+page.svelte:244-251`: stale queue entries look like live ones; label them `${coord} ${d}` plus ` (stale)` when `d > frame.dist[c]`, which makes takeaway 3 visible in the panel. `+page.svelte:148`: the mud legend swatch is 12px, showing about two stripes; use `size-4` for that one item.

## Cross-lesson

**X1 (high, covers HT1 and BT2).** `state-compare` (#d97706) was chosen in round 2 for bars, where it carries no text. Both new lessons put text on it. Establish the rule in section 7: `state-compare` and `state-frontier` take `text-slate-900`; `state-active`, `state-sorted`, `state-swap` take `text-white`.

**X2 (medium). Enter never submits.** BST key (BT3), hash search (HT2). Lower-upper-bound and binary search rely on the `change` event, which fires on Enter in every current engine (PLAUSIBLE), so only the two button-driven flows need forms.

**X3 (medium). Silent rebuilds at frame 0.** Merge preset, size, pivot (MQ8); hash function switch after a search (HT2); lower-upper new array with a repeated target (LB3). The house rule (section 7) already supplies the `say()` channel; use it whenever a rebuild can leave the narration text unchanged.

**X4 (low). Terminology.** "Present target" versus "Random target" (LB3). "Discovered" (BFS), "Visited" (DFS), "Settled" (Dijkstra) are each correct for their algorithm and the narration uses the same word, so keep them. Complexity heads: merge "Case or resource", hash "Operation" with non-operation rows (HT4); the others fit. ChipList `hotLabel` is "current" by default but means "just pushed" in DFS and Dijkstra and "last operation" in BST; pass an explicit label in each.

**X5 (low). Layout at 360px.** Merge legend (5 items) and Dijkstra legend (9 items) wrap to two and three rows; fine. Hash custom-keys field `w-64` fits (256 of 296px). BST buttons (five, about 90px each) wrap to two rows under the key field; the grouping in BT3 makes that wrap read as intended. Touch targets are unchanged from round 2 (`btn` about 36px, `btn-icon` 44px below `sm`).

## Verified as sound

Notices tied to `player.index` in all six pages; keyboard grid edits confirmed through `grid-editor.svelte.js:123-153`; `aria-disabled` on BST Undo/Reset; live region muted during autoplay with the `stoppedAt` status in `step-controls.svelte:14-23`; hash chip `sr-only` state text; per-frame `describe` covers every frame kind in all six engines; the DFS pseudocode neighbour order matches `neighbors()` reversed; Dijkstra routes panel is independent of playback; lower-upper caret and `n` slot make `hi = n` visible; BST "Perfectly balanced height" line delivers the degeneration payoff; text pairs white on active 6.29, white on sorted 5.48, white on swap 4.70, slate-900 on frontier 8.33, indigo-900 on visited 5.73, slate-900 on path 10.69, slate-600 on slate-100 6.92, stale ring slate-700 on visited 5.19, touched ring sky-900 on frontier 4.42, path ring amber-700 on path 3.01.

## Unresolved questions

1. MQ1: is a "Sorted" preset acceptable as a page-level branch, or should `makeArray` (read-only by convention) gain the case in a later engine pass?
2. BT1: is horizontal scrolling of the tree on phones acceptable, or should the lesson cap the tree at 11 nodes below `sm`?
3. DJ1: the hatch change touches `app.css`, which every grid lesson shares; confirm the lighter stripe is wanted before the BFS page (which has no mud) is affected by nothing but the utility definition.
