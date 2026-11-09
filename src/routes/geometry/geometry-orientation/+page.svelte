<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    GRID,
    ORIENTATION_PRESETS,
    orientationPseudocode,
    orientationTrace,
    turnOf,
  } from '$lib/algo-engine/geometry-orientation.js';
  import { en as m } from '$lib/lessons/geometry-orientation/copy.en.js';
  import PointPlane from '$lib/lessons/geometry-orientation/point-plane.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/geometry-orientation.js').Point} Point */
  /** @typedef {keyof typeof ORIENTATION_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(ORIENTATION_PRESETS));
  const NAMES = ['A', 'B', 'C'];
  const INITIAL = ORIENTATION_PRESETS.left;

  let preset = $state(/** @type {Preset | ''} */ ('left'));
  let spots = $state.raw(/** @type {Point[]} */ ([INITIAL.a, INITIAL.b, INITIAL.c]));

  const player = createPlayer(orientationTrace(INITIAL.a, INITIAL.b, INITIAL.c));
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame));

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    const { a, b, c } = ORIENTATION_PRESETS[p];
    spots = [a, b, c];
    player.load(orientationTrace(a, b, c));
  }

  /** A drag keeps the verdict live: the run is redone and shown at its last step. */
  /** @param {number} id @param {number} x @param {number} y */
  function move(id, x, y) {
    preset = '';
    spots = spots.map((p, i) => (i === id ? { x, y } : p));
    player.load(orientationTrace(spots[0], spots[1], spots[2]));
    player.seek(player.frames.length - 1);
  }

  const points = $derived(
    spots.map((p, id) => ({
      id,
      x: p.x,
      y: p.y,
      label: NAMES[id],
      note: `(${p.x}, ${p.y})`,
      state: /** @type {import('$lib/components/visual-state.js').VisualState} */ (
        id === 0 ? 'active' : ''
      ),
    })),
  );
  const segments = $derived.by(() => {
    /** @type {import('$lib/lessons/geometry-orientation/plane-types.js').PlaneSegment[]} */
    const out = [];
    const { a, b, c } = frame;
    if (frame.u)
      out.push({
        key: 'u',
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        state: 'active',
        arrow: true,
        thick: frame.kind === 'u',
        label: 'u',
      });
    if (frame.v)
      out.push({
        key: 'v',
        x1: a.x,
        y1: a.y,
        x2: c.x,
        y2: c.y,
        state: 'compare',
        arrow: true,
        thick: frame.kind === 'v',
        label: 'v',
      });
    return out;
  });
  const polygons = $derived.by(() => {
    if (frame.cross === null) return [];
    const state = /** @type {import('$lib/components/visual-state.js').VisualState} */ (
      frame.cross > 0 ? 'sorted' : 'swap'
    );
    return frame.cross === 0 ? [] : [{ key: 'tri', pts: [frame.a, frame.b, frame.c], state }];
  });
  const exactTurn = $derived(frame.cross === null ? null : turnOf(frame.cross));
  const floatsWrong = $derived(frame.floatTurn !== null && frame.floatTurn !== exactTurn);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(/** @type {Preset} */ (e.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <PointPlane
          ariaLabel={m.planeLabel}
          xMax={GRID.xMax}
          yMax={GRID.yMax}
          {points}
          {segments}
          {polygons}
          labelOf={(p) => m.pointLabel(p.label, p.x, p.y)}
          onmove={move}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-active"></span>{m.legend
              .u}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-compare"></span>{m
              .legend.v}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-sorted"></span>{m.legend
              .left}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-swap"></span>{m.legend
              .right}
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
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.turn}</dt>
          <dd class="text-2xl font-bold" data-testid="turn">
            {frame.turn ? m.turns[frame.turn] : m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cross}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="cross">
            {frame.cross === null ? m.pending : String(frame.cross).replace('-', '−')}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.dot}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="dot">
            {frame.dot === null ? m.pending : String(frame.dot).replace('-', '−')}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.area}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="area">
            {frame.cross === null ? m.pending : Math.abs(frame.cross) / 2}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.multiplications}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.multiplications}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.angle}</dt>
          <dd class="text-lg font-semibold" data-testid="angle">
            {frame.angle ? m.angles[frame.angle] : m.pending}
          </dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.precisionTitle}
        </h2>
        <p class="mt-1 text-xs text-slate-500">{m.precisionHint}</p>
        {#if frame.floatCross !== null && frame.cross !== null}
          <dl class="mt-2 space-y-1">
            <div>
              <dt class="text-xs text-slate-500">{m.precisionRows.exact}</dt>
              <dd class="tabular-nums" data-testid="exact-row">
                {m.exactInTenths(frame.cross)}: {m.turns[turnOf(frame.cross)]}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">{m.precisionRows.float}</dt>
              <dd class="tabular-nums" data-testid="float-row">
                {m.float(frame.floatCross)}: {m.turns[frame.floatTurn ?? 'collinear']}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-slate-500">{m.precisionRows.epsilon}</dt>
              <dd data-testid="epsilon-row">{m.turns[frame.epsilonTurn ?? 'collinear']}</dd>
            </div>
          </dl>
          <p class="mt-2 font-semibold" data-testid="float-verdict">
            {floatsWrong ? m.precisionWrong : m.precisionFine}
          </p>
        {:else}
          <p class="mt-2 text-slate-500">{m.pending}</p>
        {/if}
      </section>

      <CodePanel lines={orientationPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-6 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-2 text-sm font-semibold text-slate-900">{m.workedTitle}</h2>
    <ol class="list-decimal space-y-1 pl-5 text-sm text-slate-700">
      {#each m.workedSteps as step, i (i)}
        <li>{step}</li>
      {/each}
    </ol>
  </section>

  <div class="mt-6">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
