<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_EDGES,
    N,
    hasEdge,
    makeEdges,
    streamPseudocode,
    streamTrace,
  } from '$lib/algo-engine/practice-union-find.js';
  import { en as m } from '$lib/lessons/practice-union-find/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-union-find.js').Edge} Edge */
  /** @typedef {'roads'|'tree'|'random'} Preset */

  const PRESETS = /** @type {const} */ (['roads', 'tree', 'random']);
  const W = 340;
  const H = 300;
  const R = 18;
  const VERTICES = Array.from({ length: N }, (_, i) => i);
  // Vertices sit on a circle, so every edge is a chord and none hides behind a vertex.
  const POS = VERTICES.map((i) => ({
    x: W / 2 + 115 * Math.sin((2 * Math.PI * i) / N),
    y: H / 2 - 115 * Math.cos((2 * Math.PI * i) / N),
  }));
  /** Component fills by component name (its smallest vertex); the name is also written under each vertex. */
  const COMP_FILL = [
    'fill-amber-200',
    'fill-lime-200',
    'fill-violet-200',
    'fill-orange-200',
    'fill-emerald-200',
    'fill-pink-200',
    'fill-sky-200',
    'fill-stone-200',
  ];

  // A fixed first stream keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = makeEdges('roads');
  /** @type {Edge[]} */
  let edges = $state.raw(INITIAL);
  let from = $state('0');
  let to = $state('4');
  let preset = $state('roads');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(streamTrace(INITIAL));
  const frame = $derived(player.frame);
  const current = $derived(frame.edgeIndex >= 0 ? edges[frame.edgeIndex] : null);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, edges));
  const groups = $derived(
    VERTICES.filter((v) => frame.comp[v] === v).map((c) =>
      VERTICES.filter((v) => frame.comp[v] === c),
    ),
  );
  const flagged = $derived(
    edges.flatMap((e, i) => (frame.status[i] === 'cycle' ? [m.edgeName(e)] : [])),
  );
  const accepted = $derived(frame.status.filter((s) => s === 'tree').length);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {Edge[]} next @param {'first'|'last'|'new'} at */
  function setEdges(next, at) {
    notice = { text: '', at: -1 };
    edges = next;
    const frames = streamTrace(next);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    if (at === 'new') player.seek(frames.findIndex((f) => f.edgeIndex === next.length - 1));
  }

  function add() {
    const u = Number(from);
    const v = Number(to);
    if (u === v) return say(m.edits.loop);
    if (hasEdge(edges, u, v)) return say(m.edits.repeat);
    if (edges.length >= MAX_EDGES) return say(m.edits.full);
    preset = '';
    setEdges([...edges, [u, v]], 'new');
  }

  function undo() {
    if (edges.length === 0) return;
    preset = '';
    setEdges(edges.slice(0, -1), 'last');
  }

  function clear() {
    if (edges.length === 0) return;
    preset = '';
    setEdges([], 'first');
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {Preset} */ (e.currentTarget.value);
    setEdges(makeEdges(picked, Math.random), 'first');
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} i */
  function edgeLook(i) {
    const s = frame.status[i];
    if (i === frame.edgeIndex)
      return { cls: s === 'cycle' ? 'stroke-rose-600' : 'stroke-sky-600', width: 5, dash: '' };
    if (s === 'tree') return { cls: 'stroke-slate-700', width: 3, dash: '' };
    if (s === 'cycle') return { cls: 'stroke-rose-600', width: 2.5, dash: '6 4' };
    return { cls: 'stroke-slate-300', width: 1.5, dash: '3 4' };
  }

  const fade = $derived(player.speed < 8 ? 'transition-colors' : '');
  const streamChips = $derived(
    edges.map((e, i) => ({
      label: m.streamChip(i, e, frame.status[i]),
      hot: i === frame.edgeIndex,
    })),
  );
  const historyChips = $derived(
    frame.history.map((c, i) => ({ label: m.historyChip(i, c), hot: i === frame.edgeIndex })),
  );

  const legend = [
    { key: 'pending', swatch: 'border-2 border-dashed border-slate-300 bg-white' },
    { key: 'tree', swatch: 'bg-slate-700' },
    { key: 'cycle', swatch: 'bg-rose-600' },
    { key: 'current', swatch: 'bg-sky-600' },
    { key: 'component', swatch: 'bg-amber-200 border border-slate-500' },
  ].map((l) => ({ ...l, label: m.legend[/** @type {keyof typeof m.legend} */ (l.key)] }));
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field submits the form, which adds the edge; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add();
    }}
  >
    <div class="flex gap-2">
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fromLabel}
        <select name="from" class="field" bind:value={from}>
          {#each VERTICES as v (v)}
            <option value={String(v)}>{m.letter(v)}</option>
          {/each}
        </select>
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.toLabel}
        <select name="to" class="field" bind:value={to}>
          {#each VERTICES as v (v)}
            <option value={String(v)}>{m.letter(v)}</option>
          {/each}
        </select>
      </label>
    </div>
    <button type="submit" class="btn-primary">{m.add}</button>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when the stream empties. -->
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" onclick={undo} class="btn-outline" aria-disabled={edges.length === 0}
        >{m.undo}</button
      >
      <button type="button" onclick={clear} class="btn-outline" aria-disabled={edges.length === 0}
        >{m.clear}</button
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
        <ScrollFrame>
          <svg
            viewBox="0 0 {W} {H}"
            role="img"
            aria-label={m.graphLabel(groups, flagged)}
            class="mx-auto block h-auto"
            style="width: {W * 1.3}px; max-width: 100%; min-width: 300px"
          >
            {#each edges as e, i (i)}
              {@const a = POS[e[0]]}
              {@const b = POS[e[1]]}
              {@const look = edgeLook(i)}
              <g>
                <title>{m.edgeLabel(i, e, frame.status[i])}</title>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke-width={look.width}
                  stroke-dasharray={look.dash || undefined}
                  class="{look.cls} {fade}"
                />
                <text
                  x={(a.x + b.x) / 2}
                  y={(a.y + b.y) / 2}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="11"
                  font-weight="700"
                  stroke="white"
                  stroke-width="4"
                  paint-order="stroke"
                  class={frame.status[i] === 'cycle' ? 'fill-rose-700' : 'fill-slate-700'}
                  aria-hidden="true">{frame.status[i] === 'cycle' ? `✕${i + 1}` : `#${i + 1}`}</text
                >
              </g>
            {/each}
            {#each VERTICES as v (v)}
              {@const p = POS[v]}
              {@const isEnd = current !== null && (current[0] === v || current[1] === v)}
              <g>
                <title>{m.vertexLabel(v, frame.comp[v], isEnd)}</title>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={R}
                  stroke-width={isEnd ? 4 : 1.5}
                  class="{COMP_FILL[frame.comp[v]]} {isEnd
                    ? 'stroke-sky-700'
                    : 'stroke-slate-500'} {fade}"
                />
                <text
                  x={p.x}
                  y={p.y}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="14"
                  font-weight="700"
                  class="fill-slate-900"
                  aria-hidden="true">{m.letter(v)}</text
                >
                <text
                  x={p.x}
                  y={p.y + R + 10}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="10"
                  stroke="white"
                  stroke-width="3"
                  paint-order="stroke"
                  class="fill-slate-600"
                  aria-hidden="true">{m.setNote(frame.comp[v])}</text
                >
              </g>
            {/each}
          </svg>
        </ScrollFrame>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as l (l.key)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {l.swatch}"></span>{l.label}
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.components}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.components}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.accepted}</dt>
          <dd class="text-2xl font-bold tabular-nums">{accepted}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cycles}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.cycles}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.first}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.firstCycle(frame.firstCycle)}</dd>
        </div>
      </dl>
      <ChipList
        title={m.streamTitle}
        items={streamChips}
        emptyText={m.streamEmpty}
        limit={MAX_EDGES}
        hotLabel={m.hotLabel}
      />
      <ChipList
        title={m.historyTitle}
        items={historyChips}
        emptyText={m.historyEmpty}
        limit={MAX_EDGES}
        hotLabel={m.hotLabel}
      />
      <CodePanel lines={streamPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
