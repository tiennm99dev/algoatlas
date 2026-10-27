export const en = {
  slug: 'review-foundations-lesson',
  topic: 'review-foundations',
  level: 'Intermediate',
  title: 'Review: foundations',
  intro:
    'This quiz mixes questions from every chapter of the foundations: complexity, arrays and strings, sorting, searching, linked lists, stacks and queues, hashing, recursion, trees, heaps and graphs. Most questions describe a job and ask which structure or algorithm fits it, because choosing well matters as much as knowing how each one works.',
  summary:
    'A mixed quiz over the whole foundations level: costs of core operations, choosing a structure for a job, and a recap of sorting and searching.',
  instruction:
    'Answer each question and press Check. A wrong answer tells you so straight away; open the hints one at a time, and after your first try you can read the full solution. Solved questions keep their tick in this browser.',
  practiceTitle: 'Foundations quiz',
  takeaways: [
    'Count the work, not the seconds: nested loops multiply, halving gives log n, and a recurrence such as T(n) = 2T(n/2) + n solves to n log n.',
    'The job picks the structure: a stack for last in, first out, a queue for arrival order, a hash table for “have I seen this?”, a heap for “what is most urgent now?”, a balanced search tree for sorted order with fast updates.',
    'Sorting and searching go together: sort once in O(n log n), then answer each lookup with binary search in O(log n). Stability, extra memory and the key range decide which sort to use.',
    'Graphs are traversed in O(V + E): BFS gives fewest-edge paths, DFS gives finish order for topological sort and finds cycles.',
    'Try it: answer a question wrong on purpose, read the first hint, and see whether it is enough to get the answer without the solution.',
  ],
  complexityHead: ['Structure or algorithm', 'Cost', 'Why'],
  complexity: [
    [
      'Array index; stack and queue operations',
      'O(1)',
      'An index is one address calculation, and a stack or queue only works at its ends.',
    ],
    [
      'Dynamic array append',
      'O(1) amortized',
      'Doubling the capacity makes all copies add up to fewer than 2n over n appends.',
    ],
    [
      'Linked list search',
      'O(n)',
      'Finding a value means walking the nodes one by one; relinking after a known node is O(1).',
    ],
    [
      'Hash table insert, lookup, delete',
      'O(1) expected',
      'A good hash at a bounded load factor keeps buckets short; if every key collides, one bucket holds them all and it is O(n).',
    ],
    [
      'Binary search on a sorted array',
      'O(log n)',
      'Each probe halves the range that can still hold the answer.',
    ],
    [
      'Merge sort, heapsort',
      'O(n log n)',
      'Comparison sorts need Ω(n log n) comparisons in the worst case, and these two reach it.',
    ],
    [
      'Counting sort, keys in a range of size k',
      'O(n + k)',
      'It tallies keys instead of comparing them, so the n log n bound does not apply.',
    ],
    [
      'Binary search tree search, insert',
      'O(h)',
      'Each step goes one level down: h is about log₂ n when balanced, but sorted insertions build a path with h = n − 1.',
    ],
    [
      'Binary heap push, pop',
      'O(log n)',
      'Sifting moves along one root-to-leaf path of a complete tree; building bottom-up is O(n).',
    ],
    [
      'BFS, DFS, topological sort',
      'O(V + E)',
      'Every vertex is visited once and every adjacency-list edge is scanned once (twice when undirected).',
    ],
  ],
  nextTeaser:
    'Next up: Weighted graphs and shortest-path properties, the start of the core algorithms level.',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Complexity. The loop “for i from 1 to n: for j from 1 to i: count++” runs with n = 10. How many times does count++ run?',
      answer: 55,
      unit: 'times',
      hints: [
        'The inner loop runs i times on round i, so add 1 + 2 + … + 10.',
        'The sum 1 + 2 + … + n is n(n + 1)/2.',
      ],
      solution:
        'Round i runs the body i times, so the total is 1 + 2 + … + 10 = 10 · 11 / 2 = 55. In general n(n + 1)/2, which is Θ(n²).',
    },
    {
      type: 'text',
      prompt:
        'Complexity. Merge sort splits the input in half, sorts both halves and merges them in linear time: T(n) = 2T(n/2) + n. What is T(n) in Big-O notation?',
      accept: [
        'O(n log n)',
        'O(nlogn)',
        'O(n log2 n)',
        'O(n log₂ n)',
        'Θ(n log n)',
        'theta(n log n)',
        'n log n',
        'nlogn',
        'O(n * log n)',
        'O(n·log n)',
      ],
      hints: [
        'Draw the recursion tree: how much work does each level do, and how many levels are there?',
        'Every level merges n items in total, and halving reaches size 1 after log₂ n levels.',
      ],
      solution:
        'Each level of the recursion tree does n work in total (2 merges of n/2, 4 of n/4, …), and there are log₂ n levels, so T(n) = O(n log n).',
    },
    {
      type: 'number',
      prompt:
        'Arrays. A dynamic array starts with capacity 1 and doubles its capacity whenever it is full. How many element copies happen in total while you append 17 items?',
      answer: 31,
      unit: 'copies',
      hints: [
        'A resize happens when you append to a full array: at sizes 1, 2, 4, 8 and 16.',
        'Each resize copies every element already stored.',
      ],
      solution:
        'The array is full before the 2nd, 3rd, 5th, 9th and 17th appends, so it copies 1 + 2 + 4 + 8 + 16 = 31 elements. That is fewer than 2 × 17, which is why append is amortized O(1).',
    },
    {
      type: 'number',
      prompt:
        'Arrays. For a = [3, 1, 4, 1, 5, 9, 2, 6] (indices from 0), the prefix sums are P[0] = 0 and P[i + 1] = P[i] + a[i]. What is P[6] − P[2], the sum of a[2..5]?',
      answer: 19,
      hints: [
        'P[6] − P[2] adds the items at indices 2, 3, 4 and 5.',
        'Those items are 4, 1, 5 and 9.',
      ],
      solution:
        'P = [0, 3, 4, 8, 9, 14, 23, 25, 31], so P[6] − P[2] = 23 − 4 = 19, which is 4 + 1 + 5 + 9. After O(n) preparation, every range sum costs one subtraction.',
    },
    {
      type: 'choice',
      prompt:
        'Choosing a technique. Find the length of the longest stretch of a string that has no repeated character, in O(n) time. Which technique fits?',
      options: [
        'Sliding window: grow the right end, shrink the left end past a repeat',
        'Prefix sums over the character codes',
        'Binary search on the answer with a fresh scan per guess, with no extra structure',
        'Sort the characters, then scan once',
      ],
      answer: 0,
      hints: [
        'The answer is a contiguous stretch, and a valid stretch stays valid when it shrinks.',
        'Each end of the stretch only ever moves forward.',
      ],
      solution:
        'A sliding window keeps the current repeat-free stretch. The right end adds a character; while it repeats, the left end moves past the earlier copy. Each end moves at most n times, so the scan is O(n). Sorting destroys the positions the question is about.',
    },
    {
      type: 'multi',
      prompt:
        'Sorting. Which of these sorts are stable in their usual textbook form, keeping equal keys in their input order?',
      options: [
        'Bubble sort',
        'Insertion sort',
        'Selection sort (swap the minimum to the front)',
        'Merge sort (take from the left half on ties)',
        'Quicksort (Lomuto partition)',
        'Heapsort',
      ],
      answers: [0, 1, 3],
      hints: [
        'A sort is stable when it only ever swaps or moves neighbours past strictly larger keys.',
        'Long-distance swaps can jump one copy of a key over another copy.',
      ],
      solution:
        'Bubble and insertion sort only move an item past strictly larger neighbours, and merge sort keeps ties in order by taking from the left half first. Selection sort, Lomuto quicksort and heapsort make long-distance swaps that can reorder equal keys, for example selection sort on [2a, 2b, 1].',
    },
    {
      type: 'choice',
      prompt:
        'Sorting. You must sort 1,000,000 exam scores, each a whole number from 0 to 100. Which sort is the best fit?',
      options: [
        'Counting sort, O(n + k) with k = 101',
        'Insertion sort, because scores are small numbers',
        'Merge sort, because nothing beats O(n log n)',
        'Selection sort, because it makes few writes',
      ],
      answer: 0,
      hints: [
        'The keys come from a tiny range compared with n.',
        'The Ω(n log n) lower bound only holds for sorts that compare keys.',
      ],
      solution:
        'With only 101 possible keys, counting sort tallies each score and writes them back in O(n + k) time, about 1,000,101 steps. The n log n bound applies to comparison sorts, and counting sort does not compare. Insertion and selection sort are Θ(n²) here.',
    },
    {
      type: 'number',
      prompt:
        'Sorting. Any comparison sort is a decision tree with at least n! leaves. What is the smallest worst-case number of comparisons that can sort every input of 4 distinct items?',
      answer: 5,
      unit: 'comparisons',
      hints: [
        'A binary tree of height h has at most 2^h leaves, and 4 items have 4! = 24 orders.',
        'Find the smallest h with 2^h ≥ 24.',
      ],
      solution:
        'There are 4! = 24 possible orders, and 2⁴ = 16 < 24 ≤ 32 = 2⁵, so at least ⌈log₂ 24⌉ = 5 comparisons are needed in the worst case. Merge insertion reaches exactly 5, so 5 is the answer.',
    },
    {
      type: 'number',
      prompt:
        'Searching. Binary search runs on a sorted array of 1,000 items. In the worst case, how many middle items does it probe in total, counting the last one, until it finds the target or reports it missing?',
      answer: 10,
      unit: 'probes',
      hints: [
        'Each probe that misses halves the range that is left.',
        'Find how many halvings bring 1,000 down to 0: 2¹⁰ = 1,024.',
      ],
      solution:
        'Binary search probes at most ⌊log₂ n⌋ + 1 items. Since 2⁹ = 512 ≤ 1,000 < 1,024 = 2¹⁰, that is 9 + 1 = 10 probes. A linear search could need 1,000.',
    },
    {
      type: 'number',
      prompt:
        'Searching. In the sorted array [1, 3, 3, 3, 5, 8] (indices from 0), upper_bound(3) returns the index of the first item greater than 3. Which index is that?',
      answer: 4,
      hints: [
        'The three 3s sit at indices 1, 2 and 3.',
        'upper_bound(3) − lower_bound(3) counts the copies of 3.',
      ],
      solution:
        'The first item greater than 3 is the 5 at index 4. lower_bound(3) is 1, so there are 4 − 1 = 3 copies of 3, found with two binary searches in O(log n).',
    },
    {
      type: 'choice',
      prompt:
        'Linked lists. You must tell whether a singly linked list loops back on itself, using O(1) extra memory. Which method works?',
      options: [
        'Fast and slow pointers: one moves two nodes per step, the other one; they meet only on a cycle',
        'Store every visited node in a hash set',
        'Reverse the list and compare it with the original',
        'Count the nodes and compare the count with the list’s length field',
      ],
      answer: 0,
      hints: [
        'A hash set works but uses O(n) memory.',
        'On a loop, a faster runner catches a slower one.',
      ],
      solution:
        'Floyd’s tortoise and hare uses two pointers. On a list without a cycle the fast one reaches null; on a cycle it gains one node per step on the slow one and meets it within one lap. That is O(n) time and O(1) memory.',
    },
    {
      type: 'text',
      prompt:
        'Stacks. Run push 1, push 2, pop, push 3, push 4, pop, pop on an empty stack. Which values come out, in order? Separate them with commas.',
      accept: ['2, 4, 3', '2 4 3', '2;4;3', '[2, 4, 3]'],
      hints: [
        'A pop always takes the most recently pushed value that is still there.',
        'After push 3, push 4 the stack is 1, 3, 4 from bottom to top.',
      ],
      solution:
        'The first pop takes 2 (stack 1). Then 3 and 4 go on (stack 1, 3, 4), and the next two pops take 4 and then 3. So the output is 2, 4, 3 and 1 stays on the stack: last in, first out.',
    },
    {
      type: 'choice',
      prompt:
        'Choosing a structure. For each day’s temperature you want the next day with a warmer temperature, for all n days in O(n) total. Which structure fits?',
      options: [
        'A queue that holds every day in arrival order',
        'A monotonic stack of days still waiting for a warmer day',
        'A hash map from temperature to day',
        'A min-heap of all temperatures',
      ],
      answer: 1,
      hints: [
        'A new warm day answers every waiting day that is colder than it.',
        'Keep the waiting days so their temperatures decrease from bottom to top.',
      ],
      solution:
        'A monotonic stack keeps the days still waiting, coldest on top. Each new day pops and answers every colder day, then is pushed itself. Every day is pushed once and popped at most once, so the total is O(n).',
    },
    {
      type: 'number',
      prompt:
        'Hashing. A table has 7 slots, h(k) = k mod 7, and collisions use linear probing (try the next slot). Insert 10, 17 and 24 into the empty table. In which slot does 24 end up?',
      answer: 5,
      hints: [
        'All three keys hash to the same slot: 10, 17 and 24 each leave remainder 3.',
        'Slot 3 goes to 10 and slot 4 to 17.',
      ],
      solution:
        '10 goes to slot 3. 17 also hashes to 3, finds it full and takes slot 4. 24 hashes to 3, then probes 4 and finally takes slot 5. Clustered keys make probe sequences grow, which is why the load factor is kept low.',
    },
    {
      type: 'choice',
      prompt:
        'Choosing a structure. Given n numbers and a target, decide whether two of them add up to the target in O(n) expected time. Which structure fits?',
      options: [
        'A hash set of the numbers seen so far: for each x, look up target − x',
        'A stack of the numbers',
        'A sorted linked list',
        'A max-heap of the numbers',
      ],
      answer: 0,
      hints: [
        'The question for each number is “have I already seen its partner?”.',
        'Which structure answers membership questions in O(1) expected time?',
      ],
      solution:
        'Scan once; for each x, check whether target − x is in a hash set, then add x. Each lookup and insert is O(1) expected, so the scan is O(n). Sorting first and using two pointers also works, but costs O(n log n).',
    },
    {
      type: 'number',
      prompt:
        'Recursion. The naive fib(n) returns n when n ≤ 1 and fib(n − 1) + fib(n − 2) otherwise. How many calls in total, the first one included, does fib(5) make?',
      answer: 15,
      unit: 'calls',
      hints: [
        'Let C(n) be the number of calls: C(0) = C(1) = 1 and C(n) = 1 + C(n − 1) + C(n − 2).',
        'C(2) = 3, C(3) = 5, C(4) = 9.',
      ],
      solution:
        'C(2) = 1 + 1 + 1 = 3, C(3) = 1 + 3 + 1 = 5, C(4) = 1 + 5 + 3 = 9, C(5) = 1 + 9 + 5 = 15. The count grows like the Fibonacci numbers themselves, exponentially, because the same subproblems are solved again and again.',
    },
    {
      type: 'order',
      prompt:
        'Trees. Insert 50, 30, 70, 20, 40, 60, 80 into an empty binary search tree. Arrange the keys in preorder (node, then left subtree, then right subtree).',
      items: ['20', '30', '40', '50', '60', '70', '80'],
      answer: [3, 1, 0, 2, 5, 4, 6],
      hints: [
        '50 is the root, with 30 as its left child and 70 as its right child.',
        'Preorder visits the root first, then the whole left subtree, then the whole right subtree.',
      ],
      solution:
        'The tree has root 50, left child 30 (children 20 and 40) and right child 70 (children 60 and 80). Preorder gives 50, 30, 20, 40, 70, 60, 80. The keys listed in sorted order are the inorder traversal.',
    },
    {
      type: 'number',
      prompt:
        'Heaps. A binary heap is stored in an array with indices from 0, so the children of i are 2i + 1 and 2i + 2. What is the index of the parent of index 9?',
      answer: 4,
      hints: ['The parent of i is ⌊(i − 1) / 2⌋.', 'Check: the children of index 4 are 9 and 10.'],
      solution:
        'The parent is ⌊(9 − 1) / 2⌋ = 4, and indeed 2 · 4 + 1 = 9. Because a heap is a complete tree, these formulas replace pointers.',
    },
    {
      type: 'choice',
      prompt:
        'Choosing a structure. Numbers stream in one at a time, and at any moment you must report the 10 largest seen so far, keeping only 10 numbers in memory. Which structure fits?',
      options: [
        'A min-heap that holds at most 10 numbers',
        'A max-heap that holds every number',
        'A queue of the last 10 numbers',
        'A sorted array of every number',
      ],
      answer: 0,
      hints: [
        'You need to know quickly which of the current top 10 is the weakest.',
        'When a new number beats that weakest one, the weakest leaves.',
      ],
      solution:
        'Keep a min-heap of size 10. Its root is the smallest of the current top 10; a new number larger than the root replaces it in O(log 10). Keeping every number would need O(n) memory, and the last 10 numbers are not the largest 10.',
    },
    {
      type: 'choice',
      prompt:
        'Graphs. In a grid maze where every move between neighbouring open cells costs the same, you want the fewest moves from start to goal. Which algorithm fits?',
      options: [
        'Breadth-first search with a queue',
        'Depth-first search with a stack',
        'Topological sort',
        'Binary search over the cells',
      ],
      answer: 0,
      hints: [
        'Which traversal explores cells in order of their distance from the start?',
        'DFS finds a path, but not necessarily a short one.',
      ],
      solution:
        'BFS visits cells layer by layer: every cell 1 move away, then every cell 2 moves away, and so on. The first time it reaches the goal is along a fewest-moves path, in O(rows × cols) time. DFS can wander down a long path first.',
    },
    {
      type: 'multi',
      prompt: 'Graphs. Which of these undirected graphs are bipartite (2-colourable)?',
      options: [
        'A cycle of 4 vertices',
        'A triangle (cycle of 3 vertices)',
        'Any tree',
        'A cycle of 5 vertices',
        'A rectangular grid graph',
      ],
      answers: [0, 2, 4],
      hints: [
        'A graph is bipartite exactly when it has no cycle of odd length.',
        'Colour a grid cell by whether row + column is even.',
      ],
      solution:
        'A graph is bipartite exactly when it has no odd cycle. The 4-cycle, any tree (no cycles at all) and grids (colour by the parity of row + column) are bipartite; the triangle and the 5-cycle are odd cycles.',
    },
    {
      type: 'order',
      prompt:
        'Graphs. Course prerequisites: Intro → Discrete maths, Intro → Data structures, Discrete maths → Data structures, Data structures → Algorithms, Discrete maths → Algorithms, Algorithms → Compilers. Arrange the courses in the only valid topological order.',
      items: ['Algorithms', 'Compilers', 'Data structures', 'Discrete maths', 'Intro'],
      answer: [4, 3, 2, 0, 1],
      hints: [
        'Start with the course that has no prerequisites.',
        'With Kahn’s algorithm, exactly one course has no remaining prerequisites at each step.',
      ],
      solution:
        'Kahn’s algorithm takes Intro (no prerequisites), then Discrete maths, then Data structures (its prerequisites are now done), then Algorithms, then Compilers. Only one course is ready at each step, so this order is the only one: Intro, Discrete maths, Data structures, Algorithms, Compilers.',
    },
  ],
};
