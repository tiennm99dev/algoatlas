<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import HeapView from '$lib/components/heap-view.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_OPS,
    MAX_SIZE,
    MAX_VALUE,
    MIN_VALUE,
    binaryHeapTrace,
    heapPseudocode,
    makeHeapOps,
    sizeAfter,
  } from '$lib/algo-engine/binary-heaps.js';
  import { en as m } from '$lib/lessons/binary-heaps/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/binary-heaps.js').HeapOp} HeapOp */
  /** @typedef {import('$lib/algo-engine/binary-heaps.js').HeapKind} HeapKind */
  /** @typedef {import('$lib/algo-engine/binary-heaps.js').HeapOpsPreset} HeapOpsPreset */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRESETS = /** @type {HeapOpsPreset[]} */ (Object.keys(m.presets));
  const HEAP_OPTIONS = /** @type {HeapKind[]} */ (['min', 'max']).map((value) => ({
    value,
    label: m.heaps[value],
  }));

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeHeapOps('build');
  /** @type {HeapOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let heap = $state(/** @type {HeapKind} */ ('min'));
  // `draft` follows the field as the learner types; `value` changes only on a valid commit.
  let value = $state(12);
  /** @type {number | null} */
  let draft = $state(12);
  let preset = $state('build');
  let selected = $state(-1);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(binaryHeapTrace(INITIAL_OPS, 'min'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const lines = $derived(heapPseudocode(frame.heap));
  const size = $derived(frame.values.length);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validValue = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE;

  function commitValue() {
    if (validValue(draft)) value = /** @type {number} */ (draft);
    else draft = value;
  }

  /** Replace the log and rebuild; `at` is the frame to show. @param {HeapOp[]} next @param {'first'|'last'|'new'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    selected = -1;
    const frames = binaryHeapTrace(next, heap);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'new') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function insert() {
    if (!validValue(draft)) {
      draft = value;
      say(m.valueError);
      return;
    }
    value = /** @type {number} */ (draft);
    if (ops.length >= MAX_OPS) return say(m.logFull);
    if (sizeAfter(ops) >= MAX_SIZE) return say(m.full);
    preset = '';
    setOps([...ops, { type: 'insert', value }], 'new');
  }

  function extract() {
    if (ops.length >= MAX_OPS) return say(m.logFull);
    if (sizeAfter(ops) === 0) return say(m.emptyError);
    preset = '';
    setOps([...ops, { type: 'extract' }], 'new');
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    setOps(ops.slice(0, -1), 'last');
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    setOps([], 'first');
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {HeapOpsPreset} */ (e.currentTarget.value);
    setOps(makeHeapOps(picked, Math.random), 'first');
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  function changeHeap() {
    setOps(ops, 'last');
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    const k = frame.kind;
    if ((k === 'up-swap' || k === 'down-swap') && frame.focus.includes(i)) return 'swap';
    if ((k === 'up-root' || k === 'down-leaf' || frame.stop) && i === frame.node) return 'sorted';
    if ((k === 'up-compare' || k === 'down-compare') && frame.focus.includes(i)) {
      return i === frame.node ? 'active' : 'compare';
    }
    if (k === 'down-children' && i === frame.other) return 'frontier';
    if (k === 'down-children' && frame.focus.includes(i)) return 'compare';
    if (i === frame.node && k !== 'done') return 'active';
    return '';
  }

  /** @param {number} i */
  function markerOf(i) {
    const s = stateOf(i);
    return s ? (m.markers[/** @type {keyof typeof m.markers} */ (s)] ?? '') : '';
  }

  const chips = $derived(
    ops.map((op, i) => ({ label: m.opChip(op, heap), hot: i === frame.opIndex })),
  );
  const outChips = $derived(frame.out.map((x) => ({ label: String(x) })));

  const legend = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the value field submits the form, which inserts; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      insert();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valueLabel}
      <input
        type="number"
        name="value"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitValue}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.insert}</button>
      <button type="button" class="btn-secondary" onclick={extract}>{m.extract(heap)}</button>
    </div>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when the log empties. -->
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" class="btn-outline" onclick={undo} aria-disabled={ops.length === 0}
        >{m.undo}</button
      >
      <button type="button" class="btn-outline" onclick={reset} aria-disabled={ops.length === 0}
        >{m.reset}</button
      >
    </div>
    <SegmentedControl
      legend={m.heapLabel}
      name="heap"
      options={HEAP_OPTIONS}
      bind:value={heap}
      onchange={changeHeap}
    />
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
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.heapTitle}
        </h2>
        <HeapView
          values={frame.values}
          ariaLabel={m.heapAria(frame.values, frame.heap)}
          {stateOf}
          {markerOf}
          onselect={(i) => (selected = i)}
          {selected}
          speed={player.speed}
        />
        <p class="mt-2 text-sm text-slate-600" data-testid="slot-info">
          {selected >= 0 && selected < size ? m.slotInfo(selected, size) : m.slotHint}
        </p>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {m.markers[s]}
              {m.legend[s]}
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
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums">{size} / {MAX_SIZE}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.height}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {size > 0 ? Math.floor(Math.log2(size)) : 0}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.swaps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.swaps}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.top(frame.heap)}</dt>
          <dd class="text-2xl font-bold tabular-nums">{size > 0 ? frame.values[0] : m.noTop}</dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <ChipList title={m.outTitle} items={outChips} emptyText={m.outEmpty} limit={MAX_OPS} />
      <CodePanel {lines} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
