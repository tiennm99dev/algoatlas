/** @typedef {import('$lib/algo-engine/distributed-algorithms.js').FloodFrame} FloodFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** 'A', 'A and B', 'A, B and C'. @param {string[]} items */
const list = (items) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

export const en = {
  slug: 'distributed-algorithms',
  topic: 'computation-models',
  level: 'Intermediate',
  title: 'Distributed algorithms',
  intro:
    'In a distributed system every node is a separate machine that sees only its own state and the messages from its neighbours. In the synchronous model the nodes move in lockstep rounds: send, receive, update. Electing one leader is the classic first task, and FloodMax solves it in D rounds while building a breadth-first search tree on the way.',
  summary:
    'Watch FloodMax elect a leader round by round on a network you draw, count its messages, and see why identical nodes cannot break symmetry.',
  instruction:
    'Step through the rounds: highlighted links carry this round’s messages and the note under each node shows its ID and the largest ID it has seen. Draw your own network with the tools, shuffle the IDs, make them all equal, or switch to sending only on change and compare Messages.',
  presetLabel: 'Network',
  presets: { ring: 'Ring', path: 'Path', tree: 'Tree', mesh: 'Mesh' },
  variantLabel: 'Send',
  variants: { change: 'Only on change', every: 'Every round' },
  idsLabel: 'IDs',
  idModes: { unique: 'Unique', equal: 'All equal' },
  shuffle: 'Shuffle IDs',
  graphAria: 'Network of nodes. Draw it with the tools.',
  /** @param {number} uid @param {number} max */
  note: (uid, max) => (uid === max ? `id ${uid}` : `id ${uid}, max ${max}`),
  /** @param {string} name @param {number} uid @param {number} max @param {string} state */
  nodeLabel: (name, uid, max, state) =>
    `Node ${name}, ID ${uid}, largest ID seen ${max}${state ? `, ${state}` : ''}`,
  states: {
    leader: 'leader',
    sending: 'sending this round',
    updated: 'learned a larger ID this round',
    knows: 'knows the final maximum',
  },
  markers: { leader: '★', updated: '↑' },
  legend: {
    sending: 'Sending this round',
    updated: '↑ Learned a larger ID',
    knows: 'Knows the final maximum',
    leader: '★ Leader',
    message: 'A link carrying messages',
    tree: 'A BFS tree link (to the parent)',
  },
  messagesTitle: 'Messages this round',
  messagesEmpty: 'No messages.',
  hotMessage: 'kept as the new maximum',
  /** @param {string} from @param {string} to @param {number} value */
  message: (from, to, value) => `${from} → ${to}: ${value}`,
  stats: {
    round: 'Round / D',
    thisRound: 'Messages this round',
    sent: 'Messages in all',
    leaders: 'Leaders',
  },
  /** @param {number} r @param {number} d */
  round: (r, d) => `${r} / ${d}`,
  /**
   * @param {FloodFrame} f @param {string[]} names @param {number[]} uids
   * @param {'every'|'change'} variant
   */
  describe(f, names, uids, variant) {
    const leaders = f.leaders.map((i) => names[i]);
    switch (f.kind) {
      case 'start':
        if (names.length === 0) return 'The network is empty: add a node with the tools.';
        return f.rounds === 0
          ? 'No two nodes are linked, so there are no rounds: every node only knows itself.'
          : `Each node knows only its own ID and its neighbours. The diameter is D = ${f.rounds}, so every node runs ${plural(f.rounds, 'round', 'rounds')}.`;
      case 'send':
        if (variant === 'every' || f.round === 1)
          return `Round ${f.round}: ${plural(f.senders.length, 'node sends its', 'nodes send their')} largest ID to every neighbour: ${plural(f.messages.length, 'message', 'messages')}.`;
        return f.senders.length === 0
          ? `Round ${f.round}: no maximum changed last round, so every node stays quiet.`
          : `Round ${f.round}: only the ${plural(f.senders.length, 'node', 'nodes')} whose maximum changed last round ${f.senders.length === 1 ? 'sends' : 'send'}: ${plural(f.messages.length, 'message', 'messages')}.`;
      case 'receive':
        if (f.updated.length === 0) return `Round ${f.round}: no node hears a larger ID.`;
        return `Round ${f.round}: ${list(f.updated.map((v) => `${names[v]} learns ${f.max[v]} from ${names[f.parent[v]]}`))}.`;
      case 'decide':
        if (leaders.length === 0) return 'No nodes, no leader.';
        if (leaders.length === 1)
          return `After ${plural(f.rounds, 'round', 'rounds')}, ${leaders[0]} has heard no ID larger than its own ${uids[f.leaders[0]]}, so it declares itself leader. Every other node has seen a larger ID and knows it is not.`;
        if (new Set(uids).size === 1)
          return `All ${names.length} nodes have seen only the ID ${uids[0]}, so every one declares itself leader. Identical nodes running identical code stay identical: without distinct IDs (or randomness) symmetry cannot be broken.`;
        return `${list(leaders)} each declare themselves leader: the network is in ${plural(leaders.length, 'piece', 'pieces')}, and an ID cannot cross from one piece to another.`;
      case 'done':
        if (leaders.length !== 1)
          return `Done after ${plural(f.sent, 'message', 'messages')}: ${plural(leaders.length, 'leader', 'leaders')}, so the election failed.`;
        return `Done: ${leaders[0]} leads after ${plural(f.sent, 'message', 'messages')} in ${plural(f.rounds, 'round', 'rounds')}. The thick parent links form a BFS tree rooted at ${leaders[0]}: each node’s depth is the round in which it learned ${f.max[f.leaders[0]]}.`;
    }
  },
  takeaways: [
    'In the synchronous model all nodes move in rounds: send to neighbours, receive, update. Time is counted in rounds and cost in messages.',
    'FloodMax: every node forwards the largest ID it has seen; after D rounds (D the diameter) it has reached everyone, and the node whose own ID is the largest is the leader.',
    'The largest ID reaches a node at distance d in round d, so remembering who sent it first builds a breadth-first search tree rooted at the leader, with no extra messages.',
    'Leader election needs a way to break symmetry. Nodes with equal IDs running the same code stay in the same state forever; distinct IDs or random choices are what tell them apart.',
    'Try it: on the Path, compare Messages with Every round and with Only on change. Then pick All equal and watch every node claim the lead.',
  ],
  complexityHead: ['Measure', 'Cost', 'Why'],
  complexity: [
    [
      'Rounds',
      'D, the diameter',
      'An ID moves one hop per round, and the farthest node is D hops away.',
    ],
    [
      'Messages, every round',
      '2|E| · D',
      'Each round every node sends to each neighbour: two messages per link.',
    ],
    [
      'Messages, only on change',
      'At most 2|E| · D, often far fewer',
      'A node sends only after its maximum grew, and it can grow at most D times.',
    ],
    [
      'Memory per node',
      'O(log n) bits',
      'The largest ID so far, the parent link and a round counter.',
    ],
    [
      'BFS tree',
      'Free with the election',
      'The first sender of the final maximum is one hop closer to the leader.',
    ],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt:
        'Load the Path with Send set to Only on change. How many messages does the election take in all?',
      answer: 19,
      unit: 'messages',
      hints: ['Press Last step and read Messages in all.'],
      solution:
        'Round by round 10, 5, 3, 1 and 0 messages: only nodes whose maximum just grew send again. With Every round it would be 5 rounds × 10 = 50.',
    },
    {
      type: 'number',
      prompt:
        'On the Tree, how deep is the deepest node in the BFS tree, that is, in which round does the last node learn the leader’s ID?',
      answer: 4,
      unit: 'rounds',
      hints: [
        'Step until no node shows ↑ any more, or read D: the last round is the deepest level.',
      ],
      solution:
        'The leader has ID 9; the two nodes at the bottom of the far branch are 4 hops away, so they learn 9 in round 4, which is also D.',
    },
    {
      type: 'choice',
      prompt: 'On the Ring, choose All equal for the IDs. What happens?',
      options: [
        'The node with the most neighbours wins',
        'Every node declares itself leader',
        'No node declares itself leader',
        'The first node in the drawing wins',
      ],
      answer: 1,
      hints: ['Every node starts in the same state and receives the same messages.'],
      solution:
        'All nodes stay identical round after round: each sees only its own ID, so each declares itself leader. Breaking symmetry needs distinct IDs or randomness.',
    },
  ],
  nextTeaser:
    'Next up: cache-oblivious algorithms, where the cost that matters is how many blocks move between memory and the cache.',
};
