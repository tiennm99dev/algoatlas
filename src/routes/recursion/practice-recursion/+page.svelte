<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT } from '$lib/components/visual-state.js';
  import {
    MAX_DISKS,
    hanoiCalls,
    hanoiTrace,
    parseItems,
    practiceRecursionPseudocode,
    subsetCalls,
    subsetsTrace,
  } from '$lib/algo-engine/practice-recursion.js';
  import { en as m } from '$lib/lessons/practice-recursion/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-recursion.js').RecursionProblem} RecursionProblem */
  /** @typedef {import('$lib/algo-engine/practice-recursion.js').CallStatus} CallStatus */
  /** @typedef {import('$lib/algo-engine/practice-recursion.js').HanoiFrame} HanoiFrame */
  /** @typedef {import('$lib/algo-engine/practice-recursion.js').SubsetFrame} SubsetFrame */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const PROBLEMS = /** @type {RecursionProblem[]} */ (['hanoi', 'subsets']);

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL_DISKS = 3;
  const INITIAL_ITEMS = ['a', 'b', 'c'];
  let problem = $state(/** @type {RecursionProblem} */ ('hanoi'));
  let disks = $state(INITIAL_DISKS);
  /** @type {number | null} */
  let disksDraft = $state(INITIAL_DISKS);
  let items = $state.raw(INITIAL_ITEMS);
  let itemsText = $state(INITIAL_ITEMS.join(', '));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(
    /** @type {(HanoiFrame | SubsetFrame)[]} */ (hanoiTrace(INITIAL_DISKS)),
  );
  const frame = $derived(player.frame);
  const hanoi = $derived('pegs' in frame ? frame : null);
  const subsets = $derived('pegs' in frame ? null : frame);

  const hCalls = $derived(hanoiCalls(disks));
  const sCalls = $derived(subsetCalls(items.length));

  const narration = $derived(
    notice.at === player.index
      ? notice.text
      : hanoi
        ? m.describeHanoi(hanoi, hCalls)
        : m.describeSubsets(/** @type {SubsetFrame} */ (subsets), items),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(problem === 'hanoi' ? hanoiTrace(disks) : subsetsTrace(items.length));
  }

  function commitDisks() {
    const v = disksDraft;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > MAX_DISKS) {
      disksDraft = disks;
      say(m.disksError(MAX_DISKS));
      return;
    }
    disks = v;
    rebuild();
  }

  function commitItems() {
    const parsed = parseItems(itemsText);
    if ('error' in parsed) {
      itemsText = items.join(', ');
      say(m.itemErrors[parsed.error]);
      return;
    }
    items = parsed.items;
    itemsText = items.join(', ');
    rebuild();
  }

  /** @type {Record<CallStatus, VisualState>} */
  const CALL_STATE = { '': '', active: 'active', waiting: 'frontier', done: 'visited' };
  /** @type {Record<CallStatus, string>} */
  const CALL_MARK = {
    '': '',
    active: m.markers.active,
    waiting: m.markers.waiting,
    done: m.markers.done,
  };

  /**
   * Builds the call tree from a static parent list.
   * @param {{id: number, parent: number|null}[]} calls
   * @param {(id: number) => Omit<TreeNode, 'id'|'children'>} nodeOf
   */
  function buildTree(calls, nodeOf) {
    /** @type {Record<number, TreeNode & {children: TreeNode[]}>} */
    const byId = {};
    /** @type {TreeNode[]} */
    const roots = [];
    for (const c of calls) {
      const node = { id: c.id, ...nodeOf(c.id), children: /** @type {TreeNode[]} */ ([]) };
      byId[c.id] = node;
      if (c.parent === null) roots.push(node);
      else byId[c.parent].children.push(node);
    }
    return roots;
  }

  /** @param {number} id */
  const statusOf = (id) => frame.status[id] ?? '';

  /** Leaves of the subset tree are outputs; a finished leaf gets its own colour. */
  /** @param {number} id @returns {{state: VisualState, marker: string}} */
  function look(id) {
    const s = statusOf(id);
    if (!hanoi && s === 'done' && sCalls[id].i === items.length) {
      return { state: 'sorted', marker: m.markers.output };
    }
    return { state: CALL_STATE[s], marker: CALL_MARK[s] };
  }

  const roots = $derived(
    hanoi
      ? buildTree(hCalls, (id) => ({
          label: String(hCalls[id].n),
          note: `${m.pegs[hCalls[id].from]}→${m.pegs[hCalls[id].to]}`,
          ...look(id),
        }))
      : buildTree(sCalls, (id) => {
          const c = sCalls[id];
          const label = c.chosen.map((i) => items[i]).join('') || '∅';
          const item = c.branch ? items[c.i - 1] : '';
          return {
            label,
            edgeLabel: c.branch === 'in' ? `+${item}` : c.branch === 'out' ? `−${item}` : '',
            ...look(id),
          };
        }),
  );

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const id = Number(node.id);
    const name = hanoi
      ? m.hanoiName(hCalls[id])
      : m.subsetName(sCalls[id].i, sCalls[id].chosen, items);
    return `${name}, ${m.statusText(statusOf(id))}`;
  }

  const finished = $derived(frame.status.filter((s) => s === 'done').length);

  const stackChips = $derived.by(() => {
    const ids = frame.status
      .map((s, id) => ({ s, id }))
      .filter(({ s }) => s === 'active' || s === 'waiting')
      .map(({ id }) => id);
    // Ids are in call order, and a call on the stack was made before every call above it.
    return ids.map((id) => ({
      label: hanoi ? m.hanoiName(hCalls[id]) : m.subsetName(sCalls[id].i, sCalls[id].chosen, items),
      hot: statusOf(id) === 'active',
    }));
  });

  const outputChips = $derived(
    subsets
      ? subsets.outputs.map((o, i, all) => ({
          label: m.setText(o, items),
          hot: i === all.length - 1 && subsets.kind === 'output',
        }))
      : [],
  );

  // Board geometry: three pegs, room for MAX_DISKS disks.
  const W = 360;
  const DH = 16;
  const BASE = 20 + (MAX_DISKS + 1) * DH;
  /** @param {number} p */
  const pegX = (p) => 60 + p * 120;
  /** @param {number} disk */
  const diskW = (disk) => 20 + disk * 14;

  const moved = $derived(hanoi?.kind === 'move' ? (hanoi.move?.disk ?? 0) : 0);
  const running = $derived(hanoi && hanoi.call >= 0 ? hCalls[hanoi.call] : null);
  /** @param {number} p */
  function roleOf(p) {
    if (!running) return '';
    if (p === running.from) return m.roles.from;
    if (p === running.to) return m.roles.to;
    return m.roles.via;
  }

  /** @param {number} i @returns {'taken'|'left'|'deciding'|''} */
  function itemKind(i) {
    if (!subsets || subsets.i < 0) return '';
    if (i < subsets.i) return subsets.chosen.includes(i) ? 'taken' : 'left';
    return i === subsets.i ? 'deciding' : '';
  }
  /** @type {Record<string, VisualState>} */
  const ITEM_STATE = { taken: 'sorted', left: 'visited', deciding: 'active', '': '' };

  const treeLegend = $derived(
    /** @type {[VisualState, string][]} */ ([
      ['', m.legend.idle],
      ['active', `${m.markers.active} ${m.legend.active}`],
      ['frontier', `${m.markers.waiting} ${m.legend.waiting}`],
      ['visited', `${m.markers.done} ${m.legend.done}`],
      ...(hanoi ? [] : [['sorted', `${m.markers.output} ${m.legend.output}`]]),
    ]),
  );
  const topLegend = $derived(
    /** @type {[VisualState, string][]} */ (
      hanoi
        ? [['active', `${m.markers.moved} ${m.legend.moved}`]]
        : [
            ['active', `${m.markers.deciding} ${m.legend.deciding}`],
            ['sorted', `${m.markers.taken} ${m.legend.taken}`],
            ['visited', `${m.markers.left} ${m.legend.left}`],
          ]
    ),
  );

  const stats = $derived(
    hanoi
      ? [
          [m.stats.moves, m.ofTotal(hanoi.moves, 2 ** disks - 1), 'moves'],
          [m.stats.calls, String(hanoi.calls), 'calls'],
          [m.stats.depth, String(hanoi.depth), 'depth'],
        ]
      : [
          [m.stats.outputs, m.ofTotal(subsets?.outputs.length ?? 0, 2 ** items.length), 'outputs'],
          [m.stats.calls, String(frame.calls), 'calls'],
          [m.stats.depth, String(frame.depth), 'depth'],
        ],
  );

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

{#snippet legendRow(/** @type {[VisualState, string][]} */ rows)}
  <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
    {#each rows as [st, label] (label)}
      <li class="flex items-center gap-1.5">
        <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
      </li>
    {/each}
  </ul>
{/snippet}

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      if (problem === 'hanoi') commitDisks();
      else commitItems();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((p) => ({ value: p, label: m.problems[p] }))}
      bind:value={problem}
      onchange={rebuild}
    />
    {#if problem === 'hanoi'}
      <label class={labelClass}>
        {m.disksLabel}
        <input
          type="number"
          name="disks"
          min="1"
          max={MAX_DISKS}
          step="1"
          class="field w-24"
          bind:value={disksDraft}
          onchange={commitDisks}
        />
      </label>
    {:else}
      <label class={labelClass}>
        {m.itemsLabel}
        <input
          type="text"
          name="items"
          class="field w-40 max-w-full"
          bind:value={itemsText}
          onchange={commitItems}
        />
      </label>
    {/if}
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        {#if hanoi}
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.boardTitle}
          </h2>
          <svg
            viewBox="0 0 {W} {BASE + 36}"
            role="img"
            aria-label={m.boardAria(hanoi.pegs)}
            class="mx-auto block h-auto w-full max-w-md"
            data-testid="board"
          >
            <rect x="10" y={BASE} width={W - 20} height="4" rx="2" class="fill-slate-500" />
            {#each hanoi.pegs as pile, p (p)}
              <rect
                x={pegX(p) - 3}
                y={BASE - (MAX_DISKS + 0.5) * DH}
                width="6"
                height={(MAX_DISKS + 0.5) * DH}
                rx="3"
                class="fill-slate-400"
              />
              {#each pile as disk, level (disk)}
                {@const hot = disk === moved}
                <rect
                  x={pegX(p) - diskW(disk) / 2}
                  y={BASE - (level + 1) * DH}
                  width={diskW(disk)}
                  height={DH - 2}
                  rx="4"
                  stroke-width={hot ? 2.5 : 1.5}
                  class="{hot ? STATE_FILL.active : 'fill-sky-100'} stroke-slate-700"
                />
                <text
                  x={pegX(p)}
                  y={BASE - (level + 1) * DH + (DH - 2) / 2}
                  text-anchor="middle"
                  dominant-baseline="central"
                  font-size="11"
                  font-weight="700"
                  class={hot ? STATE_TEXT.active : 'fill-slate-900'}
                  >{hot ? `${m.markers.moved} ${disk}` : disk}</text
                >
              {/each}
              <text
                x={pegX(p)}
                y={BASE + 18}
                text-anchor="middle"
                font-size="13"
                font-weight="700"
                class="fill-slate-800">{m.pegs[p]}</text
              >
              <text
                x={pegX(p)}
                y={BASE + 32}
                text-anchor="middle"
                font-size="11"
                class="fill-slate-500">{roleOf(p)}</text
              >
            {/each}
          </svg>
        {:else}
          <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {m.chosenTitle}
          </h2>
          <ArrayStrip
            values={items}
            ariaLabel={m.chosenAria(items, subsets?.chosen ?? [], subsets?.i ?? -1)}
            stateOf={(i) => ITEM_STATE[itemKind(i)]}
            markerOf={(i) => {
              const k = itemKind(i);
              return k === '' ? '' : m.markers[k];
            }}
            pointers={subsets && subsets.i >= 0 ? [{ name: 'i', index: subsets.i }] : []}
            speed={player.speed}
          />
        {/if}
        {@render legendRow(topLegend)}
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        <TreeView
          {roots}
          ariaLabel={m.treeAria(finished, frame.status.length)}
          labelOf={nodeLabel}
          speed={player.speed}
        />
        {@render legendRow(treeLegend)}
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
        {#each stats as [label, value, id], i (id)}
          <div
            class="min-w-0 rounded-xl border border-slate-200 bg-white p-3 {i === stats.length - 1
              ? 'col-span-2'
              : ''}"
          >
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="truncate text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      {#if subsets}
        <ChipList
          title={m.outputsTitle}
          items={outputChips}
          emptyText={m.outputsEmpty}
          limit={32}
        />
      {/if}
      <CodePanel lines={practiceRecursionPseudocode[problem]} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
