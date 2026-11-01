<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    LIS_EXAMPLE,
    MAX_ABS,
    MAX_N,
    lisPseudocode,
    lisTrace,
    parseLisValues,
  } from '$lib/algo-engine/longest-increasing-subsequence.js';
  import { en as m } from '$lib/lessons/longest-increasing-subsequence/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/longest-increasing-subsequence.js').LisMethod} LisMethod */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'current'|'compare'|'extend'|'lis'|''} Role */

  const METHODS = /** @type {LisMethod[]} */ (['dp', 'patience']);
  /** @param {number[]} v */
  const format = (v) => v.map((x) => String(x).replace('-', '−')).join(', ');
  /** @param {number} x */
  const num = (x) => String(x).replace('-', '−');

  let method = $state(/** @type {LisMethod} */ ('dp'));
  let values = $state.raw(LIS_EXAMPLE);
  let valuesText = $state(format(LIS_EXAMPLE));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(lisTrace('dp', LIS_EXAMPLE));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const errors = m.valueErrors(MAX_N, MAX_ABS);

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(lisTrace(method, values));
  }

  function loadExample() {
    values = LIS_EXAMPLE;
    valuesText = format(values);
    rebuild();
  }

  function commitValues() {
    const parsed = parseLisValues(valuesText);
    if ('error' in parsed) {
      valuesText = format(values);
      notice = { text: errors[parsed.error], at: player.index };
      return;
    }
    values = parsed.values;
    valuesText = format(values);
    rebuild();
  }

  const lisSet = $derived(new Set(frame.lis));

  /** @param {number} k @returns {Role} */
  function roleOf(k) {
    if (lisSet.has(k)) return 'lis';
    if (k === frame.i) return 'current';
    if (k === frame.j) return frame.kind === 'extend' ? 'extend' : 'compare';
    if (frame.kind === 'probe' && k === frame.piles[frame.mid]?.at(-1)) return 'compare';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    current: 'active',
    compare: 'compare',
    extend: 'swap',
    lis: 'path',
    '': '',
  };
  /** @type {Record<Role, string>} */
  const ROLE_TEXT = {
    current: 'text-white',
    compare: 'text-slate-900',
    extend: 'text-white',
    lis: 'text-slate-900',
    '': 'text-slate-900',
  };

  /** @param {Role} role */
  const roleName = (role) => (role ? m.states[role] : '');

  const pointers = $derived.by(() => {
    /** @type {{name: string, index: number}[]} */
    const list = [];
    if (frame.i >= 0 && frame.kind !== 'done') list.push({ name: m.pointers.i, index: frame.i });
    if (frame.j >= 0) list.push({ name: m.pointers.j, index: frame.j });
    return list;
  });

  // O(n²) DP table: L and prev under each index.
  const tableValues = $derived([
    frame.L.map((x) => (x === null ? null : x)),
    frame.L.map((x, k) => (x === null ? null : frame.prev[k] < 0 ? m.noPrev : frame.prev[k])),
  ]);

  // Patience sorting: the pile tops and the binary search over them.
  const tops = $derived(frame.piles.map((p) => /** @type {number} */ (p.at(-1))));
  const searching = $derived(frame.kind === 'probe');
  const topPointers = $derived.by(() => {
    if (!searching) return [];
    return [
      { name: m.pointers.lo, index: frame.lo },
      { name: m.pointers.hi, index: frame.hi },
      { name: m.pointers.mid, index: frame.mid },
    ];
  });

  /** @param {number} p */
  function pileState(p) {
    if (searching && p === frame.mid) return m.pileStates.probe;
    if ((frame.kind === 'place' || frame.kind === 'newpile') && p === frame.pile)
      return m.pileStates.placed;
    return '';
  }

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.current} ${m.legend.current}`],
    ['compare', `${m.markers.compare} ${m.legend.compare}`],
    ['swap', `${m.markers.extend} ${m.legend.extend}`],
    ['path', `${m.markers.lis} ${m.legend.lis}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <SegmentedControl
      legend={m.methodLabel}
      name="method"
      options={METHODS.map((v) => ({ value: v, label: m.methods[v] }))}
      bind:value={method}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-80 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <button type="button" class="btn-outline" onclick={loadExample}>{m.exampleButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.sequenceTitle}
        </h2>
        <ArrayStrip
          values={frame.values.map(num)}
          ariaLabel={m.sequenceAria(frame.values)}
          stateOf={(k) => ROLE_STATE[roleOf(k)]}
          markerOf={(k) => {
            const r = roleOf(k);
            return r ? m.markers[r] : '';
          }}
          labelOf={(k) => m.valueLabel(k, frame.values[k], roleName(roleOf(k)))}
          {pointers}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
        </ul>
      </div>

      {#if frame.method === 'dp'}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.tableTitle}
          </h2>
          <DpTable
            values={tableValues}
            ariaLabel={m.tableAria}
            rowHeaders={m.rowHeaders}
            colHeaders={frame.values.map((_, k) => String(k))}
            stateOf={(_, c) => ROLE_STATE[roleOf(c)]}
            markerOf={(r, c) => {
              const role = roleOf(c);
              return r === 0 && role ? m.markers[role] : '';
            }}
            labelOf={(_, c) => m.tableCell(c, frame.L[c], frame.prev[c], roleName(roleOf(c)))}
            speed={player.speed}
          />
        </div>
      {:else}
        <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4" data-testid="piles">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.pilesTitle}
          </h2>
          {#if frame.piles.length}
            <ol class="flex items-end gap-2 overflow-x-auto pb-1">
              {#each frame.piles as pile, p (p)}
                {@const st = pileState(p)}
                <li
                  class="flex min-w-12 flex-col items-center gap-1 rounded-lg border-2 p-1 {st
                    ? 'border-teal-700'
                    : 'border-transparent'}"
                  aria-label={m.pileAria(
                    p,
                    pile.map((k) => frame.values[k]),
                    st,
                  )}
                >
                  <ol class="flex flex-col-reverse gap-1" aria-hidden="true">
                    {#each pile as k (k)}
                      {@const role = roleOf(k)}
                      <li
                        class="w-11 rounded border border-slate-700 py-1 text-center font-mono text-sm font-semibold tabular-nums {STATE_BG[
                          ROLE_STATE[role]
                        ]} {ROLE_TEXT[role]}"
                      >
                        {num(frame.values[k])}{role ? ` ${m.markers[role]}` : ''}
                      </li>
                    {/each}
                  </ol>
                  <span class="text-xs text-slate-600" aria-hidden="true">{m.pileName(p)}</span>
                </li>
              {/each}
            </ol>
          {:else}
            <p class="text-sm text-slate-600">{m.pilesEmpty}</p>
          {/if}
          <h3 class="mt-4 mb-2 text-xs text-slate-500">{m.topsTitle}</h3>
          {#if tops.length}
            <ArrayStrip
              values={tops.map((k) => num(frame.values[k]))}
              ariaLabel={m.topsAria}
              stateOf={(p) => (searching && p === frame.mid ? 'compare' : '')}
              markerOf={(p) => (searching && p === frame.mid ? m.markers.compare : '')}
              pointers={topPointers}
              windows={searching ? [{ from: frame.lo, to: frame.hi, label: '' }] : []}
              speed={player.speed}
            />
          {:else}
            <p class="text-sm text-slate-600">{m.topsEmpty}</p>
          {/if}
        </div>
      {/if}

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
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="comparisons">
            {frame.comparisons}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.length}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="length">{frame.length}</dd>
        </div>
      </dl>
      <ChipList
        title={m.lisTitle}
        emptyText={m.lisEmpty}
        items={frame.lis.map((k) => ({ label: num(frame.values[k]) }))}
      />
      <CodePanel lines={lisPseudocode[frame.method]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
