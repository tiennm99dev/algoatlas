<script>
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_KEYS,
    MAX_OPS,
    UNIVERSES,
    keysAfter,
    levelsOf,
    makeVebOps,
    shortName,
    structureTree,
    vebPseudocode,
    vebTrace,
  } from '$lib/algo-engine/van-emde-boas.js';
  import { vi as m } from '$lib/lessons/van-emde-boas/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebOp} VebOp */
  /** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebOpType} VebOpType */
  /** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebBranch} VebBranch */
  /** @typedef {import('$lib/algo-engine/van-emde-boas.js').VebPreset} VebPreset */
  /** @typedef {import('$lib/algo-engine/van-emde-boas.js').Universe} Universe */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRESETS = /** @type {VebPreset[]} */ (Object.keys(m.presets));
  const UNIVERSE_OPTIONS = UNIVERSES.map((u) => ({
    value: String(u),
    label: m.universeOption(u),
  }));
  /** The preset a universe switch loads. @type {Record<Universe, VebPreset>} */
  const DEFAULT_PRESET = { 16: 'clrs', 256: 'wide' };
  const SUCCESSOR_KINDS = ['base', 'min-shortcut', 'combine', 'answer'];

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeVebOps('clrs');
  /** @type {VebOp[]} */
  let ops = $state.raw(INITIAL.ops);
  let universeText = $state(String(INITIAL.universe));
  const universe = $derived(/** @type {Universe} */ (Number(universeText)));
  // `draft` follows the field as the learner types; `value` changes only on a valid commit.
  let value = $state(6);
  /** @type {number | null} */
  let draft = $state(6);
  let preset = $state('clrs');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(vebTrace(INITIAL.ops, INITIAL.universe));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const r = $derived(Math.sqrt(frame.universe));
  const stored = $derived(keysAfter(ops));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validValue = (v) => wholeInRange(v, 0, universe - 1);

  const valueField = createFieldGuard();

  function commitValue() {
    if (valueField.commit(validValue(draft))) value = /** @type {number} */ (draft);
    else {
      draft = value;
      say(m.valueError(universe));
    }
  }

  /** Replace the log and rebuild; `at` is the frame to show. @param {VebOp[]} next @param {'first'|'last'|'new'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    const frames = vebTrace(next, universe);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'new') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {VebOpType} type */
  function run(type) {
    if (valueField.refused() || !validValue(draft)) {
      draft = value;
      say(m.valueError(universe));
      return;
    }
    value = /** @type {number} */ (draft);
    if (ops.length >= MAX_OPS) return say(m.logFull);
    if (type === 'insert' && stored.has(value)) return say(m.presentError(value));
    if (type === 'insert' && stored.size >= MAX_KEYS) return say(m.full);
    if (type === 'delete' && !stored.has(value)) return say(m.absentError(value));
    preset = '';
    setOps([...ops, { type, value }], 'new');
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

  /** @param {VebPreset} picked */
  function load(picked) {
    const next = makeVebOps(picked, universe, Math.random);
    universeText = String(next.universe);
    if (value >= next.universe) value = draft = 6;
    setOps(next.ops, 'first');
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {VebPreset} */ (e.currentTarget.value);
    load(picked);
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  function changeUniverse() {
    const picked = DEFAULT_PRESET[universe];
    preset = picked;
    load(picked);
  }

  /** The keys of the whole universe a local key k stands for in this frame, half-open. */
  /** @param {number} k @returns {[number, number] | null} */
  function spanOf(k) {
    if (!frame.span) return null;
    const scale = frame.span[1] - frame.span[0];
    const offset = frame.span[0] - frame.x * scale;
    return [offset + k * scale, offset + (k + 1) * scale];
  }

  const answerSpan = $derived(
    frame.op === 'successor' && frame.result !== null && SUCCESSOR_KINDS.includes(frame.kind)
      ? spanOf(frame.result)
      : null,
  );
  const rootMin = $derived(frame.nodes.find((n) => n.path === 'V')?.min ?? null);

  /** @param {number} key @returns {VisualState} */
  function keyState(key) {
    if (answerSpan && key >= answerSpan[0] && key < answerSpan[1]) return 'sorted';
    const span = frame.span;
    if (span && frame.kind !== 'answer' && key >= span[0] && key < span[1]) {
      return span[1] - span[0] === 1 ? 'active' : 'frontier';
    }
    if (key === rootMin) return 'visited';
    return '';
  }

  const bits = $derived(new Set(frame.set));
  const grid = $derived(
    Array.from({ length: r }, (_, row) =>
      Array.from({ length: r }, (_, col) => (bits.has(row * r + col) ? 1 : 0)),
    ),
  );
  const rowHeaders = $derived(Array.from({ length: r }, (_, c) => m.rowHeader(c)));
  const colHeaders = $derived(Array.from({ length: r }, (_, c) => String(c)));

  /** @param {number} row @param {number} col */
  const cellState = (row, col) => keyState(row * r + col);
  /** @param {number} row @param {number} col */
  function cellMarker(row, col) {
    const s = cellState(row, col);
    return s ? (m.markers[/** @type {keyof typeof m.markers} */ (s)] ?? '') : '';
  }
  /** @param {number} row @param {number} col */
  function cellLabel(row, col) {
    const key = row * r + col;
    const s = cellState(row, col);
    return m.cellLabel(
      key,
      bits.has(key) ? 1 : 0,
      s ? m.legend[/** @type {keyof typeof m.legend} */ (s)] : '',
    );
  }

  const WRITES = [
    'empty-insert',
    'swap-min',
    'fill-cluster',
    'set-max',
    'del-only',
    'del-base',
    'del-min',
    'del-max',
  ];

  /** @param {string} path @returns {VisualState} */
  function structState(path) {
    if (path === frame.path && frame.kind !== 'answer' && frame.kind !== 'done') {
      return WRITES.includes(frame.kind) ? 'swap' : 'active';
    }
    if (frame.stack.includes(path)) return 'frontier';
    return '';
  }

  /** @param {VebBranch} b @returns {TreeNode} */
  function toNode(b) {
    const state = structState(b.node.path);
    return {
      id: b.node.path,
      label: shortName(b.node.path),
      note: m.minMax(b.node.min, b.node.max),
      state,
      marker: state
        ? (m.structMarkers[/** @type {keyof typeof m.structMarkers} */ (state)] ?? '')
        : '',
      children: b.children.map(toNode),
    };
  }

  const roots = $derived.by(() => {
    const tree = structureTree(frame.nodes);
    return tree ? [toNode(tree)] : [];
  });
  const drawnCount = $derived(frame.nodes.length);

  /** @param {TreeNode} node */
  function structLabel(node) {
    const n = frame.nodes.find((x) => x.path === node.id);
    const s = node.state ?? '';
    const state = s ? m.states[s === 'swap' ? 'write' : s === 'frontier' ? 'open' : 'current'] : '';
    return m.structLabel(String(node.id), n?.u ?? 0, n?.min ?? null, n?.max ?? null, state);
  }

  const splitText = $derived(
    frame.x < 0 || frame.kind === 'answer' || frame.kind === 'done'
      ? m.splitIdle
      : frame.u === 2
        ? m.baseSplit(frame.x)
        : m.split(frame.x, frame.u, frame.high, frame.low),
  );

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const stackChips = $derived(frame.stack.map((p) => ({ label: p })));
  const legend = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
  const structLegend = /** @type {(keyof typeof m.structLegend)[]} */ (Object.keys(m.structLegend));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the key field submits the form, which inserts; the other buttons never submit. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    onkeydown={(e) => enterField(e, { value: () => run('insert') })}
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      run('insert');
    }}
  >
    <SegmentedControl
      legend={m.universeLabel}
      name="universe"
      options={UNIVERSE_OPTIONS}
      bind:value={universeText}
      onchange={changeUniverse}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valueLabel}
      <input
        type="number"
        name="value"
        min="0"
        max={universe - 1}
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitValue}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.ops.insert}</button>
      <button type="button" class="btn-secondary" onclick={() => run('delete')}
        >{m.ops.delete}</button
      >
      <button type="button" class="btn-secondary" onclick={() => run('successor')}
        >{m.ops.successor}</button
      >
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
          {m.gridTitle}
        </h2>
        <DpTable
          values={grid}
          ariaLabel={m.gridAria(frame.universe, frame.set)}
          {rowHeaders}
          {colHeaders}
          stateOf={cellState}
          markerOf={cellMarker}
          labelOf={cellLabel}
          speed={player.speed}
        />
        <p class="mt-2 text-sm text-slate-600" data-testid="split">{splitText}</p>
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

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          ariaLabel={m.treeAria(drawnCount)}
          labelOf={structLabel}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each structLegend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {m.structMarkers[s]}
              {m.structLegend[s]}
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
          <dt class="text-xs text-slate-500">{m.stats.keys}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.set.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.levels}</dt>
          <dd class="text-2xl font-bold tabular-nums">{levelsOf(frame.universe) + 1}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.calls}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.depth}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.depth}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.total}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.totalCalls}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.queries === 0 ? m.pending : (frame.answer ?? m.none)}
          </dd>
        </div>
      </dl>
      <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={vebPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
