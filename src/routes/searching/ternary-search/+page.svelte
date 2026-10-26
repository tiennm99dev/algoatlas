<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    DOMAIN,
    EPSILONS,
    PEAK_MAX,
    PEAK_MIN,
    SHAPES,
    isUnimodal,
    makeFunction,
    roundsNeeded,
    ternaryPseudocode,
    ternaryTrace,
  } from '$lib/algo-engine/ternary-search.js';
  import { en as m } from '$lib/lessons/ternary-search/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/ternary-search.js').Shape} Shape */

  const [A, B] = DOMAIN;
  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_PEAK = 3.7;
  const INITIAL_EPS = 0.1;

  let shape = $state(/** @type {Shape} */ ('parabola'));
  let peak = $state(INITIAL_PEAK);
  let epsText = $state(String(INITIAL_EPS));
  let zoom = $state(false);
  const eps = $derived(Number(epsText));
  const fn = $derived(makeFunction(shape, peak));

  const player = createPlayer(
    ternaryTrace(makeFunction('parabola', INITIAL_PEAK), A, B, INITIAL_EPS),
  );
  const frame = $derived(player.frame);
  const narration = $derived(m.describe(frame, eps, fn, shape));

  function rebuild() {
    player.load(ternaryTrace(makeFunction(shape, peak), A, B, Number(epsText)));
  }

  // Plot geometry.
  const W = 560;
  const H = 260;
  const PAD_L = 36;
  const PAD_R = 12;
  const PAD_T = 22;
  const PAD_B = 34;
  const SAMPLES = 240;

  const view = $derived.by(() => {
    if (!zoom) return { x0: A, x1: B };
    const w = frame.hi - frame.lo;
    return { x0: Math.max(A, frame.lo - w / 4), x1: Math.min(B, frame.hi + w / 4) };
  });
  const samples = $derived(
    Array.from({ length: SAMPLES + 1 }, (_, i) => {
      const x = view.x0 + ((view.x1 - view.x0) * i) / SAMPLES;
      return { x, y: fn(x) };
    }),
  );
  const yRange = $derived.by(() => {
    const ys = samples.map((s) => s.y);
    const lo = Math.min(0, ...ys);
    const hi = Math.max(...ys);
    const pad = Math.max(0.25, (hi - lo) * 0.08);
    return { y0: lo, y1: hi + pad };
  });
  /** @param {number} x */
  const px = (x) => PAD_L + ((x - view.x0) / (view.x1 - view.x0)) * (W - PAD_L - PAD_R);
  /** @param {number} y */
  const py = (y) => PAD_T + ((yRange.y1 - y) / (yRange.y1 - yRange.y0)) * (H - PAD_T - PAD_B);
  const path = $derived(
    samples.map((s, i) => `${i ? 'L' : 'M'}${px(s.x).toFixed(1)} ${py(s.y).toFixed(1)}`).join(' '),
  );
  /** Clamp a pixel x to the plot area. @param {number} x */
  const clampX = (x) => Math.min(W - PAD_R, Math.max(PAD_L, x));
  const ticks = $derived.by(() => {
    const span = view.x1 - view.x0;
    const step = span > 3 ? 1 : span > 1.2 ? 0.5 : span > 0.3 ? 0.1 : span > 0.06 ? 0.02 : 0.005;
    const out = [];
    for (let t = Math.ceil(view.x0 / step) * step; t <= view.x1 + 1e-9; t += step) out.push(t);
    return { step, values: out };
  });
  const tickDigits = $derived(
    ticks.step >= 1 ? 0 : ticks.step >= 0.1 ? 1 : ticks.step >= 0.01 ? 2 : 3,
  );

  const probes = $derived(
    Number.isNaN(frame.m1)
      ? []
      : [
          { name: 'm1', x: frame.m1, y: frame.f1 },
          { name: 'm2', x: frame.m2, y: frame.f2 },
        ],
  );
  const rounds = $derived(
    player.frames
      .slice(0, player.index + 1)
      .filter((f) => f.kind === 'cut-left' || f.kind === 'cut-right')
      .map((f, i, all) => ({ label: m.interval(f.lo, f.hi), hot: i === all.length - 1 })),
  );
  const predicted = $derived(roundsNeeded(B - A, eps));
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.shapeLabel}
      name="shape"
      options={SHAPES.map((s) => ({ value: s, label: m.shapes[s] }))}
      bind:value={shape}
      onchange={rebuild}
    />
    {#if isUnimodal(shape)}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.peakLabel(peak)}
        <input
          type="range"
          name="peak"
          min={PEAK_MIN}
          max={PEAK_MAX}
          step="0.1"
          bind:value={peak}
          onchange={rebuild}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
    {/if}
    <SegmentedControl
      legend={m.epsLabel}
      name="eps"
      options={EPSILONS.map((e) => ({ value: String(e), label: String(e) }))}
      bind:value={epsText}
      onchange={rebuild}
    />
    <label class="flex items-center gap-2 pb-2 text-sm text-slate-800">
      <input type="checkbox" name="zoom" class="size-4 accent-teal-700" bind:checked={zoom} />
      {m.zoomLabel}
    </label>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ScrollFrame>
          <svg
            viewBox="0 0 {W} {H}"
            role="img"
            aria-label={m.plotLabel(m.shapes[shape], frame.lo, frame.hi)}
            class="mx-auto block h-auto w-full"
            style="min-width: 340px; max-width: {W}px"
            data-testid="plot"
          >
            <!-- Discarded parts of the domain, left of lo and right of hi. -->
            {#if frame.lo > view.x0}
              <rect
                x={PAD_L}
                y={PAD_T}
                width={clampX(px(frame.lo)) - PAD_L}
                height={H - PAD_T - PAD_B}
                class="fill-slate-200"
                data-testid="cut-left"
              />
            {/if}
            {#if frame.hi < view.x1}
              <rect
                x={clampX(px(frame.hi))}
                y={PAD_T}
                width={W - PAD_R - clampX(px(frame.hi))}
                height={H - PAD_T - PAD_B}
                class="fill-slate-200"
                data-testid="cut-right"
              />
            {/if}
            <!-- The kept interval as a band under the axis. -->
            <rect
              x={clampX(px(frame.lo))}
              y={H - PAD_B + 2}
              width={Math.max(1, clampX(px(frame.hi)) - clampX(px(frame.lo)))}
              height="5"
              rx="2"
              class="fill-teal-700"
            />
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={H - PAD_B}
              y2={H - PAD_B}
              class="stroke-slate-400"
            />
            {#each ticks.values as t (t)}
              <text
                x={px(t)}
                y={H - PAD_B + 20}
                text-anchor="middle"
                font-size="10"
                class="fill-slate-500"
                aria-hidden="true">{t.toFixed(tickDigits)}</text
              >
            {/each}
            <path d={path} class="fill-none stroke-slate-900" stroke-width="2" />
            {#each probes as p (p.name)}
              <g aria-hidden="true">
                <line
                  x1={px(p.x)}
                  x2={px(p.x)}
                  y1={PAD_T}
                  y2={H - PAD_B}
                  class="stroke-state-active"
                  stroke-dasharray="4 3"
                  stroke-width="1.5"
                />
                <circle cx={px(p.x)} cy={py(p.y)} r="5" class="fill-state-active stroke-white" />
                <text
                  x={px(p.x)}
                  y={PAD_T - 8}
                  text-anchor="middle"
                  font-size="11"
                  font-weight="700"
                  class="fill-slate-900">{p.name}</text
                >
              </g>
            {/each}
            {#if frame.kind === 'done'}
              <g aria-hidden="true" data-testid="answer">
                <circle
                  cx={px(frame.answer)}
                  cy={py(fn(frame.answer))}
                  r="6"
                  class="fill-state-sorted stroke-white"
                  stroke-width="2"
                />
                <text
                  x={px(frame.answer)}
                  y={py(fn(frame.answer)) - 12}
                  text-anchor="middle"
                  font-size="11"
                  font-weight="700"
                  stroke="white"
                  stroke-width="3"
                  paint-order="stroke"
                  class="fill-slate-900">✓ x ≈ {frame.answer.toFixed(3)}</text
                >
              </g>
            {/if}
            {#each [{ name: 'lo', x: frame.lo }, { name: 'hi', x: frame.hi }] as b (b.name)}
              {#if b.x >= view.x0 && b.x <= view.x1}
                <text
                  x={px(b.x)}
                  y={H - 4}
                  text-anchor={b.name === 'lo' ? 'end' : 'start'}
                  font-size="10"
                  font-weight="600"
                  class="fill-teal-800"
                  aria-hidden="true">{b.name}</text
                >
              {/if}
            {/each}
          </svg>
        </ScrollFrame>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="h-0.5 w-4 bg-slate-900"></span>{m.legend.curve}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-1.5 w-4 rounded bg-teal-700"></span>{m.legend.kept}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 bg-slate-200"></span>{m.legend
              .cut}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full bg-state-active"></span>
            <span class="font-bold text-slate-900">m1 m2</span>
            {m.legend.probe}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-full bg-state-sorted"></span>
            <span class="font-bold text-slate-900">✓</span>
            {m.legend.answer}
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
          <dt class="text-xs text-slate-500">{m.stats.rounds}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="rounds">{frame.iterations}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.evaluations}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="evaluations">
            {frame.evaluations}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.width}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="width">
            {(frame.hi - frame.lo).toFixed(3)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.predicted}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">{predicted}</dd>
        </div>
      </dl>

      <ChipList title={m.intervalsTitle} items={rounds} emptyText={m.intervalsEmpty} limit={24} />

      <CodePanel lines={ternaryPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
