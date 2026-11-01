<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_CANDIDATE,
    MAX_CANDIDATES,
    MAX_SIDE,
    MAX_TOTAL,
    MAX_WORD,
    SUM_PRESETS,
    WORD_PRESETS,
    parseCandidates,
    parseGrid,
    parseTotal,
    parseWord,
    sumPseudocode,
    sumTrace,
    wordPseudocode,
    wordTrace,
  } from '$lib/algo-engine/practice-backtracking.js';
  import { en as m } from '$lib/lessons/practice-backtracking/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-backtracking.js').SumNode} SumNode */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'word'|'sum'} Problem */
  /** @typedef {'now'|'path'|'wrong'|'used'|'back'|'found'|''} Role */

  const PROBLEMS = /** @type {Problem[]} */ (['word', 'sum']);
  const FIRST_WORD = WORD_PRESETS[0];
  const FIRST_SUM = SUM_PRESETS[0];
  /** @param {string[]} rows */
  const toGrid = (rows) => rows.map((row) => [...row]);
  const START_GRID = toGrid(FIRST_WORD.rows);

  let problem = $state(/** @type {Problem} */ ('word'));
  let grid = $state(START_GRID);
  let word = $state(FIRST_WORD.word);
  let wordPreset = $state(FIRST_WORD.key);
  let gridText = $state(FIRST_WORD.rows.join(' '));
  let wordText = $state(FIRST_WORD.word);
  let candidates = $state(FIRST_SUM.candidates);
  let total = $state(FIRST_SUM.total);
  let sumPreset = $state(FIRST_SUM.key);
  let candidatesText = $state(FIRST_SUM.candidates.join(' '));
  let totalText = $state(String(FIRST_SUM.total));
  let notice = $state({ text: '', at: -1 });

  const wordPlayer = createPlayer(wordTrace(START_GRID, FIRST_WORD.word));
  const sumPlayer = createPlayer(sumTrace(FIRST_SUM.candidates, FIRST_SUM.total));
  const player = $derived(problem === 'word' ? wordPlayer : sumPlayer);
  const wf = $derived(wordPlayer.frame);
  const sf = $derived(sumPlayer.frame);
  const description = $derived(problem === 'word' ? m.describeWord(wf) : m.describeSum(sf));
  const narration = $derived(notice.at === player.index ? notice.text : description);

  /** @param {string} text */
  function refuse(text) {
    notice = { text, at: player.index };
  }

  function rebuildWord() {
    notice = { text: '', at: -1 };
    wordPlayer.load(wordTrace($state.snapshot(grid), word));
  }

  function rebuildSum() {
    notice = { text: '', at: -1 };
    sumPlayer.load(sumTrace($state.snapshot(candidates), total));
  }

  function changeProblem() {
    wordPlayer.pause();
    sumPlayer.pause();
    notice = { text: '', at: -1 };
  }

  /** @param {string} key */
  function loadWord(key) {
    const p = WORD_PRESETS.find((x) => x.key === key) ?? FIRST_WORD;
    wordPreset = p.key;
    grid = toGrid(p.rows);
    word = p.word;
    gridText = p.rows.join(' ');
    wordText = p.word;
    rebuildWord();
  }

  /** @param {string} key */
  function loadSum(key) {
    const p = SUM_PRESETS.find((x) => x.key === key) ?? FIRST_SUM;
    sumPreset = p.key;
    candidates = p.candidates;
    total = p.total;
    candidatesText = p.candidates.join(' ');
    totalText = String(p.total);
    rebuildSum();
  }

  const rowsText = () => grid.map((row) => row.join('')).join(' ');

  function commitGrid() {
    const next = parseGrid(gridText);
    if (next === null) {
      gridText = rowsText();
      refuse(m.gridError(MAX_SIDE));
      return;
    }
    const before = rowsText();
    grid = next;
    gridText = rowsText();
    if (gridText === before) return;
    wordPreset = '';
    rebuildWord();
  }

  function commitWord() {
    const next = parseWord(wordText);
    if (next === null) {
      wordText = word;
      refuse(m.wordError(MAX_WORD));
      return;
    }
    wordText = next;
    if (next === word) return;
    word = next;
    wordPreset = '';
    rebuildWord();
  }

  function commitCandidates() {
    const next = parseCandidates(candidatesText);
    if (next === null) {
      candidatesText = candidates.join(' ');
      refuse(m.candidatesError(MAX_CANDIDATES, MAX_CANDIDATE));
      return;
    }
    candidatesText = next.join(' ');
    if (next.join() === candidates.join()) return;
    candidates = next;
    sumPreset = '';
    rebuildSum();
  }

  function commitTotal() {
    const next = parseTotal(totalText);
    if (next === null) {
      totalText = String(total);
      refuse(m.totalError(MAX_TOTAL));
      return;
    }
    totalText = String(next);
    if (next === total) return;
    total = next;
    sumPreset = '';
    rebuildSum();
  }

  /** @param {number} r @param {number} c */
  function seekCell(r, c) {
    const at = wordPlayer.frames.findIndex((f) => f.r === r && f.c === c);
    if (at < 0) {
      refuse(m.neverChecked);
      return;
    }
    wordPlayer.pause();
    wordPlayer.seek(at);
  }

  /** @param {string | number} id */
  function seekNode(id) {
    const at = sumPlayer.frames.findIndex((f) => f.nodes.some((n) => n.id === id));
    if (at < 0) return;
    sumPlayer.pause();
    sumPlayer.seek(at);
  }

  /** Each path cell's place in the path, by `r-c`. */
  const places = $derived(new Map(wf.path.map(([r, c], i) => [`${r}-${c}`, i])));

  /** @param {number} r @param {number} c @returns {Role} */
  function roleOf(r, c) {
    const here = wf.r === r && wf.c === c;
    if (places.has(`${r}-${c}`)) {
      if (wf.found) return 'found';
      if (wf.kind === 'used' && here) return 'used';
      return here ? 'now' : 'path';
    }
    if (!here) return '';
    if (wf.kind === 'wrong') return 'wrong';
    return wf.kind === 'retreat' ? 'back' : 'now';
  }

  /** @type {Record<Role, VisualState>} */
  const ROLE_STATE = {
    now: 'active',
    path: 'path',
    wrong: 'compare',
    used: 'compare',
    back: 'visited',
    found: 'sorted',
    '': '',
  };

  /** @param {number} r @param {number} c */
  function markOf(r, c) {
    const role = roleOf(r, c);
    if (role === 'wrong' || role === 'used' || role === 'back') return m.marks[role];
    const place = places.get(`${r}-${c}`);
    return place === undefined ? '' : String(place + 1);
  }

  /** @param {number} r @param {number} c */
  function cellLabel(r, c) {
    const role = roleOf(r, c);
    return m.gridCell(r, c, wf.grid[r][c], role ? m.cellStates[role] : '');
  }

  const wordResult = $derived.by(() => {
    if (wf.found) return m.wordResults.found;
    if (wf.kind !== 'done') return m.wordResults.searching;
    return wf.cutoff ? m.wordResults.cutoff : m.wordResults.absent;
  });
  const headers = (/** @type {number} */ n) => Array.from({ length: n }, (_, k) => String(k));

  /** @param {SumNode[]} nodes @param {number} current @returns {TreeNode[]} */
  function forest(nodes, current) {
    // A node's id is its index, so the array finds a parent directly.
    /** @type {(TreeNode & {children: TreeNode[]})[]} */
    const built = nodes.map((n) => {
      /** @type {VisualState} */
      let state = 'visited';
      if (n.id === current) state = 'active';
      else if (n.hit) state = 'sorted';
      else if (n.open) state = 'path';
      return {
        id: n.id,
        label: String(n.remaining),
        children: [],
        state,
        marker: n.hit ? m.hitMark : '',
        edgeLabel: n.parent < 0 ? '' : `+${n.picked}`,
      };
    });
    for (const n of nodes) built[n.parent]?.children.push(built[n.id]);
    return built.slice(0, 1);
  }

  const roots = $derived(forest(sf.nodes, sf.current));
  const nodeById = $derived(new Map(sf.nodes.map((n) => [n.id, n])));

  /** @param {number} v */
  const timesOf = (v) => sf.path.filter((x) => x === v).length;

  const wordLegend = /** @type {[VisualState, string][]} */ ([
    ['active', m.wordLegend.now],
    ['path', m.wordLegend.path],
    ['compare', m.wordLegend.wrong],
    ['visited', m.wordLegend.back],
    ['sorted', m.wordLegend.found],
  ]);
  const sumLegend = /** @type {[VisualState, string][]} */ ([
    ['active', m.sumLegend.active],
    ['path', m.sumLegend.open],
    ['visited', m.sumLegend.finished],
    ['sorted', `${m.hitMark} ${m.sumLegend.hit}`],
  ]);
  const legend = $derived(problem === 'word' ? wordLegend : sumLegend);
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      if (problem === 'word') {
        commitGrid();
        commitWord();
      } else {
        commitCandidates();
        commitTotal();
      }
    }}
  >
    <SegmentedControl
      legend={m.modeLabel}
      name="problem"
      options={PROBLEMS.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={problem}
      onchange={changeProblem}
    />
    {#if problem === 'word'}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.gridLabel}
        <input
          type="text"
          name="grid"
          autocapitalize="characters"
          class="field w-48 max-w-full font-mono"
          bind:value={gridText}
          onchange={commitGrid}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.wordLabel}
        <input
          type="text"
          name="word"
          autocapitalize="characters"
          class="field w-36 font-mono"
          bind:value={wordText}
          onchange={commitWord}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select
          name="word-preset"
          class="field"
          value={wordPreset}
          onchange={(e) => loadWord(e.currentTarget.value)}
        >
          {#if wordPreset === ''}<option value="" disabled>—</option>{/if}
          {#each WORD_PRESETS as p (p.key)}
            <option value={p.key}>{m.wordPresets[p.key]}</option>
          {/each}
        </select>
      </label>
    {:else}
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.candidatesLabel}
        <input
          type="text"
          name="candidates"
          class="field w-36 font-mono"
          bind:value={candidatesText}
          onchange={commitCandidates}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.totalLabel}
        <input
          type="text"
          inputmode="numeric"
          name="total"
          class="field w-20 font-mono"
          bind:value={totalText}
          onchange={commitTotal}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.presetLabel}
        <select
          name="sum-preset"
          class="field"
          value={sumPreset}
          onchange={(e) => loadSum(e.currentTarget.value)}
        >
          {#if sumPreset === ''}<option value="" disabled>—</option>{/if}
          {#each SUM_PRESETS as p (p.key)}
            <option value={p.key}>{m.sumPresets[p.key]}</option>
          {/each}
        </select>
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        {#if problem === 'word'}
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.wordStripTitle}
          </h2>
          <ArrayStrip
            values={[...wf.word]}
            ariaLabel={m.wordStripAria}
            stateOf={(i) => (i < wf.path.length ? (wf.found ? 'sorted' : 'path') : '')}
            markerOf={(i) => (i < wf.path.length ? m.matchMark : '')}
            labelOf={(i) => m.wordCell(i, wf.word[i], i < wf.path.length)}
            pointers={wf.kind === 'done' || wf.found ? [] : [{ name: m.wordPointer, index: wf.k }]}
            speed={player.speed}
          />
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.gridTitle}
          </h2>
          <DpTable
            values={wf.grid}
            ariaLabel={m.gridAria(wf.grid.length, wf.grid[0].length)}
            rowHeaders={headers(wf.grid.length)}
            colHeaders={headers(wf.grid[0].length)}
            stateOf={(r, c) => ROLE_STATE[roleOf(r, c)]}
            markerOf={markOf}
            labelOf={cellLabel}
            onselect={seekCell}
            speed={player.speed}
          />
          <p class="text-xs text-slate-600">{m.gridNote}</p>
        {:else}
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.sumTitle}
          </h2>
          <ArrayStrip
            values={sf.candidates}
            ariaLabel={m.sumAria}
            stateOf={(i) => (i === sf.at ? 'active' : timesOf(sf.candidates[i]) ? 'path' : '')}
            markerOf={(i) => {
              const times = timesOf(sf.candidates[i]);
              return times ? `×${times}` : '';
            }}
            labelOf={(i) => m.sumCell(i, sf.candidates[i], timesOf(sf.candidates[i]))}
            speed={player.speed}
          />
          <h2 class="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.treeTitle}
          </h2>
          <TreeView
            {roots}
            ariaLabel={m.treeAria}
            labelOf={(node) => {
              const n = nodeById.get(/** @type {number} */ (node.id));
              return n ? m.nodeLabel(n) : node.label;
            }}
            onselect={seekNode}
            selected={sf.current < 0 ? null : sf.current}
            speed={player.speed}
          />
          <p class="text-xs text-slate-600">{m.treeNote}</p>
        {/if}
        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
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
        {#if problem === 'word'}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.checked}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="checked">{wf.checked}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.retreats}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="retreats">{wf.retreats}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.matched}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="matched">
              {wf.path.length} / {wf.word.length}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.result}</dt>
            <dd class="text-lg font-bold" data-testid="result">{wordResult}</dd>
          </div>
        {:else}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.solutions}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="solutions">
              {sf.solutions.length}
            </dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="calls">{sf.calls}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.remaining}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="remaining">{sf.remaining}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.stops}</dt>
            <dd class="text-2xl font-bold tabular-nums" data-testid="stops">{sf.stops}</dd>
          </div>
        {/if}
      </dl>
      {#if problem === 'sum'}
        <ChipList
          title={m.pathTitle}
          emptyText={m.pathEmpty}
          items={sf.path.map((v) => ({ label: String(v) }))}
        />
        <ChipList
          title={m.solutionsTitle}
          emptyText={m.solutionsEmpty}
          items={sf.solutions.map((s) => ({ label: m.solution(s) }))}
        />
      {/if}
      <CodePanel
        lines={problem === 'word' ? wordPseudocode : sumPseudocode}
        active={problem === 'word' ? wf.lines : sf.lines}
      />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      {#key problem}
        <StepControls {player} />
      {/key}
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
