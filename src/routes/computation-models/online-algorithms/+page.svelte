<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL } from '$lib/components/visual-state.js';
  import { parseLetters } from '$lib/algo-engine/text-match.js';
  import {
    MAX_BUY,
    MAX_DAYS,
    MAX_K,
    MAX_REQUESTS,
    POLICIES,
    competitiveRatio,
    loopRequests,
    pagingPseudocode,
    pagingTrace,
    ratioCurve,
    skiPseudocode,
    skiTrace,
  } from '$lib/algo-engine/online-algorithms.js';
  import { en as m } from '$lib/lessons/online-algorithms/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {'ski'|'paging'} Mode */
  /** @typedef {'play'|'fixed'|'never'} Plan */
  /** @typedef {'random'|'adversary'} Rule */
  /** @typedef {keyof typeof m.presets} Preset */
  /** @typedef {import('$lib/algo-engine/online-algorithms.js').SkiAction} SkiAction */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  // Fixed defaults keep the prerendered HTML and the hydrated page identical; the secret season
  // length changes only when the learner asks for a new season.
  const DEFAULTS = { b: 10, k: 10, d: 12, season: 13, cache: 3, requests: 'ABCDABEABCDE' };
  const MODE_OPTIONS = /** @type {Mode[]} */ (['ski', 'paging']).map((value) => ({
    value,
    label: m.modes[value],
  }));
  const PLAN_OPTIONS = /** @type {Plan[]} */ (['play', 'fixed', 'never']).map((value) => ({
    value,
    label: m.strategies[value],
  }));
  const RULE_OPTIONS = /** @type {Rule[]} */ (['random', 'adversary']).map((value) => ({
    value,
    label: m.seasonRules[value],
  }));
  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(m.presets));
  const ERRORS = /** @type {const} */ ({ empty: 'empty', format: 'format', length: 'length' });
  /** @type {Record<SkiAction, VisualState>} */
  const DAY_STATE = { rent: 'frontier', buy: 'active', own: 'visited' };
  const ACTIONS = /** @type {SkiAction[]} */ (['rent', 'buy', 'own']);

  let mode = $state(/** @type {Mode} */ ('ski'));
  let b = $state(DEFAULTS.b);
  let plan = $state(/** @type {Plan} */ ('play'));
  let k = $state(DEFAULTS.k);
  let d = $state(DEFAULTS.d);
  let rule = $state(/** @type {Rule} */ ('random'));
  let played = $state(0);
  let boughtOn = $state(0);
  let season = $state(DEFAULTS.season);
  let over = $state(false);

  let cacheSize = $state(DEFAULTS.cache);
  let requests = $state.raw(DEFAULTS.requests.split(''));
  let draft = $state(DEFAULTS.requests);
  let notice = $state({ text: '', at: -1, mode: /** @type {Mode} */ ('ski') });

  const ski = createPlayer(skiTrace(DEFAULTS.b, 0, 0, false));
  const paging = createPlayer(pagingTrace(DEFAULTS.requests.split(''), DEFAULTS.cache));
  const sf = $derived(ski.frame);
  const pf = $derived(paging.frame);
  const player = $derived(mode === 'ski' ? ski : paging);

  /** The buy day of the plan on show: 0 never buys. */
  const planK = $derived(plan === 'fixed' ? k : plan === 'never' ? 0 : boughtOn);
  const curve = $derived(ratioCurve(b, planK));
  const worst = $derived(planK === 0 ? -1 : Math.min(planK, MAX_DAYS) - 1);
  const curveMax = $derived(Math.max(...curve, 2));
  const seasonDay = $derived(plan === 'play' ? (over ? played : -1) : d);

  const narration = $derived.by(() => {
    if (notice.mode === mode && notice.at === player.index) return notice.text;
    return mode === 'ski'
      ? m.describeSki(sf, b, { plan, k, rule })
      : m.describePaging(pf, requests, cacheSize);
  });

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index, mode };
  }

  function rebuildSki() {
    notice = { text: '', at: -1, mode };
    if (plan === 'play') {
      ski.load(skiTrace(b, boughtOn, played, over));
      ski.seek(ski.frames.length - 1);
    } else {
      ski.load(skiTrace(b, plan === 'fixed' ? k : 0, d, true));
    }
  }

  function rebuildPaging() {
    notice = { text: '', at: -1, mode };
    paging.load(pagingTrace(requests, cacheSize));
  }

  function rent() {
    if (over) return say(m.notices.over);
    played++;
    if (rule === 'adversary' ? played >= MAX_DAYS : played >= season) over = true;
    rebuildSki();
  }

  function buy() {
    if (over) return say(m.notices.over);
    boughtOn = played + 1;
    // The adversary ends the season right after the purchase; otherwise the rest of the
    // season is free on your own skis.
    if (rule === 'adversary') season = boughtOn;
    played = Math.max(season, boughtOn);
    over = true;
    rebuildSki();
  }

  function newSeason() {
    played = 0;
    boughtOn = 0;
    over = false;
    season = 1 + Math.floor(Math.random() * MAX_DAYS);
    rebuildSki();
  }

  function changePlan() {
    if (plan === 'fixed') k = b;
    rebuildSki();
  }

  function commitRequests() {
    const parsed = parseLetters(draft, MAX_REQUESTS);
    if ('error' in parsed) {
      draft = requests.join('');
      say(m.notices[ERRORS[parsed.error]]);
      return;
    }
    draft = parsed.word.toUpperCase();
    if (draft === requests.join('')) return;
    requests = draft.split('');
    rebuildPaging();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    const seq =
      p === 'loop'
        ? loopRequests(cacheSize, 12).join('')
        : p === 'belady'
          ? 'ABCDABEABCDE'
          : 'AABABCABDABAEAB';
    draft = seq;
    requests = seq.split('');
    rebuildPaging();
  }

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
  const BAR_W = 14;
  const BAR_H = 90;
</script>

{#snippet stat(/** @type {string} */ label, /** @type {string | number} */ value)}
  <div class="rounded-xl border border-slate-200 bg-white p-3">
    <dt class="text-xs text-slate-500">{label}</dt>
    <dd class="text-2xl font-bold tabular-nums">{value}</dd>
  </div>
{/snippet}

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(e) => enterField(e, {})}
    onsubmit={(e) => e.preventDefault()}
  >
    <SegmentedControl legend={m.modeLabel} name="mode" options={MODE_OPTIONS} bind:value={mode} />
    {#if mode === 'ski'}
      <label class={labelClass}>
        {m.priceLabel}: {b}
        <input
          type="range"
          name="price"
          min="2"
          max={MAX_BUY}
          bind:value={b}
          onchange={rebuildSki}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <SegmentedControl
        legend={m.strategyLabel}
        name="plan"
        options={PLAN_OPTIONS}
        bind:value={plan}
        onchange={changePlan}
      />
      {#if plan === 'play'}
        <SegmentedControl
          legend={m.seasonRuleLabel}
          name="rule"
          options={RULE_OPTIONS}
          bind:value={rule}
          onchange={newSeason}
        />
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" onclick={rent}>{m.rent}</button>
          <button type="button" class="btn-secondary" onclick={buy}>{m.buy}</button>
          <button type="button" class="btn-outline" onclick={newSeason}>{m.newSeason}</button>
        </div>
      {:else}
        {#if plan === 'fixed'}
          <label class={labelClass}>
            {m.buyDayLabel}: {k}
            <input
              type="range"
              name="buy-day"
              min="1"
              max={MAX_DAYS}
              bind:value={k}
              onchange={rebuildSki}
              class="focus-ring rounded accent-teal-700"
            />
          </label>
        {/if}
        <label class={labelClass}>
          {m.seasonLabel}: {d}
          <input
            type="range"
            name="season"
            min="1"
            max={MAX_DAYS}
            bind:value={d}
            onchange={rebuildSki}
            class="focus-ring rounded accent-teal-700"
          />
        </label>
      {/if}
    {:else}
      <label class={labelClass}>
        {m.kLabel}: {cacheSize}
        <input
          type="range"
          name="cache"
          min="1"
          max={MAX_K}
          bind:value={cacheSize}
          onchange={rebuildPaging}
          class="focus-ring rounded accent-teal-700"
        />
      </label>
      <label class={labelClass}>
        {m.requestsLabel}
        <input
          type="text"
          name="requests"
          maxlength={MAX_REQUESTS + 4}
          autocomplete="off"
          autocapitalize="characters"
          class="field w-64 font-mono normal-case"
          bind:value={draft}
          onchange={commitRequests}
        />
      </label>
      <fieldset>
        <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.presetLabel}
        </legend>
        <div class="flex flex-wrap gap-2">
          {#each PRESET_KEYS as p (p)}
            <button type="button" class="btn-outline" onclick={() => loadPreset(p)}
              >{m.presets[p]}</button
            >
          {/each}
        </div>
      </fieldset>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      {#if mode === 'ski'}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.daysTitle}
          </h2>
          {#if sf.actions.length === 0}
            <p class="text-sm text-slate-600">{m.noDays}</p>
          {:else}
            <ol class="flex flex-wrap gap-1" aria-label={m.daysAria(sf.actions.length)}>
              {#each sf.actions as a, i (i)}
                <li
                  class="flex size-7 items-center justify-center rounded border border-slate-700 text-xs font-bold {STATE_BG[
                    DAY_STATE[a]
                  ]} {a === 'buy' ? 'text-white' : 'text-slate-900'}"
                  title={m.dayLabel(i + 1, a)}
                >
                  <span aria-hidden="true">{m.dayMarks[a]}</span>
                  <span class="sr-only">{m.dayLabel(i + 1, a)}</span>
                </li>
              {/each}
            </ol>
          {/if}
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each ACTIONS as a (a)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[DAY_STATE[a]]}"
                ></span>
                {m.dayLegend[a]}
              </li>
            {/each}
          </ul>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.curveTitle}
          </h2>
          <div class="overflow-x-auto">
            <svg
              width={MAX_DAYS * BAR_W + 4}
              height={BAR_H + 34}
              viewBox="0 0 {MAX_DAYS * BAR_W + 4} {BAR_H + 34}"
              role="img"
              aria-label={m.curveAria(worst < 0 ? '∞' : m.num(curve[worst]))}
            >
              {#each curve as r, i (i)}
                {@const h = Math.max(2, (BAR_H * r) / curveMax)}
                {@const st = i === worst ? 'path' : i + 1 === seasonDay ? 'active' : 'visited'}
                <g>
                  <title>{m.barLabel(i + 1, r)}</title>
                  <rect
                    x={2 + i * BAR_W}
                    y={14 + BAR_H - h}
                    width={BAR_W - 3}
                    height={h}
                    class="{STATE_FILL[st]} stroke-slate-700"
                    stroke-width="0.5"
                  />
                  {#if i === worst || i + 1 === seasonDay}
                    <text
                      x={2 + i * BAR_W + (BAR_W - 3) / 2}
                      y={10 + BAR_H - h}
                      text-anchor="middle"
                      class="fill-slate-800 text-[10px] font-bold"
                      >{i === worst ? m.worstMark : m.seasonMark}</text
                    >
                  {/if}
                  {#if (i + 1) % 5 === 0 || i === 0}
                    <text
                      x={2 + i * BAR_W + (BAR_W - 3) / 2}
                      y={BAR_H + 28}
                      text-anchor="middle"
                      class="fill-slate-500 text-[10px]">{i + 1}</text
                    >
                  {/if}
                </g>
              {/each}
            </svg>
          </div>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {STATE_BG.path}"></span>{m.curveLegend.worst}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {STATE_BG.active}"></span>{m.curveLegend.season}
            </li>
          </ul>
          <p class="mt-2 text-sm text-slate-700">{m.curveNote(planK, b)}</p>
        </div>
      {:else}
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <ArrayStrip
            values={requests}
            ariaLabel={m.requestsAria}
            stateOf={(i) =>
              i === pf.t ? 'active' : pf.kind === 'done' || i < pf.t ? 'visited' : ''}
            pointers={pf.t >= 0 ? [{ name: 't', index: pf.t }] : []}
            speed={paging.speed}
          />
          <div class="mt-4 flex flex-col gap-3">
            {#each POLICIES as q (q)}
              {@const s = pf.policies[q]}
              <div class="flex flex-wrap items-center gap-3" data-policy={q}>
                <div class="w-40">
                  <p class="font-semibold text-slate-800">{m.policyNames[q]}</p>
                  <p class="text-xs text-slate-500">{m.policyNotes[q]}</p>
                </div>
                <ol class="flex gap-1" aria-label={m.cacheAria(m.policyNames[q], s.faults)}>
                  {#each s.slots as page, i (i)}
                    {@const now = pf.kind === 'request' && i === s.slot}
                    {@const st = now ? (s.hit ? 'sorted' : 'active') : ''}
                    <li
                      class="relative flex size-9 items-center justify-center rounded border font-mono font-bold {st
                        ? 'border-slate-900'
                        : 'border-slate-300'} {STATE_BG[st]} {st ? 'text-white' : 'text-slate-900'}"
                    >
                      <span aria-hidden="true">{page ?? ''}</span>
                      {#if now}
                        <span
                          aria-hidden="true"
                          class="absolute -top-2 -right-2 text-xs text-slate-900"
                          >{s.hit ? m.slotMarks.hit : m.slotMarks.loaded}</span
                        >
                      {/if}
                      <span class="sr-only"
                        >{m.slotLabel(
                          page,
                          now ? (s.hit ? m.slotStates.hit : m.slotStates.loaded) : '',
                        )}</span
                      >
                    </li>
                  {/each}
                </ol>
                <p class="text-sm text-slate-700 tabular-nums">
                  {m.faults(s.faults)}{#if pf.kind === 'request' && s.evicted}
                    · {m.evicted(s.evicted)}{/if}
                </p>
              </div>
            {/each}
          </div>
          <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {STATE_BG.sorted}"></span>{m.pagingLegend.hit}
            </li>
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm {STATE_BG.active}"></span>{m.pagingLegend.loaded}
            </li>
          </ul>
        </div>
      {/if}

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      {#if mode === 'ski'}
        <dl class="grid grid-cols-2 gap-3">
          {@render stat(m.skiStats.day, sf.day)}
          {@render stat(m.skiStats.cost, sf.cost)}
          {@render stat(m.skiStats.opt, sf.opt)}
          {@render stat(m.skiStats.ratio, sf.opt === 0 ? '—' : m.num(sf.cost / sf.opt))}
        </dl>
        <p class="text-sm text-slate-700">{m.planRatio(competitiveRatio(b, planK))}</p>
        <CodePanel lines={skiPseudocode} active={sf.lines} />
      {:else}
        <dl class="grid grid-cols-2 gap-3">
          {@render stat(m.pagingStats.request, m.request(pf.t + 1, requests.length))}
          {@render stat(m.pagingStats.lru, pf.policies.lru.faults)}
          {@render stat(m.pagingStats.fifo, pf.policies.fifo.faults)}
          {@render stat(m.pagingStats.opt, pf.policies.opt.faults)}
        </dl>
        <p class="text-sm text-slate-700">
          {m.boundNote(pf.policies.lru.faults, pf.policies.opt.faults, cacheSize)}
        </p>
        <CodePanel lines={pagingPseudocode} active={pf.lines} />
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      {#if mode === 'ski'}
        <StepControls player={ski} />
      {:else}
        <StepControls player={paging} />
      {/if}
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
