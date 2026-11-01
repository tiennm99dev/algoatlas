<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_ABS,
    MAX_N,
    SRTBOT_PRESETS,
    parseSrtbotValues,
    srtbotPseudocode,
    srtbotTrace,
  } from '$lib/algo-engine/srtbot-framework.js';
  import { en as m } from '$lib/lessons/srtbot-framework/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotProblem} SrtbotProblem */
  /** @typedef {import('$lib/algo-engine/srtbot-framework.js').SrtbotStep} SrtbotStep */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PROBLEMS = /** @type {SrtbotProblem[]} */ (['bowling', 'maxsub']);
  /** @param {number[]} v */
  const format = (v) => v.map((x) => String(x).replace('-', '−')).join(', ');

  let problem = $state(/** @type {SrtbotProblem} */ ('bowling'));
  let values = $state.raw(SRTBOT_PRESETS.bowling);
  let valuesText = $state(format(SRTBOT_PRESETS.bowling));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(srtbotTrace('bowling', SRTBOT_PRESETS.bowling));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const errors = m.valueErrors(MAX_N, MAX_ABS);

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(srtbotTrace(problem, values));
  }

  function loadExample() {
    values = SRTBOT_PRESETS[problem];
    valuesText = format(values);
    rebuild();
  }

  function commitValues() {
    const parsed = parseSrtbotValues(valuesText);
    if ('error' in parsed) {
      valuesText = format(values);
      notice = { text: errors[parsed.error], at: player.index };
      return;
    }
    values = parsed.values;
    valuesText = format(values);
    rebuild();
  }

  /** First frame of each SRTBOT step. */
  const firstOf = $derived(
    Object.fromEntries(m.stepOrder.map((s) => [s, player.frames.findIndex((f) => f.step === s)])),
  );

  /** @param {SrtbotStep} s @returns {'current'|'done'|'todo'} */
  function statusOf(s) {
    if (frame.step === s) return 'current';
    return firstOf[s] >= 0 && firstOf[s] < player.index ? 'done' : 'todo';
  }

  /** @param {SrtbotStep} s */
  function show(s) {
    player.pause();
    player.seek(firstOf[s]);
  }

  const best = $derived(frame.kind === 'compute' ? frame.options[frame.chosen] : null);
  const readCells = $derived(new Set(best?.uses ?? []));
  const readPins = $derived.by(() => {
    if (!best) return new Set();
    const i = frame.cell;
    if (best.kind === 'pair') return new Set([i, i + 1]);
    if (best.kind === 'skip') return new Set();
    return new Set([i]);
  });
  const answerSet = $derived(new Set(frame.answerCells));

  /** @param {number} r @param {number} c @returns {'write'|'read'|'answer'|''} */
  function roleOf(r, c) {
    if (r === 0) return readPins.has(c) ? 'read' : '';
    if (answerSet.has(c)) return 'answer';
    if (c === frame.cell && (frame.kind === 'compute' || frame.kind === 'base')) return 'write';
    if (readCells.has(c)) return 'read';
    return '';
  }

  /** @type {Record<'write'|'read'|'answer'|'', VisualState>} */
  const ROLE_STATE = { write: 'swap', read: 'compare', answer: 'sorted', '': '' };

  const tableValues = $derived([
    frame.table.map((_, c) => (c < frame.values.length ? frame.values[c] : '')),
    frame.table,
  ]);

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    const role = roleOf(r, c);
    const base = r === 1 && frame.kind === 'base' && c === frame.cell ? m.cellStates.base : '';
    return m.cellLabel(
      frame.problem,
      r,
      c,
      tableValues[r][c],
      [role ? m.cellStates[role] : '', base].filter(Boolean).join(', '),
    );
  }

  const legend = /** @type {[VisualState, string][]} */ ([
    ['swap', `${m.markers.write} ${m.legend.write}`],
    ['compare', `${m.markers.read} ${m.legend.read}`],
    ['sorted', `${m.markers.answer} ${m.legend.answer}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((p) => ({ value: p, label: m.problems[p] }))}
      bind:value={problem}
      onchange={loadExample}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-80 max-w-full"
        aria-describedby="srtbot-values-hint"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <button type="button" class="btn-outline" onclick={loadExample}>{m.exampleButton}</button>
    <p id="srtbot-values-hint" class="w-full text-xs text-slate-600">
      {m.valuesHint(problem)}
      {m.problemText(problem)}
    </p>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={tableValues}
          ariaLabel={m.tableAria}
          rowHeaders={m.rowHeaders(frame.problem)}
          colHeaders={frame.table.map((_, c) => String(c))}
          stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
          markerOf={(r, c) => {
            const role = roleOf(r, c);
            return role ? m.markers[role] : '';
          }}
          labelOf={cellLabel}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
        </ul>
      </div>

      <section class="rounded-xl border border-slate-200 bg-white p-3" data-testid="options">
        <h2 class="mb-2 text-xs text-slate-500">{m.optionsTitle}</h2>
        {#if frame.kind === 'compute'}
          <ul class="flex flex-col gap-1 text-sm">
            {#each frame.options as o, k (k)}
              {@const win = k === frame.chosen}
              <li
                class="flex justify-between gap-2 rounded px-2 py-1 {win
                  ? 'bg-state-sorted font-semibold text-white'
                  : 'bg-slate-100 text-slate-800'}"
              >
                <span>{m.optionName(o.kind, frame.cell)}</span>
                <span class="tabular-nums"
                  >{String(o.value).replace('-', '−')}{win ? ` ${m.chosenMark}` : ''}</span
                >
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-slate-600">{m.optionsEmpty}</p>
        {/if}
      </section>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <section class="rounded-xl border border-slate-200 bg-white p-3" data-testid="guide">
        <h2 class="mb-2 text-xs text-slate-500">{m.guideTitle}</h2>
        <ol class="flex flex-col gap-2">
          {#each m.stepOrder as s (s)}
            {@const st = statusOf(s)}
            <li
              class="rounded-lg border p-2 text-sm {st === 'current'
                ? 'border-teal-700 bg-teal-50'
                : 'border-slate-200'}"
              aria-current={st === 'current' ? 'step' : undefined}
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-slate-900">
                  <span
                    class="mr-1 inline-flex size-6 items-center justify-center rounded bg-slate-800 font-mono text-white"
                    aria-hidden="true">{m.stepLetters[s]}</span
                  >{m.stepNames[s]}
                  <span class="text-xs font-normal text-slate-600"
                    >{m.stepMarkers[st]} {m.stepStatus[st]}</span
                  >
                </span>
                <button
                  type="button"
                  class="btn-outline px-2 py-1 text-xs"
                  aria-label={m.showAria(m.stepNames[s])}
                  onclick={() => show(s)}>{m.showButton}</button
                >
              </div>
              <p class="mt-1 text-slate-700 {st === 'todo' ? 'opacity-75' : ''}">
                {m.stepText[frame.problem][s]}
              </p>
            </li>
          {/each}
        </ol>
      </section>
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.filled}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="filled">
            {frame.filled} / {frame.table.length}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.work}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="work">{frame.work}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="answer">
            {frame.answer === null ? m.answerPending : String(frame.answer).replace('-', '−')}
          </dd>
        </div>
      </dl>
      <CodePanel lines={srtbotPseudocode[frame.problem]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
