export const site = {
  title: 'AlgoAtlas',
  tagline: 'Learn data structures and algorithms by stepping through them',
  description:
    'AlgoAtlas is an interactive tour of data structures and algorithms. Every lesson runs the real algorithm on input you control — step forward, rewind, and watch the cost add up.',
};

export const hub = {
  topicsTitle: 'Topics',
  howTitle: 'How every lesson works',
  how: [
    { title: 'Run it', body: 'The real algorithm runs on your input and records every step.' },
    {
      title: 'Step it',
      body: 'Play, pause, rewind, or scrub — with the matching line of pseudocode lit up.',
    },
    {
      title: 'Change it',
      body: 'Edit the input and see how the number of steps grows or shrinks.',
    },
  ],
  startCta: 'Start with sorting',
  lessonCount: /** @param {number} n */ (n) => (n === 1 ? '1 lesson' : `${n} lessons`),
};

/** @type {Record<string, {title: string, blurb: string}>} */
export const topics = {
  sorting: {
    title: 'Sorting',
    blurb: 'Put things in order, and see why some ways cost far more comparisons than others.',
  },
  searching: {
    title: 'Searching',
    blurb: 'Find a value fast by throwing away half of the candidates at every step.',
  },
  structures: {
    title: 'Data structures',
    blurb: 'Store data so that adding, finding, and removing stay fast as it grows.',
  },
  graphs: {
    title: 'Graphs',
    blurb:
      'Explore grids with breadth-first, depth-first, and Dijkstra’s search to find paths and cheapest routes.',
  },
};

export const topicOrder = ['sorting', 'searching', 'structures', 'graphs'];

export const lessonChrome = {
  backToTopic: /** @param {string} title */ (title) => `All lessons in ${title}`,
  backToHub: 'All topics',
  pseudocodeTitle: 'Pseudocode',
  takeawaysTitle: 'Key takeaways',
  complexityTitle: 'Complexity',
  complexityNote:
    'O(…) says how the number of steps grows with the input size n; constants are dropped.',
  tryIt: 'Try it:',
  lessonNavLabel: 'Lesson navigation',
  previous: 'Previous lesson',
  next: 'Next lesson',
  complexityHead: ['Case', 'Cost', 'Why'],
  navLabel: 'Main navigation',
  skipLink: 'Skip to content',
};

export const controls = {
  groupLabel: 'Playback',
  first: 'First step',
  back: 'Previous step',
  play: 'Play',
  replay: 'Replay',
  pause: 'Pause',
  step: 'Next step',
  last: 'Last step',
  speed: 'Speed',
  scrub: 'Step',
  stepOf: /** @param {number} i @param {number} n */ (i, n) => `Step ${i} of ${n}`,
  stoppedAt: /** @param {number} i @param {number} n */ (i, n) =>
    i === n ? `Finished at step ${n} of ${n}.` : `Paused at step ${i} of ${n}.`,
  shortcuts:
    'Shortcuts: Left and Right arrows step; Space plays or pauses after you click inside the visualization. Speed 1× is one step per second.',
};
