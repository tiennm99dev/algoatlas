<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    INTERVAL_PRESETS,
    MAX_DIM,
    MAX_MATRICES,
    MAX_PRICE,
    MAX_ROD,
    intervalPseudocode,
    intervalTrace,
    orderCount,
    parseInput,
    worstOrderCost,
  } from '$lib/algo-engine/interval-dp.js';
  import { en as m } from '$lib/lessons/interval-dp/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/interval-dp.js').IntervalProblem} IntervalProblem */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'current'|'frontier'|'read'|'kept'|'path'|'answer'|''} Role */

  const PROBLEMS = /** @type {IntervalProblem[]} */ (['matrix', 'rod']);
  const FIRST = INTERVAL_PRESETS.matrix[0];
  const errors = m.errors(MAX_MATRICES, MAX_DIM, MAX_ROD, MAX_PRICE);

  let problem = $state(/** @type {IntervalProblem} */ ('matrix'));
  let input = $state(FIRST.input);
  let preset = $state(FIRST.key);
  let inputText = $state(FIRST.input.join(', '));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(intervalTrace('matrix', FIRST.input));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const matrix = $derived(frame.problem === 'matrix');

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(intervalTrace(problem, input));
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = INTERVAL_PRESETS[problem].find((x) => x.key === key) ?? INTERVAL_PRESETS[problem][0];
    preset = p.key;
    input = p.input;
    inputText = p.input.join(', ');
    rebuild();
  }

  function pickProblem() {
    loadPreset(INTERVAL_PRESETS[problem][0].key);
  }

  function commitInput() {
    const parsed = parseInput(problem, inputText);
    if ('error' in parsed) {
      inputText = input.join(', ');
      const message = parsed.error === 'format' ? errors.format : errors[parsed.error][problem];
      notice = { text: message, at: player.index };
      return;
    }
    inputText = parsed.input.join(', ');
    if (inputText === input.join(', ')) return;
    input = parsed.input;
    preset = '';
    rebuild();
  }

  /** Go to the frame that finishes interval (i, j), or to the base case for length 1. */
  /** @param {number} r @param {number} c */
  function seekCell(r, c) {
    if (r > c) return;
    const at = player.frames.findIndex((f) =>
      r === c ? f.kind === 'base' : f.kind === 'settle' && f.i === r + 1 && f.j === c + 1,
    );
    if (at < 0) return;
    player.pause();
    player.seek(at);
  }

  const reading = $derived(frame.kind === 'try' || frame.kind === 'settle');
  const pathSet = $derived(new Set(frame.path.map(([i, j]) => `${i}-${j}`)));

  /** @param {number} r @param {number} c @returns {Role} */
  function roleOf(r, c) {
    const [i, j] = [r + 1, c + 1];
    if (i > j) return '';
    if (frame.kind === 'done' && i === 1 && j === frame.n) return 'answer';
    if (pathSet.has(`${i}-${j}`)) return 'path';
    if (i === frame.i && j === frame.j && frame.kind !== 'trace') return 'current';
    if (reading && frame.k) {
      const isPart = (i === frame.i && j === frame.k) || (i === frame.k + 1 && j === frame.j);
      if (isPart) return frame.kind === 'settle' ? 'kept' : 'read';
    }
    if (frame.len >= 2 && j - i + 1 === frame.len && frame.table[r][c] === null) return 'frontier';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    frontier: 'frontier',
    read: 'compare',
    kept: 'compare',
    path: 'path',
    answer: 'sorted',
    '': '',
  };

  /** @type {{from: [number, number], to: [number, number]}[]} */
  const arrows = $derived.by(() => {
    if (!frame.k) return [];
    const whole = /** @type {[number, number]} */ ([frame.i - 1, frame.j - 1]);
    const left = /** @type {[number, number]} */ ([frame.i - 1, frame.k - 1]);
    const right = /** @type {[number, number]} */ ([frame.k, frame.j - 1]);
    if (frame.kind === 'trace') {
      return [
        { from: whole, to: left },
        { from: whole, to: right },
      ];
    }
    return reading
      ? [
          { from: left, to: whole },
          { from: right, to: whole },
        ]
      : [];
  });

  const headers = $derived(
    Array.from({ length: frame.n }, (_, k) => m.stripCell(frame.problem, k + 1)),
  );

  const shown = $derived(frame.table.map((row, r) => row.map((v, c) => (r > c ? m.outside : v))));
  const shownSplits = $derived(
    frame.splits.map((row, r) =>
      row.map((v, c) => (r > c ? m.outside : v === null ? null : v === 0 ? m.noSplit : v)),
    ),
  );

  /** @param {(number|string|null)[][]} values @param {number} r @param {number} c */
  function labelFrom(values, r, c) {
    const role = roleOf(r, c);
    const v = values[r][c];
    return m.cellLabel(
      frame.problem,
      r + 1,
      c + 1,
      v === null ? '' : String(v),
      role ? m.cellStates[role] : '',
    );
  }

  /** @param {number} r @param {number} c */
  const splitState = (r, c) => {
    if (frame.kind === 'done' && r + 1 === 1 && c + 1 === frame.n) return 'sorted';
    return pathSet.has(`${r + 1}-${c + 1}`) ? 'path' : '';
  };

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.current} ${m.legend.current}`],
    ['frontier', `${m.markers.frontier} ${m.legend.frontier}`],
    ['compare', `${m.markers.read} ${m.legend.read}, ${m.markers.kept} ${m.legend.kept}`],
    ['path', `${m.markers.path} ${m.legend.path}`],
    ['sorted', `${m.markers.answer} ${m.legend.answer}`],
  ]);

  const stripValues = $derived(
    Array.from({ length: frame.n }, (_, k) => m.stripCell(frame.problem, k + 1)),
  );
  const windows = $derived.by(() => {
    if (!frame.i) return [];
    if (frame.k) {
      return [
        { from: frame.i - 1, to: frame.k, label: m.windows.left },
        { from: frame.k, to: frame.j, label: m.windows.right },
      ];
    }
    return [{ from: frame.i - 1, to: frame.j, label: m.windows.whole }];
  });

  /** @param {number} k */
  const inInterval = (k) => frame.i > 0 && k + 1 >= frame.i && k + 1 <= frame.j;

  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const baseline = $derived(
    matrix ? worstOrderCost(frame.input) : frame.input[frame.input.length - 1],
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitInput();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((v) => ({ value: v, label: m.problems[v] }))}
      bind:value={problem}
      onchange={pickProblem}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.inputLabel[problem]}
      <input
        type="text"
        name="input"
        class="field w-72 max-w-full font-mono"
        bind:value={inputText}
        onchange={commitInput}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field max-w-full"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each INTERVAL_PRESETS[problem] as p (p.key)}
          <option value={p.key}>{m.presets[problem][p.key]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.stripLabel(frame.problem)}
        </h2>
        <ArrayStrip
          values={stripValues}
          ariaLabel={m.stripAria(frame.problem, frame.i, frame.j, frame.k)}
          dimmed={(k) => frame.i > 0 && !inInterval(k)}
          stateOf={(k) => (inInterval(k) ? (frame.kind === 'trace' ? 'path' : 'active') : '')}
          markerOf={(k) =>
            inInterval(k) ? (frame.kind === 'trace' ? m.markers.path : m.markers.current) : ''}
          {windows}
          showIndices={false}
          speed={player.speed}
        />
        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle[frame.problem]}
        </h2>
        <DpTable
          values={shown}
          ariaLabel={m.tableAria(frame.problem, frame.n)}
          rowHeaders={headers}
          colHeaders={headers}
          stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
          markerOf={(r, c) => {
            const role = roleOf(r, c);
            return role ? m.markers[role] : '';
          }}
          labelOf={(r, c) => labelFrom(shown, r, c)}
          {arrows}
          onselect={seekCell}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.tableNote(frame.problem)}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
        </ul>
        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.splitTitle}
        </h2>
        <DpTable
          values={shownSplits}
          ariaLabel={m.splitAria(frame.n)}
          rowHeaders={headers}
          colHeaders={headers}
          stateOf={splitState}
          markerOf={(r, c) => {
            const s = splitState(r, c);
            return s === 'path' ? m.markers.path : s === 'sorted' ? m.markers.answer : '';
          }}
          labelOf={(r, c) => labelFrom(shownSplits, r, c)}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.splitNote(frame.problem)}</p>
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
          <dt class="text-xs text-slate-500">{m.stats.tried}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tried">
            {frame.tried} / {finalFrame.tried}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.filled}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="filled">
            {frame.filled} / {finalFrame.filled}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer[frame.problem]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="answer">
            {frame.result ?? m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.baseline[frame.problem]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="baseline">{baseline}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.orders[frame.problem]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="orders">
            {orderCount(frame.problem, frame.n)}
          </dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.orderTitle[frame.problem]}</h2>
        <p class="font-mono text-sm break-words text-slate-800" data-testid="order">
          {frame.kind === 'trace' || frame.kind === 'done' ? frame.order : m.orderEmpty}
        </p>
      </div>
      <ChipList
        title={m.shapesTitle[frame.problem]}
        emptyText=""
        items={Array.from({ length: frame.n }, (_, k) => ({
          label: m.shapeChip(frame.problem, frame.input, k),
          hot: matrix ? inInterval(k) : frame.len === k + 1,
        }))}
      />
      <CodePanel lines={intervalPseudocode[frame.problem]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
