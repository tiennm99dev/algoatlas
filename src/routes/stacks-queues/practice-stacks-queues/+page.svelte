<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StackQueueView from '$lib/components/stack-queue-view.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_ITEMS,
    MAX_OPS,
    MAX_VALUE,
    MIN_VALUE,
    PRESETS,
    practicePseudocode,
    practiceTrace,
  } from '$lib/algo-engine/practice-stacks-queues.js';
  import { en as m } from '$lib/lessons/practice-stacks-queues/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-stacks-queues.js').PracticeOp} PracticeOp */
  /** @typedef {import('$lib/algo-engine/practice-stacks-queues.js').PracticeProblem} PracticeProblem */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const problemOptions = /** @type {PracticeProblem[]} */ (['two-stack-queue', 'min-stack']).map(
    (v) => ({ value: v, label: m.problems[v] }),
  );
  /** @type {Record<PracticeProblem, PracticeOp['type'][]>} */
  const BUTTONS = {
    'two-stack-queue': ['enqueue', 'dequeue'],
    'min-stack': ['push', 'pop', 'get-min'],
  };

  // A fixed first log keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_OPS = PRESETS['two-stack-queue'].mixed();
  let problem = $state(/** @type {PracticeProblem} */ ('two-stack-queue'));
  /** @type {PracticeOp[]} */
  let ops = $state.raw(INITIAL_OPS);
  let value = $state(6);
  /** @type {number | null} */
  let valueDraft = $state(6);
  let preset = $state('mixed');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(practiceTrace('two-stack-queue', INITIAL_OPS));
  const frame = $derived(player.frame);
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {unknown} v */
  const valid = (v) =>
    typeof v === 'number' && Number.isInteger(v) && v >= MIN_VALUE && v <= MAX_VALUE;

  function commitValue() {
    if (valid(valueDraft)) value = /** @type {number} */ (valueDraft);
    else valueDraft = value;
  }

  /** @param {PracticeOp[]} next @param {'first'|'last'|'op'} at */
  function setOps(next, at) {
    ops = next;
    notice = { text: '', at: -1 };
    const frames = practiceTrace(problem, next);
    player.load(frames);
    if (at === 'last') player.seek(frames.length - 1);
    else if (at === 'op') player.seek(frames.findIndex((f) => f.opIndex === next.length - 1));
  }

  function changeProblem() {
    preset = 'mixed';
    setOps(PRESETS[problem].mixed(), 'first');
  }

  /** @param {PracticeOp['type']} type */
  function add(type) {
    const adding = type === 'enqueue' || type === 'push';
    if (adding) {
      if (!valid(valueDraft)) {
        valueDraft = value;
        say(m.valueError);
        return;
      }
      value = /** @type {number} */ (valueDraft);
    }
    if (ops.length >= MAX_OPS) {
      say(m.logFull);
      return;
    }
    const held =
      problem === 'two-stack-queue'
        ? finalFrame.left.length + finalFrame.right.length
        : finalFrame.left.length;
    if (adding && held >= MAX_ITEMS) {
      say(m.full);
      return;
    }
    preset = '';
    setOps([...ops, adding ? { type, value } : { type }], 'op');
  }

  /** The default button: enqueue or push. */
  function submit() {
    add(problem === 'two-stack-queue' ? 'enqueue' : 'push');
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
    const picked = e.currentTarget.value;
    const presets = /** @type {Record<string, () => PracticeOp[]>} */ (PRESETS[problem]);
    preset = picked;
    setOps(presets[picked](), 'first');
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;

  /** @param {number[]} items @param {(i: number) => VisualState} stateOf */
  const toItems = (items, stateOf) =>
    items.map((v, i) => {
      const s = stateOf(i);
      return { label: String(v), state: s, marker: MARKERS[s] ?? '' };
    });

  const leftItems = $derived(
    toItems(frame.left, (i) =>
      i === frame.left.length - 1 && (frame.kind === 'enqueue' || frame.kind === 'push-main')
        ? 'active'
        : '',
    ),
  );
  const rightItems = $derived(
    toItems(frame.right, (i) => {
      if (i !== frame.right.length - 1) return '';
      if (frame.kind === 'transfer') return 'swap';
      if (frame.kind === 'push-min') return 'active';
      return frame.problem === 'min-stack' ? 'sorted' : '';
    }),
  );

  const titles = $derived(m.stackTitles[frame.problem]);
  const chips = $derived(ops.map((op, i) => ({ label: m.opChip(op), hot: i === frame.opIndex })));
  const presetKeys = $derived(Object.keys(PRESETS[problem]));

  const legend = $derived(
    /** @type {[VisualState, string, string][]} */ (
      problem === 'two-stack-queue'
        ? [
            ['active', m.markers.active, m.legend.active],
            ['swap', m.markers.swap, m.legend.swap],
          ]
        : [
            ['active', m.markers.active, m.legend.active],
            ['sorted', m.markers.sorted, m.legend.sorted],
          ]
    ),
  );
</script>

<LessonLayout lesson={m}>
  <!-- Enter in the value field submits the form, which enqueues or pushes; the other buttons never submit. -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      submit();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={problemOptions}
      bind:value={problem}
      onchange={changeProblem}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valueLabel}
      <input
        type="number"
        name="value"
        min={MIN_VALUE}
        max={MAX_VALUE}
        step="1"
        class="field w-24"
        bind:value={valueDraft}
        onchange={commitValue}
      />
    </label>
    <div class="flex flex-wrap gap-2">
      {#each BUTTONS[problem] as type, i (type)}
        <button
          type={i === 0 ? 'submit' : 'button'}
          class={i === 0 ? 'btn-primary' : i === 1 ? 'btn-secondary' : 'btn-outline'}
          onclick={i === 0 ? undefined : () => add(type)}>{m.buttons[type]}</button
        >
      {/each}
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
        {#each presetKeys as p (p)}
          <option value={p}>{m.presets[problem][/** @type {'mixed'} */ (p)]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <div class="grid grid-cols-2 items-end gap-4">
          <div class="min-w-0">
            <h3 class="mb-1 text-xs text-slate-500">{titles[0]}</h3>
            <StackQueueView
              kind="stack"
              items={leftItems}
              ariaLabel={m.stackLabel(titles[0], frame.left)}
              capacity={MAX_ITEMS}
              speed={player.speed}
            />
          </div>
          <div class="min-w-0">
            <h3 class="mb-1 text-xs text-slate-500">{titles[1]}</h3>
            <StackQueueView
              kind="stack"
              items={rightItems}
              ariaLabel={m.stackLabel(titles[1], frame.right)}
              capacity={MAX_ITEMS}
              speed={player.speed}
            />
          </div>
        </div>
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {`${marker} ${label}`}
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
        {#if frame.problem === 'two-stack-queue'}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.queueOps}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="queue-ops">{frame.done}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.transfers}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="transfers">
              {frame.transfers}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.stackOps}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="stack-ops">
              {frame.stackOps}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.perOp}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="per-op">
              {frame.done ? (frame.stackOps / frame.done).toFixed(2) : m.none}
            </dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.size}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="size">
              {frame.left.length}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.min}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="min">
              {frame.right.length ? frame.right[frame.right.length - 1] : m.none}
            </dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.stackOps}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="stack-ops">
              {frame.stackOps}
            </dd>
          </div>
        {/if}
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="result">
            {frame.result ?? m.none}
          </dd>
        </div>
      </dl>
      <ChipList
        title={m.opsTitle}
        items={chips}
        emptyText={m.opsEmpty}
        limit={MAX_OPS}
        hotLabel={m.opsHotLabel}
      />
      <CodePanel lines={practicePseudocode[frame.problem]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
