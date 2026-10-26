<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_DEPTH,
    PRESETS,
    SLOTS,
    addChild,
    binaryTreePseudocode,
    binaryTreeTrace,
    filled,
    leftOf,
    makeTree,
    parentOf,
    removeSubtree,
    rightOf,
  } from '$lib/algo-engine/binary-trees.js';
  import { en as m } from '$lib/lessons/binary-trees/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/binary-trees.js').Slots} Slots */
  /** @typedef {import('$lib/algo-engine/binary-trees.js').BinaryTreePreset} BinaryTreePreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first tree keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeTree('complete');
  /** @type {Slots} */
  let slots = $state.raw(INITIAL);
  /** @type {Slots[]} */
  let history = $state.raw([]);
  let selected = $state(0);
  let preset = $state('complete');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(binaryTreeTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const empty = $derived(!filled(slots, 0));
  const selectedLabel = $derived(filled(slots, selected) ? slots[selected] : null);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** Rebuilds the trace and jumps to the end so every label shows at once. @param {Slots} next */
  function load(next) {
    slots = next;
    notice = { text: '', at: -1 };
    const frames = binaryTreeTrace(next);
    player.load(frames);
    player.seek(frames.length - 1);
  }

  /** @param {Slots} next */
  function edit(next) {
    history = [...history, slots];
    preset = '';
    load(next);
  }

  /** @param {'left'|'right'} side */
  function add(side) {
    if (!empty && !filled(slots, selected)) return say(m.errors.select);
    const r = addChild(slots, empty ? -1 : selected, side);
    if (!r.ok) {
      if (r.error === 'depth') return say(m.errors.depth(MAX_DEPTH));
      if (r.error === 'taken') return say(m.errors.taken(String(selectedLabel), side));
      return say(m.errors.select);
    }
    const at = empty ? 0 : side === 'left' ? leftOf(selected) : rightOf(selected);
    edit(r.slots);
    selected = at;
  }

  function remove() {
    if (!filled(slots, selected)) return say(m.errors.select);
    const parent = parentOf(selected);
    edit(removeSubtree(slots, selected));
    selected = Math.max(0, parent);
  }

  function undo() {
    if (history.length === 0) return;
    const prev = /** @type {Slots} */ (history.at(-1));
    history = history.slice(0, -1);
    preset = '';
    load(prev);
    if (!filled(prev, selected)) selected = 0;
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {BinaryTreePreset} */ (e.currentTarget.value);
    history = [...history, slots];
    load(makeTree(picked, Math.random));
    selected = 0;
    // A random tree is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (frame.offender === i && (frame.kind === 'full' || frame.kind === 'complete')) return 'swap';
    if (frame.current === i && frame.kind !== 'full' && frame.kind !== 'complete') return 'active';
    if (frame.stack.includes(i)) return 'frontier';
    if (frame.height[i] !== null) return 'visited';
    return '';
  }

  /** @param {VisualState} s */
  const markerOf = (s) =>
    s === 'active' || s === 'frontier' || s === 'visited' || s === 'swap' ? m.markers[s] : '';

  /** @param {number} i @returns {TreeNode | null} */
  function build(i) {
    if (!filled(frame.slots, i)) return null;
    const s = stateOf(i);
    const kids = [build(leftOf(i)), build(rightOf(i))];
    return {
      id: i,
      label: String(frame.slots[i]),
      state: s,
      marker: markerOf(s),
      note: m.note(frame.depth[i], frame.height[i]) || undefined,
      children: kids.some(Boolean) ? kids : [],
    };
  }

  const roots = $derived.by(() => {
    const r = build(0);
    return r ? [r] : [];
  });

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const i = Number(node.id);
    const s = /** @type {VisualState} */ (node.state ?? '');
    const state =
      s === 'active' || s === 'frontier' || s === 'visited' || s === 'swap' ? m.states[s] : '';
    return m.nodeLabel(node.label, frame.depth[i], frame.height[i], state);
  }

  const arrayLen = $derived(Math.max(1, frame.arrayLength));
  const arrayValues = $derived(frame.slots.slice(0, arrayLen).map((v) => v ?? m.emptySlot));

  const stackChips = $derived(
    frame.stack.map((i, k, all) => ({
      label: m.stackChip(String(frame.slots[i]), /** @type {number} */ (frame.depth[i])),
      hot: k === all.length - 1,
    })),
  );

  const rootHeight = $derived(frame.height[0]);
  const stats = $derived([
    [m.stats.size, String(frame.size), 'size'],
    [m.stats.leaves, String(frame.leaves), 'leaves'],
    [
      m.stats.height,
      frame.size === 0 ? '—' : rootHeight === null ? m.notYet : String(rootHeight),
      'height',
    ],
    [m.stats.array, String(frame.arrayLength), 'array'],
  ]);

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.active} ${m.legend.active}`],
    ['frontier', `${m.markers.frontier} ${m.legend.frontier}`],
    ['visited', `${m.markers.visited} ${m.legend.visited}`],
    ['swap', `${m.markers.swap} ${m.legend.swap}`],
  ]);

  const PROPS = /** @type {const} */ (['full', 'complete', 'perfect']);

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class={labelClass}>
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <div class="flex flex-wrap gap-2">
      {#if empty}
        <button type="button" class="btn-primary" onclick={() => add('left')}>{m.addRoot}</button>
      {:else}
        <button type="button" class="btn-primary" onclick={() => add('left')}>{m.addLeft}</button>
        <button type="button" class="btn-primary" onclick={() => add('right')}>{m.addRight}</button>
        <button type="button" class="btn-outline" onclick={remove}>{m.remove}</button>
      {/if}
    </div>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when history empties. -->
    <button type="button" class="btn-outline" onclick={undo} aria-disabled={history.length === 0}
      >{m.undo}</button
    >
    <p class="text-sm text-slate-600" data-testid="selected">{m.selectedText(selectedLabel)}</p>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria(frame.size, rootHeight ?? 0)}
          labelOf={nodeLabel}
          onselect={(id) => (selected = Number(id))}
          selected={filled(slots, selected) ? selected : null}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border-2 border-teal-700 bg-white"></span>{m.legend
              .selected}
          </li>
        </ul>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.arrayTitle}
        </h2>
        <ArrayStrip
          values={arrayValues}
          ariaLabel={m.arrayAria(frame.slots.slice(0, arrayLen))}
          {stateOf}
          markerOf={(i) => markerOf(stateOf(i))}
          labelOf={(i) => m.slotLabel(i, frame.slots[i])}
          dimmed={(i) => frame.slots[i] === null}
          onselect={(i) => {
            if (filled(slots, i)) selected = i;
          }}
          selected={filled(slots, selected) ? selected : -1}
          speed={player.speed}
        />
        {#if filled(slots, selected)}
          <p class="mt-2 text-sm text-slate-600" data-testid="slot-math">
            {m.slotMath(selected, parentOf(selected), leftOf(selected), rightOf(selected), SLOTS)}
          </p>
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
        {#each stats as [label, value, id] (id)}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.propsTitle}</h2>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          {#each PROPS as p (p)}
            <dt class="font-medium text-slate-700">{m.props[p]}</dt>
            <dd class="text-slate-800" data-testid="prop-{p}">{m.verdict(frame[p])}</dd>
          {/each}
        </dl>
      </div>
      <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      <CodePanel lines={binaryTreePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
