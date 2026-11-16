/** @typedef {import('$lib/algo-engine/dp-optimisations.js').HullFrame} HullFrame */
/** @typedef {import('$lib/algo-engine/dp-optimisations.js').Line} Line */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number} id */
const name = (id) => `L${id + 1}`;
/** A number with at most two decimals. @param {number} x */
const num = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(2)).replace('-', '−');
/** @param {Line} l */
const formula = (l) => {
  const slope = l.m === 0 ? '' : l.m === 1 ? 'x' : l.m === -1 ? '−x' : `${num(l.m)}x`;
  if (!slope) return `y = ${num(l.b)}`;
  if (l.b === 0) return `y = ${slope}`;
  return `y = ${slope} ${l.b < 0 ? '−' : '+'} ${Math.abs(l.b)}`;
};
/** Where two lines cross. @param {Line} a @param {Line} b */
const cross = (a, b) => (b.b - a.b) / (a.m - b.m);

export const en = {
  slug: 'dp-optimisations',
  topic: 'advanced-dp',
  level: 'Advanced',
  title: 'DP optimisations',
  intro:
    'Many DP transitions take a minimum over all earlier states, which makes them O(n²) or worse. When the cost has a special shape, a data structure or an order argument skips most candidates. The convex hull trick handles costs of the form dp[j] + b[j]·x[i]: each earlier state is a line, and only the lines of the lower envelope can ever win.',
  summary:
    'Speed up DP transitions with the convex hull trick, the monotone queue, divide and conquer DP and Knuth’s optimisation.',
  instruction:
    'Type lines as “slope intercept” pairs and the x values to query, or pick an example, and step. Lines are added by slope; a line the new one makes useless is popped and drawn dashed. The thick line is the lower envelope, and the queries walk along it with one pointer that only moves right.',
  linesLabel: 'Lines (m b, …)',
  queriesLabel: 'Query x values',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    cap: 'Six lines, one parallel',
    useless: 'Five lines, one useless',
    touch: 'A line that only touches',
  },
  randomLines: 'Random lines',
  /**
   * @param {number} maxLines @param {number} slope @param {number} lo @param {number} hi
   * @param {number} maxQueries @param {number} xMax
   */
  errors: (maxLines, slope, lo, hi, maxQueries, xMax) => ({
    lines: {
      format: 'Write each line as two whole numbers, slope then intercept, such as “2 1, −1 13”.',
      count: `Type 1 to ${maxLines} lines.`,
      range: `Slopes go from −${slope} to ${slope}, intercepts from ${lo} to ${hi}.`,
    },
    queries: {
      format: 'Write the query x values as whole numbers.',
      count: `Type 1 to ${maxQueries} different x values.`,
      range: `Each x must be from 0 to ${xMax}.`,
    },
  }),
  /** @param {number} n */
  plotLabel: (n) =>
    `Plot of ${plural(n, 'line', 'lines')} y = m·x + b for x from 0 to 10, with the lower envelope drawn thick.`,
  name,
  formula,
  /** @param {number} y */
  markLabel: (y) => num(y),
  legend: {
    current: 'Line added now',
    compare: 'Lines compared',
    hull: 'On the hull; the pointer’s line is darker',
    removed: 'Never lowest, dashed: popped or skipped (✕ in the list)',
    pending: 'Not added yet, dashed',
    envelope: 'Lower envelope, thick',
    query: 'Query x, dashed upright line; answers are labelled dots',
  },
  stats: {
    checks: 'Hull checks',
    moves: 'Pointer moves',
    compares: 'Pointer comparisons',
    naive: 'Checking every line at every x',
  },
  hullTitle: 'Hull, left to right',
  hullEmpty: 'Empty',
  linesTitle: 'Lines',
  /** @param {Line} l @param {boolean} gone */
  lineChip: (l, gone) => `${name(l.id)}: ${formula(l)}${gone ? ' ✕' : ''}`,
  answersTitle: 'Answers',
  answersRows: ['x', 'min'],
  answersAria: 'Table of query x values and the smallest y found at each.',
  /** @param {HullFrame} f */
  describe(f) {
    const byId = new Map(f.pool.map((l) => [l.id, l]));
    const line = (/** @type {number} */ id) => /** @type {Line} */ (byId.get(id));
    const x = f.queries[f.q];
    switch (f.kind) {
      case 'start':
        return `${plural(f.pool.length, 'line', 'lines')} and ${plural(f.queries.length, 'query', 'queries')}: for each x, find the lowest line. In a DP, each line is one earlier state j, with slope b[j] and intercept dp[j].`;
      case 'sort':
        return `Sort by slope, largest first: ${f.pool.map((l) => name(l.id)).join(', ')}. Far to the right a smaller slope is always lower, so each new line takes over the right end.`;
      case 'consider':
        return `Add ${name(f.cur)}: ${formula(line(f.cur))}.`;
      case 'skip': {
        const last = line(f.hull[f.hull.length - 1]);
        return `${name(f.cur)} is parallel to ${name(last.id)} and not lower, so it is never the lowest. Skip it.`;
      }
      case 'check': {
        const [a, b, c] = f.triple.map(line);
        return f.pops
          ? `${name(b.id)} is useless: ${name(c.id)} crosses ${name(a.id)} at x = ${num(cross(a, c))}, not after x = ${num(cross(a, b))} where ${name(b.id)} would take over. Pop ${name(b.id)}.`
          : `${name(b.id)} stays: it is lowest from x = ${num(cross(a, b))} until ${name(c.id)} takes over at x = ${num(cross(b, c))}.`;
      }
      case 'push':
        return `Push ${name(f.cur)}. The hull is now ${f.hull.map(name).join(', ')}.`;
      case 'advance': {
        const [prev, cur] = [line(f.hull[f.p - 1]), line(f.hull[f.p])];
        return `At x = ${x}, ${name(cur.id)} gives ${num(cur.m * x + cur.b)}, not more than ${num(prev.m * x + prev.b)} from ${name(prev.id)}: move the pointer right, for good.`;
      }
      case 'answer': {
        const cur = line(f.hull[f.p]);
        const next = f.p + 1 < f.hull.length ? line(f.hull[f.p + 1]) : null;
        const stay = next
          ? ` ${name(next.id)} gives ${num(next.m * x + next.b)}, higher, so the pointer stays.`
          : '';
        return `At x = ${x}, the lowest line is ${name(cur.id)}: ${f.answers[f.q]}.${stay}`;
      }
      case 'done':
        return `${plural(f.queries.length, 'answer', 'answers')} with ${f.checks} hull checks and ${f.compares} pointer comparisons, against ${f.pool.length * f.queries.length} for trying every line at every x.`;
    }
  },
  takeaways: [
    'Convex hull trick: a transition dp[i] = min over j of dp[j] + b[j]·x[i] is a lowest line at x[i]. Keep only the lower envelope. With slopes added in order and queries in order, each line is pushed and popped once and the pointer only moves right: O(n) in total instead of O(n²).',
    'Monotone queue: dp[i] = min of dp[j] over a sliding window i − k ≤ j < i. Keep a deque of candidates with increasing values; a newer, smaller value makes older ones useless forever. O(n) instead of O(n·k).',
    'Divide and conquer DP: when the best split opt(i) never decreases as i grows, solve the middle i first and search the halves only on their side of opt(mid). O(n log n) per layer instead of O(n²).',
    'Knuth’s optimisation: for interval DP whose best split obeys opt[i][j − 1] ≤ opt[i][j] ≤ opt[i + 1][j], each cell searches only between its neighbours’ splits, and the work telescopes to O(n²) instead of O(n³).',
    'Pick the example with one useless line, then change its intercept to 8: the envelope dips and the line joins the hull.',
  ],
  complexityHead: ['Technique', 'Cost', 'Why'],
  complexity: [
    [
      'Convex hull trick, sorted',
      'O(n + q)',
      'Each line is pushed and popped once; the pointer only moves right.',
    ],
    [
      'Convex hull trick, any query order',
      'O((n + q) log n)',
      'Binary search the envelope for each x.',
    ],
    ['Monotone queue', 'O(n)', 'Each index enters and leaves the deque once.'],
    [
      'Divide and conquer DP',
      'O(k · n log n)',
      'opt is monotone, so each level of the recursion scans O(n) per layer.',
    ],
    ['Knuth’s optimisation', 'O(n²)', 'Split ranges of one diagonal telescope to O(n).'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In the example “Six lines, one parallel”, what is the smallest y at x = 3?',
      answer: 6,
      hints: ['Step to the end and read the Answers table at x = 3.'],
      solution: 'L2: y = x + 3 is lowest between x = 2 and x = 4, and gives 3 + 3 = 6.',
    },
    {
      type: 'choice',
      prompt: 'In the example “Five lines, one useless”, which line is popped?',
      options: ['L1: y = −x + 14', 'L2: y = x + 4', 'L3: y = 10', 'L4: y = 2x + 1'],
      answer: 2,
      hints: ['Step until a check says “Pop”.'],
      solution:
        'L3: y = 10. L1 crosses L2 at x = 5, where both are 9, below 10, so L3 is never strictly lowest.',
    },
    {
      type: 'number',
      prompt: 'In the example “A line that only touches”, how many lines stay on the hull?',
      answer: 2,
      unit: 'lines',
      hints: ['Step to the end and read the hull list.'],
      solution:
        'Only L4: y = x + 1 and L1: y = −2x + 12. When L2 joins, it crosses L4 at x = 4, exactly where L3 would take over, so L3 would only touch the envelope at one point: ties pop. Then L1 crosses L4 at x ≈ 3.67, before L2 takes over, so L2 goes too.',
    },
    {
      type: 'choice',
      prompt: 'Which optimisation fits dp[i] = a[i] + min(dp[i − k], …, dp[i − 1])?',
      options: ['Convex hull trick', 'Monotone queue', 'Knuth’s optimisation', 'Bitmask DP'],
      answer: 1,
      hints: ['The candidates form a sliding window.'],
      solution:
        'A sliding-window minimum: keep a deque of indices with increasing dp values, O(n) in total.',
    },
    {
      type: 'choice',
      prompt:
        'Which optimisation fits dp[i] = min over j < i of dp[j] + b[j]·x[i], with b decreasing?',
      options: ['Convex hull trick', 'Monotone queue', 'Divide and conquer DP', 'Digit DP'],
      answer: 0,
      hints: ['Read dp[j] + b[j]·x as a line in x.'],
      solution:
        'Each j is the line y = b[j]·x + dp[j], and dp[i] is the lowest line at x[i]: the convex hull trick.',
    },
    {
      type: 'text',
      prompt: 'Knuth’s optimisation brings interval DP down from O(n³) to what?',
      accept: ['O(n^2)', 'O(n²)', 'n^2'],
      hints: ['Each diagonal’s split ranges add up to O(n).'],
      solution: 'O(n²): n diagonals, and the split ranges of each diagonal telescope to O(n).',
    },
  ],
  nextTeaser:
    'Next up: Practice: advanced DP problems, where you race naive and optimised solutions on the same input.',
};
