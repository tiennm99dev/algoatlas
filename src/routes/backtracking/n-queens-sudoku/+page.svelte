<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_QUEENS,
    MAX_QUEENS_ALL,
    SUDOKU_PRESETS,
    boxSide,
    cycleCell,
    parseSize,
    queensPseudocode,
    queensTrace,
    sudokuPseudocode,
    sudokuTrace,
  } from '$lib/algo-engine/n-queens-sudoku.js';
  import { en as m } from '$lib/lessons/n-queens-sudoku/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';
  import PuzzleBoard from '$lib/components/puzzle-board.svelte';

  /** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').QueensGoal} QueensGoal */
  /** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').QueensFrame} QueensFrame */
  /** @typedef {import('$lib/algo-engine/n-queens-sudoku.js').SudokuFrame} SudokuFrame */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'queens'|'sudoku'} Puzzle */

  const PUZZLES = /** @type {Puzzle[]} */ (['queens', 'sudoku']);
  const GOALS = /** @type {QueensGoal[]} */ (['first', 'all']);
  const FIRST_GRID = SUDOKU_PRESETS[0];
  const START_N = 4;

  let puzzle = $state(/** @type {Puzzle} */ ('queens'));
  let n = $state(START_N);
  let nText = $state(String(START_N));
  let goal = $state(/** @type {QueensGoal} */ ('first'));
  let fixed = $state(/** @type {number|null} */ (null));
  let grid = $state(FIRST_GRID.grid);
  let base = $state(FIRST_GRID.key);
  let preset = $state(FIRST_GRID.key);
  let notice = $state({ text: '', at: -1 });

  const queensPlayer = createPlayer(queensTrace(START_N));
  const sudokuPlayer = createPlayer(sudokuTrace(FIRST_GRID.grid));
  const player = $derived(puzzle === 'queens' ? queensPlayer : sudokuPlayer);
  const qf = $derived(queensPlayer.frame);
  const sf = $derived(sudokuPlayer.frame);
  const description = $derived(puzzle === 'queens' ? m.describeQueens(qf) : m.describeSudoku(sf));
  const narration = $derived(notice.at === player.index ? notice.text : description);

  /** @param {string} text */
  function refuse(text) {
    notice = { text, at: player.index };
  }

  function rebuildQueens() {
    notice = { text: '', at: -1 };
    queensPlayer.load(queensTrace(n, { goal, fixed }));
  }

  function rebuildSudoku() {
    notice = { text: '', at: -1 };
    sudokuPlayer.load(sudokuTrace($state.snapshot(grid)));
  }

  function changePuzzle() {
    queensPlayer.pause();
    sudokuPlayer.pause();
    notice = { text: '', at: -1 };
  }

  function commitN() {
    const next = parseSize(nText);
    if (next === null) {
      nText = String(n);
      refuse(m.sizeError(MAX_QUEENS));
      return;
    }
    if (goal === 'all' && next > MAX_QUEENS_ALL) {
      nText = String(n);
      refuse(m.allError(MAX_QUEENS_ALL));
      return;
    }
    nText = String(next);
    if (next === n) return;
    n = next;
    fixed = null;
    rebuildQueens();
  }

  function changeGoal() {
    if (goal === 'all' && n > MAX_QUEENS_ALL) {
      goal = 'first';
      refuse(m.allError(MAX_QUEENS_ALL));
      return;
    }
    rebuildQueens();
  }

  /** @param {number} r @param {number} c */
  function pickSquare(r, c) {
    if (r !== 0) {
      refuse(m.topRowOnly);
      return;
    }
    fixed = fixed === c ? null : c;
    rebuildQueens();
  }

  /** @param {number} r @param {number} c */
  function editCell(r, c) {
    grid = cycleCell(grid, r, c);
    preset = '';
    rebuildSudoku();
  }

  /** @param {string} key */
  function loadGrid(key) {
    const p = SUDOKU_PRESETS.find((x) => x.key === key) ?? FIRST_GRID;
    preset = p.key;
    base = p.key;
    grid = p.grid;
    rebuildSudoku();
  }

  const queensSolved = $derived(
    qf.kind === 'solved' ||
      (qf.kind === 'done' && qf.goal === 'first' && qf.queens.length === qf.n),
  );

  /** @param {QueensFrame} f */
  function attacked(f) {
    /** @type {string[]} */
    const squares = [];
    f.queens.forEach((col, row) => {
      for (let r = row + 1; r < f.n; r++) {
        const d = r - row;
        for (const c of [col, col - d, col + d]) if (c >= 0 && c < f.n) squares.push(`${r}-${c}`);
      }
    });
    return new Set(squares);
  }
  const hit = $derived(attacked(qf));

  /**
   * @param {number} r @param {number} c
   * @returns {{text: string, state: VisualState, mark?: string, strong?: boolean, label: string}}
   */
  function queenCell(r, c) {
    const f = qf;
    const held = r === 0 && f.fixed === c ? m.heldMark : '';
    const say = (/** @type {string} */ what) => m.squareLabel(r, c, what);
    if (f.queens[r] === c) {
      const latest = f.kind === 'place' && f.row === r;
      return {
        text: m.queenText,
        state: queensSolved ? 'sorted' : latest ? 'active' : 'path',
        mark: held,
        strong: true,
        label: say(latest ? m.squareStates.placed : m.squareStates.queen),
      };
    }
    if (f.kind === 'remove' && f.row === r && f.col === c) {
      return {
        text: m.removedText,
        state: 'visited',
        mark: held,
        strong: true,
        label: say(m.squareStates.removed),
      };
    }
    if ((f.kind === 'place' || f.kind === 'dead') && f.row === r && f.rejected.includes(c)) {
      return {
        text: m.rejectedText,
        state: 'compare',
        mark: held,
        label: say(m.squareStates.rejected),
      };
    }
    if (hit.has(`${r}-${c}`)) {
      return { text: m.attackedText, state: '', mark: held, label: say(m.squareStates.attacked) };
    }
    return { text: '', state: '', mark: held, label: say(m.squareStates.free) };
  }

  /**
   * @param {number} r @param {number} c
   * @returns {{text: string, state: VisualState, mark?: string, strong?: boolean, label: string}}
   */
  function sudokuCell(r, c) {
    const f = sf;
    const v = f.grid[r][c];
    const given = f.clue[r][c];
    const here = f.r === r && f.c === c;
    /** @type {VisualState} */
    let state = '';
    if ((f.kind === 'clash' || f.kind === 'dead') && here) state = 'compare';
    else if (f.kind === 'remove' && here) state = 'visited';
    else if (here) state = 'active';
    else if (!given && v !== 0) state = f.solved ? 'sorted' : 'path';
    return {
      text: v === 0 ? (f.kind === 'remove' && here ? String(f.digit) : '') : String(v),
      state,
      strong: given,
      label: m.cellLabel(r, c, v, given),
    };
  }

  const size = $derived(puzzle === 'queens' ? qf.n : sf.grid.length);
  const sudokuResult = $derived.by(() => {
    if (sf.solved) return m.results.solved;
    if (sf.kind !== 'done') return m.results.searching;
    return sf.cutoff ? m.results.cutoff : m.results.none;
  });

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', m.legend.placed],
    ['path', m.legend.kept],
    ['visited', m.legend.removed],
    ['compare', m.legend.rejected],
    ['sorted', m.legend.solved],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      if (puzzle === 'queens') commitN();
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="puzzle"
      options={PUZZLES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={puzzle}
      onchange={changePuzzle}
    />
    {#if puzzle === 'queens'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.nLabel}
        <input
          type="text"
          inputmode="numeric"
          name="n"
          class="field w-16 font-mono"
          bind:value={nText}
          onchange={commitN}
        />
      </label>
      <SegmentedControl
        legend={m.goalLabel}
        name="goal"
        options={GOALS.map((v) => ({ value: v, label: m.goals[v] }))}
        bind:value={goal}
        onchange={changeGoal}
      />
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select
          name="grid"
          class="field"
          value={preset}
          onchange={(e) => loadGrid(e.currentTarget.value)}
        >
          {#if preset === ''}<option value="" disabled>—</option>{/if}
          {#each SUDOKU_PRESETS as p (p.key)}
            <option value={p.key}>{m.presets[p.key]}</option>
          {/each}
        </select>
      </label>
      <button type="button" class="btn-secondary" onclick={() => loadGrid(base)}>
        {m.resetGrid}
      </button>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {puzzle === 'queens' ? m.queensTitle : m.sudokuTitle}
        </h2>
        {#if puzzle === 'queens'}
          <PuzzleBoard
            {size}
            checkered
            cellOf={queenCell}
            ariaLabel={m.queensAria(size)}
            onselect={pickSquare}
            speed={player.speed}
          />
          <p class="text-xs text-slate-600">{m.queensNote}</p>
        {:else}
          <PuzzleBoard
            {size}
            boxSide={boxSide(size)}
            cellOf={sudokuCell}
            ariaLabel={m.sudokuAria(size)}
            onselect={editCell}
            speed={player.speed}
          />
          <p class="text-xs text-slate-600">{m.sudokuNote}</p>
        {/if}
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
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

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.placed}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="placed">
            {puzzle === 'queens' ? qf.placed : sf.placed}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.removed}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="removed">
            {puzzle === 'queens' ? qf.removed : sf.removed}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.tested[puzzle]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tested">
            {puzzle === 'queens' ? qf.tested : sf.tested}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          {#if puzzle === 'queens'}
            <dt class="text-xs text-slate-500">{m.stats.solutions}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="solutions">
              {qf.solutions.length}
            </dd>
          {:else}
            <dt class="text-xs text-slate-500">{m.stats.result}</dt>
            <dd class="text-lg font-bold" data-testid="result">{sudokuResult}</dd>
          {/if}
        </div>
        {#if puzzle === 'queens'}
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="naive">
              {(qf.n ** qf.n).toLocaleString('en-US')}
            </dd>
          </div>
        {/if}
      </dl>
      {#if puzzle === 'queens'}
        <ChipList
          title={m.solutionsTitle}
          emptyText={m.solutionsEmpty}
          items={qf.solutions.map((s) => ({ label: m.solution(s) }))}
        />
      {:else}
        <ChipList
          title={m.rejectedTitle}
          emptyText={m.rejectedEmpty}
          items={sf.rejected.map((x) => ({ label: m.rejectChip(x) }))}
        />
      {/if}
      <CodePanel
        lines={puzzle === 'queens' ? queensPseudocode : sudokuPseudocode}
        active={puzzle === 'queens' ? qf.lines : sf.lines}
      />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      {#key puzzle}
        <StepControls {player} />
      {/key}
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
