# Code review: six new lessons, shared components, structures topic (e590e2d..795d1fa)

## Scope
- 67 files, +7346/-195. The review covered the engines, their tests, three shared components, six pages and their tests, copy, the refactored bubble and BFS pages, the registry, README, and CHANGELOG.
- Deviations already listed in the phase reports and plan are not re-reported: the merge display order, the Dijkstra averaged step cost, three hash functions, BST frame semantics, the missing BST `path` glyph, the 977-frame BST worst case, the unverified mud hatch, and `done` being omitted on search traces.
- Gate at HEAD: `npm test` 21 files / 280 tests pass. `npm run check` (18 errors) and `npm run lint` (7 errors) fail only because of the untracked `src/lib/algo-engine/engine-probes.test.js`. That file is not in the batch and was not written by this reviewer; it looks like another agent's scratch file. Whoever owns it should delete it. Without it the tree is green.

## Engine verification (empirical)
A scratch fuzz script (`node`, direct ESM imports from the scratchpad) ran each engine against a brute-force reference:
- Merge and quick (last, median3, random) on 3000 arrays with n from 0 to 24 and values from 0 to 5. Every final array is sorted, every frame is a permutation of ids, and merge is stable. At every quick frame, each index in `sorted` holds its final value.
- Lower and upper bound on 3000 arrays with targets from -1 to 11 match `findIndex(v >= x)` and `findIndex(v > x)`. Reads never exceed `ceil(log2(n+1))`.
- Hash table (500 key sets × 3 functions): the stored set equals the distinct keys, every key sits in `hashKey(k, m, fn)`, and a search for a present key ends in `search-hit`.
- BST (500 random 40-op logs over keys 0-29): the final in-order keys equal a reference set. In-order stays strictly increasing in every frame except the two-child `relink` frame, where the duplicate is by design.
- DFS and Dijkstra (300 random 10×16 grids): the DFS path is contiguous, open, and runs start to goal. DFS reachability matches Bellman-Ford. Dijkstra's path cost equals the Bellman-Ford optimum.

**No algorithmic defects were found in the six engines.** Every finding below is in page logic, accessibility, or consistency.

## Critical Issues
None.

## High Priority

**H1. Dijkstra: moving start or goal onto mud leaves a hidden cost 5 under it.** Verified.
- `src/routes/graphs/dijkstra-grid/+page.svelte:125-138`. `edit()` refuses walls but lets start and goal move onto mud, and `cost[cell]` stays `MUD_COST`.
- `cellLook` (l.156-158) returns early for start and goal, so there is no hatch. `cellLabel` gets `s.label` = "Start" with `mud = true`, so screen readers hear "mud, cost 5" while sighted users see none.
- `setMud` (l.102) refuses start and goal, so the learner cannot remove the mud either.
- This breaks the invariant in phase-7 l.102: "mud never goes on a wall, the start, or the goal".
- Scenario (scratch run): default band, move start to (4,7). Dijkstra reports cost 16 and its first relaxation costs 5. With cost 1 under the same start it is 14. The learner cannot explain the extra 2, and the BFS-route comparison is skewed the same way.
- Fix: in `edit()` before `start = cell` / `goal = cell`, add `if (cost[cell] !== 1) cost = cost.map((c, i) => (i === cell ? 1 : c));`. The wall tool already does the same for walls (l.94). Optionally extend `startMoved` to say "(mud cleared)".

**H2. BST: Undo and Reset disable themselves under keyboard focus.** Verified in source. This is the same defect as the earlier M1 (step-controls) and H1 (binary-search).
- `src/routes/structures/bst/+page.svelte:199-200` use `disabled={ops.length === 0}`.
- Scenario: Tab to Reset and press Enter. The log empties, the button becomes `disabled`, and focus drops to `<body>`. Pressing Undo repeatedly does the same on the last op.
- This reverses the house fix documented in `step-controls.svelte:58`.
- Fix: `aria-disabled={ops.length === 0}` in place of `disabled`, plus `if (ops.length === 0) return;` at the top of `undo()` and `reset()`. `btn-outline` needs an `aria-disabled:opacity-50` style if it lacks one.

**H3. Hash table: compared and moved chips past position 8 are never drawn.** Verified. The chain cap comes from the phase-5 spec; the resulting defect does not.
- `src/routes/structures/hash-table/+page.svelte:24,212,225` render only `chain.slice(0, 8)` plus `+N`. `chipState` (l.95-110) can still target `pos >= 8`. The `rehash` "moved" chip is always the last of its chain.
- Scenario (scratch run): Custom keys `0,47,94,…,987` (22 keys, all `≡ 0 mod 47`), mod-prime, search 987. 14 of the 22 walk frames highlight a chip that is not on screen. The final `search-hit` at position 21 is invisible, and a screen reader never hears the sr-only state because the span is not rendered.
- Fix: `MAX_KEYS` is 24, so drop the cap and let the `flex-wrap` row wrap. If the cap stays, slide the window: `const from = Math.max(0, Math.min(frame.pos, chain.length - 1) - 7)` when `frame.bucket === b`. Show `+before` and `+after` counts.

## Medium Priority

**M1. Hash-table and BST notices go stale and use two different live channels.** Verified. This recurs the earlier F1/L7 defect.
- `hash-table/+page.svelte:36,68,84,189-191`: `notice` (`role="alert"`, rose) is cleared only by `rebuild()` and `changePreset`.
- `bst/+page.svelte:34,61,66,74,213-220`: `notice` (`role="status"`, amber) is cleared only by the next add, undo, reset, or preset.
- Scenario: type `5, -3` into Custom keys. The alert appears and the text reverts. The learner then steps through all 97 frames, and "Keys must be whole numbers…" stays on screen the whole time.
- BFS, DFS, and Dijkstra already use the fixed pattern: the notice is tied to `player.index` and shown in place of the narration (`bfs-grid/+page.svelte:46-57`).
- Fix: adopt that `say()`/`clearNotice()` pattern in both pages, rendered in the existing narration `<p>`. This also merges them onto one live region.

**M2. Hash-table search field does not keep its last valid value.** Verified.
- `hash-table/+page.svelte:77-88,184` have no `change` commit. An invalid search raises the range notice but leaves the bad draft in the field.
- This breaks conventions §3 ("keep the last valid value"), which the bounds and BST pages follow.
- Fix: keep `let searchKey = $state(62)`. On error in `runSearch`, set `searchDraft = searchKey`. On success, set `searchKey = searchDraft`.

**M3. DFS `skip` and Dijkstra `stale` frames label the skipped cell "Visiting" / "Expanding".** Verified.
- `dfs-grid/+page.svelte:133-134` and `dijkstra-grid/+page.svelte:171-172` color `frame.current` as active with the current label on every frame. The engines set `current` on `skip` (`dfs-grid.js:138`) and `stale` (`dijkstra-grid.js:97`).
- The narration says "already visited… skip it", but the cell turns orange and its aria-label says "Expanding". On `stale` the cell is in fact settled.
- Fix: in `cellLook`, when `frame.kind === 'skip'` or `'stale'` and `cell === frame.current`, return the visited or settled class with an inset ring, and a label such as `m.legend.stale` ("Stale copy, skipped"). Add that legend entry.

**M4. Merge-sort states rely on color alone.** Verified in source; contrast is PLAUSIBLE. This breaks conventions §3.
- `merge-quick-sort/+page.svelte:101,110-121`: `run` (bg-state-visited) gets no marker, while `write`, `compare`, `pivot`, and `sorted` all have one.
- l.130-139: the buffer states "taken" (slate-200 vs slate-400) and "head" (a ring) have no text.
- l.219: the out-of-range dim is opacity only. `barsLabel` (copy l.38-40) reports "0 of 12 sorted" through the whole merge, so a screen reader gets no run information either.
- Fix: add `run` to `barMarker` (for example `m.markers.run = '▬'`) and to the legend label. Give the buffer head a text marker. Extend `barsLabel` with the current range, e.g. `Working on [lo–hi].`

**M5. The dimmed range makes value labels unreadable.** PLAUSIBLE, not measured in a browser.
- `src/lib/components/bar-chart.svelte:43` puts `opacity-40` on the whole column, including the `text-slate-600` value label. That label is about 2:1 against white, which fails WCAG 1.4.3 for text.
- In merge and quick, most bars sit outside the active range on most frames.
- Fix: this changes a shared component, so it belongs in a follow-up. Dim only the bar (`{dimmed(i) ? 'opacity-40' : ''}` on the inner bar div at l.51), or use `opacity-60` and keep the label at full opacity.

**M6. Grid-lesson page logic is copied three times instead of shared.** Verified.
- DFS differs from BFS in 45 of 234 lines. Dijkstra repeats the same block with a mud branch.
- Duplicated: `notice`/`say`/`clearNotice`/`narration`, `rebuild`, `setWall`, `edit`, `scatter`, `clearWalls`, the start/goal/wall branches of `cellLook`, `legend`, and `onPaintStart` (bfs l.46-146, dfs l.51-151, dijkstra l.67-195).
- Copy duplicates `coord`, `cellLabel`, `edits`, `blockedCell`, `gridLabel`, and `tools` verbatim across three `copy.en.js` files.
- The next fix to the editing rules (H1 is one) must be made three times, and one copy will drift.
- Fix: extract `src/lib/player/grid-editor.svelte.js` exporting `createGridEditor({rows, cols, trace, extraTools})`. It would own walls, start, goal, tool, and notice, plus the edit rules and the `onPaintStart`, `onPaint`, and `onEdit` handlers. Pages would keep only `cellLook` and panels. Move `coord`, `cellLabel`, and `edits` into a `grid-copy.en.js` that the three lesson copies spread in.

## Low Priority
- **L1.** Default quicksort claims stability. `merge-quick-sort/+page.svelte:38-42` and copy l.35-36. The initial array has no duplicates, so the Quicksort row says "equal values kept their order", which contradicts takeaway 2. Fix: when there are no duplicate values, return `'no equal values on this array'`.
- **L2.** The quick pivot move is counted but never shown. `merge-quick-sort.js:256-259` swaps `a[p]` and `a[hi]` and increments `swaps` before the `pivot` frame, but the page only marks `hi` (l.99). Bar `p` changes value with no ⇄. Fix: in `barState`, return `'write'` for the `pivot` frame when `frame.focus.length === 2`.
- **L3.** Dijkstra marks stale chips hot too. `dijkstra-grid/+page.svelte:301-304` sets `hot: c === frame.touched`, which also lights stale duplicates of the same cell. Fix: `hot: c === frame.touched && d === frame.dist[c]`.
- **L4.** Silent reloads. "New array" (merge-quick) and "New keys" (hash) reload to frame 0. When the learner is already at frame 0, the narration text is identical, so nothing is announced. Fix: after `player.load`, `say()` a short confirmation ("New array loaded.") using the M1 pattern.
- **L5.** The BST preset cannot be reapplied. `bst/+page.svelte:205` is a one-way `value={preset}` with `onchange`. After Reset, the select still shows the old preset, and choosing it again fires no change. Fix: set `preset = ''` in `reset()` and `undo()` and add a placeholder option, or add a "Load" button.
- **L6.** The hash focus-bucket ring (`ring-slate-300`, `hash-table/+page.svelte:207-210`) is about 1.5:1 against white, below the 3:1 non-text minimum. It is the only visual cue on `hash` frames. Use `ring-slate-700`.
- **L7.** The ChipList `hot` state is color-only (`chip-list.svelte:100-102`). That was pre-existing in BFS, but five lessons now use it. Follow-up: add an sr-only " (current)" suffix, or an optional `hotLabel` prop.
- **L8.** Copy accuracy:
  - `hash-table.js:41` pseudocode says `b = hash(key) mod m`, but multiplication does not take `mod m` (the formula line reads `⌊m·frac(kA)⌋`). Use `b = h(key)  // bucket in 0..m-1`.
  - `lower-upper-bound/+page.svelte:59` has a comment claiming the range runs "one below the smallest value", but it starts at 0.
  - `bst/copy.en.js:101` teases "tree traversals and binary heaps", which do not exist; the next lesson in the registry is BFS.
  - `site.en.js:42` still describes Graphs as "layer by layer to find shortest paths", which no longer fits DFS or Dijkstra. Try "Explore grids with BFS, DFS, and Dijkstra to find paths and cheapest routes".

## Cross-lesson inconsistencies (learner-visible) and recommended house convention

| # | Inconsistency | Where | Convention to adopt |
|---|---|---|---|
| C1 | Error and notice channel: a notice in the narration tied to the frame (BFS, DFS, Dijkstra); a rose `role="alert"` banner (hash); an amber `role="status"` banner (BST); a silent revert (bounds target, BST field on change) | pages listed | A notice in the narration tied to `player.index` (the BFS pattern) for every refusal or invalid entry, with the field reverting to its last valid value |
| C2 | Legend markers: prefixed in the label text (sorting, merge-quick); a separate aria-hidden span (BST); omitted even though chips show `? ✓ + →` (hash) | hash l.123-128, bst l.279-285 | Every legend item that has a visual glyph shows it, as `${marker} ${label}` like the sorting pages |
| C3 | Legend swatch: `size-3 rounded-sm` everywhere except BST (`rounded-full border-slate-700`) | bst l.281 | `size-3 rounded-sm`; circles only if the node glyph is drawn |
| C4 | Stat grid: `grid-cols-2` with `col-span-2` for an odd card (merge-quick, DFS); `grid-cols-3` (Dijkstra, BST); 5 cards in `grid-cols-2` leaving one orphan (hash) | dijkstra l.275, bst l.302, hash l.255 | `grid-cols-2`, with the last card `col-span-2` when the count is odd |
| C5 | Panel heading style: ChipList `text-xs text-slate-500`; bounds result `text-sm font-semibold text-slate-800` (l.206); hash bucket card uppercase tracking (l.196) | pages | Right-column panels use the ChipList style; visual-card headings are omitted or use the same style |
| C6 | "Current cell" wording: BFS and Dijkstra say "Expanding", DFS says "Visiting"; path labels read "Path length", "DFS path length", "Path cost" | copy legends | One verb per concept across the three grid lessons ("Expanding"), with the path label naming the algorithm in all three |
| C7 | Complexity header: bounds, DFS, and Dijkstra supply `Resource`; hash ("Grow"), BST ("Memory"), and merge-quick ("Extra memory") put resource or operation rows under the default `Case` header, the same defect as the earlier L8 | copy l.22 / l.96 / l.109 | Supply `complexityHead` whenever a row is not an input case |
| C8 | Size ranges: bubble 5-30, merge-quick 6-24, bounds 6-24, hash count 4-24 | pages | Acceptable (engine caps), but state the range in the label or tooltip when it differs |
| C9 | State color meanings drift: `state-active` means pivot, midpoint, "Just added", "New", or "Expanding"; `state-frontier` means "In queue", "Just moved", or "Successor" | legends | Keep one meaning per token where the palette allows (active = the element being acted on now); list the known overloads in the conventions doc |

## Edge cases from scouting
- Custom hash keys that all collide (H3). Start or goal dropped on mud (H1). A stale or skip pop (M3). Undo down to zero ops (H2). `-0` parses as key 0 in `parseKeys`, which is harmless.
- Merge with n=0 or n=1 emits only `start`/`done`. Median-of-3 on a two-element range always picks `lo`. Both are fine.
- The BST two-child `relink` frame shows the duplicated key in `treeLabel` for one frame, which is intended.

## Positive observations (risk calibration only)
- The engines are correct under heavy fuzzing. Frames never alias: every array is copied per push.
- The GridBoard and ChipList extraction is behavior-identical. The BFS diff moves the code verbatim, and `lesson-pages.test.js` changed only in the nav expectation.

## Recommended actions
1. H1: clear the cost when start or goal moves onto mud.
2. H2: use `aria-disabled` for the BST Undo and Reset buttons.
3. H3: stop truncating hash chains.
4. M1 and C1: one frame-tied notice channel for hash and BST.
5. M2: revert the search field to its last valid value.
6. M3: a distinct look for skip and stale cells.
7. M4 and M5: text markers for merge runs, and a readable dim (follow-up change to the shared component).
8. M6: extract the grid editor and its copy before the next grid lesson.
9. Low items and C2-C7 in one consistency pass.
10. Delete the stray untracked `engine-probes.test.js`.

## Metrics
- Type coverage: JSDoc plus `checkJs strict`. Batch files report 0 errors; the only errors are in the untracked stray file.
- Tests: 280 pass. There are no tests for H1, H2, or H3, the random pivot, or the pointer paths.
- Lint: 0 in the batch; 7 in the untracked stray file.

## Unresolved questions
- M5 and L7 change shared components, which the conventions freeze for lesson phases. Should they go in a follow-up component phase?
- C9: is overloading palette colors across lessons acceptable to the designer, or should the conventions pin one meaning per token?

Status: DONE_WITH_CONCERNS
Summary: The six engines are algorithmically correct (fuzzed against references). The defects are in page logic: a hidden mud cost under a moved start or goal, BST buttons that drop focus, invisible hash-chain highlights past 8, and stale or split notice channels. There are also nine learner-visible cross-lesson inconsistencies.
Concerns/Blockers: An untracked `src/lib/algo-engine/engine-probes.test.js` (not from this batch or this reviewer) currently fails `npm run check` and `npm run lint`.
