<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT } from '$lib/components/visual-state.js';
  import {
    BLOCK_SIZES,
    MAX_CACHE,
    MIN_CACHE,
    SIZES,
    blockBoxes,
    blockOf,
    transposePseudocode,
    transposeTrace,
    visitOrder,
  } from '$lib/algo-engine/cache-oblivious-algorithms.js';
  import { vi as m } from '$lib/lessons/cache-oblivious-algorithms/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/cache-oblivious-algorithms.js').Traversal} Traversal */
  /** @typedef {import('$lib/algo-engine/cache-oblivious-algorithms.js').Layout} Layout */
  /** @typedef {import('$lib/algo-engine/cache-oblivious-algorithms.js').TransposeSetup} TransposeSetup */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // Fixed defaults keep the prerendered HTML and the hydrated page identical.
  /** @type {TransposeSetup} */
  const DEFAULTS = { n: 8, block: 4, cache: 4, order: 'rows', layout: 'row' };
  const ORDER_OPTIONS = /** @type {Traversal[]} */ (['rows', 'recursive']).map((value) => ({
    value,
    label: m.orders[value],
  }));
  const LAYOUT_OPTIONS = /** @type {Layout[]} */ (['row', 'z']).map((value) => ({
    value,
    label: m.layouts[value],
  }));
  const SIZE_OPTIONS = SIZES.map((v) => ({ value: String(v), label: String(v) }));
  const BLOCK_OPTIONS = BLOCK_SIZES.map((v) => ({ value: String(v), label: String(v) }));
  const CELL = /** @type {Record<number, number>} */ ({ 4: 36, 8: 26, 16: 17 });

  let order = $state(DEFAULTS.order);
  let layout = $state(DEFAULTS.layout);
  let sizeText = $state(String(DEFAULTS.n));
  let blockText = $state(String(DEFAULTS.block));
  let cache = $state(DEFAULTS.cache);

  /** @returns {TransposeSetup} */
  const current = () => ({
    n: Number(sizeText),
    block: Number(blockText),
    cache,
    order,
    layout,
  });
  let setup = $state.raw(DEFAULTS);
  const player = createPlayer(transposeTrace(DEFAULTS));
  const frame = $derived(player.frame);
  const half = $derived((setup.n * setup.n) / setup.block);
  /** @param {number} id */
  const blockName = (id) => (id < half ? m.blockName('A', id) : m.blockName('B', id - half));
  const narration = $derived(m.describe(frame, setup, blockName));
  const cached = $derived(new Set(frame.cache));
  /** When each cell of A is copied, by i · N + j. */
  const rank = $derived.by(() => {
    const r = Array(setup.n * setup.n).fill(0);
    visitOrder(setup.order, setup.n).forEach(({ i, j }, k) => (r[i * setup.n + j] = k));
    return r;
  });
  const boxes = $derived({ A: blockBoxes(setup, 'A'), B: blockBoxes(setup, 'B') });
  const cell = $derived(CELL[setup.n]);
  const lastBlocks = $derived(
    frame.kind === 'copy'
      ? new Set([blockOf(setup, 'A', frame.i, frame.j), blockOf(setup, 'B', frame.j, frame.i)])
      : new Set(),
  );
  const cacheItems = $derived(
    frame.cache.map((id) => ({ label: blockName(id), hot: lastBlocks.has(id) })),
  );

  function rebuild() {
    setup = current();
    player.load(transposeTrace(setup));
  }

  /**
   * The cell (r, c) of matrix A, or of B (where it holds A[c][r]).
   * @param {'A'|'B'} name @param {number} r @param {number} c
   */
  function cellInfo(name, r, c) {
    const [i, j] = name === 'A' ? [r, c] : [c, r];
    const now = frame.kind === 'copy' && frame.i === i && frame.j === j;
    const done = rank[i * setup.n + j] < frame.copied && !now;
    const block = blockOf(setup, name, r, c);
    const inCache = cached.has(block);
    const hit = name === 'A' ? frame.hitA : frame.hitB;
    /** @type {VisualState} */
    const state = now ? 'active' : inCache ? 'frontier' : '';
    let mark = '';
    if (now) mark = hit ? m.markers.hit : m.markers.miss;
    else if (done) mark = m.markers.done;
    const parts = [];
    if (now) parts.push(m.states.now, hit ? m.states.hit : m.states.miss);
    else if (inCache) parts.push(m.states.cached);
    if (done) parts.push(m.states.done);
    return {
      state,
      mark,
      block: name === 'A' ? block : block - half,
      label: parts.join(', '),
    };
  }

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

{#snippet stat(/** @type {string} */ label, /** @type {string | number} */ value)}
  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-2xl font-bold tabular-nums">{value}</dd>
  </div>
{/snippet}

{#snippet matrix(/** @type {'A'|'B'} */ name)}
  {@const size = setup.n * cell}
  {@const inCache = boxes[name].filter((b) => cached.has(b.id)).length}
  <figure class="flex flex-col gap-1">
    <figcaption class="text-xs font-semibold text-slate-600">
      {m.matrixTitle(name, setup.n)}
    </figcaption>
    <svg
      width={size + 2}
      height={size + 2}
      viewBox="-1 -1 {size + 2} {size + 2}"
      role="img"
      aria-label={m.matrixAria(name, inCache, boxes[name].length)}
      data-matrix={name}
    >
      {#each { length: setup.n } as _, r (r)}
        {#each { length: setup.n } as _, c (c)}
          {@const info = cellInfo(name, r, c)}
          <g>
            <title>{m.cellLabel(name, r, c, info.block, info.label)}</title>
            <rect
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              class="{STATE_FILL[info.state]} stroke-slate-200 {player.speed < 8
                ? 'transition-colors'
                : ''}"
            />
            {#if info.mark}
              <text
                x={c * cell + cell / 2}
                y={r * cell + cell / 2}
                text-anchor="middle"
                dominant-baseline="central"
                class="text-[10px] font-bold {STATE_TEXT[info.state]}">{info.mark}</text
              >
            {/if}
          </g>
        {/each}
      {/each}
      {#each boxes[name] as b (b.id)}
        <rect
          x={b.left * cell}
          y={b.top * cell}
          width={(b.right - b.left + 1) * cell}
          height={(b.bottom - b.top + 1) * cell}
          class="fill-none stroke-slate-700"
          stroke-width="1.5"
        />
      {/each}
    </svg>
  </figure>
{/snippet}

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.orderLabel}
      name="order"
      options={ORDER_OPTIONS}
      bind:value={order}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.layoutLabel}
      name="layout"
      options={LAYOUT_OPTIONS}
      bind:value={layout}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.sizeLabel}
      name="size"
      options={SIZE_OPTIONS}
      bind:value={sizeText}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.blockLabel}
      name="block"
      options={BLOCK_OPTIONS}
      bind:value={blockText}
      onchange={rebuild}
    />
    <label class={labelClass}>
      {m.cacheLabel}: {cache}
      <input
        type="range"
        name="cache"
        min={MIN_CACHE}
        max={MAX_CACHE}
        bind:value={cache}
        onchange={rebuild}
        class="focus-ring rounded accent-teal-700"
      />
      <span class="font-normal tracking-normal normal-case">{m.cacheNote(cache, setup.block)}</span>
    </label>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <div class="flex flex-wrap justify-center gap-6 overflow-x-auto">
          {@render matrix('A')}
          {@render matrix('B')}
        </div>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
            {m.legend.now}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.frontier}"></span>
            {m.legend.cached}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-400 bg-white"></span>
            {m.legend.done}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border-2 border-slate-700"></span>
            {m.legend.block}
          </li>
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
        {@render stat(m.stats.copied, frame.copied)}
        {@render stat(m.stats.transfers, frame.missA + frame.missB)}
        {@render stat(m.stats.split, m.split(frame.missA, frame.missB))}
        {@render stat(m.stats.ideal, (2 * setup.n * setup.n) / setup.block)}
      </dl>
      <ChipList
        title={m.cacheTitle}
        items={cacheItems}
        emptyText={m.cacheEmpty}
        hotLabel={m.hotBlock}
      />
      <CodePanel lines={transposePseudocode(setup.order)} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
