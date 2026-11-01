<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';
  import {
    MAX_CAPACITY,
    bestJobProfit,
    formatItems,
    formatJobs,
    jobsPseudocode,
    jobsTrace,
    knapsackPseudocode,
    knapsackTrace,
    parseItems,
    parseJobs,
    zeroOne,
  } from '$lib/algo-engine/fractional-knapsack.js';
  import { en as m } from '$lib/lessons/fractional-knapsack/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/fractional-knapsack.js').Item} Item */
  /** @typedef {import('$lib/algo-engine/fractional-knapsack.js').Job} Job */
  /** @typedef {import('$lib/algo-engine/fractional-knapsack.js').KnapFrame} KnapFrame */
  /** @typedef {import('$lib/algo-engine/fractional-knapsack.js').JobFrame} JobFrame */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'knapsack' | 'jobs'} Problem */
  /** @typedef {keyof typeof m.legend} Kind */

  /** @param {string} text @returns {Item[]} */
  const items = (text) => {
    const parsed = parseItems(text);
    return 'items' in parsed ? parsed.items : [];
  };
  /** @param {string} text @returns {Job[]} */
  const jobList = (text) => {
    const parsed = parseJobs(text);
    return 'jobs' in parsed ? parsed.jobs : [];
  };

  /** @type {Record<keyof typeof m.presets.knapsack, {items: Item[], capacity: number}>} */
  const KNAP_PRESETS = {
    textbook: { items: items('60/10, 100/20, 120/30'), capacity: 50 },
    pantry: { items: items('40/8, 30/10, 50/25, 24/4, 18/9, 60/20'), capacity: 40 },
    roomy: { items: items('60/10, 100/20, 120/30'), capacity: 100 },
  };
  /** @type {Record<keyof typeof m.presets.jobs, Job[]>} */
  const JOB_PRESETS = {
    classic: jobList('100/2, 19/1, 27/2, 25/1, 15/3'),
    crowded: jobList('9/3, 8/3, 7/3, 6/3'),
    urgent: jobList('20/4, 10/1, 40/1, 30/1'),
  };
  const PROBLEMS = /** @type {Problem[]} */ (['knapsack', 'jobs']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  let problem = $state(/** @type {Problem} */ ('knapsack'));
  let knapItems = $state(KNAP_PRESETS.textbook.items);
  let itemsText = $state(formatItems(KNAP_PRESETS.textbook.items));
  let capacity = $state(KNAP_PRESETS.textbook.capacity);
  /** @type {number | null} */
  let capacityDraft = $state(KNAP_PRESETS.textbook.capacity);
  let jobs = $state(JOB_PRESETS.classic);
  let jobsText = $state(formatJobs(JOB_PRESETS.classic));
  let preset = $state('textbook');
  let notice = $state({ text: '', at: -1 });

  /** @param {Problem} p @returns {(KnapFrame | JobFrame)[]} */
  const traceFor = (p) => (p === 'knapsack' ? knapsackTrace(knapItems, capacity) : jobsTrace(jobs));

  const player = createPlayer(traceFor('knapsack'));
  const kf = $derived(problem === 'knapsack' ? /** @type {KnapFrame} */ (player.frame) : null);
  const jf = $derived(problem === 'jobs' ? /** @type {JobFrame} */ (player.frame) : null);
  const best = $derived(bestJobProfit(jobs));
  const zo = $derived(zeroOne(knapItems, capacity));
  const narration = $derived.by(() => {
    if (notice.at === player.index) return notice.text;
    if (kf) return m.describeKnapsack(kf);
    return jf ? m.describeJobs(jf, best) : '';
  });

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(traceFor(problem));
  }

  function pickProblem() {
    preset = problem === 'knapsack' ? 'textbook' : 'classic';
    if (problem === 'knapsack') {
      knapItems = KNAP_PRESETS.textbook.items;
      itemsText = formatItems(knapItems);
      capacity = KNAP_PRESETS.textbook.capacity;
      capacityDraft = capacity;
    } else {
      jobs = JOB_PRESETS.classic;
      jobsText = formatJobs(jobs);
    }
    rebuild();
  }

  function commitItems() {
    const parsed = parseItems(itemsText);
    if ('error' in parsed) {
      itemsText = formatItems(knapItems);
      say(m.errors[parsed.error]);
      return;
    }
    itemsText = formatItems(parsed.items);
    if (itemsText === formatItems(knapItems)) return;
    knapItems = parsed.items;
    preset = '';
    rebuild();
  }

  function commitCapacity() {
    const v = capacityDraft;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > MAX_CAPACITY) {
      capacityDraft = capacity;
      say(m.capacityError);
      return;
    }
    if (v === capacity) return;
    capacity = v;
    preset = '';
    rebuild();
  }

  function commitJobs() {
    const parsed = parseJobs(jobsText);
    if ('error' in parsed) {
      jobsText = formatJobs(jobs);
      say(m.errors[parsed.error]);
      return;
    }
    jobsText = formatJobs(parsed.jobs);
    if (jobsText === formatJobs(jobs)) return;
    jobs = parsed.jobs;
    preset = '';
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = e.currentTarget.value;
    preset = key;
    if (problem === 'knapsack') {
      const p = KNAP_PRESETS[/** @type {keyof typeof KNAP_PRESETS} */ (key)];
      knapItems = p.items;
      itemsText = formatItems(p.items);
      capacity = p.capacity;
      capacityDraft = p.capacity;
    } else {
      jobs = JOB_PRESETS[/** @type {keyof typeof JOB_PRESETS} */ (key)];
      jobsText = formatJobs(jobs);
    }
    rebuild();
    say(m.newInputNotice);
  }

  const presetOptions = $derived(Object.entries(m.presets[problem]));

  /** @type {Record<Kind | '', VisualState>} */
  const STATE = { current: 'active', packed: 'sorted', cut: 'frontier', probed: 'compare', '': '' };
  const legend = $derived(
    /** @type {Kind[]} */ (
      problem === 'knapsack' ? ['current', 'packed', 'cut'] : ['current', 'packed', 'probed']
    ),
  );

  /** @param {KnapFrame} f @param {number} i @returns {Kind | ''} */
  function itemKind(f, i) {
    if (i === f.current && f.kind !== 'take') return 'current';
    if (f.taken[i] === 0) return '';
    return f.taken[i] < f.items[i].weight ? 'cut' : 'packed';
  }

  const BAR_W = 480;
  const BAR_H = 44;
  const pieces = $derived.by(() => {
    if (!kf) return [];
    let x = 0;
    return kf.packed.map((i) => {
      const w = (kf.taken[i] / kf.capacity) * BAR_W;
      const piece = { i, x, w, kind: itemKind(kf, i) };
      x += w;
      return piece;
    });
  });

  /** @param {JobFrame} f @param {number} t 0-based slot @returns {Kind | ''} */
  function slotKind(f, t) {
    if (f.kind === 'place' && f.slot === t + 1) return 'current';
    if (f.kind === 'consider' && f.probed.includes(t + 1) && f.slots[t] >= 0) return 'probed';
    if (f.slots[t] >= 0) return 'packed';
    return '';
  }

  /** @param {JobFrame} f @param {number} j */
  function jobStatus(f, j) {
    const t = f.slots.indexOf(j);
    if (t >= 0) return String(t + 1);
    return f.skipped.includes(j) ? m.status.skipped : m.status.waiting;
  }
</script>

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((p) => ({ value: p, label: m.problems[p] }))}
      bind:value={problem}
      onchange={pickProblem}
    />
  </div>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      if (problem === 'knapsack') {
        commitItems();
        commitCapacity();
      } else commitJobs();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each presetOptions as [key, label] (key)}
          <option value={key}>{label}</option>
        {/each}
      </select>
    </label>
    {#if problem === 'knapsack'}
      <label
        class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.itemsLabel}
        <input
          type="text"
          name="items"
          class="field w-full max-w-md font-mono"
          bind:value={itemsText}
          onchange={commitItems}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.capacityLabel}
        <input
          type="number"
          name="capacity"
          min="1"
          max={MAX_CAPACITY}
          step="1"
          class="field w-24"
          bind:value={capacityDraft}
          onchange={commitCapacity}
        />
      </label>
    {:else}
      <label
        class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.jobsLabel}
        <input
          type="text"
          name="jobs"
          class="field w-full max-w-md font-mono"
          bind:value={jobsText}
          onchange={commitJobs}
        />
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {#if kf}
          <ScrollFrame>
            <svg
              role="list"
              aria-label={m.barAria(kf.capacity, kf.room)}
              viewBox="0 0 {BAR_W + 2} {BAR_H + 20}"
              width={BAR_W + 2}
              height={BAR_H + 20}
              class="block max-w-none"
            >
              <rect
                x="1"
                y="1"
                width={BAR_W}
                height={BAR_H}
                rx="6"
                class="fill-slate-50 stroke-slate-400"
                stroke-dasharray="4 3"
              />
              {#each pieces as p (p.i)}
                {@const state = STATE[p.kind]}
                {@const part = m.fraction(kf.taken[p.i], kf.items[p.i].weight)}
                <g role="listitem" aria-label={m.pieceLabel(m.name(p.i), part, kf.taken[p.i])}>
                  <rect
                    x={1 + p.x}
                    y="1"
                    width={p.w}
                    height={BAR_H}
                    class="{STATE_FILL[state]} {stateStroke(state)}"
                    stroke-width="1.5"
                  />
                  {#if p.w >= 24}
                    <text
                      x={1 + p.x + p.w / 2}
                      y={BAR_H / 2 + 5}
                      text-anchor="middle"
                      class="{STATE_TEXT[state]} font-mono text-[11px] font-semibold"
                      aria-hidden="true">{m.name(p.i)}{part === '1' ? '' : ` ${part}`}</text
                    >
                  {/if}
                </g>
              {/each}
              <text x="1" y={BAR_H + 16} class="fill-slate-500 text-[10px]" aria-hidden="true"
                >0</text
              >
              <text
                x={BAR_W + 1}
                y={BAR_H + 16}
                text-anchor="end"
                class="fill-slate-500 text-[10px]"
                aria-hidden="true">W = {kf.capacity}</text
              >
            </svg>
          </ScrollFrame>
          <div class="overflow-x-auto">
            <h2 class="mb-1 text-xs text-slate-500">{m.tableTitle.knapsack}</h2>
            <table class="w-full text-left text-sm tabular-nums" data-testid="rows">
              <thead class="text-xs text-slate-500">
                <tr>
                  <th scope="col" class="font-normal">{m.table.item}</th>
                  <th scope="col" class="font-normal">{m.table.value}</th>
                  <th scope="col" class="font-normal">{m.table.weight}</th>
                  <th scope="col" class="font-normal">{m.table.density}</th>
                  <th scope="col" class="font-normal">{m.table.taken}</th>
                </tr>
              </thead>
              <tbody>
                {#each kf.order as i (i)}
                  {@const kind = itemKind(kf, i)}
                  <tr
                    class={kind === 'current' ? 'font-semibold text-slate-900' : 'text-slate-700'}
                  >
                    <th scope="row" class="font-mono font-normal">
                      <span
                        class="mr-1 inline-block size-3 rounded-sm border border-slate-700 align-middle {STATE_BG[
                          STATE[kind]
                        ]}"
                      ></span>{m.name(i)}{kind ? ` ${m.markers[kind]}` : ''}
                    </th>
                    <td>{kf.items[i].value}</td>
                    <td>{kf.items[i].weight}</td>
                    <td>{m.num(kf.items[i].value / kf.items[i].weight)}</td>
                    <td class="font-mono">
                      {kf.taken[i] ? m.fraction(kf.taken[i], kf.items[i].weight) : m.status.none}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else if jf}
          <DpTable
            values={[jf.slots.map((j) => (j >= 0 ? m.name(j) : m.emptySlot))]}
            ariaLabel={m.slotsAria(jf.slots.length)}
            rowHeaders={[m.slotRow]}
            colHeaders={jf.slots.map((_, t) => String(t + 1))}
            stateOf={(_, t) => STATE[slotKind(jf, t)]}
            markerOf={(_, t) => {
              const kind = slotKind(jf, t);
              return kind ? m.markers[kind] : '';
            }}
            speed={player.speed}
          />
          <div class="overflow-x-auto">
            <h2 class="mb-1 text-xs text-slate-500">{m.tableTitle.jobs}</h2>
            <table class="w-full text-left text-sm tabular-nums" data-testid="rows">
              <thead class="text-xs text-slate-500">
                <tr>
                  <th scope="col" class="font-normal">{m.table.job}</th>
                  <th scope="col" class="font-normal">{m.table.profit}</th>
                  <th scope="col" class="font-normal">{m.table.deadline}</th>
                  <th scope="col" class="font-normal">{m.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {#each jf.order as j (j)}
                  <tr
                    class={j === jf.current
                      ? 'font-semibold text-slate-900'
                      : jf.skipped.includes(j)
                        ? 'text-slate-500 line-through'
                        : 'text-slate-700'}
                  >
                    <th scope="row" class="font-mono font-normal">
                      {m.name(j)}{j === jf.current ? ` ${m.markers.current}` : ''}
                    </th>
                    <td>{jf.jobs[j].profit}</td>
                    <td>{jf.jobs[j].deadline}</td>
                    <td>{jobStatus(jf, j)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
        <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as s (s)}
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
      {#if kf}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.room}</dt>
            <dd class="text-2xl font-bold tabular-nums">{kf.room}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.total}</dt>
            <dd class="text-2xl font-bold tabular-nums">{m.num(kf.total)}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.scanned}</dt>
            <dd class="text-2xl font-bold tabular-nums">{kf.scanned}</dd>
          </div>
        </dl>
        <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <h2 class="mb-1 text-xs text-slate-500">{m.zeroOneTitle}</h2>
          <p class="text-slate-800" data-testid="zero-one">{m.zeroOne(zo.greedy, zo.best)}</p>
        </section>
        <CodePanel lines={knapsackPseudocode} active={kf.lines} />
      {:else if jf}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.profit}</dt>
            <dd class="text-2xl font-bold tabular-nums">{jf.profit}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.best}</dt>
            <dd class="text-2xl font-bold tabular-nums">{best}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.placed}</dt>
            <dd class="text-2xl font-bold tabular-nums">
              {jf.slots.filter((j) => j >= 0).length}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.probes}</dt>
            <dd class="text-2xl font-bold tabular-nums">{jf.probes}</dd>
          </div>
        </dl>
        <CodePanel lines={jobsPseudocode} active={jf.lines} />
      {/if}
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
