<script>
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    countSymbols,
    fixedBits,
    formatFrequencies,
    huffmanPseudocode,
    huffmanTrace,
    parseFrequencies,
  } from '$lib/algo-engine/huffman-coding.js';
  import { en as m } from '$lib/lessons/huffman-coding/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/huffman-coding.js').SymbolFreq} SymbolFreq */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {keyof typeof m.presets} PresetKey */
  /** @typedef {keyof typeof m.legend} NodeKind */

  /** @param {string} text @returns {SymbolFreq[]} */
  const pairs = (text) => {
    const parsed = parseFrequencies(text);
    return 'symbols' in parsed ? parsed.symbols : [];
  };

  /** @type {Record<PresetKey, SymbolFreq[]>} */
  const PRESETS = {
    textbook: pairs('a:45 b:13 c:12 d:16 e:9 f:5'),
    equal: pairs('a:5 b:5 c:5 d:5'),
    skewed: pairs('a:16 b:8 c:4 d:2 e:1 f:1'),
    vowels: pairs('e:127 a:82 o:75 i:70 u:28'),
  };
  const PRESET_KEYS = /** @type {PresetKey[]} */ (Object.keys(PRESETS));

  // A fixed first input keeps the prerendered HTML and the hydrated page identical.
  const INITIAL = PRESETS.textbook;
  let symbols = $state(INITIAL);
  let freqText = $state(formatFrequencies(INITIAL));
  let sourceText = $state('');
  let preset = $state('textbook');
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(huffmanTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));
  const fixed = $derived(fixedBits(symbols));
  const width = $derived(Math.ceil(Math.log2(symbols.length)));
  const total = $derived(symbols.reduce((s, x) => s + x.freq, 0));
  const finalCost = $derived(player.frames[player.frames.length - 1].cost);

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  /** @param {SymbolFreq[]} next */
  function load(next) {
    symbols = next;
    freqText = formatFrequencies(next);
    notice = { text: '', at: -1 };
    player.load(huffmanTrace(next));
  }

  function commitFrequencies() {
    const parsed = parseFrequencies(freqText);
    if ('error' in parsed) {
      freqText = formatFrequencies(symbols);
      say(m.errors[parsed.error]);
      return;
    }
    if (formatFrequencies(parsed.symbols) === formatFrequencies(symbols)) {
      freqText = formatFrequencies(symbols);
      return;
    }
    preset = '';
    sourceText = '';
    load(parsed.symbols);
  }

  function commitText() {
    const counted = countSymbols(sourceText);
    if ('error' in counted) {
      say(m.errors[counted.error]);
      return;
    }
    preset = '';
    load(counted.symbols);
    say(m.countedNotice(counted.symbols.length));
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadPreset(e) {
    const key = /** @type {PresetKey} */ (e.currentTarget.value);
    preset = key;
    sourceText = '';
    load(PRESETS[key]);
    say(m.newFrequenciesNotice);
  }

  /** @param {number} id @returns {NodeKind | ''} */
  function nodeKind(id) {
    if (id === frame.made) return 'made';
    if (frame.kind === 'pick' && frame.picked.includes(id)) return 'picked';
    if (frame.kind === 'merge' && frame.picked.includes(id)) return 'picked';
    if (frame.path.includes(id)) return 'path';
    if (frame.nodes[id].left < 0 && frame.codes[id]) return 'coded';
    return '';
  }

  /** @type {Record<NodeKind | '', VisualState>} */
  const STATE = { picked: 'compare', made: 'active', path: 'path', coded: 'sorted', '': '' };
  const LEGEND = /** @type {NodeKind[]} */ (['picked', 'made', 'path', 'coded']);

  const roots = $derived.by(() => {
    /** @param {number} id @param {string} edge @returns {TreeNode} */
    const build = (id, edge) => {
      const n = frame.nodes[id];
      const kind = nodeKind(id);
      const leaf = n.left < 0;
      return {
        id,
        label: leaf ? n.symbol : String(n.weight),
        state: STATE[kind],
        marker: kind ? m.markers[kind] : '',
        note: leaf ? frame.codes[id] || String(n.weight) : '',
        edgeLabel: edge,
        children: leaf ? [] : [build(n.left, '0'), build(n.right, '1')],
      };
    };
    return frame.queue.map((id) => build(id, ''));
  });

  // Picking a merged node jumps to its merge, picking a leaf to the step that reads its code.
  /** @param {string | number} id */
  function selectNode(id) {
    const at = player.frames.findIndex(
      (f) => (f.kind === 'merge' && f.made === id) || (f.kind === 'code' && f.leaf === id),
    );
    if (at < 0) return;
    player.pause();
    player.seek(at);
  }

  /** @param {TreeNode} node */
  function labelOf(node) {
    const n = frame.nodes[Number(node.id)];
    const kind = nodeKind(n.id);
    const name = n.left < 0 ? n.symbol : String(n.weight);
    return m.nodeLabel(name, n.weight, frame.codes[n.id] ?? '', kind ? m.legend[kind] : '');
  }

  const queueChips = $derived(
    frame.queue.map((id) => ({
      label:
        frame.nodes[id].left < 0
          ? `${frame.nodes[id].symbol}:${frame.nodes[id].weight}`
          : String(frame.nodes[id].weight),
      hot: frame.picked.includes(id) || id === frame.made,
    })),
  );
</script>

<LessonLayout lesson={m}>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitFrequencies();
    }}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select name="preset" class="field" value={preset} onchange={loadPreset}>
        <option value="" disabled>{m.presetPlaceholder}</option>
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
    <label
      class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.frequenciesLabel}
      <input
        type="text"
        name="frequencies"
        class="field w-full max-w-md font-mono"
        bind:value={freqText}
        onchange={commitFrequencies}
      />
    </label>
  </form>
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onsubmit={(e) => {
      e.preventDefault();
      commitText();
    }}
  >
    <label
      class="flex min-w-0 grow flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
    >
      {m.textLabel}
      <input
        type="text"
        name="text"
        maxlength="200"
        class="field w-full max-w-md"
        bind:value={sourceText}
        onchange={commitText}
      />
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="rounded-xl border border-slate-200 bg-white p-4">
        <TreeView
          {roots}
          binary
          ariaLabel={m.treeAria(frame.queue.length)}
          {labelOf}
          onselect={selectNode}
          selected={frame.made >= 0 ? frame.made : frame.leaf >= 0 ? frame.leaf : null}
          speed={player.speed}
        />
        <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          {#each LEGEND as s (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[STATE[s]]}"></span>
              <span class="font-bold text-slate-900">{m.markers[s]}</span>
              {m.legend[s]}
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
          <dt class="text-xs text-slate-500">{m.stats.merges}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.merges}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.bits}</dt>
          <dd class="text-2xl font-bold tabular-nums">{frame.cost}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.fixed}</dt>
          <dd class="text-2xl font-bold tabular-nums">{fixed}</dd>
          <dd class="text-xs text-slate-500">{m.fixedNote(width)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.average}</dt>
          <dd class="text-2xl font-bold tabular-nums">
            {frame.kind === 'done' ? m.twoPlaces(finalCost / total) : m.pending}
          </dd>
        </div>
      </dl>
      <ChipList title={m.queueTitle} items={queueChips} emptyText={m.queueEmpty} />
      <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
        <h2 class="mb-2 text-xs text-slate-500">{m.tableTitle}</h2>
        <table class="w-full text-left tabular-nums" data-testid="codes">
          <thead class="text-xs text-slate-500">
            <tr>
              <th scope="col" class="font-normal">{m.tableHead.symbol}</th>
              <th scope="col" class="font-normal">{m.tableHead.freq}</th>
              <th scope="col" class="font-normal">{m.tableHead.code}</th>
              <th scope="col" class="text-right font-normal">{m.tableHead.bits}</th>
            </tr>
          </thead>
          <tbody>
            {#each symbols as s, id (s.symbol)}
              {@const code = frame.codes[id]}
              <tr class={id === frame.leaf ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                <th scope="row" class="font-mono font-normal">{s.symbol}</th>
                <td>{s.freq}</td>
                <td class="font-mono">{code || m.pending}</td>
                <td class="text-right">{code ? code.length * s.freq : m.pending}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
      <CodePanel lines={huffmanPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
