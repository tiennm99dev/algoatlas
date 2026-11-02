<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    DEFAULT_N,
    DEFAULT_SEED,
    MAX_N,
    MAX_OPS,
    MIN_N,
    STRUCTURE_IDS,
    WORKLOAD_PRESETS,
    formatOp,
    formatOps,
    makeWorkload,
    opsFit,
    parseOps,
    seededRand,
    workloadPseudocode,
    workloadTrace,
  } from '$lib/algo-engine/practice-range-queries.js';
  import { en as m } from '$lib/lessons/practice-range-queries/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-range-queries.js').RangeSize} RangeSize */
  /** @typedef {import('$lib/algo-engine/practice-range-queries.js').WorkloadOp} WorkloadOp */

  const RANGE_SIZES = /** @type {RangeSize[]} */ (['any', 'short', 'long']);
  const FIRST_PRESET = 'sumsAndSets';
  const FIRST_SHAPE = WORKLOAD_PRESETS[FIRST_PRESET];
  const CHIPS_BEFORE = 4;
  const CHIPS_SHOWN = 24;
  const BAR_SPAN = 3;

  // A fixed first workload and seed keep the prerendered HTML and the hydrated page identical.
  const FIRST_OPS = makeWorkload(DEFAULT_N, FIRST_SHAPE, seededRand(DEFAULT_SEED));
  const firstFrames = workloadTrace(DEFAULT_N, FIRST_OPS);

  let n = $state(DEFAULT_N);
  let shape = $state.raw(FIRST_SHAPE);
  /** @type {WorkloadOp[]} */
  let ops = $state.raw(FIRST_OPS);
  // Typed operations are kept across a size change; a drawn workload is drawn again to fit it.
  let typed = false;
  let seed = DEFAULT_SEED;

  /** @type {number | null} */
  let sizeDraft = $state(DEFAULT_N);
  /** @type {number | null} */
  let sumsDraft = $state(FIRST_SHAPE.sums);
  /** @type {number | null} */
  let minsDraft = $state(FIRST_SHAPE.mins);
  /** @type {number | null} */
  let setsDraft = $state(FIRST_SHAPE.sets);
  let rangeSize = $state(/** @type {string} */ (FIRST_SHAPE.ranges));
  let text = $state(formatOps(FIRST_OPS));
  let preset = $state(FIRST_PRESET);
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const guard = createFieldGuard();
  const player = createPlayer(firstFrames);
  player.seek(firstFrames.length - 1);

  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  // Bars share a scale tied to the cheapest total, so one huge rebuild cannot flatten the rest.
  const barScale = $derived(BAR_SPAN * Math.max(1, finalFrame.stats[finalFrame.cheapest[0]].total));
  const chips = $derived.by(() => {
    const from = Math.max(0, frame.opIndex - CHIPS_BEFORE);
    return ops
      .slice(from, from + CHIPS_SHOWN)
      .map((op, k) => ({ label: formatOp(op), hot: from + k === frame.opIndex }));
  });

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  /** Runs the current workload and opens on its totals. */
  function run() {
    notice = { text: '', at: -1 };
    const frames = workloadTrace(n, ops);
    player.load(frames);
    player.seek(frames.length - 1);
    text = formatOps(ops);
  }

  /** Draws a workload from the builder's counts and the current seed. */
  function draw() {
    typed = false;
    ops = makeWorkload(n, shape, seededRand(seed));
    run();
  }

  function commitSize() {
    if (!guard.commit(wholeInRange(sizeDraft, MIN_N, MAX_N))) {
      sizeDraft = n;
      say(m.sizeError);
      return;
    }
    const next = /** @type {number} */ (sizeDraft);
    if (next === n) return;
    if (typed && !opsFit(ops, next)) {
      guard.commit(false);
      sizeDraft = n;
      say(m.sizeTooSmall);
      return;
    }
    n = next;
    if (typed) run();
    else draw();
  }

  function restoreCounts() {
    sumsDraft = shape.sums;
    minsDraft = shape.mins;
    setsDraft = shape.sets;
  }

  function commitCounts() {
    const each = [sumsDraft, minsDraft, setsDraft].every((d) => wholeInRange(d, 0, MAX_OPS));
    const total = (sumsDraft ?? 0) + (minsDraft ?? 0) + (setsDraft ?? 0);
    if (!guard.commit(each && total >= 1 && total <= MAX_OPS)) {
      restoreCounts();
      say(m.countError);
      return;
    }
    shape = {
      ...shape,
      sums: /** @type {number} */ (sumsDraft),
      mins: /** @type {number} */ (minsDraft),
      sets: /** @type {number} */ (setsDraft),
    };
    preset = '';
    draw();
  }

  function pickRangeSize() {
    shape = { ...shape, ranges: /** @type {RangeSize} */ (rangeSize) };
    preset = '';
    draw();
  }

  function newRanges() {
    if (guard.refused()) return;
    seed = 1 + Math.floor(Math.random() * 2147483646);
    preset = '';
    draw();
  }

  function commitOps() {
    const r = parseOps(text, n);
    if ('error' in r) {
      text = formatOps(ops);
      say(m.opErrors[r.error]);
      return;
    }
    if (formatOps(r.ops) === formatOps(ops)) {
      text = formatOps(ops);
      return;
    }
    ops = r.ops;
    typed = true;
    preset = '';
    shape = {
      ...shape,
      sums: ops.filter((op) => op.type === 'sum').length,
      mins: ops.filter((op) => op.type === 'min').length,
      sets: ops.filter((op) => op.type === 'set').length,
    };
    restoreCounts();
    run();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    preset = e.currentTarget.value;
    shape = WORKLOAD_PRESETS[preset];
    restoreCounts();
    rangeSize = shape.ranges;
    // A preset always gets the first ranges, so its totals can be quoted and compared.
    seed = DEFAULT_SEED;
    draw();
  }

  /** @param {number} x */
  const count = (x) => x.toLocaleString('en-US');
  /** @param {number} part */
  const share = (part) => Math.min(100, (part / barScale) * 100);
  /** @param {WorkloadOp} op */
  const spanOf = (op) => (op.type === 'set' ? { l: op.i, r: op.i } : { l: op.l, r: op.r });

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => e.preventDefault()}
    onkeydown={(e) => enterField(e, {})}
  >
    <label class={labelClass}>
      {m.sizeLabel}
      <input
        type="number"
        name="size"
        class="field w-24"
        min={MIN_N}
        max={MAX_N}
        bind:value={sizeDraft}
        onchange={commitSize}
      />
    </label>
    <label class={labelClass}>
      {m.sumsLabel}
      <input
        type="number"
        name="sums"
        class="field w-20"
        min="0"
        max={MAX_OPS}
        bind:value={sumsDraft}
        onchange={commitCounts}
      />
    </label>
    <label class={labelClass}>
      {m.minsLabel}
      <input
        type="number"
        name="mins"
        class="field w-20"
        min="0"
        max={MAX_OPS}
        bind:value={minsDraft}
        onchange={commitCounts}
      />
    </label>
    <label class={labelClass}>
      {m.setsLabel}
      <input
        type="number"
        name="sets"
        class="field w-20"
        min="0"
        max={MAX_OPS}
        bind:value={setsDraft}
        onchange={commitCounts}
      />
    </label>
    <SegmentedControl
      legend={m.rangesLabel}
      name="range-size"
      options={RANGE_SIZES.map((v) => ({ value: v, label: m.rangeSizes[v] }))}
      bind:value={rangeSize}
      onchange={pickRangeSize}
    />
    <button type="button" class="btn-outline" onclick={newRanges}>{m.newRanges}</button>
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each Object.keys(WORKLOAD_PRESETS) as p (p)}
          <option value={p}>{m.presets[/** @type {keyof typeof m.presets} */ (p)]}</option>
        {/each}
      </select>
    </label>
  </form>

  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitOps();
    }}
  >
    <label class="{labelClass} min-w-64 flex-1">
      {m.opsLabel}
      <input
        type="text"
        name="ops"
        class="field w-full font-mono"
        aria-label={m.opsAria}
        bind:value={text}
        onchange={commitOps}
      />
      <span class="font-normal tracking-normal normal-case">{m.opsHelp}</span>
    </label>
    <button type="submit" class="btn-primary">{m.run}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <section class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.costTitle}
        </h2>
        <p class="mb-3 text-xs text-slate-600">{m.costHelp}</p>
        <ul class="flex flex-col gap-3">
          {#each STRUCTURE_IDS as id (id)}
            {@const s = frame.stats[id]}
            <li data-testid="{id}-card">
              <div class="flex flex-wrap items-baseline justify-between gap-x-3">
                <span class="font-semibold {s.out ? 'text-slate-500' : 'text-slate-800'}">
                  {m.structures[id]}
                  {#if frame.cheapest.includes(id)}
                    <span class="ml-1 text-xs font-bold text-state-sorted"
                      >{m.cheapestMark} {m.cheapestWord}</span
                    >
                  {/if}
                  {#if s.out}
                    <span class="ml-1 text-xs font-bold text-slate-600"
                      >{m.outMark} {m.outWord}: {m.outWhy[id]}</span
                    >
                  {/if}
                </span>
                <span
                  class="text-2xl font-bold tabular-nums {s.out ? 'text-slate-500' : ''}"
                  data-testid="{id}-total">{count(s.total)}</span
                >
              </div>
              <div class="mt-1 flex h-2 overflow-hidden rounded bg-slate-100" aria-hidden="true">
                <div
                  class="h-2 {s.out ? 'bg-slate-300' : STATE_BG.frontier}"
                  style="width: {share(s.build)}%"
                ></div>
                <div
                  class="h-2 {s.out ? 'bg-slate-400' : STATE_BG.active}"
                  style="width: {Math.min(100 - share(s.build), share(s.work))}%"
                ></div>
              </div>
              <p class="mt-1 text-xs text-slate-600">
                {#if s.total > barScale}<span aria-hidden="true">{m.barCutMark} </span>{/if}
                {m.stats.build} <span data-testid="{id}-build">{count(s.build)}</span>
                · {m.stats.work} <span data-testid="{id}-work">{count(s.work)}</span>
                · {m.stats.thisOp} <span data-testid="{id}-cost">{count(s.cost)}</span>
                · {m.stats.worst} <span data-testid="{id}-worst">{count(s.worst)}</span>
                · {m.stats.slots} <span data-testid="{id}-slots">{count(s.slots)}</span>
              </p>
            </li>
          {/each}
        </ul>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.frontier}"></span>
            {m.barBuild}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
            {m.barWork}
          </li>
          <li>{m.barCutMark} {m.barCut}</li>
          <li>{m.cheapestMark} {m.cheapestWord}</li>
          <li>{m.outMark} {m.outWord}</li>
        </ul>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.rangeTitle}
        </h2>
        {#if frame.op}
          {@const span = spanOf(frame.op)}
          <div
            class="relative h-4 overflow-hidden rounded bg-slate-100"
            role="img"
            aria-label={m.rangeLabel(frame.op, frame.n)}
            data-testid="range-track"
          >
            <div
              class="absolute inset-y-0 min-w-1 {frame.op.type === 'set'
                ? STATE_BG.swap
                : STATE_BG.compare}"
              style="left: {(span.l / frame.n) * 100}%; width: {((span.r - span.l + 1) / frame.n) *
                100}%"
            ></div>
          </div>
          <p class="mt-2 text-xs text-slate-600">{m.rangeCaption(frame.op)}</p>
        {:else}
          <p class="text-xs text-slate-600">{m.rangeIdle}</p>
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
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="size">{count(frame.n)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.ops}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="ops">{ops.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="answer">
            {frame.truth === null ? m.noValue : count(frame.truth)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cheapest}</dt>
          <dd class="font-bold" data-testid="cheapest">
            {frame.cheapest.map((id) => m.structures[id]).join(', ') || m.noValue}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={CHIPS_SHOWN}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={workloadPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
