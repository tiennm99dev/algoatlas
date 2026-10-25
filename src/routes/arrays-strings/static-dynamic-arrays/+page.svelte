<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    ELEMENT_BYTES,
    GROWTHS,
    MAX_CAPACITY,
    MAX_PUSHES,
    MIN_CAPACITY,
    addressOf,
    arrayTrace,
    pushPseudocode,
    pushedValue,
  } from '$lib/algo-engine/static-dynamic-arrays.js';
  import { en as m } from '$lib/lessons/static-dynamic-arrays/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/static-dynamic-arrays.js').Growth} Growth */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_CAPACITY = 2;
  const INITIAL_PUSHES = 9;
  let growth = $state(/** @type {Growth} */ ('double'));
  let capacity = $state(INITIAL_CAPACITY);
  let pushes = $state(INITIAL_PUSHES);
  /** @type {number | null} */
  let capacityDraft = $state(INITIAL_CAPACITY);
  /** @type {number | null} */
  let pushesDraft = $state(INITIAL_PUSHES);
  let selected = $state(-1);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(arrayTrace('double', INITIAL_CAPACITY, INITIAL_PUSHES));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const code = $derived(growth === 'static' ? pushPseudocode.static : pushPseudocode.dynamic);

  const growthOptions = GROWTHS.map((g) => ({ value: g, label: m.growths[g] }));

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const whole = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  function rebuild() {
    notice = { text: '', at: -1 };
    selected = -1;
    player.load(arrayTrace(growth, capacity, pushes));
  }

  function commitCapacity() {
    if (whole(capacityDraft, MIN_CAPACITY, MAX_CAPACITY)) {
      capacity = /** @type {number} */ (capacityDraft);
      rebuild();
    } else {
      capacityDraft = capacity;
      notice = { text: m.capacityError, at: player.index };
    }
  }

  function commitPushes() {
    if (whole(pushesDraft, 0, MAX_PUSHES)) {
      pushes = /** @type {number} */ (pushesDraft);
      rebuild();
    } else {
      pushesDraft = pushes;
      notice = { text: m.pushesError, at: player.index };
    }
  }

  /** @param {(number|null)[]} cells */
  const shown = (cells) => cells.map((v) => (v === null ? m.spare : v));

  /** @param {number} i @returns {VisualState} */
  function stateA(i) {
    if (i !== frame.at) return '';
    if (frame.kind === 'copy') return 'compare';
    if (frame.kind === 'write') return 'swap';
    return '';
  }
  /** @param {number} i @returns {VisualState} */
  const stateB = (i) => (frame.kind === 'copy' && i === frame.at ? 'swap' : '');

  /** @param {VisualState} s */
  const stateName = (s) => (s === 'compare' ? m.states.read : s === 'swap' ? m.states.written : '');

  /** @param {number} i */
  const labelA = (i) =>
    m.cellLabel(i, frame.cells[i], addressOf(frame.base, i), stateName(stateA(i)));
  /** @param {number} i */
  const labelB = (i) =>
    m.cellLabel(i, frame.next?.[i] ?? null, addressOf(frame.nextBase, i), stateName(stateB(i)));

  const pointersA = $derived([
    { name: m.pointerSize, index: frame.size },
    ...(frame.kind === 'copy' ? [{ name: m.pointerI, index: frame.at }] : []),
  ]);
  const pointersB = $derived(frame.kind === 'copy' ? [{ name: m.pointerI, index: frame.at }] : []);

  const readText = $derived.by(() => {
    if (selected < 0 || selected >= frame.capacity) return m.readHint;
    const v = frame.cells[selected];
    if (v === null) return m.readSpare(selected);
    return m.readLine(selected, frame.base, ELEMENT_BYTES, addressOf(frame.base, selected), v);
  });

  // A push that is resizing counts as started, so its copies are not spread over the
  // pushes that already finished.
  const started = $derived(
    frame.writes +
      (frame.kind === 'allocate' || frame.kind === 'copy' || frame.kind === 'free' ? 1 : 0),
  );
  const average = $derived(started === 0 ? 0 : (frame.writes + frame.copies) / started);
  const pushChips = $derived(
    Array.from({ length: frame.n }, (_, k) => ({
      label: String(pushedValue(k + 1)),
      hot: k + 1 === frame.op && frame.kind !== 'done' && frame.kind !== 'start',
    })),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitCapacity();
      commitPushes();
    }}
  >
    <SegmentedControl
      legend={m.growthLegend}
      name="growth"
      options={growthOptions}
      bind:value={growth}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.capacityLabel}
      <input
        type="number"
        name="capacity"
        min={MIN_CAPACITY}
        max={MAX_CAPACITY}
        step="1"
        class="field w-24"
        bind:value={capacityDraft}
        onchange={commitCapacity}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.pushesLabel}
      <input
        type="number"
        name="pushes"
        min="0"
        max={MAX_PUSHES}
        step="1"
        class="field w-24"
        bind:value={pushesDraft}
        onchange={commitPushes}
      />
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.blockA}
        </h2>
        <p class="mb-2 font-mono text-xs text-slate-600 tabular-nums">
          {m.blockLine(frame.base, frame.capacity, ELEMENT_BYTES)}
        </p>
        <ArrayStrip
          values={shown(frame.cells)}
          ariaLabel={m.blockAria}
          stateOf={stateA}
          labelOf={labelA}
          dimmed={(i) => frame.cells[i] === null}
          pointers={pointersA}
          onselect={(i) => (selected = i)}
          {selected}
          speed={player.speed}
        />
        {#if frame.next}
          <h2 class="mt-4 mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.blockB}
          </h2>
          <p class="mb-2 font-mono text-xs text-slate-600 tabular-nums">
            {m.blockLine(frame.nextBase, frame.next.length, ELEMENT_BYTES)}
          </p>
          <ArrayStrip
            values={shown(frame.next)}
            ariaLabel={m.blockBAria}
            stateOf={stateB}
            labelOf={labelB}
            dimmed={(i) => frame.next?.[i] === null}
            pointers={pointersB}
            speed={player.speed}
          />
        {/if}
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 {STATE_BG['']}"></span>
            {m.legend.stored}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 opacity-40 {STATE_BG['']}"
            ></span>
            {m.legend.spare}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.compare}"></span>
            {m.legend.read}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.swap}"></span>
            {m.legend.written}
          </li>
        </ul>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <h2 class="mb-1 text-xs text-slate-500">{m.readTitle}</h2>
        <p class="tabular-nums" data-testid="read-line">{readText}</p>
      </section>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.size} / {frame.capacity}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.spare}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.capacity - frame.size}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.opCopies}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.opCopies}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.copies}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.copies}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.resizes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.resizes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.average}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {Number.isInteger(average) ? average : average.toFixed(2)}
          </dd>
        </div>
      </dl>

      <ChipList
        title={m.pushesTitle}
        items={pushChips}
        emptyText={m.pushesEmpty}
        hotLabel={m.pushesHot}
        limit={MAX_PUSHES}
      />

      <CodePanel lines={code} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
