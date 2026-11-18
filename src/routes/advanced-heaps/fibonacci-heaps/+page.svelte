<script>
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_OPS,
    MAX_SIZE,
    MAX_VALUE,
    MIN_VALUE,
    countMarked,
    countNodes,
    fibonacciHeapTrace,
    heapPseudocode,
    keyIndex,
    liveKeys,
    makeFibOps,
    markedIds,
    potential,
  } from '$lib/algo-engine/fibonacci-heaps.js';
  import { vi as m } from '$lib/lessons/fibonacci-heaps/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibOp} FibOp */
  /** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibTree} FibTree */
  /** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibFrame} FibFrame */
  /** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').HeapVariant} HeapVariant */
  /** @typedef {import('$lib/algo-engine/fibonacci-heaps.js').FibPreset} FibPreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PRESETS = /** @type {FibPreset[]} */ (Object.keys(m.presets));
  const VARIANT_OPTIONS = /** @type {HeapVariant[]} */ (['fibonacci', 'binomial']).map((value) => ({
    value,
    label: m.variants[value],
  }));

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeFibOps('lazy');
  /** @type {FibOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let variant = $state(/** @type {HeapVariant} */ ('fibonacci'));
  // Each field's draft follows typing; the committed value changes only on a valid commit.
  let value = $state(12);
  /** @type {number | null} */
  let draft = $state(12);
  let newKey = $state(1);
  /** @type {number | null} */
  let keyDraft = $state(1);
  let preset = $state('lazy');
  let selected = $state(-1);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(fibonacciHeapTrace(INITIAL_OPS, 'fibonacci'));
  const frame = $derived(player.frame);

  /** Every item's key in the shown frame. */
  const keys = $derived(keyIndex(frame.trees));
  /** @param {number} id */
  const keyOf = (id) => keys.get(id);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, keyOf));
  const lines = $derived(heapPseudocode(frame.variant));
  const size = $derived(countNodes(frame.trees));
  const live = $derived(liveKeys(ops));
  // The key each decrease started from, read off the trace, for the operation chips.
  const oldKeys = $derived(
    new Map(player.frames.filter((f) => f.kind === 'decrease').map((f) => [f.opIndex, f.old])),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validValue = (v) => wholeInRange(v, MIN_VALUE, MAX_VALUE);

  const valueField = createFieldGuard();
  const keyField = createFieldGuard();

  function commitValue() {
    if (valueField.commit(validValue(draft))) value = /** @type {number} */ (draft);
    else {
      draft = value;
      say(m.valueError);
    }
  }

  function commitKey() {
    if (keyField.commit(validValue(keyDraft))) newKey = /** @type {number} */ (keyDraft);
    else {
      keyDraft = newKey;
      say(m.valueError);
    }
  }

  /** Replace the log and rebuild; `at` is the frame to show. @param {FibOp[]} next @param {'first'|'last'|'new'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    const frames = fibonacciHeapTrace(next, variant);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'new') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function insert() {
    if (valueField.refused() || !validValue(draft)) {
      draft = value;
      say(m.valueError);
      return;
    }
    value = /** @type {number} */ (draft);
    if (ops.length >= MAX_OPS) return say(m.logFull);
    if (live.size >= MAX_SIZE) return say(m.full);
    preset = '';
    setOps([...ops, { type: 'insert', value }], 'new');
  }

  function extract() {
    if (ops.length >= MAX_OPS) return say(m.logFull);
    if (live.size === 0) return say(m.emptyError);
    preset = '';
    setOps([...ops, { type: 'extract' }], 'new');
  }

  function decrease() {
    if (keyField.refused() || !validValue(keyDraft)) {
      keyDraft = newKey;
      say(m.valueError);
      return;
    }
    newKey = /** @type {number} */ (keyDraft);
    if (selected < 0) return say(m.pickFirst);
    const current = live.get(selected);
    if (current === undefined) return say(m.goneError);
    if (newKey >= current) return say(m.notSmaller(current));
    if (ops.length >= MAX_OPS) return say(m.logFull);
    preset = '';
    setOps([...ops, { type: 'decrease', id: selected, value: newKey }], 'new');
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    setOps(ops.slice(0, -1), 'last');
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    selected = -1;
    setOps([], 'first');
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {FibPreset} */ (e.currentTarget.value);
    selected = -1;
    setOps(makeFibOps(picked, Math.random), 'first');
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  function changeVariant() {
    setOps(ops, 'last');
  }

  /** @param {FibTree} t @returns {VisualState} */
  function stateOf(t) {
    const f = frame;
    const k = f.kind;
    if (k !== 'done' && k !== 'start') {
      if (k === 'link' || k === 'carry-link') {
        if (t.id === f.node) return 'active';
        if (t.id === f.other) return 'swap';
      } else if (k === 'cut' || k === 'cascade' || k === 'sift') {
        if (t.id === f.node) return 'swap';
        if (t.id === f.other) return 'compare';
      } else {
        if (t.id === f.node) return 'active';
        if (t.id === f.other) return 'compare';
      }
    }
    if (t.id === f.minId) return 'sorted';
    if (t.mark) return 'visited';
    return '';
  }

  /** @param {FibTree} t @returns {TreeNode} */
  function toNode(t) {
    const state = stateOf(t);
    return {
      id: t.id,
      label: String(t.key),
      state,
      marker: state ? (m.markers[/** @type {keyof typeof m.markers} */ (state)] ?? '') : '',
      children: t.children.map(toNode),
    };
  }

  const roots = $derived(frame.trees.map(toNode));

  /** @param {TreeNode} node @param {number} depth */
  function labelOf(node, depth) {
    const id = /** @type {number} */ (node.id);
    const notes = [];
    if (id === frame.minId) notes.push(m.nodeNotes.min);
    if (marked.has(id)) notes.push(m.nodeNotes.marked);
    if (node.state === 'active' || node.state === 'swap') notes.push(m.nodeNotes.active);
    if (node.state === 'compare') notes.push(m.nodeNotes.other);
    return m.nodeLabel(Number(node.label), notes, depth);
  }

  const marked = $derived(markedIds(frame.trees));

  // Padded to the degree in play, so the empty slot a scan looks at is drawn too.
  const tableKeys = $derived(
    Array.from({ length: Math.max(frame.table.length, frame.degree + 1) }, (_, d) => {
      const id = frame.table[d] ?? null;
      return id === null ? null : (keyOf(id) ?? null);
    }),
  );
  const consolidating = $derived(['scan', 'link', 'slot'].includes(frame.kind));

  /** @param {number} d @returns {VisualState} */
  function tableState(d) {
    if (d !== frame.degree) return (frame.table[d] ?? null) === null ? '' : 'frontier';
    if (frame.kind === 'slot') return 'sorted';
    return 'active';
  }

  const chips = $derived(
    ops.map((op, i) => ({ label: m.opChip(op, oldKeys.get(i)), hot: i === frame.opIndex })),
  );
  const outChips = $derived(frame.out.map((x) => ({ label: String(x) })));
  const minKey = $derived(frame.minId === null ? null : keyOf(frame.minId));
  const selectedKey = $derived(selected >= 0 ? live.get(selected) : undefined);

  const legend = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a key field runs that field's operation; the other buttons never submit. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    onkeydown={(e) => enterField(e, { value: () => insert(), key: () => decrease() })}
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
      <button type="button" class="btn-secondary" onclick={extract}>{m.extract}</button>
    </div>
    <div class="flex flex-wrap items-end gap-2 border-l border-slate-300 pl-4">
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.newKeyLabel}
        <input
          type="number"
          name="key"
          min={MIN_VALUE}
          max={MAX_VALUE}
          step="1"
          class="field w-24"
          bind:value={keyDraft}
          onchange={commitKey}
        />
      </label>
      <button type="button" class="btn-secondary" onclick={decrease}>{m.decrease}</button>
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
      legend={m.variantLabel}
      name="variant"
      options={VARIANT_OPTIONS}
      bind:value={variant}
      onchange={changeVariant}
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
          {m.forestTitle}
        </h2>
        <TreeView
          {roots}
          ariaLabel={m.forestAria(frame.trees.length, size)}
          emptyText={m.emptyForest}
          {labelOf}
          onselect={(id) => (selected = /** @type {number} */ (id))}
          {selected}
          speed={player.speed}
        />
        <p class="mt-2 text-sm text-slate-600" data-testid="selected-info">
          {selectedKey === undefined ? m.selectHint : m.selectedInfo(selectedKey)}
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

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        {#if consolidating && tableKeys.length > 0}
          <ArrayStrip
            values={tableKeys.map((k) => (k === null ? '—' : k))}
            ariaLabel={m.tableAria(tableKeys)}
            stateOf={tableState}
            speed={player.speed}
          />
        {:else}
          <p class="text-sm text-slate-500">{m.tableIdle}</p>
        {/if}
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
          <dt class="text-xs text-slate-500">{m.stats.min}</dt>
          <dd class="text-2xl font-bold tabular-nums">{minKey ?? m.noMin}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.roots}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.trees.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.marked}</dt>
          <dd class="text-2xl font-bold tabular-nums">{countMarked(frame.trees)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.links}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.links}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">
            {frame.variant === 'fibonacci' ? m.stats.cuts : m.stats.siftSwaps}
          </dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.variant === 'fibonacci' ? frame.cuts : frame.siftSwaps}
          </dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.potential}</dt>
          <dd class="text-2xl font-bold tabular-nums">{potential(frame.trees)}</dd>
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
