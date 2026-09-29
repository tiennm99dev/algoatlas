# AlgoAtlas site chrome and learner-journey review (round 3)

Date: 2026-09-29. Source-only review of `src/` on `main` at 4dae0d3; no browser. Scope: home, hubs, header and footer, lesson layout chrome, shared step controls and code panel, cross-lesson navigation, and copy across the nine lessons. Visualizer internals are covered by another reviewer. Items from the round-2 report that are now fixed in source are listed at the end and not repeated.

## Summary

The chrome is in good shape: the skip link, `aria-current`, scoped Space shortcut, `aria-disabled` step buttons, stop announcement, wrapped pseudocode, mobile nav, and sticky controls all landed. The remaining gap is the **learner journey**: a lesson ends with a text-only "Next up" teaser and no link, so the path the home CTA starts (bubble sort) dies after one page, and the last lesson promises A* search, which does not exist. Secondary themes are a home page whose explanatory strip outweighs the actual topic cards, hub cards whose link name is the whole card, a sticky control bar that cannot reach the code panel on phones, and an unstyled GitHub 404 for any mistyped URL.

## High

**H1. No forward path between lessons; the teaser is dead text.**
`src/lib/components/lesson-layout.svelte:82-84` renders `lesson.nextTeaser` in a `<footer>` with no link. After "Start with sorting" (`src/routes/+page.svelte:22-26`) the learner reads "Next up: merge sort and quicksort" and has to go back to the hub or the header to find it; on `dijkstra-grid/copy.en.js:101` the teaser names A* search, which is not in the registry, so the last page of the site promises a lesson that does not exist. Fix: derive previous and next from the global `lessons` order in `registry.js` and render a two-link nav, keeping the teaser as the next link's description.

```svelte
<script>
  import { lessons, lessonPath } from '$lib/lessons/registry.js';
  const at = $derived(lessons.findIndex((l) => l.slug === lesson.slug));
  const prev = $derived(lessons[at - 1]);
  const next = $derived(lessons[at + 1]);
</script>
<nav aria-label={copy.lessonChrome.lessonNavLabel} class="mt-10 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
  {#if prev}
    <a href={resolve(/** @type {'/'} */ (lessonPath(prev)))} class="focus-ring rounded-xl border border-slate-200 bg-white p-4 hover:border-teal-600">
      <span class="block text-xs text-slate-500"><span aria-hidden="true">←</span> {copy.lessonChrome.previous}</span>
      <span class="font-semibold text-slate-900">{prev.title}</span>
    </a>
  {/if}
  {#if next}
    <a href={resolve(/** @type {'/'} */ (lessonPath(next)))} class="focus-ring rounded-xl border border-teal-200 bg-teal-50 p-4 hover:border-teal-600 sm:col-start-2 sm:text-right">
      <span class="block text-xs text-teal-800">{copy.lessonChrome.next} <span aria-hidden="true">→</span></span>
      <span class="font-semibold text-slate-900">{next.title}</span>
      <span class="mt-1 block text-sm text-slate-600">{lesson.nextTeaser}</span>
    </a>
  {:else}
    <p class="text-sm text-slate-500 sm:col-start-2 sm:text-right">{lesson.nextTeaser} <a href={resolve('/')} class="text-teal-700 hover:underline">{copy.lessonChrome.backToHub}</a></p>
  {/if}
</nav>
```
Add `lessonNavLabel: 'Lesson navigation'`, `previous: 'Previous lesson'`, `next: 'Next lesson'` to `lessonChrome`. Rewrite the Dijkstra teaser to something true today, e.g. "That is every lesson so far. A* search, which aims Dijkstra at the goal with a distance estimate, is next on the roadmap." Recommendation: global order (topic by topic), so the "Start with sorting" CTA becomes a nine-lesson path. Alternative: links only within a topic and a "Next topic" link on the last lesson of each hub.

## Medium

**M1. Any unknown URL shows GitHub's generic 404 with no way back.**
`svelte.config.js:10` uses `adapter()` with no `fallback`, there is no `static/404.html`, and `src/routes/[topic]/+page.js:11` `error(404)` only runs at build time because every route is prerendered. A learner who edits or mistypes a URL (for example drops the trailing slash on a share link, or follows a stale link) lands on GitHub's page, which does not mention AlgoAtlas. Fix: a hand-written `static/404.html` that needs no JavaScript (so the CSP is irrelevant) with the site title, "That page does not exist", and a link to `/algoatlas/`; GitHub Pages serves a root `404.html` for project sites (PLAUSIBLE: documented behavior, not verified here). Alternative: `adapter({ fallback: '404.html' })` plus a `+error.svelte`, which client-renders the real chrome but depends on JS and on kit computing the CSP hash for the fallback shell (PLAUSIBLE).

**M2. Sticky controls stop short of the code panel on phones.**
Every lesson wraps the controls in `<div class="sticky bottom-2 z-10 lg:static">` as the last child of the left column (`bubble-insertion-sort/+page.svelte:145`, `merge-quick-sort:306`, `binary-search:250`, `lower-upper-bound:188`, `hash-table:269`, `bst:305`, `bfs-grid:129`, `dfs-grid:148`, `dijkstra-grid:215`). A sticky element cannot leave its containing block, and that block ends where the right column (counters, comparison, `CodePanel`) begins, so below `lg` the controls scroll away exactly when the learner reaches the pseudocode. Fix: make the sticky wrapper a direct child of the outer grid and place it with grid coordinates on desktop.

```svelte
<div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
  <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">…visualizer, narration…</div>
  <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">…counters, CodePanel…</div>
  <div class="sticky bottom-2 z-10 lg:static lg:col-start-1 lg:row-start-2"><StepControls {player} /></div>
</div>
```
Trade-off: the controls move after the code panel in DOM and tab order on every size. Recommendation: accept, because the narration (the thing a screen-reader user reads after each step) is still adjacent. Alternative: leave as is and rely on the keyboard shortcuts, which the hint already advertises.

**M3. Hub card links are named by the entire card.**
`src/routes/[topic]/+page.svelte:33-42` makes the whole card an `<a>` containing the level, `<h2>`, and the intro, so a screen reader's link list reads "Intermediate Merge sort & quicksort Both break the O(n²) barrier by divide and conquer…" for each entry. Fix: keep the card clickable but name the link by the title.

```svelte
<li class="relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-600 hover:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-700">
  <div class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{lesson.level}</div>
  <h2 class="mb-1 text-lg font-bold text-slate-900">
    <a href={…} class="after:absolute after:inset-0 after:rounded-2xl outline-none">{lesson.title}</a>
  </h2>
  <p class="text-sm leading-relaxed text-slate-600">{lesson.intro}</p>
</li>
```

**M4. Home page hierarchy is inverted and the level is missing where the choice is made.**
`src/routes/+page.svelte:33` paints the three "How every lesson works" cards solid `bg-teal-700`, the heaviest block on the page, while the topic cards at `:46` (the real navigation) are plain white with no hover state. The lesson links at `:58-62` show no level, so a learner picking from the home page cannot tell that "Merge sort & quicksort" is Intermediate until the hub. Fix: `bg-teal-50 border border-teal-200 text-teal-900` on the how-cards (number and heading `text-teal-800`), add `transition hover:border-teal-600 hover:shadow-sm` to the topic cards, and append a level badge to each lesson link: `<span class="ml-1 text-xs text-slate-500">· {lesson.level}</span>`. Note that "Data structures" has no Beginner lesson at all (`hash-table/copy.en.js:10`, `bst/copy.en.js:7`), so a beginner following the cards has no entry there; the hash table lesson reads as beginner-friendly and could carry that label.

**M5. The current topic in the header is marked by colour alone.**
`src/routes/+layout.svelte:43` uses `aria-[current]:text-teal-700` against `text-slate-600`; luminance contrast between the two is about 1.2:1, so the indicator is invisible to many colour-blind and low-vision learners (WCAG 1.4.1). Fix: add `aria-[current]:font-semibold aria-[current]:underline aria-[current]:decoration-2 aria-[current]:underline-offset-4`.

**M6. Complexity table headers drift across lessons.**
First-column headers are "Case" (2 lessons, default at `site.en.js:54`), "Resource" (5), "Case or resource" (`merge-quick-sort/copy.en.js:134`), and "Operation" (`hash-table/copy.en.js:22`) whose rows are "Average", "Worst", "Grow" — the first two are cases, not operations. Convention 7 (supply `complexityHead` when rows are not input cases) is followed, but the hash rows contradict their own header. Fix: hash rows `['Lookup, average', …]`, `['Lookup, worst', …]`, `['Grow (rehash)', …]`; merge-quick head to `['Resource', 'Cost', 'Why']` with rows `Time, merge` / `Time, quick typical` / `Time, quick worst` / `Extra memory`, matching the `Time, balanced` style already used in `bst/copy.en.js:99`. Recommendation: keep the per-lesson head but use only two vocabularies, "Case" and "Resource". Alternative: one site-wide head `['What', 'Cost', 'Why']`.

**M7. The instruction banner is styled as a notice and carries lesson facts.**
`lesson-layout.svelte:39-41` renders `lesson.instruction` in a teal callout on every lesson. It earns its place where the controls are non-obvious (grid painting, BST operations, drive mode, hash search), but on `bubble-insertion-sort/copy.en.js:10` it restates what the controls already show, and on `dijkstra-grid/copy.en.js:12` and `merge-quick-sort/copy.en.js:10` it is the only place the step-cost rule and the dimming rule are stated, facts a learner skims past because the box looks like a tip. Recommendation: keep the banner, prefix it with a bold "Try it:" lead-in so it reads as a task, and move the Dijkstra cost rule and the merge dimming rule into the intro or the legend. Alternative: drop the banner and fold one action sentence into the intro paragraph.

**M8. Big-O and V + E are used before they are explained.**
The first Beginner lesson's intro (`bubble-insertion-sort/copy.en.js:8`) says "Both are O(n²)" and the Beginner BFS table (`bfs-grid/copy.en.js:59`) says "O(V + E)" with no gloss of V or E anywhere in the copy. Fix: add `complexityNote: 'O(…) says how the number of steps grows with the input size n; constants are dropped.'` to `lessonChrome` and render it as `<p class="mb-3 text-xs text-slate-500">` under the Complexity heading in `lesson-layout.svelte:60`; in the BFS Why cell say "V cells and E edges between open neighbors" once, and reuse the phrase in DFS and Dijkstra.

## Low

- **L1. Inter 500 is not loaded.** `src/app.css:1-3` imports weights 400, 600, 700, but `font-medium` is used in `+layout.svelte:37`, `+page.svelte:60`, and `segmented-control.svelte:21`; CSS font matching falls back to 400, so those elements have no emphasis. Fix: `@import '@fontsource/inter/500.css';` or change them to `font-semibold`.
- **L2. "Play" at the end actually replays.** `player.svelte.js:41` resets to frame 0, but `step-controls.svelte:80-83` still labels the button "Play". Fix: `{player.playing ? c.pause : player.atEnd ? c.replay : c.play}` with `replay: 'Replay'` in `controls`; keep `w-28`.
- **L3. Repeated stop announcements are swallowed.** `step-controls.svelte:15-23` writes identical text ("Finished at step 40 of 40.") on every run, and live regions do not re-announce unchanged text. Fix: set `stopped = ''` then assign after `await tick()`.
- **L4. Range inputs have no `focus-ring`.** `step-controls.svelte:117` scrub slider, `bubble-insertion-sort/+page.svelte:110`, `merge-quick-sort:242`, `hash-table:188`. Firefox draws a faint default; add `focus-ring rounded` for parity with every other control.
- **L5. Code line highlight lags at 8× and 16×.** `code-panel.svelte:26` `transition-colors` (150ms) versus 125ms and 62ms frames, so two lines glow at once. Fix: `duration-75`.
- **L6. Footer links open new tabs silently and the notice has no year.** `+layout.svelte:61-82`. Drop `target="_blank"` (a static site loses nothing) or add `<span class="sr-only">(opens in a new tab)</span>`; write "© 2026 tiennm99".
- **L7. Skip-link target is not focusable.** `+layout.svelte:53` `<main id="main">` has no `tabindex="-1"`; Safari does not move focus to a non-focusable fragment target (PLAUSIBLE that SvelteKit's router focuses it on hash navigation). Fix: `tabindex="-1" class="flex-1 outline-none"`.
- **L8. Lesson back link does not name the topic.** `site.en.js:49` "All lessons in this topic" is identical on all nine pages. Fix: `backToTopic: (title) => \`All lessons in ${title}\`` and call it with `topic.title` in `lesson-layout.svelte:29`.
- **L9. Meta descriptions are the full intro.** `lesson-layout.svelte:21`; intros run 158–249 characters (bubble sort 249), so search snippets truncate mid-sentence. Fix: optional `summary` field in `LessonCopy` (`registry.js:13-24`) used as `content={lesson.summary ?? lesson.intro}`, filled with one sentence per lesson.
- **L10. Theme and icons.** `app.html:5` ships only an SVG favicon; Safari ignores SVG favicons in tabs (PLAUSIBLE) and there is no `theme-color`. Fix: `<meta name="theme-color" content="#0f766e" />`; a 180px PNG `apple-touch-icon` is optional. Dark mode is absent — noted, not requested.
- **L11. Print.** No print rules: the sticky control bar, shortcut hint, and nav print, and the code panel prints as a black block. Fix: `print:hidden` on the sticky wrappers and `step-controls.svelte:126`, `print:bg-white print:text-slate-900` on `code-panel.svelte:13`.
- **L12. Complexity table on narrow screens.** `lesson-layout.svelte:61` puts three columns in about 328px with a mono `O((V + E) log V)` cell; `overflow-hidden rounded-lg` on `<table>` itself is unreliable for clipping (PLAUSIBLE). Fix: wrap in `<div class="overflow-x-auto rounded-lg border border-slate-200">`, drop the border and rounding from the table, add `whitespace-nowrap` to the cost cell.
- **L13. Graphs hub orphans its third card.** `[topic]/+page.svelte:30` `md:grid-cols-2` leaves Dijkstra alone on a row; add `lg:grid-cols-3`. Hubs also have no cross-topic link; H1's nav covers that if global order is chosen.
- **L14. Copy.** `site.en.js:5` "interactive map" is a metaphor no UI supports; "an interactive tour" matches the stepping model. `site.en.js:42` uses BFS/DFS acronyms on the home card; write "breadth-first, depth-first, and Dijkstra's search". `controls.shortcuts` (`site.en.js:72-73`) says "while the player is focused" but nothing on screen is called the player; say "after you click inside the visualization". Speed options `0.5×…16×` (`step-controls.svelte:107`) never state the base rate; add "1× is one step per second" to the hint. Only the bubble-sort takeaways use "Try …:" prompts that point back at the controls; the other eight would benefit from one such line each.
- **L15. Arrow keys stay global.** `step-controls.svelte:31-32` steps the trace when focus is on a header link or the takeaways, which the hint documents. Recommendation: scope arrows like Space for one rule; alternative: keep, since arrows do not scroll a vertical page. This was unresolved question 1 last round.

## Verified as fixed since round 2

Space scoped to `[data-player-scope]` with a focusable wrapper (`lesson-layout.svelte:46`, `step-controls.svelte:35`), `aria-disabled` step buttons, `stoppedAt` status line, wrapped pseudocode (no scroll stop needed), mobile nav always visible with `flex-wrap`, sticky controls with `shadow-lg lg:shadow-none`, `size-11 sm:size-10` icons and `py-2.5 sm:py-1.5` segments, `©` in one span, `complexityHead` per lesson, arrow glyphs wrapped in `aria-hidden`, amber-600 compare and indigo-300 visited tokens.

## Unresolved questions

1. Global lesson order for prev/next (nine-lesson path) or within-topic only? Recommendation: global.
2. Should the controls move after the code panel in DOM order (M2), or stay where they are with keyboard-only access to the highlighted line on phones?
3. Static `404.html` (no JS) or SvelteKit fallback with `+error.svelte`? Recommendation: static.

Status: DONE
Summary: Chrome and controls are solid after round 2; the site now needs a forward path between lessons, a real 404, and a handful of hierarchy and labelling fixes on the home page, hubs, and header.
Concerns/Blockers: none. Two Pages/Safari behaviors are marked PLAUSIBLE because they cannot be verified without a browser.

Top 10
1. lesson-layout.svelte:82 — high — no prev/next lesson links; Dijkstra teases a lesson that does not exist.
2. svelte.config.js:10 — medium — no 404 page; unknown URLs show GitHub's page with no way back.
3. nine +page.svelte sticky wrappers — medium — sticky controls end before the code panel on phones.
4. [topic]/+page.svelte:33 — medium — hub card link name is the whole card text.
5. +page.svelte:33,46,58 — medium — how-strip outweighs topic cards; no level on home lesson links.
6. +layout.svelte:43 — medium — current topic indicated by colour alone.
7. hash-table/copy.en.js:22 — medium — "Operation" header over "Average/Worst" rows; head vocabularies drift.
8. lesson-layout.svelte:39 — medium — instruction banner reads as a notice and hides lesson facts.
9. bubble-insertion-sort/copy.en.js:8, bfs-grid/copy.en.js:59 — medium — Big-O and V + E never glossed for beginners.
10. app.css:1 — low — Inter 500 not loaded, so `font-medium` renders as regular.
