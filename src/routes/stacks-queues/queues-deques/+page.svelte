<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    CAPACITY,
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    dequePseudocode,
    dequeTrace,
    makeDequeOps,
  } from '$lib/algo-engine/queues-deques.js';
  import { en as m } from '$lib/lessons/queues-deques/copy.en.js';
  import RingBuffer from '$lib/components/ring-buffer.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/queues-deques.js').DequeOp} DequeOp */
  /** @typedef {import('$lib/algo-engine/queues-deques.js').DequeOpType} DequeOpType */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRESETS = /** @type {const} */ (['queue', 'wrap', 'deque', 'full', 'random']);

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeDequeOps('queue');
  /** @type {DequeOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let value = $state(17);
  /** @type {number | null} */
  let valueDraft = $state(17);
  let preset = $state('queue');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(dequeTrace(INITIAL_OPS));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const valid = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE;

  function commitValue() {
    if (valid(valueDraft)) value = /** @type {number} */ (valueDraft);
    else valueDraft = value;
  }

  /** @param {DequeOp[]} next @param {'first'|'last'|'op'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    const frames = dequeTrace(next);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'op') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {DequeOpType} type */
  function add(type) {
    const adding = type === 'push-back' || type === 'push-front';
    if (adding) {
      if (!valid(valueDraft)) {
        valueDraft = value;
        say(m.valueError);
        return;
      }
      value = /** @type {number} */ (valueDraft);
    }
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    preset = '';
    setOps([...ops, adding ? { type, value } : { type }], 'op');
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
    const picked = /** @type {(typeof PRESETS)[number]} */ (e.currentTarget.value);
    setOps(makeDequeOps(picked, Math.random), 'first');
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} i */
  const inUse = (i) => (i - frame.head + CAPACITY) % CAPACITY < frame.size;

  /** @param {number} i @returns {VisualState} */
  function slotState(i) {
    if (i === frame.at) return frame.result === null ? 'active' : 'sorted';
    return inUse(i) ? 'frontier' : '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;
  /** @type {Partial<Record<VisualState, string>>} */
  const STATES = m.states;

  /** The queue in order; a value just popped is shown at the end it left from. */
  const row = $derived.by(() => {
    const items = frame.items.map((v, k) => {
      const slot = (frame.head + k) % CAPACITY;
      const s = slot === frame.at ? 'active' : /** @type {VisualState} */ ('');
      return { label: String(v), state: s, marker: MARKERS[s] ?? '' };
    });
    if (frame.result === null) return items;
    const gone = {
      label: String(frame.result),
      state: /** @type {VisualState} */ ('sorted'),
      marker: '✓',
    };
    return frame.kind === 'pop-front' ? [gone, ...items] : [...items, gone];
  });

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['frontier', '', m.legend.frontier],
    ['active', m.markers.active, m.legend.active],
    ['sorted', m.markers.sorted, m.legend.sorted],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the value field submits the form, which enqueues; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add('push-back');
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
        bind:value={valueDraft}
        onchange={commitValue}
      />
    </label>
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >{m.queueGroup}</legend
      >
      <div class="flex flex-wrap gap-2">
        <button type="submit" class="btn-primary">{m.ops['push-back']}</button>
        <button type="button" class="btn-secondary" onclick={() => add('pop-front')}
          >{m.ops['pop-front']}</button
        >
      </div>
    </fieldset>
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >{m.dequeGroup}</legend
      >
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-outline" onclick={() => add('push-front')}
          >{m.ops['push-front']}</button
        >
        <button type="button" class="btn-outline" onclick={() => add('pop-back')}
          >{m.ops['pop-back']}</button
        >
      </div>
    </fieldset>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when the log empties. -->
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" onclick={undo} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.undo}</button
      >
      <button type="button" onclick={reset} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.reset}</button
      >
    </div>
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
        <h3 class="mb-1 text-xs text-slate-500">{m.ringTitle}</h3>
        <RingBuffer
          labels={frame.slots.map((v) => (v === null ? '' : String(v)))}
          ariaLabel={m.ringLabel(frame)}
          head={frame.head}
          tail={frame.tail}
          headLabel={m.headLabel}
          tailLabel={m.tailLabel}
          titleOf={(i) => m.slotTitle(i, frame.slots[i], inUse(i), STATES[slotState(i)] ?? '')}
          stateOf={slotState}
          markerOf={(i) => MARKERS[slotState(i)] ?? ''}
          dimmed={(i) => slotState(i) === '' && frame.slots[i] !== null}
          speed={player.speed}
        />
        <h3 class="mt-4 mb-1 text-xs text-slate-500">{m.rowTitle}</h3>
        <StackQueueView kind="deque" items={row} speed={player.speed} />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker ? `${marker} ${label}` : label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 bg-white opacity-40"></span>
            {m.legend.stale}
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
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="size">{frame.size}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.head}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="head">{frame.head}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.tail}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tail">{frame.tail}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.wraps}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="wraps">{frame.wraps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.ringShifts}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="ring-shifts">0</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naiveShifts}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="naive-shifts">
            {frame.naiveShifts}
          </dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="result">
            {frame.result ?? m.none}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={dequePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
