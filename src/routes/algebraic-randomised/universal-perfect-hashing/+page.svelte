<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { createFieldGuard, enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { parseValueList } from '$lib/algo-engine/parse-values.js';
  import {
    HASH_PRESETS,
    MAX_KEY,
    MAX_N,
    MAX_SAMPLES,
    MIN_N,
    P,
    SAMPLE_BATCH,
    exactMeanPairs,
    fixedPairs,
    lcg,
    lookup,
    pairBound,
    perfectHashPseudocode,
    perfectHashTrace,
    sampleDraw,
  } from '$lib/algo-engine/universal-perfect-hashing.js';
  import { en as m } from '$lib/lessons/universal-perfect-hashing/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof HASH_PRESETS} Preset */
  /** @typedef {keyof typeof m.roleMarkers} Role */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(HASH_PRESETS));
  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = { placed: 'active', clash: 'compare', done: 'sorted', '': '' };
  /** @type {Record<Role, string>} */
  const ROLE_TEXT = {
    placed: 'text-white',
    clash: 'text-slate-900',
    done: 'text-white',
    '': 'text-slate-900',
  };
  const LEGEND = /** @type {(keyof typeof m.legend)[]} */ (Object.keys(m.legend));
  // The first build uses fixed draws, so the prerendered page and the hydrated one agree.
  const FIRST_SEED = 7;

  const INITIAL = HASH_PRESETS.textbook;
  let preset = $state(/** @type {Preset | ''} */ ('textbook'));
  let keys = $state(INITIAL.slice());
  let draft = $state(INITIAL.join(', '));
  let probe = $state(/** @type {number | null} */ (60));
  let probeDraft = $state(/** @type {number | null} */ (60));
  let samples = $state(/** @type {number[]} */ ([]));
  let good = $state(0);
  let notice = $state({ text: '', at: -1 });
  const probeGuard = createFieldGuard();

  const player = createPlayer(perfectHashTrace(INITIAL, lcg(FIRST_SEED)));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, P));

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  /** @param {() => number} [rand] */
  function rebuild(rand = Math.random) {
    notice = { text: '', at: -1 };
    player.load(perfectHashTrace(keys, rand));
  }

  function resetSamples() {
    samples = [];
    good = 0;
  }

  /** @param {number[]} next */
  function setKeys(next) {
    keys = next;
    draft = next.join(', ');
    resetSamples();
    rebuild();
  }

  function commitKeys() {
    const parsed = parseValueList(draft, { max: MAX_KEY, minN: MIN_N, maxN: MAX_N });
    if (!('values' in parsed) || new Set(parsed.values).size !== parsed.values.length) {
      draft = keys.join(', ');
      say(m.keysError(MIN_N, MAX_N, MAX_KEY));
      return;
    }
    if (parsed.values.join(',') === keys.join(',')) return;
    preset = '';
    setKeys(parsed.values);
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    setKeys(HASH_PRESETS[p].slice());
  }

  function commitProbe() {
    if (probeGuard.commit(wholeInRange(probeDraft, 0, MAX_KEY))) probe = probeDraft;
    else {
      probeDraft = probe;
      say(m.lookupError(MAX_KEY));
    }
  }

  function runLookup() {
    if (probeGuard.refused() || !wholeInRange(probeDraft, 0, MAX_KEY)) {
      probeDraft = probe;
      say(m.lookupError(MAX_KEY));
      return;
    }
    const k = /** @type {number} */ (probeDraft);
    probe = k;
    if (frame.kind !== 'done') {
      say(m.lookupWait);
      return;
    }
    const r = lookup(frame, k);
    say(m.lookupResult(k, r.j, r.slot, r.found));
  }

  function sampleMany() {
    if (samples.length + SAMPLE_BATCH > MAX_SAMPLES) {
      say(m.samplesFull(MAX_SAMPLES));
      return;
    }
    const more = [];
    for (let t = 0; t < SAMPLE_BATCH; t++) {
      const s = sampleDraw(keys);
      more.push(s.pairs);
      if (s.sumSquares < 4 * keys.length) good++;
    }
    samples = [...samples, ...more];
  }

  /** @param {number} j @param {number} s @returns {Role} */
  function slotRole(j, s) {
    const f = frame;
    if (f.j === j && f.slot === s) {
      if (f.kind === 'collide') return 'clash';
      if (f.kind === 'slot') return 'placed';
    }
    return f.tables[j].done ? 'done' : '';
  }

  /** @param {number} key @returns {Role} */
  const keyRole = (key) => (frame.kind === 'place' && frame.key === key ? 'placed' : '');

  /** @param {Role} role */
  const cellClass = (role) => `${STATE_BG[ROLE_STATE[role]]} ${ROLE_TEXT[role]}`;

  const n = $derived(keys.length);
  const bound = $derived(pairBound(n));
  const exact = $derived(exactMeanPairs(keys));
  const fixed = $derived(fixedPairs(keys));
  const mean = $derived(samples.length ? samples.reduce((s, x) => s + x, 0) / samples.length : 0);
  const top = $derived(Math.max(fixed, Math.ceil(bound), ...samples));
  const counts = $derived.by(() => {
    const c = Array(top + 1).fill(0);
    for (const s of samples) c[s]++;
    return c;
  });
  const peak = $derived(Math.max(1, ...counts));
  /** Centre of the bar for a pair count, as a percentage across the histogram. @param {number} x */
  const at = (x) => ((x + 0.5) / (top + 1)) * 100;
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, { probe: runLookup })}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.fields.keys}
      <input
        type="text"
        name="keys"
        class="field w-72 max-w-full tabular-nums"
        bind:value={draft}
        onchange={commitKeys}
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
    <button type="button" class="btn-outline" onclick={() => rebuild()}>{m.reroll}</button>
    <div class="flex items-end gap-2">
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.lookup}
        <input
          type="number"
          name="probe"
          min="0"
          max={MAX_KEY}
          class="field w-24 tabular-nums"
          bind:value={probeDraft}
          onchange={commitProbe}
        />
      </label>
      <button type="button" class="btn-primary" onclick={runLookup}>{m.lookupButton}</button>
    </div>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <p class="mb-2 text-xs text-slate-600">
          {m.family}{frame.a > 0 ? m.firstLevel(frame.a, frame.b, n) : ''}
        </p>
        <ol class="flex flex-col gap-1.5" aria-label={m.tableAria(n)} data-testid="buckets">
          {#each frame.buckets as group, j (j)}
            {@const t = frame.tables[j]}
            <li
              class="flex flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5 {frame.j === j
                ? 'border-slate-900 bg-slate-50'
                : 'border-slate-200'}"
              aria-label={m.bucketLabel(j, group.length)}
            >
              <span class="w-8 shrink-0 font-mono text-xs font-bold text-slate-700">{j}</span>
              {#if t.m > 0}
                <span class="w-36 shrink-0 text-xs text-slate-500 tabular-nums"
                  >{m.secondParams(t.m, t.a, t.b)}</span
                >
                <ol class="flex flex-wrap gap-1">
                  {#each t.slots as key, s (s)}
                    {@const role = slotRole(j, s)}
                    <li
                      class="relative flex h-8 min-w-8 items-center justify-center rounded border border-slate-400 px-1 font-mono text-sm tabular-nums {cellClass(
                        role,
                      )}"
                      title={m.slotLabel(s, key, m.roleNames[role])}
                      aria-label={m.slotLabel(s, key, m.roleNames[role])}
                    >
                      {key ?? m.emptySlot}{#if role}<span
                          class="absolute -top-2 -right-1 rounded bg-white px-0.5 text-[10px] font-bold text-slate-900"
                          aria-hidden="true">{m.roleMarkers[role]}</span
                        >{/if}
                    </li>
                  {/each}
                </ol>
              {:else if group.length === 0}
                <span class="text-xs text-slate-400">{m.emptyBucket}</span>
              {:else}
                <ul class="flex flex-wrap gap-1">
                  {#each group as key (key)}
                    {@const role = keyRole(key)}
                    <li
                      class="rounded-full border border-slate-400 px-2 py-0.5 font-mono text-sm tabular-nums {cellClass(
                        role,
                      )}"
                    >
                      {#if role}<span aria-hidden="true">{m.roleMarkers[role]} </span>{/if}{key}
                    </li>
                  {/each}
                </ul>
              {/if}
            </li>
          {/each}
        </ol>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
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

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.sampleTitle}
          </h2>
          <div class="flex gap-2">
            <button type="button" class="btn-primary" onclick={sampleMany}
              >{m.sampleMany(SAMPLE_BATCH)}</button
            >
            <button type="button" class="btn-outline" onclick={resetSamples}>{m.clear}</button>
          </div>
        </div>
        {#if samples.length === 0}
          <p class="text-sm text-slate-500">{m.sampleEmpty}</p>
        {:else}
          <div class="relative" role="img" aria-label={m.histAria(samples.length)}>
            <div class="flex h-32 items-end gap-px" data-testid="histogram">
              {#each counts as count, pairs (pairs)}
                <div
                  class="flex-1 rounded-t bg-state-frontier"
                  style="height: {(count / peak) * 100}%"
                  title={m.binLabel(pairs, count)}
                ></div>
              {/each}
            </div>
            <div class="relative h-5 text-xs font-bold text-slate-900" aria-hidden="true">
              <span class="absolute -translate-x-1/2" style="left: {at(mean)}%">▲</span>
              <span class="absolute -translate-x-1/2" style="left: {at(bound)}%">◆</span>
              <span class="absolute -translate-x-1/2" style="left: {at(fixed)}%">✗</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500 tabular-nums">
              <span>0</span>
              <span>{top}</span>
            </div>
          </div>
          <p class="mt-1 text-xs whitespace-pre-wrap text-slate-600">{m.histMarks}</p>
        {/if}
        <dl class="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt class="text-xs text-slate-500">{m.sampleStats.draws}</dt>
            <dd class="font-bold tabular-nums" data-testid="draws">{samples.length}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.sampleStats.mean}</dt>
            <dd class="font-bold tabular-nums" data-testid="mean">
              {samples.length ? m.twoDp(mean) : '—'}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.sampleStats.exact}</dt>
            <dd class="font-bold tabular-nums" data-testid="exact">{m.twoDp(exact)}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.sampleStats.bound}</dt>
            <dd class="font-bold tabular-nums" data-testid="bound">{m.twoDp(bound)}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.sampleStats.fixed}</dt>
            <dd class="font-bold tabular-nums" data-testid="fixed">{fixed}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">{m.sampleStats.good}</dt>
            <dd class="font-bold tabular-nums" data-testid="good">
              {m.goodText(good, samples.length)}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.firstDraws}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="first-draws">
            {frame.firstDraws}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.sumSquares}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="sum-squares">
            {m.sumText(frame.sumSquares, n)}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.secondDraws}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="second-draws">
            {frame.secondDraws}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.slots}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="slots">{n + frame.slots}</dd>
        </div>
      </dl>
      <CodePanel lines={perfectHashPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
