<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    CHANGES,
    MAX_VALUE,
    MIN_VALUE,
    VERSIONS,
    debugPseudocode,
    debugTrace,
    makeSorted,
    parseSorted,
    scanTargets,
  } from '$lib/algo-engine/practice-searching.js';
  import { en as m } from '$lib/lessons/practice-searching/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-searching.js').Version} Version */
  /** @typedef {import('$lib/algo-engine/practice-searching.js').Outcome} Outcome */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [3, 8, 12, 17, 21, 26, 30];
  const INITIAL_TARGET = 12;
  const INITIAL_VERSION = /** @type {Version} */ ('B');

  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let target = $state(INITIAL_TARGET);
  /** @type {number | null} */
  let draft = $state(INITIAL_TARGET);
  let version = $state(INITIAL_VERSION);
  let showChange = $state(false);

  const player = createPlayer(debugTrace(INITIAL_VERSION, INITIAL, INITIAL_TARGET));
  const frame = $derived(player.frame);
  const done = $derived(frame.kind === 'done');
  const scan = $derived(scanTargets(version, values));
  const broken = $derived(scan.filter((r) => r.outcome !== 'ok').length);

  let notice = $state({ text: '', at: -1 });
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, values, target),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(debugTrace(version, values, target));
  }

  /** @param {Version} v */
  function pickVersion(v) {
    version = v;
    rebuild();
  }

  /** @param {number} x */
  function setTarget(x) {
    target = x;
    draft = x;
    rebuild();
  }

  function commitTarget() {
    const x = draft;
    if (x === null || !Number.isInteger(x) || x < MIN_VALUE || x > MAX_VALUE) {
      draft = target;
      say(m.targetError);
      return;
    }
    setTarget(x);
  }

  /** @param {number[]} next */
  function setValues(next) {
    values = next;
    valuesText = next.join(', ');
    rebuild();
  }

  function commitValues() {
    const parsed = parseSorted(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    setValues(parsed.values);
  }

  function newArray() {
    const next = makeSorted(5 + Math.floor(Math.random() * 8));
    values = next;
    valuesText = next.join(', ');
    setTarget(next[Math.floor(Math.random() * next.length)]);
  }

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (done && frame.answer === i) return 'sorted';
    if (frame.mid === i && frame.kind !== 'done') return 'compare';
    if (i < frame.lo || i > frame.hi) return 'visited';
    return '';
  }

  /** @param {number} i */
  function markerOf(i) {
    const s = stateOf(i);
    return s === 'sorted' ? m.markers.sorted : s === 'compare' ? m.markers.compare : '';
  }

  const pointers = $derived(
    [
      { name: 'lo', index: frame.lo },
      ...(frame.mid >= 0 ? [{ name: 'mid', index: frame.mid }] : []),
      { name: 'hi', index: frame.hi },
    ].filter((p) => p.index >= 0),
  );
  const windows = $derived(
    frame.lo <= frame.hi ? [{ from: frame.lo, to: frame.hi + 1, label: m.windowLabel }] : [],
  );

  /** @type {Record<Outcome, string>} */
  const OUTCOME_CLASS = {
    ok: 'border-emerald-700 bg-emerald-50 text-emerald-900',
    miss: 'border-rose-700 bg-rose-50 text-rose-900',
    loop: 'border-amber-700 bg-amber-50 text-amber-900',
    'out-of-bounds': 'border-violet-700 bg-violet-50 text-violet-900',
  };

  const change = $derived(CHANGES[version]);
  const verdict = $derived(
    done && frame.outcome
      ? `${m.outcomeMarks[frame.outcome]} ${m.outcomes[frame.outcome]}`
      : m.pending,
  );
  const result = $derived(!done ? m.pending : frame.answer === -2 ? m.never : String(frame.answer));

  const legend = /** @type {[VisualState, string, string][]} */ ([
    ['compare', m.markers.compare, m.legend.compare],
    ['sorted', m.markers.sorted, m.legend.sorted],
    ['visited', '', m.legend.visited],
  ]);
  const OUTCOME_KEYS = /** @type {Outcome[]} */ (['ok', 'miss', 'loop', 'out-of-bounds']);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
        >{m.versionLabel}</legend
      >
      <div class="flex flex-wrap gap-2">
        {#each VERSIONS as v (v)}
          <button
            type="button"
            class={version === v ? 'btn-primary' : 'btn-outline'}
            aria-pressed={version === v}
            onclick={() => pickVersion(v)}>{m.versionName(v)}</button
          >
        {/each}
      </div>
    </fieldset>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-72 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <input
        type="number"
        name="target"
        min={MIN_VALUE}
        max={MAX_VALUE}
        class="field w-24"
        bind:value={draft}
        onchange={commitTarget}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={newArray}>{m.newArray}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          {values}
          ariaLabel={m.arrayLabel(values, frame.lo, frame.hi)}
          {stateOf}
          {markerOf}
          dimmed={(i) => i < frame.lo || i > frame.hi}
          {pointers}
          {windows}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {#if marker}<span class="font-bold text-slate-900">{marker}</span>{/if}
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
          <dt class="text-xs text-slate-500">{m.stats.probes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="probes">{frame.probes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="result">{result}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.verdict}</dt>
          <dd class="text-lg font-bold" data-testid="verdict">{verdict}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.broken}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="broken">
            {m.brokenValue(broken, scan.length)}
          </dd>
        </div>
      </dl>

      <ChipList
        title={m.statesTitle}
        items={frame.states.map(([lo, hi]) => ({
          label: `(${lo}, ${hi})`,
          hot: frame.outcome === 'loop' && lo === frame.lo && hi === frame.hi,
        }))}
        emptyText={m.statesEmpty}
        hotLabel={m.outcomes.loop}
      />

      <CodePanel lines={debugPseudocode[version]} active={frame.lines} />
      <div class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <label class="flex items-center gap-2 text-slate-800">
          <input
            type="checkbox"
            name="show-change"
            class="size-4 accent-teal-700"
            bind:checked={showChange}
          />
          {m.showChange}
        </label>
        {#if showChange}
          <p class="mt-2 font-mono text-xs text-slate-800" data-testid="change">
            {change ? m.changeNote(change[0] + 1, change[1]) : m.noChange}
          </p>
        {/if}
      </div>
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetsTitle}
    </h2>
    <p class="mb-2 text-sm font-semibold text-slate-800" data-testid="targets-summary">
      {m.targetsSummary(version, broken, scan.length)}
    </p>
    <ul class="flex flex-wrap gap-1">
      {#each scan as r (r.x)}
        <li>
          <button
            type="button"
            data-target={r.x}
            class="focus-ring flex w-10 flex-col items-center rounded border-2 py-0.5 text-xs font-semibold tabular-nums {OUTCOME_CLASS[
              r.outcome
            ]} {r.x === target ? 'ring-2 ring-slate-900 ring-offset-1' : ''}"
            aria-label={m.targetAria(r.x, r.outcome)}
            aria-pressed={r.x === target}
            onclick={() => setTarget(r.x)}
          >
            <span>{r.x}</span>
            <span aria-hidden="true">{m.outcomeMarks[r.outcome]}</span>
          </button>
        </li>
      {/each}
    </ul>
    <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
      {#each OUTCOME_KEYS as o (o)}
        <li class="flex items-center gap-1.5">
          <span class="rounded border-2 px-1 font-bold {OUTCOME_CLASS[o]}">{m.outcomeMarks[o]}</span
          >
          {m.outcomes[o]}
        </li>
      {/each}
    </ul>
  </section>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
