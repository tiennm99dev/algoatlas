export const en = {
  slug: 'review-core-lesson',
  topic: 'review-core',
  level: 'Advanced',
  title: 'Review: core algorithms',
  intro:
    'This quiz mixes questions from every chapter of the core algorithms: shortest paths, union-find, minimum spanning trees, advanced graphs, divide and conquer, greedy algorithms, dynamic programming, backtracking and balanced search trees. Many questions describe a problem and ask which algorithm or paradigm fits it, because recognising the shape of a problem is the skill these chapters build; the rest have you run an algorithm by hand.',
  summary:
    'A mixed quiz over the core algorithms level: choosing a graph algorithm, recognising a paradigm from a problem statement, and a recap of balanced search trees.',
  instruction:
    'Answer each question and press Check. A wrong answer tells you so straight away; open the hints one at a time, and after your first try you can read the full solution. Solved questions keep their tick in this browser.',
  practiceTitle: 'Core algorithms quiz',
  takeaways: [
    'Let the edge weights pick the shortest-path algorithm: all equal means BFS, only 0 and 1 means a deque, non-negative means Dijkstra, negative means Bellman-Ford, and a DAG only needs one pass in topological order.',
    'Read the problem for its paradigm: independent halves suggest divide and conquer, a choice you can prove safe suggests greedy, overlapping subproblems suggest dynamic programming, and “list every valid arrangement” suggests backtracking.',
    'Greedy must be proved, not assumed. Earliest finish time and fractional knapsack are safe, while the same value-per-weight rule fails on the 0/1 knapsack.',
    'Balanced trees keep the height at O(log n) in different ways: AVL trees bound subtree heights, red-black trees use colour rules, B-trees use wide nodes for disks, and treaps and skip lists use randomness.',
    'Try it: answer a question from your weakest chapter wrong on purpose, read the first hint, and see whether it is enough to get the answer without the solution.',
  ],
  complexityHead: ['Structure or algorithm', 'Cost', 'Why'],
  complexity: [
    [
      'Dijkstra with a binary heap',
      'O((V + E) log V)',
      'Every vertex is settled once and every edge can push one heap entry; weights must be non-negative.',
    ],
    [
      '0-1 BFS; relaxing a DAG in topological order',
      'O(V + E)',
      'A deque or a fixed vertex order replaces the heap, so no log factor is needed.',
    ],
    [
      'Bellman-Ford',
      'O(VE)',
      'V − 1 rounds relax every edge; a further round that still improves a distance proves a negative cycle.',
    ],
    [
      'Floyd-Warshall',
      'O(V³) time, O(V²) memory',
      'Three nested loops try every vertex k as an intermediate between every pair.',
    ],
    [
      'Johnson’s algorithm',
      'O(VE + V(V + E) log V)',
      'One Bellman-Ford finds potentials that remove negative weights, then Dijkstra runs from each vertex.',
    ],
    [
      'Union-find with rank and path compression',
      'O(α(n)) amortized',
      'The inverse Ackermann function stays at most 4 for any n that fits in memory.',
    ],
    [
      'Kruskal; Prim with a heap; Prim with an array',
      'O(E log E); O((V + E) log V); O(V²)',
      'Kruskal’s cost is sorting the edges, and the array form of Prim suits dense graphs.',
    ],
    [
      'Tarjan’s SCC, bridges, Hierholzer',
      'O(V + E)',
      'One DFS or one walk uses each edge a constant number of times.',
    ],
    [
      'Merge-style divide and conquer (inversions, closest pair)',
      'O(n log n)',
      'T(n) = 2T(n/2) + O(n): log₂ n levels, each doing linear work.',
    ],
    [
      'Karatsuba; Strassen',
      'O(n^1.585); O(n^2.807)',
      'Three instead of four, and seven instead of eight, recursive multiplications change the master theorem’s answer.',
    ],
    [
      'Quickselect; median of medians',
      'O(n) expected; O(n) worst case',
      'Only one side of the partition is searched, so the work forms a shrinking geometric series.',
    ],
    [
      'Interval scheduling; Huffman coding',
      'O(n log n)',
      'Sorting by finish time, or a heap of the n symbols, is the only step above linear.',
    ],
    [
      'Table DP: edit distance; 0/1 knapsack',
      'O(nm); O(nW)',
      'Cost is states times transitions. The knapsack’s O(nW) is pseudo-polynomial, since W is a number and not an input length.',
    ],
    [
      'Backtracking',
      'Exponential in the worst case',
      'The search tree can hold every arrangement; pruning cuts branches but rarely changes the worst-case bound.',
    ],
    [
      'AVL, red-black, treap (expected), skip list (expected)',
      'O(log n)',
      'Each keeps its height or level count logarithmic, so every operation walks a short path.',
    ],
    [
      'B-tree of order m',
      'O(log_m n) node reads',
      'Wide nodes keep the tree very shallow, so few slow disk reads are needed.',
    ],
  ],
  nextTeaser: 'Next up: Sparse table, the start of the advanced topics level.',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'multi',
      prompt:
        'Shortest paths. A directed graph has some negative edges but no negative cycle. Which of these give correct shortest paths?',
      options: [
        'Dijkstra that never revisits a settled vertex',
        'Bellman-Ford',
        'Floyd-Warshall',
        'Johnson’s algorithm',
        'Plain BFS that counts edges',
      ],
      answers: [1, 2, 3],
      hints: [
        'Dijkstra’s proof needs a settled distance to never improve later.',
        'Johnson first reweights the edges so that none is negative.',
      ],
      solution:
        'Bellman-Ford and Floyd-Warshall allow negative edges as long as no negative cycle exists, and Johnson removes them with potentials before running Dijkstra. Settle-once Dijkstra can fix a distance that a later negative edge would improve, and BFS ignores weights altogether.',
    },
    {
      type: 'choice',
      prompt:
        'Shortest paths. Currency rates form a directed graph. With edge weight −log(rate), you want to know whether some loop of trades makes a profit. Which algorithm fits?',
      options: [
        'Dijkstra from every currency',
        'Bellman-Ford, then one extra round of relaxation',
        'BFS from every currency',
        'Kruskal on the rates',
      ],
      answer: 1,
      hints: [
        'A profitable loop multiplies rates to more than 1. What does that make the sum of the −log weights?',
        'Which algorithm detects a negative cycle?',
      ],
      solution:
        'A loop with a product above 1 has a negative total of −log(rate), so it is a negative cycle. Bellman-Ford relaxes every edge V − 1 times; if one more round still improves a distance, a negative cycle exists. Dijkstra is not valid on negative weights.',
    },
    {
      type: 'order',
      prompt:
        'Shortest paths. Directed edges: A→B 7, A→C 2, C→B 3, C→D 8, B→D 1, D→E 2, B→E 9. Arrange the vertices in the order Dijkstra settles them from A.',
      items: ['A', 'B', 'C', 'D', 'E'],
      answer: [0, 2, 1, 3, 4],
      hints: [
        'Dijkstra always settles the unsettled vertex with the smallest tentative distance.',
        'After C is settled, B’s distance improves from 7 to 5.',
      ],
      solution:
        'The final distances are A 0, C 2, B 5 (through C), D 6 (through B) and E 8 (through D). Dijkstra settles vertices by increasing distance, so the order is A, C, B, D, E.',
    },
    {
      type: 'choice',
      prompt:
        'Shortest paths. In a grid, moving through an open cell costs 0 and breaking a wall costs 1. You want the fewest walls broken from start to goal in O(V + E). Which method fits?',
      options: [
        'Plain BFS with a queue',
        'Floyd-Warshall',
        'Bellman-Ford',
        '0-1 BFS with a deque: 0-edges go to the front, 1-edges to the back',
      ],
      answer: 3,
      hints: [
        'Plain BFS treats every edge the same.',
        'The structure must keep vertices ordered by distance, using only two distinct distances at a time.',
      ],
      solution:
        'With weights of only 0 and 1, a deque stays sorted by distance when 0-edges go to the front and 1-edges to the back. That gives Dijkstra’s order without a heap, in O(V + E). Plain BFS would count moves instead of walls.',
    },
    {
      type: 'number',
      prompt:
        'Shortest paths. A project’s tasks form a DAG with durations in days on the edges: A→B 3, A→C 2, B→D 4, C→D 6, D→E 1. What is the length of the longest path from A to E, the time the project needs?',
      answer: 9,
      unit: 'days',
      hints: [
        'Relax the edges in topological order, keeping the maximum instead of the minimum.',
        'Longest to D is the larger of 3 + 4 and 2 + 6.',
      ],
      solution:
        'In topological order A, B, C, D, E: B = 3, C = 2, D = max(3 + 4, 2 + 6) = 8, E = 8 + 1 = 9. Longest path is hard on general graphs, but a DAG has no cycles, so one pass in topological order solves it.',
    },
    {
      type: 'text',
      prompt:
        'Shortest paths. A* is guaranteed to return an optimal path when its heuristic h(n) never overestimates the true remaining cost. What one-word name does such a heuristic have?',
      accept: ['admissible', 'an admissible heuristic', 'admissible heuristic'],
      hints: [
        'It is not “consistent”, which is the stronger triangle-inequality condition.',
        'The word starts with “a”.',
      ],
      solution:
        'A heuristic that never overestimates is admissible. Consistency, h(u) ≤ w(u, v) + h(v), is stronger: it also means no vertex has to be reopened. With h = 0, A* is simply Dijkstra.',
    },
    {
      type: 'number',
      prompt:
        'Union-find. Vertices 1 to 8 start alone. Add the edges (1, 2), (3, 4), (2, 3), (5, 6), (1, 4) in order. How many connected components remain?',
      answer: 4,
      unit: 'components',
      hints: [
        'Every union that joins two different sets lowers the count by one.',
        'When (1, 4) arrives, 1 and 4 already have the same root.',
      ],
      solution:
        'The first four edges each merge two sets, so the count falls from 8 to 4: {1, 2, 3, 4}, {5, 6}, {7}, {8}. Edge (1, 4) finds the same root at both ends, so it merges nothing; it is the edge that closes a cycle.',
    },
    {
      type: 'number',
      prompt:
        'Union-find. Use union by rank without path compression, where a single element has rank 0. Starting from 16 single elements, what is the largest rank any root can reach?',
      answer: 4,
      hints: [
        'A rank grows only when two roots of equal rank are joined.',
        'A root of rank r has at least 2^r elements below it, itself included.',
      ],
      solution:
        'Rank r needs at least 2^r elements, so 16 = 2⁴ elements allow rank 4, reached by joining equal pairs: 8 of rank 1, 4 of rank 2, 2 of rank 3, then 1 of rank 4. So a find costs at most O(log n) even before compression is added.',
    },
    {
      type: 'number',
      prompt:
        'Spanning trees. An undirected graph has the edges A–B 1, B–C 2, A–C 3, C–D 4, B–D 5, D–E 6, C–E 7. What is the total weight of its minimum spanning tree?',
      answer: 13,
      hints: [
        'Run Kruskal: take edges by increasing weight and skip any that would close a cycle.',
        'A–C 3 and B–D 5 are skipped.',
      ],
      solution:
        'Kruskal takes A–B 1 and B–C 2, skips A–C 3 (a cycle), takes C–D 4, skips B–D 5, and takes D–E 6. That is V − 1 = 4 edges with total 1 + 2 + 4 + 6 = 13.',
    },
    {
      type: 'multi',
      prompt:
        'Spanning trees. A connected undirected graph has all distinct edge weights. Which statements about its minimum spanning tree are true?',
      options: [
        'The lightest edge crossing any cut is in it',
        'The heaviest edge on any cycle is not in it',
        'The tree path between two vertices is always a shortest path between them',
        'It has exactly V − 1 edges',
        'Adding 1 to every edge weight can change which edges it uses',
      ],
      answers: [0, 1, 3],
      hints: [
        'The first two are the cut property and the cycle property.',
        'Kruskal only looks at the order of the weights.',
      ],
      solution:
        'The cut and cycle properties are true, and every spanning tree has V − 1 edges. An MST minimises the total weight, not each path, so its paths need not be shortest. Adding 1 to all weights keeps their order, so Kruskal picks the same edges.',
    },
    {
      type: 'choice',
      prompt:
        'Spanning trees. You must connect 5,000 sites, and a cable can run between any two of them, so the graph is complete. Which implementation fits best?',
      options: [
        'Dijkstra with a binary heap',
        'Prim with a plain array, O(V²)',
        'Kruskal, sorting all edges',
        'Bellman-Ford',
      ],
      answer: 1,
      hints: [
        'A complete graph on 5,000 vertices has about 12.5 million edges.',
        'Compare V² with E log E on those numbers.',
      ],
      solution:
        'With E ≈ V²/2, array Prim costs about V² = 25 million steps. Kruskal must sort 12.5 million edges, roughly 300 million comparisons. Kruskal shines on sparse graphs, and Dijkstra and Bellman-Ford solve a different problem.',
    },
    {
      type: 'choice',
      prompt:
        'Advanced graphs. In a network of servers, you must find every single cable whose failure splits the network in two. Which algorithm fits?',
      options: [
        'Bridges from DFS low-link values',
        'Kosaraju’s strongly connected components',
        'Topological sort',
        'Minimum spanning tree',
      ],
      answer: 0,
      hints: [
        'An undirected edge whose removal disconnects the graph has a special name.',
        'In a DFS tree, can any back edge climb past the tree edge?',
      ],
      solution:
        'Such an edge is a bridge. DFS computes tin and low for each vertex, and a tree edge (u, v) is a bridge when low[v] > tin[u], meaning nothing under v reaches back to u or above. It is one DFS, so O(V + E).',
    },
    {
      type: 'number',
      prompt:
        'Advanced graphs. A directed graph has the edges A→B, B→C, C→A, C→D, D→E, E→D, E→F. How many strongly connected components does it have?',
      answer: 3,
      unit: 'components',
      hints: [
        'Two vertices share a component when each can reach the other.',
        'A, B, C form a cycle, and so do D and E. Can F get back?',
      ],
      solution:
        'The components are {A, B, C}, {D, E} and {F}: A, B, C form a cycle, D and E reach each other, and F has no outgoing edge. Condensing them gives the DAG {A, B, C} → {D, E} → {F}.',
    },
    {
      type: 'choice',
      prompt:
        'Advanced graphs. A connected undirected street map has five junctions, with degrees 4, 3, 3, 2, 2. A sweeper wants to use every street exactly once. What is possible?',
      options: [
        'A closed tour that returns to its start',
        'Neither a path nor a tour',
        'A path that starts and ends at the two degree-3 junctions, but no closed tour',
        'A path from any junction to any other',
      ],
      answer: 2,
      hints: [
        'Count the junctions of odd degree.',
        'Every pass through a junction uses two of its streets, so only the two ends of a path can be odd.',
      ],
      solution:
        'A connected graph has an Eulerian circuit when no vertex has odd degree, and an Eulerian path when exactly two do. Here two junctions have degree 3, so a path exists, and it must start at one and end at the other. Hierholzer’s algorithm builds it in O(E).',
    },
    {
      type: 'choice',
      prompt:
        'Advanced graphs. In a 2-SAT implication graph, which edges does the clause (a ∨ b) add?',
      options: ['a → b and b → a', '¬a → ¬b and ¬b → ¬a', 'a → ¬b and b → ¬a', '¬a → b and ¬b → a'],
      answer: 3,
      hints: [
        'If a is false, what must be true for the clause to hold?',
        'Each clause gives an implication and its contrapositive.',
      ],
      solution:
        'If a is false then b must be true, and if b is false then a must be true. So the edges are ¬a → b and ¬b → a. The formula is unsatisfiable exactly when some x and ¬x share a strongly connected component.',
    },
    {
      type: 'text',
      prompt:
        'Divide and conquer. Solve T(n) = 4T(n/2) + n with the master theorem. Give the answer in Big-O notation.',
      accept: ['O(n²)', 'O(n^2)', 'Θ(n²)', 'theta(n^2)', 'n²', 'n^2', 'O(n*n)'],
      hints: [
        'Here a = 4 and b = 2, so compare f(n) = n with n^(log₂ 4).',
        'Which is bigger: the work at the leaves or the work at the root?',
      ],
      solution:
        'n^(log₂ 4) = n², which grows faster than f(n) = n, so the leaves dominate and T(n) = O(n²). Karatsuba wins by cutting a from 4 to 3, which gives O(n^(log₂ 3)) ≈ O(n^1.585).',
    },
    {
      type: 'number',
      prompt:
        'Divide and conquer. How many inversions, pairs i < j with a[i] > a[j], does [3, 1, 4, 1, 5, 9, 2, 6] have?',
      answer: 8,
      unit: 'inversions',
      hints: [
        'For each item, count the smaller items to its right. Equal items do not count.',
        '3 counts 1, 1 and 2, which is 3 inversions.',
      ],
      solution:
        'Per item from the left: 3 → 3, 1 → 0, 4 → 2, 1 → 0, 5 → 1, 9 → 2, 2 → 0, 6 → 0, for a total of 8. Merge sort counts the same thing in O(n log n): when it takes from the right half, every item left in the left half forms an inversion.',
    },
    {
      type: 'choice',
      prompt:
        'Divide and conquer. You need just the median of 1,000,000 unsorted numbers, once, in expected linear time. Which method fits?',
      options: [
        'Merge sort, then read the middle',
        'A balanced search tree of all the numbers',
        'Quickselect: partition, then recurse into the one side holding the rank',
        'Binary search on the unsorted array',
      ],
      answer: 2,
      hints: [
        'Sorting does more work than the question needs.',
        'After a partition, the pivot’s final rank tells you which side matters.',
      ],
      solution:
        'Quickselect partitions around a random pivot and continues only on the side that holds the wanted rank, so the expected work is n + n/2 + n/4 + … = O(n). Median of medians picks a pivot that makes the O(n) bound hold in the worst case too.',
    },
    {
      type: 'multi',
      prompt: 'Greedy. Which of these greedy rules always give an optimal answer on their problem?',
      options: [
        'Interval scheduling: take the activity that finishes earliest',
        'Interval scheduling: take the activity that starts earliest',
        'Fractional knapsack: take the best value per weight first',
        '0/1 knapsack: take the best value per weight first',
        'Huffman coding: merge the two least frequent symbols',
        'Fewest coins from {1, 3, 4}: take the largest coin that fits',
      ],
      answers: [0, 2, 4],
      hints: [
        'An exchange argument works when swapping in the greedy choice can never hurt.',
        'Coins {1, 3, 4} for amount 6: compare 4 + 1 + 1 with 3 + 3.',
      ],
      solution:
        'Earliest finish, fractional value per weight and Huffman merges all have exchange-argument proofs. Earliest start fails when one long activity blocks many short ones, 0/1 by ratio can leave capacity unused, and coins {1, 3, 4} make 6 with 3 + 3, not 4 + 1 + 1.',
    },
    {
      type: 'number',
      prompt:
        'Greedy. Activities (start, finish): (1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16). An activity may start just as another ends. At most how many can one room hold?',
      answer: 4,
      unit: 'activities',
      hints: [
        'Sort by finish time, then keep each activity that starts no earlier than the last finish.',
        'The first pick is (1, 4), and the next is (5, 7).',
      ],
      solution:
        'Earliest finish picks (1, 4), (5, 7), (8, 11), (12, 16), so 4 activities. The exchange argument shows any optimal schedule can swap its first activity for the earliest-finishing one, so greedy is never worse.',
    },
    {
      type: 'number',
      prompt:
        'Greedy. Six symbols have frequencies a 45, b 13, c 12, d 16, e 9, f 5. How many bits does a Huffman code use in total, summing frequency × code length?',
      answer: 224,
      unit: 'bits',
      hints: [
        'Merge the two smallest repeatedly. The first merge is 5 + 9 = 14.',
        'The total equals the sum of all merged weights.',
      ],
      solution:
        'The merges are 5 + 9 = 14, 12 + 13 = 25, 14 + 16 = 30, 25 + 30 = 55 and 45 + 55 = 100. Every merge adds one bit to each symbol under it, so the total is 14 + 25 + 30 + 55 + 100 = 224 bits, against 300 for a fixed 3-bit code.',
    },
    {
      type: 'number',
      prompt:
        'Dynamic programming. A 0/1 knapsack has capacity 50 and items (weight, value): (10, 60), (20, 100), (30, 120). What is the best total value?',
      answer: 220,
      hints: [
        'Value per weight first takes the first two items for 160, and the third no longer fits.',
        'Try all subsets whose weight is at most 50.',
      ],
      solution:
        'The best subset is (20, 100) and (30, 120), with weight 50 and value 220. Greedy by ratio stops at 160, which is why the 0/1 version needs DP over capacity in O(nW). If items could be cut, the fractional answer would be 240.',
    },
    {
      type: 'number',
      prompt:
        'Dynamic programming. What is the edit distance (insert, delete, replace, each costing 1) from “kitten” to “sitting”?',
      answer: 3,
      unit: 'edits',
      hints: [
        'Compare the words letter by letter: k/s and e/i differ.',
        '“sitting” is one letter longer.',
      ],
      solution:
        'kitten → sitten (replace k) → sittin (replace e) → sitting (insert g), so 3 edits. Fewer is impossible: the table over all pairs of prefixes finds 3 in O(nm) time.',
    },
    {
      type: 'number',
      prompt:
        'Dynamic programming. Matrices A (10 × 30), B (30 × 5) and C (5 × 60) are multiplied. What is the fewest scalar multiplications the product ABC can take?',
      answer: 4500,
      unit: 'multiplications',
      hints: [
        'There are two ways to place the brackets: (AB)C and A(BC).',
        'Multiplying p × q by q × r costs p · q · r.',
      ],
      solution:
        '(AB)C costs 10 · 30 · 5 + 10 · 5 · 60 = 1,500 + 3,000 = 4,500, and A(BC) costs 30 · 5 · 60 + 10 · 30 · 60 = 9,000 + 18,000 = 27,000. Interval DP tries every split point k over every range, filling the table by length.',
    },
    {
      type: 'order',
      prompt: 'Dynamic programming. Arrange the steps of the SRTBOT framework in order.',
      items: [
        'Base cases',
        'Original problem',
        'Relations between subproblems',
        'Subproblems',
        'Time analysis',
        'Topological order',
      ],
      answer: [3, 2, 5, 0, 1, 4],
      hints: [
        'The letters spell S, R, T, B, O, T.',
        'The first T says in which order to solve the subproblems; the last T says what it costs.',
      ],
      solution:
        'Subproblems, Relations, Topological order, Base cases, Original problem, Time. Each answer needs a defined state, then how it builds on smaller states, then an order that has those states ready.',
    },
    {
      type: 'number',
      prompt:
        'Backtracking. On a 6 × 6 board, in how many ways can 6 queens be placed so that no two attack each other? Count rotations and reflections as different.',
      answer: 4,
      unit: 'solutions',
      hints: [
        'Place one queen per row; a queen in column c on row r blocks that column and two diagonals.',
        'r + c and r − c identify the diagonals, so run it on paper or with a short program.',
      ],
      solution:
        'A search that places one queen per row and prunes any attacked square finds 4 solutions, far fewer than the 6⁶ raw column choices. One of them has queens in columns 2, 4, 6, 1, 3, 5, row by row.',
    },
    {
      type: 'choice',
      prompt:
        'Backtracking. In a maximisation branch and bound, the best complete solution found so far is worth 42. A node’s upper bound says nothing below it can exceed 40. What should the search do?',
      options: [
        'Explore the node, since a bound can be wrong',
        'Replace the best value with 40',
        'Lower the other nodes’ bounds to 40',
        'Prune the node without exploring it',
      ],
      answer: 3,
      hints: ['Can anything below this node beat 42?', 'A valid upper bound is never too low.'],
      solution:
        'Everything under the node is worth at most 40, which is below the 42 already in hand, so the branch cannot improve the answer and is pruned. Tight bounds and finding a good solution early are what make the method fast.',
    },
    {
      type: 'number',
      prompt:
        'Balanced trees. A single node has height 1. What is the fewest nodes an AVL tree of height 5 can have?',
      answer: 12,
      unit: 'nodes',
      hints: [
        'The sparsest tree has subtrees of heights h − 1 and h − 2.',
        'N(1) = 1, N(2) = 2 and N(h) = N(h − 1) + N(h − 2) + 1.',
      ],
      solution:
        'N(3) = 2 + 1 + 1 = 4, N(4) = 4 + 2 + 1 = 7, N(5) = 7 + 4 + 1 = 12. These counts grow like the Fibonacci numbers, which gives the height bound of about 1.44 log₂ n.',
    },
    {
      type: 'choice',
      prompt:
        'Balanced trees. Insert 30, 10, 20 into an empty AVL tree. Which repair restores balance?',
      options: [
        'One right rotation at 30',
        'One left rotation at 10',
        'A left rotation at 10, then a right rotation at 30',
        'A right rotation at 10, then a left rotation at 30',
      ],
      answer: 2,
      hints: [
        '30 is left-heavy, but its left child 10 is right-heavy.',
        'That is the left-right case, which a single rotation does not fix.',
      ],
      solution:
        'This is the left-right case. A left rotation at 10 straightens the path to 30, 20, 10, and a right rotation at 30 makes 20 the root with children 10 and 30. A single right rotation at 30 would only make the tree lean the other way.',
    },
    {
      type: 'multi',
      prompt: 'Balanced trees. Which statements about red-black trees are true?',
      options: [
        'A red node never has a red child',
        'Every root-to-null path has the same number of black nodes',
        'The two subtrees of a node differ in height by at most 1',
        'The longest root-to-null path is at most twice the shortest',
        'An insertion may need Θ(log n) rotations',
      ],
      answers: [0, 1, 3],
      hints: [
        'Combine the two colour rules: how long can a path be with a given number of black nodes?',
        'Recolouring can climb the tree, but rotations are few.',
      ],
      solution:
        'The colour rules forbid red-red and fix the black count, so a path can at most alternate red and black, which gives the factor of 2. Exact height balance is the AVL rule. An insert recolours up to O(log n) nodes but does at most two rotations.',
    },
    {
      type: 'number',
      prompt:
        'Balanced trees. A B-tree has order 100, so each node has at most 100 children and 99 keys. At most how many keys fit in a tree of 3 levels?',
      answer: 999999,
      unit: 'keys',
      hints: [
        'Three levels hold 1 + 100 + 10,000 nodes when full.',
        'Each full node holds 99 keys.',
      ],
      solution:
        'Full levels have 1, 100 and 10,000 nodes, or 10,101 nodes in total, each with 99 keys: 10,101 × 99 = 999,999 = 100³ − 1. A million keys are reachable in 3 node reads, which is why databases index on disk with B-trees.',
    },
    {
      type: 'number',
      prompt:
        'Balanced trees. An order-statistic tree stores subtree sizes. The root’s left subtree has size 5, and you want the 7th smallest key. It lies in the right subtree. Which rank do you look for there?',
      answer: 1,
      hints: [
        'The root itself is the 6th smallest.',
        'Subtract the left subtree and the root from the rank.',
      ],
      solution:
        'The 5 left keys and the root come first, so the new rank is 7 − 5 − 1 = 1: the smallest key in the right subtree. Each step goes down one level, so select costs O(log n) in a balanced tree.',
    },
    {
      type: 'choice',
      prompt:
        'Balanced trees. Why does a treap stay shallow even when the keys arrive in sorted order?',
      options: [
        'It rebuilds itself from scratch after every n insertions',
        'Each key’s random priority fixes the shape, as if the keys were inserted in random order',
        'It keeps the height difference of every node’s subtrees at most 1',
        'It sorts the keys into an array before building the tree',
      ],
      answer: 1,
      hints: [
        'A treap obeys the BST rule on keys and the heap rule on priorities.',
        'The priorities have nothing to do with the arrival order.',
      ],
      solution:
        'Keys and priorities together fix exactly one tree: the one a plain BST would build if keys arrived in priority order. Since priorities are random, the shape matches a random BST whatever the arrival order, so the expected height is O(log n).',
    },
    {
      type: 'text',
      prompt:
        'Paradigms. A problem’s subproblems overlap, and the best answer for each state is built from the best answers of smaller states, each solved once and stored in a table. Name the paradigm.',
      accept: ['dynamic programming', 'DP'],
      hints: [
        'Overlap rules out plain divide and conquer, whose parts are independent.',
        'Its two styles are memoization and tabulation.',
      ],
      solution:
        'That is dynamic programming: optimal substructure plus overlapping subproblems. Memoization works top-down and tabulation bottom-up, and both solve each state once.',
    },
    {
      type: 'choice',
      prompt:
        'Paradigms. Decide whether a string of length n can be split into dictionary words, where the answer for a prefix depends on shorter prefixes. Which paradigm fits?',
      options: [
        'Greedy: always take the longest matching word',
        'Divide and conquer: always split the string in half',
        'Dynamic programming over prefixes',
        'A minimum spanning tree over the letters',
      ],
      answer: 2,
      hints: [
        'Try “aaaa” with the words “aaa” and “aa”: longest first takes “aaa” and is stuck on the last “a”.',
        'Many split choices lead to the same prefix, so subproblems overlap.',
      ],
      solution:
        'Let can[i] say whether the first i letters split into words; can[i] is true when some j has can[j] true and the piece from j to i is a word. Longest-first can fail: “aaaa” with “aaa” and “aa” needs “aa” + “aa”. A split in half may cut through a word.',
    },
    {
      type: 'choice',
      prompt:
        'Paradigms. List every way to assign 10 tasks to 4 workers under conflict rules, abandoning a partial assignment as soon as it breaks a rule. Which paradigm fits?',
      options: [
        'Backtracking: choose, explore, unchoose',
        'Greedy by task size',
        'Kruskal over the conflicts',
        'Divide and conquer with a master theorem bound',
      ],
      answer: 0,
      hints: [
        'The output is every valid arrangement, not one best value.',
        'Abandoning a partial assignment is pruning the search tree.',
      ],
      solution:
        'Listing all arrangements with early abandonment is backtracking: extend a partial assignment, recurse, then undo the choice. A pruned branch skips every arrangement that shares its broken prefix. The cost is output-sensitive and exponential at worst.',
    },
    {
      type: 'choice',
      prompt:
        'Paradigms. Each job takes one time slot, pays a profit and must finish by its deadline. You want the most total profit, and you can show that keeping the most profitable job that still fits never hurts. Which paradigm fits?',
      options: [
        'Backtracking over every order of the jobs',
        'Divide and conquer: solve each half of the timeline on its own',
        'Dynamic programming over every set of jobs',
        'Greedy: by falling profit, each job in the latest free slot by its deadline',
      ],
      answer: 3,
      hints: [
        'The prompt already gives you a proof that one choice is safe.',
        'A safe choice never needs to be taken back, so no search or table is needed.',
      ],
      solution:
        'A choice proved safe by an exchange argument is the mark of greedy: one sort and one pass give the best schedule. Backtracking and DP over job sets would also find it, but in exponential time, and splitting the timeline ignores that a job may use any slot up to its deadline.',
    },
    {
      type: 'choice',
      prompt:
        'Paradigms. In an array of 100,000 numbers, count the pairs i < j with a[i] > 2 · a[j] in O(n log n). Which approach fits?',
      options: [
        'Prim’s algorithm over the indices',
        'Divide and conquer: count across the two halves during a merge sort',
        'Try every pair with two nested loops',
        'Backtracking over all subsets',
      ],
      answer: 1,
      hints: [
        'This looks much like counting inversions.',
        'Once both halves are sorted, two moving pointers count the cross pairs in linear time.',
      ],
      solution:
        'Each pair is inside the left half, inside the right half, or across the split. Recursion handles the first two; with both halves sorted, a pointer counts the cross pairs in O(n) per level, so T(n) = 2T(n/2) + O(n) = O(n log n). Nested loops try about 5 × 10⁹ pairs.',
    },
  ],
};
