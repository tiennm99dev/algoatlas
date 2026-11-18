/**
 * The simplex method on a two-variable linear program in standard form: maximise c₁x + c₂y
 * subject to a₁x + a₂y ≤ b for each constraint, with x, y ≥ 0 and every b ≥ 0, so the origin is
 * a feasible starting vertex and no first phase is needed. Each constraint gets a slack
 * variable, and the tableau starts with the slacks basic (x = y = 0).
 *
 * The objective row holds the reduced costs c̄ⱼ: how much the objective gains per unit of
 * variable j. A pivot brings in the variable with the largest positive c̄ⱼ (Dantzig’s rule,
 * ties to the lower index) and removes the basic variable of the row with the smallest ratio
 * bᵢ / aᵢₑ over aᵢₑ > 0 (ties to the lower variable index), which keeps every b ≥ 0. Each basis
 * is a corner of the feasible polygon, so the run walks corner to corner. When no c̄ⱼ is
 * positive the corner is optimal, and minus the slacks’ reduced costs are the optimal dual
 * prices; when the entering column has no positive entry the objective is unbounded.
 */

import { fadd, fcmp, fdiv, fmul, frac, fsub, fvalue, isZero } from './rational.js';

export const MIN_CONSTRAINTS = 1;
export const MAX_CONSTRAINTS = 4;
export const MAX_COEF = 9;
export const MAX_RHS = 30;
export const MAX_PIVOTS = 20;

/** @typedef {import('./rational.js').Frac} Frac */

/**
 * @typedef {object} Constraint
 * @property {number} a1
 * @property {number} a2
 * @property {number} b
 */

export const simplexPseudocode = [
  'bắt đầu ở x = y = 0: các biến bù nằm trong cơ sở',
  'loop:',
  '  e = biến có chi phí rút gọn dương lớn nhất',
  '  if không có: return đỉnh hiện tại  // tối ưu',
  '  l = hàng có bᵢ / aᵢₑ nhỏ nhất, xét các aᵢₑ > 0',
  '  if không có: return “không bị chặn”',
  '  xoay tại (l, e): e vào, biến của hàng l ra',
];

/**
 * @typedef {object} LpFrame
 * @property {'start'|'enter'|'leave'|'pivot'|'optimal'|'unbounded'|'done'} kind
 * @property {number[]} c
 * @property {Constraint[]} cons
 * @property {Frac[][]} rows  One row per constraint: x, y, s₁ … sₘ, then b.
 * @property {Frac[]} cost  Reduced costs of x, y, s₁ … sₘ.
 * @property {Frac} z  The objective at the current corner.
 * @property {number[]} basis  The variable that is basic in each row.
 * @property {Frac} x
 * @property {Frac} y
 * @property {{ x: Frac, y: Frac }[]} path  Corners visited, starting at the origin.
 * @property {number} entering  Variable index; -1 when none.
 * @property {number} leaving  Row index; -1 when none.
 * @property {number} left  pivot: the variable that just left the basis; -1 otherwise.
 * @property {(Frac | null)[]} ratios  bᵢ / aᵢₑ for rows with aᵢₑ > 0.
 * @property {'running'|'optimal'|'unbounded'} status
 * @property {Frac[] | null} dual  Optimal dual prices, one per constraint.
 * @property {number} pivots
 * @property {number[]} lines
 */

/** @param {Frac[][]} rows */
const copyRows = (rows) => rows.map((row) => row.map((f) => ({ ...f })));

/**
 * @param {number[]} c  [c₁, c₂]
 * @param {Constraint[]} cons  Every b ≥ 0.
 * @returns {LpFrame[]}
 */
export function simplexTrace(c, cons) {
  const m = cons.length;
  const width = 2 + m;
  /** @type {Frac[][]} */
  const rows = cons.map((con, i) => [
    frac(con.a1),
    frac(con.a2),
    ...Array.from({ length: m }, (_, j) => frac(i === j ? 1 : 0)),
    frac(con.b),
  ]);
  /** @type {Frac[]} */
  let cost = [frac(c[0]), frac(c[1]), ...Array.from({ length: m }, () => frac(0))];
  let z = frac(0);
  const basis = Array.from({ length: m }, (_, i) => 2 + i);
  let entering = -1;
  let leaving = -1;
  let left = -1;
  /** @type {(Frac | null)[]} */
  let ratios = Array(m).fill(null);
  /** @type {LpFrame['status']} */
  let status = 'running';
  /** @type {Frac[] | null} */
  let dual = null;
  let pivots = 0;

  /** The value of variable v at the current corner. @param {number} v */
  const valueOf = (v) => {
    const r = basis.indexOf(v);
    return r === -1 ? frac(0) : rows[r][width];
  };
  /** @type {{ x: Frac, y: Frac }[]} */
  const path = [{ x: frac(0), y: frac(0) }];
  /** @type {LpFrame[]} */
  const frames = [];

  /** @param {LpFrame['kind']} kind @param {number[]} lines */
  const push = (kind, lines) =>
    frames.push({
      kind,
      c: c.slice(),
      cons: cons.map((con) => ({ ...con })),
      rows: copyRows(rows),
      cost: cost.map((f) => ({ ...f })),
      z: { ...z },
      basis: basis.slice(),
      x: { ...valueOf(0) },
      y: { ...valueOf(1) },
      path: path.map((p) => ({ x: { ...p.x }, y: { ...p.y } })),
      entering,
      leaving,
      left,
      ratios: ratios.map((f) => (f ? { ...f } : null)),
      status,
      dual: dual ? dual.map((f) => ({ ...f })) : null,
      pivots,
      lines,
    });

  push('start', [0]);
  while (pivots < MAX_PIVOTS) {
    entering = -1;
    leaving = -1;
    ratios = Array(m).fill(null);
    for (let j = 0; j < width; j++) {
      if (fcmp(cost[j], frac(0)) > 0 && (entering === -1 || fcmp(cost[j], cost[entering]) > 0))
        entering = j;
    }
    if (entering === -1) {
      status = 'optimal';
      dual = cost.slice(2).map((f) => frac(-f.num, f.den));
      push('optimal', [1, 2, 3]);
      break;
    }
    push('enter', [1, 2]);
    for (let i = 0; i < m; i++) {
      const a = rows[i][entering];
      if (fcmp(a, frac(0)) <= 0) continue;
      ratios[i] = fdiv(rows[i][width], a);
      const r = /** @type {Frac} */ (ratios[i]);
      if (leaving === -1) {
        leaving = i;
        continue;
      }
      const best = /** @type {Frac} */ (ratios[leaving]);
      const cmp = fcmp(r, best);
      if (cmp < 0 || (cmp === 0 && basis[i] < basis[leaving])) leaving = i;
    }
    if (leaving === -1) {
      status = 'unbounded';
      push('unbounded', [4, 5]);
      break;
    }
    push('leave', [4]);

    const pivot = rows[leaving][entering];
    rows[leaving] = rows[leaving].map((f) => fdiv(f, pivot));
    for (let i = 0; i < m; i++) {
      if (i === leaving || isZero(rows[i][entering])) continue;
      const factor = rows[i][entering];
      rows[i] = rows[i].map((f, j) => fsub(f, fmul(factor, rows[leaving][j])));
    }
    const gain = cost[entering];
    z = fadd(z, fmul(gain, rows[leaving][width]));
    cost = cost.map((f, j) => fsub(f, fmul(gain, rows[leaving][j])));
    left = basis[leaving];
    basis[leaving] = entering;
    pivots++;
    ratios = Array(m).fill(null);
    path.push({ x: valueOf(0), y: valueOf(1) });
    push('pivot', [6]);
    left = -1;
  }
  entering = -1;
  leaving = -1;
  ratios = Array(m).fill(null);
  push('done', status === 'optimal' ? [3] : [5]);
  return frames;
}

/**
 * Every corner of the feasible region: intersections of two boundary lines (the constraints
 * and the axes) that satisfy every constraint. Used to draw the region and as an oracle.
 * @param {Constraint[]} cons
 * @returns {{ x: Frac, y: Frac }[]}
 */
export function feasibleCorners(cons) {
  /** @type {{ a1: number, a2: number, b: number }[]} */
  const lines = [{ a1: 1, a2: 0, b: 0 }, { a1: 0, a2: 1, b: 0 }, ...cons];
  /** @type {{ x: Frac, y: Frac }[]} */
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const p = lines[i];
      const q = lines[j];
      const det = p.a1 * q.a2 - p.a2 * q.a1;
      if (det === 0) continue;
      const x = frac(p.b * q.a2 - p.a2 * q.b, det);
      const y = frac(p.a1 * q.b - p.b * q.a1, det);
      if (fcmp(x, frac(0)) < 0 || fcmp(y, frac(0)) < 0) continue;
      const ok = cons.every(
        (con) => fcmp(fadd(fmul(frac(con.a1), x), fmul(frac(con.a2), y)), frac(con.b)) <= 0,
      );
      if (ok && !out.some((v) => fcmp(v.x, x) === 0 && fcmp(v.y, y) === 0)) out.push({ x, y });
    }
  }
  return out;
}

/**
 * The feasible region clipped to the box [0, xMax] × [0, yMax], as a polygon of plain
 * numbers for drawing (Sutherland–Hodgman clipping by each constraint).
 * @param {Constraint[]} cons
 * @param {number} xMax
 * @param {number} yMax
 * @returns {{ x: number, y: number }[]}
 */
export function regionPolygon(cons, xMax, yMax) {
  let poly = [
    { x: 0, y: 0 },
    { x: xMax, y: 0 },
    { x: xMax, y: yMax },
    { x: 0, y: yMax },
  ];
  for (const { a1, a2, b } of cons) {
    const inside = (/** @type {{x: number, y: number}} */ p) => a1 * p.x + a2 * p.y <= b + 1e-9;
    /** @type {{ x: number, y: number }[]} */
    const next = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      if (inside(p)) next.push(p);
      if (inside(p) !== inside(q)) {
        const fp = a1 * p.x + a2 * p.y - b;
        const fq = a1 * q.x + a2 * q.y - b;
        const t = fp / (fp - fq);
        next.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
      }
    }
    poly = next;
    if (poly.length === 0) break;
  }
  return poly;
}

/**
 * The part of the line a₁x + a₂y = b inside the box [0, xMax] × [0, yMax], or null when it
 * misses the box or is not a line.
 * @param {number} a1
 * @param {number} a2
 * @param {number} b
 * @param {number} xMax
 * @param {number} yMax
 * @returns {{ x1: number, y1: number, x2: number, y2: number } | null}
 */
export function clipLine(a1, a2, b, xMax, yMax) {
  /** @type {{ x: number, y: number }[]} */
  const hits = [];
  const add = (/** @type {number} */ x, /** @type {number} */ y) => {
    const eps = 1e-9;
    if (x < -eps || x > xMax + eps || y < -eps || y > yMax + eps) return;
    if (hits.some((h) => Math.abs(h.x - x) < eps && Math.abs(h.y - y) < eps)) return;
    hits.push({ x, y });
  };
  if (a2 !== 0) {
    add(0, b / a2);
    add(xMax, (b - a1 * xMax) / a2);
  }
  if (a1 !== 0) {
    add(b / a1, 0);
    add((b - a2 * yMax) / a1, yMax);
  }
  if (hits.length < 2) return null;
  return { x1: hits[0].x, y1: hits[0].y, x2: hits[1].x, y2: hits[1].y };
}

/**
 * The plane size that shows every corner with a margin, between 5 and 12 units.
 * @param {Constraint[]} cons
 */
export function viewSize(cons) {
  const corners = feasibleCorners(cons);
  const fit = (/** @type {number} */ v) => Math.max(5, Math.min(12, Math.ceil(v) + 1));
  return {
    xMax: fit(Math.max(0, ...corners.map((p) => fvalue(p.x)))),
    yMax: fit(Math.max(0, ...corners.map((p) => fvalue(p.y)))),
  };
}

/**
 * @type {Record<'classic'|'degenerate'|'flat'|'unbounded'|'single', {c: number[], cons: Constraint[]}>}
 */
export const LP_PRESETS = {
  classic: {
    c: [3, 2],
    cons: [
      { a1: 1, a2: 1, b: 4 },
      { a1: 1, a2: 3, b: 9 },
      { a1: 1, a2: 0, b: 3 },
    ],
  },
  degenerate: {
    c: [2, 1],
    cons: [
      { a1: 1, a2: -1, b: 0 },
      { a1: 1, a2: 1, b: 4 },
    ],
  },
  flat: {
    c: [1, 1],
    cons: [
      { a1: 1, a2: 1, b: 5 },
      { a1: 1, a2: 0, b: 4 },
      { a1: 0, a2: 1, b: 4 },
    ],
  },
  unbounded: {
    c: [1, 2],
    cons: [
      { a1: -1, a2: 1, b: 2 },
      { a1: 1, a2: -2, b: 2 },
    ],
  },
  single: {
    c: [2, 5],
    cons: [{ a1: 3, a2: 5, b: 30 }],
  },
};
