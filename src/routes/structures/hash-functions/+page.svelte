<script>
  import BarChart from '$lib/components/bar-chart.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import {
    MAX_KEYS,
    P,
    drawAB,
    expectedPairs,
    hashFnPseudocode,
    hashFnTrace,
    makeKeys,
  } from '$lib/algo-engine/hash-functions.js';
  import { en as m } from '$lib/lessons/hash-functions/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/hash-functions.js').FixedHash} FixedHash */
  /** @typedef {import('$lib/algo-engine/hash-functions.js').KeySet} KeySet */

  const FNS = /** @type {FixedHash[]} */ (['mod', 'multiply']);
  const SETS = /** @type {KeySet[]} */ (['attack', 'sequential', 'random']);

  // Fixed first keys and a fixed first draw keep the prerendered HTML and the hydrated page identical.
  let fn = $state(/** @type {FixedHash} */ ('mod'));
  let keySet = $state(/** @type {KeySet} */ ('attack'));
  let count = $state(32);
  const INITIAL_KEYS = makeKeys('attack', 32, 'mod');
  let keys = $state.raw(INITIAL_KEYS);
  let a = $state(389);
  let b = $state(120);
  /** @type {number | null} */
  let aDraft = $state(389);
  /** @type {number | null} */
  let bDraft = $state(120);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(hashFnTrace(INITIAL_KEYS, 'mod', 389, 120));
  const frame = $derived(player.frame);
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, fn, a, b),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(hashFnTrace(keys, fn, a, b));
  }

  function newKeys() {
    keys = makeKeys(keySet, count, fn);
    rebuild();
  }

  function changeFn() {
    // An attack targets one fixed hash, so it is rebuilt against the new one.
    if (keySet === 'attack') keys = makeKeys('attack', count, fn);
    rebuild();
  }

  function commitAB() {
    const okA = typeof aDraft === 'number' && Number.isInteger(aDraft) && aDraft >= 1 && aDraft < P;
    const okB = typeof bDraft === 'number' && Number.isInteger(bDraft) && bDraft >= 0 && bDraft < P;
    if (!okA || !okB) {
      aDraft = a;
      bDraft = b;
      say(m.abError);
      return;
    }
    a = /** @type {number} */ (aDraft);
    b = /** @type {number} */ (bDraft);
    rebuild();
  }

  function draw() {
    const drawn = drawAB();
    a = aDraft = drawn.a;
    b = bDraft = drawn.b;
    rebuild();
  }

  const n = $derived(frame.n);
  const hot = $derived(frame.kind === 'count');

  /** @param {number[]} counts */
  const toItems = (counts) => counts.map((value, id) => ({ id, value }));

  /** @param {number} target @returns {(i: number) => string} */
  const barClass = (target) => (i) => (hot && i === target ? 'bg-state-active' : 'bg-slate-400');
  /** @param {number} target @returns {(i: number) => string} */
  const barMark = (target) => (i) => (hot && i === target ? m.marks.active : '');

  const sides = $derived([
    {
      id: 'left',
      title: m.leftTitle(fn),
      counts: frame.left,
      target: frame.lb,
      pairs: frame.leftPairs,
    },
    {
      id: 'right',
      title: m.rightTitle(a, b),
      counts: frame.right,
      target: frame.rb,
      pairs: frame.rightPairs,
    },
  ]);

  const stats = $derived([
    [m.stats.leftMax, String(Math.max(...frame.left)), 'left-max'],
    [m.stats.rightMax, String(Math.max(...frame.right)), 'right-max'],
    [m.stats.leftEmpty, String(frame.left.filter((c) => c === 0).length), 'left-empty'],
    [m.stats.rightEmpty, String(frame.right.filter((c) => c === 0).length), 'right-empty'],
  ]);

  const chips = $derived(
    keys.map((k, i) => ({
      label: String(k),
      hot: frame.kind !== 'start' && frame.kind !== 'done' && i === frame.n - (hot ? 1 : 0),
    })),
  );

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.fixedLabel}
      name="fixed"
      options={FNS.map((v) => ({ value: v, label: m.fixedOptions[v] }))}
      bind:value={fn}
      onchange={changeFn}
    />
    <label class={labelClass}>
      {m.keysLabel}
      <select name="keys" class="field" bind:value={keySet} onchange={newKeys}>
        {#each SETS as s (s)}
          <option value={s}>{m.keySets[s]}</option>
        {/each}
      </select>
    </label>
    <label class={labelClass}>
      {m.countLabel}: {count}
      <input
        type="range"
        name="count"
        min="2"
        max={MAX_KEYS}
        bind:value={count}
        onchange={newKeys}
        class="focus-ring rounded accent-teal-700"
      />
    </label>
    {#if keySet === 'random'}
      <button type="button" class="btn-secondary" onclick={newKeys}>{m.newKeys}</button>
    {/if}
    <form
      class="flex flex-wrap items-end gap-2 border-l border-slate-300 pl-4"
      onsubmit={(e) => {
        e.preventDefault();
        commitAB();
      }}
    >
      <label class={labelClass}>
        {m.aLabel}
        <input
          type="number"
          name="a"
          min="1"
          max={P - 1}
          class="field w-24"
          bind:value={aDraft}
          onchange={commitAB}
        />
      </label>
      <label class={labelClass}>
        {m.bLabel}
        <input
          type="number"
          name="b"
          min="0"
          max={P - 1}
          class="field w-24"
          bind:value={bDraft}
          onchange={commitAB}
        />
      </label>
      <button type="button" class="btn-outline" onclick={draw}>{m.drawButton}</button>
    </form>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        {#each sides as side (side.id)}
          <div class="min-w-0">
            <h2 class="mb-2 font-mono text-xs text-slate-700">{side.title}</h2>
            <BarChart
              items={toItems(side.counts)}
              stateOf={barClass(side.target)}
              markerOf={barMark(side.target)}
              ariaLabel={m.histogramAria(side.title, side.counts)}
              speed={player.speed}
            />
            <p class="mt-1 text-xs text-slate-500">{m.bucketAxis}</p>
            <p
              class="mt-1 text-sm font-semibold text-slate-800 tabular-nums"
              data-testid="{side.id}-pairs"
            >
              {m.pairsLine(side.pairs)}
            </p>
          </div>
        {/each}
        <p class="text-sm text-slate-700 sm:col-span-2" data-testid="expected">
          {m.expectedLine(n, expectedPairs(n))}
        </p>
        <ul class="flex flex-wrap gap-4 text-xs text-slate-600 sm:col-span-2">
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm bg-state-active"
            ></span>{`${m.marks.active} ${m.legend.active}`}
          </li>
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
        {#each stats as [label, value, id] (id)}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <ChipList
        title={m.keysTitle}
        items={chips}
        emptyText=""
        limit={MAX_KEYS}
        hotLabel={m.keysHot}
      />
      <CodePanel lines={hashFnPseudocode[fn]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
