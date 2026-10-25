<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_VALUE,
    MIN_VALUE,
    parseValues,
    pointerPseudocode,
    pointerTrace,
    randomValues,
  } from '$lib/algo-engine/two-pointers.js';
  import { en as m } from '$lib/lessons/two-pointers/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/two-pointers.js').PointerMode} PointerMode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [8, 3, 11, 1, 6, 4];
  const INITIAL_TARGET = 10;
  const INITIAL_PIVOT = 5;
  let mode = $state(/** @type {PointerMode} */ ('pair'));
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let target = $state(INITIAL_TARGET);
  let pivot = $state(INITIAL_PIVOT);
  /** @type {number | null} */
  let targetDraft = $state(INITIAL_TARGET);
  /** @type {number | null} */
  let pivotDraft = $state(INITIAL_PIVOT);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(pointerTrace('pair', INITIAL, INITIAL_TARGET));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const n = $derived(frame.items.length);
  const names = $derived(m.pointerNames[frame.mode]);
  const done = $derived(frame.kind === 'done');

  const modeOptions = /** @type {PointerMode[]} */ (['pair', 'partition']).map((v) => ({
    value: v,
    label: m.modes[v],
  }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(pointerTrace(mode, values, mode === 'pair' ? target : pivot));
  }

  function commitValues() {
    const parsed = parseValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    rebuild();
  }

  function commitTarget() {
    if (whole(targetDraft, 2 * MIN_VALUE, 2 * MAX_VALUE)) {
      target = /** @type {number} */ (targetDraft);
      rebuild();
    } else {
      targetDraft = target;
      say(m.targetError);
    }
  }

  function commitPivot() {
    if (whole(pivotDraft, MIN_VALUE, MAX_VALUE)) {
      pivot = /** @type {number} */ (pivotDraft);
      rebuild();
    } else {
      pivotDraft = pivot;
      say(m.pivotError);
    }
  }

  function randomize() {
    values = randomValues(values.length);
    valuesText = values.join(', ');
    // Aim at a sum two of the values really make, or at one of the values as the pivot.
    const x = Math.floor(Math.random() * values.length);
    let y = Math.floor(Math.random() * (values.length - 1));
    if (y >= x) y++;
    target = targetDraft = values[x] + values[y];
    pivot = pivotDraft = values[x];
    rebuild();
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (frame.mode === 'pair') {
      if (frame.found && (i === frame.found[0] || i === frame.found[1])) return 'sorted';
      if (i < frame.left || i > frame.right) return 'visited';
      if (frame.kind === 'sum' && (i === frame.left || i === frame.right)) return 'compare';
      return '';
    }
    if (frame.swapped && (i === frame.swapped[0] || i === frame.swapped[1])) return 'swap';
    if (i < frame.left) return 'sorted';
    if (i > frame.right) return 'visited';
    return '';
  }

  /** @param {number} i */
  function markerOf(i) {
    const s = stateOf(i);
    if (frame.mode === 'pair')
      return s === 'sorted' ? m.markers.found : s === 'visited' ? m.markers.out : '';
    if (s === 'swap') return i < frame.left ? m.markers.less : m.markers.more;
    return s === 'sorted' ? m.markers.less : s === 'visited' ? m.markers.more : '';
  }

  /** Spoken name of a cell state in the current mode. @param {VisualState} s */
  function stateName(s) {
    if (frame.mode === 'pair') {
      if (s === 'compare') return m.states.read;
      if (s === 'sorted') return m.states.found;
      return s === 'visited' ? m.states.out : '';
    }
    if (s === 'swap') return m.states.swapped;
    if (s === 'sorted') return m.states.less;
    return s === 'visited' ? m.states.more : '';
  }

  /** @param {number} i */
  const labelOf = (i) => m.cellLabel(i, frame.items[i], stateName(stateOf(i)));

  // The sum line shows the pair just added, which a move frame has already stepped past.
  const sumShown = $derived(
    ['sum', 'found', 'move-left', 'move-right'].includes(frame.kind) ||
      (done && frame.found !== null),
  );

  const pointers = $derived(
    [
      { name: names[0], index: frame.left },
      { name: names[1], index: frame.right },
    ].filter((p) => p.index >= 0 && p.index <= n),
  );
  const windows = $derived(
    frame.mode === 'partition' && done
      ? [
          { from: 0, to: frame.boundary, label: m.windowLess },
          { from: frame.boundary, to: n, label: m.windowMore },
        ].filter((w) => w.to > w.from)
      : [],
  );

  const legend = $derived(
    frame.mode === 'pair'
      ? /** @type {[VisualState, string][]} */ ([
          ['compare', m.legend.read],
          ['visited', m.legend.out],
          ['sorted', m.legend.found],
        ])
      : /** @type {[VisualState, string][]} */ ([
          ['sorted', m.legend.less],
          ['visited', m.legend.more],
          ['swap', m.legend.swapped],
        ]),
  );
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
      legend={m.modeLegend}
      name="mode"
      options={modeOptions}
      bind:value={mode}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-64 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    {#if mode === 'pair'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.targetLabel}
        <input
          type="number"
          name="target"
          step="1"
          class="field w-24"
          bind:value={targetDraft}
          onchange={commitTarget}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.pivotLabel}
        <input
          type="number"
          name="pivot"
          step="1"
          class="field w-24"
          bind:value={pivotDraft}
          onchange={commitPivot}
        />
      </label>
    {/if}
    <button type="button" class="btn-secondary" onclick={randomize}>{m.randomButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.arrayTitle}
        </h2>
        <ArrayStrip
          values={frame.items}
          ariaLabel={m.arrayAria}
          {stateOf}
          {markerOf}
          {labelOf}
          {pointers}
          {windows}
          speed={player.speed}
        />
        {#if frame.mode === 'pair'}
          <p class="mt-2 text-xs text-slate-500">{m.sortedNote}</p>
          {#if sumShown && frame.sum !== null}
            <p class="mt-2 font-mono text-sm text-slate-700 tabular-nums">
              {m.sumTitle}:
              {m.sumLine(
                frame.items[frame.kind === 'move-left' ? frame.left - 1 : frame.left],
                frame.items[frame.kind === 'move-right' ? frame.right + 1 : frame.right],
                frame.sum,
                frame.target,
              )}
            </p>
          {/if}
        {/if}
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {label}
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
        {#if frame.mode === 'pair'}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.sums}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.pairs}</dt>
            <dd class="text-2xl font-bold text-slate-500 tabular-nums">{(n * (n - 1)) / 2}</dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.reads}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.swaps}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.swaps}</dd>
          </div>
        {/if}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.n}</dt>
          <dd class="text-2xl font-bold tabular-nums">{n}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {#if !done}{m.pending}{:else if frame.mode === 'pair'}{m.pairResult(
                frame.found,
              )}{:else}{frame.boundary}{/if}
          </dd>
        </div>
      </dl>

      <CodePanel lines={pointerPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
