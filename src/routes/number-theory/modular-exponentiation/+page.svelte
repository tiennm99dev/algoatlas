<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_BASE,
    MAX_EXPONENT,
    MAX_MODULUS,
    POW_PRESETS,
    powPseudocode,
    powTrace,
    powerDigits,
  } from '$lib/algo-engine/modular-exponentiation.js';
  import { en as m } from '$lib/lessons/modular-exponentiation/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof POW_PRESETS} Preset */
  /** @typedef {keyof typeof m.bitStates} BitRole */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(POW_PRESETS));
  /** @type {Record<BitRole, VisualState>} */
  const BIT_STATE = { current: 'active', used: 'sorted', skipped: 'pruned', waiting: '' };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));

  const INITIAL = POW_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let a = $state(INITIAL.a);
  let e = $state(INITIAL.e);
  let mod = $state(INITIAL.m);
  let aDraft = $state(/** @type {number | null} */ (INITIAL.a));
  let eDraft = $state(/** @type {number | null} */ (INITIAL.e));
  let modDraft = $state(/** @type {number | null} */ (INITIAL.m));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(powTrace(INITIAL.a, INITIAL.e, INITIAL.m));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(powTrace(a, e, mod));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitA() {
    if (!wholeInRange(aDraft, 0, MAX_BASE)) {
      aDraft = a;
      say(m.aError(MAX_BASE));
      return;
    }
    if (aDraft === a) return;
    a = /** @type {number} */ (aDraft);
    preset = '';
    rebuild();
  }

  function commitE() {
    if (!wholeInRange(eDraft, 0, MAX_EXPONENT)) {
      eDraft = e;
      say(m.eError(MAX_EXPONENT));
      return;
    }
    if (eDraft === e) return;
    e = /** @type {number} */ (eDraft);
    preset = '';
    rebuild();
  }

  function commitM() {
    if (!wholeInRange(modDraft, 1, MAX_MODULUS)) {
      modDraft = mod;
      say(m.mError(MAX_MODULUS));
      return;
    }
    if (modDraft === mod) return;
    mod = /** @type {number} */ (modDraft);
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    a = aDraft = POW_PRESETS[p].a;
    e = eDraft = POW_PRESETS[p].e;
    mod = modDraft = POW_PRESETS[p].m;
    rebuild();
  }

  const width = $derived(frame.bits.length);
  // Strip cell i holds the bit with weight 2^(width − 1 − i), as e is written highest first.
  const weightOf = (/** @type {number} */ i) => width - 1 - i;

  /** @param {number} i @returns {BitRole} */
  function bitRole(i) {
    const weight = weightOf(i);
    if (frame.kind === 'bit' && weight === frame.k) return 'current';
    if (weight >= frame.rows.length) return 'waiting';
    return frame.rows[weight].bit === 1 ? 'used' : 'skipped';
  }

  const pointers = $derived(
    frame.kind === 'bit' ? [{ name: m.bitPointer, index: width - 1 - frame.k }] : [],
  );
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.a}
      <input
        type="number"
        name="a"
        min="0"
        max={MAX_BASE}
        class="field w-36 tabular-nums"
        bind:value={aDraft}
        onchange={commitA}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.e}
      <input
        type="number"
        name="e"
        min="0"
        max={MAX_EXPONENT}
        class="field w-36 tabular-nums"
        bind:value={eDraft}
        onchange={commitE}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.m}
      <input
        type="number"
        name="m"
        min="1"
        max={MAX_MODULUS}
        class="field w-36 tabular-nums"
        bind:value={modDraft}
        onchange={commitM}
      />
    </label>
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
          {m.bitsTitle}
        </h2>
        <ArrayStrip
          values={frame.bits}
          ariaLabel={m.bitsAria(frame.e0)}
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

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.squaresTitle}
        </h2>
        {#if frame.rows.length === 0}
          <p class="text-sm text-slate-500">{m.squaresEmpty}</p>
        {:else}
          <ScrollFrame>
            <table class="w-full text-right text-sm tabular-nums">
              <thead>
                <tr class="text-xs text-slate-500">
                  <th scope="col" class="w-5"></th>
                  <th scope="col" class="px-2 py-1 font-semibold">{m.squaresHead.k}</th>
                  <th scope="col" class="px-2 py-1 font-semibold">{m.squaresHead.power}</th>
                  <th scope="col" class="px-2 py-1 font-semibold">{m.squaresHead.x}</th>
                  <th scope="col" class="px-2 py-1 font-semibold">{m.squaresHead.bit}</th>
                  <th scope="col" class="px-2 py-1 font-semibold">{m.squaresHead.used}</th>
                </tr>
              </thead>
              <tbody>
                {#each frame.rows as row (row.k)}
                  {@const here = row.k === frame.k}
                  <tr class="border-t border-slate-100 {here ? 'bg-amber-50 font-semibold' : ''}">
                    <td aria-hidden="true">{here ? m.currentRow : ''}</td>
                    <td class="px-2 py-1">{row.k}</td>
                    <td class="px-2 py-1">{m.powerName(row.power)}</td>
                    <td class="px-2 py-1">{row.x}</td>
                    <td class="px-2 py-1">{row.bit}</td>
                    <td class="px-2 py-1 text-left whitespace-nowrap">
                      {#if frame.used.includes(row.power)}
                        {m.usedYes}
                      {:else if row.bit === 0}
                        {m.usedNo}
                      {:else}
                        {m.usedWaiting}
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </ScrollFrame>
        {/if}
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-xl font-bold break-all tabular-nums" data-testid="result">
            {frame.result}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.x}</dt>
          <dd class="text-xl font-bold break-all tabular-nums" data-testid="x">{frame.x}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.multiplications}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="multiplications">
            {frame.multiplications}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-xl font-bold break-all tabular-nums" data-testid="naive">{frame.e0}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.productDigits}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="product-digits">
            {frame.productDigits}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.fullDigits}</dt>
          <dd class="text-xl font-bold break-all tabular-nums" data-testid="full-digits">
            {powerDigits(frame.a, frame.e0)}
          </dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.invariantTitle}</h2>
        <p class="font-mono text-sm font-semibold text-slate-900" data-testid="invariant">
          {m.invariant(frame)}
        </p>
      </div>
      <ChipList
        title={m.chipsTitle}
        items={frame.used.map((p) => ({ label: String(p) }))}
        emptyText={m.chipsEmpty}
        limit={30}
      />
      <CodePanel lines={powPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
