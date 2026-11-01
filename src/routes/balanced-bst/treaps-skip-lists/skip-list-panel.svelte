<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';
  import {
    MAX_KEY,
    MAX_OPS,
    MAX_SKIP_KEYS,
    MAX_TOWER,
    MIN_KEY,
    makeSkipOps,
    rollHeight,
    skipListPseudocode,
    skipListTrace,
  } from '$lib/algo-engine/treaps-skip-lists.js';
  import { en as m } from '$lib/lessons/treaps-skip-lists/copy.en.js';

  /** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').SkipOp} SkipOp */
  /** @typedef {import('$lib/algo-engine/treaps-skip-lists.js').SkipFrame} SkipFrame */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'active'|'path'|'compare'|'found'} Role */

  /**
   * The skip list half of the lesson. The page owns the player and the log so they survive a
   * switch to the treap and back.
   * @type {{
   *   player: ReturnType<typeof import('$lib/player/player.svelte.js').createPlayer<SkipFrame>>,
   *   ops: SkipOp[],
   *   controls: import('svelte').Snippet,
   * }}
   */
  let { player, ops = $bindable(), controls } = $props();

  const PRESETS = /** @type {const} */ (['towers', 'flat', 'random']);
  const COL = 44;
  const LEVEL = 32;
  const BOX_W = 36;
  const BOX_H = 24;
  const TOP = 14;
  const TOWERS = Array.from({ length: MAX_TOWER }, (_, i) => i + 1);
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = { active: 'active', path: 'visited', compare: 'compare', found: 'sorted' };
  const LEGEND = /** @type {Role[]} */ (['active', 'path', 'compare', 'found']);

  // `draft` follows the input as the learner types; `key` changes only on a valid commit.
  let key = $state(45);
  /** @type {number | null} */
  let draft = $state(45);
  let tower = $state('coin');
  let preset = $state('towers');
  // Text shown in place of the narration, only on the frame it was raised on.
  let notice = $state({ text: '', at: -1 });

  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describeSkip(frame));

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

  /** @param {SkipOp['type']} type */
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
      finalFrame.size >= MAX_SKIP_KEYS &&
      !finalFrame.towers.some((t) => t.key === key)
    ) {
      say(m.skipFull);
      return;
    }
    notice = { text: '', at: -1 };
    preset = '';
    const height = tower === 'coin' ? rollHeight(Math.random) : Number(tower);
    /** @type {SkipOp[]} */
    const next = [...ops, type === 'insert' ? { type, key, height } : { type, key }];
    const frames = skipListTrace(next);
    ops = next;
    player.load(frames);
    player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {SkipOp[]} next @param {boolean} toSearch */
  function setOps(next, toSearch) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = skipListTrace(next);
    player.load(frames);
    if (toSearch && next.length)
      player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    setOps(ops.slice(0, -1), false);
    player.seek(player.frames.length - 1);
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    setOps([], false);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {typeof PRESETS[number]} */ (e.currentTarget.value);
    setOps(makeSkipOps(picked, Math.random), true);
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} column  Tower index, -1 for the head. @param {number} level @returns {Role | null} */
  function roleOf(column, level) {
    const f = frame;
    if (f.newTower === column && column >= 0) return 'found';
    if (f.kind === 'found' && f.next === column && column >= 0) return 'found';
    if (f.at === column && f.level === level && f.kind !== 'done') return 'active';
    if (f.next === column && column >= 0 && f.level === level && f.kind !== 'done')
      return 'compare';
    return f.path.some((p) => p.at === column && p.level === level) ? 'path' : null;
  }

  const levelY = $derived((/** @type {number} */ level) => (frame.top - level) * LEVEL + TOP);
  /** @param {number} column */
  const columnX = (column) => (column + 1) * COL + (COL - BOX_W) / 2;
  const endColumn = $derived(frame.towers.length);
  const vbW = $derived((frame.towers.length + 2) * COL);
  const vbH = $derived(frame.top * LEVEL + TOP);
  const fade = $derived(player.speed < 8 ? 'transition-colors' : '');
  const levels = $derived(Array.from({ length: frame.top }, (_, i) => frame.top - i));

  const cells = $derived.by(() => {
    /** @type {{ id: string, x: number, y: number, label: string, role: Role | null, state: VisualState, title: string }[]} */
    const out = [];
    /** @param {number} column @param {string} label @param {number} level */
    const add = (column, label, level) => {
      const role = roleOf(column, level);
      out.push({
        id: `${column}-${level}`,
        x: columnX(column),
        y: levelY(level),
        label,
        role,
        state: role ? ROLE_STATE[role] : '',
        title: m.cellLabel(label, level, role ? m.cellRoles[role] : ''),
      });
    };
    for (const level of levels) add(-1, m.head, level);
    frame.towers.forEach((t, i) => {
      for (let level = 1; level <= t.height; level++) add(i, String(t.key), level);
    });
    return out;
  });

  const ends = $derived(
    levels.map((level) => ({ level, x: columnX(endColumn), y: levelY(level) })),
  );

  const links = $derived.by(() => {
    /** @type {{ id: string, x1: number, x2: number, y: number, on: boolean }[]} */
    const out = [];
    for (const level of levels) {
      let from = -1;
      for (let to = 0; to <= frame.towers.length; to++) {
        if (to < frame.towers.length && frame.towers[to].height < level) continue;
        out.push({
          id: `${level}-${to}`,
          x1: columnX(from) + BOX_W,
          x2: columnX(to),
          y: levelY(level) + BOX_H / 2,
          on:
            frame.path.some((p) => p.at === from && p.level === level) &&
            frame.path.some((p) => p.at === to && p.level === level),
        });
        from = to;
      }
    }
    return out;
  });

  const chips = $derived(
    ops.map((op, i) => ({ label: m.skipOpChip(op), hot: i === frame.opIndex })),
  );
  const flipChips = $derived(
    frame.flips.map((heads, i) => ({
      label: heads ? m.flipHeads : m.flipTails,
      hot: i === frame.flips.length - 1,
    })),
  );
  const stats = $derived([
    ['comparisons', m.skipStats.comparisons, frame.comparisons],
    ['rights', m.skipStats.rights, frame.rights],
    ['drops', m.skipStats.drops, frame.drops],
    ['levels', m.skipStats.levels, frame.top],
  ]);
</script>

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
  <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
    {m.towerLabel}
    <select name="tower" class="field" bind:value={tower}>
      <option value="coin">{m.towerCoin}</option>
      {#each TOWERS as t (t)}
        <option value={String(t)}>{t}</option>
      {/each}
    </select>
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
        <option value={p}>{m.skipPresets[p]}</option>
      {/each}
    </select>
  </label>
</form>

<div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
  <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
    <div class="rounded-xl border border-slate-200 bg-white p-4">
      <ScrollFrame>
        <svg
          viewBox="0 0 {vbW} {vbH}"
          role="img"
          aria-label={m.skipLabel(frame.towers, frame.top)}
          class="mx-auto block h-auto"
          style="width: {vbW}px; max-width: 100%; min-width: {Math.min(vbW, 340)}px"
        >
          {#each links as l (l.id)}
            <line
              x1={l.x1}
              y1={l.y}
              x2={l.x2}
              y2={l.y}
              stroke-width={l.on ? 3 : 1.5}
              class={l.on ? 'stroke-amber-500' : 'stroke-slate-400'}
              aria-hidden="true"
            />
          {/each}
          {#each ends as e (e.level)}
            <text
              x={e.x + BOX_W / 2}
              y={e.y + BOX_H / 2}
              text-anchor="middle"
              dominant-baseline="central"
              font-size="11"
              class="fill-slate-500"
              aria-hidden="true">{m.end}</text
            >
          {/each}
          {#each cells as c (c.id)}
            <g data-cell={c.id}>
              <title>{c.title}</title>
              <rect
                x={c.x}
                y={c.y}
                width={BOX_W}
                height={BOX_H}
                rx="3"
                stroke-width={c.role ? 2 : 1.25}
                class="{STATE_FILL[c.state]} {stateStroke(c.state)} {fade}"
              />
              <text
                x={c.x + BOX_W / 2}
                y={c.y + BOX_H / 2}
                text-anchor="middle"
                dominant-baseline="central"
                font-size="12"
                font-weight="600"
                class={STATE_TEXT[c.state]}>{c.label}</text
              >
              {#if c.role && c.role !== 'path'}
                <text
                  x={c.x + BOX_W - 2}
                  y={c.y}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="10"
                  font-weight="700"
                  stroke="white"
                  stroke-width="3"
                  paint-order="stroke"
                  class="fill-slate-900"
                  aria-hidden="true">{m.markers[c.role]}</text
                >
              {/if}
            </g>
          {/each}
        </svg>
      </ScrollFrame>
      <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {#each LEGEND as l (l)}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[l]]}"
            ></span>
            {m.legendSkip[l]}
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
      {#each stats as [id, label, value] (id)}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{label}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
        </div>
      {/each}
      <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
        <dt class="text-xs text-slate-500">{m.skipStats.size}</dt>
        <dd class="text-2xl font-bold tabular-nums" data-testid="size">{frame.size}</dd>
      </div>
    </dl>
    <p class="text-sm text-slate-600">{m.skipNote(frame.size)}</p>
    <ChipList
      title={m.flipsTitle}
      items={flipChips}
      emptyText={m.flipsEmpty}
      limit={MAX_TOWER}
      hotLabel={m.flipsHot}
    />
    <ChipList
      title={m.opsTitle}
      items={chips}
      emptyText={m.opsEmpty}
      limit={MAX_OPS}
      hotLabel={m.opsHotLabel}
    />
    <CodePanel lines={skipListPseudocode} active={frame.lines} />
  </div>
  <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
    {@render controls()}
  </div>
</div>
