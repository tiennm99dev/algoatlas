# Phase 2: `structures` topic and a four-topic hub grid

Runs alone, after phase 1 and before phases 3-8. Effort 0.5h. Phases 5 and 8 depend on this phase, because `lesson-layout.svelte` reads `copy.topics[lesson.topic]`.

## Context

Topics are defined in `src/lib/i18n/site.en.js:27-42` (`topics` and `topicOrder`). They drive the header nav (`src/routes/+layout.svelte`), the hub cards (`src/routes/+page.svelte:7`), and prerender entries (`src/routes/[topic]/+page.js`). The home topics grid is `md:grid-cols-3` (`src/routes/+page.svelte:44`), so four topics would wrap 3+1. The site chrome test pins the nav to three topics (`src/routes/lesson-pages.test.js:336-342`).

## Requirements

- Add the topic `structures`: title "Data structures", blurb "Store data so that adding, finding, and removing stay fast as it grows."
- `topicOrder = ['sorting', 'searching', 'structures', 'graphs']`.
- The home topics grid shows four columns on large screens and two on medium: replace `md:grid-cols-3` at `+page.svelte:44` with `md:grid-cols-2 lg:grid-cols-4`. Leave the how-it-works grid at line 31 as is (it has three steps).
- Update the one nav expectation in the site chrome test.

## Files

Modify only:
- `src/lib/i18n/site.en.js`
- `src/routes/+page.svelte` (line 44 class only)
- `src/routes/lesson-pages.test.js` (the expectation in `marks the topic hub as the current page ...` only)

## Steps

1. In `site.en.js`, insert between `searching` and `graphs`:
   ```js
   structures: {
     title: 'Data structures',
     blurb: 'Store data so that adding, finding, and removing stay fast as it grows.',
   },
   ```
   and set `topicOrder` as above.
2. In `+page.svelte:44`, change the grid classes as above.
3. In `lesson-pages.test.js`, make the expected nav list `[['Sorting', 'page'], ['Searching', null], ['Data structures', null], ['Graphs', null]]`.
4. Run the gate.

## Interim state (expected, not a bug)

Until phase 9, `/structures/` renders a hub with no lessons and the home card reads "0 lessons". The prerender still succeeds. Nothing links to an unregistered lesson.

## Acceptance criteria

- The header nav lists four topics in the new order, and `/structures/` prerenders.
- The routing test `prerenders exactly the ordered topics` passes with four entries.
- `npm run lint && npm run format:check && npm run check && npm test && npm run build` passes.

## Validation

```sh
npx vitest run src/routes/lesson-pages.test.js src/lib/lessons/registry.test.js
npm run lint && npm run format:check && npm run check && npm test && npm run build
```

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Hub card for a zero-lesson topic looks empty during phases 3-8 | H x L | This only happens between commits and is never deployed on its own. Phase 9 fills it. If `main` deploys in between, it shows "0 lessons", which is honest. |
| `lg:grid-cols-4` cards become narrow at 1024px | M x L | `max-w-5xl` gives about 230px per card; titles are short. The owner can check it visually (no browser here). |

## Rollback

Revert the commit. Phases 5 and 8 cannot render without this phase, so revert them first.
