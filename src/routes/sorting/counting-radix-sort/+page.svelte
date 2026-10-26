<script>
  import ArrayStrip from '$lib/components/array-strip.svelte';
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    MAX_COUNT_KEY,
    MAX_RADIX_KEY,
    countingPseudocode,
    countingSortTrace,
    digitAt,
    parseKeys,
    radixPseudocode,
    radixSortTrace,
    randomKeys,
  } from '$lib/algo-engine/counting-radix-sort.js';
  import { toItems } from '$lib/algo-engine/sorting.js';
  import { en as m } from '$lib/lessons/counting-radix-sort/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {'counting'|'radix'} Algo */
  /** @typedef {import('$lib/algo-engine/counting-radix-sort.js').CountingFrame} CountingFrame */
  /** @typedef {import('$lib/algo-engine/counting-radix-sort.js').RadixFrame} RadixFrame */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */

  const ALGOS = /** @type {Algo[]} */ (['counting', 'radix']);
  const LIMIT = { counting: MAX_COUNT_KEY, radix: MAX_RADIX_KEY };
  // Fixed first inputs keep the prerendered HTML and the hydrated page identical.
  const INITIAL = { counting: [2, 5, 3, 0, 2, 3, 0, 3], radix: [170, 45, 75, 90, 802, 24, 2, 66] };
  const TAGS = 'abcdefghijkl';

  let algo = $state(/** @type {Algo} */ ('counting'));
  let keys = $state({ ...INITIAL });
  let keysText = $state(INITIAL.counting.join(', '));
  let notice = $state({ text: '', at: -1 });

  /** @param {Algo} a @param {number[]} values */
  const traceFor = (a, values) =>
    a === 'counting' ? countingSortTrace(toItems(values)) : radixSortTrace(toItems(values));

  const player = createPlayer(
    /** @type {(CountingFrame | RadixFrame)[]} */ (traceFor('counting', INITIAL.counting)),
  );
  // The frame's own shape says which sort it came from, so a render never mixes the two.
  const cf = $derived('count' in player.frame ? /** @type {CountingFrame} */ (player.frame) : null);
  const rf = $derived('buckets' in player.frame ? /** @type {RadixFrame} */ (player.frame) : null);

  // Letters tell equal keys apart: the first 3 in the input is 3a, the next 3b.
  const tags = $derived(
    keys[algo].map((v, i, all) => {
      const repeated = all.filter((x) => x === v).length > 1;
      return repeated ? TAGS[all.slice(0, i).filter((x) => x === v).length] : '';
    }),
  );
  /** @param {number} id */
  const tagOf = (id) => tags[id] ?? '';

  const narration = $derived.by(() => {
    if (notice.at === player.index) return notice.text;
    return cf ? m.describeCounting(cf, tagOf) : rf ? m.describeRadix(rf) : '';
  });

  /** @param {string} text */
  function say(text) {
    notice = { text, at: player.index };
  }

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(traceFor(algo, keys[algo]));
  }

  function switchAlgo() {
    keysText = keys[algo].join(', ');
    rebuild();
  }

  function commitKeys() {
    const parsed = parseKeys(keysText, LIMIT[algo]);
    if ('error' in parsed) {
      keysText = keys[algo].join(', ');
      say(parsed.error === 'range' ? m.keyErrors.range[algo] : m.keyErrors[parsed.error]);
      return;
    }
    keys = { ...keys, [algo]: parsed.values };
    keysText = parsed.values.join(', ');
    rebuild();
  }

  function randomize() {
    const values = randomKeys(keys[algo].length, LIMIT[algo]);
    keys = { ...keys, [algo]: values };
    keysText = values.join(', ');
    rebuild();
  }

  /** @param {VisualState} s */
  const stateName = (s) =>
    ({
      compare: m.states.read,
      swap: m.states.write,
      visited: m.states.dropped,
      sorted: cf ? m.states.done : m.states.sorted,
    })[/** @type {string} */ (s)] ?? '';
  /** @param {VisualState} s */
  const stateMarker = (s) =>
    s === 'compare' ? m.markers.read : s === 'swap' ? m.markers.write : '';

  /** @param {number} i @returns {VisualState} */
  function inputState(i) {
    if (!cf) return '';
    if ((cf.kind === 'count' || cf.kind === 'place') && i === cf.i) return 'compare';
    if (cf.kind === 'place' || cf.kind === 'done') {
      const placedFrom = cf.kind === 'done' ? 0 : cf.i + 1;
      if (i >= placedFrom) return 'sorted';
    }
    return '';
  }

  /** @param {number} v @returns {VisualState} */
  function countState(v) {
    if (!cf) return '';
    if (v === cf.v) return 'swap';
    if (cf.kind === 'prefix' && v === cf.v - 1) return 'compare';
    return '';
  }

  /** @param {number} p @returns {VisualState} */
  function outputState(p) {
    if (!cf) return '';
    if (p === cf.pos) return 'swap';
    return cf.output[p] ? 'sorted' : '';
  }

  /** @param {number} i @returns {VisualState} */
  function radixState(i) {
    if (!rf) return '';
    if (rf.kind === 'drop' && i === rf.i) return 'compare';
    if (rf.kind === 'drop' && i < rf.i) return 'visited';
    if (rf.kind === 'collect') return 'swap';
    if (rf.kind === 'done') return 'sorted';
    return '';
  }

  /** Digits of x as [before, current, after] around the digit at `place`, zero-padded to the max. */
  const width = $derived(String(Math.max(0, ...keys.radix)).length);
  /** @param {number} x @param {number} place */
  function splitDigits(x, place) {
    if (!place) return ['', '', String(x)];
    const s = String(x).padStart(width, '0');
    const at = s.length - 1 - Math.round(Math.log10(place));
    return [s.slice(0, at), s[at], s.slice(at + 1)];
  }

  const legend = $derived(
    /** @type {[VisualState, string, string][]} */ (
      algo === 'counting'
        ? [
            ['compare', m.markers.read, m.legend.read],
            ['swap', m.markers.write, m.legend.write],
            ['sorted', '', m.legend.done],
          ]
        : [
            ['compare', '', m.legend.drop],
            ['visited', '', m.legend.dropped],
            ['swap', '', m.legend.arrived],
            ['sorted', '', m.legend.sorted],
          ]
    ),
  );
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
      legend={m.algorithmLabel}
      name="algo"
      options={ALGOS.map((a) => ({ value: a, label: m.algorithms[a] }))}
      bind:value={algo}
      onchange={switchAlgo}
    />
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.keysLabel[algo]}
      <input
        type="text"
        name="keys"
        class="field w-72 max-w-full"
        bind:value={keysText}
        onchange={commitKeys}
      />
    </label>
    <button type="button" class="btn-secondary" onclick={randomize}>{m.randomButton}</button>
  </form>

  <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
    <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
      <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
        {#if cf}
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.inputTitle}
            </h2>
            <ArrayStrip
              values={cf.input.map((it) => it.value)}
              ariaLabel={m.inputAria}
              stateOf={inputState}
              markerOf={(i) => tagOf(i)}
              labelOf={(i) =>
                m.cellLabel(i, `${cf.input[i].value}${tagOf(i)}`, stateName(inputState(i)))}
              speed={player.speed}
            />
          </div>
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.countTitle}
            </h2>
            <ArrayStrip
              values={cf.count}
              ariaLabel={m.countAria}
              stateOf={countState}
              markerOf={(v) => stateMarker(countState(v))}
              labelOf={(v) => m.cellLabel(v, String(cf.count[v]), stateName(countState(v)))}
              speed={player.speed}
            />
          </div>
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.outputTitle}
            </h2>
            <ArrayStrip
              values={cf.output.map((it) => (it ? it.value : ''))}
              ariaLabel={m.outputAria}
              stateOf={outputState}
              markerOf={(p) => {
                const it = cf.output[p];
                return it ? `${tagOf(it.id)}` : '';
              }}
              labelOf={(p) => {
                const it = cf.output[p];
                return m.cellLabel(
                  p,
                  it ? `${it.value}${tagOf(it.id)}` : '',
                  stateName(outputState(p)),
                );
              }}
              speed={player.speed}
            />
            <p class="mt-2 text-xs text-slate-500">{m.tagNote}</p>
          </div>
        {:else if rf}
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.arrayTitle}
            </h2>
            <ArrayStrip
              values={rf.items.map((it) => it.value)}
              ariaLabel={m.arrayAria}
              stateOf={radixState}
              markerOf={(i) =>
                rf.kind === 'drop' && i === rf.i
                  ? String(digitAt(rf.items[i].value, rf.place))
                  : ''}
              labelOf={(i) => m.cellLabel(i, String(rf.items[i].value), stateName(radixState(i)))}
              speed={player.speed}
            />
            <p class="mt-2 min-h-4 text-xs text-slate-500">{m.digitNote(rf.place)}</p>
          </div>
          <div>
            <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {m.bucketsTitle}
            </h2>
            <ol class="grid grid-cols-5 gap-2 sm:grid-cols-10">
              {#each rf.buckets as bucket, d (d)}
                <li
                  class="flex min-h-24 flex-col rounded-lg border p-1 {rf.kind === 'drop' &&
                  d === rf.digit
                    ? 'border-slate-900 ring-2 ring-slate-900'
                    : 'border-slate-300'}"
                  aria-label={m.bucketAria(
                    d,
                    bucket.map((it) => it.value),
                  )}
                >
                  <span class="text-center text-xs font-bold text-slate-500">{d}</span>
                  <ul class="flex flex-col gap-1" aria-hidden="true">
                    {#each bucket as it, k (it.id)}
                      {@const [before, digit, after] = splitDigits(it.value, rf.place)}
                      <li
                        class="rounded px-0.5 text-center font-mono text-xs tabular-nums {rf.kind ===
                          'drop' &&
                        k === bucket.length - 1 &&
                        d === rf.digit
                          ? STATE_BG.swap + ' text-white'
                          : 'bg-slate-100 text-slate-900'}"
                      >
                        {before}<span class="font-bold underline">{digit}</span>{after}
                      </li>
                    {/each}
                  </ul>
                </li>
              {/each}
            </ol>
          </div>
        {/if}
        <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
          {#each legend as [s, marker, label] (s)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
              {marker}
              {label}
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
        {#if cf}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.steps}</dt>
            <dd class="text-2xl font-bold tabular-nums">{cf.steps}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.budget}</dt>
            <dd class="text-2xl font-bold text-slate-500 tabular-nums">
              {2 * cf.input.length + cf.count.length - 1}
            </dd>
          </div>
        {:else if rf}
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.passes}</dt>
            <dd class="text-2xl font-bold tabular-nums">{rf.passes}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.moves}</dt>
            <dd class="text-2xl font-bold tabular-nums">{rf.moves}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.perPass}</dt>
            <dd class="text-2xl font-bold text-slate-500 tabular-nums">{2 * rf.items.length}</dd>
          </div>
        {/if}
      </dl>
      <CodePanel
        lines={algo === 'counting' ? countingPseudocode : radixPseudocode}
        active={player.frame.lines}
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
