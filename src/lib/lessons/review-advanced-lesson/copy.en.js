export const en = {
  slug: 'review-advanced-lesson',
  topic: 'review-advanced',
  level: 'Nâng cao',
  title: 'Ôn tập: thuật toán nâng cao',
  intro:
    'This quiz mixes questions from every chapter of the advanced topics: range query structures, string algorithms, number theory, geometry, network flows, advanced dynamic programming, tree techniques, algebraic and randomised algorithms, intractability, advanced heaps and other models of computation. Some questions ask which structure or algorithm fits a job, some ask where the limits of what is computable fast lie, and the rest have you run an algorithm by hand.',
  summary:
    'A mixed quiz over the advanced topics level: choosing a structure or algorithm, the limits of efficient computation, and worked problems from every advanced chapter.',
  instruction:
    'Answer each question and press Check. A wrong answer tells you so straight away; open the hints one at a time, and after your first try you can read the full solution. Solved questions keep their tick in this browser.',
  practiceTitle: 'Advanced topics quiz',
  takeaways: [
    'Let the queries pick the structure: a sparse table for static idempotent queries in O(1), a Fenwick tree for prefix sums with point updates, a segment tree for any associative merge, and lazy tags when updates cover whole ranges.',
    'Strings are matched in linear time by reusing what earlier comparisons learnt: the prefix function, the Z-box, Aho-Corasick’s failure links and Manacher’s mirror all avoid going back in the text.',
    'Many problems become standard once modelled: a flow network for assignments and cuts, bitmasks for subsets of up to about 20 items, heavy paths or binary lifting for queries along tree paths.',
    'Know the limits: about 10⁸ simple steps a second decides which complexities fit, and an NP-hard problem calls for a small parameter, an approximation or a heuristic instead of a fast exact algorithm.',
    'Try it: pick the chapter you feel weakest in, answer one of its questions wrong on purpose, and see whether the first hint is enough to get the answer without the solution.',
  ],
  complexityHead: ['Structure or algorithm', 'Cost', 'Why'],
  complexity: [
    [
      'Sparse table',
      'O(n log n) build, O(1) query',
      'Two overlapping power-of-two blocks cover any range, which is safe for idempotent merges such as min and gcd.',
    ],
    [
      'Fenwick tree; segment tree (with lazy tags)',
      'O(log n) per update or query',
      'Each operation touches one cell per bit, or a constant number of nodes on each of the O(log n) levels of the tree; lazy tags postpone range updates.',
    ],
    [
      'Mo’s algorithm',
      'O((n + q)√n)',
      'Sorting the offline queries by block keeps the moves of both window ends short.',
    ],
    [
      'KMP, Z-function, Aho-Corasick',
      'O(n + m) (plus matches)',
      'The text pointer never moves back, and failure links reuse the matched prefix.',
    ],
    [
      'Suffix array with Kasai’s LCP; Manacher',
      'O(n log n) or O(n log² n); O(n)',
      'Prefix doubling sorts by 2ᵏ characters per round; the mirror trick reuses earlier palindrome radii.',
    ],
    [
      'Euclid, extended Euclid, binary exponentiation',
      'O(log n)',
      'The remainder at least halves every two steps, and squaring halves the exponent.',
    ],
    [
      'Sieve of Eratosthenes',
      'O(n log log n)',
      'Each composite is crossed out once per distinct prime factor, and Σ n/p over the primes p ≤ n grows like n log log n.',
    ],
    [
      'Convex hull; sweep line',
      'O(n log n)',
      'Sorting the points or events dominates; each point enters and leaves the hull or active set once.',
    ],
    [
      'Edmonds-Karp; Dinic; Hopcroft-Karp',
      'O(VE²); O(V²E); O(E√V)',
      'Shortest augmenting paths grow in length, so the number of phases is bounded.',
    ],
    [
      'Held-Karp travelling salesman',
      'O(2ⁿ n²) time, O(2ⁿ n) memory',
      'One state per subset of visited cities and last city, each tried from every previous city.',
    ],
    [
      'Binary lifting; heavy-light decomposition',
      'O(n log n) build, O(log n); O(log² n) per path query',
      'Jumps of 2ᵏ cover any depth, and a root path crosses O(log n) heavy chains.',
    ],
    [
      'Fast Fourier transform; matrix exponentiation',
      'O(n log n); O(k³ log n)',
      'Evaluating at roots of unity splits in half each level; squaring a k × k matrix halves the power.',
    ],
    [
      'Fibonacci heap; van Emde Boas tree',
      'O(1) amortized decrease-key; O(log log u)',
      'Lazy consolidation defers work to extract-min; √u clusters halve the key length each level.',
    ],
    [
      'NP-hard problems',
      'No known polynomial algorithm',
      'Exact search is exponential in general, O(2ᵏ n) when a parameter k is small, or an approximation trades optimality for speed.',
    ],
  ],
  nextTeaser:
    'This is the last lesson of the curriculum: you have reached the end of the advanced topics.',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'choice',
      prompt:
        'Range queries. An array of 10⁶ numbers never changes, and you must answer 10⁶ range-minimum queries as fast as possible. Which structure fits best?',
      options: [
        'A Fenwick tree, at O(log n) per query',
        'A sparse table: O(n log n) to build, O(1) per query',
        'Sqrt decomposition, at O(√n) per query',
        'A loop over the range for every query',
      ],
      answer: 1,
      hints: [
        'Nothing is ever updated, so a structure with a slow update is fine.',
        'Taking the minimum twice of the same element does no harm.',
      ],
      solution:
        'Minimum is idempotent, so a range is covered by two overlapping blocks of length 2ᵏ, where k = ⌊log₂ length⌋, and each query reads two table cells. A sparse table cannot be updated cheaply, but this array never changes.',
    },
    {
      type: 'number',
      prompt:
        'Range queries. A Fenwick tree is 1-indexed, and cell i stores the sum of the lowbit(i) elements ending at i. To read the sum of the first 13 elements, how many cells are added together?',
      answer: 3,
      unit: 'cells',
      hints: [
        'Start at i = 13 and repeat i ← i − lowbit(i) until i reaches 0.',
        '13 is 1101 in binary.',
      ],
      solution:
        'The query visits 13 (covers 13), then 12 (covers 9 to 12), then 8 (covers 1 to 8), then stops at 0. That is 3 cells, one per set bit of 13 = 1101₂, so a prefix query costs O(log n).',
    },
    {
      type: 'choice',
      prompt:
        'Range queries. You must add v to every element of a range and also answer range-sum queries, 10⁵ of each, mixed together. Which structure handles both in O(log n)?',
      options: [
        'A sparse table',
        'Prefix sums rebuilt after every update',
        'A segment tree with lazy propagation',
        'Mo’s algorithm over the queries',
      ],
      answer: 2,
      hints: [
        'A range update can touch many elements; which structure stores a pending change on a node instead?',
        'Mo’s algorithm works offline on queries without updates.',
      ],
      solution:
        'A lazy segment tree splits the update range into O(log n) nodes, adds v × length to each node’s sum and leaves a pending tag that is pushed down only when a later operation goes below. Rebuilt prefix sums cost O(n) per update, and a sparse table cannot be updated cheaply.',
    },
    {
      type: 'text',
      prompt:
        'Strings. Write the prefix function π of the word “abacaba”, one value per position, separated by commas.',
      accept: ['0,0,1,0,1,2,3', '0 0 1 0 1 2 3', '0010123', '[0,0,1,0,1,2,3]', 'π=0,0,1,0,1,2,3'],
      hints: [
        'π[i] is the length of the longest proper prefix of s[0..i] that is also a suffix of it.',
        'The last value comes from “abacaba” ending with “aba”, which is also its start.',
      ],
      solution:
        'a → 0, ab → 0, aba → 1 (“a”), abac → 0, abaca → 1 (“a”), abacab → 2 (“ab”), abacaba → 3 (“aba”). So π = 0, 0, 1, 0, 1, 2, 3. KMP uses these values to slide the pattern without moving back in the text.',
    },
    {
      type: 'choice',
      prompt:
        'Strings. A filter must find every occurrence of 1,000 banned words in a long chat log, reading the log only once. Which algorithm fits?',
      options: [
        'Aho-Corasick: a trie of all the words with failure links',
        'KMP, run once per word',
        'Manacher’s algorithm',
        'Boyer-Moore, run once per word',
      ],
      answer: 0,
      hints: [
        'Running a single-pattern matcher 1,000 times reads the log 1,000 times.',
        'Which algorithm extends the prefix function to many patterns at once?',
      ],
      solution:
        'Aho-Corasick builds a trie of all the patterns and adds failure links, the prefix function generalised to a trie. One pass over the log of length n then reports every match in O(n + total pattern length + matches). Manacher finds palindromes, not given words.',
    },
    {
      type: 'order',
      prompt:
        'Strings. Arrange the suffixes of “banana” in the order a suffix array lists them, smallest first.',
      items: ['banana', 'anana', 'nana', 'ana', 'na', 'a'],
      answer: [5, 3, 1, 0, 4, 2],
      hints: [
        'Compare like a dictionary: a word that is a prefix of another comes first.',
        'Three suffixes start with “a”; the shortest of them comes first.',
      ],
      solution:
        'Sorted: a, ana, anana, banana, na, nana. Their start positions give the suffix array 5, 3, 1, 0, 4, 2. Every substring is a prefix of some suffix, so this sorted list answers many substring questions with binary search.',
    },
    {
      type: 'number',
      prompt:
        'Strings. In the sorted suffixes of “banana”, neighbours share these longest common prefixes: 1, 3, 0, 0, 2. How many distinct non-empty substrings does “banana” have?',
      answer: 15,
      unit: 'substrings',
      hints: [
        'A word of length n has n(n + 1)/2 substrings counted with repeats.',
        'Each LCP value counts prefixes of a suffix that already appeared in the previous suffix.',
      ],
      solution:
        'The 6 suffixes have 6 + 5 + … + 1 = 21 prefixes in total. A prefix already seen in the previous sorted suffix is a repeat, and the LCP array counts them: 1 + 3 + 0 + 0 + 2 = 6. So 21 − 6 = 15 substrings are distinct.',
    },
    {
      type: 'number',
      prompt:
        'Number theory. Find the inverse of 7 modulo 26: the number x between 0 and 25 with 7x ≡ 1 (mod 26).',
      answer: 15,
      hints: [
        'An inverse exists because gcd(7, 26) = 1. Run the extended Euclidean algorithm on 26 and 7.',
        '26 = 3 × 7 + 5, 7 = 1 × 5 + 2, 5 = 2 × 2 + 1.',
      ],
      solution:
        'Back-substituting gives 1 = 3 × 26 − 11 × 7, so 7 × (−11) ≡ 1 (mod 26) and x = −11 + 26 = 15. Check: 7 × 15 = 105 = 4 × 26 + 1. Fermat’s little theorem does not apply here, since 26 is not prime.',
    },
    {
      type: 'number',
      prompt:
        'Number theory. Find the smallest positive x with x ≡ 2 (mod 3), x ≡ 3 (mod 5) and x ≡ 2 (mod 7).',
      answer: 23,
      hints: [
        'The moduli are pairwise coprime, so the Chinese remainder theorem gives one answer between 0 and 104.',
        'Combine the first and third: x ≡ 2 (mod 21). Then try 2, 23, 44, … modulo 5.',
      ],
      solution:
        'x ≡ 2 modulo both 3 and 7 means x ≡ 2 (mod 21), so x is 2, 23, 44, 65 or 86. Only 23 leaves remainder 3 on division by 5. The answer is unique modulo 3 × 5 × 7 = 105.',
    },
    {
      type: 'number',
      prompt:
        'Number theory. An RSA key uses p = 5, q = 11 and public exponent e = 3. What is the private exponent d, the inverse of e modulo φ(n)?',
      answer: 27,
      hints: ['n = 55 and φ(n) = (p − 1)(q − 1) = 40.', 'Find d with 3d ≡ 1 (mod 40).'],
      solution:
        'φ(55) = 4 × 10 = 40, and 3 × 27 = 81 = 2 × 40 + 1, so d = 27. Anyone who could factor n would get φ(n) and then d the same way, which is why RSA’s safety rests on factoring being hard for large n.',
    },
    {
      type: 'number',
      prompt:
        'Geometry. A polygon has the vertices (0, 0), (4, 0), (4, 3), (1, 5) and (0, 3), in that order. What is its area?',
      answer: 16,
      unit: 'square units',
      hints: [
        'Use the shoelace formula: half the absolute value of Σ (xᵢ yᵢ₊₁ − xᵢ₊₁ yᵢ).',
        'The five cross terms are 0, 12, 17, 3 and 0.',
      ],
      solution:
        'The terms are 0·0 − 4·0 = 0, 4·3 − 4·0 = 12, 4·5 − 1·3 = 17, 1·3 − 0·5 = 3 and 0·0 − 0·3 = 0. Their sum is 32, positive because the vertices go counter-clockwise, so the area is 32 / 2 = 16. Whole-number inputs keep the sum exact.',
    },
    {
      type: 'choice',
      prompt:
        'Geometry. Walking from A = (0, 0) to B = (4, 0) and then on to C = (2, 3), which way do you turn at B?',
      options: [
        'Clockwise, a right turn',
        'No turn: the points are collinear',
        'It depends on the length of AB',
        'Counter-clockwise, a left turn',
      ],
      answer: 3,
      hints: ['Compute the cross product (B − A) × (C − A).', '(4, 0) × (2, 3) = 4 × 3 − 0 × 2.'],
      solution:
        'The cross product is 4 × 3 − 0 × 2 = 12 > 0, so A, B, C turn counter-clockwise. The sign alone decides the orientation, using only exact multiplications, which is why hull and intersection tests are built on it.',
    },
    {
      type: 'number',
      prompt:
        'Geometry. How many corners does the convex hull of these points have: (0, 0), (2, 0), (4, 0), (6, 2), (4, 4), (2, 3), (1, 1), (0, 4), (3, 2)? Points in the middle of a hull edge do not count as corners.',
      answer: 5,
      unit: 'corners',
      hints: [
        'Sketch the points; the hull is the shape of a rubber band around them.',
        '(2, 0) lies on the edge from (0, 0) to (4, 0).',
      ],
      solution:
        'The hull is (0, 0), (4, 0), (6, 2), (4, 4), (0, 4). (2, 0) is collinear with its neighbours and (2, 3), (1, 1) and (3, 2) lie inside. Andrew’s monotone chain pops a point on every turn that is not strictly left, so it drops collinear points as well.',
    },
    {
      type: 'number',
      prompt:
        'Flows. A network has the arcs s→a 10, s→b 8, a→b 4, a→t 6 and b→t 10, with capacities. What is the maximum flow from s to t?',
      answer: 16,
      hints: [
        'The max-flow min-cut theorem says the answer equals the smallest cut. Try the cut around t.',
        'The arcs into t carry at most 6 + 10 = 16.',
      ],
      solution:
        'Send 6 along s→a→t, 4 along s→a→b→t and 6 along s→b→t: 16 in all. The cut {s, a, b} | {t} has capacity 6 + 10 = 16, so no flow can be larger. The other cuts are 18 ({s}), 18 ({s, a}) and 20 ({s, b}).',
    },
    {
      type: 'choice',
      prompt:
        'Flows. In every bipartite graph, the size of a maximum matching equals which other quantity?',
      options: [
        'The number of vertices on the smaller side',
        'The size of a minimum vertex cover',
        'Half the number of edges',
        'The size of a maximum independent set',
      ],
      answer: 1,
      hints: [
        'Model the matching as a flow from s through the left side to the right side to t, with capacity 1 everywhere.',
        'What does a minimum s-t cut look like in that network?',
      ],
      solution:
        'This is Kőnig’s theorem. A minimum cut in the unit-capacity network picks left vertices on the sink side and right vertices on the source side, and together they cover every edge; max flow equals min cut, so the largest matching equals the smallest cover.',
    },
    {
      type: 'number',
      prompt:
        'Advanced DP. Held-Karp solves the travelling salesman problem with one state per pair (set of visited cities, current city). How many states are there for n = 15 cities?',
      answer: 491520,
      unit: 'states',
      hints: ['There are 2ⁿ subsets and n possible current cities.', '2¹⁵ = 32,768.'],
      solution:
        '2¹⁵ × 15 = 32,768 × 15 = 491,520 states. Each state tries up to n previous cities, so the time is O(2ⁿ n²), about 7 million steps here, far below the 14! ≈ 8.7 × 10¹⁰ orders of trying every tour.',
    },
    {
      type: 'number',
      prompt:
        'Advanced DP. In a tree, vertex 1 (weight 3) has children 2 (weight 5) and 3 (weight 4); vertex 2 has children 4 (weight 6) and 5 (weight 2); vertex 3 has the child 6 (weight 3). What is the largest total weight of a set of vertices with no two adjacent?',
      answer: 14,
      hints: [
        'Work in post-order with two values per vertex: the best with it taken, and the best with it left out.',
        'Vertex 2 gives 5 taken, or 6 + 2 = 8 left out.',
      ],
      solution:
        'Leaves give (taken, out) = (6, 0), (2, 0), (3, 0). Vertex 2: (5, 8); vertex 3: (4, 3). Vertex 1 taken: 3 + 8 + 3 = 14; left out: 8 + 4 = 12. The best set is {1, 4, 5, 6} with weight 14, found in O(n).',
    },
    {
      type: 'choice',
      prompt:
        'Advanced DP. A recurrence is dp[i] = min over j < i of (dp[j] + b[j] · x[i]), where b[j] decreases as j grows and x[i] increases as i grows. Which optimisation brings the O(n²) loop down to O(n)?',
      options: [
        'Knuth’s optimisation for interval DP',
        'A monotone queue for a sliding-window minimum',
        'Memoizing the recursion',
        'The convex hull trick, with a pointer that only moves forward',
      ],
      answer: 3,
      hints: [
        'Read each j as a line y = b[j] · x + dp[j].',
        'You want the lowest line at the point x[i], and the query points only increase.',
      ],
      solution:
        'Each j adds a line with slope b[j] and intercept dp[j]; dp[i] is the lowest line at x[i]. Slopes arrive in decreasing order, so the lower envelope is kept in a deque, and increasing queries let one pointer walk along it: O(n) in total.',
    },
    {
      type: 'number',
      prompt:
        'Tree techniques. A rooted tree has n = 100,000 vertices and may be a single long path. Binary lifting stores jumps of 2⁰, 2¹, …, 2^(LOG − 1) ancestors per vertex. What is the smallest LOG with 2^LOG ≥ n?',
      answer: 17,
      hints: ['2¹⁶ = 65,536.', 'Is 65,536 at least 100,000?'],
      solution:
        '2¹⁶ = 65,536 is too small and 2¹⁷ = 131,072 is enough, so LOG = 17. Any depth below n is a sum of distinct powers of two below 2¹⁷, so k-th ancestor and LCA queries take O(log n) jumps after O(n log n) preprocessing.',
    },
    {
      type: 'choice',
      prompt:
        'Tree techniques. In a heavy-light decomposition, why does the path from any vertex to the root cross only O(log n) light edges?',
      options: [
        'Going up a light edge at least doubles the size of the subtree you are in',
        'Every heavy chain has at most log n vertices',
        'The decomposition rebalances the tree first',
        'Every vertex has at most two children',
      ],
      answer: 0,
      hints: [
        'A light child’s subtree is no bigger than its heavy sibling’s.',
        'How many times can a subtree size double before it passes n?',
      ],
      solution:
        'A light child’s subtree holds at most half of its parent’s subtree, so each light edge going up at least doubles the size, which can happen at most log₂ n times. Heavy chains can be long, but each one is a contiguous range in the segment tree, giving O(log² n) path queries.',
    },
    {
      type: 'number',
      prompt:
        'Algebra and randomness. In Nim with piles of 3, 4 and 5 stones, the first player has exactly one winning move, taking from the pile of 3. How many stones does that move take?',
      answer: 2,
      unit: 'stones',
      hints: [
        'A position is losing for the player to move exactly when the XOR of the piles is 0.',
        '3 ⊕ 4 ⊕ 5 = 2. Which pile p has p ⊕ 2 smaller than p?',
      ],
      solution:
        'The XOR is 011 ⊕ 100 ⊕ 101 = 010 = 2. Changing the pile of 3 to 3 ⊕ 2 = 1 makes the XOR 0, so take 2 stones. The other piles would have to grow (4 ⊕ 2 = 6, 5 ⊕ 2 = 7), which is not allowed.',
    },
    {
      type: 'multi',
      prompt:
        'Algebra and randomness. Which of these are Las Vegas algorithms, always giving a correct answer with only the running time left to chance?',
      options: [
        'Randomised quicksort',
        'The Miller-Rabin primality test',
        'One run of Karger’s random-contraction minimum cut',
        'Randomised quickselect',
        'The Fermat primality test',
      ],
      answers: [0, 3],
      hints: [
        'A Monte Carlo algorithm has a fixed running time but may answer wrongly.',
        'Can a random pivot ever make a sort or a selection return a wrong result?',
      ],
      solution:
        'Random pivots only change how long quicksort and quickselect take, never their output: Las Vegas. Miller-Rabin and Fermat can call a composite prime, and one Karger run can miss the minimum cut: Monte Carlo, made reliable by repeating.',
    },
    {
      type: 'number',
      prompt:
        'Algebra and randomness. Let M be the 2 × 2 matrix with rows (1, 1) and (1, 0). What is the top-right entry of M¹⁰?',
      answer: 55,
      hints: [
        'Mⁿ has rows (F(n + 1), F(n)) and (F(n), F(n − 1)), where F(1) = F(2) = 1.',
        'Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55.',
      ],
      solution:
        'The top-right entry of Mⁿ is F(n), and F(10) = 55. Binary exponentiation reaches M¹⁰ = M⁸ · M² with 3 squarings and 1 extra product, so F(n) takes O(log n) matrix products instead of n additions.',
    },
    {
      type: 'multi',
      prompt:
        'Intractability. Which of these decision problems are NP-complete, as far as anyone knows today?',
      options: [
        '3-SAT',
        '2-SAT',
        'Vertex cover: is there a cover of at most k vertices?',
        'Shortest path: is there a path of length at most k?',
        'Subset sum',
        'Bipartite matching: is there a matching of at least k edges?',
      ],
      answers: [0, 2, 4],
      hints: [
        'Three of these have polynomial algorithms from earlier chapters.',
        '2-SAT is solved with strongly connected components.',
      ],
      solution:
        '3-SAT, vertex cover and subset sum are NP-complete. 2-SAT is solved in O(n + m) with an implication graph, shortest paths with Dijkstra or Bellman-Ford, and bipartite matching with augmenting paths, so those three are in P.',
    },
    {
      type: 'choice',
      prompt:
        'Intractability. You want to prove that a new problem X is NP-hard. What must you show?',
      options: [
        'X reduces in polynomial time to 3-SAT',
        'X has an exponential-time algorithm',
        'No one has found a polynomial algorithm for X',
        'A known NP-hard problem, such as 3-SAT, reduces in polynomial time to X',
      ],
      answer: 3,
      hints: [
        'A reduction A ≤ B says B is at least as hard as A.',
        'You want X to be at least as hard as something already known to be hard.',
      ],
      solution:
        'Reducing 3-SAT to X means a fast algorithm for X would also solve 3-SAT fast, so X is at least as hard: NP-hard. Reducing X to 3-SAT shows the opposite, that X is no harder than 3-SAT, which only puts X in NP.',
    },
    {
      type: 'number',
      prompt:
        'Intractability. A bounded search tree solves vertex cover with parameter k = 10: take any uncovered edge (u, v) and branch on putting u or v in the cover. At most how many leaves does the search tree have?',
      answer: 1024,
      unit: 'leaves',
      hints: [
        'Every branch adds one vertex to the cover, so the depth is at most k.',
        'Each node has 2 children.',
      ],
      solution:
        'One of u and v must be in any cover, so two branches are enough, and each one uses up one of the k vertices. A binary tree of depth 10 has at most 2¹⁰ = 1,024 leaves, so the whole search is O(2ᵏ (n + m)): exponential only in k, not in n.',
    },
    {
      type: 'text',
      prompt:
        'Advanced heaps. What is the amortized cost of decrease-key in a Fibonacci heap, in big-O notation?',
      accept: ['O(1)', 'O(1) amortized', 'amortized O(1)', 'Θ(1)', 'constant', 'constant time'],
      hints: [
        'Decrease-key cuts the node out and makes it a root; cascading cuts are paid for by marks set earlier.',
        'It is the reason Dijkstra with a Fibonacci heap runs in O(E + V log V).',
      ],
      solution:
        'O(1) amortized. The cut and each cascading cut are paid for by the potential stored in marked nodes, and consolidation is left for extract-min, which costs O(log n) amortized. With E decrease-keys and V extract-mins, Dijkstra costs O(E + V log V).',
    },
    {
      type: 'number',
      prompt:
        'Advanced heaps. A van Emde Boas tree over the universe u = 2¹⁶ splits each key into a high half and a low half at every level. How many times does the key length halve before it reaches 1 bit?',
      answer: 4,
      unit: 'levels',
      hints: ['The key starts with 16 bits.', '16 → 8 → …'],
      solution:
        '16 → 8 → 4 → 2 → 1 bits is 4 halvings, which is log₂ log₂ u = log₂ 16 = 4. A successor query does constant work per level, so it costs O(log log u) whatever the number of keys stored.',
    },
    {
      type: 'number',
      prompt:
        'Models of computation. A fork-join program has work T₁ = 100 ms and span T∞ = 10 ms. A greedy scheduler on P = 5 processors finishes in at most how many milliseconds?',
      answer: 30,
      unit: 'ms',
      hints: ['Use the greedy scheduler bound T_P ≤ T₁/P + T∞.', '100 / 5 = 20.'],
      solution:
        'T₅ ≤ 100 / 5 + 10 = 30 ms. No schedule can beat max(T₁/P, T∞) = 20 ms, so greedy is within a factor 2 of optimal. The parallelism T₁/T∞ = 10 says more than about 10 processors cannot help much.',
    },
    {
      type: 'choice',
      prompt:
        'Models of computation. Renting skis costs 1 per day and buying them costs 10, and you do not know how many days you will ski. You rent until you have paid 9, then buy. What competitive ratio does this guarantee?',
      options: [
        '1: it always pays what the best offline choice pays',
        '1.9: it never pays more than 19 when the best offline choice pays 10',
        '10: the price of the skis',
        'None: the cost is unbounded because the season length is unknown',
      ],
      answer: 1,
      hints: [
        'The worst case is stopping right after you buy.',
        'Then you paid 9 + 10, while someone who knew the future would have bought on day 1.',
      ],
      solution:
        'If you ski fewer than 10 days you pay exactly what the best offline choice pays. Otherwise you pay 9 + 10 = 19 against the offline 10, a ratio of 1.9 = 2 − 1/10. No deterministic strategy does better, which is the classic ski-rental bound.',
    },
    {
      type: 'multi',
      prompt:
        'Choosing. With n = 10⁵ and about 10⁸ simple steps per second, which running times fit within about one second?',
      options: ['O(n log n)', 'O(n√n)', 'O(n²)', 'O(2ⁿ)', 'O(n log² n)'],
      answers: [0, 1, 4],
      hints: ['Plug in: log₂ 10⁵ ≈ 17 and √10⁵ ≈ 316.', 'n² is 10¹⁰.'],
      solution:
        'n log n ≈ 1.7 × 10⁶, n√n ≈ 3.2 × 10⁷ and n log² n ≈ 2.8 × 10⁷ all fit. n² = 10¹⁰ takes about 100 seconds, and 2ⁿ is far beyond any computer. Checking the limits first rules out approaches before you write them.',
    },
    {
      type: 'order',
      prompt:
        'Choosing. Arrange these running times from the slowest-growing to the fastest-growing.',
      items: ['O(n log n)', 'O(2ⁿ)', 'O(log log n)', 'O(n²)', 'O(√n)', 'O(n!)', 'O(log n)'],
      answer: [2, 6, 4, 0, 3, 1, 5],
      hints: [
        'Polylogarithmic below polynomial, polynomial below exponential.',
        'n! grows faster than 2ⁿ, since most of its factors exceed 2.',
      ],
      solution:
        'log log n (van Emde Boas) < log n (balanced trees) < √n (sqrt decomposition) < n log n (sorting) < n² (simple DP) < 2ⁿ (subsets) < n! (permutations). Each step up shrinks the largest n that fits in a second.',
    },
    {
      type: 'choice',
      prompt:
        'Choosing. A tree has 10⁵ vertices with values. You must answer 10⁵ queries “sum of the values on the path from u to v”, mixed with updates that change one vertex’s value. Which approach fits?',
      options: [
        'Binary lifting alone',
        'A sparse table over an Euler tour',
        'Heavy-light decomposition with a segment tree over the chains',
        'Floyd-Warshall on the tree',
      ],
      answer: 2,
      hints: [
        'The values change, so a static table is not enough.',
        'Split each path into a few contiguous ranges that a range-sum structure can answer.',
      ],
      solution:
        'Heavy-light decomposition cuts any path into O(log n) chains, each a contiguous range of positions, and a segment tree answers each range and each point update in O(log n): O(log² n) per query. A sparse table cannot be updated, and Floyd-Warshall’s O(n³) is far too slow.',
    },
  ],
};
