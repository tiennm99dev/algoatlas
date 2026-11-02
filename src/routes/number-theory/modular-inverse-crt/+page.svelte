<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL } from '$lib/components/visual-state.js';
  import {
    CRT_PRESETS,
    INVERSE_PRESETS,
    MAX_CONGRUENCES,
    MAX_CRT_MODULUS,
    MAX_CRT_REMAINDER,
    MAX_INVERSE_MODULUS,
    MAX_INVERSE_VALUE,
    crtPseudocode,
    crtTrace,
    euclidInverseTrace,
    euclidPseudocode,
    fermatInverseTrace,
    fermatPseudocode,
    formatSystem,
    isPrime,
    parseSystem,
  } from '$lib/algo-engine/modular-inverse-crt.js';
  import { en as m } from '$lib/lessons/modular-inverse-crt/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/algo-engine/modular-inverse-crt.js').ModClock} ModClock */
  /** @typedef {import('$lib/algo-engine/modular-inverse-crt.js').Congruence} Congruence */
  /** @typedef {'crt'|'inverse'} Task */
  /** @typedef {'euclid'|'fermat'} Method */
  /** @typedef {keyof typeof m.cellStates} CellRole */

  const INVERSE_KEYS = /** @type {(keyof typeof INVERSE_PRESETS)[]} */ (
    Object.keys(INVERSE_PRESETS)
  );
  const CRT_KEYS = /** @type {(keyof typeof CRT_PRESETS)[]} */ (Object.keys(CRT_PRESETS));
  /** @type {Record<CellRole, VisualState>} */
  const CELL_STATE = { fresh: 'active', answer: 'sorted', bad: 'swap' };
  const CODE = { euclid: euclidPseudocode, fermat: fermatPseudocode, crt: crtPseudocode };
  const systemErrors = m.systemErrors(MAX_CRT_MODULUS, MAX_CRT_REMAINDER, MAX_CONGRUENCES);
  const LEGEND = /** @type {const} */ (['aligned', 'now', 'later']);
  const LEGEND_STATE = { aligned: 'sorted', now: 'active', later: 'pruned' };

  const FIRST_SYSTEM = /** @type {{ system: Congruence[] }} */ (parseSystem(CRT_PRESETS.sunTzu));

  let task = $state(/** @type {Task} */ ('crt'));
  let method = $state(/** @type {Method} */ ('euclid'));
  let preset = $state('sunTzu');
  let a = $state(INVERSE_PRESETS.simple.a);
  let modulus = $state(INVERSE_PRESETS.simple.m);
  let system = $state.raw(FIRST_SYSTEM.system);
  let aDraft = $state(/** @type {number | null} */ (INVERSE_PRESETS.simple.a));
  let modulusDraft = $state(/** @type {number | null} */ (INVERSE_PRESETS.simple.m));
  let systemDraft = $state(CRT_PRESETS.sunTzu);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(crtTrace(FIRST_SYSTEM.system));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function currentTrace() {
    if (task === 'crt') return crtTrace(system);
    return method === 'euclid' ? euclidInverseTrace(a, modulus) : fermatInverseTrace(a, modulus);
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(currentTrace());
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  function switchTask() {
    // The example menu changes with the task, so it shows whichever example the inputs still match.
    const typed = formatSystem(system);
    preset =
      task === 'crt'
        ? (CRT_KEYS.find((p) => CRT_PRESETS[p] === typed) ?? '')
        : (INVERSE_KEYS.find(
            (p) => INVERSE_PRESETS[p].a === a && INVERSE_PRESETS[p].m === modulus,
          ) ?? '');
    rebuild();
  }

  function switchMethod() {
    if (method === 'fermat' && !isPrime(modulus)) {
      method = 'euclid';
      say(m.primeError);
      return;
    }
    rebuild();
  }

  function commitA() {
    if (!wholeInRange(aDraft, 0, MAX_INVERSE_VALUE)) {
      aDraft = a;
      say(m.aError(MAX_INVERSE_VALUE));
      return;
    }
    if (aDraft === a) return;
    a = /** @type {number} */ (aDraft);
    preset = '';
    rebuild();
  }

  function commitModulus() {
    if (!wholeInRange(modulusDraft, 2, MAX_INVERSE_MODULUS)) {
      modulusDraft = modulus;
      say(m.mError(MAX_INVERSE_MODULUS));
      return;
    }
    if (method === 'fermat' && !isPrime(/** @type {number} */ (modulusDraft))) {
      modulusDraft = modulus;
      say(m.primeError);
      return;
    }
    if (modulusDraft === modulus) return;
    modulus = /** @type {number} */ (modulusDraft);
    preset = '';
    rebuild();
  }

  function commitSystem() {
    const parsed = parseSystem(systemDraft);
    if ('error' in parsed) {
      systemDraft = formatSystem(system);
      say(systemErrors[parsed.error]);
      return;
    }
    const before = formatSystem(system);
    systemDraft = formatSystem(parsed.system);
    if (systemDraft === before) return;
    system = parsed.system;
    preset = '';
    rebuild();
  }

  /** @param {string} p */
  function loadPreset(p) {
    preset = p;
    if (task === 'crt') {
      const text = CRT_PRESETS[/** @type {keyof typeof CRT_PRESETS} */ (p)];
      system = /** @type {{ system: Congruence[] }} */ (parseSystem(text)).system;
      systemDraft = text;
    } else {
      const chosen = INVERSE_PRESETS[/** @type {keyof typeof INVERSE_PRESETS} */ (p)];
      a = aDraft = chosen.a;
      modulus = modulusDraft = chosen.m;
      if (!isPrime(modulus)) method = 'euclid';
    }
    rebuild();
  }

  /** @param {number} tick @param {number} clockM @param {number} radius */
  function onRim(tick, clockM, radius) {
    const angle = (tick / clockM) * 2 * Math.PI - Math.PI / 2;
    return { x: 60 + radius * Math.cos(angle), y: 60 + radius * Math.sin(angle) };
  }

  /** @param {ModClock} c @returns {'aligned'|'merged'|'now'|'later'} */
  function clockRole(c) {
    if (c.role === 'merged') return 'merged';
    return c.aligned ? 'aligned' : c.role;
  }

  /** @param {ModClock} c @returns {VisualState} */
  function clockState(c) {
    const role = clockRole(c);
    if (role === 'aligned' || role === 'merged') return 'sorted';
    return role === 'now' ? 'active' : 'pruned';
  }

  const tableMode = $derived(frame.mode);
  const tableValues = $derived(frame.rows.map((row) => row.map(m.cellText)));

  /** @param {number} r @param {number} col @returns {CellRole | ''} */
  function cellRole(r, col) {
    const last = frame.rows.length - 1;
    if (frame.mode === 'euclid') {
      if (frame.kind === 'found' || (frame.kind === 'done' && frame.inverse !== null)) {
        return r === last - 1 && col !== 1 ? 'answer' : '';
      }
      if (frame.kind === 'none' || frame.kind === 'done') {
        return r === last - 1 && col === 0 ? 'bad' : '';
      }
      return frame.kind === 'step' && r === last ? 'fresh' : '';
    }
    if (frame.mode === 'fermat') {
      if (frame.inverse !== null) return r === last && col === 3 ? 'answer' : '';
      return frame.kind === 'bit' && r === last ? 'fresh' : '';
    }
    if (frame.kind === 'done' && frame.solvable) return r === last ? 'answer' : '';
    return frame.kind === 'combine' && r === last ? 'fresh' : '';
  }
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
      legend={m.taskLabel}
      name="task"
      options={[
        { value: 'crt', label: m.tasks.crt },
        { value: 'inverse', label: m.tasks.inverse },
      ]}
      bind:value={task}
      onchange={switchTask}
    />
    {#if task === 'inverse'}
      <SegmentedControl
        legend={m.methodLabel}
        name="method"
        options={[
          { value: 'euclid', label: m.methods.euclid },
          { value: 'fermat', label: m.methods.fermat },
        ]}
        bind:value={method}
        onchange={switchMethod}
      />
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.a}
        <input
          type="number"
          name="a"
          min="0"
          max={MAX_INVERSE_VALUE}
          class="field w-24 tabular-nums"
          bind:value={aDraft}
          onchange={commitA}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.m}
        <input
          type="number"
          name="modulus"
          min="2"
          max={MAX_INVERSE_MODULUS}
          class="field w-24 tabular-nums"
          bind:value={modulusDraft}
          onchange={commitModulus}
        />
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.fields.system}
        <input
          type="text"
          name="system"
          autocomplete="off"
          autocapitalize="none"
          class="field w-72 max-w-full font-mono normal-case"
          bind:value={systemDraft}
          onchange={commitSystem}
        />
      </label>
    {/if}
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#if task === 'crt'}
          {#each CRT_KEYS as p (p)}
            <option value={p}>{m.crtPresets[p]}</option>
          {/each}
        {:else}
          {#each INVERSE_KEYS as p (p)}
            <option value={p}>{m.inversePresets[p]}</option>
          {/each}
        {/if}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {frame.mode === 'crt' ? m.clocksTitle : m.inverseClockTitle}
        </h2>
        <ul class="flex flex-wrap justify-center gap-4">
          {#each frame.clocks as c, i (i)}
            {@const role = clockRole(c)}
            {@const state = clockState(c)}
            {@const tip = onRim(c.value, c.m, 36)}
            {@const mark = onRim(c.goal, c.m, 50)}
            <li class="flex flex-col items-center" data-testid="clock">
              <svg
                viewBox="0 0 120 120"
                role="img"
                aria-label={m.clockAria(c, m.clockRoles[role])}
                class="block h-auto w-28 sm:w-32"
              >
                <title>{m.clockAria(c, m.clockRoles[role])}</title>
                <circle cx="60" cy="60" r="44" class="fill-white stroke-slate-400" stroke-width="2"
                ></circle>
                {#if c.m <= 60}
                  {#each { length: c.m } as _, tick (tick)}
                    {@const inner = onRim(tick, c.m, 40)}
                    {@const outer = onRim(tick, c.m, 44)}
                    <line
                      x1={inner.x}
                      y1={inner.y}
                      x2={outer.x}
                      y2={outer.y}
                      class="stroke-slate-400"
                      stroke-width="1"
                    />
                    {#if c.m <= 12}
                      {@const label = onRim(tick, c.m, 32)}
                      <text
                        x={label.x}
                        y={label.y}
                        text-anchor="middle"
                        dominant-baseline="central"
                        font-size="9"
                        class="fill-slate-500"
                        aria-hidden="true">{tick}</text
                      >
                    {/if}
                  {/each}
                {/if}
                <text
                  x={mark.x}
                  y={mark.y}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="11"
                  class="fill-amber-700"
                  aria-hidden="true">◆</text
                >
                <line
                  x1="60"
                  y1="60"
                  x2={tip.x}
                  y2={tip.y}
                  stroke-width="3"
                  stroke-linecap="round"
                  class="stroke-slate-900"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="11"
                  stroke-width="1.5"
                  class="{STATE_FILL[state]} stroke-slate-900"
                ></circle>
                <text
                  x="60"
                  y="60"
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size={String(c.value).length > 2 ? 8 : 11}
                  font-weight="700"
                  class={state === 'pruned' || state === '' ? 'fill-slate-900' : 'fill-white'}
                  aria-hidden="true">{c.value}</text
                >
              </svg>
              <p class="mt-1 text-center font-mono text-xs text-slate-700">
                <span aria-hidden="true">{m.clockMarkers[role]}</span>
                {frame.mode === 'crt' ? m.clockCaption(c) : m.inverseCaption(c)}
              </p>
            </li>
          {/each}
        </ul>
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <li>{m.legend.goal}</li>
          {#each LEGEND as role (role)}
            <li class="flex items-center gap-1.5">
              <span
                class="size-3 rounded-sm border border-slate-700 {STATE_BG[
                  /** @type {VisualState} */ (LEGEND_STATE[role])
                ]}"
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
          {m.tableTitle[tableMode]}
        </h2>
        {#if tableValues.length > 0}
          <DpTable
            values={tableValues}
            ariaLabel={m.tableAria(m.tableTitle[tableMode])}
            colHeaders={m.tableHead[tableMode]}
            stateOf={(r, col) => {
              const role = cellRole(r, col);
              return role ? CELL_STATE[role] : '';
            }}
            markerOf={(r, col) => {
              const role = cellRole(r, col);
              return role ? m.cellMarkers[role] : '';
            }}
            labelOf={(r, col) => {
              const role = cellRole(r, col);
              return m.tableCell(
                m.tableHead[tableMode][col],
                r,
                tableValues[r][col],
                role ? m.cellStates[role] : '',
              );
            }}
            speed={player.speed}
          />
        {/if}
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      {#if frame.mode === 'crt'}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.candidate}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="candidate">
              {frame.candidate}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.M}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="big-m">{frame.M}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.walked}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="walked">{frame.steps}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.solution}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="solution">
              {m.solutionValue(frame)}
            </dd>
          </div>
        </dl>
      {:else}
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.inverse}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="inverse">
              {#if frame.inverse !== null}
                {frame.inverse}
              {:else if frame.kind === 'none' || frame.kind === 'done'}
                {m.statNone}
              {:else}
                …
              {/if}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.check}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="check">
              {frame.clocks[0].value}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">
              {frame.mode === 'fermat' ? m.stats.rounds.fermat : m.stats.rounds.euclid}
            </dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="rounds">{frame.steps}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">
              {frame.mode === 'fermat' ? m.stats.multiplications : m.stats.gcd}
            </dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="extra">
              {#if frame.mode === 'fermat'}
                {frame.multiplications}
              {:else if frame.kind === 'found' || frame.kind === 'none' || frame.kind === 'done'}
                {frame.g}
              {:else}
                …
              {/if}
            </dd>
          </div>
        </dl>
      {/if}
      <CodePanel lines={CODE[frame.mode]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
