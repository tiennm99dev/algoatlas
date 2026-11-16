/** @typedef {import('$lib/algo-engine/bitmask-dp.js').TspFrame} TspFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/** @param {number} c */
const city = (c) => String.fromCharCode(65 + c);
/** The cities of a mask as a set, such as {A, C, D}. @param {number} mask @param {number} n */
const setOf = (mask, n) => {
  const names = [];
  for (let c = 0; c < n; c++) if (mask & (1 << c)) names.push(city(c));
  return `{${names.join(', ')}}`;
};
/** The mask in binary, city A as the rightmost bit. @param {number} mask @param {number} n */
const bits = (mask, n) => mask.toString(2).padStart(n, '0');

export const en = {
  slug: 'bitmask-dp',
  topic: 'advanced-dp',
  level: 'Advanced',
  title: 'Bitmask DP and travelling salesman',
  intro:
    'Some DP states need to remember a whole set: which cities a tour has already visited. When the set is small, store it as the bits of one number, a bitmask, so bit c is 1 when city c is in the set. The Held-Karp algorithm uses one state per (set of visited cities, current city) and solves the travelling salesman problem in O(2ⁿ · n²) instead of trying all (n − 1)! tours.',
  summary:
    'Store a set of visited cities as a bitmask and solve the travelling salesman problem with Held-Karp in O(2ⁿ · n²).',
  instruction:
    'Drag the cities on the grid, add or remove some, and step. Each row of the table is one mask: its lit bits are the visited cities. ● marks the state being read, the dashed road is the city it tries to add, and the cell it may improve is marked ○, or ✎ when it gets a shorter value.',
  presetLabel: 'Example',
  /** @type {Record<string, string>} */
  presets: {
    four: '4 cities',
    five: '5 cities',
    six: '6 cities',
  },
  addCity: 'Add city',
  removeCity: 'Remove city',
  randomCities: 'Random cities',
  /** @param {number} max */
  fullError: (max) => `There are already ${max} cities, the most this table shows.`,
  /** @param {number} min */
  minError: (min) => `A tour needs at least ${min} cities.`,
  occupiedError: 'Another city already stands there.',
  noRoomError: 'There is no free spot left on the grid.',
  selectFirst: 'Select a city first: click it, or Tab to it and press Enter.',
  planeLabel:
    'Grid of cities. Drag a city or press Shift and an arrow key to move it, Delete to remove it, and click empty ground to add one.',
  /** @param {string} name @param {number} x @param {number} y @param {string} state */
  cityLabel: (name, x, y, state) => `City ${name} at (${x}, ${y})${state ? `, ${state}` : ''}`,
  cityStates: { start: 'the start', route: 'on the walk', next: 'tried next', tour: 'on the tour' },
  distanceNote: 'Distances are grid steps: |Δx| + |Δy|.',
  distTitle: 'Distances d[i][j]',
  /** @param {number} n */
  distAria: (n) => `Distance table between ${plural(n, 'city', 'cities')}.`,
  tableTitle: 'States dp[mask][j]',
  /** @param {number} n */
  tableCaption: (n) =>
    `Shortest walk from A over exactly the lit cities, ending at city j. ${2 ** (n - 1)} masks contain A.`,
  maskHead: 'mask',
  bitsHead: 'bit of city',
  /** @param {string} name */
  endHead: (name) => `j = ${name}`,
  /** @param {number} mask @param {number} n */
  maskLabel: (mask, n) => `Mask ${mask}, binary ${bits(mask, n)}, visited ${setOf(mask, n)}`,
  /** @param {string} name @param {boolean} on */
  bitLabel: (name, on) => `${name} ${on ? 'visited' : 'not visited'}`,
  outside: '·',
  /** @param {number} mask @param {number} j @param {number} n @param {string} v @param {string} state */
  cellLabel: (mask, j, n, v, state) =>
    `dp[${setOf(mask, n)}][${city(j)}]: ${v === '' ? 'not reached yet' : v === '·' ? 'not a state' : v}${state ? `, ${state}` : ''}`,
  cellStates: {
    read: 'read now',
    target: 'may improve',
    improved: 'improved',
    path: 'on the tour',
  },
  legend: {
    read: 'State read now',
    target: 'State it may improve',
    improved: 'State improved',
    path: 'On the best tour',
    lit: '1 Visited city (bit set)',
  },
  markers: { read: '●', target: '○', improved: '✎', path: '◆' },
  stats: {
    tries: 'Transitions tried',
    reached: 'States reached',
    best: 'Shortest tour',
    tours: 'Tours brute force measures',
  },
  pending: '…',
  routeTitle: 'Walk',
  /** @param {number[]} route */
  route: (route) => (route.length ? route.map(city).join(' → ') : '—'),
  /** @param {TspFrame} f */
  describe(f) {
    const mask = setOf(f.mask, f.n);
    switch (f.kind) {
      case 'start':
        return `Visit all ${plural(f.n, 'city', 'cities')} and return to A along the shortest tour. A state is a set of visited cities and the city you stand on.`;
      case 'base':
        return `Mask 1 = ${bits(1, f.n)}: only A is visited and the walk stands on A, so dp[{A}][A] = 0.`;
      case 'mask':
        if (f.mask === 1) return 'Mask 1, the set {A}: extend the start state by every other city.';
        return `Mask ${f.mask} = ${bits(f.mask, f.n)}, the set ${mask}. Every smaller set is finished, so its states are final: extend each of them by one new city.`;
      case 'try': {
        const next = setOf(f.mask | (1 << f.k), f.n);
        const step = f.dist[f.j][f.k];
        const verdict = f.improved
          ? f.old === null
            ? 'The first walk to that state.'
            : `Shorter than ${f.old}, so it improves.`
          : `Not shorter than ${f.old}.`;
        return `From ${mask} at ${city(f.j)}, go to ${city(f.k)}: ${(f.cand ?? 0) - step} + ${step} = ${f.cand} for dp[${next}][${city(f.k)}]. ${verdict}`;
      }
      case 'close': {
        const verdict = f.improved
          ? f.old === null
            ? 'The first full tour.'
            : `Shorter than ${f.old}, so it is the best so far.`
          : `Not shorter than ${f.old}.`;
        return `Close the tour from ${city(f.j)}: all cities visited, ${(f.cand ?? 0) - f.dist[f.j][0]} + ${f.dist[f.j][0]} back to A = ${f.cand}. ${verdict}`;
      }
      case 'trace':
        return `Read back: the best walk over ${mask} that ends at ${city(f.j)} came from ${city(f.k)}. Remove ${city(f.j)} from the mask and continue at ${city(f.k)}.`;
      case 'done':
        return `The shortest tour is ${f.tour.map(city).join(' → ')}, length ${f.result}.`;
    }
  },
  takeaways: [
    'A bitmask stores a set of up to about 20 items in one integer: bit c is 1 when item c is in the set. Add c with mask | 2ᶜ, test it with mask & 2ᶜ, and the full set is 2ⁿ − 1.',
    'Held-Karp’s state is (mask, j): the cities visited so far and the city you stand on. The order of the earlier cities no longer matters, only which ones, and that is what collapses (n − 1)! tours into 2ⁿ · n states.',
    'dp[mask | 2ᵏ][k] = min over j of dp[mask][j] + d[j][k]. Adding a bit makes the number larger, so running masks in increasing order finishes every state before it is read.',
    'Time O(2ⁿ · n²), memory O(2ⁿ · n): fine for n ≈ 20, hopeless for 100. Brute force needs (n − 1)! tours, already 120 for 6 cities and over 10¹⁷ for 20.',
    'Drag one city far from the others and step to the end: watch which states improve, and how the best tour changes its order to visit that city.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    ['States', 'O(2ⁿ · n)', 'One per set of visited cities and per current city.'],
    ['Time', 'O(2ⁿ · n²)', 'Each state tries every city not yet visited.'],
    ['Memory', 'O(2ⁿ · n)', 'The table, plus one predecessor per state to rebuild the tour.'],
    ['Brute force', 'O(n!)', '(n − 1)! orders of the cities after A, each measured in O(n).'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Cities are numbered A = 0, B = 1, C = 2, D = 3. Which mask (as a decimal number) stands for the set {A, C, D}?',
      answer: 13,
      hints: ['Add 2ᶜ for every city c in the set.'],
      solution: '2⁰ + 2² + 2³ = 1 + 4 + 8 = 13, in binary 1101.',
    },
    {
      type: 'number',
      prompt: 'Load the 4 cities example and step to the end. How long is the shortest tour?',
      answer: 20,
      unit: 'steps',
      hints: ['Read Shortest tour at the last step.'],
      solution:
        'A → C → D → B → A: 5 + 6 + 4 + 5 = 20 grid steps. The other two tours, each walkable both ways, cost 26 and 28.',
    },
    {
      type: 'number',
      prompt: 'How many transitions does Held-Karp try for 6 cities?',
      answer: 165,
      unit: 'transitions',
      hints: [
        'Load the 6 cities example and read Transitions tried at the end.',
        'A mask of s cities with A has s − 1 end cities and n − s cities left to add.',
      ],
      solution:
        '5 from {A}, then 5·1·4 + 10·2·3 + 10·3·2 + 5·4·1 = 20 + 60 + 60 + 20, so 165 in total.',
    },
    {
      type: 'choice',
      prompt: 'Why may masks be processed in increasing numeric order?',
      options: [
        'Because smaller masks hold shorter walks.',
        'Because every transition adds a bit, so it goes from a mask to a larger number.',
        'Because city A is bit 0.',
        'Because the distances are symmetric.',
      ],
      answer: 1,
      hints: ['Compare mask with mask | 2ᵏ when bit k is 0.'],
      solution:
        'mask | 2ᵏ = mask + 2ᵏ > mask. Every state is only written by states with smaller masks, so it is final when its own turn comes.',
    },
    {
      type: 'text',
      prompt: 'What is the running time of Held-Karp for n cities?',
      accept: ['O(2^n n^2)', 'O(2^n·n^2)', 'O(n^2 2^n)', 'O(n^2·2^n)', 'O(2ⁿ n²)', 'O(2ⁿ·n²)'],
      hints: ['Count the states, then the work per state.'],
      solution: 'There are 2ⁿ · n states and each tries up to n next cities: O(2ⁿ · n²).',
    },
  ],
  nextTeaser:
    'Next up: DP on trees, where each node’s answer is built from its children’s answers in post-order.',
};
