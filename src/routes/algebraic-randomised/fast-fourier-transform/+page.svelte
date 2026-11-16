<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField } from '$lib/components/numeric-field.js';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG, STATE_FILL, STATE_TEXT, stateStroke } from '$lib/components/visual-state.js';
  import { parseValueList } from '$lib/algo-engine/parse-values.js';
  import {
    FFT_PRESETS,
    MAX_ABS,
    MAX_COEFFS,
    fftPseudocode,
    fftTrace,
    rootOfUnity,
  } from '$lib/algo-engine/fast-fourier-transform.js';
  import { en as m } from '$lib/lessons/fast-fourier-transform/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {keyof typeof FFT_PRESETS} Preset */
  /** @typedef {import('$lib/algo-engine/fast-fourier-transform.js').Complex} Complex */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(FFT_PRESETS));
  /** @type {{ key: keyof typeof m.legend, state: VisualState, dashed?: boolean }[]} */
  const LEGEND = [
    { key: 'input', state: 'compare' },
    { key: 'output', state: 'active' },
    { key: 'done', state: '' },
    { key: 'empty', state: 'pruned', dashed: true },
  ];

  const LABEL_W = 48;
  const COL = 128;
  const NODE_W = 100;
  const NODE_H = 24;
  const ROW = 32;
  const TOP = 26;
  const RIGHT_W = 58;

  const INITIAL = FFT_PRESETS.linear;
  let preset = $state(/** @type {Preset | ''} */ ('linear'));
  let a = $state(INITIAL.a.slice());
  let b = $state(INITIAL.b.slice());
  let aDraft = $state(INITIAL.a.join(', '));
  let bDraft = $state(INITIAL.b.join(', '));
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(fftTrace(INITIAL.a, INITIAL.b));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(fftTrace(a, b));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  /** @param {string} text */
  const parse = (text) =>
    parseValueList(text, { min: -MAX_ABS, max: MAX_ABS, maxN: MAX_COEFFS, signed: true });

  /** @param {'a' | 'b'} which */
  function commit(which) {
    const parsed = parse(which === 'a' ? aDraft : bDraft);
    if (!('values' in parsed)) {
      if (which === 'a') aDraft = a.join(', ');
      else bDraft = b.join(', ');
      say(m.coeffError(MAX_COEFFS, MAX_ABS));
      return;
    }
    const old = which === 'a' ? a : b;
    if (parsed.values.join(',') === old.join(',')) return;
    if (which === 'a') a = parsed.values;
    else b = parsed.values;
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    a = FFT_PRESETS[p].a.slice();
    b = FFT_PRESETS[p].b.slice();
    aDraft = a.join(', ');
    bDraft = b.join(', ');
    rebuild();
  }

  const cols = $derived(frame.columns.length);
  const svgW = $derived(LABEL_W + Math.max(0, cols - 1) * COL + NODE_W + RIGHT_W);
  const svgH = $derived(TOP + frame.n * ROW + 4);
  /** @param {number} c */
  const colX = (c) => LABEL_W + c * COL;
  /** @param {number} r */
  const rowY = (r) => TOP + r * ROW + ROW / 2;
  const scaled = $derived(frame.kind === 'scale' || frame.kind === 'done');

  /** Every butterfly of every stage, in the order the loops run them. */
  const pairs = $derived.by(() => {
    /** @type {{ s: number, top: number, bottom: number }[]} */
    const out = [];
    for (let s = 1; s < cols; s++) {
      const len = 2 ** s;
      for (let start = 0; start < frame.n; start += len)
        for (let j = 0; j < len / 2; j++)
          out.push({ s, top: start + j, bottom: start + j + len / 2 });
    }
    return out;
  });

  /** @param {{ s: number, top: number }} p @returns {'now' | 'done' | 'todo'} */
  function pairState(p) {
    if (p.s === frame.stage && p.top === frame.top) return 'now';
    return frame.columns[p.s]?.[p.top] ? 'done' : 'todo';
  }

  /** @param {number} c @param {number} r @returns {{ state: VisualState, role: string }} */
  function nodeOf(c, r) {
    if (frame.stage > 0 && (r === frame.top || r === frame.bottom)) {
      if (c === frame.stage)
        return { state: 'active', role: r === frame.top ? m.roles.plus : m.roles.minus };
      if (c === frame.stage - 1)
        return { state: 'compare', role: r === frame.top ? m.roles.u : m.roles.v };
    }
    return { state: frame.columns[c][r] ? '' : 'pruned', role: '' };
  }

  /** @param {Complex | null} z */
  const valueText = (z) => (z ? m.complex(z) : '');

  const CIRCLE = 180;
  const CR = 62;
  const roots = $derived(
    Array.from({ length: frame.n }, (_, k) => {
      const w = rootOfUnity(k, frame.n);
      return {
        k,
        x: CIRCLE / 2 + CR * w.re,
        y: CIRCLE / 2 - CR * w.im,
        lx: CIRCLE / 2 + (CR + 16) * w.re,
        ly: CIRCLE / 2 - (CR + 16) * w.im,
      };
    }),
  );
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 flex flex-wrap items-end gap-4"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      <span>{m.fields.a} <span class="normal-case">({m.fieldHint})</span></span>
      <input
        type="text"
        name="a"
        class="field w-56 tabular-nums"
        bind:value={aDraft}
        onchange={() => commit('a')}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      <span>{m.fields.b} <span class="normal-case">({m.fieldHint})</span></span>
      <input
        type="text"
        name="b"
        class="field w-56 tabular-nums"
        bind:value={bDraft}
        onchange={() => commit('b')}
      />
    </label>
    <label class="flex flex-col gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
      {m.presetLabel}
      <select
        name="preset"
        class="field"
        value={preset}
        onchange={(ev) => loadPreset(/** @type {Preset} */ (ev.currentTarget.value))}
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
        <h2 class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.polyTitle}
        </h2>
        <p class="font-mono text-sm" data-testid="poly-a">{m.polyLine('A', frame.a)}</p>
        <p class="font-mono text-sm" data-testid="poly-b">{m.polyLine('B', frame.b)}</p>
      </div>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2
          class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase"
          data-testid="phase"
        >
          {m.phaseTitles[frame.phase]}
        </h2>
        {#if frame.columns.length > 0}
          <ScrollFrame>
            <svg
              viewBox="0 0 {svgW} {svgH}"
              width={svgW}
              class="max-w-none"
              role="img"
              aria-label={m.diagramAria(frame.n)}
            >
              <text
                x={colX(0) + NODE_W / 2}
                y="14"
                text-anchor="middle"
                class="fill-slate-500 text-[11px]">{m.inputColumn}</text
              >
              {#each Array.from({ length: cols - 1 }, (_, i) => i + 1) as s (s)}
                <text
                  x={colX(s) + NODE_W / 2}
                  y="14"
                  text-anchor="middle"
                  class="fill-slate-500 text-[11px]">{m.stageColumn(s)}</text
                >
              {/each}
              {#each pairs as p (`${p.s}-${p.top}`)}
                {@const st = pairState(p)}
                {@const x1 = colX(p.s - 1) + NODE_W}
                {@const x2 = colX(p.s)}
                {#each [[p.top, p.top], [p.bottom, p.top], [p.top, p.bottom], [p.bottom, p.bottom]] as [from, to] (`${from}-${to}`)}
                  <line
                    {x1}
                    y1={rowY(from)}
                    {x2}
                    y2={rowY(to)}
                    class={st === 'now'
                      ? 'stroke-state-active'
                      : st === 'done'
                        ? 'stroke-slate-500'
                        : 'stroke-slate-200'}
                    stroke-width={st === 'now' ? 3 : 1.2}
                    stroke-dasharray={st === 'todo' ? '3 3' : undefined}
                  />
                {/each}
              {/each}
              {#each frame.columns as column, c (c)}
                {#each column as z, r (r)}
                  {@const node = nodeOf(c, r)}
                  <g>
                    <title>{m.nodeLabel(c, r, valueText(z), node.role)}</title>
                    <rect
                      x={colX(c)}
                      y={rowY(r) - NODE_H / 2}
                      width={NODE_W}
                      height={NODE_H}
                      rx="5"
                      class="{STATE_FILL[node.state]} {stateStroke(node.state)}"
                      stroke-dasharray={z ? undefined : '3 3'}
                    />
                    <text
                      x={colX(c) + NODE_W / 2}
                      y={rowY(r) + 4}
                      text-anchor="middle"
                      class="{STATE_TEXT[node.state]} font-mono text-[11px] {node.role
                        ? 'font-bold'
                        : ''}">{z ? valueText(z) : m.pending}</text
                    >
                    {#if node.role}
                      <text
                        x={c === frame.stage ? colX(c) + NODE_W + 4 : colX(c) - 4}
                        y={rowY(r) - NODE_H / 2 - 1}
                        text-anchor={c === frame.stage ? 'start' : 'end'}
                        class="fill-slate-900 text-[10px] font-semibold">{node.role}</text
                      >
                    {/if}
                  </g>
                {/each}
              {/each}
              {#each frame.order as src, r (r)}
                <text
                  x={LABEL_W - 6}
                  y={rowY(r) + 4}
                  text-anchor="end"
                  class="fill-slate-700 font-mono text-[11px]">{m.inputName(frame.phase, src)}</text
                >
                <text
                  x={colX(cols - 1) + NODE_W + 6}
                  y={rowY(r) + 4}
                  class="fill-slate-700 font-mono text-[11px]"
                  >{m.outputName(frame.phase, r, scaled)}</text
                >
              {/each}
            </svg>
          </ScrollFrame>
          <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            {#each LEGEND as item (item.key)}
              <li class="flex items-center gap-1.5">
                <span
                  class="size-3 rounded-sm border border-slate-700 {STATE_BG[
                    item.state
                  ]} {item.dashed ? 'border-dashed' : ''}"
                ></span>{m.legend[item.key]}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="text-sm text-slate-500">{m.describe(frame)}</p>
        {/if}
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.valuesTitle}
        </h2>
        <ScrollFrame>
          <table class="w-full text-right font-mono text-sm tabular-nums" data-testid="values">
            <thead>
              <tr class="text-xs text-slate-500">
                <th scope="col" class="px-2 py-1 font-semibold">{m.valuesHead.k}</th>
                <th scope="col" class="px-2 py-1 font-semibold">{m.valuesHead.a}</th>
                <th scope="col" class="px-2 py-1 font-semibold">{m.valuesHead.b}</th>
                <th scope="col" class="px-2 py-1 font-semibold">{m.valuesHead.c}</th>
              </tr>
            </thead>
            <tbody>
              {#each Array.from({ length: frame.n }, (_, k) => k) as k (k)}
                <tr class="border-t border-slate-100">
                  <td class="px-2 py-1">{k}</td>
                  <td class="px-2 py-1 whitespace-nowrap"
                    >{frame.fa ? m.complex(frame.fa[k]) : m.pending}</td
                  >
                  <td class="px-2 py-1 whitespace-nowrap"
                    >{frame.fb ? m.complex(frame.fb[k]) : m.pending}</td
                  >
                  <td class="px-2 py-1 whitespace-nowrap"
                    >{frame.prod ? m.complex(frame.prod[k]) : m.pending}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </ScrollFrame>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="col-span-2 rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.resultTitle}</dt>
          <dd class="font-mono text-base font-bold break-words" data-testid="result">
            {frame.result ? m.poly(frame.result) : m.resultPending}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.n}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="n">{frame.n}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.stage}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="stage">
            {frame.stage > 0 ? frame.stage : m.noStage}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.butterflies}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="butterflies">
            {frame.butterflies}
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.naive}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="naive">{frame.naive}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.circleTitle}</h2>
        <svg
          viewBox="0 0 {CIRCLE} {CIRCLE}"
          class="mx-auto block w-44"
          role="img"
          aria-label={m.circleAria(frame.n)}
        >
          <circle cx={CIRCLE / 2} cy={CIRCLE / 2} r={CR} class="fill-none stroke-slate-300" />
          <line x1="10" y1={CIRCLE / 2} x2={CIRCLE - 10} y2={CIRCLE / 2} class="stroke-slate-200" />
          <line x1={CIRCLE / 2} y1="10" x2={CIRCLE / 2} y2={CIRCLE - 10} class="stroke-slate-200" />
          {#if frame.root >= 0}
            <line
              x1={CIRCLE / 2}
              y1={CIRCLE / 2}
              x2={roots[frame.root].x}
              y2={roots[frame.root].y}
              class="stroke-state-active"
              stroke-width="2.5"
            />
          {/if}
          {#each roots as p (p.k)}
            {@const hot = p.k === frame.root}
            <g>
              <title>{m.rootLabel(frame.n, p.k, hot)}</title>
              <circle
                cx={p.x}
                cy={p.y}
                r={hot ? 7 : 4}
                class="{STATE_FILL[hot ? 'active' : '']} {stateStroke(hot ? 'active' : 'visited')}"
              />
              <text
                x={p.lx}
                y={p.ly + 4}
                text-anchor="middle"
                class="text-[11px] {hot ? 'fill-slate-900 font-bold' : 'fill-slate-500'}"
                >{p.k}</text
              >
            </g>
          {/each}
        </svg>
        <p class="mt-1 text-center font-mono text-sm font-semibold" data-testid="twiddle">
          {frame.twiddle ? m.twiddleText(frame.n, frame.root, frame.twiddle) : m.noTwiddle}
        </p>
      </div>
      <CodePanel lines={fftPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
