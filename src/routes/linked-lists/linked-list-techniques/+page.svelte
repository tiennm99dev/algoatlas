<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_N,
    NIL,
    parseValues,
    randomValues,
    techniquePseudocode,
    techniqueTrace,
    walkValues,
  } from '$lib/algo-engine/linked-list-techniques.js';
  import { en as m } from '$lib/lessons/linked-list-techniques/copy.en.js';
  import PointerDiagram from '$lib/lessons/singly-linked-lists/pointer-diagram.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/linked-list-techniques.js').Technique} Technique */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramNode} DiagramNode */
  /** @typedef {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramPointer} DiagramPointer */

  const ALGOS = /** @type {const} */ (['floyd', 'reverse']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = [3, 8, 5, 1, 9, 6, 2];
  const INITIAL_CYCLE = 2;

  let algo = $state(/** @type {Technique} */ ('floyd'));
  let values = $state(INITIAL);
  let valuesText = $state(INITIAL.join(', '));
  let cycleTo = $state(INITIAL_CYCLE);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(techniqueTrace('floyd', INITIAL, INITIAL_CYCLE));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const cyclic = $derived(algo === 'floyd' && cycleTo !== NIL);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(techniqueTrace(algo, values, algo === 'floyd' ? cycleTo : NIL));
  }

  function commitValues() {
    const parsed = parseValues(valuesText);
    if ('error' in parsed) {
      valuesText = values.join(', ');
      say(m.valueErrors[parsed.error]);
      return;
    }
    valuesText = parsed.values.join(', ');
    // Enter fires change and then submit; an unchanged list must not rebuild and wipe a notice.
    if (parsed.values.join(',') === values.join(',')) return;
    values = parsed.values;
    if (cycleTo >= values.length) cycleTo = values.length - 1;
    rebuild();
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function pickCycle(e) {
    cycleTo = Number(e.currentTarget.value);
    rebuild();
  }

  /** @param {number} slot */
  function pickNode(slot) {
    cycleTo = slot;
    rebuild();
  }

  function newList() {
    const n = 4 + Math.floor(Math.random() * (MAX_N - 3));
    values = randomValues(n, Math.random);
    valuesText = values.join(', ');
    cycleTo = algo === 'floyd' ? Math.floor(Math.random() * (n + 1)) - 1 : cycleTo;
    if (cycleTo >= n) cycleTo = n - 1;
    rebuild();
  }

  /** @param {number} slot @returns {VisualState} */
  function stateOf(slot) {
    if (frame.algo === 'reverse') {
      if (slot === frame.curr) return 'active';
      if (frame.kind !== 'done' && frame.prev !== NIL && slot <= frame.prev) return 'visited';
      return '';
    }
    if (slot === frame.entry) return 'path';
    if (slot === frame.met) return 'sorted';
    return cyclic && slot >= cycleTo ? 'frontier' : '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;
  /** @type {Partial<Record<VisualState, string>>} */
  const STATES = m.states;

  const diagramNodes = $derived(
    frame.values.map((value, slot) => {
      const s = stateOf(slot);
      /** @type {DiagramNode} */
      const node = {
        id: slot,
        label: String(value),
        col: slot,
        row: 0,
        next: frame.next[slot] === NIL ? null : frame.next[slot],
        state: s,
        marker: MARKERS[s] ?? '',
        title: m.nodeTitle(slot, value, STATES[s] ?? ''),
        hotNext: slot === frame.flipped,
      };
      return node;
    }),
  );

  /** @param {number} slot */
  const ref = (slot) => (slot < 0 ? null : slot);

  const pointers = $derived.by(() => {
    /** @type {DiagramPointer[]} */
    const out = [{ name: 'head', id: ref(frame.head), hot: frame.kind === 'done' }];
    if (frame.algo === 'reverse') {
      out.push({ name: 'prev', id: ref(frame.prev) });
      out.push({ name: 'curr', id: ref(frame.curr) });
      if (frame.nxt !== -2 && frame.kind !== 'done') out.push({ name: 'next', id: ref(frame.nxt) });
    } else {
      out.push({ name: 'slow', id: ref(frame.slow) });
      out.push({ name: 'fast', id: ref(frame.fast) });
    }
    return out;
  });

  const stats = $derived(m.stats[frame.algo]);
  const legend = $derived(
    /** @type {[VisualState, string, string][]} */ (
      algo === 'reverse'
        ? [
            ['active', '', m.legend.active],
            ['visited', '', m.legend.visited],
          ]
        : [
            ['frontier', '', m.legend.frontier],
            ['sorted', m.markers.sorted, m.legend.sorted],
            ['path', m.markers.path, m.legend.path],
          ]
    ),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitValues();
    }}
  >
    <SegmentedControl
      legend={m.algoLabel}
      name="algo"
      options={ALGOS.map((a) => ({ value: a, label: m.algos[a] }))}
      bind:value={algo}
      onchange={rebuild}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.valuesLabel}
      <input
        type="text"
        name="values"
        class="field w-64 max-w-full"
        bind:value={valuesText}
        onchange={commitValues}
      />
    </label>
    {#if algo === 'floyd'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.cycleLabel}
        <select name="cycle" class="field" value={cycleTo} onchange={pickCycle}>
          <option value={NIL}>{m.noCycle}</option>
          {#each values as value, i (i)}
            <option value={i}>{m.cycleOption(i, value)}</option>
          {/each}
        </select>
      </label>
    {/if}
    <button type="button" class="btn-secondary" onclick={newList}>{m.newList}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <PointerDiagram
          nodes={diagramNodes}
          {pointers}
          ariaLabel={frame.algo === 'reverse'
            ? m.reverseLabel(
                walkValues({ ...frame, head: frame.prev }),
                walkValues({ ...frame, head: frame.curr }),
              )
            : m.listLabel(frame.values, cyclic, cycleTo)}
          nullLabel={m.nullLabel}
          scrollLabel={m.scroller}
          onselect={algo === 'floyd' ? pickNode : null}
          selected={algo === 'floyd' ? cycleTo : null}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker ? `${marker} ${label}` : label}
            </li>
          {/each}
          {#if algo === 'reverse'}
            <li class="flex items-center gap-1.5">
              <span class="h-0.5 w-4 bg-teal-700"></span>
              {m.legend.hot}
            </li>
          {:else}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border-2 border-teal-700 bg-white"></span>
              {m.legend.target}
            </li>
          {/if}
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
          <dt class="text-xs text-slate-500">{stats.steps}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="steps">{frame.steps}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{stats.moves}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="moves">{frame.moves}</dd>
        </div>
        {#if algo === 'floyd'}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.mu}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="mu">
              {cyclic ? cycleTo : '–'}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.lambda}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="lambda">
              {cyclic ? values.length - cycleTo : '–'}
            </dd>
          </div>
        {/if}
      </dl>
      <CodePanel lines={techniquePseudocode[frame.algo]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
