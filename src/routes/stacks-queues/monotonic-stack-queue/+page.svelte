<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import BarChart from '$lib/components/bar-chart.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    makeMonoValues,
    monoPseudocode,
    monoTrace,
    parseMonoValues,
  } from '$lib/algo-engine/monotonic-stack-queue.js';
  import { en as m } from '$lib/lessons/monotonic-stack-queue/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/monotonic-stack-queue.js').MonoMode} MonoMode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRESETS = /** @type {const} */ (['mixed', 'falling', 'rising', 'random']);
  const modeOptions = /** @type {MonoMode[]} */ (['next-greater', 'window-max']).map((v) => ({
    value: v,
    label: m.modes[v],
  }));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeMonoValues('mixed');
  let mode = $state(/** @type {MonoMode} */ ('next-greater'));
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let k = $state(3);
  /** @type {number | null} */
  let kDraft = $state(3);
  let preset = $state('mixed');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(monoTrace('next-greater', INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(monoTrace(mode, values, k));
  }

  /** @param {number[]} next */
  function setValues(next) {
    values = next;
    valuesText = next.join(', ');
    // A shorter array cannot hold the old window; shrink k to fit.
    if (k > next.length) k = kDraft = next.length;
  }

  function commitValues() {
    const parsed = parseMonoValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    if (parsed.values.join(',') === values.join(',')) {
      valuesText = values.join(', ');
      return;
    }
    setValues(parsed.values);
    preset = '';
    rebuild();
  }

  function commitK() {
    const x = kDraft;
    if (x === null || !Number.isInteger(x) || x < 1 || x > values.length) {
      kDraft = k;
      say(m.kError(values.length));
      return;
    }
    if (x === k) return;
    k = x;
    rebuild();
  }

  function submit() {
    commitValues();
    if (mode === 'window-max') commitK();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {(typeof PRESETS)[number]} */ (e.currentTarget.value);
    setValues(makeMonoValues(picked, Math.random));
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
    rebuild();
  }

  /** @param {number} j @returns {VisualState} */
  function barState(j) {
    if (j === frame.i) return 'active';
    if (j === frame.compared) return 'compare';
    if (frame.popped.includes(j)) return 'swap';
    if (frame.held.includes(j)) return 'frontier';
    return '';
  }

  /** @param {number} j */
  function dimmed(j) {
    if (frame.kind === 'start') return true;
    if (frame.i < 0) return false;
    if (j > frame.i) return true;
    return frame.mode === 'window-max' && j < frame.i - frame.k + 1;
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;

  const bars = $derived(frame.items.map((value, id) => ({ id, value })));
  const held = $derived(
    frame.held.map((j) => {
      const s = barState(j);
      return {
        label: m.heldItem(j, frame.items[j]),
        state: s === 'frontier' ? /** @type {VisualState} */ ('') : s,
        marker: MARKERS[s] ?? '',
      };
    }),
  );
  /** The answer slot written on this step, −1 when none. */
  const written = $derived(
    frame.kind === 'pop' && frame.mode === 'next-greater'
      ? frame.popped[0]
      : frame.kind === 'emit'
        ? frame.i - frame.k + 1
        : -1,
  );

  const legend = $derived(
    /** @type {[VisualState, string, string][]} */ ([
      ['active', m.markers.active, m.legend.active],
      ['compare', m.markers.compare, m.legend.compare],
      ['swap', m.markers.swap, m.legend.swap],
      ['frontier', '', m.legend.frontier],
    ]),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      submit();
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
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
        autocomplete="off"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    {#if mode === 'window-max'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.kLabel}
        <input
          type="number"
          name="k"
          min="1"
          max={values.length}
          step="1"
          class="field w-20"
          bind:value={kDraft}
          onchange={commitK}
        />
      </label>
    {/if}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="grid gap-4 {frame.mode === 'next-greater' ? 'sm:grid-cols-[1fr_auto]' : ''}">
          <div class="min-w-0">
            <h3 class="mb-1 text-xs text-slate-500">{m.barsTitle}</h3>
            <!-- New values remount the bars: they are a different array, not a reordering. -->
            {#key frame.items.join(',')}
              <BarChart
                items={bars}
                stateOf={(j) => (barState(j) === '' ? 'bg-slate-400' : STATE_BG[barState(j)])}
                markerOf={(j) => MARKERS[barState(j)] ?? ''}
                {dimmed}
                ariaLabel={m.barsLabel(frame)}
                speed={player.speed}
              />
            {/key}
          </div>
          <div class="min-w-0">
            <h3 class="mb-1 text-xs text-slate-500">
              {frame.mode === 'next-greater' ? m.stackTitle : m.dequeTitle}
            </h3>
            <StackQueueView
              kind={frame.mode === 'next-greater' ? 'stack' : 'deque'}
              items={held}
              ariaLabel={m.heldLabel(frame)}
              speed={player.speed}
            />
          </div>
        </div>
        <h3 class="mt-4 mb-1 text-xs text-slate-500">{m.answerTitle[frame.mode]}</h3>
        <ArrayStrip
          values={frame.answer.map((a) => (a === null ? m.unknown : a))}
          ariaLabel={m.answerLabel(frame)}
          stateOf={(j) => (j === written ? 'sorted' : '')}
          markerOf={(j) => (j === written ? '✓' : '')}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker ? `${marker} ${label}` : label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 bg-slate-400 opacity-40"></span>
            {frame.mode === 'window-max' ? m.legend.outside : m.legend.unread}
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
          <dt class="text-xs text-slate-500">{m.stats.pushes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pushes">{frame.pushes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pops}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pops">{frame.pops}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="comparisons">
            {frame.comparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bound}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="bound">
            {frame.pushes + frame.pops} ≤ {2 * frame.items.length}
          </dd>
        </div>
      </dl>
      <CodePanel lines={monoPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
