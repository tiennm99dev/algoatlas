<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    GRID,
    SEGMENT_PRESETS,
    segmentPseudocode,
    segmentTrace,
  } from '$lib/algo-engine/segment-intersection.js';
  import PointPlane from '$lib/lessons/geometry-orientation/point-plane.svelte';
  import { en as m } from '$lib/lessons/segment-intersection/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/segment-intersection.js').Point} Point */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {keyof typeof SEGMENT_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(SEGMENT_PRESETS));
  const NAMES = ['A', 'B', 'C', 'D'];
  /** The end point each of o1 to o4 tests, and the two ends of the line it is tested against. */
  const TESTED = [0, 1, 2, 3];
  const AGAINST = [
    [2, 3],
    [2, 3],
    [0, 1],
    [0, 1],
  ];
  const INITIAL = SEGMENT_PRESETS.crossing;

  let preset = $state(/** @type {Preset | ''} */ ('crossing'));
  let spots = $state.raw(/** @type {Point[]} */ ([INITIAL.a, INITIAL.b, INITIAL.c, INITIAL.d]));

  const player = createPlayer(segmentTrace(INITIAL.a, INITIAL.b, INITIAL.c, INITIAL.d));
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame));

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    const { a, b, c, d } = SEGMENT_PRESETS[p];
    spots = [a, b, c, d];
    player.load(segmentTrace(a, b, c, d));
  }

  /** A drag keeps the answer live: the run is redone and shown at its last step. */
  /** @param {number} id @param {number} x @param {number} y */
  function move(id, x, y) {
    preset = '';
    spots = spots.map((p, i) => (i === id ? { x, y } : p));
    player.load(segmentTrace(spots[0], spots[1], spots[2], spots[3]));
    player.seek(player.frames.length - 1);
  }

  const atTest = $derived(frame.kind === 'orient' || frame.kind === 'onSegment' ? frame.at : null);
  const points = $derived(
    [frame.a, frame.b, frame.c, frame.d].map((p, id) => ({
      id,
      x: p.x,
      y: p.y,
      label: NAMES[id],
      note: `(${p.x}, ${p.y})`,
      state: /** @type {VisualState} */ (
        atTest === TESTED[id]
          ? 'compare'
          : atTest !== null && AGAINST[atTest].includes(id)
            ? 'active'
            : ''
      ),
    })),
  );
  const segments = $derived.by(() => {
    const ends = [frame.a, frame.b, frame.c, frame.d];
    /** @type {VisualState} */
    const state = frame.hit ? 'swap' : '';
    /** @type {PlaneSegment[]} */
    const out = [];
    if (atTest !== null) {
      const [i, j] = AGAINST[atTest];
      const p = ends[i];
      const q = ends[j];
      if (p.x !== q.x || p.y !== q.y) {
        const reach = 30;
        out.push({
          key: 'line',
          x1: p.x - (q.x - p.x) * reach,
          y1: p.y - (q.y - p.y) * reach,
          x2: q.x + (q.x - p.x) * reach,
          y2: q.y + (q.y - p.y) * reach,
          state: 'active',
          dashed: true,
        });
      }
    }
    out.push(
      { key: 'ab', x1: frame.a.x, y1: frame.a.y, x2: frame.b.x, y2: frame.b.y, state, thick: true },
      { key: 'cd', x1: frame.c.x, y1: frame.c.y, x2: frame.d.x, y2: frame.d.y, state, thick: true },
    );
    if (frame.shared) {
      const [p, q] = frame.shared;
      out.push({ key: 'shared', x1: p.x, y1: p.y, x2: q.x, y2: q.y, state: 'path', thick: true });
    }
    return out;
  });
  const marks = $derived(
    frame.point
      ? [{ key: 'point', x: frame.point.x, y: frame.point.y, label: m.pt(frame.point) }]
      : [],
  );
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
          {marks}
          labelOf={(p) => m.pointLabel(p.label, p.x, p.y)}
          onmove={move}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-slate-500"></span>{m.legend
              .idle}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-swap"></span>{m.legend
              .hit}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-active"></span>{m.legend
              .line}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-compare"></span>{m
              .legend.tested}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-state-path"></span>{m.legend
              .shared}
          </li>
          <li>{m.legend.point}</li>
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
          <dt class="text-xs text-slate-500">{m.stats.verdict}</dt>
          <dd class="text-2xl font-bold" data-testid="verdict">
            {frame.outcome ? m.outcomes[frame.outcome] : m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.tests}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tests">{frame.tests}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.boxChecks}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="boxes">{frame.boxChecks}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.t}</dt>
          <dd class="text-lg font-semibold tabular-nums" data-testid="t">
            {frame.t ? m.fraction(frame.t) : m.none}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.where}</dt>
          <dd class="text-lg font-semibold tabular-nums" data-testid="where">
            {frame.shared
              ? m.stretch(frame.shared[0], frame.shared[1])
              : frame.point
                ? m.pt(frame.point)
                : m.none}
          </dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <ScrollFrame>
          <table class="w-full text-sm tabular-nums">
            <thead>
              <tr class="text-left text-xs text-slate-500">
                <th scope="col" class="px-2 py-1 font-semibold">{m.tableHeads.name}</th>
                <th scope="col" class="px-2 py-1 font-semibold">{m.tableHeads.value}</th>
                <th scope="col" class="px-2 py-1 font-semibold">{m.tableHeads.side}</th>
              </tr>
            </thead>
            <tbody>
              {#each frame.o as value, i (i)}
                <tr
                  class="border-t border-slate-100 {frame.at === i
                    ? 'bg-amber-50 font-semibold'
                    : ''}"
                  data-testid="orient-row"
                >
                  <th scope="row" class="px-2 py-1 text-left font-medium">{m.testName(i)}</th>
                  <td class="px-2 py-1">{value === null ? m.pending : m.value(value)}</td>
                  <td class="px-2 py-1">{m.side(value)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </ScrollFrame>
      </section>

      <CodePanel lines={segmentPseudocode} active={frame.lines} />
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
