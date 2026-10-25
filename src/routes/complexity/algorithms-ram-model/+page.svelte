<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    RAM_PROGRAMS,
    expectedOps,
    ramPseudocode,
    ramTrace,
    triangular,
  } from '$lib/algo-engine/algorithms-ram-model.js';
  import { en as m } from '$lib/lessons/algorithms-ram-model/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/algorithms-ram-model.js').RamProgram} RamProgram */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_N = 4;
  let program = $state(/** @type {RamProgram} */ ('loop'));
  let n = $state(INITIAL_N);
  /** @type {number | null} */
  let draft = $state(INITIAL_N);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(ramTrace('loop', INITIAL_N));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {unknown} v */
  const validN = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_N;

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(ramTrace(program, n));
  }

  function commitN() {
    if (validN(draft)) {
      n = /** @type {number} */ (draft);
      rebuild();
    } else {
      draft = n;
      notice = { text: m.nError, at: player.index };
    }
  }

  const programOptions = RAM_PROGRAMS.map((p) => ({ value: p, label: m.programs[p] }));

  const cells = $derived(
    (program === 'formula' ? ['n', 's'] : ['n', 's', 'i']).map((name) => {
      const raw = frame.vars[/** @type {'n'|'s'|'i'} */ (name)];
      const value = raw === null ? m.unset : String(raw);
      const state = /** @type {'write' | 'read' | ''} */ (
        frame.writes.includes(name) ? 'write' : frame.reads.includes(name) ? 'read' : ''
      );
      return { name, value, state };
    }),
  );

  const statKeys = /** @type {const} */ (['assign', 'compare', 'arith', 'ret']);
  const samples = $derived([10, 20, 30].map((k) => m.atN(k, expectedOps(program, k))));
  const expected = $derived(triangular(n));
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitN();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.nLabel}
      <input
        type="number"
        name="n"
        min="0"
        max={MAX_N}
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitN}
      />
    </label>
    <SegmentedControl
      legend={m.programLegend}
      name="program"
      options={programOptions}
      bind:value={program}
      onchange={rebuild}
    />
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.memoryTitle}
        </h2>
        <ul class="flex flex-wrap gap-3">
          {#each cells as c (c.name)}
            <li
              class="relative flex w-24 flex-col items-center rounded-lg border-2 px-3 py-2 {c.state ===
              ''
                ? 'border-slate-300 bg-white text-slate-900'
                : c.state === 'write'
                  ? `border-slate-900 ${STATE_BG.swap} text-white`
                  : `border-slate-900 ${STATE_BG.compare} text-slate-900`} {player.speed < 8
                ? 'transition-colors'
                : ''}"
            >
              <span class="sr-only"
                >{m.cellLabel(c.name, c.value, c.state ? m.states[c.state] : '')}</span
              >
              <span class="font-mono text-sm" aria-hidden="true">{c.name}</span>
              <span class="text-2xl font-bold tabular-nums" aria-hidden="true">{c.value}</span>
              {#if c.state}
                <span
                  class="absolute -top-2 -right-2 rounded-full border border-slate-900 bg-white px-1.5 text-xs font-bold text-slate-900"
                  aria-hidden="true">{m.markers[c.state]}</span
                >
              {/if}
            </li>
          {/each}
        </ul>
        <p class="mt-4 text-sm font-semibold text-slate-700 tabular-nums">
          {m.thisStep(frame.delta)}
        </p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.compare}"></span>
            {m.markers.read}
            {m.legend.read}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.swap}"></span>
            {m.markers.write}
            {m.legend.write}
          </li>
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
        {#each statKeys as k (k)}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats[k]}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.ops[k]}</dd>
          </div>
        {/each}
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.total}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.total}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <h2 class="mb-1 text-xs text-slate-500">{m.resultTitle}</h2>
        <p>{m.expectedLine(expected)}</p>
        <p class="font-semibold">
          {frame.result === null
            ? m.pending
            : m.resultLine(frame.result, frame.result === expected)}
        </p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <h2 class="mb-1 text-xs text-slate-500">{m.formulaTitle}</h2>
        <p class="font-mono font-semibold">{m.formulas[program]}</p>
        <ul class="mt-1 tabular-nums">
          {#each samples as s (s)}
            <li>{s}</li>
          {/each}
        </ul>
      </div>
      <CodePanel lines={ramPseudocode[program]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
