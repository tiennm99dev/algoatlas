# AlgoAtlas full-codebase review

Date: 2026-09-29. Commit: `7bbe606`. This was a read-only review. No files in `src/` were changed.

## Scope

- Files: every file under `src/` (engines, player, 4 components, i18n, registry, 3 lesson copy modules, all routes, test support), plus `svelte.config.js`, `vite.config.js`, `vitest.config.js`, `eslint.config.js`, `jsconfig.json`, `package.json`, and both workflows. About 2,700 lines of source.
- Gates at HEAD: `npm test` 63/63 pass, `npm run lint` clean, `npm run check` 0 errors and 0 warnings. `build/` is blocked from agent reads, so the build output was not inspected. I checked CSP behavior in the SvelteKit source instead (see Security).
- Reproductions: I ran scratch jsdom tests from the session scratchpad through a separate Vitest config. Nothing was added to the repo.
- Scout focus: frame and notice state across edits and playback, keyboard and pointer paths in the BFS grid, ARIA semantics, keyed `each` blocks, and dev-runtime warnings.

## Overall assessment

The engines and player are still correct. Every prior finding is resolved or moot (see "Confirmed OK"). I found no critical or high issues. One real UI state bug remains (F1). The rest are small a11y semantics issues, one dev-warning source, and maintainability items.

## Findings

### Medium

**F1. A BFS refusal notice stays on screen and hides the narration through stepping and playback.**
`src/routes/graphs/bfs-grid/+page.svelte:48,51,77,256`
- `notice` is set in `edit()` (l.77) and cleared only in `rebuild()` (l.51). The narration paragraph renders `{notice || m.describe(frame, COLS)}` (l.256).
- Stepping, seeking and playing never call `rebuild()`, so after one refused edit the step-by-step explanation disappears until the grid is edited again.
- Reproduced in jsdom:
  1. Select "Move start" and activate the wall at (0,6). The notice appears.
  2. Press Next twice, then Last.
  3. The notice is still shown, and the "Dequeue ..." narration never appears.
- Screen-reader users lose the live narration too, because the `aria-live` region keeps the stale text.
- Fix: tie the notice to the frame it was raised on.
  ```js
  let notice = $state({ text: '', at: -1 });
  // in edit(): notice = { text: m.blockedCell, at: player.index };
  // in rebuild(): notice = { text: '', at: -1 };
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, COLS),
  );
  ```
  Render `{narration}`. Add a page test: after a refusal, press Next and expect "Dequeue".

### Low: state and runtime

**F2. `bind:this` on a plain array logs a Svelte dev warning for every BFS mount.**
`src/routes/graphs/bfs-grid/+page.svelte:31,225`
- `const cellRefs = []` is non-reactive, so `bind:this={cellRefs[cell]}` triggers `[svelte] binding_property_non_reactive`. This is visible in `npm test` stderr for every BFS test and would show in the dev console.
- The warning names the wrong file (`lesson-layout.svelte:225:20`) because of the snippet boundary, which makes it confusing to chase.
- Behavior works, because the refs are only used imperatively. The cost is noise that hides real warnings, and `svelte-check --fail-on-warnings` does not catch runtime warnings.
- Fix: drop `cellRefs` and look the cell up when moving focus:
  ```js
  /** @type {HTMLElement} */ (e.currentTarget).closest('[role="grid"]')
    ?.querySelector(`[data-cell="${focusIndex}"]`)?.focus();
  ```
  Here `e.currentTarget` is the button that received the keydown. Alternatively, declare `let cellRefs = $state.raw([])`.

**F3. With the Walls tool, the start and goal cells ignore edits without feedback.**
`src/routes/graphs/bfs-grid/+page.svelte:60,72-74`
- `edit()` calls `setWall(start, …)`, which returns early at l.60.
- A keyboard user who presses Enter on S or G gets no change and no message. The Move-start and Move-goal tools do show `m.blockedCell` in the same situation (l.76-78).
- Fix: in `edit()` for the wall tool, set the notice when `cell === start || cell === goal` (after F1), and return.
- Leave the pointer drag path (`setWall` from `onPointerMove`) silent. Painting across S/G should not flash a message.

**F4. The "Visited" counter includes queued cells, but the legend shows them as a separate state.**
`src/routes/graphs/bfs-grid/+page.svelte:45,160,265-266`
- `visitedCount` counts every `dist >= 0` cell, which includes the frontier. The grid draws frontier cells as "In queue", a different color from "Visited".
- Example: on the `start` frame the counter reads 1 while no cell is drawn as Visited. Mid-run, the count exceeds the number of indigo cells by the queue length.
- Fix: either count `frame.dist.filter((d, c) => d >= 0 && !queueSet.has(c)).length`, or rename the stat to "Discovered" in `copy.en.js:20`. The takeaway at `copy.en.js:58` supports "discovered = marked on enqueue", so the rename is the simpler option.

**F5. For insertion sort, the sorted-count text says "in place" for a prefix that is not final.**
`src/lib/lessons/bubble-insertion-sort/copy.en.js:29-31`, `src/routes/sorting/bubble-insertion-sort/+page.svelte:124-127`
- `barsLabel` says "`k` of `n` in place". For insertion sort, `frame.sorted` is the sorted prefix, and those elements still move when later keys land.
- Example: after the first `place` on `[42,17,88,…]` it announces "2 of 12 in place", but 42 later moves.
- Fix: word it as "`k` of `n` sorted". Or pass `algo` and keep "in place" for bubble only.

### Low: accessibility

**F6. On lesson pages, the topic nav link is marked `aria-current="page"`.**
`src/routes/+layout.svelte:35`
- `startsWith(href)` is true for `/algoatlas/sorting/bubble-insertion-sort/`, so screen readers announce the Sorting link as "current page" on a page that is not the topic hub.
- Fix: use `aria-current={page.url.pathname === href ? 'page' : page.url.pathname.startsWith(href) ? 'true' : undefined}`. Keep the `aria-[current]` style so both values still highlight.

**F7. The BFS column-header row has `role="row"` but no cells in the accessibility tree.** (PLAUSIBLE)
`src/routes/graphs/bfs-grid/+page.svelte:204-212`
- Every child of the first `role="row"` is `aria-hidden`, so the row owns no `gridcell` or `columnheader`.
- axe's `aria-required-children` rule, and some screen readers, treat an empty row as broken grid structure. This could shift row counts, so SR users would hear "row 2" for grid row 0.
- Not verified: no browser or axe is available.
- Fix: replace `role="row"` on that wrapper with `aria-hidden="true"`, and drop the per-span `aria-hidden`.

**F8. Binary search watch mode: cell labels disagree with the visual "done" state.**
`src/routes/searching/binary-search/+page.svelte:113,168,176-177`
- `cellClass` greys every cell once `doneWatching` (l.113). The label's `out` (l.168) only checks the window.
- After `not-found`, cells inside the last `[lo,hi]` span look ruled out but are announced without ", ruled out". After `found`, the hit cell is announced without any "found" state.
- The cells are also `disabled` in watch mode, so screen readers announce each one as "unavailable".
- Fix: compute `out` once per cell with the same `doneWatching` term used by `cellClass`, and append a found marker to `m.cellLabel` for the hit cell.
- Optional: render watch-mode cells as non-button elements.

### Low: maintainability

**F9. Static copy lists are keyed by their text.**
`src/lib/components/lesson-layout.svelte:48,58,64`, `src/routes/sorting/bubble-insertion-sort/+page.svelte:152`, `src/routes/graphs/bfs-grid/+page.svelte:244`
- Two identical takeaways, two rows with the same case label (for example two "Worst" rows with different notes), or two identical legend labels would throw `each_key_duplicate` in dev. In prod they may render the wrong rows.
- The lists never reorder, so a content key buys nothing.
- Fix: key by index, `(i)`, as `code-panel.svelte:22` already does.

**F10. `code-panel.svelte` hard-codes a document-wide id.**
`src/lib/components/code-panel.svelte:8`
- `headingId = 'pseudocode-heading'` becomes a duplicate id, and `aria-labelledby` points at the wrong heading, as soon as a lesson shows two panels. Showing two panels is a natural next step for the side-by-side comparison lessons that `nextTeaser` promises.
- Fix: `const headingId = $props.id();` (Svelte 5.20+, the repo has ^5.57).

**F11. The BFS copy's `describe` depends on `this`.**
`src/lib/lessons/bfs-grid/copy.en.js:42`
- `this.coord` works only while `describe` is called as `m.describe(...)`. Passing it as a callback, or destructuring it (`const { describe } = m`), makes `this` undefined and throws.
- The other two copy modules do not use `this`.
- Fix: `const at = (c) => en.coord(c, cols);`. The binding is initialized before any call.

**F12. Route casts around `resolve` are repeated six times.**
`lesson-layout.svelte:26`, `+layout.svelte:30`, `+page.svelte:23,47,58`, `[topic]/+page.svelte:34`
- Each call site casts `/** @type {'/'} */` to get past typed routes. That turns off route checking at every link, and the same pattern keeps getting copied.
- The registry test (`lesson-pages.test.js:208`) covers lesson paths but not topic paths.
- Fix: make `lessonPath` and `topicPath` in `registry.js` return `resolve(...)` with the single cast inside. Call sites then use the helper directly. Extend the routing test to check that `topicOrder` matches `entries()`.

### Informational (not findings)

- The sort page builds three full traces per array change: the player plus two for `totals`. With n ≤ 30 this is negligible. No action.
- Test gaps tied to the findings above: no test that narration returns after a refusal (F1), no test for `aria-current` on nested routes (F6), and Svelte runtime warnings in stderr do not fail `npm test` (F2).

## Security

- No `{@html}`, `innerHTML` writes (outside test cleanup), `eval`, storage, or network calls in `src/`. All copy is static and escaped by Svelte.
- CSP: `svelte.config.js:14-26` uses hash mode with `style-src 'self' 'unsafe-inline'`. `@sveltejs/kit/src/runtime/server/page/csp.js:149-172` skips style hashes when `unsafe-inline` is present. That matters because a hash would make browsers ignore `unsafe-inline` and break Svelte's `style=` attributes. The config is sound.
- Deploy: publishing permissions are scoped to the `deploy` job, and the build job runs the full gate. Nothing to report.
- Threat model: a static site with no user data, auth, or third-party origins. No trust-boundary issues found.

## Confirmed OK: prior findings resolved (verified against source)

Correctness review (260929-1354):
- M1 uncommitted target: `draft` and `target` are now split, and `rebuild()` guards against non-finite values (`binary-search/+page.svelte:23-27,46-47`). Covered by two page tests.
- M2 quiz replay: moot. Quiz mode was removed (CHANGELOG l.21), and `grep quiz src` finds nothing.
- M3 timer outliving the page: `step-controls.svelte:11` pauses on unmount. Covered by the "stops autoplay" test.
- L1 speed change: the setter reschedules (`player.svelte.js:69-75`). Tested.
- L2 pointer buttons: `e.button` and `e.buttons` are checked (`bfs-grid/+page.svelte:93,109`).
- L3 modifiers: Alt, Ctrl, Meta and Shift are ignored (`step-controls.svelte:15`). Tested.
- L4 insertion shading: the shifted element joins the sorted run (`sorting.js:128`). I confirmed the trace in scratch.
- L5 `makeArray` with n < 2: guarded (`sorting.js:149`).
- L6 unlit pseudocode: `pass-start` frames and widened line sets now light the loop headers.
- L7 BFS copy: "at most twice" and the "Cost" column header are fixed.
- L8 footer year: removed.
- L9 `LessonCopy` types are explicit, and the segmented control is extracted.

Tooling review (260929-1354):
- M1 deploy gate: fixed (`deploy.yml` runs lint, format, check, test).
- M2 publish scopes: fixed.
- M3 format check: fixed (`format:check` runs in both workflows).
- L1 unmount timer: fixed.
- L2 modifiers: fixed.
- L3 `Object.hasOwn`: fixed (`[topic]/+page.js:11`), with a test.
- L4 `--fail-on-warnings`: fixed.
- L5 timeouts and concurrency: fixed.
- L6 `engines` and the VERSION check: fixed (`ci.yml:32`), and `.gitignore` has no duplicate entry.
- CSP: added.

Tester review (260929-1931): informational. None of its gaps is a defect in source.

## Recommended actions

1. Fix F1 and add the regression test.
2. Fix F2 (to stop the warning noise) and F3 and F6 (small edits).
3. Take F4, F5, F8 (copy and label accuracy) together.
4. Fix F9–F12 when the next lesson is added.

## Metrics

- Type coverage: JSDoc with `checkJs` strict, 0 svelte-check diagnostics.
- Test coverage: no coverage tool configured. 63 tests.
- Lint issues: 0. Runtime dev warnings: 1 kind (F2).

## Unresolved questions

- F7 needs a real screen reader or axe run to confirm. None is available on this host.
- F4: should the stat be renamed ("Discovered") or should the count change? This is a product wording choice.
