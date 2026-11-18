<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    DIGIT_PRESETS,
    MAX_LIMIT,
    MAX_TARGET,
    digitPseudocode,
    digitTrace,
  } from '$lib/algo-engine/digit-dp.js';
  import { vi as m } from '$lib/lessons/digit-dp/copy.vi.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'loose'|'tight'|'above'|'over'|''} Choice */
  /** @typedef {'source'|'target'|'branch'|'tight'|'answer'|''} Role */

  const FIRST = DIGIT_PRESETS[0];
  const DIGITS = Array.from({ length: 10 }, (_, d) => d);

  let limit = $state(FIRST.limit);
  let target = $state(FIRST.target);
  let limitDraft = $state(/** @type {number | null} */ (FIRST.limit));
  let targetDraft = $state(/** @type {number | null} */ (FIRST.target));
  let preset = $state(FIRST.key);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(digitTrace(FIRST.limit, FIRST.target));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const len = $derived(frame.digits.length);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(digitTrace(limit, target));
  }

  /** @param {string} key */
  function loadPreset(key) {
    const p = DIGIT_PRESETS.find((x) => x.key === key) ?? FIRST;
    preset = p.key;
    limit = limitDraft = p.limit;
    target = targetDraft = p.target;
    rebuild();
  }

  function commitLimit() {
    if (!wholeInRange(limitDraft, 0, MAX_LIMIT)) {
      limitDraft = limit;
      return say(m.limitError(MAX_LIMIT));
    }
    if (limitDraft === limit) return;
    limit = /** @type {number} */ (limitDraft);
    preset = '';
    rebuild();
  }

  function commitTarget() {
    if (!wholeInRange(targetDraft, 0, MAX_TARGET)) {
      targetDraft = target;
      return say(m.targetError(MAX_TARGET));
    }
    if (targetDraft === target) return;
    target = /** @type {number} */ (targetDraft);
    preset = '';
    rebuild();
  }

  /** Whether the tight prefix is still alive after `r` digits. @param {number} r */
  const tightAt = (r) => frame.tight[r];

  /** @param {number} i @returns {VisualState} */
  function numberState(i) {
    if (i === frame.i && frame.kind !== 'done') return 'active';
    if (i < frame.i || frame.kind === 'done') return tightAt(i + 1) === null ? 'pruned' : 'path';
    return '';
  }
  /** @param {number} i */
  function numberMark(i) {
    const s = numberState(i);
    return s === 'path' ? m.markers.tight : s === 'pruned' ? m.markers.over : '';
  }
  /** @param {number} i */
  function numberRole(i) {
    const s = numberState(i);
    return s === 'active'
      ? m.numberStates.current
      : s === 'path'
        ? m.numberStates.tight
        : s === 'pruned'
          ? m.numberStates.dead
          : '';
  }

  /** What digit d does at this step. @param {number} d @returns {Choice} */
  function choiceOf(d) {
    const D = frame.digits[frame.i];
    if (frame.kind === 'spread') return frame.s + d <= frame.target ? 'loose' : 'over';
    if (frame.kind === 'branch' || frame.kind === 'stay') {
      if (d > D) return 'above';
      if (frame.s + d > frame.target) return 'over';
      return d === D ? 'tight' : 'loose';
    }
    return '';
  }

  /** @type {Record<Choice, VisualState>} */
  const CHOICE_STATE = { loose: 'compare', tight: 'path', above: 'pruned', over: 'pruned', '': '' };
  /** @type {Record<Choice, string>} */
  const CHOICE_MARK = {
    loose: m.markers.target,
    tight: m.markers.tight,
    above: m.markers.over,
    over: m.markers.over,
    '': '',
  };

  /** @param {number} r @param {number} s @returns {Role} */
  function roleOf(r, s) {
    const f = frame;
    if (f.kind === 'done' && r === len && s === f.target) return 'answer';
    if (f.kind === 'spread') {
      if (r === f.i && s === f.s) return 'source';
      if (r === f.i + 1 && s >= f.s && s <= f.s + 9) return 'target';
    }
    if (f.kind === 'branch' && r === f.i + 1 && s >= f.s && s < f.s + f.digits[f.i])
      return 'branch';
    if (f.tight[r] === s && f.table[r][s] !== null) return 'tight';
    return '';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    source: 'active',
    target: 'compare',
    branch: 'compare',
    tight: 'path',
    answer: 'sorted',
    '': '',
  };
  /** @type {Record<Role, string>} */
  const ROLE_MARK = {
    source: m.markers.source,
    target: m.markers.target,
    branch: m.markers.target,
    tight: m.markers.tight,
    answer: m.markers.answer,
    '': '',
  };

  const rowHeads = $derived(Array.from({ length: len + 1 }, (_, r) => m.rowHead(r)));
  const colHeads = $derived(Array.from({ length: frame.target + 1 }, (_, s) => String(s)));

  const legend = /** @type {[VisualState, string][]} */ ([
    ['active', `${m.markers.source} ${m.legend.source}`],
    ['compare', `${m.markers.target} ${m.legend.target}`],
    ['path', `${m.markers.tight} ${m.legend.tight}`],
    ['pruned', `${m.markers.over} ${m.legend.over}`],
    ['sorted', `${m.markers.answer} ${m.legend.answer}`],
  ]);
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => e.preventDefault()}
    onkeydown={(e) => enterField(e, {})}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.limitLabel}
      <input
        type="number"
        name="limit"
        min="0"
        max={MAX_LIMIT}
        class="field w-32"
        bind:value={limitDraft}
        onchange={commitLimit}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.targetLabel}
      <input
        type="number"
        name="target"
        min="0"
        max={MAX_TARGET}
        class="field w-24"
        bind:value={targetDraft}
        onchange={commitTarget}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field max-w-full"
        value={preset}
        onchange={(e) => loadPreset(e.currentTarget.value)}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each DIGIT_PRESETS as p (p.key)}
          <option value={p.key}>{m.presets[p.key]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <div class="flex flex-wrap gap-6">
          <div class="min-w-0">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.numberTitle}
            </h2>
            <ArrayStrip
              values={frame.digits}
              ariaLabel={m.numberAria(frame.limit)}
              stateOf={numberState}
              markerOf={numberMark}
              labelOf={(i) => m.numberCell(i, frame.digits[i], numberRole(i))}
              pointers={frame.i >= 0 && frame.kind !== 'done'
                ? [{ name: 'i', index: frame.i }]
                : []}
              showIndices={false}
              speed={player.speed}
            />
          </div>
          <div class="min-w-0">
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.choiceTitle}
            </h2>
            <ArrayStrip
              values={DIGITS}
              ariaLabel={m.choiceAria}
              stateOf={(d) => CHOICE_STATE[choiceOf(d)]}
              markerOf={(d) => CHOICE_MARK[choiceOf(d)]}
              labelOf={(d) => {
                const c = choiceOf(d);
                return m.choiceCell(d, c ? m.choiceStates[c] : '');
              }}
              showIndices={false}
              speed={player.speed}
            />
          </div>
        </div>

        <h2 class="mt-4 mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableTitle}
        </h2>
        <DpTable
          values={frame.table}
          ariaLabel={m.tableAria(len, frame.target)}
          rowHeaders={rowHeads}
          colHeaders={colHeads}
          stateOf={(r, s) => ROLE_STATE[roleOf(r, s)]}
          markerOf={(r, s) => ROLE_MARK[roleOf(r, s)]}
          labelOf={(r, s) => {
            const role = roleOf(r, s);
            const v = frame.table[r][s];
            return m.cellLabel(r, s, v === null ? '' : String(v), role ? m.cellStates[role] : '');
          }}
          speed={player.speed}
        />
        <p class="mt-2 text-xs text-slate-600">{m.tableNote}</p>
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
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
          <dt class="text-xs text-slate-500">{m.stats.transitions}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="transitions">
            {frame.transitions} / {finalFrame.transitions}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.answer}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="answer">
            {frame.result ?? m.pending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.brute}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="brute">{frame.limit + 1}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.states}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="states">
            {(len + 1) * (frame.target + 1)}
          </dd>
        </div>
      </dl>
      <CodePanel lines={digitPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
