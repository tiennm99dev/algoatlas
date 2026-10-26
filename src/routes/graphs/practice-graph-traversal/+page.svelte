<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GridBoard from '$lib/components/grid-board.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    COLS,
    MAX_SOURCES,
    ROWS,
    bfsPseudocode,
    compareSearches,
    dfsPseudocode,
    traversalTrace,
  } from '$lib/algo-engine/practice-graph-traversal.js';
  import { en as m } from '$lib/lessons/practice-graph-traversal/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {keyof typeof m.puzzles} PuzzleKey */
  /** @typedef {{walls: number[], sources: number[], goal: number}} Puzzle */

  /** @param {string[]} map @returns {Puzzle} */
  function parse(map) {
    /** @type {Puzzle} */
    const p = { walls: [], sources: [], goal: -1 };
    map.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        const i = r * COLS + c;
        if (ch === '#') p.walls.push(i);
        if (ch === 'S') p.sources.push(i);
        if (ch === 'G') p.goal = i;
      }),
    );
    return p;
  }

  // Fixed puzzles, so the prerendered HTML matches the hydrated page.
  /** @type {Record<PuzzleKey, Puzzle>} */
  const PUZZLES = {
    maze: parse([
      'S...#.......',
      '.##.#.####..',
      '.#..#....#..',
      '.#.###.#.#..',
      '.#.....#.#..',
      '.####.##.###',
      '......#.....',
      '.####.#.##.G',
    ]),
    field: parse([
      'S...........',
      '............',
      '............',
      '............',
      '............',
      '............',
      '............',
      'G...........',
    ]),
    fire: parse([
      'S......#....',
      '......#.....',
      '..###.#...S.',
      '......#.....',
      '.....##.....',
      '............',
      '...S...###..',
      '............',
    ]),
  };
  const PUZZLE_KEYS = /** @type {PuzzleKey[]} */ (Object.keys(PUZZLES));
  const TOOLS = /** @type {(keyof typeof m.tools)[]} */ (Object.keys(m.tools));

  // Fresh sets are assigned on every edit and never mutated afterwards.
  let walls = $state.raw(new Set(PUZZLES.maze.walls));
  let sources = $state.raw(PUZZLES.maze.sources);
  let goal = $state(PUZZLES.maze.goal);
  let algo = $state(/** @type {'bfs' | 'dfs'} */ ('bfs'));
  let tool = $state('wall');
  let notice = $state({ text: '', at: -1 });

  const grid = () => ({ rows: ROWS, cols: COLS, walls, sources, goal });
  const player = createPlayer(traversalTrace({ ...grid(), algo: 'bfs' }));
  const frame = $derived(player.frame);
  // Depends on the grid only, never on the current frame, so stepping does not recompute it.
  const compare = $derived(compareSearches({ rows: ROWS, cols: COLS, walls, sources, goal }));
  const frontierSet = $derived(new Set(frame.frontier));
  const pathSet = $derived(new Set(frame.path));
  const largest = $derived(Math.max(-1, ...frame.label));
  const narration = $derived(
    notice.at === player.index
      ? notice.text
      : m.describe(frame, COLS, algo, sources.length, goal >= 0),
  );

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(traversalTrace({ ...grid(), algo }));
  }

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {PuzzleKey} key */
  function loadPuzzle(key) {
    walls = new Set(PUZZLES[key].walls);
    sources = PUZZLES[key].sources;
    goal = PUZZLES[key].goal;
    rebuild();
  }

  /** @param {number} cell */
  const occupied = (cell) => sources.includes(cell) || cell === goal;

  /** @param {number} cell @param {boolean} on */
  function setWall(cell, on) {
    if (occupied(cell) || walls.has(cell) === on) return;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const next = new Set(walls);
    if (on) next.add(cell);
    else next.delete(cell);
    walls = next;
    rebuild();
  }

  /** A deliberate single edit with the current tool, confirmed in the narration. @param {number} cell */
  function edit(cell) {
    const at = m.coord(cell, COLS);
    if (tool === 'wall') {
      if (occupied(cell)) return say(m.edits.blocked);
      const on = !walls.has(cell);
      setWall(cell, on);
      return say(on ? m.edits.wallAdded(at) : m.edits.wallRemoved(at));
    }
    if (tool === 'source') {
      if (sources.includes(cell)) {
        if (sources.length === 1) return say(m.edits.lastSource);
        sources = sources.filter((s) => s !== cell);
        rebuild();
        return say(m.edits.sourceRemoved(at));
      }
      if (walls.has(cell) || cell === goal) return say(m.edits.blocked);
      if (sources.length >= MAX_SOURCES) return say(m.edits.tooManySources);
      sources = [...sources, cell];
      rebuild();
      return say(m.edits.sourceAdded(at));
    }
    if (cell === goal) {
      goal = -1;
      rebuild();
      return say(m.edits.goalRemoved);
    }
    if (walls.has(cell) || sources.includes(cell)) return say(m.edits.blocked);
    goal = cell;
    rebuild();
    say(m.edits.goalMoved(at));
  }

  /** @param {number} cell */
  function cellLook(cell) {
    const d = frame.label[cell];
    const mark = d >= 0 ? String(d) : '';
    if (sources.includes(cell))
      return { cls: 'bg-emerald-700 text-white', label: m.states.source, mark: 'S' };
    if (cell === goal) return { cls: 'bg-rose-600 text-white', label: m.states.goal, mark: 'G' };
    if (walls.has(cell)) return { cls: 'bg-slate-800', label: m.states.wall, mark: '' };
    // The path fill is close in luminance to the visited fill, so it also gets an inset ring.
    if (pathSet.has(cell))
      return {
        cls: 'bg-state-path text-slate-900 ring-2 ring-amber-700 ring-inset',
        label: m.states.path,
        mark,
      };
    if (cell === frame.current && frame.kind === 'skip')
      return {
        cls: 'bg-state-visited text-indigo-900 ring-2 ring-inset ring-slate-700',
        label: m.states.stale,
        mark,
      };
    if (cell === frame.current)
      return { cls: 'bg-state-active text-white', label: m.states.current, mark };
    if (frontierSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-900' : '';
      return { cls: 'bg-state-frontier text-slate-900' + ring, label: m.states.frontier, mark };
    }
    if (d >= 0) return { cls: 'bg-state-visited text-indigo-900', label: m.states.visited, mark };
    return { cls: 'bg-white', label: '', mark: '' };
  }

  const legend = [
    ['bg-emerald-700', m.legend.source],
    ['bg-rose-600', m.legend.goal],
    ['bg-slate-800', m.legend.wall],
    ['bg-state-frontier', m.legend.frontier],
    ['bg-state-visited', m.legend.visited],
    ['bg-state-active', m.legend.current],
    ['bg-state-visited ring-2 ring-slate-700 ring-inset', m.legend.stale],
    ['bg-state-path ring-1 ring-amber-700 ring-inset', m.legend.path],
  ];

  /** @param {number | null} v */
  const show = (v) => (v === null ? '—' : String(v));
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.puzzleLabel}
      </legend>
      <div class="flex flex-wrap gap-2">
        {#each PUZZLE_KEYS as key (key)}
          <button type="button" class="btn-outline" onclick={() => loadPuzzle(key)}
            >{m.puzzles[key]}</button
          >
        {/each}
      </div>
    </fieldset>
    <SegmentedControl
      legend={m.algoLabel}
      name="algo"
      options={[
        { value: 'bfs', label: m.algos.bfs },
        { value: 'dfs', label: m.algos.dfs },
      ]}
      bind:value={algo}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.toolLabel}
      name="tool"
      options={TOOLS.map((t) => ({ value: t, label: m.tools[t] }))}
      bind:value={tool}
      onchange={() => (notice = { text: '', at: -1 })}
    />
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GridBoard
          rows={ROWS}
          cols={COLS}
          cellState={(cell) => {
            const s = cellLook(cell);
            const d = walls.has(cell) ? -1 : frame.label[cell];
            return { ...s, label: m.cellLabel(cell, COLS, s.label, m.labelNote(d)) };
          }}
          gridLabel={m.gridLabel}
          initialFocus={0}
          speed={player.speed}
          onPaintStart={(cell) => {
            if (tool !== 'wall') {
              edit(cell);
              return null;
            }
            const on = !walls.has(cell);
            setWall(cell, on);
            return on;
          }}
          onPaint={setWall}
          onEdit={edit}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
            </li>
          {/each}
        </ul>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.visits}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.visits}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.adds}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.adds}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          {#if goal >= 0}
            <dt class="text-xs text-slate-500">{m.stats.result}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {frame.path.length ? frame.path.length - 1 : '—'}
            </dd>
          {:else}
            <dt class="text-xs text-slate-500">{m.stats.reach}</dt>
            <dd class="text-2xl font-bold tabular-nums">{largest >= 0 ? largest : '—'}</dd>
          {/if}
        </div>
      </dl>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              {#each m.compareHead as h, i (i)}
                <th scope="col" class="py-1 font-semibold {i ? 'text-right' : ''}">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-slate-100">
              <th scope="row" class="py-1 text-left font-normal">{m.compareRows.visits}</th>
              <td class="text-right font-semibold">{compare.bfs.visits}</td>
              <td class="text-right font-semibold">{compare.dfs.visits}</td>
            </tr>
            {#if goal >= 0}
              <tr class="border-t border-slate-100">
                <th scope="row" class="py-1 text-left font-normal">{m.compareRows.steps}</th>
                <td class="text-right font-semibold">{show(compare.bfs.steps)}</td>
                <td class="text-right font-semibold">{show(compare.dfs.steps)}</td>
              </tr>
            {:else}
              <tr class="border-t border-slate-100">
                <th scope="row" class="py-1 text-left font-normal">{m.floodRows.farthest}</th>
                <td class="text-right font-semibold">{compare.farthest}</td>
                <td class="text-right text-slate-400">—</td>
              </tr>
              <tr class="border-t border-slate-100">
                <th scope="row" class="py-1 text-left font-normal">{m.floodRows.wrong}</th>
                <td class="text-right text-slate-400">—</td>
                <td class="text-right font-semibold">{compare.wrong}</td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>

      <ChipList
        title={m.frontierLabel[algo]}
        emptyText={m.frontierEmpty}
        hotLabel={m.hotLabel}
        items={(algo === 'bfs' ? frame.frontier : frame.frontier.toReversed()).map((c) => ({
          label: m.coord(c, COLS),
          hot: frame.kind === 'add' && c === frame.touched,
        }))}
      />
      <CodePanel lines={algo === 'bfs' ? bfsPseudocode : dfsPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
