<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import UnionFindForest from '$lib/components/union-find-forest.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_OPS,
    N,
    dsuPseudocode,
    dsuTrace,
    groupsOf,
    makeOps,
  } from '$lib/algo-engine/disjoint-set-union.js';
  import { en as m } from '$lib/lessons/disjoint-set-union/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/disjoint-set-union.js').DsuOp} DsuOp */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'friends'|'chain'|'random'} Preset */

  const PRESETS = /** @type {const} */ (['friends', 'chain', 'random']);

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = makeOps('friends');
  /** @type {DsuOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  // Drafts follow the inputs as the learner types; a and b change only on a valid commit.
  let a = $state(0);
  let b = $state(4);
  /** @type {number | null} */
  let draftA = $state(0);
  /** @type {number | null} */
  let draftB = $state(4);
  let preset = $state('friends');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(dsuTrace(INITIAL_OPS));
  const frame = $derived(player.frame);
  const groups = $derived(groupsOf(frame.parent));
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

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

  /** @param {DsuOp[]} next @param {'first'|'last'|'new'} at */
  function setOps(next, at) {
    notice = { text: '', at: -1 };
    ops = next;
    const frames = dsuTrace(next);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    if (at === 'new') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  /** @param {DsuOp} op */
  function append(op) {
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    preset = '';
    setOps([...ops, op], 'new');
  }

  /** @param {DsuOp['type']} type */
  function add(type) {
    const needsB = type !== 'find';
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
    setOps(makeOps(picked, Math.random), 'last');
    // A random log is never "the" preset: going back to the placeholder lets it be picked again.
    preset = picked === 'random' ? '' : picked;
    e.currentTarget.value = preset;
  }

  /** @param {number} i @returns {{state: VisualState, marker: string}} */
  function look(i) {
    const f = frame;
    if (f.kind === 'link' && i === f.linked) return { state: 'swap', marker: m.markers.linked };
    if (f.current === i && f.kind !== 'root') return { state: 'active', marker: m.markers.current };
    if (i === f.ra || i === f.rb) return { state: 'sorted', marker: m.markers.root };
    if (f.path.includes(i)) return { state: 'visited', marker: m.markers.climbed };
    if (f.op && f.kind !== 'done') {
      if (i === f.op.a) return { state: 'frontier', marker: 'a' };
      if (i === f.op.b) return { state: 'frontier', marker: 'b' };
    }
    return { state: '', marker: '' };
  }

  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const groupChips = $derived(groups.map((g) => ({ label: m.groupText(g) })));

  const legend = [
    { s: 'active', label: `${m.markers.current} ${m.legend.current}` },
    { s: 'visited', label: `${m.markers.climbed} ${m.legend.climbed}` },
    { s: 'sorted', label: `${m.markers.root} ${m.legend.root}` },
    { s: 'swap', label: `${m.markers.linked} ${m.legend.linked}` },
    { s: 'frontier', label: `a/b ${m.legend.operand}` },
  ].map((l) => ({ ...l, cls: STATE_BG[/** @type {VisualState} */ (l.s)] }));
</script>

<LessonLayout lesson={m}>
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
      <button type="button" onclick={() => add('same')} class="btn-secondary">{m.same}</button>
      <button type="button" onclick={() => add('find')} class="btn-outline">{m.find}</button>
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

    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESETS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <UnionFindForest
          parent={frame.parent}
          ariaLabel={m.forestLabel(groups)}
          stateOf={(i) => look(i).state}
          markerOf={(i) => look(i).marker}
          onselect={pick}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each legend as l (l.s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {l.cls}"></span>{l.label}
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
          <dt class="text-xs text-slate-500">{m.stats.sets}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.sets}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.height}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.height}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.opSteps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.opSteps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.steps}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.steps}</dd>
        </div>
      </dl>
      <ChipList title={m.groupsTitle} items={groupChips} emptyText={m.groupsEmpty} limit={N} />
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={dsuPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
