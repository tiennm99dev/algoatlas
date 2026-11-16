/** @typedef {import('$lib/algo-engine/sprague-grundy.js').GrundyFrame} GrundyFrame */

/** @param {number} n @param {string} one @param {string} many */
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** A set of whole numbers in braces. @param {number[]} values */
const braces = (values) => `{${values.length ? ` ${values.join(', ')} ` : ' '}}`;

/** Pile numbers start at 1 for people. @param {number} i */
const pileName = (i) => `pile ${i + 1}`;

/** @param {{ pile: number, take: number }} w @param {string} [verb] */
const moveText = (w, verb = 'take') =>
  `${verb} ${plural(w.take, 'stone', 'stones')} from ${pileName(w.pile)}`;

export const en = {
  slug: 'sprague-grundy',
  topic: 'algebraic-randomised',
  level: 'Advanced',
  title: 'Game theory: Nim and Sprague-Grundy',
  intro:
    'In Nim two players take turns removing any number of stones from one pile, and whoever cannot move loses. A position is losing for the player to move exactly when the XOR of the pile sizes is 0, so you can win by always moving to an XOR of 0. The Sprague–Grundy theorem extends this to every impartial game: give each pile its Grundy number, the smallest value not reachable in one move, and XOR those instead.',
  summary:
    'Work out Grundy numbers with mex, XOR them across the piles, and play Nim or a subtraction game against a computer that always finds the winning move.',
  instruction:
    'Type the piles and pick the rule, then step through the Grundy numbers g(0), g(1), … and the XOR of the piles. Below, play the game against the computer: click a stone to take it and every stone to its right, or choose a pile and a count. Watch the XOR row: a move that makes it 0 wins.',
  fields: { piles: 'Piles', rule: 'Rule', moves: 'Allowed takes S' },
  rules: { nim: 'Nim: take any number', subtraction: 'Take a number in S' },
  presetLabel: 'Example',
  presets: {
    classic: 'Nim 3, 4, 5',
    balanced: 'Nim 1, 2, 3 (losing)',
    subtraction: 'Take 1, 3 or 4',
    big: 'Nim, five piles',
  },
  /** @param {number} minP @param {number} maxP @param {number} max */
  pilesError: (minP, maxP, max) =>
    `Type ${minP} to ${maxP} pile sizes from 0 to ${max}, separated by commas or spaces.`,
  /** @param {number} maxM @param {number} max */
  movesError: (maxM, max) =>
    `Type 1 to ${maxM} different allowed takes from 1 to ${max}, separated by commas or spaces.`,
  tableTitle: 'Grundy numbers g(x)',
  /** @param {(number | null)[]} g */
  tableAria: (g) => `Grundy numbers: ${g.map((v, x) => `g(${x}) = ${v ?? 'unknown'}`).join(', ')}`,
  unknown: '?',
  pointerX: 'x',
  pointerFrom: 'x − s',
  /** @param {number[]} seen */
  seenText: (seen) => `seen = ${braces(seen)}`,
  markers: { active: '●', compare: '←', done: '' },
  legend: {
    active: '● x, the size being worked out',
    compare: '← g(x − s), reached by taking s',
    done: 'Worked out',
  },
  stats: {
    lookups: 'Values read, g(x − s)',
    positions: 'Sizes worked out',
    xor: 'X = XOR of g(h)',
    verdict: 'Player to move',
  },
  verdicts: { win: 'wins', lose: 'loses', open: '—' },
  /** @param {GrundyFrame} f */
  describe(f) {
    switch (f.kind) {
      case 'start':
        return `${plural(f.piles.length, 'pile', 'piles')}: ${f.piles.join(', ')}. ${f.rule === 'nim' ? 'A move takes any number of stones from one pile.' : `A move takes ${f.moves.join(', ')} stones from one pile.`} First work out g(x) for x = 0 to ${Math.max(...f.piles)}.`;
      case 'position':
        return f.x === 0
          ? 'A pile of 0 stones has no moves, so seen stays empty.'
          : `Work out g(${f.x}): collect the Grundy numbers of every pile reachable in one move.`;
      case 'look':
        return `Taking ${f.take} leaves ${f.x - f.take} stones, with g(${f.x - f.take}) = ${f.g[f.x - f.take]}. seen = ${braces(f.seen)}.`;
      case 'mex':
        return `The smallest whole number not in ${braces(f.seen)} is ${f.g[f.x]}, so g(${f.x}) = ${f.g[f.x]}.${f.g[f.x] === 0 ? ' Every move from here reaches a nonzero value: a losing pile on its own.' : ''}`;
      case 'pile': {
        const h = f.piles[f.pile];
        return `${pileName(f.pile)} has ${h} stones, g(${h}) = ${f.g[h]}. X = X xor ${f.g[h]} = ${f.xor}.`;
      }
      case 'done':
        return f.xor !== 0
          ? `X = ${f.xor} ≠ 0, so the player to move wins. Winning ${f.wins.length === 1 ? 'move' : 'moves'}: ${f.wins.map((w) => moveText(w)).join('; ')}.`
          : 'X = 0, so the player to move loses: every move makes X nonzero, and the other player can always make it 0 again.';
    }
  },

  gameTitle: 'Play against the computer',
  /** @param {number} i @param {number} h @param {number} g */
  pileLabel: (i, h, g) => `Pile ${i + 1}: ${plural(h, 'stone', 'stones')}, g = ${g}`,
  /** @param {number} i @param {number} take */
  stoneAria: (i, take) => `Take ${plural(take, 'stone', 'stones')} from pile ${i + 1}`,
  bitsHead: ['Pile', 'h', 'g(h)', 'g(h) in binary'],
  xorRow: 'XOR',
  /** @param {number} x */
  xorAria: (x) => `XOR of the Grundy numbers: ${x}`,
  pileField: 'Pile',
  /** @param {number} i */
  pileOption: (i) => `Pile ${i + 1}`,
  takeField: 'Take',
  takeButton: 'Take',
  hintButton: 'Show the winning move',
  restart: 'Restart game',
  /** @param {number} x */
  yourTurn: (x) =>
    x !== 0
      ? `Your move. X = ${x} ≠ 0, so you can win: find a move that makes X = 0.`
      : 'Your move. X = 0, so every move leaves X ≠ 0, and the computer always finds the winning reply.',
  noMoves:
    'No pile has a legal move, so you, the player to move, lose. Change the piles or restart.',
  /** @param {{ pile: number, take: number }[]} wins */
  hint: (wins) =>
    wins.length
      ? `Winning ${wins.length === 1 ? 'move' : 'moves'}: ${wins.map((w) => moveText(w)).join('; ')}.`
      : 'No move wins from here: X is already 0, so whatever you take, the computer can make it 0 again.',
  /** @param {{ pile: number, take: number }} you @param {{ pile: number, take: number }} it @param {number} x */
  reply: (you, it, x) =>
    `You ${moveText(you)}. The computer ${moveText(it, 'takes')}. ${x !== 0 ? `X = ${x} ≠ 0, so you can still win.` : 'X = 0, so with best play the computer wins from here.'}`,
  /** @param {{ pile: number, take: number }} you */
  youWin: (you) => `You ${moveText(you)}, and the computer has no move left. You win!`,
  /** @param {{ pile: number, take: number }} you @param {{ pile: number, take: number }} it */
  youLose: (you, it) =>
    `You ${moveText(you)}. The computer ${moveText(it, 'takes')} and you have no move left. The computer wins.`,
  /** @param {number} i @param {number[]} takes */
  illegal: (i, takes) =>
    takes.length
      ? `From pile ${i + 1} you may take ${takes.join(', ')} ${takes.length === 1 && takes[0] === 1 ? 'stone' : 'stones'}.`
      : `Pile ${i + 1} has no legal move.`,
  /** @param {number} max */
  takeError: (max) => `Take a whole number of stones from 1 to ${max}.`,
  over: 'The game is over. Restart it to play again.',

  takeaways: [
    'Under normal play, a position is losing (a P-position) when every move leads to a winning one, and winning (an N-position) when some move leads to a losing one. A position with no moves is losing.',
    'The Grundy number g(x) = mex{ g(y) : y reachable from x }, where mex is the smallest whole number missing from the set. g = 0 exactly at losing positions.',
    'Sprague–Grundy: a sum of independent games is worth the XOR of their Grundy numbers. The player to move wins exactly when X ≠ 0, by moving one pile from g(h) to g(h) xor X.',
    'In Nim g(h) = h, so the test is the XOR of the pile sizes. In “take 1, 3 or 4” the values repeat 0 1 0 1 2 3 2 with period 7.',
    'Try “Nim 1, 2, 3 (losing)”: you move first with X = 0, and whatever you do the computer restores X = 0 and wins.',
  ],
  complexityHead: ['Task', 'Cost', 'Why'],
  complexity: [
    [
      'Grundy numbers g(0) … g(N)',
      'O(N · |S|)',
      'Each size reads g(x − s) for every allowed take, then finds the mex in O(|S|).',
    ],
    ['Grundy numbers in Nim', 'O(N²) by the table, O(1) by g(h) = h', 'A pile of x has x moves.'],
    ['Who wins, k piles', 'O(k)', 'One XOR per pile once the g values are known.'],
    [
      'A winning move',
      'O(k · |S|)',
      'Try each allowed take on each pile and look for g = g(h) xor X.',
    ],
    ['Memory', 'O(N)', 'The table of g values.'],
  ],
  practiceTitle: 'Check yourself',
  /** @type {import('$lib/components/answer-check.js').Exercise[]} */
  practice: [
    {
      type: 'number',
      prompt: 'In Nim with piles 3, 4 and 5, what is X, the XOR of the pile sizes?',
      answer: 2,
      hints: ['In binary: 011, 100 and 101. XOR each column.'],
      solution: '011 xor 100 = 111, and 111 xor 101 = 010, so X = 2 and the player to move wins.',
    },
    {
      type: 'number',
      prompt:
        'Still in Nim 3, 4, 5: how many stones should you take from the pile of 3 to leave X = 0?',
      answer: 2,
      unit: 'stones',
      hints: ['Move the pile of 3 to 3 xor X stones.'],
      solution: '3 xor 2 = 1, so leave 1 stone: take 2. Then 1 xor 4 xor 5 = 0.',
    },
    {
      type: 'choice',
      prompt: 'Nim with piles 1, 2 and 3, and it is your move. What happens with best play?',
      options: [
        'You win, by taking the pile of 3',
        'You lose: X = 0, so every move gives your opponent a win',
        'You win, by taking 1 from the pile of 2',
        'The game is a draw',
      ],
      answer: 1,
      hints: ['Work out 1 xor 2 xor 3.'],
      solution:
        '1 xor 2 xor 3 = 0, a losing position for the mover. Nim has no draws: someone always takes the last stone.',
    },
    {
      type: 'number',
      prompt:
        'In the game where a move takes 1, 3 or 4 stones, what is g(5)? Use the example “Take 1, 3 or 4” to check.',
      answer: 3,
      hints: ['From 5 you reach 4, 2 and 1, with g values 2, 0 and 1.'],
      solution: 'seen = { 2, 0, 1 }, and the smallest whole number missing is 3, so g(5) = 3.',
    },
    {
      type: 'multi',
      prompt:
        'In the same “take 1, 3 or 4” game with one pile, which starting sizes lose for the player to move?',
      options: ['2', '3', '6', '7', '9'],
      answers: [0, 3, 4],
      hints: ['A single pile loses exactly when g(h) = 0. Step to the end of the example table.'],
      solution:
        'g runs 0 1 0 1 2 3 2 0 1 0 … for h = 0, 1, 2, …, so g = 0 at 2, 7 and 9, while g(3) = 1 and g(6) = 2.',
    },
  ],
  nextTeaser:
    'Next up: Practice: algebraic and randomised problems, where you turn a linear recurrence into its matrix and multiply big numbers digit by digit.',
};
