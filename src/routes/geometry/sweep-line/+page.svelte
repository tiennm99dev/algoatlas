<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import { letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    GRID,
    MAX_SEGMENTS,
    SPARE_SEGMENTS,
    SWEEP_PRESETS,
    allPseudocode,
    anyPseudocode,
    sweepTrace,
  } from '$lib/algo-engine/sweep-line.js';
  import PointPlane from '$lib/lessons/geometry-orientation/point-plane.svelte';
  import { en as m } from '$lib/lessons/sweep-line/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/sweep-line.js').SweepSegment} SweepSegment */
  /** @typedef {import('$lib/algo-engine/sweep-line.js').SweepFrame} SweepFrame */
  /** @typedef {import('$lib/algo-engine/sweep-line.js').SweepMethod} Method */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {keyof typeof SWEEP_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(SWEEP_PRESETS));
  const METHODS = /** @type {Method[]} */ (['any', 'all']);
  const CODE = { any: anyPseudocode, all: allPseudocode };
  const COST_KEYS = /** @type {('any' | 'all' | 'brute')[]} */ (['any', 'all', 'brute']);

  let preset = $state(/** @type {Preset | ''} */ ('crossing'));
  let method = $state(/** @type {Method} */ ('any'));
  let segments = $state.raw(/** @type {SweepSegment[]} */ (SWEEP_PRESETS.crossing));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(sweepTrace('any', SWEEP_PRESETS.crossing));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, letter));

  /** @param {Method} key */
  const testsOf = (key) => /** @type {SweepFrame} */ (sweepTrace(key, segments).at(-1)).pairTests;
  const costs = $derived({
    any: testsOf('any'),
    all: testsOf('all'),
    brute: (segments.length * (segments.length - 1)) / 2,
  });

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {boolean} [toEnd] */
  function rebuild(toEnd = false) {
    notice = { text: '', at: -1 };
    player.load(sweepTrace(method, segments));
    if (toEnd) player.seek(player.frames.length - 1);
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    segments = SWEEP_PRESETS[p];
    rebuild();
  }

  /** Each segment owns two plane points: id · 2 and id · 2 + 1. */
  /** @param {number} point @param {number} x @param {number} y */
  function move(point, x, y) {
    const id = Math.floor(point / 2);
    segments = segments.map((s) =>
      s.id !== id ? s : point % 2 === 0 ? { ...s, p: { x, y } } : { ...s, q: { x, y } },
    );
    preset = '';
    rebuild(true);
  }

  function addSegment() {
    if (segments.length >= MAX_SEGMENTS) {
      say(m.fullError(MAX_SEGMENTS));
      return;
    }
    let id = 0;
    while (segments.some((s) => s.id === id)) id++;
    segments = [...segments, { ...SPARE_SEGMENTS[id], id }];
    preset = '';
    rebuild(true);
  }

  /** @param {number} point */
  function removeSegment(point) {
    if (segments.length <= 1) {
      say(m.minError);
      return;
    }
    const id = Math.floor(point / 2);
    segments = segments.filter((s) => s.id !== id);
    preset = '';
    rebuild(true);
  }

  const hitIds = $derived(new Set(frame.hits.flatMap((h) => [h.i, h.j])));

  /** @param {number} id @returns {VisualState} */
  function stateOf(id) {
    if (frame.pair?.includes(id)) return frame.pairHit ? 'swap' : 'compare';
    if (hitIds.has(id)) return 'swap';
    if (frame.active.includes(id)) return 'active';
    if (frame.finished.includes(id)) return 'pruned';
    return '';
  }

  const points = $derived(
    frame.segments.flatMap((s) =>
      [s.p, s.q].map((p, end) => ({
        id: s.id * 2 + end,
        x: p.x,
        y: p.y,
        label: letter(s.id),
        state: stateOf(s.id),
      })),
    ),
  );

  const lines = $derived.by(() => {
    /** @type {PlaneSegment[]} */
    const out = frame.segments.map((s) => {
      const state = stateOf(s.id);
      return {
        key: `s${s.id}`,
        x1: s.p.x,
        y1: s.p.y,
        x2: s.q.x,
        y2: s.q.y,
        state,
        thick: state === 'active' || state === 'compare' || state === 'swap',
      };
    });
    if (frame.x !== null) {
      out.push({
        key: 'sweep',
        x1: frame.x,
        y1: 0,
        x2: frame.x,
        y2: GRID.yMax,
        state: 'frontier',
        dashed: true,
        thick: true,
      });
    }
    return out;
  });

  const marks = $derived(frame.hits.map((h, i) => ({ key: `h${i}`, x: h.at.x, y: h.at.y })));
  const activeChips = $derived(
    frame.active.map((id) => ({ label: letter(id), hot: frame.pair?.includes(id) ?? false })),
  );
  const eventChips = $derived(
    frame.events.map((e, i) => ({ label: m.eventChip(e, letter), hot: i === frame.eventAt })),
  );
  const hitChips = $derived(frame.hits.map((h) => ({ label: m.hitChip(h, letter) })));

  const answer = $derived(
    frame.kind !== 'done' && frame.hits.length === 0
      ? m.pending
      : frame.hits.length > 0
        ? m.yes
        : m.no,
  );

  const LEGEND = [
    { cls: 'bg-state-frontier', label: m.legend.sweep },
    { cls: 'bg-state-active', label: m.legend.active },
    { cls: 'bg-state-compare', label: m.legend.pair },
    { cls: 'bg-state-swap', label: m.legend.hit },
    { cls: 'bg-slate-200', label: m.legend.done },
  ];
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.methodLabel}
      name="method"
      options={METHODS.map((value) => ({ value, label: m.methods[value] }))}
      bind:value={method}
      onchange={() => rebuild()}
    />
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
    <button type="button" class="btn-secondary" onclick={addSegment}>{m.addSegment}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <PointPlane
          ariaLabel={m.planeLabel}
          xMax={GRID.xMax}
          yMax={GRID.yMax}
          {points}
          segments={lines}
          {marks}
          labelOf={(p) => m.pointLabel(p.label, p.x, p.y)}
          onmove={move}
          onremove={removeSegment}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as item (item.label)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {item.cls}"></span>{item.label}
            </li>
          {/each}
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold" data-testid="answer">{answer}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.x}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="x">
            {frame.x === null ? m.pending : frame.x}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.active}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="active">
            {frame.active.length}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.tests}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tests">{frame.pairTests}</dd>
        </div>
      </dl>

      <ChipList title={m.activeTitle} items={activeChips} emptyText={m.activeEmpty} />
      <ChipList title={m.hitsTitle} items={hitChips} emptyText={m.hitsEmpty} limit={28} />
      <ChipList title={m.eventsTitle} items={eventChips} emptyText={m.eventsEmpty} />

      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.compareTitle}
        </h2>
        <dl class="space-y-1 text-sm tabular-nums">
          {#each COST_KEYS as key (key)}
            <div class="flex justify-between gap-4 border-t border-slate-100 pt-1">
              <dt>{m.compareRows[key]}</dt>
              <dd class="font-semibold" data-testid="cost-{key}">{costs[key]}</dd>
            </div>
          {/each}
        </dl>
      </section>

      <CodePanel lines={CODE[frame.method]} active={frame.lines} />
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
