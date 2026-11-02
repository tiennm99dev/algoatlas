<script>
  import { createFieldGuard, enterField } from '$lib/components/numeric-field.js';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';
  import {
    MAX_KEY,
    MAX_KEYS,
    MAX_OPS,
    MIN_KEY,
    ORDERS,
    bTreePseudocode,
    bTreeTrace,
    inorderKeys,
    layoutBTree,
    makeOps,
  } from '$lib/algo-engine/b-trees.js';
  import { en as m } from '$lib/lessons/b-trees/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/b-trees.js').BOp} BOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'read'|'changed'|'found'|'broken'|'partner'|'path'} Role */

  const PRESETS = /** @type {const} */ (['grow', 'mixed', 'merge', 'random']);
  const CELL = 32;
  const ROW = 70;
  const BOX = 30;
  const TOP = 18;
  const ORDER_OPTIONS = ORDERS.map((o) => ({ value: String(o), label: m.orderOption(o) }));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    read: 'compare',
    changed: 'active',
    found: 'sorted',
    broken: 'swap',
    partner: 'frontier',
    path: 'visited',
  };

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeOps('grow');
  /** @type {BOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let orderChoice = $state('3');
  const order = $derived(Number(orderChoice));
  // `draft` follows the input as the learner types; `key` changes only on a valid commit.
  let key = $state(45);
  /** @type {number | null} */
  let draft = $state(45);
  let preset = $state('grow');
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(bTreeTrace(INITIAL_OPS, 3));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const validKey = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_KEY && v <= MAX_KEY;

  const keyField = createFieldGuard();

  function commitKey() {
    if (keyField.commit(validKey(draft))) key = /** @type {number} */ (draft);
    else {
      draft = key;
      say(m.keyError);
    }
  }

  /** @param {BOp['type']} type */
  function add(type) {
    if (keyField.refused() || !validKey(draft)) {
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
      finalFrame.size >= MAX_KEYS &&
      !inorderKeys(finalFrame.root).includes(key)
    ) {
      say(m.full);
      return;
    }
    notice = { text: '', at: -1 };
    preset = '';
    const next = [...ops, { type, key }];
    const frames = bTreeTrace(next, order);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {BOp[]} next @param {boolean} toEnd */
  function setOps(next, toEnd) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = bTreeTrace(next, order);
    player.load(frames);
    if (toEnd) player.seek(frames.length - 1);
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    setOps(ops.slice(0, -1), true);
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    setOps([], false);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {typeof PRESETS[number]} */ (e.currentTarget.value);
    setOps(makeOps(picked, Math.random), false);
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** The same log under the new order, shown finished so the shapes compare at a glance. */
  function changeOrder() {
    setOps(ops, true);
  }

  /** @param {number} id @returns {Role | null} */
  function roleOf(id) {
    const f = frame;
    if (id === f.active) {
      if (f.kind === 'read') return 'read';
      if (f.kind === 'overflow' || f.kind === 'underflow') return 'broken';
      if (f.kind === 'found' || f.kind === 'dup') return 'found';
      return 'changed';
    }
    if (id === f.partner) return 'partner';
    return f.path.includes(id) ? 'path' : null;
  }

  const layout = $derived(layoutBTree(frame.root));
  const vbW = $derived(Math.max(1, layout.width) * CELL + 12);
  const vbH = $derived(Math.max(1, layout.levels) * ROW);
  const fade = $derived(player.speed < 8 ? 'transition-colors' : '');

  const drawn = $derived(
    layout.nodes.map((p) => {
      const role = roleOf(p.id);
      return {
        id: p.id,
        keys: p.node.keys,
        role,
        state: role ? ROLE_STATE[role] : /** @type {VisualState} */ (''),
        x: p.x * CELL + 6,
        y: p.depth * ROW + TOP,
        width: p.width * CELL,
        title: m.nodeLabel(p.node.keys, role ? m.roleNames[role] : ''),
      };
    }),
  );

  const links = $derived(
    layout.edges.map((e) => {
      const a = layout.nodes.find((n) => n.id === e.from);
      const b = layout.nodes.find((n) => n.id === e.to);
      if (!a || !b) return { id: e.to, x1: 0, y1: 0, x2: 0, y2: 0 };
      return {
        id: e.to,
        // Each child hangs from the gap between the keys it sits between.
        x1: a.x * CELL + 6 + (a.width * CELL * e.slot) / Math.max(1, a.node.children.length - 1),
        y1: a.depth * ROW + TOP + BOX,
        x2: b.x * CELL + 6 + (b.width * CELL) / 2,
        y2: b.depth * ROW + TOP,
      };
    }),
  );

  const rows = $derived.by(() => {
    /** @type {number[][]} */
    const out = [];
    for (const n of layout.nodes) (out[n.depth] ??= []).push(...n.node.keys);
    return out;
  });
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const stats = $derived([
    ['reads', m.stats.reads, frame.reads],
    ['scanned', m.stats.scanned, frame.scanned],
    ['splits', m.stats.splits, frame.splits],
    ['fixes', m.stats.fixes, frame.merges + frame.borrows],
    ['height', m.stats.height, frame.height],
    ['size', m.stats.size, frame.size],
  ]);
  const LEGEND = /** @type {const} */ (['read', 'path', 'changed', 'found', 'broken', 'partner']);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the key field submits the form, which inserts; the other buttons never submit. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    onkeydown={(e) => enterField(e, { key: () => add('insert') })}
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add('insert');
    }}
  >
    <SegmentedControl
      legend={m.orderLabel}
      name="order"
      options={ORDER_OPTIONS}
      bind:value={orderChoice}
      onchange={changeOrder}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.keyLabel}
      <input
        type="number"
        name="key"
        min={MIN_KEY}
        max={MAX_KEY}
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
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ul class="mb-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each LEGEND as l (l)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[l]]}"
              ></span>
              {m.legend[l]}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-active"></span>
            <span class="underline">{m.legend.moved}</span>
          </li>
        </ul>
        {#if drawn.length === 0}
          <p class="py-6 text-center text-sm text-slate-500">{m.emptyTree}</p>
        {:else}
          <ScrollFrame>
            <svg
              viewBox="0 0 {vbW} {vbH}"
              role="img"
              aria-label={m.treeLabel(rows, order, frame.height)}
              class="mx-auto block h-auto"
              style="width: {vbW * 1.1}px; max-width: 100%; min-width: {Math.min(vbW, 340)}px"
            >
              {#each links as e (e.id)}
                <line
                  x1={e.x1}
                  y1={e.y1}
                  x2={e.x2}
                  y2={e.y2}
                  class="stroke-slate-400"
                  stroke-width="1.5"
                  aria-hidden="true"
                />
              {/each}
              {#each drawn as n (n.id)}
                <g data-node={n.keys.join(',')}>
                  <title>{n.title}</title>
                  {#if n.keys.length === 0}
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.width}
                      height={BOX}
                      rx="3"
                      stroke-width="2"
                      stroke-dasharray="4 3"
                      class="{STATE_FILL[n.state]} {stateStroke(n.state)} {fade}"
                    />
                  {/if}
                  {#each n.keys as k, i (i)}
                    {@const isMoved = frame.moved === k}
                    <rect
                      x={n.x + i * CELL}
                      y={n.y}
                      width={CELL}
                      height={BOX}
                      stroke-width={n.role ? 2 : 1.5}
                      class="{isMoved ? 'fill-state-active' : STATE_FILL[n.state]} {stateStroke(
                        n.state,
                      )} {fade}"
                    />
                    <text
                      x={n.x + i * CELL + CELL / 2}
                      y={n.y + BOX / 2}
                      text-anchor="middle"
                      dominant-baseline="central"
                      font-size="13"
                      font-weight={isMoved ? 800 : 600}
                      text-decoration={isMoved ? 'underline' : 'none'}
                      class={isMoved ? 'fill-white' : STATE_TEXT[n.state]}>{k}</text
                    >
                  {/each}
                  {#if n.role && m.markers[n.role]}
                    <text
                      x={n.x + n.width}
                      y={n.y - 6}
                      text-anchor="middle"
                      dominant-baseline="central"
                      font-size="12"
                      font-weight="700"
                      stroke="white"
                      stroke-width="3"
                      paint-order="stroke"
                      class="fill-slate-900"
                      aria-hidden="true">{m.markers[n.role]}</text
                    >
                  {/if}
                </g>
              {/each}
            </svg>
          </ScrollFrame>
        {/if}
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
        {#each stats as [id, label, value] (id)}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <p class="text-sm text-slate-600">{m.facts(order, frame.size, frame.height)}</p>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={bTreePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
