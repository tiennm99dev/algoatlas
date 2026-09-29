# Site chrome and learner-journey fixes

All of H1, M1-M8 and L1-L14 are applied per the review and the settled decisions (L15 unchanged, L10 theme-color only).

- Lesson nav (H1): `lesson-layout.svelte` renders previous/next from the global `lessons` order; the teaser describes the next link; the last lesson shows the teaser and an "All topics" link. Dijkstra teaser rewritten.
- 404 (M1): `static/404.html` (no JS, inline CSS, link to `/algoatlas/`), one README line under Deploy. The build directory is read-blocked by a hook, so `build/404.html` was not listed; `npm run build` exits 0 and adapter-static copies `static/` to the root.
- Sticky controls (M2): last direct child of the outer grid on all nine pages with the placement classes; binary search keeps it behind `{#if mode === 'watch'}`, and the drive-mode restart button stays in the left column.
- Hub cards (M3, L13), home page (M4, incl. hash table now Beginner), header current marker (M5), complexity heads (M6), "Try it:" lead-in and moved rules (M7), complexity note and V/E gloss (M8).
- L1-L14: Inter 500 import, Replay label, re-announced stop message, range focus rings, code line `duration-75`, footer no new tabs and "© 2026", `main` tabindex, topic-named back link, `summary` field plus nine summaries, theme-color, print rules, scrollable complexity table, copy fixes, one "Try …:" takeaway on each of the eight lessons.
- Tests: site chrome block covers prev/next (first, middle, last), aria-current marker classes, back link/Try it/complexity note, controls last in the grid, hub link names; registry test covers `summary` and a Beginner entry per topic.
- Changed existing test: "announces where playback stopped" now awaits `tick()` and `flushSync()` because the status text is set after a clear. No DOM-order assertion needed changing.

Validation: lint, format:check, check (0 errors, 0 warnings), npm test (321 pass), build all pass.

Status: DONE
Summary: Every review item is implemented with tests; lint, format, check, tests, and build are clean.
Concerns/Blockers: `build/404.html` could not be listed because of the read-block hook.
