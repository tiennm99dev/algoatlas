<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';
  import {
    RULES,
    deepest,
    formatIntervals,
    intervalPseudocode,
    intervalTrace,
    parseIntervals,
  } from '$lib/algo-engine/interval-scheduling.js';
  import { en as m } from '$lib/lessons/interval-scheduling/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/interval-scheduling.js').Rule} Rule */
  /** @typedef {import('$lib/algo-engine/interval-scheduling.js').Interval} Interval */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.presets} PresetKey */
  /** @typedef {keyof typeof m.legend} BarKind */

  /** @param {[number, number][]} pairs @returns {Interval[]} */
  const ivs = (pairs) => pairs.map(([start, end]) => ({ start, end }));

  /** @type {Record<PresetKey, Interval[]>} */
  const PRESETS = {
    classic: ivs([
      [1, 4],
      [3, 5],
      [0, 6],
      [5, 7],
      [3, 9],
      [5, 9],
      [6, 10],
      [8, 11],
      [8, 12],
      [2, 14],
      [12, 16],
    ]),
    shortTrap: ivs([
      [0, 5],
      [4, 7],
      [6, 11],
    ]),
    startTrap: ivs([
      [0, 10],
      [1, 3],
      [4, 6],
      [7, 9],
    ]),
    lectures: ivs([
      [7, 9],
      [8, 11],
      [9, 12],
      [9, 10],
      [11, 13],
      [12, 14],
      [13, 16],
      [14, 15],
    ]),
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));
  const SELECT_RULES = /** @type {Rule[]} */ (['finish', 'start', 'shortest']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.classic;
  let intervals = $state(INITIAL);
  let intervalsText = $state(formatIntervals(INITIAL));
  let rule = $state(/** @type {Rule} */ ('finish'));
  let preset = $state('classic');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(intervalTrace(INITIAL, 'finish'));
  const frame = $derived(player.frame);
  const totals = $derived(
    SELECT_RULES.map((r) => ({
      rule: r,
      kept: intervalTrace(intervals, r).at(-1)?.chosen.length ?? 0,
    })),
  );
  const best = $derived(totals[0].kept);
  const deep = $derived(deepest(intervals));
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, best, deep),
  );
  const pseudocode = $derived(intervalPseudocode(rule));
  const rooms = $derived(rule === 'rooms');

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {Interval[]} next */
  function load(next) {
    intervals = next;
    intervalsText = formatIntervals(next);
    notice = { text: '', at: -1 };
    player.load(intervalTrace(next, rule));
  }

  function commitIntervals() {
    const parsed = parseIntervals(intervalsText);
    if ('error' in parsed) {
      intervalsText = formatIntervals(intervals);
      say(m.errors[parsed.error]);
      return;
    }
    if (formatIntervals(parsed.intervals) === formatIntervals(intervals)) {
      intervalsText = formatIntervals(intervals);
      return;
    }
    preset = '';
    load(parsed.intervals);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    load(PRESETS[key]);
    say(m.newIntervalsNotice);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function pickRule(e) {
    rule = /** @type {Rule} */ (e.currentTarget.value);
    notice = { text: '', at: -1 };
    player.load(intervalTrace(intervals, rule));
    say(m.ruleNotice(m.rules[rule]));
  }

  function randomIntervals() {
    const n = 6 + Math.floor(Math.random() * 5);
    const next = Array.from({ length: n }, () => {
      const start = Math.floor(Math.random() * 15);
      return { start, end: start + 1 + Math.floor(Math.random() * 6) };
    });
    preset = '';
    load(next);
    say(m.newIntervalsNotice);
  }

  // The interval placed last in the room that frees earliest, on partitioning frames.
  const freedBy = $derived.by(() => {
    if (!rooms || frame.freed < 0) return -1;
    const placed = frame.order.slice(0, frame.at).filter((i) => frame.room[i] === frame.freed);
    return placed.at(-1) ?? -1;
  });

  /** @param {number} i @returns {BarKind | ''} */
  function barKind(i) {
    if (i === frame.current) {
      if (frame.kind === 'consider') return 'current';
      return frame.kind === 'reject' ? 'skipped' : 'kept';
    }
    if (i === frame.conflict) return 'clash';
    if (i === freedBy) return 'freed';
    if (frame.chosen.includes(i) || frame.room[i] >= 0) return 'kept';
    if (frame.rejected.includes(i)) return 'skipped';
    return '';
  }

  /** @type {Record<BarKind | '', VisualState>} */
  const STATE = {
    current: 'active',
    kept: 'sorted',
    clash: 'swap',
    skipped: 'visited',
    freed: 'frontier',
    '': '',
  };
  const legend = $derived(
    /** @type {BarKind[]} */ (
      rooms ? ['current', 'kept', 'freed'] : ['current', 'kept', 'clash', 'skipped']
    ),
  );

  const UNIT = 30;
  const ROW = 30;
  const BAR = 22;
  const PAD = 12;
  const AXIS = 26;
  const TOP = 16;
  const span = $derived(Math.max(8, ...intervals.map((iv) => iv.end)));
  const width = $derived(PAD * 2 + span * UNIT + (rooms ? 30 : 0));
  const height = $derived(TOP + intervals.length * ROW + AXIS);
  const ticks = $derived(Array.from({ length: span + 1 }, (_, t) => t));
  /** @param {number} t */
  const x = (t) => PAD + t * UNIT;
  const line = $derived.by(() => {
    if (rooms && frame.current >= 0) {
      return { t: frame.intervals[frame.current].start, label: m.nowLabel };
    }
    if (rule === 'finish' && frame.lastFinish >= 0) {
      return { t: frame.lastFinish, label: m.lastFinishLabel };
    }
    return null;
  });
  const fade = $derived(player.speed < 8 ? 'transition-colors' : '');
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitIntervals();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label
      class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.intervalsLabel}
      <input
        type="text"
        name="intervals"
        class="field w-full max-w-lg font-mono"
        bind:value={intervalsText}
        onchange={commitIntervals}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.ruleLabel}
      <select name="rule" class="field" value={rule} onchange={pickRule}>
        {#each RULES as r (r)}
          <option value={r}>{m.rules[r]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-secondary" onclick={randomIntervals}>{m.random}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ScrollFrame>
          <svg
            role="list"
            aria-label={m.timelineAria(intervals.length)}
            viewBox="0 0 {width} {height}"
            {width}
            {height}
            class="block max-w-none"
          >
            {#each ticks as t (t)}
              <line
                x1={x(t)}
                x2={x(t)}
                y1={TOP - 4}
                y2={height - AXIS + 4}
                class={t % 2 === 0 ? 'stroke-slate-200' : 'stroke-slate-100'}
              />
              {#if t % 2 === 0}
                <text
                  x={x(t)}
                  y={height - 8}
                  text-anchor="middle"
                  class="fill-slate-500 text-[10px]"
                  aria-hidden="true">{t}</text
                >
              {/if}
            {/each}
            {#each frame.order as i, row (i)}
              {@const iv = frame.intervals[i]}
              {@const kind = barKind(i)}
              {@const state = STATE[kind]}
              {@const y = TOP + row * ROW + (ROW - BAR) / 2}
              <g
                role="listitem"
                aria-label={m.barLabel(frame, i, kind ? m.legend[kind] : '')}
                class={kind === 'skipped' ? 'opacity-50' : ''}
              >
                <rect
                  x={x(iv.start)}
                  {y}
                  width={(iv.end - iv.start) * UNIT}
                  height={BAR}
                  rx="4"
                  class="{STATE_FILL[state]} {stateStroke(state)} {fade}"
                  stroke-width="1.5"
                />
                <text
                  x={x(iv.start) + 6}
                  y={y + BAR / 2 + 4}
                  class="{STATE_TEXT[state]} font-mono text-[11px] font-semibold"
                  aria-hidden="true">{m.name(i)}{kind ? ` ${m.markers[kind]}` : ''}</text
                >
                {#if rooms && frame.room[i] >= 0}
                  <text
                    x={x(iv.end) + 4}
                    y={y + BAR / 2 + 4}
                    class="fill-slate-700 font-mono text-[10px]"
                    aria-hidden="true">{m.roomName(frame.room[i])}</text
                  >
                {/if}
              </g>
            {/each}
            {#if line}
              <line
                x1={x(line.t)}
                x2={x(line.t)}
                y1={TOP - 6}
                y2={height - AXIS + 6}
                class="stroke-slate-900"
                stroke-width="2"
                stroke-dasharray="4 3"
              />
              <text
                x={line.t > span / 2 ? x(line.t) - 3 : x(line.t) + 3}
                y={TOP - 6}
                text-anchor={line.t > span / 2 ? 'end' : 'start'}
                class="fill-slate-900 font-mono text-[10px]"
                aria-hidden="true">{line.label} = {line.t}</text
              >
            {/if}
          </svg>
        </ScrollFrame>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[STATE[s]]}"></span>
              <span class="font-bold text-slate-900">{m.markers[s]}</span>
              {m.legend[s]}
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
        {#if rooms}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.rooms}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.roomEnds.length}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.depth}</dt>
            <dd class="text-2xl font-bold tabular-nums">{deep.depth}</dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.kept}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.chosen.length}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.best}</dt>
            <dd class="text-2xl font-bold tabular-nums">{best}</dd>
          </div>
        {/if}
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
        </div>
      </dl>
      {#if rooms}
        <ChipList
          title={m.roomsTitle}
          items={frame.roomEnds.map((end, r) => ({
            label: m.roomChip(r, end),
            hot: r === frame.freed,
          }))}
          emptyText={m.roomsEmpty}
        />
      {:else}
        <ChipList
          title={m.keptTitle}
          items={frame.chosen.map((i) => ({ label: m.name(i), hot: i === frame.current }))}
          emptyText={m.keptEmpty}
        />
      {/if}
      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <dl class="space-y-1.5">
          {#each totals as row (row.rule)}
            <div
              class="flex flex-wrap justify-between gap-x-2 {row.rule === rule
                ? 'font-semibold text-slate-900'
                : 'text-slate-600'}"
            >
              <dt>{m.rules[row.rule]}</dt>
              <dd class="tabular-nums">{m.compareRow(row.kept)}</dd>
            </div>
          {/each}
        </dl>
      </section>
      <CodePanel lines={pseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
