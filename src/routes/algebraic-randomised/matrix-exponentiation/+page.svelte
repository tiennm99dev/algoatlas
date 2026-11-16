<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MATRIX_PRESETS,
    MAX_EXACT_N,
    MAX_MODULUS,
    MAX_N,
    MIN_MODULUS,
    RECURRENCES,
    matrixPowPseudocode,
    matrixPowTrace,
  } from '$lib/algo-engine/matrix-exponentiation.js';
  import { en as m } from '$lib/lessons/matrix-exponentiation/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof MATRIX_PRESETS} Preset */
  /** @typedef {keyof typeof RECURRENCES} RecName */
  /** @typedef {keyof typeof m.bitStates} BitRole */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(MATRIX_PRESETS));
  const REC_KEYS = /** @type {RecName[]} */ (Object.keys(RECURRENCES));
  /** @type {Record<BitRole, VisualState>} */
  const BIT_STATE = { current: 'active', used: 'sorted', skipped: 'pruned', waiting: '' };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
  const MODES = [
    { value: 'exact', label: m.arithmetic.exact },
    { value: 'mod', label: m.arithmetic.mod },
  ];

  const INITIAL = MATRIX_PRESETS.fib10;
  let preset = $state(/** @type {Preset | ''} */ ('fib10'));
  let rec = $state(/** @type {RecName} */ (INITIAL.rec));
  let mode = $state('exact');
  let n = $state(INITIAL.n);
  let mod = $state(1_000_000_007);
  let nDraft = $state(/** @type {number | null} */ (INITIAL.n));
  let modDraft = $state(/** @type {number | null} */ (1_000_000_007));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(matrixPowTrace(RECURRENCES[INITIAL.rec], INITIAL.n, null));
  const frame = $derived(player.frame);
  const letter = $derived(m.letters[rec]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, letter));
  const nMax = $derived(mode === 'exact' ? MAX_EXACT_N : MAX_N);

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(matrixPowTrace(RECURRENCES[rec], n, mode === 'exact' ? null : mod));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitN() {
    if (!wholeInRange(nDraft, 0, nMax)) {
      nDraft = n;
      say(m.nError(nMax));
      return;
    }
    if (nDraft === n) return;
    n = /** @type {number} */ (nDraft);
    preset = '';
    rebuild();
  }

  function commitM() {
    if (!wholeInRange(modDraft, MIN_MODULUS, MAX_MODULUS)) {
      modDraft = mod;
      say(m.mError(MIN_MODULUS, MAX_MODULUS));
      return;
    }
    if (modDraft === mod) return;
    mod = /** @type {number} */ (modDraft);
    preset = '';
    rebuild();
  }

  function changeMode() {
    preset = '';
    const clamp = mode === 'exact' && n > MAX_EXACT_N;
    if (clamp) n = nDraft = MAX_EXACT_N;
    rebuild();
    if (clamp) say(m.exactClamped(MAX_EXACT_N));
  }

  function changeRec() {
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    const chosen = MATRIX_PRESETS[p];
    preset = p;
    rec = chosen.rec;
    n = nDraft = chosen.n;
    mode = chosen.mod === null ? 'exact' : 'mod';
    if (chosen.mod !== null) mod = modDraft = chosen.mod;
    rebuild();
  }

  const width = $derived(frame.bits.length);
  // Strip cell i holds the bit with weight 2^(width − 1 − i), as n is written highest first.
  const weightOf = (/** @type {number} */ i) => width - 1 - i;

  /** @param {number} i @returns {BitRole} */
  function bitRole(i) {
    const weight = weightOf(i);
    if (frame.kind === 'bit' && weight === frame.k) return 'current';
    const read = frame.k === -1 && frame.kind === 'done' ? width : frame.k + 1;
    if (frame.n === 0 || weight >= read) return 'waiting';
    return frame.bits[i] === 1 ? 'used' : 'skipped';
  }

  const pointers = $derived(
    frame.kind === 'bit' ? [{ name: m.bitPointer, index: width - 1 - frame.k }] : [],
  );
</script>

{#snippet matrixBox(
  /** @type {string[][]} */ rows,
  /** @type {string} */ name,
  /** @type {string} */ testid,
)}
  <table
    class="border-x-2 border-slate-700 font-mono text-sm tabular-nums"
    aria-label={m.matrixAria(name, rows.length)}
    data-testid={testid}
  >
    <tbody>
      {#each rows as row, r (r)}
        <tr>
          {#each row as cell, c (c)}
            <td class="px-2 py-0.5 text-right whitespace-nowrap" title={m.entryTitle(cell)}
              >{m.entry(cell)}</td
            >
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.recurrence}
      <select name="recurrence" class="field" bind:value={rec} onchange={changeRec}>
        {#each REC_KEYS as key (key)}
          <option value={key}>{m.recurrences[key]}</option>
        {/each}
      </select>
    </label>
    <SegmentedControl
      legend={m.fields.arithmetic}
      name="arithmetic"
      options={MODES}
      bind:value={mode}
      onchange={changeMode}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.n}
      <input
        type="number"
        name="n"
        min="0"
        max={nMax}
        class="field w-44 tabular-nums"
        bind:value={nDraft}
        onchange={commitN}
      />
    </label>
    {#if mode === 'mod'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.m}
        <input
          type="number"
          name="m"
          min={MIN_MODULUS}
          max={MAX_MODULUS}
          class="field w-36 tabular-nums"
          bind:value={modDraft}
          onchange={commitM}
        />
      </label>
    {/if}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(ev) => loadPreset(/** @type {Preset} */ (ev.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.setupTitle}
        </h2>
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="font-semibold">{m.matrixM} =</span>
            {@render matrixBox(frame.matrix, m.matrixM, 'matrix-m')}
          </div>
          <div class="flex items-center gap-2">
            <span class="font-semibold">{m.vectorV0} =</span>
            {@render matrixBox(
              frame.start.map((x) => [x]),
              m.vectorV0,
              'vector-v0',
            )}
          </div>
        </div>
        <p class="mt-2 text-sm text-slate-600">{m.setupNote} {m.vectorHint(frame.size)}</p>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.bitsTitle}
        </h2>
        <ArrayStrip
          values={frame.bits}
          ariaLabel={m.bitsAria(frame.n)}
          stateOf={(i) => BIT_STATE[bitRole(i)]}
          markerOf={(i) => m.bitMarkers[bitRole(i)]}
          labelOf={(i) => m.bitLabel(weightOf(i), frame.bits[i], m.bitStates[bitRole(i)])}
          showIndices={false}
          {pointers}
          speed={player.speed}
        />
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[BIT_STATE[role]]}"
              ></span>{m.legend[role]}
            </li>
          {/each}
        </ul>
      </div>

      <div class="grid min-w-0 gap-4 sm:grid-cols-2">
        {#each [{ key: 'r', rows: frame.r, title: m.resultTitle(frame.covered), hot: frame.kind === 'multiply' }, { key: 'p', rows: frame.p, title: m.squareTitle(frame.power), hot: frame.kind === 'square' }] as box (box.key)}
          <div
            class="min-w-0 rounded-xl border bg-white p-4 {box.hot
              ? 'border-slate-900 ring-2 ring-state-active'
              : 'border-slate-200'}"
          >
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {box.title}
              {#if box.hot}<span class="ml-1 text-slate-900 normal-case">{m.changed}</span>{/if}
            </h2>
            <ScrollFrame>
              {@render matrixBox(box.rows, box.title, `matrix-${box.key}`)}
            </ScrollFrame>
          </div>
        {/each}
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
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.answerName(letter, frame.n)}</dt>
          <dd
            class="max-h-32 overflow-y-auto font-mono text-base font-bold break-all tabular-nums"
            data-testid="answer"
          >
            {frame.kind === 'done' ? frame.answer : m.answerPending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.products}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="products">
            {frame.matrixProducts}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.scalar}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="scalar">
            {frame.scalarProducts}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.loop}</dt>
          <dd class="text-xl font-bold break-all tabular-nums" data-testid="loop">
            {frame.n.toLocaleString('en-US')}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.digits}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="digits">{frame.digits}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.invariantTitle}</h2>
        <p
          class="font-mono text-sm font-semibold break-words text-slate-900"
          data-testid="invariant"
        >
          {m.invariant(frame)}
        </p>
      </div>
      <ChipList
        title={m.chipsTitle}
        items={frame.used.map((p) => ({ label: p.toLocaleString('en-US') }))}
        emptyText={m.chipsEmpty}
        limit={50}
      />
      <CodePanel lines={matrixPowPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
