<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import { letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    GRID,
    HULL_PRESETS,
    MAX_POINTS,
    grahamPseudocode,
    hullCosts,
    hullTrace,
    monotonePseudocode,
    randomPoints,
  } from '$lib/algo-engine/convex-hull.js';
  import { en as m } from '$lib/lessons/convex-hull/copy.en.js';
  import PointPlane from '$lib/lessons/geometry-orientation/point-plane.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/convex-hull.js').HullPoint} HullPoint */
  /** @typedef {import('$lib/algo-engine/convex-hull.js').HullMethod} Method */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {keyof typeof HULL_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(HULL_PRESETS));
  const METHODS = /** @type {Method[]} */ (['graham', 'monotone']);
  const CODE = { graham: grahamPseudocode, monotone: monotonePseudocode };
  const RANDOM_COUNT = 14;

  let preset = $state(/** @type {Preset | ''} */ ('cloud'));
  let method = $state(/** @type {Method} */ ('graham'));
  let cloud = $state.raw(/** @type {HullPoint[]} */ (HULL_PRESETS.cloud));
  let selected = $state(/** @type {number | null} */ (null));
  let xDraft = $state(/** @type {number | null} */ (6));
  let yDraft = $state(/** @type {number | null} */ (0));
  /** The last valid field values, put back when a field is emptied or out of range. */
  let kept = { x: 6, y: 0 };
  let notice = $state({ text: '', at: -1 });
  const guard = createFieldGuard();

  const player = createPlayer(hullTrace('graham', HULL_PRESETS.cloud));
  const frame = $derived(player.frame);
  const costs = $derived(hullCosts(cloud));
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, letter));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {boolean} [toEnd] */
  function rebuild(toEnd = false) {
    notice = { text: '', at: -1 };
    player.load(hullTrace(method, cloud));
    if (toEnd) player.seek(player.frames.length - 1);
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    cloud = HULL_PRESETS[p];
    selected = null;
    rebuild();
  }

  function loadRandom() {
    preset = '';
    cloud = randomPoints(RANDOM_COUNT);
    selected = null;
    rebuild();
  }

  /** @param {number} x @param {number} y */
  const occupied = (x, y) => cloud.some((p) => p.x === x && p.y === y);

  /** @param {number} id @param {number} x @param {number} y */
  function move(id, x, y) {
    if (occupied(x, y)) {
      say(m.occupiedError);
      return;
    }
    cloud = cloud.map((p) => (p.id === id ? { id, x, y } : p));
    preset = '';
    rebuild(true);
  }

  /** @param {number} x @param {number} y */
  function addAt(x, y) {
    if (cloud.length >= MAX_POINTS) {
      say(m.fullError(MAX_POINTS));
      return;
    }
    if (occupied(x, y)) {
      say(m.occupiedError);
      return;
    }
    let id = 0;
    while (cloud.some((p) => p.id === id)) id++;
    cloud = [...cloud, { id, x, y }];
    preset = '';
    rebuild(true);
  }

  /** @param {number} id */
  function removePoint(id) {
    if (cloud.length <= 1) {
      say(m.minError);
      return;
    }
    cloud = cloud.filter((p) => p.id !== id);
    selected = null;
    preset = '';
    rebuild(true);
  }

  function removeSelected() {
    if (selected === null) say(m.selectFirst);
    else removePoint(selected);
  }

  const coordsValid = () =>
    wholeInRange(xDraft, 0, GRID.xMax) && wholeInRange(yDraft, 0, GRID.yMax);

  function commitCoords() {
    if (guard.commit(coordsValid())) {
      kept = { x: /** @type {number} */ (xDraft), y: /** @type {number} */ (yDraft) };
      return;
    }
    xDraft = kept.x;
    yDraft = kept.y;
    say(m.coordError(GRID.xMax, GRID.yMax));
  }

  function addFromFields() {
    if (guard.refused() || !coordsValid()) {
      xDraft = kept.x;
      yDraft = kept.y;
      say(m.coordError(GRID.xMax, GRID.yMax));
      return;
    }
    addAt(/** @type {number} */ (xDraft), /** @type {number} */ (yDraft));
  }

  const byId = $derived(new Map(frame.points.map((p) => [p.id, p])));
  /** @param {number} id */
  const at = (id) => /** @type {HullPoint} */ (byId.get(id));

  /** @param {number[]} ids @param {string} prefix @param {VisualState} state @param {boolean} [closed] */
  function chainSegments(ids, prefix, state, closed = false) {
    /** @type {PlaneSegment[]} */
    const out = [];
    ids.forEach((id, i) => {
      const next = ids[i + 1] ?? (closed && ids.length > 2 ? ids[0] : undefined);
      if (next === undefined) return;
      const [p, q] = [at(id), at(next)];
      out.push({
        key: `${prefix}${i}`,
        x1: p.x,
        y1: p.y,
        x2: q.x,
        y2: q.y,
        state,
        thick: prefix === 'h',
      });
    });
    return out;
  }

  const segments = $derived.by(() => {
    /** @type {PlaneSegment[]} */
    const out = [];
    if (frame.hull) return chainSegments(frame.hull, 'h', 'sorted', true);
    if (frame.kind === 'sort' && frame.pivot !== null) {
      const pivot = at(frame.pivot);
      for (const id of frame.order.slice(1)) {
        const p = at(id);
        out.push({
          key: `f${id}`,
          x1: pivot.x,
          y1: pivot.y,
          x2: p.x,
          y2: p.y,
          state: 'pruned',
          dashed: true,
        });
      }
    }
    out.push(...chainSegments(frame.lower, 'l', 'sorted'));
    out.push(...chainSegments(frame.stack, 's', 'active'));
    if (frame.triple) {
      const [top, p] = [at(frame.triple[1]), at(frame.triple[2])];
      const state = /** @type {VisualState} */ (
        frame.cross !== null && frame.cross > 0 ? 'compare' : 'swap'
      );
      out.push({
        key: 't',
        x1: top.x,
        y1: top.y,
        x2: p.x,
        y2: p.y,
        state,
        dashed: true,
        thick: true,
      });
    }
    return out;
  });

  const polygons = $derived(
    frame.hull && frame.hull.length > 2
      ? [{ key: 'hull', pts: frame.hull.map(at), state: /** @type {VisualState} */ ('sorted') }]
      : [],
  );

  /** @param {number} id @returns {VisualState} */
  function stateOf(id) {
    if (frame.hull) return frame.hull.includes(id) ? 'sorted' : 'pruned';
    if (frame.kind === 'pivot' && frame.pivot === id) return 'compare';
    if (frame.current === id) return 'compare';
    if (frame.triple && frame.triple[1] === id)
      return frame.cross !== null && frame.cross <= 0 ? 'swap' : 'active';
    if (frame.stack.includes(id)) return 'active';
    if (frame.lower.includes(id)) return 'visited';
    if (frame.popped.includes(id)) return 'pruned';
    return '';
  }

  const points = $derived(
    frame.points.map((p) => {
      const rank = frame.order.indexOf(p.id);
      return {
        id: p.id,
        x: p.x,
        y: p.y,
        label: letter(p.id),
        state: stateOf(p.id),
        note: rank >= 0 && !frame.hull ? m.rankNote(rank + 1) : undefined,
      };
    }),
  );

  const stackChips = $derived(
    frame.stack.map((id, i) => ({
      label: `${letter(id)} (${at(id).x}, ${at(id).y})`,
      hot: i === frame.stack.length - 1,
    })),
  );
  const orderChips = $derived(
    frame.order.map((id) => ({ label: letter(id), hot: id === frame.current })),
  );
  const LEGEND = [
    { cls: 'bg-state-active', label: m.legend.chain },
    { cls: 'bg-state-sorted', label: m.legend.hull },
    { cls: 'bg-state-compare', label: m.legend.current },
    { cls: 'bg-state-swap', label: m.legend.test },
    { cls: 'bg-slate-200', label: m.legend.popped },
    { cls: 'bg-state-visited', label: m.legend.lower },
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
    <button type="button" class="btn-outline" onclick={loadRandom}>{m.random}</button>
    <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form
      class="flex flex-wrap items-end gap-2"
      onkeydown={(e) => enterField(e, { x: addFromFields, y: addFromFields })}
      onsubmit={(e) => {
        e.preventDefault();
        addFromFields();
      }}
    >
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.x}
        <input
          type="number"
          name="x"
          min="0"
          max={GRID.xMax}
          class="field w-16 tabular-nums"
          bind:value={xDraft}
          onchange={commitCoords}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.y}
        <input
          type="number"
          name="y"
          min="0"
          max={GRID.yMax}
          class="field w-16 tabular-nums"
          bind:value={yDraft}
          onchange={commitCoords}
        />
      </label>
      <button type="submit" class="btn-secondary">{m.addPoint}</button>
      <button type="button" class="btn-outline" onclick={removeSelected}>{m.removePoint}</button>
    </form>
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
          onadd={addAt}
          onremove={removePoint}
          onselect={(id) => (selected = selected === id ? null : id)}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as item (item.label)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {item.cls}"></span>{item.label}
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
          <dt class="text-xs text-slate-500">{m.stats.hull}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="hull">
            {frame.hull ? frame.hull.length : m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.points}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="count">{frame.points.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.tests}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tests">{frame.tests}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pops}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pops">{frame.pops}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pushes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="pushes">{frame.pushes}</dd>
        </div>
      </dl>

      <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} limit={24} />
      <ChipList title={m.orderTitle} items={orderChips} emptyText={m.orderEmpty} limit={24} />

      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.compareTitle}
        </h2>
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              <th scope="col" class="py-1 font-semibold">{m.compareHeads.method}</th>
              <th scope="col" class="py-1 font-semibold">{m.compareHeads.tests}</th>
              <th scope="col" class="py-1 font-semibold">{m.compareHeads.pops}</th>
            </tr>
          </thead>
          <tbody>
            {#each METHODS as key (key)}
              <tr class="border-t border-slate-100" data-testid="compare-{key}">
                <th scope="row" class="py-1 text-left font-medium">{m.methods[key]}</th>
                <td class="py-1">{costs[key].tests}</td>
                <td class="py-1">{costs[key].pops}</td>
              </tr>
            {/each}
          </tbody>
        </table>
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
