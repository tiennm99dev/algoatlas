<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    CONSTRAINTS,
    MAX_N,
    MIN_N,
    SHAPES,
    SORTS,
    SORT_FACTS,
    matchSorts,
    parseValues,
    racePseudocode,
    raceResults,
    raceTrace,
    shapeValues,
  } from '$lib/algo-engine/practice-sorting.js';
  import { en as m } from '$lib/lessons/practice-sorting/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-sorting.js').Shape} Shape */
  /** @typedef {import('$lib/algo-engine/practice-sorting.js').Constraint} Constraint */
  /** @typedef {import('$lib/algo-engine/practice-sorting.js').Lane} Lane */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [42, 17, 88, 17, 63, 5, 71, 42, 29, 94, 56, 8];

  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  /** @type {number | null} */
  let size = $state(INITIAL.length);
  /** @type {Shape | null} */
  let shape = $state(null);
  let results = $state.raw(raceResults(INITIAL));
  /** @type {Constraint[]} */
  let chosen = $state([]);

  const player = createPlayer(raceTrace(INITIAL));
  const frame = $derived(player.frame);
  const end = $derived(player.frames.at(-1)?.t ?? 0);

  let notice = $state({ text: '', at: -1 });
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const repeated = $derived(new Set(values.filter((v, i) => values.indexOf(v) !== i)));
  const running = $derived(frame.lanes.filter((l) => !l.done).length);
  const matches = $derived(matchSorts(chosen));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {number[]} next */
  function load(next) {
    values = next;
    valuesText = next.join(', ');
    size = next.length;
    notice = { text: '', at: -1 };
    results = raceResults(next);
    player.load(raceTrace(next));
  }

  function commitValues() {
    const parsed = parseValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    shape = null;
    load(parsed.values);
  }

  function commitSize() {
    const n = size;
    if (n === null || !Number.isInteger(n) || n < MIN_N || n > MAX_N) {
      size = values.length;
      say(m.sizeError);
      return;
    }
    if (n === values.length) return;
    shape = shape ?? 'random';
    load(shapeValues(shape, n));
  }

  /** @param {Shape} s */
  function pickShape(s) {
    shape = s;
    load(shapeValues(s, values.length));
  }

  /** @param {Lane} lane @param {number} i @returns {VisualState} */
  const stateOf = (lane, i) => (lane.focus.includes(i) ? 'compare' : lane.done ? 'sorted' : '');

  /** @param {Lane} lane @param {number} i */
  const markerOf = (lane, i) => {
    const card = lane.items[i];
    const tag = card && repeated.has(card.key) ? m.tagName(card.tag) : '';
    return `${lane.focus.includes(i) ? m.markers.compare : ''}${tag}`;
  };

  /** @param {Lane} lane */
  const status = (lane) => (lane.done ? m.finished(lane.place) : m.running);

  /** @param {Constraint} c */
  function toggle(c) {
    chosen = chosen.includes(c) ? chosen.filter((x) => x !== c) : [...chosen, c];
  }

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['compare', m.markers.compare, m.legend.compare],
    ['sorted', m.markers.sorted, m.legend.sorted],
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
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >{m.shapeLabel}</legend
      >
      <div class="flex flex-wrap gap-2">
        {#each SHAPES as s (s)}
          <button
            type="button"
            class={shape === s ? 'btn-primary' : 'btn-outline'}
            aria-pressed={shape === s}
            onclick={() => pickShape(s)}>{m.shapes[s]}</button
          >
        {/each}
      </div>
    </fieldset>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.sizeLabel}
      <input
        type="number"
        name="size"
        min={MIN_N}
        max={MAX_N}
        class="field w-20"
        bind:value={size}
        onchange={commitSize}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-80 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.raceTitle}
        </h2>
        <ol class="flex flex-col gap-3">
          {#each frame.lanes as lane (lane.id)}
            <li class="min-w-0">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <h3 class="font-semibold text-slate-900">{m.sorts[lane.id]}</h3>
                <span class="text-xs text-slate-600 tabular-nums"
                  >{m.laneStats(lane.comparisons, lane.writes)}</span
                >
                <span
                  class="ml-auto text-xs font-semibold {lane.done
                    ? 'text-emerald-800'
                    : 'text-slate-500'}">{status(lane)}</span
                >
              </div>
              <div class="mt-1 h-1.5 rounded bg-slate-100" aria-hidden="true">
                <div
                  class="h-1.5 rounded {lane.done ? STATE_BG.sorted : STATE_BG.compare}"
                  style="width: {end ? (100 * lane.comparisons) / end : 0}%"
                ></div>
              </div>
              <ArrayStrip
                values={lane.items.map((c) => c.key)}
                ariaLabel={m.laneAria(
                  m.sorts[lane.id],
                  status(lane),
                  lane.items.map((c) => c.key),
                )}
                stateOf={(i) => stateOf(lane, i)}
                markerOf={(i) => markerOf(lane, i)}
                showIndices={false}
                speed={player.speed}
              />
            </li>
          {/each}
        </ol>
        <p class="mt-2 text-xs text-slate-500">{m.tagNote}</p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker}
              {label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="font-bold text-slate-900">{m.markers.tag}</span>
            {m.legend.tag}
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

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.step}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.t}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.length}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{end}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.running}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {m.runningValue(running, frame.lanes.length)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cards}</dt>
          <dd class="text-2xl font-bold tabular-nums">{values.length}</dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.resultsTitle}</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-right text-xs tabular-nums" aria-label={m.resultsAria}>
            <thead>
              <tr class="text-slate-500">
                {#each m.resultsCols as c, k (c)}
                  <th scope="col" class="px-1 py-1 font-medium {k === 0 ? 'text-left' : ''}">{c}</th
                  >
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each SORTS as id (id)}
                {@const r = results.find((x) => x.id === id)}
                {@const done = frame.lanes.find((l) => l.id === id)?.done ?? false}
                <tr class="border-t border-slate-100">
                  <th scope="row" class="px-1 py-1 text-left font-medium text-slate-800"
                    >{m.sorts[id]}</th
                  >
                  {#if r && done}
                    <td class="px-1 py-1">{r.comparisons}</td>
                    <td class="px-1 py-1">{r.writes}</td>
                    <td class="px-1 py-1">{r.depth}</td>
                    <td class="px-1 py-1">{r.buffer}</td>
                    <td class="px-1 py-1 {r.stable === false ? 'font-semibold text-rose-700' : ''}"
                      >{m.stableHere(r.stable)}</td
                    >
                  {:else}
                    {#each [0, 1, 2, 3, 4] as k (k)}
                      <td class="px-1 py-1 text-slate-400">{m.pending}</td>
                    {/each}
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs text-slate-500">{m.resultsNote}</p>
      </section>

      <CodePanel lines={racePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-8 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.pickerTitle}
    </h2>
    <p class="mb-3 text-sm text-slate-700">{m.pickerIntro}</p>
    <div class="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <fieldset class="flex flex-col gap-2">
        <legend class="sr-only">{m.pickerTitle}</legend>
        {#each CONSTRAINTS as c (c)}
          <label class="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              name="constraint"
              value={c}
              class="size-4 accent-teal-700"
              checked={chosen.includes(c)}
              onchange={() => toggle(c)}
            />
            {m.constraints[c]}
          </label>
        {/each}
      </fieldset>
      <div class="min-w-0">
        <p
          class="mb-2 text-sm font-semibold text-slate-800"
          role="status"
          data-testid="match-summary"
        >
          {m.matchSummary(matches.map((id) => m.sorts[id]))}
        </p>
        <ul class="flex flex-col gap-1">
          {#each SORTS as id (id)}
            {@const fits = matches.includes(id)}
            {@const missing = chosen.filter((c) => !SORT_FACTS[id][c])}
            <li
              class="flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 px-2 py-1 text-sm {fits
                ? 'border-emerald-700 bg-emerald-50'
                : 'border-slate-200 text-slate-500'}"
              aria-label={m.fitAria(
                m.sorts[id],
                fits,
                missing.map((c) => m.constraints[c]),
              )}
            >
              <span class="font-semibold">{fits ? `${m.meets} ` : ''}{m.sorts[id]}</span>
              <span class="flex flex-wrap gap-1 text-xs" aria-hidden="true">
                {#each chosen as c (c)}
                  <span
                    class="rounded px-1.5 py-0.5 {SORT_FACTS[id][c]
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-rose-100 text-rose-900'}"
                    title={m.constraints[c]}
                    >{SORT_FACTS[id][c] ? m.meets : m.fails}
                    {m.constraintShort[c]}</span
                  >
                {/each}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </section>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
