<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PointPlane from '$lib/components/point-plane.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { letter } from '$lib/components/graph-editor.js';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    CITY_PRESETS,
    GRID,
    MAX_CITIES,
    MIN_CITIES,
    distances,
    heldKarpTrace,
    tourCount,
    transitionCount,
    tspPseudocode,
  } from '$lib/algo-engine/bitmask-dp.js';
  import { vi as m } from '$lib/lessons/bitmask-dp/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/bitmask-dp.js').City} City */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/components/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {'read'|'target'|'improved'|'path'|''} Role */

  const FIRST = CITY_PRESETS[0];

  let cities = $state(FIRST.cities.map((c) => ({ ...c })));
  let preset = $state(FIRST.key);
  let selected = $state(/** @type {number | null} */ (null));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(heldKarpTrace(distances(FIRST.cities)));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const finalFrame = $derived(player.frames[player.frames.length - 1]);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {City[]} next */
  function setCities(next) {
    cities = next;
    notice = { text: '', at: -1 };
    player.load(heldKarpTrace(distances(next)));
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = CITY_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    selected = null;
    setCities(p.cities.map((c) => ({ ...c })));
  }

  /** @param {number} x @param {number} y @param {number} [except] */
  const occupied = (x, y, except = -1) =>
    cities.some((c, i) => i !== except && c.x === x && c.y === y);

  /** @param {number} id @param {number} x @param {number} y */
  function move(id, x, y) {
    if (occupied(x, y, id)) {
      say(m.occupiedError);
      return;
    }
    preset = '';
    setCities(cities.map((c, i) => (i === id ? { x, y } : c)));
  }

  /** @param {number} x @param {number} y */
  function addAt(x, y) {
    if (cities.length >= MAX_CITIES) {
      say(m.fullError(MAX_CITIES));
      return;
    }
    if (occupied(x, y)) {
      say(m.occupiedError);
      return;
    }
    preset = '';
    selected = cities.length;
    setCities([...cities, { x, y }]);
  }

  /** Adds a city on the first free spot, row by row from the bottom left. */
  function addFree() {
    for (let y = 0; y <= GRID.yMax; y++)
      for (let x = 0; x <= GRID.xMax; x++)
        if (!occupied(x, y)) {
          addAt(x, y);
          return;
        }
    say(m.noRoomError);
  }

  /** @param {number} id */
  function removeCity(id) {
    if (cities.length <= MIN_CITIES) {
      say(m.minError(MIN_CITIES));
      return;
    }
    preset = '';
    selected = null;
    setCities(cities.filter((_, i) => i !== id));
  }

  function removeSelected() {
    if (selected === null) say(m.selectFirst);
    else removeCity(selected);
  }

  function randomCities() {
    const n = MIN_CITIES + 1 + Math.floor(Math.random() * (MAX_CITIES - MIN_CITIES));
    /** @type {City[]} */
    const next = [];
    while (next.length < n) {
      const x = Math.floor(Math.random() * (GRID.xMax + 1));
      const y = Math.floor(Math.random() * (GRID.yMax + 1));
      if (!next.some((c) => c.x === x && c.y === y)) next.push({ x, y });
    }
    preset = '';
    selected = null;
    setCities(next);
  }

  const n = $derived(frame.n);
  /** Masks that contain A, in the order the table fills them. */
  const masks = $derived(Array.from({ length: 2 ** Math.max(0, n - 1) }, (_, i) => 2 * i + 1));
  const cityIds = $derived(Array.from({ length: n }, (_, i) => i));
  const bitOrder = $derived(cityIds.slice().reverse());

  /** States read back so far: the best tour, state by state. */
  const pathSet = $derived.by(() => {
    if (frame.kind !== 'trace' && frame.kind !== 'done') return new Set();
    const keys = player.frames
      .slice(0, player.index + 1)
      .filter((f) => f.kind === 'trace')
      .map((f) => `${f.mask}-${f.j}`);
    if (frame.kind === 'done') keys.push('1-0');
    return new Set(keys);
  });

  /** @param {number} mask @param {number} j @returns {Role} */
  function roleOf(mask, j) {
    if (pathSet.has(`${mask}-${j}`)) return 'path';
    const reads = frame.kind === 'try' || frame.kind === 'close' || frame.kind === 'base';
    if (reads && mask === frame.mask && j === frame.j) return 'read';
    if (frame.kind === 'try' && mask === (frame.mask | (1 << frame.k)) && j === frame.k)
      return frame.improved ? 'improved' : 'target';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = { read: 'active', target: 'compare', improved: 'swap', path: 'path', '': '' };
  /** @param {VisualState} s */
  const textOn = (s) =>
    s === 'active' || s === 'swap' || s === 'sorted' ? 'text-white' : 'text-slate-900';

  /** @param {number} mask @param {number} j */
  function cellText(mask, j) {
    // A walk only stands on A before it leaves, so A ends a state of mask 1 alone.
    if (!(mask & (1 << j)) || (j === 0 && mask !== 1)) return m.outside;
    const v = frame.dp[mask][j];
    return v === null ? '' : String(v);
  }

  /** @param {number} mask @param {number} j */
  function cellAria(mask, j) {
    const role = roleOf(mask, j);
    return m.cellLabel(mask, j, n, cellText(mask, j), role ? m.cellStates[role] : '');
  }

  // Keep the row being read in view inside the scrolling table.
  /** @type {HTMLDivElement | undefined} */
  let scroller = $state();
  $effect(() => {
    const row = scroller?.querySelector(`tr[data-mask="${frame.mask}"]`);
    if (!scroller || !(row instanceof HTMLElement)) return;
    const top = row.offsetTop;
    const view = scroller.clientHeight;
    if (top < scroller.scrollTop + 32 || top > scroller.scrollTop + view - 32)
      scroller.scrollTop = Math.max(0, top - view / 2);
  });

  /** Cities walked so far, as positions on the route or tour. */
  const walk = $derived(
    frame.kind === 'trace' ? frame.tour : frame.kind === 'done' ? frame.tour : frame.route,
  );
  const walkState = /** @type {VisualState} */ (
    $derived(frame.kind === 'done' ? 'sorted' : frame.kind === 'trace' ? 'path' : 'visited')
  );

  /** @param {number} c */
  function cityState(c) {
    if (frame.kind === 'done') return /** @type {VisualState} */ ('sorted');
    if ((frame.kind === 'try' || frame.kind === 'close') && c === frame.k && frame.kind === 'try')
      return /** @type {VisualState} */ ('frontier');
    if (frame.j === c && frame.kind !== 'mask') return /** @type {VisualState} */ ('active');
    if (walk.includes(c)) return walkState;
    return /** @type {VisualState} */ ('');
  }

  /** @param {number} c */
  function cityRole(c) {
    if (frame.kind === 'done') return m.cityStates.tour;
    if (frame.kind === 'try' && c === frame.k) return m.cityStates.next;
    if (walk.includes(c)) return m.cityStates.route;
    return c === 0 ? m.cityStates.start : '';
  }

  const points = $derived(
    cities.map((c, i) => ({ id: i, x: c.x, y: c.y, label: letter(i), state: cityState(i) })),
  );

  const segments = $derived.by(() => {
    /** @type {PlaneSegment[]} */
    const out = [];
    /** @param {number} a @param {number} b @param {VisualState} state @param {string} key @param {boolean} dashed */
    const road = (a, b, state, key, dashed) => {
      const [p, q] = [cities[a], cities[b]];
      if (!p || !q) return;
      out.push({
        key,
        x1: p.x,
        y1: p.y,
        x2: q.x,
        y2: q.y,
        state,
        dashed,
        thick: !dashed,
        arrow: true,
      });
    };
    walk.forEach((c, i) => {
      if (i > 0) road(walk[i - 1], c, walkState, `w${i}`, false);
    });
    if (frame.kind === 'try')
      road(frame.j, frame.k, frame.improved ? 'swap' : 'compare', 'try', true);
    if (frame.kind === 'close')
      road(frame.j, 0, frame.improved ? 'swap' : 'compare', 'close', true);
    return out;
  });

  const distShown = $derived(frame.dist.map((r) => r.map((v) => v)));
  const names = $derived(cityIds.map(letter));
  /** @param {number} r @param {number} c @returns {VisualState} */
  function distState(r, c) {
    if (frame.kind === 'try' && r === frame.j && c === frame.k) return 'compare';
    if (frame.kind === 'close' && r === frame.j && c === 0) return 'compare';
    return '';
  }

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.read} ${m.legend.read}`],
    ['compare', `${m.markers.target} ${m.legend.target}`],
    ['swap', `${m.markers.improved} ${m.legend.improved}`],
    ['path', `${m.markers.path} ${m.legend.path}`],
    ['visited', m.legend.lit],
  ]);
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field max-w-full"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each CITY_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn-secondary" onclick={addFree}>{m.addCity}</button>
    <button type="button" class="btn-outline" onclick={removeSelected}>{m.removeCity}</button>
    <button type="button" class="btn-outline" onclick={randomCities}>{m.randomCities}</button>
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
          labelOf={(p) => m.cityLabel(p.label, p.x, p.y, cityRole(p.id))}
          onmove={move}
          onadd={addAt}
          onremove={removeCity}
          onselect={(id) => (selected = selected === id ? null : id)}
          {selected}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.distanceNote}</p>

        <h2 class="mt-4 mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <p class="mb-2 text-xs text-slate-600">{m.tableCaption(n)}</p>
        <div bind:this={scroller} class="max-h-96 overflow-auto rounded-lg border border-slate-200">
          <table class="w-full border-collapse text-center text-sm tabular-nums">
            <thead class="sticky top-0 z-[1] bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" class="px-2 py-1 font-semibold">{m.maskHead}</th>
                {#each bitOrder as c (c)}
                  <th scope="col" class="w-6 py-1 font-semibold">
                    <span class="sr-only">{m.bitsHead}</span>{letter(c)}
                  </th>
                {/each}
                {#each cityIds as j (j)}
                  <th scope="col" class="min-w-10 border-l border-slate-200 py-1 font-semibold">
                    {m.endHead(letter(j))}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each masks as mask (mask)}
                <tr
                  data-mask={mask}
                  class="border-t border-slate-100 {mask === frame.mask ? 'bg-amber-50' : ''}"
                >
                  <th
                    scope="row"
                    class="px-2 py-1 font-mono text-xs"
                    aria-label={m.maskLabel(mask, n)}
                  >
                    {mask}
                  </th>
                  {#each bitOrder as c (c)}
                    {@const on = (mask & (1 << c)) !== 0}
                    <td class="p-0.5" aria-label={m.bitLabel(letter(c), on)}>
                      <span
                        class="inline-block w-5 rounded-sm border font-mono text-xs {on
                          ? 'border-slate-700 bg-state-visited text-slate-900'
                          : 'border-slate-200 text-slate-400'}">{on ? 1 : 0}</span
                      >
                    </td>
                  {/each}
                  {#each cityIds as j (j)}
                    {@const role = roleOf(mask, j)}
                    {@const st = ROLE_STATE[role]}
                    <td
                      class="relative border-l border-slate-200 px-1 py-1 font-semibold {st
                        ? `${STATE_BG[st]} ${textOn(st)}`
                        : cellText(mask, j) === m.outside
                          ? 'text-slate-300'
                          : ''}"
                      aria-label={cellAria(mask, j)}
                      data-cell="{mask}-{j}"
                    >
                      {cellText(mask, j)}{#if role}<span
                          class="absolute top-0 right-0.5 text-[10px]"
                          aria-hidden="true">{m.markers[role]}</span
                        >{/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
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
          <dt class="text-xs text-slate-500">{m.stats.tries}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tries">
            {frame.tries} / {transitionCount(n)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.reached}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="reached">
            {frame.reached} / {finalFrame.reached}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.best}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="best">
            {frame.best ?? m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.tours}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="tours">{tourCount(n)}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.routeTitle}</h2>
        <p class="font-mono text-sm text-slate-800" data-testid="walk">{m.route(walk)}</p>
      </div>
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.distTitle}</h2>
        <DpTable
          values={distShown}
          ariaLabel={m.distAria(n)}
          rowHeaders={names}
          colHeaders={names}
          stateOf={distState}
          speed={player.speed}
        />
      </div>
      <CodePanel lines={tspPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
