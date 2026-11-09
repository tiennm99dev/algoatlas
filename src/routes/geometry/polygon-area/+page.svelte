<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    GRID,
    MAX_VERTICES,
    MIN_VERTICES,
    POLYGON_PRESETS,
    insertVertex,
    polygonTrace,
    rayPseudocode,
    selfIntersects,
    shoelacePseudocode,
    windingPseudocode,
  } from '$lib/algo-engine/polygon-area.js';
  import PointPlane from '$lib/lessons/geometry-orientation/point-plane.svelte';
  import { en as m } from '$lib/lessons/polygon-area/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/polygon-area.js').Point} Point */
  /** @typedef {import('$lib/algo-engine/polygon-area.js').PolygonMethod} Method */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {keyof typeof POLYGON_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(POLYGON_PRESETS));
  const METHODS = /** @type {Method[]} */ (['shoelace', 'ray', 'winding']);
  const CODE = { shoelace: shoelacePseudocode, ray: rayPseudocode, winding: windingPseudocode };
  /** The query point's plane id; vertices use their index. */
  const QUERY = 1000;
  const INITIAL = POLYGON_PRESETS.rectangle;

  let preset = $state(/** @type {Preset | ''} */ ('rectangle'));
  let method = $state(/** @type {Method} */ ('shoelace'));
  let polygon = $state.raw(/** @type {Point[]} */ (INITIAL.polygon));
  let query = $state.raw(/** @type {Point} */ (INITIAL.query));
  let selected = $state(/** @type {number | null} */ (null));
  let xDraft = $state(/** @type {number | null} */ (6));
  let yDraft = $state(/** @type {number | null} */ (8));
  /** The last valid field values, put back when a field is emptied or out of range. */
  let kept = { x: 6, y: 8 };
  let notice = $state({ text: '', at: -1 });
  const guard = createFieldGuard();

  const player = createPlayer(polygonTrace('shoelace', INITIAL.polygon, INITIAL.query));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const crossesItself = $derived(selfIntersects(frame.polygon));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {boolean} [toEnd] */
  function rebuild(toEnd = false) {
    notice = { text: '', at: -1 };
    player.load(polygonTrace(method, polygon, query));
    if (toEnd) player.seek(player.frames.length - 1);
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    polygon = POLYGON_PRESETS[p].polygon;
    query = POLYGON_PRESETS[p].query;
    selected = null;
    rebuild();
  }

  /** @param {number} x @param {number} y */
  const occupied = (x, y) => polygon.some((p) => p.x === x && p.y === y);

  /** @param {number} id @param {number} x @param {number} y */
  function move(id, x, y) {
    if (id === QUERY) {
      query = { x, y };
    } else {
      if (occupied(x, y)) {
        say(m.occupiedError);
        return;
      }
      polygon = polygon.map((p, i) => (i === id ? { x, y } : p));
    }
    preset = '';
    rebuild(true);
  }

  /** @param {number} x @param {number} y */
  function addAt(x, y) {
    if (polygon.length >= MAX_VERTICES) {
      say(m.fullError(MAX_VERTICES));
      return;
    }
    if (occupied(x, y)) {
      say(m.occupiedError);
      return;
    }
    polygon = insertVertex(polygon, { x, y });
    selected = null;
    preset = '';
    rebuild(true);
  }

  /** @param {number} id */
  function removeVertex(id) {
    if (id === QUERY) return;
    if (polygon.length <= MIN_VERTICES) {
      say(m.minError(MIN_VERTICES));
      return;
    }
    polygon = polygon.filter((_, i) => i !== id);
    selected = null;
    preset = '';
    rebuild(true);
  }

  function removeSelected() {
    if (selected === null) say(m.selectFirst);
    else removeVertex(selected);
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

  const points = $derived.by(() => {
    const out = frame.polygon.map((p, id) => ({
      id,
      x: p.x,
      y: p.y,
      label: String(id),
      state: /** @type {VisualState} */ (
        frame.edge === id || (frame.edge !== null && (frame.edge + 1) % frame.polygon.length === id)
          ? 'active'
          : ''
      ),
    }));
    if (frame.method === 'shoelace') return out;
    /** @type {VisualState} */
    const state =
      frame.location === 'inside'
        ? 'sorted'
        : frame.location === 'boundary'
          ? 'compare'
          : frame.location === 'outside'
            ? 'path'
            : '';
    const note = frame.location ? m.locations[frame.location] : undefined;
    return [...out, { id: QUERY, x: frame.query.x, y: frame.query.y, label: 'Q', state, note }];
  });

  /** @returns {VisualState} */
  const edgeState = () => {
    if (frame.result === 'cross' || frame.result === 'up') return 'sorted';
    if (frame.result === 'down' || frame.result === 'boundary') return 'swap';
    return 'active';
  };

  const segments = $derived.by(() => {
    const n = frame.polygon.length;
    /** @type {PlaneSegment[]} */
    const out = frame.polygon.map((p, i) => {
      const q = frame.polygon[(i + 1) % n];
      const current = frame.edge === i;
      return {
        key: `e${i}`,
        x1: p.x,
        y1: p.y,
        x2: q.x,
        y2: q.y,
        state: /** @type {VisualState} */ (current ? edgeState() : ''),
        thick: current,
        arrow: true,
      };
    });
    if (frame.method !== 'shoelace') {
      out.push({
        key: 'ray',
        x1: frame.query.x,
        y1: frame.query.y,
        x2: GRID.xMax,
        y2: frame.query.y,
        state: 'compare',
        dashed: true,
      });
    }
    return out;
  });

  const polygons = $derived.by(() => {
    /** @type {import('$lib/lessons/geometry-orientation/plane-types.js').PlanePolygon[]} */
    const out = [{ key: 'poly', pts: frame.polygon, state: 'visited' }];
    if (frame.method === 'shoelace' && frame.edge !== null) {
      const row = frame.rows[frame.rows.length - 1];
      out.push({
        key: 'term',
        pts: [{ x: 0, y: 0 }, frame.polygon[row.i], frame.polygon[row.j]],
        state: row.value >= 0 ? 'sorted' : 'swap',
      });
    }
    return out;
  });

  const marks = $derived(
    frame.method === 'ray' ? frame.hits.map((h, i) => ({ key: `h${i}`, x: h.x, y: h.y })) : [],
  );

  const legend = $derived(
    /** @type {{ cls: string, label: string }[]} */ (
      frame.method === 'shoelace'
        ? [
            { cls: 'bg-state-visited', label: m.legend.polygon },
            { cls: 'bg-state-active', label: m.legend.current },
            { cls: 'bg-state-sorted', label: m.legend.positive },
            { cls: 'bg-state-swap', label: m.legend.negative },
          ]
        : frame.method === 'ray'
          ? [
              { cls: 'bg-state-visited', label: m.legend.polygon },
              { cls: 'bg-state-sorted', label: m.legend.crossing },
              { cls: 'bg-state-compare', label: m.legend.ray },
            ]
          : [
              { cls: 'bg-state-visited', label: m.legend.polygon },
              { cls: 'bg-state-sorted', label: m.legend.up },
              { cls: 'bg-state-swap', label: m.legend.down },
              { cls: 'bg-state-compare', label: m.legend.ray },
            ]
    ),
  );
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
      <button type="submit" class="btn-secondary">{m.addVertex}</button>
      <button type="button" class="btn-outline" onclick={removeSelected}>{m.removeVertex}</button>
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
          {marks}
          labelOf={(p) => (p.id === QUERY ? m.queryLabel(p.x, p.y) : m.vertexLabel(p.id, p.x, p.y))}
          onmove={move}
          onadd={addAt}
          onremove={removeVertex}
          onselect={(id) => {
            if (id !== QUERY) selected = selected === id ? null : id;
          }}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as item (item.label)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {item.cls}"></span>{item.label}
            </li>
          {/each}
        </ul>
        {#if crossesItself}
          <p class="mt-2 text-xs font-medium text-slate-700" data-testid="self-crossing">
            {m.selfCrossing}
          </p>
        {/if}
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
        {#if frame.method === 'shoelace'}
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.area}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="area">
              {frame.area === null ? m.pending : frame.area}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.sum}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="sum">{m.num(frame.sum)}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.direction}</dt>
            <dd class="text-base font-semibold" data-testid="direction">
              {frame.direction ? m.directions[frame.direction] : m.pending}
            </dd>
          </div>
        {:else}
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.location}</dt>
            <dd class="text-2xl font-bold" data-testid="location">
              {frame.location ? m.locations[frame.location] : m.pending}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">
              {frame.method === 'ray' ? m.stats.crossings : m.stats.winding}
            </dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="count">
              {frame.method === 'ray' ? frame.crossings : m.num(frame.winding)}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.vertices}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.polygon.length}</dd>
          </div>
        {/if}
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.edges}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="edges">{frame.edgesWalked}</dd>
        </div>
      </dl>

      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitles[frame.method]}
        </h2>
        {#if frame.rows.length === 0}
          <p class="text-sm text-slate-500">{m.rowEmpty}</p>
        {:else}
          <ScrollFrame>
            <table class="w-full text-sm tabular-nums">
              <thead>
                <tr class="text-left text-xs text-slate-500">
                  <th scope="col" class="px-2 py-1 font-semibold">{m.tableHeads.edge}</th>
                  <th scope="col" class="px-2 py-1 font-semibold"
                    >{m.tableHeads[frame.method][0]}</th
                  >
                  <th scope="col" class="px-2 py-1 font-semibold"
                    >{m.tableHeads[frame.method][1]}</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each frame.rows as row (row.i)}
                  <tr
                    class="border-t border-slate-100 {frame.edge === row.i
                      ? 'bg-amber-50 font-semibold'
                      : ''}"
                    data-testid="edge-row"
                  >
                    <th scope="row" class="px-2 py-1 text-left font-medium">
                      {m.edgeName(row.i, row.j)}
                    </th>
                    <td class="px-2 py-1">{m.rowValue(row)}</td>
                    <td class="px-2 py-1">{m.rowTotal(row.total)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </ScrollFrame>
        {/if}
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
