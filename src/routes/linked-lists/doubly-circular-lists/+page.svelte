<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_NODES,
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    NIL,
    SENTINEL,
    backwardValues,
    doublyOrder,
    doublyPseudocode,
    doublyTrace,
    doublyValues,
    layoutDoubly,
    liveSlots,
    makeOps,
  } from '$lib/algo-engine/doubly-circular-lists.js';
  import { en as m } from '$lib/lessons/doubly-circular-lists/copy.en.js';
  import PointerDiagram from '$lib/lessons/singly-linked-lists/pointer-diagram.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/doubly-circular-lists.js').DoublyOp} DoublyOp */
  /** @typedef {import('$lib/algo-engine/doubly-circular-lists.js').ListMode} ListMode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramNode} DiagramNode */
  /** @typedef {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramPointer} DiagramPointer */

  const PRESETS = /** @type {const} */ (['back', 'front', 'random']);
  const MODES = /** @type {const} */ (['sentinel', 'plain']);

  // A fixed first log keeps the prerendered HTML and the hydrated page identical. It ends on a
  // removal so the first steps show both pointer updates.
  /** @type {DoublyOp[]} */
  const INITIAL_OPS = [...makeOps('back'), { type: 'remove', slot: 1 }];
  /** @type {DoublyOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  /** @type {ListMode} */
  let mode = $state('sentinel');
  let value = $state(25);
  /** @type {number | null} */
  let valueDraft = $state(25);
  /** @type {number | null} */
  let selected = $state(null);
  let preset = $state('');
  let notice = $state({ text: '', at: -1 });

  const initialFrames = doublyTrace(INITIAL_OPS, 'sentinel');
  const player = createPlayer(initialFrames);
  player.seek(initialFrames.findIndex((f) => f.opIndex === INITIAL_OPS.length - 1));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {DoublyOp[]} next @param {'first'|'last'|'op'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    if (selected !== null && !liveSlots(next).includes(selected)) selected = null;
    const frames = doublyTrace(next, mode);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'op') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function changeMode() {
    setOps(ops, 'last');
  }

  function commitValue() {
    const v = valueDraft;
    if (typeof v === 'number' && Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE) value = v;
    else valueDraft = value;
  }

  /** @param {'push-front'|'push-back'} type */
  function insert(type) {
    const v = valueDraft;
    if (!(typeof v === 'number' && Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE)) {
      valueDraft = value;
      say(m.valueError);
      return;
    }
    value = v;
    if (ops.length >= MAX_OPS) return say(m.logFull);
    if (finalFrame.length >= MAX_NODES) return say(m.full);
    preset = '';
    setOps([...ops, { type, value: v }], 'op');
  }

  function remove() {
    if (selected === null) return say(m.pickFirst);
    if (ops.length >= MAX_OPS) return say(m.logFull);
    const slot = selected;
    selected = null;
    preset = '';
    setOps([...ops, { type: 'remove', slot }], 'op');
  }

  /** @param {number} id */
  function pick(id) {
    if (id === SENTINEL) return say(m.sentinelPick);
    if (!liveSlots(ops).includes(id)) return say(m.gonePick);
    selected = id;
    notice = { text: '', at: -1 };
    player.seek(player.frames.length - 1);
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
    const picked = /** @type {'back'|'front'|'random'} */ (e.currentTarget.value);
    setOps(makeOps(picked, Math.random), 'last');
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  const order = $derived(doublyOrder(frame));
  const inserting = $derived(frame.op !== null && frame.op.type !== 'remove');

  /** @param {number} id @returns {VisualState} */
  function stateOf(id) {
    if (id === SENTINEL) return 'visited';
    if (id === frame.node) return inserting ? 'active' : 'swap';
    if (id === selected && frame.kind === 'done') return 'frontier';
    return '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;
  /** @type {Partial<Record<VisualState, string>>} */
  const STATES = m.states;

  /** @param {number} id */
  const ref = (id) => (id === NIL ? null : id);

  const diagramNodes = $derived(
    layoutDoubly(frame).map(({ id, col, row }) => {
      const s = stateOf(id);
      const fields = id === SENTINEL ? frame.sentinel : frame.nodes[id];
      const label = id === SENTINEL ? 'S' : String(frame.nodes[id].value);
      /** @type {DiagramNode} */
      const node = {
        id,
        label,
        col,
        row,
        next: ref(fields.next),
        prev: ref(fields.prev),
        state: s,
        marker: MARKERS[s] ?? '',
        title: m.nodeTitle(label, id === SENTINEL ? '' : (STATES[s] ?? ''), order.includes(id)),
        hotNext: frame.hot.some((h) => h.id === id && h.field === 'next'),
        hotPrev: frame.hot.some((h) => h.id === id && h.field === 'prev'),
        stale: !inserting && id === frame.node && !order.includes(id),
      };
      return node;
    }),
  );

  const pointers = $derived.by(() => {
    /** @type {DiagramPointer[]} */
    const out = [];
    if (mode === 'plain') {
      out.push({ name: 'head', id: ref(frame.head), hot: frame.hotVars.includes('head') });
      out.push({ name: 'tail', id: ref(frame.tail), hot: frame.hotVars.includes('tail') });
    }
    if (frame.after !== NIL) out.push({ name: 'x', id: frame.after });
    if (frame.node !== NIL) out.push({ name: 'n', id: frame.node });
    return out;
  });

  const removedValues = $derived(
    ops.map(
      (_, i) => player.frames.find((f) => f.opIndex === i && f.kind === 'select')?.value ?? null,
    ),
  );
  const chips = $derived(
    ops.map((op, i) => ({ label: m.opChip(op, removedValues[i]), hot: i === frame.opIndex })),
  );
  const selectedLabel = $derived(
    selected === null ? m.noneSelected : String(finalFrame.nodes[selected]?.value),
  );

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['visited', '', m.legend.visited],
    ['active', m.markers.active, m.legend.active],
    ['swap', m.markers.swap, m.legend.swap],
    ['frontier', m.markers.frontier, m.legend.frontier],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      insert('push-back');
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
      onchange={changeMode}
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
      <button type="button" class="btn-secondary" onclick={() => insert('push-front')}
        >{m.pushFront}</button
      >
      <button type="submit" class="btn-primary">{m.pushBack}</button>
      <!-- aria-disabled rather than disabled so focus stays on the button after a removal. -->
      <button type="button" class="btn-outline" aria-disabled={selected === null} onclick={remove}
        >{m.remove}</button
      >
    </div>
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
        <PointerDiagram
          nodes={diagramNodes}
          {pointers}
          doubly
          ariaLabel={m.listLabel(doublyValues(frame), backwardValues(frame), mode)}
          nullLabel={m.nullLabel}
          scrollLabel={m.scroller}
          onselect={pick}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend.filter(([s]) => mode === 'sentinel' || s !== 'visited') as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker ? `${marker} ${label}` : label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="h-0.5 w-4 bg-teal-700"></span>
            {m.legend.hot}
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
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="writes">{frame.writes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.special}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="special">{frame.special}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.length}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="length">{frame.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.selected}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="selected">{selectedLabel}</dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={doublyPseudocode[mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
