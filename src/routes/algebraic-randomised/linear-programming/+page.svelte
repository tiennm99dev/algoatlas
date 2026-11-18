<script>
  import CodePanel from '$lib/components/code-panel.svelte';
  import LessonLayout from '$lib/components/lesson-layout.svelte';
  import { enterField, wholeInRange } from '$lib/components/numeric-field.js';
  import PointPlane from '$lib/components/point-plane.svelte';
  import PracticeBlock from '$lib/components/practice-block.svelte';
  import ScrollFrame from '$lib/components/scroll-frame.svelte';
  import StepControls from '$lib/components/step-controls.svelte';
  import { STATE_BG } from '$lib/components/visual-state.js';
  import { fcmp, fvalue } from '$lib/algo-engine/rational.js';
  import {
    LP_PRESETS,
    MAX_COEF,
    MAX_CONSTRAINTS,
    MAX_RHS,
    MIN_CONSTRAINTS,
    clipLine,
    feasibleCorners,
    regionPolygon,
    simplexPseudocode,
    simplexTrace,
    viewSize,
  } from '$lib/algo-engine/linear-programming.js';
  import { en as m } from '$lib/lessons/linear-programming/copy.en.js';
  import { createPlayer } from '$lib/player/player.svelte.js';

  /** @typedef {import('$lib/components/visual-state.js').VisualState} VisualState */
  /** @typedef {import('$lib/components/plane-types.js').PlanePoint} PlanePoint */
  /** @typedef {import('$lib/components/plane-types.js').PlaneSegment} PlaneSegment */
  /** @typedef {import('$lib/algo-engine/linear-programming.js').Constraint} Constraint */
  /** @typedef {keyof typeof LP_PRESETS} Preset */
  /** @typedef {keyof typeof m.cornerRoles} CornerRole */

  const PRESET_KEYS = /** @type {Preset[]} */ (Object.keys(LP_PRESETS));
  /** @type {Record<CornerRole, VisualState>} */
  const CORNER_STATE = { now: 'active', visited: 'path', best: 'sorted', '': '' };
  /** @type {{ key: keyof typeof m.legend, state: VisualState }[]} */
  const LEGEND = [
    { key: 'region', state: 'frontier' },
    { key: 'now', state: 'active' },
    { key: 'path', state: 'path' },
    { key: 'best', state: 'sorted' },
    { key: 'level', state: 'compare' },
  ];
  const NEW_CONSTRAINT = { a1: 1, a2: 1, b: 10 };
  const LETTERS = 'ABCDEFGHIJKLMNOP';

  const INITIAL = LP_PRESETS.classic;
  let preset = $state(/** @type {Preset | ''} */ ('classic'));
  let c = $state(INITIAL.c.slice());
  let cons = $state(INITIAL.cons.map((con) => ({ ...con })));
  let cDraft = $state(/** @type {(number | null)[]} */ (INITIAL.c.slice()));
  let consDraft = $state(
    /** @type {{ a1: number | null, a2: number | null, b: number | null }[]} */ (
      INITIAL.cons.map((con) => ({ ...con }))
    ),
  );
  let notice = $state({ text: '', at: -1 });

  const player = createPlayer(simplexTrace(INITIAL.c, INITIAL.cons));
  const frame = $derived(player.frame);
  const narration = $derived(notice.at === player.index ? notice.text : m.describe(frame));

  function rebuild() {
    notice = { text: '', at: -1 };
    player.load(simplexTrace(c, cons));
  }

  /** @param {string} message */
  function say(message) {
    notice = { text: message, at: player.index };
  }

  /** @param {number} j */
  function commitC(j) {
    if (!wholeInRange(cDraft[j], -MAX_COEF, MAX_COEF)) {
      cDraft[j] = c[j];
      say(m.coefError(MAX_COEF));
      return;
    }
    if (cDraft[j] === c[j]) return;
    c[j] = /** @type {number} */ (cDraft[j]);
    preset = '';
    rebuild();
  }

  /** @param {number} i @param {'a1' | 'a2' | 'b'} key */
  function commitCon(i, key) {
    const v = consDraft[i][key];
    const ok = key === 'b' ? wholeInRange(v, 0, MAX_RHS) : wholeInRange(v, -MAX_COEF, MAX_COEF);
    if (!ok) {
      consDraft[i][key] = cons[i][key];
      say(key === 'b' ? m.rhsError(MAX_RHS) : m.coefError(MAX_COEF));
      return;
    }
    if (v === cons[i][key]) return;
    cons[i][key] = /** @type {number} */ (v);
    preset = '';
    rebuild();
  }

  function addConstraint() {
    if (cons.length >= MAX_CONSTRAINTS) {
      say(m.tooMany(MAX_CONSTRAINTS));
      return;
    }
    cons.push({ ...NEW_CONSTRAINT });
    consDraft.push({ ...NEW_CONSTRAINT });
    preset = '';
    rebuild();
  }

  /** @param {number} i */
  function removeConstraint(i) {
    if (cons.length <= MIN_CONSTRAINTS) {
      say(m.tooFew);
      return;
    }
    cons.splice(i, 1);
    consDraft.splice(i, 1);
    preset = '';
    rebuild();
  }

  /** @param {Preset} p */
  function loadPreset(p) {
    preset = p;
    c = LP_PRESETS[p].c.slice();
    cDraft = c.slice();
    cons = LP_PRESETS[p].cons.map((con) => ({ ...con }));
    consDraft = cons.map((con) => ({ ...con }));
    rebuild();
  }

  const view = $derived(viewSize(frame.cons));

  /** The corners in order around the region, so their letters run around it. */
  const corners = $derived.by(() => {
    const list = feasibleCorners(frame.cons);
    const cx = list.reduce((s, p) => s + fvalue(p.x), 0) / list.length;
    const cy = list.reduce((s, p) => s + fvalue(p.y), 0) / list.length;
    return list
      .map((p) => ({ ...p, angle: Math.atan2(fvalue(p.y) - cy, fvalue(p.x) - cx) }))
      .sort((p, q) => p.angle - q.angle);
  });

  /** @param {{ x: import('$lib/algo-engine/rational.js').Frac, y: import('$lib/algo-engine/rational.js').Frac }} p @returns {CornerRole} */
  function roleOf(p) {
    const here = fcmp(p.x, frame.x) === 0 && fcmp(p.y, frame.y) === 0;
    if (here) return frame.status === 'optimal' ? 'best' : 'now';
    return frame.path.some((q) => fcmp(q.x, p.x) === 0 && fcmp(q.y, p.y) === 0) ? 'visited' : '';
  }

  /** @type {PlanePoint[]} */
  const points = $derived(
    corners.map((p, id) => {
      const role = roleOf(p);
      return {
        id,
        x: fvalue(p.x),
        y: fvalue(p.y),
        label: role === 'now' || role === 'best' ? m.cornerMarkers[role] : LETTERS[id],
        state: CORNER_STATE[role],
        note: m.cornerNote(p.x, p.y),
        fixed: true,
      };
    }),
  );

  /** @type {PlaneSegment[]} */
  const segments = $derived.by(() => {
    /** @type {PlaneSegment[]} */
    const out = [];
    frame.cons.forEach((con, i) => {
      const line = clipLine(con.a1, con.a2, con.b, view.xMax, view.yMax);
      if (line) out.push({ key: `con-${i}`, ...line, label: m.lineLabel(i) });
    });
    const level = clipLine(frame.c[0], frame.c[1], fvalue(frame.z), view.xMax, view.yMax);
    if (level)
      out.push({
        key: 'level',
        ...level,
        state: 'compare',
        dashed: true,
        label: m.levelLabel(frame.z),
      });
    for (let i = 1; i < frame.path.length; i++) {
      const [p, q] = [frame.path[i - 1], frame.path[i]];
      if (fcmp(p.x, q.x) === 0 && fcmp(p.y, q.y) === 0) continue;
      out.push({
        key: `path-${i}`,
        x1: fvalue(p.x),
        y1: fvalue(p.y),
        x2: fvalue(q.x),
        y2: fvalue(q.y),
        state: 'path',
        thick: true,
        arrow: true,
      });
    }
    return out;
  });

  const polygons = $derived([
    {
      key: 'region',
      pts: regionPolygon(frame.cons, view.xMax, view.yMax),
      state: /** @type {VisualState} */ ('frontier'),
    },
  ]);

  const showEntering = $derived(['enter', 'leave', 'unbounded'].includes(frame.kind));
  const width = $derived(2 + frame.cons.length);
  /** @param {number} i @param {number} j */
  function cellClass(i, j) {
    if (frame.kind === 'leave' && i === frame.leaving && j === frame.entering)
      return 'bg-state-active text-white font-bold';
    if (frame.kind === 'leave' && i === frame.leaving) return 'bg-state-swap text-white';
    if (showEntering && j === frame.entering) return 'bg-state-compare';
    return '';
  }
</script>

<LessonLayout lesson={m}>
  <!-- Enter in a field leaves and re-enters it, which commits it through its change handler. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <form
    class="mb-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[auto_1fr_auto]"
    onkeydown={(ev) => enterField(ev, {})}
    onsubmit={(ev) => ev.preventDefault()}
  >
    <fieldset>
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.objectiveTitle}
      </legend>
      <div class="flex gap-2">
        {#each [0, 1] as j (j)}
          <label class="flex flex-col gap-1 text-xs text-slate-500">
            {j === 0 ? m.fields.c1 : m.fields.c2}
            <input
              type="number"
              name="c{j + 1}"
              min={-MAX_COEF}
              max={MAX_COEF}
              class="field w-16 text-right tabular-nums"
              bind:value={cDraft[j]}
              onchange={() => commitC(j)}
            />
          </label>
        {/each}
      </div>
    </fieldset>
    <fieldset class="min-w-0">
      <legend class="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {m.constraintsTitle}
      </legend>
      <ul class="flex flex-col gap-1">
        {#each consDraft as con, i (i)}
          <li class="flex flex-wrap items-center gap-1 text-sm" aria-label={m.constraintAria(i)}>
            <span class="w-4 text-xs text-slate-500">{i + 1}</span>
            <input
              type="number"
              name="a1-{i}"
              min={-MAX_COEF}
              max={MAX_COEF}
              aria-label={m.coefAria(i, m.coefLabels.a1)}
              class="field w-14 text-right tabular-nums"
              bind:value={con.a1}
              onchange={() => commitCon(i, 'a1')}
            />
            <span>x +</span>
            <input
              type="number"
              name="a2-{i}"
              min={-MAX_COEF}
              max={MAX_COEF}
              aria-label={m.coefAria(i, m.coefLabels.a2)}
              class="field w-14 text-right tabular-nums"
              bind:value={con.a2}
              onchange={() => commitCon(i, 'a2')}
            />
            <span>y ≤</span>
            <input
              type="number"
              name="b-{i}"
              min="0"
              max={MAX_RHS}
              aria-label={m.coefAria(i, m.coefLabels.b)}
              class="field w-14 text-right tabular-nums"
              bind:value={con.b}
              onchange={() => commitCon(i, 'b')}
            />
            <button
              type="button"
              class="btn-outline ml-1 text-xs"
              aria-label={m.removeConstraint(i)}
              onclick={() => removeConstraint(i)}>{m.removeText}</button
            >
          </li>
        {/each}
      </ul>
      <button type="button" class="btn-outline mt-2 text-sm" onclick={addConstraint}
        >{m.addConstraint}</button
      >
    </fieldset>
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
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.planeTitle}
        </h2>
        <PointPlane
          ariaLabel={m.planeAria(corners.length)}
          xMax={view.xMax}
          yMax={view.yMax}
          {points}
          {segments}
          {polygons}
          labelOf={(p) => {
            const corner = corners[p.id];
            return m.cornerLabel(LETTERS[p.id], corner.x, corner.y, m.cornerRoles[roleOf(corner)]);
          }}
          speed={player.speed}
        />
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {#each LEGEND as item (item.key)}
            <li class="flex items-center gap-1.5">
              <span class="size-3 rounded-sm border border-slate-700 {STATE_BG[item.state]}"
              ></span>{m.legend[item.key]}
            </li>
          {/each}
        </ul>
        <ol class="mt-2 text-xs text-slate-600" data-testid="constraint-list">
          {#each frame.cons as con, i (i)}
            <li>{m.lineLabel(i)}: {m.constraintText(con)}</li>
          {/each}
        </ol>
      </div>

      <p
        class="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800"
        aria-live={player.playing ? 'off' : 'polite'}
      >
        {narration}
      </p>

      <div class="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
        <h2 class="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {m.tableauTitle}
        </h2>
        <ScrollFrame>
          <table class="font-mono text-sm tabular-nums" data-testid="tableau">
            <thead>
              <tr class="text-xs text-slate-500">
                <th scope="col" class="px-2 py-1 text-left">{m.tableauHead.basis}</th>
                {#each Array.from({ length: width }, (_, j) => j) as j (j)}
                  <th scope="col" class="px-2 py-1 text-right">
                    {m.varName(j)}{showEntering && j === frame.entering
                      ? ` ${m.markers.enter}`
                      : ''}
                  </th>
                {/each}
                <th scope="col" class="px-2 py-1 text-right">{m.tableauHead.b}</th>
                <th scope="col" class="px-2 py-1 text-right">{m.tableauHead.ratio}</th>
              </tr>
            </thead>
            <tbody>
              {#each frame.rows as row, i (i)}
                <tr class="border-t border-slate-100" data-testid="row-{i}">
                  <th scope="row" class="px-2 py-1 text-left">
                    {m.varName(frame.basis[i])}{frame.kind === 'leave' && i === frame.leaving
                      ? ` ${m.markers.leave}`
                      : ''}
                  </th>
                  {#each row.slice(0, width) as cell, j (j)}
                    <td class="px-2 py-1 text-right whitespace-nowrap {cellClass(i, j)}">
                      {frame.kind === 'leave' && i === frame.leaving && j === frame.entering
                        ? `${m.markers.pivot} `
                        : ''}{m.fracText(cell)}
                    </td>
                  {/each}
                  <td class="px-2 py-1 text-right whitespace-nowrap">{m.fracText(row[width])}</td>
                  <td class="px-2 py-1 text-right whitespace-nowrap">
                    {frame.ratios[i] ? m.fracText(/** @type {any} */ (frame.ratios[i])) : m.noRatio}
                  </td>
                </tr>
              {/each}
              <tr class="border-t-2 border-slate-300 font-semibold" data-testid="cost-row">
                <th scope="row" class="px-2 py-1 text-left font-sans text-xs">{m.costRow}</th>
                {#each frame.cost as cost, j (j)}
                  <td
                    class="px-2 py-1 text-right whitespace-nowrap {showEntering &&
                    j === frame.entering
                      ? 'bg-state-compare'
                      : ''}">{m.fracText(cost)}</td
                  >
                {/each}
                <td class="px-2 py-1 text-right whitespace-nowrap"
                  >{m.zCell} = {m.fracText(frame.z)}</td
                >
                <td></td>
              </tr>
            </tbody>
          </table>
        </ScrollFrame>
        <p class="mt-2 text-xs text-slate-600">{m.tableauLegend}</p>
      </div>
    </div>

    <div class="flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-span-2">
      <dl class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.z}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="z">{m.fracText(frame.z)}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.corner}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="corner">
            ({m.fracText(frame.x)}, {m.fracText(frame.y)})
          </dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.pivots}</dt>
          <dd class="text-xl font-bold tabular-nums" data-testid="pivots">{frame.pivots}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <dt class="text-xs text-slate-500">{m.stats.status}</dt>
          <dd class="text-xl font-bold" data-testid="status">{m.status[frame.status]}</dd>
        </div>
      </dl>
      <div class="rounded-xl border border-slate-200 bg-white p-3">
        <h2 class="mb-1 text-xs text-slate-500">{m.dualTitle}</h2>
        <p class="text-sm text-slate-700">{m.dualProblem(frame.cons)}</p>
        <p class="mt-1 text-sm font-semibold text-slate-900" data-testid="dual">
          {#if frame.dual}
            {m.dualValues(frame.dual, frame.z)}
          {:else if frame.status === 'unbounded'}
            {m.dualNone}
          {:else}
            {m.dualPending}
          {/if}
        </p>
      </div>
      <CodePanel lines={simplexPseudocode} active={frame.lines} />
    </div>
    <div class="sticky bottom-2 z-10 print:hidden lg:static lg:col-start-1 lg:row-start-2">
      <StepControls {player} />
    </div>
  </div>

  <div class="mt-8">
    <PracticeBlock exercises={m.practice} id={m.slug} title={m.practiceTitle} />
  </div>
</LessonLayout>
