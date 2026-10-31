---
name: write-lesson
description: Write AlgoAtlas lessons for one curriculum topic (chapter): engine with a step trace, copy, hand-written page with tests, or a quiz page for review lessons. Use when a batch asks you to fill a topic's stubs, for example "write the stacks-queues lessons" or "npm run stubs -- heaps must reach 0".
---

# Write AlgoAtlas lessons for one topic

You fill every stub of **one topic** (a chapter of `src/lib/curriculum/dsa.json`). Another agent
may be writing a different topic in a parallel worktree at the same time, so you stay strictly
inside the files you own. Done means `npm run stubs -- <topic>` reports 0 and every batch check
below passes.

## 1. Read first

1. The topic's entry in `src/lib/curriculum/dsa.json`: each lesson's `slug`, `kind`
   (`theory`, `practice`, `review`), `keyIdeas` and `interactiveIdea`. Those are the brief.
   Cover every key idea; build the planned interaction or something at least as hands-on.
2. `npm run stubs -- <topic>` lists the slugs still to write.
3. Two reference lessons, end to end (engine, test, copy, page, page test):
   - `bst` (trees): an operations log, an SVG tree, undo/reset, presets, notices.
   - `merge-quick-sort` (sorting): two algorithms behind one toggle, aux row, call stack.
   - Grid lessons (`bfs-grid`, `dfs-grid`, `dijkstra-grid`, `a-star`) share
     `grid-board.svelte`, `src/lib/player/grid-editor.svelte.js` and
     `src/lib/lessons/grid-copy.en.js`. The editor's `reset()` puts back the starting walls,
     start and goal (a "Reset grid" button); never rebuild them through its edits.
4. `README.md` sections Lessons and Architecture.

## 2. Files you own

For each lesson slug `<slug>` in topic `<topic>`, and nothing else:

| File | Kinds |
| --- | --- |
| `src/lib/lessons/<slug>/copy.en.js` | all |
| `src/lib/algo-engine/<slug>.js` and `<slug>.test.js` | theory, practice (review needs none) |
| `src/routes/<topic>/<slug>/+page.svelte` | all |
| `src/routes/<topic>/<slug>/page.test.js` | all (no `+` prefix, so SvelteKit ignores it) |

The topic in the route path is the chapter slug, even when it reads oddly (`/structures/...`
is the hashing chapter). The registry discovers `copy.en.js` on its own and throws when `slug`
or `topic` does not match the curriculum; the static route replaces the stub automatically.

Never edit `src/lib/components/`, `src/lib/player/`, `src/lib/curriculum/`,
`src/lib/i18n/`, `src/lib/lessons/registry.js` or `static-routes.js`, other lessons, existing
engines, configs, `package.json`, `README.md` or `CHANGELOG.md`. Import existing engines and
components read-only. If a lesson truly needs a change to a shared file, work around it inside
your page or engine and report it under Concerns; shared helpers are promoted between batches.

A lesson never imports from another lesson's route, engine or copy (`../<other-slug>/...`,
`$lib/algo-engine/<other-slug>.js` that another lesson owns): lessons are independent and
may be rewritten. Use a shared component from `src/lib/components/`, or, when two of your
lessons need the same helper, put it in one engine and report it under Concerns so it can
be promoted.

## 3. Engine and trace contract

`src/lib/algo-engine/<slug>.js` is pure and DOM-free, JSDoc typed (`checkJs` + `strict`).

- The algorithm runs **once** on the input and returns a trace: an array of frames. The page
  only renders frames, so rewinding is showing an earlier frame. Never re-run the algorithm per
  step.
- A frame is a plain immutable snapshot. Typical fields: `kind` (a string union naming the
  step, used by narration), the data state (`items`, `nodes`, `table`, ...), highlighted
  indices or ids, running cost counters (`comparisons`, `swaps`, `reads`, `pushes`, ...), and
  `lines: number[]` (indices into the pseudocode this step executes).
- Copy every array or object into each frame (`a.slice()`, `rows.map((r) => r.slice())`,
  `nodes.map((n) => ({ ...n }))`). Frames must never alias each other or the input.
- Export the pseudocode as `export const <name>Pseudocode = [ ... ]` (a `string[]`, two-space
  indents). Every line must be highlighted by some frame.
- Export the frame typedef (`@typedef {object} <Name>Frame`) so `copy.en.js` and the page can
  import it.
- First frame `kind: 'start'`, last frame `kind: 'done'`, both with `lines` set sensibly.
- Randomness only through an injected `rand = Math.random` parameter (presets, random input).
- Cap the input size with exported constants (`MAX_N`, `MAX_OPS`) so traces stay under about
  400 frames at the cap; say so in the report if one cannot.

`<slug>.test.js` (Node environment) must cover:

- correctness against an independent oracle on several inputs, including edge cases (empty,
  one element, duplicates, sorted, reversed, disconnected, ...); use a local seeded LCG for
  random cases, copied from `src/lib/algo-engine/sorting.test.js`;
- the cost counters on inputs with a known count (for example insertion sort on sorted input
  does `n - 1` comparisons);
- frames do not alias (mutate one frame's array, the next is unchanged);
- a `describe('pseudocode coverage')` test that every pseudocode line index appears in some
  frame's `lines`, in the style of `sorting.test.js`.

## 4. Player, step controls and code panel

```js
import { createPlayer } from '$lib/player/player.svelte.js';
const player = createPlayer(someTrace(INITIAL_INPUT));
const frame = $derived(player.frame);
```

- The player owns `frames`, `index`, `frame`, `playing`, `speed`, `atStart`, `atEnd` and
  `load(trace)`, `step()`, `back()`, `seek(i)`, `play()`, `pause()`, `toggle()`.
- Every input change rebuilds the trace and calls `player.load(nextTrace)` (then optionally
  `player.seek(...)` to a useful frame). Never mutate frames.
- Start from a **fixed** initial input so prerendered and hydrated HTML match. `Math.random`
  only inside user-triggered handlers.
- `<StepControls {player} />` (from `$lib/components/step-controls.svelte`) gives play/pause,
  step, rewind, scrub, speed, the arrow-key and Space shortcuts, and stops playback on unmount.
  Put it in a `sticky bottom-2 z-10 print:hidden lg:static` wrapper as the reference pages do.
- `<CodePanel lines={xPseudocode} active={frame.lines} />` highlights the executing lines.
- Narration: `<p aria-live={player.playing ? 'off' : 'polite'}>{narration}</p>`, where the
  narration is `m.describe(frame, ...)`, or a notice (below) on the frame it was raised on.
- Pass `speed={player.speed}` to visualizers so colour transitions turn off at high speed.

## 5. Copy (`copy.en.js`)

Start with `@typedef` imports of the engine's frame types, then `export const en = { ... }`
with every `LessonCopy` field from `src/lib/lessons/registry.js`:

| Field | Notes |
| --- | --- |
| `slug`, `topic` | exactly the curriculum slug and chapter slug |
| `level` | difficulty within the topic: `'Beginner'`, `'Intermediate'` or `'Advanced'` |
| `title` | the curriculum title, unchanged |
| `intro` | two or three sentences: what it is and why it matters |
| `summary` | one sentence for the meta description |
| `instruction` | the "Try it:" line: which controls to touch and what to watch |
| `takeaways` | 4 or 5 bullets; the last one suggests an experiment on the widget |
| `complexity` | rows of exactly three strings `[case, cost, why]` |
| `complexityHead` | required whenever a row is not an input case, e.g. `['Operation', 'Cost', 'Why']` |
| `nextTeaser` | one sentence naming the next lesson in curriculum order |

Plus every label the page shows (buttons, fields, legend, stat names, notices, aria labels)
and `describe(frame, ...)` returning the narration for every frame `kind`. No user-facing
string lives in the page or the engine. Plain English, short sentences, Unicode symbols
(`≤`, `→`, `log₂ n`), curly apostrophes as in the reference copy.

## 6. Page (`+page.svelte`)

```svelte
<LessonLayout lesson={m}> ... </LessonLayout>
```

with `import { en as m } from '$lib/lessons/<slug>/copy.en.js'`. `lesson-layout.svelte` renders
the back link, title, intro, the Try it box, takeaways, the complexity table and
previous/next links; your page renders only the interactive part as its children.

Layout, as in the reference pages:

- controls row `mb-4 flex flex-wrap items-end gap-4` (a `<form>` when a field has a primary
  action, so Enter submits it);
- body `grid gap-4 lg:grid-cols-[1fr_22rem]`: left column visual card plus legend, narration and
  step controls; right column stat cards (`dl`, `grid-cols-2`, last card `col-span-2` when the
  count is odd), panels (`ChipList`), then `CodePanel`.

House rules:

- Fields commit on `change` and keep the last valid value when emptied or invalid. Every
  refusal (bad key, full structure) is a notice tied to `player.index`, shown in place of the
  narration, and the field reverts.
- State is never colour-only: every coloured state also has a marker, label or text, and the
  legend shows `marker label` with `size-3 rounded-sm` swatches.
- Palette meanings: `active` acted on now, `frontier` queued or pending, `visited` finished but
  not final, `sorted` final or found, `compare` a read, `swap` a write, `path` the answer path.
- Keyboard: everything the pointer can do, the keyboard can do. Buttons use `aria-disabled`
  instead of `disabled` when focus would otherwise be lost.
- Desktop first, but nothing may overflow at 390 px: wide drawings scroll inside their card.

## 7. Shared components

All in `src/lib/components/`. Read the JSDoc on each `$props()` before use; states are the
`VisualState` strings from `visual-state.js` (`''`, `compare`, `swap`, `sorted`, `active`,
`frontier`, `visited`, `path`). Every visualizer is SVG, names itself to screen readers
(`ariaLabel`, per-element titles, overridable with `labelOf`), and, when given `onselect`,
turns its elements into a roving-focus set of buttons (arrows move, Enter or Space picks).
Those buttons are `role="button"` cells, and `step-controls` leaves arrow keys pressed on them
(or already handled with `preventDefault`) to the visualizer, so a custom roving widget should
use `role="button"` cells or call `preventDefault` on the arrows it handles. Previous and next
lesson links follow the curriculum order, stubs included, so `nextTeaser` must describe the
very next curriculum lesson and name it by its title (`lesson-content.test.js` checks this).

| Component | Use it for | Key props |
| --- | --- | --- |
| `array-strip` | arrays, two pointers, sliding windows, prefix sums, strings | `values`, `stateOf(i)`, `markerOf(i)`, `pointers: {name, index}[]` (index = length means one past the end), `windows: {from, to, label}[]` (half-open), `dimmed(i)`, `onselect(i)`, `selected` |
| `linked-list-view` | singly, doubly, circular lists | `nodes: {id, label, state?, marker?}[]`, `pointers` (index = length points at null), `doubly`, `circular`, `onselect(i)` |
| `stack-queue-view` | stacks (column), queues and deques (row) | `kind`, `items: {label, state?, marker?}[]` bottom→top or front→back, `capacity` (dashed spare slots) |
| `ring-buffer` | a circular buffer drawn as a ring (circular queues, deques) | `labels`, `head`, `tail`, `headLabel`, `tailLabel`, `titleOf(i)`, `stateOf(i)`, `markerOf(i)`, `dimmed(i)` |
| `tree-view` | BSTs, AVL, tries, recursion trees, n-ary trees, forests | `roots: TreeNode[]` (`{id, label, children, state?, marker?, note?, edgeLabel?}`), `binary` (children `[left, right]`, `null` for none), `onselect(id)`, `selected`; keyboard focus stays on the same node id when the shape changes, so keep ids stable across frames |
| `heap-view` | binary heaps, heapsort | `values`, `size` (slots past it are the sorted tail), `stateOf(i)`, `markerOf(i)`, `onselect(i)`; draws the tree and the array |
| `union-find-forest` | disjoint sets | `parent`, `stateOf(i)`, `noteOf(i)` (rank or size), `showParentRow`, `onselect(i)` |
| `graph-canvas` | any graph at fixed positions; editable input graphs | `nodes: {id, x, y, label?}[]`, `edges: {from, to, weight?}[]` (both `bind:`), `directed`, `weighted`, `editable` (tools: select and drag, connect or disconnect, delete, add node; Shift+arrow nudges), `nodeState(id)`, `edgeState(edge)`, `markerOf`, `noteOf` (placed below the node, or on a side clear of its edges), `onselect(id)`, `onchange(graph)`, `maxNodes`, `width`, `height` |
| `dp-table` | DP tables, matrices, distance tables | `values: (number \| string \| null)[][]` (`null` = not filled), `rowHeaders`, `colHeaders`, `stateOf(r, c)`, `markerOf(r, c)`, `arrows: {from: [r, c], to: [r, c]}[]` (dependencies), `onselect(r, c)`, `selected` |
| `bar-chart` | value bars for sorting, with an optional buffer row | `items: {id, value}[]`, `stateOf`, `markerOf`, `aux` |
| `chip-list` | queue, stack or log contents as chips in the side panel | `title`, `items: {label, hot?}[]`, `emptyText`, `limit` |
| `grid-board` | editable grids (walls, terrain) | see the grid lessons |
| `segmented-control` | a radio toggle (algorithm, variant, tool) | `legend`, `name`, `options`, `bind:value` |
| `practice-block` | answer-checked questions | `exercises`, `id` (the lesson slug), `title?` |

`graph-editor.js` (pure edit operations, plus `letter(id)` for vertex names A, B, … and
`graphShape(nodes, edges, weights?)`, the string a page compares to decide whether an edit
changed what its trace depends on) and `tree-layout.js` (`layoutForest`, `heapForest`,
`parentForest`) are importable by engines and tests too, as are `slot-tree.js` (binary trees
in the array layout: `leftOf`, `rightOf`, `parentOf`, `depthOf`, `filled`, `childrenOf`,
`lastFilled`, and `parseSlots`/`formatSlots` for a tree typed in array order) and
`item-heap.js` (`makeHeap(before)`, a binary heap over any items that counts comparisons).
Edge-list shortest-path engines share `src/lib/algo-engine/weighted-edges.js`: `indexEdges(ids,
edges)` numbers the vertices and lists the edges by index, and `cycleFrom(parent, start, n)`
reads a negative cycle out of the parent links. Use these instead of writing your own copy
in an engine or page.

## 8. Practice block and lesson kinds

`practice-block.svelte` renders a list of questions from plain data, checks answers with
`answer-check.js`, reveals hints one at a time, offers the solution after the first try, and
keeps a per-viewer "Solved" tick in localStorage (it works without storage).

```js
/** @type {import('$lib/components/answer-check.js').Exercise[]} */
practice: [
  { type: 'number', prompt, answer: 7, unit: 'comparisons', tolerance: 0, hints: [...], solution },
  { type: 'choice', prompt, options: [...], answer: 1, hints, solution },
  { type: 'multi', prompt, options: [...], answers: [0, 2], hints, solution },
  { type: 'text', prompt, accept: ['O(n log n)', 'n log n'], hints, solution },
  { type: 'order', prompt, items: [...], answer: [2, 0, 1], hints, solution },
],
```

- `number` reads English numbers (`1,024`, `3.5`, `−2`); a comma never marks decimals. A unit
  is optional when the learner leaves it out.
- `text` ignores case, accents, extra spaces, spaces around brackets and operators, `²` vs
  `^2` and trailing punctuation, so `O( N² )` matches `O(n^2)`. List every other accepted
  spelling in `accept`.
- `order` shows `items` in the authored order and expects `answer` (item indices in the right
  order); the authored order must not already be the answer.
- Every question has a `prompt`, at least one hint and a `solution` that explains why.

Per kind:

- **theory**: a stepping player on user-controlled input is required. A short "Check yourself"
  practice block (3 or more questions) under the visualizer is optional.
- **practice**: the planned interaction (problem runner, sandbox, race) on user input, plus a
  practice block of at least 5 questions that need the widget to answer.
- **review**: no engine. The page is `<LessonLayout lesson={m}><PracticeBlock
  exercises={m.practice} id={m.slug} /></LessonLayout>`, with at least 10 questions spread over
  every topic of the level and at least three exercise types. The complexity table summarises
  the level's key costs (`complexityHead: ['Structure or algorithm', 'Cost', 'Why']`).

Put the questions in `copy.en.js` as `practice` and pass `exercises={m.practice}` to the
block. `src/lib/lessons/lesson-content.test.js` checks every written lesson on its own: the
curriculum title, the layout copy, `step-controls` on theory pages, and, for practice and review
lessons (or any lesson with `practice`), the minimums above and `exerciseProblems` over every
question, so a malformed or short quiz fails `npm test` whatever the page test does.

The shared tests (`registry.test.js`, `curriculum.test.js`, `lesson-pages.test.js`, the stub
route test) derive their expectations from the curriculum and the written routes, so adding a
lesson never needs an edit there. If one fails, your lesson broke an invariant: fix the lesson.

## 9. Page test (`page.test.js`)

Start with the harness copied from `src/routes/trees/bst/page.test.js` (`// @vitest-environment
jsdom`, `mount`/`unmount`, `flushSync`, `button`, `buttonByText`, `click`, `commit`, `text`);
keep only the helpers the file uses (ESLint fails on unused ones). Test what a learner does:

- the initial frame and narration render; stepping forward and to the last step shows the
  expected final state and counters;
- every control changes the trace (toggle algorithm, edit input, preset, undo, reset);
- invalid input shows the notice and keeps the last valid value;
- keyboard paths work (Enter on a focused element, arrow keys in a roving visualizer);
- for a practice block: one right and one wrong answer, a hint, and `exerciseProblems` over
  `m.practice`.

## 10. Quality bar

- The algorithm is correct, matches the pseudocode line by line and is checked against an
  oracle in tests. Name the variant (Lomuto or Hoare, 0- or 1-based, half-open bounds).
- A real step-through on user-controlled input: the learner edits the data (type values, pick
  a preset, draw a graph, add operations) and steps forward and back through the actual run.
- Cost counters that make the complexity visible (comparisons, swaps, pushes, relaxations,
  table cells filled) and a comparison where it teaches something (two algorithms on the same
  input, best versus worst input).
- A complexity table with time and memory, each row saying why.
- Narration for every frame kind; the legend explains every colour and marker.
- No console errors or Svelte warnings; works at 390 px and 1280 px wide.

## 11. Batch checks

Run from the repo root. All must pass before you commit:

```sh
npx vitest run src/lib/algo-engine/<slug>.test.js src/routes/<topic>/   # while iterating
npm run lint
npm run format:check            # npm run format fixes it
npm run check                   # zero errors and zero warnings
npm test
npm run build
npm run stubs -- <topic>        # must report 0 stubs
git diff --name-only main...HEAD   # only your owned paths (section 2)
```

When you were given only some lessons of a topic that has later parts, the stubs gate is
checked for your lessons, not the whole topic: none of your slugs may appear in the list
`npm run stubs -- <topic>` prints, and the later parts' stubs remain.

Serve the build with `npm run preview`. `vite preview` caches the file list of `build/` when
it starts, so stop and restart it after every rebuild before any browser check; otherwise it
serves stale pages or 404s for new ones. Then spot-check one lesson with agent-browser at 390 px and 1280 px: the widget responds to
pointer and keyboard, stepping works, one quiz answer right and one wrong with a hint (when
the page has a practice block), and no console errors.

## 12. Commit

- One commit per lesson, conventional message naming the lesson:
  `feat: add the <lesson title> lesson`; fixes after review are `fix: ...`.
- Never put plan names, phase or step numbers, batch or audit labels in code comments, test
  names or commit messages. Explain behaviour directly.
- No AI attribution, no `Co-Authored-By` trailer.
- Start every commit from a clean index: run `git status` first and stage only that
  commit's paths (`git add <paths>`), so a deletion or rename left staged is not swept into
  an earlier commit. Each commit must build on its own: lint, check, tests and build pass at
  that commit, not only at the last one.
- Do not push. Do not touch files outside your owned paths, even to fix formatting.

End your reply with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Summary: two sentences
Concerns: optional (shared-file changes you needed, traces over 400 frames, skipped ideas)
```
