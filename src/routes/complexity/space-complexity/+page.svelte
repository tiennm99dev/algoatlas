<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    SPACE_ALGOS,
    peakWords,
    spacePseudocode,
    spaceTrace,
  } from '$lib/algo-engine/space-complexity.js';
  import { en as m } from '$lib/lessons/space-complexity/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/space-complexity.js').SpaceAlgo} SpaceAlgo */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_N = 5;
  let algo = $state(/** @type {SpaceAlgo} */ ('sum-rec'));
  let n = $state(INITIAL_N);
  /** @type {number | null} */
  let draft = $state(INITIAL_N);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(spaceTrace('sum-rec', INITIAL_N));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(spaceTrace(algo, n));
  }

  function commitN() {
    if (typeof draft === 'number' && Number.isInteger(draft) && draft >= 1 && draft <= MAX_N) {
      n = draft;
      rebuild();
    } else {
      draft = n;
      notice = { text: m.nError, at: player.index };
    }
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function pickAlgo(e) {
    algo = /** @type {SpaceAlgo} */ (e.currentTarget.value);
    rebuild();
  }

  // One scale for all five programs, so switching program compares bar lengths fairly.
  const scale = $derived(Math.max(...SPACE_ALGOS.map((a) => peakWords(a, n))));
  /** @param {number} words */
  const pct = (words) => `${(words / scale) * 100}%`;

  const segments = $derived([
    ...frame.stack.map((f, k) => ({
      key: `f${k}`,
      words: f.words,
      label: m.frameChip(f.fn, f.arg, f.words),
      cls: k === frame.stack.length - 1 ? STATE_BG.active : STATE_BG.visited,
      dark: k === frame.stack.length - 1,
    })),
    ...(frame.heapWords > 0
      ? [
          {
            key: 'heap',
            words: frame.heapWords,
            label: m.heapChip(frame.heapWords),
            cls: STATE_BG.frontier,
            dark: false,
          },
        ]
      : []),
  ]);

  const stackItems = $derived(
    frame.stack.map((f, k) => {
      const top = k === frame.stack.length - 1;
      return {
        label: m.frameName(f.fn, f.arg),
        state: /** @type {VisualState} */ (top ? 'active' : 'visited'),
        marker: top ? '▶' : '',
      };
    }),
  );

  /** @param {number} k @returns {VisualState} */
  function inputState(k) {
    if (frame.kind === 'swap' && (k === frame.i || k === frame.j)) return 'swap';
    if (frame.algo === 'reverse-copy' && frame.kind === 'step' && k === frame.i) return 'compare';
    return '';
  }
  /** @param {number} k @returns {VisualState} */
  function copyState(k) {
    if (frame.kind === 'step' && k === frame.n - 1 - frame.i) return 'swap';
    return frame.copy?.[k] === null ? '' : 'sorted';
  }

  /** @type {Record<string, string>} */
  const ARRAY_MARKERS = { swap: '↔', compare: 'R', sorted: '✓' };
  /** @type {('compare' | 'swap' | 'sorted')[]} */
  const ARRAY_LEGEND = ['compare', 'swap', 'sorted'];
  /** @param {number} k */
  const inputMarker = (k) => ARRAY_MARKERS[inputState(k)] ?? '';
  /** @param {number} k */
  const copyMarker = (k) => ARRAY_MARKERS[copyState(k)] ?? '';

  const inputPointers = $derived(
    [
      frame.i >= 0 ? { name: m.pointerI, index: frame.i } : null,
      frame.j >= 0 ? { name: m.pointerJ, index: frame.j } : null,
    ].filter((p) => p !== null),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitN();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.algoLabel}
      <select name="algo" class="field" value={algo} onchange={pickAlgo}>
        {#each SPACE_ALGOS as a (a)}
          <option value={a}>{m.algos[a]}</option>
        {/each}
      </select>
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.nLabel}
      <input
        type="number"
        name="n"
        min="1"
        max={MAX_N}
        step="1"
        class="field w-24"
        bind:value={draft}
        onchange={commitN}
      />
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.memoryTitle}
        </h2>
        <div
          class="relative h-10 w-full rounded-md border border-slate-300 bg-slate-50"
          role="img"
          aria-label={m.memoryLabel(frame.words, scale)}
        >
          <div class="flex h-full overflow-hidden rounded-md">
            {#each segments as s (s.key)}
              <div
                class="flex h-full shrink-0 items-center justify-center overflow-hidden border-r border-white text-[10px] font-semibold whitespace-nowrap {s.cls} {s.dark
                  ? 'text-white'
                  : 'text-slate-900'} {player.speed < 8 ? 'transition-all' : ''}"
                style="width: {pct(s.words)}"
                title={s.label}
              >
                {s.words}
              </div>
            {/each}
          </div>
          <div
            class="absolute -top-1 -bottom-1 w-0.5 bg-slate-900"
            style="left: calc({pct(frame.peak)} - 1px)"
            aria-hidden="true"
          ></div>
        </div>
        <div class="mt-1 flex justify-between text-xs text-slate-500 tabular-nums">
          <span>0</span><span>{scale}</span>
        </div>
        <ul class="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.visited}"></span>
            {m.legend.frame}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.active}"></span>
            ▶ {m.legend.top}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-700 {STATE_BG.frontier}"></span>
            B {m.legend.heap}
          </li>
          <li class="flex items-center gap-1.5">
            <span class="h-3 w-0.5 bg-slate-900"></span>
            {m.legend.peak}
          </li>
        </ul>

        <div class="mt-4 flex flex-wrap items-start gap-6">
          <div>
            <h3 class="mb-1 text-xs text-slate-500">{m.stackTitle}</h3>
            <StackQueueView
              kind="stack"
              items={stackItems}
              ariaLabel={m.stackAria}
              capacity={finalFrame.maxDepth}
              speed={player.speed}
            />
          </div>
          {#if frame.input}
            <div class="flex min-w-0 flex-1 flex-col gap-3">
              <div>
                <h3 class="mb-1 text-xs text-slate-500">{m.arrayA}</h3>
                <ArrayStrip
                  values={frame.input}
                  ariaLabel={m.arrayA}
                  stateOf={inputState}
                  markerOf={inputMarker}
                  pointers={inputPointers}
                  speed={player.speed}
                />
              </div>
              {#if frame.copy}
                <div>
                  <h3 class="mb-1 text-xs text-slate-500">{m.arrayB}</h3>
                  <ArrayStrip
                    values={frame.copy.map((v) => (v === null ? '·' : v))}
                    ariaLabel={m.arrayB}
                    stateOf={copyState}
                    markerOf={copyMarker}
                    speed={player.speed}
                  />
                </div>
              {/if}
            </div>
          {/if}
        </div>
        {#if frame.input}
          <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            {#each ARRAY_LEGEND as st (st)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>
                {ARRAY_MARKERS[st]}
                {m.arrayLegend[st]}
              </li>
            {/each}
          </ul>
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.words}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.words}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.peak}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.peak}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.depth}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.stack.length}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.maxDepth}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.maxDepth}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <h2 class="mb-1 text-xs text-slate-500">{m.classTitle}</h2>
        <p class="font-semibold">{m.classes[algo]}</p>
        <p class="mt-1 tabular-nums">{m.peakFormula(algo, n, peakWords(algo, n))}</p>
      </div>
      <CodePanel lines={spacePseudocode[algo]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
