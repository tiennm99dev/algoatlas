<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { parseValueList } from '$lib/algo-engine/parse-values.js';
  import {
    MAX_BASE,
    MAX_BASES,
    MAX_N,
    PRIMALITY_PRESETS,
    fermatPseudocode,
    liarCounts,
    millerPseudocode,
    primalityTrace,
    trialPseudocode,
  } from '$lib/algo-engine/primality-testing.js';
  import { en as m } from '$lib/lessons/primality-testing/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/primality-testing.js').PrimalityMethod} Method */
  /** @typedef {keyof typeof PRIMALITY_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(PRIMALITY_PRESETS));
  const METHODS = /** @type {Method[]} */ (['miller', 'fermat', 'trial']);
  const CODE = { trial: trialPseudocode, fermat: fermatPseudocode, miller: millerPseudocode };
  const basesErrors = m.basesErrors(MAX_BASE, MAX_BASES);
  /** @type {Record<keyof typeof m.legend, VisualState>} */
  const LEGEND_STATE = { current: 'active', good: 'sorted', bad: 'swap' };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));

  const INITIAL = PRIMALITY_PRESETS.carmichael;
  let preset = $state(/** @type {Preset | ''} */ ('carmichael'));
  let method = $state(/** @type {Method} */ ('miller'));
  let n = $state(INITIAL.n);
  let bases = $state.raw(INITIAL.bases);
  let nDraft = $state(/** @type {number | null} */ (INITIAL.n));
  let basesDraft = $state(INITIAL.bases.join(', '));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(primalityTrace('miller', INITIAL.n, INITIAL.bases));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const liars = $derived(liarCounts(frame.n));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(primalityTrace(method, n, bases));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function commitN() {
    if (!wholeInRange(nDraft, 2, MAX_N)) {
      nDraft = n;
      say(m.nError(MAX_N));
      return;
    }
    if (nDraft === n) return;
    n = /** @type {number} */ (nDraft);
    preset = '';
    rebuild();
  }

  function commitBases() {
    const parsed = parseValueList(basesDraft, { min: 2, max: MAX_BASE, maxN: MAX_BASES });
    if ('error' in parsed) {
      basesDraft = bases.join(', ');
      say(basesErrors[parsed.error]);
      return;
    }
    basesDraft = parsed.values.join(', ');
    if (basesDraft === bases.join(', ')) return;
    bases = parsed.values;
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    n = nDraft = PRIMALITY_PRESETS[p].n;
    bases = PRIMALITY_PRESETS[p].bases;
    basesDraft = bases.join(', ');
    rebuild();
  }

  /** @param {boolean} newest @param {'pass'|'witness'|'skip'|null} outcome @returns {VisualState} */
  function valueState(newest, outcome) {
    if (!newest) return '';
    if (outcome === 'witness') return 'swap';
    if (outcome === 'pass') return 'sorted';
    return 'active';
  }

  const showingBases = $derived(frame.method !== 'trial');
  const trialPercent = $derived(
    frame.limit > 0 ? Math.min(100, Math.round((frame.d / frame.limit) * 100)) : 0,
  );
  const liarCount = $derived(
    liars && frame.method === 'miller' ? liars.miller : liars ? liars.fermat : 0,
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
    <SegmentedControl
      legend={m.methodLabel}
      name="method"
      options={METHODS.map((value) => ({ value, label: m.methods[value] }))}
      bind:value={method}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.n}
      <input
        type="number"
        name="n"
        min="2"
        max={MAX_N}
        class="field w-40 tabular-nums"
        bind:value={nDraft}
        onchange={commitN}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.bases}
      <input
        type="text"
        name="bases"
        autocomplete="off"
        class="field w-40 font-mono normal-case"
        bind:value={basesDraft}
        onchange={commitBases}
      />
    </label>
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
        {#if frame.method === 'trial'}
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.trialTitle}
          </h2>
          <p class="text-sm text-slate-700 tabular-nums" data-testid="trial-progress">
            {frame.limit > 0 ? m.trialProgress(frame.d, frame.limit) : m.trialWaiting}
          </p>
          <div
            class="mt-2 h-3 overflow-hidden rounded bg-slate-100"
            role="img"
            aria-label={frame.limit > 0 ? m.trialProgress(frame.d, frame.limit) : m.trialWaiting}
          >
            <div class="h-full bg-state-active" style="width: {trialPercent}%"></div>
          </div>
          <p class="mt-3 text-xs text-slate-500">{m.skippedNote}</p>
        {:else}
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.roundsTitle[frame.method]}
          </h2>
          {#if frame.method === 'miller'}
            <p class="mb-2 font-mono text-sm text-slate-800" data-testid="decomposition">
              {frame.s > 0 ? m.decomposition(frame) : m.decompositionWaiting}
            </p>
          {/if}
          {#if frame.rounds.length === 0}
            <p class="text-sm text-slate-500">{m.rowsEmpty}</p>
          {:else}
            <ScrollFrame>
              <table class="w-full text-sm tabular-nums">
                <thead>
                  <tr class="text-left text-xs text-slate-500">
                    <th scope="col" class="px-2 py-1 font-semibold">{m.baseHead}</th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.valuesHead}</th>
                    <th scope="col" class="px-2 py-1 font-semibold">{m.outcomeHead}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each frame.rounds as round, r (r)}
                    <tr class="border-t border-slate-100" data-testid="round">
                      <th scope="row" class="px-2 py-1 text-left font-semibold">{round.a}</th>
                      <td class="px-2 py-1">
                        <span class="flex flex-wrap gap-1">
                          {#each round.values as x, i (i)}
                            {@const newest = i === round.values.length - 1}
                            {@const state = valueState(
                              newest && r === frame.rounds.length - 1,
                              round.outcome,
                            )}
                            <span
                              class="rounded border border-slate-300 px-1.5 py-0.5 {STATE_BG[
                                state
                              ]} {state === 'active' || state === 'sorted' || state === 'swap'
                                ? 'text-white'
                                : 'text-slate-900'}"
                            >
                              {x}{x === frame.n - 1 ? ` ${m.minusOne}` : ''}
                            </span>
                          {/each}
                        </span>
                      </td>
                      <td class="px-2 py-1 whitespace-nowrap">
                        {round.outcome ? m.outcomes[round.outcome] : m.outcomes.running}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </ScrollFrame>
          {/if}
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each LEGEND as role (role)}
              <li class="flex items-center gap-1.5">
                <span
                  class="size-3 rounded-sm border border-slate-700 {STATE_BG[LEGEND_STATE[role]]}"
                ></span>{m.legend[role]}
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
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.verdict}</dt>
          <dd class="text-2xl font-bold" data-testid="verdict">
            {m.verdicts[frame.verdict ?? 'pending']}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.cost[frame.method]}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="cost">
            {frame.method === 'trial' ? frame.divisions : frame.multiplications}
          </dd>
        </div>
        {#if showingBases}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.tested}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="tested">{frame.tested}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">
              {frame.method === 'fermat' ? m.stats.liars.fermat : m.stats.liars.miller}
            </dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="liars">
              {liars ? m.liarValue(liarCount, liars.bases) : m.liarsNone}
            </dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.limit}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="limit">
              {frame.limit || '—'}
            </dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.divisor}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="divisor">
              {frame.divisor || '—'}
            </dd>
          </div>
        {/if}
      </dl>
      {#if frame.method === 'trial'}
        <ChipList
          title={m.recentTitle}
          items={frame.recent.map((d) => ({ label: String(d) }))}
          emptyText={m.recentEmpty}
        />
      {/if}
      <CodePanel lines={CODE[frame.method]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
