<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    differenceTrace,
    formatUpdates,
    parsePrefixValues,
    parseUpdates,
    prefixPseudocode,
    prefixTrace,
  } from '$lib/algo-engine/prefix-sums.js';
  import { en as m } from '$lib/lessons/prefix-sums/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/prefix-sums.js').PrefixMode} PrefixMode */
  /** @typedef {import('$lib/algo-engine/prefix-sums.js').PrefixFrame} PrefixFrame */
  /** @typedef {import('$lib/algo-engine/prefix-sums.js').RangeUpdate} RangeUpdate */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [3, 1, 4, 1, 5, 9, 2, 6];
  const INITIAL_L = 2;
  const INITIAL_R = 5;
  const INITIAL_UPDATES = /** @type {RangeUpdate[]} */ ([
    { l: 1, r: 3, v: 5 },
    { l: 2, r: 7, v: -2 },
  ]);
  let mode = $state(/** @type {PrefixMode} */ ('prefix'));
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let l = $state(INITIAL_L);
  let r = $state(INITIAL_R);
  /** @type {number | null} */
  let lDraft = $state(INITIAL_L);
  /** @type {number | null} */
  let rDraft = $state(INITIAL_R);
  let updates = $state(INITIAL_UPDATES);
  let updatesText = $state(formatUpdates(INITIAL_UPDATES));
  let anchor = $state(-1);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(prefixTrace(INITIAL, INITIAL_L, INITIAL_R));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  const modeOptions = /** @type {PrefixMode[]} */ (['prefix', 'difference']).map((v) => ({
    value: v,
    label: m.modes[v],
  }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Rebuild the trace; a new range jumps straight to its query. @param {boolean} [toQuery] */
  function rebuild(toQuery = false) {
    notice = { text: '', at: -1 };
    anchor = -1;
    const frames = mode === 'prefix' ? prefixTrace(values, l, r) : differenceTrace(values, updates);
    player.load(frames);
    if (toQuery && mode === 'prefix') player.seek(frames.length - 2);
  }

  function commitValues() {
    const parsed = parsePrefixValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    values = parsed.values;
    valuesText = values.join(', ');
    // Keep the range and the updates inside the new array.
    const last = values.length - 1;
    r = rDraft = Math.min(r, last);
    l = lDraft = Math.min(l, r);
    updates = updates.filter((u) => u.l <= last).map((u) => ({ ...u, r: Math.min(u.r, last) }));
    updatesText = formatUpdates(updates);
    rebuild();
  }

  function commitRange() {
    const last = values.length - 1;
    if (
      whole(lDraft, 0, last) &&
      whole(rDraft, 0, last) &&
      /** @type {number} */ (lDraft) <= /** @type {number} */ (rDraft)
    ) {
      l = /** @type {number} */ (lDraft);
      r = /** @type {number} */ (rDraft);
      rebuild(true);
    } else {
      lDraft = l;
      rDraft = r;
      say(m.rangeError(values.length));
    }
  }

  function commitUpdates() {
    const parsed = parseUpdates(updatesText, values.length);
    if ('error' in parsed) {
      updatesText = formatUpdates(updates);
      say(m.updateErrors[parsed.error]);
      return;
    }
    updates = parsed.updates;
    updatesText = formatUpdates(updates);
    rebuild();
  }

  /** Two picks make a range: the first click anchors it, the second closes it. @param {number} i */
  function pick(i) {
    if (mode !== 'prefix') return;
    if (anchor < 0) {
      anchor = i;
      say(m.pickFirst(i));
      return;
    }
    l = lDraft = Math.min(anchor, i);
    r = rDraft = Math.max(anchor, i);
    rebuild(true);
  }

  const querying = $derived(
    frame.kind === 'query' || (frame.kind === 'done' && frame.mode === 'prefix'),
  );
  const applied = $derived(
    frame.update >= 0
      ? frame.update + 1
      : frame.kind === 'rebuild' || frame.kind === 'done'
        ? updates.length
        : 0,
  );
  const updating = $derived(frame.kind === 'update-left' || frame.kind === 'update-right');

  /** @param {number} i @returns {VisualState} */
  function stateA(i) {
    if (frame.mode === 'prefix') {
      if (frame.kind === 'build' && i === frame.at) return 'compare';
      if (querying && i >= frame.l && i <= frame.r) return 'frontier';
      return '';
    }
    if (frame.kind === 'diff' && (i === frame.at || i === frame.at - 1)) return 'compare';
    if (updating && i >= frame.l && i <= frame.r) return 'frontier';
    return '';
  }

  /** @param {number} i @returns {VisualState} */
  function stateP(i) {
    if (frame.kind === 'build') {
      if (i === frame.at + 1) return 'swap';
      if (i === frame.at) return 'compare';
    }
    if (querying && (i === frame.r + 1 || i === frame.l)) return 'sorted';
    return '';
  }
  /** @param {number} i */
  function markerP(i) {
    if (!querying) return '';
    if (i === frame.r + 1) return m.markers.plus;
    if (i === frame.l) return m.markers.minus;
    return '';
  }

  /** @param {number} i @returns {VisualState} */
  function stateD(i) {
    if (frame.kind === 'diff' && i === frame.at) return 'swap';
    if (updating && i === frame.at) return 'swap';
    if (frame.kind === 'rebuild' && i === frame.at) return 'compare';
    return '';
  }
  /** @param {number} i */
  function markerD(i) {
    if (!updating || i !== frame.at) return '';
    return frame.kind === 'update-left' ? m.markers.plus : m.markers.minus;
  }

  /** @param {number} i @returns {VisualState} */
  function stateB(i) {
    if (frame.kind !== 'rebuild') return '';
    if (i === frame.at) return 'swap';
    return i === frame.at - 1 ? 'compare' : '';
  }

  /** @param {VisualState} s @param {string} mark */
  function stateName(s, mark) {
    if (mark === m.markers.plus) return m.states.plus;
    if (mark === m.markers.minus) return m.states.minus;
    if (s === 'compare') return m.states.read;
    if (s === 'swap') return m.states.written;
    return s === 'frontier' ? m.states.range : '';
  }

  /** @param {(number|null)[]} cells */
  const shown = (cells) => cells.map((v) => (v === null ? m.empty : v));

  const windowsA = $derived(
    querying
      ? [{ from: frame.l, to: frame.r + 1, label: m.rangeWindow(frame.l, frame.r) }]
      : updating
        ? [{ from: frame.l, to: frame.r + 1, label: m.updateWindow(frame.value) }]
        : [],
  );

  const legend = /** @type {[VisualState, string][]} */ ([
    ['frontier', m.legend.range],
    ['compare', m.legend.read],
    ['swap', m.legend.written],
    ['sorted', m.legend.lookups],
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
      onchange={() => rebuild()}
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
    {#if mode === 'prefix'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.lLabel}
        <input
          type="number"
          name="l"
          min="0"
          max={values.length - 1}
          step="1"
          class="field w-20"
          bind:value={lDraft}
          onchange={commitRange}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.rLabel}
        <input
          type="number"
          name="r"
          min="0"
          max={values.length - 1}
          step="1"
          class="field w-20"
          bind:value={rDraft}
          onchange={commitRange}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.updatesLabel}
        <input
          type="text"
          name="updates"
          class="field w-64 max-w-full"
          bind:value={updatesText}
          onchange={commitUpdates}
        />
      </label>
    {/if}
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
          stateOf={stateA}
          labelOf={(i) => m.cellLabel('a', i, frame.items[i], stateName(stateA(i), ''))}
          windows={windowsA}
          onselect={frame.mode === 'prefix' ? pick : null}
          selected={anchor}
          speed={player.speed}
        />
        {#if frame.mode === 'prefix'}
          <p class="mt-1 text-xs text-slate-500">{m.pickHint}</p>
          <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.prefixTitle}
          </h2>
          <ArrayStrip
            values={shown(frame.prefix)}
            ariaLabel={m.prefixAria}
            stateOf={stateP}
            markerOf={markerP}
            labelOf={(i) => m.cellLabel('P', i, frame.prefix[i], stateName(stateP(i), markerP(i)))}
            dimmed={(i) => frame.prefix[i] === null}
            speed={player.speed}
          />
          {#if frame.result !== null}
            <p class="mt-2 font-mono text-sm text-slate-700 tabular-nums" data-testid="query-line">
              {m.queryLine(
                frame.l,
                frame.r,
                /** @type {number} */ (frame.prefix[frame.r + 1]),
                /** @type {number} */ (frame.prefix[frame.l]),
                frame.result,
              )}
            </p>
          {/if}
        {:else}
          <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.diffTitle}
          </h2>
          <ArrayStrip
            values={shown(frame.diff)}
            ariaLabel={m.diffAria}
            stateOf={stateD}
            markerOf={markerD}
            labelOf={(i) => m.cellLabel('D', i, frame.diff[i], stateName(stateD(i), markerD(i)))}
            dimmed={(i) => frame.diff[i] === null}
            speed={player.speed}
          />
          <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.outTitle}
          </h2>
          <ArrayStrip
            values={shown(frame.out)}
            ariaLabel={m.outAria}
            stateOf={stateB}
            labelOf={(i) => m.cellLabel('b', i, frame.out[i], stateName(stateB(i), ''))}
            dimmed={(i) => frame.out[i] === null}
            speed={player.speed}
          />
          {#if frame.kind === 'done'}
            <p class="mt-2 font-mono text-sm text-slate-700 tabular-nums">
              {m.checkLine(/** @type {number[]} */ (frame.out))}
            </p>
          {/if}
        {/if}
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
          <dt class="text-xs text-slate-500">{m.stats.build}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.additions}</dd>
        </div>
        {#if frame.mode === 'prefix'}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.lookups}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.lookups}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
            <dd class="text-2xl font-bold text-slate-500 tabular-nums">{frame.r - frame.l + 1}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.result}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.result ?? m.pending}</dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.updates}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {applied} / {updates.length}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.writes}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.naiveWrites}</dt>
            <dd class="text-2xl font-bold text-slate-500 tabular-nums">{frame.naive}</dd>
          </div>
        {/if}
      </dl>

      <CodePanel lines={prefixPseudocode[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
