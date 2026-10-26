<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    DUMMY,
    MAX_LEN,
    NIL,
    layoutPractice,
    parseList,
    practicePseudocode,
    practiceTrace,
    randomSorted,
  } from '$lib/algo-engine/practice-linked-lists.js';
  import { en as m } from '$lib/lessons/practice-linked-lists/copy.en.js';
  import PointerDiagram from '$lib/lessons/singly-linked-lists/pointer-diagram.svelte';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-linked-lists.js').Problem} Problem */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramNode} DiagramNode */
  /** @typedef {import('$lib/lessons/singly-linked-lists/diagram-types.js').DiagramPointer} DiagramPointer */

  const PROBLEMS = /** @type {const} */ (['merge', 'middle', 'nth']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_A = [2, 5, 9];
  const INITIAL_B = [1, 6, 7, 12];

  let problem = $state(/** @type {Problem} */ ('merge'));
  let listA = $state(INITIAL_A);
  let listB = $state(INITIAL_B);
  let textA = $state(INITIAL_A.join(', '));
  let textB = $state(INITIAL_B.join(', '));
  let n = $state(2);
  /** @type {number | null} */
  let nDraft = $state(2);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(practiceTrace('merge', { a: INITIAL_A, b: INITIAL_B, n: 2 }));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame, n));

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(practiceTrace(problem, { a: listA, b: listB, n }));
  }

  function changeProblem() {
    if (problem === 'merge' && listA.some((x, i) => i > 0 && x < listA[i - 1])) {
      listA = listA.slice().sort((x, y) => x - y);
      textA = listA.join(', ');
      rebuild();
      say(m.sortedForMerge);
      return;
    }
    rebuild();
  }

  /** @param {'a'|'b'} which */
  function commitList(which) {
    const parsed = parseList(which === 'a' ? textA : textB, problem === 'merge');
    if ('error' in parsed) {
      textA = listA.join(', ');
      textB = listB.join(', ');
      say(m.listErrors[parsed.error]);
      return;
    }
    if (which === 'a') {
      listA = parsed.values;
      textA = parsed.values.join(', ');
      if (n > listA.length) n = nDraft = listA.length;
    } else {
      listB = parsed.values;
      textB = parsed.values.join(', ');
    }
    rebuild();
  }

  function commitN() {
    const x = nDraft;
    if (x === null || !Number.isInteger(x) || x < 1 || x > listA.length) {
      nDraft = n;
      say(m.nError(listA.length));
      return;
    }
    n = x;
    rebuild();
  }

  function newLists() {
    const lenA = 3 + Math.floor(Math.random() * (MAX_LEN - 2));
    listA =
      problem === 'merge'
        ? randomSorted(lenA, Math.random)
        : Array.from({ length: lenA }, () => Math.floor(Math.random() * 100));
    listB = randomSorted(2 + Math.floor(Math.random() * (MAX_LEN - 1)), Math.random);
    textA = listA.join(', ');
    textB = listB.join(', ');
    n = nDraft = 1 + Math.floor(Math.random() * listA.length);
    rebuild();
  }

  const cells = $derived(layoutPractice(frame));
  /** @param {number} id */
  const after = (id) => (id === DUMMY ? frame.dummyNext : id === NIL ? NIL : frame.next[id]);
  const linked = $derived(frame.wrote === NIL ? NIL : after(frame.wrote));

  /** @param {number} id @param {number} row @returns {VisualState} */
  function stateOf(id, row) {
    if (id === DUMMY) return 'visited';
    if (frame.problem === 'merge') {
      if (id === linked && frame.kind !== 'done') return 'active';
      return row === 1 ? 'sorted' : '';
    }
    if (id === frame.removed) return 'swap';
    if (id === frame.slow)
      return frame.kind === 'done' && frame.problem === 'middle' ? 'path' : 'frontier';
    return '';
  }

  /** @type {Partial<Record<VisualState, string>>} */
  const MARKERS = m.markers;
  /** @type {Partial<Record<VisualState, string>>} */
  const STATES = m.states;

  const diagramNodes = $derived(
    cells.map(({ id, col, row }) => {
      const s = stateOf(id, row);
      const label = id === DUMMY ? 'dummy' : String(frame.values[id]);
      const nextId = after(id);
      /** @type {DiagramNode} */
      const node = {
        id,
        label,
        col,
        row,
        next: nextId === NIL ? null : nextId,
        state: s,
        marker: MARKERS[s] ?? '',
        title: m.nodeTitle(label, STATES[s] ?? ''),
        hotNext: id === frame.wrote,
        stale: id === frame.removed,
      };
      return node;
    }),
  );

  /** @param {number} id */
  const ref = (id) => (id === NIL ? null : id);

  const pointers = $derived.by(() => {
    /** @type {DiagramPointer[]} */
    const out = [];
    if (frame.problem === 'merge') {
      if (frame.kind !== 'done') {
        out.push({ name: 'a', id: ref(frame.a) });
        out.push({ name: 'b', id: ref(frame.b) });
      }
      out.push({ name: 'tail', id: ref(frame.tail) });
    } else {
      out.push({ name: 'slow', id: ref(frame.slow) });
      out.push({ name: 'fast', id: ref(frame.fast) });
    }
    return out;
  });

  const legend = $derived(
    /** @type {[VisualState, string, string][]} */ (
      problem === 'merge'
        ? [
            ['visited', '', m.legend.visited],
            ['active', m.markers.active, m.legend.active],
            ['sorted', '', m.legend.sorted],
          ]
        : problem === 'middle'
          ? [
              ['frontier', '', m.legend.frontier],
              ['path', m.markers.path, m.legend.path],
            ]
          : [
              ['visited', '', m.legend.visited],
              ['frontier', '', m.legend.frontier],
              ['swap', m.markers.swap, m.legend.swap],
            ]
    ),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitList('a');
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((p) => ({ value: p, label: m.problems[p] }))}
      bind:value={problem}
      onchange={changeProblem}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {problem === 'merge' ? m.listASortedLabel : m.listLabelSingle}
      <input
        type="text"
        name="list-a"
        class="field w-56 max-w-full"
        bind:value={textA}
        onchange={() => commitList('a')}
      />
    </label>
    {#if problem === 'merge'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.listBLabel}
        <input
          type="text"
          name="list-b"
          class="field w-56 max-w-full"
          bind:value={textB}
          onchange={() => commitList('b')}
        />
      </label>
    {/if}
    {#if problem === 'nth'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.nLabel}
        <input
          type="number"
          name="n"
          min="1"
          max={listA.length}
          step="1"
          class="field w-24"
          bind:value={nDraft}
          onchange={commitN}
        />
      </label>
    {/if}
    <button type="button" class="btn-secondary" onclick={newLists}>{m.newLists}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <PointerDiagram
          nodes={diagramNodes}
          {pointers}
          ariaLabel={m.diagramLabel(frame)}
          nullLabel={m.nullLabel}
          scrollLabel={m.scroller}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker ? `${marker} ${label}` : label}
            </li>
          {/each}
          {#if problem !== 'middle'}
            <li class="flex items-center gap-1.5">
              <span class="h-0.5 w-4 bg-teal-700"></span>
              {m.legend.hot}
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
          <dt class="text-xs text-slate-500">{m.stats.comparisons}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="comparisons">
            {frame.problem === 'merge' ? frame.comparisons : '–'}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.moves}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="moves">{frame.moves}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.writes}</dt>
          <dd class="text-2xl font-bold tabular-nums" data-testid="writes">{frame.writes}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.result}</dt>
          <dd class="text-lg font-bold break-words" data-testid="answer">{m.answer(frame)}</dd>
        </div>
      </dl>
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
