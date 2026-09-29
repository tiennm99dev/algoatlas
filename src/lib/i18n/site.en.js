export const site = {
  title: 'AlgoAtlas',
  tagline: 'Learn data structures and algorithms by stepping through them',
  description:
    'AlgoAtlas is an interactive map of data structures and algorithms. Every lesson runs the real algorithm on input you control — step forward, rewind, predict the next move, and watch the cost add up.',
};

export const hub = {
  topicsTitle: 'Topics',
  howTitle: 'How every lesson works',
  how: [
    { title: 'Run it', body: 'The real algorithm runs on your input and records every step.' },
    { title: 'Step it', body: 'Play, pause, rewind, or scrub — with the matching line of pseudocode lit up.' },
    { title: 'Predict it', body: 'Quiz mode stops before key decisions and asks what happens next.' },
  ],
  lessonCount: /** @param {number} n */ (n) => (n === 1 ? '1 lesson' : `${n} lessons`),
};

export const status = {
  live: 'Open',
  comingSoon: 'Coming soon',
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
  graphs: {
    title: 'Graphs',
    blurb: 'Explore grids and networks layer by layer to find shortest paths.',
  },
};

export const topicOrder = ['sorting', 'searching', 'graphs'];

export const lessonChrome = {
  backToTopic: '← All lessons in this topic',
  backToHub: '← All topics',
  pseudocodeTitle: 'Pseudocode',
  takeawaysTitle: 'Key takeaways',
  complexityTitle: 'Complexity',
  complexityHead: ['Case', 'Time', 'Why'],
  navLabel: 'Main navigation',
};

export const controls = {
  groupLabel: 'Playback',
  first: 'First step',
  back: 'Previous step',
  play: 'Play',
  pause: 'Pause',
  step: 'Next step',
  last: 'Last step',
  speed: 'Speed',
  scrub: 'Step',
  stepOf: /** @param {number} i @param {number} n */ (i, n) => `Step ${i} of ${n}`,
  shortcuts: 'Shortcuts: ← → step, Space play/pause',
};
