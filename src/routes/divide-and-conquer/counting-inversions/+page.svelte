<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    MAX_VALUE,
    inversionPseudocode,
    inversionTrace,
    parseInversionValues,
  } from '$lib/algo-engine/counting-inversions.js';
  import { en as m } from '$lib/lessons/counting-inversions/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.presets} PresetKey */

  const SORTED = [4, 9, 15, 22, 28, 33, 41, 47, 56, 62, 70, 85];
  /** @type {Record<PresetKey, number[]>} */
  const PRESETS = {
    example: [3, 7, 1, 8, 5, 2, 6, 4],
    sorted: SORTED,
    reversed: SORTED.slice().reverse(),
    nearly: [4, 9, 22, 15, 28, 33, 41, 47, 56, 70, 62, 85],
    duplicates: [3, 1, 3, 2, 1, 2, 3, 1],
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));

  // A fixed first array keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.example;
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let preset = $state('example');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(inversionTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const n = $derived(frame.values.length);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {number[]} next */
  function load(next) {
    values = next;
    valuesText = next.join(', ');
    notice = { text: '', at: -1 };
    player.load(inversionTrace(next));
  }

  function commitValues() {
    const parsed = parseInversionValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.errors[parsed.error]);
      return;
    }
    if (parsed.values.join() === values.join()) return;
    preset = '';
    load(parsed.values);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    load(PRESETS[key]);
    say(m.newArrayNotice);
  }

  function randomArray() {
    const size = 8 + Math.floor(Math.random() * (MAX_N - 7));
    preset = '';
    load(Array.from({ length: size }, () => Math.floor(Math.random() * (MAX_VALUE + 1))));
    say(m.newArrayNotice);
  }

  const merging = $derived(frame.left.length > 0);
  const takeFrame = $derived(frame.kind === 'take-left' || frame.kind === 'take-right');

  /** @param {number} i @returns {'moved'|'written'|'sorted'|''} */
  function mainKind(i) {
    if (frame.kind === 'done') return 'sorted';
    if (takeFrame && i === frame.k) return 'moved';
    if (takeFrame && frame.range && i >= frame.range[0] && i < frame.k) return 'written';
    return '';
  }

  /** @param {number} i */
  function mainDimmed(i) {
    if (!frame.range) return false;
    if (i < frame.range[0] || i > frame.range[1]) return true;
    // While merging, slots after k still hold stale values until they are written.
    if (frame.kind === 'copy') return true;
    return takeFrame && i > frame.k;
  }

  /** @param {'left'|'right'} side @param {number} t @returns {'head'|'moved'|'jumped'|''} */
  function bufferKind(side, t) {
    const next = side === 'left' ? frame.i : frame.j;
    const justTaken =
      (side === 'left' && frame.kind === 'take-left') ||
      (side === 'right' && frame.kind === 'take-right');
    if (justTaken && t === next - 1) return 'moved';
    if (side === 'left' && frame.kind === 'take-right' && t >= frame.i) return 'jumped';
    if (t === next && frame.kind !== 'merged') return 'head';
    return '';
  }

  /** @type {Record<string, VisualState>} */
  const STATE = {
    head: 'compare',
    moved: 'swap',
    jumped: 'active',
    written: 'visited',
    sorted: 'sorted',
    '': '',
  };
  /** @type {Record<string, string>} */
  const MARK = m.markers;

  const pairChips = $derived(
    frame.pairs
      .slice()
      .reverse()
      .map(([big, small], t) => ({
        label: m.pairChip(big, small),
        hot: t < frame.gained,
      })),
  );
  const stackChips = $derived(
    frame.stack.map(([lo, hi], t) => ({
      label: m.rangeChip(lo, hi),
      hot: t === frame.stack.length - 1,
    })),
  );
  const windows = $derived(
    frame.range
      ? [
          { from: frame.range[0], to: frame.mid + 1, label: m.windowLeft },
          { from: frame.mid + 1, to: frame.range[1] + 1, label: m.windowRight },
        ]
      : [],
  );
  const legend = /** @type {const} */ (['head', 'moved', 'jumped', 'written', 'sorted']);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
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
    <label
      class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        inputmode="numeric"
        class="field w-full max-w-md font-mono"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomArray}>{m.shuffle}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          values={frame.values}
          ariaLabel={m.arrayAria(frame.values, frame.range)}
          stateOf={(i) => STATE[mainKind(i)]}
          markerOf={(i) => MARK[mainKind(i)] ?? ''}
          dimmed={mainDimmed}
          pointers={takeFrame ? [{ name: 'k', index: frame.k }] : []}
          {windows}
          speed={player.speed}
        />
        {#if merging}
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="min-w-0">
              <h2 class="mb-1 text-xs text-slate-500">{m.leftTitle}</h2>
              <ArrayStrip
                values={frame.left}
                ariaLabel={m.bufferAria('L', frame.left, frame.i)}
                stateOf={(t) => STATE[bufferKind('left', t)]}
                markerOf={(t) => MARK[bufferKind('left', t)] ?? ''}
                dimmed={(t) => t < frame.i && bufferKind('left', t) !== 'moved'}
                pointers={[{ name: 'i', index: frame.i }]}
                speed={player.speed}
              />
            </div>
            <div class="min-w-0">
              <h2 class="mb-1 text-xs text-slate-500">{m.rightTitle}</h2>
              <ArrayStrip
                values={frame.right}
                ariaLabel={m.bufferAria('R', frame.right, frame.j)}
                stateOf={(t) => STATE[bufferKind('right', t)]}
                markerOf={(t) => MARK[bufferKind('right', t)] ?? ''}
                dimmed={(t) => t < frame.j && bufferKind('right', t) !== 'moved'}
                pointers={[{ name: 'j', index: frame.j }]}
                speed={player.speed}
              />
            </div>
          </div>
        {:else}
          <p class="text-sm text-slate-500">{m.bufferIdle}</p>
        {/if}
        <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[STATE[s]]}"></span>
              {MARK[s]}
              {m.legend[s]}
            </li>
          {/each}
          <li class="flex items-center gap-1.5">
            <span class="size-3 rounded-sm border border-slate-300 bg-white opacity-40"></span>
            {m.legend.faded}
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.inversions}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.inversions}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.comparisons}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cross}</dt>
          <dd class="text-2xl font-bold tabular-nums">{m.crossStat(frame)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.brute}</dt>
          <dd class="text-2xl font-bold tabular-nums">{(n * (n - 1)) / 2}</dd>
        </div>
      </dl>
      <ChipList title={m.pairsTitle} items={pairChips} emptyText={m.pairsEmpty} limit={24} />
      <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      <CodePanel lines={inversionPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
