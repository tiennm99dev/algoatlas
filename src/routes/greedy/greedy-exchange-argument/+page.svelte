<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_AMOUNT,
    SCAN_LIMIT,
    changePseudocode,
    changeTrace,
    counterexamples,
    parseCoins,
  } from '$lib/algo-engine/greedy-exchange-argument.js';
  import { en as m } from '$lib/lessons/greedy-exchange-argument/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof m.presets} PresetKey */
  /** @typedef {keyof typeof m.legend} CoinKind */

  /** @type {Record<PresetKey, number[]>} */
  const PRESETS = {
    tricky: [1, 3, 4],
    us: [1, 5, 10, 25],
    vnd: [1, 2, 5, 10, 20, 50, 100],
    sevenTen: [1, 7, 10],
    noOne: [3, 5],
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.tricky;
  const INITIAL_AMOUNT = 6;
  let coins = $state(INITIAL);
  let coinsText = $state(INITIAL.join(', '));
  let amount = $state(INITIAL_AMOUNT);
  /** @type {number | null} */
  let amountDraft = $state(INITIAL_AMOUNT);
  let preset = $state('tricky');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(changeTrace(INITIAL, INITIAL_AMOUNT));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const found = $derived(counterexamples(coins.slice().sort((a, b) => b - a)));
  const sorted = $derived(player.frames[player.frames.length - 1].coins);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {number[]} nextCoins @param {number} nextAmount */
  function load(nextCoins, nextAmount) {
    coins = nextCoins;
    coinsText = nextCoins.join(', ');
    amount = nextAmount;
    amountDraft = nextAmount;
    notice = { text: '', at: -1 };
    player.load(changeTrace(nextCoins, nextAmount));
  }

  function commitCoins() {
    const parsed = parseCoins(coinsText);
    if ('error' in parsed) {
      coinsText = coins.join(', ');
      say(m.errors[parsed.error]);
      return;
    }
    const next = parsed.coins.slice().reverse();
    if (next.join() === coins.join()) {
      coinsText = coins.join(', ');
      return;
    }
    preset = '';
    load(next, amount);
  }

  function commitAmount() {
    const v = amountDraft;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > MAX_AMOUNT) {
      amountDraft = amount;
      say(m.amountError);
      return;
    }
    if (v !== amount) load(coins, v);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    load(PRESETS[key], amount);
    say(m.newCoinsNotice);
  }

  function loadSmallest() {
    if (found.length === 0) return;
    load(coins, found[0].amount);
    say(m.counterNotice(found[0].amount));
  }

  /** @param {number} i @returns {CoinKind | ''} */
  function coinKind(i) {
    if (frame.kind === 'start') return '';
    if (i === frame.at) {
      if (frame.kind === 'try') return 'trying';
      return frame.kind === 'take' ? 'taken' : 'skipped';
    }
    const past = frame.kind === 'fail' || frame.kind === 'done' || (frame.at >= 0 && i < frame.at);
    if (!past) return '';
    return frame.taken[i] > 0 ? 'taken' : 'skipped';
  }

  /** @type {Record<CoinKind | '', VisualState>} */
  const STATE = { trying: 'compare', taken: 'sorted', skipped: 'visited', '': '' };
  const LEGEND = /** @type {CoinKind[]} */ (['trying', 'taken', 'skipped']);

  /** @param {number} i */
  function markerOf(i) {
    const kind = coinKind(i);
    if (kind === 'taken') return m.takenMark(frame.taken[i]);
    return kind ? m.markers[kind] : '';
  }

  /** @param {number} i */
  function labelOf(i) {
    const kind = coinKind(i);
    return m.coinLabel(
      frame.coins[i],
      frame.kind === 'start' ? 0 : frame.taken[i],
      kind ? m.legend[kind] : '',
    );
  }

  /** @param {number[]} taken */
  const chips = (taken) => sorted.flatMap((c, k) => Array(taken[k]).fill({ label: String(c) }));

  const finished = $derived(frame.kind === 'done');
  const verdictText = $derived(
    finished && frame.verdict ? m.verdicts[frame.verdict] : m.verdicts.pending,
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitCoins();
      commitAmount();
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
      {m.coinsLabel}
      <input
        type="text"
        name="coins"
        inputmode="numeric"
        class="field w-full max-w-xs font-mono"
        bind:value={coinsText}
        onchange={commitCoins}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.amountLabel}
      <input
        type="number"
        name="amount"
        min="1"
        max={MAX_AMOUNT}
        step="1"
        class="field w-24"
        bind:value={amountDraft}
        onchange={commitAmount}
      />
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <ArrayStrip
          values={frame.coins}
          ariaLabel={m.coinsAria(frame.coins, frame.rest)}
          stateOf={(i) => STATE[coinKind(i)]}
          {markerOf}
          {labelOf}
          showIndices={false}
          pointers={frame.at >= 0 ? [{ name: m.coinPointer, index: frame.at }] : []}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each LEGEND as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[STATE[s]]}"></span>
              <span class="font-bold text-slate-900">{m.markers[s]}</span>
              {m.legend[s]}
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
          <dt class="text-xs text-slate-500">{m.stats.rest}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.rest}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.greedy}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.count}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.best}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.best < 0 ? m.none : frame.best}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.verdict}</dt>
          <dd class="text-sm font-bold">{verdictText}</dd>
        </div>
      </dl>
      <ChipList title={m.greedyTitle} items={chips(frame.taken)} emptyText={m.emptyPay} />
      <ChipList
        title={m.bestTitle}
        items={chips(frame.bestTaken)}
        emptyText={frame.best < 0 ? m.noPay : m.emptyPay}
      />
      <CodePanel lines={changePseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <section class="mt-4 rounded-xl border border-slate-200 bg-white p-4">
    <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.counterTitle}
    </h2>
    <p class="mb-3 text-sm font-semibold text-slate-800" data-testid="counter-summary">
      {m.counterSummary(found.length, SCAN_LIMIT)}
    </p>
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div class="min-w-0 grow">
        <ChipList
          title={m.counterChipsTitle}
          items={found.map((c) => ({ label: m.counterChip(c), hot: c.amount === amount }))}
          emptyText={m.counterEmpty}
        />
      </div>
      <button
        type="button"
        class="btn-outline"
        aria-disabled={found.length === 0}
        onclick={loadSmallest}>{m.smallest}</button
      >
    </div>
  </section>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
