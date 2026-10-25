<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_TARGET,
    parseWindowValues,
    randomWindowValues,
    windowPseudocode,
    windowTrace,
  } from '$lib/algo-engine/sliding-window.js';
  import { en as m } from '$lib/lessons/sliding-window/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/sliding-window.js').WindowMode} WindowMode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [2, 1, 5, 1, 3, 2];
  const INITIAL_K = 3;
  const INITIAL_S = 7;
  let mode = $state(/** @type {WindowMode} */ ('fixed'));
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let k = $state(INITIAL_K);
  let s = $state(INITIAL_S);
  /** @type {number | null} */
  let kDraft = $state(INITIAL_K);
  /** @type {number | null} */
  let sDraft = $state(INITIAL_S);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(windowTrace('fixed', INITIAL, INITIAL_K));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const n = $derived(frame.items.length);
  const done = $derived(frame.kind === 'done');

  const modeOptions = /** @type {WindowMode[]} */ (['fixed', 'variable']).map((v) => ({
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
    player.load(windowTrace(mode, values, mode === 'fixed' ? k : s));
  }

  /** @param {number[]} next */
  function setValues(next) {
    values = next;
    valuesText = next.join(', ');
    // A shorter array cannot hold the old window; shrink k to fit.
    if (k > next.length) k = kDraft = next.length;
  }

  function commitValues() {
    const parsed = parseWindowValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    setValues(parsed.values);
    rebuild();
  }

  function commitK() {
    if (whole(kDraft, 1, values.length)) {
      k = /** @type {number} */ (kDraft);
      rebuild();
    } else {
      kDraft = k;
      say(m.kError(values.length));
    }
  }

  function commitS() {
    if (whole(sDraft, 1, MAX_TARGET)) {
      s = /** @type {number} */ (sDraft);
      rebuild();
    } else {
      sDraft = s;
      say(m.sError);
    }
  }

  function randomize() {
    setValues(randomWindowValues(12));
    rebuild();
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (i === frame.entering) return 'swap';
    if (i === frame.leaving) return 'compare';
    if (done && i >= frame.bestFrom && i < frame.bestTo) return 'sorted';
    if (i >= frame.left && i < frame.right) return 'frontier';
    return '';
  }

  /** @param {number} i */
  function markerOf(i) {
    const st = stateOf(i);
    if (st === 'swap') return m.markers.enter;
    if (st === 'compare') return m.markers.leave;
    if (st === 'sorted') return m.markers.best;
    return '';
  }

  /** @type {Record<VisualState, string>} */
  const stateNames = {
    '': '',
    compare: m.states.leave,
    swap: m.states.enter,
    sorted: m.states.best,
    active: '',
    frontier: m.states.inside,
    visited: '',
    path: '',
  };
  /** @param {number} i */
  const labelOf = (i) => m.cellLabel(i, frame.items[i], stateNames[stateOf(i)]);

  const pointers = $derived(
    frame.kind === 'start'
      ? [{ name: m.pointerL, index: 0 }]
      : [
          { name: m.pointerL, index: frame.left },
          ...(frame.right > frame.left ? [{ name: m.pointerR, index: frame.right - 1 }] : []),
        ],
  );
  const windows = $derived.by(() => {
    const out = [];
    if (frame.right > frame.left)
      out.push({ from: frame.left, to: frame.right, label: m.windowLabel(frame.sum) });
    const sameAsCurrent = frame.bestFrom === frame.left && frame.bestTo === frame.right;
    if (frame.bestFrom >= 0 && !sameAsCurrent)
      out.push({ from: frame.bestFrom, to: frame.bestTo, label: m.bestLabel });
    return out;
  });

  const brute = $derived(
    frame.mode === 'fixed' ? m.bruteFixed(n, frame.target) : m.bruteVariable(n),
  );
  const legend = /** @type {[VisualState, string][]} */ ([
    ['frontier', m.legend.inside],
    ['swap', m.legend.enter],
    ['compare', m.legend.leave],
    ['sorted', m.legend.best],
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
    {#if mode === 'fixed'}
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
          class="field w-24"
          bind:value={kDraft}
          onchange={commitK}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.sLabel}
        <input
          type="number"
          name="s"
          min="1"
          max={MAX_TARGET}
          step="1"
          class="field w-24"
          bind:value={sDraft}
          onchange={commitS}
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
        <p class="mt-2 font-mono text-sm text-slate-700 tabular-nums">
          {m.updateTitle}: {m.updateLine(frame)}
        </p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.sum}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.sum}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">
            {frame.mode === 'fixed' ? m.stats.best : m.stats.bestLength}
          </dt>
          <dd class="text-2xl font-bold tabular-nums">
            {#if frame.bestFrom >= 0}{frame.best}{:else if done}{m.none}{:else}{m.pending}{/if}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.updates}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.updates}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.brute}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{brute}</dd>
        </div>
        {#if frame.mode === 'variable'}
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.shrinks}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.shrinks}</dd>
          </div>
        {/if}
      </dl>
      <p class="text-xs text-slate-500">
        {frame.mode === 'fixed' ? m.bruteNoteFixed : m.bruteNoteVariable}
      </p>

      <CodePanel lines={windowPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
