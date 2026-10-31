<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import DpTable from '$lib/components/dp-table.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import SegmentedControl from '$lib/components/segmented-control.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import TreeView from '$lib/components/tree-view.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import {
    digitProducts,
    fourPseudocode,
    multiplyTrace,
    parseFactor,
    parseMatrix,
    strassenPseudocode,
    strassenTrace,
    threePseudocode,
  } from '$lib/algo-engine/karatsuba-strassen.js';
  import { en as m } from '$lib/lessons/karatsuba-strassen/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').SplitMethod} SplitMethod */
  /** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').MulFrame} MulFrame */
  /** @typedef {import('$lib/algo-engine/karatsuba-strassen.js').Matrix2} Matrix2 */
  /** @typedef {import('$lib/components/tree-layout.js').TreeNode} TreeNode */
  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {'numbers' | 'matrices'} Mode */
  /** @typedef {keyof typeof m.examples} ExampleKey */

  /** @type {Record<ExampleKey, [number, number]>} */
  const EXAMPLES = {
    clean: [1213, 3141],
    classic: [1234, 5678],
    two: [12, 34],
    big: [999999, 999999],
  };
  const EXAMPLE_KEYS = /** @type {ExampleKey[]} */ (Object.keys(EXAMPLES));
  const METHODS = /** @type {SplitMethod[]} */ (['four', 'three']);
  const MODES = /** @type {Mode[]} */ (['numbers', 'matrices']);
  const pseudocode = { four: fourPseudocode, three: threePseudocode };
  const GROWTH = [2, 4, 8, 16, 64, 1024];

  /** @param {number} x @param {number} y */
  const build = (x, y) => ({
    four: multiplyTrace(x, y, 'four'),
    three: multiplyTrace(x, y, 'three'),
  });

  // Fixed first inputs keep the prerendered HTML and the hydrated page identical.
  const [X0, Y0] = EXAMPLES.clean;
  /** @type {Matrix2} */
  const A0 = [
    [1, 2],
    [3, 4],
  ];
  /** @type {Matrix2} */
  const B0 = [
    [5, 6],
    [7, 8],
  ];

  let mode = $state(/** @type {Mode} */ ('numbers'));
  let method = $state(/** @type {SplitMethod} */ ('four'));
  let x = $state(X0);
  let y = $state(Y0);
  let xText = $state(String(X0));
  let yText = $state(String(Y0));
  let example = $state('clean');
  let A = $state.raw(A0);
  let B = $state.raw(B0);
  let aText = $state('1 2; 3 4');
  let bText = $state('5 6; 7 8');
  /** @type {number | null} */
  let selected = $state(null);

  const first = build(X0, Y0);
  let traces = $state.raw(first);
  const mul = createPlayer(first.four);
  const strassen = createPlayer(strassenTrace(A0, B0));
  const frame = $derived(mul.frame);
  const sFrame = $derived(strassen.frame);

  let notice = $state({ text: '', at: -1, mode: /** @type {Mode} */ ('numbers') });
  const activeIndex = $derived(mode === 'numbers' ? mul.index : strassen.index);
  const narration = $derived(
    notice.mode === mode && notice.at === activeIndex
      ? notice.text
      : mode === 'numbers'
        ? m.describe(frame, method)
        : m.describeStrassen(sFrame),
  );

  /** @param {string} text */
  function say(text) {
    notice = { text, at: activeIndex, mode };
  }

  function clearNotice() {
    notice = { text: '', at: -1, mode };
  }

  /** @param {number} nx @param {number} ny */
  function loadFactors(nx, ny) {
    x = nx;
    y = ny;
    xText = String(nx);
    yText = String(ny);
    selected = null;
    clearNotice();
    traces = build(nx, ny);
    mul.load(traces[method]);
  }

  /** @param {'x' | 'y'} which */
  function commitFactor(which) {
    const parsed = parseFactor(which === 'x' ? xText : yText);
    if ('error' in parsed) {
      xText = String(x);
      yText = String(y);
      say(m.factorErrors[parsed.error]);
      return;
    }
    const nx = which === 'x' ? parsed.value : x;
    const ny = which === 'y' ? parsed.value : y;
    if (nx === x && ny === y) return;
    example = '';
    loadFactors(nx, ny);
  }

  /** @param {Event & {currentTarget: HTMLSelectElement}} e */
  function loadExample(e) {
    const key = /** @type {ExampleKey} */ (e.currentTarget.value);
    example = key;
    loadFactors(...EXAMPLES[key]);
  }

  function switchMethod() {
    selected = null;
    clearNotice();
    mul.load(traces[method]);
    say(m.methodNotice[method]);
  }

  /** @param {'A' | 'B'} which */
  function commitMatrix(which) {
    const parsed = parseMatrix(which === 'A' ? aText : bText);
    if ('error' in parsed) {
      aText = A.map((r) => r.join(' ')).join('; ');
      bText = B.map((r) => r.join(' ')).join('; ');
      say(m.matrixErrors[parsed.error]);
      return;
    }
    if (which === 'A') A = parsed.matrix;
    else B = parsed.matrix;
    clearNotice();
    strassen.load(strassenTrace(A, B));
  }

  /** @param {import('$lib/algo-engine/karatsuba-strassen.js').CallNode} n @returns {VisualState} */
  function nodeState(n) {
    if (n.id === frame.current) return 'active';
    if (n.result === null) return 'frontier';
    return n.children.length === 0 ? 'sorted' : 'visited';
  }

  /** @param {MulFrame} f @returns {TreeNode[]} */
  function treeOf(f) {
    /** @param {number} id @returns {TreeNode} */
    function build(id) {
      const n = f.nodes[id];
      const state = nodeState(n);
      return {
        id,
        label: m.tag(n.tag),
        note: m.noteOf(n),
        state,
        marker: m.markers[state],
        children: n.children.map(build),
      };
    }
    return f.nodes.length ? [build(0)] : [];
  }

  const roots = $derived(treeOf(frame));
  const shown = $derived(
    selected !== null && selected < frame.nodes.length
      ? frame.nodes[selected]
      : frame.current >= 0
        ? frame.nodes[frame.current]
        : null,
  );
  const totals = $derived(METHODS.map((k) => ({ method: k, last: traces[k].at(-1) })));
  const legend = /** @type {const} */ (['active', 'frontier', 'visited', 'sorted']);
  const STRASSEN_LEGEND = /** @type {const} */ (['active', 'visited', 'sorted']);

  const mValues = $derived([sFrame.M.map((v) => v)]);
  const mHeaders = $derived(sFrame.M.map((_, i) => m.mName(i)));
  /** @param {number} r @param {number} c @returns {VisualState} */
  const cState = (r, c) =>
    sFrame.kind === 'entry' && sFrame.current === r * 2 + c
      ? 'active'
      : sFrame.C[r][c] === null
        ? ''
        : 'sorted';
</script>

<LessonLayout lesson={m}>
  <div class="mb-4">
    <SegmentedControl
      legend={m.modeLabel}
      name="mode"
      options={MODES.map((v) => ({ value: v, label: m.modes[v] }))}
      bind:value={mode}
    />
  </div>

  {#if mode === 'numbers'}
    <form
      class="mb-4 flex flex-wrap items-end gap-4"
      onsubmit={(e) => {
        e.preventDefault();
        commitFactor('x');
        commitFactor('y');
      }}
    >
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.exampleLabel}
        <select name="example" class="field" value={example} onchange={loadExample}>
          <option value="" disabled>{m.examplePlaceholder}</option>
          {#each EXAMPLE_KEYS as k (k)}
            <option value={k}>{m.examples[k]}</option>
          {/each}
        </select>
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.xLabel}
        <input
          type="text"
          name="x"
          inputmode="numeric"
          class="field w-28 font-mono"
          bind:value={xText}
          onchange={() => commitFactor('x')}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.yLabel}
        <input
          type="text"
          name="y"
          inputmode="numeric"
          class="field w-28 font-mono"
          bind:value={yText}
          onchange={() => commitFactor('y')}
        />
      </label>
      <SegmentedControl
        legend={m.methodLabel}
        name="method"
        options={METHODS.map((v) => ({ value: v, label: m.methods[v] }))}
        bind:value={method}
        onchange={switchMethod}
      />
    </form>

    <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
        <div class="rounded-xl border border-slate-200 bg-white p-4">
          <TreeView
            {roots}
            ariaLabel={m.treeLabel}
            labelOf={(node) => {
              const n = frame.nodes[Number(node.id)];
              return m.nodeLabel(n, m.states[nodeState(n)] ?? '');
            }}
            onselect={(id) => (selected = Number(id))}
            selected={selected !== null && selected < frame.nodes.length ? selected : null}
            emptyText={m.emptyTree}
            speed={mul.speed}
          />
          <ul class="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
            {#each legend as s (s)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
                {m.markers[s]}
                {m.legend[s]}
              </li>
            {/each}
          </ul>
        </div>

        <p
          class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
          aria-live={mul.playing ? 'off' : 'polite'}
        >
          {narration}
        </p>
      </div>

      <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.products}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.products}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.calls}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.calls}</dd>
          </div>
          <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.adds}</dt>
            <dd class="text-2xl font-bold tabular-nums">{frame.adds}</dd>
          </div>
        </dl>
        <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <h2 class="mb-1 text-xs text-slate-500">{m.selectedTitle}</h2>
          {#if shown}
            {#each m.selectedLines(shown) as line, i (i)}
              <p class={i === 0 ? 'font-mono font-semibold text-slate-900' : 'font-mono text-xs'}>
                {line}
              </p>
            {/each}
          {:else}
            <p>{m.selectHint}</p>
          {/if}
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <h2 class="mb-2 text-xs text-slate-500">{m.compareTitle}</h2>
          <dl class="space-y-1">
            {#each totals as row (row.method)}
              <div
                class="flex justify-between gap-2 {row.method === method
                  ? 'font-semibold text-slate-900'
                  : 'text-slate-600'}"
              >
                <dt>{m.methods[row.method]}</dt>
                <dd class="tabular-nums">{row.last?.products ?? 0}</dd>
              </div>
            {/each}
          </dl>
        </section>
        <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm">
          <h2 class="mb-2 text-xs text-slate-500">{m.growthTitle}</h2>
          <table class="w-full text-right tabular-nums">
            <thead class="text-xs text-slate-500">
              <tr>
                {#each m.growthHead as h (h)}
                  <th class="pb-1 font-semibold first:text-left">{h}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each GROWTH as n (n)}
                {@const c = digitProducts(n)}
                <tr class="border-t border-slate-100">
                  <td class="py-0.5 text-left">{n}</td>
                  <td class="py-0.5">{c.four.toLocaleString('en-US')}</td>
                  <td class="py-0.5">{c.three.toLocaleString('en-US')}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </section>
        <CodePanel lines={pseudocode[method]} active={frame.lines} />
      </div>
      <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
        <StepControls player={mul} />
      </div>
    </div>
  {:else}
    <form
      class="mb-4 flex flex-wrap items-end gap-4"
      onsubmit={(e) => {
        e.preventDefault();
        commitMatrix('A');
        commitMatrix('B');
      }}
    >
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.aLabel}
        <input
          type="text"
          name="A"
          class="field w-36 font-mono"
          bind:value={aText}
          onchange={() => commitMatrix('A')}
        />
      </label>
      <label
        class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase"
      >
        {m.bLabel}
        <input
          type="text"
          name="B"
          class="field w-36 font-mono"
          bind:value={bText}
          onchange={() => commitMatrix('B')}
        />
      </label>
    </form>

    <div class="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div class="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:row-start-1">
        <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex flex-wrap items-start gap-6">
            <div>
              <h2 class="mb-1 text-xs text-slate-500">{m.matrixA}</h2>
              <DpTable values={sFrame.A} ariaLabel={m.matrixAria(m.matrixA, sFrame.A)} />
            </div>
            <div>
              <h2 class="mb-1 text-xs text-slate-500">{m.matrixB}</h2>
              <DpTable values={sFrame.B} ariaLabel={m.matrixAria(m.matrixB, sFrame.B)} />
            </div>
            <div>
              <h2 class="mb-1 text-xs text-slate-500">{m.matrixC}</h2>
              <DpTable
                values={sFrame.C}
                stateOf={cState}
                markerOf={(r, c) => (cState(r, c) === 'active' ? m.markers.active : '')}
                ariaLabel={m.matrixAria(m.matrixC, sFrame.C)}
                speed={strassen.speed}
              />
            </div>
          </div>
          <div class="min-w-0">
            <h2 class="mb-1 text-xs text-slate-500">{m.mTitle}</h2>
            <DpTable
              values={mValues}
              colHeaders={mHeaders}
              stateOf={(_, c) =>
                sFrame.kind === 'product' && sFrame.current === c
                  ? 'active'
                  : sFrame.M[c] === null
                    ? ''
                    : 'visited'}
              markerOf={(_, c) =>
                sFrame.kind === 'product' && sFrame.current === c ? m.markers.active : ''}
              ariaLabel={m.matrixAria(m.mTitle, mValues)}
              speed={strassen.speed}
            />
          </div>
          <ul class="flex flex-wrap gap-4 text-xs text-slate-600">
            {#each STRASSEN_LEGEND as s (s)}
              <li class="flex items-center gap-1.5">
                <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[s]}"></span>
                {s === 'active' ? m.markers.active : ''}
                {m.strassenLegend[s]}
              </li>
            {/each}
          </ul>
        </div>

        <p
          class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
          aria-live={strassen.playing ? 'off' : 'polite'}
        >
          {narration}
        </p>
      </div>

      <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.multiplications}</dt>
            <dd class="text-2xl font-bold tabular-nums">{sFrame.multiplications}</dd>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-3">
            <dt class="text-xs text-slate-500">{m.stats.additions}</dt>
            <dd class="text-2xl font-bold tabular-nums">{sFrame.additions}</dd>
          </div>
        </dl>
        <section class="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <h2 class="mb-1 text-xs text-slate-500">{m.definitionTitle}</h2>
          <p>{m.definitionLine}</p>
        </section>
        <CodePanel lines={strassenPseudocode} active={sFrame.lines} />
      </div>
      <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
        <StepControls player={strassen} />
      </div>
    </div>
  {/if}

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
