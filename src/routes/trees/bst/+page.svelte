<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_NODES,
    MAX_OPS,
    bstPseudocode,
    bstTrace,
    inorderKeys,
    layoutTree,
    makeOps,
  } from '$lib/algo-engine/bst.js';
  import { en as m } from '$lib/lessons/bst/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/bst.js').BstOp} BstOp */
  /** @typedef {'compare'|'path'|'found'|'new'|'removing'|'successor'|''} NodeState */

  const PRESETS = /** @type {const} */ (['balanced', 'sorted', 'random']);
  const CELL_W = 40;
  const CELL_H = 48;
  // Below this share of the natural drawing width the key text drops under about 11px, so the
  // scroller takes over instead of shrinking the tree further.
  const MIN_SCALE = 0.85;

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeOps('balanced');
  /** @type {BstOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  // `draft` follows the input as the learner types; `key` changes only on a valid commit.
  let key = $state(45);
  /** @type {number | null} */
  let draft = $state(45);
  let preset = $state('balanced');
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(bstTrace(INITIAL_OPS));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function clearNotice() {
    notice = { text: '', at: -1 };
  }

  /** @param {unknown} v */
  const validKey = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 99;

  function commitKey() {
    if (validKey(draft)) key = /** @type {number} */ (draft);
    else draft = key;
  }

  /** Replace the log and rebuild; `at` picks the frame to show. @param {BstOp[]} next @param {'first'|'last'|number} at */
  function setOps(next, at) {
    ops = next;
    const frames = bstTrace(next);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at !== 'first') player.seek(at);
  }

  /** @param {BstOp['type']} type */
  function add(type) {
    if (!validKey(draft)) {
      draft = key;
      say(m.keyError);
      return;
    }
    key = /** @type {number} */ (draft);
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    if (
      type === 'insert' &&
      finalFrame.size >= MAX_NODES &&
      !inorderKeys(finalFrame).includes(key)
    ) {
      say(m.full);
      return;
    }
    clearNotice();
    preset = '';
    const next = [...ops, { type, key }];
    const frames = bstTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function undo() {
    if (ops.length === 0) return;
    clearNotice();
    preset = '';
    setOps(ops.slice(0, -1), 'last');
  }

  function reset() {
    if (ops.length === 0) return;
    clearNotice();
    preset = '';
    setOps([], 'first');
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {'balanced'|'sorted'|'random'} */ (e.currentTarget.value);
    clearNotice();
    setOps(makeOps(picked, Math.random), 'last');
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  const layout = $derived(layoutTree(frame));
  const keys = $derived(inorderKeys(frame));
  const vbW = $derived(Math.max(1, frame.size) * CELL_W);
  const vbH = $derived(Math.max(1, frame.height) * CELL_H);
  const rootKey = $derived(frame.root >= 0 ? frame.nodes[frame.root].key : null);
  const idealHeight = $derived(Math.ceil(Math.log2(frame.size + 1)));

  /** @param {number} slot @returns {NodeState} */
  function stateOf(slot) {
    const two = frame.succ >= 0;
    if (frame.kind === 'insert' && frame.current === slot) return 'new';
    if (frame.kind === 'relink' && two && frame.succ === slot) return 'removing';
    if (frame.kind === 'successor' && frame.succ === slot) return 'successor';
    if (
      (frame.kind === 'found' || frame.kind === 'dup' || frame.kind === 'relink') &&
      frame.current === slot
    )
      return 'found';
    if (frame.kind !== 'done' && frame.current === slot) return 'compare';
    return frame.path.includes(slot) ? 'path' : '';
  }

  /** Filled circles use dark or light text to stay readable on their state color. */
  const FILL = {
    compare: 'fill-state-compare',
    path: 'fill-state-visited',
    found: 'fill-state-sorted',
    new: 'fill-state-active',
    removing: 'fill-state-swap',
    successor: 'fill-state-frontier',
    '': 'fill-white stroke-slate-400',
  };
  const DARK_TEXT = new Set(['compare', 'path', 'successor', '']);

  const nodes = $derived(
    layout.flatMap((p, slot) => {
      const k = frame.nodes[slot].key;
      if (!p || k === null) return [];
      const state = stateOf(slot);
      return [
        { slot, key: k, state, cx: p.x * CELL_W + CELL_W / 2, cy: p.y * CELL_H + CELL_H / 2 },
      ];
    }),
  );

  const edges = $derived(
    layout.flatMap((p, slot) => {
      if (!p) return [];
      return /** @type {const} */ (['left', 'right']).flatMap((side) => {
        const child = frame.nodes[slot][side];
        const c = child >= 0 ? layout[child] : null;
        if (!c) return [];
        return [
          {
            id: `${slot}-${side}`,
            x1: p.x * CELL_W + CELL_W / 2,
            y1: p.y * CELL_H + CELL_H / 2,
            x2: c.x * CELL_W + CELL_W / 2,
            y2: c.y * CELL_H + CELL_H / 2,
          },
        ];
      });
    }),
  );

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const legend = $derived(
    /** @type {const} */ (['compare', 'path', 'found', 'new', 'removing', 'successor']).map(
      (s) => ({
        s,
        fill: FILL[s].replace('fill-', 'bg-'),
        marker: m.markers[s] ?? '',
        label: m.legend[s],
      }),
    ),
  );
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the key field submits the form, which inserts; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add('insert');
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.keyLabel}
      <input
        type="number"
        name="key"
        min="0"
        max="99"
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitKey}
      />
    </label>

    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.insert}</button>
      <button type="button" onclick={() => add('search')} class="btn-secondary">{m.search}</button>
      <button type="button" onclick={() => add('delete')} class="btn-outline">{m.remove}</button>
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
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <!-- Layout is a pure function of the frame; the viewBox grows with node count and height.
             The drawing keeps a readable minimum width and scrolls sideways when the card is narrower. -->
        <!-- A scrollable region must be keyboard focusable. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="overflow-x-auto" tabindex="0" role="group" aria-label={m.treeScroller}>
          <svg
            viewBox="0 0 {vbW} {vbH}"
            role="img"
            aria-label={m.treeLabel(keys, frame.height, rootKey, idealHeight)}
            class="mx-auto h-auto"
            style="width: {vbW * 1.2}px; min-width: {vbW * MIN_SCALE}px; max-width: 100%"
          >
            {#each edges as e (e.id)}
              <line
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                class="stroke-slate-400"
                stroke-width="1.5"
              />
            {/each}
            {#each nodes as n (n.slot)}
              <g>
                <title>{m.nodeLabel(n.key, n.state ? m.states[n.state] : '')}</title>
                <circle
                  cx={n.cx}
                  cy={n.cy}
                  r="16"
                  stroke-width={n.state === '' ? 1.5 : 2.5}
                  class="{FILL[n.state]} {n.state === '' ? '' : 'stroke-slate-900'} {player.speed <
                  8
                    ? 'transition-colors'
                    : ''}"
                />
                <text
                  x={n.cx}
                  y={n.cy}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="13"
                  font-weight="600"
                  class={DARK_TEXT.has(n.state) ? 'fill-slate-900' : 'fill-white'}>{n.key}</text
                >
                {#if n.state !== '' && n.state !== 'path'}
                  <text
                    x={n.cx + 13}
                    y={n.cy - 13}
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="11"
                    font-weight="700"
                    stroke="white"
                    stroke-width="3"
                    stroke-linejoin="round"
                    paint-order="stroke"
                    class="fill-slate-900">{m.markers[n.state]}</text
                  >
                {/if}
              </g>
            {/each}
          </svg>
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as l (l.s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {l.fill}"></span>
              {l.marker ? `${l.marker} ${l.label}` : l.label}
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

    <div class="flex flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.height}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.height}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.size}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.size}</dd>
        </div>
      </dl>
      <p class="text-sm text-slate-600">{m.balanced(idealHeight)}</p>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={bstPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>
</LessonLayout>
