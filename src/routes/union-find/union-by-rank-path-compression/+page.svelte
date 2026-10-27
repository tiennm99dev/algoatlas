<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import UnionFindForest from '$lib/components/union-find-forest.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_OPS,
    N,
    compareVariants,
    makeOps,
    rankPseudocode,
    rankTrace,
  } from '$lib/algo-engine/union-by-rank-path-compression.js';
  import { en as m } from '$lib/lessons/union-by-rank-path-compression/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/union-by-rank-path-compression.js').RankOp} RankOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'chain'|'mixed'|'random'} Preset */

  const PRESETS = /** @type {const} */ (['chain', 'mixed', 'random']);

  // A fixed first log and settings keep the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeOps('chain');
  /** @type {RankOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let rule = $state('plain');
  let compression = $state('on');
  let a = $state(0);
  let b = $state(1);
  /** @type {number | null} */
  let draftA = $state(0);
  /** @type {number | null} */
  let draftB = $state(1);
  let preset = $state('chain');
  let notice = $state({ text: '', at: -1 });

  const options = () => ({ byRank: rule === 'rank', compress: compression === 'on' });
  const player = createPlayer(rankTrace(INITIAL_OPS, { byRank: false, compress: true }));
  const frame = $derived(player.frame);
  // Depends on the log only, never on the current frame, so stepping does not recompute it.
  const compare = $derived(compareVariants(ops));
  const shownKey = $derived(
    rule === 'rank'
      ? compression === 'on'
        ? 'both'
        : 'rank'
      : compression === 'on'
        ? 'compress'
        : 'plain',
  );
  const narration = $derived(
    notice.at === player.index ? notice.text : m.describe(frame, compression === 'on'),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const valid = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < N;

  function commitA() {
    if (valid(draftA)) a = /** @type {number} */ (draftA);
    else draftA = a;
  }

  function commitB() {
    if (valid(draftB)) b = /** @type {number} */ (draftB);
    else draftB = b;
  }

  /** @param {RankOp[]} next @param {'first'|'last'|'new'} at */
  function setOps(next, at) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = rankTrace(next, options());
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    if (at === 'new') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** A setting changed: replay the same log from the start. */
  function rebuild() {
    setOps(ops, 'first');
  }

  /** @param {RankOp} op */
  function append(op) {
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    preset = '';
    setOps([...ops, op], 'new');
  }

  /** @param {RankOp['type']} type */
  function add(type) {
    const needsB = type === 'union';
    if (!valid(draftA) || (needsB && !valid(draftB))) {
      draftA = a;
      draftB = b;
      say(m.elementError);
      return;
    }
    a = /** @type {number} */ (draftA);
    if (needsB) b = /** @type {number} */ (draftB);
    append(needsB ? { type, a, b } : { type, a });
  }

  /** Clicking a node runs find on it. @param {number} i */
  function pick(i) {
    a = i;
    draftA = i;
    append({ type: 'find', a: i });
  }

  function undo() {
    if (ops.length === 0) return;
    preset = '';
    setOps(ops.slice(0, -1), 'last');
  }

  function reset() {
    if (ops.length === 0) return;
    preset = '';
    setOps([], 'first');
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {Preset} */ (e.currentTarget.value);
    setOps(makeOps(picked, Math.random), 'first');
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} i @returns {{state: VisualState, marker: string}} */
  function look(i) {
    const f = frame;
    const walking = f.kind === 'visit' || f.kind === 'climb';
    const rootNow = walking ? -1 : f.kind === 'root' || f.kind === 'compress' ? f.path.at(-1) : -1;
    if (f.kind === 'link' && i === f.linked) return { state: 'swap', marker: m.markers.linked };
    if (f.moved.includes(i)) return { state: 'swap', marker: m.markers.moved };
    if (walking && f.current === i) return { state: 'active', marker: m.markers.current };
    if (i === rootNow || i === f.ra || i === f.rb)
      return { state: 'sorted', marker: m.markers.root };
    if (f.path.includes(i)) return { state: 'visited', marker: m.markers.climbed };
    if (f.op && f.kind !== 'done') {
      if (i === f.op.a) return { state: 'frontier', marker: 'a' };
      if (i === f.op.b) return { state: 'frontier', marker: 'b' };
    }
    return { state: '', marker: '' };
  }

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));

  const legend = [
    { s: 'active', label: `${m.markers.current} ${m.legend.current}` },
    { s: 'visited', label: `${m.markers.climbed} ${m.legend.climbed}` },
    { s: 'sorted', label: `${m.markers.root} ${m.legend.root}` },
    {
      s: 'swap',
      label: `${m.markers.moved} ${m.legend.moved}, ${m.markers.linked} ${m.legend.linked}`,
    },
    { s: 'frontier', label: `a/b ${m.legend.operand}` },
  ].map((l) => ({ ...l, cls: STATE_BG[/** @type {VisualState} */ (l.s)] }));
</script>

<LessonLayout lesson={m}>
  <div class="mb-4 flex flex-wrap items-end gap-4">
    <SegmentedControl
      legend={m.ruleLabel}
      name="rule"
      options={[
        { value: 'plain', label: m.rules.plain },
        { value: 'rank', label: m.rules.rank },
      ]}
      bind:value={rule}
      onchange={rebuild}
    />
    <SegmentedControl
      legend={m.compressLabel}
      name="compression"
      options={[
        { value: 'off', label: m.compressOptions.off },
        { value: 'on', label: m.compressOptions.on },
      ]}
      bind:value={compression}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </div>

  <!-- Enter in a field submits the form, which runs union; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      add('union');
    }}
  >
    <div class="flex gap-2">
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.aLabel}
        <input
          type="number"
          name="a"
          min="0"
          max={N - 1}
          step="1"
          class="field w-20"
          bind:value={draftA}
          onchange={commitA}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.bLabel}
        <input
          type="number"
          name="b"
          min="0"
          max={N - 1}
          step="1"
          class="field w-20"
          bind:value={draftB}
          onchange={commitB}
        />
      </label>
    </div>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn-primary">{m.union}</button>
      <button type="button" onclick={() => add('find')} class="btn-secondary">{m.find}</button>
    </div>
    <!-- aria-disabled rather than disabled so keyboard focus stays on the button when the log empties. -->
    <div class="flex flex-wrap gap-2 border-l border-slate-300 pl-4">
      <button type="button" onclick={undo} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.undo}</button
      >
      <button type="button" onclick={reset} class="btn-outline" aria-disabled={ops.length === 0}
        >{m.reset}</button
      >
    </div>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <UnionFindForest
          parent={frame.parent}
          stateOf={(i) => look(i).state}
          markerOf={(i) => look(i).marker}
          noteOf={(i) =>
            rule === 'rank' && frame.parent[i] === i ? m.rankNote(frame.rank[i]) : ''}
          onselect={pick}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as l (l.s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {l.cls}"></span>{l.label}
            </li>
          {/each}
          <li>{m.legend.rank}</li>
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
          <dt class="text-xs text-slate-500">{m.stats.opSteps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.opSteps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.steps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.steps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.height}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.height}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.writes}</dd>
        </div>
      </dl>

      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
        <table class="w-full text-sm tabular-nums">
          <thead>
            <tr class="text-left text-xs text-slate-500">
              {#each m.compareHead as h, i (i)}
                <th scope="col" class="py-1 font-semibold {i ? 'text-right' : ''}">{h}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each compare as row (row.key)}
              <tr
                class="border-t border-slate-100 {row.key === shownKey ? 'bg-teal-50' : ''}"
                aria-current={row.key === shownKey ? 'true' : undefined}
              >
                <th scope="row" class="py-1 text-left font-normal">
                  {m.variants[row.key]}
                  {#if row.key === shownKey}<span class="text-xs text-teal-800">
                      {m.shownLabel}</span
                    >{/if}
                </th>
                <td class="text-right font-semibold">{row.steps}</td>
                <td class="text-right font-semibold">{row.height}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={rankPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
