<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    GROWTH_KEYS,
    MAX_A,
    MAX_B,
    MAX_C,
    MAX_N,
    MIN_N,
    asymptoticPseudocode,
    asymptoticTrace,
  } from '$lib/algo-engine/asymptotic-notation.js';
  import { en as m } from '$lib/lessons/asymptotic-notation/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/asymptotic-notation.js').GrowthKey} GrowthKey */
  /** @typedef {import('$lib/algo-engine/asymptotic-notation.js').Poly} Poly */
  /** @typedef {'a'|'b'|'c'|'maxN'} Field */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = { a: 3, b: 20, c: 50, maxN: 30 };
  /** @type {Record<Field, number>} */
  let committed = $state({ ...INITIAL });
  /** @type {Record<Field, number | null>} */
  let drafts = $state({ ...INITIAL });
  let bound = $state(/** @type {GrowthKey} */ ('n2'));
  let notice = $state({ text: '', at: -1 });

  const poly = $derived({ a: committed.a, b: committed.b, c: committed.c });
  const player = createPlayer(asymptoticTrace(INITIAL, 'n2', INITIAL.maxN));
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, poly, bound),
  );

  /** @type {Record<Field, number>} */
  const MAX = { a: MAX_A, b: MAX_B, c: MAX_C, maxN: MAX_N };
  const FIELDS = /** @type {Field[]} */ (['a', 'b', 'c', 'maxN']);

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(asymptoticTrace(poly, bound, committed.maxN));
  }

  /** @param {Field} key */
  function commit(key) {
    const v = drafts[key];
    const min = key === 'maxN' ? MIN_N : 0;
    const ok = typeof v === 'number' && Number.isInteger(v) && v >= min && v <= MAX[key];
    const next = ok ? { ...committed, [key]: v } : committed;
    if (!ok || next.a + next.b + next.c === 0) {
      drafts[key] = committed[key];
      const text = !ok ? (key === 'maxN' ? m.maxNError : m.fieldError) : m.zeroError;
      notice = { text, at: player.index };
      return;
    }
    committed = next;
    rebuild();
  }

  const boundOptions = GROWTH_KEYS.map((k) => ({ value: k, label: m.names[k] }));

  // Plot geometry: x is linear in n, y is log₁₀ of the value (values below 1 sit on the axis).
  const W = 420;
  const H = 260;
  const LEFT = 40;
  const RIGHT = 56;
  const TOP = 12;
  const BOTTOM = 28;
  const DASH = /** @type {Record<GrowthKey, string>} */ ({
    n: '',
    nlogn: '7 4',
    n2: '2 4',
    exp: '10 4 2 4',
  });

  const last = $derived(player.frames[player.frames.length - 1]);
  const decades = $derived.by(() => {
    const top = last.points.at(-1);
    const peak = top ? Math.max(top.f, ...GROWTH_KEYS.map((k) => top.g[k])) : 10;
    return Math.max(1, Math.ceil(Math.log10(peak)));
  });
  /** @param {number} n */
  const px = (n) => LEFT + ((n - 1) / Math.max(1, committed.maxN - 1)) * (W - LEFT - RIGHT);
  /** @param {number} v */
  const py = (v) => TOP + (1 - Math.log10(Math.max(1, v)) / decades) * (H - TOP - BOTTOM);
  const tickEvery = $derived(Math.max(1, Math.ceil(decades / 6)));
  const yTicks = $derived(
    Array.from({ length: Math.floor(decades / tickEvery) + 1 }, (_, i) => i * tickEvery),
  );
  const xTicks = $derived(
    [
      1,
      ...[5, 10, 15, 20, 25, 30, 35, 40].filter((t) => t < committed.maxN),
      committed.maxN,
    ].filter((t, i, arr) => arr.indexOf(t) === i),
  );

  const curves = $derived(
    GROWTH_KEYS.map((k) => ({
      key: k,
      points: frame.points.map((p) => `${px(p.n)},${py(p.g[k])}`).join(' '),
      end: frame.points.at(-1),
    })),
  );
  const fPoints = $derived(frame.points.map((p) => `${px(p.n)},${py(p.f)}`).join(' '));
  const current = $derived(frame.points.at(-1));
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      for (const k of FIELDS) if (drafts[k] !== committed[k]) commit(k);
    }}
  >
    {#each FIELDS as k (k)}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields[k]}
        <input
          type="number"
          name={k}
          min={k === 'maxN' ? MIN_N : 0}
          max={MAX[k]}
          step="1"
          class="field w-24"
          bind:value={drafts[k]}
          onchange={() => commit(k)}
        />
      </label>
    {/each}
    <SegmentedControl
      legend={m.boundLegend}
      name="bound"
      options={boundOptions}
      bind:value={bound}
      onchange={rebuild}
    />
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <!-- A scrollable region must be keyboard focusable. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="overflow-x-auto" tabindex="0" role="group" aria-label={m.plotScroller}>
          <svg
            viewBox="0 0 {W} {H}"
            role="img"
            aria-label={m.plotLabel(frame, poly, bound)}
            class="mx-auto h-auto w-full"
            style="min-width: 340px"
          >
            {#each yTicks as k (k)}
              <line
                x1={LEFT}
                x2={W - RIGHT}
                y1={py(10 ** k)}
                y2={py(10 ** k)}
                class="stroke-slate-200"
              />
              <text
                x={LEFT - 4}
                y={py(10 ** k)}
                text-anchor="end"
                dominant-baseline="central"
                font-size="10"
                class="fill-slate-500">{m.decade(k)}</text
              >
            {/each}
            {#each xTicks as t (t)}
              <text
                x={px(t)}
                y={H - BOTTOM + 14}
                text-anchor="middle"
                font-size="10"
                class="fill-slate-500">{t}</text
              >
            {/each}
            <text x={W - RIGHT + 20} y={H - BOTTOM + 14} font-size="10" class="fill-slate-500"
              >{m.axisN}</text
            >
            <line
              x1={LEFT}
              x2={W - RIGHT}
              y1={H - BOTTOM}
              y2={H - BOTTOM}
              class="stroke-slate-400"
            />
            {#if current}
              <line
                x1={px(current.n)}
                x2={px(current.n)}
                y1={TOP}
                y2={H - BOTTOM}
                class="stroke-slate-300"
                stroke-dasharray="3 3"
              />
            {/if}
            {#each curves as c (c.key)}
              <polyline
                points={c.points}
                fill="none"
                stroke-dasharray={DASH[c.key]}
                stroke-width={c.key === bound ? 2.5 : 1.5}
                class={c.key === bound ? 'stroke-slate-900' : 'stroke-slate-400'}
              />
              {#if c.end}
                <text
                  x={px(c.end.n) + 4}
                  y={py(c.end.g[c.key])}
                  dominant-baseline="central"
                  font-size="10"
                  font-weight={c.key === bound ? 700 : 400}
                  class={c.key === bound ? 'fill-slate-900' : 'fill-slate-500'}
                  >{m.names[c.key]}</text
                >
              {/if}
            {/each}
            <polyline points={fPoints} fill="none" stroke-width="3" class="stroke-teal-700" />
            {#if current}
              <circle
                cx={px(current.n)}
                cy={py(current.f)}
                r="4"
                class="fill-teal-700 stroke-white"
              />
              <circle
                cx={px(current.n)}
                cy={py(current.g[bound])}
                r="4"
                class="fill-slate-900 stroke-white"
              />
              <text
                x={px(current.n) + 6}
                y={py(current.f) - 8}
                font-size="11"
                font-weight="700"
                stroke="white"
                stroke-width="3"
                paint-order="stroke"
                class="fill-teal-800">{m.fLabel}</text
              >
            {/if}
          </svg>
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <svg width="24" height="8" aria-hidden="true"
              ><line x1="0" x2="24" y1="4" y2="4" stroke-width="3" class="stroke-teal-700" /></svg
            >
            {m.fLabel}
          </li>
          {#each GROWTH_KEYS as k (k)}
            <li class="flex items-center gap-1.5">
              <svg width="24" height="8" aria-hidden="true"
                ><line
                  x1="0"
                  x2="24"
                  y1="4"
                  y2="4"
                  stroke-dasharray={DASH[k]}
                  stroke-width={k === bound ? 2.5 : 1.5}
                  class={k === bound ? 'stroke-slate-900' : 'stroke-slate-400'}
                /></svg
              >
              {k === bound ? m.boundLabel(m.names[k]) : m.names[k]}
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
          <dt class="text-xs text-slate-500">{m.stats.f}</dt>
          <dd class="text-xl font-bold break-all tabular-nums">
            {frame.f === null ? m.noValue : m.fmt(frame.f)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.g} = {m.names[bound]}</dt>
          <dd class="text-xl font-bold break-all tabular-nums">
            {frame.g === null ? m.noValue : m.fmt(frame.g)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.ratio}</dt>
          <dd class="text-xl font-bold break-all tabular-nums">
            {frame.ratio === null ? m.noValue : m.fmt(frame.ratio)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.lead}</dt>
          <dd class="text-xl font-bold tabular-nums">
            {frame.leadShare === null ? m.noValue : m.percent(frame.leadShare)}
          </dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <h2 class="mb-1 text-xs text-slate-500">{m.verdictTitle}</h2>
        <p class="font-semibold">
          {frame.verdict === null ? m.verdictPending : m.verdictShort[frame.verdict]}
        </p>
      </div>
      {#if current}
        <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <h2 class="mb-1 text-xs text-slate-500">{m.valuesTitle}</h2>
          <ul class="tabular-nums">
            {#each GROWTH_KEYS as k (k)}
              <li class="flex justify-between gap-2">
                <span>{m.names[k]}</span><span class="break-all">{m.fmt(current.g[k])}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      <CodePanel lines={asymptoticPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
