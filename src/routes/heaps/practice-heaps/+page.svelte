<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import GraphCanvas from '$lib/components/graph-canvas.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { heapForest } from '$lib/components/tree-layout.js';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_COORD,
    MAX_K,
    closestPseudocode,
    closestTrace,
    dist2,
    formatPoints,
    makeMedianStream,
    makePoints,
    medianPseudocode,
    medianTrace,
    parseMedianStream,
    parsePoints,
  } from '$lib/algo-engine/practice-heaps.js';
  import { en as m } from '$lib/lessons/practice-heaps/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-heaps.js').MedianFrame} MedianFrame */
  /** @typedef {import('$lib/algo-engine/practice-heaps.js').ClosestFrame} ClosestFrame */
  /** @typedef {import('$lib/algo-engine/practice-heaps.js').HeapProblem} HeapProblem */
  /** @typedef {import('$lib/algo-engine/practice-heaps.js').Point} Point */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PROBLEM_OPTIONS = /** @type {HeapProblem[]} */ (['median', 'closest']).map((value) => ({
    value,
    label: m.problems[value],
  }));
  const SIDES = /** @type {('low' | 'high')[]} */ (['low', 'high']);
  const ORIGIN = 99;
  const W = 480;
  const H = 420;

  // Fixed first inputs keep the prerendered HTML and the hydrated page identical.
  const INITIAL_STREAM = [5, 15, 1, 3, 8, 7, 9, 10, 2];
  const INITIAL_POINTS = [
    { x: 1, y: 2 },
    { x: 3, y: 1 },
    { x: -2, y: -2 },
    { x: 0, y: 1 },
    { x: 2, y: -3 },
    { x: -4, y: 3 },
    { x: -1, y: -1 },
  ];

  let problem = $state(/** @type {HeapProblem} */ ('median'));
  let stream = $state.raw(INITIAL_STREAM);
  let streamText = $state(INITIAL_STREAM.join(', '));
  /** @type {Point[]} */
  let points = $state.raw(INITIAL_POINTS);
  let pointsText = $state(formatPoints(INITIAL_POINTS));
  let k = $state(3);
  /** @type {number | null} */
  let kDraft = $state(3);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(
    /** @type {(MedianFrame | ClosestFrame)[]} */ (medianTrace(INITIAL_STREAM)),
  );
  const frame = $derived(player.frame);
  const mf = $derived('low' in frame ? frame : null);
  const cf = $derived('low' in frame ? null : /** @type {ClosestFrame} */ (frame));
  const narration = $derived(
    notice.at === player.index
      ? notice.text
      : mf
        ? m.describeMedian(mf)
        : m.describeClosest(/** @type {ClosestFrame} */ (cf), points, k),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(problem === 'median' ? medianTrace(stream) : closestTrace(points, k));
  }

  function commitStream() {
    const r = parseMedianStream(streamText);
    if ('error' in r) {
      streamText = stream.join(', ');
      say(m.streamErrors[r.error]);
      return;
    }
    stream = r.values;
    streamText = r.values.join(', ');
    rebuild();
  }

  function commitPoints() {
    const r = parsePoints(pointsText);
    if ('error' in r) {
      pointsText = formatPoints(points);
      say(m.pointErrors[r.error]);
      return;
    }
    points = r.points;
    pointsText = formatPoints(r.points);
    rebuild();
  }

  function commitK() {
    if (typeof kDraft !== 'number' || !Number.isInteger(kDraft) || kDraft < 1 || kDraft > MAX_K) {
      kDraft = k;
      say(m.kError);
      return;
    }
    k = kDraft;
    rebuild();
  }

  function newInput() {
    if (problem === 'median') {
      stream = makeMedianStream(Math.random);
      streamText = stream.join(', ');
    } else {
      points = makePoints(Math.random);
      pointsText = formatPoints(points);
    }
    rebuild();
    say(m.newInputNotice);
  }

  /** @param {VisualState} s */
  const marker = (s) => (s ? (m.markers[/** @type {keyof typeof m.markers} */ (s)] ?? '') : '');
  /** @param {VisualState} s */
  const stateName = (s) => (s ? (m.states[/** @type {keyof typeof m.states} */ (s)] ?? '') : '');

  // Running median: the stream, both halves and the medians so far.
  /** @param {number} i @returns {VisualState} */
  function streamState(i) {
    if (!mf || mf.kind === 'start') return '';
    if (i === mf.index && mf.kind !== 'done') return 'active';
    if (mf.kind === 'done' || i <= mf.index) return 'visited';
    return '';
  }

  /** The slot a value just landed in or was moved to; -1 when none. @param {'low'|'high'} side */
  function landed(side) {
    if (!mf) return -1;
    const kind = mf.kind;
    const into =
      (kind === 'push-low' && side === 'low') ||
      (kind === 'push-high' && side === 'high') ||
      (kind === 'move-up' && side === 'high') ||
      (kind === 'move-down' && side === 'low');
    return into ? mf.slot : -1;
  }

  /** @param {'low'|'high'} side @param {number} i @returns {VisualState} */
  function halfState(side, i) {
    if (i === landed(side)) return 'active';
    return i === 0 ? 'compare' : '';
  }

  /** @param {'low'|'high'} side */
  function halfForest(side) {
    const values = mf ? mf[side] : [];
    return heapForest(values, values.length, (i) => ({
      state: halfState(side, i),
      marker: marker(halfState(side, i)),
      note: `[${i}]`,
    }));
  }

  const medianChips = $derived(
    (mf?.medians ?? []).map((x, i, all) => ({ label: String(x), hot: i === all.length - 1 })),
  );

  // K closest: the plane, the max-heap and the counts.
  const inHeap = $derived(new Set((cf?.heap ?? []).map((e) => e.index)));

  /** @param {number} i @returns {VisualState} */
  function pointState(i) {
    if (!cf) return '';
    if (i === cf.index && cf.kind !== 'done') return 'active';
    if (cf.rejected.includes(i)) return 'visited';
    if (inHeap.has(i)) return cf.kind === 'done' ? 'sorted' : 'frontier';
    return '';
  }

  const SCALE_X = (W / 2 - 30) / MAX_COORD;
  const SCALE_Y = (H / 2 - 26) / MAX_COORD;
  const graphNodes = $derived([
    { id: ORIGIN, x: W / 2, y: H / 2, label: m.originLabel },
    ...points.map((p, i) => ({
      id: i,
      x: W / 2 + p.x * SCALE_X,
      y: H / 2 - p.y * SCALE_Y,
      label: m.pointName(i),
    })),
  ]);

  /** @param {number} id @returns {VisualState} */
  const nodeState = (id) => (id === ORIGIN ? '' : pointState(id));

  /** @param {number} i @returns {VisualState} */
  function closestHeapState(i) {
    if (!cf) return '';
    const e = cf.heap[i];
    if (e.index === cf.index && cf.kind !== 'read') return 'active';
    if (i === 0 && cf.heap.length === k) return 'compare';
    return cf.kind === 'done' ? 'sorted' : 'frontier';
  }

  const closestLabels = $derived((cf?.heap ?? []).map((e) => m.pointName(e.index)));
  const closestForest = $derived(
    heapForest(closestLabels, closestLabels.length, (i) => ({
      state: closestHeapState(i),
      marker: marker(closestHeapState(i)),
      note: `d²=${cf?.heap[i].d2}`,
    })),
  );

  const legend = $derived(
    /** @type {[VisualState, string][]} */ (
      Object.entries(problem === 'median' ? m.legendMedian : m.legendClosest)
    ),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      if (problem === 'median') commitStream();
      else commitPoints();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEM_OPTIONS}
      bind:value={problem}
      onchange={rebuild}
    />
    {#if problem === 'median'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.streamLabel}
        <input
          type="text"
          name="stream"
          class="field w-80 max-w-full"
          bind:value={streamText}
          onchange={commitStream}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.pointsLabel}
        <input
          type="text"
          name="points"
          class="field w-80 max-w-full"
          bind:value={pointsText}
          onchange={commitPoints}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.kLabel}
        <input
          type="number"
          name="k"
          min="1"
          max={MAX_K}
          step="1"
          class="field w-20"
          bind:value={kDraft}
          onchange={commitK}
        />
      </label>
    {/if}
    <button type="button" class="btn-secondary" onclick={newInput}>{m.newInputButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {#if mf}
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.streamTitle}
            </h2>
            <ArrayStrip
              values={stream}
              ariaLabel={m.streamAria(stream)}
              stateOf={streamState}
              markerOf={(i) =>
                streamState(i) === 'visited' ? m.readMarker : marker(streamState(i))}
              pointers={mf.index >= 0 && mf.kind !== 'done' ? [{ name: 'x', index: mf.index }] : []}
              speed={player.speed}
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            {#each SIDES as side (side)}
              <div class="min-w-0 rounded-lg border border-slate-100 p-2">
                <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {side === 'low' ? m.lowTitle : m.highTitle}
                </h2>
                <TreeView
                  roots={halfForest(side)}
                  binary
                  ariaLabel={m.halfAria(side, mf[side])}
                  labelOf={(node) => {
                    const i = Number(node.id);
                    return m.slotLabel(i, node.label, stateName(halfState(side, i)));
                  }}
                  emptyText={m.halfEmpty(side)}
                  speed={player.speed}
                />
              </div>
            {/each}
          </div>
          <p class="text-sm text-slate-600">{m.balanceText(mf.low.length, mf.high.length)}</p>
        {:else if cf}
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.planeTitle}
            </h2>
            <GraphCanvas
              nodes={graphNodes}
              edges={[]}
              width={W}
              height={H}
              ariaLabel={m.planeAria(points)}
              {nodeState}
              markerOf={(id) => (id === ORIGIN ? '' : marker(pointState(id)))}
              noteOf={(id) => (id === ORIGIN ? '' : `${dist2(points[id])}`)}
              labelOf={(node) =>
                node.id === ORIGIN
                  ? m.originLabel
                  : m.pointLabel(node.id, points[node.id], stateName(pointState(node.id)))}
              speed={player.speed}
            />
          </div>
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.heapTitle}
            </h2>
            <TreeView
              roots={closestForest}
              binary
              ariaLabel={m.heapAria(cf.heap.map((e) => `${m.pointName(e.index)} ${e.d2}`))}
              labelOf={(node) => {
                const i = Number(node.id);
                return m.slotLabel(
                  i,
                  `${node.label}, distance² ${cf?.heap[i].d2}`,
                  stateName(closestHeapState(i)),
                );
              }}
              emptyText={m.heapAria([])}
              speed={player.speed}
            />
          </div>
        {/if}

        <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {s === 'visited' && problem === 'median' ? m.readMarker : marker(s)}
              {label}
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
      {#if mf}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.median}</dt>
            <dd class="text-2xl font-bold tabular-nums">{mf.median ?? '—'}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.moves}</dt>
            <dd class="text-2xl font-bold tabular-nums">{mf.moves}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.heapOps}</dt>
            <dd class="text-2xl font-bold tabular-nums">{mf.heapOps}</dd>
          </div>
        </dl>
        <ChipList
          title={m.mediansTitle}
          items={medianChips}
          emptyText={m.mediansEmpty}
          hotLabel={m.states.active}
        />
      {:else if cf}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
            <dd class="text-2xl font-bold tabular-nums">{cf.comparisons}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.heapOps}</dt>
            <dd class="text-2xl font-bold tabular-nums">{cf.heapOps}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.read}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {cf.kind === 'done' ? points.length : Math.max(0, cf.index + 1)} / {points.length}
            </dd>
          </div>
        </dl>
      {/if}
      <CodePanel lines={mf ? medianPseudocode : closestPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
