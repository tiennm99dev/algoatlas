<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import LinkedListView from '$lib/components/linked-list-view.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    CAPACITY,
    MAX_ITEMS,
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    makeStackOps,
    stackPseudocode,
    stackTrace,
  } from '$lib/algo-engine/stacks.js';
  import { en as m } from '$lib/lessons/stacks/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/stacks.js').StackOp} StackOp */
  /** @typedef {import('$lib/algo-engine/stacks.js').StackImpl} StackImpl */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRESETS = /** @type {const} */ (['plates', 'overflow', 'underflow', 'random']);
  const implOptions = /** @type {StackImpl[]} */ (['array', 'linked']).map((v) => ({
    value: v,
    label: m.impls[v],
  }));

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeStackOps('plates');
  /** @type {StackOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let impl = $state(/** @type {StackImpl} */ ('array'));
  let value = $state(7);
  /** @type {number | null} */
  let valueDraft = $state(7);
  let preset = $state('plates');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(stackTrace(INITIAL_OPS, 'array'));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
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

  /** @param {StackOp[]} next @param {'first'|'last'|'op'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    const frames = stackTrace(next, impl);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'op') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function changeImpl() {
    setOps(ops, 'first');
  }

  /** @param {StackOp['type']} type */
  function add(type) {
    if (type === 'push') {
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
    if (type === 'push' && impl === 'linked' && finalFrame.items.length >= MAX_ITEMS) {
      say(m.drawingFull);
      return;
    }
    preset = '';
    setOps([...ops, type === 'push' ? { type, value } : { type }], 'op');
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
    setOps(makeStackOps(picked, Math.random), 'first');
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** State of the item at stack index i (0 = bottom). @param {number} i @returns {VisualState} */
  function itemState(i) {
    if (i !== frame.top) return '';
    if (frame.kind === 'push' || frame.kind === 'link') return 'active';
    if (frame.kind === 'check-empty') return 'compare';
    if (frame.kind === 'peek') return 'sorted';
    return '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;

  const plates = $derived(
    frame.items.map((v, i) => {
      const s = itemState(i);
      return { label: String(v), state: s, marker: MARKERS[s] ?? '' };
    }),
  );

  /** Array slot state: the top slot as above, plus the slot a pop just read. @param {number} i */
  function slotState(i) {
    if (frame.kind === 'pop' && i === frame.top + 1) return /** @type {VisualState} */ ('sorted');
    return itemState(i);
  }

  const listNodes = $derived([
    ...(frame.fresh === null
      ? []
      : [
          {
            id: 'new',
            label: String(frame.fresh),
            state: /** @type {VisualState} */ ('active'),
            marker: '+',
          },
        ]),
    ...frame.items
      .map((v, i) => {
        const s = itemState(i);
        return { id: `n${i}`, label: String(v), state: s, marker: MARKERS[s] ?? '' };
      })
      .reverse(),
  ]);
  const listPointers = $derived([
    {
      name: 'top',
      index: frame.items.length === 0 ? listNodes.length : frame.fresh === null ? 0 : 1,
    },
    ...(frame.fresh === null ? [] : [{ name: 'node', index: 0 }]),
  ]);

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['active', m.markers.active, m.legend.active],
    ['compare', m.markers.compare, m.legend.compare],
    ['sorted', m.markers.sorted, m.legend.sorted],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the value field submits the form, which pushes; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add('push');
    }}
  >
    <SegmentedControl
      legend={m.implLabel}
      name="impl"
      options={implOptions}
      bind:value={impl}
      onchange={changeImpl}
    />
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
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.push}</button>
      <button type="button" class="btn-secondary" onclick={() => add('pop')}>{m.pop}</button>
      <button type="button" class="btn-outline" onclick={() => add('peek')}>{m.peek}</button>
    </div>
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
        <div class="grid items-end gap-4 sm:grid-cols-[auto_1fr]">
          <div>
            <h3 class="mb-1 text-xs text-slate-500">{m.platesTitle}</h3>
            <StackQueueView
              kind="stack"
              items={plates}
              ariaLabel={m.stackLabel(frame.items)}
              capacity={frame.impl === 'array' ? CAPACITY : 0}
              speed={player.speed}
            />
          </div>
          <div class="min-w-0">
            {#if frame.impl === 'array'}
              <h3 class="mb-1 text-xs text-slate-500">{m.arrayTitle}</h3>
              <ArrayStrip
                values={frame.slots.map((v) => (v === null ? '' : v))}
                ariaLabel={m.arrayLabel(frame.slots, frame.top)}
                stateOf={slotState}
                markerOf={(i) => MARKERS[slotState(i)] ?? ''}
                dimmed={(i) => i > frame.top && !(frame.kind === 'pop' && i === frame.top + 1)}
                pointers={frame.top >= 0 ? [{ name: 'top', index: frame.top }] : []}
                speed={player.speed}
              />
            {:else}
              <h3 class="mb-1 text-xs text-slate-500">{m.listTitle}</h3>
              <LinkedListView
                nodes={listNodes}
                pointers={listPointers}
                ariaLabel={m.listLabel(frame.items.slice().reverse(), frame.fresh)}
                speed={player.speed}
              />
            {/if}
          </div>
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {`${marker} ${label}`}
            </li>
          {/each}
          {#if frame.impl === 'array'}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-400 bg-white opacity-40"></span>
              {m.legend.stale}
            </li>
          {/if}
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
          <dd class="text-2xl font-bold tabular-nums" data-testid="size">{frame.items.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          {#if frame.impl === 'array'}
            <dt class="text-xs text-slate-500">{m.stats.top}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="top">{frame.top}</dd>
          {:else}
            <dt class="text-xs text-slate-500">{m.stats.topValue}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="top">
              {frame.items.length ? frame.items[frame.top] : m.nullLabel}
            </dd>
          {/if}
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pushes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pushes">{frame.pushes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pops}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pops">{frame.pops}</dd>
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
      <CodePanel lines={stackPseudocode[frame.impl]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
