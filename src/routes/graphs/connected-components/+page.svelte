<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GridBoard from '$lib/components/grid-board.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_COLS,
    MAX_ROWS,
    componentsPseudocode,
    componentsTrace,
    randomLand,
  } from '$lib/algo-engine/connected-components.js';
  import { en as m } from '$lib/lessons/connected-components/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  const ROWS = MAX_ROWS;
  const COLS = MAX_COLS;

  // A fixed starting map so the prerendered HTML matches the hydrated page. The chain
  // (3,1), (4,2), (5,3) touches only at corners, so 4 and 8 directions disagree on it.
  const START_MAP = [
    'LL....L.....',
    'LL...LL...L.',
    '....LL...LL.',
    '.L......LL..',
    '..L.........',
    '...L...LLL..',
    '......LL.L..',
    'LL.....L...L',
  ];
  const DEFAULT_LAND = START_MAP.flatMap((row, r) =>
    [...row].flatMap((ch, c) => (ch === 'L' ? [r * COLS + c] : [])),
  );

  /** Island fills, cycled by island number; every island also shows its number. */
  const ISLAND_CLS = [
    'bg-amber-200 text-amber-950',
    'bg-lime-200 text-lime-950',
    'bg-violet-200 text-violet-950',
    'bg-orange-200 text-orange-950',
    'bg-emerald-200 text-emerald-950',
    'bg-pink-200 text-pink-950',
  ];

  // A fresh set is assigned on every edit and never mutated afterwards.
  let land = $state.raw(new Set(DEFAULT_LAND));
  let connectivity = $state('4');
  let notice = $state({ text: '', at: -1 });

  const build = () =>
    componentsTrace({
      rows: ROWS,
      cols: COLS,
      land,
      connectivity: connectivity === '8' ? 8 : 4,
    });

  const player = createPlayer(build());
  const frame = $derived(player.frame);
  const queueSet = $derived(new Set(frame.queue));
  const largest = $derived(frame.sizes.length ? Math.max(...frame.sizes) : 0);
  const labelled = $derived(frame.sizes.reduce((s, x) => s + x, 0));
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, COLS));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(build());
  }

  /** @param {number} cell @param {boolean} on */
  function setLand(cell, on) {
    if (land.has(cell) === on) return;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const next = new Set(land);
    if (on) next.add(cell);
    else next.delete(cell);
    land = next;
    rebuild();
  }

  /** A keyboard edit, confirmed in the narration since a recolour is silent. @param {number} cell */
  function edit(cell) {
    const on = !land.has(cell);
    setLand(cell, on);
    const at = m.coord(cell, COLS);
    notice = { text: on ? m.edits.landAdded(at) : m.edits.landRemoved(at), at: player.index };
  }

  /** @param {Iterable<number>} cells */
  function replace(cells) {
    land = new Set(cells);
    rebuild();
  }

  /** @param {number} cell */
  function cellLook(cell) {
    if (!land.has(cell)) return { cls: 'bg-sky-100', label: m.states.water, mark: '' };
    const k = frame.labels[cell];
    if (k === 0) return { cls: 'bg-stone-400', label: m.states.land, mark: '' };
    const mark = String(k);
    if (cell === frame.current)
      return { cls: 'bg-state-active text-white', label: m.states.current, mark };
    if (queueSet.has(cell)) {
      const ring = cell === frame.touched ? ' ring-2 ring-inset ring-sky-900' : '';
      return { cls: 'bg-state-frontier text-slate-900' + ring, label: m.states.queued, mark };
    }
    return { cls: ISLAND_CLS[(k - 1) % ISLAND_CLS.length], label: '', mark };
  }

  const legend = [
    ['bg-sky-100 ring-1 ring-sky-300 ring-inset', m.legend.water],
    ['bg-stone-400', m.legend.land],
    ['bg-state-active', m.legend.current],
    ['bg-state-frontier', m.legend.queued],
    ['bg-amber-200', m.legend.island],
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.connectivityLabel}
      name="connectivity"
      options={[
        { value: '4', label: m.connectivity[4] },
        { value: '8', label: m.connectivity[8] },
      ]}
      bind:value={connectivity}
      onchange={rebuild}
    />
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn-secondary"
        onclick={() => replace(randomLand(ROWS, COLS, 0.42))}>{m.randomMap}</button
      >
      <button type="button" class="btn-outline" onclick={() => replace([])}>{m.clearMap}</button>
      <button type="button" class="btn-outline" onclick={() => replace(DEFAULT_LAND)}
        >{m.resetMap}</button
      >
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <GridBoard
          rows={ROWS}
          cols={COLS}
          cellState={(cell) => {
            const s = cellLook(cell);
            const k = land.has(cell) ? frame.labels[cell] : 0;
            return { ...s, label: m.cellLabel(cell, COLS, s.label, k ? m.islandNote(k) : '') };
          }}
          gridLabel={m.gridLabel}
          initialFocus={0}
          speed={player.speed}
          onPaintStart={(cell) => {
            const on = !land.has(cell);
            setLand(cell, on);
            return on;
          }}
          onPaint={setLand}
          onEdit={edit}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [cls, label], i (i)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {cls}"></span>{label}
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
          <dt class="text-xs text-slate-500">{m.stats.islands}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.count}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.labelled}</dt>
          <dd class="text-2xl font-bold tabular-nums">{labelled}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.largest}</dt>
          <dd class="text-2xl font-bold tabular-nums">{largest}</dd>
        </div>
      </dl>
      <ChipList
        title={m.queueLabel}
        emptyText={m.queueEmpty}
        hotLabel={m.hotLabel}
        items={frame.queue.map((c) => ({
          label: m.coord(c, COLS),
          hot: frame.kind === 'label' && c === frame.touched,
        }))}
      />
      <CodePanel lines={componentsPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
