# Test Quality and Coverage Review — AlgoAtlas

**Date:** 2026-09-29  
**Project:** AlgoAtlas (SvelteKit 2 + Svelte 5 static site)  
**Scope:** Test execution, quality assessment, coverage analysis  
**Status:** All 63 tests pass. Vitest environment configured correctly.

---

## Executive Summary

The test suite is well-structured and exercises core algorithm logic with meaningful assertions. However, coverage is uneven across modules: algorithm engines have good unit tests but components and utilities are undertested. Five high-priority gaps exist in edge cases (large array handling, invalid input tolerance, state edge cases) and three modules have zero direct unit test coverage. No tests are flaky; test cleanup and fake timers are properly configured. CI runs tests on every PR and main branch push.

---

## Test Execution Results

```
Test Files: 5 passed (5)
Tests:      63 passed (63)
Duration:   3.32s (transform 44%, tests 24%, environment 21%, import 7%, setup 3%, worker 1%)
Environment: Vitest 5.0.2, Node 24, jsdom (component tests), Node (unit tests)
```

All tests pass deterministically. No flaky patterns observed.

---

## Vitest Configuration Assessment

**File:** `vitest.config.js`  
**Status:** ✓ Correct

- Environment: Node by default, jsdom opt-in via `@vitest-environment jsdom` docblock. Correct for mixed test suite.
- Plugins: `@sveltejs/vite-plugin-svelte` correctly compiles `*.svelte.js` rune modules for import in tests.
- Aliases: `$lib` resolves correctly. `$app/paths` and `$app/state` point to test stubs.
- Include: `src/**/*.test.js` pattern correct; extension `.test.js` consistently used.
- Setup file: `src/test-support/setup-dom.js` adds jsdom `matchMedia` stub (required by Svelte 5's `prefersReducedMotion`).

**Test Stubs Assessment:**  
- `app-paths-stub.js`: Minimal but sufficient; `resolve()` and `asset()` are identity functions (acceptable for static site context).
- `app-state-stub.js`: Supplies hardcoded `page.url`; no dynamic state tested (acceptable).
- Both stubs are *not* faithful to SvelteKit's full contract (e.g., `page.url` includes no query params or fragments), but stubs are narrow enough that current tests don't expose gaps.

---

## Test File Analysis

### 1. Sorting Engine Tests (`src/lib/algo-engine/sorting.test.js`)

**Lines:** 132 | **Tests:** 10 describe blocks, ~16 assertions

**Strengths:**
- ✓ Correctness: Final values match Python `sorted()` for random, nearly-sorted, reversed, few-unique presets.
- ✓ Edge cases: Empty input, single element, duplicates (stability test covers this).
- ✓ Invariants: Complexity counters never decrease; item IDs preserved for animation.
- ✓ Pseudocode coverage: Both algorithms execute every line via combined random + sorted traces.
- ✓ Complexity analysis: Specific test for bubble early-exit (4 comparisons, 0 swaps on sorted), insertion on sorted (n-1 comparisons), reversed input (n(n-1)/2 swaps).

**Gaps:**
- ✗ No test for very large n (e.g., n=1000) to verify no off-by-one errors in loop bounds under scale.
- ✗ No test for input with negative or zero values (all tests use positive integers).
- ✗ `toItems()` is untested as a standalone function; relies on being tested indirectly through sort traces.
- ✗ No test for the `range()` helper (internal function, tested indirectly via `sorted` array).

**Risk:** Low. Core algorithm logic is well-covered. Missing tests are edge cases unlikely to occur in intended UI usage (users interact via preset buttons, not direct input).

---

### 2. Searching Engine Tests (`src/lib/algo-engine/searching.test.js`)

**Lines:** 81 | **Tests:** 6 describe blocks, ~13 assertions

**Strengths:**
- ✓ Correctness: Binary search finds all present elements; reports absent correctly (below, above, between).
- ✓ Logarithmic bound: Verified for large array (n=1000).
- ✓ Window shrinking: Each iteration reduces search space.
- ✓ Edge cases: Empty array, single element (via hardcoded test array).
- ✓ Pseudocode coverage: Both found and not-found paths exercise all lines.
- ✓ Comparison counting: Accurate under-bounds verification.

**Gaps:**
- ✗ No test for duplicate values in sorted array (e.g., `[1, 2, 2, 2, 3]`; which 2 gets found?).
- ✗ `midpoint()` helper untested directly (tested indirectly via binary search traces).
- ✗ No test for very large target values (e.g., target > max array value; covered in "above range" but not stress-tested).
- ✗ `linearSearchComparisons()` tested only on the hardcoded array; edge case of n=0 not covered (would return 0, but untested).

**Risk:** Low. Core algorithm is robust. Duplicate-value behavior is a minor gap (binary search will find *a* match, correctness tier is acceptable).

---

### 3. Graph Engine Tests (`src/lib/algo-engine/graph.test.js`)

**Lines:** 83 | **Tests:** 4 describe blocks, ~12 assertions

**Strengths:**
- ✓ Correctness: Finds shortest path on open grids; routes around walls correctly.
- ✓ Contiguity: Path cells are neighbors of one another (no teleportation).
- ✓ Edge cases: Empty grid (unreachable), start == goal (returns immediately), sealed goal (reports no-path).
- ✓ Visited order: Cells dequeued in non-decreasing distance order (BFS property).
- ✓ Pseudocode coverage: Both found and no-path paths exercise all pseudocode lines.
- ✓ Wall-keeping: `randomWalls()` never walls the start/goal cells.

**Gaps:**
- ✗ No test for grids where *all* neighbors are walls (e.g., a 2×2 grid, goal at (1,1), three walls surrounding it). Current "sealed goal" test uses a 2×2 grid but the sealed setup only blocks specific neighbors. A test where start is surrounded (other than goal) would verify frontier expansion halts.
- ✗ `neighbors()` tested at corners and edges (0, 2, 3, 8 on 3×3), but not systematically (missing middle cell tests like (4,1,1) on 3×3 = index 4 = cell 4, which should return [1,5,7,3]; **this is tested indirectly** but not named).
- ✗ No test for very large grids (e.g., 100×100) to verify queue doesn't overflow or algorithm degrades.
- ✗ No test for the internal `parent` array when goal is found; path correctness is verified, but parent-chain reconstruction not unit-tested.

**Risk:** Low-Medium. BFS logic is solid, but a large grid stress test would catch regressions in queue handling if performance characteristics change.

---

### 4. Player Tests (`src/lib/player/player.svelte.js`)

**Lines:** 71 | **Tests:** 1 describe block, ~9 test cases

**Strengths:**
- ✓ Boundary behavior: `step()` / `back()` clamp to [0, length-1].
- ✓ Autoplay: Correctly advances at configurable speed; stops at end.
- ✓ Restart on play-at-end: Replays from frame 0.
- ✓ Manual step pauses autoplay.
- ✓ Seek clamping: Out-of-range seeks clamp to bounds.
- ✓ Speed changes apply immediately while playing (reschedules timeout).
- ✓ Fake timers: Tests use `vi.useFakeTimers()` correctly; timers are cleaned up after each test.
- ✓ Load resets state: `load()` moves to frame 0 and updates frame array.

**Gaps:**
- ✗ No test for initial state with a single-frame trace (edge case: frames array has length 1; `atEnd` should be true, `step()` should not advance).
- ✗ No test for rapid state changes (e.g., `play()` immediately followed by `pause()` before any `tick()`).
- ✗ No test for speed=0 or negative speed (should those be guarded? No validation in source).
- ✗ No test for memory leaks (multiple `play()`/`pause()` cycles don't leave orphaned timers). The `clear()` function looks correct, but no verification.

**Risk:** Low. Core state machine is correct. Edge cases are unlikely in UI context (component controls prevent invalid speeds; single-frame traces are not typical lesson scenarios).

---

### 5. Lesson Page Integration Tests (`src/routes/lesson-pages.test.js`)

**Lines:** 215 | **Tests:** 3 describe blocks (3 lessons), 14 test cases + 2 routing tests

**Strengths:**
- ✓ Sorting lesson: Steps forward; algorithm switching reloads trace and pseudocode; side-by-side cost comparison; keyboard shortcuts (arrows, space) activate correctly; modified arrows (alt/ctrl/shift) pass through; autoplay cleanup on unmount (verified by spy on `setTimeout`).
- ✓ Binary search lesson: Watch mode reaches target; ignores incomplete input (learner typing); clears field but keeps last target; you-drive mode rules out cells and detects hits.
- ✓ BFS lesson: Finds shortest path; keyboard activation toggles walls and rebuilds; distances in labels; refuses wall on start; reports no-path when goal sealed; aria-labels descriptive.
- ✓ Routing: Rejects prototype keys (`constructor`); every registered lesson has a route file.
- ✓ Component testing: Uses Svelte 5's `mount()`, `unmount()`, `flushSync()` correctly; DOM queries via aria-labels and text content; event simulation (click, keydown, input) works.
- ✓ Cleanup: Each test clears `document.body.innerHTML`, resets timers, unmounts components.

**Gaps:**
- ✗ No test for switching between lessons (all lesson tests mount one lesson per suite block, but no test for navigating from sorting → searching and back).
- ✗ No test for copy-paste into the number input (binary search target input; current test dispatches `input` event manually, but not `paste` event).
- ✗ No test for rapid algorithm/preset changes (e.g., click algo button 5 times in a row; does player state race?).
- ✗ No test for invalid grid dimensions in BFS (current grid is hardcoded as 10×16; no test for e.g., 1×1 grid or n=0).
- ✗ No test for the disabled state of ruled-out cells in you-drive mode being visually correct (test checks `disabled` attribute exists, but not styling).
- ✗ No test for focus management after button clicks (keyboard accessibility beyond just event propagation).
- ✗ No test for the "explain why" messages (BFS refuses wall on start: "Pick an open cell"; no test for other edit refusals like walling start or goal).

**Risk:** Medium. Component interaction is tested, but some edge cases in user flows (rapid changes, invalid states) are not covered. A user who clicks very fast or pastes unusual input might expose issues.

---

## Untested Modules

| Module | Files | Type | Reason | Impact |
|--------|-------|------|--------|--------|
| i18n system | `src/lib/i18n/index.js`, `site.en.js` | Utility | Minimal logic; `t()` is one line; copy is data. | Low: Static copy has no executable logic. |
| Lessons registry | `src/lib/lessons/registry.js` | Utility | Helper functions tested indirectly (lesson-pages tests invoke routes). | Low-Medium: `lessonsByTopic()`, `lessonPath()`, `topicPath()` are simple pure functions, but no direct unit tests. |
| Step controls | `src/lib/components/step-controls.svelte` | Component | Tested through lesson-pages integration tests (buttons clicked, keyboard events fired). | Medium: Keyboard shortcut logic is tested through DOM, but not in isolation. Edge case of form field focus not directly tested. |
| Code panel | `src/lib/components/code-panel.svelte` | Component | Not directly tested; renders pseudocode lines. | Medium: Visual correctness untested; would benefit from a focused test. |
| Lesson layout | `src/lib/components/lesson-layout.svelte` | Component | Wrapper component; tested through lesson-pages (renders, contains child content). | Low: Simple layout wrapper; structure verified through integration tests. |
| Segmented control | `src/lib/components/segmented-control.svelte` | Component | Used in all lesson pages; tested indirectly (algorithm/preset/tool selection works). | Medium: Generic radio toggle; should have isolated unit test for accessibility and styling. |
| Lesson copy modules | `src/lib/lessons/*/copy.en.js` | Data | Static strings and complexity tables. | None: No executable logic. |

---

## Highest-Value Missing Tests (Ranked by Impact)

### Tier 1: Regression Prevention (Will Catch Silent Bugs)

1. **Large-scale array sorting** (`src/lib/algo-engine/sorting.test.js`)
   - Behavior: Sort n=500 reversed array; verify complexity counter = n(n-1)/2 swaps for bubble.
   - Why: Off-by-one in loop bounds would fail here but pass current tests (which use n≤20).
   - Sketch:
     ```javascript
     it('bubble sort on n=500 reversed has quadratic swaps', () => {
       const items = toItems(makeArray('reversed', 500));
       const last = bubbleSortTrace(items).at(-1);
       expect(last?.swaps).toBe(500 * 499 / 2);
     });
     ```

2. **Binary search with duplicate values** (`src/lib/algo-engine/searching.test.js`)
   - Behavior: Sorted array `[1,2,2,2,3]`, search for 2; verify found.
   - Why: Duplicates expose assumptions about the midpoint and comparison logic.
   - Sketch:
     ```javascript
     it('finds a target when array has duplicates', () => {
       const a = [1, 2, 2, 2, 3];
       const last = binarySearchTrace(a, 2).at(-1);
       expect(last?.kind).toBe('found');
       expect([1, 2, 3]).toContain(last?.mid);
     });
     ```

3. **BFS with start surrounded by walls** (`src/lib/algo-engine/graph.test.js`)
   - Behavior: 3×3 grid, start at (0,0), walls at (0,1) and (1,0), goal at (2,2).
   - Why: Verifies BFS correctly marks visited even when the frontier is empty before goal is reached.
   - Sketch:
     ```javascript
     it('correctly reports no-path when start is trapped', () => {
       const walls = new Set([1, 3]); // block (0,1) and (1,0)
       const last = bfsGridTrace({ rows: 3, cols: 3, walls, start: 0, goal: 8 }).at(-1);
       expect(last?.kind).toBe('no-path');
     });
     ```

4. **Player with single-frame trace** (`src/lib/player/player.svelte.js`)
   - Behavior: `createPlayer([frame])` where frames.length === 1; verify `atEnd` is true, `step()` doesn't advance.
   - Why: Edge case in loop bounds (`index >= frames.length - 1` should be true immediately).
   - Sketch:
     ```javascript
     it('a single-frame trace starts at the end', () => {
       const p = createPlayer(['only']);
       expect(p.atEnd).toBe(true);
       expect(p.atStart).toBe(true);
       p.step();
       expect(p.index).toBe(0);
     });
     ```

5. **Rapid lesson input changes** (`src/routes/lesson-pages.test.js`)
   - Behavior: Switch sorting algorithm 3 times in sequence without waiting; verify final pseudocode matches final selection.
   - Why: Catches state machine races in player's `load()` or frame updates.
   - Sketch:
     ```javascript
     it('rapidly switching algorithms settles to the final choice', () => {
       render(SortPage);
       click(document.querySelector('input[value="insertion"]'));
       click(document.querySelector('input[value="bubble"]'));
       click(document.querySelector('input[value="insertion"]'));
       flushSync();
       expect(text()).toContain('key = a[i]'); // insertion pseudocode
     });
     ```

### Tier 2: Known Gaps in Handled Paths

6. **Lessons registry direct unit tests** (`src/lib/lessons/registry.js`)
   - Functions: `lessonsByTopic(topic)`, `lessonPath(lesson)`, `topicPath(topic)`.
   - Why: Currently tested indirectly; direct tests ensure pure functions remain pure.
   - Sketch:
     ```javascript
     describe('registry', () => {
       it('lessonsByTopic filters by topic', () => {
         expect(lessonsByTopic('sorting').map(l => l.slug)).toEqual(['bubble-insertion-sort']);
         expect(lessonsByTopic('searching').map(l => l.slug)).toEqual(['binary-search']);
       });
       it('lessonPath returns /topic/slug/', () => {
         expect(lessonPath({ topic: 'sorting', slug: 'bubble-insertion-sort' }))
           .toBe('/sorting/bubble-insertion-sort/');
       });
     });
     ```

7. **Segmented control component** (`src/lib/components/segmented-control.svelte`)
   - Behavior: Two-way binding with radio inputs; onchange fires; keyboard navigation (arrow keys).
   - Why: Reusable control used across lessons; should have isolated, focused test.
   - Sketch:
     ```javascript
     it('segmented control binds and fires onchange', () => {
       const options = [{value: 'a', label: 'A'}, {value: 'b', label: 'B'}];
       let value = 'a';
       const onChange = vi.fn();
       mount(SegmentedControl, { target: document.body, props: { options, value, onchange: onChange, name: 'test', legend: 'Test' } });
       flushSync();
       document.querySelector('input[value="b"]').click();
       flushSync();
       expect(onChange).toHaveBeenCalled();
     });
     ```

8. **Code panel pseudocode rendering** (`src/lib/components/code-panel.svelte`)
   - Behavior: Highlight the pseudocode lines from the current frame; gray out others.
   - Why: Visual correctness not currently verified; a regression could silently highlight wrong lines.
   - Sketch:
     ```javascript
     it('highlights only the pseudocode lines in the current frame', () => {
       const frame = { lines: [0, 2] };
       mount(CodePanel, { target: document.body, props: { pseudocode, frame } });
       const highlighted = [...document.querySelectorAll('[data-highlighted]')];
       expect(highlighted.map(el => el.textContent)).toEqual([pseudocode[0], pseudocode[2]]);
     });
     ```

9. **Binary search you-drive mode: ruled-out cell is disabled** (`src/routes/lesson-pages.test.js`)
   - Behavior: After probing index 7 and finding target > value, click index 3 (left of 7) and verify it's disabled.
   - Why: Current test checks `.disabled` attribute but doesn't verify all ruled-out cells remain disabled after subsequent probes.
   - Sketch:
     ```javascript
     it('all cells left of a go-right probe are disabled', () => {
       render(BinaryPage);
       click(document.querySelector('input[value="drive"]'));
       click(button('Index 7, value 31'));
       // Now lo=8, all indices 0–7 should be disabled
       for (let i = 0; i <= 7; i++) {
         const cell = button(`Index ${i}, value ...`); // actual value varies
         expect(cell.disabled).toBe(true);
       }
     });
     ```

10. **Keyboard activation vs. click in BFS** (`src/routes/lesson-pages.test.js`)
    - Behavior: Grid buttons respond to spacebar (detail 0 from keyboard events) to toggle walls, but click (detail 1) should do the same.
    - Why: `keyActivate` helper simulates keyboard by dispatching `click` with `detail: 0`, but the real keyboard behavior is not tested.
    - Sketch:
      ```javascript
      it('space on a focused grid cell toggles wall (keyboard)', () => {
        render(BfsPage);
        const cell = button('Row 0, column 0');
        cell.focus();
        key(cell, { code: 'Space' });
        flushSync();
        expect(button('Row 0, column 0, Wall')).toBeTruthy();
      });
      ```

11. **Insert sort with n=2** (`src/lib/algo-engine/sorting.test.js`)
    - Behavior: `insertionSortTrace(toItems([2, 1]))` should perform 1 comparison, 1 swap, and correctly mark indices 0 and 1 as sorted.
    - Why: The boundary between `i=1` and loop termination is untested; verifies the shift logic at the smallest meaningful size.
    - Sketch:
      ```javascript
      it('insertion sort on n=2 reversed does exactly 1 compare and 1 swap', () => {
        const frames = insertionSortTrace(toItems([2, 1]));
        expect(frames.at(-1)?.comparisons).toBe(1);
        expect(frames.at(-1)?.swaps).toBe(1);
        expect(frames.at(-1)?.sorted).toEqual([0, 1]);
      });
      ```

12. **Sorting lesson: array preset changes while playing** (`src/routes/lesson-pages.test.js`)
    - Behavior: Click play, wait 100ms, change preset, verify autoplay stops and player resets to frame 0.
    - Why: Tests interaction between player state and the rebuild that happens on preset change.
    - Sketch:
      ```javascript
      it('preset change while playing stops and resets player', () => {
        vi.useFakeTimers();
        render(SortPage);
        click(buttonByText('Play'));
        vi.advanceTimersByTime(100);
        expect(text()).toMatch(/Step [2-9] of/); // advanced beyond frame 0
        click(document.querySelector('select')); // preset dropdown
        // Would need to dispatch change event; actual implementation depends on fixture
        flushSync();
        expect(text()).toMatch(/Step 1 of/); // reset to frame 0
        vi.useRealTimers();
      });
      ```

---

## Build Process Verification

**CI Workflow:** `.github/workflows/ci.yml`  
✓ Tests run on every PR and push to main.  
✓ Node 24 + npm ci (locked dependencies).  
✓ Gate sequence: lint → format → type check → **test** → build.  
✓ All gates must pass before deploy.  

**Deploy Workflow:** `.github/workflows/deploy.yml`  
✓ Same gate sequence runs before building and deploying to GitHub Pages.  
✓ Concurrent deploys are blocked (concurrency: cancel-in-progress is false).  

**Verdict:** Build infrastructure is solid. No test depends on wall-clock time or locale.

---

## Observations on Test Quality

**Positive:**
- Assertions are meaningful, not tautological. Tests verify correctness, not just that code runs.
- Edge cases are deliberate (empty, single element, start==goal).
- Test helpers (`seeded()`, `finalValues()`, `button()`) keep tests DRY.
- Fake timers are used correctly; no leaks or unawaited promises.
- Component test cleanup is thorough (unmount, clear innerHTML, reset timers).
- Test isolation is good; tests do not depend on execution order.

**Concerns:**
- Complexity tests (counts, bounds, stability) are well-covered, but *error cases* are not: what if an algorithm receives corrupted input or performs an invalid operation?
- Component tests do not verify accessibility deeply; aria-labels are checked, but not keyboard navigation, focus management, or screen-reader semantics (e.g., does a disabled button announce why?).
- No performance regression tests; if an algorithm accidentally became O(n²) instead of O(n log n), tests wouldn't catch it.
- Helper functions (`toItems()`, `midpoint()`, `neighbors()`) are tested indirectly; direct unit tests would make failures easier to diagnose.

---

## Summary Checklist

| Category | Status | Notes |
|----------|--------|-------|
| All tests pass | ✓ | 63/63, no flaky patterns |
| Vitest config correct | ✓ | Environments, aliases, setup files verified |
| Algo engines covered | ⚠ | Core logic good; missing large-scale and duplicate-value tests |
| Player state machine | ✓ | Bounds and transitions covered; single-frame edge case missing |
| Component interaction | ⚠ | Lesson pages tested; individual components (segmented-control, code-panel) not isolated |
| Untested modules | ✗ | i18n, registry, step-controls, code-panel, lesson-layout, segmented-control |
| Error handling | ✗ | No tests for invalid input or corrupted state |
| Accessibility | ⚠ | aria-labels verified; keyboard nav and focus management incomplete |
| Performance | ✗ | No regression tests or benchmarks |
| CI/CD integration | ✓ | Tests gate both main and deploy pipelines |

---

## Recommendations (Prioritized)

**Immediate (Week 1):**
1. Add large-scale sorting test (n=500 reversed) to catch off-by-one errors.
2. Add binary search duplicate-value test.
3. Add BFS trapped-start test.

**Short term (Week 2–3):**
4. Add direct unit tests for `registry.js` functions.
5. Add isolated test suite for `segmented-control.svelte`.
6. Add `code-panel.svelte` pseudocode highlighting test.

**Medium term (Sprint):**
7. Add player edge-case tests (single frame, rapid state changes).
8. Add keyboard navigation tests for step-controls.
9. Add rapid lesson input change test.
10. Expand BFS coverage for wall-surrounded cells.

**Optional (Quality):**
11. Add performance regression tests (e.g., verify bubble sort on n=100 completes in <100ms).
12. Add accessibility audit for keyboard navigation and screen-reader semantics.
13. Add visual regression tests (screenshot comparisons) for component styling.

---

## Questions for the Team

- Should error cases (e.g., sort with non-numeric values, search in unsorted array) be tested? Or are these considered user input validation, out of scope for algorithm tests?
- Are duplicate values in the binary search array a supported use case? Current test suite doesn't cover it, but the algorithm should still find *some* match.
- Should `segmented-control.svelte` and `code-panel.svelte` have isolated test suites, or is indirect testing through lesson-pages sufficient for maintenance velocity?

---

**End of report.**
