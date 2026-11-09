import { gcd } from '$lib/algo-engine/number-theory.js';
/** @typedef {import('$lib/algo-engine/fractional-knapsack.js').KnapFrame} KnapFrame */
/** @typedef {import('$lib/algo-engine/fractional-knapsack.js').JobFrame} JobFrame */

/** @param {number} x @param {string} word */
const plural = (x, word) => `${x} ${word}${x === 1 ? '' : 's'}`;

/** Names A, B, C, … in the typed order. @param {number} i */
const name = (i) => String.fromCharCode(65 + i);

/** A number with at most two decimals: 240, 66.67. @param {number} x */
const num = (x) => String(Math.round(x * 100) / 100);

/** A reduced fraction p/q, or 1 for a whole item. @param {number} p @param {number} q */
function fraction(p, q) {
  if (p === q) return '1';
  const g = gcd(p, q);
  return `${p / g}/${q / g}`;
}

export const en = {
  slug: 'fractional-knapsack',
  topic: 'greedy',
  level: 'Intermediate',
  title: 'Fractional knapsack and scheduling with deadlines',
  intro:
    'Two problems where one sort and one pass give the best answer. In the fractional knapsack you may cut items, so you fill the bag with the best value per kilogram first and cut only the last item. In job sequencing every job takes one time slot and pays only if it finishes by its deadline, so you take the most profitable jobs first, each as late as it can go.',
  summary:
    'Fill a knapsack by value per weight with a fraction of the last item, then schedule unit jobs by profit into the latest free slot before their deadlines.',
  instruction:
    'Pick a problem, type the items or jobs, or load a preset, then step. In the knapsack watch the bar fill and the last item get cut; compare the 0/1 numbers under the stats. In job sequencing watch each job probe slots from its deadline down.',
  problemLabel: 'Problem',
  problems: { knapsack: 'Fractional knapsack', jobs: 'Jobs with deadlines' },
  itemsLabel: 'Items (value/weight)',
  capacityLabel: 'Capacity W',
  jobsLabel: 'Jobs (profit/deadline)',
  presetLabel: 'Example',
  presetPlaceholder: 'Load an example…',
  presets: {
    knapsack: {
      textbook: 'Textbook: W = 50',
      pantry: 'Six items: W = 40',
      roomy: 'All fit: W = 100',
    },
    jobs: { classic: 'Five jobs', crowded: 'One deadline for all', urgent: 'Many due at 1' },
  },
  errors: {
    format: 'Type pairs like 60/10, separated by commas or spaces. The last valid input is back.',
    value: 'Keep every value and profit between 1 and 999. The last valid input is back.',
    weight: 'Keep every weight between 1 and 99. The last valid input is back.',
    deadline: 'Keep every deadline between 1 and 10. The last valid input is back.',
    count: 'Use at most 10 items or jobs. The last valid input is back.',
  },
  capacityError: 'The capacity must be a whole number from 1 to 200. The last valid one is back.',
  newInputNotice: 'New example loaded.',
  name,
  num,
  fraction,
  /** @param {number} capacity @param {number} room */
  barAria: (capacity, room) => `Knapsack of capacity ${capacity}, ${room} left.`,
  /** @param {string} item @param {string} part @param {number} weight */
  pieceLabel: (item, part, weight) => `${item}: ${part === '1' ? 'whole' : part}, weight ${weight}`,
  /** @param {number} n */
  slotsAria: (n) => `${plural(n, 'time slot')}, 1 to ${n}.`,
  slotRow: 'Job',
  emptySlot: '·',
  legend: {
    current: 'Scanned now',
    packed: 'Packed whole or placed',
    cut: 'Cut: only a fraction fits',
    probed: 'Slot probed, taken',
  },
  markers: { current: '?', packed: '✓', cut: '½', probed: '✗' },
  table: {
    item: 'Item',
    value: 'Value',
    weight: 'Weight',
    density: 'Value/weight',
    taken: 'Taken',
    job: 'Job',
    profit: 'Profit',
    deadline: 'Deadline',
    status: 'Slot',
  },
  tableTitle: { knapsack: 'Items in scan order', jobs: 'Jobs in scan order' },
  status: { waiting: '—', skipped: 'skipped', none: '0' },
  stats: {
    room: 'Room left',
    total: 'Value packed',
    scanned: 'Items scanned',
    profit: 'Profit',
    placed: 'Jobs placed',
    probes: 'Slot probes',
    best: 'Best possible',
  },
  zeroOneTitle: 'If items cannot be cut (0/1)',
  /** @param {number} greedy @param {number} best */
  zeroOne: (greedy, best) =>
    `Greedy by value/weight packs ${greedy}; the best is ${best}${greedy < best ? ', so greedy loses' : ''}.`,
  practiceTitle: 'Check yourself',
  /** @param {KnapFrame} f */
  describeKnapsack(f) {
    const it = f.current >= 0 ? f.items[f.current] : null;
    const n = f.items.length;
    switch (f.kind) {
      case 'start':
        return `Fill a knapsack of capacity ${f.capacity} from ${plural(n, 'item')} for the most value. Any fraction of an item may be taken, for the same fraction of its value.`;
      case 'sort':
        return `Sort by value per weight, highest first: ${f.order.map((i) => `${name(i)} (${num(f.items[i].value / f.items[i].weight)})`).join(', ')}.`;
      case 'consider':
        if (!it) return '';
        return it.weight <= f.room
          ? `${name(f.current)}: value ${it.value}, weight ${it.weight}, ${num(it.value / it.weight)} per unit. ${f.room} units of room, so all of it fits.`
          : `${name(f.current)}: value ${it.value}, weight ${it.weight}, ${num(it.value / it.weight)} per unit. Only ${f.room} units of room are left, so cut it.`;
      case 'take': {
        if (!it) return '';
        const t = f.taken[f.current];
        const part = fraction(t, it.weight);
        return part === '1'
          ? `Take all of ${name(f.current)}: +${it.value}. Value ${num(f.total)}, ${f.room} units left.`
          : `Take ${part} of ${name(f.current)}: ${t} of its ${it.weight} units for ${it.value} · ${part} = ${num((it.value * t) / it.weight)}. The knapsack is full at value ${num(f.total)}.`;
      }
      case 'full':
        return `The knapsack is full, so stop: ${name(f.current)} and every item after it stay out.`;
      case 'done': {
        const cut = f.packed.find((i) => f.taken[i] < f.items[i].weight);
        if (cut !== undefined) {
          return `Done: value ${num(f.total)}, with only ${name(cut)} cut, to ${fraction(f.taken[cut], f.items[cut].weight)}. No packing beats it, since every unit of room holds the best value per unit still on offer.`;
        }
        return f.room > 0
          ? `Every item fits whole: value ${num(f.total)} with ${f.room} units to spare.`
          : `Every item fits whole and fills the knapsack exactly: value ${num(f.total)}.`;
      }
    }
  },
  /** @param {JobFrame} f @param {number} best */
  describeJobs(f, best) {
    const j = f.current >= 0 ? f.jobs[f.current] : null;
    switch (f.kind) {
      case 'start':
        return `Schedule ${plural(f.jobs.length, 'job')}, each one time slot long, in slots 1 to ${f.slots.length}. A job pays its profit only if it sits in a slot at or before its deadline.`;
      case 'sort':
        return `Sort by profit, highest first: ${f.order.map((i) => `${name(i)} (${f.jobs[i].profit})`).join(', ')}.`;
      case 'consider': {
        if (!j) return '';
        const free = f.slots[(f.probed.at(-1) ?? 1) - 1] < 0;
        return free
          ? `${name(f.current)}: profit ${j.profit}, deadline ${j.deadline}. Probe slots from ${j.deadline} down: slot ${f.probed.at(-1)} is the latest free one.`
          : `${name(f.current)}: profit ${j.profit}, deadline ${j.deadline}. Slots ${f.probed.join(', ')} are all taken.`;
      }
      case 'place':
        return `Put ${name(f.current)} in slot ${f.slot}, as late as possible to keep earlier slots free. Profit ${f.profit}.`;
      case 'skip':
        return `Skip ${name(f.current)}: every slot up to its deadline holds a more profitable job.`;
      case 'done':
        return `Done: profit ${f.profit}${f.profit === best ? ', the best any schedule can earn' : ''}. Skipped: ${f.skipped.map(name).join(', ') || 'none'}.`;
    }
  },
  takeaways: [
    'Fractional knapsack: sort by value per weight and pour items in, best first. Every unit of capacity then holds the best value per unit still available, so the result is optimal, and only the last item is cut.',
    'The same greedy rule fails for 0/1 knapsack, where items cannot be cut: on the textbook items it packs 160 while 100 + 120 = 220 fits. 0/1 knapsack needs dynamic programming.',
    'Job sequencing: take jobs by profit, highest first, each in the latest free slot at or before its deadline. Placing a job late keeps early slots for jobs with tight deadlines.',
    'Matroid intuition: a family of “independent” sets where every subset of an independent set is independent and a smaller independent set can always grow by an element of a larger one. Sets of jobs that can all meet their deadlines form one, and on any matroid the greedy rule by weight is optimal. Sets of items that fit a knapsack do not: the exchange step fails.',
    'Load “Textbook: W = 50” and step to the end: the value is 240 with 2/3 of C. Then read the 0/1 line under the stats, and try capacity 60, where nothing has to be cut.',
  ],
  complexityHead: ['Step', 'Cost', 'Why'],
  complexity: [
    [
      'Sort items or jobs',
      'O(n log n)',
      'One comparison sort; value per weight compares by cross-multiplying.',
    ],
    [
      'Fractional knapsack pass',
      'O(n)',
      'Each item is looked at once, and the pass stops when the knapsack is full.',
    ],
    [
      'Job sequencing, slot scan',
      'O(n · d)',
      'Each job probes at most d slots from its deadline down; a disjoint-set forest over the slots brings it near O(n).',
    ],
    [
      '0/1 knapsack, dynamic programming',
      'O(n · W)',
      'The greedy pass is no longer enough; every capacity is tried.',
    ],
    ['Extra memory', 'O(n + d)', 'The sorted order, the amounts taken and the slots.'],
  ],
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Items 60/10, 100/20, 120/30 (value/weight) and capacity 50. What value does the fractional knapsack reach?',
      answer: 240,
      hints: [
        'The values per unit are 6, 5 and 4, so take them in that order.',
        'After the first two, 20 units of room are left for the 30-unit item.',
      ],
      solution:
        'Take all of A (60) and B (100), then 20/30 = 2/3 of C for 120 · 2/3 = 80: 60 + 100 + 80 = 240.',
    },
    {
      type: 'text',
      prompt: 'In the same knapsack, what fraction of item C is taken?',
      accept: ['2/3', '20/30', '0.67', '0.667', 'two thirds'],
      hints: ['C weighs 30.', 'A and B use 30 of the 50 units.'],
      solution: '20 units of room are left and C weighs 30, so 20/30 = 2/3 of it goes in.',
    },
    {
      type: 'number',
      prompt:
        'Now items cannot be cut. What does the greedy rule by value per weight pack for the same items and capacity?',
      answer: 160,
      hints: ['It takes A and B whole as before.', 'C no longer fits whole in the 20 units left.'],
      solution:
        'Greedy packs A + B = 160 and must skip C. The best 0/1 packing is B + C = 220, so greedy is not optimal once items cannot be cut.',
    },
    {
      type: 'number',
      prompt:
        'Jobs (profit/deadline) 100/2, 19/1, 27/2, 25/1, 15/3, each one slot long. What profit does greedy job sequencing earn?',
      answer: 142,
      hints: [
        'Take the jobs in the order 100, 27, 25, 19, 15.',
        'The job worth 100 takes slot 2, so 27 takes slot 1.',
      ],
      solution:
        '100 goes in slot 2, 27 in slot 1, 25 and 19 (deadline 1) find slot 1 taken, and 15 takes slot 3: 100 + 27 + 15 = 142.',
    },
    {
      type: 'choice',
      prompt: 'Why does greedy by weight solve job sequencing but not 0/1 knapsack?',
      options: [
        'Jobs have integer deadlines',
        'Feasible job sets form a matroid; knapsack-feasible sets do not',
        'Job sequencing sorts by profit, knapsack by weight',
        'Knapsack has more items than slots',
      ],
      answer: 1,
      hints: [
        'On a matroid, the greedy rule by weight is always optimal.',
        'With W = 35, can the set holding one 30-unit item grow by an item of the larger set of two 10-unit items?',
      ],
      solution:
        'Job sets that can all meet their deadlines satisfy the matroid exchange property: a smaller such set can always take a job from a larger one. Knapsack-feasible sets break it: with W = 35, the set holding one 30-unit item cannot take either item of the larger set of two 10-unit items. Without that property greedy can lose, as 160 against 220 shows.',
    },
  ],
  nextTeaser:
    'Next up: Practice: greedy problems, where you test greedy rules against random cases and prove or break them, starting with the jump game.',
};
