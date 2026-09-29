# Changelog

All notable changes to **AlgoAtlas** are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: 4-digit MAJOR.MINOR.PATCH.MICRO.

## [Unreleased]

### Fixed

- Binary search narration, counters, and you-drive checks used the target while it was still being typed ("31 < 5", "31 < null"); they now use the committed target.
- Sorting bars near the maximum rendered at the same height because the value label shared the bar's column.
- Autoplay kept ticking after leaving a lesson; a speed change waited for the old delay.
- Arrow shortcuts stopped after clicking a control and swallowed Alt/Ctrl/Meta combinations such as browser Back.
- White text on teal and green controls failed WCAG AA contrast; small grey labels were too faint.
- BFS: right-click painted walls, painting could stick after a lost pointer-up, cells hid their button role and distance from screen readers, and the focus ring vanished on colored cells.
- Insertion sort left the just-shifted element unshaded; `makeArray` returned `null` for one element.
- Unknown topics such as `/constructor/` crashed instead of returning 404.
- The BFS complexity row claimed each edge is checked once; it is examined from both ends.
- A refused BFS edit ("Pick an open cell") stayed on screen and hid the narration while stepping; it now shows only on the step it was raised on and clears when the tool changes. With the Walls tool, Enter on the start or goal was silent.
- Focus fell to the page body when a probed binary-search cell or a step button at the end of the trace became disabled; they are now `aria-disabled` and focus stays put (a probe moves focus to the new midpoint).
- Pausing and the end of autoplay were never announced; a status line now says where playback stopped. Keyboard grid edits are confirmed in the narration.
- Space toggled playback anywhere on a lesson page, hijacking page scrolling; it now works only while the visualizer area is focused, arrows still work everywhere.
- The topic link was marked the current page while inside a lesson; lessons now use `aria-current="true"`, hubs `"page"`.
- Binary-search cell labels disagreed with the greyed look after the search ended and never named the found cell. The BFS "Visited" stat counted queued cells; it is now "Discovered".
- Pseudocode lines wrap instead of scrolling; state fills meet 3:1 non-text contrast (darker compare and visited colors, ring on path cells).
- Topic navigation is visible on phones; segment and icon buttons grow to 44px there; the BFS grid is drawn transposed on phones so cells stay touchable and lets vertical swipes scroll; step controls stick to the bottom on narrow screens.
- Decorative arrows are hidden from screen readers; the BFS complexity table is headed "Resource" instead of "Case"; the sorting chart label says "sorted" rather than "in place".
- A Svelte dev warning fired on every BFS mount from `bind:this` into a plain array.

### Changed

- Quiz mode is removed; lessons focus on visualization. The sorting lesson now shows both algorithms' totals for the current array.
- Frames carry `lines` (every pseudocode line a step executes), so each pseudocode line is highlighted at some step.
- Sorting bars carry ?, ⇄ and ✓ markers so state is not conveyed by color alone; BFS shows row and column numbers.
- Screen-reader narration pauses during autoplay; the swap animation honors reduced motion; step controls use SVG icons.
- Home page leads with a start button and the how-it-works steps; skip link and current-topic marker in the header.
- Shared button, field, and focus-ring utilities plus a segmented control replace per-page class strings.
- The sorting bars, BFS grid, and BFS queue panel are rendered by the shared components, with no behavior change.
- The home topics grid shows four columns on wide screens; the existing lessons’ teasers point at the new lessons.
- Lessons link to the previous and next lesson in order; the teaser describes the next one. A static 404 page covers mistyped URLs.
- Step controls stay pinned until the code panel on phones; the Play button reads Replay at the end; hub cards are named by their title; the current topic is underlined.
- Complexity tables use only Case or Resource headers with a Big-O gloss; every lesson has a one-sentence summary for its meta description and a “Try …” takeaway.
- Merge/quick sort: a Sorted preset, a captioned buffer row that stays mounted, the quicksort low side drawn, a balanced-depth reference, and the stability verdict in the narration.
- Lower/upper bound: a one-row window strip and legend text that names the test for the chosen variant.
- Hash table and BST: Enter submits the primary action, dark text on compare fills, a focusable scrolling tree on phones, the focused bucket scrolls into view.
- Dijkstra and DFS: mud cells carry an inset ring and the relax narration states popped + step; stale queue entries are labelled.

### Added

- Deploy workflow runs lint, format check, type check, and tests before building; Pages permissions are scoped to the deploy job; workflow timeouts and CI run cancellation for superseded PR pushes.
- `format:check` script, `svelte-check --fail-on-warnings`, `engines.node >= 24`, hash-based Content Security Policy.
- Regression tests for each fix above, pseudocode line coverage, routing, and registry-to-route consistency.
- CI checks that `VERSION` and `package.json` agree; `license` field; the reason for the `cookie` override is recorded in the runbook.
- Binary-search legend, ✓ marker on the found cell, and a one-row window strip that stays readable when cells wrap.
- Tests for long reversed arrays, negative values, duplicate search values, a sealed BFS start, the lesson registry, `aria-current` on nested routes, and the stop announcement.
- Lesson: merge sort & quicksort, one page with an algorithm toggle, pivot rule, call-stack panel, merge buffer row, and totals for both on the same array.
- Lesson: lower bound & upper bound on a half-open window, with the insertion caret, equal range, and duplicate count.
- Lesson: hash table with separate chaining, three hash functions, growth at load factor 0.75, and search hit or miss.
- Lesson: binary search tree with an insert, search, and delete log drawn as an SVG tree, successor deletion, and sorted-insert degeneration.
- Lesson: depth-first search on the BFS grid, with visit order, stale-entry skips, and the DFS path against the BFS shortest path.
- Lesson: Dijkstra’s algorithm on a grid with mud terrain, a priority-queue panel, and the cost of the BFS route for comparison.
- "Data structures" topic and hub.
- Shared `bar-chart`, `chip-list`, and `grid-board` components, and a `terrain-mud` hatch utility; each lesson keeps its interaction tests beside its route.

## [0.1.0.0] - 2026-09-29

### Added

- SvelteKit static site (JavaScript + JSDoc, Tailwind 4, ESLint), prerendered for GitHub Pages under `/algoatlas`.
- Trace-based algorithm engines with unit tests: bubble and insertion sort, binary search, breadth-first search on a grid.
- Shared step player (play, pause, step, rewind, scrub, speed, keyboard shortcuts) and pseudocode panel.
- Lessons: bubble & insertion sort with quiz mode, binary search with a "you drive" mode, BFS with wall painting.
- Landing page and generated topic hubs for Sorting, Searching, and Graphs.
- CI (lint, type check, tests, build) and GitHub Pages deploy workflows.
