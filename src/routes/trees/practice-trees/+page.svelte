<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    PRESETS,
    PRESET_TEXT,
    VALIDATE_METHODS,
    defaultPicks,
    formatKeys,
    inorder,
    isBst,
    lcaByParents,
    lcaPseudocode,
    lcaTrace,
    parseKeys,
    validatePseudocode,
    validateTrace,
  } from '$lib/algo-engine/practice-trees.js';
  import { en as m } from '$lib/lessons/practice-trees/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/practice-trees.js').KeySlots} KeySlots */
  /** @typedef {import('$lib/algo-engine/practice-trees.js').ValidateMethod} ValidateMethod */
  /** @typedef {import('$lib/algo-engine/practice-trees.js').ValidateFrame} ValidateFrame */
  /** @typedef {import('$lib/algo-engine/practice-trees.js').LcaFrame} LcaFrame */
  /** @typedef {import('$lib/algo-engine/practice-trees.js').PracticeTreePreset} PracticeTreePreset */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'validate'|'lca'} Problem */

  const PROBLEMS = /** @type {Problem[]} */ (['validate', 'lca']);

  // A fixed first tree keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = /** @type {{ slots: KeySlots }} */ (parseKeys(PRESET_TEXT.valid)).slots;
  /** @type {KeySlots} */
  let slots = $state.raw(INITIAL);
  let text = $state(formatKeys(INITIAL));
  let problem = $state(/** @type {Problem} */ ('validate'));
  let method = $state(/** @type {ValidateMethod} */ ('range'));
  let preset = $state('valid');
  /** @type {[number, number]} */
  let picks = $state.raw(defaultPicks(INITIAL));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(
    /** @type {(ValidateFrame | LcaFrame)[]} */ (validateTrace(INITIAL, 'range')),
  );
  const frame = $derived(player.frame);
  const vf = $derived('method' in frame ? frame : null);
  const lf = $derived('method' in frame ? null : frame);

  const narration = $derived(
    notice.at === player.index
      ? notice.text
      : vf
        ? m.describeValidate(vf, slots)
        : m.describeLca(/** @type {LcaFrame} */ (lf), slots),
  );

  /** @param {string} t */
  function say(t) {
    notice = { text: t, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(
      problem === 'validate' ? validateTrace(slots, method) : lcaTrace(slots, picks[0], picks[1]),
    );
  }

  /** @param {KeySlots} next */
  function setTree(next) {
    slots = next;
    text = formatKeys(next);
    picks = defaultPicks(next);
    rebuild();
  }

  function commitKeys() {
    const r = parseKeys(text);
    if ('error' in r) {
      text = formatKeys(slots);
      say(m.keyErrors[r.error]);
      return;
    }
    preset = '';
    setTree(r.slots);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const picked = /** @type {PracticeTreePreset} */ (e.currentTarget.value);
    preset = picked;
    setTree(/** @type {{ slots: KeySlots }} */ (parseKeys(PRESET_TEXT[picked])).slots);
  }

  /** @param {string | number} id */
  function pick(id) {
    const k = slots[Number(id)];
    if (k === null || k === picks[1]) return;
    picks = [picks[1], k];
    rebuild();
  }

  const valid = $derived(isBst(slots));
  const inorderKeys = $derived(inorder(slots).map((i) => /** @type {number} */ (slots[i])));
  const firstDrop = $derived(inorderKeys.findIndex((k, j) => j > 0 && inorderKeys[j - 1] >= k));
  const trueLca = $derived(lcaByParents(slots, picks[0], picks[1]));

  /** @param {number} i @returns {VisualState} */
  function stateOf(i) {
    if (vf) {
      if (vf.status[i] === 'bad') return 'swap';
      if (i === vf.current && vf.kind !== 'empty') return 'active';
      if (vf.stack.includes(i)) return 'frontier';
      if (vf.status[i] === 'ok') return 'visited';
      return '';
    }
    const f = /** @type {LcaFrame} */ (lf);
    if (i === f.answer) return 'sorted';
    if (i === f.current) return 'active';
    if (f.path.includes(i)) return 'path';
    return '';
  }

  /** @param {number} i @param {VisualState} s */
  function markerOf(i, s) {
    if (vf) {
      return s === 'active' || s === 'frontier' || s === 'visited' || s === 'swap'
        ? m.markers[s]
        : '';
    }
    const k = slots[i];
    const tag = (k === picks[0] ? m.markers.p : '') + (k === picks[1] ? m.markers.q : '');
    return s === 'sorted' ? `${tag}${m.markers.sorted}` : tag;
  }

  /** @param {number} i */
  function noteOf(i) {
    if (!vf || vf.method !== 'range') return undefined;
    const b = vf.bounds[i];
    const show = i === vf.current || vf.stack.includes(i) || vf.status[i] === 'bad';
    return b && show ? m.rangeNote(b) : undefined;
  }

  /** @param {number} i @returns {TreeNode | null} */
  function build(i) {
    if (i >= slots.length || slots[i] === null) return null;
    const s = stateOf(i);
    const kids = [build(2 * i + 1), build(2 * i + 2)];
    return {
      id: i,
      label: String(slots[i]),
      state: s,
      marker: markerOf(i, s),
      note: noteOf(i),
      children: kids.some(Boolean) ? kids : [],
    };
  }

  const roots = $derived.by(() => {
    const r = build(0);
    return r ? [r] : [];
  });

  /** @param {TreeNode} node */
  function nodeLabel(node) {
    const i = Number(node.id);
    const s = /** @type {VisualState} */ (node.state ?? '');
    const b = vf?.method === 'range' ? vf.bounds[i] : null;
    const k = slots[i];
    const extra = lf
      ? [k === picks[0] ? 'p' : '', k === picks[1] ? 'q' : ''].filter(Boolean).join(' and ')
      : b
        ? m.rangeText(b)
        : '';
    return m.nodeLabel(
      Number(k),
      s ? m.states[/** @type {keyof typeof m.states} */ (s)] : '',
      extra,
    );
  }

  const stats = $derived(
    vf
      ? [
          [m.stats.comparisons, String(vf.comparisons), 'comparisons'],
          [m.stats.checked, String(vf.status.filter((x) => x !== null).length), 'checked'],
          [m.stats.depth, String(vf.stack.length), 'depth'],
          [
            m.stats.result,
            vf.result === null
              ? m.results.pending
              : vf.result
                ? m.results.valid
                : m.results.invalid,
            'result',
          ],
        ]
      : [
          [m.stats.visited, String(lf?.path.length ?? 0), 'visited'],
          [
            m.stats.answer,
            lf && lf.answer >= 0 ? String(slots[lf.answer]) : m.results.pending,
            'answer',
          ],
        ],
  );

  const stackChips = $derived(
    vf
      ? vf.stack.map((i, k, all) => ({
          label:
            vf.method === 'range' && vf.bounds[i]
              ? `check(${slots[i]}, ${m.rangeNote(/** @type {{lo: number, hi: number}} */ (vf.bounds[i])).slice(1, -1)})`
              : `check(${slots[i]})`,
          hot: k === all.length - 1,
        }))
      : [],
  );

  const legend = $derived(
    /** @type {[VisualState, string][]} */ (
      vf
        ? [
            ['active', `${m.markers.active} ${m.legend.active}`],
            ['frontier', `${m.markers.frontier} ${m.legend.frontier}`],
            ['visited', `${m.markers.visited} ${m.legend.visited}`],
            ['swap', `${m.markers.swap} ${m.legend.swap}`],
          ]
        : [
            ['active', m.legend.active],
            ['path', m.legend.path],
            ['sorted', `${m.markers.sorted} ${m.legend.sorted}`],
          ]
    ),
  );

  const labelClass =
    'flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase';
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitKeys();
    }}
  >
    <SegmentedControl
      legend={m.problemLabel}
      name="problem"
      options={PROBLEMS.map((p) => ({ value: p, label: m.problems[p] }))}
      bind:value={problem}
      onchange={rebuild}
    />
    {#if problem === 'validate'}
      <SegmentedControl
        legend={m.methodLabel}
        name="method"
        options={VALIDATE_METHODS.map((v) => ({ value: v, label: m.methods[v] }))}
        bind:value={method}
        onchange={rebuild}
      />
    {/if}
    <label class={labelClass}>
      {m.keysLabel}
      <input
        type="text"
        name="keys"
        class="field w-72 max-w-full"
        bind:value={text}
        onchange={commitKeys}
      />
    </label>
    <label class={labelClass}>
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
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.treeTitle}
        </h2>
        {#if lf}
          <p class="mb-2 text-sm text-slate-700">
            <span class="font-semibold" data-testid="picks">{m.picksText(picks[0], picks[1])}</span
            >. {m.pickHint}
          </p>
        {/if}
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria(slots.filter((k) => k !== null).map(Number))}
          labelOf={nodeLabel}
          onselect={lf ? pick : null}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [st, label] (st)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[st]}"></span>{label}
            </li>
          {/each}
          {#if lf}
            <li>{m.legend.picks}</li>
          {/if}
        </ul>
        {#if lf && !valid}
          <p class="mt-3 text-sm text-amber-900" data-testid="not-bst">
            {m.notBst}
            {m.trueLca(trueLca >= 0 ? slots[trueLca] : null)}
          </p>
        {/if}
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
        {#each stats as [label, value, id] (id)}
          <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{label}</dt>
            <dd class="truncate text-2xl font-bold tabular-nums" data-testid={id}>{value}</dd>
          </div>
        {/each}
      </dl>
      <div>
        <ChipList
          title={m.inorderTitle}
          items={inorderKeys.map((k, j) => ({ label: String(k), hot: j === firstDrop }))}
          emptyText={m.inorderEmpty}
          limit={15}
          hotLabel={m.dropLabel}
        />
        <p class="mt-1 text-sm text-slate-600" data-testid="inorder-verdict">
          {m.inorderVerdict(valid)}
        </p>
      </div>
      {#if vf}
        <ChipList title={m.stackTitle} items={stackChips} emptyText={m.stackEmpty} />
      {/if}
      <CodePanel
        lines={problem === 'validate' ? validatePseudocode[method] : lcaPseudocode}
        active={frame.lines}
      />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
