# AlgoAtlas correctness and maintainability review

Date: 2026-09-29. Commit: d9d85e9. Read-only review, no source files changed.

## Scope and verification

- Files read: `src/lib/algo-engine/*`, `src/lib/player/*`, `src/lib/components/*`, `src/routes/**`, `src/lib/lessons/**`, `src/lib/i18n/*`.
- `npm test`: 46/46 pass. `npm run check`: 0 errors, 0 warnings. `npm run lint`: clean.
- Scratch fuzz tests in the session scratchpad (not in the repo):
  - 3000 random arrays with duplicates, n from 0 to 11, run through both sorts. Output is sorted and stable. Swap count equals the inversion count. Counters equal the number of compare and swap frames. Every index bubble sort marks as sorted holds its final value.
  - 3000 binary searches (n from 0 to 39, present and absent targets): results are correct and reads never exceed floor(log2 n)+1.
  - 500 random BFS grids (1x1 to 6x6, start==goal included): the path is contiguous, has no walls, and its length equals dist[goal].
- Scratch component tests (jsdom) reproduced the page findings below.

**Result: the engines are correct.** Every verified defect is in the UI or the player.

## Findings

### Medium

**M1. Binary search text and counters use a target that has not been committed yet or is null.**
`src/routes/searching/binary-search/+page.svelte:131,167,30,70-73`
`bind:value` updates `target` on every keystroke, but `rebuild()` runs only on `change`, and its `Number.isFinite` guard (l.42) protects the trace only. `m.describe(frame, values, target)`, `linearReads` and `probe()` all read the live `target`.
- Reproduced: on the default trace, step to the `go-right` frame and type `5` without blurring. The page says "31 < 5, so the target can only be to the right. lo = 8." That is false, and "Linear scan reads" changes to 1 while the trace is still for 53.
- Clear the input: it shows "31 < null ...".
- In drive mode with an empty target, `probe()` still runs `decide(values, i, null)` and shows "31 > null: everything right of here is ruled out."

Fix: keep a committed target (`let searched = $state(INITIAL_TARGET)`), set it in `rebuild()` after the guard, and pass `searched` to `describe`, `linearSearchComparisons` and `decide`. Alternatively bind the input to a separate draft variable.

**M2. The quiz asks and scores the same comparison again after rewinding.**
`src/routes/sorting/bubble-insertion-sort/+page.svelte:39,44,66`
`answered` remembers only the most recent frame index. Rewinding (First/Back stay enabled while locked) and stepping forward again re-opens questions that were already answered, and each answer adds to `asked` again.
- Reproduced: answer compare #1, step on, answer compare #2 (score 1/2), press First, then Next. The same question is asked again, and answering it gives 2/3.
- The score can be inflated or deflated by replaying, and review stepping is blocked by questions already answered.

Fix: track answered frames in a set that resets in `rebuild()`, and gate `awaiting` on `!answeredSet.has(player.index)`. Use a fresh `Set` per update, or `SvelteSet`.

**M3. The playback timer outlives the page.**
`src/lib/player/player.svelte.js:25-44`
`createPlayer` never tears down its pending `setTimeout`, and no page or `StepControls` calls `pause()` on destroy (the only `$effect` in `src` is the quiz gate).
- Reproduced: play the binary page, then unmount. One timer is still pending and 5 more ticks run against the destroyed component's state.
- On BFS the trace is 252 frames (321 on an open grid). At 0.5x that is up to about 10 minutes of orphaned ticking after client-side navigation, repeated for every visit.

Fix: add `$effect(() => () => player.pause());` in `step-controls.svelte`, which is mounted with every player. Or expose `destroy()` and call it from `onDestroy` in each page. Do not put `$effect` inside `createPlayer`, because the unit tests call it outside a component.

### Low

**L1. A speed change mid-play waits for the old delay.**
`player.svelte.js:68-71`
The setter only assigns `speed`. The timeout already pending keeps its old delay, so switching from 0.5x to 16x still waits up to 2 s for the next frame.
Fix: in the setter, if `playing`, call `clear()` and reschedule `setTimeout(tick, 1000 / v)`.

**L2. BFS wall painting reacts to non-primary buttons and can get stuck on.**
`src/routes/graphs/bfs-grid/+page.svelte:79-96,153`
`onPointerDown` does not check `e.button`, so right-click or middle-click paints. `onPointerMove` does not check `e.buttons`. If the `pointerup` is lost (context menu opened by right-click, or release outside the window), `painting` stays set and walls are drawn by hovering with no button held.
I found this by reading the code and did not reproduce it: jsdom has no `elementFromPoint`.
Fix: `if (e.button !== 0) return;` in down, and `if (!(e.buttons & 1)) { painting = null; return; }` in move.

**L3. Global shortcuts swallow browser shortcuts that use modifiers.**
`src/lib/components/step-controls.svelte:211-219`
Alt+ArrowLeft (browser Back) and Ctrl/Cmd+Arrow are intercepted with `preventDefault()` and step the player instead.
Fix: return early when `e.altKey || e.ctrlKey || e.metaKey`.

**L4. The insertion-sort "sorted" shading drops the element that was just shifted.**
`src/lib/algo-engine/sorting.js:110,129`
During insertion of key i, `sorted` stays `range(i)`. After the first shift the key sits inside 0..i-1 and the shifted prefix element sits at index i, which is drawn grey. The shading does not match the sorted prefix until the `place` frame. The fuzz run confirmed that the marked indices are not sorted mid-insertion.
Fix: use `range(i + 1)` from the first swap, and let the focus colour identify the key. Alternatively document the shading as meaning "prefix before this insertion".

**L5. `makeArray('nearly-sorted', n)` corrupts the array when n < 2.**
`sorting.js:151-153`
It returns `[null, 100]` for n=1 and `[null]` for n=0 (verified). The UI slider minimum is 5, so users cannot hit this, but the function is exported and the tests do not cover it.
Fix: `if (n < 2) return ascending;`.

**L6. Some pseudocode lines are never highlighted.**
Bubble lines 1–2 (`swapped = false`, inner `for`) are never active, and line 5 appears only on the early-exit pass. Insertion line 0 is active only on `start`. Binary line 1 (`while`) is never active. BFS lines 4–5 are never active, and rejected neighbours produce no frame, so wall and already-visited checks are invisible.
None of these is wrong, but the hub claims "the matching line of pseudocode lit up". Consider a `pass-start` frame for bubble line 1 and optional `skip` frames for BFS line 5.

**L7. Minor factual imprecision in the BFS copy.**
`src/lib/lessons/bfs-grid/copy.en.js:61`
"each edge is checked once": in an undirected grid each edge is examined from both endpoints, which is at most 2E checks. The O(V+E) bound still holds. Suggest "each edge is checked at most twice".

Related: `site.en.js:48` names the complexity columns `['Case','Time','Why']`, but the BFS row "Memory, O(V)" sits under the "Time" header.
Fix: rename the column to "Cost" or "Bound".

**L8. The footer year is computed at build time.**
`src/routes/+layout.svelte:36`
`new Date().getFullYear()` is baked into the prerendered HTML and differs from the client value after New Year, until the site is rebuilt. Svelte 5 fixes the text during hydration, so this is only a stale first paint for users without JS, and I did not treat it as a functional hydration bug. The fix is optional.

**L9. Typing and DRY.**
- `LessonCopy` (`registry.js:6-8`) has `[k: string]: any`, so `describe`, `complexity` and `takeaways` are not type-checked in `lesson-layout.svelte`. Add explicit properties.
- The segmented radio `label` class string and `selectClass` are copied across three pages. A small `segmented-control.svelte` or a shared class constant would remove the copies. This is optional.

## Checked and found correct (brief)

- Bubble early exit, n=0 and n=1 traces, and stability with duplicates (strict `>`).
- The claim that swaps equal n(n-1)/2 on the reversed preset: the reversed preset is distinct for n from 5 to 30.
- Binary search: empty array, absent below/above range, `found` text, and the "20 comparisons for a million" claim (floor(log2 1e6)+1 = 20).
- BFS: start==goal, a walled-in goal, and marking cells visited when they are enqueued.
- SSR determinism: the initial arrays, target and walls are fixed. `Math.random` is only called from user handlers.
- Quiz auto-pause: the `$effect` pauses before the next timeout fires.
- The sort page's radio `bind:group` runs before the delegated `onchange` rebuild, as covered by the existing test.

## Test gaps

There are no tests for any of these:
- quiz rewind
- `target` edits before commit
- player speed changes while playing
- timer teardown on unmount
- the `makeArray` n<2 edge
