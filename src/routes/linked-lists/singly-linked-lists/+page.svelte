<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_NODES,
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    NIL,
    layoutList,
    listOrder,
    listValues,
    makeOps,
    singlyPseudocode,
    singlyTrace,
  } from '$lib/algo-engine/singly-linked-lists.js';
  import { en as m } from '$lib/lessons/singly-linked-lists/copy.en.js';
  import PointerDiagram from '$lib/lessons/singly-linked-lists/pointer-diagram.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/singly-linked-lists.js').SinglyOp} SinglyOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramNode} DiagramNode */

  const PRESETS = /** @type {const} */ (['short', 'long', 'random']);

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeOps('short');
  /** @type {SinglyOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let value = $state(15);
  /** @type {number | null} */
  let valueDraft = $state(15);
  let index = $state(2);
  /** @type {number | null} */
  let indexDraft = $state(2);
  let preset = $state('short');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(singlyTrace(INITIAL_OPS));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v @param {number} lo @param {number} hi */
  const inRange = (v, lo, hi) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

  function commitValue() {
    if (inRange(valueDraft, MIN_VALUE, MAX_VALUE)) value = /** @type {number} */ (valueDraft);
    else valueDraft = value;
  }

  function commitIndex() {
    if (inRange(indexDraft, 0, MAX_NODES - 1)) index = /** @type {number} */ (indexDraft);
    else indexDraft = index;
  }

  /** @param {SinglyOp[]} next @param {'first'|'last'|'op'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    const frames = singlyTrace(next);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'op') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {SinglyOp['type']} type */
  function add(type) {
    const needsValue = type === 'insert-head' || type === 'delete';
    if (needsValue && !inRange(valueDraft, MIN_VALUE, MAX_VALUE)) {
      valueDraft = value;
      say(m.valueError);
      return;
    }
    if (type === 'get' && !inRange(indexDraft, 0, MAX_NODES - 1)) {
      indexDraft = index;
      say(m.indexError);
      return;
    }
    if (needsValue) value = /** @type {number} */ (valueDraft);
    if (type === 'get') index = /** @type {number} */ (indexDraft);
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    if (type === 'insert-head' && finalFrame.length >= MAX_NODES) {
      say(m.full);
      return;
    }
    /** @type {SinglyOp} */
    const op =
      type === 'insert-head' || type === 'delete'
        ? { type, value }
        : type === 'get'
          ? { type, index }
          : { type };
    preset = '';
    setOps([...ops, op], 'op');
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
    const picked = /** @type {'short'|'long'|'random'} */ (e.currentTarget.value);
    setOps(makeOps(picked, Math.random), 'last');
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  const order = $derived(listOrder(frame));
  const reading = $derived(
    frame.op !== null && (frame.op.type === 'get' || frame.op.type === 'delete'),
  );

  /** @param {number} slot @returns {VisualState} */
  function stateOf(slot) {
    if (slot === frame.fresh) return 'active';
    if (slot === frame.removed) return 'swap';
    if (slot === frame.cur && frame.kind === 'found') return 'sorted';
    if (slot === frame.cur && frame.kind === 'compare') return 'compare';
    if (slot === frame.cur && reading) return 'frontier';
    if (!reading || frame.kind === 'done') return '';
    const at = order.indexOf(slot);
    const curAt = frame.cur === NIL ? order.length : order.indexOf(frame.cur);
    return at >= 0 && at < curAt ? 'visited' : '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;
  /** @type {Partial<Record<VisualState, string>>} */
  const STATES = m.states;

  const diagramNodes = $derived(
    layoutList(frame).map(({ slot, col, row }) => {
      const s = stateOf(slot);
      const n = frame.nodes[slot];
      /** @type {DiagramNode} */
      const node = {
        id: slot,
        label: String(n.value),
        col,
        row,
        next: n.next === NIL ? null : n.next,
        state: s,
        marker: MARKERS[s] ?? '',
        title: m.nodeTitle(n.value, STATES[s] ?? '', row === 0),
        hotNext:
          (frame.kind === 'create' && slot === frame.fresh) ||
          (frame.kind === 'unlink' && slot === frame.prev),
        stale: slot === frame.removed,
      };
      return node;
    }),
  );

  const pointers = $derived.by(() => {
    const headHot =
      frame.kind === 'link-head' ||
      frame.kind === 'unlink-head' ||
      (frame.kind === 'unlink' && frame.prev === NIL);
    /** @type {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramPointer[]} */
    const out = [{ name: 'head', id: frame.head === NIL ? null : frame.head, hot: headHot }];
    if (frame.kind === 'create') out.push({ name: 'node', id: frame.fresh });
    if (frame.kind === 'unlink-head') out.push({ name: 'old', id: frame.removed });
    if (reading && frame.kind !== 'done') {
      if (frame.op?.type === 'delete')
        out.push({ name: 'prev', id: frame.prev === NIL ? null : frame.prev });
      if (frame.kind === 'unlink') out.push({ name: 'cur', id: frame.removed });
      else if (frame.kind !== 'free')
        out.push({ name: 'cur', id: frame.cur === NIL ? null : frame.cur });
    }
    return out;
  });

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['active', m.markers.active, m.legend.active],
    ['frontier', '', m.legend.frontier],
    ['compare', m.markers.compare, m.legend.compare],
    ['visited', '', m.legend.visited],
    ['sorted', m.markers.sorted, m.legend.sorted],
    ['swap', m.markers.swap, m.legend.swap],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field submits the form, which inserts at the head; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add('insert-head');
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
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.insertHead}</button>
      <button type="button" class="btn-secondary" onclick={() => add('delete-head')}
        >{m.deleteHead}</button
      >
      <button type="button" class="btn-outline" onclick={() => add('delete')}>{m.remove}</button>
    </div>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.indexLabel}
      <input
        type="number"
        name="index"
        min="0"
        max={MAX_NODES - 1}
        step="1"
        class="field w-20"
        bind:value={indexDraft}
        onchange={commitIndex}
      />
    </label>
    <button type="button" class="btn-outline" onclick={() => add('get')}>{m.get}</button>
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
        <PointerDiagram
          nodes={diagramNodes}
          {pointers}
          ariaLabel={m.listLabel(listValues(frame))}
          nullLabel={m.nullLabel}
          scrollLabel={m.scroller}
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
          <dt class="text-xs text-slate-500">{m.stats.steps}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="steps">{frame.steps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="writes">{frame.writes}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.length}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="length">{frame.length}</dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={singlyPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
