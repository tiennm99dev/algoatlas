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

### Changed

- Quiz mode is removed; lessons focus on visualization. The sorting lesson now shows both algorithms' totals for the current array.
- Frames carry `lines` (every pseudocode line a step executes), so each pseudocode line is highlighted at some step.
- Sorting bars carry ?, ⇄ and ✓ markers so state is not conveyed by color alone; BFS shows row and column numbers.
- Screen-reader narration pauses during autoplay; the swap animation honors reduced motion; step controls use SVG icons.
- Home page leads with a start button and the how-it-works steps; skip link and current-topic marker in the header.
- Shared button, field, and focus-ring utilities plus a segmented control replace per-page class strings.

### Added

- Deploy workflow runs lint, format check, type check, and tests before building; Pages permissions are scoped to the deploy job; workflow timeouts and CI run cancellation for superseded PR pushes.
- `format:check` script, `svelte-check --fail-on-warnings`, `engines.node >= 24`, hash-based Content Security Policy.
- Regression tests for each fix above, pseudocode line coverage, routing, and registry-to-route consistency.

## [0.1.0.0] - 2026-09-29

### Added

- SvelteKit static site (JavaScript + JSDoc, Tailwind 4, ESLint), prerendered for GitHub Pages under `/algoatlas`.
- Trace-based algorithm engines with unit tests: bubble and insertion sort, binary search, breadth-first search on a grid.
- Shared step player (play, pause, step, rewind, scrub, speed, keyboard shortcuts) and pseudocode panel.
- Lessons: bubble & insertion sort with quiz mode, binary search with a "you drive" mode, BFS with wall painting.
- Landing page and generated topic hubs for Sorting, Searching, and Graphs.
- CI (lint, type check, tests, build) and GitHub Pages deploy workflows.
