<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import { letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    GEO_PRESETS,
    GRID,
    MAX_POINTS,
    MIN_POINTS,
    PSEUDOCODE,
    PUZZLES,
    lineAcross,
    puzzleTrace,
    randomPoints,
  } from '$lib/algo-engine/practice-geometry.js';
  import { en as m } from '$lib/lessons/practice-geometry/copy.en.js';
  import PointPlane from '$lib/lessons/geometry-orientation/point-plane.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-geometry.js').GeoPoint} GeoPoint */
  /** @typedef {import('$lib/algo-engine/practice-geometry.js').Puzzle} Puzzle */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlanePoint} PlanePoint */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlanePolygon} PlanePolygon */
  /** @typedef {keyof typeof GEO_PRESETS} Preset */
  /** @typedef {keyof typeof m.roles} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(GEO_PRESETS));
  const RANDOM_COUNT = 9;
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    lineEnd: 'active',
    current: 'compare',
    left: 'frontier',
    right: 'visited',
    on: 'path',
    pair: 'compare',
    best: 'path',
    corner: 'sorted',
  };
  const LEGEND = /** @type {Record<Puzzle, [VisualState, string][]>} */ (m.legend);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  let puzzle = $state(/** @type {Puzzle} */ ('side'));
  let preset = $state(/** @type {Preset | ''} */ ('field'));
  let cloud = $state.raw(/** @type {GeoPoint[]} */ (GEO_PRESETS.field));
  let selected = $state(/** @type {number | null} */ (null));
  let xDraft = $state(/** @type {number | null} */ (6));
  let yDraft = $state(/** @type {number | null} */ (0));
  let kept = { x: 6, y: 0 };
  const guard = createFieldGuard();

  const player = createPlayer(puzzleTrace('side', GEO_PRESETS.field));
  const frame = $derived(player.frame);
  let notice = $state({ text: '', at: -1 });
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, letter));

  let guess = $state(/** @type {number | null} */ (null));
  let feedback = $state({ text: '', at: -1 });
  let right = $state(0);
  let wrong = $state(0);
  const shownFeedback = $derived(feedback.at === player.index ? feedback.text : '');

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    feedback = { text: '', at: -1 };
    guess = null;
    right = 0;
    wrong = 0;
    player.load(puzzleTrace(puzzle, cloud));
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    cloud = GEO_PRESETS[p];
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
    rebuild();
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
    rebuild();
  }

  /** @param {number} id */
  function removePoint(id) {
    if (cloud.length <= MIN_POINTS) {
      say(m.minError(MIN_POINTS));
      return;
    }
    cloud = cloud.filter((p) => p.id !== id);
    selected = null;
    preset = '';
    rebuild();
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

  function checkGuess() {
    const want = frame.ask;
    if (want === null) return;
    if (guess === null || !Number.isInteger(guess)) {
      feedback = { text: m.askEmpty, at: player.index };
      return;
    }
    if (guess === want) {
      right++;
      player.step();
      guess = null;
      feedback = { text: m.askRight(want), at: player.index };
    } else {
      wrong++;
      feedback = { text: m.askWrong(frame, letter), at: player.index };
    }
  }

  const byId = $derived(new Map(frame.points.map((p) => [p.id, p])));
  /** @param {number} id */
  const at = (id) => /** @type {GeoPoint} */ (byId.get(id));

  /** The roles of one point, most important first; the first one picks its colour. */
  /** @param {number} id @returns {Role[]} */
  function rolesOf(id) {
    /** @type {Role[]} */
    const out = [];
    if (frame.puzzle === 'side') {
      if (frame.line?.includes(id)) out.push('lineEnd');
      if (frame.current === id) out.push('current');
      if (frame.sides.left.includes(id)) out.push('left');
      if (frame.sides.right.includes(id)) out.push('right');
      if (frame.sides.on.includes(id)) out.push('on');
      return out;
    }
    if (frame.edge?.includes(id)) out.push('pair');
    if (frame.puzzle === 'diameter' && frame.bestPair?.includes(id)) out.push('best');
    if (frame.hull?.includes(id)) out.push('corner');
    return out;
  }

  /** @param {number} id */
  function noteOf(id) {
    if (frame.sides.left.includes(id)) return m.notes.left;
    if (frame.sides.right.includes(id)) return m.notes.right;
    if (frame.sides.on.includes(id)) return m.notes.on;
    return undefined;
  }

  const planePoints = $derived(
    frame.points.map((p) => {
      const roles = rolesOf(p.id);
      return /** @type {PlanePoint} */ ({
        id: p.id,
        x: p.x,
        y: p.y,
        label: letter(p.id),
        state: roles.length ? ROLE_STATE[roles[0]] : '',
        note: noteOf(p.id),
      });
    }),
  );

  /** @param {PlanePoint} p */
  const planeLabel = (p) =>
    m.pointLabel(
      p.label,
      p.x,
      p.y,
      rolesOf(p.id)
        .map((r) => m.roles[r])
        .join(', '),
    );

  /** @param {number} a @param {number} b @param {string} key @param {Partial<PlaneSegment>} rest @returns {PlaneSegment} */
  const seg = (a, b, key, rest) => ({
    key,
    x1: at(a).x,
    y1: at(a).y,
    x2: at(b).x,
    y2: at(b).y,
    ...rest,
  });

  const segments = $derived.by(() => {
    /** @type {PlaneSegment[]} */
    const out = [];
    if (frame.puzzle === 'side' && frame.line) {
      const [a, b] = frame.line;
      out.push({ key: 'line', ...lineAcross(at(a), at(b)), state: 'active', dashed: true });
      out.push(seg(a, b, 'ab', { state: 'active', thick: true, arrow: true }));
      if (frame.current !== null) out.push(seg(a, frame.current, 'ap', { state: 'compare' }));
      return out;
    }
    const hull = frame.hull ?? [];
    if (frame.puzzle === 'fence') {
      for (const i of frame.done)
        out.push(
          seg(hull[i], hull[(i + 1) % hull.length], `h${i}`, { state: 'sorted', thick: true }),
        );
    }
    if (frame.puzzle === 'diameter' && frame.bestPair) {
      const [p, q] = frame.bestPair;
      out.push(seg(p, q, 'best', { state: 'path', thick: true, label: m.bestLabel(frame.best) }));
    }
    if (frame.edge) {
      const [p, q] = frame.edge;
      out.push(seg(p, q, 'edge', { state: 'compare', thick: true, dashed: true }));
    }
    return out;
  });

  const polygons = $derived(
    frame.puzzle !== 'side' && frame.hull && frame.hull.length > 2
      ? [
          /** @type {PlanePolygon} */ ({
            key: 'hull',
            pts: frame.hull.map(at),
            state: frame.puzzle === 'fence' && frame.kind === 'done' ? 'sorted' : 'visited',
          }),
        ]
      : [],
  );

  /** @param {number[]} ids */
  const chips = (ids) =>
    ids.map((id) => ({
      label: `${letter(id)} (${at(id).x}, ${at(id).y})`,
      hot: id === frame.current,
    }));

  const statRows = $derived.by(() => {
    /** @type {[string, string | number, string][]} */
    const rows = [];
    if (frame.puzzle === 'side') {
      rows.push([m.stats.left, frame.sides.left.length, 'left']);
      rows.push([m.stats.right, frame.sides.right.length, 'right']);
      rows.push([m.stats.on, frame.sides.on.length, 'on']);
    } else if (frame.puzzle === 'fence') {
      const done = frame.kind === 'done';
      rows.push([m.stats.corners, frame.hull ? frame.hull.length : m.pending, 'corners']);
      rows.push([m.stats.twice, String(frame.twice).replace('-', '−'), 'twice']);
      rows.push([m.stats.area, done ? frame.twice / 2 : m.pending, 'area']);
      rows.push([
        m.stats.perimeter,
        frame.steps ? Math.round(frame.perimeter * 100) / 100 : m.pending,
        'perimeter',
      ]);
    } else {
      rows.push([m.stats.best, frame.best >= 0 ? frame.best : m.pending, 'best']);
      rows.push([
        m.stats.distance,
        frame.best >= 0 ? Math.round(Math.sqrt(frame.best) * 100) / 100 : m.pending,
        'distance',
      ]);
      rows.push([m.stats.pairs, frame.steps, 'pairs']);
      rows.push([m.stats.brute, frame.brute, 'brute']);
    }
    rows.push([m.stats.correct, right, 'correct']);
    rows.push([m.stats.wrong, wrong, 'wrong']);
    return rows;
  });
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.puzzleLabel}
      <select name="puzzle" class="field" bind:value={puzzle} onchange={rebuild}>
        {#each PUZZLES as p (p)}
          <option value={p}>{m.puzzles[p]}</option>
        {/each}
      </select>
    </label>
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
          points={planePoints}
          {segments}
          {polygons}
          labelOf={planeLabel}
          onmove={move}
          onadd={addAt}
          onremove={removePoint}
          onselect={(id) => (selected = selected === id ? null : id)}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND[frame.puzzle] as [state, label] (label)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[state]}"
              ></span>{label}
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

      <div class="rounded-xl border border-teal-300 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-teal-800 uppercase">
          {m.askTitle}
        </h2>
        {#if frame.ask !== null}
          <form
            class="flex flex-wrap items-end gap-3"
            onsubmit={(ev) => {
              ev.preventDefault();
              checkGuess();
            }}
          >
            <label class="flex flex-col gap-1 text-sm text-slate-700">
              {m.askLabels[frame.puzzle]}
              <input
                type="number"
                name="guess"
                class="field w-40 tabular-nums"
                bind:value={guess}
              />
            </label>
            <button type="submit" class="btn-secondary">{m.askCheck}</button>
          </form>
        {:else}
          <p class="text-sm text-slate-600">{player.atEnd ? m.askDone : m.askIdle}</p>
        {/if}
        <p
          class="mt-2 min-h-5 text-sm font-medium text-slate-800"
          aria-live="polite"
          data-testid="feedback"
        >
          {shownFeedback}
        </p>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        {#each statRows as [label, value, id], i (id)}
          <div
            class="rounded-xl border border-slate-200 bg-white p-3 {i === statRows.length - 1 &&
            statRows.length % 2 === 1
              ? 'col-span-2'
              : ''}"
          >
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>

      {#if frame.puzzle === 'side'}
        <ChipList
          title={m.listTitles.left}
          items={chips(frame.sides.left)}
          emptyText={m.listEmpty}
          limit={MAX_POINTS}
        />
        <ChipList
          title={m.listTitles.right}
          items={chips(frame.sides.right)}
          emptyText={m.listEmpty}
          limit={MAX_POINTS}
        />
        <ChipList
          title={m.listTitles.on}
          items={chips(frame.sides.on)}
          emptyText={m.listEmpty}
          limit={MAX_POINTS}
        />
      {:else}
        <ChipList
          title={m.listTitles.hull}
          items={chips(frame.hull ?? [])}
          emptyText={m.pending}
          limit={MAX_POINTS}
        />
      {/if}

      <CodePanel lines={PSEUDOCODE[frame.puzzle]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
