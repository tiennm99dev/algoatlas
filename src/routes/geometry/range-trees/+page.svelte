<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import { letter } from '$lib/components/graph-editor.js';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    GRID,
    MAX_POINTS,
    RANGE_PRESETS,
    randomPoints,
    rangeTreePseudocode,
    rangeTreeTrace,
  } from '$lib/algo-engine/range-trees.js';
  import { en as m } from '$lib/lessons/range-trees/copy.en.js';
  import PointPlane from '$lib/lessons/geometry-orientation/point-plane.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/range-trees.js').RangePoint} RangePoint */
  /** @typedef {import('$lib/algo-engine/range-trees.js').RangeNode} RangeNode */
  /** @typedef {import('$lib/algo-engine/range-trees.js').RangeQuery} RangeQuery */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlanePoint} PlanePoint */
  /** @typedef {import('$lib/lessons/geometry-orientation/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {keyof typeof RANGE_PRESETS} Preset */
  /** @typedef {keyof typeof m.roles} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(RANGE_PRESETS));
  const RANDOM_COUNT = 12;
  const BOUNDS = /** @type {(keyof RangeQuery)[]} */ (['x1', 'x2', 'y1', 'y2']);
  /** Plane ids of the rectangle’s two corner handles; points use ids from 0. */
  const CORNER_A = -1;
  const CORNER_B = -2;
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    split: 'active',
    canonical: 'path',
    searching: 'compare',
    inCanonical: 'path',
    visited: 'visited',
    reported: 'sorted',
    excluded: 'pruned',
  };

  const START = RANGE_PRESETS.scatter;
  let preset = $state(/** @type {Preset | ''} */ ('scatter'));
  let cloud = $state.raw(/** @type {RangePoint[]} */ (START.points));
  let corners = $state.raw({
    a: { x: START.query.x1, y: START.query.y1 },
    b: { x: START.query.x2, y: START.query.y2 },
  });
  const query = $derived({
    x1: Math.min(corners.a.x, corners.b.x),
    x2: Math.max(corners.a.x, corners.b.x),
    y1: Math.min(corners.a.y, corners.b.y),
    y2: Math.max(corners.a.y, corners.b.y),
  });
  /** @type {Record<keyof RangeQuery, number | null>} */
  const drafts = $state({ ...START.query });
  let selected = $state(/** @type {number | null} */ (null));
  let xDraft = $state(/** @type {number | null} */ (0));
  let yDraft = $state(/** @type {number | null} */ (4));
  let kept = { x: 0, y: 4 };
  let notice = $state({ text: '', at: -1 });
  const guard = createFieldGuard();

  const player = createPlayer(rangeTreeTrace(START.points, START.query));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, letter));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function syncDrafts() {
    drafts.x1 = query.x1;
    drafts.x2 = query.x2;
    drafts.y1 = query.y1;
    drafts.y2 = query.y2;
  }

  /** @param {boolean} [toEnd] */
  function rebuild(toEnd = false) {
    notice = { text: '', at: -1 };
    syncDrafts();
    player.load(rangeTreeTrace(cloud, query));
    if (toEnd) player.seek(player.frames.length - 1);
  }

  /** @param {RangeQuery} q */
  function setQuery(q) {
    corners = { a: { x: q.x1, y: q.y1 }, b: { x: q.x2, y: q.y2 } };
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    cloud = RANGE_PRESETS[p].points;
    setQuery(RANGE_PRESETS[p].query);
    selected = null;
    rebuild();
  }

  function loadRandom() {
    preset = '';
    cloud = randomPoints(RANDOM_COUNT);
    selected = null;
    rebuild();
  }

  function commitQuery() {
    const { x1, x2, y1, y2 } = drafts;
    const ok =
      wholeInRange(x1, 0, GRID.xMax) &&
      wholeInRange(x2, 0, GRID.xMax) &&
      wholeInRange(y1, 0, GRID.yMax) &&
      wholeInRange(y2, 0, GRID.yMax) &&
      /** @type {number} */ (x1) <= /** @type {number} */ (x2) &&
      /** @type {number} */ (y1) <= /** @type {number} */ (y2);
    if (!ok) {
      syncDrafts();
      say(m.queryError(GRID.xMax, GRID.yMax));
      return;
    }
    const next = /** @type {RangeQuery} */ ({ x1, x2, y1, y2 });
    if (
      next.x1 === query.x1 &&
      next.x2 === query.x2 &&
      next.y1 === query.y1 &&
      next.y2 === query.y2
    )
      return;
    setQuery(next);
    rebuild(true);
  }

  /** @param {number} x @param {number} y */
  const occupied = (x, y) => cloud.some((p) => p.x === x && p.y === y);

  /** @param {number} id @param {number} x @param {number} y */
  function move(id, x, y) {
    if (id === CORNER_A || id === CORNER_B) {
      corners = id === CORNER_A ? { a: { x, y }, b: corners.b } : { a: corners.a, b: { x, y } };
      rebuild(true);
      return;
    }
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
    if (id < 0) {
      say(m.cornerError);
      return;
    }
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

  const byId = $derived(new Map(frame.nodes.map((n) => [n.id, n])));
  /** @param {number} id */
  const nodeAt = (id) => /** @type {RangeNode} */ (byId.get(id));

  /** Ids in each subtree, by root, so a role can cover a whole canonical subtree. */
  const subtreeOf = $derived(new Map(frame.nodes.map((n) => [n.id, n.ys])));
  const searching = $derived(new Set(frame.search ? frame.search.list : []));
  const inCanonical = $derived(new Set(frame.canonical.flatMap((id) => subtreeOf.get(id) ?? [])));
  const reported = $derived(new Set(frame.reported));

  /** The roles of one point, most important first; the first one picks its colour. */
  /** @param {number} id @returns {Role[]} */
  function rolesOf(id) {
    /** @type {Role[]} */
    const out = [];
    if (id === frame.current && frame.kind !== 'done') out.push('current');
    if (reported.has(id)) out.push('reported');
    if (searching.has(id)) out.push('searching');
    else if (inCanonical.has(id)) out.push(reported.has(id) ? 'inCanonical' : 'excluded');
    if (frame.visited.includes(id)) out.push('visited');
    if (id === frame.split) out.push('split');
    if (frame.canonical.includes(id)) out.push('canonical');
    return out;
  }

  /** @param {Role[]} roles @param {Role[]} skip @returns {VisualState} */
  const stateFor = (roles, skip = []) => {
    const role = roles.find((r) => !skip.includes(r));
    return role ? ROLE_STATE[role] : '';
  };

  const planePoints = $derived.by(() => {
    /** @type {PlanePoint[]} */
    const out = frame.points.map((p) => {
      const roles = rolesOf(p.id);
      return {
        id: p.id,
        x: p.x,
        y: p.y,
        label: letter(p.id),
        state: stateFor(roles, ['split', 'canonical']),
        note: reported.has(p.id) ? m.markers.reported : undefined,
      };
    });
    out.push(
      { id: CORNER_A, x: corners.a.x, y: corners.a.y, label: '1', state: 'frontier' },
      { id: CORNER_B, x: corners.b.x, y: corners.b.y, label: '2', state: 'frontier' },
    );
    return out;
  });

  /** @param {PlanePoint} p */
  function planeLabel(p) {
    if (p.id < 0) return m.cornerLabel(p.label, p.x, p.y);
    return m.pointLabel(
      p.label,
      p.x,
      p.y,
      rolesOf(p.id)
        .map((r) => m.roles[r])
        .join(', '),
    );
  }

  const rect = $derived(frame.query);
  const polygons = $derived([
    {
      key: 'rect',
      state: /** @type {VisualState} */ ('frontier'),
      pts: [
        { x: rect.x1, y: rect.y1 },
        { x: rect.x2, y: rect.y1 },
        { x: rect.x2, y: rect.y2 },
        { x: rect.x1, y: rect.y2 },
      ],
    },
  ]);

  const segments = $derived.by(() => {
    const { x1, x2, y1, y2 } = rect;
    /** @type {PlaneSegment[]} */
    const out = [
      { key: 'r0', x1, y1, x2, y2: y1, state: 'frontier' },
      { key: 'r1', x1: x2, y1, x2, y2, state: 'frontier' },
      { key: 'r2', x1: x2, y1: y2, x2: x1, y2, state: 'frontier' },
      { key: 'r3', x1, y1: y2, x2: x1, y2: y1, state: 'frontier' },
    ];
    if (frame.current !== null && frame.kind !== 'done') {
      const x = nodeAt(frame.current).x;
      out.push({
        key: 'split',
        x1: x,
        y1: 0,
        x2: x,
        y2: GRID.yMax,
        state: 'active',
        dashed: true,
      });
    }
    return out;
  });

  /** @param {number | null} id @returns {TreeNode | null} */
  function treeNode(id) {
    if (id === null) return null;
    const n = nodeAt(id);
    const roles = rolesOf(id);
    return {
      id,
      label: letter(id),
      note: `${n.x}, ${n.y}`,
      state: stateFor(roles, ['reported', 'split', 'canonical']),
      marker:
        id === frame.split
          ? m.markers.split
          : frame.canonical.includes(id)
            ? m.markers.canonical
            : reported.has(id)
              ? m.markers.reported
              : '',
      children: [treeNode(n.left), treeNode(n.right)],
    };
  }
  const roots = $derived(
    frame.root === null ? [] : [/** @type {TreeNode} */ (treeNode(frame.root))],
  );

  const search = $derived(frame.search);
  const listValues = $derived(search ? search.list.map((id) => nodeAt(id).y) : []);
  const reportedChips = $derived(
    frame.reported.map((id, i) => ({
      label: `${letter(id)} (${nodeAt(id).x}, ${nodeAt(id).y})`,
      hot: i === frame.reported.length - 1 && frame.kind !== 'done',
    })),
  );

  const LEGEND = /** @type {const} */ ([
    ['current', 'active'],
    ['visited', 'visited'],
    ['searching', 'compare'],
    ['canonical', 'path'],
    ['reported', 'sorted'],
    ['excluded', 'pruned'],
    ['rect', 'frontier'],
  ]);
</script>

{#snippet stat(
  /** @type {string} */ label,
  /** @type {number} */ v,
  /** @type {string} */ id,
  wide = false,
)}
  <div class="rounded-xl border border-slate-200 bg-white p-3 {wide ? 'col-span-2' : ''}">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{v}</dd>
  </div>
{/snippet}

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
    <button type="button" class="btn-outline" onclick={loadRandom}>{m.random}</button>
    <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form
      class="flex flex-wrap items-end gap-2"
      aria-label={m.queryTitle}
      onkeydown={(e) => enterField(e, {})}
      onsubmit={(e) => e.preventDefault()}
    >
      {#each BOUNDS as key (key)}
        <label
          class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >
          {m.fields[key]}
          <input
            type="number"
            name={key}
            min="0"
            max={key.startsWith('x') ? GRID.xMax : GRID.yMax}
            class="field w-16 tabular-nums"
            bind:value={drafts[key]}
            onchange={commitQuery}
          />
        </label>
      {/each}
    </form>
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
          onselect={(id) => {
            if (id >= 0) selected = selected === id ? null : id;
          }}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as [key, state] (key)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[state]}"></span>{m
                .legend[key]}
            </li>
          {/each}
          <li>{m.legend.markers}</li>
        </ul>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeLabel}
          labelOf={(node) => {
            const n = nodeAt(/** @type {number} */ (node.id));
            return m.nodeLabel(
              node.label,
              n.x,
              n.y,
              rolesOf(n.id).map((r) => m.roles[r]),
            );
          }}
          speed={player.speed}
        />
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
        {@render stat(m.stats.reported, frame.reported.length, 'reported')}
        {@render stat(m.stats.brute, frame.points.length, 'brute')}
        {@render stat(m.stats.visited, frame.visited.length, 'visited')}
        {@render stat(m.stats.searches, frame.searches, 'searches')}
        {@render stat(m.stats.comparisons, frame.comparisons, 'comparisons')}
        {@render stat(m.stats.storage, frame.storage, 'storage')}
      </dl>

      <section class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        {#if search}
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.listTitle(letter(search.node))}
          </h2>
          <ArrayStrip
            values={listValues}
            ariaLabel={m.listAria(letter(search.node))}
            stateOf={(i) => (i >= search.lo && i < search.hi ? 'sorted' : 'pruned')}
            markerOf={(i) => letter(search.list[i])}
            windows={search.hi > search.lo
              ? [{ from: search.lo, to: search.hi, label: m.listWindow }]
              : []}
            showIndices={false}
            speed={player.speed}
          />
        {:else}
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.listTitle('…')}
          </h2>
          <p class="text-sm text-slate-500" data-testid="list-idle">{m.listIdle}</p>
        {/if}
      </section>

      <ChipList
        title={m.reportedTitle}
        items={reportedChips}
        emptyText={m.reportedEmpty}
        limit={MAX_POINTS}
      />

      <CodePanel lines={rangeTreePseudocode} active={frame.lines} />
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
