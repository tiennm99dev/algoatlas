<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    KNAP_PRESETS,
    MAX_CAPACITY,
    MAX_ITEMS,
    MAX_VALUE,
    MAX_WEIGHT,
    capacityBits,
    formatItems,
    greedyValue,
    knapPseudocode,
    knapTrace,
    parseCapacity,
    parseItems,
  } from '$lib/algo-engine/knapsack-subset-sum.js';
  import { en as m } from '$lib/lessons/knapsack-subset-sum/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapProblem} KnapProblem */
  /** @typedef {import('$lib/algo-engine/knapsack-subset-sum.js').KnapLayout} KnapLayout */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'current'|'read'|'kept'|'reused'|'path'|'answer'|''} Role */

  const PROBLEMS = /** @type {KnapProblem[]} */ (['knapsack', 'subset']);
  const LAYOUTS = /** @type {KnapLayout[]} */ (['table', 'row-down', 'row-up']);
  const FIRST = KNAP_PRESETS.knapsack[0];
  const errors = m.errors(MAX_ITEMS, MAX_WEIGHT, MAX_VALUE, MAX_CAPACITY);

  let problem = $state(/** @type {KnapProblem} */ ('knapsack'));
  let layout = $state(/** @type {KnapLayout} */ ('table'));
  let items = $state(FIRST.items);
  let capacity = $state(FIRST.capacity);
  let preset = $state(FIRST.key);
  let itemsText = $state(formatItems('knapsack', FIRST.items));
  let capacityText = $state(String(FIRST.capacity));
  let notice = $state({ text: '', at: -1 });

  // The sliders pick up where the last one left the other coordinate.
  let pickI = $state(0);
  let pickC = $state(0);
  const player = createPlayer(knapTrace('knapsack', 'table', FIRST.items, FIRST.capacity));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const presets = $derived(KNAP_PRESETS[problem]);
  const code = $derived(knapPseudocode[frame.problem][frame.layout]);
  const isTable = $derived(frame.layout === 'table');
  const knap = $derived(frame.problem === 'knapsack');

  function rebuild() {
    notice = { text: '', at: -1 };
    pickI = 0;
    pickC = 0;
    player.load(knapTrace(problem, layout, items, capacity));
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = KNAP_PRESETS[problem].find((x) => x.key === key) ?? KNAP_PRESETS[problem][0];
    preset = p.key;
    items = p.items;
    capacity = p.capacity;
    itemsText = formatItems(problem, items);
    capacityText = String(capacity);
    rebuild();
  }

  function pickProblem() {
    loadPreset(KNAP_PRESETS[problem][0].key);
  }

  /** @param {string} text */
  function refuse(text) {
    notice = { text, at: player.index };
  }

  function commitItems() {
    const parsed = parseItems(problem, itemsText);
    if ('error' in parsed) {
      itemsText = formatItems(problem, items);
      refuse(parsed.error === 'format' ? errors.format[problem] : errors[parsed.error]);
      return;
    }
    const text = formatItems(problem, parsed.items);
    itemsText = text;
    if (text === formatItems(problem, items)) return;
    items = parsed.items;
    preset = '';
    rebuild();
  }

  function commitCapacity() {
    const parsed = parseCapacity(capacityText);
    if (parsed === null) {
      capacityText = String(capacity);
      refuse(errors.capacity);
      return;
    }
    capacityText = String(parsed);
    if (parsed === capacity) return;
    capacity = parsed;
    preset = '';
    rebuild();
  }

  /** Go to the frame that fills cell (i, c), or to the base case for row 0. */
  /** @param {number} i @param {number} c */
  function seekCell(i, c) {
    const at = player.frames.findIndex((f) =>
      i === 0 ? f.kind === 'base' : f.kind === 'fill' && f.i === i && f.c === c,
    );
    if (at < 0) return;
    pickI = i;
    pickC = c;
    player.pause();
    player.seek(at);
  }

  $effect(() => {
    if (frame.kind === 'fill' || frame.kind === 'trace') {
      pickI = frame.i;
      pickC = frame.c;
    }
  });

  const filling = $derived(frame.kind === 'fill');
  const curRow = $derived(isTable ? frame.i : 0);
  const readRow = $derived(isTable ? frame.i - 1 : 0);
  const weight = $derived(frame.i > 0 ? frame.items[frame.i - 1].weight : 0);
  const pathSet = $derived(new Set(frame.path.map(([r, c]) => `${r}-${c}`)));

  /** @param {number} r @param {number} c @returns {Role} */
  function roleOf(r, c) {
    if (frame.kind === 'done' && c === frame.capacity && r === frame.shown.length - 1) {
      return 'answer';
    }
    if (pathSet.has(`${r}-${c}`)) return 'path';
    if (!filling) return '';
    if (r === curRow && c === frame.c) return 'current';
    if (r === readRow && c === frame.c) return frame.took ? 'read' : 'kept';
    if (frame.fits && r === readRow && c === frame.c - weight) {
      if (frame.reused) return 'reused';
      return frame.took ? 'kept' : 'read';
    }
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    read: 'compare',
    kept: 'compare',
    reused: 'swap',
    path: 'path',
    answer: 'sorted',
    '': '',
  };

  /** @type {{from: [number, number], to: [number, number]}[]} */
  const arrows = $derived.by(() => {
    if (frame.kind === 'fill') {
      /** @type {{from: [number, number], to: [number, number]}[]} */
      const list = [];
      if (isTable) list.push({ from: [readRow, frame.c], to: [curRow, frame.c] });
      if (frame.fits) list.push({ from: [readRow, frame.c - weight], to: [curRow, frame.c] });
      return list;
    }
    if (frame.kind === 'trace') {
      return [
        {
          from: [frame.i, frame.c],
          to: [frame.i - 1, frame.took ? frame.c - weight : frame.c],
        },
      ];
    }
    return [];
  });

  /** @param {number|null} v */
  const cellText = (v) => (v === null || knap ? v : m.boolCell(v));
  const shown = $derived(frame.shown.map((row) => row.map(cellText)));
  const colHeaders = $derived(Array.from({ length: frame.capacity + 1 }, (_, c) => String(c)));
  const rowHeaders = $derived(isTable ? frame.shown.map((_, r) => String(r)) : [m.rowName]);

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    const role = roleOf(r, c);
    return m.cellLabel(
      isTable ? m.rowLabel(r) : m.rowName,
      c,
      shown[r][c],
      role ? m.cellStates[role] : '',
    );
  }

  const legend = $derived(
    /** @type {[VisualState, string][]} */ ([
      ['active', `${m.markers.current} ${m.legend.current}`],
      ['compare', `${m.markers.read} ${m.legend.read}, ${m.markers.kept} ${m.legend.kept}`],
      ...(frame.layout === 'row-up' ? [['swap', `${m.markers.reused} ${m.legend.reused}`]] : []),
      ...(isTable ? [['path', `${m.markers.path} ${m.legend.path}`]] : []),
      ['sorted', `${m.markers.answer} ${m.legend.answer}`],
    ]),
  );

  /** @param {number} i @returns {string} */
  function itemState(i) {
    if (frame.picked.includes(i)) return m.itemStates.taken;
    return frame.i === i && frame.kind !== 'done' ? m.itemStates.now : '';
  }

  const total = $derived((frame.items.length + 1) * (frame.capacity + 1));
  const rowCells = $derived(frame.capacity + 1);
  const greedy = $derived(greedyValue(frame.items, frame.capacity));
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitItems();
      commitCapacity();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((v) => ({ value: v, label: m.problems[v] }))}
      bind:value={problem}
      onchange={pickProblem}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.itemsLabel[problem]}
      <input
        type="text"
        name="items"
        class="field w-56 max-w-full font-mono"
        bind:value={itemsText}
        onchange={commitItems}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.capacityLabel[problem]}
      <input
        type="text"
        inputmode="numeric"
        name="capacity"
        class="field w-20 font-mono"
        bind:value={capacityText}
        onchange={commitCapacity}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each presets as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
    <SegmentedControl
      legend={m.layoutLabel}
      name="layout"
      options={LAYOUTS.map((v) => ({ value: v, label: m.layouts[v] }))}
      bind:value={layout}
      onchange={rebuild}
    />
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {isTable ? m.tableTitle.table : m.tableTitle.row}
        </h2>
        <DpTable
          values={shown}
          ariaLabel={m.tableAria(frame.problem, frame.items.length, frame.capacity)}
          {rowHeaders}
          {colHeaders}
          stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
          markerOf={(r, c) => {
            const role = roleOf(r, c);
            return role ? m.markers[role] : '';
          }}
          labelOf={cellLabel}
          {arrows}
          onselect={isTable ? seekCell : null}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.tableNote(frame.problem, frame.layout)}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
        </ul>
        {#if isTable}
          <div class="mt-3 flex flex-wrap items-end gap-4 print:hidden">
            <label
              class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              {m.sliderItem}
              <input
                type="range"
                name="slider-item"
                min="0"
                max={frame.items.length}
                value={pickI}
                oninput={(e) => {
                  pickI = Number(e.currentTarget.value);
                  seekCell(pickI, pickC);
                }}
                class="w-40 accent-teal-700"
              />
            </label>
            <label
              class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
            >
              {m.sliderCapacity}
              <input
                type="range"
                name="slider-capacity"
                min="0"
                max={frame.capacity}
                value={pickC}
                oninput={(e) => {
                  pickC = Number(e.currentTarget.value);
                  seekCell(pickI, pickC);
                }}
                class="w-40 accent-teal-700"
              />
            </label>
            <span class="text-sm font-semibold text-slate-700" data-testid="slider-cell">
              {m.sliderValue(pickI, pickC)}
            </span>
          </div>
        {/if}
        <p class="mt-3 text-xs text-slate-600" data-testid="pseudo-note">
          {m.pseudoNote(
            frame.problem,
            frame.items.length,
            frame.capacity,
            capacityBits(frame.capacity),
          )}
        </p>
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
          <dt class="text-xs text-slate-500">{isTable ? m.stats.filled : m.stats.updates}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="filled">
            {isTable ? `${frame.filled} / ${total}` : frame.filled}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="answer">
            {m.answerText(frame.problem, frame.result)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.memory}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="memory">
            {isTable ? total : rowCells}
          </dd>
        </div>
        {#if isTable && knap}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.greedy}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="greedy">{greedy}</dd>
          </div>
        {:else if isTable}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.bits}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="bits">
              {capacityBits(frame.capacity)}
            </dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.correct}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="correct">
              {m.answerText(frame.problem, frame.correct)}
            </dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.reuses}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="reuses">{frame.reuses}</dd>
          </div>
        {/if}
      </dl>

      <div class="rounded-xl border border-slate-200 bg-white p-3" data-testid="choice">
        <h2 class="mb-2 text-xs text-slate-500">{m.choiceTitle}</h2>
        {#if filling}
          <dl class="flex flex-col gap-1 text-sm">
            <div class="flex items-center justify-between gap-2">
              <dt class="font-mono text-xs">{m.choiceSkip(frame)}</dt>
              <dd class="font-bold tabular-nums">
                {m.choiceValue(frame.problem, frame.skip)}
                {#if !frame.took}<span class="ml-1 text-xs text-emerald-800">{m.choiceKept}</span
                  >{/if}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="font-mono text-xs">{m.choiceTake(frame)}</dt>
              <dd class="font-bold tabular-nums">
                {frame.fits ? m.choiceValue(frame.problem, frame.take) : m.choiceNoFit}
                {#if frame.took}<span class="ml-1 text-xs text-emerald-800">{m.choiceKept}</span
                  >{/if}
              </dd>
            </div>
          </dl>
        {:else}
          <p class="text-sm text-slate-600">{m.choiceEmpty}</p>
        {/if}
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.itemsTitle}</h2>
        <table class="w-full text-left text-sm tabular-nums">
          <thead class="text-xs text-slate-500">
            <tr>
              <th class="font-medium">{m.itemHead.item}</th>
              <th class="font-medium">{m.itemHead.weight}</th>
              {#if knap}<th class="font-medium">{m.itemHead.value}</th>{/if}
              <th class="font-medium">{m.itemHead.state}</th>
            </tr>
          </thead>
          <tbody>
            {#each frame.items as it, k (k)}
              <tr>
                <td>{k + 1}</td>
                <td>{it.weight}</td>
                {#if knap}<td>{it.value}</td>{/if}
                <td class="text-xs font-semibold">{itemState(k + 1)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if isTable}
        <ChipList
          title={m.pickedTitle}
          emptyText={m.pickedEmpty}
          items={frame.picked.map((i) => ({ label: m.pickedChip(i) }))}
        />
      {:else}
        <ChipList title={m.noWalkTitle} emptyText={m.noWalk} items={[]} />
      {/if}
      <CodePanel lines={code} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
