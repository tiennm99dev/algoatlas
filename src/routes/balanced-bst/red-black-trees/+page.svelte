<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { layoutForest } from '$lib/components/tree-layout.js';
  import {
    MAX_KEY,
    MAX_NODES,
    MAX_OPS,
    MIN_KEY,
    blackHeightOf,
    inorderKeys,
    makeOps,
    redBlackPseudocode,
    redBlackTrace,
  } from '$lib/algo-engine/red-black-trees.js';
  import { en as m } from '$lib/lessons/red-black-trees/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/red-black-trees.js').RbOp} RbOp */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */

  const PRESETS = /** @type {const} */ (['clrs', 'uncle', 'inner', 'outer', 'sorted', 'random']);
  const WALK_KINDS = ['visit', 'go-left', 'go-right', 'found', 'dup'];
  const COL = 48;
  const ROW = 68;
  const R = 17;
  const TOP = R + 14;

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeOps('clrs');
  /** @type {RbOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  // `draft` follows the input as the learner types; `key` changes only on a valid commit.
  let key = $state(6);
  /** @type {number | null} */
  let draft = $state(6);
  let preset = $state('clrs');
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(redBlackTrace(INITIAL_OPS));
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

  function commitKey() {
    if (validKey(draft)) key = /** @type {number} */ (draft);
    else draft = key;
  }

  /** @param {RbOp['type']} type */
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
    notice = { text: '', at: -1 };
    preset = '';
    const next = [...ops, { type, key }];
    const frames = redBlackTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {RbOp[]} next @param {boolean} toEnd */
  function setOps(next, toEnd) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = redBlackTrace(next);
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

  /** @param {number} slot @returns {TreeNode | null} */
  function toTree(slot) {
    if (slot === -1) return null;
    const n = frame.nodes[slot];
    return {
      id: slot,
      label: String(n.key),
      children: [toTree(n.left), toTree(n.right)],
    };
  }

  const layout = $derived.by(() => {
    const t = toTree(frame.root);
    return layoutForest(t ? [t] : [], { binary: true });
  });
  const vbW = $derived(Math.max(1, layout.columns) * COL);
  const vbH = $derived(Math.max(1, layout.levels) * ROW);
  const fade = $derived(player.speed < 8 ? 'transition-colors' : '');

  /** @param {number} slot @returns {'compare'|'z'|'parent'|'uncle'|'grand'|'pivot'|''} */
  function roleOf(slot) {
    if (frame.pivot === slot) return 'pivot';
    // On the walk down `z` is only the node being compared; the repair has not started.
    if (frame.z === slot) return WALK_KINDS.includes(frame.kind) ? 'compare' : 'z';
    if (frame.parent === slot) return 'parent';
    if (frame.uncle === slot) return 'uncle';
    if (frame.grand === slot) return 'grand';
    return '';
  }

  const drawn = $derived(
    layout.nodes.map((p) => {
      const slot = /** @type {number} */ (p.id);
      const n = frame.nodes[slot];
      const role = roleOf(slot);
      const bh = blackHeightOf(frame.nodes, slot);
      return {
        slot,
        key: n.key,
        color: n.color,
        role,
        onPath: frame.path.includes(slot),
        cx: p.x * COL + COL / 2,
        cy: p.depth * ROW + TOP,
        note: `${m.colourLetter[n.color]} ${m.note(bh)}`,
        title: m.nodeLabel(n.key, m.colourName[n.color], role ? m.roleNames[role] : '', m.note(bh)),
      };
    }),
  );

  const lines = $derived(
    layout.edges.map((e) => {
      const a = /** @type {import('$lib/components/tree-layout.js').PlacedNode} */ (
        layout.byId.get(e.from)
      );
      const b = /** @type {import('$lib/components/tree-layout.js').PlacedNode} */ (
        layout.byId.get(e.to)
      );
      return {
        id: e.to,
        x1: a.x * COL + COL / 2,
        y1: a.depth * ROW + TOP,
        x2: b.x * COL + COL / 2,
        y2: b.depth * ROW + TOP,
      };
    }),
  );

  const keys = $derived(inorderKeys(frame));
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const ruleRows = $derived([
    { id: 'colour', text: m.rules.colour, ok: true },
    { id: 'root', text: m.rules.root, ok: frame.rules.rootBlack },
    { id: 'nil', text: m.rules.nil, ok: true },
    { id: 'red-red', text: m.rules.redRed, ok: frame.rules.noRedRed },
    { id: 'black', text: m.rules.black, ok: frame.rules.sameBlack },
  ]);
  const stats = $derived([
    ['comparisons', m.stats.comparisons, frame.comparisons],
    ['recolours', m.stats.recolours, frame.recolours],
    ['rotations', m.stats.rotations, frame.rotations],
    ['height', m.stats.height, frame.height],
    ['black-height', m.stats.blackHeight, frame.blackHeight < 0 ? m.uneven : frame.blackHeight],
    ['size', m.stats.size, frame.size],
  ]);
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
        {#if drawn.length === 0}
          <p class="py-6 text-center text-sm text-slate-500">{m.emptyTree}</p>
        {:else}
          <ScrollFrame>
            <svg
              viewBox="0 0 {vbW} {vbH}"
              role="img"
              aria-label={m.treeLabel(keys, frame.height, frame.blackHeight)}
              class="mx-auto block h-auto"
              style="width: {vbW * 1.15}px; max-width: 100%; min-width: {Math.min(
                vbW * 0.85,
                360,
              )}px"
            >
              {#each lines as e (e.id)}
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
              {#each drawn as n (n.slot)}
                <g data-color={n.color}>
                  <title>{n.title}</title>
                  {#if n.role || n.onPath}
                    <circle
                      cx={n.cx}
                      cy={n.cy}
                      r={R + 4}
                      fill="none"
                      stroke-width={n.role ? 3 : 2}
                      stroke-dasharray={n.role ? '' : '4 3'}
                      class={n.role ? 'stroke-teal-600' : 'stroke-amber-500'}
                    />
                  {/if}
                  <circle
                    cx={n.cx}
                    cy={n.cy}
                    r={R}
                    stroke-width="1.5"
                    class="{n.color === 'red'
                      ? 'fill-rose-600 stroke-rose-900'
                      : 'fill-slate-900 stroke-slate-950'} {fade}"
                  />
                  <text
                    x={n.cx}
                    y={n.cy}
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="13"
                    font-weight="600"
                    class="fill-white">{n.key}</text
                  >
                  {#if n.role}
                    <text
                      x={n.cx + R + 1}
                      y={n.cy - R}
                      text-anchor="middle"
                      dominant-baseline="central"
                      font-size="12"
                      font-weight="700"
                      stroke="white"
                      stroke-width="3"
                      stroke-linejoin="round"
                      paint-order="stroke"
                      class="fill-teal-800"
                      aria-hidden="true">{m.roles[n.role]}</text
                    >
                  {/if}
                  <text
                    x={n.cx}
                    y={n.cy + R + 12}
                    text-anchor="middle"
                    dominant-baseline="central"
                    font-size="10"
                    stroke="white"
                    stroke-width="3"
                    paint-order="stroke"
                    class="fill-slate-600"
                    aria-hidden="true">{n.note}</text
                  >
                </g>
              {/each}
            </svg>
          </ScrollFrame>
        {/if}
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-rose-900 bg-rose-600"></span>{m.legend.red}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-950 bg-slate-900"></span>{m.legend
              .black}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border-2 border-teal-600"></span>{m.legend.compare}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border-2 border-teal-600"></span>{m.legend.z},
            {m.legend.parent}, {m.legend.uncle}, {m.legend.grand}, {m.legend.pivot}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border-2 border-dashed border-amber-500"></span>{m
              .legend.path}
          </li>
          <li>{m.legend.bh}</li>
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
        {#each stats as [id, label, value] (id)}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <p class="text-sm text-slate-600">{m.bound(frame.size)}</p>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.rulesTitle}</h2>
        <ul class="flex flex-col gap-1 text-sm">
          {#each ruleRows as r (r.id)}
            <li
              class="flex gap-2 {r.ok ? 'text-slate-800' : 'font-semibold text-rose-700'}"
              data-testid="rule-{r.id}"
            >
              <span aria-hidden="true">{r.ok ? m.ruleOk : m.ruleBroken}</span>
              <span
                >{r.text}<span class="sr-only">: {r.ok ? m.ruleOkLabel : m.ruleBrokenLabel}</span
                ></span
              >
            </li>
          {/each}
        </ul>
      </div>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={redBlackPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
