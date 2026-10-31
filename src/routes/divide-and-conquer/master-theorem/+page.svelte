<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    D_VALUES,
    MAX_A,
    MAX_B,
    MAX_K,
    MAX_NODES,
    MIN_B,
    P_VALUES,
    levelState,
    masterPseudocode,
    masterTrace,
    nodeCount,
    validRecurrence,
    work,
  } from '$lib/algo-engine/master-theorem.js';
  import { en as m } from '$lib/lessons/master-theorem/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/master-theorem.js').Recurrence} Recurrence */
  /** @typedef {import('$lib/algo-engine/master-theorem.js').MasterFrame} MasterFrame */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {'a' | 'b' | 'k'} WholeField */
  /** @typedef {keyof typeof m.presets} PresetKey */

  /** @type {Record<PresetKey, Recurrence>} */
  const PRESETS = {
    binary: { a: 1, b: 2, d: 0, p: 0, k: 5 },
    merge: { a: 2, b: 2, d: 1, p: 0, k: 4 },
    karatsuba: { a: 3, b: 2, d: 1, p: 0, k: 3 },
    strassen: { a: 7, b: 2, d: 2, p: 0, k: 2 },
    matrix: { a: 8, b: 2, d: 2, p: 0, k: 2 },
    closest: { a: 2, b: 2, d: 1, p: 1, k: 4 },
    root: { a: 2, b: 2, d: 2, p: 0, k: 4 },
    sqrt: { a: 2, b: 4, d: 0.5, p: 0, k: 3 },
    gap: { a: 2, b: 2, d: 1, p: -1, k: 4 },
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));
  const WHOLE = /** @type {WholeField[]} */ (['a', 'b', 'k']);
  /** @type {Record<WholeField, [number, number]>} */
  const RANGE = { a: [1, MAX_A], b: [MIN_B, MAX_B], k: [1, MAX_K] };

  // A fixed first recurrence keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.merge;
  /** @type {Recurrence} */
  let rec = $state({ ...INITIAL });
  /** @type {Record<WholeField, number | null>} */
  let drafts = $state({ a: INITIAL.a, b: INITIAL.b, k: INITIAL.k });
  let preset = $state('merge');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(masterTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {Recurrence} next */
  function load(next) {
    rec = { ...next };
    drafts = { a: next.a, b: next.b, k: next.k };
    notice = { text: '', at: -1 };
    player.load(masterTrace(next));
  }

  /** @param {Partial<Recurrence>} change @param {() => void} revert */
  function tryLoad(change, revert) {
    const next = { ...rec, ...change };
    if (!validRecurrence(next)) {
      revert();
      notice = { text: m.fieldError(MAX_NODES), at: player.index };
      return;
    }
    preset = '';
    load(next);
  }

  /** @param {WholeField} key */
  function commitWhole(key) {
    const v = drafts[key];
    if (v === rec[key]) return;
    tryLoad({ [key]: typeof v === 'number' ? v : NaN }, () => (drafts[key] = rec[key]));
  }

  /** @param {'d' | 'p'} key @param {Event & {currentTarget: HTMLSelectElement}} e */
  function commitPower(key, e) {
    const select = e.currentTarget;
    tryLoad({ [key]: Number(select.value) }, () => (select.value = String(rec[key])));
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    load(PRESETS[key]);
  }

  /** @param {MasterFrame} f @returns {TreeNode[]} */
  function treeOf(f) {
    const r = f.rec;
    /** @param {number} level @param {number} index @returns {TreeNode} */
    function build(level, index) {
      const size = f.n / r.b ** level;
      const state = levelState(f, level);
      return {
        id: `${level}:${index}`,
        label: String(size),
        note: m.fmt(level === r.k ? 1 : work(r, size)),
        state,
        marker: m.markers[state] ?? '',
        children:
          level < r.k
            ? Array.from({ length: r.a }, (_, t) => build(level + 1, index * r.a + t))
            : [],
      };
    }
    return [build(0, 0)];
  }

  const roots = $derived(treeOf(frame));
  // Bars share one scale for the whole run, so they do not jump while levels are added.
  const maxCost = $derived(
    Math.max(...(player.frames.at(-1)?.levels ?? []).map((l) => l.cost), 1e-9),
  );
  const legend = /** @type {const} */ (['active', 'visited', 'sorted']);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      for (const k of WHOLE) commitWhole(k);
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
    {#each WHOLE.slice(0, 2) as k (k)}
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
          onchange={() => commitWhole(k)}
        />
      </label>
    {/each}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.d}
      <select name="d" class="field" value={String(rec.d)} onchange={(e) => commitPower('d', e)}>
        {#each D_VALUES as d (d)}
          <option value={String(d)}>{m.dOption(d)}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.p}
      <select name="p" class="field" value={String(rec.p)} onchange={(e) => commitPower('p', e)}>
        {#each P_VALUES as p (p)}
          <option value={String(p)}>{m.pOption(p)}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.k}
      <input
        type="number"
        name="k"
        min={RANGE.k[0]}
        max={RANGE.k[1]}
        step="1"
        class="field w-20"
        bind:value={drafts.k}
        onchange={() => commitWhole('k')}
      />
    </label>
  </form>

  <p class="mb-4 font-mono text-sm text-slate-700">{m.recLine(rec, frame.n)}</p>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <TreeView
          {roots}
          ariaLabel={m.treeLabel}
          labelOf={m.nodeLabel}
          emptyText={m.emptyTree}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {m.markers[s]}
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

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.n}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.n}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.c}</dt>
          <dd class="text-lg font-bold tabular-nums">{m.cStat(frame)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
          <dd class="text-2xl font-bold tabular-nums">{nodeCount(frame.rec.a, frame.rec.k)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.total}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.fmt(frame.total)}</dd>
        </div>
      </dl>
      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <h2 class="mb-1 text-xs text-slate-500">{m.verdictTitle}</h2>
        <p class="font-semibold text-slate-900">
          {frame.verdict === null ? m.verdictPending : m.verdictLine(frame.rec, frame.verdict)}
        </p>
      </section>
      <section class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.barsTitle}</h2>
        {#if frame.levels.length === 0}
          <p class="text-sm text-slate-500">{m.barsEmpty}</p>
        {:else}
          <ol class="space-y-1.5 text-xs tabular-nums">
            {#each frame.levels as row (row.depth)}
              {@const state = levelState(frame, row.depth)}
              {@const label = m.barLevel(row.depth, row.depth === frame.rec.k)}
              <li class="grid grid-cols-[4.5rem_1fr_4rem] items-center gap-2">
                <span class="text-slate-600">{label}</span>
                <span class="h-3 rounded-sm bg-slate-100" aria-hidden="true">
                  <span
                    class="block h-3 rounded-sm border border-slate-700 {STATE_BG[state] ||
                      'bg-slate-400'}"
                    style="width: {Math.max(2, (row.cost / maxCost) * 100)}%"
                  ></span>
                </span>
                <span class="text-right text-slate-800"
                  ><span aria-hidden="true">{m.markers[state] ?? ''}</span>
                  {m.fmt(row.cost)}{#if m.states[state]}<span class="sr-only"
                      >, {m.states[state]}</span
                    >{/if}</span
                >
              </li>
            {/each}
          </ol>
          <p class="mt-2 flex justify-between border-t border-slate-200 pt-1 text-xs font-semibold">
            <span>{m.totalRow}</span><span class="tabular-nums">{m.fmt(frame.total)}</span>
          </p>
        {/if}
      </section>
      <CodePanel lines={masterPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
