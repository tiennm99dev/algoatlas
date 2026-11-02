<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import ChipList from '$lib/components/chip-list.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import {
    COMPRESSION_PRESETS,
    MAX_LEN,
    compressionPseudocode,
    compressionTrace,
  } from '$lib/algo-engine/data-compression.js';
  import { parseLetters } from '$lib/algo-engine/tries.js';
  import { en as m } from '$lib/lessons/data-compression/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/data-compression.js').HuffTree} HuffTree */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {keyof typeof COMPRESSION_PRESETS} Preset */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(COMPRESSION_PRESETS));
  const BARS = /** @type {const} */ ([
    { key: 'raw', field: 'rawBits', tint: 'bg-slate-400' },
    { key: 'run', field: 'runBits', tint: 'bg-state-swap' },
    { key: 'huff', field: 'huffBits', tint: 'bg-state-frontier' },
    { key: 'lzw', field: 'lzwBits', tint: 'bg-state-sorted' },
  ]);
  const errors = m.fieldErrors(MAX_LEN);

  const INITIAL = COMPRESSION_PRESETS.runs;
  let preset = $state(/** @type {Preset | ''} */ ('runs'));
  let text = $state(INITIAL);
  let textDraft = $state(INITIAL);
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(compressionTrace(INITIAL));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(compressionTrace(text));
  }

  function commitText() {
    const parsed = parseLetters(textDraft, MAX_LEN);
    if ('error' in parsed) {
      textDraft = text;
      notice = { text: errors[parsed.error], at: player.index };
      return;
    }
    textDraft = parsed.word;
    if (parsed.word === text) return;
    text = parsed.word;
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    text = textDraft = COMPRESSION_PRESETS[p];
    rebuild();
  }

  /**
   * @param {HuffTree} t
   * @param {string} [edgeLabel]
   * @returns {TreeNode}
   */
  function toTree(t, edgeLabel) {
    return {
      id: t.id,
      label: t.letter,
      note: String(t.weight),
      edgeLabel,
      state: t.id === frame.merged ? 'active' : '',
      marker: t.id === frame.merged ? m.treeMarker : '',
      children: t.left && t.right ? [toTree(t.left, '0'), toTree(t.right, '1')] : [],
    };
  }

  const roots = $derived(frame.forest.map((t) => toTree(t)));
  const codes = $derived(
    Object.keys(frame.codes)
      .sort()
      .map((c) => ({ label: m.huffChip(c, frame.codes[c]) })),
  );
  // Bars share one scale, the largest total at the end, so they grow towards a fixed mark.
  const finalFrame = $derived(player.frames[player.frames.length - 1]);
  const scale = $derived(
    Math.max(finalFrame.rawBits, finalFrame.runBits, finalFrame.huffBits, finalFrame.lzwBits, 1),
  );
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(e) => enterField(e, {})}
    onsubmit={(e) => e.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.textLabel}
      <input
        type="text"
        name="text"
        maxlength={MAX_LEN + 4}
        autocomplete="off"
        autocapitalize="none"
        class="field w-64 font-mono normal-case"
        bind:value={textDraft}
        onchange={commitText}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(e) => loadPreset(/** @type {Preset} */ (e.currentTarget.value))}
      >
        {#if preset === ''}<option value="" disabled>—</option>{/if}
        {#each PRESET_KEYS as p (p)}
          <option value={p}>{m.presets[p]}</option>
        {/each}
      </select>
    </label>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.textTitle}
        </h2>
        <ArrayStrip
          values={[...frame.text]}
          ariaLabel={m.textAria}
          stateOf={(i) => (i === frame.i ? 'compare' : i < frame.i ? 'visited' : '')}
          markerOf={(i) => (i === frame.i ? m.textMarker : '')}
          labelOf={(i) =>
            m.textCell(
              i,
              frame.text[i],
              i === frame.i ? m.textStates.now : i < frame.i ? m.textStates.past : '',
            )}
          pointers={frame.i >= 0 ? [{ name: 'i', index: frame.i }] : []}
          speed={player.speed}
        />
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.barsTitle}
        </h2>
        <ul class="flex flex-col gap-2 text-sm">
          {#each BARS as bar (bar.key)}
            <li>
              <div class="flex justify-between gap-2 text-xs text-slate-600">
                <span>{m.bars[bar.key]}</span>
                <span class="font-semibold text-slate-900 tabular-nums" data-testid={bar.key}
                  >{m.bitsValue(frame[bar.field])}</span
                >
              </div>
              <div class="mt-0.5 h-3 rounded-sm bg-slate-100">
                <div
                  class="h-3 rounded-sm {bar.tint}"
                  style="width: {(frame[bar.field] / scale) * 100}%"
                ></div>
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-sm font-semibold text-slate-800">{m.runTitle}</h2>
        <p class="mb-2 text-xs text-slate-600">{m.runNote}</p>
        <p class="mb-2 font-mono text-sm text-slate-800" data-testid="open-run">
          {m.openRun(frame.openRun)}
        </p>
        <ChipList
          title={m.runChips}
          items={frame.runs.map((r) => ({ label: m.runChip(r) }))}
          emptyText={m.runEmpty}
          limit={MAX_LEN}
        />
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-sm font-semibold text-slate-800">{m.huffTitle}</h2>
        <p class="mb-2 text-xs text-slate-600">{m.huffNote}</p>
        <TreeView
          {roots}
          ariaLabel={m.treeAria}
          labelOf={(node) =>
            m.treeNode(node.label, node.note ?? '', node.state ? m.treeStates.merged : '')}
          speed={player.speed}
        />
        <p class="mt-1 text-xs text-slate-600">{m.treeLegend}</p>
        <div class="mt-2 flex flex-col gap-2">
          <ChipList title={m.huffChips} items={codes} emptyText={m.huffEmpty} limit={MAX_LEN} />
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <h3 class="mb-1 text-xs text-slate-500">{m.streamTitle}</h3>
            <p class="font-mono text-xs break-all text-slate-900" data-testid="stream">
              {frame.stream || m.streamEmpty}
            </p>
          </div>
        </div>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-1 text-sm font-semibold text-slate-800">{m.lzwTitle}</h2>
        <p class="mb-2 text-xs text-slate-600">{m.lzwNote}</p>
        <p class="mb-2 font-mono text-sm text-slate-800" data-testid="lzw-w">
          {m.lzwCurrent(frame.w)}
        </p>
        <div class="flex flex-col gap-2">
          <ChipList
            title={m.lzwOutput}
            items={frame.output.map((e, k) => ({
              label: m.lzwChip(e),
              hot: frame.codeEmitted && k === frame.output.length - 1,
            }))}
            emptyText={m.lzwOutputEmpty}
            limit={MAX_LEN}
          />
          <ChipList
            title={m.lzwDict}
            items={frame.dictionary.map((e, k) => ({
              label: m.dictChip(e),
              hot: frame.kind === 'read' && frame.codeEmitted && k === frame.dictionary.length - 1,
            }))}
            emptyText={m.lzwDictEmpty}
            limit={MAX_LEN}
          />
        </div>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <CodePanel lines={compressionPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
