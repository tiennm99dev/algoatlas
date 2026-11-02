<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    SIEVE_PRESETS,
    crossingCount,
    sievePseudocode,
    sieveTrace,
  } from '$lib/algo-engine/sieve-factorisation.js';
  import { en as m } from '$lib/lessons/sieve-factorisation/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/sieve-factorisation.js').SieveStart} SieveStart */
  /** @typedef {keyof typeof SIEVE_PRESETS} Preset */
  /** @typedef {keyof typeof m.states} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(SIEVE_PRESETS));
  const COLUMNS = 10;
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    unit: 'pruned',
    current: 'compare',
    first: 'active',
    again: 'swap',
    crossed: 'pruned',
    prime: 'sorted',
    factor: 'path',
    pending: '',
  };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));

  const INITIAL = SIEVE_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let from = $state(/** @type {SieveStart} */ ('square'));
  let n = $state(INITIAL.n);
  let x = $state(INITIAL.x);
  let nDraft = $state(/** @type {number | null} */ (INITIAL.n));
  let xDraft = $state(/** @type {number | null} */ (INITIAL.x));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(sieveTrace(INITIAL.n, INITIAL.x, 'square'));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(sieveTrace(n, x, from));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  /** Rebuilds for a new x and jumps to its factorising, as the sieve itself has not changed. */
  function showFactorising() {
    rebuild();
    player.seek(player.frames.findIndex((f) => f.kind === 'factorStart'));
  }

  function commitN() {
    if (!wholeInRange(nDraft, 2, MAX_N)) {
      nDraft = n;
      say(m.nError(MAX_N));
      return;
    }
    if (nDraft === n) return;
    n = /** @type {number} */ (nDraft);
    x = xDraft = Math.min(x, n);
    preset = '';
    rebuild();
  }

  function commitX() {
    if (!wholeInRange(xDraft, 2, n)) {
      xDraft = x;
      say(m.xError(n));
      return;
    }
    if (xDraft === x) return;
    x = /** @type {number} */ (xDraft);
    preset = '';
    showFactorising();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    n = nDraft = SIEVE_PRESETS[p].n;
    x = xDraft = SIEVE_PRESETS[p].x;
    rebuild();
  }

  const rowCount = $derived(Math.ceil(frame.n / COLUMNS));
  const valueAt = (/** @type {number} */ r, /** @type {number} */ c) => r * COLUMNS + c + 1;
  // The last row stops at n, so every cell in the grid is a number that can be picked.
  const values = $derived(
    Array.from({ length: rowCount }, (_, r) =>
      Array.from({ length: Math.min(COLUMNS, frame.n - r * COLUMNS) }, (_, c) => valueAt(r, c)),
    ),
  );

  /** @param {number} v @returns {Role} */
  function roleOf(v) {
    if (v === 1) return 'unit';
    if (frame.rest > 1 && v === frame.rest) return 'factor';
    if (frame.kind === 'cross' && v === frame.j) return frame.first ? 'first' : 'again';
    if ((frame.kind === 'prime' || frame.kind === 'cross') && v === frame.p) return 'current';
    if (frame.crossed[v]) return 'crossed';
    return frame.primes.includes(v) ? 'prime' : 'pending';
  }

  /** @param {number} v */
  function markerOf(v) {
    const role = roleOf(v);
    if (role === 'first' || role === 'again' || role === 'crossed') return m.spfMark(frame.spf[v]);
    if (role === 'prime' || role === 'unit' || role === 'current' || role === 'factor') {
      return m.markers[role];
    }
    return '';
  }

  /** @param {number} r @param {number} c */
  function pick(r, c) {
    const v = valueAt(r, c);
    if (v < 2) {
      say(m.pickError(v));
      return;
    }
    x = xDraft = v;
    preset = '';
    showFactorising();
  }

  const selected = $derived(
    /** @type {[number, number]} */ ([Math.floor((x - 1) / COLUMNS), (x - 1) % COLUMNS]),
  );
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(e) => enterField(e, {})}
    onsubmit={(e) => e.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.n}
      <input
        type="number"
        name="n"
        min="2"
        max={MAX_N}
        class="field w-28 tabular-nums"
        bind:value={nDraft}
        onchange={commitN}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.x}
      <input
        type="number"
        name="x"
        min="2"
        max={n}
        class="field w-28 tabular-nums"
        bind:value={xDraft}
        onchange={commitX}
      />
    </label>
    <SegmentedControl
      legend={m.startLabel}
      name="start"
      options={[
        { value: 'square', label: m.starts.square },
        { value: 'double', label: m.starts.double },
      ]}
      bind:value={from}
      onchange={rebuild}
    />
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
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.gridTitle}
        </h2>
        <DpTable
          {values}
          ariaLabel={m.gridAria(frame.n)}
          stateOf={(r, c) => {
            return ROLE_STATE[roleOf(valueAt(r, c))];
          }}
          markerOf={(r, c) => markerOf(valueAt(r, c))}
          labelOf={(r, c) => {
            const v = valueAt(r, c);
            return m.cellLabel(v, m.states[roleOf(v)]);
          }}
          onselect={pick}
          {selected}
          speed={player.speed}
        />
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as role (role)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[ROLE_STATE[role]]}"
              ></span>{m.legend[role]}
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
          <dt class="text-xs text-slate-500">{m.stats.p}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="p">{frame.p || '—'}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.primes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="primes">
            {frame.primes.length}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.crossings}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="crossings">
            {frame.crossings}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.repeats}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="repeats">{frame.repeats}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.square}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="total-square">
            {crossingCount(frame.n, 'square')}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.double}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="total-double">
            {crossingCount(frame.n, 'double')}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.factorsTitle}
        items={frame.factors.map((v) => ({ label: String(v) }))}
        emptyText={m.factorsEmpty}
      />
      <ChipList
        title={m.primesTitle}
        items={frame.primes.map((v) => ({ label: String(v) }))}
        emptyText={m.primesEmpty}
        limit={46}
      />
      <CodePanel lines={sievePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
