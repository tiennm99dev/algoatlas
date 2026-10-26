<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { heapForest } from '$lib/components/tree-layout.js';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_K,
    formatLists,
    makeLists,
    makeStream,
    mergePseudocode,
    mergeTrace,
    parseLists,
    parseStream,
    topKPseudocode,
    topKTrace,
  } from '$lib/algo-engine/priority-queue-applications.js';
  import { en as m } from '$lib/lessons/priority-queue-applications/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/priority-queue-applications.js').MergeFrame} MergeFrame */
  /** @typedef {import('$lib/algo-engine/priority-queue-applications.js').TopKFrame} TopKFrame */
  /** @typedef {import('$lib/algo-engine/priority-queue-applications.js').PqProblem} PqProblem */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PROBLEM_OPTIONS = /** @type {PqProblem[]} */ (['merge', 'top-k']).map((value) => ({
    value,
    label: m.problems[value],
  }));

  // Fixed first inputs keep the prerendered HTML and the hydrated page identical.
  const INITIAL_LISTS = [
    [1, 4, 9],
    [2, 3, 8],
    [5, 6, 7],
  ];
  const INITIAL_STREAM = [5, 1, 9, 3, 7, 2, 8, 6];

  let problem = $state(/** @type {PqProblem} */ ('merge'));
  let lists = $state.raw(INITIAL_LISTS);
  let listsText = $state(formatLists(INITIAL_LISTS));
  let stream = $state.raw(INITIAL_STREAM);
  let streamText = $state(INITIAL_STREAM.join(', '));
  let k = $state(3);
  /** @type {number | null} */
  let kDraft = $state(3);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(
    /** @type {(MergeFrame | TopKFrame)[]} */ (mergeTrace(INITIAL_LISTS)),
  );
  const frame = $derived(player.frame);
  const mf = $derived('heads' in frame ? frame : null);
  const tf = $derived('heads' in frame ? null : /** @type {TopKFrame} */ (frame));
  const narration = $derived(
    notice.at === player.index
      ? notice.text
      : mf
        ? m.describeMerge(mf, lists)
        : m.describeTopK(/** @type {TopKFrame} */ (tf), k),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(problem === 'merge' ? mergeTrace(lists) : topKTrace(stream, k));
  }

  function commitLists() {
    const r = parseLists(listsText);
    if ('error' in r) {
      listsText = formatLists(lists);
      say(m.listErrors[r.error]);
      return;
    }
    lists = r.lists;
    listsText = formatLists(r.lists);
    rebuild();
  }

  function commitStream() {
    const r = parseStream(streamText);
    if ('error' in r) {
      streamText = stream.join(', ');
      say(m.streamErrors[r.error]);
      return;
    }
    stream = r.values;
    streamText = r.values.join(', ');
    rebuild();
  }

  function commitK() {
    if (typeof kDraft !== 'number' || !Number.isInteger(kDraft) || kDraft < 1 || kDraft > MAX_K) {
      kDraft = k;
      say(m.kError);
      return;
    }
    k = kDraft;
    rebuild();
  }

  function commitAll() {
    if (problem === 'merge') commitLists();
    else commitStream();
  }

  function newInput() {
    if (problem === 'merge') {
      lists = makeLists(Math.random);
      listsText = formatLists(lists);
    } else {
      stream = makeStream(Math.random);
      streamText = stream.join(', ');
    }
    rebuild();
    say(m.newInputNotice);
  }

  /** How many values of each list are already in the output. */
  const outCount = $derived(
    mf ? lists.map((_, j) => mf.out.filter((e) => e.list === j).length) : [],
  );

  /** @param {number} j @param {number} i @returns {VisualState} */
  function listState(j, i) {
    if (!mf) return '';
    const justRead = (mf.kind === 'seed' || mf.kind === 'push') && mf.list === j;
    if (justRead && i === mf.heads[j] - 1) return 'active';
    if (i < outCount[j]) return 'visited';
    if (i < mf.heads[j]) return 'frontier';
    return '';
  }

  /** @param {VisualState} s */
  const marker = (s) => (s ? (m.markers[/** @type {keyof typeof m.markers} */ (s)] ?? '') : '');

  /** @param {VisualState} s */
  const stateName = (s) => (s ? (m.states[/** @type {keyof typeof m.states} */ (s)] ?? '') : '');

  /** @param {number} i @returns {VisualState} */
  function heapState(i) {
    const slot = mf ? mf.slot : (tf?.slot ?? -1);
    if (i === slot) return 'active';
    if (tf && i === 0 && tf.heap.length === k) return 'compare';
    return '';
  }

  const heapLabels = $derived(
    mf ? mf.heap.map((e) => String(e.value)) : (tf?.heap ?? []).map(String),
  );
  const forest = $derived(
    heapForest(heapLabels, heapLabels.length, (i) => ({
      state: heapState(i),
      marker: marker(heapState(i)),
      note: mf ? m.listName(mf.heap[i].list) : `[${i}]`,
    })),
  );
  /** @param {number} i */
  function heapSlotLabel(i) {
    const label = mf ? m.entryLabel(mf.heap[i].value, mf.heap[i].list) : heapLabels[i];
    const s = heapState(i);
    return m.slotLabel(i, label, stateName(s));
  }

  const outValues = $derived(mf ? mf.out.map((e) => e.value) : []);
  /** @param {number} i @returns {VisualState} */
  const outState = (i) => (mf?.kind === 'pop' && i === outValues.length - 1 ? 'active' : 'sorted');

  /** @param {number} i @returns {VisualState} */
  function streamState(i) {
    if (!tf || tf.kind === 'start') return '';
    if (i === tf.index) return 'active';
    if (tf.kind === 'done' || i < tf.index) return 'visited';
    return '';
  }

  const nValues = $derived(problem === 'merge' ? lists.flat().length : stream.length);
  const kValue = $derived(problem === 'merge' ? lists.length : k);
  const legend = $derived(
    /** @type {[VisualState, string][]} */ (
      Object.entries(problem === 'merge' ? m.legendMerge : m.legendTopK)
    ),
  );
  const result = $derived(
    tf
      ? tf.heap
          .slice()
          .sort((x, y) => y - x)
          .map((x) => ({ label: String(x) }))
      : [],
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitAll();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEM_OPTIONS}
      bind:value={problem}
      onchange={rebuild}
    />
    {#if problem === 'merge'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.listsLabel}
        <input
          type="text"
          name="lists"
          class="field w-80 max-w-full"
          bind:value={listsText}
          onchange={commitLists}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.streamLabel}
        <input
          type="text"
          name="stream"
          class="field w-80 max-w-full"
          bind:value={streamText}
          onchange={commitStream}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.kLabel}
        <input
          type="number"
          name="k"
          min="1"
          max={MAX_K}
          step="1"
          class="field w-20"
          bind:value={kDraft}
          onchange={commitK}
        />
      </label>
    {/if}
    <button type="button" class="btn-secondary" onclick={newInput}>{m.newInputButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {#if mf}
          <section>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.listsTitle}
            </h2>
            <div class="flex flex-col gap-2">
              {#each lists as list, j (j)}
                <div class="flex items-center gap-2">
                  <span class="w-5 shrink-0 font-mono font-bold text-slate-700" aria-hidden="true"
                    >{m.listName(j)}</span
                  >
                  <div class="min-w-0 flex-1">
                    <ArrayStrip
                      values={list}
                      ariaLabel={m.listAria(j, list)}
                      stateOf={(i) => listState(j, i)}
                      markerOf={(i) => marker(listState(j, i))}
                      labelOf={(i) => {
                        const s = listState(j, i);
                        return m.cellLabel(i, list[i], stateName(s));
                      }}
                      dimmed={(i) => i < outCount[j]}
                      pointers={[{ name: m.nextPointer, index: mf.heads[j] }]}
                      speed={player.speed}
                    />
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {:else if tf}
          <section>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.streamTitle}
            </h2>
            <ArrayStrip
              values={stream}
              ariaLabel={m.streamAria(stream)}
              stateOf={streamState}
              markerOf={(i) => marker(streamState(i))}
              pointers={tf.index >= 0 ? [{ name: 'x', index: tf.index }] : []}
              speed={player.speed}
            />
          </section>
        {/if}

        <section>
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.heapTitle}
          </h2>
          <TreeView
            roots={forest}
            binary
            ariaLabel={m.heapAria(heapLabels)}
            labelOf={(node) => heapSlotLabel(Number(node.id))}
            emptyText={m.heapAria([])}
            speed={player.speed}
          />
        </section>

        {#if mf}
          <section>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.outTitle}
            </h2>
            {#if outValues.length > 0}
              <ArrayStrip
                values={outValues}
                ariaLabel={m.outAria(outValues)}
                stateOf={outState}
                markerOf={(i) =>
                  outState(i) === 'active' ? m.markers.active : m.listName(mf.out[i].list)}
                labelOf={(i) =>
                  m.outCellLabel(i, outValues[i], mf.out[i].list, stateName(outState(i)))}
                speed={player.speed}
              />
            {:else}
              <p class="text-sm text-slate-500">{m.outAria([])}</p>
            {/if}
          </section>
        {/if}

        <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {problem === 'merge' && s === 'sorted' ? m.outMarker : marker(s)}
              {label}
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
          <dd class="text-2xl font-bold tabular-nums">{nValues}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{problem === 'merge' ? m.stats.k : m.stats.kTop}</dt>
          <dd class="text-2xl font-bold tabular-nums">{kValue}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.heapOps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.heapOps}</dd>
        </div>
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bound(nValues, kValue)}</dt>
          <dd class="text-2xl font-bold text-slate-500 tabular-nums">
            {Math.round(nValues * Math.log2(Math.max(1, kValue)))}
          </dd>
        </div>
      </dl>
      {#if tf}
        <ChipList title={m.resultTitle} items={result} emptyText={m.resultEmpty} />
      {/if}
      <CodePanel lines={mf ? mergePseudocode : topKPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
