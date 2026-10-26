<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    INDUCTION_PROGRAMS,
    buggyPseudocode,
    inductionPseudocode,
    inductionTrace,
    parseValues,
  } from '$lib/algo-engine/recursion-induction.js';
  import { en as m } from '$lib/lessons/recursion-induction/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/recursion-induction.js').InductionProgram} InductionProgram */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof PRESETS} Preset */

  const PRESETS = {
    mixed: [5, -2, 9, 1, -7, 4],
    negative: [-4, -9, -1, -6],
    sorted: [1, 3, 5, 7, 9],
    reversed: [9, 7, 4, 2, 0],
    zeroFirst: [0, 6, -3, 8],
  };
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRESETS));

  /** @param {number[]} values */
  const show = (values) => values.map((v) => String(v).replace('-', '−')).join(', ');

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  let program = $state(/** @type {InductionProgram} */ ('sum'));
  let preset = $state(/** @type {Preset | ''} */ ('mixed'));
  let values = $state.raw(PRESETS.mixed);
  let valuesText = $state(show(PRESETS.mixed));
  let buggy = $state(false);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(inductionTrace('sum', PRESETS.mixed));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(inductionTrace(program, values, buggy));
  }

  function loadPreset() {
    if (preset === '') return;
    values = PRESETS[preset];
    valuesText = show(values);
    rebuild();
  }

  function commitValues() {
    const parsed = parseValues(valuesText);
    if ('error' in parsed) {
      valuesText = show(values);
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = show(values);
    preset = '';
    rebuild();
  }

  function toggleBug() {
    rebuild();
    say(m.bugNotice(buggy, m.programs[program]));
  }

  const recursive = $derived(frame.program === 'recursive');
  const pseudocode = $derived((buggy ? buggyPseudocode : inductionPseudocode)[frame.program]);

  /** Index processed on this frame: a[i] in a loop pass, a[k − 1] in an inductive step. */
  const current = $derived(
    frame.kind === 'body' ? frame.i : frame.kind === 'step' ? frame.i - 1 : -1,
  );

  /** @param {number} i @returns {'disorder'|'current'|'covered'|''} */
  function cellKind(i) {
    if (frame.disorder >= 0 && (i === frame.disorder || i === frame.disorder + 1)) {
      return 'disorder';
    }
    if (i === current) return 'current';
    if (i < frame.prefix && frame.kind !== 'start') return 'covered';
    return '';
  }

  /** @type {Record<string, VisualState>} */
  const CELL_STATE = { disorder: 'swap', current: 'active', covered: 'visited', '': '' };

  const pointers = $derived(
    frame.kind === 'start' || frame.i < 0
      ? []
      : [{ name: recursive ? m.pointerK : m.pointerI, index: frame.i }],
  );

  const windows = $derived(
    frame.kind === 'start'
      ? []
      : [{ from: 0, to: frame.prefix, label: m.prefixLabel(frame.prefix) }],
  );

  const checkChips = $derived(
    frame.log.map((e, i) => ({ label: m.checkChip(e), hot: i === frame.log.length - 1 })),
  );
  const stackChips = $derived(
    frame.stack.map((k, i) => ({ label: m.callChip(k), hot: i === frame.stack.length - 1 })),
  );

  const answer = $derived(
    frame.kind !== 'done'
      ? m.resultPending
      : frame.program === 'insertion'
        ? show(frame.items)
        : show([frame.acc ?? 0]),
  );

  const legend = /** @type {[VisualState, string][]} */ ([
    ['visited', `${m.markers.covered} ${m.legend.covered}`],
    ['active', `${m.markers.current} ${m.legend.current}`],
    ['swap', `${m.markers.disorder} ${m.legend.disorder}`],
  ]);

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <label class={labelClass}>
      {m.programLabel}
      <select name="program" class="field" bind:value={program} onchange={rebuild}>
        {#each INDUCTION_PROGRAMS as p (p)}
          <option value={p}>{m.programs[p]}</option>
        {/each}
      </select>
    </label>
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" bind:value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label class={labelClass}>
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-56 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <label class="flex items-center gap-2 pb-2 text-sm text-slate-800">
      <input
        type="checkbox"
        name="buggy"
        class="size-4 accent-teal-700"
        bind:checked={buggy}
        onchange={toggleBug}
      />
      {m.buggyLabel}
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          values={frame.items}
          ariaLabel={m.arrayAria(frame.items, frame.prefix)}
          stateOf={(i) => CELL_STATE[cellKind(i)]}
          markerOf={(i) => {
            const k = cellKind(i);
            return k === '' ? '' : m.markers[k];
          }}
          {pointers}
          {windows}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
        </ul>

        <section
          class="mt-4 rounded-lg border-2 p-3 {frame.holds === null
            ? 'border-slate-200'
            : frame.holds
              ? 'border-state-sorted'
              : 'border-state-swap'}"
          data-testid="invariant"
        >
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {recursive ? m.invariantTitle.recursive : m.invariantTitle.loop}
          </h2>
          <p class="mt-1 font-mono text-sm text-slate-900">{m.invariants[frame.program]}</p>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {#if frame.holds === null}
              <span class="text-slate-500" data-testid="verdict">{m.notChecked}</span>
            {:else}
              <span class="font-semibold text-slate-700">{m.phases[frame.phase ?? 'init']}</span>
              <span
                class="rounded px-2 py-0.5 font-semibold text-white {frame.holds
                  ? 'bg-state-sorted'
                  : 'bg-state-swap'}"
                data-testid="verdict">{m.holdsBadge(frame.holds)}</span
              >
              <span class="w-full text-slate-700">{m.compare(frame)}</span>
            {/if}
          </div>
        </section>
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
          <dt class="text-xs text-slate-500">{m.stats.passed}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="passed">{frame.passed}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.failed}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="failed">{frame.failed}</dd>
        </div>
        <div class="col-span-2 min-w-0 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="truncate text-2xl font-bold tabular-nums" data-testid="answer">
            {answer}{#if frame.kind === 'done'}<span
                class="ml-2 text-sm font-semibold text-slate-600"
                >({m.resultNote(frame.correct === true)})</span
              >{/if}
          </dd>
        </div>
      </dl>
      <ChipList title={m.checksTitle} items={checkChips} emptyText={m.checksEmpty} limit={24} />
      {#if recursive}
        <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      {/if}
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
