<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_A,
    MAX_B,
    MAX_D,
    MAX_K,
    MAX_NODES,
    MIN_B,
    recursionPseudocode,
    recursionTrace,
    subtreeCost,
    treeRoots,
    validRecurrence,
  } from '$lib/algo-engine/analysing-loops-recursion.js';
  import { en as m } from '$lib/lessons/analysing-loops-recursion/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/analysing-loops-recursion.js').Recurrence} Recurrence */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {keyof Recurrence} Field */
  /** @typedef {keyof typeof m.presets} PresetKey */

  /** @type {Record<PresetKey, Recurrence>} */
  const PRESETS = {
    binary: { a: 1, b: 2, d: 0, k: 5 },
    halving: { a: 1, b: 2, d: 1, k: 5 },
    traversal: { a: 2, b: 2, d: 0, k: 4 },
    merge: { a: 2, b: 2, d: 1, k: 4 },
    karatsuba: { a: 3, b: 2, d: 1, k: 3 },
    quad: { a: 4, b: 2, d: 1, k: 3 },
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));
  const FIELDS = /** @type {Field[]} */ (['a', 'b', 'd', 'k']);
  /** @type {Record<Field, [number, number]>} */
  const RANGE = { a: [1, MAX_A], b: [MIN_B, MAX_B], d: [0, MAX_D], k: [1, MAX_K] };

  // A fixed first recurrence keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.merge;
  /** @type {Recurrence} */
  let rec = $state({ ...INITIAL });
  /** @type {Record<Field, number | null>} */
  let drafts = $state({ ...INITIAL });
  let preset = $state('merge');
  let notice = $state({ text: '', at: -1 });
  /** @type {string | number | null} */
  let selected = $state(null);

  const player = createPlayer(recursionTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {Recurrence} next */
  function load(next) {
    rec = { ...next };
    drafts = { ...next };
    selected = null;
    notice = { text: '', at: -1 };
    player.load(recursionTrace(next));
  }

  /** @param {Field} key */
  function commit(key) {
    const v = drafts[key];
    const next = { ...rec, [key]: typeof v === 'number' ? v : NaN };
    if (!validRecurrence(next)) {
      drafts[key] = rec[key];
      notice = { text: m.fieldError(MAX_NODES), at: player.index };
      return;
    }
    preset = '';
    load(next);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    load(PRESETS[key]);
  }

  /** @type {Record<string, string>} */
  const MARKERS = { active: '∑', frontier: '+', visited: '✓', sorted: '✓' };

  /** @param {TreeNode} node @returns {TreeNode} */
  function withMarker(node) {
    return {
      ...node,
      marker: MARKERS[node.state ?? ''] ?? '',
      children: (node.children ?? []).map((c) => (c ? withMarker(c) : null)),
    };
  }

  const roots = $derived(treeRoots(frame).map(withMarker));
  const callsDrawn = $derived.by(() => {
    let total = 0;
    for (let i = 0; i <= frame.depth; i++) total += frame.rec.a ** i;
    return total;
  });
  // Node ids are `level:index`; a node removed by rewinding simply drops the selection.
  const pick = $derived.by(() => {
    if (selected === null) return null;
    const level = Number(String(selected).split(':')[0]);
    if (level > frame.depth) return null;
    const size = frame.n / frame.rec.b ** level;
    return { level, size, cost: subtreeCost(frame.rec, size) };
  });
  const legend = /** @type {const} */ (['active', 'frontier', 'visited', 'sorted']);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      for (const k of FIELDS) if (drafts[k] !== rec[k]) commit(k);
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    {#each FIELDS as k (k)}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields[k]}
        <input
          type="number"
          name={k}
          min={RANGE[k][0]}
          max={RANGE[k][1]}
          step="1"
          class="field w-20"
          bind:value={drafts[k]}
          onchange={() => commit(k)}
        />
      </label>
    {/each}
  </form>

  <p class="mb-4 font-mono text-sm text-slate-700">
    T(n) = {m.recText(rec)}, T(1) = 1, {m.nLine(rec)}
  </p>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <TreeView
          {roots}
          ariaLabel={m.treeLabel}
          labelOf={m.nodeLabel}
          onselect={(id) => (selected = id)}
          selected={pick ? selected : null}
          emptyText={m.emptyTree}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {MARKERS[s]}
              {m.legend[s]}
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
          <dt class="text-xs text-slate-500">{m.stats.n}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.n}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
          <dd class="text-2xl font-bold tabular-nums">{callsDrawn}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.levels}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.levels.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.total}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.total.toLocaleString('en-US')}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <h2 class="mb-1 text-xs text-slate-500">{m.selectedTitle}</h2>
        <p>
          {pick ? m.selectedLine(frame.rec, pick.size, pick.level, pick.cost) : m.selectHint}
        </p>
      </div>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.levelsTitle}</h2>
        <table class="w-full text-sm tabular-nums">
          <thead class="text-left text-xs text-slate-500">
            <tr>
              {#each m.levelHead as h (h)}
                <th class="pb-1 font-semibold">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each frame.levels as row (row.depth)}
              <tr
                class="border-t border-slate-100 {row.depth === frame.current
                  ? 'font-bold text-slate-900'
                  : 'text-slate-700'}"
              >
                <td class="py-0.5">{row.depth}</td>
                <td class="py-0.5">{m.levelCell(row.nodes, row.nodeCost)}</td>
                <td class="py-0.5">{row.cost.toLocaleString('en-US')}</td>
              </tr>
            {/each}
            <tr class="border-t-2 border-slate-300 font-semibold text-slate-900">
              <td class="py-0.5" colspan="2">{m.totalRow}</td>
              <td class="py-0.5">{frame.total.toLocaleString('en-US')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <CodePanel lines={recursionPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
