<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    STATE_BG,
    STATE_FILL,
    STATE_TEXT,
    rovingStep,
    stateStroke,
  } from '$lib/components/visual-state.js';
  import {
    MAX_COORD,
    MAX_N,
    MIN_N,
    closestPseudocode,
    closestTrace,
    parsePoints,
  } from '$lib/algo-engine/closest-pair.js';
  import { en as m } from '$lib/lessons/closest-pair/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/closest-pair.js').Point} Point */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.presets} PresetKey */

  /** @param {number[][]} xy @returns {Point[]} */
  const toPoints = (xy) => xy.map(([x, y], id) => ({ id, x, y }));

  /** @type {Record<PresetKey, Point[]>} */
  const PRESETS = {
    example: toPoints([
      [10, 80],
      [22, 30],
      [35, 62],
      [41, 15],
      [48, 50],
      [53, 52],
      [62, 85],
      [70, 25],
      [82, 60],
      [90, 10],
    ]),
    crowded: toPoints([
      [5, 50],
      [20, 20],
      [48, 5],
      [52, 18],
      [49, 31],
      [51, 44],
      [50, 57],
      [48, 70],
      [52, 83],
      [49, 96],
      [80, 75],
      [95, 50],
    ]),
    clusters: toPoints([
      [8, 12],
      [15, 20],
      [11, 26],
      [20, 9],
      [24, 22],
      [78, 70],
      [86, 78],
      [80, 88],
      [91, 66],
      [72, 84],
    ]),
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));

  /** @param {Point[]} pts */
  const pointsText = (pts) => pts.map((p) => `(${p.x}, ${p.y})`).join(' ');

  // Fixed first points keep the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.example;
  let points = $state.raw(INITIAL);
  let text = $state(pointsText(INITIAL));
  let preset = $state('example');
  let notice = $state({ text: '', at: -1 });
  let focusIndex = $state(0);

  const player = createPlayer(closestTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} t */
  function say(t) {
    notice = { text: t, at: player.index };
  }

  /** @param {Point[]} next */
  function load(next) {
    points = next.map((p, id) => ({ id, x: p.x, y: p.y }));
    text = pointsText(points);
    notice = { text: '', at: -1 };
    focusIndex = Math.min(focusIndex, points.length - 1);
    player.load(closestTrace(points));
  }

  function commitText() {
    const parsed = parsePoints(text);
    if ('error' in parsed) {
      text = pointsText(points);
      say(m.errors[parsed.error]);
      return;
    }
    if (pointsText(parsed.points) === pointsText(points)) return;
    preset = '';
    load(parsed.points);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    load(PRESETS[key]);
    say(m.newPointsNotice);
  }

  function randomPoints() {
    const n = 8 + Math.floor(Math.random() * (MAX_N - 7));
    /** @type {Point[]} */
    const next = [];
    while (next.length < n) {
      const x = Math.floor(Math.random() * (MAX_COORD + 1));
      const y = Math.floor(Math.random() * (MAX_COORD + 1));
      if (!next.some((p) => p.x === x && p.y === y)) next.push({ id: next.length, x, y });
    }
    preset = '';
    load(next);
    say(m.newPointsNotice);
  }

  /** @param {number} x @param {number} y */
  function addPoint(x, y) {
    if (points.length >= MAX_N) return say(m.fullNotice);
    if (points.some((p) => p.x === x && p.y === y)) return say(m.takenNotice);
    preset = '';
    load([...points, { id: points.length, x, y }]);
    say(m.addedNotice(points.length - 1, x, y));
  }

  /** @param {number} id */
  function removePoint(id) {
    if (points.length <= MIN_N) return say(m.minNotice);
    const gone = points[id];
    preset = '';
    load(points.filter((p) => p.id !== id));
    say(m.removedNotice(gone.x, gone.y));
  }

  // Drawing: plane coordinates 0..99, y up; one unit is SCALE pixels.
  const SCALE = 4;
  const PAD = 4;
  const SIZE = MAX_COORD + 1;
  const vb = SIZE + 2 * PAD;
  /** @param {number} y */
  const sy = (y) => MAX_COORD - y;

  /** @param {MouseEvent & {currentTarget: SVGSVGElement}} e */
  function onPlaneClick(e) {
    if (/** @type {Element} */ (e.target).closest('[data-point]')) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const ux = ((e.clientX - box.left) / box.width) * vb - PAD;
    const uy = ((e.clientY - box.top) / box.height) * vb - PAD;
    const x = Math.round(ux);
    const y = Math.round(MAX_COORD - uy);
    if (x < 0 || y < 0 || x > MAX_COORD || y > MAX_COORD) return;
    addPoint(x, y);
  }

  /** @param {KeyboardEvent} e @param {number} at */
  function onPointKey(e, at) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removePoint(points[at].id);
      return;
    }
    const next = rovingStep(e.key, at, points.length);
    if (next === null) return;
    e.preventDefault();
    focusIndex = next;
    /** @type {SVGElement | null} */ (document.querySelector(`[data-point="${next}"]`))?.focus();
  }

  const position = $derived(new Map(frame.points.map((p, i) => [p.id, i])));
  const finished = $derived(frame.kind === 'done');

  /** @param {number} id @returns {VisualState} */
  function pointState(id) {
    if (finished) return frame.pair?.includes(id) ? 'path' : '';
    if (frame.checking?.includes(id)) return 'compare';
    if (frame.pair?.includes(id) && frame.kind !== 'brute') return 'sorted';
    if (frame.strip.includes(id)) return 'frontier';
    return '';
  }

  /** @param {number} id */
  function faded(id) {
    if (!frame.range) return false;
    const at = /** @type {number} */ (position.get(id));
    return at < frame.range[0] || at > frame.range[1];
  }

  const showBand = $derived(
    frame.line !== null &&
      frame.d2 !== Infinity &&
      (frame.kind === 'combine' || frame.kind === 'strip' || frame.kind === 'strip-check'),
  );
  const band = $derived.by(() => {
    if (!showBand || frame.line === null) return null;
    const d = Math.sqrt(frame.d2);
    const from = Math.max(0, frame.line - d);
    const to = Math.min(MAX_COORD, frame.line + d);
    return { from, width: to - from };
  });
  /** @param {[number, number] | null} pair */
  const segment = (pair) => {
    if (!pair) return null;
    const [a, b] = pair.map((id) => /** @type {Point} */ (frame.points.find((p) => p.id === id)));
    return { x1: a.x, y1: sy(a.y), x2: b.x, y2: sy(b.y) };
  };
  const checkSeg = $derived(segment(frame.checking));
  const bestSeg = $derived(
    frame.kind === 'start' || frame.kind === 'sort' ? null : segment(frame.pair),
  );
  const stackChips = $derived(
    frame.stack.map(([lo, hi], t) => ({
      label: m.rangeChip(lo, hi),
      hot: t === frame.stack.length - 1,
    })),
  );
  const legend = /** @type {const} */ (['compare', 'sorted', 'frontier', 'path']);
  const n = $derived(frame.points.length);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitText();
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
      {m.pointsLabel}
      <input
        type="text"
        name="points"
        class="field w-full font-mono"
        bind:value={text}
        onchange={commitText}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomPoints}>{m.shuffle}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ScrollFrame>
          <!-- Adding by pointer has a keyboard path through the Points field. -->
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
          <svg
            viewBox="{-PAD} {-PAD} {vb} {vb}"
            role="group"
            aria-label={m.planeLabel(points.length)}
            class="mx-auto block h-auto cursor-crosshair"
            style="width: {vb * SCALE}px; max-width: 100%; min-width: 300px"
            onclick={onPlaneClick}
          >
            <rect x="0" y="0" width={MAX_COORD} height={MAX_COORD} class="fill-slate-50" />
            {#each [10, 20, 30, 40, 50, 60, 70, 80, 90] as g (g)}
              <line
                x1={g}
                y1="0"
                x2={g}
                y2={MAX_COORD}
                class="stroke-slate-200"
                stroke-width="0.3"
              />
              <line
                x1="0"
                y1={sy(g)}
                x2={MAX_COORD}
                y2={sy(g)}
                class="stroke-slate-200"
                stroke-width="0.3"
              />
            {/each}
            {#if band}
              <rect
                x={band.from}
                y="0"
                width={band.width}
                height={MAX_COORD}
                class="fill-state-frontier/20 stroke-state-frontier"
                stroke-width="0.4"
              />
            {/if}
            {#if frame.line !== null}
              <line
                x1={frame.line}
                y1="0"
                x2={frame.line}
                y2={MAX_COORD}
                class="stroke-teal-700"
                stroke-width="0.6"
                stroke-dasharray="2 1.5"
              />
            {/if}
            {#if bestSeg}
              <line
                {...bestSeg}
                class={finished ? 'stroke-state-path' : 'stroke-state-sorted'}
                stroke-width="1.2"
              />
            {/if}
            {#if checkSeg}
              <line
                {...checkSeg}
                class="stroke-state-compare"
                stroke-width="0.9"
                stroke-dasharray="1.5 1"
              />
            {/if}
            {#each points as p, at (p.id)}
              {@const s = pointState(p.id)}
              <g
                data-point={at}
                role="button"
                tabindex={at === focusIndex ? 0 : -1}
                aria-label={m.pointLabel(p.id, p.x, p.y, m.states[s] ?? '')}
                class="cursor-pointer outline-none [&:focus-visible>circle]:stroke-teal-700 [&:focus-visible>circle]:stroke-[1.2] {faded(
                  p.id,
                )
                  ? 'opacity-40'
                  : ''}"
                onclick={() => removePoint(p.id)}
                onkeydown={(e) => onPointKey(e, at)}
                onfocus={() => (focusIndex = at)}
              >
                <circle
                  cx={p.x}
                  cy={sy(p.y)}
                  r="2.8"
                  stroke-width="0.5"
                  class="{STATE_FILL[s]} {stateStroke(s)}"
                />
                <text
                  x={p.x}
                  y={sy(p.y)}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="3"
                  font-weight="700"
                  class={STATE_TEXT[s]}
                  aria-hidden="true">{m.letter(p.id)}</text
                >
                {#if m.markers[s]}
                  <text
                    x={p.x + 3.6}
                    y={sy(p.y) - 3.2}
                    font-size="3"
                    font-weight="700"
                    stroke="white"
                    stroke-width="0.8"
                    paint-order="stroke"
                    class="fill-slate-900"
                    aria-hidden="true">{m.markers[s]}</text
                  >
                {/if}
              </g>
            {/each}
          </svg>
        </ScrollFrame>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {m.markers[s]}
              {m.legend[s]}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="h-3 w-0 border-l-2 border-dashed border-teal-700"></span>
            {m.legend.line}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="bg-state-frontier/20 border-state-frontier size-3 rounded-sm border"
            ></span>
            {m.legend.band}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full border border-slate-400 bg-white opacity-40"></span>
            {m.legend.faded}
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.checks}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.checks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pairs}</dt>
          <dd class="text-2xl font-bold tabular-nums">{(n * (n - 1)) / 2}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.d}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.fmt(frame.d2)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.best}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.fmt(frame.best2)}</dd>
          <dd class="text-xs text-slate-500">{m.pairText(frame.bestPair)}</dd>
        </div>
      </dl>
      <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      <CodePanel lines={closestPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
